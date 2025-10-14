/**
 * Market Context Fetcher Component
 * 
 * Integrates existing market intelligence services to provide real-time market data
 * for case study scenarios and assumption validation.
 */

import { MarketAnalyzer } from '../market-analyzer/index';
import { CompetitorAnalyzer } from '../competitor-analyzer/index';
import {
  MarketSizingArgs,
  MarketSizingResult,
  CompetitiveAnalysisArgs,
  CompetitorAnalysisResult,
  MarketContext,
} from '../../models/competitive';
import {
  CaseMarketContext,
  MarketIntelligence,
  IndustryTrends,
  CompetitiveInsights,
  MarketAssumptionValidation,
} from '../../models/interview';

export interface MarketContextFetcherConfig {
  enableRealTimeData: boolean;
  cacheTimeout: number; // in milliseconds
  confidenceThreshold: number;
  maxRetries: number;
}

export interface MarketDataRequest {
  industry: string;
  geography?: string[];
  customerSegments?: string[];
  featureIdea?: string;
  timeframe?: string;
}

export interface MarketValidationRequest {
  assumptions: string[];
  industry: string;
  marketContext?: MarketContext;
}

export class MarketContextFetcher {
  private marketAnalyzer: MarketAnalyzer;
  private competitorAnalyzer: CompetitorAnalyzer;
  private dataCache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(private config: MarketContextFetcherConfig = {
    enableRealTimeData: true,
    cacheTimeout: 30 * 60 * 1000, // 30 minutes
    confidenceThreshold: 0.6,
    maxRetries: 3
  }) {
    this.marketAnalyzer = new MarketAnalyzer({
      confidenceThreshold: config.confidenceThreshold,
      enableScenarioAnalysis: true,
    });
    this.competitorAnalyzer = new CompetitorAnalyzer({
      confidenceThreshold: config.confidenceThreshold,
    });
  }

  /**
   * Fetch comprehensive market context for case study scenarios
   */
  async fetchMarketContext(request: MarketDataRequest): Promise<CaseMarketContext> {
    const cacheKey = this.generateCacheKey('market_context', request);
    
    // Check cache first
    if (this.config.enableRealTimeData) {
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached as CaseMarketContext;
      }
    }

