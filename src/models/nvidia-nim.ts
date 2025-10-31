/**
 * NVIDIA NIM Agentic Platform Data Models
 * 
 * Data models and validation schemas for NVIDIA NIM integration,
 * agent orchestration, and AWS deployment configuration.
 */

import {
  NIMConfig,
  AgentProtocol,
  DeploymentConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  AgentTask,
  AgentMessage,
  AgentResponse,
  AgentCapability,
  NIMServiceHealth,
  NIMPerformanceMetrics,
  ConversationContext,
  RetryPolicy,
  ScalingConfig,
  ResourceRequirements,
  NetworkConfig,
  SecurityConfig,
  MonitoringConfig,
  NIMErrorCode,
  TaskType,
  Priority,
  MessageType,
  AuthMethod
} from '../interfaces/nvidia-nim-core';

// ============================================================================
// Configuration Models with Validation
// ============================================================================

/**
 * Default NIM configuration for development and production
 */
export const DEFAULT_NIM_CONFIG: NIMConfig = {
  // Service endpoints
  chatEndpoint: 'https://api.nvidia.com/v1/chat/completions',
  embeddingEndpoint: 'https://api.nvidia.com/v1/embeddings',
  
  // Model configuration
  chatModel: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
  embeddingModel: 'nvidia-retrieval-embedding-nim',
  
  // Performance settings
  timeout: 30000, // 30 seconds
  
  // Default retry policy
  retryPolicy: {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 1000,
    maxDelay: 10000,
    retryableErrors: [
      'TIMEOUT',
      'SERVICE_UNAVAILABLE',
      'RATE_LIMIT_EXCEEDED',
      'NETWORK_ERROR'
    ]
  },
  
  // Default scaling configuration
  scalingConfig: {
    minInstances: 1,
    maxInstances: 10,
    targetUtilization: 70,
    scaleUpCooldown: 300,
    scaleDownCooldown: 600,
    autoScalingEnabled: true
  },
  
  // Local testing configuration
  localTestingEnabled: false,
  localEndpoint: 'http://localhost:1234'
};

/**
 * Default agent protocol configuration
 */
export const DEFAULT_AGENT_PROTOCOL: AgentProtocol = {
  version: '1.0.0',
  messageFormat: {
    headers: {
      'Content-Type': 'application/json',
      'X-Agent-Protocol-Version': '1.0.0'
    },
    payload: {},
    metadata: {
      timestamp: 0,
      messageId: '',
      priority: 'medium' as Priority,
      ttl: 300000 // 5 minutes
    }
  },
  authenticationMethod: 'iam_role' as AuthMethod,
  encryptionEnabled: true,
  compressionEnabled: false
};

/**
 * Default deployment configuration for EKS
 */
export const DEFAULT_EKS_DEPLOYMENT_CONFIG: DeploymentConfig = {
  platform: 'EKS',
  region: 'us-west-2',
  environment: 'development',
  
  resourceRequirements: {
    cpu: '2000m',
    memory: '8Gi',
    gpu: {
      type: 'nvidia-tesla-v100',
      count: 1,
      memoryGB: 16,
      computeCapability: '7.0'
    },
    storage: '50Gi',
    networkBandwidth: '10Gbps'
  },
  
  networkConfig: {
    subnetIds: [],
    securityGroupIds: [],
    loadBalancerConfig: {
      type: 'application',
      scheme: 'internal',
      healthCheckPath: '/health',
      healthCheckInterval: 30
    },
    serviceDiscovery: {
      namespace: 'nim-services',
      serviceName: 'nvidia-nim-platform',
      dnsConfig: {
        ttl: 60,
        routingPolicy: 'multivalue'
      }
    }
  },
  
  securityConfig: {
    iamRoleArn: '',
    encryptionAtRest: true,
    encryptionInTransit: true,
    networkPolicies: [],
    accessControlPolicies: []
  },
  
  monitoringConfig: {
    cloudWatchEnabled: true,
    xrayTracingEnabled: true,
    customMetrics: [
      {
        name: 'NIMRequestLatency',
        namespace: 'NVIDIA/NIM',
        dimensions: { Service: 'ChatCompletion' },
        unit: 'Milliseconds'
      },
      {
        name: 'NIMTokensPerSecond',
        namespace: 'NVIDIA/NIM',
        dimensions: { Service: 'ChatCompletion' },
        unit: 'Count/Second'
      }
    ],
    alertingConfig: {
      alertThresholds: [
        {
          metricName: 'NIMRequestLatency',
          threshold: 5000,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          severity: 'high'
        }
      ]
    },
    loggingConfig: {
      logLevel: 'info',
      logGroups: [
        {
          name: '/aws/eks/nim-platform',
          logStream: 'nim-service'
        }
      ],
      retentionDays: 30,
      structuredLogging: true
    }
  }
};

