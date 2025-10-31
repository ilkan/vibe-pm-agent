/**
 * NVIDIA NIM Error Handling Utilities
 * 
 * Comprehensive error handling system for NVIDIA NIM integration,
 * agent communication, and deployment operations.
 */

import {
  NIMError,
  NIMErrorCode,
  AgentCommunicationError,
  NIMServiceError,
  DeploymentError,
  NIMServiceHealth,
  RetryPolicy
} from '../interfaces/nvidia-nim-core';

// ============================================================================
// Error Handler Class
// ============================================================================

/**
 * Centralized error handler for NVIDIA NIM operations
 */
export class NIMErrorHandler {
  private static retryPolicies: Map<string, RetryPolicy> = new Map();
  private static errorMetrics: Map<NIMErrorCode, number> = new Map();

  /**
   * Create a standardized NIM error
   */
  static createError(
    code: NIMErrorCode,
    message: string,
    context?: any,
    retryable: boolean = false
  ): NIMError {
    this.incrementErrorMetric(code);
    return new NIMError(message, code, context, retryable);
  }

  /**
   * Create an agent communication error
   */
  static createAgentError(
    message: string,
    agentId: string,
    messageId?: string,
    context?: any
  ): AgentCommunicationError {
    this.incrementErrorMetric(NIMErrorCode.MESSAGE_ROUTING_FAILED);
    return new AgentCommunicationError(message, agentId, messageId, context);
  }

  /**
   * Create a NIM service error
   */
  static createServiceError(
    message: string,
    code: NIMErrorCode,
    serviceEndpoint: string,
    context?: any
  ): NIMServiceError {
    this.incrementErrorMetric(code);
    return new NIMServiceError(message, code, serviceEndpoint, context);
  }

  /**
   * Create a deployment error
   */
  static createDeploymentError(
    message: string,
    platform: string,
    region: string,
    context?: any
  ): DeploymentError {
    this.incrementErrorMetric(NIMErrorCode.DEPLOYMENT_FAILED);
    return new DeploymentError(message, platform, region, context);
  }

  /**
   * Handle errors with retry logic
   */
  static async handleWithRetry<T>(
    operation: () => Promise<T>,
    retryPolicy: RetryPolicy,
    context?: any
  ): Promise<T> {
    let lastError: Error;
    let attempt = 0;

    while (attempt <= retryPolicy.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Check if error is retryable
        if (!this.isRetryableError(error as Error, retryPolicy)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt > retryPolicy.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryPolicy.initialDelay * Math.pow(retryPolicy.backoffMultiplier, attempt - 1),
          retryPolicy.maxDelay
        );

        console.warn(`Retrying operation after ${delay}ms (attempt ${attempt}/${retryPolicy.maxRetries})`, {
          error: error instanceof Error ? error.message : String(error),
          context
        });

        await this.sleep(delay);
      }
    }

    throw this.createError(
      NIMErrorCode.UNKNOWN_ERROR,
      `Operation failed after ${retryPolicy.maxRetries} retries: ${lastError.message}`,
      { originalError: lastError, context },
      false
    );
  }

  /**
   * Check if an error is retryable based on policy
   */
  private static isRetryableError(error: Error, retryPolicy: RetryPolicy): boolean {
    if (error instanceof NIMError) {
      return error.retryable && retryPolicy.retryableErrors.includes(error.code);
    }

    // Check error message for retryable patterns
    const errorMessage = error.message.toLowerCase();
    return retryPolicy.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Increment error metrics
   */
  private static incrementErrorMetric(code: NIMErrorCode): void {
    const current = this.errorMetrics.get(code) || 0;
    this.errorMetrics.set(code, current + 1);
  }

  /**
   * Get error metrics
   */
  static getErrorMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    this.errorMetrics.forEach((count, code) => {
      metrics[code] = count;
    });
    return metrics;
  }

  /**
   * Reset error metrics
   */
  static resetErrorMetrics(): void {
    this.errorMetrics.clear();
  }

  /**
   * Register retry policy for a service
   */
  static registerRetryPolicy(serviceName: string, policy: RetryPolicy): void {
    this.retryPolicies.set(serviceName, policy);
  }

  /**
   * Get retry policy for a service
   */
  static getRetryPolicy(serviceName: string): RetryPolicy | undefined {
    return this.retryPolicies.get(serviceName);
  }
}

