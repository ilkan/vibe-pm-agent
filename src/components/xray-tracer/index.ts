/**
 * AWS X-Ray Tracing Integration
 * Provides distributed request tracking across Lambda, Bedrock, and NIM services
 */

import AWSXRay from 'aws-xray-sdk-core';
import { Segment, Subsegment } from 'aws-xray-sdk-core';
import { MCPLogger } from '../../utils/mcp-error-handling';

export interface TraceContext {
  traceId: string;
  segmentId: string;
  parentId?: string;
  sampled: boolean;
}

export interface TraceMetadata {
  service: string;
  operation: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  agentType?: string;
  modelName?: string;
}

export interface TraceAnnotations {
  [key: string]: string | number | boolean;
}

export interface SpanResult {
  success: boolean;
  duration: number;
  error?: Error;
  metadata?: Record<string, any>;
}

export class XRayTracer {
  private enabled: boolean;
  private serviceName: string;

  constructor(serviceName: string = 'nvidia-nim-platform', enabled: boolean = true) {
    this.serviceName = serviceName;
    this.enabled = enabled;

    if (this.enabled) {
      this.initializeXRay();
    }
  }

  /**
   * Initialize X-Ray SDK
   */
  private initializeXRay(): void {
    try {
      // Configure X-Ray SDK
      AWSXRay.config([
        AWSXRay.plugins.ECSPlugin,
        AWSXRay.plugins.EC2Plugin,
        AWSXRay.plugins.ElasticBeanstalkPlugin
      ]);

      // Set default service name
      AWSXRay.middleware.setSamplingRules({
        version: 2,
        default: {
          fixed_target: 1,
          rate: 0.1
        },
        rules: [
          {
            description: 'NIM Service Tracing',
            service_name: '*',
            http_method: '*',
            url_path: '/nim/*',
            fixed_target: 2,
            rate: 0.5
          },
          {
            description: 'Agent Communication Tracing',
            service_name: '*',
            http_method: '*',
            url_path: '/agents/*',
            fixed_target: 1,
            rate: 0.3
          }
        ]
      });

      MCPLogger.info('X-Ray tracing initialized successfully');
    } catch (error) {
      MCPLogger.error('Failed to initialize X-Ray tracing', error as Error);
      this.enabled = false;
    }
  }

  /**
   * Create a new trace segment
   */
  createSegment(name: string, metadata?: TraceMetadata): Segment | null {
    if (!this.enabled) {
      return null;
    }

    try {
      const segment = new AWSXRay.Segment(name);
      
      if (metadata) {
        // Add metadata
        segment.addMetadata('service', metadata.service);
        segment.addMetadata('operation', metadata.operation);
        
        if (metadata.userId) segment.addMetadata('userId', metadata.userId);
        if (metadata.sessionId) segment.addMetadata('sessionId', metadata.sessionId);
        if (metadata.requestId) segment.addMetadata('requestId', metadata.requestId);
        if (metadata.agentType) segment.addMetadata('agentType', metadata.agentType);
        if (metadata.modelName) segment.addMetadata('modelName', metadata.modelName);

        // Add annotations for filtering
        segment.addAnnotation('service', metadata.service);
        segment.addAnnotation('operation', metadata.operation);
        if (metadata.agentType) segment.addAnnotation('agentType', metadata.agentType);
      }

      return segment;
    } catch (error) {
      MCPLogger.error('Failed to create X-Ray segment', error as Error);
      return null;
    }
  }

  /**
   * Create a subsegment for detailed operation tracking
   */
  createSubsegment(parent: Segment, name: string, metadata?: TraceMetadata): Subsegment | null {
    if (!this.enabled || !parent) {
      return null;
    }

    try {
      const subsegment = parent.addNewSubsegment(name);
      
      if (metadata) {
        subsegment.addMetadata('operation', metadata.operation);
        if (metadata.modelName) subsegment.addMetadata('modelName', metadata.modelName);
        if (metadata.requestId) subsegment.addMetadata('requestId', metadata.requestId);
      }

      return subsegment;
    } catch (error) {
      MCPLogger.error('Failed to create X-Ray subsegment', error as Error);
      return null;
    }
  }

