/**
 * Confidence Scoring and Uncertainty Management System
 * 
 * This module implements confidence scoring for analysis results, creates uncertainty 
 * indicators and recommendation systems for competitive and market analysis.
 */

import {
  CompetitorAnalysisResult,
  MarketSizingResult,
  SourceReference,
  DataQualityCheck,
  ValidationResult,
  QualityIndicator,
  SWOTAnalysis,
  StrategyRecommendation,
  MarketAssumption,
  ConfidenceInterval,
  COMPETITIVE_ANALYSIS_DEFAULTS,
  MARKET_SIZING_DEFAULTS,
  SOURCE_RELIABILITY_THRESHOLDS
} from '../models/competitive';

// ============================================================================
// Core Confidence Scoring Interfaces
// ============================================================================

export interface ConfidenceScore {
  overall: number;
  components: ConfidenceComponent[];
  uncertaintyFactors: UncertaintyFactor[];
  recommendations: ConfidenceRecommendation[];
  reliabilityLevel: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
  lastCalculated: string;
}

export interface ConfidenceComponent {
  name: string;
  score: number;
  weight: number;
  description: string;
  contributingFactors: string[];
  uncertaintyImpact: 'critical' | 'high' | 'medium' | 'low';
}

export interface UncertaintyFactor {
  type: 'data-quality' | 'methodology' | 'market-volatility' | 'competitive-dynamics' | 'assumption-risk';
  description: string;
  impact: number; // 0-1 scale, how much it reduces confidence
  likelihood: number; // 0-1 scale, probability of this uncertainty affecting results
  mitigation: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ConfidenceRecommendation {
  type: 'improve-data' | 'validate-assumptions' | 'expand-research' | 'monitor-changes' | 'seek-expert-input';
  priority: 'immediate' | 'high' | 'medium' | 'low';
  description: string;
  expectedImpact: number; // Expected confidence improvement (0-1 scale)
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  specificActions: string[];
}

export interface UncertaintyIndicator {
  metric: string;
  currentValue: number;
  uncertaintyRange: {
    lower: number;
    upper: number;
    confidenceLevel: number;
  };
  volatility: number;
  trendDirection: 'increasing' | 'stable' | 'decreasing' | 'unknown';
  lastUpdated: string;
}

// ============================================================================
// Confidence Scoring Engine
// ============================================================================

export class ConfidenceScorer {
  private readonly weights: ConfidenceWeights;
  private readonly thresholds: ConfidenceThresholds;

  constructor(
    weights?: Partial<ConfidenceWeights>,
    thresholds?: Partial<ConfidenceThresholds>
  ) {
    this.weights = { ...DEFAULT_CONFIDENCE_WEIGHTS, ...weights };
    this.thresholds = { ...DEFAULT_CONFIDENCE_THRESHOLDS, ...thresholds };
  }

  /**
   * Calculate comprehensive confidence score for competitive analysis
   */
  calculateCompetitiveAnalysisConfidence(
    result: CompetitorAnalysisResult,
    dataQuality: DataQualityCheck
  ): ConfidenceScore {
    const components: ConfidenceComponent[] = [];
    const uncertaintyFactors: UncertaintyFactor[] = [];

    // Data Quality Component
    const dataQualityComponent = this.calculateDataQualityConfidence(dataQuality);
    components.push(dataQualityComponent);

    // Competitor Coverage Component
    const competitorCoverageComponent = this.calculateCompetitorCoverageConfidence(
      result.competitiveMatrix.competitors
    );
    components.push(competitorCoverageComponent);

    // Source Reliability Component
    const sourceReliabilityComponent = this.calculateSourceReliabilityConfidence(
      result.sourceAttribution
    );
    components.push(sourceReliabilityComponent);

    // Analysis Depth Component
    const analysisDepthComponent = this.calculateAnalysisDepthConfidence(
      result.swotAnalysis,
      result.strategicRecommendations
    );
    components.push(analysisDepthComponent);

    // Market Context Component
    const marketContextComponent = this.calculateMarketContextConfidence(
      result.competitiveMatrix.marketContext
    );
    components.push(marketContextComponent);

    // Calculate uncertainty factors
    uncertaintyFactors.push(...this.identifyCompetitiveUncertaintyFactors(result, dataQuality));

    // Calculate overall confidence
    const overall = this.calculateWeightedConfidence(components);

    // Apply uncertainty adjustments
    const adjustedOverall = this.applyUncertaintyAdjustments(overall, uncertaintyFactors);

    // Generate recommendations
    const recommendations = this.generateConfidenceRecommendations(
      components,
      uncertaintyFactors,
      'competitive'
    );

    return {
      overall: adjustedOverall,
      components,
      uncertaintyFactors,
      recommendations,
      reliabilityLevel: this.determineReliabilityLevel(adjustedOverall),
      lastCalculated: new Date().toISOString()
    };
  }

