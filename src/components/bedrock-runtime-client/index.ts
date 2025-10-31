import { BedrockConfig, ModelPayload, ModelResponse, ServiceStatus, EnhancedResponse } from '../../models/bedrock';

/**
 * Local NVIDIA NIM Runtime Client for Llama 3.1 Nemotron Nano 8B V1 model access
 * Provides interface to local NVIDIA NIM service running on localhost:1234
 */
export class BedrockRuntimeClient {
  private config: BedrockConfig;
  private baseUrl: string;

  constructor(config: BedrockConfig) {
    this.config = config;
    this.baseUrl = config.endpoint || 'http://localhost:1234';
  }

  /**
   * Invoke Llama 3.1 Nemotron Nano 8B V1 model via local NVIDIA NIM service
   */
  async invokeModel(modelId: string, payload: ModelPayload): Promise<ModelResponse> {
    try {
      const requestBody = {
        model: "nvidia-llama-3_1-nemotron-nano-8b-v1",
        messages: [
          {
            role: "system",
            content: "You are an expert business analyst providing strategic insights and recommendations."
          },
          {
            role: "user",
            content: payload.prompt
          }
        ],
        temperature: payload.temperature || 0.7,
        max_tokens: payload.max_gen_len || 2048,
        stream: false
      };

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseBody: any = await response.json();

      return {
        generation: responseBody.choices?.[0]?.message?.content || '',
        stop_reason: responseBody.choices?.[0]?.finish_reason || 'stop',
        usage: {
          prompt_tokens: responseBody.usage?.prompt_tokens || 0,
          completion_tokens: responseBody.usage?.completion_tokens || 0,
          total_tokens: responseBody.usage?.total_tokens || 0
        },
        modelId: "nvidia-llama-3_1-nemotron-nano-8b-v1",
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Local NIM model invocation failed: ${error.message}`);
    }
  }

  /**
   * Enhance MCP tool response with Bedrock model reasoning
   */
  async enhanceToolResponse(toolResponse: any, context: string): Promise<EnhancedResponse> {
    try {
      const prompt = `You are an expert business analyst. Enhance the following tool response with deeper insights and reasoning.

Context: ${context}
Tool Response: ${JSON.stringify(toolResponse)}

Provide enhanced analysis with actionable insights:`;

      const reasoning = await this.invokeModel(
        this.config.modelId,
        {
          prompt,
          max_gen_len: 2048,
          temperature: 0.7,
          top_p: 0.9
        }
      );

      return {
        ...toolResponse,
        bedrockReasoning: reasoning.generation,
        confidence: this.calculateConfidence(reasoning),
        insights: this.extractInsights(reasoning.generation),
        enhancementMetadata: {
          bedrockModelUsed: this.config.modelId,
          processingTime: Date.now(),
          region: this.config.region
        }
      };
    } catch (error) {
      // Fallback to original response if enhancement fails
      console.warn('Bedrock enhancement failed, returning original response:', error.message);
      return {
        ...toolResponse,
        bedrockReasoning: null,
        confidence: 0.5,
        insights: [],
        enhancementMetadata: {
          bedrockModelUsed: null,
          processingTime: Date.now(),
          region: this.config.region,
          error: error.message
        }
      };
    }
  }

  /**
   * Health check for local NVIDIA NIM service availability
   */
  async healthCheck(): Promise<ServiceStatus> {
    try {
      const testPayload: ModelPayload = {
        prompt: "Test connection",
        max_gen_len: 10,
        temperature: 0.1,
        top_p: 0.9
      };

      await this.invokeModel("nvidia-llama-3_1-nemotron-nano-8b-v1", testPayload);
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        modelId: "nvidia-llama-3_1-nemotron-nano-8b-v1",
        region: 'local',
        endpoint: this.baseUrl
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        modelId: "nvidia-llama-3_1-nemotron-nano-8b-v1",
        region: 'local',
        endpoint: this.baseUrl,
        error: error.message
      };
    }
  }

  /**
   * Calculate confidence score based on model response
   */
  private calculateConfidence(response: ModelResponse): number {
    // Simple confidence calculation based on response completeness
    if (!response.generation || response.generation.length < 50) {
      return 0.3;
    }
    if (response.stop_reason === 'stop') {
      return 0.85;
    }
    return 0.7;
  }

  /**
   * Extract key insights from Bedrock model response
   */
  private extractInsights(generation: string): string[] {
    const insights: string[] = [];
    
    // Extract bullet points or numbered lists as insights
    const bulletRegex = /[•\-\*]\s*(.+)/g;
    const numberedRegex = /\d+\.\s*(.+)/g;
    
    let match;
    while ((match = bulletRegex.exec(generation)) !== null) {
      insights.push(match[1].trim());
    }
    
    while ((match = numberedRegex.exec(generation)) !== null) {
      insights.push(match[1].trim());
    }
    
    return insights.slice(0, 5); // Limit to top 5 insights
  }
}