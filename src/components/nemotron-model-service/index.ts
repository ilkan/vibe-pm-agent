import { BedrockRuntimeClient } from '../bedrock-runtime-client/index';
import { BedrockConfig, ModelPayload, ModelResponse, NemotronServiceConfig } from '../../models/bedrock';

/**
 * Nemotron Model Service for Llama 3.1 Nemotron Nano 8B V1 model invocation and response handling
 * Provides high-level interface for business analysis enhancement using Bedrock Nemotron model
 */
export class NemotronModelService {
  private bedrockClient: BedrockRuntimeClient;
  private config: NemotronServiceConfig;

  constructor(config: NemotronServiceConfig) {
    this.config = config;
    this.bedrockClient = new BedrockRuntimeClient({
      modelId: config.modelId,
      region: config.region,
      endpoint: config.endpoint,
      credentials: config.credentials,
      maxTokens: config.maxTokens,
      temperature: config.temperature
    });
  }

  /**
   * Enhance business analysis with Nemotron reasoning
   */
  async enhanceBusinessAnalysis(analysis: any, context: string): Promise<any> {
    const prompt = this.buildBusinessAnalysisPrompt(analysis, context);
    
    const response = await this.bedrockClient.invokeModel(
      this.config.modelId,
      {
        prompt,
        max_gen_len: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: 0.9
      }
    );

    return this.processBusinessAnalysisResponse(analysis, response);
  }

  /**
   * Enhance market opportunity analysis with Nemotron insights
   */
  async enhanceMarketOpportunity(opportunity: any): Promise<any> {
    const prompt = `As an expert market analyst, enhance this market opportunity analysis with deeper strategic insights:

Market Opportunity: ${JSON.stringify(opportunity, null, 2)}

Provide enhanced analysis covering:
1. Competitive positioning and differentiation opportunities
2. Market timing and entry strategy recommendations
3. Risk assessment and mitigation strategies
4. Revenue model optimization suggestions
5. Strategic partnerships and ecosystem considerations

Format your response as structured insights with confidence scores.`;

    const response = await this.bedrockClient.invokeModel(
      this.config.modelId,
      {
        prompt,
        max_gen_len: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: 0.9
      }
    );

    return {
      ...opportunity,
      nemotronEnhancement: {
        strategicInsights: this.extractStrategicInsights(response.generation),
        competitiveAnalysis: this.extractCompetitiveAnalysis(response.generation),
        riskAssessment: this.extractRiskAssessment(response.generation),
        recommendations: this.extractRecommendations(response.generation),
        confidence: this.calculateAnalysisConfidence(response)
      },
      enhancementMetadata: {
        modelUsed: this.config.modelId,
        processingTime: Date.now(),
        responseLength: response.generation.length
      }
    };
  }

  /**
   * Enhance strategic alignment assessment with Nemotron reasoning
   */
  async enhanceStrategicAlignment(alignment: any, companyContext: any): Promise<any> {
    const prompt = `As a strategic business consultant, enhance this strategic alignment assessment:

Strategic Alignment: ${JSON.stringify(alignment, null, 2)}
Company Context: ${JSON.stringify(companyContext, null, 2)}

Provide enhanced strategic analysis including:
1. Alignment score justification with detailed reasoning
2. Strategic fit assessment across multiple dimensions
3. Resource allocation recommendations
4. Timeline and prioritization guidance
5. Success metrics and KPI recommendations

Focus on actionable strategic insights.`;

    const response = await this.bedrockClient.invokeModel(
      this.config.modelId,
      {
        prompt,
        max_gen_len: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: 0.9
      }
    );

    return {
      ...alignment,
      nemotronEnhancement: {
        strategicReasoning: response.generation,
        alignmentJustification: this.extractAlignmentJustification(response.generation),
        resourceRecommendations: this.extractResourceRecommendations(response.generation),
        successMetrics: this.extractSuccessMetrics(response.generation),
        confidence: this.calculateAnalysisConfidence(response)
      }
    };
  }

  /**
   * Enhance document generation with Nemotron-powered insights
   */
  async enhanceDocumentGeneration(document: any, documentType: string): Promise<any> {
    const prompt = `As an expert business writer, enhance this ${documentType} with executive-level insights:

Document: ${JSON.stringify(document, null, 2)}

Enhance with:
1. Executive summary optimization
2. Key insights and recommendations
3. Data-driven supporting arguments
4. Risk and opportunity analysis
5. Clear next steps and action items

Maintain professional tone suitable for executive audiences.`;

    const response = await this.bedrockClient.invokeModel(
      this.config.modelId,
      {
        prompt,
        max_gen_len: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: 0.9
      }
    );

    return {
      ...document,
      nemotronEnhancement: {
        executiveSummary: this.extractExecutiveSummary(response.generation),
        keyInsights: this.extractKeyInsights(response.generation),
        recommendations: this.extractRecommendations(response.generation),
        nextSteps: this.extractNextSteps(response.generation),
        confidence: this.calculateAnalysisConfidence(response)
      }
    };
  }

  /**
   * Build business analysis prompt for Nemotron model
   */
  private buildBusinessAnalysisPrompt(analysis: any, context: string): string {
    return `You are a senior business consultant with expertise in strategic analysis. Enhance the following business analysis with deeper insights and actionable recommendations.

Context: ${context}
Analysis: ${JSON.stringify(analysis, null, 2)}

Provide enhanced analysis with:
1. Strategic implications and business impact
2. Competitive positioning and market dynamics
3. Risk assessment and mitigation strategies
4. Implementation recommendations with priorities
5. Success metrics and measurement framework

Focus on executive-level insights that drive decision-making.`;
  }

