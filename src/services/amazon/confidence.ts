/**
 * Amazon Working Backwards - Confidence Scoring Service
 * Calculates 0-100 confidence score with detailed breakdown for evidence quality assessment
 */

import { BaseService, Result } from '../_base';
import {
  ConfidenceScore,
  ConfidenceContext,
  ConfidenceBreakdown,
  Citation,
  Improvement,
} from '../../models/confidence';
import { performanceCache } from '../../utils/performance-cache';
import { performanceMonitor } from '../../utils/performance-monitor';

export class ConfidenceService extends BaseService {
  /**
   * Compute confidence score with detailed breakdown
   */
  async computeConfidence(context: ConfidenceContext): Promise<Result<ConfidenceScore>> {
    return this.handleAsync(async () => {
      // Generate cache key for confidence calculation
      const citationsHash = performanceCache.hashCitations(context.citations);
      const cacheKey = performanceCache.getConfidenceKey(
        citationsHash,
        context.ledgerCoveragePct,
        context.sensitivityRisk
      );

      // Check cache first
      const cachedScore = performanceCache.get<ConfidenceScore>(cacheKey);
      if (cachedScore) {
        return cachedScore;
      }

      const { result } = await performanceMonitor.timeOperation(
        'confidence_service',
        async () => {
          // Calculate individual components
          const evidence = this.calculateEvidenceScore(context.citations);
          const recency = this.calculateRecencyScore(context.citations);
          const diversity = this.calculateDiversityScore(context.citations);
          const agreement = this.calculateAgreementScore(context.citations);
          const coverage = this.calculateCoverageScore(context.ledgerCoveragePct);
          const sensitivity = this.calculateSensitivityScore(
            context.sensitivityRisk,
            context.varianceHint
          );

          const breakdown: ConfidenceBreakdown = {
            evidence,
            recency,
            diversity,
            agreement,
            coverage,
            sensitivity,
          };

          // Calculate weighted total score
          const total = this.calculateWeightedTotal(breakdown);

          // Generate explanation
          const explanation = this.generateExplanation(breakdown, total);

          // Check if low confidence
          const lowConfidence = total < 60;

          return {
            total: Math.round(total),
            breakdown,
            explanation,
            lowConfidence,
          };
        },
        citationsHash
      );

      // Cache the result
      performanceCache.set(cacheKey, result, 'confidence');

      return result;
    }, 'CONFIDENCE_CALCULATION_ERROR');
  }

  /**
   * Generate human-readable explanation for confidence score
   */
  explainScore(score: ConfidenceScore): string {
    const { breakdown, total } = score;

    // Find the strongest and weakest components
    const components = [
      { name: 'evidence', score: breakdown.evidence, weight: 25 },
      { name: 'recency', score: breakdown.recency, weight: 20 },
      { name: 'diversity', score: breakdown.diversity, weight: 15 },
      { name: 'agreement', score: breakdown.agreement, weight: 15 },
      { name: 'coverage', score: breakdown.coverage, weight: 15 },
      { name: 'sensitivity', score: breakdown.sensitivity, weight: 10 },
    ];

    const strongest = components.reduce((max, comp) => (comp.score > max.score ? comp : max));

    const weakest = components.reduce((min, comp) => (comp.score < min.score ? comp : min));

    if (total >= 80) {
      return `High confidence driven by strong ${strongest.name} (${strongest.score}/100)`;
    } else if (total >= 60) {
      return `Moderate confidence limited by weak ${weakest.name} (${weakest.score}/100)`;
    } else {
      return `Low confidence due to insufficient ${weakest.name} (${weakest.score}/100) - human review recommended`;
    }
  }