  /**
   * Calculate comprehensive confidence score for market sizing
   */
  calculateMarketSizingConfidence(
    result: MarketSizingResult,
    dataQuality: DataQualityCheck
  ): ConfidenceScore {
    const components: ConfidenceComponent[] = [];
    const uncertaintyFactors: UncertaintyFactor[] = [];

    // Data Quality Component
    const dataQualityComponent = this.calculateDataQualityConfidence(dataQuality);
    components.push(dataQualityComponent);

    // Methodology Rigor Component
    const methodologyComponent = this.calculateMethodologyConfidence(result.methodology);
    components.push(methodologyComponent);

    // Market Size Logic Component
    const logicComponent = this.calculateMarketSizeLogicConfidence(result);
    components.push(logicComponent);

    // Assumption Validity Component
    const assumptionComponent = this.calculateAssumptionConfidence(result.assumptions);
    components.push(assumptionComponent);

    // Source Reliability Component
    const sourceComponent = this.calculateSourceReliabilityConfidence(result.sourceAttribution);
    components.push(sourceComponent);

    // Confidence Intervals Component
    const intervalComponent = this.calculateConfidenceIntervalConfidence(result.confidenceIntervals);
    components.push(intervalComponent);

    // Calculate uncertainty factors
    uncertaintyFactors.push(...this.identifyMarketSizingUncertaintyFactors(result, dataQuality));

    // Calculate overall confidence
    const overall = this.calculateWeightedConfidence(components);

    // Apply uncertainty adjustments
    const adjustedOverall = this.applyUncertaintyAdjustments(overall, uncertaintyFactors);

    // Generate recommendations
    const recommendations = this.generateConfidenceRecommendations(
      components,
      uncertaintyFactors,
      'market-sizing'
    );

    return {
      overall: adjustedOverall,
      components,
      uncertaintyFactors,
      recommendations,
      reliabilityLevel: this.determineReliabilityLevel(adjustedOverall),
      lastCalculated: new Date().toISOString()
    };
  }

  /**
   * Generate uncertainty indicators for key metrics
   */
  generateUncertaintyIndicators(
    result: CompetitorAnalysisResult | MarketSizingResult,
    confidenceScore: ConfidenceScore
  ): UncertaintyIndicator[] {
    const indicators: UncertaintyIndicator[] = [];

    if ('competitiveMatrix' in result) {
      // Competitive analysis indicators
      indicators.push(...this.generateCompetitiveUncertaintyIndicators(result, confidenceScore));
    } else {
      // Market sizing indicators
      indicators.push(...this.generateMarketSizingUncertaintyIndicators(result, confidenceScore));
    }

    return indicators;
  }

  // ============================================================================
  // Private Confidence Calculation Methods
  // ============================================================================

  private calculateDataQualityConfidence(dataQuality: DataQualityCheck): ConfidenceComponent {
    const score = (
      dataQuality.sourceReliability * 0.3 +
      dataQuality.dataFreshness * 0.3 +
      dataQuality.methodologyRigor * 0.2 +
      dataQuality.overallConfidence * 0.2
    );

    return {
      name: 'Data Quality',
      score,
      weight: this.weights.dataQuality,
      description: `Overall data quality score: ${Math.round(score * 100)}%`,
      contributingFactors: [
        `Source reliability: ${Math.round(dataQuality.sourceReliability * 100)}%`,
        `Data freshness: ${Math.round(dataQuality.dataFreshness * 100)}%`,
        `Methodology rigor: ${Math.round(dataQuality.methodologyRigor * 100)}%`
      ],
      uncertaintyImpact: score > 0.8 ? 'low' : score > 0.6 ? 'medium' : 'high'
    };
  }

