/**
 * NVIDIA NIM Agentic Platform Core Interfaces
 * 
 * Extends existing pm-agent-core interfaces with NVIDIA NIM integration capabilities
 * for llama-3.1-nemotron-nano-8B-v1 and Retrieval Embedding NIM services.
 */

import { MCPToolResult, MCPToolContext } from '../models/mcp';
import { ParsedIntent, ConsultingAnalysis, ROIAnalysis } from './pm-agent-core';

// ============================================================================
// NVIDIA NIM Service Interfaces
// ============================================================================

/**
 * Core NIM Service Manager interface for NVIDIA inference microservices
 */
export interface NIMServiceManager {
  // Chat completion with llama-3.1-nemotron-nano-8B-v1
  generateChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  
  // Embedding generation with Retrieval Embedding NIM
  generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  
  // Health monitoring and service management
  checkHealth(): Promise<NIMServiceHealth>;
  updateConfiguration(config: Partial<NIMConfig>): Promise<void>;
  getConfiguration(): NIMConfig;
  
  // Performance monitoring
  getMetrics(): Promise<NIMPerformanceMetrics>;
}

/**
 * Chat completion request interface for OpenAI-compatible API
 */
export interface ChatCompletionRequest {
  model: string; // "nvidia-llama-3_1-nemotron-nano-8b-v1"
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}

/**
 * Chat completion response interface
 */
export interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: TokenUsage;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: "stop" | "length" | "content_filter" | null;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Embedding request interface
 */
export interface EmbeddingRequest {
  input: string | string[];
  model: string;
  encoding_format?: "float" | "base64";
  dimensions?: number;
}

/**
 * Embedding response interface
 */
export interface EmbeddingResponse {
  object: "list";
  data: EmbeddingData[];
  model: string;
  usage: TokenUsage;
}

export interface EmbeddingData {
  object: "embedding";
  embedding: number[];
  index: number;
}

// ============================================================================
// Supervisor Agent Architecture
// ============================================================================

/**
 * Supervisor Agent interface for multi-agent orchestration
 */
export interface SupervisorAgent {
  // Agent orchestration and task management
  orchestrateAgents(task: AgentTask): Promise<AgentResponse>;
  
  // Message routing between agents
  routeMessage(message: AgentMessage, targetAgent: string): Promise<void>;
  
  // Conversation context management
  maintainContext(conversationId: string): Promise<ConversationContext>;
  
  // Agent selection and load balancing
  selectOptimalAgent(criteria: AgentSelectionCriteria): Promise<string>;
  
  // Citation request routing to dedicated CitationAgent
  requestCitation(query: string, context: CitationContext): Promise<CitationResponse>;
}

/**
 * Agent task definition for orchestration
 */
export interface AgentTask {
  id: string;
  type: TaskType;
  payload: any;
  requiredCapabilities: string[];
  priority: Priority;
  conversationId: string;
  timestamp: number;
}

export type TaskType = 
  | 'business_analysis' 
  | 'citation_validation' 
  | 'product_development' 
  | 'executive_communication' 
  | 'interview_coaching'
  | 'market_analysis'
  | 'competitive_intelligence';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Agent message for inter-agent communication
 */
export interface AgentMessage {
  from: string;
  to: string;
  content: any;
  timestamp: Date;
  conversationId: string;
  messageType: MessageType;
  metadata?: Record<string, any>;
}

export type MessageType = 
  | 'task_request' 
  | 'task_response' 
  | 'citation_request' 
  | 'citation_response' 
  | 'context_update' 
  | 'error_notification';

/**
 * Agent response structure
 */
export interface AgentResponse {
  agentId: string;
  taskId: string;
  result: any;
  status: 'success' | 'error' | 'partial';
  metadata: {
    processingTime: number;
    nimTokensUsed?: number;
    confidence: number;
    citations?: CitationReference[];
  };
  error?: string;
}

// ============================================================================
// Enhanced Bedrock Agent Interface
// ============================================================================

/**
 * Enhanced Bedrock Agent with NVIDIA NIM capabilities
 */
