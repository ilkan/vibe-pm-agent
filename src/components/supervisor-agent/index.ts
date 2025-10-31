/**
 * Supervisor Agent Architecture
 * 
 * Core supervisor agent implementation for orchestrating multiple Bedrock agents,
 * managing task distribution, message routing, and citation request handling.
 */

import {
  SupervisorAgent,
  AgentTask,
  AgentMessage,
  AgentResponse,
  AgentSelectionCriteria,
  ConversationContext,
  CitationContext,
  CitationResponse,
  TaskType,
  Priority,
  MessageType,
  EnhancedBedrockAgent,
  AgentCapability,
  NIMServiceManager
} from '../../interfaces/nvidia-nim-core';
import { createNIMServiceManager } from '../nim-service-manager';
import { NIMErrorHandler, NIMErrorCode } from '../../utils/nvidia-nim-error-handling';
import { 
  generateId, 
  createConversationId, 
  createTaskId, 
  createMessageId,
  BEDROCK_AGENTS_CONFIG 
} from '../../models/nvidia-nim';

// ============================================================================
// Supervisor Agent Interfaces
// ============================================================================

export interface SupervisorConfig {
  nimServiceManager?: NIMServiceManager;
  enableNIMEnhancement: boolean;
  maxConcurrentTasks: number;
  taskTimeout: number;
  messageRetentionTime: number;
  loadBalancingStrategy: 'round_robin' | 'least_loaded' | 'capability_based';
  enableCitationRouting: boolean;
  citationAgentId?: string;
}

export interface AgentRegistry {
  agents: Map<string, EnhancedBedrockAgent>;
  capabilities: Map<string, string[]>; // capability -> agent IDs
  loadMetrics: Map<string, AgentLoadMetrics>;
}

export interface AgentLoadMetrics {
  activeTasks: number;
  completedTasks: number;
  averageResponseTime: number;
  errorRate: number;
  lastActivity: Date;
}

export interface TaskQueue {
  pendingTasks: Map<string, QueuedTask>;
  activeTasks: Map<string, ActiveTask>;
  completedTasks: Map<string, CompletedTask>;
}

export interface QueuedTask {
  task: AgentTask;
  queuedAt: Date;
  priority: Priority;
  retryCount: number;
}

export interface ActiveTask {
  task: AgentTask;
  assignedAgent: string;
  startedAt: Date;
  timeout: NodeJS.Timeout;
}

export interface CompletedTask {
  task: AgentTask;
  response: AgentResponse;
  completedAt: Date;
  duration: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_SUPERVISOR_CONFIG: SupervisorConfig = {
  enableNIMEnhancement: true,
  maxConcurrentTasks: 10,
  taskTimeout: 300000, // 5 minutes
  messageRetentionTime: 3600000, // 1 hour
  loadBalancingStrategy: 'capability_based',
  enableCitationRouting: true,
  citationAgentId: 'CITATION001'
};

// ============================================================================
// Supervisor Agent Implementation
// ============================================================================

/**
 * Core supervisor agent for orchestrating multiple Bedrock agents
 */
export class SupervisorAgentImpl implements SupervisorAgent {
  private config: SupervisorConfig;
  private nimServiceManager?: NIMServiceManager;
  private agentRegistry: AgentRegistry;
  private taskQueue: TaskQueue;
  private conversations: Map<string, ConversationContext>;
  private messageHistory: Map<string, AgentMessage[]>;

  constructor(config: Partial<SupervisorConfig> = {}) {
    this.config = { ...DEFAULT_SUPERVISOR_CONFIG, ...config };
    
    // Initialize NIM service manager if enabled
    if (this.config.enableNIMEnhancement) {
      this.nimServiceManager = this.config.nimServiceManager || createNIMServiceManager();
    }

    // Initialize registries and queues
    this.agentRegistry = {
      agents: new Map(),
      capabilities: new Map(),
      loadMetrics: new Map()
    };

    this.taskQueue = {
      pendingTasks: new Map(),
      activeTasks: new Map(),
      completedTasks: new Map()
    };

    this.conversations = new Map();
    this.messageHistory = new Map();

    console.log('Supervisor Agent initialized', {
      nimEnhancement: this.config.enableNIMEnhancement,
      maxConcurrentTasks: this.config.maxConcurrentTasks,
      loadBalancingStrategy: this.config.loadBalancingStrategy
    });
  }