  private calculateCompetitorCoverageConfidence(competitors: any[]): ConfidenceComponent {
    const competitorCount = competitors.length;
    const minCompetitors = COMPETITIVE_ANALYSIS_DEFAULTS.MIN_COMPETITORS;
    const maxCompetitors = COMPETITIVE_ANALYSIS_DEFAULTS.MAX_COMPETITORS;

    let score = 0;
    if (competitorCount === 0) {
      score = 0;
    } else if (competitorCount < minCompetitors) {
      score = Math.max(0.3, competitorCount / minCompetitors * 0.7);
    } else if (competitorCount <= maxCompetitors) {
      score = 0.7 + (competitorCount - minCompetitors) / (maxCompetitors - minCompetitors) * 0.3;
    } else {
      score = 1.0; // More competitors is generally better
    }

    // Adjust for competitor data completeness
    const completenessScores = competitors.map(c => this.calculateCompetitorCompleteness(c));
    const avgCompleteness = completenessScores.length > 0 
      ? completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length 
      : 0;
    
    score *= avgCompleteness;

    return {
      name: 'Competitor Coverage',
      score,
      weight: this.weights.competitorCoverage,
      description: `${competitorCount} competitors analyzed with ${Math.round(avgCompleteness * 100)}% average completeness`,
      contributingFactors: [
        `Competitor count: ${competitorCount}`,
        `Average data completeness: ${Math.round(avgCompleteness * 100)}%`,
        `Coverage adequacy: ${competitorCount >= minCompetitors ? 'Adequate' : 'Insufficient'}`
      ],
      uncertaintyImpact: score > 0.7 ? 'low' : score > 0.5 ? 'medium' : 'high'
    };
  }

  private calculateSourceReliabilityConfidence(sources: SourceReference[]): ConfidenceComponent {
    if (sources.length === 0) {
      return {
        name: 'Source Reliability',
        score: 0,
        weight: this.weights.sourceReliability,
        description: 'No sources referenced',
        contributingFactors: ['No source attribution provided'],
        uncertaintyImpact: 'critical'
      };
    }

    const reliabilityScores = sources.map(s => s.reliability);
    const avgReliability = reliabilityScores.reduce((a, b) => a + b, 0) / reliabilityScores.length;

    // Bonus for authoritative sources
    const authoritativeSources = sources.filter(s => 
      ['mckinsey', 'gartner', 'wef'].includes(s.type)
    );
    const authoritativeBonus = Math.min(0.2, authoritativeSources.length / sources.length * 0.2);

    const score = Math.min(1.0, avgReliability + authoritativeBonus);

    return {
      name: 'Source Reliability',
      score,
      weight: this.weights.sourceReliability,
      description: `${sources.length} sources with ${Math.round(avgReliability * 100)}% average reliability`,
      contributingFactors: [
        `Source count: ${sources.length}`,
        `Average reliability: ${Math.round(avgReliability * 100)}%`,
        `Authoritative sources: ${authoritativeSources.length}/${sources.length}`
      ],
      uncertaintyImpact: score > SOURCE_RELIABILITY_THRESHOLDS.HIGH ? 'low' : 
                        score > SOURCE_RELIABILITY_THRESHOLDS.MEDIUM ? 'medium' : 'high'
    };
  }

  private calculateAnalysisDepthConfidence(
    swotAnalyses: SWOTAnalysis[],
    recommendations: StrategyRecommendation[]
  ): ConfidenceComponent {
    let score = 0;
    const factors: string[] = [];

    // SWOT analysis depth
    if (swotAnalyses.length > 0) {
      const totalItems = swotAnalyses.reduce((total, swot) => {
        return total + 
          (swot.strengths?.length || 0) +
          (swot.weaknesses?.length || 0) +
          (swot.opportunities?.length || 0) +
          (swot.threats?.length || 0);
      }, 0);

      const swotScore = Math.min(1.0, totalItems / (swotAnalyses.length * 8)); // 8 items per competitor ideal
      score += swotScore * 0.5;
      factors.push(`SWOT depth: ${totalItems} total items across ${swotAnalyses.length} competitors`);
    } else {
      factors.push('No SWOT analysis provided');
    }

    // Strategic recommendations depth
    if (recommendations.length > 0) {
      const detailedRecommendations = recommendations.filter(r => 
        r.implementation && r.implementation.length > 0
      );
      const recommendationScore = detailedRecommendations.length / recommendations.length;
      score += recommendationScore * 0.5;
      factors.push(`${detailedRecommendations.length}/${recommendations.length} recommendations have implementation details`);
    } else {
      factors.push('No strategic recommendations provided');
    }

    return {
      name: 'Analysis Depth',
      score,
      weight: this.weights.analysisDepth,
      description: `Analysis depth score: ${Math.round(score * 100)}%`,
      contributingFactors: factors,
      uncertaintyImpact: score > 0.7 ? 'low' : score > 0.5 ? 'medium' : 'high'
    };
  }

