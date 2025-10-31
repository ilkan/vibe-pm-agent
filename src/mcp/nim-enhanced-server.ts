/**
 * NIM-Enhanced MCP Server
 * 
 * Extends the existing PMAgentMCPServer with NVIDIA NIM integration capabilities
 * for llama-3.1-nemotron-nano-8B-v1 and Retrieval Embedding NIM services.
 */

import { PMAgentMCPServer } from './server';
import { 
  NIMServiceManager,
  SupervisorAgent,
  EnhancedBedrockAgent,
  AgentTask,
  AgentMessage,
  ChatCompletionRequest,
  EmbeddingRequest,
  NIMConfig,
  NIMError,
  NIMErrorCode
} from '../interfaces/nvidia-nim-core';
import { 
  createNIMServiceManager,
  createLocalNIMServiceManager,
  createProductionNIMServiceManager 
} from '../components/nim-service-manager';
import { createSupervisorAgent } from '../components/supervisor-agent';
import { MCPServerOptions, MCPToolContext, MCPToolResult } from '../models/mcp';
import { MCPLogger, MCPErrorHandler } from '../utils/mcp-error-handling';
import { loadAWSCredentials } from '../utils/credential-manager';

// ============================================================================
// NIM-Enhanced Server Configuration
// ============================================================================

export interface NIMEnhancedServerOptions extends MCPServerOptions {
  // NIM Service Configuration
  nimConfig?: Partial<NIMConfig>;
  enableLocalTesting?: boolean;
  localNIMEndpoint?: string;
  
  // AWS Credentials Configuration
  awsCredentialsPath?: string;
  
  // Agent Configuration
  enableSupervisorAgent?: boolean;
  enableCitationAgent?: boolean;
  citationAgentId?: string;
  
  // Bedrock Agent IDs (existing agents to enhance)
  bedrockAgents?: {
    businessStrategyAgentId?: string;    // IBQRX8MZJJ
    productDevelopmentAgentId?: string;  // CEW45LTT2P
    executiveCommunicationsAgentId?: string; // ULX1RJGKCR
    caseStudyCoachingAgentId?: string;   // PDZPQTNLYH
    citationAgentId?: string;            // New 5th agent
  };
  
  // Performance and Monitoring
  enableNIMMetrics?: boolean;
  enableHealthChecks?: boolean;
  healthCheckInterval?: number;
}

export const DEFAULT_NIM_ENHANCED_OPTIONS: Partial<NIMEnhancedServerOptions> = {
  enableLocalTesting: false,
  localNIMEndpoint: 'http://localhost:1234',
  awsCredentialsPath: '.aws/credentials',
  enableSupervisorAgent: true,
  enableCitationAgent: true,
  citationAgentId: 'CITATION001',
  bedrockAgents: {
    businessStrategyAgentId: 'IBQRX8MZJJ',
    productDevelopmentAgentId: 'CEW45LTT2P',
    executiveCommunicationsAgentId: 'ULX1RJGKCR',
    caseStudyCoachingAgentId: 'PDZPQTNLYH',
    citationAgentId: 'CITATION001'
  },
  enableNIMMetrics: true,
  enableHealthChecks: true,
  healthCheckInterval: 30000 // 30 seconds
};

// ============================================================================
// NIM-Enhanced MCP Server Implementation
// ============================================================================

/**
 * NIM-Enhanced PM Agent MCP Server
 * 
 * Extends the base PMAgentMCPServer with NVIDIA NIM capabilities,
 * supervisor agent orchestration, and enhanced Bedrock agent integration.
 */
export class NIMEnhancedMCPServer extends PMAgentMCPServer {
  private nimServiceManager?: NIMServiceManager;
  private supervisorAgent?: SupervisorAgent;
  private nimOptions: NIMEnhancedServerOptions;
  private enhancedAgents: Map<string, EnhancedBedrockAgent> = new Map();
  private awsCredentials?: any;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(options: NIMEnhancedServerOptions = {}) {
    // Initialize base MCP server
    super(options);
    
    this.nimOptions = { ...DEFAULT_NIM_ENHANCED_OPTIONS, ...options };
    
    MCPLogger.info('Initializing NIM-Enhanced MCP Server', undefined, {
      enableLocalTesting: this.nimOptions.enableLocalTesting,
      enableSupervisorAgent: this.nimOptions.enableSupervisorAgent,
      enableCitationAgent: this.nimOptions.enableCitationAgent
    });

    // Initialize NIM services
    this.initializeNIMServices();
  }

