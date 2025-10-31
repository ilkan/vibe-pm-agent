/**
 * Local NVIDIA NIM Testing Infrastructure
 * 
 * Provides comprehensive testing capabilities for NVIDIA NIM models running locally
 * on localhost:1234 with OpenAI-compatible API endpoints.
 */

import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  NIMServiceHealth,
  NIMPerformanceMetrics,
  NIMError,
  NIMErrorCode
} from '../../interfaces/nvidia-nim-core';
import { ChatCompletionRequestBuilder, EmbeddingRequestBuilder } from '../../models/nvidia-nim';
import { NIMErrorHandler } from '../../utils/nvidia-nim-error-handling';

// ============================================================================
// Test Result Interfaces
// ============================================================================

export interface TestResult {
  success: boolean;
  message: string;
  duration: number;
  details?: any;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  confidence: number;
  issues: string[];
  suggestions: string[];
  responseQuality: ResponseQuality;
}

export interface ResponseQuality {
  coherence: number; // 0-1 scale
  relevance: number; // 0-1 scale
  completeness: number; // 0-1 scale
  factualAccuracy: number; // 0-1 scale
}

export interface PerformanceMetrics {
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number;
  tokensPerSecond: number;
  errorRate: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  requestsPerSecond: number;
  errors: Array<{ error: string; count: number }>;
  performanceMetrics: PerformanceMetrics;
}

// ============================================================================
// Local NIM Tester Implementation
// ============================================================================

/**
 * Local NVIDIA NIM Tester for development and validation
 */
export class LocalNIMTester {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly defaultModel: string;

  constructor(
    baseUrl: string = 'http://localhost:1234',
    timeout: number = 30000,
    defaultModel: string = 'nvidia-llama-3_1-nemotron-nano-8b-v1'
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = timeout;
    this.defaultModel = defaultModel;
  }

  // ============================================================================
  // Basic Endpoint Testing
  // ============================================================================