/**
 * Default deployment configuration for SageMaker
 */
export const DEFAULT_SAGEMAKER_DEPLOYMENT_CONFIG: DeploymentConfig = {
  ...DEFAULT_EKS_DEPLOYMENT_CONFIG,
  platform: 'SageMaker',
  
  resourceRequirements: {
    cpu: '4000m',
    memory: '16Gi',
    gpu: {
      type: 'nvidia-a100',
      count: 1,
      memoryGB: 40,
      computeCapability: '8.0'
    },
    storage: '100Gi'
  },
  
  monitoringConfig: {
    ...DEFAULT_EKS_DEPLOYMENT_CONFIG.monitoringConfig,
    customMetrics: [
      ...DEFAULT_EKS_DEPLOYMENT_CONFIG.monitoringConfig.customMetrics,
      {
        name: 'SageMakerEndpointInvocations',
        namespace: 'AWS/SageMaker',
        dimensions: { EndpointName: 'nvidia-nim-endpoint' },
        unit: 'Count'
      }
    ]
  }
};

// ============================================================================
// Agent Configuration Models
// ============================================================================

/**
 * Bedrock agent configurations for NIM enhancement
 */
export interface BedrockAgentConfig {
  agentId: string;
  agentName: string;
  agentArn: string;
  description: string;
  capabilities: AgentCapability[];
  nimIntegrationEnabled: boolean;
  retrievalEnabled: boolean;
  citationEnabled: boolean;
}

/**
 * Pre-configured Bedrock agents for NIM enhancement
 */