  // ============================================================================
  // Agent Registration and Management
  // ============================================================================

  /**
   * Register an enhanced Bedrock agent
   */
  async registerAgent(agent: EnhancedBedrockAgent): Promise<void> {
    try {
      // Register agent
      this.agentRegistry.agents.set(agent.agentId, agent);

      // Initialize load metrics
      this.agentRegistry.loadMetrics.set(agent.agentId, {
        activeTasks: 0,
        completedTasks: 0,
        averageResponseTime: 0,
        errorRate: 0,
        lastActivity: new Date()
      });

      // Register capabilities
      for (const capability of agent.capabilities) {
        const agentIds = this.agentRegistry.capabilities.get(capability.name) || [];
        agentIds.push(agent.agentId);
        this.agentRegistry.capabilities.set(capability.name, agentIds);
      }

      console.log(`Agent registered: ${agent.agentName} (${agent.agentId})`);
      console.log(`Capabilities: ${agent.capabilities.map(c => c.name).join(', ')}`);
    } catch (error) {
      throw NIMErrorHandler.createAgentError(
        `Failed to register agent ${agent.agentId}: ${error instanceof Error ? error.message : String(error)}`,
        agent.agentId
      );
    }
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agentRegistry.agents.get(agentId);
    if (!agent) {
      throw NIMErrorHandler.createAgentError('Agent not found', agentId);
    }

    // Remove from registries
    this.agentRegistry.agents.delete(agentId);
    this.agentRegistry.loadMetrics.delete(agentId);

    // Remove from capability mappings
    for (const [capability, agentIds] of this.agentRegistry.capabilities.entries()) {
      const filteredIds = agentIds.filter(id => id !== agentId);
      if (filteredIds.length === 0) {
        this.agentRegistry.capabilities.delete(capability);
      } else {
        this.agentRegistry.capabilities.set(capability, filteredIds);
      }
    }

    console.log(`Agent unregistered: ${agentId}`);
  }

  // ============================================================================
  // Task Orchestration
  // ============================================================================

  /**
   * Orchestrate agents to handle a task
   */
  async orchestrateAgents(task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`Orchestrating task: ${task.id} (${task.type})`);

      // Validate task
      this.validateTask(task);

      // Handle citation requests specially
      if (task.type === 'citation_validation' && this.config.enableCitationRouting) {
        return await this.handleCitationTask(task);
      }

      // Select optimal agent
      const selectedAgent = await this.selectOptimalAgent({
        requiredCapabilities: task.requiredCapabilities,
        loadBalancing: this.config.loadBalancingStrategy
      });

      // Queue task if no agent available
      if (!selectedAgent) {
        return await this.queueTask(task);
      }

      // Execute task
      const response = await this.executeTask(task, selectedAgent);

      // Update metrics
      this.updateAgentMetrics(selectedAgent, Date.now() - startTime, true);