export interface EnhancedBedrockAgent {
  // Core agent identification
  agentId: string;
  agentName: string;
  capabilities: AgentCapability[];
  
  // NIM integration
  processWithNIM(input: string, context?: NIMProcessingContext): Promise<NIMProcessedResponse>;
  
  // Retrieval augmentation
  enhanceWithRetrieval(query: string, context?: RetrievalContext): Promise<RetrievalAugmentedResponse>;
  
  // Supervisor communication
  communicateWithSupervisor(message: AgentMessage): Promise<void>;
  
  // Capability management
  registerCapabilities(capabilities: AgentCapability[]): Promise<void>;
  updateCapability(capabilityName: string, updates: Partial<AgentCapability>): Promise<void>;
}

/**
 * Agent capability definition
 */
export interface AgentCapability {
  name: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
  nimEnhanced: boolean;
  retrievalEnabled: boolean;
  confidenceThreshold: number;
}

/**
 * NIM processing context
 */
export interface NIMProcessingContext {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  conversationHistory?: ChatMessage[];
  retrievalContext?: string[];
}

/**
 * NIM processed response
 */
export interface NIMProcessedResponse {
  content: string;
  reasoning?: string;
  confidence: number;
  tokensUsed: number;
  processingTime: number;
  citations?: CitationReference[];
}

// ============================================================================
// Configuration and Deployment Models
// ============================================================================

/**
 * NVIDIA NIM configuration
 */
export interface NIMConfig {
  // Service endpoints
  chatEndpoint: string;
  embeddingEndpoint: string;
  
  // Model configuration
  chatModel: string; // "nvidia-llama-3_1-nemotron-nano-8b-v1"
  embeddingModel: string;
  
  // Authentication
  apiKey?: string;
  
  // Performance settings
  timeout: number;
  retryPolicy: RetryPolicy;
  
  // Scaling configuration
  scalingConfig: ScalingConfig;
  
  // Local testing configuration
  localTestingEnabled: boolean;
  localEndpoint?: string; // "http://localhost:1234"
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

/**
 * Scaling configuration for AWS deployment
 */
export interface ScalingConfig {
  minInstances: number;
  maxInstances: number;
  targetUtilization: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
  autoScalingEnabled: boolean;
}

/**
 * Agent communication protocol
 */
export interface AgentProtocol {
  version: string;
  messageFormat: MessageFormat;
  authenticationMethod: AuthMethod;
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
}

export interface MessageFormat {
  headers: Record<string, string>;
  payload: any;
  metadata: MessageMetadata;
}

export interface MessageMetadata {
  timestamp: number;
  messageId: string;
  correlationId?: string;
  priority: Priority;
  ttl?: number;
}

export type AuthMethod = 'none' | 'api_key' | 'iam_role' | 'oauth2';

/**
 * Deployment configuration for AWS infrastructure
 */
export interface DeploymentConfig {
  platform: "EKS" | "SageMaker";
  region: string;
  
  // Resource requirements
  resourceRequirements: ResourceRequirements;
  
  // Network configuration
  networkConfig: NetworkConfig;
  
  // Security configuration
  securityConfig: SecurityConfig;
  
  // Environment-specific settings
  environment: 'development' | 'staging' | 'production';
  