export const BEDROCK_AGENTS_CONFIG: Record<string, BedrockAgentConfig> = {
  BUSINESS_STRATEGY: {
    agentId: 'IBQRX8MZJJ',
    agentName: 'Business Strategy Agent',
    agentArn: 'arn:aws:bedrock:us-west-2:account:agent/IBQRX8MZJJ',
    description: 'Enhanced business opportunity analysis with NIM-powered reasoning',
    capabilities: [
      {
        name: 'analyze_business_opportunity',
        description: 'Analyze market opportunities with NIM-enhanced reasoning',
        inputSchema: { type: 'object', properties: { idea: { type: 'string' } } },
        outputSchema: { type: 'object', properties: { analysis: { type: 'object' } } },
        nimEnhanced: true,
        retrievalEnabled: true,
        confidenceThreshold: 0.8
      }
    ],
    nimIntegrationEnabled: true,
    retrievalEnabled: true,
    citationEnabled: true
  },
  
  CITATION_AGENT: {
    agentId: 'CITATION001',
    agentName: 'Citation Agent',
    agentArn: 'arn:aws:bedrock:us-west-2:account:agent/CITATION001',
    description: 'Dedicated citation validation and sourcing with NIM-powered quality assessment',
    capabilities: [
      {
        name: 'validate_citations',
        description: 'Validate citation quality and credibility with NIM analysis',
        inputSchema: { type: 'object', properties: { citations: { type: 'array' } } },
        outputSchema: { type: 'object', properties: { validation: { type: 'object' } } },
        nimEnhanced: true,
        retrievalEnabled: true,
        confidenceThreshold: 0.9
      },
      {
        name: 'source_citations',
        description: 'Find and source relevant citations for content',
        inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
        outputSchema: { type: 'object', properties: { citations: { type: 'array' } } },
        nimEnhanced: true,
        retrievalEnabled: true,
        confidenceThreshold: 0.85
      }
    ],
    nimIntegrationEnabled: true,
    retrievalEnabled: true,
    citationEnabled: false // This IS the citation agent
  },
  
  PRODUCT_DEVELOPMENT: {
    agentId: 'CEW45LTT2P',
    agentName: 'Product Development Agent',
    agentArn: 'arn:aws:bedrock:us-west-2:account:agent/CEW45LTT2P',
    description: 'Enhanced product development with NIM-powered code analysis and architecture planning',
    capabilities: [
      {
        name: 'generate_requirements',
        description: 'Generate product requirements with NIM-enhanced analysis',
        inputSchema: { type: 'object', properties: { intent: { type: 'string' } } },
        outputSchema: { type: 'object', properties: { requirements: { type: 'object' } } },
        nimEnhanced: true,
        retrievalEnabled: false,
        confidenceThreshold: 0.75
      },
      {
        name: 'generate_design_options',
        description: 'Generate design options with NIM-powered architecture analysis',
        inputSchema: { type: 'object', properties: { requirements: { type: 'string' } } },
        outputSchema: { type: 'object', properties: { design: { type: 'object' } } },
        nimEnhanced: true,
        retrievalEnabled: true,
        confidenceThreshold: 0.8
      }
    ],
    nimIntegrationEnabled: true,
    retrievalEnabled: true,
    citationEnabled: true
  },
  
  EXECUTIVE_COMMUNICATIONS: {
    agentId: 'ULX1RJGKCR',
    agentName: 'Executive Communications Agent',
    agentArn: 'arn:aws:bedrock:us-west-2:account:agent/ULX1RJGKCR',
    description: 'Enhanced executive document generation with NIM-powered reasoning',
    capabilities: [
      {
        name: 'generate_management_onepager',
        description: 'Generate executive one-pagers with NIM-enhanced insights',
        inputSchema: { type: 'object', properties: { requirements: { type: 'string' }, design: { type: 'string' } } },
        outputSchema: { type: 'object', properties: { onepager: { type: 'string' } } },
        nimEnhanced: true,
        retrievalEnabled: true,
        confidenceThreshold: 0.85
      },
      {
        name: 'generate_pr_faq',
        description: 'Generate PR-FAQ documents with NIM-powered communication optimization',
        inputSchema: { type: 'object', properties: { requirements: { type: 'string' }, design: { type: 'string' } } },
        outputSchema: { type: 'object', properties: { prfaq: { type: 'string' } } },
        nimEnhanced: true,
        retrievalEnabled: true,
        confidenceThreshold: 0.8
      }
    ],
    nimIntegrationEnabled: true,
    retrievalEnabled: true,
    citationEnabled: true
  },
  
  CASE_STUDY_COACHING: {
    agentId: 'PDZPQTNLYH',
    agentName: 'Case Study Coaching Agent',
    agentArn: 'arn:aws:bedrock:us-east-1:account:agent/PDZPQTNLYH',
    description: 'Enhanced case study coaching with Nemotron-powered analysis and strategic insights',
    capabilities: [
      {
        name: 'generate_interview_questions',
        description: 'Generate interview questions with NIM-powered analysis',
        inputSchema: { type: 'object', properties: { role: { type: 'string' }, level: { type: 'string' } } },
        outputSchema: { type: 'object', properties: { questions: { type: 'array' } } },
        nimEnhanced: true,
        retrievalEnabled: true,
        confidenceThreshold: 0.8
      },
      {
        name: 'evaluate_responses',
        description: 'Evaluate interview responses with NIM-powered assessment',
        inputSchema: { type: 'object', properties: { question: { type: 'string' }, response: { type: 'string' } } },
        outputSchema: { type: 'object', properties: { evaluation: { type: 'object' } } },
        nimEnhanced: true,
        retrievalEnabled: false,
        confidenceThreshold: 0.85
      }
    ],
    nimIntegrationEnabled: true,
    retrievalEnabled: true,
    citationEnabled: true
  }
};

// ============================================================================
// Request/Response Models
// ============================================================================

/**
 * Chat completion request builder
 */
export class ChatCompletionRequestBuilder {
  private request: Partial<ChatCompletionRequest> = {
    model: DEFAULT_NIM_CONFIG.chatModel,
    messages: [],
    temperature: 0.7,
    max_tokens: -1,
    stream: false
  };

