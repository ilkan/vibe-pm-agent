/**
 * Monitoring Orchestrator
 * Integrates CloudWatch monitoring, X-Ray tracing, health checks, and error recovery
 */

import { CloudWatchMonitor } from '../cloudwatch-monitor';
import { XRayTracer } from '../xray-tracer';
import { HealthMonitor } from '../health-monitor';
import { ErrorRecoveryManager } from '../error-recovery-manager';
import { MonitoringConfig } from '../../interfaces/nvidia-nim-core';
import { MCPLogger } from '../../utils/mcp-error-handling';

export interface MonitoringOrchestratorConfig {
  monitoring: MonitoringConfig;
  region: string;
  enableHealthChecks: boolean;
  enableErrorRecovery: boolean;
  alertSnsTopicArn?: string;
}

export interface SystemMetrics {
  timestamp: Date;
  services: {
    name: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    latency: number;
    errorRate: number;
    circuitBreakerState?: string;
  }[];
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  activeAlerts: number;
  totalRequests: number;
  errorCount: number;
  averageLatency: number;
}

export class MonitoringOrchestrator {
  private cloudWatchMonitor: CloudWatchMonitor;
  private xrayTracer: XRayTracer;
  private healthMonitor: HealthMonitor;
  private errorRecoveryManager: ErrorRecoveryManager;
  private config: MonitoringOrchestratorConfig;
  private metricsCollectionInterval?: NodeJS.Timeout;

  constructor(config: MonitoringOrchestratorConfig) {
    this.config = config;
    
    // Initialize monitoring components
    this.cloudWatchMonitor = new CloudWatchMonitor(config.monitoring, config.region);
    this.xrayTracer = new XRayTracer('nvidia-nim-platform', config.monitoring.xrayTracingEnabled);
    this.healthMonitor = new HealthMonitor(this.cloudWatchMonitor, this.xrayTracer, config.region);
    this.errorRecoveryManager = new ErrorRecoveryManager(this.cloudWatchMonitor, this.xrayTracer);

    MCPLogger.info('Monitoring orchestrator initialized', undefined, {
      region: config.region,
      cloudWatchEnabled: config.monitoring.cloudWatchEnabled,
      xrayEnabled: config.monitoring.xrayTracingEnabled,
      healthChecksEnabled: config.enableHealthChecks,
      errorRecoveryEnabled: config.enableErrorRecovery
    });
  }

  /**
   * Initialize all monitoring components
   */
  async initialize(): Promise<void> {
    try {
      // Setup health checks if enabled
      if (this.config.enableHealthChecks) {
        this.healthMonitor.setupDefaultHealthChecks();
        await this.healthMonitor.setupDefaultAlarms();
        MCPLogger.info('Health monitoring initialized');
      }

      // Setup error recovery if enabled
      if (this.config.enableErrorRecovery) {
        this.errorRecoveryManager.setupDefaultRecoveryStrategies();
        MCPLogger.info('Error recovery strategies initialized');
      }

      // Start metrics collection
      this.startMetricsCollection();

      MCPLogger.info('Monitoring orchestrator fully initialized');
    } catch (error) {
      MCPLogger.error('Failed to initialize monitoring orchestrator', error as Error);
      throw error;
    }
  }

  /**
   * Execute operation with full monitoring and error recovery
   */
  async executeMonitoredOperation<T>(
    serviceName: string,
    operationName: string,
    operation: () => Promise<T>,
    options?: {
      enableRetry?: boolean;
      enableCircuitBreaker?: boolean;
      enableFallback?: boolean;
      cacheKey?: string;
      customMetrics?: Record<string, number>;
    }
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;
    let result: T;
    let error: Error | undefined;

    try {
      // Execute with error recovery if enabled
      if (this.config.enableErrorRecovery && (options?.enableRetry || options?.enableCircuitBreaker || options?.enableFallback)) {
        result = await this.errorRecoveryManager.executeWithRecovery(
          serviceName,
          operation,
          operationName,
          options.cacheKey
        );
      } else {
        // Execute with X-Ray tracing
        result = await this.xrayTracer.traceOperation(
          `${serviceName}-${operationName}`,
          operation,
          {
            service: serviceName,
            operation: operationName,
            requestId: `${serviceName}-${operationName}-${Date.now()}`
          }
        );
      }

      success = true;
      return result;
    } catch (err) {
      error = err as Error;
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;

      // Record operation metrics
      await this.recordOperationMetrics(serviceName, operationName, duration, success, error, options?.customMetrics);
    }
  }