  // ============================================================================
  // NIM Service Initialization
  // ============================================================================

  /**
   * Initialize NVIDIA NIM services and supervisor agent
   */
  private async initializeNIMServices(): Promise<void> {
    try {
      // Load AWS credentials if specified
      if (this.nimOptions.awsCredentialsPath) {
        try {
          this.awsCredentials = await loadAWSCredentials(this.nimOptions.awsCredentialsPath);
          MCPLogger.info('AWS credentials loaded successfully', undefined, {
            credentialsPath: this.nimOptions.awsCredentialsPath
          });
        } catch (error) {
          MCPLogger.warn('Failed to load AWS credentials', undefined, {
            error: error instanceof Error ? error.message : String(error),
            credentialsPath: this.nimOptions.awsCredentialsPath
          });
        }
      }

      // Initialize NIM Service Manager
      await this.initializeNIMServiceManager();

      // Initialize Supervisor Agent
      if (this.nimOptions.enableSupervisorAgent) {
        await this.initializeSupervisorAgent();
      }

      // Register enhanced Bedrock agents
      await this.registerEnhancedBedrockAgents();

      // Start health monitoring
      if (this.nimOptions.enableHealthChecks) {
        this.startHealthMonitoring();
      }

      MCPLogger.info('NIM services initialized successfully', undefined, {
        nimServiceManager: !!this.nimServiceManager,
        supervisorAgent: !!this.supervisorAgent,
        enhancedAgents: this.enhancedAgents.size
      });
    } catch (error) {
      MCPLogger.error('Failed to initialize NIM services', error as Error, undefined);
      throw error;
    }
  }

  /**
   * Initialize NVIDIA NIM Service Manager
   */
  private async initializeNIMServiceManager(): Promise<void> {
    try {
      if (this.nimOptions.enableLocalTesting) {
        // Local testing configuration
        this.nimServiceManager = createLocalNIMServiceManager(
          this.nimOptions.localNIMEndpoint,
          this.nimOptions.nimConfig
        );
        MCPLogger.info('Local NIM Service Manager initialized', undefined, {
          endpoint: this.nimOptions.localNIMEndpoint
        });
      } else {
        // Production configuration
        const apiKey = this.awsCredentials?.nim_api_key || process.env.NIM_API_KEY;
        if (!apiKey) {
          throw new Error('NIM API key not found in credentials or environment');
        }
        
        this.nimServiceManager = createProductionNIMServiceManager(
          apiKey,
          this.nimOptions.nimConfig
        );
        MCPLogger.info('Production NIM Service Manager initialized');
      }

      // Test NIM service health
      const health = await this.nimServiceManager.checkHealth();
      if (health.status !== 'healthy') {
        MCPLogger.warn('NIM service health check failed', undefined, { health });
      }
    } catch (error) {
      MCPLogger.error('Failed to initialize NIM Service Manager', error as Error, undefined);
      throw error;
    }
  }

  /**
   * Initialize Supervisor Agent
   */
  private async initializeSupervisorAgent(): Promise<void> {
    try {
      this.supervisorAgent = createSupervisorAgent({
        nimServiceManager: this.nimServiceManager,
        enableNIMEnhancement: true,
        enableCitationRouting: this.nimOptions.enableCitationAgent,
        citationAgentId: this.nimOptions.citationAgentId
      });

      MCPLogger.info('Supervisor Agent initialized', undefined, {
        enableCitationRouting: this.nimOptions.enableCitationAgent,
        citationAgentId: this.nimOptions.citationAgentId
      });
    } catch (error) {
      MCPLogger.error('Failed to initialize Supervisor Agent', error as Error, undefined);
      throw error;
    }
  }

