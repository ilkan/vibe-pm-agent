/**
 * Unit Tests for Market Condition Change Detection System
 * 
 * Tests market shift detection, notification system, and automated
 * monitoring of market conditions.
 */

import {
  MarketConditionDetector,
  createMarketConditionDetector,
  checkMultipleMarketConditions,
  DEFAULT_MONITORING_CONFIG,
  MarketMonitoringConfig,
  MarketConditionChange,
  MarketChangeNotification
} from '../../components/market-condition-detector';
import {
  MarketSizingResult,
  MarketSize,
  MarketDynamics
} from '../../models/competitive';

describe('MarketConditionDetector', () => {
  let detector: MarketConditionDetector;
  let mockMarketSizing: MarketSizingResult;

  beforeEach(() => {
    detector = createMarketConditionDetector();
    mockMarketSizing = createMockMarketSizing();
  });

  describe('startMonitoring', () => {
    it('should start monitoring market conditions', () => {
      const marketSizingId = 'test-market-1';
      
      const tracker = detector.startMonitoring(marketSizingId, mockMarketSizing);
      
      expect(tracker.marketSizing).toBe(mockMarketSizing);
      expect(tracker.lastMonitored).toBeDefined();
      expect(tracker.historicalConditions).toHaveLength(1);
      expect(tracker.detectedChanges).toHaveLength(0);
      expect(tracker.nextMonitoringDate).toBeDefined();
    });

    it('should create initial snapshot correctly', () => {
      const marketSizingId = 'test-market-2';
      
      const tracker = detector.startMonitoring(marketSizingId, mockMarketSizing);
      const snapshot = tracker.historicalConditions[0];
      
      expect(snapshot.date).toBeDefined();
      expect(snapshot.marketSizes.tam).toBe(mockMarketSizing.tam.value);
      expect(snapshot.marketSizes.sam).toBe(mockMarketSizing.sam.value);
      expect(snapshot.marketSizes.som).toBe(mockMarketSizing.som.value);
      expect(snapshot.growthRates.tam).toBe(mockMarketSizing.tam.growthRate);
      expect(snapshot.dynamicsIndicators).toBeDefined();
      expect(snapshot.economicIndicators).toBeDefined();
    });
  });

  describe('checkForChanges', () => {
    it('should detect no changes for stable market', async () => {
      const marketSizingId = 'stable-market';
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      const changes = await detector.checkForChanges(marketSizingId);
      
      // Should detect minimal or no changes for stable market
      expect(Array.isArray(changes)).toBe(true);
      changes.forEach(change => {
        expect(change.confidence).toBeGreaterThanOrEqual(0);
        expect(change.confidence).toBeLessThanOrEqual(1);
        expect(change.severity).toMatch(/^(low|medium|high|critical)$/);
        expect(change.type).toMatch(/^(growth-rate-shift|market-expansion|competitive-landscape|regulatory-change|technology-disruption|economic-shift)$/);
      });
    });

    it('should throw error for non-existent market sizing', async () => {
      await expect(detector.checkForChanges('non-existent')).rejects.toThrow();
    });

    it('should update tracker after checking for changes', async () => {
      const marketSizingId = 'update-test';
      
      const initialTracker = detector.startMonitoring(marketSizingId, mockMarketSizing);
      const initialHistoryLength = initialTracker.historicalConditions.length;
      
      await detector.checkForChanges(marketSizingId);
      
      // Should have added new snapshot
      expect(initialTracker.historicalConditions.length).toBe(initialHistoryLength + 1);
      expect(initialTracker.lastMonitored).toBeDefined();
    });

    it('should detect significant market size changes', async () => {
      const marketSizingId = 'size-change-test';
      
      // Start with original market sizing
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      
      // Simulate significant market size change
      const changedMarketSizing = {
        ...mockMarketSizing,
        tam: {
          ...mockMarketSizing.tam,
          value: mockMarketSizing.tam.value * 1.5 // 50% increase
        }
      };
      
      // Update the tracker's market sizing to simulate change
      const tracker = detector['trackers'].get(marketSizingId)!;
      tracker.marketSizing = changedMarketSizing;
      
      const changes = await detector.checkForChanges(marketSizingId);
      
      // Should detect market expansion change
      const marketExpansionChanges = changes.filter(c => c.type === 'market-expansion');
      expect(marketExpansionChanges.length).toBeGreaterThan(0);
    });
  });

  describe('getDetectedChanges', () => {
    it('should return empty array for non-existent market sizing', () => {
      const changes = detector.getDetectedChanges('non-existent');
      expect(changes).toEqual([]);
    });

    it('should return detected changes for tracked market sizing', async () => {
      const marketSizingId = 'changes-test';
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      await detector.checkForChanges(marketSizingId);
      
      const changes = detector.getDetectedChanges(marketSizingId);
      expect(Array.isArray(changes)).toBe(true);
    });
  });

  describe('getPendingNotifications', () => {
    it('should return empty array when no notifications exist', () => {
      const notifications = detector.getPendingNotifications();
      expect(notifications).toEqual([]);
    });

    it('should return only unacknowledged notifications', () => {
      // This test would require generating notifications through significant changes
      const notifications = detector.getPendingNotifications();
      expect(Array.isArray(notifications)).toBe(true);
      
      notifications.forEach(notification => {
        expect(notification.acknowledged).toBe(false);
        expect(notification.priority).toMatch(/^(low|medium|high|urgent)$/);
        expect(notification.title).toBeDefined();
        expect(notification.message).toBeDefined();
        expect(Array.isArray(notification.changes)).toBe(true);
        expect(Array.isArray(notification.actions)).toBe(true);
      });
    });
  });

  describe('acknowledgeNotification', () => {
    it('should acknowledge existing notification', () => {
      // Create a mock notification
      const mockNotification: MarketChangeNotification = {
        id: 'test-notification',
        priority: 'high',
        title: 'Test Notification',
        message: 'Test message',
        changes: [],
        actions: [],
        createdAt: new Date().toISOString(),
        acknowledged: false
      };
      
      detector['notifications'].set('test-notification', mockNotification);
      
      detector.acknowledgeNotification('test-notification');
      
      const notification = detector['notifications'].get('test-notification');
      expect(notification!.acknowledged).toBe(true);
    });

    it('should handle non-existent notification gracefully', () => {
      expect(() => {
        detector.acknowledgeNotification('non-existent');
      }).not.toThrow();
    });
  });

  describe('needsRecalculation', () => {
    it('should return false for non-existent market sizing', () => {
      const result = detector.needsRecalculation('non-existent');
      expect(result).toBe(false);
    });

    it('should return false for market with no significant changes', async () => {
      const marketSizingId = 'no-recalc-test';
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      await detector.checkForChanges(marketSizingId);
      
      const result = detector.needsRecalculation(marketSizingId);
      expect(result).toBe(false);
    });

    it('should return true when significant changes require recalculation', () => {
      const marketSizingId = 'recalc-test';
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      
      // Manually add a change that requires recalculation
      const tracker = detector['trackers'].get(marketSizingId)!;
      tracker.detectedChanges.push({
        id: 'test-change',
        type: 'market-expansion',
        severity: 'high',
        description: 'Significant market change',
        detectedAt: new Date().toISOString(),
        impact: { tam: 0.3, sam: 0.2, som: 0.1 },
        confidence: 0.8,
        source: 'Test',
        recommendations: [],
        requiresRecalculation: true
      });
      
      const result = detector.needsRecalculation(marketSizingId);
      expect(result).toBe(true);
    });
  });

  describe('getRecalculationRecommendations', () => {
    it('should return empty array for non-existent market sizing', () => {
      const recommendations = detector.getRecalculationRecommendations('non-existent');
      expect(recommendations).toEqual([]);
    });

    it('should return recommendations for significant changes', () => {
      const marketSizingId = 'recommendations-test';
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      
      // Add significant changes
      const tracker = detector['trackers'].get(marketSizingId)!;
      tracker.detectedChanges.push(
        {
          id: 'growth-change',
          type: 'growth-rate-shift',
          severity: 'high',
          description: 'Growth rate changed significantly',
          detectedAt: new Date().toISOString(),
          impact: { tam: 0.2, sam: 0.15, som: 0.1 },
          confidence: 0.8,
          source: 'Test',
          recommendations: [],
          requiresRecalculation: true
        },
        {
          id: 'competitive-change',
          type: 'competitive-landscape',
          severity: 'high',
          description: 'Competitive landscape shifted',
          detectedAt: new Date().toISOString(),
          impact: { tam: 0, sam: -0.1, som: -0.2 },
          confidence: 0.75,
          source: 'Test',
          recommendations: [],
          requiresRecalculation: true
        }
      );
      
      const recommendations = detector.getRecalculationRecommendations(marketSizingId);
      
      expect(recommendations.length).toBeGreaterThan(0);
      recommendations.forEach(rec => {
        expect(rec.type).toMatch(/^(data-refresh|methodology-update|source-verification|analysis-rerun)$/);
        expect(rec.priority).toMatch(/^(high|medium|low)$/);
        expect(rec.description).toBeDefined();
        expect(rec.estimatedEffort).toBeDefined();
        expect(rec.expectedImpact).toBeDefined();
      });
      
      // Should be sorted by priority
      const priorities = recommendations.map(r => r.priority);
      const highPriorityIndex = priorities.indexOf('high');
      const mediumPriorityIndex = priorities.indexOf('medium');
      
      if (highPriorityIndex !== -1 && mediumPriorityIndex !== -1) {
        expect(highPriorityIndex).toBeLessThan(mediumPriorityIndex);
      }
    });
  });

  describe('suggestRecalculation', () => {
    it('should return no recalculation needed for non-existent market sizing', () => {
      const result = detector.suggestRecalculation('non-existent');
      
      expect(result.shouldRecalculate).toBe(false);
      expect(result.reasons).toContain('No tracking data available');
      expect(result.urgency).toBe('low');
      expect(result.estimatedImpact).toEqual({ tam: 0, sam: 0, som: 0 });
    });

    it('should return no recalculation needed for stable market', async () => {
      const marketSizingId = 'stable-recalc-test';
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      await detector.checkForChanges(marketSizingId);
      
      const result = detector.suggestRecalculation(marketSizingId);
      
      expect(result.shouldRecalculate).toBe(false);
      expect(result.urgency).toBe('low');
    });

    it('should suggest recalculation for significant changes', () => {
      const marketSizingId = 'significant-changes-test';
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      
      // Add significant changes
      const tracker = detector['trackers'].get(marketSizingId)!;
      tracker.detectedChanges.push({
        id: 'critical-change',
        type: 'market-expansion',
        severity: 'critical',
        description: 'Critical market expansion detected',
        detectedAt: new Date().toISOString(),
        impact: { tam: 0.6, sam: 0.4, som: 0.3 },
        confidence: 0.9,
        source: 'Test',
        recommendations: [],
        requiresRecalculation: true
      });
      
      const result = detector.suggestRecalculation(marketSizingId);
      
      expect(result.shouldRecalculate).toBe(true);
      expect(result.urgency).toBe('critical');
      expect(result.estimatedImpact.tam).toBeGreaterThan(0);
      expect(result.recommendedActions.length).toBeGreaterThan(0);
    });

    it('should calculate cumulative impact correctly', () => {
      const marketSizingId = 'cumulative-impact-test';
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      
      const tracker = detector['trackers'].get(marketSizingId)!;
      tracker.detectedChanges.push(
        {
          id: 'change-1',
          type: 'growth-rate-shift',
          severity: 'high',
          description: 'Growth rate increase',
          detectedAt: new Date().toISOString(),
          impact: { tam: 0.1, sam: 0.08, som: 0.05 },
          confidence: 0.8,
          source: 'Test',
          recommendations: [],
          requiresRecalculation: true
        },
        {
          id: 'change-2',
          type: 'competitive-landscape',
          severity: 'high',
          description: 'Competitive pressure',
          detectedAt: new Date().toISOString(),
          impact: { tam: 0, sam: -0.05, som: -0.1 },
          confidence: 0.75,
          source: 'Test',
          recommendations: [],
          requiresRecalculation: true
        }
      );
      
      const result = detector.suggestRecalculation(marketSizingId);
      
      expect(result.shouldRecalculate).toBe(true);
      expect(result.estimatedImpact.tam).toBe(0.1);
      expect(result.estimatedImpact.sam).toBe(0.03);
      expect(result.estimatedImpact.som).toBe(-0.05);
    });
  });

  describe('detectNewCompetitorImpact', () => {
    it('should throw error for non-existent market sizing', () => {
      expect(() => {
        detector.detectNewCompetitorImpact('non-existent', ['Competitor A']);
      }).toThrow();
    });

    it('should assess impact of new competitors', () => {
      const marketSizingId = 'competitor-impact-test';
      const newCompetitors = ['TechCorp Inc', 'AI Startup', 'Google Enterprise'];
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      
      const result = detector.detectNewCompetitorImpact(marketSizingId, newCompetitors);
      
      expect(result.impactAssessment).toHaveLength(newCompetitors.length);
      
      result.impactAssessment.forEach(assessment => {
        expect(newCompetitors).toContain(assessment.competitor);
        expect(assessment.estimatedMarketShare).toBeGreaterThan(0);
        expect(assessment.estimatedMarketShare).toBeLessThanOrEqual(0.25);
        expect(assessment.threatLevel).toMatch(/^(low|medium|high|critical)$/);
        expect(Array.isArray(assessment.reasoning)).toBe(true);
        expect(assessment.reasoning.length).toBeGreaterThan(0);
      });
      
      expect(result.overallImpact.totalSOMReduction).toBeGreaterThanOrEqual(0);
      expect(result.overallImpact.urgency).toMatch(/^(low|medium|high|critical)$/);
      expect(Array.isArray(result.overallImpact.recommendedActions)).toBe(true);
    });

    it('should assign higher threat levels to major competitors', () => {
      const marketSizingId = 'major-competitor-test';
      const majorCompetitors = ['Google Cloud', 'Microsoft Azure', 'Amazon Web Services'];
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      
      const result = detector.detectNewCompetitorImpact(marketSizingId, majorCompetitors);
      
      // Major tech companies should get higher threat levels
      const highThreatCompetitors = result.impactAssessment.filter(
        a => a.threatLevel === 'high' || a.threatLevel === 'critical'
      );
      
      expect(highThreatCompetitors.length).toBeGreaterThan(0);
    });

    it('should add competitor change to tracker', () => {
      const marketSizingId = 'tracker-update-test';
      const newCompetitors = ['New Competitor'];
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      const initialChanges = detector.getDetectedChanges(marketSizingId).length;
      
      detector.detectNewCompetitorImpact(marketSizingId, newCompetitors);
      
      const finalChanges = detector.getDetectedChanges(marketSizingId);
      expect(finalChanges.length).toBe(initialChanges + 1);
      
      const competitorChange = finalChanges[finalChanges.length - 1];
      expect(competitorChange.type).toBe('competitive-landscape');
      expect(competitorChange.description).toContain('new competitors detected');
    });
  });

  describe('getOutdatedAnalysisIndicators', () => {
    it('should return urgent priority for non-existent market sizing', () => {
      const result = detector.getOutdatedAnalysisIndicators('non-existent');
      
      expect(result.isOutdated).toBe(true);
      expect(result.refreshPriority).toBe('urgent');
      expect(result.indicators).toHaveLength(1);
      expect(result.indicators[0].type).toBe('monitoring-gap');
      expect(result.indicators[0].severity).toBe('critical');
    });

    it('should detect stale data sources', () => {
      const marketSizingId = 'stale-data-test';
      
      // Create market sizing with old data sources
      const staleMarketSizing = {
        ...mockMarketSizing,
        sourceAttribution: [{
          ...mockMarketSizing.sourceAttribution[0],
          publishDate: '2023-01-01', // Old date
          dataFreshness: {
            status: 'stale' as const,
            ageInDays: 200,
            recommendedUpdateFrequency: 90,
            lastValidated: '2023-01-01'
          }
        }]
      };
      
      detector.startMonitoring(marketSizingId, staleMarketSizing);
      
      const result = detector.getOutdatedAnalysisIndicators(marketSizingId);
      
      expect(result.indicators.some(i => i.type === 'data-age')).toBe(true);
      expect(result.indicators.some(i => i.type === 'source-staleness')).toBe(true);
      expect(result.refreshPriority).toMatch(/^(medium|high|urgent)$/);
    });

    it('should detect monitoring gaps', () => {
      const marketSizingId = 'monitoring-gap-test';
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      
      // Simulate monitoring gap
      const tracker = detector['trackers'].get(marketSizingId)!;
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30); // 30 days ago
      tracker.lastMonitored = oldDate.toISOString();
      
      const result = detector.getOutdatedAnalysisIndicators(marketSizingId);
      
      expect(result.indicators.some(i => i.type === 'monitoring-gap')).toBe(true);
      expect(result.staleness.monitoringGap).toBeGreaterThan(25);
    });

    it('should detect unaddressed significant changes', () => {
      const marketSizingId = 'unaddressed-changes-test';
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      
      // Add unaddressed significant change
      const tracker = detector['trackers'].get(marketSizingId)!;
      tracker.detectedChanges.push({
        id: 'unaddressed-change',
        type: 'market-expansion',
        severity: 'critical',
        description: 'Critical unaddressed change',
        detectedAt: new Date().toISOString(),
        impact: { tam: 0.4, sam: 0.3, som: 0.2 },
        confidence: 0.9,
        source: 'Test',
        recommendations: [],
        requiresRecalculation: true
      });
      
      const result = detector.getOutdatedAnalysisIndicators(marketSizingId);
      
      expect(result.indicators.some(i => i.type === 'unaddressed-changes')).toBe(true);
      expect(result.refreshPriority).toBe('urgent');
    });

    it('should provide appropriate refresh recommendations', () => {
      const marketSizingId = 'refresh-recommendations-test';
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      
      // Add conditions that require refresh
      const tracker = detector['trackers'].get(marketSizingId)!;
      tracker.detectedChanges.push({
        id: 'high-impact-change',
        type: 'growth-rate-shift',
        severity: 'high',
        description: 'High impact change',
        detectedAt: new Date().toISOString(),
        impact: { tam: 0.25, sam: 0.2, som: 0.15 },
        confidence: 0.8,
        source: 'Test',
        recommendations: [],
        requiresRecalculation: true
      });
      
      const result = detector.getOutdatedAnalysisIndicators(marketSizingId);
      
      expect(result.refreshRecommendations.length).toBeGreaterThan(0);
      
      result.refreshRecommendations.forEach(rec => {
        expect(rec.action).toBeDefined();
        expect(rec.priority).toMatch(/^(low|medium|high)$/);
        expect(rec.estimatedEffort).toBeDefined();
      });
      
      // Should have deadline for high priority actions
      const highPriorityRecs = result.refreshRecommendations.filter(r => r.priority === 'high');
      if (highPriorityRecs.length > 0) {
        expect(highPriorityRecs.some(r => r.deadline)).toBe(true);
      }
    });
  });

  describe('validateMarketConditions', () => {
    it('should return invalid result for non-existent market sizing', () => {
      const result = detector.validateMarketConditions('non-existent');
      
      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.dataGaps.length).toBeGreaterThan(0);
    });

    it('should validate market conditions correctly', async () => {
      const marketSizingId = 'validation-test';
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      await detector.checkForChanges(marketSizingId);
      
      const result = detector.validateMarketConditions(marketSizingId);
      
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.dataGaps)).toBe(true);
      expect(typeof result.qualityScore).toBe('number');
    });

    it('should identify stale monitoring', () => {
      const marketSizingId = 'stale-monitoring-test';
      
      detector.startMonitoring(marketSizingId, mockMarketSizing);
      
      // Simulate stale monitoring by setting old last monitored date
      const tracker = detector['trackers'].get(marketSizingId)!;
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 20); // 20 days ago
      tracker.lastMonitored = oldDate.toISOString();
      
      const result = detector.validateMarketConditions(marketSizingId);
      
      expect(result.warnings.some(w => w.includes('not monitored'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('monitoring'))).toBe(true);
    });

    it('should integrate outdated analysis indicators', () => {
      const marketSizingId = 'outdated-integration-test';
      
      // Create market sizing with old data
      const outdatedMarketSizing = {
        ...mockMarketSizing,
        sourceAttribution: [{
          ...mockMarketSizing.sourceAttribution[0],
          publishDate: '2023-01-01', // Very old date
          dataFreshness: {
            status: 'stale' as const,
            ageInDays: 300,
            recommendedUpdateFrequency: 90,
            lastValidated: '2023-01-01'
          }
        }]
      };
      
      detector.startMonitoring(marketSizingId, outdatedMarketSizing);
      
      const result = detector.validateMarketConditions(marketSizingId);
      
      expect(result.warnings.some(w => w.includes('outdated'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('refresh'))).toBe(true);
      expect(result.qualityScore).toBeLessThan(0.8); // Should be penalized for outdated data
    });

    it('should identify data gaps', () => {
      const marketSizingId = 'data-gaps-test';
      
      // Create market sizing with limited source types
      const limitedMarketSizing = {
        ...mockMarketSizing,
        sourceAttribution: [{
          ...mockMarketSizing.sourceAttribution[0],
          type: 'other' as any // Not market-research or industry-report
        }]
      };
      
      detector.startMonitoring(marketSizingId, limitedMarketSizing);
      
      const result = detector.validateMarketConditions(marketSizingId);
      
      expect(result.dataGaps.length).toBeGreaterThan(0);
      expect(result.dataGaps.some(gap => gap.includes('Market research') || gap.includes('Industry report'))).toBe(true);
    });
  });

  describe('custom configuration', () => {
    it('should use custom monitoring configuration', () => {
      const customConfig: Partial<MarketMonitoringConfig> = {
        growthRateThreshold: 0.05, // 5% instead of default 15%
        marketSizeThreshold: 0.10, // 10% instead of default 20%
        monitoringFrequency: 3 // 3 days instead of default 7
      };
      
      const customDetector = createMarketConditionDetector(customConfig);
      
      // Test that custom config affects behavior
      const marketSizingId = 'custom-config-test';
      const tracker = customDetector.startMonitoring(marketSizingId, mockMarketSizing);
      
      // Check that next monitoring date reflects custom frequency
      const nextMonitoringDate = new Date(tracker.nextMonitoringDate);
      const currentDate = new Date();
      const daysDifference = Math.floor(
        (nextMonitoringDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      expect(daysDifference).toBeLessThanOrEqual(3);
    });
  });
});

