/**
 * Confidence Scoring Engine for Enhanced Citation System
 * 
 * This component provides transparent confidence scoring for claims and documents
 * based on evidence quality, source credibility, and data recency.
 */

import { Citation, EnhancedCitation, CredibilityAssessment } from '../../models/citations';

/**
 * Confidence score for individual claims
 */
export interface ConfidenceScore {
  overall: number; // 0-100
  breakdown: {
    sourceQuality: number;
    evidenceStrength: number;
    methodologyClarity: number;
    sampleSizeAdequacy: number;
    recencyFactor: number;
  };
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number; // e.g., 95 for 95% confidence
  };
  uncertaintyFactors: string[];
}

/**
 * Document-level confidence assessment
 */
export interface DocumentConfidence {
  overallConfidence: number;
  claimConfidences: Map<string, ConfidenceScore>;
  weakestClaims: Array<{claim: string; confidence: number}>;
  strongestClaims: Array<{claim: string; confidence: number}>;
  recommendationReliability: 'high' | 'medium' | 'low';
}

/**
 * Confidence factor contributing to overall score
 */
export interface ConfidenceFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Confidence report with detailed breakdown
 */
export interface ConfidenceReport {
  documentId: string;
  overallConfidence: DocumentConfidence;
  claimAnalysis: Array<{
    claim: string;
    confidence: ConfidenceScore;
    supportingSources: Citation[];
    recommendations: string[];
  }>;
  methodologyTransparency: {
    scoringMethod: string;
    weightingScheme: Record<string, number>;
    assumptions: string[];
    limitations: string[];
  };
  generatedAt: Date;
}

/**
 * Configuration for confidence scoring
 */
export interface ConfidenceScoringConfig {
  weights: {
    sourceQuality: number;
    evidenceStrength: number;
    methodologyClarity: number;
    sampleSizeAdequacy: number;
    recencyFactor: number;
  };
  thresholds: {
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
  recencyDecayMonths: number;
  minimumSourcesForHighConfidence: number;
}

/**
 * Default configuration for confidence scoring
 */
const DEFAULT_CONFIG: ConfidenceScoringConfig = {
  weights: {
    sourceQuality: 0.35,
    evidenceStrength: 0.25,
    methodologyClarity: 0.20,
    sampleSizeAdequacy: 0.10,
    recencyFactor: 0.10,
  },
  thresholds: {
    highConfidence: 80,
    mediumConfidence: 60,
    lowConfidence: 40,
  },
  recencyDecayMonths: 24,
  minimumSourcesForHighConfidence: 3,
};

/**
 * Confidence Scoring Engine for Enhanced Citation System
 */
export class ConfidenceScoringEngine {
  private config: ConfidenceScoringConfig;