  setModel(model: string): this {
    this.request.model = model;
    return this;
  }

  addMessage(role: 'system' | 'user' | 'assistant', content: string): this {
    if (!this.request.messages) {
      this.request.messages = [];
    }
    this.request.messages.push({ role, content });
    return this;
  }

  setTemperature(temperature: number): this {
    this.request.temperature = Math.max(0, Math.min(2, temperature));
    return this;
  }

  setMaxTokens(maxTokens: number): this {
    this.request.max_tokens = maxTokens;
    return this;
  }

  setStreaming(stream: boolean): this {
    this.request.stream = stream;
    return this;
  }

  build(): ChatCompletionRequest {
    if (!this.request.messages || this.request.messages.length === 0) {
      throw new Error('At least one message is required');
    }
    return this.request as ChatCompletionRequest;
  }
}

/**
 * Embedding request builder
 */
export class EmbeddingRequestBuilder {
  private request: Partial<EmbeddingRequest> = {
    model: DEFAULT_NIM_CONFIG.embeddingModel,
    encoding_format: 'float'
  };

  setModel(model: string): this {
    this.request.model = model;
    return this;
  }

  setInput(input: string | string[]): this {
    this.request.input = input;
    return this;
  }

  setEncodingFormat(format: 'float' | 'base64'): this {
    this.request.encoding_format = format;
    return this;
  }

  setDimensions(dimensions: number): this {
    this.request.dimensions = dimensions;
    return this;
  }

  build(): EmbeddingRequest {
    if (!this.request.input) {
      throw new Error('Input is required for embedding request');
    }
    return this.request as EmbeddingRequest;
  }
}

// ============================================================================
// Agent Task and Message Models
// ============================================================================

/**
 * Agent task builder
 */
export class AgentTaskBuilder {
  private task: Partial<AgentTask> = {
    id: '',
    type: 'business_analysis',
    payload: {},
    requiredCapabilities: [],
    priority: 'medium',
    conversationId: '',
    timestamp: Date.now()
  };

  setId(id: string): this {
    this.task.id = id;
    return this;
  }

  setType(type: TaskType): this {
    this.task.type = type;
    return this;
  }

  setPayload(payload: any): this {
    this.task.payload = payload;
    return this;
  }

  addCapability(capability: string): this {
    if (!this.task.requiredCapabilities) {
      this.task.requiredCapabilities = [];
    }
    this.task.requiredCapabilities.push(capability);
    return this;
  }

  setPriority(priority: Priority): this {
    this.task.priority = priority;
    return this;
  }

  setConversationId(conversationId: string): this {
    this.task.conversationId = conversationId;
    return this;
  }

  build(): AgentTask {
    if (!this.task.id || !this.task.conversationId) {
      throw new Error('Task ID and conversation ID are required');
    }
    return this.task as AgentTask;
  }
}

/**
 * Agent message builder
 */
export class AgentMessageBuilder {
  private message: Partial<AgentMessage> = {
    from: '',
    to: '',
    content: {},
    timestamp: new Date(),
    conversationId: '',
    messageType: 'task_request'
  };

  setFrom(from: string): this {
    this.message.from = from;
    return this;
  }

  setTo(to: string): this {
    this.message.to = to;
    return this;
  }

  setContent(content: any): this {
    this.message.content = content;
    return this;
  }

  setConversationId(conversationId: string): this {
    this.message.conversationId = conversationId;
    return this;
  }

  setMessageType(messageType: MessageType): this {
    this.message.messageType = messageType;
    return this;
  }

  setMetadata(metadata: Record<string, any>): this {
    this.message.metadata = metadata;
    return this;
  }

  build(): AgentMessage {
    if (!this.message.from || !this.message.to || !this.message.conversationId) {
      throw new Error('From, to, and conversation ID are required');
    }
    return this.message as AgentMessage;
  }
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate NIM configuration
 */
export function validateNIMConfig(config: Partial<NIMConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.chatEndpoint) {
    errors.push('Chat endpoint is required');
  } else if (!isValidUrl(config.chatEndpoint)) {
    errors.push('Chat endpoint must be a valid URL');
  }

