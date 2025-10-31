/**
 * Error Recovery Manager
 * Implements retry mechanisms, circuit breaker patterns, and fallback handling
 */

import { MCPLogger } from '../../utils/mcp-error-handling';
import { CloudWatchMonitor } from '../cloudwatch-monitor';
import { XRayTracer } from '../xray-tracer';

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
  retryableErrors: string[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  monitoringPeriodMs: number;
  halfOpenMaxCalls: number;
  minimumThroughput: number;
}

export interface FallbackConfig<T> {
  enabled: boolean;
  fallbackFunction: () => Promise<T>;
  fallbackTimeout: number;
  cacheEnabled: boolean;
  cacheTtlMs: number;
}

export interface RecoveryMetrics {
  totalAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  circuitBreakerTrips: number;
  fallbackExecutions: number;
  averageRecoveryTime: number;
}

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerStatus {
  state: CircuitBreakerState;
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  halfOpenCallCount: number;
}

export class RetryHandler {
  private config: RetryConfig;
  private cloudWatchMonitor?: CloudWatchMonitor;
  private xrayTracer?: XRayTracer;

  constructor(
    config: RetryConfig,
    cloudWatchMonitor?: CloudWatchMonitor,
    xrayTracer?: XRayTracer
  ) {
    this.config = config;
    this.cloudWatchMonitor = cloudWatchMonitor;
    this.xrayTracer = xrayTracer;
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.config, ...customConfig };
    let lastError: Error;
    let attempt = 0;

    const startTime = Date.now();

