// Quality Assessment System for Enhanced Citation System

import {
  Citation,
  EnhancedCitation,
  CitationSourceType,
  CitationConfidence,
  CredibilityAssessment,
} from '../../models/citations';

/**
 * Quality gap types that can be identified in citations
 */
export enum QualityGapType {
  INSUFFICIENT_SOURCES = 'insufficient_sources',
  LOW_CREDIBILITY = 'low_credibility',
  OUTDATED_SOURCES = 'outdated_sources',
  METHODOLOGY_UNCLEAR = 'methodology_unclear',
  LACK_DIVERSITY = 'lack_diversity',
  MISSING_PEER_REVIEW = 'missing_peer_review',
  BROKEN_LINKS = 'broken_links',
  BIAS_RISK = 'bias_risk',
}

/**
 * Severity levels for quality gaps
 */
export enum QualityGapSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Quality gap identification result
 */
export interface QualityGap {
  gapType: QualityGapType;
  severity: QualityGapSeverity;
  affectedClaims: string[];
  affectedCitations: string[];
  description: string;
  impact: string;
  recommendedActions: string[];
  priority: number; // 1-10, higher is more urgent
}

/**
 * Quality improvement recommendation
 */
export interface QualityRecommendation {
  type:
    | 'add_sources'
    | 'replace_sources'
    | 'update_sources'
    | 'improve_methodology'
    | 'diversify_sources';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  specificActions: string[];
  expectedImpact: string;
  estimatedEffort: 'minimal' | 'moderate' | 'significant';
  suggestedSources?: Citation[];
  targetMetrics?: {
    credibilityIncrease?: number;
    diversityIncrease?: number;
    recencyImprovement?: number;
  };
}

/**
 * Comprehensive quality report for citations
 */
export interface QualityReport {
  overallScore: number; // 0-100
  metrics: {
    sourceCredibility: number;
    evidenceDiversity: number;
    recencyScore: number;
    methodologyTransparency: number;
    sampleSizeAdequacy: number;
    accessibilityScore: number;
    complianceScore: number;
  };
  qualityGaps: QualityGap[];
  recommendations: QualityRecommendation[];
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
  assessmentDate: Date;
  citationCount: number;
  strengthAreas: string[];
  improvementAreas: string[];
}

/**
 * Citation requirements for quality assessment
 */
export interface CitationRequirements {
  documentType: string;
  minimumSources: number;
  requiredSourceTypes: CitationSourceType[];
  minimumCredibilityScore: number;
  maximumAgeMonths: number;
  requirePeerReview: boolean;
  requireMethodology: boolean;
  minimumSampleSize?: number;
  industryRelevance?: string[];
  geographicScope?: string[];
}

/**
 * Evidence strength assessment
 */
export interface EvidenceStrength {
  overall: 'weak' | 'moderate' | 'strong' | 'very_strong';
  factors: {
    sourceQuality: number;
    sourceQuantity: number;
    sourceDiversity: number;
    methodologyRigor: number;
    sampleSizeAdequacy: number;
    peerReviewStatus: number;
  };
  supportingEvidence: Citation[];
  contradictoryEvidence: Citation[];
  evidenceGaps: string[];
}

/**
 * Quality Assessment System for comprehensive citation evaluation
 */