  private calculateMarketContextConfidence(marketContext: any): ConfidenceComponent {
    let score = 0;
    const factors: string[] = [];

    // Check for key context elements
    const contextElements = [
      { key: 'industry', weight: 0.3, label: 'Industry specification' },
      { key: 'geography', weight: 0.2, label: 'Geographic scope' },
      { key: 'targetSegment', weight: 0.2, label: 'Target segment' },
      { key: 'marketMaturity', weight: 0.15, label: 'Market maturity' },
      { key: 'regulatoryEnvironment', weight: 0.075, label: 'Regulatory context' },
      { key: 'technologyTrends', weight: 0.075, label: 'Technology trends' }
    ];

    contextElements.forEach(element => {
      if (marketContext[element.key] && 
          (typeof marketContext[element.key] === 'string' ? marketContext[element.key].trim() : true) &&
          (Array.isArray(marketContext[element.key]) ? marketContext[element.key].length > 0 : true)) {
        score += element.weight;
        factors.push(`${element.label}: Provided`);
      } else {
        factors.push(`${element.label}: Missing`);
      }
    });

    return {
      name: 'Market Context',
      score,
      weight: this.weights.marketContext,
      description: `Market context completeness: ${Math.round(score * 100)}%`,
      contributingFactors: factors,
      uncertaintyImpact: score > 0.8 ? 'low' : score > 0.6 ? 'medium' : 'high'
    };
  }

  private calculateMethodologyConfidence(methodologies: any[]): ConfidenceComponent {
    if (methodologies.length === 0) {
      return {
        name: 'Methodology Rigor',
        score: 0,
        weight: this.weights.methodologyRigor,
        description: 'No methodologies specified',
        contributingFactors: ['No sizing methodologies provided'],
        uncertaintyImpact: 'critical'
      };
    }

    const uniqueMethodologies = [...new Set(methodologies.map(m => m.type))];
    const diversityScore = Math.min(1.0, uniqueMethodologies.length / 3); // Max 3 methodologies

    const avgReliability = methodologies.reduce((sum, m) => sum + (m.reliability || 0), 0) / methodologies.length;
    const avgConfidence = methodologies.reduce((sum, m) => sum + (m.confidence || 0), 0) / methodologies.length;

    const score = (diversityScore * 0.4 + avgReliability * 0.3 + avgConfidence * 0.3);

    return {
      name: 'Methodology Rigor',
      score,
      weight: this.weights.methodologyRigor,
      description: `${uniqueMethodologies.length} methodologies with ${Math.round(avgReliability * 100)}% avg reliability`,
      contributingFactors: [
        `Methodology diversity: ${uniqueMethodologies.join(', ')}`,
        `Average reliability: ${Math.round(avgReliability * 100)}%`,
        `Average confidence: ${Math.round(avgConfidence * 100)}%`
      ],
      uncertaintyImpact: score > 0.7 ? 'low' : score > 0.5 ? 'medium' : 'high'
    };
  }