describe('Utility Functions', () => {
  describe('checkMultipleMarketConditions', () => {
    it('should check multiple market sizings for condition changes', async () => {
      const marketSizings = [
        { id: 'market-1', result: createMockMarketSizing() },
        { id: 'market-2', result: createMockMarketSizing() },
        { id: 'market-3', result: createMockMarketSizing() }
      ];
      
      const changesMap = await checkMultipleMarketConditions(marketSizings);
      
      expect(changesMap.size).toBe(marketSizings.length);
      
      marketSizings.forEach(({ id }) => {
        expect(changesMap.has(id)).toBe(true);
        const changes = changesMap.get(id);
        expect(Array.isArray(changes)).toBe(true);
      });
    });

    it('should use custom configuration for multiple market sizings', async () => {
      const customConfig: Partial<MarketMonitoringConfig> = {
        confidenceThreshold: 0.9 // Very high confidence threshold
      };
      
      const marketSizings = [
        { id: 'market-1', result: createMockMarketSizing() }
      ];
      
      const changesMap = await checkMultipleMarketConditions(marketSizings, customConfig);
      
      expect(changesMap.size).toBe(1);
      expect(changesMap.has('market-1')).toBe(true);
    });
  });
});

// ============================================================================
// Test Helper Functions
// ============================================================================

