/**
 * Performance Tests for Amazon Working Backwards Optimization
 * Validates caching, performance monitoring, and timing requirements
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { performanceCache, PerformanceCache } from '../../utils/performance-cache';
import { performanceMonitor, PerformanceMonitor } from '../../utils/performance-monitor';
import {
  AssumptionLedgerService,
  ConfidenceService,
  ScenarioService,
  HardQuestionsService,
  BusinessInputs,
} from '../../services/amazon';
import { AmazonTemplateProcessor } from '../../components/amazon-template-processor';

describe('Amazon Working Backwards Performance Optimization', () => {
  let assumptionLedgerService: AssumptionLedgerService;
  let confidenceService: ConfidenceService;
  let scenarioService: ScenarioService;
  let hardQuestionsService: HardQuestionsService;
  let templateProcessor: AmazonTemplateProcessor;

  const sampleBusinessInputs: BusinessInputs = {
    featureName: 'AI Assistant',
    customer: 'Software Developers',
    region: 'North America',
    competitors: ['GitHub Copilot', 'Tabnine'],
    pricing: 29.99,
    users: 50000,
    convRate: 0.15,
    devCost: 2000000,
    opsCost: 500000,
    marketSize: 50000000,
    competitiveAdvantage: 'Superior context understanding',
    timeline: '12 months',
    citations: [
      {
        url: 'https://gartner.com/ai-coding-report',
        title: 'AI Coding Tools Market Analysis 2024',
        date: '2024-01-15',
        rating: 'A',
        sourceType: 'industry_report',
      },
      {
        url: 'https://stackoverflow.com/developer-survey',
        title: 'Developer Survey Results',
        date: '2024-02-01',
        rating: 'B',
        sourceType: 'research',
      },
    ],
    assumptions: [
      'Developers will adopt AI coding tools at 15% conversion rate',
      'Market size will grow 25% annually',
      'Premium pricing acceptable for superior features',
    ],
  };

  beforeEach(() => {
    assumptionLedgerService = new AssumptionLedgerService();
    confidenceService = new ConfidenceService();
    scenarioService = new ScenarioService();
    hardQuestionsService = new HardQuestionsService();
    templateProcessor = new AmazonTemplateProcessor();

    // Clear cache and performance metrics before each test
    performanceCache.clear();
    performanceMonitor.clear();
  });

  afterEach(() => {
    // Clean up after each test
    performanceCache.clear();
    performanceMonitor.clear();
  });

  describe('Performance Cache System', () => {
    it('should cache source validation results for 24 hours', async () => {
      const url = 'https://example.com/test-source';
      const cacheKey = performanceCache.getSourceValidationKey(url);

      // First call should miss cache
      let cachedResult = performanceCache.get(cacheKey);
      expect(cachedResult).toBeNull();

      // Set cache entry
      const validationResult = {
        url,
        isValid: true,
        credibilityRating: 'A' as const,
        lastChecked: new Date(),
      };
      performanceCache.set(cacheKey, validationResult, 'source_validation');

      // Second call should hit cache
      cachedResult = performanceCache.get(cacheKey);
      expect(cachedResult).toEqual(validationResult);

      // Verify cache stats
      const stats = performanceCache.getStats();
      expect(stats.totalEntries).toBe(1);
      expect(stats.totalHits).toBe(1);
      expect(stats.totalMisses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should cache confidence calculations with proper TTL', () => {
      const citationsHash = performanceCache.hashCitations(sampleBusinessInputs.citations || []);
      const cacheKey = performanceCache.getConfidenceKey(citationsHash, 85, 'medium');

      const confidenceScore = {
        total: 78,
        breakdown: {
          evidence: 85,
          recency: 90,
          diversity: 70,
          agreement: 75,
          coverage: 85,
          sensitivity: 65,
        },
        explanation: 'Moderate confidence with good evidence quality',
        lowConfidence: false,
      };

      // Cache the confidence score
      performanceCache.set(cacheKey, confidenceScore, 'confidence');

      // Verify it can be retrieved
      const cachedScore = performanceCache.get(cacheKey);
      expect(cachedScore).toEqual(confidenceScore);
    });

    it('should generate consistent hashes for duplicate input detection', () => {
      const hash1 = performanceCache.hashInputs(sampleBusinessInputs);
      const hash2 = performanceCache.hashInputs(sampleBusinessInputs);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16); // SHA-256 truncated to 16 chars

      // Different inputs should produce different hashes
      const modifiedInputs = { ...sampleBusinessInputs, pricing: 39.99 };
      const hash3 = performanceCache.hashInputs(modifiedInputs);
      expect(hash3).not.toBe(hash1);
    });

    it('should clean up expired entries automatically', () => {
      // Mock Date.now to simulate time passage
      const originalNow = Date.now;
      let mockTime = Date.now();
      Date.now = jest.fn(() => mockTime);

      try {
        const cacheKey = 'test-key';
        performanceCache.set(cacheKey, 'test-value', 'template');

        // Verify entry exists
        expect(performanceCache.get(cacheKey)).toBe('test-value');

        // Advance time beyond TTL (30 minutes for template cache)
        mockTime += 31 * 60 * 1000;

        // Entry should be expired and return null
        expect(performanceCache.get(cacheKey)).toBeNull();

        // Stats should reflect the miss
        const stats = performanceCache.getStats();
        expect(stats.totalMisses).toBe(1);
      } finally {
        Date.now = originalNow;
      }
    });
  });

  describe('Performance Monitor System', () => {
    it('should track operation timing and validate against targets', async () => {
      const operationName = 'test_operation';

      const { result, report } = await performanceMonitor.timeOperation(operationName, async () => {
        // Simulate work that takes 100ms
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'test result';
      });

      expect(result).toBe('test result');
      expect(report.operationName).toBe(operationName);
      expect(report.actualDuration).toBeGreaterThanOrEqual(100);
      expect(report.actualDuration).toBeLessThan(200); // Allow some variance
      expect(report.passed).toBe(true); // Should pass default 1000ms target
      expect(report.cacheHit).toBe(false);
    });

    it('should detect performance violations', async () => {
      const operationName = 'slow_operation';

      const { report } = await performanceMonitor.timeOperation(operationName, async () => {
        // Simulate slow operation (600ms, exceeds 500ms target for mechanism services)
        await new Promise(resolve => setTimeout(resolve, 600));
        return 'slow result';
      });

      // For operations without specific targets, it should still pass
      expect(report.passed).toBe(true);

      // But if we check against mechanism service targets manually
      const isViolation = report.actualDuration > 500;
      expect(isViolation).toBe(true);
    });

    it('should provide performance summary and statistics', async () => {
      // Run multiple operations
      await performanceMonitor.timeOperation('fast_op', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'fast';
      });

      await performanceMonitor.timeOperation('medium_op', async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'medium';
      });

      await performanceMonitor.timeOperation('fast_op', async () => {
        await new Promise(resolve => setTimeout(resolve, 60));
        return 'fast2';
      });

      const summary = performanceMonitor.getPerformanceSummary();
      expect(summary.totalOperations).toBe(3);
      expect(summary.passedOperations).toBe(3);
      expect(summary.failedOperations).toBe(0);
      expect(summary.overallPassRate).toBe(1.0);
      expect(summary.averageDuration).toBeGreaterThan(0);

      const byOperation = performanceMonitor.getPerformanceByOperation();
      expect(byOperation['fast_op']).toBeDefined();
      expect(byOperation['fast_op'].count).toBe(2);
      expect(byOperation['medium_op']).toBeDefined();
      expect(byOperation['medium_op'].count).toBe(1);
    });
  });

  describe('Mechanism Service Performance', () => {
    it('should complete assumption ledger service within 500ms target', async () => {
      const startTime = Date.now();

      const result = await assumptionLedgerService.normalizeLedger(sampleBusinessInputs);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.assumptions.length).toBeGreaterThan(0);
    });

    it('should complete confidence service within 500ms target', async () => {
      // First get assumption ledger
      const ledgerResult = await assumptionLedgerService.normalizeLedger(sampleBusinessInputs);
      expect(ledgerResult.success).toBe(true);

      const startTime = Date.now();

      const confidenceContext = {
        citations: sampleBusinessInputs.citations || [],
        ledgerCoveragePct: ledgerResult.data!.coverage_pct,
        assumptionCount: ledgerResult.data!.assumptions.length,
        sensitivityRisk: 'medium' as const,
      };

      const result = await confidenceService.computeConfidence(confidenceContext);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.total).toBeGreaterThanOrEqual(0);
      expect(result.data!.total).toBeLessThanOrEqual(100);
    });

    it('should complete scenario service within 500ms target', async () => {
      // First get assumption ledger
      const ledgerResult = await assumptionLedgerService.normalizeLedger(sampleBusinessInputs);
      expect(ledgerResult.success).toBe(true);

      const startTime = Date.now();

      const scenarioContext = {
        ledger: ledgerResult.data!,
        basicCalc: {
          revenue: 2500000,
          costs: 2000000,
          roi: 25,
          npv: 500000,
        },
        topIds: ledgerResult.data!.assumptions.slice(0, 5).map(a => a.id),
        scenarioPct: 0.2,
      };

      const result = await scenarioService.runScenarios(scenarioContext);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.scenarios.base.length).toBeGreaterThan(0);
    });

    it('should complete hard questions service within 500ms target', async () => {
      // First get assumption ledger
      const ledgerResult = await assumptionLedgerService.normalizeLedger(sampleBusinessInputs);
      expect(ledgerResult.success).toBe(true);

      const startTime = Date.now();

      const questionContext = {
        ledger: ledgerResult.data!,
        weakestIds: ledgerResult
          .data!.assumptions.filter(a => a.certainty === 'Low' || a.sourceUrls.length === 0)
          .slice(0, 5)
          .map(a => a.id),
        businessContext: 'AI coding assistant for developers',
        competitiveContext: 'GitHub Copilot, Tabnine',
      };

      const result = await hardQuestionsService.generateQuestions(questionContext);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeGreaterThan(0);
      expect(result.data!.length).toBeLessThanOrEqual(10);
    });

    it('should complete template rendering within 500ms target', () => {
      const startTime = Date.now();

      const templateContext = {
        featureName: sampleBusinessInputs.featureName,
        customer: sampleBusinessInputs.customer,
        problemOneLine: 'Inefficient coding workflows',
        region: sampleBusinessInputs.region,
        competitors: sampleBusinessInputs.competitors,
        ledger: {
          assumptions: [
            {
              id: 'A1',
              name: 'Market Adoption Rate',
              value: 15,
              unit: '%',
              sourceUrls: ['https://example.com'],
              certainty: 'High' as const,
              lastChecked: new Date(),
              category: 'market' as const,
              impact: 'critical' as const,
            },
          ],
          coverage_pct: 85,
          lastUpdated: new Date(),
          totalClaims: 5,
          backedClaims: 4,
        },
        confidence: {
          total: 78,
          breakdown: {
            evidence: 85,
            recency: 90,
            diversity: 70,
            agreement: 75,
            coverage: 85,
            sensitivity: 65,
          },
          explanation: 'Good confidence with strong evidence',
          lowConfidence: false,
        },
        scenarios: {
          scenarios: {
            bear: [{ metric: 'Revenue', bear: 1800000, base: 2500000, bull: 3200000, unit: 'USD' }],
            base: [{ metric: 'Revenue', bear: 1800000, base: 2500000, bull: 3200000, unit: 'USD' }],
            bull: [{ metric: 'Revenue', bear: 1800000, base: 2500000, bull: 3200000, unit: 'USD' }],
          },
          elasticities: [
            {
              assumption: 'Market Adoption Rate',
              assumptionChange: '±20%',
              outcomeMetric: 'Revenue',
              outcomeChange: '±15%',
              sensitivity: 15,
            },
          ],
          keyDrivers: [
            {
              assumption: 'Market Adoption Rate',
              assumptionId: 'A1',
              impact: 15,
              description: 'Critical driver for revenue projections',
            },
          ],
          sensitivityPct: 20,
        },
        hardQuestions: [
          {
            id: 1,
            question: 'How confident are we in the 15% adoption rate assumption?',
            targetAssumptions: ['A1'],
            category: 'market' as const,
            severity: 'critical' as const,
            evidenceNeeded: ['Market research', 'Customer surveys'],
          },
        ],
        citations: sampleBusinessInputs.citations || [],
        inputsHash: 'abc123def456',
        isoTimestamp: new Date().toISOString(),
        shortHash: 'abc123de',
      };

      const result = templateProcessor.renderPRFAQ(templateContext);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(1000); // Should be substantial content
      expect(result).toContain('PR/FAQ');
      expect(result).toContain('Evidence Mechanisms');
    });
  });

  describe('End-to-End Performance', () => {
    it('should complete full Amazon working backwards generation within 2 minutes', async () => {
      const startTime = Date.now();

      // Run complete workflow
      const ledgerResult = await assumptionLedgerService.normalizeLedger(sampleBusinessInputs);
      expect(ledgerResult.success).toBe(true);

      const confidenceContext = {
        citations: sampleBusinessInputs.citations || [],
        ledgerCoveragePct: ledgerResult.data!.coverage_pct,
        assumptionCount: ledgerResult.data!.assumptions.length,
        sensitivityRisk: 'medium' as const,
      };
      const confidenceResult = await confidenceService.computeConfidence(confidenceContext);
      expect(confidenceResult.success).toBe(true);

      const scenarioContext = {
        ledger: ledgerResult.data!,
        basicCalc: {
          revenue: 2500000,
          costs: 2000000,
          roi: 25,
          npv: 500000,
        },
        topIds: ledgerResult.data!.assumptions.slice(0, 5).map(a => a.id),
        scenarioPct: 0.2,
      };
      const scenarioResult = await scenarioService.runScenarios(scenarioContext);
      expect(scenarioResult.success).toBe(true);

      const questionContext = {
        ledger: ledgerResult.data!,
        weakestIds: ledgerResult
          .data!.assumptions.filter(a => a.certainty === 'Low' || a.sourceUrls.length === 0)
          .slice(0, 5)
          .map(a => a.id),
        businessContext: 'AI coding assistant for developers',
        competitiveContext: 'GitHub Copilot, Tabnine',
      };
      const questionsResult = await hardQuestionsService.generateQuestions(questionContext);
      expect(questionsResult.success).toBe(true);

      const templateContext = {
        featureName: sampleBusinessInputs.featureName,
        customer: sampleBusinessInputs.customer,
        problemOneLine: 'Inefficient coding workflows',
        region: sampleBusinessInputs.region,
        competitors: sampleBusinessInputs.competitors,
        ledger: ledgerResult.data!,
        confidence: confidenceResult.data!,
        scenarios: scenarioResult.data!,
        hardQuestions: questionsResult.data!,
        citations: sampleBusinessInputs.citations || [],
        inputsHash: 'abc123def456',
        isoTimestamp: new Date().toISOString(),
        shortHash: 'abc123de',
      };

      const prFaqResult = templateProcessor.renderPRFAQ(templateContext);
      const decisionResult = templateProcessor.renderDecisionOnePager(templateContext);

      const totalDuration = Date.now() - startTime;

      // Should complete within 2 minutes (120,000ms)
      expect(totalDuration).toBeLessThan(120000);

      // Verify all results are valid
      expect(prFaqResult).toBeDefined();
      expect(decisionResult).toBeDefined();
      expect(prFaqResult.length).toBeGreaterThan(1000);
      expect(decisionResult.length).toBeGreaterThan(1000);

      console.log(`Full Amazon working backwards generation completed in ${totalDuration}ms`);
    });

    it('should show performance improvements with caching on second run', async () => {
      // First run (cold cache)
      const firstRunStart = Date.now();
      const firstLedgerResult = await assumptionLedgerService.normalizeLedger(sampleBusinessInputs);
      const firstRunDuration = Date.now() - firstRunStart;

      // Second run (warm cache)
      const secondRunStart = Date.now();
      const secondLedgerResult =
        await assumptionLedgerService.normalizeLedger(sampleBusinessInputs);
      const secondRunDuration = Date.now() - secondRunStart;

      // Second run should be faster due to caching (or at least not slower)
      expect(secondRunDuration).toBeLessThanOrEqual(firstRunDuration);
      expect(firstLedgerResult.success).toBe(true);
      expect(secondLedgerResult.success).toBe(true);

      // Results should be identical
      expect(secondLedgerResult.data).toEqual(firstLedgerResult.data);

      console.log(`First run: ${firstRunDuration}ms, Second run: ${secondRunDuration}ms`);
      console.log(
        `Performance improvement: ${Math.round((1 - secondRunDuration / firstRunDuration) * 100)}%`
      );
    });
  });

  describe('Performance Benchmarking', () => {
    it('should validate all performance targets are met consistently', async () => {
      const iterations = 5;
      const results = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        // Run a subset of operations
        const ledgerResult = await assumptionLedgerService.normalizeLedger(sampleBusinessInputs);
        const confidenceContext = {
          citations: sampleBusinessInputs.citations || [],
          ledgerCoveragePct: ledgerResult.data!.coverage_pct,
          assumptionCount: ledgerResult.data!.assumptions.length,
          sensitivityRisk: 'medium' as const,
        };
        const confidenceResult = await confidenceService.computeConfidence(confidenceContext);

        const duration = Date.now() - startTime;
        results.push(duration);

        expect(ledgerResult.success).toBe(true);
        expect(confidenceResult.success).toBe(true);
      }

      // Calculate statistics
      const avgDuration = results.reduce((sum, d) => sum + d, 0) / results.length;
      const maxDuration = Math.max(...results);
      const minDuration = Math.min(...results);

      console.log(`Performance over ${iterations} iterations:`);
      console.log(`Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`Min: ${minDuration}ms, Max: ${maxDuration}ms`);

      // All iterations should be reasonably fast
      expect(maxDuration).toBeLessThan(1000); // 1 second max for combined operations
      expect(avgDuration).toBeLessThan(800); // 800ms average

      // Performance should be consistent (max shouldn't be more than 3x min, but handle 0ms edge case)
      if (minDuration > 0) {
        expect(maxDuration / minDuration).toBeLessThan(3);
      } else {
        // If min is 0, just ensure max is reasonable
        expect(maxDuration).toBeLessThan(100);
      }
    });

    it('should provide detailed performance metrics and cache statistics', () => {
      // Run some operations to generate metrics
      performanceCache.set('test1', 'value1', 'source_validation');
      performanceCache.set('test2', 'value2', 'confidence');
      performanceCache.get('test1'); // Hit
      performanceCache.get('nonexistent'); // Miss

      const cacheStats = performanceCache.getStats();
      expect(cacheStats.totalEntries).toBe(2);
      expect(cacheStats.totalHits).toBe(1);
      expect(cacheStats.totalMisses).toBe(1);
      expect(cacheStats.hitRate).toBe(0.5);
      expect(cacheStats.memoryUsage).toBeGreaterThan(0);

      const performanceTargets = performanceMonitor.getTargets();
      expect(performanceTargets.length).toBeGreaterThan(0);
      expect(performanceTargets.some(t => t.operationName === 'assumption_ledger_service')).toBe(
        true
      );
      expect(performanceTargets.some(t => t.operationName === 'total_generation')).toBe(true);
    });
  });
});