  private calculateMarketSizeLogicConfidence(result: MarketSizingResult): ConfidenceComponent {
    const tam = result.tam.value;
    const sam = result.sam.value;
    const som = result.som.value;

    let score = 1.0;
    const factors: string[] = [];

    // Check TAM > SAM > SOM logic
    if (tam <= sam) {
      score *= 0.3;
      factors.push('TAM ≤ SAM (illogical)');
    } else {
      factors.push('TAM > SAM (logical)');
    }

    if (sam <= som) {
      score *= 0.3;
      factors.push('SAM ≤ SOM (illogical)');
    } else {
      factors.push('SAM > SOM (logical)');
    }

    // Check reasonable ratios
    const samToTamRatio = sam / tam;
    const somToSamRatio = som / sam;

    if (samToTamRatio > 0.8) {
      score *= 0.8;
      factors.push('SAM/TAM ratio very high (>80%)');
    } else if (samToTamRatio < 0.05) {
      score *= 0.9;
      factors.push('SAM/TAM ratio very low (<5%)');
    } else {
      factors.push(`SAM/TAM ratio: ${Math.round(samToTamRatio * 100)}% (reasonable)`);
    }

    if (somToSamRatio > 0.5) {
      score *= 0.9;
      factors.push('SOM/SAM ratio high (>50%)');
    } else {
      factors.push(`SOM/SAM ratio: ${Math.round(somToSamRatio * 100)}% (reasonable)`);
    }

    return {
      name: 'Market Size Logic',
      score,
      weight: this.weights.marketSizeLogic,
      description: `Market size relationships: ${score > 0.8 ? 'Logical' : 'Issues detected'}`,
      contributingFactors: factors,
      uncertaintyImpact: score > 0.8 ? 'low' : score > 0.5 ? 'medium' : 'critical'
    };
  }

  private calculateAssumptionConfidence(assumptions: MarketAssumption[]): ConfidenceComponent {
    if (assumptions.length === 0) {
      return {
        name: 'Assumption Validity',
        score: 0.3, // Some score for transparency
        weight: this.weights.assumptionValidity,
        description: 'No assumptions documented',
        contributingFactors: ['Assumptions not explicitly stated'],
        uncertaintyImpact: 'high'
      };
    }

    const avgConfidence = assumptions.reduce((sum, a) => sum + a.confidence, 0) / assumptions.length;
    const highImpactAssumptions = assumptions.filter(a => a.impact === 'high');
    const highConfidenceAssumptions = assumptions.filter(a => a.confidence > 0.7);

    const score = avgConfidence * (highConfidenceAssumptions.length / assumptions.length);

    return {
      name: 'Assumption Validity',
      score,
      weight: this.weights.assumptionValidity,
      description: `${assumptions.length} assumptions with ${Math.round(avgConfidence * 100)}% avg confidence`,
      contributingFactors: [
        `Total assumptions: ${assumptions.length}`,
        `High-impact assumptions: ${highImpactAssumptions.length}`,
        `High-confidence assumptions: ${highConfidenceAssumptions.length}`,
        `Average confidence: ${Math.round(avgConfidence * 100)}%`
      ],
      uncertaintyImpact: score > 0.7 ? 'low' : score > 0.5 ? 'medium' : 'high'
    };
  }

  private calculateConfidenceIntervalConfidence(intervals: ConfidenceInterval[]): ConfidenceComponent {
    if (intervals.length === 0) {
      return {
        name: 'Confidence Intervals',
        score: 0,
        weight: this.weights.confidenceIntervals,
        description: 'No confidence intervals provided',
        contributingFactors: ['Statistical uncertainty not quantified'],
        uncertaintyImpact: 'medium'
      };
    }

    const validIntervals = intervals.filter(i => i.lowerBound < i.upperBound && i.confidenceLevel > 0);
    const validityRatio = validIntervals.length / intervals.length;

    const avgConfidenceLevel = validIntervals.reduce((sum, i) => sum + i.confidenceLevel, 0) / validIntervals.length;
    const score = validityRatio * (avgConfidenceLevel > 0.9 ? 1.0 : avgConfidenceLevel);

    return {
      name: 'Confidence Intervals',
      score,
      weight: this.weights.confidenceIntervals,
      description: `${validIntervals.length}/${intervals.length} valid intervals`,
      contributingFactors: [
        `Valid intervals: ${validIntervals.length}/${intervals.length}`,
        `Average confidence level: ${Math.round(avgConfidenceLevel * 100)}%`
      ],
      uncertaintyImpact: score > 0.8 ? 'low' : score > 0.6 ? 'medium' : 'high'
    };
  }

  // ============================================================================
  // Uncertainty Factor Identification
  // ============================================================================

