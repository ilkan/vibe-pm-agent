/**
 * Health Monitoring and Alerting System
 * Provides automated health checks, alerting, and service status monitoring
 */

import { CloudWatchClient, PutMetricAlarmCommand, PutMetricAlarmCommandInput } from '@aws-sdk/client-cloudwatch';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { CloudWatchMonitor, HealthCheckResult } from '../cloudwatch-monitor';
import { XRayTracer } from '../xray-tracer';
import { MCPLogger } from '../../utils/mcp-error-handling';

export interface ServiceEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout: number;
  expectedStatusCode: number;
  healthyThreshold: number;
  unhealthyThreshold: number;
}

export interface HealthCheckConfig {
  interval: number; // milliseconds
  timeout: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

export interface AlertRule {
  name: string;
  condition: 'threshold' | 'anomaly' | 'composite';
  metric: string;
  namespace: string;
  threshold?: number;
  comparisonOperator?: 'GreaterThanThreshold' | 'LessThanThreshold' | 'GreaterThanOrEqualToThreshold' | 'LessThanOrEqualToThreshold';
  evaluationPeriods: number;
  period: number;
  statistic: 'Average' | 'Sum' | 'Maximum' | 'Minimum' | 'SampleCount';
  treatMissingData: 'breaching' | 'notBreaching' | 'ignore' | 'missing';
  snsTopicArn?: string;
  enabled: boolean;
}

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  lastCheck: Date;
  consecutiveFailures: number;
  averageLatency: number;
  errorRate: number;
  details: Record<string, any>;
}

export class HealthMonitor {
  private cloudWatchClient: CloudWatchClient;
  private snsClient: SNSClient;
  private cloudWatchMonitor: CloudWatchMonitor;
  private xrayTracer: XRayTracer;
  private serviceStatuses: Map<string, ServiceStatus> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private alertRules: AlertRule[] = [];

  constructor(
    cloudWatchMonitor: CloudWatchMonitor,
    xrayTracer: XRayTracer,
    region: string = 'us-east-1'
  ) {
    this.cloudWatchClient = new CloudWatchClient({ region });
    this.snsClient = new SNSClient({ region });
    this.cloudWatchMonitor = cloudWatchMonitor;
    this.xrayTracer = xrayTracer;
  }

  /**
   * Register a service endpoint for health monitoring
   */
  registerService(endpoint: ServiceEndpoint, config: HealthCheckConfig): void {
    MCPLogger.info(`Registering health check for service: ${endpoint.name}`);

    // Initialize service status
    this.serviceStatuses.set(endpoint.name, {
      name: endpoint.name,
      status: 'unknown',
      lastCheck: new Date(),
      consecutiveFailures: 0,
      averageLatency: 0,
      errorRate: 0,
      details: {}
    });

    // Start periodic health checks
    const intervalId = setInterval(async () => {
      await this.performHealthCheck(endpoint, config);
    }, config.interval);

    this.healthCheckIntervals.set(endpoint.name, intervalId);

    // Perform initial health check
    this.performHealthCheck(endpoint, config);
  }

  /**
   * Unregister a service from health monitoring
   */
  unregisterService(serviceName: string): void {
    MCPLogger.info(`Unregistering health check for service: ${serviceName}`);

    const intervalId = this.healthCheckIntervals.get(serviceName);
    if (intervalId) {
      clearInterval(intervalId);
      this.healthCheckIntervals.delete(serviceName);
    }

    this.serviceStatuses.delete(serviceName);
  }

  /**
   * Perform health check for a specific service
   */
  private async performHealthCheck(endpoint: ServiceEndpoint, config: HealthCheckConfig): Promise<void> {
    const serviceName = endpoint.name;
    const currentStatus = this.serviceStatuses.get(serviceName);
    
    if (!currentStatus) {
      return;
    }

    try {
      const result = await this.xrayTracer.traceOperation(
        `HealthCheck-${serviceName}`,
        async () => await this.executeHealthCheck(endpoint, config),
        {
          service: 'HealthMonitor',
          operation: 'healthCheck',
          requestId: `health-${serviceName}-${Date.now()}`
        }
      );

      await this.updateServiceStatus(serviceName, result);
    } catch (error) {
      MCPLogger.error(`Health check failed for ${serviceName}`, error as Error);
      
      const failedResult: HealthCheckResult = {
        service: serviceName,
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date()
      };

      await this.updateServiceStatus(serviceName, failedResult);
    }
  }

  /**
   * Execute the actual health check HTTP request
   */
  private async executeHealthCheck(endpoint: ServiceEndpoint, config: HealthCheckConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < config.retryAttempts) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: endpoint.headers,
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const latency = Date.now() - startTime;

        const isHealthy = response.status === endpoint.expectedStatusCode;
        