  /**
   * Identify areas for confidence improvement
   */
  identifyImprovements(score: ConfidenceScore): Improvement[] {
    const improvements: Improvement[] = [];
    const { breakdown } = score;

    // Evidence improvements
    if (breakdown.evidence < 70) {
      improvements.push({
        area: 'evidence',
        currentScore: breakdown.evidence,
        potentialGain: Math.min(25, (85 - breakdown.evidence) * 0.25),
        recommendation:
          'Add more high-quality sources (A-tier preferred) to strengthen evidence base',
      });
    }

    // Recency improvements
    if (breakdown.recency < 70) {
      improvements.push({
        area: 'recency',
        currentScore: breakdown.recency,
        potentialGain: Math.min(20, (90 - breakdown.recency) * 0.2),
        recommendation: 'Update with more recent data sources (within last 6 months preferred)',
      });
    }

    // Diversity improvements
    if (breakdown.diversity < 70) {
      improvements.push({
        area: 'diversity',
        currentScore: breakdown.diversity,
        potentialGain: Math.min(15, (85 - breakdown.diversity) * 0.15),
        recommendation:
          'Include varied source types (industry reports, financial data, research studies)',
      });
    }

    // Coverage improvements
    if (breakdown.coverage < 70) {
      improvements.push({
        area: 'coverage',
        currentScore: breakdown.coverage,
        potentialGain: Math.min(15, (90 - breakdown.coverage) * 0.15),
        recommendation: 'Provide sources for more assumptions to increase coverage percentage',
      });
    }

    // Sort by potential gain (highest first)
    return improvements.sort((a, b) => b.potentialGain - a.potentialGain);
  }

  /**
   * Calculate evidence quality score (25% weight)
   * Based on source credibility and quantity
   */
  private calculateEvidenceScore(citations: Citation[]): number {
    if (citations.length === 0) return 0;

    let totalQuality = 0;
    let sourceCount = 0;

    for (const citation of citations) {
      const credibilityScore = this.getCredibilityScore(citation.rating || 'C');
      totalQuality += credibilityScore;
      sourceCount++;
    }

    // Base score from average quality
    const avgQuality = totalQuality / sourceCount;

    // Quantity bonus (diminishing returns)
    const quantityBonus = Math.min(20, sourceCount * 5);

    // Cap at 100
    return Math.min(100, avgQuality + quantityBonus);
  }