    try {
      // Fetch market sizing data
      const marketSizing = await this.fetchMarketSizing(request);
      
      // Fetch competitive landscape
      const competitiveData = await this.fetchCompetitiveData(request);
      
      // Extract industry trends
      const trends = this.extractIndustryTrends(marketSizing, competitiveData);
      
      // Generate key metrics
      const keyMetrics = this.generateKeyMetrics(marketSizing, competitiveData);
      
      // Create market assumptions
      const assumptions = this.generateMarketAssumptions(marketSizing, competitiveData);

      const marketContext: CaseMarketContext = {
        industry: request.industry,
        marketSize: {
          tam: marketSizing.tam.value,
          sam: marketSizing.sam.value,
          som: marketSizing.som.value,
          currency: marketSizing.tam.currency,
          timeframe: marketSizing.tam.timeframe,
          growthRate: marketSizing.tam.growthRate,
        },
        competitors: competitiveData.competitiveMatrix.competitors.map(c => c.name),
        trends,
        keyMetrics,
        assumptions,
        competitiveInsights: {
          marketLeader: this.identifyMarketLeader(competitiveData),
          marketGaps: competitiveData.marketPositioning.marketGaps.map(gap => gap.description),
          differentiationOpportunities: competitiveData.competitiveMatrix.differentiationOpportunities,
        },
        dataFreshness: {
          lastUpdated: new Date().toISOString(),
          confidence: Math.min(marketSizing.confidenceIntervals[0]?.confidenceLevel || 0.7, 
                              this.convertConfidenceLevelToNumber(competitiveData.confidenceLevel)),
          sources: [
            ...marketSizing.sourceAttribution.map(s => s.title),
            ...competitiveData.sourceAttribution.map(s => s.title),
          ],
        },
      };

      // Cache the result
      this.setCachedData(cacheKey, marketContext);

      return marketContext;
    } catch (error) {
      throw new Error(`Failed to fetch market context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate case study assumptions against real market data
   */
  async validateAssumptions(request: MarketValidationRequest): Promise<MarketAssumptionValidation[]> {
    const cacheKey = this.generateCacheKey('assumption_validation', request);
    
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached as MarketAssumptionValidation[];
    }

    try {
      // Fetch current market data for validation
      const marketData = await this.fetchMarketContext({
        industry: request.industry,
        geography: request.marketContext?.geography,
      });

      const validations: MarketAssumptionValidation[] = [];

      for (const assumption of request.assumptions) {
        const validation = await this.validateSingleAssumption(assumption, marketData);
        validations.push(validation);
      }

      // Cache the results
      this.setCachedData(cacheKey, validations);

      return validations;
    } catch (error) {
      throw new Error(`Failed to validate assumptions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current market intelligence for industry-specific case studies
   */
  async getMarketIntelligence(industry: string, geography?: string[]): Promise<MarketIntelligence> {
    const cacheKey = this.generateCacheKey('market_intelligence', { industry, geography });
    
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached as MarketIntelligence;
    }

    try {
      const marketContext = await this.fetchMarketContext({
        industry,
        geography,
      });

      const intelligence: MarketIntelligence = {
        industry,
        marketOverview: {
          size: marketContext.marketSize.tam,
          growthRate: marketContext.marketSize.growthRate,
          maturity: this.assessMarketMaturity(marketContext),
          keyDrivers: marketContext.trends.slice(0, 3),
        },
        competitiveLandscape: {
          numberOfCompetitors: marketContext.competitors.length,
          marketConcentration: this.calculateMarketConcentration(marketContext),
          topCompetitors: marketContext.competitors.slice(0, 5),
          competitiveIntensity: this.assessCompetitiveIntensity(marketContext),
        },
        opportunities: {
          marketGaps: marketContext.competitiveInsights?.marketGaps || [],
          emergingTrends: this.identifyEmergingTrends(marketContext.trends),
          underservedSegments: this.identifyUnderservedSegments(marketContext),
        },
        risks: {
          competitiveThreats: this.identifyCompetitiveThreats(marketContext),
          marketRisks: this.identifyMarketRisks(marketContext),
          regulatoryRisks: this.identifyRegulatoryRisks(industry),
        },
        recommendations: {
          entryStrategy: this.generateEntryStrategy(marketContext),
          positioningAdvice: marketContext.competitiveInsights?.differentiationOpportunities || [],
          timingConsiderations: this.generateTimingConsiderations(marketContext),
        },
      };

      // Cache the result
      this.setCachedData(cacheKey, intelligence);

      return intelligence;
    } catch (error) {
      throw new Error(`Failed to get market intelligence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get industry-specific trends for case study context
   */
  async getIndustryTrends(industry: string): Promise<IndustryTrends> {
    const cacheKey = this.generateCacheKey('industry_trends', { industry });
    
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached as IndustryTrends;
    }

    try {
      const marketContext = await this.fetchMarketContext({ industry });

      const trends: IndustryTrends = {
        industry,
        currentTrends: marketContext.trends.map(trend => ({
          name: trend,
          impact: this.assessTrendImpact(trend, industry),
          timeframe: this.estimateTrendTimeframe(trend),
          confidence: 0.7 + Math.random() * 0.2, // Mock confidence score
        })),
        emergingTechnologies: this.identifyEmergingTechnologies(industry),
        marketForces: this.identifyMarketForces(marketContext),
        customerBehaviorShifts: this.identifyCustomerBehaviorShifts(industry),
        regulatoryChanges: this.identifyRegulatoryChanges(industry),
        disruptiveFactors: this.identifyDisruptiveFactors(marketContext),
      };

      // Cache the result
      this.setCachedData(cacheKey, trends);

      return trends;
    } catch (error) {
      throw new Error(`Failed to get industry trends: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private async fetchMarketSizing(request: MarketDataRequest): Promise<MarketSizingResult> {
    const sizingArgs: MarketSizingArgs = {
      feature_idea: request.featureIdea || `Market analysis for ${request.industry}`,
      market_definition: {
        industry: request.industry,
        geography: request.geography || ['Global'],
        customer_segments: request.customerSegments || ['All segments'],
      },
      sizing_methods: ['top-down', 'bottom-up'],
    };

    return await this.marketAnalyzer.analyzeMarketSize(sizingArgs);
  }

  private async fetchCompetitiveData(request: MarketDataRequest): Promise<CompetitorAnalysisResult> {
    const competitiveArgs: CompetitiveAnalysisArgs = {
      feature_idea: request.featureIdea || `Competitive analysis for ${request.industry}`,
      market_context: {
        industry: request.industry,
        geography: request.geography || ['Global'],
        target_segment: request.customerSegments?.[0] || 'General Market',
      },
      analysis_depth: 'standard',
    };

    return await this.competitorAnalyzer.analyzeCompetitors(competitiveArgs);
  }

  private extractIndustryTrends(
    marketSizing: MarketSizingResult,
    competitiveData: CompetitorAnalysisResult
  ): string[] {
    const trends: string[] = [];

    // Extract from market dynamics
    if (marketSizing.marketDynamics) {
      trends.push(...marketSizing.marketDynamics.growthDrivers.slice(0, 2));
      trends.push(...marketSizing.marketDynamics.disruptiveForces.slice(0, 1));
    }

    // Extract from competitive analysis
    const swotOpportunities = (competitiveData.swotAnalysis || [])
      .flatMap(swot => swot.opportunities || [])
      .map(opp => opp.description)
      .slice(0, 2);
    
    trends.push(...swotOpportunities);

    return [...new Set(trends)]; // Remove duplicates
  }

  private generateKeyMetrics(
    marketSizing: MarketSizingResult,
    competitiveData: CompetitorAnalysisResult
  ): Record<string, number> {
    return {
      market_growth_rate: marketSizing.tam.growthRate || 0.07,
      market_penetration: marketSizing.som.value / marketSizing.tam.value,
      competitive_intensity: competitiveData.competitiveMatrix.competitors.length / 10,
      market_concentration: this.calculateHerfindahlIndex(competitiveData.competitiveMatrix.competitors),
      average_market_share: competitiveData.competitiveMatrix.competitors.reduce((sum, c) => sum + c.marketShare, 0) / competitiveData.competitiveMatrix.competitors.length,
    };
  }

  private generateMarketAssumptions(
    marketSizing: MarketSizingResult,
    competitiveData: CompetitorAnalysisResult
  ): string[] {
    const assumptions: string[] = [];

    // From market sizing
    if (marketSizing.assumptions) {
      assumptions.push(...marketSizing.assumptions.map(a => a.description));
    }

    // From competitive analysis
    assumptions.push('Market continues current growth trajectory');
    assumptions.push('Competitive landscape remains stable');
    assumptions.push('No major regulatory disruptions');

    return assumptions.slice(0, 5); // Limit to top 5
  }

  private identifyMarketLeader(competitiveData: CompetitorAnalysisResult): string {
    const competitors = competitiveData.competitiveMatrix.competitors || [];
    if (competitors.length === 0) {
      return 'Unknown';
    }
    const leader = competitors.reduce((prev, current) => 
      (prev.marketShare > current.marketShare) ? prev : current
    );
    return leader.name;
  }

  private async validateSingleAssumption(
    assumption: string,
    marketData: CaseMarketContext
  ): Promise<MarketAssumptionValidation> {
    // Simple keyword-based validation logic
    const lowerAssumption = assumption.toLowerCase();
    
    let isValid = true;
    let confidence = 0.7;
    let evidence: string[] = [];
    let contradictions: string[] = [];

    // Validate growth assumptions
    if (lowerAssumption.includes('growth') || lowerAssumption.includes('growing')) {
      if (marketData.marketSize.growthRate > 0.05) {
        evidence.push(`Market growth rate of ${(marketData.marketSize.growthRate * 100).toFixed(1)}% supports growth assumption`);
      } else {
        isValid = false;
        contradictions.push('Market growth rate is below 5%');
      }
    }

    // Validate market size assumptions
    if (lowerAssumption.includes('large market') || lowerAssumption.includes('big market')) {
      if (marketData.marketSize.tam > 1000000000) { // $1B+
        evidence.push(`TAM of $${(marketData.marketSize.tam / 1000000000).toFixed(1)}B indicates large market`);
      } else {
        confidence *= 0.8;
        contradictions.push('Market size may not qualify as "large"');
      }
    }

    // Validate competition assumptions
    if (lowerAssumption.includes('competitive') || lowerAssumption.includes('competition')) {
      if (marketData.competitors.length > 5) {
        evidence.push(`${marketData.competitors.length} competitors indicates competitive market`);
      } else {
        contradictions.push('Market appears less competitive than assumed');
      }
    }

    return {
      assumption,
      isValid,
      confidence,
      evidence,
      contradictions,
      recommendation: isValid ? 
        'Assumption appears valid based on current market data' :
        'Consider revising assumption based on market evidence',
    };
  }

  private calculateHerfindahlIndex(competitors: any[]): number {
    const totalMarketShare = competitors.reduce((sum, c) => sum + c.marketShare, 0);
    const normalizedShares = competitors.map(c => c.marketShare / totalMarketShare);
    return normalizedShares.reduce((sum, share) => sum + (share * share), 0);
  }

  private assessMarketMaturity(marketContext: CaseMarketContext): 'emerging' | 'growth' | 'mature' | 'declining' {
    const growthRate = marketContext.marketSize.growthRate;
    const competitorCount = marketContext.competitors.length;

    if (growthRate > 0.15 && competitorCount < 5) return 'emerging';
    if (growthRate > 0.08 && competitorCount < 10) return 'growth';
    if (growthRate > 0.02) return 'mature';
    return 'declining';
  }

  private calculateMarketConcentration(marketContext: CaseMarketContext): 'low' | 'medium' | 'high' {
    const competitorCount = marketContext.competitors.length;
    if (competitorCount > 10) return 'low';
    if (competitorCount > 5) return 'medium';
    return 'high';
  }

  private assessCompetitiveIntensity(marketContext: CaseMarketContext): 'low' | 'medium' | 'high' {
    const competitorCount = marketContext.competitors.length;
    const growthRate = marketContext.marketSize.growthRate;

    if (competitorCount > 8 && growthRate < 0.1) return 'high';
    if (competitorCount > 5 || growthRate < 0.05) return 'medium';
    return 'low';
  }

  private identifyEmergingTrends(trends: string[]): string[] {
    return trends.filter(trend => 
      trend.toLowerCase().includes('ai') ||
      trend.toLowerCase().includes('digital') ||
      trend.toLowerCase().includes('automation') ||
      trend.toLowerCase().includes('cloud')
    );
  }

  private identifyUnderservedSegments(marketContext: CaseMarketContext): string[] {
    // Mock implementation - in reality would analyze competitive gaps
    return [
      'Small and medium businesses',
      'Emerging markets',
      'Niche industry verticals',
    ];
  }

  private identifyCompetitiveThreats(marketContext: CaseMarketContext): string[] {
    return [
      'New market entrants with innovative solutions',
      'Existing competitors expanding capabilities',
      'Technology disruption from adjacent industries',
    ];
  }

  private identifyMarketRisks(marketContext: CaseMarketContext): string[] {
    const risks: string[] = [];
    
    if (marketContext.marketSize.growthRate < 0.05) {
      risks.push('Slow market growth may limit opportunities');
    }
    
    if (marketContext.competitors.length > 10) {
      risks.push('High competition may pressure margins');
    }

    risks.push('Economic downturn could impact demand');
    
    return risks;
  }

  private identifyRegulatoryRisks(industry: string): string[] {
    const industryRisks: Record<string, string[]> = {
      'Financial Services': ['Regulatory compliance changes', 'Data privacy regulations'],
      'Healthcare': ['FDA approval requirements', 'HIPAA compliance'],
      'Technology': ['Data privacy laws', 'Antitrust regulations'],
      'E-commerce': ['Consumer protection laws', 'Tax regulations'],
    };

    return industryRisks[industry] || ['General regulatory changes'];
  }

  private generateEntryStrategy(marketContext: CaseMarketContext): string[] {
    const strategies: string[] = [];
    
    const maturity = this.assessMarketMaturity(marketContext);
    const intensity = this.assessCompetitiveIntensity(marketContext);

    if (maturity === 'emerging' || maturity === 'growth') {
      strategies.push('Focus on rapid market capture');
    }

    if (intensity === 'high') {
      strategies.push('Differentiate through unique value proposition');
    } else {
      strategies.push('Consider direct competition with market leaders');
    }

    strategies.push('Target underserved market segments initially');
    
    return strategies;
  }

  private generateTimingConsiderations(marketContext: CaseMarketContext): string[] {
    const considerations: string[] = [];
    
    if (marketContext.marketSize.growthRate > 0.1) {
      considerations.push('Market timing is favorable with strong growth');
    }

    if (marketContext.competitors.length < 5) {
      considerations.push('Early market entry opportunity exists');
    }

    considerations.push('Monitor competitive moves for optimal timing');
    
    return considerations;
  }

  private assessTrendImpact(trend: string, industry: string): 'low' | 'medium' | 'high' {
    // Simple keyword-based impact assessment
    const highImpactKeywords = ['ai', 'digital transformation', 'automation'];
    const mediumImpactKeywords = ['mobile', 'cloud', 'integration'];
    
    const lowerTrend = trend.toLowerCase();
    
    if (highImpactKeywords.some(keyword => lowerTrend.includes(keyword))) {
      return 'high';
    }
    if (mediumImpactKeywords.some(keyword => lowerTrend.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  private estimateTrendTimeframe(trend: string): string {
    // Mock timeframe estimation
    if (trend.toLowerCase().includes('ai') || trend.toLowerCase().includes('automation')) {
      return '2-5 years';
    }
    if (trend.toLowerCase().includes('digital') || trend.toLowerCase().includes('cloud')) {
      return '1-3 years';
    }
    return '3-7 years';
  }

  private identifyEmergingTechnologies(industry: string): string[] {
    const techByIndustry: Record<string, string[]> = {
      'Financial Services': ['Blockchain', 'AI/ML', 'Open Banking APIs'],
      'Healthcare': ['Telemedicine', 'AI Diagnostics', 'Wearable Devices'],
      'Technology': ['Quantum Computing', 'Edge Computing', 'AR/VR'],
      'E-commerce': ['Voice Commerce', 'AR Shopping', 'Drone Delivery'],
    };

    return techByIndustry[industry] || ['AI/ML', 'Cloud Computing', 'Mobile Technology'];
  }

  private identifyMarketForces(marketContext: CaseMarketContext): string[] {
    return [
      'Increasing customer expectations',
      'Technology advancement pressure',
      'Cost optimization demands',
      'Regulatory compliance requirements',
    ];
  }

  private identifyCustomerBehaviorShifts(industry: string): string[] {
    const shiftsByIndustry: Record<string, string[]> = {
      'Financial Services': ['Digital-first banking', 'Self-service preferences'],
      'Healthcare': ['Remote care adoption', 'Health data ownership'],
      'Technology': ['Subscription model preference', 'Integration demands'],
      'E-commerce': ['Omnichannel expectations', 'Sustainability focus'],
    };

    return shiftsByIndustry[industry] || ['Digital adoption', 'Self-service preference'];
  }

  private identifyRegulatoryChanges(industry: string): string[] {
    const changesByIndustry: Record<string, string[]> = {
      'Financial Services': ['Open banking regulations', 'Cryptocurrency oversight'],
      'Healthcare': ['Telehealth regulations', 'Data interoperability requirements'],
      'Technology': ['Data privacy laws', 'AI governance frameworks'],
      'E-commerce': ['Consumer protection updates', 'Cross-border trade rules'],
    };

    return changesByIndustry[industry] || ['Data privacy regulations'];
  }

  private identifyDisruptiveFactors(marketContext: CaseMarketContext): string[] {
    return [
      'New business model innovations',
      'Technology convergence',
      'Changing customer expectations',
      'Economic shifts',
    ];
  }

  private generateCacheKey(type: string, data: any): string {
    return `${type}_${JSON.stringify(data)}`;
  }

  private getCachedData(key: string): any | null {
    const cached = this.dataCache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.config.cacheTimeout;
    if (isExpired) {
      this.dataCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCachedData(key: string, data: any): void {
    this.dataCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private convertConfidenceLevelToNumber(level: 'high' | 'medium' | 'low'): number {
    switch (level) {
      case 'high': return 0.8;
      case 'medium': return 0.6;
      case 'low': return 0.4;
      default: return 0.6;
    }
  }
}

export default MarketContextFetcher;