  /**
   * Record comprehensive operation metrics
   */
  private async recordOperationMetrics(
    serviceName: string,
    operationName: string,
    duration: number,
    success: boolean,
    error?: Error,
    customMetrics?: Record<string, number>
  ): Promise<void> {
    try {
      const metrics = [
        {
          metricName: 'OperationDuration',
          namespace: 'NVIDIA/Operations',
          value: duration,
          unit: 'Milliseconds' as const,
          dimensions: { Service: serviceName, Operation: operationName }
        },
        {
          metricName: 'OperationCount',
          namespace: 'NVIDIA/Operations',
          value: 1,
          unit: 'Count' as const,
          dimensions: { Service: serviceName, Operation: operationName, Status: success ? 'Success' : 'Error' }
        }
      ];

      if (!success && error) {
        metrics.push({
          metricName: 'ErrorCount',
          namespace: 'NVIDIA/Operations',
          value: 1,
          unit: 'Count' as const,
          dimensions: { Service: serviceName, Operation: operationName, Status: 'Error' }
        });
      }

      // Add custom metrics if provided
      if (customMetrics) {
        for (const [metricName, value] of Object.entries(customMetrics)) {
          metrics.push({
            metricName,
            namespace: 'NVIDIA/Custom',
            value,
            unit: 'Count' as const,
            dimensions: { Service: serviceName, Operation: operationName, Status: 'Custom' }
          });
        }
      }

      await this.cloudWatchMonitor.publishMetrics(metrics);
    } catch (metricsError) {
      MCPLogger.error('Failed to record operation metrics', metricsError as Error, undefined, {
        serviceName,
        operationName
      });
    }
  }

  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const serviceStatuses = this.healthMonitor.getServiceStatuses();
    const systemHealth = this.healthMonitor.getSystemHealth();
    const recoveryMetrics = this.errorRecoveryManager.getRecoveryMetrics();

    const services = serviceStatuses.map(status => ({
      name: status.name,
      status: status.status === 'unknown' ? 'unhealthy' : status.status,
      latency: status.averageLatency,
      errorRate: status.errorRate,
      circuitBreakerState: recoveryMetrics.get(`${status.name}_circuit_breaker`)?.state
    }));

    // Calculate aggregate metrics
    const totalRequests = services.reduce((sum, service) => sum + (service.latency > 0 ? 1 : 0), 0);
    const errorCount = services.filter(service => service.status === 'unhealthy').length;
    const averageLatency = services.length > 0 
      ? services.reduce((sum, service) => sum + service.latency, 0) / services.length 
      : 0;