  /**
   * Calculate recency score (20% weight)
   * Based on how recent the data sources are
   */
  private calculateRecencyScore(citations: Citation[]): number {
    if (citations.length === 0) return 0;

    let totalRecencyScore = 0;
    let validDateCount = 0;

    const now = new Date();

    for (const citation of citations) {
      if (citation.date) {
        const citationDate = new Date(citation.date);
        const daysDiff = Math.floor(
          (now.getTime() - citationDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Exponential decay: 100% if <30 days, 50% if 1 year
        let recencyScore: number;
        if (daysDiff <= 30) {
          recencyScore = 100;
        } else if (daysDiff <= 90) {
          recencyScore = 90;
        } else if (daysDiff <= 180) {
          recencyScore = 75;
        } else if (daysDiff <= 365) {
          recencyScore = 50;
        } else if (daysDiff <= 730) {
          recencyScore = 25;
        } else {
          recencyScore = 10;
        }

        totalRecencyScore += recencyScore;
        validDateCount++;
      }
    }

    if (validDateCount === 0) {
      // No dates available, assume moderate recency
      return 50;
    }

    return totalRecencyScore / validDateCount;
  }

  /**
   * Calculate diversity score (15% weight)
   * Based on variety of source types
   */
  private calculateDiversityScore(citations: Citation[]): number {
    if (citations.length === 0) return 0;

    const sourceTypes = new Set(citations.map(c => c.sourceType));
    const uniqueTypes = sourceTypes.size;

    // Score based on number of unique source types
    // 4+ types = 100, 3 types = 80, 2 types = 60, 1 type = 40
    switch (uniqueTypes) {
      case 1:
        return 40;
      case 2:
        return 60;
      case 3:
        return 80;
      default:
        return 100; // 4 or more types
    }
  }

  /**
   * Calculate agreement score (15% weight)
   * Based on consistency across sources (simplified heuristic)
   */
  private calculateAgreementScore(citations: Citation[]): number {
    if (citations.length === 0) return 0;
    if (citations.length === 1) return 85; // Single source, assume good agreement

    // Heuristic: More high-quality sources suggest better agreement
    const highQualitySources = citations.filter(c => (c.rating || 'C') === 'A').length;
    const totalSources = citations.length;

    const highQualityRatio = highQualitySources / totalSources;

    // Base agreement score
    let agreementScore = 70; // Default moderate agreement

    // Bonus for high-quality sources (they tend to agree more)
    agreementScore += highQualityRatio * 25;

    // Penalty for too many sources (might indicate disagreement)
    if (totalSources > 10) {
      agreementScore -= (totalSources - 10) * 2;
    }

    return Math.max(20, Math.min(100, agreementScore));
  }

  /**
   * Calculate coverage score (15% weight)
   * Direct mapping from assumption ledger coverage percentage
   */
  private calculateCoverageScore(coveragePct: number): number {
    return Math.max(0, Math.min(100, coveragePct));
  }

  /**
   * Calculate sensitivity score (10% weight)
   * Based on impact of assumption changes
   */
  private calculateSensitivityScore(
    sensitivityRisk?: 'low' | 'medium' | 'high',
    varianceHint?: number
  ): number {
    // If we have variance hint, use it
    if (varianceHint !== undefined) {
      // Lower variance = higher sensitivity score
      // Assume varianceHint is a percentage (0-100)
      return Math.max(0, 100 - varianceHint);
    }

    // Use sensitivity risk level
    switch (sensitivityRisk) {
      case 'low':
        return 85; // Low sensitivity risk = high score
      case 'medium':
        return 65;
      case 'high':
        return 35; // High sensitivity risk = low score
      default:
        return 70; // Default moderate sensitivity
    }
  }

  /**
   * Calculate weighted total score using Amazon methodology weights
   */
  private calculateWeightedTotal(breakdown: ConfidenceBreakdown): number {
    const weights = {
      evidence: 0.25, // 25%
      recency: 0.2, // 20%
      diversity: 0.15, // 15%
      agreement: 0.15, // 15%
      coverage: 0.15, // 15%
      sensitivity: 0.1, // 10%
    };

    return (
      breakdown.evidence * weights.evidence +
      breakdown.recency * weights.recency +
      breakdown.diversity * weights.diversity +
      breakdown.agreement * weights.agreement +
      breakdown.coverage * weights.coverage +
      breakdown.sensitivity * weights.sensitivity
    );
  }

  /**
   * Generate human-readable explanation for the confidence score
   */
  private generateExplanation(breakdown: ConfidenceBreakdown, total: number): string {
    const components = [
      { name: 'evidence quality', score: breakdown.evidence },
      { name: 'data recency', score: breakdown.recency },
      { name: 'source diversity', score: breakdown.diversity },
      { name: 'source agreement', score: breakdown.agreement },
      { name: 'assumption coverage', score: breakdown.coverage },
      { name: 'sensitivity analysis', score: breakdown.sensitivity },
    ];

    // Find the primary driver (highest weighted contribution)
    const weightedComponents = [
      { name: 'evidence quality', contribution: breakdown.evidence * 0.25 },
      { name: 'data recency', contribution: breakdown.recency * 0.2 },
      { name: 'source diversity', contribution: breakdown.diversity * 0.15 },
      { name: 'source agreement', contribution: breakdown.agreement * 0.15 },
      { name: 'assumption coverage', contribution: breakdown.coverage * 0.15 },
      { name: 'sensitivity analysis', contribution: breakdown.sensitivity * 0.1 },
    ];

    const primaryDriver = weightedComponents.reduce((max, comp) =>
      comp.contribution > max.contribution ? comp : max
    );

    const weakestArea = components.reduce((min, comp) => (comp.score < min.score ? comp : min));

    if (total >= 80) {
      return `Strong confidence anchored by excellent ${primaryDriver.name}`;
    } else if (total >= 60) {
      return `Moderate confidence with ${weakestArea.name} needing improvement`;
    } else {
      return `Low confidence primarily due to weak ${weakestArea.name}`;
    }
  }

  /**
   * Get credibility score for source rating
   */
  private getCredibilityScore(rating: 'A' | 'B' | 'C'): number {
    switch (rating) {
      case 'A':
        return 100; // Highly credible sources
      case 'B':
        return 75; // Moderately credible sources
      case 'C':
        return 50; // Lower credibility sources
      default:
        return 50;
    }
  }
}
