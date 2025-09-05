/**
 * Competitive Analysis Data Quality Validation Framework
 * 
 * This module provides comprehensive validation logic for competitive and market data quality,
 * implements graceful degradation for insufficient data scenarios, and manages confidence scoring.
 */

import { 
  CompetitorAnalysisResult, 
  MarketSizingResult, 
  SourceReference, 
  DataQualityCheck, 
  ValidationResult, 
  QualityIndicator,
  CompetitiveAnalysisError,
  MarketSizingError,
  COMPETITIVE_ANALYSIS_DEFAULTS,
  MARKET_SIZING_DEFAULTS,
  SOURCE_RELIABILITY_THRESHOLDS
} from '../models/competitive';

// ============================================================================
// Core Validation Classes
// ============================================================================

export class CompetitiveDataValidationError extends Error {
  constructor(
    message: string,
    public validationType: 'competitive' | 'market-sizing' | 'source' | 'quality',
    public severity: 'error' | 'warning' | 'info',
    public field?: string,
    public suggestions: string[] = []
  ) {
    super(message);
    this.name = 'CompetitiveDataValidationError';
  }
}

export class DataQualityValidator {
  private readonly minDataPoints: number;
  private readonly confidenceThreshold: number;
  private readonly freshnessThresholdDays: number;

  constructor(
    minDataPoints: number = 3,
    confidenceThreshold: number = COMPETITIVE_ANALYSIS_DEFAULTS.DEFAULT_CONFIDENCE_THRESHOLD,
    freshnessThresholdDays: number = COMPETITIVE_ANALYSIS_DEFAULTS.STALE_DATA_THRESHOLD_DAYS
  ) {
    this.minDataPoints = minDataPoints;
    this.confidenceThreshold = confidenceThreshold;
    this.freshnessThresholdDays = freshnessThresholdDays;
  }