    while (attempt < config.maxAttempts) {
      attempt++;

      try {
        const result = await this.executeWithTracing(operation, operationName, attempt);
        
        // Record successful retry if not first attempt
        if (attempt > 1) {
          await this.recordRetryMetrics(operationName, attempt, true, Date.now() - startTime);
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError, config)) {
          MCPLogger.warn(`Non-retryable error in ${operationName}`, undefined, {
            error: lastError.message,
            attempt
          });
          break;
        }

        // Don't delay after the last attempt
        if (attempt < config.maxAttempts) {
          const delay = this.calculateDelay(attempt, config);
          MCPLogger.info(`Retrying ${operationName} in ${delay}ms (attempt ${attempt}/${config.maxAttempts})`);
          await this.sleep(delay);
        }
      }
    }

    // Record failed retry
    await this.recordRetryMetrics(operationName, attempt, false, Date.now() - startTime);
    
    MCPLogger.error(`All retry attempts failed for ${operationName}`, lastError!, undefined, {
      totalAttempts: attempt,
      finalError: lastError!.message
    });

    throw lastError!;
  }

  /**
   * Execute operation with X-Ray tracing if available
   */
  private async executeWithTracing<T>(
    operation: () => Promise<T>,
    operationName: string,
    attempt: number
  ): Promise<T> {
    if (this.xrayTracer) {
      return await this.xrayTracer.traceOperation(
        `Retry-${operationName}`,
        operation,
        {
          service: 'ErrorRecovery',
          operation: 'retry',
          requestId: `retry-${operationName}-${attempt}-${Date.now()}`
        },
        { attempt, operationName }
      );
    }

    return await operation();
  }

  /**
   * Check if error is retryable based on configuration
   */
  private isRetryableError(error: Error, config: RetryConfig): boolean {
    // Check against configured retryable error patterns
    for (const pattern of config.retryableErrors) {
      if (error.message.includes(pattern) || error.name.includes(pattern)) {
        return true;
      }
    }

    // Default retryable conditions
    const retryablePatterns = [
      'timeout',
      'ETIMEDOUT',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'socket hang up',
      '503',
      '502',
      '504',
      'rate limit',
      'throttle'
    ];

    return retryablePatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, config.maxDelayMs);

    if (config.jitterEnabled) {
      // Add random jitter (±25%)
      const jitter = delay * 0.25 * (Math.random() * 2 - 1);
      delay += jitter;
    }

    return Math.max(delay, 0);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Record retry metrics
   */
  private async recordRetryMetrics(
    operationName: string,
    attempts: number,
    success: boolean,
    totalTime: number
  ): Promise<void> {
    if (!this.cloudWatchMonitor) {
      return;
    }

    await this.cloudWatchMonitor.publishMetrics([
      {
        metricName: 'RetryAttempts',
        namespace: 'NVIDIA/ErrorRecovery',
        value: attempts,
        unit: 'Count',
        dimensions: { Operation: operationName, Result: success ? 'Success' : 'Failed' }
      },
      {
        metricName: 'RetryDuration',
        namespace: 'NVIDIA/ErrorRecovery',
        value: totalTime,
        unit: 'Milliseconds',
        dimensions: { Operation: operationName }
      }
    ]);
  }
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private status: CircuitBreakerStatus;
  private cloudWatchMonitor?: CloudWatchMonitor;
  private xrayTracer?: XRayTracer;
  private serviceName: string;

  constructor(
    serviceName: string,
    config: CircuitBreakerConfig,
    cloudWatchMonitor?: CloudWatchMonitor,
    xrayTracer?: XRayTracer
  ) {
    this.serviceName = serviceName;
    this.config = config;
    this.cloudWatchMonitor = cloudWatchMonitor;
    this.xrayTracer = xrayTracer;
    
    this.status = {
      state: CircuitBreakerState.CLOSED,
      failureCount: 0,
      halfOpenCallCount: 0
    };
  }

  /**
   * Execute operation through circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check circuit breaker state
    if (this.status.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.status.state = CircuitBreakerState.HALF_OPEN;
        this.status.halfOpenCallCount = 0;
        MCPLogger.info(`Circuit breaker for ${this.serviceName} moved to HALF_OPEN`);
      } else {
        const error = new Error(`Circuit breaker is OPEN for service: ${this.serviceName}`);
        await this.recordCircuitBreakerMetrics('rejected');
        throw error;
      }
    }

    if (this.status.state === CircuitBreakerState.HALF_OPEN) {
      if (this.status.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
        const error = new Error(`Circuit breaker HALF_OPEN limit exceeded for service: ${this.serviceName}`);
        await this.recordCircuitBreakerMetrics('rejected');
        throw error;
      }
      this.status.halfOpenCallCount++;
    }

    const startTime = Date.now();

    try {
      const result = await this.executeWithTracing(operation);
      await this.onSuccess();
      return result;
    } catch (error) {
      await this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Execute operation with X-Ray tracing if available
   */
  private async executeWithTracing<T>(operation: () => Promise<T>): Promise<T> {
    if (this.xrayTracer) {
      return await this.xrayTracer.traceOperation(
        `CircuitBreaker-${this.serviceName}`,
        operation,
        {
          service: 'ErrorRecovery',
          operation: 'circuitBreaker',
          requestId: `cb-${this.serviceName}-${Date.now()}`
        },
        { 
          serviceName: this.serviceName,
          state: this.status.state,
          failureCount: this.status.failureCount
        }
      );
    }

    return await operation();
  }

  /**
   * Handle successful operation
   */
  private async onSuccess(): Promise<void> {
    if (this.status.state === CircuitBreakerState.HALF_OPEN) {
      this.status.state = CircuitBreakerState.CLOSED;
      this.status.failureCount = 0;
      this.status.halfOpenCallCount = 0;
      MCPLogger.info(`Circuit breaker for ${this.serviceName} reset to CLOSED`);
    } else if (this.status.state === CircuitBreakerState.CLOSED) {
      this.status.failureCount = Math.max(0, this.status.failureCount - 1);
    }

    await this.recordCircuitBreakerMetrics('success');
  }

  /**
   * Handle failed operation
   */
  private async onFailure(error: Error): Promise<void> {
    this.status.failureCount++;
    this.status.lastFailureTime = new Date();

    if (this.status.state === CircuitBreakerState.HALF_OPEN) {
      this.status.state = CircuitBreakerState.OPEN;
      this.status.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeoutMs);
      MCPLogger.warn(`Circuit breaker for ${this.serviceName} opened due to failure in HALF_OPEN state`);
    } else if (this.status.failureCount >= this.config.failureThreshold) {
      this.status.state = CircuitBreakerState.OPEN;
      this.status.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeoutMs);
      MCPLogger.warn(`Circuit breaker for ${this.serviceName} opened due to ${this.status.failureCount} failures`);
    }

    await this.recordCircuitBreakerMetrics('failure');
  }

  /**
   * Check if circuit breaker should attempt reset
   */
  private shouldAttemptReset(): boolean {
    return this.status.nextAttemptTime ? Date.now() >= this.status.nextAttemptTime.getTime() : false;
  }

  /**
   * Get current circuit breaker status
   */
  getStatus(): CircuitBreakerStatus {
    return { ...this.status };
  }

  /**
   * Force reset circuit breaker
   */
  reset(): void {
    this.status = {
      state: CircuitBreakerState.CLOSED,
      failureCount: 0,
      halfOpenCallCount: 0
    };
    MCPLogger.info(`Circuit breaker for ${this.serviceName} manually reset`);
  }

  /**
   * Record circuit breaker metrics
   */
  private async recordCircuitBreakerMetrics(result: 'success' | 'failure' | 'rejected'): Promise<void> {
    if (!this.cloudWatchMonitor) {
      return;
    }

    await this.cloudWatchMonitor.publishMetrics([
      {
        metricName: 'CircuitBreakerState',
        namespace: 'NVIDIA/ErrorRecovery',
        value: this.status.state === CircuitBreakerState.CLOSED ? 0 : 
               this.status.state === CircuitBreakerState.HALF_OPEN ? 1 : 2,
        unit: 'Count',
        dimensions: { Service: this.serviceName, State: this.status.state }
      },
      {
        metricName: 'CircuitBreakerCalls',
        namespace: 'NVIDIA/ErrorRecovery',
        value: 1,
        unit: 'Count',
        dimensions: { Service: this.serviceName, Result: result }
      },
      {
        metricName: 'CircuitBreakerFailureCount',
        namespace: 'NVIDIA/ErrorRecovery',
        value: this.status.failureCount,
        unit: 'Count',
        dimensions: { Service: this.serviceName }
      }
    ]);
  }
}