  private identifyCompetitiveUncertaintyFactors(
    result: CompetitorAnalysisResult,
    dataQuality: DataQualityCheck
  ): UncertaintyFactor[] {
    const factors: UncertaintyFactor[] = [];

    // Data quality uncertainties
    if (dataQuality.sourceReliability < SOURCE_RELIABILITY_THRESHOLDS.MEDIUM) {
      factors.push({
        type: 'data-quality',
        description: 'Low source reliability may affect analysis accuracy',
        impact: 1 - dataQuality.sourceReliability,
        likelihood: 0.8,
        mitigation: [
          'Seek additional authoritative sources',
          'Cross-validate findings with industry experts',
          'Update analysis with more recent data'
        ],
        severity: dataQuality.sourceReliability < SOURCE_RELIABILITY_THRESHOLDS.LOW ? 'critical' : 'high'
      });
    }

    // Competitive dynamics uncertainties
    const recentMoves = result.competitiveMatrix.competitors.reduce(
      (total, c) => total + (c.recentMoves?.length || 0), 0
    );
    
    if (recentMoves > result.competitiveMatrix.competitors.length * 2) {
      factors.push({
        type: 'competitive-dynamics',
        description: 'High competitive activity may quickly change landscape',
        impact: 0.3,
        likelihood: 0.6,
        mitigation: [
          'Monitor competitor announcements regularly',
          'Set up competitive intelligence alerts',
          'Plan for scenario-based strategic responses'
        ],
        severity: 'medium'
      });
    }

    // Market volatility uncertainties
    if (result.competitiveMatrix.marketContext.marketMaturity === 'emerging') {
      factors.push({
        type: 'market-volatility',
        description: 'Emerging market conditions create high uncertainty',
        impact: 0.4,
        likelihood: 0.7,
        mitigation: [
          'Focus on flexible strategic options',
          'Increase monitoring frequency',
          'Develop multiple scenario plans'
        ],
        severity: 'high'
      });
    }

    return factors;
  }

  private identifyMarketSizingUncertaintyFactors(
    result: MarketSizingResult,
    dataQuality: DataQualityCheck
  ): UncertaintyFactor[] {
    const factors: UncertaintyFactor[] = [];

    // Methodology uncertainties
    if (result.methodology.length === 1) {
      factors.push({
        type: 'methodology',
        description: 'Single methodology increases sizing uncertainty',
        impact: 0.3,
        likelihood: 0.8,
        mitigation: [
          'Apply additional sizing methodologies',
          'Cross-validate with industry benchmarks',
          'Seek expert validation of approach'
        ],
        severity: 'medium'
      });
    }

    // Assumption risk uncertainties
    const highImpactAssumptions = result.assumptions.filter(a => a.impact === 'high');
    const lowConfidenceHighImpact = highImpactAssumptions.filter(a => a.confidence < 0.6);
    
    if (lowConfidenceHighImpact.length > 0) {
      factors.push({
        type: 'assumption-risk',
        description: `${lowConfidenceHighImpact.length} high-impact assumptions have low confidence`,
        impact: 0.4,
        likelihood: 0.7,
        mitigation: [
          'Validate key assumptions with additional research',
          'Develop sensitivity analysis for critical assumptions',
          'Create scenario plans for assumption variations'
        ],
        severity: 'high'
      });
    }

    // Market volatility uncertainties
    const growthRateVariance = Math.abs(result.tam.growthRate - result.sam.growthRate);
    if (growthRateVariance > 0.1) { // 10% difference
      factors.push({
        type: 'market-volatility',
        description: 'Significant growth rate differences indicate market uncertainty',
        impact: 0.25,
        likelihood: 0.6,
        mitigation: [
          'Monitor market indicators regularly',
          'Update growth projections quarterly',
          'Prepare for multiple growth scenarios'
        ],
        severity: 'medium'
      });
    }

    return factors;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private calculateWeightedConfidence(components: ConfidenceComponent[]): number {
    const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
    const weightedSum = components.reduce((sum, c) => sum + (c.score * c.weight), 0);
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private applyUncertaintyAdjustments(
    baseConfidence: number,
    uncertaintyFactors: UncertaintyFactor[]
  ): number {
    let adjustedConfidence = baseConfidence;

    uncertaintyFactors.forEach(factor => {
      const adjustment = factor.impact * factor.likelihood;
      adjustedConfidence *= (1 - adjustment);
    });

    return Math.max(0, Math.min(1, adjustedConfidence));
  }

  private determineReliabilityLevel(confidence: number): 'very-high' | 'high' | 'medium' | 'low' | 'very-low' {
    if (confidence >= this.thresholds.veryHigh) return 'very-high';
    if (confidence >= this.thresholds.high) return 'high';
    if (confidence >= this.thresholds.medium) return 'medium';
    if (confidence >= this.thresholds.low) return 'low';
    return 'very-low';
  }

  private generateConfidenceRecommendations(
    components: ConfidenceComponent[],
    uncertaintyFactors: UncertaintyFactor[],
    analysisType: 'competitive' | 'market-sizing'
  ): ConfidenceRecommendation[] {
    const recommendations: ConfidenceRecommendation[] = [];

    // Component-based recommendations
    components.forEach(component => {
      if (component.score < 0.6) {
        recommendations.push(this.generateComponentRecommendation(component, analysisType));
      }
    });

    // Uncertainty-based recommendations
    uncertaintyFactors.forEach(factor => {
      if (factor.severity === 'critical' || factor.severity === 'high') {
        recommendations.push(this.generateUncertaintyRecommendation(factor));
      }
    });

    // Sort by priority and expected impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { immediate: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || b.expectedImpact - a.expectedImpact;
    });
  }