    return {
      timestamp: new Date(),
      services,
      overallHealth: systemHealth.status,
      activeAlerts: systemHealth.criticalIssues.length,
      totalRequests,
      errorCount,
      averageLatency
    };
  }

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
    }

    this.metricsCollectionInterval = setInterval(async () => {
      try {
        const systemMetrics = await this.getSystemMetrics();
        
        // Publish system-level metrics
        await this.cloudWatchMonitor.publishMetrics([
          {
            metricName: 'SystemHealth',
            namespace: 'NVIDIA/System',
            value: systemMetrics.overallHealth === 'healthy' ? 1 : 0,
            unit: 'Count',
            dimensions: { Status: systemMetrics.overallHealth }
          },
          {
            metricName: 'ActiveAlerts',
            namespace: 'NVIDIA/System',
            value: systemMetrics.activeAlerts,
            unit: 'Count'
          },
          {
            metricName: 'AverageSystemLatency',
            namespace: 'NVIDIA/System',
            value: systemMetrics.averageLatency,
            unit: 'Milliseconds'
          }
        ]);

        MCPLogger.debug('System metrics collected and published', undefined, {
          overallHealth: systemMetrics.overallHealth,
          activeAlerts: systemMetrics.activeAlerts,
          serviceCount: systemMetrics.services.length
        });
      } catch (error) {
        MCPLogger.error('Failed to collect system metrics', error as Error);
      }
    }, 60000); // Collect every minute
  }

  /**
   * Perform comprehensive health check
   */
  async performSystemHealthCheck(): Promise<{
    healthy: boolean;
    details: Record<string, any>;
    recommendations: string[];
  }> {
    const systemMetrics = await this.getSystemMetrics();
    const recommendations: string[] = [];
    let healthy = true;

    // Check overall system health
    if (systemMetrics.overallHealth !== 'healthy') {
      healthy = false;
      recommendations.push(`System health is ${systemMetrics.overallHealth}. Check individual service statuses.`);
    }

    // Check for high error rates
    const highErrorServices = systemMetrics.services.filter(s => s.errorRate > 0.05); // 5% error rate
    if (highErrorServices.length > 0) {
      healthy = false;
      recommendations.push(`High error rates detected in: ${highErrorServices.map(s => s.name).join(', ')}`);
    }

    // Check for high latency
    const highLatencyServices = systemMetrics.services.filter(s => s.latency > 5000); // 5 seconds
    if (highLatencyServices.length > 0) {
      recommendations.push(`High latency detected in: ${highLatencyServices.map(s => s.name).join(', ')}`);
    }

    // Check circuit breaker states
    const openCircuitBreakers = systemMetrics.services.filter(s => s.circuitBreakerState === 'OPEN');
    if (openCircuitBreakers.length > 0) {
      healthy = false;
      recommendations.push(`Circuit breakers are open for: ${openCircuitBreakers.map(s => s.name).join(', ')}`);
    }

    return {
      healthy,
      details: {
        systemMetrics,
        timestamp: new Date().toISOString()
      },
      recommendations
    };
  }

  /**
   * Reset all monitoring components
   */
  async reset(): Promise<void> {
    try {
      // Reset circuit breakers
      this.errorRecoveryManager.resetAllCircuitBreakers();
      
      // Clear fallback caches
      this.errorRecoveryManager.clearAllCaches();
      
      MCPLogger.info('Monitoring orchestrator reset completed');
    } catch (error) {
      MCPLogger.error('Failed to reset monitoring orchestrator', error as Error);
      throw error;
    }
  }

  /**
   * Shutdown monitoring orchestrator
   */
  async shutdown(): Promise<void> {
    try {
      // Stop metrics collection
      if (this.metricsCollectionInterval) {
        clearInterval(this.metricsCollectionInterval);
      }

      // Cleanup health monitor
      this.healthMonitor.cleanup();

      MCPLogger.info('Monitoring orchestrator shutdown completed');
    } catch (error) {
      MCPLogger.error('Failed to shutdown monitoring orchestrator', error as Error);
      throw error;
    }
  }

  /**
   * Get monitoring configuration
   */
  getConfig(): MonitoringOrchestratorConfig {
    return { ...this.config };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringOrchestratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update component configurations
    if (newConfig.monitoring) {
      this.cloudWatchMonitor.updateConfig(newConfig.monitoring);
    }

    MCPLogger.info('Monitoring orchestrator configuration updated');
  }

  /**
   * Get individual monitoring components for advanced usage
   */
  getComponents() {
    return {
      cloudWatchMonitor: this.cloudWatchMonitor,
      xrayTracer: this.xrayTracer,
      healthMonitor: this.healthMonitor,
      errorRecoveryManager: this.errorRecoveryManager
    };
  }
}