/**
 * Competitor Analysis Component
 * 
 * This component provides comprehensive competitor analysis capabilities including
 * competitive matrix generation, competitor identification and ranking algorithms.
 * It integrates with credible sources and provides structured competitive intelligence.
 */

import {
  CompetitorAnalysisResult,
  CompetitiveMatrix,
  Competitor,
  EvaluationCriterion,
  CompetitorRanking,
  SWOTAnalysis,
  SWOTItem,
  MarketPositioning,
  PositioningAxis,
  CompetitorPosition,
  MarketGap,
  StrategyRecommendation,
  ImplementationStep,
  SourceReference,
  DataQualityCheck,
  QualityIndicator,
  MarketContext,
  CompetitiveAnalysisArgs,
  CompetitiveAnalysisError,
  COMPETITIVE_ANALYSIS_DEFAULTS,
  SOURCE_RELIABILITY_THRESHOLDS,
  ValidationResult,
  FreshnessStatus
} from '../../models/competitive';
import { ReferenceManager, createReferenceManager } from '../reference-manager';

/**
 * Core competitor analysis engine that provides competitive intelligence
 * and strategic positioning analysis for product management decisions.
 */
export class CompetitorAnalyzer {
  private readonly confidenceThreshold: number;
  private readonly maxCompetitors: number;
  private readonly minCompetitors: number;
  private readonly referenceManager: ReferenceManager;

  constructor(options?: {
    confidenceThreshold?: number;
    maxCompetitors?: number;
    minCompetitors?: number;
  }) {
    this.confidenceThreshold = options?.confidenceThreshold ?? COMPETITIVE_ANALYSIS_DEFAULTS.DEFAULT_CONFIDENCE_THRESHOLD;
    this.maxCompetitors = options?.maxCompetitors ?? COMPETITIVE_ANALYSIS_DEFAULTS.MAX_COMPETITORS;
    this.minCompetitors = options?.minCompetitors ?? COMPETITIVE_ANALYSIS_DEFAULTS.MIN_COMPETITORS;
    this.referenceManager = createReferenceManager();
  }