  /**
   * Register enhanced Bedrock agents with NIM capabilities
   */
  private async registerEnhancedBedrockAgents(): Promise<void> {
    const agentConfigs = this.nimOptions.bedrockAgents;
    if (!agentConfigs) return;

    try {
      // Business Strategy Agent (IBQRX8MZJJ)
      if (agentConfigs.businessStrategyAgentId) {
        const businessAgent = await this.createEnhancedBedrockAgent(
          agentConfigs.businessStrategyAgentId,
          'Business Strategy Agent',
          [
            {
              name: 'analyze_business_opportunity',
              description: 'Enhanced business opportunity analysis with NIM reasoning',
              inputSchema: {},
              outputSchema: {},
              nimEnhanced: true,
              retrievalEnabled: true,
              confidenceThreshold: 0.8
            },
            {
              name: 'market_analysis',
              description: 'Market analysis with competitive intelligence',
              inputSchema: {},
              outputSchema: {},
              nimEnhanced: true,
              retrievalEnabled: true,
              confidenceThreshold: 0.75
            }
          ]
        );
        this.enhancedAgents.set(agentConfigs.businessStrategyAgentId, businessAgent);
        
        if (this.supervisorAgent) {
          await this.supervisorAgent.registerAgent(businessAgent);
        }
      }

      // Product Development Agent (CEW45LTT2P)
      if (agentConfigs.productDevelopmentAgentId) {
        const productAgent = await this.createEnhancedBedrockAgent(
          agentConfigs.productDevelopmentAgentId,
          'Product Development Agent',
          [
            {
              name: 'generate_requirements',
              description: 'Enhanced requirements generation with NIM analysis',
              inputSchema: {},
              outputSchema: {},
              nimEnhanced: true,
              retrievalEnabled: false,
              confidenceThreshold: 0.85
            },
            {
              name: 'generate_design_options',
              description: 'Advanced architecture planning with NIM',
              inputSchema: {},
              outputSchema: {},
              nimEnhanced: true,
              retrievalEnabled: true,
              confidenceThreshold: 0.8
            }
          ]
        );
        this.enhancedAgents.set(agentConfigs.productDevelopmentAgentId, productAgent);
        
        if (this.supervisorAgent) {
          await this.supervisorAgent.registerAgent(productAgent);
        }
      }

      // Executive Communications Agent (ULX1RJGKCR)
      if (agentConfigs.executiveCommunicationsAgentId) {
        const execAgent = await this.createEnhancedBedrockAgent(
          agentConfigs.executiveCommunicationsAgentId,
          'Executive Communications Agent',
          [
            {
              name: 'generate_management_onepager',
              description: 'Enhanced executive document generation with NIM',
              inputSchema: {},
              outputSchema: {},
              nimEnhanced: true,
              retrievalEnabled: false,
              confidenceThreshold: 0.9
            },
            {
              name: 'create_stakeholder_communication',
              description: 'Optimized stakeholder communication with intelligent insights',
              inputSchema: {},
              outputSchema: {},
              nimEnhanced: true,
              retrievalEnabled: true,
              confidenceThreshold: 0.85
            }
          ]
        );
        this.enhancedAgents.set(agentConfigs.executiveCommunicationsAgentId, execAgent);
        
        if (this.supervisorAgent) {
          await this.supervisorAgent.registerAgent(execAgent);
        }
      }

      // Case Study Coaching Agent (PDZPQTNLYH)
      if (agentConfigs.caseStudyCoachingAgentId) {
        const caseStudyAgent = await this.createEnhancedBedrockAgent(
          agentConfigs.caseStudyCoachingAgentId,
          'Case Study Coaching Agent',
          [
            {
              name: 'generate_interview_questions',
              description: 'NIM-powered interview question generation',
              inputSchema: {},
              outputSchema: {},
              nimEnhanced: true,
              retrievalEnabled: false,
              confidenceThreshold: 0.8
            },
            {
              name: 'evaluate_responses',
              description: 'Intelligent assessment with advanced reasoning',
              inputSchema: {},
              outputSchema: {},
              nimEnhanced: true,
              retrievalEnabled: true,
              confidenceThreshold: 0.85
            }
          ]
        );
        this.enhancedAgents.set(agentConfigs.interviewCoachingAgentId, interviewAgent);
        
        if (this.supervisorAgent) {
          await this.supervisorAgent.registerAgent(interviewAgent);
        }
      }

      // Citation Agent (New 5th agent)
      if (agentConfigs.citationAgentId && this.nimOptions.enableCitationAgent) {
        const citationAgent = await this.createEnhancedBedrockAgent(
          agentConfigs.citationAgentId,
          'Citation Agent',
          [
            {
              name: 'validate_citations',
              description: 'NIM-powered citation validation and quality assessment',
              inputSchema: {},
              outputSchema: {},
              nimEnhanced: true,
              retrievalEnabled: true,
              confidenceThreshold: 0.9
            },
            {
              name: 'source_citations',
              description: 'Intelligent citation sourcing and verification',
              inputSchema: {},
              outputSchema: {},
              nimEnhanced: true,
              retrievalEnabled: true,
              confidenceThreshold: 0.85
            }
          ]
        );
        this.enhancedAgents.set(agentConfigs.citationAgentId, citationAgent);
        
        if (this.supervisorAgent) {
          await this.supervisorAgent.registerAgent(citationAgent);
        }
      }

      MCPLogger.info('Enhanced Bedrock agents registered', undefined, {
        agentCount: this.enhancedAgents.size,
        agentIds: Array.from(this.enhancedAgents.keys())
      });
    } catch (error) {
      MCPLogger.error('Failed to register enhanced Bedrock agents', error as Error, undefined);
      throw error;
    }
  }