  constructor(config?: Partial<ConfidenceScoringConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate confidence score for a specific claim based on supporting sources
   */
  calculateClaimConfidence(claim: string, supportingSources: Citation[]): ConfidenceScore {
    if (supportingSources.length === 0) {
      return this.createZeroConfidenceScore('No supporting sources provided');
    }

    // Calculate individual components
    const sourceQuality = this.calculateSourceQualityScore(supportingSources);
    const evidenceStrength = this.calculateEvidenceStrengthScore(supportingSources, claim);
    const methodologyClarity = this.calculateMethodologyClarityScore(supportingSources);
    const sampleSizeAdequacy = this.calculateSampleSizeScore(supportingSources);
    const recencyFactor = this.calculateRecencyScore(supportingSources);

    // Calculate weighted overall score
    const overall = Math.round(
      sourceQuality * this.config.weights.sourceQuality +
      evidenceStrength * this.config.weights.evidenceStrength +
      methodologyClarity * this.config.weights.methodologyClarity +
      sampleSizeAdequacy * this.config.weights.sampleSizeAdequacy +
      recencyFactor * this.config.weights.recencyFactor
    );

    // Calculate confidence interval
    const confidenceInterval = this.calculateConfidenceInterval(overall, supportingSources);

    // Identify uncertainty factors
    const uncertaintyFactors = this.identifyUncertaintyFactors(supportingSources, claim);

    return {
      overall,
      breakdown: {
        sourceQuality,
        evidenceStrength,
        methodologyClarity,
        sampleSizeAdequacy,
        recencyFactor,
      },
      confidenceInterval,
      uncertaintyFactors,
    };
  }

  /**
   * Aggregate document-level confidence from individual claim confidences
   */
  aggregateDocumentConfidence(claimConfidences: ConfidenceScore[]): DocumentConfidence {
    if (claimConfidences.length === 0) {
      return {
        overallConfidence: 0,
        claimConfidences: new Map(),
        weakestClaims: [],
        strongestClaims: [],
        recommendationReliability: 'low',
      };
    }

    // Calculate overall confidence as weighted average
    const overallConfidence = Math.round(
      claimConfidences.reduce((sum, conf) => sum + conf.overall, 0) / claimConfidences.length
    );

    // Create claim confidence map (simplified for this implementation)
    const claimConfidenceMap = new Map<string, ConfidenceScore>();
    claimConfidences.forEach((conf, index) => {
      claimConfidenceMap.set(`claim_${index}`, conf);
    });

    // Identify weakest and strongest claims
    const sortedConfidences = claimConfidences
      .map((conf, index) => ({ claim: `claim_${index}`, confidence: conf.overall }))
      .sort((a, b) => a.confidence - b.confidence);

    const weakestClaims = sortedConfidences.slice(0, Math.min(3, sortedConfidences.length));
    const strongestClaims = sortedConfidences
      .slice(-Math.min(3, sortedConfidences.length))
      .reverse();

    // Determine recommendation reliability
    const recommendationReliability = this.determineRecommendationReliability(overallConfidence);

    return {
      overallConfidence,
      claimConfidences: claimConfidenceMap,
      weakestClaims,
      strongestClaims,
      recommendationReliability,
    };
  }

  /**
   * Track confidence factors for transparency
   */
  trackConfidenceFactors(sources: Citation[]): ConfidenceFactor[] {
    const factors: ConfidenceFactor[] = [];

    // Source diversity factor
    const uniqueDomains = new Set(sources.map(s => s.domain)).size;
    const diversityScore = Math.min(100, (uniqueDomains / sources.length) * 100);
    factors.push({
      name: 'Source Diversity',
      score: diversityScore,
      weight: 0.2,
      description: `${uniqueDomains} unique domains across ${sources.length} sources`,
      impact: diversityScore > 70 ? 'low' : diversityScore > 50 ? 'medium' : 'high',
    });

    // Source credibility factor
    const credibilityScores = sources.map(s => this.getSourceCredibilityScore(s));
    const avgCredibility = credibilityScores.reduce((sum, score) => sum + score, 0) / credibilityScores.length;
    factors.push({
      name: 'Source Credibility',
      score: avgCredibility,
      weight: 0.35,
      description: `Average credibility score: ${Math.round(avgCredibility)}%`,
      impact: avgCredibility > 80 ? 'low' : avgCredibility > 60 ? 'medium' : 'critical',
    });

    // Recency factor
    const recencyScore = this.calculateRecencyScore(sources);
    factors.push({
      name: 'Data Recency',
      score: recencyScore,
      weight: 0.1,
      description: `Average age-adjusted recency score: ${Math.round(recencyScore)}%`,
      impact: recencyScore > 70 ? 'low' : recencyScore > 50 ? 'medium' : 'high',
    });

    // Methodology transparency factor
    const methodologyScore = this.calculateMethodologyClarityScore(sources);
    factors.push({
      name: 'Methodology Transparency',
      score: methodologyScore,
      weight: 0.2,
      description: `Methodology clarity score: ${Math.round(methodologyScore)}%`,
      impact: methodologyScore > 70 ? 'low' : methodologyScore > 50 ? 'medium' : 'high',
    });

    // Sample size adequacy factor
    const sampleSizeScore = this.calculateSampleSizeScore(sources);
    factors.push({
      name: 'Sample Size Adequacy',
      score: sampleSizeScore,
      weight: 0.15,
      description: `Sample size adequacy score: ${Math.round(sampleSizeScore)}%`,
      impact: sampleSizeScore > 70 ? 'low' : sampleSizeScore > 50 ? 'medium' : 'high',
    });

    return factors;
  }

  /**
   * Generate comprehensive confidence report
   */
  generateConfidenceReport(document: string, claims: Array<{claim: string; sources: Citation[]}>): ConfidenceReport {
    const claimAnalysis = claims.map(({ claim, sources }) => {
      const confidence = this.calculateClaimConfidence(claim, sources);
      const recommendations = this.generateClaimRecommendations(confidence, sources);
      
      return {
        claim,
        confidence,
        supportingSources: sources,
        recommendations,
      };
    });

    const claimConfidences = claimAnalysis.map(analysis => analysis.confidence);
    const overallConfidence = this.aggregateDocumentConfidence(claimConfidences);

    return {
      documentId: this.generateDocumentId(document),
      overallConfidence,
      claimAnalysis,
      methodologyTransparency: {
        scoringMethod: 'Weighted Multi-Factor Analysis',
        weightingScheme: this.config.weights,
        assumptions: [
          'Source credibility scores are based on domain authority and peer review status',
          'Recency decay follows exponential model with 24-month half-life',
          'Sample size adequacy assumes normal distribution requirements',
          'Methodology clarity requires explicit documentation of research methods',
        ],
        limitations: [
          'Confidence scores are estimates based on available metadata',
          'Source credibility may vary within domains',
          'Recency importance varies by claim type and industry',
          'Sample size requirements depend on statistical methodology used',
        ],
      },
      generatedAt: new Date(),
    };
  }

  // Private helper methods

  private calculateSourceQualityScore(sources: Citation[]): number {
    if (sources.length === 0) return 0;

    const qualityScores: number[] = sources.map(source => this.getSourceCredibilityScore(source));
    const averageQuality = qualityScores.reduce((sum: number, score: number) => sum + score, 0) / qualityScores.length;

    // Bonus for source diversity
    const uniqueDomains = new Set(sources.map(s => s.domain)).size;
    const diversityBonus = Math.min(10, (uniqueDomains / sources.length) * 20);

    return Math.min(100, averageQuality + diversityBonus);
  }

  private calculateEvidenceStrengthScore(sources: Citation[], claim: string): number {
    if (sources.length === 0) return 0;

    let strengthScore = 0;

    // Base score from number of sources
    const sourceCountScore = Math.min(40, sources.length * 10);
    strengthScore += sourceCountScore;

    // Bonus for direct evidence
    const directEvidenceSources = sources.filter(s => 
      s.key_finding && s.key_finding.toLowerCase().includes(claim.toLowerCase().split(' ')[0])
    );
    const directEvidenceBonus = Math.min(30, (directEvidenceSources.length / sources.length) * 30);
    strengthScore += directEvidenceBonus;

    // Bonus for quantitative evidence
    const quantitativeSources = sources.filter(s => 
      s.key_finding && /\d+/.test(s.key_finding)
    );
    const quantitativeBonus = Math.min(20, (quantitativeSources.length / sources.length) * 20);
    strengthScore += quantitativeBonus;

    // Bonus for peer-reviewed sources
    const peerReviewedSources = sources.filter(s => 
      s.source_type === 'academic_paper' || s.source_type === 'research_publication'
    );
    const peerReviewBonus = Math.min(10, (peerReviewedSources.length / sources.length) * 10);
    strengthScore += peerReviewBonus;

    return Math.min(100, strengthScore);
  }

  private calculateMethodologyClarityScore(sources: Citation[]): number {
    if (sources.length === 0) return 0;

    const methodologyScores: number[] = sources.map(source => {
      let score = 0;

      // Check if methodology is documented
      if (source.methodology && source.methodology.trim().length > 0) {
        score += 50;
        
        // Bonus for detailed methodology
        if (source.methodology.length > 100) {
          score += 20;
        }
      }

      // Check if sample size is provided
      if (source.sample_size && source.sample_size > 0) {
        score += 20;
      }

      // Check if geographic scope is specified
      if (source.geographic_scope && source.geographic_scope.trim().length > 0) {
        score += 10;
      }

      return Math.min(100, score);
    });

    return methodologyScores.reduce((sum: number, score: number) => sum + score, 0) / methodologyScores.length;
  }

  private calculateSampleSizeScore(sources: Citation[]): number {
    if (sources.length === 0) return 0;

    const sampleSizeScores: number[] = sources.map(source => {
      if (!source.sample_size || source.sample_size <= 0) {
        return 0;
      }

      // Score based on sample size adequacy
      if (source.sample_size >= 1000) return 100;
      if (source.sample_size >= 500) return 80;
      if (source.sample_size >= 100) return 60;
      if (source.sample_size >= 30) return 40;
      return 20;
    });

    return sampleSizeScores.reduce((sum: number, score: number) => sum + score, 0) / sampleSizeScores.length;
  }

  private calculateRecencyScore(sources: Citation[]): number {
    if (sources.length === 0) return 0;

    const now = new Date();
    const recencyScores: number[] = sources.map(source => {
      const publishedDate = new Date(source.published_at);
      const monthsOld = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

      // Exponential decay with configurable half-life
      const decayFactor = Math.exp(-0.693 * monthsOld / this.config.recencyDecayMonths);
      return Math.max(0, Math.min(100, decayFactor * 100));
    });

    return recencyScores.reduce((sum: number, score: number) => sum + score, 0) / recencyScores.length;
  }

  private getSourceCredibilityScore(source: Citation): number {
    // Base score from confidence level
    let score = 0;
    switch (source.confidence) {
      case 'high':
        score = 80;
        break;
      case 'medium':
        score = 60;
        break;
      case 'low':
        score = 40;
        break;
      default:
        score = 40;
    }

    // Bonus for authoritative source types
    const authoritativeTypes = [
      'academic_paper',
      'research_publication',
      'consulting_study',
      'government_data'
    ];
    if (authoritativeTypes.includes(source.source_type)) {
      score += 15;
    }

    // Bonus for well-known domains
    const authoritativeDomains = [
      'mckinsey.com',
      'bcg.com',
      'bain.com',
      'gartner.com',
      'forrester.com',
      'deloitte.com',
      'pwc.com',
      'accenture.com'
    ];
    if (authoritativeDomains.some(domain => source.domain.includes(domain))) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private calculateConfidenceInterval(overall: number, sources: Citation[]): {lower: number; upper: number; level: number} {
    // Simple confidence interval calculation based on source count and quality variance
    const sourceCount = sources.length;
    const qualityScores = sources.map(s => this.getSourceCredibilityScore(s));
    const qualityVariance = this.calculateVariance(qualityScores);

    // Standard error decreases with more sources
    const standardError = Math.sqrt(qualityVariance / sourceCount);
    
    // 95% confidence interval
    const marginOfError = 1.96 * standardError;
    
    return {
      lower: Math.max(0, overall - marginOfError),
      upper: Math.min(100, overall + marginOfError),
      level: 95,
    };
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    return squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private identifyUncertaintyFactors(sources: Citation[], claim: string): string[] {
    const factors: string[] = [];

    // Check for insufficient sources
    if (sources.length < this.config.minimumSourcesForHighConfidence) {
      factors.push(`Limited sources: Only ${sources.length} sources supporting this claim`);
    }

    // Check for outdated sources
    const oldSources = sources.filter(s => {
      const monthsOld = (new Date().getTime() - new Date(s.published_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsOld > this.config.recencyDecayMonths;
    });
    if (oldSources.length > sources.length / 2) {
      factors.push('Outdated sources: More than half of sources are older than 24 months');
    }

    // Check for methodology gaps
    const sourcesWithMethodology = sources.filter(s => s.methodology && s.methodology.trim().length > 0);
    if (sourcesWithMethodology.length < sources.length / 2) {
      factors.push('Methodology gaps: Less than half of sources document their methodology');
    }

    // Check for sample size issues
    const sourcesWithSampleSize = sources.filter(s => s.sample_size && s.sample_size > 0);
    if (sourcesWithSampleSize.length < sources.length / 2) {
      factors.push('Sample size uncertainty: Less than half of sources report sample sizes');
    }

    // Check for source diversity
    const uniqueDomains = new Set(sources.map(s => s.domain)).size;
    if (uniqueDomains < Math.min(3, sources.length)) {
      factors.push('Limited source diversity: Sources concentrated in few domains');
    }

    return factors;
  }

  private determineRecommendationReliability(overallConfidence: number): 'high' | 'medium' | 'low' {
    if (overallConfidence >= this.config.thresholds.highConfidence) return 'high';
    if (overallConfidence >= this.config.thresholds.mediumConfidence) return 'medium';
    return 'low';
  }

  private generateClaimRecommendations(confidence: ConfidenceScore, sources: Citation[]): string[] {
    const recommendations: string[] = [];

    if (confidence.overall < this.config.thresholds.mediumConfidence) {
      recommendations.push('Consider adding more authoritative sources to strengthen this claim');
    }

    if (confidence.breakdown.sourceQuality < 60) {
      recommendations.push('Seek higher-quality sources from established institutions or peer-reviewed publications');
    }

    if (confidence.breakdown.recencyFactor < 50) {
      recommendations.push('Update with more recent sources to improve relevance');
    }

    if (confidence.breakdown.methodologyClarity < 50) {
      recommendations.push('Include sources with clearer methodology documentation');
    }

    if (sources.length < this.config.minimumSourcesForHighConfidence) {
      recommendations.push(`Add ${this.config.minimumSourcesForHighConfidence - sources.length} more sources for higher confidence`);
    }

    return recommendations;
  }

  private createZeroConfidenceScore(reason: string): ConfidenceScore {
    return {
      overall: 0,
      breakdown: {
        sourceQuality: 0,
        evidenceStrength: 0,
        methodologyClarity: 0,
        sampleSizeAdequacy: 0,
        recencyFactor: 0,
      },
      confidenceInterval: {
        lower: 0,
        upper: 0,
        level: 95,
      },
      uncertaintyFactors: [reason],
    };
  }

  private generateDocumentId(document: string): string {
    // Simple hash function for document ID
    let hash = 0;
    for (let i = 0; i < document.length; i++) {
      const char = document.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `doc_${Math.abs(hash).toString(16)}`;
  }
}