/**
 * Comprehensive Request Handler
 * 
 * Handles all types of user requests and routes them through the complete
 * application workflow including NIM, agents, Lambda, and infrastructure.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import { EndToEndWorkflowOrchestrator, WorkflowRequest, WorkflowResponse } from '../end-to-end-workflow-orchestrator/index.js';
import { SecureCredentialManager } from '../secure-credential-manager/index.js';
import { PerformanceOptimizer } from '../performance-optimizer/index.js';
import { AuditTrailManager } from '../audit-trail-manager/index.js';

export interface RequestContext {
  userId?: string;
  sessionId?: string;
  clientInfo?: ClientInfo;
  authentication?: AuthenticationInfo;
  preferences?: UserPreferences;
}

export interface ClientInfo {
  userAgent: string;
  ipAddress: string;
  region: string;
  platform: string;
}

export interface AuthenticationInfo {
  token?: string;
  userId?: string;
  roles: string[];
  permissions: string[];
}

export interface UserPreferences {
  analysisDepth: 'quick' | 'standard' | 'comprehensive';
  includeVisualizations: boolean;
  confidenceThreshold: number;
  preferredAgents?: string[];
  outputFormat: 'json' | 'markdown' | 'html';
}

export interface ProcessedRequest {
  id: string;
  originalRequest: any;
  normalizedRequest: WorkflowRequest;
  context: RequestContext;
  metadata: RequestMetadata;
}

export interface RequestMetadata {
  timestamp: Date;
  source: string;
  version: string;
  traceId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComprehensiveResponse {
  success: boolean;
  data?: any;
  error?: ResponseError;
  metadata: ResponseMetadata;
  performance: PerformanceMetrics;
  audit: AuditInfo;
}

export interface ResponseError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
}

export interface ResponseMetadata {
  requestId: string;
  processingTime: number;
  componentsInvolved: string[];
  cacheHit: boolean;
  version: string;
}

export interface PerformanceMetrics {
  totalDuration: number;
  nimLatency?: number;
  agentLatency?: number;
  retrievalLatency?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface AuditInfo {
  userId?: string;
  action: string;
  timestamp: Date;
  success: boolean;
  details: any;
}

export interface HandlerConfig {
  workflowConfig: any;
  enableCaching: boolean;
  enableAudit: boolean;
  enablePerformanceTracking: boolean;
  maxConcurrentRequests: number;
  requestTimeoutMs: number;
}

export class ComprehensiveRequestHandler {
  private orchestrator: EndToEndWorkflowOrchestrator;
  private credentialManager: SecureCredentialManager;
  private performanceOptimizer: PerformanceOptimizer;
  private auditManager: AuditTrailManager;
  private activeRequests: Map<string, ProcessedRequest>;
  private requestQueue: ProcessedRequest[];
  private processing = false;

  constructor(private config: HandlerConfig) {
    this.orchestrator = new EndToEndWorkflowOrchestrator(config.workflowConfig);
    this.credentialManager = new SecureCredentialManager({
      encryptionEnabled: true,
      rotationIntervalHours: 24
    });
    
    if (config.enablePerformanceTracking) {
      this.performanceOptimizer = new PerformanceOptimizer({
        cacheEnabled: config.enableCaching,
        metricsEnabled: true
      });
    }

    if (config.enableAudit) {
      this.auditManager = new AuditTrailManager({
        logLevel: 'info',
        retentionDays: 90
      });
    }

    this.activeRequests = new Map();
    this.requestQueue = [];
  }

  /**
   * Process any type of user request through the complete system
   */
  async handleRequest(request: any, context: RequestContext = {}): Promise<ComprehensiveResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const traceId = this.generateTraceId();

    try {
      // Step 1: Validate and normalize request
      const processedRequest = await this.preprocessRequest(request, context, requestId, traceId);
      
      // Step 2: Check rate limits and queue if necessary
      await this.checkRateLimits(processedRequest);
      
      // Step 3: Authenticate and authorize
      await this.authenticateRequest(processedRequest);
      
      // Step 4: Check cache if enabled
      let cachedResponse = null;
      if (this.config.enableCaching) {
        cachedResponse = await this.checkCache(processedRequest);
        if (cachedResponse) {
          return this.buildResponse(cachedResponse, processedRequest, startTime, true);
        }
      }
      
      // Step 5: Process through workflow orchestrator
      const workflowResponse = await this.processWorkflow(processedRequest);
      
      // Step 6: Post-process response
      const finalResponse = await this.postprocessResponse(workflowResponse, processedRequest);
      
      // Step 7: Cache response if enabled
      if (this.config.enableCaching && workflowResponse.status === 'success') {
        await this.cacheResponse(processedRequest, finalResponse);
      }
      
      // Step 8: Build comprehensive response
      return this.buildResponse(finalResponse, processedRequest, startTime, false);

    } catch (error) {
      return this.handleError(error, requestId, traceId, startTime, context);
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Preprocess and normalize incoming request
   */
  private async preprocessRequest(
    request: any, 
    context: RequestContext, 
    requestId: string, 
    traceId: string
  ): Promise<ProcessedRequest> {
    
    // Determine request type based on content
    const requestType = this.determineRequestType(request);
    
    // Normalize request format
    const normalizedRequest: WorkflowRequest = {
      id: requestId,
      userId: context.userId || 'anonymous',
      type: requestType,
      payload: this.normalizePayload(request, requestType),
      priority: this.determinePriority(request, context),
      context: {
        conversationId: context.sessionId,
        sessionId: context.sessionId,
        userPreferences: context.preferences,
        previousInteractions: []
      }
    };

    const processedRequest: ProcessedRequest = {
      id: requestId,
      originalRequest: request,
      normalizedRequest,
      context,
      metadata: {
        timestamp: new Date(),
        source: this.determineSource(context),
        version: '1.0.0',
        traceId,
        priority: normalizedRequest.priority
      }
    };

    this.activeRequests.set(requestId, processedRequest);
    return processedRequest;
  }

  /**
   * Determine request type from content analysis
   */
  private determineRequestType(request: any): WorkflowRequest['type'] {
    const content = JSON.stringify(request).toLowerCase();
    
    // Business analysis keywords
    if (content.includes('market') || content.includes('competitive') || content.includes('business case') || content.includes('roi')) {
      return 'business_analysis';
    }
    
    // Product development keywords
    if (content.includes('requirements') || content.includes('design') || content.includes('architecture') || content.includes('development')) {
      return 'product_development';
    }
    
    // Executive communication keywords
    if (content.includes('executive') || content.includes('presentation') || content.includes('stakeholder') || content.includes('board')) {
      return 'executive_communication';
    }
    
    // Interview coaching keywords
    if (content.includes('interview') || content.includes('coaching') || content.includes('questions') || content.includes('feedback')) {
      return 'interview_coaching';
    }
    
    // Citation validation keywords
    if (content.includes('citation') || content.includes('reference') || content.includes('source') || content.includes('validation')) {
      return 'citation_validation';
    }
    
    // Default to business analysis
    return 'business_analysis';
  }

  /**
   * Normalize payload based on request type
   */
  private normalizePayload(request: any, type: WorkflowRequest['type']): any {
    switch (type) {
      case 'business_analysis':
        return {
          idea: request.idea || request.description || request.content,
          market_context: request.market_context || {},
          analysis_depth: request.analysis_depth || 'standard'
        };
        
      case 'product_development':
        return {
          requirements: request.requirements || request.description,
          constraints: request.constraints || {},
          timeline: request.timeline
        };
        
      case 'executive_communication':
        return {
          content: request.content || request.data,
          audience: request.audience || 'executives',
          format: request.format || 'executive_onepager'
        };
        
      case 'interview_coaching':
        return {
          role: request.role || 'general',
          experience_level: request.experience_level || 'mid',
          focus_areas: request.focus_areas || []
        };
        
      case 'citation_validation':
        return {
          document: request.document || request.content,
          citations: request.citations || [],
          validation_level: request.validation_level || 'standard'
        };
        
      default:
        return request;
    }
  }

  /**
   * Determine request priority
   */
  private determinePriority(request: any, context: RequestContext): 'low' | 'medium' | 'high' | 'critical' {
    // Check explicit priority
    if (request.priority) {
      return request.priority;
    }
    
    // Check user roles for priority
    if (context.authentication?.roles?.includes('executive')) {
      return 'high';
    }
    
    if (context.authentication?.roles?.includes('premium')) {
      return 'medium';
    }
    
    // Check request urgency indicators
    const content = JSON.stringify(request).toLowerCase();
    if (content.includes('urgent') || content.includes('asap') || content.includes('critical')) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * Check rate limits and queue management
   */
  private async checkRateLimits(request: ProcessedRequest): Promise<void> {
    const activeCount = this.activeRequests.size;
    
    if (activeCount >= this.config.maxConcurrentRequests) {
      // Add to queue if not at capacity
      if (this.requestQueue.length < this.config.maxConcurrentRequests * 2) {
        this.requestQueue.push(request);
        await this.waitForQueueProcessing(request.id);
      } else {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
    }
  }

  /**
   * Authenticate and authorize request
   */
  private async authenticateRequest(request: ProcessedRequest): Promise<void> {
    if (!request.context.authentication) {
      // Allow anonymous requests with limited capabilities
      request.context.authentication = {
        userId: 'anonymous',
        roles: ['anonymous'],
        permissions: ['basic_analysis']
      };
      return;
    }

    // Validate token if provided
    if (request.context.authentication.token) {
      const isValid = await this.credentialManager.validateToken(request.context.authentication.token);
      if (!isValid) {
        throw new Error('INVALID_TOKEN');
      }
    }
  }

  /**
   * Check cache for existing response
   */
  private async checkCache(request: ProcessedRequest): Promise<any> {
    if (!this.performanceOptimizer) return null;
    
    const cacheKey = this.generateCacheKey(request);
    return await this.performanceOptimizer.getCachedResult(cacheKey);
  }

  /**
   * Process request through workflow orchestrator
   */
  private async processWorkflow(request: ProcessedRequest): Promise<WorkflowResponse> {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), this.config.requestTimeoutMs);
    });

    const workflowPromise = this.orchestrator.processRequest(request.normalizedRequest);
    
    return Promise.race([workflowPromise, timeoutPromise]) as Promise<WorkflowResponse>;
  }

  /**
   * Post-process workflow response
   */
  private async postprocessResponse(workflowResponse: WorkflowResponse, request: ProcessedRequest): Promise<any> {
    // Apply user preferences for output format
    const preferences = request.context.preferences;
    if (preferences?.outputFormat && preferences.outputFormat !== 'json') {
      return this.formatResponse(workflowResponse, preferences.outputFormat);
    }
    
    return workflowResponse;
  }

  /**
   * Cache successful response
   */
  private async cacheResponse(request: ProcessedRequest, response: any): Promise<void> {
    if (!this.performanceOptimizer) return;
    
    const cacheKey = this.generateCacheKey(request);
    const ttl = this.determineCacheTTL(request.normalizedRequest.type);
    
    await this.performanceOptimizer.cacheResult(cacheKey, response, ttl);
  }

  /**
   * Build comprehensive response
   */
  private buildResponse(
    data: any, 
    request: ProcessedRequest, 
    startTime: number, 
    cacheHit: boolean
  ): ComprehensiveResponse {
    const processingTime = Date.now() - startTime;
    
    const response: ComprehensiveResponse = {
      success: true,
      data,
      metadata: {
        requestId: request.id,
        processingTime,
        componentsInvolved: this.getInvolvedComponents(data),
        cacheHit,
        version: '1.0.0'
      },
      performance: {
        totalDuration: processingTime,
        nimLatency: data?.metadata?.nimLatency,
        agentLatency: data?.metadata?.agentLatency,
        retrievalLatency: data?.metadata?.retrievalLatency
      },
      audit: {
        userId: request.context.userId,
        action: `process_${request.normalizedRequest.type}`,
        timestamp: new Date(),
        success: true,
        details: {
          requestType: request.normalizedRequest.type,
          priority: request.normalizedRequest.priority,
          cacheHit
        }
      }
    };

    // Log audit trail if enabled
    if (this.auditManager) {
      this.auditManager.logActivity(response.audit);
    }

    return response;
  }

  /**
   * Handle errors with comprehensive error response
   */
  private handleError(
    error: any, 
    requestId: string, 
    traceId: string, 
    startTime: number, 
    context: RequestContext
  ): ComprehensiveResponse {
    const processingTime = Date.now() - startTime;
    
    const errorResponse: ComprehensiveResponse = {
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: error.details,
        recoverable: this.isRecoverableError(error)
      },
      metadata: {
        requestId,
        processingTime,
        componentsInvolved: ['request_handler'],
        cacheHit: false,
        version: '1.0.0'
      },
      performance: {
        totalDuration: processingTime
      },
      audit: {
        userId: context.userId,
        action: 'process_request',
        timestamp: new Date(),
        success: false,
        details: {
          error: error.message,
          traceId
        }
      }
    };

    // Log audit trail if enabled
    if (this.auditManager) {
      this.auditManager.logActivity(errorResponse.audit);
    }

    return errorResponse;
  }

  // Helper methods
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSource(context: RequestContext): string {
    return context.clientInfo?.platform || 'unknown';
  }

  private generateCacheKey(request: ProcessedRequest): string {
    const key = `${request.normalizedRequest.type}_${JSON.stringify(request.normalizedRequest.payload)}`;
    return Buffer.from(key).toString('base64').substr(0, 32);
  }

  private determineCacheTTL(requestType: string): number {
    const ttlMap = {
      'business_analysis': 3600, // 1 hour
      'product_development': 1800, // 30 minutes
      'executive_communication': 7200, // 2 hours
      'interview_coaching': 1800, // 30 minutes
      'citation_validation': 3600 // 1 hour
    };
    
    return ttlMap[requestType] || 1800;
  }

  private getInvolvedComponents(data: any): string[] {
    const components = ['request_handler', 'workflow_orchestrator'];
    
    if (data?.metadata?.agentsInvolved?.length > 0) {
      components.push('supervisor_agent', ...data.metadata.agentsInvolved);
    }
    
    if (data?.metadata?.nimInvocations > 0) {
      components.push('nim_service');
    }
    
    if (data?.metadata?.retrievalOperations > 0) {
      components.push('retrieval_service');
    }
    
    return components;
  }

  private formatResponse(response: any, format: string): any {
    switch (format) {
      case 'markdown':
        return this.convertToMarkdown(response);
      case 'html':
        return this.convertToHTML(response);
      default:
        return response;
    }
  }

  private convertToMarkdown(response: any): string {
    // Simple markdown conversion - in a real implementation, this would be more sophisticated
    return `# Response\n\n${JSON.stringify(response, null, 2)}`;
  }

  private convertToHTML(response: any): string {
    // Simple HTML conversion - in a real implementation, this would be more sophisticated
    return `<div class="response"><pre>${JSON.stringify(response, null, 2)}</pre></div>`;
  }

  private isRecoverableError(error: any): boolean {
    const recoverableErrors = ['TIMEOUT', 'RATE_LIMIT', 'TEMPORARY_FAILURE', 'SERVICE_UNAVAILABLE'];
    return recoverableErrors.includes(error.code);
  }

  private async waitForQueueProcessing(requestId: string): Promise<void> {
    return new Promise((resolve) => {
      const checkQueue = () => {
        if (this.activeRequests.size < this.config.maxConcurrentRequests) {
          resolve();
        } else {
          setTimeout(checkQueue, 100);
        }
      };
      checkQueue();
    });
  }

  /**
   * Get system status and metrics
   */
  getSystemStatus(): any {
    return {
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length,
      maxConcurrentRequests: this.config.maxConcurrentRequests,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      activeWorkflows: this.orchestrator.getActiveWorkflows().size
    };
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Check orchestrator health
      const workflowStatus = this.orchestrator.getActiveWorkflows().size < this.config.maxConcurrentRequests;
      
      // Check credential manager health
      const credentialStatus = await this.credentialManager.healthCheck();
      
      const healthy = workflowStatus && credentialStatus.healthy;
      
      return {
        status: healthy ? 'healthy' : 'degraded',
        details: {
          workflow: workflowStatus ? 'healthy' : 'overloaded',
          credentials: credentialStatus.status,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

export default ComprehensiveRequestHandler;