  /**
   * Process business analysis response from Nemotron model
   */
  private processBusinessAnalysisResponse(originalAnalysis: any, response: ModelResponse): any {
    return {
      ...originalAnalysis,
      nemotronEnhancement: {
        strategicInsights: this.extractStrategicInsights(response.generation),
        businessImpact: this.extractBusinessImpact(response.generation),
        recommendations: this.extractRecommendations(response.generation),
        riskAssessment: this.extractRiskAssessment(response.generation),
        successMetrics: this.extractSuccessMetrics(response.generation),
        confidence: this.calculateAnalysisConfidence(response)
      },
      enhancementMetadata: {
        modelUsed: this.config.modelId,
        processingTime: Date.now(),
        responseQuality: this.assessResponseQuality(response.generation)
      }
    };
  }

  /**
   * Extract strategic insights from model response
   */
  private extractStrategicInsights(generation: string): string[] {
    const insights: string[] = [];
    const sections = generation.split(/\d+\.\s*Strategic|Strategic/i);
    
    if (sections.length > 1) {
      const strategicSection = sections[1];
      const lines = strategicSection.split('\n').filter(line => line.trim());
      insights.push(...lines.slice(0, 3).map(line => line.trim()));
    }
    
    return insights;
  }

  /**
   * Extract competitive analysis from model response
   */
  private extractCompetitiveAnalysis(generation: string): string[] {
    const analysis: string[] = [];
    const sections = generation.split(/competitive|competition/i);
    
    if (sections.length > 1) {
      const competitiveSection = sections[1];
      const lines = competitiveSection.split('\n').filter(line => line.trim());
      analysis.push(...lines.slice(0, 3).map(line => line.trim()));
    }
    
    return analysis;
  }

  /**
   * Extract risk assessment from model response
   */
  private extractRiskAssessment(generation: string): string[] {
    const risks: string[] = [];
    const sections = generation.split(/risk|risks/i);
    
    if (sections.length > 1) {
      const riskSection = sections[1];
      const lines = riskSection.split('\n').filter(line => line.trim());
      risks.push(...lines.slice(0, 3).map(line => line.trim()));
    }
    
    return risks;
  }

  /**
   * Extract recommendations from model response
   */
  private extractRecommendations(generation: string): string[] {
    const recommendations: string[] = [];
    const bulletRegex = /[•\-\*]\s*(.+)/g;
    const numberedRegex = /\d+\.\s*(.+)/g;
    
    let match;
    while ((match = bulletRegex.exec(generation)) !== null) {
      recommendations.push(match[1].trim());
    }
    
    while ((match = numberedRegex.exec(generation)) !== null) {
      recommendations.push(match[1].trim());
    }
    
    return recommendations.slice(0, 5);
  }

  /**
   * Extract other analysis components
   */
  private extractBusinessImpact(generation: string): string[] {
    return this.extractSectionContent(generation, /business impact|impact/i);
  }

  private extractAlignmentJustification(generation: string): string[] {
    return this.extractSectionContent(generation, /alignment|justification/i);
  }

  private extractResourceRecommendations(generation: string): string[] {
    return this.extractSectionContent(generation, /resource|allocation/i);
  }

  private extractSuccessMetrics(generation: string): string[] {
    return this.extractSectionContent(generation, /metrics|kpi|success/i);
  }

  private extractExecutiveSummary(generation: string): string {
    const sections = generation.split(/executive summary|summary/i);
    if (sections.length > 1) {
      return sections[1].split('\n').slice(0, 3).join(' ').trim();
    }
    return generation.substring(0, 200) + '...';
  }

  private extractKeyInsights(generation: string): string[] {
    return this.extractSectionContent(generation, /insights|key findings/i);
  }

  private extractNextSteps(generation: string): string[] {
    return this.extractSectionContent(generation, /next steps|action items/i);
  }

  /**
   * Generic section content extractor
   */
  private extractSectionContent(generation: string, pattern: RegExp): string[] {
    const content: string[] = [];
    const sections = generation.split(pattern);
    
    if (sections.length > 1) {
      const section = sections[1];
      const lines = section.split('\n').filter(line => line.trim());
      content.push(...lines.slice(0, 3).map(line => line.trim()));
    }
    
    return content;
  }

  /**
   * Calculate confidence score for analysis quality
   */
  private calculateAnalysisConfidence(response: ModelResponse): number {
    const length = response.generation.length;
    const hasStructure = /\d+\.|[•\-\*]/.test(response.generation);
    const hasKeywords = /strategic|business|market|competitive|risk|recommend/i.test(response.generation);
    
    let confidence = 0.5;
    
    if (length > 500) confidence += 0.2;
    if (hasStructure) confidence += 0.15;
    if (hasKeywords) confidence += 0.15;
    if (response.stop_reason === 'stop') confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  /**
   * Assess response quality
   */
  private assessResponseQuality(generation: string): 'high' | 'medium' | 'low' {
    const length = generation.length;
    const hasStructure = /\d+\.|[•\-\*]/.test(generation);
    const hasKeywords = /strategic|business|market|competitive|risk|recommend/i.test(generation);
    
    if (length > 800 && hasStructure && hasKeywords) return 'high';
    if (length > 400 && (hasStructure || hasKeywords)) return 'medium';
    return 'low';
  }
}