  if (!config.embeddingEndpoint) {
    errors.push('Embedding endpoint is required');
  } else if (!isValidUrl(config.embeddingEndpoint)) {
    errors.push('Embedding endpoint must be a valid URL');
  }

  if (!config.chatModel) {
    errors.push('Chat model is required');
  }

  if (!config.embeddingModel) {
    errors.push('Embedding model is required');
  }

  if (config.timeout && (config.timeout < 1000 || config.timeout > 300000)) {
    errors.push('Timeout must be between 1000ms and 300000ms');
  }

  if (config.localTestingEnabled && config.localEndpoint && !isValidUrl(config.localEndpoint)) {
    errors.push('Local endpoint must be a valid URL when local testing is enabled');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate deployment configuration
 */
export function validateDeploymentConfig(config: Partial<DeploymentConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.platform) {
    errors.push('Platform is required');
  } else if (!['EKS', 'SageMaker'].includes(config.platform)) {
    errors.push('Platform must be either EKS or SageMaker');
  }

  if (!config.region) {
    errors.push('Region is required');
  }

  if (!config.resourceRequirements) {
    errors.push('Resource requirements are required');
  } else {
    const { cpu, memory, storage } = config.resourceRequirements;
    if (!cpu || !memory || !storage) {
      errors.push('CPU, memory, and storage requirements are required');
    }
  }

  if (!config.securityConfig?.iamRoleArn) {
    errors.push('IAM role ARN is required in security configuration');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate agent capability
 */
export function validateAgentCapability(capability: Partial<AgentCapability>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!capability.name) {
    errors.push('Capability name is required');
  }

  if (!capability.description) {
    errors.push('Capability description is required');
  }

  if (!capability.inputSchema) {
    errors.push('Input schema is required');
  }

  if (!capability.outputSchema) {
    errors.push('Output schema is required');
  }

  if (capability.confidenceThreshold !== undefined) {
    if (capability.confidenceThreshold < 0 || capability.confidenceThreshold > 1) {
      errors.push('Confidence threshold must be between 0 and 1');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate unique IDs for tasks and messages
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Create conversation ID
 */
export function createConversationId(): string {
  return generateId('conv');
}

/**
 * Create task ID
 */
export function createTaskId(taskType: TaskType): string {
  return generateId(taskType.replace('_', ''));
}

/**
 * Create message ID
 */
export function createMessageId(): string {
  return generateId('msg');
}

/**
 * Get default configuration for environment
 */
export function getDefaultConfigForEnvironment(environment: 'development' | 'staging' | 'production'): {
  nim: NIMConfig;
  deployment: DeploymentConfig;
} {
  const baseNimConfig = { ...DEFAULT_NIM_CONFIG };
  const baseDeploymentConfig = environment === 'production' 
    ? { ...DEFAULT_SAGEMAKER_DEPLOYMENT_CONFIG }
    : { ...DEFAULT_EKS_DEPLOYMENT_CONFIG };

  // Environment-specific adjustments
  switch (environment) {
    case 'development':
      baseNimConfig.localTestingEnabled = true;
      baseNimConfig.scalingConfig.minInstances = 1;
      baseNimConfig.scalingConfig.maxInstances = 3;
      baseDeploymentConfig.monitoringConfig.loggingConfig.logLevel = 'debug';
      break;
      
    case 'staging':
      baseNimConfig.scalingConfig.minInstances = 2;
      baseNimConfig.scalingConfig.maxInstances = 5;
      baseDeploymentConfig.monitoringConfig.loggingConfig.logLevel = 'info';
      break;
      
    case 'production':
      baseNimConfig.scalingConfig.minInstances = 3;
      baseNimConfig.scalingConfig.maxInstances = 20;
      baseDeploymentConfig.monitoringConfig.loggingConfig.logLevel = 'warn';
      baseDeploymentConfig.resourceRequirements.gpu = {
        type: 'nvidia-a100',
        count: 2,
        memoryGB: 80,
        computeCapability: '8.0'
      };
      break;
  }

  baseDeploymentConfig.environment = environment;

  return {
    nim: baseNimConfig,
    deployment: baseDeploymentConfig
  };
}