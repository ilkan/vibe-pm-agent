/**
 * Competitive Intelligence Update System
 * 
 * This component implements data freshness tracking for competitive analysis,
 * update recommendation logic for stale competitive data, and automated
 * update management functionality.
 */

import {
  CompetitorAnalysisResult,
  SourceReference,
  FreshnessStatus,
  UpdateRecommendation,
  DataQualityCheck,
  ValidationResult,
  CompetitiveAnalysisError,
  COMPETITIVE_ANALYSIS_DEFAULTS
} from '../../models/competitive';
import { ReferenceManager, createReferenceManager } from '../reference-manager';

/**
 * Tracks data freshness and manages updates for competitive intelligence
 */
export interface CompetitiveIntelligenceTracker {
  /**
   * Tracks when competitive analysis was last updated
   */
  lastAnalysisDate: string;
  
  /**
   * Tracks freshness of individual data sources
   */
  sourceFreshness: Map<string, FreshnessStatus>;
  
  /**
   * Tracks competitor data staleness
   */
  competitorDataAge: Map<string, number>;
  
  /**
   * Update recommendations based on data age
   */
  updateRecommendations: UpdateRecommendation[];
  
  /**
   * Next recommended update date
   */
  nextUpdateDate: string;
}

/**
 * Configuration for update management
 */
export interface UpdateConfiguration {
  /**
   * Maximum age in days before data is considered stale
   */
  staleThresholdDays: number;
  
  /**
   * Maximum age in days before data is considered outdated
   */
  outdatedThresholdDays: number;
  
  /**
   * Minimum confidence level to maintain
   */
  minConfidenceLevel: number;
  
  /**
   * Update frequency for different source types (in days)
   */
  updateFrequency: {
    mckinsey: number;
    gartner: number;
    wef: number;
    industryReport: number;
    marketResearch: number;
  };
  
  /**
   * Priority thresholds for update recommendations
   */
  priorityThresholds: {
    high: number; // Days after which updates become high priority
    medium: number; // Days after which updates become medium priority
  };
}

/**
 * Default update configuration
 */
export const DEFAULT_UPDATE_CONFIG: UpdateConfiguration = {
  staleThresholdDays: COMPETITIVE_ANALYSIS_DEFAULTS.STALE_DATA_THRESHOLD_DAYS,
  outdatedThresholdDays: COMPETITIVE_ANALYSIS_DEFAULTS.OUTDATED_DATA_THRESHOLD_DAYS,
  minConfidenceLevel: COMPETITIVE_ANALYSIS_DEFAULTS.DEFAULT_CONFIDENCE_THRESHOLD,
  updateFrequency: {
    mckinsey: 90, // Quarterly updates for McKinsey reports
    gartner: 90, // Quarterly updates for Gartner research
    wef: 180, // Semi-annual updates for WEF reports
    industryReport: 120, // Quarterly updates for industry reports
    marketResearch: 60, // Bi-monthly updates for market research
  },
  priorityThresholds: {
    high: 120, // 4 months
    medium: 60, // 2 months
  },
};

/**
 * Manages competitive intelligence updates and data freshness tracking
 */
export class CompetitiveIntelligenceUpdater {
  private readonly config: UpdateConfiguration;
  private readonly referenceManager: ReferenceManager;
  private readonly trackers: Map<string, CompetitiveIntelligenceTracker>;

  constructor(config?: Partial<UpdateConfiguration>) {
    this.config = { ...DEFAULT_UPDATE_CONFIG, ...config };
    this.referenceManager = createReferenceManager();
    this.trackers = new Map();
  }

  /**
   * Tracks data freshness for a competitive analysis result
   */
  trackAnalysisFreshness(
    analysisId: string,
    analysisResult: CompetitorAnalysisResult
  ): CompetitiveIntelligenceTracker {
    const tracker: CompetitiveIntelligenceTracker = {
      lastAnalysisDate: analysisResult.lastUpdated,
      sourceFreshness: new Map(),
      competitorDataAge: new Map(),
      updateRecommendations: [],
      nextUpdateDate: this.calculateNextUpdateDate(analysisResult)
    };

    // Track source freshness
    analysisResult.sourceAttribution.forEach(source => {
      const freshness = this.referenceManager.checkDataFreshness(source);
      tracker.sourceFreshness.set(source.id, freshness);
    });

    // Track competitor data age
    analysisResult.competitiveMatrix.competitors.forEach(competitor => {
      const dataAge = this.calculateCompetitorDataAge(competitor, analysisResult.lastUpdated);
      tracker.competitorDataAge.set(competitor.name, dataAge);
    });

    // Generate update recommendations
    tracker.updateRecommendations = this.generateUpdateRecommendations(
      analysisResult,
      tracker
    );

    // Store tracker
    this.trackers.set(analysisId, tracker);

    return tracker;
  }

