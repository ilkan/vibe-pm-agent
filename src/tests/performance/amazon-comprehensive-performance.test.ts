/**
 * Comprehensive Performance Tests for Amazon Working Backwards
 * Validates all performance requirements and benchmarks
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  AssumptionLedgerService,
  ConfidenceService,
  ScenarioService,
  HardQuestionsService,
  BusinessInputs,
} from '../../services/amazon';
import {
  AmazonTemplateProcessor,
  TemplateContext,
} from '../../components/amazon-template-processor/index.js';
import { generateBusinessCase } from '../../mcp/tools/generate_business_case';
import { createStakeholderCommunication } from '../../mcp/tools/create_stakeholder_communication';
import {
  MCPToolContext,
  GenerateBusinessCaseArgs,
  CreateStakeholderCommunicationArgs,
} from '../../models/mcp';
import { performanceCache } from '../../utils/performance-cache';
import { performanceMonitor } from '../../utils/performance-monitor';

describe('Amazon Working Backwards - Comprehensive Performance Tests', () => {
  let assumptionLedgerService: AssumptionLedgerService;
  let confidenceService: ConfidenceService;
  let scenarioService: ScenarioService;
  let hardQuestionsService: HardQuestionsService;
  let templateProcessor: AmazonTemplateProcessor;

  const performanceTestInputs: BusinessInputs = {
    featureName: 'Enterprise Analytics Platform',
    customer: 'Large Enterprise Organizations',
    region: 'Global',
    competitors: ['Tableau', 'PowerBI', 'Looker', 'Qlik', 'Sisense'],
    pricing: 199.99,
    users: 100000,
    convRate: 0.12,
    devCost: 5000000,
    opsCost: 1000000,
    marketSize: 100000000000,
    competitiveAdvantage: 'Real-time analytics with AI-powered insights',
    timeline: '18 months',
    citations: Array.from({ length: 15 }, (_, i) => ({
      url: `https://research-source-${i + 1}.com/analytics-report`,
      title: `Analytics Market Report ${i + 1}`,
      date: '2024-01-15',
      rating: (i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C') as 'A' | 'B' | 'C',
      sourceType: (['industry_report', 'research', 'financial_data', 'news'] as const)[i % 4],
      snippet: `Market insight ${i + 1} about analytics trends and adoption`,
    })),
    assumptions: Array.from(
      { length: 20 },
      (_, i) =>
        `Performance assumption ${i + 1}: Market will adopt advanced analytics at ${10 + i}% rate`
    ),
  };

  const mockContext: MCPToolContext = {
    toolName: 'performance_test',
    sessionId: 'perf-session-123',
    timestamp: Date.now(),
    requestId: 'perf-req-456',
    traceId: 'perf-trace-789',
  };

  beforeEach(() => {
    assumptionLedgerService = new AssumptionLedgerService();
    confidenceService = new ConfidenceService();
    scenarioService = new ScenarioService();
    hardQuestionsService = new HardQuestionsService();
    templateProcessor = new AmazonTemplateProcessor();

    // Clear performance monitoring and cache
    performanceCache.clear();
    performanceMonitor.clear();
  });

  afterEach(() => {
    performanceCache.clear();
    performanceMonitor.clear();
  });

  describe('Individual Service Performance Benchmarks', () => {
    it('should complete AssumptionLedgerService within 500ms target', async () => {
      const iterations = 10;
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const result = await assumptionLedgerService.normalizeLedger(performanceTestInputs);
        const duration = performance.now() - startTime;

        expect(result.success).toBe(true);
        expect(result.data!.assumptions.length).toBeGreaterThan(0);
        results.push(duration);
      }

      const avgDuration = results.reduce((sum, d) => sum + d, 0) / results.length;
      const maxDuration = Math.max(...results);
      const minDuration = Math.min(...results);

      console.log(`AssumptionLedgerService Performance (${iterations} iterations):`);
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${minDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Target: <500ms`);

      expect(avgDuration).toBeLessThan(500);
      expect(maxDuration).toBeLessThan(1000); // Allow some variance for max
    });

    it('should complete ConfidenceService within 500ms target', async () => {
      // Pre-generate ledger for confidence calculation
      const ledgerResult = await assumptionLedgerService.normalizeLedger(performanceTestInputs);
      expect(ledgerResult.success).toBe(true);

      const confidenceContext = {
        citations: performanceTestInputs.citations || [],
        ledgerCoveragePct: ledgerResult.data!.coverage_pct,
        assumptionCount: ledgerResult.data!.assumptions.length,
        sensitivityRisk: 'medium' as const,
      };

      const iterations = 10;
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const result = await confidenceService.computeConfidence(confidenceContext);
        const duration = performance.now() - startTime;

        expect(result.success).toBe(true);
        expect(result.data!.total).toBeGreaterThanOrEqual(0);
        expect(result.data!.total).toBeLessThanOrEqual(100);
        results.push(duration);
      }

      const avgDuration = results.reduce((sum, d) => sum + d, 0) / results.length;
      const maxDuration = Math.max(...results);

      console.log(`ConfidenceService Performance (${iterations} iterations):`);
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Target: <500ms`);

      expect(avgDuration).toBeLessThan(500);
      expect(maxDuration).toBeLessThan(1000);
    });

    it('should complete ScenarioService within 500ms target', async () => {
      const ledgerResult = await assumptionLedgerService.normalizeLedger(performanceTestInputs);
      expect(ledgerResult.success).toBe(true);

      const scenarioContext = {
        ledger: ledgerResult.data!,
        basicCalc: {
          revenue: 24000000, // 100k users * $199.99 * 1.2 (annual factor)
          costs: 6000000, // Dev + ops costs
          roi: 300, // (24M - 6M) / 6M * 100
          npv: 18000000, // Simplified NPV
        },
        topIds: ledgerResult.data!.assumptions.slice(0, 7).map(a => a.id),
        scenarioPct: 0.2,
      };

      const iterations = 5; // Fewer iterations for more complex service
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const result = await scenarioService.runScenarios(scenarioContext);
        const duration = performance.now() - startTime;

        expect(result.success).toBe(true);
        expect(result.data!.scenarios.base.length).toBeGreaterThan(0);
        results.push(duration);
      }

      const avgDuration = results.reduce((sum, d) => sum + d, 0) / results.length;
      const maxDuration = Math.max(...results);

      console.log(`ScenarioService Performance (${iterations} iterations):`);
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Target: <500ms`);

      expect(avgDuration).toBeLessThan(500);
      expect(maxDuration).toBeLessThan(1000);
    });

    it('should complete HardQuestionsService within 500ms target', async () => {
      const ledgerResult = await assumptionLedgerService.normalizeLedger(performanceTestInputs);
      expect(ledgerResult.success).toBe(true);

      const questionContext = {
        ledger: ledgerResult.data!,
        weakestIds: ledgerResult
          .data!.assumptions.filter(a => a.certainty === 'Low' || a.sourceUrls.length === 0)
          .slice(0, 5)
          .map(a => a.id),
        businessContext: 'Enterprise analytics platform for large organizations',
        competitiveContext: 'Tableau, PowerBI, Looker, Qlik, Sisense',
      };

      const iterations = 10;
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const result = await hardQuestionsService.generateQuestions(questionContext);
        const duration = performance.now() - startTime;

        expect(result.success).toBe(true);
        expect(result.data!.length).toBeGreaterThan(0);
        expect(result.data!.length).toBeLessThanOrEqual(10);
        results.push(duration);
      }

      const avgDuration = results.reduce((sum, d) => sum + d, 0) / results.length;
      const maxDuration = Math.max(...results);

      console.log(`HardQuestionsService Performance (${iterations} iterations):`);
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Target: <500ms`);

      expect(avgDuration).toBeLessThan(500);
      expect(maxDuration).toBeLessThan(1000);
    });

    it('should complete template rendering within 500ms target', async () => {
      // Pre-generate all mechanism data
      const ledgerResult = await assumptionLedgerService.normalizeLedger(performanceTestInputs);
      const confidenceResult = await confidenceService.computeConfidence({
        citations: performanceTestInputs.citations || [],
        ledgerCoveragePct: ledgerResult.data!.coverage_pct,
        assumptionCount: ledgerResult.data!.assumptions.length,
        sensitivityRisk: 'medium' as const,
      });
      const scenarioResult = await scenarioService.runScenarios({
        ledger: ledgerResult.data!,
        basicCalc: { revenue: 24000000, costs: 6000000, roi: 300, npv: 18000000 },
        topIds: ledgerResult.data!.assumptions.slice(0, 5).map(a => a.id),
        scenarioPct: 0.2,
      });
      const questionsResult = await hardQuestionsService.generateQuestions({
        ledger: ledgerResult.data!,
        weakestIds: ledgerResult.data!.assumptions.slice(0, 3).map(a => a.id),
        businessContext: 'Enterprise analytics platform',
        competitiveContext: 'Tableau, PowerBI',
      });

      const templateContext: TemplateContext = {
        featureName: performanceTestInputs.featureName,
        customer: performanceTestInputs.customer,
        problemOneLine: 'Complex data analysis and reporting challenges',
        region: performanceTestInputs.region,
        competitors: performanceTestInputs.competitors,
        ledger: ledgerResult.data!,
        confidence: confidenceResult.data!,
        scenarios: scenarioResult.data!,
        hardQuestions: questionsResult.data!,
        citations: performanceTestInputs.citations || [],
        inputsHash: 'perf-test-hash',
        isoTimestamp: new Date().toISOString(),
        shortHash: 'perftest',
      };

      const iterations = 10;
      const prfaqResults: number[] = [];
      const onepagerResults: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Test PR/FAQ rendering
        const prfaqStart = performance.now();
        const prfaqResult = templateProcessor.renderPRFAQ(templateContext);
        const prfaqDuration = performance.now() - prfaqStart;

        expect(prfaqResult).toBeDefined();
        expect(prfaqResult.length).toBeGreaterThan(1000);
        prfaqResults.push(prfaqDuration);

        // Test Decision One-Pager rendering
        const onepagerStart = performance.now();
        const onepagerResult = templateProcessor.renderDecisionOnePager(templateContext);
        const onepagerDuration = performance.now() - onepagerStart;

        expect(onepagerResult).toBeDefined();
        expect(onepagerResult.length).toBeGreaterThan(1000);
        onepagerResults.push(onepagerDuration);
      }

      const avgPRFAQ = prfaqResults.reduce((sum, d) => sum + d, 0) / prfaqResults.length;
      const avgOnePager = onepagerResults.reduce((sum, d) => sum + d, 0) / onepagerResults.length;
      const maxPRFAQ = Math.max(...prfaqResults);
      const maxOnePager = Math.max(...onepagerResults);

      console.log(`Template Rendering Performance (${iterations} iterations):`);
      console.log(`  PR/FAQ Average: ${avgPRFAQ.toFixed(2)}ms, Max: ${maxPRFAQ.toFixed(2)}ms`);
      console.log(
        `  One-Pager Average: ${avgOnePager.toFixed(2)}ms, Max: ${maxOnePager.toFixed(2)}ms`
      );
      console.log(`  Target: <500ms each`);

      expect(avgPRFAQ).toBeLessThan(500);
      expect(avgOnePager).toBeLessThan(500);
      expect(maxPRFAQ).toBeLessThan(1000);
      expect(maxOnePager).toBeLessThan(1000);
    });
  });

  describe('End-to-End Performance Requirements', () => {
    it('should complete full Amazon working backwards generation within 2 minutes', async () => {
      const iterations = 3;
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        // Complete workflow
        const ledgerResult = await assumptionLedgerService.normalizeLedger(performanceTestInputs);
        expect(ledgerResult.success).toBe(true);

        const confidenceResult = await confidenceService.computeConfidence({
          citations: performanceTestInputs.citations || [],
          ledgerCoveragePct: ledgerResult.data!.coverage_pct,
          assumptionCount: ledgerResult.data!.assumptions.length,
          sensitivityRisk: 'medium' as const,
        });
        expect(confidenceResult.success).toBe(true);

        const scenarioResult = await scenarioService.runScenarios({
          ledger: ledgerResult.data!,
          basicCalc: { revenue: 24000000, costs: 6000000, roi: 300, npv: 18000000 },
          topIds: ledgerResult.data!.assumptions.slice(0, 7).map(a => a.id),
          scenarioPct: 0.2,
        });
        expect(scenarioResult.success).toBe(true);

        const questionsResult = await hardQuestionsService.generateQuestions({
          ledger: ledgerResult.data!,
          weakestIds: ledgerResult.data!.assumptions.slice(0, 5).map(a => a.id),
          businessContext: 'Enterprise analytics platform for large organizations',
          competitiveContext: 'Tableau, PowerBI, Looker',
        });
        expect(questionsResult.success).toBe(true);

        const templateContext: TemplateContext = {
          featureName: performanceTestInputs.featureName,
          customer: performanceTestInputs.customer,
          problemOneLine: 'Complex enterprise data analysis challenges',
          region: performanceTestInputs.region,
          competitors: performanceTestInputs.competitors,
          ledger: ledgerResult.data!,
          confidence: confidenceResult.data!,
          scenarios: scenarioResult.data!,
          hardQuestions: questionsResult.data!,
          citations: performanceTestInputs.citations || [],
          inputsHash: `e2e-test-${i}`,
          isoTimestamp: new Date().toISOString(),
          shortHash: `e2e${i}`,
        };

        const prfaqResult = templateProcessor.renderPRFAQ(templateContext);
        const onepagerResult = templateProcessor.renderDecisionOnePager(templateContext);

        expect(prfaqResult).toBeDefined();
        expect(onepagerResult).toBeDefined();

        const totalDuration = performance.now() - startTime;
        results.push(totalDuration);

        console.log(`End-to-end iteration ${i + 1}: ${totalDuration.toFixed(2)}ms`);
      }

      const avgDuration = results.reduce((sum, d) => sum + d, 0) / results.length;
      const maxDuration = Math.max(...results);
      const minDuration = Math.min(...results);

      console.log(`End-to-End Performance (${iterations} iterations):`);
      console.log(`  Average: ${avgDuration.toFixed(2)}ms (${(avgDuration / 1000).toFixed(2)}s)`);
      console.log(`  Min: ${minDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Target: <120,000ms (2 minutes)`);

      // All iterations should complete within 2 minutes
      results.forEach(duration => {
        expect(duration).toBeLessThan(120000); // 2 minutes
      });

      // Average should be well under 2 minutes
      expect(avgDuration).toBeLessThan(60000); // 1 minute average
    });

    it('should demonstrate performance improvements with caching', async () => {
      // First run (cold cache)
      const coldStart = performance.now();
      const coldLedgerResult = await assumptionLedgerService.normalizeLedger(performanceTestInputs);
      const coldConfidenceResult = await confidenceService.computeConfidence({
        citations: performanceTestInputs.citations || [],
        ledgerCoveragePct: coldLedgerResult.data!.coverage_pct,
        assumptionCount: coldLedgerResult.data!.assumptions.length,
        sensitivityRisk: 'medium' as const,
      });
      const coldDuration = performance.now() - coldStart;

      // Second run (warm cache)
      const warmStart = performance.now();
      const warmLedgerResult = await assumptionLedgerService.normalizeLedger(performanceTestInputs);
      const warmConfidenceResult = await confidenceService.computeConfidence({
        citations: performanceTestInputs.citations || [],
        ledgerCoveragePct: warmLedgerResult.data!.coverage_pct,
        assumptionCount: warmLedgerResult.data!.assumptions.length,
        sensitivityRisk: 'medium' as const,
      });
      const warmDuration = performance.now() - warmStart;

      console.log(`Caching Performance Comparison:`);
      console.log(`  Cold run: ${coldDuration.toFixed(2)}ms`);
      console.log(`  Warm run: ${warmDuration.toFixed(2)}ms`);
      console.log(
        `  Improvement: ${(((coldDuration - warmDuration) / coldDuration) * 100).toFixed(1)}%`
      );

      expect(coldLedgerResult.success).toBe(true);
      expect(warmLedgerResult.success).toBe(true);
      expect(coldConfidenceResult.success).toBe(true);
      expect(warmConfidenceResult.success).toBe(true);

      // Warm run should be faster or equal
      expect(warmDuration).toBeLessThanOrEqual(coldDuration);

      // Cache statistics
      const cacheStats = performanceCache.getStats();
      console.log(`Cache Statistics:`);
      console.log(`  Total entries: ${cacheStats.totalEntries}`);
      console.log(`  Hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
      console.log(`  Memory usage: ${cacheStats.memoryUsage} bytes`);

      expect(cacheStats.totalEntries).toBeGreaterThan(0);
    });
  });

  describe('MCP Handler Performance', () => {
    it('should complete generate_business_case within performance targets', async () => {
      const args: GenerateBusinessCaseArgs = {
        opportunity_analysis: `# Business Opportunity Analysis

## Feature Overview
Feature: ${performanceTestInputs.featureName}
Customer: ${performanceTestInputs.customer}
Market Size: $${performanceTestInputs.marketSize}

## Market Analysis
The enterprise analytics market shows strong demand for real-time insights.
We assume that ${(performanceTestInputs.convRate || 0.12) * 100}% market penetration is achievable.
We believe that customers will pay $${performanceTestInputs.pricing} monthly.

## Competitive Landscape
Current solutions lack real-time AI-powered insights.
We expect to capture significant market share through superior technology.`,
        financial_inputs: {
          development_cost: performanceTestInputs.devCost!,
          operational_cost: performanceTestInputs.opsCost!,
          expected_revenue: 24000000,
          time_to_market: 18,
        },
        steering_options: {
          create_steering_files: true,
          feature_name: 'enterprise-analytics',
        },
      };

      const iterations = 3;
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const result = await generateBusinessCase(args, mockContext);
        const duration = performance.now() - startTime;

        expect(result.isError).toBeFalsy();
        expect(result.content).toHaveLength(1);
        expect(result.metadata?.confidenceScore).toBeGreaterThan(0);
        results.push(duration);
      }

      const avgDuration = results.reduce((sum, d) => sum + d, 0) / results.length;
      const maxDuration = Math.max(...results);

      console.log(`generate_business_case Performance (${iterations} iterations):`);
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Target: <60,000ms (1 minute)`);

      expect(avgDuration).toBeLessThan(60000); // 1 minute
      expect(maxDuration).toBeLessThan(120000); // 2 minutes max
    });

    it('should complete create_stakeholder_communication within performance targets', async () => {
      const businessCase = `# Business Case: ${performanceTestInputs.featureName}

## Executive Summary
Comprehensive business case for enterprise analytics platform.

## Market Analysis
Feature: ${performanceTestInputs.featureName}
Customer: ${performanceTestInputs.customer}
Market Size: $${performanceTestInputs.marketSize}
Development Cost: $${performanceTestInputs.devCost}
Revenue: $24,000,000
Timeline: ${performanceTestInputs.timeline}

## Assumptions
We assume ${(performanceTestInputs.convRate || 0.12) * 100}% market penetration is achievable.
We believe customers will pay $${performanceTestInputs.pricing} monthly.
We expect strong competitive positioning due to AI capabilities.`;

      const args: CreateStakeholderCommunicationArgs = {
        business_case: businessCase,
        communication_type: 'pr_faq',
        audience: 'customers',
        steering_options: {
          create_steering_files: true,
          feature_name: 'enterprise-analytics',
        },
      };

      const iterations = 3;
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const result = await createStakeholderCommunication(args, mockContext);
        const duration = performance.now() - startTime;

        expect(result.isError).toBeFalsy();
        expect(result.content[0].markdown).toContain('Press Release');
        expect(result.metadata?.confidenceScore).toBeGreaterThan(0);
        results.push(duration);
      }

      const avgDuration = results.reduce((sum, d) => sum + d, 0) / results.length;
      const maxDuration = Math.max(...results);

      console.log(`create_stakeholder_communication Performance (${iterations} iterations):`);
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Target: <60,000ms (1 minute)`);

      expect(avgDuration).toBeLessThan(60000); // 1 minute
      expect(maxDuration).toBeLessThan(120000); // 2 minutes max
    });
  });

  describe('Stress Testing and Scalability', () => {
    it('should handle large datasets without performance degradation', async () => {
      const largeInputs: BusinessInputs = {
        ...performanceTestInputs,
        assumptions: Array.from(
          { length: 100 },
          (_, i) =>
            `Large dataset assumption ${i + 1}: Complex business logic with detailed explanations and multiple variables that need to be processed efficiently`
        ),
        citations: Array.from({ length: 50 }, (_, i) => ({
          url: `https://large-dataset-source-${i + 1}.com/comprehensive-report`,
          title: `Comprehensive Market Analysis Report ${i + 1} with Detailed Insights`,
          date: '2024-01-15',
          rating: (i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C') as 'A' | 'B' | 'C',
          sourceType: (['industry_report', 'research', 'financial_data', 'news'] as const)[i % 4],
          snippet: `Detailed market insight ${i + 1} with comprehensive analysis of trends, adoption patterns, and competitive landscape dynamics`,
        })),
      };

      const startTime = performance.now();

      const ledgerResult = await assumptionLedgerService.normalizeLedger(largeInputs);
      const confidenceResult = await confidenceService.computeConfidence({
        citations: largeInputs.citations || [],
        ledgerCoveragePct: ledgerResult.data!.coverage_pct,
        assumptionCount: ledgerResult.data!.assumptions.length,
        sensitivityRisk: 'high' as const,
      });

      const totalDuration = performance.now() - startTime;

      console.log(`Large Dataset Performance:`);
      console.log(`  Assumptions: ${largeInputs.assumptions?.length || 0}`);
      console.log(`  Citations: ${largeInputs.citations?.length || 0}`);
      console.log(`  Total duration: ${totalDuration.toFixed(2)}ms`);
      console.log(`  Target: <10,000ms (10 seconds)`);

      expect(ledgerResult.success).toBe(true);
      expect(confidenceResult.success).toBe(true);
      expect(totalDuration).toBeLessThan(10000); // 10 seconds for large datasets
    });

    it('should maintain performance under concurrent load', async () => {
      const concurrentRequests = 5;
      const promises = Array.from({ length: concurrentRequests }, async (_, i) => {
        const startTime = performance.now();

        const testInputs = {
          ...performanceTestInputs,
          featureName: `Concurrent Feature ${i + 1}`,
        };

        const result = await assumptionLedgerService.normalizeLedger(testInputs);
        const duration = performance.now() - startTime;

        return { result, duration, index: i };
      });

      const results = await Promise.all(promises);

      results.forEach(({ result, duration, index }) => {
        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(2000); // 2 seconds under concurrent load
        console.log(`Concurrent request ${index + 1}: ${duration.toFixed(2)}ms`);
      });

      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      console.log(`Concurrent Load Performance (${concurrentRequests} requests):`);
      console.log(`  Average duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Target: <2,000ms per request`);

      expect(avgDuration).toBeLessThan(2000);
    });

    it('should provide detailed performance metrics and monitoring', () => {
      // Get performance targets
      const targets = performanceMonitor.getTargets();
      expect(targets.length).toBeGreaterThan(0);

      console.log('Performance Targets:');
      targets.forEach(target => {
        console.log(`  ${target.operationName}: ${(target as any).targetDuration || 'N/A'}ms`);
      });

      // Get cache statistics
      const cacheStats = performanceCache.getStats();
      console.log('Cache Performance:');
      console.log(`  Total entries: ${cacheStats.totalEntries}`);
      console.log(`  Hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
      console.log(`  Memory usage: ${cacheStats.memoryUsage} bytes`);

      // Verify monitoring is working
      expect(targets.some(t => t.operationName === 'assumption_ledger_service')).toBe(true);
      expect(targets.some(t => t.operationName === 'confidence_service')).toBe(true);
      expect(targets.some(t => t.operationName === 'scenario_service')).toBe(true);
      expect(targets.some(t => t.operationName === 'hard_questions_service')).toBe(true);
      expect(targets.some(t => t.operationName === 'template_rendering')).toBe(true);
    });
  });
});
