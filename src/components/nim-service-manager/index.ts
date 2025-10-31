/**
 * NVIDIA NIM Service Manager
 * 
 * Core service manager for NVIDIA NIM integration with chat completion,
 * embedding generation, health monitoring, and configuration management.
 */

import {
  NIMServiceManager,
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  NIMServiceHealth,
  NIMPerformanceMetrics,
  NIMConfig,
  NIMError,
  NIMErrorCode,
  ServiceStatus
} from '../../interfaces/nvidia-nim-core';
import { 
  DEFAULT_NIM_CONFIG,
  ChatCompletionRequestBuilder,
  EmbeddingRequestBuilder,
  validateNIMConfig
} from '../../models/nvidia-nim';
import { NIMErrorHandler, CircuitBreaker, ServiceHealthMonitor } from '../../utils/nvidia-nim-error-handling';

// ============================================================================
// NIM Service Manager Implementation
// ============================================================================

/**
 * Production-ready NVIDIA NIM Service Manager
 */
export class NIMServiceManagerImpl implements NIMServiceManager {
  private config: NIMConfig;
  private circuitBreaker: CircuitBreaker;
  private healthMonitor: ServiceHealthMonitor;
  private performanceMetrics: NIMPerformanceMetrics;
  private requestCount: number = 0;
  private errorCount: number = 0;
  private totalLatency: number = 0;