  /**
   * Create an enhanced Bedrock agent with NIM capabilities
   */
  private async createEnhancedBedrockAgent(
    agentId: string,
    agentName: string,
    capabilities: any[]
  ): Promise<EnhancedBedrockAgent> {
    return {
      agentId,
      agentName,
      capabilities,

      // NIM integration
      processWithNIM: async (input: string, context?) => {
        if (!this.nimServiceManager) {
          throw new Error('NIM Service Manager not initialized');
        }

        const request: ChatCompletionRequest = {
          model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
          messages: [
            {
              role: 'system',
              content: context?.systemPrompt || `You are ${agentName} with enhanced reasoning capabilities.`
            },
            {
              role: 'user',
              content: input
            }
          ],
          temperature: context?.temperature || 0.7,
          max_tokens: context?.maxTokens || 1000
        };

        const response = await this.nimServiceManager.generateChatCompletion(request);
        const choice = response.choices[0];

        return {
          content: choice.message.content,
          reasoning: `Enhanced reasoning from ${agentName}`,
          confidence: 0.85,
          tokensUsed: response.usage.total_tokens,
          processingTime: Date.now(),
          citations: []
        };
      },

      // Retrieval augmentation
      enhanceWithRetrieval: async (query: string, context?) => {
        if (!this.nimServiceManager) {
          throw new Error('NIM Service Manager not initialized');
        }

        // Generate embeddings for retrieval
        const embeddingRequest: EmbeddingRequest = {
          input: query,
          model: 'retrieval-embedding-nim'
        };

        const embeddings = await this.nimServiceManager.generateEmbeddings(embeddingRequest);

        // Simulate retrieval (in real implementation, this would query a vector database)
        return {
          enhancedContent: `Enhanced content for: ${query}`,
          retrievedDocuments: [
            {
              id: 'doc1',
              content: 'Retrieved document content',
              similarity: 0.85,
              metadata: { source: 'knowledge_base' }
            }
          ],
          confidence: 0.8,
          processingTime: Date.now()
        };
      },

      // Supervisor communication
      communicateWithSupervisor: async (message: AgentMessage) => {
        if (this.supervisorAgent) {
          await this.supervisorAgent.routeMessage(message, 'supervisor');
        }
      },

      // Capability management
      registerCapabilities: async (newCapabilities: any[]) => {
        capabilities.push(...newCapabilities);
      },

      updateCapability: async (capabilityName: string, updates: any) => {
        const capability = capabilities.find(c => c.name === capabilityName);
        if (capability) {
          Object.assign(capability, updates);
        }
      }
    };
  }