  /**
   * Checks if competitive analysis needs updating
   */
  needsUpdate(analysisId: string): boolean {
    const tracker = this.trackers.get(analysisId);
    if (!tracker) {
      return true; // No tracking data means we should update
    }

    const currentDate = new Date();
    const lastUpdate = new Date(tracker.lastAnalysisDate);
    const daysSinceUpdate = Math.floor(
      (currentDate.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if analysis is stale
    if (daysSinceUpdate > this.config.staleThresholdDays) {
      return true;
    }

    // Check if any sources are outdated
    const hasOutdatedSources = Array.from(tracker.sourceFreshness.values()).some(
      freshness => freshness.status === 'outdated'
    );

    if (hasOutdatedSources) {
      return true;
    }

    // Check if high-priority updates are pending
    const hasHighPriorityUpdates = tracker.updateRecommendations.some(
      rec => rec.priority === 'high'
    );

    return hasHighPriorityUpdates;
  }

  /**
   * Gets update recommendations for a specific analysis
   */
  getUpdateRecommendations(analysisId: string): UpdateRecommendation[] {
    const tracker = this.trackers.get(analysisId);
    if (!tracker) {
      return [{
        type: 'analysis-rerun',
        priority: 'high',
        description: 'No tracking data available - full analysis update recommended',
        estimatedEffort: '4-6 hours',
        expectedImpact: 'Complete refresh of competitive intelligence',
        dueDate: new Date().toISOString().split('T')[0]
      }];
    }

    return tracker.updateRecommendations;
  }

  /**
   * Updates tracking data after analysis refresh
   */
  updateTrackingData(
    analysisId: string,
    updatedAnalysis: CompetitorAnalysisResult
  ): CompetitiveIntelligenceTracker {
    return this.trackAnalysisFreshness(analysisId, updatedAnalysis);
  }

  /**
   * Gets freshness status for all tracked analyses
   */
  getFreshnessStatus(): Map<string, {
    analysisId: string;
    status: 'fresh' | 'recent' | 'stale' | 'outdated';
    daysSinceUpdate: number;
    updateRecommendations: UpdateRecommendation[];
  }> {
    const statusMap = new Map();

    this.trackers.forEach((tracker, analysisId) => {
      const currentDate = new Date();
      const lastUpdate = new Date(tracker.lastAnalysisDate);
      const daysSinceUpdate = Math.floor(
        (currentDate.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let status: 'fresh' | 'recent' | 'stale' | 'outdated';
      if (daysSinceUpdate <= 30) status = 'fresh';
      else if (daysSinceUpdate <= this.config.staleThresholdDays) status = 'recent';
      else if (daysSinceUpdate <= this.config.outdatedThresholdDays) status = 'stale';
      else status = 'outdated';

      statusMap.set(analysisId, {
        analysisId,
        status,
        daysSinceUpdate,
        updateRecommendations: tracker.updateRecommendations
      });
    });

    return statusMap;
  }

  /**
   * Validates data quality and recommends updates
   */
  validateDataQuality(analysisResult: CompetitorAnalysisResult): ValidationResult {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const dataGaps: string[] = [];
    let qualityScore = 1.0;

    // Check analysis age
    const analysisAge = this.calculateAnalysisAge(analysisResult.lastUpdated);
    if (analysisAge > this.config.staleThresholdDays) {
      warnings.push(`Analysis is ${analysisAge} days old and may be stale`);
      qualityScore -= 0.2;
      recommendations.push('Update competitive analysis with recent data');
    }

    // Check source freshness
    const staleSourcesCount = analysisResult.sourceAttribution.filter(source => {
      const freshness = this.referenceManager.checkDataFreshness(source);
      return freshness.status === 'stale' || freshness.status === 'outdated';
    }).length;

    if (staleSourcesCount > 0) {
      warnings.push(`${staleSourcesCount} sources are stale or outdated`);
      qualityScore -= (staleSourcesCount / analysisResult.sourceAttribution.length) * 0.3;
      recommendations.push('Refresh outdated source references');
    }

    // Check data quality metrics
    if (analysisResult.dataQuality.overallConfidence < this.config.minConfidenceLevel) {
      warnings.push('Overall confidence level is below recommended threshold');
      qualityScore -= 0.2;
      recommendations.push('Improve data quality through additional research');
    }

    // Check for missing recent competitor moves
    const competitorsWithoutRecentMoves = analysisResult.competitiveMatrix.competitors.filter(
      competitor => {
        const hasRecentMoves = competitor.recentMoves.some(move => {
          const moveDate = new Date(move.date);
          const daysSinceMove = Math.floor(
            (new Date().getTime() - moveDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSinceMove <= 90; // Recent moves within 3 months
        });
        return !hasRecentMoves;
      }
    ).length;

    if (competitorsWithoutRecentMoves > analysisResult.competitiveMatrix.competitors.length * 0.5) {
      warnings.push('More than half of competitors lack recent competitive move data');
      qualityScore -= 0.15;
      dataGaps.push('Recent competitive intelligence');
      recommendations.push('Research recent competitor activities and strategic moves');
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

  /**
   * Generates automated update schedule
   */
  generateUpdateSchedule(analysisIds: string[]): {
    analysisId: string;
    nextUpdateDate: string;
    updateType: 'full-refresh' | 'source-update' | 'competitor-check';
    priority: 'high' | 'medium' | 'low';
    estimatedEffort: string;
  }[] {
    const schedule: {
      analysisId: string;
      nextUpdateDate: string;
      updateType: 'full-refresh' | 'source-update' | 'competitor-check';
      priority: 'high' | 'medium' | 'low';
      estimatedEffort: string;
    }[] = [];

    analysisIds.forEach(analysisId => {
      const tracker = this.trackers.get(analysisId);
      if (!tracker) return;

      const currentDate = new Date();
      const lastUpdate = new Date(tracker.lastAnalysisDate);
      const daysSinceUpdate = Math.floor(
        (currentDate.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let updateType: 'full-refresh' | 'source-update' | 'competitor-check';
      let priority: 'high' | 'medium' | 'low';
      let estimatedEffort: string;
      let nextUpdateDate: string;

      if (daysSinceUpdate > this.config.outdatedThresholdDays) {
        updateType = 'full-refresh';
        priority = 'high';
        estimatedEffort = '6-8 hours';
        nextUpdateDate = new Date().toISOString().split('T')[0]; // Immediate
      } else if (daysSinceUpdate > this.config.priorityThresholds.high) {
        updateType = 'source-update';
        priority = 'high';
        estimatedEffort = '3-4 hours';
        nextUpdateDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 week
      } else if (daysSinceUpdate > this.config.priorityThresholds.medium) {
        updateType = 'competitor-check';
        priority = 'medium';
        estimatedEffort = '2-3 hours';
        nextUpdateDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 2 weeks
      } else {
        updateType = 'competitor-check';
        priority = 'low';
        estimatedEffort = '1-2 hours';
        nextUpdateDate = tracker.nextUpdateDate;
      }

      schedule.push({
        analysisId,
        nextUpdateDate,
        updateType,
        priority,
        estimatedEffort
      });
    });

    // Sort by priority and date
    return schedule.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(a.nextUpdateDate).getTime() - new Date(b.nextUpdateDate).getTime();
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private calculateNextUpdateDate(analysisResult: CompetitorAnalysisResult): string {
    const lastUpdate = new Date(analysisResult.lastUpdated);
    
    // Calculate update frequency based on source types
    const sourceTypes = analysisResult.sourceAttribution.map(s => s.type);
    let minUpdateFrequency = Math.min(
      ...sourceTypes.map(type => {
        switch (type) {
          case 'mckinsey': return this.config.updateFrequency.mckinsey;
          case 'gartner': return this.config.updateFrequency.gartner;
          case 'wef': return this.config.updateFrequency.wef;
          case 'industry-report': return this.config.updateFrequency.industryReport;
          case 'market-research': return this.config.updateFrequency.marketResearch;
          default: return this.config.updateFrequency.industryReport;
        }
      })
    );

    // Adjust based on confidence level
    if (analysisResult.confidenceLevel === 'low') {
      minUpdateFrequency = Math.floor(minUpdateFrequency * 0.7); // Update more frequently for low confidence
    } else if (analysisResult.confidenceLevel === 'high') {
      minUpdateFrequency = Math.floor(minUpdateFrequency * 1.2); // Update less frequently for high confidence
    }

    const nextUpdate = new Date(lastUpdate.getTime() + minUpdateFrequency * 24 * 60 * 60 * 1000);
    return nextUpdate.toISOString().split('T')[0];
  }

  private calculateCompetitorDataAge(competitor: any, analysisDate: string): number {
    const analysisTime = new Date(analysisDate);
    
    // Find the most recent data point for this competitor
    let mostRecentDate = analysisTime;
    
    if (competitor.recentMoves && competitor.recentMoves.length > 0) {
      const recentMoveDate = new Date(competitor.recentMoves[0].date);
      if (recentMoveDate > mostRecentDate) {
        mostRecentDate = recentMoveDate;
      }
    }

    const currentDate = new Date();
    return Math.floor((currentDate.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateAnalysisAge(lastUpdated: string): number {
    const lastUpdateDate = new Date(lastUpdated);
    const currentDate = new Date();
    return Math.floor((currentDate.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private generateUpdateRecommendations(
    analysisResult: CompetitorAnalysisResult,
    tracker: CompetitiveIntelligenceTracker
  ): UpdateRecommendation[] {
    const recommendations: UpdateRecommendation[] = [];
    const currentDate = new Date();

    // Check analysis age
    const analysisAge = this.calculateAnalysisAge(analysisResult.lastUpdated);
    if (analysisAge > this.config.priorityThresholds.high) {
      recommendations.push({
        type: 'analysis-rerun',
        priority: 'high',
        description: `Competitive analysis is ${analysisAge} days old and needs refresh`,
        estimatedEffort: '4-6 hours',
        expectedImpact: 'Updated competitive positioning and strategic recommendations',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    } else if (analysisAge > this.config.priorityThresholds.medium) {
      recommendations.push({
        type: 'source-verification',
        priority: 'medium',
        description: `Verify if competitive landscape has changed in the last ${analysisAge} days`,
        estimatedEffort: '2-3 hours',
        expectedImpact: 'Confirmed current competitive positioning',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    // Check source freshness
    const outdatedSources = analysisResult.sourceAttribution.filter(source => {
      const freshness = tracker.sourceFreshness.get(source.id);
      return freshness && freshness.status === 'outdated';
    });

    if (outdatedSources.length > 0) {
      recommendations.push({
        type: 'data-refresh',
        priority: 'high',
        description: `${outdatedSources.length} sources are outdated and need replacement`,
        estimatedEffort: `${outdatedSources.length * 1}-${outdatedSources.length * 2} hours`,
        expectedImpact: 'Improved analysis credibility and accuracy',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    // Check competitor data staleness
    const staleCompetitors = Array.from(tracker.competitorDataAge.entries()).filter(
      ([, age]) => age > this.config.staleThresholdDays
    );

    if (staleCompetitors.length > 0) {
      recommendations.push({
        type: 'data-refresh',
        priority: 'medium',
        description: `${staleCompetitors.length} competitors have stale data (no recent moves tracked)`,
        estimatedEffort: '3-4 hours',
        expectedImpact: 'Updated competitive intelligence and strategic positioning',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    // Check confidence level
    if (analysisResult.confidenceLevel === 'low') {
      recommendations.push({
        type: 'methodology-update',
        priority: 'medium',
        description: 'Low confidence analysis - consider additional research sources',
        estimatedEffort: '2-4 hours',
        expectedImpact: 'Increased analysis confidence and reliability'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}

/**
 * Factory function to create a CompetitiveIntelligenceUpdater instance
 */
export function createCompetitiveIntelligenceUpdater(
  config?: Partial<UpdateConfiguration>
): CompetitiveIntelligenceUpdater {
  return new CompetitiveIntelligenceUpdater(config);
}

/**
 * Utility function to check if multiple analyses need updates
 */
export function checkMultipleAnalysesForUpdates(
  analyses: { id: string; result: CompetitorAnalysisResult }[],
  config?: Partial<UpdateConfiguration>
): Map<string, UpdateRecommendation[]> {
  const updater = createCompetitiveIntelligenceUpdater(config);
  const updateMap = new Map();

  analyses.forEach(({ id, result }) => {
    updater.trackAnalysisFreshness(id, result);
    const recommendations = updater.getUpdateRecommendations(id);
    updateMap.set(id, recommendations);
  });

  return updateMap;
}