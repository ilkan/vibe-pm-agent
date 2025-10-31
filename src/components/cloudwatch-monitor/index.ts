/**
 * CloudWatch Monitoring Integration
 * Provides comprehensive monitoring with custom metrics, alarms, and dashboards
 */

import { CloudWatchClient, PutMetricDataCommand, PutMetricDataCommandInput, MetricDatum, Dimension } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, CreateLogGroupCommand, PutLogEventsCommand, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';
import { MonitoringConfig, CustomMetric, AlertThreshold } from '../../interfaces/nvidia-nim-core';
import { MCPLogger } from '../../utils/mcp-error-handling';

export interface CloudWatchMetric {
  metricName: string;
  namespace: string;
  value: number;
  unit: 'Count' | 'Seconds' | 'Milliseconds' | 'Bytes' | 'Percent' | 'Count/Second' | 'Bytes/Second';
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  errorRate?: number;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface AlertConfiguration {
  metricName: string;
  namespace: string;
  threshold: number;
  comparisonOperator: 'GreaterThanThreshold' | 'LessThanThreshold' | 'GreaterThanOrEqualToThreshold' | 'LessThanOrEqualToThreshold';
  evaluationPeriods: number;
  period: number;
  statistic: 'Average' | 'Sum' | 'Maximum' | 'Minimum' | 'SampleCount';
  alarmName: string;
  alarmDescription: string;
  snsTopicArn?: string;
}

export class CloudWatchMonitor {
  private cloudWatchClient: CloudWatchClient;
  private cloudWatchLogsClient: CloudWatchLogsClient;
  private config: MonitoringConfig;
  private logGroupName: string;
  private logStreamName: string;

  constructor(config: MonitoringConfig, region: string = 'us-east-1') {
    this.config = config;
    this.cloudWatchClient = new CloudWatchClient({ region });
    this.cloudWatchLogsClient = new CloudWatchLogsClient({ region });
    this.logGroupName = '/aws/nvidia-nim/monitoring';
    this.logStreamName = `monitoring-${Date.now()}`;
    
    this.initializeLogging();
  }

  /**
   * Initialize CloudWatch Logs group and stream
   */
  private async initializeLogging(): Promise<void> {
    try {
      // Create log group if it doesn't exist
      await this.cloudWatchLogsClient.send(new CreateLogGroupCommand({
        logGroupName: this.logGroupName
      }));
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        MCPLogger.warn(`Failed to create log group: ${error.message}`);
      }
    }