  // Monitoring configuration
  monitoringConfig: MonitoringConfig;
}

/**
 * Resource requirements for deployment
 */
export interface ResourceRequirements {
  cpu: string;
  memory: string;
  gpu?: GPURequirements;
  storage: string;
  networkBandwidth?: string;
}

export interface GPURequirements {
  type: string; // e.g., "nvidia-tesla-v100", "nvidia-a100"
  count: number;
  memoryGB: number;
  computeCapability?: string;
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  vpcId?: string;
  subnetIds: string[];
  securityGroupIds: string[];
  loadBalancerConfig?: LoadBalancerConfig;
  serviceDiscovery?: ServiceDiscoveryConfig;
}

export interface LoadBalancerConfig {
  type: 'application' | 'network';
  scheme: 'internet-facing' | 'internal';
  healthCheckPath: string;
  healthCheckInterval: number;
}

export interface ServiceDiscoveryConfig {
  namespace: string;
  serviceName: string;
  dnsConfig: {
    ttl: number;
    routingPolicy: 'multivalue' | 'weighted';
  };
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  iamRoleArn: string;
  kmsKeyId?: string;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  networkPolicies: NetworkPolicy[];
  accessControlPolicies: AccessControlPolicy[];
}

export interface NetworkPolicy {
  name: string;
  rules: NetworkRule[];
}

export interface NetworkRule {
  protocol: 'tcp' | 'udp' | 'icmp';
  port?: number;
  portRange?: { from: number; to: number };
  source: string;
  action: 'allow' | 'deny';
}

export interface AccessControlPolicy {
  name: string;
  effect: 'Allow' | 'Deny';
  actions: string[];
  resources: string[];
  conditions?: Record<string, any>;
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  cloudWatchEnabled: boolean;
  xrayTracingEnabled: boolean;
  customMetrics: CustomMetric[];
  alertingConfig: AlertingConfig;
  loggingConfig: LoggingConfig;
}

export interface CustomMetric {
  name: string;
  namespace: string;
  dimensions: Record<string, string>;
  unit: string;
  threshold?: number;
}

export interface AlertingConfig {
  snsTopicArn?: string;
  alertThresholds: AlertThreshold[];
  escalationPolicy?: EscalationPolicy;
}

export interface AlertThreshold {
  metricName: string;
  threshold: number;
  comparisonOperator: 'GreaterThanThreshold' | 'LessThanThreshold' | 'GreaterThanOrEqualToThreshold' | 'LessThanOrEqualToThreshold';
  evaluationPeriods: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
  autoResolve: boolean;
}

export interface EscalationLevel {
  level: number;
  delayMinutes: number;
  notificationTargets: string[];
}

export interface LoggingConfig {
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logGroups: LogGroup[];
  retentionDays: number;
  structuredLogging: boolean;
}

export interface LogGroup {
  name: string;
  logStream: string;
  filterPattern?: string;
}

// ============================================================================
// Error Handling and Custom Errors
// ============================================================================

/**
 * Base NIM error class
 */
export class NIMError extends Error {
  constructor(
    message: string,
    public code: NIMErrorCode,
    public context?: any,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'NIMError';
  }
}

/**
 * NIM service error codes
 */
export enum NIMErrorCode {
  // Service errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  INFERENCE_FAILED = 'INFERENCE_FAILED',
  EMBEDDING_FAILED = 'EMBEDDING_FAILED',
  
  // Authentication errors
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  API_KEY_INVALID = 'API_KEY_INVALID',
  
  // Request errors
  INVALID_REQUEST = 'INVALID_REQUEST',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TIMEOUT = 'TIMEOUT',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  
  // Agent communication errors
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  MESSAGE_ROUTING_FAILED = 'MESSAGE_ROUTING_FAILED',
  CONTEXT_LOST = 'CONTEXT_LOST',
  CAPABILITY_MISMATCH = 'CAPABILITY_MISMATCH',
  