function createMockMarketSizing(): MarketSizingResult {
  const currentDate = new Date().toISOString();

  return {
    tam: createMockMarketSize('TAM', 10000000000, 0.12),
    sam: createMockMarketSize('SAM', 2000000000, 0.10),
    som: createMockMarketSize('SOM', 200000000, 0.08),
    methodology: [
      {
        type: 'top-down',
        description: 'Industry analysis approach',
        dataSource: 'Market research reports',
        reliability: 0.8,
        calculationSteps: [],
        limitations: ['Limited data availability'],
        confidence: 0.8
      }
    ],
    scenarios: [
      {
        name: 'balanced',
        description: 'Expected market conditions',
        tam: 10000000000,
        sam: 2000000000,
        som: 200000000,
        probability: 0.6,
        keyAssumptions: ['Normal growth', 'Stable competition'],
        riskFactors: ['Market volatility']
      }
    ],
    confidenceIntervals: [
      {
        marketType: 'tam',
        lowerBound: 8000000000,
        upperBound: 12000000000,
        confidenceLevel: 0.8,
        methodology: 'top-down'
      }
    ],
    sourceAttribution: [
      {
        id: 'source-1',
        type: 'market-research',
        title: 'Technology Market Analysis 2024',
        organization: 'Research Institute',
        publishDate: '2024-01-15',
        accessDate: currentDate.split('T')[0],
        reliability: 0.85,
        relevance: 0.90,
        dataFreshness: {
          status: 'recent',
          ageInDays: 30,
          recommendedUpdateFrequency: 90,
          lastValidated: currentDate.split('T')[0]
        },
        citationFormat: 'Research Institute (2024). Market Analysis.',
        keyFindings: ['Market trends', 'Growth projections'],
        limitations: ['Sample constraints']
      }
    ],
    assumptions: [
      {
        category: 'market-growth',
        description: 'Annual market growth rate',
        value: '10-15%',
        confidence: 0.8,
        impact: 'high'
      }
    ],
    marketDynamics: createMockMarketDynamics()
  };
}

function createMockMarketSize(type: string, value: number, growthRate: number): MarketSize {
  return {
    value,
    currency: 'USD',
    timeframe: '5 years',
    growthRate,
    methodology: `${type} calculation using top-down approach`,
    dataQuality: 'high',
    calculationDate: new Date().toISOString(),
    geographicScope: ['Global'],
    marketSegments: ['Enterprise', 'Mid-market']
  };
}

function createMockMarketDynamics(): MarketDynamics {
  return {
    growthDrivers: [
      'Digital transformation',
      'Increasing demand',
      'Technology advancement'
    ],
    marketBarriers: [
      'High competition',
      'Regulatory compliance',
      'Customer acquisition costs'
    ],
    seasonality: [
      {
        period: 'Q4',
        impact: 1.2,
        description: 'Holiday season boost'
      }
    ],
    cyclicalFactors: [
      'Economic cycles',
      'Technology adoption cycles'
    ],
    disruptiveForces: [
      'AI automation',
      'New business models',
      'Market consolidation'
    ]
  };
}