  /**
   * Test if the local NIM endpoint is accessible and responding
   */
  async testLocalEndpoint(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest('/v1/models', 'GET');
      const duration = Date.now() - startTime;

      if (response.ok) {
        const models = await response.json();
        return {
          success: true,
          message: 'Local NIM endpoint is accessible',
          duration,
          details: {
            status: response.status,
            availableModels: models.data?.map((m: any) => m.id) || [],
            endpoint: this.baseUrl
          }
        };
      } else {
        return {
          success: false,
          message: `Endpoint returned status ${response.status}`,
          duration,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        message: 'Failed to connect to local NIM endpoint',
        duration,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Test chat completion functionality
   */
  async testChatCompletion(
    prompt: string = 'Hello, how are you today?',
    options: Partial<ChatCompletionRequest> = {}
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const request = new ChatCompletionRequestBuilder()
        .setModel(options.model || this.defaultModel)
        .addMessage('user', prompt)
        .setTemperature(options.temperature || 0.7)
        .setMaxTokens(options.max_tokens || 100)
        .setStreaming(options.stream || false)
        .build();

      const response = await this.makeRequest('/v1/chat/completions', 'POST', request);
      const duration = Date.now() - startTime;

      if (response.ok) {
        const result: ChatCompletionResponse = await response.json();
        return {
          success: true,
          message: 'Chat completion successful',
          duration,
          details: {
            model: result.model,
            response: result.choices[0]?.message?.content || 'No response',
            tokensUsed: result.usage?.total_tokens || 0,
            finishReason: result.choices[0]?.finish_reason
          }
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          message: `Chat completion failed with status ${response.status}`,
          duration,
          error: errorText
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        message: 'Chat completion request failed',
        duration,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Test embedding generation functionality
   */
  async testEmbeddingGeneration(
    text: string = 'This is a test sentence for embedding generation.',
    model?: string
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const request = new EmbeddingRequestBuilder()
        .setModel(model || 'text-embedding-ada-002')
        .setInput(text)
        .setEncodingFormat('float')
        .build();

      const response = await this.makeRequest('/v1/embeddings', 'POST', request);
      const duration = Date.now() - startTime;

      if (response.ok) {
        const result: EmbeddingResponse = await response.json();
        return {
          success: true,
          message: 'Embedding generation successful',
          duration,
          details: {
            model: result.model,
            embeddingDimensions: result.data[0]?.embedding?.length || 0,
            tokensUsed: result.usage?.total_tokens || 0
          }
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          message: `Embedding generation failed with status ${response.status}`,
          duration,
          error: errorText
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        message: 'Embedding generation request failed',
        duration,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // ============================================================================
  // Model Response Validation
  // ============================================================================

  /**
   * Validate model response quality and coherence
   */
  async validateModelResponse(
    prompt: string,
    expectedTopics?: string[],
    minLength?: number
  ): Promise<ValidationResult> {
    try {
      const testResult = await this.testChatCompletion(prompt, { max_tokens: 200 });
      
      if (!testResult.success) {
        return {
          valid: false,
          confidence: 0,
          issues: [`Failed to get response: ${testResult.error}`],
          suggestions: ['Check if the local NIM service is running', 'Verify the model is loaded correctly'],
          responseQuality: {
            coherence: 0,
            relevance: 0,
            completeness: 0,
            factualAccuracy: 0
          }
        };
      }

      const response = testResult.details?.response || '';
      const issues: string[] = [];
      const suggestions: string[] = [];

      // Basic validation checks
      if (!response || response.trim().length === 0) {
        issues.push('Empty response received');
        suggestions.push('Check model configuration and prompt formatting');
      }

      if (minLength && response.length < minLength) {
        issues.push(`Response too short (${response.length} < ${minLength} characters)`);
        suggestions.push('Increase max_tokens parameter or adjust prompt');
      }

      // Check for repetitive content
      const words = response.toLowerCase().split(/\s+/);
      const uniqueWords = new Set(words);
      const repetitionRatio = uniqueWords.size / words.length;
      
      if (repetitionRatio < 0.5) {
        issues.push('High repetition detected in response');
        suggestions.push('Adjust temperature or use different sampling parameters');
      }

      // Topic relevance check
      let topicRelevance = 1.0;
      if (expectedTopics && expectedTopics.length > 0) {
        const responseText = response.toLowerCase();
        const matchedTopics = expectedTopics.filter(topic => 
          responseText.includes(topic.toLowerCase())
        );
        topicRelevance = matchedTopics.length / expectedTopics.length;
        
        if (topicRelevance < 0.5) {
          issues.push('Response does not address expected topics');
          suggestions.push('Refine the prompt to be more specific about required topics');
        }
      }

      // Calculate quality metrics
      const responseQuality: ResponseQuality = {
        coherence: Math.max(0, repetitionRatio * 2 - 0.5), // Penalize repetition
        relevance: topicRelevance,
        completeness: Math.min(1, response.length / (minLength || 50)),
        factualAccuracy: 0.8 // Placeholder - would need more sophisticated analysis
      };

      const overallConfidence = Object.values(responseQuality).reduce((a, b) => a + b, 0) / 4;

      return {
        valid: issues.length === 0,
        confidence: overallConfidence,
        issues,
        suggestions,
        responseQuality
      };
    } catch (error) {
      return {
        valid: false,
        confidence: 0,
        issues: [`Validation failed: ${error instanceof Error ? error.message : String(error)}`],
        suggestions: ['Check network connectivity and service availability'],
        responseQuality: {
          coherence: 0,
          relevance: 0,
          completeness: 0,
          factualAccuracy: 0
        }
      };
    }
  }

  // ============================================================================
  // Performance Benchmarking
  // ============================================================================

  /**
   * Run performance benchmarks on the local NIM service
   */
  async benchmarkPerformance(
    testCases: Array<{ prompt: string; maxTokens?: number }> = [],
    iterations: number = 10
  ): Promise<PerformanceMetrics> {
    // Default test cases if none provided
    if (testCases.length === 0) {
      testCases = [
        { prompt: 'Explain quantum computing in simple terms.', maxTokens: 100 },
        { prompt: 'Write a short story about a robot.', maxTokens: 150 },
        { prompt: 'What are the benefits of renewable energy?', maxTokens: 120 }
      ];
    }

    const results: Array<{ duration: number; success: boolean; tokens: number }> = [];
    const errors: string[] = [];

    console.log(`Running performance benchmark with ${iterations} iterations...`);

    for (let i = 0; i < iterations; i++) {
      const testCase = testCases[i % testCases.length];
      
      try {
        const result = await this.testChatCompletion(testCase.prompt, {
          max_tokens: testCase.maxTokens || 100
        });

        results.push({
          duration: result.duration,
          success: result.success,
          tokens: result.details?.tokensUsed || 0
        });

        if (!result.success) {
          errors.push(result.error || 'Unknown error');
        }
      } catch (error) {
        results.push({
          duration: 0,
          success: false,
          tokens: 0
        });
        errors.push(error instanceof Error ? error.message : String(error));
      }

      // Small delay between requests to avoid overwhelming the service
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate metrics
    const successfulResults = results.filter(r => r.success);
    const durations = successfulResults.map(r => r.duration);
    const totalTokens = successfulResults.reduce((sum, r) => sum + r.tokens, 0);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);

    durations.sort((a, b) => a - b);

    return {
      averageLatency: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      p95Latency: durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] : 0,
      p99Latency: durations.length > 0 ? durations[Math.floor(durations.length * 0.99)] : 0,
      throughput: successfulResults.length / (totalDuration / 1000), // requests per second
      tokensPerSecond: totalDuration > 0 ? (totalTokens / (totalDuration / 1000)) : 0,
      errorRate: (results.length - successfulResults.length) / results.length
    };
  }

  /**
   * Run load testing on the local NIM service
   */
  async runLoadTest(
    concurrentRequests: number = 5,
    totalRequests: number = 50,
    prompt: string = 'Generate a creative response about artificial intelligence.'
  ): Promise<LoadTestResult> {
    console.log(`Starting load test: ${totalRequests} requests with ${concurrentRequests} concurrent connections`);

    const results: Array<{ success: boolean; duration: number; error?: string }> = [];
    const startTime = Date.now();

    // Create batches of concurrent requests
    const batches: Array<Promise<void>[]> = [];
    for (let i = 0; i < totalRequests; i += concurrentRequests) {
      const batchSize = Math.min(concurrentRequests, totalRequests - i);
      const batch: Promise<void>[] = [];

      for (let j = 0; j < batchSize; j++) {
        batch.push(
          (async () => {
            try {
              const result = await this.testChatCompletion(prompt, { max_tokens: 50 });
              results.push({
                success: result.success,
                duration: result.duration,
                error: result.error
              });
            } catch (error) {
              results.push({
                success: false,
                duration: 0,
                error: error instanceof Error ? error.message : String(error)
              });
            }
          })()
        );
      }

      batches.push(batch);
    }

    // Execute batches sequentially to control load
    for (const batch of batches) {
      await Promise.all(batch);
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const totalDuration = Date.now() - startTime;
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.length - successfulRequests;

    // Collect error statistics
    const errorCounts: Record<string, number> = {};
    results.forEach(r => {
      if (!r.success && r.error) {
        errorCounts[r.error] = (errorCounts[r.error] || 0) + 1;
      }
    });

    const errors = Object.entries(errorCounts).map(([error, count]) => ({ error, count }));

    // Calculate response time statistics
    const successfulDurations = results.filter(r => r.success).map(r => r.duration);
    successfulDurations.sort((a, b) => a - b);

    const performanceMetrics: PerformanceMetrics = {
      averageLatency: successfulDurations.length > 0 
        ? successfulDurations.reduce((a, b) => a + b, 0) / successfulDurations.length 
        : 0,
      p95Latency: successfulDurations.length > 0 
        ? successfulDurations[Math.floor(successfulDurations.length * 0.95)] 
        : 0,
      p99Latency: successfulDurations.length > 0 
        ? successfulDurations[Math.floor(successfulDurations.length * 0.99)] 
        : 0,
      throughput: (successfulRequests / (totalDuration / 1000)),
      tokensPerSecond: 0, // Would need to track tokens from responses
      errorRate: failedRequests / results.length
    };

    return {
      totalRequests: results.length,
      successfulRequests,
      failedRequests,
      averageResponseTime: performanceMetrics.averageLatency,
      maxResponseTime: Math.max(...successfulDurations, 0),
      minResponseTime: Math.min(...successfulDurations, Infinity) || 0,
      requestsPerSecond: performanceMetrics.throughput,
      errors,
      performanceMetrics
    };
  }

  // ============================================================================
  // Health Monitoring
  // ============================================================================

  /**
   * Get comprehensive health status of the local NIM service
   */
  async getServiceHealth(): Promise<NIMServiceHealth> {
    const startTime = Date.now();

    try {
      // Test basic connectivity
      const endpointTest = await this.testLocalEndpoint();
      
      // Test chat completion
      const chatTest = await this.testChatCompletion('Health check test', { max_tokens: 10 });
      
      // Test embedding (if available)
      let embeddingTest: TestResult;
      try {
        embeddingTest = await this.testEmbeddingGeneration('Health check');
      } catch {
        embeddingTest = { success: false, message: 'Embedding service not available', duration: 0 };
      }

      const responseTime = Date.now() - startTime;
      const chatAvailable = chatTest.success;
      const embeddingAvailable = embeddingTest.success;
      const overallHealthy = endpointTest.success && chatAvailable;

      return {
        status: overallHealthy ? 'healthy' : 'unhealthy',
        chatService: {
          available: chatAvailable,
          responseTime: chatTest.duration,
          errorRate: chatAvailable ? 0 : 1,
          lastError: chatTest.error
        },
        embeddingService: {
          available: embeddingAvailable,
          responseTime: embeddingTest.duration,
          errorRate: embeddingAvailable ? 0 : 1,
          lastError: embeddingTest.error
        },
        lastChecked: new Date(),
        uptime: responseTime,
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

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Make HTTP request to the local NIM service
   */
  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(this.timeout)
    };

    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }

    return fetch(url, options);
  }

  /**
   * Generate test report
   */
  async generateTestReport(): Promise<{
    summary: string;
    endpointTest: TestResult;
    chatTest: TestResult;
    embeddingTest: TestResult;
    performanceMetrics: PerformanceMetrics;
    healthStatus: NIMServiceHealth;
  }> {
    console.log('Generating comprehensive test report...');

    const endpointTest = await this.testLocalEndpoint();
    const chatTest = await this.testChatCompletion();
    const embeddingTest = await this.testEmbeddingGeneration();
    const performanceMetrics = await this.benchmarkPerformance();
    const healthStatus = await this.getServiceHealth();

    const allTestsPassed = endpointTest.success && chatTest.success;
    const summary = allTestsPassed 
      ? 'All tests passed - Local NIM service is functioning correctly'
      : 'Some tests failed - Check individual test results for details';

    return {
      summary,
      endpointTest,
      chatTest,
      embeddingTest,
      performanceMetrics,
      healthStatus
    };
  }
}