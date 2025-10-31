import { BedrockRuntimeClient } from '../bedrock-runtime-client/index';
import { BedrockErrorHandler } from '../bedrock-error-handler/index';
import { BedrockConfig, EnhancedToolResponse, BEDROCK_MODELS, DEFAULT_BEDROCK_CONFIG } from '../../models/bedrock';

/**
 * MCP Tool Enhancement Pipeline
 * Augments existing MCP tool responses with local NVIDIA NIM reasoning
 */
export class MCPToolEnhancer {
  private bedrockClient: BedrockRuntimeClient;
  private errorHandler: BedrockErrorHandler;
  private config: BedrockConfig;

  constructor(config?: Partial<BedrockConfig>) {
    this.config = {
      ...DEFAULT_BEDROCK_CONFIG,
      modelId: BEDROCK_MODELS.LLAMA_NEMOTRON_NANO_8B,
      ...config
    };
    
    this.bedrockClient = new BedrockRuntimeClient(this.config);
    this.errorHandler = new BedrockErrorHandler();
  }

  /**
   * Enhance MCP tool execution with local NIM reasoning
   */
  async enhanceToolExecution(
    toolName: string, 
    params: any, 
    originalResponse: any
  ): Promise<EnhancedToolResponse> {
    
    const enhanceOperation = async () => {
      // Prepare context for NIM model
      const prompt = this.buildEnhancementPrompt(toolName, params, originalResponse);
      
      // Apply local NIM reasoning
      const reasoning = await this.bedrockClient.invokeModel(
        this.config.modelId,
        {
          prompt,
          max_gen_len: 2048,
          temperature: 0.7,
          top_p: 0.9
        }
      );
      
      // Synthesize enhanced response
      return this.synthesizeEnhancedResponse(originalResponse, reasoning);
    };

    const fallbackOperation = async () => {
      return this.createFallbackResponse(originalResponse);
    };

    return this.errorHandler.executeWithFallback(
      enhanceOperation,
      fallbackOperation,
      `Tool: ${toolName}`
    );
  }

  /**
   * Build enhancement prompt for specific tool types
   */
  private buildEnhancementPrompt(toolName: string, params: any, originalResponse: any): string {
    const basePrompt = `You are an expert business analyst. Enhance the following tool response with deeper insights and actionable recommendations.

Tool: ${toolName}
Parameters: ${JSON.stringify(params, null, 2)}
Original Response: ${JSON.stringify(originalResponse, null, 2)}

Provide enhanced analysis with:`;

    switch (toolName) {
      case 'analyze_business_opportunity':
        return `${basePrompt}
1. Strategic implications and competitive positioning
2. Market timing and entry strategy recommendations
3. Risk assessment and mitigation strategies
4. Revenue model optimization suggestions
5. Key success metrics and measurement framework

Focus on executive-level insights that drive decision-making.`;

      case 'assess_strategic_alignment':
        return `${basePrompt}
1. Alignment score justification with detailed reasoning
2. Strategic fit assessment across multiple dimensions
3. Resource allocation recommendations
4. Timeline and prioritization guidance
5. Success metrics and KPI recommendations

Provide actionable strategic insights.`;

      case 'validate_market_timing':
        return `${basePrompt}
1. Market readiness indicators and timing signals
2. Competitive landscape analysis and positioning
3. Technology adoption curve assessment
4. Economic and regulatory factors
5. Implementation timeline recommendations

Focus on timing-specific insights and market dynamics.`;

      case 'generate_business_case':
        return `${basePrompt}
1. Financial model validation and optimization
2. Risk-adjusted ROI calculations
3. Scenario analysis (best/base/worst case)
4. Implementation roadmap and milestones
5. Executive summary optimization

Enhance with data-driven financial insights.`;

      default:
        return `${basePrompt}
1. Strategic business implications
2. Implementation recommendations
3. Risk assessment and mitigation
4. Success metrics and KPIs
5. Next steps and action items

Provide comprehensive business analysis.`;
    }
  }

