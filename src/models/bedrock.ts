/**
 * Local NVIDIA NIM integration models and interfaces
 * Supports Llama 3.1 Nemotron Nano 8B V1 model integration via local NIM service
 */

// AWS types for compatibility (optional)
interface AwsCredentialIdentity {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

/**
 * Local NIM Runtime Client Configuration
 */
export interface BedrockConfig {
  modelId: string;
  region: string;
  endpoint?: string;
  credentials?: AwsCredentialIdentity;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Nemotron Model Service Configuration
 */
export interface NemotronServiceConfig {
  modelId: string;
  region: string;
  endpoint?: string;
  credentials?: AwsCredentialIdentity;
  maxTokens: number;
  temperature: number;
}

/**
 * Model invocation payload for Llama 3.1 Nemotron Nano 8B V1
 */
export interface ModelPayload {
  prompt: string;
  max_gen_len?: number;
  temperature?: number;
  top_p?: number;
}

/**
 * Model response from Bedrock Runtime API
 */
export interface ModelResponse {
  generation: string;
  stop_reason: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  modelId: string;
  timestamp: string;
}

/**
 * Enhanced tool response with Bedrock reasoning
 */
export interface EnhancedResponse {
  // Original MCP response fields
  content?: Array<{ type: string; text: string }>;
  isError?: boolean;
  metadata?: any;
  
  // Bedrock enhancements
  bedrockReasoning: string | null;
  confidence: number;
  insights: string[];
  enhancementMetadata: {
    bedrockModelUsed: string | null;
    processingTime: number;
    region: string;
    error?: string;
  };
}

/**
 * Enhanced tool response with Nemotron reasoning
 */
export interface EnhancedToolResponse {
  // Original MCP response
  content: Array<{ type: string; text: string }>;
  isError: boolean;
  metadata: ToolMetadata;
  
  // Nemotron enhancements
  nemotronReasoning: {
    insights: string[];
    confidence: number;
    reasoning_chain: string[];
    recommendations: string[];
  };
  retrievalContext?: RetrievalResult[];
  enhancementMetadata: {
    nemotronModelUsed: string;
    embeddingModelUsed?: string;
    processingTime: number;
  };
}

/**
 * Tool metadata interface
 */
export interface ToolMetadata {
  toolName: string;
  executionTime: number;
  version: string;
  [key: string]: any;
}

/**
 * Retrieval result for context enhancement
 */
export interface RetrievalResult {
  content: string;
  source: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

/**
 * Service health status
 */
export interface ServiceStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  modelId: string;
  region: string;
  endpoint?: string;
  error?: string;
}

/**
 * Local NIM model configuration constants
 */
export const BEDROCK_MODELS = {
  LLAMA_NEMOTRON_NANO_8B: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
  TITAN_EMBEDDINGS_G1: 'amazon.titan-embed-text-v1'
} as const;

/**
 * Default local NIM configuration
 */
export const DEFAULT_BEDROCK_CONFIG: Partial<BedrockConfig> = {
  region: 'local',
  endpoint: 'http://localhost:1234',
  maxTokens: 2048,
  temperature: 0.7
};

/**
 * Default Nemotron service configuration
 */
export const DEFAULT_NEMOTRON_CONFIG: Partial<NemotronServiceConfig> = {
  modelId: BEDROCK_MODELS.LLAMA_NEMOTRON_NANO_8B,
  region: 'local',
  endpoint: 'http://localhost:1234',
  maxTokens: 2048,
  temperature: 0.7
};

/**
 * IAM policy document for Bedrock Runtime access
 */
export const BEDROCK_IAM_POLICY = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Action: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream'
      ],
      Resource: [
        'arn:aws:bedrock:*::foundation-model/meta.llama3-1-nemotron-nano-8b-v1:0',
        'arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v1'
      ]
    }
  ]
};

/**
 * Error types for Bedrock integration
 */
export class BedrockError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public context?: any
  ) {
    super(message);
    this.name = 'BedrockError';
  }
}

export class NemotronServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'NemotronServiceError';
  }
}

/**
 * Bedrock service configuration validation
 */
export function validateBedrockConfig(config: BedrockConfig): void {
  if (!config.modelId) {
    throw new BedrockError('Model ID is required', 'MISSING_MODEL_ID');
  }
  
  if (!config.region) {
    throw new BedrockError('AWS region is required', 'MISSING_REGION');
  }
  
  if (config.temperature && (config.temperature < 0 || config.temperature > 1)) {
    throw new BedrockError('Temperature must be between 0 and 1', 'INVALID_TEMPERATURE');
  }
  
  if (config.maxTokens && config.maxTokens < 1) {
    throw new BedrockError('Max tokens must be greater than 0', 'INVALID_MAX_TOKENS');
  }
}

/**
 * Nemotron service configuration validation
 */
export function validateNemotronConfig(config: NemotronServiceConfig): void {
  validateBedrockConfig(config);
  
  if (!config.maxTokens) {
    throw new NemotronServiceError('Max tokens is required', 'MISSING_MAX_TOKENS');
  }
  
  if (!config.temperature) {
    throw new NemotronServiceError('Temperature is required', 'MISSING_TEMPERATURE');
  }
}