export class QualityAssessmentSystem {
  private qualityThresholds: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };

  private sourceTypeWeights: Map<CitationSourceType, number> = new Map();
  private confidenceWeights: Map<CitationConfidence, number> = new Map();

  constructor() {
    this.qualityThresholds = {
      excellent: 90,
      good: 75,
      acceptable: 60,
      poor: 40,
    };

    this.initializeSourceTypeWeights();
    this.initializeConfidenceWeights();
  }

  /**
   * Initialize source type weights for quality calculation
   */
  private initializeSourceTypeWeights(): void {
    this.sourceTypeWeights = new Map([
      [CitationSourceType.ACADEMIC_PAPER, 1.0],
      [CitationSourceType.RESEARCH_PUBLICATION, 0.95],
      [CitationSourceType.CONSULTING_STUDY, 0.9],
      [CitationSourceType.GOVERNMENT_DATA, 0.85],
      [CitationSourceType.INDUSTRY_REPORT, 0.8],
      [CitationSourceType.WHITE_PAPER, 0.75],
      [CitationSourceType.BENCHMARK_STUDY, 0.7],
      [CitationSourceType.SURVEY_DATA, 0.65],
      [CitationSourceType.CASE_STUDY, 0.6],
      [CitationSourceType.COMPANY_BLOG, 0.4],
    ]);
  }

  /**
   * Initialize confidence level weights
   */
  private initializeConfidenceWeights(): void {
    this.confidenceWeights = new Map([
      [CitationConfidence.HIGH, 1.0],
      [CitationConfidence.MEDIUM, 0.7],
      [CitationConfidence.LOW, 0.4],
    ]);
  }

  /**
   * Assess citation quality with multi-factor scoring
   */
  async assessCitationQuality(citations: Citation[]): Promise<QualityReport> {
    if (!citations || citations.length === 0) {
      return this.createEmptyQualityReport();
    }

    // Calculate individual metrics
    const sourceCredibility = this.calculateSourceCredibility(citations);
    const evidenceDiversity = this.calculateEvidenceDiversity(citations);
    const recencyScore = this.calculateRecencyScore(citations);
    const methodologyTransparency = this.calculateMethodologyTransparency(citations);
    const sampleSizeAdequacy = this.calculateSampleSizeAdequacy(citations);
    const accessibilityScore = this.calculateAccessibilityScore(citations);
    const complianceScore = this.calculateComplianceScore(citations);

    const metrics = {
      sourceCredibility,
      evidenceDiversity,
      recencyScore,
      methodologyTransparency,
      sampleSizeAdequacy,
      accessibilityScore,
      complianceScore,
    };

    // Calculate overall score
    const overallScore = this.calculateOverallQualityScore(metrics);

    // Identify quality gaps
    const qualityGaps = await this.identifyQualityGaps(citations, metrics);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(citations, qualityGaps, metrics);

    // Determine compliance status
    const complianceStatus = this.determineComplianceStatus(overallScore, qualityGaps);

    // Identify strength and improvement areas
    const strengthAreas = this.identifyStrengthAreas(metrics);
    const improvementAreas = this.identifyImprovementAreas(metrics, qualityGaps);

    return {
      overallScore,
      metrics,
      qualityGaps,
      recommendations,
      complianceStatus,
      assessmentDate: new Date(),
      citationCount: citations.length,
      strengthAreas,
      improvementAreas,
    };
  }

  /**
   * Identify quality gaps in citation collection
   */
  async identifyQualityGaps(
    citations: Citation[],
    metrics?: QualityReport['metrics']
  ): Promise<QualityGap[]> {
    const gaps: QualityGap[] = [];

    // Check for insufficient sources
    if (citations.length < 3) {
      gaps.push({
        gapType: QualityGapType.INSUFFICIENT_SOURCES,
        severity: citations.length === 0 ? QualityGapSeverity.CRITICAL : QualityGapSeverity.HIGH,
        affectedClaims: ['All claims'],
        affectedCitations: [],
        description: `Only ${citations.length} sources provided, minimum 3 recommended`,
        impact: 'Insufficient evidence to support claims reliably',
        recommendedActions: [
          'Add at least 2 more credible sources',
          'Ensure sources cover different aspects of the topic',
          'Include both primary and secondary sources',
        ],
        priority: 9,
      });
    }

    // Check for low credibility sources
    const lowCredibilitySources = citations.filter(c => c.confidence === CitationConfidence.LOW);
    if (lowCredibilitySources.length > citations.length * 0.3) {
      gaps.push({
        gapType: QualityGapType.LOW_CREDIBILITY,
        severity: QualityGapSeverity.HIGH,
        affectedClaims: ['Claims supported by low-credibility sources'],
        affectedCitations: lowCredibilitySources.map(c => c.id),
        description: `${lowCredibilitySources.length} out of ${citations.length} sources have low credibility`,
        impact: 'Reduces overall trustworthiness of analysis',
        recommendedActions: [
          'Replace low-credibility sources with peer-reviewed alternatives',
          'Add authoritative sources from recognized institutions',
          'Verify claims with multiple high-credibility sources',
        ],
        priority: 8,
      });
    }

    // Check for outdated sources
    const currentDate = new Date();
    const outdatedSources = citations.filter(c => {
      const publicationDate = new Date(c.published_at);
      const monthsOld =
        (currentDate.getTime() - publicationDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsOld > 36; // Older than 3 years
    });

    if (outdatedSources.length > citations.length * 0.5) {
      gaps.push({
        gapType: QualityGapType.OUTDATED_SOURCES,
        severity: QualityGapSeverity.MEDIUM,
        affectedClaims: ['Claims relying on historical data'],
        affectedCitations: outdatedSources.map(c => c.id),
        description: `${outdatedSources.length} sources are older than 3 years`,
        impact: 'May not reflect current market conditions or practices',
        recommendedActions: [
          'Update with recent sources from the last 2 years',
          'Verify if older findings still apply to current context',
          'Add recent industry reports or studies',
        ],
        priority: 6,
      });
    }

    // Check for methodology transparency
    const sourcesWithoutMethodology = citations.filter(
      c =>
        !c.methodology &&
        [
          CitationSourceType.RESEARCH_PUBLICATION,
          CitationSourceType.SURVEY_DATA,
          CitationSourceType.BENCHMARK_STUDY,
        ].includes(c.source_type)
    );

    if (sourcesWithoutMethodology.length > 0) {
      gaps.push({
        gapType: QualityGapType.METHODOLOGY_UNCLEAR,
        severity: QualityGapSeverity.MEDIUM,
        affectedClaims: ['Quantitative claims and statistical findings'],
        affectedCitations: sourcesWithoutMethodology.map(c => c.id),
        description: `${sourcesWithoutMethodology.length} research sources lack methodology details`,
        impact: 'Difficult to assess reliability of quantitative claims',
        recommendedActions: [
          'Find sources with clear methodology descriptions',
          'Include sample size and data collection methods',
          'Prefer peer-reviewed sources with transparent methods',
        ],
        priority: 5,
      });
    }

    // Check for source diversity
    const uniqueDomains = new Set(citations.map(c => c.domain)).size;
    if (uniqueDomains < Math.min(3, citations.length)) {
      gaps.push({
        gapType: QualityGapType.LACK_DIVERSITY,
        severity: QualityGapSeverity.MEDIUM,
        affectedClaims: ['All claims'],
        affectedCitations: citations.map(c => c.id),
        description: `Only ${uniqueDomains} unique sources, lacking diversity`,
        impact: 'Potential bias from limited perspective range',
        recommendedActions: [
          'Add sources from different organizations and perspectives',
          'Include both industry and academic viewpoints',
          'Ensure geographic and temporal diversity',
        ],
        priority: 4,
      });
    }

    // Check for broken links (simulated)
    const potentiallyBrokenSources = citations.filter(
      c => !c.url || c.url.includes('broken') || c.url.includes('404')
    );

    if (potentiallyBrokenSources.length > 0) {
      gaps.push({
        gapType: QualityGapType.BROKEN_LINKS,
        severity: QualityGapSeverity.HIGH,
        affectedClaims: ['Claims supported by inaccessible sources'],
        affectedCitations: potentiallyBrokenSources.map(c => c.id),
        description: `${potentiallyBrokenSources.length} sources may have accessibility issues`,
        impact: 'Readers cannot verify claims independently',
        recommendedActions: [
          'Verify all source URLs are accessible',
          'Find alternative sources for broken links',
          'Use archived versions where available',
        ],
        priority: 7,
      });
    }

    return gaps.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate actionable improvement recommendations
   */
  async recommendImprovements(
    citations: Citation[],
    qualityGaps: QualityGap[],
    currentMetrics: QualityReport['metrics']
  ): Promise<QualityRecommendation[]> {
    const recommendations: QualityRecommendation[] = [];

    // Recommendations based on quality gaps
    for (const gap of qualityGaps) {
      switch (gap.gapType) {
        case QualityGapType.INSUFFICIENT_SOURCES:
          recommendations.push({
            type: 'add_sources',
            priority: 'critical',
            description: 'Add more credible sources to strengthen evidence base',
            specificActions: [
              'Research and add 2-3 additional high-quality sources',
              'Ensure new sources cover different aspects of the topic',
              'Prioritize peer-reviewed and authoritative sources',
            ],
            expectedImpact: 'Significantly improve evidence strength and credibility',
            estimatedEffort: 'moderate',
            targetMetrics: {
              credibilityIncrease: 15,
              diversityIncrease: 20,
            },
          });
          break;

        case QualityGapType.LOW_CREDIBILITY:
          recommendations.push({
            type: 'replace_sources',
            priority: 'high',
            description: 'Replace low-credibility sources with authoritative alternatives',
            specificActions: [
              'Identify and remove sources with credibility scores below 60',
              'Find peer-reviewed alternatives for key claims',
              'Prioritize sources from recognized institutions',
            ],
            expectedImpact: 'Improve overall credibility and trustworthiness',
            estimatedEffort: 'moderate',
            targetMetrics: {
              credibilityIncrease: 25,
            },
          });
          break;

        case QualityGapType.OUTDATED_SOURCES:
          recommendations.push({
            type: 'update_sources',
            priority: 'medium',
            description: 'Update outdated sources with recent publications',
            specificActions: [
              'Find recent sources published within the last 2 years',
              'Verify if older findings still apply to current context',
              'Add recent industry reports and market data',
            ],
            expectedImpact: 'Ensure analysis reflects current market conditions',
            estimatedEffort: 'moderate',
            targetMetrics: {
              recencyImprovement: 30,
            },
          });
          break;

        case QualityGapType.METHODOLOGY_UNCLEAR:
          recommendations.push({
            type: 'improve_methodology',
            priority: 'medium',
            description: 'Add sources with clear methodology and transparent research methods',
            specificActions: [
              'Find sources that clearly describe their research methodology',
              'Include sample sizes and data collection methods',
              'Prefer peer-reviewed sources with detailed methods sections',
            ],
            expectedImpact: 'Improve transparency and reliability of quantitative claims',
            estimatedEffort: 'moderate',
          });
          break;

        case QualityGapType.LACK_DIVERSITY:
          recommendations.push({
            type: 'diversify_sources',
            priority: 'medium',
            description: 'Diversify sources to include multiple perspectives and viewpoints',
            specificActions: [
              'Add sources from different organizations and industries',
              'Include both academic and practitioner perspectives',
              'Ensure geographic and cultural diversity in sources',
            ],
            expectedImpact: 'Reduce bias and provide more comprehensive analysis',
            estimatedEffort: 'moderate',
            targetMetrics: {
              diversityIncrease: 35,
            },
          });
          break;
      }
    }

    // Additional recommendations based on metrics
    if (currentMetrics.sourceCredibility < 70) {
      recommendations.push({
        type: 'replace_sources',
        priority: 'high',
        description: 'Focus on improving source credibility scores',
        specificActions: [
          'Prioritize sources from top-tier consulting firms',
          'Add academic sources from prestigious institutions',
          'Include government and regulatory body publications',
        ],
        expectedImpact: 'Significantly improve overall credibility rating',
        estimatedEffort: 'significant',
        targetMetrics: {
          credibilityIncrease: 20,
        },
      });
    }

    if (currentMetrics.methodologyTransparency < 60) {
      recommendations.push({
        type: 'improve_methodology',
        priority: 'medium',
        description: 'Enhance methodology transparency in source selection',
        specificActions: [
          'Prioritize sources with detailed methodology sections',
          'Include sources that specify sample sizes and data collection methods',
          'Add sources with peer-review validation',
        ],
        expectedImpact: 'Improve reliability assessment of quantitative claims',
        estimatedEffort: 'moderate',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Calculate evidence strength for specific claims
   */
  calculateEvidenceStrength(citations: Citation[], claim: string): EvidenceStrength {
    // Filter citations relevant to the claim (simplified - in real implementation, use NLP)
    const relevantCitations = citations.filter(
      c =>
        c.key_finding.toLowerCase().includes(claim.toLowerCase()) ||
        claim.toLowerCase().includes(c.key_finding.toLowerCase())
    );

    const sourceQuality = this.calculateSourceCredibility(relevantCitations);
    const sourceQuantity = Math.min(100, (relevantCitations.length / 5) * 100); // Optimal around 5 sources
    const sourceDiversity = this.calculateEvidenceDiversity(relevantCitations);
    const methodologyRigor = this.calculateMethodologyTransparency(relevantCitations);
    const sampleSizeAdequacy = this.calculateSampleSizeAdequacy(relevantCitations);
    const peerReviewStatus = this.calculatePeerReviewScore(relevantCitations);

    const factors = {
      sourceQuality,
      sourceQuantity,
      sourceDiversity,
      methodologyRigor,
      sampleSizeAdequacy,
      peerReviewStatus,
    };

    // Calculate overall strength
    const overallScore =
      sourceQuality * 0.25 +
      sourceQuantity * 0.15 +
      sourceDiversity * 0.15 +
      methodologyRigor * 0.2 +
      sampleSizeAdequacy * 0.15 +
      peerReviewStatus * 0.1;

    let overall: EvidenceStrength['overall'];
    if (overallScore >= 85) overall = 'very_strong';
    else if (overallScore >= 70) overall = 'strong';
    else if (overallScore >= 55) overall = 'moderate';
    else overall = 'weak';

    return {
      overall,
      factors,
      supportingEvidence: relevantCitations.filter(c => c.confidence !== CitationConfidence.LOW),
      contradictoryEvidence: [], // Would need claim analysis to identify contradictions
      evidenceGaps: this.identifyEvidenceGaps(relevantCitations, claim),
    };
  }

  // Private helper methods

  private createEmptyQualityReport(): QualityReport {
    return {
      overallScore: 0,
      metrics: {
        sourceCredibility: 0,
        evidenceDiversity: 0,
        recencyScore: 0,
        methodologyTransparency: 0,
        sampleSizeAdequacy: 0,
        accessibilityScore: 0,
        complianceScore: 0,
      },
      qualityGaps: [
        {
          gapType: QualityGapType.INSUFFICIENT_SOURCES,
          severity: QualityGapSeverity.CRITICAL,
          affectedClaims: ['All claims'],
          affectedCitations: [],
          description: 'No sources provided',
          impact: 'Cannot validate any claims',
          recommendedActions: ['Add credible sources to support analysis'],
          priority: 10,
        },
      ],
      recommendations: [
        {
          type: 'add_sources',
          priority: 'critical',
          description: 'Add sources to enable quality assessment',
          specificActions: ['Research and add relevant, credible sources'],
          expectedImpact: 'Enable evidence-based analysis',
          estimatedEffort: 'significant',
        },
      ],
      complianceStatus: 'non-compliant',
      assessmentDate: new Date(),
      citationCount: 0,
      strengthAreas: [],
      improvementAreas: ['Add sources', 'Establish evidence base'],
    };
  }

  private calculateSourceCredibility(citations: Citation[]): number {
    if (citations.length === 0) return 0;

    const credibilityScores = citations.map(citation => {
      const sourceTypeWeight = this.sourceTypeWeights.get(citation.source_type) || 0.5;
      const confidenceWeight = this.confidenceWeights.get(citation.confidence) || 0.5;

      let baseScore = 70; // Higher base score for better results

      // Adjust based on source type (multiplicative)
      baseScore = baseScore * sourceTypeWeight;

      // Adjust based on confidence level (multiplicative)
      baseScore = baseScore * confidenceWeight;

      // Bonus for having authors
      if (citation.authors && citation.authors.length > 0) {
        baseScore += 15;
      }

      // Bonus for having methodology
      if (citation.methodology) {
        baseScore += 15;
      }

      // Bonus for sample size
      if (citation.sample_size && citation.sample_size > 100) {
        baseScore += 10;
      }

      // Bonus for organization
      if (citation.organization) {
        baseScore += 5;
      }

      return Math.min(100, Math.max(0, baseScore));
    });

    return Math.round(
      credibilityScores.reduce((sum: number, score: number) => sum + score, 0) / citations.length
    );
  }

  private calculateEvidenceDiversity(citations: Citation[]): number {
    if (citations.length === 0) return 0;

    const uniqueDomains = new Set(citations.map(c => c.domain)).size;
    const uniqueSourceTypes = new Set(citations.map(c => c.source_type)).size;
    const uniqueOrganizations = new Set(citations.map(c => c.organization).filter(Boolean)).size;

    const domainDiversity = Math.min(100, (uniqueDomains / Math.max(3, citations.length)) * 100);
    const sourceTypeDiversity = Math.min(
      100,
      (uniqueSourceTypes / Math.min(5, citations.length)) * 100
    );
    const organizationDiversity = Math.min(
      100,
      (uniqueOrganizations / Math.max(2, citations.length)) * 100
    );

    return Math.round((domainDiversity + sourceTypeDiversity + organizationDiversity) / 3);
  }

  private calculateRecencyScore(citations: Citation[]): number {
    if (citations.length === 0) return 0;

    const currentDate = new Date();
    const recencyScores = citations.map(citation => {
      // Handle invalid or empty dates
      if (!citation.published_at) return 0;

      const publicationDate = new Date(citation.published_at);

      // Handle invalid dates
      if (isNaN(publicationDate.getTime())) return 0;

      const monthsOld =
        (currentDate.getTime() - publicationDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

      // Score decreases by 2 points per month, minimum 0, maximum 100
      return Math.max(0, Math.min(100, 100 - monthsOld * 2));
    });

    return Math.round(
      recencyScores.reduce((sum: number, score: number) => sum + score, 0) / citations.length
    );
  }

  private calculateMethodologyTransparency(citations: Citation[]): number {
    if (citations.length === 0) return 0;

    const methodologyScores = citations.map(citation => {
      let score = 30; // Base score

      if (citation.methodology) {
        score += 40; // Has methodology description
      }

      if (citation.sample_size && citation.sample_size > 0) {
        score += 20; // Has sample size
        if (citation.sample_size > 1000) {
          score += 10; // Large sample size
        }
      }

      // Research publications should have methodology
      if (
        citation.source_type === CitationSourceType.RESEARCH_PUBLICATION &&
        !citation.methodology
      ) {
        score -= 20;
      }

      return Math.min(100, Math.max(0, score));
    });

    return Math.round(
      methodologyScores.reduce((sum: number, score: number) => sum + score, 0) / citations.length
    );
  }

  private calculateSampleSizeAdequacy(citations: Citation[]): number {
    if (citations.length === 0) return 0;

    const sampleSizeScores = citations.map(citation => {
      // Not all source types require sample sizes
      if (
        ![
          CitationSourceType.SURVEY_DATA,
          CitationSourceType.RESEARCH_PUBLICATION,
          CitationSourceType.BENCHMARK_STUDY,
        ].includes(citation.source_type)
      ) {
        return 100; // N/A sources get full score
      }

      if (!citation.sample_size || citation.sample_size === 0) {
        return 0; // Missing sample size for relevant source types
      }

      // Score based on sample size adequacy
      if (citation.sample_size >= 1000) return 100;
      if (citation.sample_size >= 500) return 85;
      if (citation.sample_size >= 100) return 70;
      if (citation.sample_size >= 50) return 55;
      return 30; // Small sample size
    });

    return Math.round(
      sampleSizeScores.reduce((sum: number, score: number) => sum + score, 0) / citations.length
    );
  }

  private calculateAccessibilityScore(citations: Citation[]): number {
    if (citations.length === 0) return 0;

    // Simulate accessibility checking (in real implementation, would use actual validation)
    const accessibilityScores = citations.map(citation => {
      if (!citation.url || citation.url.includes('broken') || citation.url.includes('404')) {
        return 0; // Broken or missing URL
      }

      if (citation.url.includes('paywall')) {
        return 60; // Behind paywall but accessible
      }

      return 100; // Freely accessible
    });

    return Math.round(
      accessibilityScores.reduce((sum: number, score: number) => sum + score, 0) / citations.length
    );
  }

  private calculateComplianceScore(citations: Citation[]): number {
    if (citations.length === 0) return 0;

    const complianceScores = citations.map(citation => {
      let score = 100;

      // Check for required fields
      if (!citation.authors && !citation.organization) {
        score -= 20; // Missing attribution
      }

      if (!citation.published_at) {
        score -= 15; // Missing publication date
      }

      if (!citation.key_finding) {
        score -= 10; // Missing key finding
      }

      // Check source type specific requirements
      if (
        citation.source_type === CitationSourceType.RESEARCH_PUBLICATION &&
        !citation.methodology
      ) {
        score -= 25; // Research without methodology
      }

      return Math.max(0, score);
    });

    return Math.round(
      complianceScores.reduce((sum: number, score: number) => sum + score, 0) / citations.length
    );
  }

  private calculateOverallQualityScore(metrics: QualityReport['metrics']): number {
    const weights = {
      sourceCredibility: 0.25,
      evidenceDiversity: 0.15,
      recencyScore: 0.15,
      methodologyTransparency: 0.2,
      sampleSizeAdequacy: 0.1,
      accessibilityScore: 0.1,
      complianceScore: 0.05,
    };

    const score =
      (metrics.sourceCredibility || 0) * weights.sourceCredibility +
      (metrics.evidenceDiversity || 0) * weights.evidenceDiversity +
      (metrics.recencyScore || 0) * weights.recencyScore +
      (metrics.methodologyTransparency || 0) * weights.methodologyTransparency +
      (metrics.sampleSizeAdequacy || 0) * weights.sampleSizeAdequacy +
      (metrics.accessibilityScore || 0) * weights.accessibilityScore +
      (metrics.complianceScore || 0) * weights.complianceScore;

    return Math.round(isNaN(score) ? 0 : score);
  }

  private determineComplianceStatus(
    overallScore: number,
    qualityGaps: QualityGap[]
  ): 'compliant' | 'warning' | 'non-compliant' {
    const criticalGaps = qualityGaps.filter(gap => gap.severity === QualityGapSeverity.CRITICAL);
    const highGaps = qualityGaps.filter(gap => gap.severity === QualityGapSeverity.HIGH);

    if (criticalGaps.length > 0 || overallScore < 40) {
      return 'non-compliant';
    }

    if (highGaps.length > 0 || overallScore < 60) {
      return 'warning';
    }

    return 'compliant';
  }

  private identifyStrengthAreas(metrics: QualityReport['metrics']): string[] {
    const strengths: string[] = [];

    if (metrics.sourceCredibility >= 80) {
      strengths.push('High-quality, credible sources');
    }

    if (metrics.evidenceDiversity >= 75) {
      strengths.push('Good diversity of evidence sources');
    }

    if (metrics.recencyScore >= 60) {
      strengths.push('Recent, up-to-date sources');
    }

    if (metrics.methodologyTransparency >= 75) {
      strengths.push('Transparent research methodology');
    }

    if (metrics.accessibilityScore >= 90) {
      strengths.push('Highly accessible sources');
    }

    return strengths;
  }

  private identifyImprovementAreas(
    metrics: QualityReport['metrics'],
    qualityGaps: QualityGap[]
  ): string[] {
    const improvements: string[] = [];

    if (metrics.sourceCredibility < 70) {
      improvements.push('Source credibility and authority');
    }

    if (metrics.evidenceDiversity < 60) {
      improvements.push('Diversity of evidence sources');
    }

    if (metrics.recencyScore < 60) {
      improvements.push('Currency and recency of sources');
    }

    if (metrics.methodologyTransparency < 60) {
      improvements.push('Research methodology transparency');
    }

    if (metrics.sampleSizeAdequacy < 70) {
      improvements.push('Sample size adequacy for statistical claims');
    }

    // Add specific areas from quality gaps
    const gapAreas = qualityGaps
      .filter(
        gap =>
          gap.severity === QualityGapSeverity.HIGH || gap.severity === QualityGapSeverity.CRITICAL
      )
      .map(gap => {
        switch (gap.gapType) {
          case QualityGapType.INSUFFICIENT_SOURCES:
            return 'Number of supporting sources';
          case QualityGapType.LOW_CREDIBILITY:
            return 'Source credibility and trustworthiness';
          case QualityGapType.OUTDATED_SOURCES:
            return 'Source recency and relevance';
          case QualityGapType.METHODOLOGY_UNCLEAR:
            return 'Research methodology clarity';
          case QualityGapType.LACK_DIVERSITY:
            return 'Source diversity and perspective range';
          case QualityGapType.BROKEN_LINKS:
            return 'Source accessibility and verification';
          default:
            return 'General citation quality';
        }
      });

    improvements.push(...gapAreas);

    // Remove duplicates and return
    return [...new Set(improvements)];
  }

  private calculatePeerReviewScore(citations: Citation[]): number {
    if (citations.length === 0) return 0;

    const peerReviewScores = citations.map(citation => {
      switch (citation.source_type) {
        case CitationSourceType.ACADEMIC_PAPER:
          return 95; // Academic papers are typically peer-reviewed
        case CitationSourceType.RESEARCH_PUBLICATION:
          return 85; // Research publications often peer-reviewed
        case CitationSourceType.CONSULTING_STUDY:
          return 75; // Consulting studies have internal review
        case CitationSourceType.GOVERNMENT_DATA:
          return 80; // Government data has official review
        case CitationSourceType.INDUSTRY_REPORT:
          return 65; // Industry reports have some review
        default:
          return 40; // Other sources have limited peer review
      }
    });

    return Math.round(
      peerReviewScores.reduce((sum: number, score: number) => sum + score, 0) / citations.length
    );
  }

  private identifyEvidenceGaps(citations: Citation[], claim: string): string[] {
    const gaps: string[] = [];

    if (citations.length < 2) {
      gaps.push('Insufficient number of supporting sources');
    }

    const hasQuantitativeEvidence = citations.some(c => c.sample_size && c.sample_size > 0);
    if (!hasQuantitativeEvidence && claim.includes('%')) {
      gaps.push('Quantitative claim lacks statistical evidence');
    }

    const hasRecentEvidence = citations.some(c => {
      const monthsOld =
        (Date.now() - new Date(c.published_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsOld < 12;
    });
    if (!hasRecentEvidence) {
      gaps.push('Lack of recent evidence for current market conditions');
    }

    const hasHighCredibilityEvidence = citations.some(
      c => c.confidence === CitationConfidence.HIGH
    );
    if (!hasHighCredibilityEvidence) {
      gaps.push('No high-credibility sources supporting the claim');
    }

    return gaps;
  }

  private async generateRecommendations(
    citations: Citation[],
    qualityGaps: QualityGap[],
    metrics: QualityReport['metrics']
  ): Promise<QualityRecommendation[]> {
    return this.recommendImprovements(citations, qualityGaps, metrics);
  }

  /**
   * Update quality thresholds
   */
  updateQualityThresholds(thresholds: Partial<typeof this.qualityThresholds>): void {
    this.qualityThresholds = { ...this.qualityThresholds, ...thresholds };
  }

  /**
   * Get current quality thresholds
   */
  getQualityThresholds(): typeof this.qualityThresholds {
    return { ...this.qualityThresholds };
  }

  /**
   * Update source type weights
   */
  updateSourceTypeWeights(weights: Map<CitationSourceType, number>): void {
    weights.forEach((weight, sourceType) => {
      this.sourceTypeWeights.set(sourceType, weight);
    });
  }

  /**
   * Get current source type weights
   */
  getSourceTypeWeights(): Map<CitationSourceType, number> {
    return new Map(this.sourceTypeWeights);
  }
}