  constructor(config: Partial<NIMConfig> = {}) {
    // Validate and merge configuration
    const validation = validateNIMConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid NIM configuration: ${validation.errors.join(', ')}`);
    }

    this.config = { ...DEFAULT_NIM_CONFIG, ...config };
    
    // Initialize circuit breaker for resilience
    this.circuitBreaker = new CircuitBreaker(5, 60000, 3);
    
    // Initialize health monitor
    this.healthMonitor = new ServiceHealthMonitor();
    this.setupHealthMonitoring();
    
    // Initialize performance metrics
    this.performanceMetrics = {
      requestsPerSecond: 0,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      errorRate: 0,
      tokensPerSecond: 0,
      memoryUsage: 0,
      gpuUtilization: 0
    };

    console.log('NIM Service Manager initialized', {
      chatEndpoint: this.config.chatEndpoint,
      embeddingEndpoint: this.config.embeddingEndpoint,
      chatModel: this.config.chatModel,
      localTestingEnabled: this.config.localTestingEnabled
    });
  }

  // ============================================================================
  // Chat Completion Implementation
  // ============================================================================

  /**
   * Generate chat completion using NVIDIA NIM
   */
  async generateChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const startTime = Date.now();
    
    try {
      // Validate request
      this.validateChatCompletionRequest(request);
      
      // Perform chat completion
      const response = await this.performChatCompletion(request);

      // Update metrics
      const latency = Date.now() - startTime;
      this.updateMetrics(latency, true, response.usage?.total_tokens || 0);
      
      return response;
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(latency, false, 0);
      
      // Handle and rethrow with proper error context
      if (error instanceof NIMError) {
        throw error;
      }
      
      throw NIMErrorHandler.createServiceError(
        `Chat completion failed: ${error instanceof Error ? error.message : String(error)}`,
        NIMErrorCode.INFERENCE_FAILED,
        this.getActiveEndpoint(),
        { request, latency }
      );
    }
  }

  /**
   * Perform the actual chat completion request
   */
  private async performChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const endpoint = this.getActiveEndpoint();
    const url = `${endpoint}/v1/chat/completions`;
    
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.config.timeout)
    };

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw NIMErrorHandler.createServiceError(
        `HTTP ${response.status}: ${errorText}`,
        this.mapHttpStatusToErrorCode(response.status),
        endpoint,
        { request, response: errorText }
      );
    }

    const result = await response.json() as ChatCompletionResponse;
    
    // Validate response structure
    if (!result.choices || result.choices.length === 0) {
      throw NIMErrorHandler.createServiceError(
        'Invalid response: no choices returned',
        NIMErrorCode.INFERENCE_FAILED,
        endpoint,
        { request, response: result }
      );
    }

    return result;
  }

  /**
   * Validate chat completion request
   */
  private validateChatCompletionRequest(request: ChatCompletionRequest): void {
    if (!request.model) {
      throw NIMErrorHandler.createError(
        NIMErrorCode.INVALID_REQUEST,
        'Model is required for chat completion'
      );
    }

    if (!request.messages || request.messages.length === 0) {
      throw NIMErrorHandler.createError(
        NIMErrorCode.INVALID_REQUEST,
        'At least one message is required'
      );
    }

    // Validate message structure
    for (const message of request.messages) {
      if (!message.role || !message.content) {
        throw NIMErrorHandler.createError(
          NIMErrorCode.INVALID_REQUEST,
          'Each message must have role and content'
        );
      }
    }
  }

  // ============================================================================
  // Embedding Generation Implementation
  // ============================================================================

  /**
   * Generate embeddings using NVIDIA NIM
   */
  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const startTime = Date.now();
    
    try {
      // Validate request
      this.validateEmbeddingRequest(request);
      
      // Perform embedding generation
      const response = await this.performEmbeddingGeneration(request);

      // Update metrics
      const latency = Date.now() - startTime;
      this.updateMetrics(latency, true, response.usage?.total_tokens || 0);
      
      return response;
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(latency, false, 0);
      
      // Handle and rethrow with proper error context
      if (error instanceof NIMError) {
        throw error;
      }
      
      throw NIMErrorHandler.createServiceError(
        `Embedding generation failed: ${error instanceof Error ? error.message : String(error)}`,
        NIMErrorCode.EMBEDDING_FAILED,
        this.config.embeddingEndpoint,
        { request, latency }
      );
    }
  }

  /**
   * Perform the actual embedding generation request
   */
  private async performEmbeddingGeneration(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const endpoint = this.config.embeddingEndpoint;
    const url = `${endpoint}/v1/embeddings`;
    
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.config.timeout)
    };

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw NIMErrorHandler.createServiceError(
        `HTTP ${response.status}: ${errorText}`,
        this.mapHttpStatusToErrorCode(response.status),
        endpoint,
        { request, response: errorText }
      );
    }

    const result = await response.json() as EmbeddingResponse;
    
    // Validate response structure
    if (!result.data || result.data.length === 0) {
      throw NIMErrorHandler.createServiceError(
        'Invalid response: no embedding data returned',
        NIMErrorCode.EMBEDDING_FAILED,
        endpoint,
        { request, response: result }
      );
    }

    return result;
  }

  /**
   * Validate embedding request
   */
  private validateEmbeddingRequest(request: EmbeddingRequest): void {
    if (!request.model) {
      throw NIMErrorHandler.createError(
        NIMErrorCode.INVALID_REQUEST,
        'Model is required for embedding generation'
      );
    }

    if (!request.input) {
      throw NIMErrorHandler.createError(
        NIMErrorCode.INVALID_REQUEST,
        'Input is required for embedding generation'
      );
    }

    // Validate input type
    if (typeof request.input !== 'string' && !Array.isArray(request.input)) {
      throw NIMErrorHandler.createError(
        NIMErrorCode.INVALID_REQUEST,
        'Input must be a string or array of strings'
      );
    }
  }

  // ============================================================================
  // Health Monitoring Implementation
  // ============================================================================

  /**
   * Check service health
   */
  async checkHealth(): Promise<NIMServiceHealth> {
    try {
      const startTime = Date.now();
      
      // Test chat service
      const chatHealth = await this.testChatService();
      
      // Test embedding service
      const embeddingHealth = await this.testEmbeddingService();
      
      const totalTime = Date.now() - startTime;
      const overallHealthy = chatHealth.available && embeddingHealth.available;
      
      return {
        status: overallHealthy ? 'healthy' : 'unhealthy',
        chatService: chatHealth,
        embeddingService: embeddingHealth,
        lastChecked: new Date(),
        uptime: totalTime,
        version: '1.0.0'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        chatService: {
          available: false,
          responseTime: 0,
          errorRate: 1,
          lastError: error instanceof Error ? error.message : String(error)
        },
        embeddingService: {
          available: false,
          responseTime: 0,
          errorRate: 1,
          lastError: 'Service unavailable'
        },
        lastChecked: new Date(),
        uptime: 0,
        version: '1.0.0'
      };
    }
  }

  /**
   * Test chat service health
   */
  private async testChatService(): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    try {
      const testRequest = new ChatCompletionRequestBuilder()
        .setModel(this.config.chatModel)
        .addMessage('user', 'Health check')
        .setMaxTokens(5)
        .setTemperature(0.1)
        .build();
      
      await this.performChatCompletion(testRequest);
      
      return {
        available: true,
        responseTime: Date.now() - startTime,
        errorRate: 0
      };
    } catch (error) {
      return {
        available: false,
        responseTime: Date.now() - startTime,
        errorRate: 1,
        lastError: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Test embedding service health
   */
  private async testEmbeddingService(): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    try {
      const testRequest = new EmbeddingRequestBuilder()
        .setModel(this.config.embeddingModel)
        .setInput('Health check')
        .build();
      
      await this.performEmbeddingGeneration(testRequest);
      
      return {
        available: true,
        responseTime: Date.now() - startTime,
        errorRate: 0
      };
    } catch (error) {
      return {
        available: false,
        responseTime: Date.now() - startTime,
        errorRate: 1,
        lastError: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // ============================================================================
  // Configuration Management
  // ============================================================================

  /**
   * Update service configuration
   */
  async updateConfiguration(newConfig: Partial<NIMConfig>): Promise<void> {
    // Validate new configuration
    const mergedConfig = { ...this.config, ...newConfig };
    const validation = validateNIMConfig(mergedConfig);
    
    if (!validation.valid) {
      throw NIMErrorHandler.createError(
        NIMErrorCode.INVALID_CONFIGURATION,
        `Invalid configuration: ${validation.errors.join(', ')}`
      );
    }

    // Update configuration
    this.config = mergedConfig;
    
    // Restart health monitoring with new config
    this.healthMonitor.stopMonitoring();
    this.setupHealthMonitoring();
    
    console.log('NIM Service Manager configuration updated', {
      chatEndpoint: this.config.chatEndpoint,
      embeddingEndpoint: this.config.embeddingEndpoint,
      chatModel: this.config.chatModel
    });
  }

  /**
   * Get current configuration
   */
  getConfiguration(): NIMConfig {
    return { ...this.config };
  }

  // ============================================================================
  // Performance Metrics
  // ============================================================================

  /**
   * Get performance metrics
   */
  async getMetrics(): Promise<NIMPerformanceMetrics> {
    return { ...this.performanceMetrics };
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(latency: number, success: boolean, tokens: number): void {
    this.requestCount++;
    this.totalLatency += latency;
    
    if (!success) {
      this.errorCount++;
    }

    // Calculate running averages
    this.performanceMetrics.averageLatency = this.totalLatency / this.requestCount;
    this.performanceMetrics.errorRate = this.errorCount / this.requestCount;
    
    // Update tokens per second (simplified calculation)
    if (tokens > 0) {
      const tokensPerMs = tokens / latency;
      this.performanceMetrics.tokensPerSecond = tokensPerMs * 1000;
    }
    
    // Update requests per second (based on recent activity)
    this.performanceMetrics.requestsPerSecond = this.requestCount / (Date.now() / 1000);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get the active endpoint (local testing or production)
   */
  private getActiveEndpoint(): string {
    return this.config.localTestingEnabled && this.config.localEndpoint
      ? this.config.localEndpoint
      : this.config.chatEndpoint;
  }

  /**
   * Map HTTP status codes to NIM error codes
   */
  private mapHttpStatusToErrorCode(status: number): NIMErrorCode {
    switch (status) {
      case 400:
        return NIMErrorCode.INVALID_REQUEST;
      case 401:
        return NIMErrorCode.AUTHENTICATION_FAILED;
      case 403:
        return NIMErrorCode.AUTHORIZATION_FAILED;
      case 404:
        return NIMErrorCode.MODEL_NOT_FOUND;
      case 429:
        return NIMErrorCode.RATE_LIMIT_EXCEEDED;
      case 500:
      case 502:
      case 503:
        return NIMErrorCode.SERVICE_UNAVAILABLE;
      case 504:
        return NIMErrorCode.TIMEOUT;
      default:
        return NIMErrorCode.UNKNOWN_ERROR;
    }
  }

  /**
   * Setup health monitoring
   */
  private setupHealthMonitoring(): void {
    // Register health checks
    this.healthMonitor.registerHealthCheck('nim-chat', async () => {
      const health = await this.testChatService();
      return health.available;
    });

    this.healthMonitor.registerHealthCheck('nim-embedding', async () => {
      const health = await this.testEmbeddingService();
      return health.available;
    });

    // Start monitoring
    this.healthMonitor.startMonitoring(30000); // Check every 30 seconds
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.healthMonitor.stopMonitoring();
    console.log('NIM Service Manager cleaned up');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a NIM service manager with default configuration
 */
export function createNIMServiceManager(config: Partial<NIMConfig> = {}): NIMServiceManager {
  return new NIMServiceManagerImpl(config);
}

/**
 * Create a NIM service manager for local testing
 */
export function createLocalNIMServiceManager(
  localEndpoint: string = 'http://localhost:1234',
  config: Partial<NIMConfig> = {}
): NIMServiceManager {
  return new NIMServiceManagerImpl({
    ...config,
    localTestingEnabled: true,
    localEndpoint,
    timeout: config.timeout || 30000
  });
}

/**
 * Create a NIM service manager for production
 */
export function createProductionNIMServiceManager(
  apiKey: string,
  config: Partial<NIMConfig> = {}
): NIMServiceManager {
  return new NIMServiceManagerImpl({
    ...config,
    apiKey,
    localTestingEnabled: false,
    timeout: config.timeout || 60000
  });
}