// ============================================================================
// Error Recovery Strategies
// ============================================================================

/**
 * Error recovery strategy interface
 */
export interface ErrorRecoveryStrategy {
  canRecover(error: Error): boolean;
  recover(error: Error, context?: any): Promise<any>;
}

/**
 * Circuit breaker for service resilience
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000, // 1 minute
    private readonly successThreshold: number = 3
  ) {}

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw NIMErrorHandler.createError(
          NIMErrorCode.SERVICE_UNAVAILABLE,
          'Circuit breaker is OPEN - service unavailable',
          { state: this.state, failures: this.failures }
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  /**
   * Get circuit breaker status
   */
  getStatus(): {
    state: string;
    failures: number;
    lastFailureTime: number;
  } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

/**
 * Service health monitor
 */
export class ServiceHealthMonitor {
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();
  private healthStatus: Map<string, NIMServiceHealth> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Register a health check for a service
   */
  registerHealthCheck(serviceName: string, healthCheck: () => Promise<boolean>): void {
    this.healthChecks.set(serviceName, healthCheck);
  }

  /**
   * Start monitoring services
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.checkAllServices();
    }, intervalMs);

    // Initial check
    this.checkAllServices();
  }

  /**
   * Stop monitoring services
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Check health of all registered services
   */
  private async checkAllServices(): Promise<void> {
    const promises = Array.from(this.healthChecks.entries()).map(async ([serviceName, healthCheck]) => {
      try {
        const startTime = Date.now();
        const isHealthy = await healthCheck();
        const responseTime = Date.now() - startTime;

        this.updateHealthStatus(serviceName, {
          status: isHealthy ? 'healthy' : 'unhealthy',
          chatService: {
            available: isHealthy,
            responseTime,
            errorRate: 0
          },
          embeddingService: {
            available: isHealthy,
            responseTime,
            errorRate: 0
          },
          lastChecked: new Date(),
          uptime: Date.now(),
          version: '1.0.0'
        });
      } catch (error) {
        this.updateHealthStatus(serviceName, {
          status: 'unhealthy',
          chatService: {
            available: false,
            responseTime: 0,
            errorRate: 1,
            lastError: error instanceof Error ? error.message : String(error)
          },
          embeddingService: {
            available: false,
            responseTime: 0,
            errorRate: 1,
            lastError: error instanceof Error ? error.message : String(error)
          },
          lastChecked: new Date(),
          uptime: Date.now(),
          version: '1.0.0'
        });
      }
    });

    await Promise.all(promises);
  }

  /**
   * Update health status for a service
   */
  private updateHealthStatus(serviceName: string, health: NIMServiceHealth): void {
    this.healthStatus.set(serviceName, health);
  }

  /**
   * Get health status for a service
   */
  getHealthStatus(serviceName: string): NIMServiceHealth | undefined {
    return this.healthStatus.get(serviceName);
  }

  /**
   * Get health status for all services
   */
  getAllHealthStatus(): Record<string, NIMServiceHealth> {
    const status: Record<string, NIMServiceHealth> = {};
    this.healthStatus.forEach((health, serviceName) => {
      status[serviceName] = health;
    });
    return status;
  }
}

// ============================================================================
// Error Recovery Implementations
// ============================================================================

/**
 * NIM service recovery strategy
 */
export class NIMServiceRecovery implements ErrorRecoveryStrategy {
  constructor(private readonly circuitBreaker: CircuitBreaker) {}

  canRecover(error: Error): boolean {
    if (error instanceof NIMServiceError) {
      return [
        NIMErrorCode.SERVICE_UNAVAILABLE,
        NIMErrorCode.TIMEOUT,
        NIMErrorCode.RATE_LIMIT_EXCEEDED
      ].includes(error.code);
    }
    return false;
  }

