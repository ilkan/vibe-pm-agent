/**
 * Unit Tests for Competitive Intelligence Update System
 * 
 * Tests data freshness tracking, update recommendation logic,
 * and update management functionality.
 */

import {
  CompetitiveIntelligenceUpdater,
  createCompetitiveIntelligenceUpdater,
  checkMultipleAnalysesForUpdates,
  DEFAULT_UPDATE_CONFIG,
  UpdateConfiguration
} from '../../components/competitive-intelligence-updater';
import {
  CompetitorAnalysisResult,
  SourceReference,
  FreshnessStatus,
  UpdateRecommendation,
  CompetitiveMatrix,
  Competitor,
  DataQualityCheck
} from '../../models/competitive';

describe('CompetitiveIntelligenceUpdater', () => {
  let updater: CompetitiveIntelligenceUpdater;
  let mockAnalysisResult: CompetitorAnalysisResult;

  beforeEach(() => {
    updater = createCompetitiveIntelligenceUpdater();
    
    // Create mock analysis result
    mockAnalysisResult = createMockAnalysisResult();
  });

  describe('trackAnalysisFreshness', () => {
    it('should track analysis freshness correctly', () => {
      const analysisId = 'test-analysis-1';
      
      const tracker = updater.trackAnalysisFreshness(analysisId, mockAnalysisResult);
      
      expect(tracker.lastAnalysisDate).toBe(mockAnalysisResult.lastUpdated);
      expect(tracker.sourceFreshness.size).toBe(mockAnalysisResult.sourceAttribution.length);
      expect(tracker.competitorDataAge.size).toBe(mockAnalysisResult.competitiveMatrix.competitors.length);
      expect(tracker.updateRecommendations).toBeDefined();
      expect(tracker.nextUpdateDate).toBeDefined();
    });

    it('should track source freshness for all sources', () => {
      const analysisId = 'test-analysis-2';
      
      const tracker = updater.trackAnalysisFreshness(analysisId, mockAnalysisResult);
      
      mockAnalysisResult.sourceAttribution.forEach(source => {
        expect(tracker.sourceFreshness.has(source.id)).toBe(true);
        const freshness = tracker.sourceFreshness.get(source.id);
        expect(freshness).toBeDefined();
        expect(freshness!.status).toMatch(/^(fresh|recent|stale|outdated)$/);
      });
    });

    it('should track competitor data age', () => {
      const analysisId = 'test-analysis-3';
      
      const tracker = updater.trackAnalysisFreshness(analysisId, mockAnalysisResult);
      
      mockAnalysisResult.competitiveMatrix.competitors.forEach(competitor => {
        expect(tracker.competitorDataAge.has(competitor.name)).toBe(true);
        const dataAge = tracker.competitorDataAge.get(competitor.name);
        expect(typeof dataAge).toBe('number');
        expect(dataAge).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('needsUpdate', () => {
    it('should return true for untracked analysis', () => {
      const result = updater.needsUpdate('non-existent-analysis');
      expect(result).toBe(true);
    });

    it('should return false for fresh analysis', () => {
      const analysisId = 'fresh-analysis';
      const freshAnalysis = {
        ...mockAnalysisResult,
        lastUpdated: new Date().toISOString() // Very recent
      };
      
      updater.trackAnalysisFreshness(analysisId, freshAnalysis);
      const result = updater.needsUpdate(analysisId);
      
      expect(result).toBe(false);
    });

    it('should return true for stale analysis', () => {
      const analysisId = 'stale-analysis';
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - 100); // 100 days ago
      
      const staleAnalysis = {
        ...mockAnalysisResult,
        lastUpdated: staleDate.toISOString()
      };
      
      updater.trackAnalysisFreshness(analysisId, staleAnalysis);
      const result = updater.needsUpdate(analysisId);
      
      expect(result).toBe(true);
    });

    it('should return true when high priority updates are pending', () => {
      const analysisId = 'high-priority-analysis';
      const analysisWithOldSources = {
        ...mockAnalysisResult,
        sourceAttribution: [createOldSourceReference()]
      };
      
      updater.trackAnalysisFreshness(analysisId, analysisWithOldSources);
      const result = updater.needsUpdate(analysisId);
      
      expect(result).toBe(true);
    });
  });

  describe('getUpdateRecommendations', () => {
    it('should return default recommendation for untracked analysis', () => {
      const recommendations = updater.getUpdateRecommendations('non-existent');
      
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('analysis-rerun');
      expect(recommendations[0].priority).toBe('high');
    });

    it('should return appropriate recommendations for tracked analysis', () => {
      const analysisId = 'tracked-analysis';
      updater.trackAnalysisFreshness(analysisId, mockAnalysisResult);
      
      const recommendations = updater.getUpdateRecommendations(analysisId);
      
      expect(Array.isArray(recommendations)).toBe(true);
      recommendations.forEach(rec => {
        expect(rec.type).toMatch(/^(data-refresh|methodology-update|source-verification|analysis-rerun)$/);
        expect(rec.priority).toMatch(/^(high|medium|low)$/);
        expect(rec.description).toBeDefined();
        expect(rec.estimatedEffort).toBeDefined();
        expect(rec.expectedImpact).toBeDefined();
      });
    });

    it('should prioritize high priority recommendations first', () => {
      const analysisId = 'priority-test';
      const oldAnalysis = {
        ...mockAnalysisResult,
        lastUpdated: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString() // 150 days ago
      };
      
      updater.trackAnalysisFreshness(analysisId, oldAnalysis);
      const recommendations = updater.getUpdateRecommendations(analysisId);
      
      const priorities = recommendations.map(r => r.priority);
      const highPriorityIndex = priorities.indexOf('high');
      const mediumPriorityIndex = priorities.indexOf('medium');
      
      if (highPriorityIndex !== -1 && mediumPriorityIndex !== -1) {
        expect(highPriorityIndex).toBeLessThan(mediumPriorityIndex);
      }
    });
  });

  describe('updateTrackingData', () => {
    it('should update tracking data with new analysis', () => {
      const analysisId = 'update-test';
      
      // Initial tracking
      const initialTracker = updater.trackAnalysisFreshness(analysisId, mockAnalysisResult);
      
      // Updated analysis
      const updatedAnalysis = {
        ...mockAnalysisResult,
        lastUpdated: new Date().toISOString()
      };
      
      const updatedTracker = updater.updateTrackingData(analysisId, updatedAnalysis);
      
      expect(updatedTracker.lastAnalysisDate).toBe(updatedAnalysis.lastUpdated);
      expect(updatedTracker.lastAnalysisDate).not.toBe(initialTracker.lastAnalysisDate);
    });
  });

  describe('getFreshnessStatus', () => {
    it('should return freshness status for all tracked analyses', () => {
      const analysisId1 = 'analysis-1';
      const analysisId2 = 'analysis-2';
      
      updater.trackAnalysisFreshness(analysisId1, mockAnalysisResult);
      updater.trackAnalysisFreshness(analysisId2, mockAnalysisResult);
      
      const statusMap = updater.getFreshnessStatus();
      
      expect(statusMap.size).toBe(2);
      expect(statusMap.has(analysisId1)).toBe(true);
      expect(statusMap.has(analysisId2)).toBe(true);
      
      statusMap.forEach((status, id) => {
        expect(status.analysisId).toBe(id);
        expect(status.status).toMatch(/^(fresh|recent|stale|outdated)$/);
        expect(typeof status.daysSinceUpdate).toBe('number');
        expect(Array.isArray(status.updateRecommendations)).toBe(true);
      });
    });

    it('should correctly categorize analysis freshness', () => {
      const freshAnalysisId = 'fresh-analysis';
      const staleAnalysisId = 'stale-analysis';
      
      // Fresh analysis (today)
      const freshAnalysis = {
        ...mockAnalysisResult,
        lastUpdated: new Date().toISOString()
      };
      
      // Stale analysis (100 days ago)
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - 100);
      const staleAnalysis = {
        ...mockAnalysisResult,
        lastUpdated: staleDate.toISOString()
      };
      
      updater.trackAnalysisFreshness(freshAnalysisId, freshAnalysis);
      updater.trackAnalysisFreshness(staleAnalysisId, staleAnalysis);
      
      const statusMap = updater.getFreshnessStatus();
      
      const freshStatus = statusMap.get(freshAnalysisId);
      const staleStatus = statusMap.get(staleAnalysisId);
      
      expect(freshStatus!.status).toBe('fresh');
      expect(staleStatus!.status).toBe('stale');
    });
  });

  describe('validateDataQuality', () => {
    it('should validate data quality correctly', () => {
      const result = updater.validateDataQuality(mockAnalysisResult);
      
      expect(result.isValid).toBeDefined();
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.dataGaps)).toBe(true);
      expect(typeof result.qualityScore).toBe('number');
    });

    it('should identify stale analysis', () => {
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - 100); // 100 days ago
      
      const staleAnalysis = {
        ...mockAnalysisResult,
        lastUpdated: staleDate.toISOString()
      };
      
      const result = updater.validateDataQuality(staleAnalysis);
      
      expect(result.warnings.some(w => w.includes('days old'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('Update competitive analysis'))).toBe(true);
    });

    it('should identify low confidence analysis', () => {
      const lowConfidenceAnalysis = {
        ...mockAnalysisResult,
        confidenceLevel: 'low' as const,
        dataQuality: {
          ...mockAnalysisResult.dataQuality,
          overallConfidence: 0.4
        }
      };
      
      const result = updater.validateDataQuality(lowConfidenceAnalysis);
      
      expect(result.warnings.some(w => w.includes('confidence level'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('data quality'))).toBe(true);
    });
  });

  describe('generateUpdateSchedule', () => {
    it('should generate update schedule for multiple analyses', () => {
      const analysisIds = ['analysis-1', 'analysis-2', 'analysis-3'];
      
      // Track different aged analyses
      analysisIds.forEach((id, index) => {
        const daysAgo = index * 50; // 0, 50, 100 days ago
        const analysisDate = new Date();
        analysisDate.setDate(analysisDate.getDate() - daysAgo);
        
        const analysis = {
          ...mockAnalysisResult,
          lastUpdated: analysisDate.toISOString()
        };
        
        updater.trackAnalysisFreshness(id, analysis);
      });
      
      const schedule = updater.generateUpdateSchedule(analysisIds);
      
      expect(schedule).toHaveLength(analysisIds.length);
      
      schedule.forEach(item => {
        expect(item.analysisId).toBeDefined();
        expect(item.nextUpdateDate).toBeDefined();
        expect(item.updateType).toMatch(/^(full-refresh|source-update|competitor-check)$/);
        expect(item.priority).toMatch(/^(high|medium|low)$/);
        expect(item.estimatedEffort).toBeDefined();
      });
      
      // Should be sorted by priority (high first)
      const priorities = schedule.map(s => s.priority);
      const highPriorityIndices = priorities.map((p, i) => p === 'high' ? i : -1).filter(i => i !== -1);
      const mediumPriorityIndices = priorities.map((p, i) => p === 'medium' ? i : -1).filter(i => i !== -1);
      
      if (highPriorityIndices.length > 0 && mediumPriorityIndices.length > 0) {
        expect(Math.max(...highPriorityIndices)).toBeLessThan(Math.min(...mediumPriorityIndices));
      }
    });
  });

  describe('custom configuration', () => {
    it('should use custom configuration', () => {
      const customConfig: Partial<UpdateConfiguration> = {
        staleThresholdDays: 30,
        outdatedThresholdDays: 180,
        minConfidenceLevel: 0.8
      };
      
      const customUpdater = createCompetitiveIntelligenceUpdater(customConfig);
      
      // Test that custom config affects behavior
      const analysisId = 'custom-config-test';
      const moderatelyOldDate = new Date();
      moderatelyOldDate.setDate(moderatelyOldDate.getDate() - 35); // 35 days ago
      
      const analysis = {
        ...mockAnalysisResult,
        lastUpdated: moderatelyOldDate.toISOString()
      };
      
      customUpdater.trackAnalysisFreshness(analysisId, analysis);
      const needsUpdate = customUpdater.needsUpdate(analysisId);
      
      // With custom config (30 day threshold), 35 days should need update
      expect(needsUpdate).toBe(true);
    });
  });
});

describe('Utility Functions', () => {
  describe('checkMultipleAnalysesForUpdates', () => {
    it('should check multiple analyses for updates', () => {
      const analyses = [
        { id: 'analysis-1', result: createMockAnalysisResult() },
        { id: 'analysis-2', result: createMockAnalysisResult() },
        { id: 'analysis-3', result: createMockAnalysisResult() }
      ];
      
      const updateMap = checkMultipleAnalysesForUpdates(analyses);
      
      expect(updateMap.size).toBe(analyses.length);
      
      analyses.forEach(({ id }) => {
        expect(updateMap.has(id)).toBe(true);
        const recommendations = updateMap.get(id);
        expect(Array.isArray(recommendations)).toBe(true);
      });
    });

    it('should use custom configuration for multiple analyses', () => {
      const customConfig: Partial<UpdateConfiguration> = {
        staleThresholdDays: 15
      };
      
      const analyses = [
        { id: 'analysis-1', result: createMockAnalysisResult() }
      ];
      
      const updateMap = checkMultipleAnalysesForUpdates(analyses, customConfig);
      
      expect(updateMap.size).toBe(1);
      expect(updateMap.has('analysis-1')).toBe(true);
    });
  });
});

// ============================================================================
// Test Helper Functions
// ============================================================================

function createMockAnalysisResult(): CompetitorAnalysisResult {
  const currentDate = new Date();
  const recentDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  return {
    competitiveMatrix: createMockCompetitiveMatrix(),
    swotAnalysis: [],
    marketPositioning: {
      positioningMap: [],
      competitorPositions: [],
      marketGaps: [],
      recommendedPositioning: []
    },
    strategicRecommendations: [],
    sourceAttribution: [
      createMockSourceReference('mckinsey', recentDate),
      createMockSourceReference('gartner', recentDate),
      createMockSourceReference('industry-report', recentDate)
    ],
    confidenceLevel: 'medium',
    lastUpdated: recentDate.toISOString(),
    dataQuality: createMockDataQuality()
  };
}

function createMockCompetitiveMatrix(): CompetitiveMatrix {
  return {
    competitors: [
      createMockCompetitor('Competitor A'),
      createMockCompetitor('Competitor B'),
      createMockCompetitor('Competitor C')
    ],
    evaluationCriteria: [],
    rankings: [],
    differentiationOpportunities: [],
    marketContext: {
      industry: 'Technology',
      geography: ['Global'],
      targetSegment: 'Enterprise',
      marketMaturity: 'growth',
      regulatoryEnvironment: [],
      technologyTrends: []
    }
  };
}

function createMockCompetitor(name: string): Competitor {
  const currentDate = new Date();
  const recentMoveDate = new Date(currentDate.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago

  return {
    name,
    marketShare: 25,
    strengths: ['Strong brand', 'Large user base'],
    weaknesses: ['High pricing', 'Limited features'],
    keyFeatures: ['Core platform', 'Analytics', 'API'],
    pricing: {
      model: 'subscription',
      startingPrice: 99,
      currency: 'USD',
      valueProposition: 'Enterprise solution'
    },
    targetMarket: ['Enterprise'],
    recentMoves: [
      {
        date: recentMoveDate.toISOString().split('T')[0],
        type: 'product-launch',
        description: 'Launched new feature',
        impact: 'medium',
        strategicImplication: 'Market expansion'
      }
    ],
    employeeCount: 1000,
    foundedYear: 2015
  };
}

function createMockSourceReference(type: string, publishDate: Date): SourceReference {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: type as any,
    title: `${type} Market Analysis Report`,
    organization: `${type} Research`,
    publishDate: publishDate.toISOString().split('T')[0],
    accessDate: new Date().toISOString().split('T')[0],
    reliability: 0.85,
    relevance: 0.90,
    dataFreshness: {
      status: 'recent',
      ageInDays: 30,
      recommendedUpdateFrequency: 90,
      lastValidated: new Date().toISOString().split('T')[0]
    },
    citationFormat: `${type} Research (2024). Market Analysis Report.`,
    keyFindings: ['Market trends', 'Competitive analysis'],
    limitations: ['Limited scope', 'Sample constraints']
  };
}

function createOldSourceReference(): SourceReference {
  const oldDate = new Date();
  oldDate.setFullYear(oldDate.getFullYear() - 2); // 2 years ago

  return {
    id: `old-source-${Date.now()}`,
    type: 'industry-report',
    title: 'Outdated Market Analysis',
    organization: 'Old Research Institute',
    publishDate: oldDate.toISOString().split('T')[0],
    accessDate: new Date().toISOString().split('T')[0],
    reliability: 0.70,
    relevance: 0.80,
    dataFreshness: {
      status: 'outdated',
      ageInDays: 730,
      recommendedUpdateFrequency: 90,
      lastValidated: new Date().toISOString().split('T')[0]
    },
    citationFormat: 'Old Research Institute (2022). Outdated Market Analysis.',
    keyFindings: ['Historical trends'],
    limitations: ['Outdated data', 'Changed market conditions']
  };
}

function createMockDataQuality(): DataQualityCheck {
  return {
    sourceReliability: 0.85,
    dataFreshness: 0.75,
    methodologyRigor: 0.80,
    overallConfidence: 0.80,
    qualityIndicators: [
      {
        metric: 'Source Diversity',
        score: 0.8,
        description: 'Good mix of authoritative sources',
        impact: 'important'
      }
    ],
    recommendations: ['Consider additional recent sources']
  };
}