  private generateComponentRecommendation(
    component: ConfidenceComponent,
    analysisType: 'competitive' | 'market-sizing'
  ): ConfidenceRecommendation {
    const baseRecommendations = {
      'Data Quality': {
        type: 'improve-data' as const,
        description: 'Improve data quality by updating sources and validation',
        actions: ['Update stale data sources', 'Add authoritative references', 'Validate key data points']
      },
      'Competitor Coverage': {
        type: 'expand-research' as const,
        description: 'Expand competitor research for comprehensive coverage',
        actions: ['Identify additional competitors', 'Gather detailed competitor profiles', 'Research indirect competitors']
      },
      'Source Reliability': {
        type: 'improve-data' as const,
        description: 'Enhance source reliability with authoritative references',
        actions: ['Add McKinsey/Gartner reports', 'Include industry analyst research', 'Cite academic studies']
      },
      'Methodology Rigor': {
        type: 'validate-assumptions' as const,
        description: 'Strengthen methodology with additional approaches',
        actions: ['Apply multiple sizing methods', 'Cross-validate results', 'Document methodology limitations']
      }
    };

    const recommendation = baseRecommendations[component.name as keyof typeof baseRecommendations] || {
      type: 'improve-data' as const,
      description: `Improve ${component.name.toLowerCase()} component`,
      actions: ['Review and enhance data quality', 'Validate assumptions', 'Seek additional sources']
    };

    return {
      ...recommendation,
      priority: component.score < 0.3 ? 'immediate' : component.score < 0.5 ? 'high' : 'medium',
      expectedImpact: Math.min(0.4, (0.8 - component.score) * component.weight),
      effort: component.score < 0.3 ? 'high' : 'medium',
      timeline: component.score < 0.3 ? '1-2 weeks' : '2-4 weeks',
      specificActions: recommendation.actions
    };
  }

  private generateUncertaintyRecommendation(factor: UncertaintyFactor): ConfidenceRecommendation {
    const typeMapping = {
      'data-quality': 'improve-data' as const,
      'methodology': 'validate-assumptions' as const,
      'market-volatility': 'monitor-changes' as const,
      'competitive-dynamics': 'monitor-changes' as const,
      'assumption-risk': 'validate-assumptions' as const
    };

    return {
      type: typeMapping[factor.type],
      priority: factor.severity === 'critical' ? 'immediate' : factor.severity === 'high' ? 'high' : 'medium',
      description: factor.description,
      expectedImpact: factor.impact * factor.likelihood,
      effort: factor.severity === 'critical' ? 'high' : 'medium',
      timeline: factor.severity === 'critical' ? 'Immediate' : '1-3 weeks',
      specificActions: factor.mitigation
    };
  }

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