  /**
   * Validate competitive analysis input parameters
   */
  validateCompetitiveAnalysisInput(featureIdea: string, marketContext?: any): ValidationResult {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const dataGaps: string[] = [];
    let confidence = 1.0;

    // Validate feature idea
    if (!featureIdea || typeof featureIdea !== 'string') {
      throw new CompetitiveDataValidationError(
        'Feature idea must be a non-empty string',
        'competitive',
        'error',
        'feature_idea'
      );
    }

    if (featureIdea.trim().length < 10) {
      throw new CompetitiveDataValidationError(
        'Feature idea is too short for meaningful competitive analysis',
        'competitive',
        'error',
        'feature_idea',
        ['Provide a more detailed description of the feature or product concept']
      );
    }

    if (featureIdea.length > 2000) {
      warnings.push('Feature idea is very long and may impact analysis focus');
      recommendations.push('Consider summarizing the core concept for better analysis');
      confidence *= 0.95;
    }

    // Validate market context
    if (!marketContext) {
      dataGaps.push('Market context not provided');
      recommendations.push('Provide industry, geography, and target segment for more accurate analysis');
      confidence *= 0.8;
    } else {
      const contextValidation = this.validateMarketContext(marketContext);
      warnings.push(...contextValidation.warnings);
      recommendations.push(...contextValidation.recommendations);
      dataGaps.push(...contextValidation.dataGaps);
      confidence *= contextValidation.confidence;
    }

    // Check for generic or vague descriptions
    const genericPatterns = [
      /\b(app|application|system|platform|tool|solution)\b/gi,
      /\b(better|improved|enhanced|optimized)\b/gi,
      /\b(users?|customers?|people)\b/gi
    ];

    const genericMatches = genericPatterns.reduce((count, pattern) => {
      const matches = featureIdea.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);

    if (genericMatches > 5) {
      warnings.push('Feature description appears generic and may limit competitive analysis depth');
      recommendations.push('Include specific functionality, target market, or unique value propositions');
      confidence *= 0.9;
    }

    return {
      isValid: true,
      confidence,
      warnings,
      recommendations,
      dataGaps,
      qualityScore: this.calculateQualityScore(confidence, warnings.length, dataGaps.length)
    };
  }

  /**
   * Validate market sizing input parameters
   */
  validateMarketSizingInput(featureIdea: string, marketDefinition: any, sizingMethods: string[]): ValidationResult {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const dataGaps: string[] = [];
    let confidence = 1.0;

    // Validate feature idea (reuse competitive validation)
    const featureValidation = this.validateCompetitiveAnalysisInput(featureIdea);
    confidence *= featureValidation.confidence;

    // Validate market definition
    if (!marketDefinition || typeof marketDefinition !== 'object') {
      throw new MarketSizingError(
        'Market definition must be provided as an object',
        'INVALID_MARKET_DEFINITION',
        ['Provide industry, geography, and customer segments']
      );
    }

    if (!marketDefinition.industry || typeof marketDefinition.industry !== 'string') {
      throw new MarketSizingError(
        'Industry must be specified for market sizing',
        'INVALID_MARKET_DEFINITION',
        ['Specify the target industry (e.g., "SaaS", "E-commerce", "Healthcare")']
      );
    }

    if (marketDefinition.industry.length < 3) {
      warnings.push('Industry specification is very brief');
      recommendations.push('Provide more specific industry classification for better market data');
      confidence *= 0.9;
    }

    // Validate geography
    if (!marketDefinition.geography || !Array.isArray(marketDefinition.geography)) {
      dataGaps.push('Geographic scope not specified');
      recommendations.push('Specify target geographic markets for more accurate sizing');
      confidence *= 0.85;
    } else if (marketDefinition.geography.length === 0) {
      dataGaps.push('No geographic markets specified');
      confidence *= 0.8;
    }

    // Validate customer segments
    if (!marketDefinition.customer_segments || !Array.isArray(marketDefinition.customer_segments)) {
      dataGaps.push('Customer segments not defined');
      recommendations.push('Define target customer segments for more precise market sizing');
      confidence *= 0.85;
    }

    // Validate sizing methods
    if (!Array.isArray(sizingMethods) || sizingMethods.length === 0) {
      throw new MarketSizingError(
        'At least one sizing method must be specified',
        'METHODOLOGY_UNSUPPORTED',
        ['Choose from: top-down, bottom-up, value-theory']
      );
    }

    const validMethods = ['top-down', 'bottom-up', 'value-theory'];
    const invalidMethods = sizingMethods.filter(method => !validMethods.includes(method));
    
    if (invalidMethods.length > 0) {
      throw new MarketSizingError(
        `Invalid sizing methods: ${invalidMethods.join(', ')}`,
        'METHODOLOGY_UNSUPPORTED',
        [`Valid methods are: ${validMethods.join(', ')}`]
      );
    }

    if (sizingMethods.length === 1) {
      warnings.push('Using only one sizing method may limit accuracy');
      recommendations.push('Consider using multiple methodologies for cross-validation');
      confidence *= 0.9;
    }

    return {
      isValid: true,
      confidence,
      warnings,
      recommendations,
      dataGaps,
      qualityScore: this.calculateQualityScore(confidence, warnings.length, dataGaps.length)
    };
  }

  /**
   * Validate competitive analysis results for data quality
   */
  validateCompetitiveAnalysisResult(result: CompetitorAnalysisResult): DataQualityCheck {
    const qualityIndicators: QualityIndicator[] = [];
    const recommendations: string[] = [];
    let overallConfidence = 0;
    let sourceReliability = 0;
    let dataFreshness = 0;
    let methodologyRigor = 0;

    // Validate competitor data completeness
    const competitorQuality = this.validateCompetitorData(result.competitiveMatrix.competitors);
    qualityIndicators.push(...competitorQuality.indicators);
    recommendations.push(...competitorQuality.recommendations);

    // Validate source attribution
    const sourceQuality = this.validateSourceReferences(result.sourceAttribution);
    sourceReliability = sourceQuality.averageReliability;
    dataFreshness = sourceQuality.averageFreshness;
    qualityIndicators.push(...sourceQuality.indicators);
    recommendations.push(...sourceQuality.recommendations);

    // Validate SWOT analysis depth
    const swotQuality = this.validateSWOTAnalysis(result.swotAnalysis);
    methodologyRigor = swotQuality.rigorScore;
    qualityIndicators.push(...swotQuality.indicators);
    recommendations.push(...swotQuality.recommendations);

    // Validate strategic recommendations
    const strategyQuality = this.validateStrategicRecommendations(result.strategicRecommendations);
    qualityIndicators.push(...strategyQuality.indicators);
    recommendations.push(...strategyQuality.recommendations);

    // Calculate overall confidence
    overallConfidence = this.calculateOverallConfidence([
      competitorQuality.score,
      sourceReliability,
      dataFreshness,
      methodologyRigor,
      strategyQuality.score
    ]);

    return {
      sourceReliability,
      dataFreshness,
      methodologyRigor,
      overallConfidence,
      qualityIndicators,
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };
  }

  /**
   * Validate market sizing results for data quality
   */
  validateMarketSizingResult(result: MarketSizingResult): DataQualityCheck {
    const qualityIndicators: QualityIndicator[] = [];
    const recommendations: string[] = [];
    let overallConfidence = 0;
    let sourceReliability = 0;
    let dataFreshness = 0;
    let methodologyRigor = 0;

    // Validate market size calculations
    const sizingQuality = this.validateMarketSizeCalculations(result);
    methodologyRigor = sizingQuality.rigorScore;
    qualityIndicators.push(...sizingQuality.indicators);
    recommendations.push(...sizingQuality.recommendations);

    // Validate source attribution
    const sourceQuality = this.validateSourceReferences(result.sourceAttribution);
    sourceReliability = sourceQuality.averageReliability;
    dataFreshness = sourceQuality.averageFreshness;
    qualityIndicators.push(...sourceQuality.indicators);
    recommendations.push(...sourceQuality.recommendations);

    // Validate assumptions
    const assumptionQuality = this.validateMarketAssumptions(result.assumptions);
    qualityIndicators.push(...assumptionQuality.indicators);
    recommendations.push(...assumptionQuality.recommendations);

    // Validate confidence intervals
    const confidenceQuality = this.validateConfidenceIntervals(result.confidenceIntervals);
    qualityIndicators.push(...confidenceQuality.indicators);
    recommendations.push(...confidenceQuality.recommendations);

    // Calculate overall confidence
    overallConfidence = this.calculateOverallConfidence([
      sizingQuality.rigorScore,
      sourceReliability,
      dataFreshness,
      assumptionQuality.score,
      confidenceQuality.score
    ]);

    return {
      sourceReliability,
      dataFreshness,
      methodologyRigor,
      overallConfidence,
      qualityIndicators,
      recommendations: [...new Set(recommendations)]
    };
  }

  // ============================================================================
  // Private Validation Methods
  // ============================================================================

  private validateMarketContext(context: any): ValidationResult {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const dataGaps: string[] = [];
    let confidence = 1.0;

    if (!context.industry) {
      dataGaps.push('Industry not specified');
      confidence *= 0.9;
    }

    if (!context.geography || !Array.isArray(context.geography) || context.geography.length === 0) {
      dataGaps.push('Geographic scope not defined');
      confidence *= 0.9;
    }

    if (!context.target_segment) {
      dataGaps.push('Target segment not specified');
      confidence *= 0.9;
    }

    return {
      isValid: true,
      confidence,
      warnings,
      recommendations,
      dataGaps,
      qualityScore: confidence
    };
  }

  private validateCompetitorData(competitors: any[]): {
    indicators: QualityIndicator[];
    recommendations: string[];
    score: number;
  } {
    const indicators: QualityIndicator[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    if (!competitors || competitors.length === 0) {
      indicators.push({
        metric: 'Competitor Count',
        score: 0,
        description: 'No competitors identified',
        impact: 'critical'
      });
      recommendations.push('Expand competitor research to identify market players');
      return { indicators, recommendations, score: 0 };
    }

    if (competitors.length < COMPETITIVE_ANALYSIS_DEFAULTS.MIN_COMPETITORS) {
      indicators.push({
        metric: 'Competitor Count',
        score: 0.6,
        description: `Only ${competitors.length} competitors found (minimum ${COMPETITIVE_ANALYSIS_DEFAULTS.MIN_COMPETITORS} recommended)`,
        impact: 'important'
      });
      recommendations.push('Research additional competitors for comprehensive analysis');
      score *= 0.8;
    }

    // Check data completeness for each competitor
    let completeProfiles = 0;
    competitors.forEach((competitor, index) => {
      const completeness = this.calculateCompetitorCompleteness(competitor);
      if (completeness > 0.7) completeProfiles++;
      
      if (completeness < 0.5) {
        indicators.push({
          metric: `Competitor ${index + 1} Data Completeness`,
          score: completeness,
          description: `Insufficient data for ${competitor.name || 'unnamed competitor'}`,
          impact: 'important'
        });
      }
    });

    const profileCompletenessRatio = completeProfiles / competitors.length;
    if (profileCompletenessRatio < 0.6) {
      recommendations.push('Gather more detailed information on key competitors');
      score *= 0.9;
    }

    indicators.push({
      metric: 'Profile Completeness',
      score: profileCompletenessRatio,
      description: `${Math.round(profileCompletenessRatio * 100)}% of competitor profiles are complete`,
      impact: profileCompletenessRatio > 0.7 ? 'minor' : 'important'
    });

    return { indicators, recommendations, score };
  }

  private validateSourceReferences(sources: SourceReference[]): {
    indicators: QualityIndicator[];
    recommendations: string[];
    averageReliability: number;
    averageFreshness: number;
  } {
    const indicators: QualityIndicator[] = [];
    const recommendations: string[] = [];

    if (!sources || sources.length === 0) {
      indicators.push({
        metric: 'Source Attribution',
        score: 0,
        description: 'No sources referenced',
        impact: 'critical'
      });
      recommendations.push('Add credible source references to support analysis');
      return { indicators, recommendations, averageReliability: 0, averageFreshness: 0 };
    }

    const reliabilityScores = sources.map(s => s.reliability);
    const averageReliability = reliabilityScores.reduce((a, b) => a + b, 0) / reliabilityScores.length;

    const freshnessScores = sources.map(s => this.calculateFreshnessScore(s.dataFreshness.ageInDays));
    const averageFreshness = freshnessScores.reduce((a, b) => a + b, 0) / freshnessScores.length;

    indicators.push({
      metric: 'Source Reliability',
      score: averageReliability,
      description: `Average source reliability: ${Math.round(averageReliability * 100)}%`,
      impact: averageReliability > SOURCE_RELIABILITY_THRESHOLDS.HIGH ? 'minor' : 'important'
    });

    indicators.push({
      metric: 'Data Freshness',
      score: averageFreshness,
      description: `Average data freshness score: ${Math.round(averageFreshness * 100)}%`,
      impact: averageFreshness > 0.7 ? 'minor' : 'important'
    });

    if (averageReliability < SOURCE_RELIABILITY_THRESHOLDS.MEDIUM) {
      recommendations.push('Include more authoritative sources (McKinsey, Gartner, industry reports)');
    }

    if (averageFreshness < 0.6) {
      recommendations.push('Update analysis with more recent data sources');
    }

    return { indicators, recommendations, averageReliability, averageFreshness };
  }

  private validateSWOTAnalysis(swotAnalyses: any[]): {
    indicators: QualityIndicator[];
    recommendations: string[];
    rigorScore: number;
  } {
    const indicators: QualityIndicator[] = [];
    const recommendations: string[] = [];
    let rigorScore = 1.0;

    if (!swotAnalyses || swotAnalyses.length === 0) {
      indicators.push({
        metric: 'SWOT Analysis Coverage',
        score: 0,
        description: 'No SWOT analysis provided',
        impact: 'important'
      });
      recommendations.push('Include SWOT analysis for key competitors');
      return { indicators, recommendations, rigorScore: 0 };
    }

    let totalItems = 0;
    let highConfidenceItems = 0;

    swotAnalyses.forEach(swot => {
      const categories = ['strengths', 'weaknesses', 'opportunities', 'threats'];
      categories.forEach(category => {
        if (swot[category] && Array.isArray(swot[category])) {
          totalItems += swot[category].length;
          highConfidenceItems += swot[category].filter((item: any) => item.confidence > 0.7).length;
        }
      });
    });

    const confidenceRatio = totalItems > 0 ? highConfidenceItems / totalItems : 0;
    rigorScore = confidenceRatio;

    indicators.push({
      metric: 'SWOT Analysis Rigor',
      score: confidenceRatio,
      description: `${Math.round(confidenceRatio * 100)}% of SWOT items have high confidence`,
      impact: confidenceRatio > 0.6 ? 'minor' : 'important'
    });

    if (confidenceRatio < 0.5) {
      recommendations.push('Strengthen SWOT analysis with more detailed research and validation');
    }

    return { indicators, recommendations, rigorScore };
  }

  private validateStrategicRecommendations(recommendations: any[]): {
    indicators: QualityIndicator[];
    recommendations: string[];
    score: number;
  } {
    const indicators: QualityIndicator[] = [];
    const validationRecommendations: string[] = [];
    let score = 1.0;

    if (!recommendations || recommendations.length === 0) {
      indicators.push({
        metric: 'Strategic Recommendations',
        score: 0,
        description: 'No strategic recommendations provided',
        impact: 'important'
      });
      validationRecommendations.push('Include actionable strategic recommendations');
      return { indicators, recommendations: validationRecommendations, score: 0 };
    }

    const detailedRecommendations = recommendations.filter(rec => 
      rec.implementation && Array.isArray(rec.implementation) && rec.implementation.length > 0
    );

    const detailRatio = detailedRecommendations.length / recommendations.length;
    score = detailRatio;

    indicators.push({
      metric: 'Recommendation Detail',
      score: detailRatio,
      description: `${Math.round(detailRatio * 100)}% of recommendations include implementation details`,
      impact: detailRatio > 0.7 ? 'minor' : 'important'
    });

    if (detailRatio < 0.6) {
      validationRecommendations.push('Add implementation steps and timelines to strategic recommendations');
    }

    return { indicators, recommendations: validationRecommendations, score };
  }

  private validateMarketSizeCalculations(result: MarketSizingResult): {
    indicators: QualityIndicator[];
    recommendations: string[];
    rigorScore: number;
  } {
    const indicators: QualityIndicator[] = [];
    const recommendations: string[] = [];
    let rigorScore = 1.0;

    // Validate TAM > SAM > SOM relationship
    const tamValue = result.tam.value;
    const samValue = result.sam.value;
    const somValue = result.som.value;

    if (tamValue <= samValue || samValue <= somValue) {
      indicators.push({
        metric: 'Market Size Logic',
        score: 0.3,
        description: 'TAM/SAM/SOM relationship is illogical',
        impact: 'critical'
      });
      recommendations.push('Ensure TAM > SAM > SOM in market sizing calculations');
      rigorScore *= 0.5;
    } else {
      indicators.push({
        metric: 'Market Size Logic',
        score: 1.0,
        description: 'TAM/SAM/SOM relationship is logical',
        impact: 'minor'
      });
    }

    // Validate methodology diversity
    const methodologies = result.methodology.map(m => m.type);
    const uniqueMethodologies = [...new Set(methodologies)];
    
    const methodologyScore = uniqueMethodologies.length / 3; // Max 3 methodologies
    indicators.push({
      metric: 'Methodology Diversity',
      score: methodologyScore,
      description: `${uniqueMethodologies.length} different sizing methodologies used`,
      impact: methodologyScore > 0.6 ? 'minor' : 'important'
    });

    if (uniqueMethodologies.length < 2) {
      recommendations.push('Use multiple sizing methodologies for validation');
      rigorScore *= 0.8;
    }

    return { indicators, recommendations, rigorScore };
  }

  private validateMarketAssumptions(assumptions: any[]): {
    indicators: QualityIndicator[];
    recommendations: string[];
    score: number;
  } {
    const indicators: QualityIndicator[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    if (!assumptions || assumptions.length === 0) {
      indicators.push({
        metric: 'Market Assumptions',
        score: 0,
        description: 'No market assumptions documented',
        impact: 'important'
      });
      recommendations.push('Document key market assumptions for transparency');
      return { indicators, recommendations, score: 0 };
    }

    const highConfidenceAssumptions = assumptions.filter(a => a.confidence > 0.7);
    const confidenceRatio = highConfidenceAssumptions.length / assumptions.length;
    score = confidenceRatio;

    indicators.push({
      metric: 'Assumption Confidence',
      score: confidenceRatio,
      description: `${Math.round(confidenceRatio * 100)}% of assumptions have high confidence`,
      impact: confidenceRatio > 0.6 ? 'minor' : 'important'
    });

    if (confidenceRatio < 0.5) {
      recommendations.push('Validate key assumptions with additional research');
    }

    return { indicators, recommendations, score };
  }

  private validateConfidenceIntervals(intervals: any[]): {
    indicators: QualityIndicator[];
    recommendations: string[];
    score: number;
  } {
    const indicators: QualityIndicator[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    if (!intervals || intervals.length === 0) {
      indicators.push({
        metric: 'Confidence Intervals',
        score: 0,
        description: 'No confidence intervals provided',
        impact: 'important'
      });
      recommendations.push('Include confidence intervals for market size estimates');
      return { indicators, recommendations, score: 0 };
    }

    const validIntervals = intervals.filter(interval => 
      interval.lowerBound < interval.upperBound && interval.confidenceLevel > 0
    );

    const validityRatio = validIntervals.length / intervals.length;
    score = validityRatio;

    indicators.push({
      metric: 'Confidence Interval Validity',
      score: validityRatio,
      description: `${Math.round(validityRatio * 100)}% of confidence intervals are valid`,
      impact: validityRatio > 0.8 ? 'minor' : 'important'
    });

    if (validityRatio < 0.8) {
      recommendations.push('Review and correct invalid confidence intervals');
    }

    return { indicators, recommendations, score };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private calculateCompetitorCompleteness(competitor: any): number {
    const requiredFields = ['name', 'strengths', 'weaknesses', 'keyFeatures', 'pricing'];
    const optionalFields = ['marketShare', 'targetMarket', 'recentMoves'];
    
    let score = 0;
    let totalFields = requiredFields.length + optionalFields.length;

    requiredFields.forEach(field => {
      if (competitor[field] && 
          (typeof competitor[field] === 'string' ? competitor[field].trim() : true) &&
          (Array.isArray(competitor[field]) ? competitor[field].length > 0 : true)) {
        score += 2; // Required fields worth more
      }
    });

    optionalFields.forEach(field => {
      if (competitor[field] && 
          (typeof competitor[field] === 'string' ? competitor[field].trim() : true) &&
          (Array.isArray(competitor[field]) ? competitor[field].length > 0 : true)) {
        score += 1;
      }
    });

    return Math.min(score / (requiredFields.length * 2 + optionalFields.length), 1.0);
  }

  private calculateFreshnessScore(ageInDays: number): number {
    if (ageInDays <= 30) return 1.0;
    if (ageInDays <= 90) return 0.8;
    if (ageInDays <= 180) return 0.6;
    if (ageInDays <= 365) return 0.4;
    return 0.2;
  }

  private calculateOverallConfidence(scores: number[]): number {
    if (scores.length === 0) return 0;
    
    // Weighted average with emphasis on critical factors
    const weights = [0.25, 0.25, 0.2, 0.15, 0.15]; // Adjust based on importance
    const weightedSum = scores.reduce((sum, score, index) => {
      const weight = weights[index] || (1 / scores.length);
      return sum + (score * weight);
    }, 0);

    return Math.min(weightedSum, 1.0);
  }

  private calculateQualityScore(confidence: number, warningCount: number, gapCount: number): number {
    let score = confidence;
    
    // Penalize for warnings and gaps
    score -= (warningCount * 0.05);
    score -= (gapCount * 0.1);
    
    return Math.max(score, 0);
  }
}

// ============================================================================
// Graceful Degradation Utilities
// ============================================================================

export class GracefulDegradationManager {
  /**
   * Handle insufficient competitor data scenarios
   */
  static handleInsufficientCompetitorData(
    availableCompetitors: any[],
    minRequired: number = COMPETITIVE_ANALYSIS_DEFAULTS.MIN_COMPETITORS
  ): {
    canProceed: boolean;
    degradedAnalysis: boolean;
    recommendations: string[];
    adjustedConfidence: number;
  } {
    const recommendations: string[] = [];
    let adjustedConfidence = 1.0;
    let degradedAnalysis = false;

    if (availableCompetitors.length === 0) {
      return {
        canProceed: false,
        degradedAnalysis: true,
        recommendations: [
          'No competitors identified. Cannot perform competitive analysis.',
          'Consider researching direct and indirect competitors in your market space.',
          'Use alternative analysis methods like market research or customer interviews.'
        ],
        adjustedConfidence: 0
      };
    }

    if (availableCompetitors.length < minRequired) {
      degradedAnalysis = true;
      adjustedConfidence = Math.max(0.3, availableCompetitors.length / minRequired);
      
      recommendations.push(
        `Limited competitor data (${availableCompetitors.length}/${minRequired}). Analysis will be less comprehensive.`,
        'Consider expanding competitor research for more complete analysis.',
        'Focus on available competitors and note analysis limitations.'
      );
    }

    return {
      canProceed: true,
      degradedAnalysis,
      recommendations,
      adjustedConfidence
    };
  }

  /**
   * Handle insufficient market data scenarios
   */
  static handleInsufficientMarketData(
    availableData: any,
    requiredFields: string[]
  ): {
    canProceed: boolean;
    degradedAnalysis: boolean;
    recommendations: string[];
    adjustedConfidence: number;
    availableMethodologies: string[];
  } {
    const recommendations: string[] = [];
    let adjustedConfidence = 1.0;
    let degradedAnalysis = false;
    const availableMethodologies: string[] = [];

    const missingFields = requiredFields.filter(field => !availableData[field]);
    const completenessRatio = (requiredFields.length - missingFields.length) / requiredFields.length;

    if (completenessRatio < 0.3) {
      return {
        canProceed: false,
        degradedAnalysis: true,
        recommendations: [
          'Insufficient market data for reliable sizing analysis.',
          `Missing critical fields: ${missingFields.join(', ')}`,
          'Gather additional market research before attempting sizing analysis.'
        ],
        adjustedConfidence: 0,
        availableMethodologies: []
      };
    }

    // Determine available methodologies based on data completeness
    if (availableData.industry && availableData.totalMarketSize) {
      availableMethodologies.push('top-down');
    }

    if (availableData.customerSegments && availableData.pricingData) {
      availableMethodologies.push('bottom-up');
    }

    if (availableData.valueProposition && availableData.customerWillingness) {
      availableMethodologies.push('value-theory');
    }

    if (availableMethodologies.length === 0) {
      return {
        canProceed: false,
        degradedAnalysis: true,
        recommendations: [
          'No suitable sizing methodologies available with current data.',
          'Gather industry reports for top-down analysis.',
          'Collect customer and pricing data for bottom-up analysis.'
        ],
        adjustedConfidence: 0,
        availableMethodologies: []
      };
    }

    if (completenessRatio < 0.7) {
      degradedAnalysis = true;
      adjustedConfidence = completenessRatio;
      
      recommendations.push(
        `Market data is ${Math.round(completenessRatio * 100)}% complete. Analysis will have limitations.`,
        `Available methodologies: ${availableMethodologies.join(', ')}`,
        `Missing data: ${missingFields.join(', ')}`
      );
    }

    return {
      canProceed: true,
      degradedAnalysis,
      recommendations,
      adjustedConfidence,
      availableMethodologies
    };
  }

  /**
   * Handle stale data scenarios
   */
  static handleStaleData(
    sources: SourceReference[],
    freshnessThreshold: number = COMPETITIVE_ANALYSIS_DEFAULTS.STALE_DATA_THRESHOLD_DAYS
  ): {
    canProceed: boolean;
    degradedAnalysis: boolean;
    recommendations: string[];
    adjustedConfidence: number;
    staleSourceCount: number;
  } {
    const recommendations: string[] = [];
    let adjustedConfidence = 1.0;
    let degradedAnalysis = false;

    const staleSources = sources.filter(source => 
      source.dataFreshness.ageInDays > freshnessThreshold
    );

    const staleRatio = staleSources.length / sources.length;

    if (staleRatio > 0.8) {
      degradedAnalysis = true;
      adjustedConfidence = 0.4;
      
      recommendations.push(
        'Most data sources are stale. Analysis reliability is significantly reduced.',
        'Update analysis with recent market data and competitor information.',
        'Consider this analysis as directional rather than definitive.'
      );
    } else if (staleRatio > 0.5) {
      degradedAnalysis = true;
      adjustedConfidence = 0.7;
      
      recommendations.push(
        'Some data sources are outdated. Analysis may not reflect current market conditions.',
        'Refresh key data points for more accurate analysis.'
      );
    } else if (staleRatio > 0.2) {
      adjustedConfidence = 0.9;
      
      recommendations.push(
        'Minor data freshness issues detected. Overall analysis remains reliable.'
      );
    }

    return {
      canProceed: true,
      degradedAnalysis,
      recommendations,
      adjustedConfidence,
      staleSourceCount: staleSources.length
    };
  }
}

// ============================================================================
// Export Default Validator Instance
// ============================================================================

export const defaultDataQualityValidator = new DataQualityValidator();