  /**
   * Performs comprehensive competitor analysis for a given feature idea
   */
  async analyzeCompetitors(args: CompetitiveAnalysisArgs): Promise<CompetitorAnalysisResult> {
    try {
      // Validate input
      this.validateAnalysisInput(args);

      // Extract market context
      const marketContext = this.extractMarketContext(args);

      // Identify competitors based on feature idea and market context
      const competitors = await this.identifyCompetitors(args.feature_idea, marketContext, args.analysis_depth || 'standard');

      // Generate competitive matrix
      const competitiveMatrix = await this.generateCompetitiveMatrix(competitors, marketContext);

      // Perform SWOT analysis for each competitor
      const swotAnalysis = await this.generateSWOTAnalysis(competitors);

      // Analyze market positioning
      const marketPositioning = await this.analyzeMarketPositioning(competitors, marketContext);

      // Generate strategic recommendations
      const strategicRecommendations = await this.generateStrategicRecommendations(
        competitiveMatrix,
        swotAnalysis,
        marketPositioning
      );

      // Create source attribution
      const sourceAttribution = this.generateSourceAttribution(competitors, marketContext);

      // Assess data quality
      const dataQuality = this.assessDataQuality(competitors, sourceAttribution);

      // Determine overall confidence level
      const confidenceLevel = this.determineConfidenceLevel(dataQuality);

      return {
        competitiveMatrix,
        swotAnalysis,
        marketPositioning,
        strategicRecommendations,
        sourceAttribution,
        confidenceLevel,
        lastUpdated: new Date().toISOString(),
        dataQuality
      };

    } catch (error) {
      if (error instanceof CompetitiveAnalysisError) {
        throw error;
      }
      throw new CompetitiveAnalysisError(
        `Failed to analyze competitors: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ANALYSIS_TIMEOUT',
        ['Try with a simpler feature description', 'Reduce analysis depth', 'Check market context validity'],
        { originalError: error }
      );
    }
  }

  /**
   * Identifies relevant competitors based on feature idea and market context
   */
  private async identifyCompetitors(
    featureIdea: string,
    marketContext: MarketContext,
    analysisDepth: 'quick' | 'standard' | 'comprehensive'
  ): Promise<Competitor[]> {
    // Simulate competitor identification logic
    // In a real implementation, this would integrate with market research APIs,
    // company databases, and competitive intelligence sources

    const baseCompetitors = this.generateMockCompetitors(featureIdea, marketContext);
    
    // Filter and rank competitors based on analysis depth
    const maxCompetitors = this.getMaxCompetitorsForDepth(analysisDepth);
    const rankedCompetitors = this.rankCompetitorsByRelevance(baseCompetitors, featureIdea);
    
    return rankedCompetitors.slice(0, Math.min(maxCompetitors, this.maxCompetitors));
  }

  /**
   * Generates a competitive matrix with evaluation criteria and rankings
   */
  private async generateCompetitiveMatrix(
    competitors: Competitor[],
    marketContext: MarketContext
  ): Promise<CompetitiveMatrix> {
    // Define evaluation criteria based on market context
    const evaluationCriteria = this.defineEvaluationCriteria(marketContext);

    // Calculate rankings for each competitor
    const rankings = this.calculateCompetitorRankings(competitors, evaluationCriteria);

    // Identify differentiation opportunities
    const differentiationOpportunities = this.identifyDifferentiationOpportunities(competitors, rankings);

    return {
      competitors,
      evaluationCriteria,
      rankings,
      differentiationOpportunities,
      marketContext
    };
  }

  /**
   * Generates SWOT analysis for each competitor
   */
  private async generateSWOTAnalysis(competitors: Competitor[]): Promise<SWOTAnalysis[]> {
    return competitors.map(competitor => {
      const strengths = this.analyzeSWOTCategory(competitor, 'strengths');
      const weaknesses = this.analyzeSWOTCategory(competitor, 'weaknesses');
      const opportunities = this.analyzeSWOTCategory(competitor, 'opportunities');
      const threats = this.analyzeSWOTCategory(competitor, 'threats');

      return {
        competitorName: competitor.name,
        strengths,
        weaknesses,
        opportunities,
        threats,
        strategicImplications: this.generateStrategicImplications(strengths, weaknesses, opportunities, threats)
      };
    });
  }

  /**
   * Analyzes market positioning and identifies gaps
   */
  private async analyzeMarketPositioning(
    competitors: Competitor[],
    marketContext: MarketContext
  ): Promise<MarketPositioning> {
    // Define positioning axes based on market context
    const positioningMap = this.definePositioningAxes(marketContext);

    // Calculate competitor positions
    const competitorPositions = this.calculateCompetitorPositions(competitors, positioningMap);

    // Identify market gaps
    const marketGaps = this.identifyMarketGaps(competitorPositions, positioningMap);

    // Generate positioning recommendations
    const recommendedPositioning = this.generatePositioningRecommendations(marketGaps, competitorPositions);

    return {
      positioningMap,
      competitorPositions,
      marketGaps,
      recommendedPositioning
    };
  }

  /**
   * Generates strategic recommendations based on competitive analysis
   */
  private async generateStrategicRecommendations(
    competitiveMatrix: CompetitiveMatrix,
    swotAnalysis: SWOTAnalysis[],
    marketPositioning: MarketPositioning
  ): Promise<StrategyRecommendation[]> {
    const recommendations: StrategyRecommendation[] = [];

    // Differentiation recommendations
    recommendations.push(...this.generateDifferentiationRecommendations(competitiveMatrix, marketPositioning));

    // Blue ocean recommendations
    recommendations.push(...this.generateBlueOceanRecommendations(marketPositioning));

    // Focus strategy recommendations
    recommendations.push(...this.generateFocusRecommendations(swotAnalysis, marketPositioning));

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private validateAnalysisInput(args: CompetitiveAnalysisArgs): void {
    if (!args.feature_idea || args.feature_idea.trim().length < 10) {
      throw new CompetitiveAnalysisError(
        'Feature idea must be at least 10 characters long',
        'VALIDATION_FAILED',
        ['Provide a more detailed feature description', 'Include specific functionality or value proposition']
      );
    }

    if (args.analysis_depth && !['quick', 'standard', 'comprehensive'].includes(args.analysis_depth)) {
      throw new CompetitiveAnalysisError(
        'Invalid analysis depth specified',
        'VALIDATION_FAILED',
        ['Use one of: quick, standard, comprehensive']
      );
    }
  }

  private extractMarketContext(args: CompetitiveAnalysisArgs): MarketContext {
    return {
      industry: args.market_context?.industry ?? this.inferIndustryFromFeature(args.feature_idea),
      geography: args.market_context?.geography ?? ['Global'],
      targetSegment: args.market_context?.target_segment ?? 'General Market',
      marketMaturity: 'growth', // Default assumption
      regulatoryEnvironment: [],
      technologyTrends: this.extractTechnologyTrends(args.feature_idea)
    };
  }

  private inferIndustryFromFeature(featureIdea: string): string {
    // Simple keyword-based industry inference
    const keywords = featureIdea.toLowerCase();
    
    if (keywords.includes('fintech') || keywords.includes('payment') || keywords.includes('banking')) {
      return 'Financial Services';
    }
    if (keywords.includes('health') || keywords.includes('medical') || keywords.includes('healthcare')) {
      return 'Healthcare';
    }
    if (keywords.includes('ecommerce') || keywords.includes('retail') || keywords.includes('shopping')) {
      return 'E-commerce';
    }
    if (keywords.includes('saas') || keywords.includes('software') || keywords.includes('platform')) {
      return 'Software';
    }
    
    return 'Technology';
  }

  private extractTechnologyTrends(featureIdea: string): string[] {
    const trends: string[] = [];
    const keywords = featureIdea.toLowerCase();

    if (keywords.includes('ai') || keywords.includes('machine learning') || keywords.includes('artificial intelligence')) {
      trends.push('Artificial Intelligence');
    }
    if (keywords.includes('mobile') || keywords.includes('app')) {
      trends.push('Mobile-First');
    }
    if (keywords.includes('cloud') || keywords.includes('saas')) {
      trends.push('Cloud Computing');
    }
    if (keywords.includes('api') || keywords.includes('integration')) {
      trends.push('API Economy');
    }

    return trends;
  }

  private generateMockCompetitors(featureIdea: string, marketContext: MarketContext): Competitor[] {
    // Generate realistic mock competitors based on industry and feature
    const industry = marketContext.industry;
    const baseCompetitors: Partial<Competitor>[] = [];

    // Industry-specific competitor templates
    if (industry === 'Financial Services') {
      baseCompetitors.push(
        { name: 'FinTech Leader A', marketShare: 25, strengths: ['Strong brand', 'Regulatory compliance'] },
        { name: 'Traditional Bank B', marketShare: 35, strengths: ['Large customer base', 'Trust'] },
        { name: 'Startup Disruptor C', marketShare: 8, strengths: ['Innovation', 'User experience'] },
        { name: 'Payment Processor D', marketShare: 12, strengths: ['Global reach', 'Security'] },
        { name: 'Digital Wallet E', marketShare: 6, strengths: ['Mobile-first', 'User experience'] },
        { name: 'Enterprise Solution F', marketShare: 14, strengths: ['B2B focus', 'Integration'] }
      );
    } else if (industry === 'Healthcare') {
      baseCompetitors.push(
        { name: 'HealthTech Giant A', marketShare: 30, strengths: ['Clinical expertise', 'Compliance'] },
        { name: 'Digital Health B', marketShare: 15, strengths: ['User engagement', 'Mobile platform'] },
        { name: 'Enterprise Solution C', marketShare: 20, strengths: ['Integration capabilities', 'Security'] },
        { name: 'Telemedicine Platform D', marketShare: 10, strengths: ['Remote care', 'Accessibility'] },
        { name: 'Health Records System E', marketShare: 12, strengths: ['Data management', 'Interoperability'] },
        { name: 'AI Diagnostics F', marketShare: 8, strengths: ['AI technology', 'Accuracy'] },
        { name: 'Wearables Company G', marketShare: 5, strengths: ['Consumer devices', 'Data collection'] }
      );
    } else {
      // Generic technology competitors
      baseCompetitors.push(
        { name: 'Market Leader A', marketShare: 40, strengths: ['Market presence', 'Resources'] },
        { name: 'Innovative Challenger B', marketShare: 20, strengths: ['Technology', 'Agility'] },
        { name: 'Niche Player C', marketShare: 10, strengths: ['Specialization', 'Customer focus'] },
        { name: 'Enterprise Vendor D', marketShare: 15, strengths: ['B2B expertise', 'Support'] },
        { name: 'Startup Disruptor E', marketShare: 5, strengths: ['Innovation', 'Speed'] },
        { name: 'Platform Provider F', marketShare: 8, strengths: ['Ecosystem', 'Integrations'] },
        { name: 'Open Source Solution G', marketShare: 2, strengths: ['Community', 'Flexibility'] }
      );
    }

    // Convert to full Competitor objects
    return baseCompetitors.map((partial, index) => ({
      name: partial.name!,
      marketShare: partial.marketShare!,
      strengths: partial.strengths!,
      weaknesses: this.generateWeaknesses(partial.strengths!),
      keyFeatures: this.generateKeyFeatures(featureIdea, index),
      pricing: this.generatePricingInfo(industry),
      targetMarket: [marketContext.targetSegment],
      recentMoves: this.generateRecentMoves(),
      employeeCount: Math.floor(Math.random() * 5000) + 100,
      foundedYear: 2010 + Math.floor(Math.random() * 10)
    }));
  }

  private generateWeaknesses(strengths: string[]): string[] {
    // Generate realistic weaknesses that complement strengths
    const weaknessMap: { [key: string]: string[] } = {
      'Strong brand': ['High pricing', 'Slow innovation'],
      'Large customer base': ['Legacy systems', 'Slow decision making'],
      'Innovation': ['Limited resources', 'Market validation'],
      'Regulatory compliance': ['Slow to market', 'High operational costs'],
      'User experience': ['Limited enterprise features', 'Scalability concerns'],
      'Clinical expertise': ['Complex user interface', 'High implementation costs']
    };

    const weaknesses: string[] = [];
    strengths.forEach(strength => {
      const possibleWeaknesses = weaknessMap[strength] || ['Resource constraints', 'Market positioning'];
      weaknesses.push(possibleWeaknesses[Math.floor(Math.random() * possibleWeaknesses.length)]);
    });

    return weaknesses;
  }

  private generateKeyFeatures(featureIdea: string, competitorIndex: number): string[] {
    const baseFeatures = [
      'Core platform functionality',
      'User management',
      'Analytics dashboard',
      'API integration',
      'Mobile application'
    ];

    // Add feature-specific capabilities
    if (featureIdea.toLowerCase().includes('ai')) {
      baseFeatures.push('AI-powered insights', 'Machine learning algorithms');
    }
    if (featureIdea.toLowerCase().includes('mobile')) {
      baseFeatures.push('Native mobile apps', 'Offline functionality');
    }

    // Vary features by competitor
    return baseFeatures.slice(0, 3 + competitorIndex);
  }

  private generatePricingInfo(industry: string): any {
    const models = ['subscription', 'freemium', 'usage-based', 'tiered'];
    const model = models[Math.floor(Math.random() * models.length)];
    
    const basePrices: { [key: string]: number } = {
      'Financial Services': 99,
      'Healthcare': 149,
      'Software': 49,
      'E-commerce': 29
    };

    return {
      model,
      startingPrice: basePrices[industry] || 49,
      currency: 'USD',
      billingCycle: 'monthly',
      valueProposition: `${industry} solution with competitive pricing`
    };
  }

  private generateRecentMoves(): any[] {
    const moveTypes = ['product-launch', 'partnership', 'funding', 'expansion'];
    const moves = [];
    
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      moves.push({
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: moveTypes[Math.floor(Math.random() * moveTypes.length)],
        description: 'Recent strategic initiative',
        impact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        strategicImplication: 'Market positioning adjustment'
      });
    }
    
    return moves;
  }

  private getMaxCompetitorsForDepth(depth: 'quick' | 'standard' | 'comprehensive'): number {
    switch (depth) {
      case 'quick': return 3;
      case 'standard': return 5;
      case 'comprehensive': return 8;
      default: return 5;
    }
  }

  private rankCompetitorsByRelevance(competitors: Competitor[], featureIdea: string): Competitor[] {
    // Simple relevance scoring based on feature overlap
    return competitors.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, featureIdea);
      const scoreB = this.calculateRelevanceScore(b, featureIdea);
      return scoreB - scoreA;
    });
  }

  private calculateRelevanceScore(competitor: Competitor, featureIdea: string): number {
    let score = competitor.marketShare; // Base score on market share
    
    // Boost score for feature alignment
    const featureKeywords = featureIdea.toLowerCase().split(' ');
    const competitorText = (competitor.keyFeatures.join(' ') + ' ' + competitor.strengths.join(' ')).toLowerCase();
    
    featureKeywords.forEach(keyword => {
      if (competitorText.includes(keyword)) {
        score += 10;
      }
    });

    return score;
  }

  private defineEvaluationCriteria(marketContext: MarketContext): EvaluationCriterion[] {
    const baseCriteria: EvaluationCriterion[] = [
      {
        name: 'Market Share',
        weight: 0.25,
        description: 'Current market position and customer base',
        measurementType: 'quantitative'
      },
      {
        name: 'Product Features',
        weight: 0.20,
        description: 'Breadth and depth of product capabilities',
        measurementType: 'qualitative'
      },
      {
        name: 'Innovation',
        weight: 0.20,
        description: 'Technology advancement and R&D investment',
        measurementType: 'qualitative'
      },
      {
        name: 'Customer Satisfaction',
        weight: 0.15,
        description: 'User reviews and retention rates',
        measurementType: 'quantitative'
      },
      {
        name: 'Financial Strength',
        weight: 0.20,
        description: 'Revenue growth and funding status',
        measurementType: 'quantitative'
      }
    ];

    // Adjust weights based on market maturity
    if (marketContext.marketMaturity === 'emerging') {
      baseCriteria.find(c => c.name === 'Innovation')!.weight = 0.30;
      baseCriteria.find(c => c.name === 'Market Share')!.weight = 0.15;
    }

    return baseCriteria;
  }

  private calculateCompetitorRankings(
    competitors: Competitor[],
    criteria: EvaluationCriterion[]
  ): CompetitorRanking[] {
    const rankings = competitors.map(competitor => {
      const criteriaScores: { [key: string]: number } = {};
      let totalScore = 0;

      criteria.forEach(criterion => {
        const score = this.scoreCompetitorOnCriterion(competitor, criterion);
        criteriaScores[criterion.name] = score;
        totalScore += score * criterion.weight;
      });

      return {
        competitorName: competitor.name,
        overallScore: Math.round(totalScore * 100) / 100,
        criteriaScores,
        rank: 0, // Will be set after sorting
        competitiveAdvantage: this.identifyCompetitiveAdvantage(competitor, criteriaScores)
      };
    });

    // Sort by overall score and assign ranks
    rankings.sort((a, b) => b.overallScore - a.overallScore);
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    return rankings;
  }

  private scoreCompetitorOnCriterion(competitor: Competitor, criterion: EvaluationCriterion): number {
    // Simplified scoring logic - in reality this would use more sophisticated analysis
    switch (criterion.name) {
      case 'Market Share':
        return Math.min(competitor.marketShare / 50, 1); // Normalize to 0-1 scale
      case 'Product Features':
        return Math.min(competitor.keyFeatures.length / 10, 1);
      case 'Innovation':
        return competitor.strengths.some(s => s.toLowerCase().includes('innovation')) ? 0.8 : 0.4;
      case 'Customer Satisfaction':
        return 0.6 + Math.random() * 0.4; // Mock score
      case 'Financial Strength':
        return competitor.marketShare > 20 ? 0.8 : 0.5;
      default:
        return 0.5;
    }
  }

  private identifyCompetitiveAdvantage(competitor: Competitor, scores: { [key: string]: number }): string[] {
    const advantages: string[] = [];
    
    Object.entries(scores).forEach(([criterion, score]) => {
      if (score > 0.7) {
        advantages.push(`Strong ${criterion.toLowerCase()}`);
      }
    });

    return advantages.length > 0 ? advantages : ['Market presence'];
  }

  private identifyDifferentiationOpportunities(
    competitors: Competitor[],
    rankings: CompetitorRanking[]
  ): string[] {
    const opportunities: string[] = [];
    
    // Analyze common weaknesses
    const allWeaknesses = competitors.flatMap(c => c.weaknesses);
    const weaknessCounts = allWeaknesses.reduce((acc, weakness) => {
      acc[weakness] = (acc[weakness] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Identify most common weaknesses as opportunities
    Object.entries(weaknessCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([weakness]) => {
        opportunities.push(`Address industry-wide ${weakness.toLowerCase()}`);
      });

    // Add feature gap opportunities
    opportunities.push('Focus on underserved market segments');
    opportunities.push('Leverage emerging technology trends');

    return opportunities;
  }

  private analyzeSWOTCategory(competitor: Competitor, category: string): SWOTItem[] {
    const items: SWOTItem[] = [];
    
    switch (category) {
      case 'strengths':
        competitor.strengths.forEach(strength => {
          items.push({
            description: `Strong ${strength.toLowerCase()} capabilities`,
            impact: 'high',
            confidence: 0.8,
            sourceReference: 'Market analysis'
          });
        });
        break;
      case 'weaknesses':
        competitor.weaknesses.forEach(weakness => {
          items.push({
            description: `Limited ${weakness.toLowerCase()} performance`,
            impact: 'medium',
            confidence: 0.7,
            sourceReference: 'Competitive research'
          });
        });
        break;
      case 'opportunities':
        items.push({
          description: 'Market expansion potential in underserved segments',
          impact: 'high',
          confidence: 0.6,
          sourceReference: 'Industry trends'
        });
        items.push({
          description: 'Technology advancement opportunities',
          impact: 'medium',
          confidence: 0.7,
          sourceReference: 'Technology analysis'
        });
        break;
      case 'threats':
        items.push({
          description: 'Increased competitive pressure from new entrants',
          impact: 'medium',
          confidence: 0.7,
          sourceReference: 'Market dynamics'
        });
        items.push({
          description: 'Regulatory changes affecting market conditions',
          impact: 'medium',
          confidence: 0.6,
          sourceReference: 'Regulatory analysis'
        });
        break;
    }

    return items;
  }

  private generateStrategicImplications(
    strengths: SWOTItem[],
    weaknesses: SWOTItem[],
    opportunities: SWOTItem[],
    threats: SWOTItem[]
  ): string[] {
    const implications: string[] = [];
    
    if (strengths.length > weaknesses.length) {
      implications.push('Strong competitive position with growth potential');
    }
    if (opportunities.length > threats.length) {
      implications.push('Favorable market conditions for expansion');
    }
    
    implications.push('Monitor competitive moves closely');
    implications.push('Focus on differentiation strategies');
    
    return implications;
  }

  private definePositioningAxes(marketContext: MarketContext): PositioningAxis[] {
    return [
      {
        name: 'Price',
        lowEnd: 'Low Cost',
        highEnd: 'Premium',
        importance: 0.3
      },
      {
        name: 'Features',
        lowEnd: 'Basic',
        highEnd: 'Comprehensive',
        importance: 0.4
      },
      {
        name: 'Target Market',
        lowEnd: 'SMB',
        highEnd: 'Enterprise',
        importance: 0.3
      }
    ];
  }

  private calculateCompetitorPositions(
    competitors: Competitor[],
    axes: PositioningAxis[]
  ): CompetitorPosition[] {
    return competitors.map(competitor => {
      const coordinates: { [key: string]: number } = {};
      
      axes.forEach(axis => {
        coordinates[axis.name] = this.calculateAxisPosition(competitor, axis);
      });

      return {
        competitorName: competitor.name,
        coordinates,
        marketSegment: competitor.targetMarket[0] || 'General'
      };
    });
  }

  private calculateAxisPosition(competitor: Competitor, axis: PositioningAxis): number {
    // Simplified positioning calculation
    switch (axis.name) {
      case 'Price':
        return competitor.pricing.startingPrice > 100 ? 0.8 : 0.3;
      case 'Features':
        return Math.min(competitor.keyFeatures.length / 10, 1);
      case 'Target Market':
        return competitor.marketShare > 25 ? 0.8 : 0.4;
      default:
        return 0.5;
    }
  }

  private identifyMarketGaps(
    positions: CompetitorPosition[],
    axes: PositioningAxis[]
  ): MarketGap[] {
    const gaps: MarketGap[] = [];
    
    // Simplified gap identification
    gaps.push({
      description: 'Mid-market segment with balanced features and pricing',
      size: 'medium',
      difficulty: 'moderate',
      timeToMarket: '6-12 months',
      potentialValue: 50000000
    });

    gaps.push({
      description: 'Premium features at competitive pricing',
      size: 'large',
      difficulty: 'hard',
      timeToMarket: '12-18 months',
      potentialValue: 100000000
    });

    return gaps;
  }

  private generatePositioningRecommendations(
    gaps: MarketGap[],
    positions: CompetitorPosition[]
  ): string[] {
    return [
      'Target underserved mid-market segment',
      'Differentiate through superior user experience',
      'Focus on specific industry verticals',
      'Leverage technology advantages for competitive pricing'
    ];
  }

  private generateDifferentiationRecommendations(
    matrix: CompetitiveMatrix,
    positioning: MarketPositioning
  ): StrategyRecommendation[] {
    return [{
      type: 'differentiation',
      title: 'Feature-Based Differentiation',
      description: 'Develop unique capabilities that competitors lack',
      rationale: [
        'Identified competitive gaps in market positioning',
        'Competitor weaknesses present differentiation opportunities',
        'Market analysis reveals unmet customer needs'
      ],
      implementation: [
        {
          step: 1,
          action: 'Identify key feature gaps',
          timeline: '2-4 weeks',
          dependencies: ['Market research completion'],
          successMetrics: ['Gap analysis report', 'Feature prioritization matrix']
        }
      ],
      expectedOutcome: 'Competitive advantage through unique features',
      riskLevel: 'medium',
      timeframe: '6-12 months',
      resourceRequirements: ['Product development team', 'Market research budget']
    }];
  }

  private generateBlueOceanRecommendations(positioning: MarketPositioning): StrategyRecommendation[] {
    return [{
      type: 'blue-ocean',
      title: 'Create New Market Space',
      description: 'Identify uncontested market opportunities',
      rationale: ['Market gaps identified', 'Limited competition in specific segments'],
      implementation: [
        {
          step: 1,
          action: 'Validate market opportunity',
          timeline: '4-6 weeks',
          dependencies: ['Customer research'],
          successMetrics: ['Market validation report', 'Customer interviews completed']
        }
      ],
      expectedOutcome: 'First-mover advantage in new market segment',
      riskLevel: 'high',
      timeframe: '12-24 months',
      resourceRequirements: ['Innovation team', 'Significant R&D investment']
    }];
  }

  private generateFocusRecommendations(
    swotAnalysis: SWOTAnalysis[],
    positioning: MarketPositioning
  ): StrategyRecommendation[] {
    return [{
      type: 'focus',
      title: 'Niche Market Focus Strategy',
      description: 'Focus on specific customer segments with specialized needs',
      rationale: ['Opportunity for specialization', 'Lower competition in niche markets'],
      implementation: [
        {
          step: 1,
          action: 'Define target niche',
          timeline: '2-3 weeks',
          dependencies: ['Customer segmentation analysis'],
          successMetrics: ['Niche definition document', 'Target customer profiles']
        }
      ],
      expectedOutcome: 'Market leadership in focused segment',
      riskLevel: 'low',
      timeframe: '3-6 months',
      resourceRequirements: ['Specialized sales team', 'Targeted marketing budget']
    }];
  }

  private generateSourceAttribution(competitors: Competitor[], marketContext: MarketContext): SourceReference[] {
    // Use the reference manager to generate credible sources
    return this.referenceManager.generateSourceAttribution(marketContext.industry, 'competitive');
  }

  private assessDataQuality(competitors: Competitor[], sources: SourceReference[]): DataQualityCheck {
    // Use reference manager to validate source collection
    const sourceValidation = this.referenceManager.validateSourceCollection(sources);
    
    const sourceReliability = sources.reduce((sum, source) => sum + source.reliability, 0) / sources.length;
    const dataFreshness = sources.every(source => {
      const freshness = this.referenceManager.checkDataFreshness(source);
      return freshness.ageInDays < 90;
    }) ? 0.9 : 0.6;
    const methodologyRigor = competitors.length >= this.minCompetitors ? 0.8 : 0.5;
    const overallConfidence = (sourceReliability + dataFreshness + methodologyRigor) / 3;

    const qualityIndicators: QualityIndicator[] = [
      {
        metric: 'Source Reliability',
        score: sourceReliability,
        description: 'Credibility of information sources',
        impact: 'critical'
      },
      {
        metric: 'Data Freshness',
        score: dataFreshness,
        description: 'Recency of competitive intelligence',
        impact: 'important'
      },
      {
        metric: 'Analysis Completeness',
        score: methodologyRigor,
        description: 'Comprehensiveness of competitive analysis',
        impact: 'important'
      }
    ];

    // Combine recommendations from source validation and analysis
    const recommendations: string[] = [...sourceValidation.recommendations];
    
    if (sourceReliability < SOURCE_RELIABILITY_THRESHOLDS.MEDIUM) {
      recommendations.push('Seek additional authoritative sources');
    }
    if (dataFreshness < 0.7) {
      recommendations.push('Update competitive intelligence data');
    }
    if (competitors.length < this.minCompetitors) {
      recommendations.push('Expand competitor identification scope');
    }

    // Add update recommendations from reference manager
    const updateRecommendations = this.referenceManager.suggestUpdates(sources);
    updateRecommendations.forEach(update => {
      recommendations.push(update.description);
    });

    return {
      sourceReliability,
      dataFreshness,
      methodologyRigor,
      overallConfidence,
      qualityIndicators,
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };
  }

  private determineConfidenceLevel(dataQuality: DataQualityCheck): 'high' | 'medium' | 'low' {
    if (dataQuality.overallConfidence >= SOURCE_RELIABILITY_THRESHOLDS.HIGH) {
      return 'high';
    } else if (dataQuality.overallConfidence >= SOURCE_RELIABILITY_THRESHOLDS.MEDIUM) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Validates competitive analysis results
   */
  validateAnalysisResult(result: CompetitorAnalysisResult): ValidationResult {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const dataGaps: string[] = [];
    let qualityScore = 1.0;

    // Check minimum competitors
    if (result.competitiveMatrix.competitors.length < this.minCompetitors) {
      warnings.push(`Only ${result.competitiveMatrix.competitors.length} competitors identified (minimum: ${this.minCompetitors})`);
      qualityScore -= 0.2;
      dataGaps.push('Insufficient competitor coverage');
    }

    // Check data quality
    if (result.dataQuality.overallConfidence < this.confidenceThreshold) {
      warnings.push('Low confidence in analysis results');
      qualityScore -= 0.3;
      recommendations.push('Gather additional market intelligence');
    }

    // Check source attribution
    if (result.sourceAttribution.length === 0) {
      warnings.push('No source attribution provided');
      qualityScore -= 0.2;
      dataGaps.push('Source references missing');
    }

    return {
      isValid: qualityScore >= 0.5,
      confidence: Math.max(0, qualityScore),
      warnings,
      recommendations,
      dataGaps,
      qualityScore
    };
  }
}

/**
 * Factory function to create a CompetitorAnalyzer instance
 */
export function createCompetitorAnalyzer(options?: {
  confidenceThreshold?: number;
  maxCompetitors?: number;
  minCompetitors?: number;
}): CompetitorAnalyzer {
  return new CompetitorAnalyzer(options);
}

/**
 * Utility function to format competitive analysis results for display
 */
export function formatCompetitiveAnalysisResult(result: CompetitorAnalysisResult): string {
  const sections: string[] = [];

  // Executive Summary
  sections.push('# Competitive Analysis Report\n');
  sections.push(`**Analysis Date:** ${result.lastUpdated}`);
  sections.push(`**Confidence Level:** ${result.confidenceLevel.toUpperCase()}`);
  sections.push(`**Competitors Analyzed:** ${result.competitiveMatrix.competitors.length}\n`);

  // Competitive Matrix
  sections.push('## Competitive Matrix\n');
  result.competitiveMatrix.rankings.forEach(ranking => {
    sections.push(`**${ranking.rank}. ${ranking.competitorName}** (Score: ${ranking.overallScore})`);
    sections.push(`- Competitive Advantages: ${ranking.competitiveAdvantage.join(', ')}\n`);
  });

  // Key Insights
  sections.push('## Key Strategic Insights\n');
  result.strategicRecommendations.slice(0, 3).forEach((rec, index) => {
    sections.push(`${index + 1}. **${rec.title}**: ${rec.description}`);
  });

  // Data Quality
  sections.push('\n## Analysis Quality\n');
  sections.push(`- Overall Confidence: ${Math.round(result.dataQuality.overallConfidence * 100)}%`);
  sections.push(`- Source Reliability: ${Math.round(result.dataQuality.sourceReliability * 100)}%`);
  sections.push(`- Data Freshness: ${Math.round(result.dataQuality.dataFreshness * 100)}%`);

  return sections.join('\n');
}