  async recover(error: Error, context?: any): Promise<any> {
    if (error instanceof NIMServiceError) {
      switch (error.code) {
        case NIMErrorCode.SERVICE_UNAVAILABLE:
          // Wait and retry with circuit breaker
          await this.sleep(5000);
          return this.circuitBreaker.execute(async () => {
            // Retry the original operation
            throw new Error('Retry operation not implemented');
          });

        case NIMErrorCode.RATE_LIMIT_EXCEEDED:
          // Exponential backoff for rate limiting
          const delay = Math.min(1000 * Math.pow(2, context?.retryCount || 0), 30000);
          await this.sleep(delay);
          return null; // Signal to retry

        case NIMErrorCode.TIMEOUT:
          // Increase timeout and retry
          if (context?.timeoutMs) {
            context.timeoutMs = Math.min(context.timeoutMs * 1.5, 60000);
          }
          return null; // Signal to retry

        default:
          throw error;
      }
    }
    throw error;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Agent communication recovery strategy
 */
export class AgentCommunicationRecovery implements ErrorRecoveryStrategy {
  canRecover(error: Error): boolean {
    return error instanceof AgentCommunicationError;
  }

  async recover(error: Error, context?: any): Promise<any> {
    if (error instanceof AgentCommunicationError) {
      // Try to re-establish communication with the agent
      console.warn(`Attempting to recover communication with agent ${error.agentId}`);
      
      // Implement agent reconnection logic here
      // This could involve:
      // 1. Checking agent health
      // 2. Re-registering capabilities
      // 3. Resending failed messages
      
      return null; // Signal successful recovery
    }
    throw error;
  }
}

// ============================================================================
// Error Logging and Monitoring
// ============================================================================

/**
 * Error logger for NIM operations
 */
export class NIMErrorLogger {
  private static logs: Array<{
    timestamp: Date;
    error: Error;
    context?: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> = [];

  /**
   * Log an error with context
   */
  static logError(
    error: Error,
    context?: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    this.logs.push({
      timestamp: new Date(),
      error,
      context,
      severity
    });

    // Console logging based on severity
    const logMessage = `[${severity.toUpperCase()}] ${error.message}`;
    const logContext = { error: error.name, context };

    switch (severity) {
      case 'critical':
        console.error(logMessage, logContext);
        break;
      case 'high':
        console.error(logMessage, logContext);
        break;
      case 'medium':
        console.warn(logMessage, logContext);
        break;
      case 'low':
        console.info(logMessage, logContext);
        break;
    }

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  /**
   * Get error logs
   */
  static getLogs(severity?: 'low' | 'medium' | 'high' | 'critical'): Array<{
    timestamp: Date;
    error: Error;
    context?: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> {
    if (severity) {
      return this.logs.filter(log => log.severity === severity);
    }
    return [...this.logs];
  }

  /**
   * Clear error logs
   */
  static clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get error summary
   */
  static getErrorSummary(): {
    total: number;
    bySeverity: Record<string, number>;
    byErrorType: Record<string, number>;
    recent: number; // Last hour
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const summary = {
      total: this.logs.length,
      bySeverity: {} as Record<string, number>,
      byErrorType: {} as Record<string, number>,
      recent: 0
    };

    this.logs.forEach(log => {
      // Count by severity
      summary.bySeverity[log.severity] = (summary.bySeverity[log.severity] || 0) + 1;
      
      // Count by error type
      const errorType = log.error.constructor.name;
      summary.byErrorType[errorType] = (summary.byErrorType[errorType] || 0) + 1;
      
      // Count recent errors
      if (log.timestamp > oneHourAgo) {
        summary.recent++;
      }
    });

    return summary;
  }
}

// ============================================================================
// Exports
// ============================================================================

export {
  NIMError,
  NIMErrorCode,
  AgentCommunicationError,
  NIMServiceError,
  DeploymentError
} from '../interfaces/nvidia-nim-core';

export const NIMErrorUtils = {
  createError: NIMErrorHandler.createError.bind(NIMErrorHandler),
  createAgentError: NIMErrorHandler.createAgentError.bind(NIMErrorHandler),
  createServiceError: NIMErrorHandler.createServiceError.bind(NIMErrorHandler),
  createDeploymentError: NIMErrorHandler.createDeploymentError.bind(NIMErrorHandler),
  handleWithRetry: NIMErrorHandler.handleWithRetry.bind(NIMErrorHandler),
  getErrorMetrics: NIMErrorHandler.getErrorMetrics.bind(NIMErrorHandler),
  resetErrorMetrics: NIMErrorHandler.resetErrorMetrics.bind(NIMErrorHandler)
};