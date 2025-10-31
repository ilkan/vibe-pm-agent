/**
 * End-to-End Workflow Orchestrator
 * 
 * Implements complete application workflow integrating:
 * - NVIDIA NIM inference services
 * - Bedrock agents coordination
 * - Lambda function orchestration
 * - AWS infrastructure components
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import { NIMServiceManager } from '../nim-service-manager/index.js';
import { SupervisorAgent } from '../supervisor-agent/index.js';
import { AWSDocsMCP } from '../aws-docs-mcp-integration/index.js';
import { CloudWatchMonitor } from '../cloudwatch-monitor/index.js';
import { ErrorRecoveryManager } from '../error-recovery-manager/index.js';

export interface WorkflowRequest {
  id: string;
  userId: string;
  type: 'business_analysis' | 'product_development' | 'executive_communication' | 'interview_coaching' | 'citation_validation';
  payload: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  context?: WorkflowContext;
}

export interface WorkflowContext {
  conversationId?: string;
  sessionId?: string;
  userPreferences?: Record<string, any>;
  previousInteractions?: WorkflowInteraction[];
}

export interface WorkflowInteraction {
  timestamp: Date;
  agentId: string;
  action: string;
  input: any;
  output: any;
  duration: number;
}

export interface WorkflowResponse {
  id: string;
  status: 'success' | 'partial_success' | 'failure';
  result: any;
  metadata: WorkflowMetadata;
  interactions: WorkflowInteraction[];
  errors?: WorkflowError[];
}

export interface WorkflowMetadata {
  totalDuration: number;
  agentsInvolved: string[];
  nimInvocations: number;
  retrievalOperations: number;
  confidenceScore: number;
}

export interface WorkflowError {
  code: string;
  message: string;
  component: string;
  recoverable: boolean;
  timestamp: Date;
}

export interface WorkflowConfig {
  nimEndpoint: string;
  bedrockRegion: string;
  maxRetries: number;
  timeoutMs: number;
  enableMonitoring: boolean;
  enableRecovery: boolean;
}

export class EndToEndWorkflowOrchestrator {
  private nimService: NIMServiceManager;
  private supervisorAgent: SupervisorAgent;
  private awsDocs: AWSDocsMCP;
  private monitor: CloudWatchMonitor;
  private errorRecovery: ErrorRecoveryManager;
  private activeWorkflows: Map<string, WorkflowExecution>;

  constructor(private config: WorkflowConfig) {
    this.nimService = new NIMServiceManager({
      endpoint: config.nimEndpoint,
      model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
      timeout: config.timeoutMs,
      retryPolicy: {
        maxRetries: config.maxRetries,
        backoffMs: 1000,
        exponential: true
      }
    });

    this.supervisorAgent = new SupervisorAgent({
      region: config.bedrockRegion,
      maxConcurrentAgents: 5,
      loadBalancing: true
    });

    this.awsDocs = new AWSDocsMCP({
      cacheEnabled: true,
      cacheTtlMs: 300000 // 5 minutes
    });

    if (config.enableMonitoring) {
      this.monitor = new CloudWatchMonitor({
        namespace: 'NVIDIA-NIM-Agentic-Platform',
        region: config.bedrockRegion
      });
    }

    if (config.enableRecovery) {
      this.errorRecovery = new ErrorRecoveryManager({
        maxRetries: config.maxRetries,
        circuitBreakerThreshold: 5,
        fallbackEnabled: true
      });
    }

    this.activeWorkflows = new Map();
  }

  /**
   * Process a complete user request through the entire system
   */
  async processRequest(request: WorkflowRequest): Promise<WorkflowResponse> {
    const startTime = Date.now();
    const execution = new WorkflowExecution(request.id, startTime);
    this.activeWorkflows.set(request.id, execution);

    try {
      // Log request initiation
      await this.logWorkflowEvent('workflow_started', request.id, { type: request.type, priority: request.priority });

      // Step 1: Initialize workflow context
      const context = await this.initializeWorkflowContext(request);
      execution.addInteraction('context_initialization', 'system', {}, context, Date.now() - startTime);

      // Step 2: Route to appropriate agent workflow
      const agentResponse = await this.routeToAgentWorkflow(request, context);
      execution.addInteraction('agent_routing', 'supervisor', request, agentResponse, Date.now() - startTime);

      // Step 3: Enhance with NIM reasoning if needed
      const enhancedResponse = await this.enhanceWithNIMReasoning(agentResponse, request.type);
      execution.addInteraction('nim_enhancement', 'nim_service', agentResponse, enhancedResponse, Date.now() - startTime);

      // Step 4: Apply retrieval augmentation
      const retrievalResponse = await this.applyRetrievalAugmentation(enhancedResponse, request);
      execution.addInteraction('retrieval_augmentation', 'embedding_service', enhancedResponse, retrievalResponse, Date.now() - startTime);

      // Step 5: Generate final response
      const finalResponse = await this.generateFinalResponse(retrievalResponse, request, context);
      execution.addInteraction('response_generation', 'system', retrievalResponse, finalResponse, Date.now() - startTime);

      // Step 6: Log completion metrics
      const totalDuration = Date.now() - startTime;
      await this.logWorkflowCompletion(request.id, totalDuration, execution);

      return {
        id: request.id,
        status: 'success',
        result: finalResponse,
        metadata: {
          totalDuration,
          agentsInvolved: execution.getInvolvedAgents(),
          nimInvocations: execution.getNIMInvocations(),
          retrievalOperations: execution.getRetrievalOperations(),
          confidenceScore: this.calculateConfidenceScore(execution)
        },
        interactions: execution.getInteractions()
      };

    } catch (error) {
      return await this.handleWorkflowError(request.id, error, execution);
    } finally {
      this.activeWorkflows.delete(request.id);
    }
  }

  /**
   * Initialize workflow context with user preferences and session data
   */
  private async initializeWorkflowContext(request: WorkflowRequest): Promise<WorkflowContext> {
    const context: WorkflowContext = {
      conversationId: request.context?.conversationId || `conv_${request.id}`,
      sessionId: request.context?.sessionId || `session_${Date.now()}`,
      userPreferences: request.context?.userPreferences || {},
      previousInteractions: request.context?.previousInteractions || []
    };

    // Load user preferences if available
    if (request.userId) {
      try {
        // In a real implementation, this would load from a user preference store
        context.userPreferences = await this.loadUserPreferences(request.userId);
      } catch (error) {
        console.warn(`Failed to load user preferences for ${request.userId}:`, error);
      }
    }

    return context;
  }

  /**
   * Route request to appropriate agent workflow based on type
   */
  private async routeToAgentWorkflow(request: WorkflowRequest, context: WorkflowContext): Promise<any> {
    const agentSelectionCriteria = {
      taskType: request.type,
      priority: request.priority,
      requiredCapabilities: this.getRequiredCapabilities(request.type),
      context
    };

    // Select optimal agent for the task
    const selectedAgent = await this.supervisorAgent.selectOptimalAgent(agentSelectionCriteria);
    
    // Create agent task
    const agentTask = {
      id: `task_${request.id}`,
      type: request.type,
      payload: request.payload,
      requiredCapabilities: agentSelectionCriteria.requiredCapabilities,
      priority: request.priority as any
    };

    // Execute task through supervisor agent
    return await this.supervisorAgent.orchestrateAgents(agentTask);
  }

  /**
   * Enhance response with NVIDIA NIM reasoning capabilities
   */
  private async enhanceWithNIMReasoning(agentResponse: any, requestType: string): Promise<any> {
    // Determine if NIM enhancement is needed based on request type
    const needsNIMEnhancement = this.shouldEnhanceWithNIM(requestType);
    
    if (!needsNIMEnhancement) {
      return agentResponse;
    }

    try {
      // Prepare NIM request for reasoning enhancement
      const nimRequest = {
        model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI assistant enhancing business analysis. Provide advanced reasoning and insights for the following response.`
          },
          {
            role: 'user',
            content: `Please enhance this analysis with deeper reasoning and insights: ${JSON.stringify(agentResponse)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      };

      const nimResponse = await this.nimService.generateResponse(nimRequest);
      
      // Merge NIM insights with original response
      return {
        ...agentResponse,
        nimEnhancement: {
          reasoning: nimResponse.choices[0].message.content,
          confidence: nimResponse.confidence || 0.8,
          model: 'nvidia-llama-3_1-nemotron-nano-8b-v1'
        }
      };

    } catch (error) {
      console.warn('NIM enhancement failed, proceeding with original response:', error);
      return agentResponse;
    }
  }

  /**
   * Apply retrieval augmentation using embedding NIM
   */
  private async applyRetrievalAugmentation(response: any, request: WorkflowRequest): Promise<any> {
    try {
      // Extract key concepts for retrieval
      const keyConcepts = this.extractKeyConcepts(response, request);
      
      if (keyConcepts.length === 0) {
        return response;
      }

      // Generate embeddings for key concepts
      const embeddings = await this.nimService.generateEmbeddings(keyConcepts);
      
      // Retrieve relevant context (in a real implementation, this would query a vector database)
      const retrievedContext = await this.retrieveRelevantContext(embeddings);
      
      // Enhance response with retrieved context
      return {
        ...response,
        retrievalAugmentation: {
          keyConcepts,
          retrievedContext,
          embeddingModel: 'retrieval-embedding-nim',
          relevanceScore: this.calculateRelevanceScore(retrievedContext)
        }
      };

    } catch (error) {
      console.warn('Retrieval augmentation failed, proceeding without enhancement:', error);
      return response;
    }
  }

  /**
   * Generate final response with proper formatting and metadata
   */
  private async generateFinalResponse(response: any, request: WorkflowRequest, context: WorkflowContext): Promise<any> {
    return {
      requestId: request.id,
      type: request.type,
      timestamp: new Date().toISOString(),
      response: response,
      context: {
        conversationId: context.conversationId,
        sessionId: context.sessionId
      },
      metadata: {
        processingTime: Date.now(),
        version: '1.0.0',
        platform: 'nvidia-nim-agentic-platform'
      }
    };
  }

  /**
   * Handle workflow errors with recovery strategies
   */
  private async handleWorkflowError(requestId: string, error: any, execution: WorkflowExecution): Promise<WorkflowResponse> {
    const workflowError: WorkflowError = {
      code: error.code || 'WORKFLOW_ERROR',
      message: error.message || 'Unknown workflow error',
      component: error.component || 'workflow_orchestrator',
      recoverable: this.isRecoverableError(error),
      timestamp: new Date()
    };

    // Log error
    await this.logWorkflowEvent('workflow_error', requestId, { error: workflowError });

    // Attempt recovery if enabled and error is recoverable
    if (this.config.enableRecovery && workflowError.recoverable) {
      try {
        const recoveryResult = await this.errorRecovery.handleFallback(error);
        return {
          id: requestId,
          status: 'partial_success',
          result: recoveryResult,
          metadata: {
            totalDuration: Date.now() - execution.startTime,
            agentsInvolved: execution.getInvolvedAgents(),
            nimInvocations: execution.getNIMInvocations(),
            retrievalOperations: execution.getRetrievalOperations(),
            confidenceScore: 0.5 // Lower confidence for recovered responses
          },
          interactions: execution.getInteractions(),
          errors: [workflowError]
        };
      } catch (recoveryError) {
        workflowError.message += ` Recovery failed: ${recoveryError.message}`;
      }
    }

    return {
      id: requestId,
      status: 'failure',
      result: null,
      metadata: {
        totalDuration: Date.now() - execution.startTime,
        agentsInvolved: execution.getInvolvedAgents(),
        nimInvocations: execution.getNIMInvocations(),
        retrievalOperations: execution.getRetrievalOperations(),
        confidenceScore: 0
      },
      interactions: execution.getInteractions(),
      errors: [workflowError]
    };
  }

  // Helper methods
  private getRequiredCapabilities(requestType: string): string[] {
    const capabilityMap = {
      'business_analysis': ['market_analysis', 'competitive_intelligence', 'financial_modeling'],
      'product_development': ['requirements_analysis', 'design_optimization', 'technical_planning'],
      'executive_communication': ['document_generation', 'stakeholder_analysis', 'presentation_design'],
      'interview_coaching': ['question_generation', 'response_evaluation', 'feedback_analysis'],
      'citation_validation': ['source_verification', 'credibility_assessment', 'reference_formatting']
    };
    
    return capabilityMap[requestType] || [];
  }

  private shouldEnhanceWithNIM(requestType: string): boolean {
    // All request types benefit from NIM reasoning enhancement
    return ['business_analysis', 'product_development', 'executive_communication', 'interview_coaching'].includes(requestType);
  }

  private extractKeyConcepts(response: any, request: WorkflowRequest): string[] {
    // Simple concept extraction - in a real implementation, this would be more sophisticated
    const text = JSON.stringify(response);
    const concepts = [];
    
    // Extract key business terms
    const businessTerms = text.match(/\b(market|competitive|strategy|revenue|growth|analysis|opportunity)\b/gi);
    if (businessTerms) {
      concepts.push(...businessTerms.slice(0, 5)); // Limit to top 5
    }
    
    return [...new Set(concepts)]; // Remove duplicates
  }

  private async retrieveRelevantContext(embeddings: any): Promise<any[]> {
    // Placeholder for vector database retrieval
    // In a real implementation, this would query a vector database with the embeddings
    return [
      { content: 'Market analysis best practices', relevance: 0.9 },
      { content: 'Competitive intelligence frameworks', relevance: 0.8 }
    ];
  }

  private calculateRelevanceScore(context: any[]): number {
    if (!context || context.length === 0) return 0;
    const avgRelevance = context.reduce((sum, item) => sum + (item.relevance || 0), 0) / context.length;
    return Math.round(avgRelevance * 100) / 100;
  }

  private calculateConfidenceScore(execution: WorkflowExecution): number {
    // Calculate confidence based on successful interactions and error rate
    const interactions = execution.getInteractions();
    const successfulInteractions = interactions.filter(i => !i.error).length;
    const totalInteractions = interactions.length;
    
    if (totalInteractions === 0) return 0;
    
    const baseConfidence = successfulInteractions / totalInteractions;
    const nimBonus = execution.getNIMInvocations() > 0 ? 0.1 : 0;
    const retrievalBonus = execution.getRetrievalOperations() > 0 ? 0.1 : 0;
    
    return Math.min(1.0, baseConfidence + nimBonus + retrievalBonus);
  }

  private isRecoverableError(error: any): boolean {
    const recoverableErrors = ['TIMEOUT', 'RATE_LIMIT', 'TEMPORARY_FAILURE', 'SERVICE_UNAVAILABLE'];
    return recoverableErrors.includes(error.code);
  }

  private async loadUserPreferences(userId: string): Promise<Record<string, any>> {
    // Placeholder for user preference loading
    return {
      preferredAnalysisDepth: 'comprehensive',
      includeVisualizations: true,
      confidenceThreshold: 0.7
    };
  }

  private async logWorkflowEvent(event: string, requestId: string, data: any): Promise<void> {
    if (this.monitor) {
      await this.monitor.logCustomMetric(`workflow_${event}`, 1, { requestId, ...data });
    }
  }

  private async logWorkflowCompletion(requestId: string, duration: number, execution: WorkflowExecution): Promise<void> {
    if (this.monitor) {
      await this.monitor.logCustomMetric('workflow_completed', 1, {
        requestId,
        duration,
        interactions: execution.getInteractions().length,
        nimInvocations: execution.getNIMInvocations(),
        retrievalOperations: execution.getRetrievalOperations()
      });
    }
  }

  /**
   * Get status of all active workflows
   */
  getActiveWorkflows(): Map<string, WorkflowExecution> {
    return new Map(this.activeWorkflows);
  }

  /**
   * Cancel an active workflow
   */
  async cancelWorkflow(requestId: string): Promise<boolean> {
    const execution = this.activeWorkflows.get(requestId);
    if (execution) {
      execution.cancel();
      this.activeWorkflows.delete(requestId);
      await this.logWorkflowEvent('workflow_cancelled', requestId, {});
      return true;
    }
    return false;
  }
}

/**
 * Internal class to track workflow execution state
 */
class WorkflowExecution {
  private interactions: WorkflowInteraction[] = [];
  private cancelled = false;

  constructor(
    public readonly id: string,
    public readonly startTime: number
  ) {}

  addInteraction(action: string, agentId: string, input: any, output: any, duration: number, error?: any): void {
    this.interactions.push({
      timestamp: new Date(),
      agentId,
      action,
      input,
      output,
      duration,
      error
    } as any);
  }

  getInteractions(): WorkflowInteraction[] {
    return [...this.interactions];
  }

  getInvolvedAgents(): string[] {
    return [...new Set(this.interactions.map(i => i.agentId))];
  }

  getNIMInvocations(): number {
    return this.interactions.filter(i => i.agentId === 'nim_service').length;
  }

  getRetrievalOperations(): number {
    return this.interactions.filter(i => i.agentId === 'embedding_service').length;
  }

  cancel(): void {
    this.cancelled = true;
  }

  isCancelled(): boolean {
    return this.cancelled;
  }
}

export default EndToEndWorkflowOrchestrator;