  // ============================================================================
  // Enhanced Tool Execution
  // ============================================================================

  /**
   * Override tool execution to include NIM enhancement
   */
  public async invokeTool(
    name: string,
    args: any,
    overrides: Partial<MCPToolContext> = {}
  ): Promise<MCPToolResult> {
    const startTime = Date.now();
    const context = { ...overrides, timestamp: startTime };

    try {
      // Check if this tool should be enhanced with NIM
      const shouldEnhanceWithNIM = this.shouldEnhanceToolWithNIM(name, args);
      
      if (shouldEnhanceWithNIM && this.supervisorAgent) {
        return await this.executeNIMEnhancedTool(name, args, context);
      } else {
        // Fall back to standard execution
        return await super.invokeTool(name, args, overrides);
      }
    } catch (error) {
      MCPLogger.error('NIM-enhanced tool execution failed', error as Error, context, {
        toolName: name,
        executionTime: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Determine if a tool should be enhanced with NIM
   */
  private shouldEnhanceToolWithNIM(toolName: string, args: any): boolean {
    // Tools that benefit from NIM enhancement
    const nimEnhancedTools = [
      'analyze_business_opportunity',
      'generate_requirements',
      'generate_design_options',
      'generate_management_onepager',
      'create_stakeholder_communication',
      'validate_citations'
    ];

    return nimEnhancedTools.includes(toolName) && !!this.nimServiceManager;
  }

  /**
   * Execute tool with NIM enhancement through supervisor agent
   */
  private async executeNIMEnhancedTool(
    toolName: string,
    args: any,
    context: MCPToolContext
  ): Promise<MCPToolResult> {
    if (!this.supervisorAgent) {
      throw new Error('Supervisor agent not initialized');
    }

    try {
      // Create agent task
      const task: AgentTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: this.mapToolNameToTaskType(toolName),
        payload: args,
        requiredCapabilities: [toolName],
        priority: 'medium',
        conversationId: context.sessionId || 'default',
        timestamp: Date.now()
      };

      // Execute through supervisor agent
      const response = await this.supervisorAgent.orchestrateAgents(task);

      if (response.status === 'success') {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.result, null, 2)
            }
          ],
          isError: false,
          metadata: {
            executionTime: Date.now() - context.timestamp,
            quotaUsed: response.metadata.nimTokensUsed || 1,
            nimEnhanced: true,
            agentId: response.agentId,
            confidence: response.metadata.confidence,
            citations: response.metadata.citations
          }
        };
      } else {
        throw new Error(response.error || 'Agent execution failed');
      }
    } catch (error) {
      MCPLogger.error('NIM-enhanced tool execution failed', error as Error, context);
      throw error;
    }
  }

  /**
   * Map tool names to task types
   */
  private mapToolNameToTaskType(toolName: string): any {
    const mapping: Record<string, any> = {
      'analyze_business_opportunity': 'business_analysis',
      'generate_requirements': 'product_development',
      'generate_design_options': 'product_development',
      'generate_management_onepager': 'executive_communication',
      'create_stakeholder_communication': 'executive_communication',
      'validate_citations': 'citation_validation'
    };

    return mapping[toolName] || 'business_analysis';
  }

  // ============================================================================
  // Health Monitoring
  // ============================================================================

  /**
   * Start health monitoring for NIM services
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        MCPLogger.error('Health check failed', error as Error, undefined);
      }
    }, this.nimOptions.healthCheckInterval || 30000);

    MCPLogger.info('Health monitoring started', undefined, {
      interval: this.nimOptions.healthCheckInterval || 30000
    });
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    const healthResults: any = {};

    // Check NIM service health
    if (this.nimServiceManager) {
      try {
        const nimHealth = await this.nimServiceManager.checkHealth();
        healthResults.nimService = nimHealth;
      } catch (error) {
        healthResults.nimService = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    // Check supervisor agent health
    if (this.supervisorAgent) {
      try {
        const supervisorStatus = (this.supervisorAgent as any).getStatus?.();
        healthResults.supervisorAgent = supervisorStatus;
      } catch (error) {
        healthResults.supervisorAgent = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    // Log health status
    const overallHealthy = Object.values(healthResults).every((result: any) => 
      result.status === 'healthy' || result.status === undefined
    );

    if (!overallHealthy) {
      MCPLogger.warn('Health check detected issues', undefined, healthResults);
    }
  }

  // ============================================================================
  // Enhanced Server Status and Metrics
  // ============================================================================

  /**
   * Get enhanced server status including NIM metrics
   */
  public async getEnhancedStatus(): Promise<any> {
    const baseStatus = this.getHealthStatus();
    const enhancedStatus: any = {
      ...baseStatus,
      nimEnhanced: true,
      nimServices: {}
    };

    // Add NIM service metrics
    if (this.nimServiceManager) {
      try {
        const nimHealth = await this.nimServiceManager.checkHealth();
        const nimMetrics = await this.nimServiceManager.getMetrics();
        
        enhancedStatus.nimServices = {
          health: nimHealth,
          metrics: nimMetrics,
          configuration: this.nimServiceManager.getConfiguration()
        };
      } catch (error) {
        enhancedStatus.nimServices = {
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    // Add supervisor agent status
    if (this.supervisorAgent) {
      try {
        enhancedStatus.supervisorAgent = (this.supervisorAgent as any).getStatus?.();
      } catch (error) {
        enhancedStatus.supervisorAgent = {
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    // Add enhanced agents status
    enhancedStatus.enhancedAgents = {
      count: this.enhancedAgents.size,
      agents: Array.from(this.enhancedAgents.keys())
    };

    return enhancedStatus;
  }

  // ============================================================================
  // Cleanup and Shutdown
  // ============================================================================

  /**
   * Enhanced cleanup including NIM services
   */
  public async stop(): Promise<void> {
    try {
      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      // Cleanup supervisor agent
      if (this.supervisorAgent && 'cleanup' in this.supervisorAgent) {
        await (this.supervisorAgent as any).cleanup();
      }

      // Cleanup NIM service manager
      if (this.nimServiceManager && 'cleanup' in this.nimServiceManager) {
        await (this.nimServiceManager as any).cleanup();
      }

      // Call base cleanup
      await super.stop();

      MCPLogger.info('NIM-Enhanced MCP Server stopped successfully');
    } catch (error) {
      MCPLogger.error('Error during NIM-Enhanced server shutdown', error as Error, undefined);
      throw error;
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create NIM-Enhanced MCP Server with default configuration
 */
export function createNIMEnhancedMCPServer(
  options: NIMEnhancedServerOptions = {}
): NIMEnhancedMCPServer {
  return new NIMEnhancedMCPServer(options);
}

/**
 * Create NIM-Enhanced MCP Server for local development
 */
export function createLocalNIMEnhancedMCPServer(
  localEndpoint: string = 'http://localhost:1234',
  options: NIMEnhancedServerOptions = {}
): NIMEnhancedMCPServer {
  return new NIMEnhancedMCPServer({
    ...options,
    enableLocalTesting: true,
    localNIMEndpoint: localEndpoint,
    enableHealthChecks: true,
    healthCheckInterval: 60000 // 1 minute for local testing
  });
}

/**
 * Create NIM-Enhanced MCP Server for production
 */
export function createProductionNIMEnhancedMCPServer(
  awsCredentialsPath: string,
  options: NIMEnhancedServerOptions = {}
): NIMEnhancedMCPServer {
  return new NIMEnhancedMCPServer({
    ...options,
    enableLocalTesting: false,
    awsCredentialsPath,
    enableHealthChecks: true,
    enableNIMMetrics: true,
    healthCheckInterval: 30000 // 30 seconds for production
  });
}