      console.log(`Task completed: ${task.id} by ${selectedAgent} in ${Date.now() - startTime}ms`);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Task orchestration failed: ${task.id} after ${duration}ms`, error);
      
      throw NIMErrorHandler.createError(
        NIMErrorCode.MESSAGE_ROUTING_FAILED,
        `Task orchestration failed: ${error instanceof Error ? error.message : String(error)}`,
        { task, duration }
      );
    }
  }

  /**
   * Execute a task with a specific agent
   */
  private async executeTask(task: AgentTask, agentId: string): Promise<AgentResponse> {
    const agent = this.agentRegistry.agents.get(agentId);
    if (!agent) {
      throw NIMErrorHandler.createAgentError('Selected agent not found', agentId);
    }

    // Add to active tasks
    const timeout = setTimeout(() => {
      this.handleTaskTimeout(task.id);
    }, this.config.taskTimeout);

    this.taskQueue.activeTasks.set(task.id, {
      task,
      assignedAgent: agentId,
      startedAt: new Date(),
      timeout
    });

    // Update agent load
    const metrics = this.agentRegistry.loadMetrics.get(agentId)!;
    metrics.activeTasks++;
    metrics.lastActivity = new Date();

    try {
      let response: AgentResponse;

      // Execute based on task type and agent capabilities
      const capability = agent.capabilities.find(c => 
        task.requiredCapabilities.includes(c.name)
      );

      if (!capability) {
        throw new Error(`Agent ${agentId} lacks required capabilities: ${task.requiredCapabilities.join(', ')}`);
      }

      // Enhanced execution with NIM if enabled
      if (capability.nimEnhanced && this.nimServiceManager) {
        response = await this.executeNIMEnhancedTask(task, agent, capability);
      } else {
        response = await this.executeStandardTask(task, agent, capability);
      }

      // Clear timeout
      clearTimeout(timeout);

      // Move to completed tasks
      this.taskQueue.activeTasks.delete(task.id);
      this.taskQueue.completedTasks.set(task.id, {
        task,
        response,
        completedAt: new Date(),
        duration: Date.now() - this.taskQueue.activeTasks.get(task.id)!.startedAt.getTime()
      });

      // Update agent metrics
      metrics.activeTasks--;
      metrics.completedTasks++;

      return response;
    } catch (error) {
      // Clear timeout and cleanup
      clearTimeout(timeout);
      this.taskQueue.activeTasks.delete(task.id);
      metrics.activeTasks--;
      metrics.errorRate = (metrics.errorRate * metrics.completedTasks + 1) / (metrics.completedTasks + 1);

      throw error;
    }
  }

  /**
   * Execute NIM-enhanced task
   */
  private async executeNIMEnhancedTask(
    task: AgentTask,
    agent: EnhancedBedrockAgent,
    capability: AgentCapability
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      // Process with NIM enhancement
      const nimResponse = await agent.processWithNIM(
        JSON.stringify(task.payload),
        {
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: `You are executing a ${task.type} task with the ${capability.name} capability.`
        }
      );

      // Add retrieval augmentation if enabled
      let retrievalResponse;
      if (capability.retrievalEnabled) {
        retrievalResponse = await agent.enhanceWithRetrieval(
          JSON.stringify(task.payload),
          {
            maxResults: 5,
            similarityThreshold: 0.7,
            contextWindow: 2000
          }
        );
      }

      return {
        agentId: agent.agentId,
        taskId: task.id,
        result: {
          nimEnhanced: true,
          content: nimResponse.content,
          reasoning: nimResponse.reasoning,
          retrievalData: retrievalResponse?.retrievedDocuments || [],
          confidence: nimResponse.confidence
        },
        status: 'success',
        metadata: {
          processingTime: Date.now() - startTime,
          nimTokensUsed: nimResponse.tokensUsed,
          confidence: nimResponse.confidence,
          citations: nimResponse.citations || []
        }
      };
    } catch (error) {
      return {
        agentId: agent.agentId,
        taskId: task.id,
        result: null,
        status: 'error',
        metadata: {
          processingTime: Date.now() - startTime,
          confidence: 0
        },
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute standard task without NIM enhancement
   */
  private async executeStandardTask(
    task: AgentTask,
    agent: EnhancedBedrockAgent,
    capability: AgentCapability
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      // Simulate standard agent execution
      // In a real implementation, this would call the actual Bedrock agent
      const result = {
        standardExecution: true,
        capability: capability.name,
        taskType: task.type,
        payload: task.payload
      };

      return {
        agentId: agent.agentId,
        taskId: task.id,
        result,
        status: 'success',
        metadata: {
          processingTime: Date.now() - startTime,
          confidence: capability.confidenceThreshold
        }
      };
    } catch (error) {
      return {
        agentId: agent.agentId,
        taskId: task.id,
        result: null,
        status: 'error',
        metadata: {
          processingTime: Date.now() - startTime,
          confidence: 0
        },
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Handle citation-specific tasks
   */
  private async handleCitationTask(task: AgentTask): Promise<AgentResponse> {
    const citationAgentId = this.config.citationAgentId;
    if (!citationAgentId) {
      throw NIMErrorHandler.createError(
        NIMErrorCode.AGENT_NOT_FOUND,
        'Citation agent not configured'
      );
    }

    const citationAgent = this.agentRegistry.agents.get(citationAgentId);
    if (!citationAgent) {
      throw NIMErrorHandler.createAgentError('Citation agent not found', citationAgentId);
    }

    return await this.executeTask(task, citationAgentId);
  }

  /**
   * Queue task for later execution
   */
  private async queueTask(task: AgentTask): Promise<AgentResponse> {
    this.taskQueue.pendingTasks.set(task.id, {
      task,
      queuedAt: new Date(),
      priority: task.priority,
      retryCount: 0
    });

    console.log(`Task queued: ${task.id} (no available agents)`);

    // Return pending response
    return {
      agentId: 'supervisor',
      taskId: task.id,
      result: { status: 'queued', message: 'Task queued for execution' },
      status: 'partial',
      metadata: {
        processingTime: 0,
        confidence: 0
      }
    };
  }

  /**
   * Handle task timeout
   */
  private handleTaskTimeout(taskId: string): void {
    const activeTask = this.taskQueue.activeTasks.get(taskId);
    if (activeTask) {
      console.warn(`Task timeout: ${taskId} (agent: ${activeTask.assignedAgent})`);
      
      // Update agent metrics
      const metrics = this.agentRegistry.loadMetrics.get(activeTask.assignedAgent);
      if (metrics) {
        metrics.activeTasks--;
        metrics.errorRate = (metrics.errorRate * metrics.completedTasks + 1) / (metrics.completedTasks + 1);
      }

      // Remove from active tasks
      this.taskQueue.activeTasks.delete(taskId);
    }
  }

  // ============================================================================
  // Message Routing
  // ============================================================================

  /**
   * Route message between agents
   */
  async routeMessage(message: AgentMessage, targetAgent: string): Promise<void> {
    try {
      console.log(`Routing message from ${message.from} to ${targetAgent}`);

      // Validate target agent
      const agent = this.agentRegistry.agents.get(targetAgent);
      if (!agent) {
        throw NIMErrorHandler.createAgentError('Target agent not found', targetAgent);
      }

      // Store message in history
      const conversationMessages = this.messageHistory.get(message.conversationId) || [];
      conversationMessages.push(message);
      this.messageHistory.set(message.conversationId, conversationMessages);

      // Route to agent (in real implementation, this would use AWS Bedrock APIs)
      await agent.communicateWithSupervisor(message);

      console.log(`Message routed successfully: ${message.conversationId}`);
    } catch (error) {
      throw NIMErrorHandler.createAgentError(
        `Message routing failed: ${error instanceof Error ? error.message : String(error)}`,
        targetAgent,
        message.conversationId
      );
    }
  }

  // ============================================================================
  // Agent Selection and Load Balancing
  // ============================================================================

  /**
   * Select optimal agent based on criteria
   */
  async selectOptimalAgent(criteria: AgentSelectionCriteria): Promise<string | null> {
    try {
      // Get agents with required capabilities
      const candidateAgents = this.findAgentsWithCapabilities(criteria.requiredCapabilities);
      
      if (candidateAgents.length === 0) {
        console.warn(`No agents found with capabilities: ${criteria.requiredCapabilities.join(', ')}`);
        return null;
      }

      // Filter out excluded agents
      const filteredAgents = criteria.excludeAgents 
        ? candidateAgents.filter(id => !criteria.excludeAgents!.includes(id))
        : candidateAgents;

      if (filteredAgents.length === 0) {
        console.warn('All capable agents are excluded');
        return null;
      }

      // Apply load balancing strategy
      return this.applyLoadBalancingStrategy(filteredAgents, criteria);
    } catch (error) {
      console.error('Agent selection failed:', error);
      return null;
    }
  }

  /**
   * Find agents with required capabilities
   */
  private findAgentsWithCapabilities(requiredCapabilities: string[]): string[] {
    const candidateAgents = new Set<string>();

    for (const capability of requiredCapabilities) {
      const agentIds = this.agentRegistry.capabilities.get(capability) || [];
      
      if (candidateAgents.size === 0) {
        // First capability - add all agents
        agentIds.forEach(id => candidateAgents.add(id));
      } else {
        // Subsequent capabilities - keep only agents that have this capability too
        const intersection = new Set<string>();
        for (const id of candidateAgents) {
          if (agentIds.includes(id)) {
            intersection.add(id);
          }
        }
        candidateAgents.clear();
        intersection.forEach(id => candidateAgents.add(id));
      }
    }

    return Array.from(candidateAgents);
  }

  /**
   * Apply load balancing strategy
   */
  private applyLoadBalancingStrategy(
    candidateAgents: string[], 
    criteria: AgentSelectionCriteria
  ): string {
    switch (criteria.loadBalancing || this.config.loadBalancingStrategy) {
      case 'round_robin':
        return this.selectRoundRobin(candidateAgents);
      
      case 'least_loaded':
        return this.selectLeastLoaded(candidateAgents);
      
      case 'capability_based':
        return this.selectCapabilityBased(candidateAgents, criteria);
      
      default:
        return candidateAgents[0];
    }
  }

  /**
   * Round robin selection
   */
  private selectRoundRobin(candidateAgents: string[]): string {
    // Simple round robin based on completed tasks
    let minCompleted = Infinity;
    let selectedAgent = candidateAgents[0];

    for (const agentId of candidateAgents) {
      const metrics = this.agentRegistry.loadMetrics.get(agentId);
      if (metrics && metrics.completedTasks < minCompleted) {
        minCompleted = metrics.completedTasks;
        selectedAgent = agentId;
      }
    }

    return selectedAgent;
  }

  /**
   * Least loaded selection
   */
  private selectLeastLoaded(candidateAgents: string[]): string {
    let minLoad = Infinity;
    let selectedAgent = candidateAgents[0];

    for (const agentId of candidateAgents) {
      const metrics = this.agentRegistry.loadMetrics.get(agentId);
      if (metrics && metrics.activeTasks < minLoad) {
        minLoad = metrics.activeTasks;
        selectedAgent = agentId;
      }
    }

    return selectedAgent;
  }

  /**
   * Capability-based selection (best fit)
   */
  private selectCapabilityBased(candidateAgents: string[], criteria: AgentSelectionCriteria): string {
    let bestScore = -1;
    let selectedAgent = candidateAgents[0];

    for (const agentId of candidateAgents) {
      const agent = this.agentRegistry.agents.get(agentId);
      const metrics = this.agentRegistry.loadMetrics.get(agentId);
      
      if (!agent || !metrics) continue;

      // Calculate capability score
      const capabilityScore = this.calculateCapabilityScore(agent, criteria.requiredCapabilities);
      
      // Calculate load score (lower is better)
      const loadScore = 1 / (metrics.activeTasks + 1);
      
      // Calculate performance score
      const performanceScore = 1 / (metrics.averageResponseTime + 1);
      
      // Calculate error score (lower error rate is better)
      const errorScore = 1 - metrics.errorRate;

      // Combined score
      const totalScore = capabilityScore * 0.4 + loadScore * 0.3 + performanceScore * 0.2 + errorScore * 0.1;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        selectedAgent = agentId;
      }
    }

    return selectedAgent;
  }

  /**
   * Calculate capability score for an agent
   */
  private calculateCapabilityScore(agent: EnhancedBedrockAgent, requiredCapabilities: string[]): number {
    let score = 0;
    let totalWeight = 0;

    for (const requiredCap of requiredCapabilities) {
      const capability = agent.capabilities.find(c => c.name === requiredCap);
      if (capability) {
        const weight = capability.nimEnhanced ? 1.5 : 1.0;
        score += capability.confidenceThreshold * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  // ============================================================================
  // Conversation Context Management
  // ============================================================================

  /**
   * Maintain conversation context
   */
  async maintainContext(conversationId: string): Promise<ConversationContext> {
    try {
      let context = this.conversations.get(conversationId);
      
      if (!context) {
        // Create new conversation context
        context = {
          conversationId,
          participants: [],
          messageHistory: [],
          sharedContext: {},
          lastActivity: new Date(),
          ttl: this.config.messageRetentionTime
        };
        this.conversations.set(conversationId, context);
      }

      // Update last activity
      context.lastActivity = new Date();

      // Get message history
      const messages = this.messageHistory.get(conversationId) || [];
      context.messageHistory = messages;

      // Extract participants
      const participants = new Set<string>();
      messages.forEach(msg => {
        participants.add(msg.from);
        participants.add(msg.to);
      });
      context.participants = Array.from(participants);

      return context;
    } catch (error) {
      throw NIMErrorHandler.createError(
        NIMErrorCode.CONTEXT_LOST,
        `Failed to maintain context: ${error instanceof Error ? error.message : String(error)}`,
        { conversationId }
      );
    }
  }

  // ============================================================================
  // Citation Request Routing
  // ============================================================================

  /**
   * Route citation requests to dedicated citation agent
   */
  async requestCitation(query: string, context: CitationContext): Promise<CitationResponse> {
    try {
      if (!this.config.enableCitationRouting) {
        throw NIMErrorHandler.createError(
          NIMErrorCode.CAPABILITY_MISMATCH,
          'Citation routing is disabled'
        );
      }

      const citationAgentId = this.config.citationAgentId;
      if (!citationAgentId) {
        throw NIMErrorHandler.createError(
          NIMErrorCode.AGENT_NOT_FOUND,
          'Citation agent not configured'
        );
      }

      // Create citation task
      const citationTask: AgentTask = {
        id: createTaskId('citation_validation'),
        type: 'citation_validation',
        payload: { query, context },
        requiredCapabilities: ['validate_citations', 'source_citations'],
        priority: 'medium',
        conversationId: createConversationId(),
        timestamp: Date.now()
      };

      // Execute citation task
      const response = await this.orchestrateAgents(citationTask);

      if (response.status === 'success' && response.result) {
        return response.result as CitationResponse;
      } else {
        throw new Error(response.error || 'Citation request failed');
      }
    } catch (error) {
      throw NIMErrorHandler.createError(
        NIMErrorCode.MESSAGE_ROUTING_FAILED,
        `Citation request failed: ${error instanceof Error ? error.message : String(error)}`,
        { query, context }
      );
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Validate task before execution
   */
  private validateTask(task: AgentTask): void {
    if (!task.id || !task.type || !task.conversationId) {
      throw NIMErrorHandler.createError(
        NIMErrorCode.INVALID_REQUEST,
        'Task missing required fields: id, type, conversationId'
      );
    }

    if (!task.requiredCapabilities || task.requiredCapabilities.length === 0) {
      throw NIMErrorHandler.createError(
        NIMErrorCode.INVALID_REQUEST,
        'Task must specify required capabilities'
      );
    }
  }

  /**
   * Update agent metrics
   */
  private updateAgentMetrics(agentId: string, responseTime: number, success: boolean): void {
    const metrics = this.agentRegistry.loadMetrics.get(agentId);
    if (!metrics) return;

    // Update average response time
    const totalTasks = metrics.completedTasks + 1;
    metrics.averageResponseTime = (metrics.averageResponseTime * metrics.completedTasks + responseTime) / totalTasks;

    // Update error rate
    if (!success) {
      metrics.errorRate = (metrics.errorRate * metrics.completedTasks + 1) / totalTasks;
    } else {
      metrics.errorRate = (metrics.errorRate * metrics.completedTasks) / totalTasks;
    }

    metrics.lastActivity = new Date();
  }

  /**
   * Get supervisor status and metrics
   */
  getStatus(): {
    registeredAgents: number;
    activeTasks: number;
    pendingTasks: number;
    completedTasks: number;
    activeConversations: number;
    agentMetrics: Record<string, AgentLoadMetrics>;
  } {
    const agentMetrics: Record<string, AgentLoadMetrics> = {};
    this.agentRegistry.loadMetrics.forEach((metrics, agentId) => {
      agentMetrics[agentId] = { ...metrics };
    });

    return {
      registeredAgents: this.agentRegistry.agents.size,
      activeTasks: this.taskQueue.activeTasks.size,
      pendingTasks: this.taskQueue.pendingTasks.size,
      completedTasks: this.taskQueue.completedTasks.size,
      activeConversations: this.conversations.size,
      agentMetrics
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Clear all timeouts
    for (const activeTask of this.taskQueue.activeTasks.values()) {
      clearTimeout(activeTask.timeout);
    }

    // Clear all data structures
    this.taskQueue.activeTasks.clear();
    this.taskQueue.pendingTasks.clear();
    this.conversations.clear();
    this.messageHistory.clear();

    // Cleanup NIM service manager
    if (this.nimServiceManager && 'cleanup' in this.nimServiceManager) {
      await (this.nimServiceManager as any).cleanup();
    }

    console.log('Supervisor Agent cleaned up');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a supervisor agent with default configuration
 */
export function createSupervisorAgent(config: Partial<SupervisorConfig> = {}): SupervisorAgent {
  return new SupervisorAgentImpl(config);
}

/**
 * Create a supervisor agent with NIM enhancement
 */
export function createNIMEnhancedSupervisorAgent(
  nimServiceManager: NIMServiceManager,
  config: Partial<SupervisorConfig> = {}
): SupervisorAgent {
  return new SupervisorAgentImpl({
    ...config,
    nimServiceManager,
    enableNIMEnhancement: true
  });
}

/**
 * Create a supervisor agent for development/testing
 */
export function createDevelopmentSupervisorAgent(): SupervisorAgent {
  return new SupervisorAgentImpl({
    enableNIMEnhancement: false,
    maxConcurrentTasks: 5,
    taskTimeout: 60000, // 1 minute
    loadBalancingStrategy: 'round_robin'
  });
}