export class FallbackHandler<T> {
  private config: FallbackConfig<T>;
  private cache: Map<string, { value: T; timestamp: number }> = new Map();
  private cloudWatchMonitor?: CloudWatchMonitor;
  private xrayTracer?: XRayTracer;

  constructor(
    config: FallbackConfig<T>,
    cloudWatchMonitor?: CloudWatchMonitor,
    xrayTracer?: XRayTracer
  ) {
    this.config = config;
    this.cloudWatchMonitor = cloudWatchMonitor;
    this.xrayTracer = xrayTracer;
  }

  /**
   * Execute operation with fallback support
   */
  async executeWithFallback(
    operation: () => Promise<T>,
    operationName: string,
    cacheKey?: string
  ): Promise<T> {
    try {
      const result = await operation();
      
      // Cache successful result if caching is enabled
      if (this.config.cacheEnabled && cacheKey) {
        this.cache.set(cacheKey, {
          value: result,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      MCPLogger.warn(`Primary operation failed for ${operationName}, attempting fallback`, undefined, {
        error: (error as Error).message
      });

      return await this.executeFallback(operationName, cacheKey, error as Error);
    }
  }

  /**
   * Execute fallback strategy
   */
  private async executeFallback(operationName: string, cacheKey?: string, originalError?: Error): Promise<T> {
    // Try cache first if enabled and available
    if (this.config.cacheEnabled && cacheKey) {
      const cached = this.getCachedValue(cacheKey);
      if (cached) {
        MCPLogger.info(`Using cached fallback value for ${operationName}`);
        await this.recordFallbackMetrics(operationName, 'cache');
        return cached;
      }
    }

    // Execute fallback function if enabled
    if (this.config.enabled) {
      try {
        const result = await this.executeWithTracing(
          this.config.fallbackFunction,
          operationName
        );
        
        await this.recordFallbackMetrics(operationName, 'function');
        return result;
      } catch (fallbackError) {
        MCPLogger.error(`Fallback function failed for ${operationName}`, fallbackError as Error);
        await this.recordFallbackMetrics(operationName, 'failed');
      }
    }

    // If all fallback strategies fail, throw original error
    throw originalError || new Error(`All fallback strategies failed for ${operationName}`);
  }

  /**
   * Execute fallback with X-Ray tracing if available
   */
  private async executeWithTracing(
    fallbackFunction: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    if (this.xrayTracer) {
      return await this.xrayTracer.traceOperation(
        `Fallback-${operationName}`,
        fallbackFunction,
        {
          service: 'ErrorRecovery',
          operation: 'fallback',
          requestId: `fallback-${operationName}-${Date.now()}`
        }
      );
    }

    return await fallbackFunction();
  }

  /**
   * Get cached value if valid
   */
  private getCachedValue(cacheKey: string): T | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > this.config.cacheTtlMs;
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.value;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Record fallback metrics
   */
  private async recordFallbackMetrics(operationName: string, strategy: 'cache' | 'function' | 'failed'): Promise<void> {
    if (!this.cloudWatchMonitor) {
      return;
    }

    await this.cloudWatchMonitor.publishMetric({
      metricName: 'FallbackExecutions',
      namespace: 'NVIDIA/ErrorRecovery',
      value: 1,
      unit: 'Count',
      dimensions: { Operation: operationName, Strategy: strategy }
    });
  }
}

export class ErrorRecoveryManager {
  private retryHandlers: Map<string, RetryHandler> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private fallbackHandlers: Map<string, FallbackHandler<any>> = new Map();
  private cloudWatchMonitor?: CloudWatchMonitor;
  private xrayTracer?: XRayTracer;

  constructor(cloudWatchMonitor?: CloudWatchMonitor, xrayTracer?: XRayTracer) {
    this.cloudWatchMonitor = cloudWatchMonitor;
    this.xrayTracer = xrayTracer;
  }

  /**
   * Register retry handler for a service
   */
  registerRetryHandler(serviceName: string, config: RetryConfig): void {
    this.retryHandlers.set(serviceName, new RetryHandler(config, this.cloudWatchMonitor, this.xrayTracer));
    MCPLogger.info(`Registered retry handler for ${serviceName}`);
  }

  /**
   * Register circuit breaker for a service
   */
  registerCircuitBreaker(serviceName: string, config: CircuitBreakerConfig): void {
    this.circuitBreakers.set(serviceName, new CircuitBreaker(serviceName, config, this.cloudWatchMonitor, this.xrayTracer));
    MCPLogger.info(`Registered circuit breaker for ${serviceName}`);
  }

  /**
   * Register fallback handler for a service
   */
  registerFallbackHandler<T>(serviceName: string, config: FallbackConfig<T>): void {
    this.fallbackHandlers.set(serviceName, new FallbackHandler(config, this.cloudWatchMonitor, this.xrayTracer));
    MCPLogger.info(`Registered fallback handler for ${serviceName}`);
  }

  /**
   * Execute operation with full error recovery (retry + circuit breaker + fallback)
   */
  async executeWithRecovery<T>(
    serviceName: string,
    operation: () => Promise<T>,
    operationName: string,
    cacheKey?: string
  ): Promise<T> {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    const retryHandler = this.retryHandlers.get(serviceName);
    const fallbackHandler = this.fallbackHandlers.get(serviceName);

    // Wrap operation with circuit breaker if available
    const wrappedOperation = circuitBreaker 
      ? () => circuitBreaker.execute(operation)
      : operation;

    // Wrap with retry if available
    const retryOperation = retryHandler
      ? () => retryHandler.executeWithRetry(wrappedOperation, operationName)
      : wrappedOperation;

    // Execute with fallback if available
    if (fallbackHandler) {
      return await fallbackHandler.executeWithFallback(retryOperation, operationName, cacheKey);
    }

    return await retryOperation();
  }

  /**
   * Get recovery metrics for all services
   */
  getRecoveryMetrics(): Map<string, any> {
    const metrics = new Map();

    // Circuit breaker statuses
    for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
      metrics.set(`${serviceName}_circuit_breaker`, circuitBreaker.getStatus());
    }

    return metrics;
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
      circuitBreaker.reset();
      MCPLogger.info(`Reset circuit breaker for ${serviceName}`);
    }
  }

  /**
   * Clear all fallback caches
   */
  clearAllCaches(): void {
    for (const [serviceName, fallbackHandler] of this.fallbackHandlers) {
      fallbackHandler.clearCache();
      MCPLogger.info(`Cleared fallback cache for ${serviceName}`);
    }
  }

  /**
   * Setup default error recovery for NVIDIA NIM platform services
   */
  setupDefaultRecoveryStrategies(): void {
    // Default retry configuration
    const defaultRetryConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      jitterEnabled: true,
      retryableErrors: ['timeout', 'ETIMEDOUT', 'ECONNRESET', '503', '502', '504', 'rate limit']
    };

    // Default circuit breaker configuration
    const defaultCircuitBreakerConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      recoveryTimeoutMs: 60000,
      monitoringPeriodMs: 10000,
      halfOpenMaxCalls: 3,
      minimumThroughput: 10
    };

    // Setup for NIM service
    this.registerRetryHandler('nvidia-nim-service', defaultRetryConfig);
    this.registerCircuitBreaker('nvidia-nim-service', defaultCircuitBreakerConfig);

    // Setup for Bedrock agents
    this.registerRetryHandler('bedrock-agents', {
      ...defaultRetryConfig,
      maxAttempts: 2, // Lower retry count for agents
      baseDelayMs: 500
    });
    this.registerCircuitBreaker('bedrock-agents', {
      ...defaultCircuitBreakerConfig,
      failureThreshold: 3
    });

    // Setup for Lambda functions
    this.registerRetryHandler('lambda-functions', defaultRetryConfig);
    this.registerCircuitBreaker('lambda-functions', defaultCircuitBreakerConfig);

    MCPLogger.info('Default error recovery strategies configured');
  }
}