  // Infrastructure errors
  DEPLOYMENT_FAILED = 'DEPLOYMENT_FAILED',
  SCALING_FAILED = 'SCALING_FAILED',
  HEALTH_CHECK_FAILED = 'HEALTH_CHECK_FAILED',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  
  // Configuration errors
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  MISSING_CREDENTIALS = 'MISSING_CREDENTIALS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Agent communication error
 */
export class AgentCommunicationError extends NIMError {
  constructor(
    message: string,
    public agentId: string,
    public messageId?: string,
    context?: any
  ) {
    super(message, NIMErrorCode.MESSAGE_ROUTING_FAILED, context, true);
    this.name = 'AgentCommunicationError';
  }
}

/**
 * NIM service error
 */
export class NIMServiceError extends NIMError {
  constructor(
    message: string,
    code: NIMErrorCode,
    public serviceEndpoint: string,
    context?: any
  ) {
    super(message, code, context, code !== NIMErrorCode.AUTHENTICATION_FAILED);
    this.name = 'NIMServiceError';
  }
}

/**
 * Deployment error
 */
export class DeploymentError extends NIMError {
  constructor(
    message: string,
    public platform: string,
    public region: string,
    context?: any
  ) {
    super(message, NIMErrorCode.DEPLOYMENT_FAILED, context, false);
    this.name = 'DeploymentError';
  }
}

// ============================================================================
// Supporting Types and Utilities
// ============================================================================

/**
 * NIM service health status
 */
export interface NIMServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  chatService: ServiceStatus;
  embeddingService: ServiceStatus;
  lastChecked: Date;
  uptime: number;
  version: string;
}

export interface ServiceStatus {
  available: boolean;
  responseTime: number;
  errorRate: number;
  lastError?: string;
}

/**
 * NIM performance metrics
 */
export interface NIMPerformanceMetrics {
  requestsPerSecond: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  tokensPerSecond: number;
  memoryUsage: number;
  gpuUtilization?: number;
}

/**
 * Conversation context for multi-turn interactions
 */
export interface ConversationContext {
  conversationId: string;
  participants: string[];
  messageHistory: AgentMessage[];
  sharedContext: Record<string, any>;
  lastActivity: Date;
  ttl: number;
}

/**
 * Agent selection criteria
 */
export interface AgentSelectionCriteria {
  requiredCapabilities: string[];
  preferredAgent?: string;
  loadBalancing: 'round_robin' | 'least_loaded' | 'capability_based';
  excludeAgents?: string[];
  maxResponseTime?: number;
}

/**
 * Citation context and response
 */
export interface CitationContext {
  query: string;
  documentType: string;
  requiredConfidence: number;
  maxCitations: number;
  preferredSources?: string[];
}

export interface CitationResponse {
  citations: CitationReference[];
  confidence: number;
  processingTime: number;
  sourcesSearched: number;
}

export interface CitationReference {
  id: string;
  title: string;
  url: string;
  authors?: string[];
  publishedDate?: string;
  confidence: number;
  relevanceScore: number;
  excerpt: string;
}

/**
 * Retrieval context and response
 */
export interface RetrievalContext {
  maxResults: number;
  similarityThreshold: number;
  contextWindow: number;
  filterCriteria?: Record<string, any>;
}

export interface RetrievalAugmentedResponse {
  enhancedContent: string;
  retrievedDocuments: RetrievedDocument[];
  confidence: number;
  processingTime: number;
}

export interface RetrievedDocument {
  id: string;
  content: string;
  similarity: number;
  metadata: Record<string, any>;
}

/**
 * Extended interfaces that integrate with existing PM agent core
 */
export interface NIMEnhancedParsedIntent extends ParsedIntent {
  nimProcessingRequired: boolean;
  retrievalQueries: string[];
  expectedNIMTokens: number;
  citationRequirements: CitationContext[];
}

export interface NIMEnhancedConsultingAnalysis extends ConsultingAnalysis {
  nimInsights: NIMInsight[];
  retrievalAugmentedData: RetrievedDocument[];
  citationValidation: CitationValidationResult[];
}

export interface NIMInsight {
  technique: string;
  nimGeneratedContent: string;
  confidence: number;
  tokensUsed: number;
  processingTime: number;
}

export interface CitationValidationResult {
  citation: CitationReference;
  validated: boolean;
  validationMethod: string;
  confidence: number;
  issues?: string[];
}

export interface NIMEnhancedROIAnalysis extends ROIAnalysis {
  nimEnhancedScenarios: NIMEnhancedROIScenario[];
  retrievalBasedComparisons: MarketComparison[];
  citationSupportedMetrics: CitationSupportedMetric[];
}

export interface NIMEnhancedROIScenario {
  scenario: string;
  nimAnalysis: string;
  confidence: number;
  supportingCitations: CitationReference[];
  retrievalContext: RetrievedDocument[];
}

export interface MarketComparison {
  competitor: string;
  metrics: Record<string, number>;
  source: CitationReference;
  confidence: number;
}

export interface CitationSupportedMetric {
  metricName: string;
  value: number;
  unit: string;
  citations: CitationReference[];
  confidence: number;
}