  /**
   * Trace an async operation with automatic segment management
   */
  async traceOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: TraceMetadata,
    annotations?: TraceAnnotations
  ): Promise<T> {
    if (!this.enabled) {
      return await operation();
    }

    const segment = this.createSegment(operationName, metadata);
    if (!segment) {
      return await operation();
    }

    const startTime = Date.now();

    try {
      // Add annotations if provided
      if (annotations) {
        Object.entries(annotations).forEach(([key, value]) => {
          segment.addAnnotation(key, value);
        });
      }

      // Execute operation within segment context
      const result = await AWSXRay.captureAsyncFunc(operationName, async (subsegment) => {
        if (subsegment) {
          subsegment.addMetadata('startTime', new Date().toISOString());
        }
        return await operation();
      }, segment);

      // Mark segment as successful
      segment.addMetadata('success', true);
      segment.addMetadata('duration', Date.now() - startTime);
      segment.close();

      return result;
    } catch (error) {
      // Mark segment as failed
      segment.addError(error as Error);
      segment.addMetadata('success', false);
      segment.addMetadata('duration', Date.now() - startTime);
      segment.close(error as Error);

      throw error;
    }
  }

  /**
   * Trace NIM service calls
   */
  async traceNIMCall<T>(
    operation: string,
    modelName: string,
    nimCall: () => Promise<T>,
    requestMetadata?: Record<string, any>
  ): Promise<T> {
    const metadata: TraceMetadata = {
      service: 'NVIDIA-NIM',
      operation,
      modelName,
      requestId: requestMetadata?.requestId
    };

    const annotations: TraceAnnotations = {
      service: 'nim',
      model: modelName,
      operation
    };

    return await this.traceOperation(
      `NIM-${operation}`,
      nimCall,
      metadata,
      annotations
    );
  }

  /**
   * Trace Bedrock agent interactions
   */
  async traceAgentCall<T>(
    agentType: string,
    operation: string,
    agentCall: () => Promise<T>,
    sessionId?: string
  ): Promise<T> {
    const metadata: TraceMetadata = {
      service: 'Bedrock-Agent',
      operation,
      agentType,
      sessionId
    };

    const annotations: TraceAnnotations = {
      service: 'bedrock',
      agentType,
      operation
    };

    return await this.traceOperation(
      `Agent-${agentType}-${operation}`,
      agentCall,
      metadata,
      annotations
    );
  }

  /**
   * Trace Lambda function execution
   */
  async traceLambdaExecution<T>(
    functionName: string,
    operation: string,
    lambdaCall: () => Promise<T>,
    requestId?: string
  ): Promise<T> {
    const metadata: TraceMetadata = {
      service: 'AWS-Lambda',
      operation,
      requestId
    };

    const annotations: TraceAnnotations = {
      service: 'lambda',
      function: functionName,
      operation
    };

    return await this.traceOperation(
      `Lambda-${functionName}`,
      lambdaCall,
      metadata,
      annotations
    );
  }

  /**
   * Trace supervisor agent orchestration
   */
  async traceSupervisorOperation<T>(
    operation: string,
    agentCount: number,
    supervisorCall: () => Promise<T>,
    sessionId?: string
  ): Promise<T> {
    const metadata: TraceMetadata = {
      service: 'Supervisor-Agent',
      operation,
      sessionId
    };

    const annotations: TraceAnnotations = {
      service: 'supervisor',
      operation,
      agentCount
    };

    return await this.traceOperation(
      `Supervisor-${operation}`,
      supervisorCall,
      metadata,
      annotations
    );
  }

  /**
   * Add custom annotation to current segment
   */
  addAnnotation(key: string, value: string | number | boolean): void {
    if (!this.enabled) {
      return;
    }

    try {
      const segment = AWSXRay.getSegment();
      if (segment) {
        segment.addAnnotation(key, value);
      }
    } catch (error) {
      MCPLogger.debug(`Failed to add annotation ${key}=${value}`, undefined, { error });
    }
  }

  /**
   * Add custom metadata to current segment
   */
  addMetadata(namespace: string, key: string, value: any): void {
    if (!this.enabled) {
      return;
    }

    try {
      const segment = AWSXRay.getSegment();
      if (segment) {
        segment.addMetadata(namespace, { [key]: value });
      }
    } catch (error) {
      MCPLogger.debug(`Failed to add metadata ${namespace}.${key}`, undefined, { error });
    }
  }

  /**
   * Get current trace context
   */
  getCurrentTraceContext(): TraceContext | null {
    if (!this.enabled) {
      return null;
    }

    try {
      const segment = AWSXRay.getSegment();
      if (!segment) {
        return null;
      }

      return {
        traceId: (segment as any).trace_id || segment.id,
        segmentId: segment.id,
        parentId: (segment as any).parent_id,
        sampled: (segment as any).sampled || false
      };
    } catch (error) {
      MCPLogger.debug('Failed to get trace context', undefined, { error });
      return null;
    }
  }

  /**
   * Create trace header for downstream services
   */
  createTraceHeader(): string | null {
    if (!this.enabled) {
      return null;
    }

    try {
      const segment = AWSXRay.getSegment();
      if (!segment) {
        return null;
      }

      return `Root=${(segment as any).trace_id || segment.id};Parent=${segment.id};Sampled=${(segment as any).sampled ? '1' : '0'}`;
    } catch (error) {
      MCPLogger.debug('Failed to create trace header', undefined, { error });
      return null;
    }
  }

  /**
   * Parse trace header from upstream services
   */
  parseTraceHeader(traceHeader: string): TraceContext | null {
    if (!this.enabled || !traceHeader) {
      return null;
    }

    try {
      const parts = traceHeader.split(';');
      const context: Partial<TraceContext> = {};

      for (const part of parts) {
        const [key, value] = part.split('=');
        switch (key) {
          case 'Root':
            context.traceId = value;
            break;
          case 'Parent':
            context.parentId = value;
            break;
          case 'Sampled':
            context.sampled = value === '1';
            break;
        }
      }

      if (context.traceId && context.parentId && context.sampled !== undefined) {
        return context as TraceContext;
      }

      return null;
    } catch (error) {
      MCPLogger.debug('Failed to parse trace header', undefined, { error, traceHeader });
      return null;
    }
  }

  /**
   * Enable or disable tracing
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.initializeXRay();
    }
  }

  /**
   * Check if tracing is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get service name
   */
  getServiceName(): string {
    return this.serviceName;
  }

  /**
   * Capture HTTP request/response for external service calls
   */
  captureHTTPRequest(url: string, method: string = 'GET'): Subsegment | null {
    if (!this.enabled) {
      return null;
    }

    try {
      const segment = AWSXRay.getSegment();
      if (!segment) {
        return null;
      }

      const subsegment = segment.addNewSubsegment('http_request');
      subsegment.addMetadata('http', {
        url,
        method,
        timestamp: new Date().toISOString()
      });

      return subsegment;
    } catch (error) {
      MCPLogger.debug('Failed to capture HTTP request', undefined, { error, url, method });
      return null;
    }
  }

  /**
   * Close HTTP request subsegment with response details
   */
  closeHTTPRequest(subsegment: Subsegment | null, statusCode: number, responseSize?: number, error?: Error): void {
    if (!this.enabled || !subsegment) {
      return;
    }

    try {
      subsegment.addMetadata('http_response', {
        status_code: statusCode,
        response_size: responseSize,
        timestamp: new Date().toISOString()
      });

      if (error) {
        subsegment.addError(error);
        subsegment.close(error);
      } else {
        subsegment.close();
      }
    } catch (err) {
      MCPLogger.debug('Failed to close HTTP request subsegment', undefined, { error: err });
    }
  }
}

// Global X-Ray tracer instance
export const xrayTracer = new XRayTracer();