    try {
      // Create log stream
      await this.cloudWatchLogsClient.send(new CreateLogStreamCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName
      }));
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        MCPLogger.warn(`Failed to create log stream: ${error.message}`);
      }
    }
  }

  /**
   * Publish custom metric to CloudWatch
   */
  async publishMetric(metric: CloudWatchMetric): Promise<void> {
    if (!this.config.cloudWatchEnabled) {
      return;
    }

    try {
      const dimensions: Dimension[] = metric.dimensions 
        ? Object.entries(metric.dimensions).map(([name, value]) => ({
            Name: name,
            Value: value
          }))
        : [];

      const metricData: MetricDatum = {
        MetricName: metric.metricName,
        Value: metric.value,
        Unit: metric.unit,
        Timestamp: metric.timestamp || new Date(),
        Dimensions: dimensions
      };

      const params: PutMetricDataCommandInput = {
        Namespace: metric.namespace,
        MetricData: [metricData]
      };

      await this.cloudWatchClient.send(new PutMetricDataCommand(params));
      
      MCPLogger.debug(`Published metric: ${metric.namespace}/${metric.metricName} = ${metric.value}`);
    } catch (error) {
      MCPLogger.error(`Failed to publish metric ${metric.metricName}`, error as Error);
      throw error;
    }
  }

  /**
   * Publish multiple metrics in batch
   */
  async publishMetrics(metrics: CloudWatchMetric[]): Promise<void> {
    if (!this.config.cloudWatchEnabled || metrics.length === 0) {
      return;
    }

    try {
      // Group metrics by namespace for efficient batching
      const metricsByNamespace = new Map<string, MetricDatum[]>();

      for (const metric of metrics) {
        const dimensions: Dimension[] = metric.dimensions 
          ? Object.entries(metric.dimensions).map(([name, value]) => ({
              Name: name,
              Value: value
            }))
          : [];

        const metricData: MetricDatum = {
          MetricName: metric.metricName,
          Value: metric.value,
          Unit: metric.unit,
          Timestamp: metric.timestamp || new Date(),
          Dimensions: dimensions
        };

        if (!metricsByNamespace.has(metric.namespace)) {
          metricsByNamespace.set(metric.namespace, []);
        }
        metricsByNamespace.get(metric.namespace)!.push(metricData);
      }

      // Send metrics by namespace (CloudWatch limit is 20 metrics per request)
      for (const [namespace, metricData] of metricsByNamespace) {
        const chunks = this.chunkArray(metricData, 20);
        
        for (const chunk of chunks) {
          const params: PutMetricDataCommandInput = {
            Namespace: namespace,
            MetricData: chunk
          };

          await this.cloudWatchClient.send(new PutMetricDataCommand(params));
        }
      }

      MCPLogger.debug(`Published ${metrics.length} metrics to CloudWatch`);
    } catch (error) {
      MCPLogger.error('Failed to publish metrics batch', error as Error);
      throw error;
    }
  }

  /**
   * Record NIM service performance metrics
   */
  async recordNIMPerformance(
    operation: string,
    latency: number,
    tokenCount?: number,
    errorCount: number = 0
  ): Promise<void> {
    const metrics: CloudWatchMetric[] = [
      {
        metricName: 'RequestLatency',
        namespace: 'NVIDIA/NIM',
        value: latency,
        unit: 'Milliseconds',
        dimensions: { Operation: operation, Service: 'NIM' }
      },
      {
        metricName: 'RequestCount',
        namespace: 'NVIDIA/NIM',
        value: 1,
        unit: 'Count',
        dimensions: { Operation: operation, Service: 'NIM' }
      }
    ];

    if (tokenCount !== undefined) {
      metrics.push({
        metricName: 'TokensProcessed',
        namespace: 'NVIDIA/NIM',
        value: tokenCount,
        unit: 'Count',
        dimensions: { Operation: operation, Service: 'NIM' }
      });

      metrics.push({
        metricName: 'TokensPerSecond',
        namespace: 'NVIDIA/NIM',
        value: tokenCount / (latency / 1000),
        unit: 'Count/Second',
        dimensions: { Operation: operation, Service: 'NIM' }
      });
    }

    if (errorCount > 0) {
      metrics.push({
        metricName: 'ErrorCount',
        namespace: 'NVIDIA/NIM',
        value: errorCount,
        unit: 'Count',
        dimensions: { Operation: operation, Service: 'NIM' }
      });
    }

    await this.publishMetrics(metrics);
  }

  /**
   * Record agent communication metrics
   */
  async recordAgentMetrics(
    agentType: string,
    operation: string,
    duration: number,
    success: boolean
  ): Promise<void> {
    const metrics: CloudWatchMetric[] = [
      {
        metricName: 'AgentOperationDuration',
        namespace: 'NVIDIA/Agents',
        value: duration,
        unit: 'Milliseconds',
        dimensions: { AgentType: agentType, Operation: operation }
      },
      {
        metricName: 'AgentOperationCount',
        namespace: 'NVIDIA/Agents',
        value: 1,
        unit: 'Count',
        dimensions: { AgentType: agentType, Operation: operation, Status: success ? 'Success' : 'Error' }
      }
    ];

    if (!success) {
      metrics.push({
        metricName: 'AgentErrorCount',
        namespace: 'NVIDIA/Agents',
        value: 1,
        unit: 'Count',
        dimensions: { AgentType: agentType, Operation: operation }
      });
    }

    await this.publishMetrics(metrics);
  }

  /**
   * Record Lambda function metrics
   */
  async recordLambdaMetrics(
    functionName: string,
    duration: number,
    memoryUsed: number,
    success: boolean
  ): Promise<void> {
    const metrics: CloudWatchMetric[] = [
      {
        metricName: 'Duration',
        namespace: 'AWS/Lambda/Custom',
        value: duration,
        unit: 'Milliseconds',
        dimensions: { FunctionName: functionName }
      },
      {
        metricName: 'MemoryUtilization',
        namespace: 'AWS/Lambda/Custom',
        value: memoryUsed,
        unit: 'Bytes',
        dimensions: { FunctionName: functionName }
      },
      {
        metricName: 'Invocations',
        namespace: 'AWS/Lambda/Custom',
        value: 1,
        unit: 'Count',
        dimensions: { FunctionName: functionName, Status: success ? 'Success' : 'Error' }
      }
    ];

    if (!success) {
      metrics.push({
        metricName: 'Errors',
        namespace: 'AWS/Lambda/Custom',
        value: 1,
        unit: 'Count',
        dimensions: { FunctionName: functionName }
      });
    }

    await this.publishMetrics(metrics);
  }

  /**
   * Perform health check on service
   */
  async performHealthCheck(serviceName: string, healthCheckFn: () => Promise<HealthCheckResult>): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const result = await healthCheckFn();
      const duration = Date.now() - startTime;

      // Record health check metrics
      await this.publishMetrics([
        {
          metricName: 'HealthCheckDuration',
          namespace: 'NVIDIA/HealthChecks',
          value: duration,
          unit: 'Milliseconds',
          dimensions: { Service: serviceName }
        },
        {
          metricName: 'HealthCheckStatus',
          namespace: 'NVIDIA/HealthChecks',
          value: result.status === 'healthy' ? 1 : 0,
          unit: 'Count',
          dimensions: { Service: serviceName, Status: result.status }
        }
      ]);

      if (result.latency !== undefined) {
        await this.publishMetric({
          metricName: 'ServiceLatency',
          namespace: 'NVIDIA/HealthChecks',
          value: result.latency,
          unit: 'Milliseconds',
          dimensions: { Service: serviceName }
        });
      }

      if (result.errorRate !== undefined) {
        await this.publishMetric({
          metricName: 'ServiceErrorRate',
          namespace: 'NVIDIA/HealthChecks',
          value: result.errorRate,
          unit: 'Percent',
          dimensions: { Service: serviceName }
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record failed health check
      await this.publishMetrics([
        {
          metricName: 'HealthCheckDuration',
          namespace: 'NVIDIA/HealthChecks',
          value: duration,
          unit: 'Milliseconds',
          dimensions: { Service: serviceName }
        },
        {
          metricName: 'HealthCheckStatus',
          namespace: 'NVIDIA/HealthChecks',
          value: 0,
          unit: 'Count',
          dimensions: { Service: serviceName, Status: 'unhealthy' }
        }
      ]);

      const result: HealthCheckResult = {
        service: serviceName,
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date()
      };

      return result;
    }
  }

  /**
   * Log structured message to CloudWatch Logs
   */
  async logMessage(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const logEvent = {
        timestamp: Date.now(),
        message: JSON.stringify({
          level,
          message,
          metadata,
          timestamp: new Date().toISOString()
        })
      };

      await this.cloudWatchLogsClient.send(new PutLogEventsCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [logEvent]
      }));
    } catch (error) {
      MCPLogger.error('Failed to log message to CloudWatch', error as Error);
    }
  }

  /**
   * Utility method to chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get monitoring configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}