  /**
   * Synthesize enhanced response with NIM reasoning
   */
  private synthesizeEnhancedResponse(
    originalResponse: any, 
    reasoning: any
  ): EnhancedToolResponse {
    return {
      ...originalResponse,
      bedrockReasoning: reasoning.generation,
      confidence: this.calculateConfidence(reasoning),
      insights: this.extractInsights(reasoning.generation),
      enhancementMetadata: {
        bedrockModelUsed: this.config.modelId,
        processingTime: Date.now(),
        region: this.config.region,
        endpoint: this.config.endpoint
      }
    };
  }

  /**
   * Create fallback response when enhancement fails
   */
  private createFallbackResponse(originalResponse: any): EnhancedToolResponse {
    return {
      ...originalResponse,
      bedrockReasoning: null,
      confidence: Math.max((originalResponse.confidence || 0.5) - 0.1, 0.1),
      insights: [],
      enhancementMetadata: {
        bedrockModelUsed: null,
        processingTime: Date.now(),
        region: this.config.region,
        endpoint: this.config.endpoint,
        fallbackUsed: true
      }
    };
  }

  /**
   * Calculate confidence score based on reasoning quality
   */
  private calculateConfidence(reasoning: any): number {
    const generation = reasoning.generation || '';
    const length = generation.length;
    const hasStructure = /\d+\.|[•\-\*]/.test(generation);
    const hasKeywords = /strategic|business|market|competitive|risk|recommend/i.test(generation);
    
    let confidence = 0.5;
    
    if (length > 500) confidence += 0.2;
    if (hasStructure) confidence += 0.15;
    if (hasKeywords) confidence += 0.15;
    if (reasoning.stop_reason === 'stop') confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  /**
   * Extract key insights from reasoning
   */
  private extractInsights(generation: string): string[] {
    const insights: string[] = [];
    
    // Extract numbered points
    const numberedRegex = /\d+\.\s*\*\*([^*]+)\*\*:?\s*([^.\n]+)/g;
    let match;
    while ((match = numberedRegex.exec(generation)) !== null) {
      insights.push(`${match[1]}: ${match[2]}`);
    }
    
    // Extract bullet points if no numbered points found
    if (insights.length === 0) {
      const bulletRegex = /[•\-\*]\s*\*\*([^*]+)\*\*:?\s*([^.\n]+)/g;
      while ((match = bulletRegex.exec(generation)) !== null) {
        insights.push(`${match[1]}: ${match[2]}`);
      }
    }
    
    // Fallback to simple sentence extraction
    if (insights.length === 0) {
      const sentences = generation.split(/[.!?]+/).filter(s => s.trim().length > 20);
      insights.push(...sentences.slice(0, 3).map(s => s.trim()));
    }
    
    return insights.slice(0, 5); // Limit to top 5 insights
  }

  /**
   * Health check for the enhancement pipeline
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const bedrockHealth = await this.bedrockClient.healthCheck();
      
      return {
        status: bedrockHealth.status === 'healthy' ? 'operational' : 'degraded',
        details: {
          bedrockService: bedrockHealth,
          configuration: {
            modelId: this.config.modelId,
            endpoint: this.config.endpoint,
            region: this.config.region
          },
          capabilities: [
            'business_opportunity_enhancement',
            'strategic_alignment_enhancement', 
            'market_timing_enhancement',
            'business_case_enhancement',
            'general_tool_enhancement'
          ]
        }
      };
    } catch (error) {
      return {
        status: 'error',
        details: {
          error: error.message,
          fallbackAvailable: true
        }
      };
    }
  }

  /**
   * Get enhancement statistics
   */
  getEnhancementStats(): any {
    return {
      modelUsed: this.config.modelId,
      endpoint: this.config.endpoint,
      supportedTools: [
        'analyze_business_opportunity',
        'assess_strategic_alignment',
        'validate_market_timing',
        'generate_business_case',
        'create_stakeholder_communication',
        'generate_management_onepager',
        'generate_pr_faq'
      ],
      enhancementFeatures: [
        'strategic_insights',
        'competitive_analysis',
        'risk_assessment',
        'implementation_recommendations',
        'success_metrics'
      ]
    };
  }
}