        return {
          service: endpoint.name,
          status: isHealthy ? 'healthy' : 'degraded',
          latency,
          details: {
            statusCode: response.status,
            responseTime: latency,
            attempt: attempt + 1
          },
          timestamp: new Date()
        };

      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt < config.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, config.retryDelay));
        }
      }
    }

    const latency = Date.now() - startTime;
    
    return {
      service: endpoint.name,
      status: 'unhealthy',
      latency,
      details: {
        error: lastError?.message || 'Unknown error',
        attempts: config.retryAttempts,
        totalTime: latency
      },
      timestamp: new Date()
    };
  }

  /**
   * Update service status and publish metrics
   */
  private async updateServiceStatus(serviceName: string, result: HealthCheckResult): Promise<void> {
    const currentStatus = this.serviceStatuses.get(serviceName);
    if (!currentStatus) {
      return;
    }

    // Update consecutive failures
    if (result.status === 'unhealthy') {
      currentStatus.consecutiveFailures++;
    } else {
      currentStatus.consecutiveFailures = 0;
    }

    // Update average latency (simple moving average)
    if (result.latency !== undefined) {
      currentStatus.averageLatency = (currentStatus.averageLatency + result.latency) / 2;
    }

    // Update status
    currentStatus.status = result.status;
    currentStatus.lastCheck = result.timestamp;
    currentStatus.details = result.details || {};

    // Publish metrics to CloudWatch
    await this.cloudWatchMonitor.publishMetrics([
      {
        metricName: 'ServiceHealth',
        namespace: 'NVIDIA/HealthChecks',
        value: result.status === 'healthy' ? 1 : 0,
        unit: 'Count',
        dimensions: { Service: serviceName, Status: result.status }
      },
      {
        metricName: 'HealthCheckLatency',
        namespace: 'NVIDIA/HealthChecks',
        value: result.latency || 0,
        unit: 'Milliseconds',
        dimensions: { Service: serviceName }
      },
      {
        metricName: 'ConsecutiveFailures',
        namespace: 'NVIDIA/HealthChecks',
        value: currentStatus.consecutiveFailures,
        unit: 'Count',
        dimensions: { Service: serviceName }
      }
    ]);

    // Check if we need to send alerts
    await this.checkAlertConditions(serviceName, currentStatus);

    MCPLogger.debug(`Updated status for ${serviceName}: ${result.status}`, undefined, {
      latency: result.latency,
      consecutiveFailures: currentStatus.consecutiveFailures
    });
  }

  /**
   * Check alert conditions and send notifications
   */
  private async checkAlertConditions(serviceName: string, status: ServiceStatus): Promise<void> {
    // Check for service down alert
    if (status.consecutiveFailures >= 3 && status.status === 'unhealthy') {
      await this.sendAlert(
        'ServiceDown',
        `Service ${serviceName} is unhealthy after ${status.consecutiveFailures} consecutive failures`,
        'HIGH',
        { service: serviceName, status: status.status, failures: status.consecutiveFailures }
      );
    }

    // Check for high latency alert
    if (status.averageLatency > 5000) { // 5 seconds
      await this.sendAlert(
        'HighLatency',
        `Service ${serviceName} has high average latency: ${status.averageLatency}ms`,
        'MEDIUM',
        { service: serviceName, latency: status.averageLatency }
      );
    }

    // Check for service recovery
    if (status.consecutiveFailures === 0 && status.status === 'healthy') {
      await this.sendAlert(
        'ServiceRecovered',
        `Service ${serviceName} has recovered and is now healthy`,
        'LOW',
        { service: serviceName, status: status.status }
      );
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlert(
    alertType: string,
    message: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      const alertMessage = {
        alertType,
        severity,
        message,
        timestamp: new Date().toISOString(),
        metadata
      };

      // Log alert
      MCPLogger.warn(`ALERT [${severity}]: ${message}`, undefined, metadata);

      // Publish alert metric
      await this.cloudWatchMonitor.publishMetric({
        metricName: 'AlertsGenerated',
        namespace: 'NVIDIA/Alerts',
        value: 1,
        unit: 'Count',
        dimensions: { AlertType: alertType, Severity: severity }
      });

      // Send SNS notification if configured
      const snsTopicArn = process.env.ALERT_SNS_TOPIC_ARN;
      if (snsTopicArn) {
        await this.snsClient.send(new PublishCommand({
          TopicArn: snsTopicArn,
          Subject: `NVIDIA NIM Platform Alert: ${alertType}`,
          Message: JSON.stringify(alertMessage, null, 2)
        }));
      }

    } catch (error) {
      MCPLogger.error('Failed to send alert', error as Error, undefined, { alertType, severity });
    }
  }

  /**
   * Create CloudWatch alarm
   */
  async createAlarm(rule: AlertRule): Promise<void> {
    if (!rule.enabled) {
      return;
    }

    try {
      const alarmParams: PutMetricAlarmCommandInput = {
        AlarmName: rule.name,
        AlarmDescription: `Automated alarm for ${rule.metric} in ${rule.namespace}`,
        MetricName: rule.metric,
        Namespace: rule.namespace,
        Statistic: rule.statistic,
        Period: rule.period,
        EvaluationPeriods: rule.evaluationPeriods,
        Threshold: rule.threshold,
        ComparisonOperator: rule.comparisonOperator,
        TreatMissingData: rule.treatMissingData,
        AlarmActions: rule.snsTopicArn ? [rule.snsTopicArn] : undefined,
        OKActions: rule.snsTopicArn ? [rule.snsTopicArn] : undefined
      };

      await this.cloudWatchClient.send(new PutMetricAlarmCommand(alarmParams));
      
      this.alertRules.push(rule);
      MCPLogger.info(`Created CloudWatch alarm: ${rule.name}`);

    } catch (error) {
      MCPLogger.error(`Failed to create alarm ${rule.name}`, error as Error);
      throw error;
    }
  }

  /**
   * Get current status of all monitored services
   */
  getServiceStatuses(): ServiceStatus[] {
    return Array.from(this.serviceStatuses.values());
  }

  /**
   * Get status of a specific service
   */
  getServiceStatus(serviceName: string): ServiceStatus | undefined {
    return this.serviceStatuses.get(serviceName);
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    healthyServices: number;
    totalServices: number;
    criticalIssues: string[];
  } {
    const services = this.getServiceStatuses();
    const totalServices = services.length;
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const unhealthyServices = services.filter(s => s.status === 'unhealthy');
    const degradedServices = services.filter(s => s.status === 'degraded');

    let systemStatus: 'healthy' | 'degraded' | 'unhealthy';
    const criticalIssues: string[] = [];

    if (unhealthyServices.length > 0) {
      systemStatus = 'unhealthy';
      criticalIssues.push(...unhealthyServices.map(s => `${s.name} is unhealthy`));
    } else if (degradedServices.length > 0) {
      systemStatus = 'degraded';
      criticalIssues.push(...degradedServices.map(s => `${s.name} is degraded`));
    } else {
      systemStatus = 'healthy';
    }

    return {
      status: systemStatus,
      healthyServices,
      totalServices,
      criticalIssues
    };
  }

  /**
   * Setup default health checks for NVIDIA NIM platform services
   */
  setupDefaultHealthChecks(): void {
    const defaultConfig: HealthCheckConfig = {
      interval: 30000, // 30 seconds
      timeout: 10000,  // 10 seconds
      retryAttempts: 3,
      retryDelay: 1000 // 1 second
    };

    // NIM Service Health Check
    this.registerService({
      name: 'nvidia-nim-service',
      url: process.env.NIM_ENDPOINT || 'http://localhost:1234/health',
      method: 'GET',
      timeout: 5000,
      expectedStatusCode: 200,
      healthyThreshold: 2,
      unhealthyThreshold: 3
    }, defaultConfig);

    // Lambda Function Health Check (if URL available)
    if (process.env.LAMBDA_FUNCTION_URL) {
      this.registerService({
        name: 'lambda-function',
        url: `${process.env.LAMBDA_FUNCTION_URL}/health`,
        method: 'GET',
        timeout: 10000,
        expectedStatusCode: 200,
        healthyThreshold: 2,
        unhealthyThreshold: 3
      }, defaultConfig);
    }

    // API Gateway Health Check
    if (process.env.API_GATEWAY_URL) {
      this.registerService({
        name: 'api-gateway',
        url: `${process.env.API_GATEWAY_URL}/health`,
        method: 'GET',
        timeout: 5000,
        expectedStatusCode: 200,
        healthyThreshold: 2,
        unhealthyThreshold: 3
      }, defaultConfig);
    }
  }

  /**
   * Setup default CloudWatch alarms
   */
  async setupDefaultAlarms(): Promise<void> {
    const defaultAlarms: AlertRule[] = [
      {
        name: 'NIM-Service-High-Error-Rate',
        condition: 'threshold',
        metric: 'ErrorCount',
        namespace: 'NVIDIA/NIM',
        threshold: 10,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        period: 300,
        statistic: 'Sum',
        treatMissingData: 'notBreaching',
        snsTopicArn: process.env.ALERT_SNS_TOPIC_ARN,
        enabled: true
      },
      {
        name: 'NIM-Service-High-Latency',
        condition: 'threshold',
        metric: 'RequestLatency',
        namespace: 'NVIDIA/NIM',
        threshold: 5000,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 3,
        period: 300,
        statistic: 'Average',
        treatMissingData: 'notBreaching',
        snsTopicArn: process.env.ALERT_SNS_TOPIC_ARN,
        enabled: true
      },
      {
        name: 'Lambda-Function-Errors',
        condition: 'threshold',
        metric: 'Errors',
        namespace: 'AWS/Lambda/Custom',
        threshold: 5,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        period: 300,
        statistic: 'Sum',
        treatMissingData: 'notBreaching',
        snsTopicArn: process.env.ALERT_SNS_TOPIC_ARN,
        enabled: true
      }
    ];

    for (const alarm of defaultAlarms) {
      try {
        await this.createAlarm(alarm);
      } catch (error) {
        MCPLogger.error(`Failed to create default alarm ${alarm.name}`, error as Error);
      }
    }
  }

  /**
   * Cleanup all health check intervals
   */
  cleanup(): void {
    for (const [serviceName, intervalId] of this.healthCheckIntervals) {
      clearInterval(intervalId);
      MCPLogger.info(`Cleaned up health check for ${serviceName}`);
    }
    
    this.healthCheckIntervals.clear();
    this.serviceStatuses.clear();
  }
}