  private generateCompetitiveUncertaintyIndicators(
    result: CompetitorAnalysisResult,
    confidenceScore: ConfidenceScore
  ): UncertaintyIndicator[] {
    const indicators: UncertaintyIndicator[] = [];

    // Market share uncertainty
    const marketShares = result.competitiveMatrix.competitors
      .map(c => c.marketShare)
      .filter(share => share > 0);

    if (marketShares.length > 0) {
      const avgMarketShare = marketShares.reduce((a, b) => a + b, 0) / marketShares.length;
      const variance = marketShares.reduce((sum, share) => sum + Math.pow(share - avgMarketShare, 2), 0) / marketShares.length;
      
      indicators.push({
        metric: 'Market Share Distribution',
        currentValue: avgMarketShare,
        uncertaintyRange: {
          lower: Math.max(0, avgMarketShare - Math.sqrt(variance)),
          upper: Math.min(100, avgMarketShare + Math.sqrt(variance)),
          confidenceLevel: 0.68 // 1 standard deviation
        },
        volatility: Math.sqrt(variance) / avgMarketShare,
        trendDirection: 'unknown',
        lastUpdated: new Date().toISOString()
      });
    }

    return indicators;
  }

  private generateMarketSizingUncertaintyIndicators(
    result: MarketSizingResult,
    confidenceScore: ConfidenceScore
  ): UncertaintyIndicator[] {
    const indicators: UncertaintyIndicator[] = [];

    // TAM uncertainty
    const tamConfidenceInterval = result.confidenceIntervals.find(ci => ci.marketType === 'tam');
    if (tamConfidenceInterval) {
      indicators.push({
        metric: 'Total Addressable Market (TAM)',
        currentValue: result.tam.value,
        uncertaintyRange: {
          lower: tamConfidenceInterval.lowerBound,
          upper: tamConfidenceInterval.upperBound,
          confidenceLevel: tamConfidenceInterval.confidenceLevel
        },
        volatility: (tamConfidenceInterval.upperBound - tamConfidenceInterval.lowerBound) / result.tam.value,
        trendDirection: result.tam.growthRate > 0 ? 'increasing' : 'decreasing',
        lastUpdated: new Date().toISOString()
      });
    }

    // Growth rate uncertainty
    const growthRates = [result.tam.growthRate, result.sam.growthRate, result.som.growthRate];
    const avgGrowthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    const growthVariance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - avgGrowthRate, 2), 0) / growthRates.length;

    indicators.push({
      metric: 'Market Growth Rate',
      currentValue: avgGrowthRate,
      uncertaintyRange: {
        lower: avgGrowthRate - Math.sqrt(growthVariance),
        upper: avgGrowthRate + Math.sqrt(growthVariance),
        confidenceLevel: 0.68
      },
      volatility: Math.sqrt(growthVariance),
      trendDirection: avgGrowthRate > 0 ? 'increasing' : 'decreasing',
      lastUpdated: new Date().toISOString()
    });

    return indicators;
  }
}

// ============================================================================
// Configuration Interfaces and Defaults
// ============================================================================

interface ConfidenceWeights {
  dataQuality: number;
  competitorCoverage: number;
  sourceReliability: number;
  analysisDepth: number;
  marketContext: number;
  methodologyRigor: number;
  marketSizeLogic: number;
  assumptionValidity: number;
  confidenceIntervals: number;
}

interface ConfidenceThresholds {
  veryHigh: number;
  high: number;
  medium: number;
  low: number;
}

const DEFAULT_CONFIDENCE_WEIGHTS: ConfidenceWeights = {
  dataQuality: 0.25,
  competitorCoverage: 0.20,
  sourceReliability: 0.20,
  analysisDepth: 0.15,
  marketContext: 0.10,
  methodologyRigor: 0.25,
  marketSizeLogic: 0.20,
  assumptionValidity: 0.20,
  confidenceIntervals: 0.15
};

const DEFAULT_CONFIDENCE_THRESHOLDS: ConfidenceThresholds = {
  veryHigh: 0.9,
  high: 0.75,
  medium: 0.6,
  low: 0.4
};

// ============================================================================
// Export Default Scorer Instance
// ============================================================================

export const defaultConfidenceScorer = new ConfidenceScorer();