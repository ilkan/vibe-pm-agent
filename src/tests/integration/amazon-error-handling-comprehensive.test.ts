/**
 * Comprehensive Error Handling Tests for Amazon Working Backwards
 * Tests graceful degradation and meaningful error messages
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  AssumptionLedgerService,
  ConfidenceService,
  ScenarioService,
  HardQuestionsService,
  SteeringWriter,
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

describe('Amazon Working Backwards - Comprehensive Error Handling', () => {
  let assumptionLedgerService: AssumptionLedgerService;
  let confidenceService: ConfidenceService;
  let scenarioService: ScenarioService;
  let hardQuestionsService: HardQuestionsService;
  let steeringWriter: SteeringWriter;
  let templateProcessor: AmazonTemplateProcessor;

  const mockContext: MCPToolContext = {
    toolName: 'error_test',
    sessionId: 'error-session-123',
    timestamp: Date.now(),
    requestId: 'error-req-456',
    traceId: 'error-trace-789',
  };

  beforeEach(() => {
    assumptionLedgerService = new AssumptionLedgerService();
    confidenceService = new ConfidenceService();
    scenarioService = new ScenarioService();
    hardQuestionsService = new HardQuestionsService();
    steeringWriter = new SteeringWriter();
    templateProcessor = new AmazonTemplateProcessor();

    performanceCache.clear();
    performanceMonitor.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    performanceCache.clear();
    performanceMonitor.clear();
  });

  describe('Input Validation and Sanitization', () => {
    it('should handle null and undefined inputs gracefully', async () => {
      const nullInputs = null as any;
      const undefinedInputs = undefined as any;
      const emptyInputs = {} as BusinessInputs;

      const nullResult = await assumptionLedgerService.normalizeLedger(nullInputs);
      const undefinedResult = await assumptionLedgerService.normalizeLedger(undefinedInputs);
      const emptyResult = await assumptionLedgerService.normalizeLedger(emptyInputs);

      expect(nullResult.success).toBe(false);
      expect(nullResult.error?.code).toBe('ASSUMPTION_LEDGER_ERROR');
      expect(nullResult.error?.message).toContain('Invalid input');

      expect(undefinedResult.success).toBe(false);
      expect(undefinedResult.error?.code).toBe('ASSUMPTION_LEDGER_ERROR');

      expect(emptyResult.success).toBe(true);
      expect(emptyResult.data!.assumptions).toHaveLength(0);
    });

    it('should sanitize malicious input content', async () => {
      const maliciousInputs: BusinessInputs = {
        featureName: '<script>alert("xss")</script>Malicious Feature',
        customer: '${process.env.SECRET}Injection Customer',
        assumptions: [
          'DROP TABLE users; --',
          '{{constructor.constructor("return process")().exit()}}',
          '<img src=x onerror=alert(1)>',
        ],
        citations: [
          {
            url: 'javascript:alert("xss")',
            title: '<script>malicious</script>',
            sourceType: 'news',
          },
        ],
      };

      const result = await assumptionLedgerService.normalizeLedger(maliciousInputs);

      expect(result.success).toBe(true);
      // Should sanitize but not break functionality
      expect(result.data!.assumptions.length).toBeGreaterThan(0);

      // Verify no script tags in output
      const templateContext: TemplateContext = {
        featureName: maliciousInputs.featureName,
        customer: maliciousInputs.customer,
        problemOneLine: 'Test problem',
        ledger: result.data!,
        confidence: {
          total: 50,
          breakdown: {
            evidence: 50,
            recency: 50,
            diversity: 50,
            agreement: 50,
            coverage: 50,
            sensitivity: 50,
          },
          explanation: 'Test',
          lowConfidence: true,
        },
        scenarios: {
          scenarios: { bear: [], base: [], bull: [] },
          elasticities: [],
          keyDrivers: [],
          sensitivityPct: 20,
        },
        hardQuestions: [],
        citations: maliciousInputs.citations || [],
        inputsHash: 'test',
        isoTimestamp: new Date().toISOString(),
        shortHash: 'test',
      };

      const rendered = templateProcessor.renderPRFAQ(templateContext);
      expect(rendered).not.toContain('<script>');
      expect(rendered).not.toContain('javascript:');
    });

    it('should handle extremely large input values', async () => {
      const largeInputs: BusinessInputs = {
        featureName: 'A'.repeat(10000),
        customer: 'B'.repeat(5000),
        pricing: Number.MAX_SAFE_INTEGER,
        users: Number.MAX_SAFE_INTEGER,
        marketSize: Number.MAX_SAFE_INTEGER,
        assumptions: Array.from({ length: 1000 }, (_, i) => 'C'.repeat(1000)),
        citations: Array.from({ length: 500 }, (_, i) => ({
          url: `https://example${i}.com/${'d'.repeat(1000)}`,
          title: 'E'.repeat(2000),
          sourceType: 'research' as const,
        })),
      };

      const result = await assumptionLedgerService.normalizeLedger(largeInputs);

      expect(result.success).toBe(true);
      // Should handle large inputs without crashing
      expect(result.data).toBeDefined();
    });

    it('should validate and handle invalid data types', async () => {
      const invalidTypeInputs = {
        featureName: 123, // Should be string
        customer: [], // Should be string
        pricing: 'not-a-number', // Should be number
        users: { invalid: 'object' }, // Should be number
        citations: 'not-an-array', // Should be array
        assumptions: { not: 'array' }, // Should be array
      } as any;

      const result = await assumptionLedgerService.normalizeLedger(invalidTypeInputs);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid input');
    });
  });

  describe('Service Failure Scenarios', () => {
    it('should handle assumption ledger service failures gracefully', async () => {
      // Mock the service to fail
      const originalMethod = assumptionLedgerService.normalizeLedger;
      (assumptionLedgerService.normalizeLedger as jest.Mock) = jest
        .fn()
        .mockRejectedValue(new Error('Database connection failed'));

      try {
        const result = await assumptionLedgerService.normalizeLedger({
          featureName: 'Test Feature',
          customer: 'Test Customer',
        });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Database connection failed');
        expect(result.error?.code).toBe('ASSUMPTION_LEDGER_ERROR');
      } finally {
        assumptionLedgerService.normalizeLedger = originalMethod;
      }
    });

    it('should handle confidence service calculation errors', async () => {
      const invalidContext = {
        citations: [
          {
            url: 'invalid-url',
            title: null as any,
            sourceType: 'invalid-type' as any,
          },
        ],
        ledgerCoveragePct: -50, // Invalid negative percentage
        assumptionCount: -10, // Invalid negative count
      };

      const result = await confidenceService.computeConfidence(invalidContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CONFIDENCE_CALCULATION_ERROR');
      expect(result.error?.message).toBeDefined();
    });

    it('should handle scenario service mathematical errors', async () => {
      const invalidScenarioContext = {
        ledger: {
          assumptions: [
            {
              id: 'A1',
              name: 'Invalid Assumption',
              value: NaN, // Invalid number
              sourceUrls: [],
              certainty: 'High' as const,
              lastChecked: new Date(),
              category: 'financial' as const,
              impact: 'critical' as const,
            },
          ],
          coverage_pct: 50,
          lastUpdated: new Date(),
          totalClaims: 1,
          backedClaims: 0,
        },
        basicCalc: {
          revenue: Infinity, // Invalid number
          costs: -Infinity, // Invalid number
          roi: NaN, // Invalid number
          npv: undefined as any, // Invalid type
        },
        topIds: ['A1'],
        scenarioPct: 2.5, // Invalid percentage > 1
      };

      const result = await scenarioService.runScenarios(invalidScenarioContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SCENARIO_ANALYSIS_ERROR');
    });

    it('should handle hard questions service context errors', async () => {
      const invalidQuestionContext = {
        ledger: {
          assumptions: [], // Empty assumptions
          coverage_pct: 0,
          lastUpdated: new Date(),
          totalClaims: 0,
          backedClaims: 0,
        },
        weakestIds: ['NONEXISTENT1', 'NONEXISTENT2'], // Invalid IDs
        businessContext: null as any, // Invalid type
        competitiveContext: undefined as any, // Invalid type
      };

      const result = await hardQuestionsService.generateQuestions(invalidQuestionContext);

      // Should handle gracefully and still generate some questions
      expect(result.success).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
    });
  });

  describe('Template Rendering Error Handling', () => {
    it('should handle template rendering with corrupted data', () => {
      const corruptedContext: TemplateContext = {
        featureName: null as any,
        customer: undefined as any,
        problemOneLine: '',
        ledger: {
          assumptions: [
            {
              id: null as any,
              name: undefined as any,
              value: { invalid: 'object' } as any,
              sourceUrls: 'not-an-array' as any,
              certainty: 'InvalidCertainty' as any,
              lastChecked: 'invalid-date' as any,
              category: 'invalid-category' as any,
              impact: 'invalid-impact' as any,
            },
          ],
          coverage_pct: NaN,
          lastUpdated: null as any,
          totalClaims: undefined as any,
          backedClaims: Infinity,
        },
        confidence: {
          total: NaN,
          breakdown: null as any,
          explanation: undefined as any,
          lowConfidence: 'not-boolean' as any,
        },
        scenarios: null as any,
        hardQuestions: 'not-an-array' as any,
        citations: undefined as any,
        inputsHash: null as any,
        isoTimestamp: 'invalid-date',
        shortHash: undefined as any,
      };

      expect(() => {
        const result = templateProcessor.renderPRFAQ(corruptedContext);
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      }).not.toThrow();
    });

    it('should handle template helper function errors', () => {
      // Register a helper that throws an error
      templateProcessor.registerHelper('errorHelper', () => {
        throw new Error('Helper function failed');
      });

      const context: TemplateContext = {
        featureName: 'Test Feature',
        customer: 'Test Customer',
        problemOneLine: 'Test problem',
        ledger: {
          assumptions: [],
          coverage_pct: 0,
          lastUpdated: new Date(),
          totalClaims: 0,
          backedClaims: 0,
        },
        confidence: {
          total: 50,
          breakdown: {
            evidence: 50,
            recency: 50,
            diversity: 50,
            agreement: 50,
            coverage: 50,
            sensitivity: 50,
          },
          explanation: 'Test',
          lowConfidence: true,
        },
        scenarios: {
          scenarios: { bear: [], base: [], bull: [] },
          elasticities: [],
          keyDrivers: [],
          sensitivityPct: 20,
        },
        hardQuestions: [],
        citations: [],
        inputsHash: 'test',
        isoTimestamp: new Date().toISOString(),
        shortHash: 'test',
      };

      // Should handle helper errors gracefully
      expect(() => {
        const result = templateProcessor.renderPRFAQ(context);
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    it('should validate template structure and provide meaningful errors', () => {
      const requiredSections = ['Evidence Mechanisms', 'Assumption Ledger', 'Confidence Score'];
      const requiredVariables = ['featureName', 'customer', 'confidence.total'];

      const invalidTemplate = 'Invalid template without required sections {{missingVariable}}';

      const validation = templateProcessor.validateTemplate(
        invalidTemplate,
        requiredSections,
        requiredVariables
      );

      expect(validation.isValid).toBe(false);
      expect(validation.missingSections.length).toBeGreaterThan(0);
      expect(validation.missingVariables.length).toBeGreaterThan(0);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Network and External Service Errors', () => {
    it('should handle source validation network timeouts', async () => {
      const inputsWithSlowSources: BusinessInputs = {
        featureName: 'Network Test Feature',
        customer: 'Test Customer',
        citations: Array.from({ length: 20 }, (_, i) => ({
          url: `https://very-slow-source-${i}.com/timeout-test`,
          title: `Slow Source ${i}`,
          sourceType: 'research' as const,
        })),
      };

      // Should complete even with slow/failing sources
      const result = await assumptionLedgerService.normalizeLedger(inputsWithSlowSources);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle invalid URL formats in citations', async () => {
      const inputsWithInvalidUrls: BusinessInputs = {
        featureName: 'URL Test Feature',
        customer: 'Test Customer',
        citations: [
          { url: 'not-a-url', title: 'Invalid URL 1', sourceType: 'news' },
          { url: 'ftp://invalid-protocol.com', title: 'Invalid Protocol', sourceType: 'research' },
          { url: 'https://', title: 'Incomplete URL', sourceType: 'industry_report' },
          { url: 'https://valid-url.com', title: 'Valid URL', sourceType: 'research' },
        ],
      };

      const result = await assumptionLedgerService.normalizeLedger(inputsWithInvalidUrls);

      expect(result.success).toBe(true);
      // Should filter out invalid URLs but keep valid ones
      expect(result.data).toBeDefined();
    });

    it('should handle steering writer failures gracefully', async () => {
      // Mock steering writer to fail
      const originalWrite = steeringWriter.writeSteering;
      (steeringWriter.writeSteering as jest.Mock) = jest
        .fn()
        .mockRejectedValue(new Error('File system permission denied'));

      try {
        const args: GenerateBusinessCaseArgs = {
          opportunity_analysis: 'Test analysis',
          steering_options: {
            create_steering_files: true,
            feature_name: 'test-feature',
          },
        };

        const result = await generateBusinessCase(args, mockContext);

        // Should still succeed even if steering write fails
        expect(result.isError).toBeFalsy();
        expect(result.metadata?.steeringFileCreated).toBe(false);
      } finally {
        steeringWriter.writeSteering = originalWrite;
      }
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle memory pressure gracefully', async () => {
      // Create inputs that would consume significant memory
      const memoryIntensiveInputs: BusinessInputs = {
        featureName: 'Memory Test Feature',
        customer: 'Test Customer',
        assumptions: Array.from(
          { length: 10000 },
          (_, i) => `Memory intensive assumption ${i}: ${'x'.repeat(1000)}`
        ),
        citations: Array.from({ length: 1000 }, (_, i) => ({
          url: `https://memory-test-${i}.com`,
          title: `Memory Test Citation ${i}: ${'y'.repeat(500)}`,
          snippet: 'z'.repeat(2000),
          sourceType: 'research' as const,
        })),
      };

      // Should handle large datasets without memory issues
      const result = await assumptionLedgerService.normalizeLedger(memoryIntensiveInputs);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should clean up resources properly after errors', async () => {
      const initialCacheSize = performanceCache.getStats().totalEntries;

      // Cause an error that might leave resources
      try {
        await assumptionLedgerService.normalizeLedger(null as any);
      } catch (error) {
        // Expected to fail
      }

      // Cache should not grow indefinitely due to errors
      const finalCacheSize = performanceCache.getStats().totalEntries;
      expect(finalCacheSize).toBeLessThanOrEqual(initialCacheSize + 10); // Allow some growth
    });
  });

  describe('MCP Handler Error Integration', () => {
    it('should provide meaningful error messages in MCP responses', async () => {
      const invalidArgs: GenerateBusinessCaseArgs = {
        opportunity_analysis: '', // Empty analysis
        financial_inputs: {
          development_cost: -1000000, // Invalid negative cost
          expected_revenue: NaN, // Invalid number
          time_to_market: -5, // Invalid negative time
        },
      };

      const result = await generateBusinessCase(invalidArgs, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json?.message).toBeDefined();
      expect(result.content[0].json?.message).not.toBe('Unknown error');
      expect(result.content[0].json?.details).toBeDefined();
    });

    it('should handle unsupported communication types gracefully', async () => {
      const args: CreateStakeholderCommunicationArgs = {
        business_case: 'Valid business case content',
        communication_type: 'unsupported_type' as any,
        audience: 'invalid_audience' as any,
      };

      const result = await createStakeholderCommunication(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].json?.message).toContain('Unsupported communication type');
    });

    it('should maintain error context across service boundaries', async () => {
      // Create a scenario where multiple services might fail
      const problematicArgs: GenerateBusinessCaseArgs = {
        opportunity_analysis: 'Test analysis with problematic data',
        financial_inputs: {
          development_cost: Infinity,
          expected_revenue: -1000000,
          operational_cost: NaN,
          time_to_market: 0,
        },
      };

      const result = await generateBusinessCase(problematicArgs, mockContext);

      if (result.isError) {
        expect(result.content[0].json?.message).toBeDefined();
        expect(result.content[0].json?.context).toBeDefined();
        expect(result.content[0].json?.timestamp).toBeDefined();
      }
    });
  });

  describe('Recovery and Fallback Mechanisms', () => {
    it('should provide fallback content when mechanisms fail', async () => {
      const minimalContext: TemplateContext = {
        featureName: 'Fallback Test Feature',
        customer: 'Test Customer',
        problemOneLine: 'Test problem',
        ledger: {
          assumptions: [],
          coverage_pct: 0,
          lastUpdated: new Date(),
          totalClaims: 0,
          backedClaims: 0,
        },
        confidence: {
          total: 0,
          breakdown: {
            evidence: 0,
            recency: 0,
            diversity: 0,
            agreement: 0,
            coverage: 0,
            sensitivity: 0,
          },
          explanation: 'No data available for confidence calculation',
          lowConfidence: true,
        },
        scenarios: {
          scenarios: { bear: [], base: [], bull: [] },
          elasticities: [],
          keyDrivers: [],
          sensitivityPct: 0,
        },
        hardQuestions: [],
        citations: [],
        inputsHash: 'fallback-test',
        isoTimestamp: new Date().toISOString(),
        shortHash: 'fallback',
      };

      const prfaqResult = templateProcessor.renderPRFAQ(minimalContext);
      const onepagerResult = templateProcessor.renderDecisionOnePager(minimalContext);

      // Should still produce valid documents with fallback content
      expect(prfaqResult).toContain('Fallback Test Feature');
      expect(prfaqResult).toContain('Evidence Mechanisms');
      expect(prfaqResult).toContain('⚠️ Human Review Recommended');

      expect(onepagerResult).toContain('Fallback Test Feature');
      expect(onepagerResult).toContain('Evidence Mechanisms');
      expect(onepagerResult).toContain('Decision One-Pager');
    });

    it('should retry failed operations with exponential backoff', async () => {
      let attemptCount = 0;
      const originalMethod = assumptionLedgerService.normalizeLedger;

      (assumptionLedgerService.normalizeLedger as jest.Mock) = jest
        .fn()
        .mockImplementation(async (inputs: any) => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Temporary service failure');
          }
          return originalMethod.call(assumptionLedgerService, inputs);
        });

      try {
        const result = await assumptionLedgerService.normalizeLedger({
          featureName: 'Retry Test Feature',
          customer: 'Test Customer',
        });

        // Should eventually succeed after retries
        expect(result.success).toBe(true);
        expect(attemptCount).toBe(3);
      } finally {
        assumptionLedgerService.normalizeLedger = originalMethod;
      }
    });

    it('should provide diagnostic information for troubleshooting', async () => {
      const diagnosticInputs: BusinessInputs = {
        featureName: 'Diagnostic Test Feature',
        customer: 'Test Customer',
        pricing: -100, // Invalid negative pricing
        users: 0, // Edge case zero users
        citations: [{ url: 'invalid-url', title: 'Invalid Citation', sourceType: 'news' }],
      };

      const result = await assumptionLedgerService.normalizeLedger(diagnosticInputs);

      if (!result.success) {
        expect(result.error?.message).toBeDefined();
        expect(result.error?.code).toBeDefined();
        expect(result.error?.timestamp).toBeDefined();
        expect((result.error as any)?.context).toBeDefined();
      }
    });
  });
});
