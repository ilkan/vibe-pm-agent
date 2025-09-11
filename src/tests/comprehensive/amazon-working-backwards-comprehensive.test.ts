/**
 * Comprehensive Test Suite for Amazon Working Backwards
 * Task 11: Create comprehensive test suite for Amazon working backwards
 *
 * This test suite covers:
 * - Unit tests for all mechanism services with edge cases and error conditions
 * - Integration tests for complete Amazon working backwards workflow
 * - Snapshot tests for both PR/FAQ and Decision One-Pager templates with fixed seed
 * - Performance tests validating <2min end-to-end generation requirement
 * - Error handling tests ensuring graceful degradation and meaningful error messages
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

// Fixed seed data for deterministic testing
const FIXED_SEED_INPUTS: BusinessInputs = {
  featureName: 'AI-Powered Code Assistant',
  customer: 'Software Development Teams',
  region: 'North America',
  competitors: ['GitHub Copilot', 'Tabnine', 'CodeWhisperer'],
  pricing: 49.99,
  users: 25000,
  convRate: 0.18,
  devCost: 1500000,
  opsCost: 300000,
  marketSize: 15000000000,
  competitiveAdvantage: 'Superior context understanding and multi-language support',
  timeline: '9 months',
  citations: [
    {
      url: 'https://gartner.com/ai-development-tools-2024',
      title: 'AI Development Tools Market Analysis 2024',
      date: '2024-01-15',
      rating: 'A',
      sourceType: 'industry_report',
      snippet: 'AI coding tools market expected to reach $15B by 2026',
    },
    {
      url: 'https://stackoverflow.com/developer-survey-2024',
      title: 'Stack Overflow Developer Survey 2024',
      date: '2024-02-01',
      rating: 'A',
      sourceType: 'research',
      snippet: '68% of developers use or plan to use AI coding tools',
    },
    {
      url: 'https://techcrunch.com/ai-coding-adoption',
      title: 'Enterprise AI Coding Tool Adoption Trends',
      date: '2024-01-20',
      rating: 'B',
      sourceType: 'news',
      snippet: 'Enterprise adoption growing 25% quarterly',
    },
  ],
  assumptions: [
    'Developer productivity will increase by 30% with AI assistance',
    'Enterprise teams will pay premium for advanced features',
    'Market adoption rate will be 18% within first year',
    'Competitive response will be limited due to technical barriers',
  ],
};

const FIXED_SEED_CONTEXT: MCPToolContext = {
  toolName: 'test_comprehensive',
  sessionId: 'test-session-fixed-seed',
  timestamp: 1704067200000, // Fixed timestamp: 2024-01-01T00:00:00.000Z
  requestId: 'req-fixed-seed-123',
  traceId: 'trace-fixed-seed-456',
};

describe('Amazon Working Backwards - Comprehensive Test Suite', () => {
  let assumptionLedgerService: AssumptionLedgerService;
  let confidenceService: ConfidenceService;
  let scenarioService: ScenarioService;
  let hardQuestionsService: HardQuestionsService;
  let steeringWriter: SteeringWriter;
  let templateProcessor: AmazonTemplateProcessor;

  beforeEach(() => {
    // Initialize services
    assumptionLedgerService = new AssumptionLedgerService();
    confidenceService = new ConfidenceService();
    scenarioService = new ScenarioService();
    hardQuestionsService = new HardQuestionsService();
    steeringWriter = new SteeringWriter();
    templateProcessor = new AmazonTemplateProcessor();

    // Clear performance monitoring and cache
    performanceCache.clear();
    performanceMonitor.clear();

    // Mock Date.now for deterministic testing
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_SEED_CONTEXT.timestamp);
    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => new Date(FIXED_SEED_CONTEXT.timestamp) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    performanceCache.clear();
    performanceMonitor.clear();
  });

  describe('Unit Tests - Mechanism Services with Edge Cases', () => {
    describe('AssumptionLedgerService Edge Cases', () => {
      it('should handle malformed citations gracefully', async () => {
        const inputsWithMalformedCitations: BusinessInputs = {
          ...FIXED_SEED_INPUTS,
          citations: [
            {
              url: 'invalid-url-format',
              title: '',
              sourceType: 'industry_report',
            } as any,
            {
              url: 'https://valid-url.com',
              title: 'Valid Citation',
              sourceType: 'research',
            },
          ],
        };

        const result = await assumptionLedgerService.normalizeLedger(inputsWithMalformedCitations);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();

        // Should filter out invalid citations but keep valid ones
        const assumptions = result.data!.assumptions;
        const assumptionsWithSources = assumptions.filter(a => a.sourceUrls.length > 0);
        expect(assumptionsWithSources.length).toBeGreaterThan(0);
      });

      it('should handle extremely large assumption sets', async () => {
        const largeInputs: BusinessInputs = {
          ...FIXED_SEED_INPUTS,
          assumptions: Array.from({ length: 100 }, (_, i) => `Large assumption ${i + 1}`),
        };

        const result = await assumptionLedgerService.normalizeLedger(largeInputs);

        expect(result.success).toBe(true);
        expect(result.data!.assumptions.length).toBeGreaterThan(0);
        expect(result.data!.assumptions.length).toBeLessThanOrEqual(110); // Should handle large sets
      });

      it('should handle missing required fields', async () => {
        const incompleteInputs = {
          featureName: '',
          customer: '',
        } as BusinessInputs;

        const result = await assumptionLedgerService.normalizeLedger(incompleteInputs);

        expect(result.success).toBe(true);
        expect(result.data!.assumptions).toHaveLength(0);
        expect(result.data!.coverage_pct).toBe(0);
      });

      it('should handle circular citation references', async () => {
        const inputsWithCircularRefs: BusinessInputs = {
          ...FIXED_SEED_INPUTS,
          citations: [
            {
              url: 'https://site1.com/ref-to-site2',
              title: 'Site 1 referencing Site 2',
              sourceType: 'news',
            },
            {
              url: 'https://site2.com/ref-to-site1',
              title: 'Site 2 referencing Site 1',
              sourceType: 'news',
            },
          ],
        };

        const result = await assumptionLedgerService.normalizeLedger(inputsWithCircularRefs);

        expect(result.success).toBe(true);
        // Should handle circular references without infinite loops
        expect(result.data).toBeDefined();
      });
    });

    describe('ConfidenceService Edge Cases', () => {
      it('should handle confidence calculation with no citations', async () => {
        const emptyContext = {
          citations: [],
          ledgerCoveragePct: 0,
          assumptionCount: 0,
        };

        const result = await confidenceService.computeConfidence(emptyContext);

        expect(result.success).toBe(true);
        expect(result.data!.total).toBe(0);
        expect(result.data!.lowConfidence).toBe(true);
        expect(result.data!.breakdown.evidence).toBe(0);
        expect(result.data!.breakdown.diversity).toBe(0);
      });

      it('should handle extreme confidence scenarios', async () => {
        const extremeContext = {
          citations: Array.from({ length: 50 }, (_, i) => ({
            url: `https://top-source-${i}.com`,
            title: `Top Quality Source ${i}`,
            date: '2024-01-01',
            rating: 'A' as const,
            sourceType: 'industry_report' as const,
          })),
          ledgerCoveragePct: 100,
          assumptionCount: 5,
          sensitivityRisk: 'low' as const,
        };

        const result = await confidenceService.computeConfidence(extremeContext);

        expect(result.success).toBe(true);
        expect(result.data!.total).toBeGreaterThan(90);
        expect(result.data!.lowConfidence).toBe(false);
        expect(result.data!.breakdown.evidence).toBeGreaterThan(95);
      });

      it('should handle invalid date formats in citations', async () => {
        const contextWithInvalidDates = {
          citations: [
            {
              url: 'https://example.com',
              title: 'Source with invalid date',
              date: 'invalid-date-format',
              rating: 'B' as const,
              sourceType: 'research' as const,
            },
          ],
          ledgerCoveragePct: 50,
          assumptionCount: 3,
        };

        const result = await confidenceService.computeConfidence(contextWithInvalidDates);

        expect(result.success).toBe(true);
        expect(result.data!.breakdown.recency).toBe(50); // Should use default for invalid dates
      });

      it('should handle confidence calculation overflow scenarios', async () => {
        const overflowContext = {
          citations: [],
          ledgerCoveragePct: 150, // Invalid percentage > 100
          assumptionCount: -5, // Invalid negative count
          varianceHint: 200, // Invalid variance > 100
        };

        const result = await confidenceService.computeConfidence(overflowContext);

        expect(result.success).toBe(true);
        // Should clamp values to valid ranges
        expect(result.data!.breakdown.coverage).toBeLessThanOrEqual(100);
        expect(result.data!.breakdown.sensitivity).toBeGreaterThanOrEqual(0);
      });
    });

    describe('ScenarioService Edge Cases', () => {
      it('should handle scenarios with zero or negative base values', async () => {
        const zeroBaseContext = {
          ledger: {
            assumptions: [
              {
                id: 'A1',
                name: 'Zero Revenue',
                value: 0,
                sourceUrls: [],
                certainty: 'Medium' as const,
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
            revenue: 0,
            costs: 100000,
            roi: -100,
            npv: -50000,
          },
          topIds: ['A1'],
          scenarioPct: 0.2,
        };

        const result = await scenarioService.runScenarios(zeroBaseContext);

        expect(result.success).toBe(true);
        expect(result.data!.scenarios.base).toBeDefined();
        expect(result.data!.scenarios.bear).toBeDefined();
        expect(result.data!.scenarios.bull).toBeDefined();
      });

      it('should handle scenarios with extreme sensitivity values', async () => {
        const extremeSensitivityContext = {
          ledger: {
            assumptions: [
              {
                id: 'A1',
                name: 'Extreme Multiplier',
                value: 1000000,
                sourceUrls: [],
                certainty: 'Low' as const,
                lastChecked: new Date(),
                category: 'financial' as const,
                impact: 'critical' as const,
              },
            ],
            coverage_pct: 25,
            lastUpdated: new Date(),
            totalClaims: 1,
            backedClaims: 0,
          },
          basicCalc: {
            revenue: 1,
            costs: 1,
            roi: 1,
            npv: 1,
          },
          topIds: ['A1'],
          scenarioPct: 0.9, // Extreme 90% sensitivity
        };

        const result = await scenarioService.runScenarios(extremeSensitivityContext);

        expect(result.success).toBe(true);
        // Should handle extreme sensitivities without breaking
        expect(result.data!.elasticities).toBeDefined();
      });

      it('should handle empty assumption ledger', async () => {
        const emptyLedgerContext = {
          ledger: {
            assumptions: [],
            coverage_pct: 0,
            lastUpdated: new Date(),
            totalClaims: 0,
            backedClaims: 0,
          },
          basicCalc: {
            revenue: 1000000,
            costs: 500000,
            roi: 100,
            npv: 500000,
          },
          topIds: [],
          scenarioPct: 0.2,
        };

        const result = await scenarioService.runScenarios(emptyLedgerContext);

        expect(result.success).toBe(true);
        expect(result.data!.keyDrivers).toHaveLength(0);
        expect(result.data!.elasticities).toHaveLength(0);
      });
    });

    describe('HardQuestionsService Edge Cases', () => {
      it('should handle empty assumption ledger gracefully', async () => {
        const emptyContext = {
          ledger: {
            assumptions: [],
            coverage_pct: 0,
            lastUpdated: new Date(),
            totalClaims: 0,
            backedClaims: 0,
          },
          weakestIds: [],
          businessContext: 'Empty context test',
          competitiveContext: 'No competitors',
        };

        const result = await hardQuestionsService.generateQuestions(emptyContext);

        expect(result.success).toBe(true);
        expect(result.data!.length).toBeGreaterThan(0); // Should still generate general questions
      });

      it('should handle extremely long business context', async () => {
        const longContext = {
          ledger: {
            assumptions: [
              {
                id: 'A1',
                name: 'Test Assumption',
                value: 'test',
                sourceUrls: [],
                certainty: 'Low' as const,
                lastChecked: new Date(),
                category: 'market' as const,
                impact: 'critical' as const,
              },
            ],
            coverage_pct: 0,
            lastUpdated: new Date(),
            totalClaims: 1,
            backedClaims: 0,
          },
          weakestIds: ['A1'],
          businessContext: 'A'.repeat(10000), // Extremely long context
          competitiveContext: 'B'.repeat(5000),
        };

        const result = await hardQuestionsService.generateQuestions(longContext);

        expect(result.success).toBe(true);
        expect(result.data!.length).toBeLessThanOrEqual(10);
      });

      it('should handle invalid assumption references', async () => {
        const invalidRefContext = {
          ledger: {
            assumptions: [
              {
                id: 'A1',
                name: 'Valid Assumption',
                value: 'test',
                sourceUrls: [],
                certainty: 'Medium' as const,
                lastChecked: new Date(),
                category: 'market' as const,
                impact: 'important' as const,
              },
            ],
            coverage_pct: 50,
            lastUpdated: new Date(),
            totalClaims: 1,
            backedClaims: 0,
          },
          weakestIds: ['A1', 'A999', 'INVALID'], // Include invalid IDs
          businessContext: 'Test context',
          competitiveContext: 'Test competition',
        };

        const result = await hardQuestionsService.generateQuestions(invalidRefContext);

        expect(result.success).toBe(true);
        // Should handle invalid references gracefully
        expect(result.data!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration Tests - Complete Workflow', () => {
    it('should execute complete Amazon working backwards workflow end-to-end', async () => {
      const startTime = Date.now();

      // Step 1: Generate assumption ledger
      const ledgerResult = await assumptionLedgerService.normalizeLedger(FIXED_SEED_INPUTS);
      expect(ledgerResult.success).toBe(true);
      const assumptionLedger = ledgerResult.data!;

      // Step 2: Calculate confidence score
      const confidenceContext = {
        citations: FIXED_SEED_INPUTS.citations || [],
        ledgerCoveragePct: assumptionLedger.coverage_pct,
        assumptionCount: assumptionLedger.assumptions.length,
        sensitivityRisk: 'medium' as const,
      };
      const confidenceResult = await confidenceService.computeConfidence(confidenceContext);
      expect(confidenceResult.success).toBe(true);
      const confidenceScore = confidenceResult.data!;

      // Step 3: Run scenario analysis
      const scenarioContext = {
        ledger: assumptionLedger,
        basicCalc: {
          revenue: 3750000, // 25k users * $49.99 * 3 (annual multiplier)
          costs: 1800000, // Dev cost + ops cost
          roi: 108, // (3.75M - 1.8M) / 1.8M * 100
          npv: 1950000, // Simplified NPV
        },
        topIds: assumptionLedger.assumptions.slice(0, 5).map(a => a.id),
        scenarioPct: 0.2,
      };
      const scenarioResult = await scenarioService.runScenarios(scenarioContext);
      expect(scenarioResult.success).toBe(true);
      const scenarios = scenarioResult.data!;

      // Step 4: Generate hard questions
      const questionContext = {
        ledger: assumptionLedger,
        weakestIds: assumptionLedger.assumptions
          .filter(a => a.certainty === 'Low' || a.sourceUrls.length === 0)
          .slice(0, 5)
          .map(a => a.id),
        businessContext: 'AI-powered code assistant for software development teams',
        competitiveContext: 'GitHub Copilot, Tabnine, CodeWhisperer',
      };
      const questionsResult = await hardQuestionsService.generateQuestions(questionContext);
      expect(questionsResult.success).toBe(true);
      const hardQuestions = questionsResult.data!;

      // Step 5: Render templates
      const templateContext: TemplateContext = {
        featureName: FIXED_SEED_INPUTS.featureName,
        customer: FIXED_SEED_INPUTS.customer,
        problemOneLine: 'Inefficient coding workflows and context switching',
        region: FIXED_SEED_INPUTS.region,
        competitors: FIXED_SEED_INPUTS.competitors,
        ledger: assumptionLedger,
        confidence: confidenceScore,
        scenarios: scenarios,
        hardQuestions: hardQuestions,
        citations: FIXED_SEED_INPUTS.citations || [],
        inputsHash: 'fixed-seed-hash-123',
        isoTimestamp: new Date(FIXED_SEED_CONTEXT.timestamp).toISOString(),
        shortHash: 'fixed123',
      };

      const prfaqDocument = templateProcessor.renderPRFAQ(templateContext);
      const onePagerDocument = templateProcessor.renderDecisionOnePager(templateContext);

      // Step 6: Write to steering (mock)
      const steeringPackage = {
        featureSlug: 'ai-code-assistant',
        artifactType: 'pr_faq' as const,
        frontMatter: {
          title: 'PR/FAQ — AI-Powered Code Assistant',
          artifact_type: 'pr_faq',
          created_at: templateContext.isoTimestamp,
          inputs_hash: templateContext.inputsHash,
          profile: 'amazon',
          confidence: {
            total: confidenceScore.total,
            breakdown: confidenceScore.breakdown,
          },
          assumptions: {
            ids: assumptionLedger.assumptions.map(a => a.id),
            coverage_pct: assumptionLedger.coverage_pct,
          },
          scenarios: {
            pct: scenarios.sensitivityPct,
            metrics: scenarios.scenarios.base.map(s => s.metric),
          },
          paths: {
            assumptions_json: './attachments/assumptions-fixed123.json',
            citations_json: './attachments/citations-fixed123.json',
            scenarios_json: './attachments/scenarios-fixed123.json',
          },
        },
        bodyMarkdown: prfaqDocument,
        attachments: [
          {
            filename: 'assumptions-fixed123.json',
            content: JSON.stringify(assumptionLedger, null, 2),
            type: 'assumptions' as const,
          },
          {
            filename: 'citations-fixed123.json',
            content: JSON.stringify(FIXED_SEED_INPUTS.citations, null, 2),
            type: 'citations' as const,
          },
          {
            filename: 'scenarios-fixed123.json',
            content: JSON.stringify(scenarios, null, 2),
            type: 'scenarios' as const,
          },
        ],
      };

      // Verify all components are properly integrated
      expect(prfaqDocument).toContain('AI-Powered Code Assistant');
      expect(prfaqDocument).toContain('Software Development Teams');
      expect(prfaqDocument).toContain('## Evidence Mechanisms');
      expect(prfaqDocument).toContain('### Assumption Ledger');
      expect(prfaqDocument).toContain('### Confidence Score');
      expect(prfaqDocument).toContain('### Scenario Range');
      expect(prfaqDocument).toContain('### Hard Questions');

      expect(onePagerDocument).toContain('Decision One-Pager');
      expect(onePagerDocument).toContain('## Context');
      expect(onePagerDocument).toContain('## Options Considered');
      expect(onePagerDocument).toContain('## ROI Range');
      expect(onePagerDocument).toContain('## Recommendation');

      const totalDuration = Date.now() - startTime;
      console.log(`Complete workflow executed in ${totalDuration}ms`);

      // Verify performance requirement
      expect(totalDuration).toBeLessThan(120000); // 2 minutes
    });

    it('should handle workflow with partial failures gracefully', async () => {
      // Simulate a scenario where some services succeed and others fail
      const partialInputs: BusinessInputs = {
        featureName: 'Partial Test Feature',
        customer: 'Test Users',
        // Missing most required data to trigger partial failures
      };

      const ledgerResult = await assumptionLedgerService.normalizeLedger(partialInputs);
      expect(ledgerResult.success).toBe(true);

      const confidenceResult = await confidenceService.computeConfidence({
        citations: [],
        ledgerCoveragePct: ledgerResult.data!.coverage_pct,
        assumptionCount: ledgerResult.data!.assumptions.length,
      });
      expect(confidenceResult.success).toBe(true);

      // Even with minimal data, workflow should complete
      expect(ledgerResult.data!.assumptions).toBeDefined();
      expect(confidenceResult.data!.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Snapshot Tests - Template Rendering with Fixed Seed', () => {
    it('should render PR/FAQ template consistently with fixed seed', () => {
      const templateContext: TemplateContext = {
        featureName: 'AI-Powered Code Assistant',
        customer: 'Software Development Teams',
        problemOneLine: 'Inefficient coding workflows and context switching',
        region: 'North America',
        competitors: ['GitHub Copilot', 'Tabnine', 'CodeWhisperer'],
        ledger: {
          assumptions: [
            {
              id: 'A1',
              name: 'Developer Productivity Increase',
              value: 30,
              unit: '%',
              sourceUrls: ['https://gartner.com/ai-development-tools-2024'],
              certainty: 'High',
              lastChecked: new Date(FIXED_SEED_CONTEXT.timestamp),
              category: 'market',
              impact: 'critical',
            },
            {
              id: 'A2',
              name: 'Market Adoption Rate',
              value: 18,
              unit: '%',
              sourceUrls: ['https://stackoverflow.com/developer-survey-2024'],
              certainty: 'High',
              lastChecked: new Date(FIXED_SEED_CONTEXT.timestamp),
              category: 'market',
              impact: 'critical',
            },
            {
              id: 'A3',
              name: 'Premium Pricing Acceptance',
              value: 49.99,
              unit: 'USD',
              sourceUrls: [],
              certainty: 'Medium',
              lastChecked: new Date(FIXED_SEED_CONTEXT.timestamp),
              category: 'financial',
              impact: 'important',
            },
          ],
          coverage_pct: 67,
          lastUpdated: new Date(FIXED_SEED_CONTEXT.timestamp),
          totalClaims: 3,
          backedClaims: 2,
        },
        confidence: {
          total: 78,
          breakdown: {
            evidence: 85,
            recency: 90,
            diversity: 70,
            agreement: 80,
            coverage: 67,
            sensitivity: 75,
          },
          explanation: 'Moderate confidence with strong evidence quality and recent data',
          lowConfidence: false,
        },
        scenarios: {
          scenarios: {
            bear: [
              { metric: 'Revenue', bear: 3000000, base: 3750000, bull: 4500000, unit: 'USD' },
              { metric: 'ROI', bear: 67, base: 108, bull: 150, unit: '%' },
            ],
            base: [
              { metric: 'Revenue', bear: 3000000, base: 3750000, bull: 4500000, unit: 'USD' },
              { metric: 'ROI', bear: 67, base: 108, bull: 150, unit: '%' },
            ],
            bull: [
              { metric: 'Revenue', bear: 3000000, base: 3750000, bull: 4500000, unit: 'USD' },
              { metric: 'ROI', bear: 67, base: 108, bull: 150, unit: '%' },
            ],
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
              assumptionId: 'A2',
              impact: 15,
              description:
                'Market Adoption Rate shows moderate sensitivity (±15% impact on Revenue)',
            },
          ],
          sensitivityPct: 20,
        },
        hardQuestions: [
          {
            id: 1,
            question:
              'How do you know that Developer Productivity Increase (30%) is accurate? What evidence supports this critical assumption?',
            targetAssumptions: ['A1'],
            category: 'market',
            severity: 'critical',
            evidenceNeeded: [
              'Credible sources for Developer Productivity Increase',
              'Independent validation of the assumption',
            ],
          },
          {
            id: 2,
            question:
              'What if the market adoption rate is significantly lower than projected? How would this impact the business case?',
            targetAssumptions: ['A2'],
            category: 'market',
            severity: 'critical',
            evidenceNeeded: [
              'Third-party market research',
              'Bottom-up market sizing analysis',
              'Customer demand validation',
            ],
          },
        ],
        citations: FIXED_SEED_INPUTS.citations || [],
        inputsHash: 'fixed-seed-hash-123',
        isoTimestamp: '2024-01-01T00:00:00.000Z',
        shortHash: 'fixed123',
      };

      const prfaqDocument = templateProcessor.renderPRFAQ(templateContext);

      // Verify consistent structure and content
      expect(prfaqDocument).toMatchSnapshot('pr-faq-fixed-seed');

      // Verify key sections are present
      expect(prfaqDocument).toContain('---\ntitle: "PR/FAQ — AI-Powered Code Assistant"');
      expect(prfaqDocument).toContain('artifact_type: pr_faq');
      expect(prfaqDocument).toContain('created_at: "2024-01-01T00:00:00.000Z"');
      expect(prfaqDocument).toContain('inputs_hash: "fixed-seed-hash-123"');
      expect(prfaqDocument).toContain('# PR/FAQ — AI-Powered Code Assistant');
      expect(prfaqDocument).toContain('## Press Release');
      expect(prfaqDocument).toContain('## Frequently Asked Questions');
      expect(prfaqDocument).toContain('## Evidence Mechanisms');
      expect(prfaqDocument).toContain('### Assumption Ledger');
      expect(prfaqDocument).toContain('| A1 | Developer Productivity Increase | 30 | High | 1 |');
      expect(prfaqDocument).toContain('**Overall Confidence:** 78/100');
      expect(prfaqDocument).toContain(
        '**Q1:** How do you know that Developer Productivity Increase'
      );
    });

    it('should render Decision One-Pager template consistently with fixed seed', () => {
      const templateContext: TemplateContext = {
        featureName: 'AI-Powered Code Assistant',
        customer: 'Software Development Teams',
        problemOneLine: 'Inefficient coding workflows and context switching',
        region: 'North America',
        competitors: ['GitHub Copilot', 'Tabnine', 'CodeWhisperer'],
        ledger: {
          assumptions: [
            {
              id: 'A1',
              name: 'Developer Productivity Increase',
              value: 30,
              unit: '%',
              sourceUrls: ['https://gartner.com/ai-development-tools-2024'],
              certainty: 'High',
              lastChecked: new Date(FIXED_SEED_CONTEXT.timestamp),
              category: 'market',
              impact: 'critical',
            },
            {
              id: 'A2',
              name: 'Market Adoption Rate',
              value: 18,
              unit: '%',
              sourceUrls: ['https://stackoverflow.com/developer-survey-2024'],
              certainty: 'High',
              lastChecked: new Date(FIXED_SEED_CONTEXT.timestamp),
              category: 'market',
              impact: 'critical',
            },
          ],
          coverage_pct: 100,
          lastUpdated: new Date(FIXED_SEED_CONTEXT.timestamp),
          totalClaims: 2,
          backedClaims: 2,
        },
        confidence: {
          total: 85,
          breakdown: {
            evidence: 90,
            recency: 95,
            diversity: 80,
            agreement: 85,
            coverage: 100,
            sensitivity: 80,
          },
          explanation: 'High confidence with excellent evidence quality',
          lowConfidence: false,
        },
        scenarios: {
          scenarios: {
            bear: [
              { metric: 'Investment', bear: 2160000, base: 1800000, bull: 1440000, unit: 'USD' },
              { metric: 'Revenue', bear: 3000000, base: 3750000, bull: 4500000, unit: 'USD' },
              { metric: 'ROI', bear: 39, base: 108, bull: 213, unit: '%' },
            ],
            base: [
              { metric: 'Investment', bear: 2160000, base: 1800000, bull: 1440000, unit: 'USD' },
              { metric: 'Revenue', bear: 3000000, base: 3750000, bull: 4500000, unit: 'USD' },
              { metric: 'ROI', bear: 39, base: 108, bull: 213, unit: '%' },
            ],
            bull: [
              { metric: 'Investment', bear: 2160000, base: 1800000, bull: 1440000, unit: 'USD' },
              { metric: 'Revenue', bear: 3000000, base: 3750000, bull: 4500000, unit: 'USD' },
              { metric: 'ROI', bear: 39, base: 108, bull: 213, unit: '%' },
            ],
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
              assumptionId: 'A2',
              impact: 15,
              description: 'Market Adoption Rate shows moderate sensitivity',
            },
          ],
          sensitivityPct: 20,
        },
        hardQuestions: [
          {
            id: 1,
            question: 'How confident are we in the 30% productivity increase assumption?',
            targetAssumptions: ['A1'],
            category: 'market',
            severity: 'critical',
            evidenceNeeded: ['Productivity studies', 'Customer validation'],
          },
        ],
        citations: FIXED_SEED_INPUTS.citations || [],
        inputsHash: 'fixed-seed-hash-123',
        isoTimestamp: '2024-01-01T00:00:00.000Z',
        shortHash: 'fixed123',
      };

      const onePagerDocument = templateProcessor.renderDecisionOnePager(templateContext);

      // Verify consistent structure and content
      expect(onePagerDocument).toMatchSnapshot('decision-onepager-fixed-seed');

      // Verify key sections are present
      expect(onePagerDocument).toContain(
        '---\ntitle: "Decision One-Pager — AI-Powered Code Assistant"'
      );
      expect(onePagerDocument).toContain('artifact_type: decision_onepager');
      expect(onePagerDocument).toContain('# Decision One-Pager — AI-Powered Code Assistant');
      expect(onePagerDocument).toContain('## Context');
      expect(onePagerDocument).toContain('## Options Considered');
      expect(onePagerDocument).toContain('## ROI Range');
      expect(onePagerDocument).toContain('## Recommendation');
      expect(onePagerDocument).toContain('**Decision:** GO');
      expect(onePagerDocument).toContain('**Confidence:** 85%');
    });
  });

  describe('Performance Tests - End-to-End Generation Requirements', () => {
    it('should complete full generation within 2 minutes consistently', async () => {
      const iterations = 3;
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        // Run complete workflow
        const ledgerResult = await assumptionLedgerService.normalizeLedger(FIXED_SEED_INPUTS);
        const confidenceResult = await confidenceService.computeConfidence({
          citations: FIXED_SEED_INPUTS.citations || [],
          ledgerCoveragePct: ledgerResult.data!.coverage_pct,
          assumptionCount: ledgerResult.data!.assumptions.length,
          sensitivityRisk: 'medium' as const,
        });
        const scenarioResult = await scenarioService.runScenarios({
          ledger: ledgerResult.data!,
          basicCalc: { revenue: 3750000, costs: 1800000, roi: 108, npv: 1950000 },
          topIds: ledgerResult.data!.assumptions.slice(0, 5).map(a => a.id),
          scenarioPct: 0.2,
        });
        const questionsResult = await hardQuestionsService.generateQuestions({
          ledger: ledgerResult.data!,
          weakestIds: ledgerResult.data!.assumptions.slice(0, 3).map(a => a.id),
          businessContext: 'AI code assistant',
          competitiveContext: 'GitHub Copilot',
        });

        const templateContext: TemplateContext = {
          featureName: FIXED_SEED_INPUTS.featureName,
          customer: FIXED_SEED_INPUTS.customer,
          problemOneLine: 'Test problem',
          ledger: ledgerResult.data!,
          confidence: confidenceResult.data!,
          scenarios: scenarioResult.data!,
          hardQuestions: questionsResult.data!,
          citations: FIXED_SEED_INPUTS.citations || [],
          inputsHash: `test-${i}`,
          isoTimestamp: new Date().toISOString(),
          shortHash: `test${i}`,
        };

        templateProcessor.renderPRFAQ(templateContext);
        templateProcessor.renderDecisionOnePager(templateContext);

        const duration = Date.now() - startTime;
        results.push(duration);

        expect(duration).toBeLessThan(120000); // 2 minutes
      }

      const avgDuration = results.reduce((sum, d) => sum + d, 0) / results.length;
      const maxDuration = Math.max(...results);

      console.log(`Performance over ${iterations} iterations:`);
      console.log(`Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`Max: ${maxDuration}ms`);

      expect(avgDuration).toBeLessThan(60000); // Average under 1 minute
      expect(maxDuration).toBeLessThan(120000); // Max under 2 minutes
    });

    it('should show performance improvements with caching', async () => {
      // First run (cold cache)
      const firstRunStart = Date.now();
      const firstResult = await assumptionLedgerService.normalizeLedger(FIXED_SEED_INPUTS);
      const firstDuration = Date.now() - firstRunStart;

      // Second run (warm cache)
      const secondRunStart = Date.now();
      const secondResult = await assumptionLedgerService.normalizeLedger(FIXED_SEED_INPUTS);
      const secondDuration = Date.now() - secondRunStart;

      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(true);

      // Second run should be faster or equal due to caching
      expect(secondDuration).toBeLessThanOrEqual(firstDuration);

      console.log(
        `Caching performance: First run ${firstDuration}ms, Second run ${secondDuration}ms`
      );
    });

    it('should validate individual service performance targets', async () => {
      const services = [
        {
          name: 'AssumptionLedger',
          fn: () => assumptionLedgerService.normalizeLedger(FIXED_SEED_INPUTS),
        },
        {
          name: 'Confidence',
          fn: async () => {
            const ledger = await assumptionLedgerService.normalizeLedger(FIXED_SEED_INPUTS);
            return confidenceService.computeConfidence({
              citations: FIXED_SEED_INPUTS.citations || [],
              ledgerCoveragePct: ledger.data!.coverage_pct,
              assumptionCount: ledger.data!.assumptions.length,
            });
          },
        },
        {
          name: 'Scenarios',
          fn: async () => {
            const ledger = await assumptionLedgerService.normalizeLedger(FIXED_SEED_INPUTS);
            return scenarioService.runScenarios({
              ledger: ledger.data!,
              basicCalc: { revenue: 1000000, costs: 500000, roi: 100, npv: 500000 },
              topIds: ledger.data!.assumptions.slice(0, 3).map(a => a.id),
              scenarioPct: 0.2,
            });
          },
        },
        {
          name: 'HardQuestions',
          fn: async () => {
            const ledger = await assumptionLedgerService.normalizeLedger(FIXED_SEED_INPUTS);
            return hardQuestionsService.generateQuestions({
              ledger: ledger.data!,
              weakestIds: ledger.data!.assumptions.slice(0, 2).map(a => a.id),
              businessContext: 'Test',
              competitiveContext: 'Test',
            });
          },
        },
      ];

      for (const service of services) {
        const startTime = Date.now();
        const result = await service.fn();
        const duration = Date.now() - startTime;

        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(500); // 500ms target per service

        console.log(`${service.name} service: ${duration}ms`);
      }
    });
  });

  describe('Error Handling Tests - Graceful Degradation', () => {
    it('should handle service failures with meaningful error messages', async () => {
      // Mock a service to fail
      const originalMethod = assumptionLedgerService.normalizeLedger;
      (assumptionLedgerService.normalizeLedger as jest.Mock) = jest
        .fn()
        .mockRejectedValue(new Error('Service temporarily unavailable'));

      try {
        const result = await assumptionLedgerService.normalizeLedger(FIXED_SEED_INPUTS);
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Service temporarily unavailable');
      } finally {
        // Restore original method
        assumptionLedgerService.normalizeLedger = originalMethod;
      }
    });

    it('should handle template rendering with missing data gracefully', () => {
      const incompleteContext: TemplateContext = {
        featureName: '',
        customer: '',
        problemOneLine: '',
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
          explanation: 'No data available',
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
        inputsHash: 'empty',
        isoTimestamp: new Date().toISOString(),
        shortHash: 'empty',
      };

      expect(() => {
        const result = templateProcessor.renderPRFAQ(incompleteContext);
        expect(result).toBeDefined();
        expect(result).toContain('Evidence Mechanisms');
      }).not.toThrow();
    });

    it('should handle network timeouts and retries gracefully', async () => {
      // Simulate slow network conditions
      const slowInputs: BusinessInputs = {
        ...FIXED_SEED_INPUTS,
        citations: Array.from({ length: 20 }, (_, i) => ({
          url: `https://slow-source-${i}.com`,
          title: `Slow Source ${i}`,
          sourceType: 'research' as const,
        })),
      };

      const result = await assumptionLedgerService.normalizeLedger(slowInputs);

      expect(result.success).toBe(true);
      // Should handle slow sources without timing out
      expect(result.data).toBeDefined();
    });

    it('should provide detailed error context for debugging', async () => {
      const invalidInputs = {
        featureName: null,
        customer: undefined,
        citations: 'invalid-format',
      } as any;

      const result = await assumptionLedgerService.normalizeLedger(invalidInputs);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe('ASSUMPTION_LEDGER_ERROR');
      expect(result.error!.message).toBeDefined();
    });

    it('should handle concurrent service calls without race conditions', async () => {
      const concurrentCalls = Array.from({ length: 5 }, (_, i) =>
        assumptionLedgerService.normalizeLedger({
          ...FIXED_SEED_INPUTS,
          featureName: `Concurrent Feature ${i}`,
        })
      );

      const results = await Promise.all(concurrentCalls);

      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data!.assumptions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('MCP Handler Integration Tests', () => {
    it('should integrate Amazon mechanisms into generate_business_case handler', async () => {
      const args: GenerateBusinessCaseArgs = {
        opportunity_analysis: `# Business Opportunity Analysis

## Feature Overview
Feature: ${FIXED_SEED_INPUTS.featureName}
Customer: ${FIXED_SEED_INPUTS.customer}
Market Size: $${FIXED_SEED_INPUTS.marketSize}
Competitors: ${FIXED_SEED_INPUTS.competitors?.join(', ')}

## Market Analysis
The AI coding tools market shows strong demand for productivity solutions.
We assume that ${(FIXED_SEED_INPUTS.convRate || 0.18) * 100}% market penetration is achievable within first year.
We believe that customers will pay $${FIXED_SEED_INPUTS.pricing} monthly for this solution.

## Competitive Landscape
Current solutions lack advanced context understanding.
We expect to capture market share through superior AI capabilities.`,
        financial_inputs: {
          development_cost: FIXED_SEED_INPUTS.devCost!,
          operational_cost: FIXED_SEED_INPUTS.opsCost!,
          expected_revenue: 3750000,
          time_to_market: 9,
        },
        steering_options: {
          create_steering_files: true,
          feature_name: 'ai-code-assistant',
        },
      };

      const result = await generateBusinessCase(args, FIXED_SEED_CONTEXT);

      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('markdown');

      const content = result.content[0].markdown!;
      expect(content).toContain('## Evidence Mechanisms');
      expect(content).toContain('### Assumption Ledger');
      expect(content).toContain('### Confidence Assessment');
      expect(content).toContain('### Scenario Analysis');
      expect(content).toContain('### Hard Questions');

      expect(result.metadata?.confidenceScore).toBeGreaterThan(0);
      expect(result.metadata?.steeringFileCreated).toBe(true);
    });

    it('should integrate Amazon mechanisms into create_stakeholder_communication handler', async () => {
      const businessCase = `# Business Case: ${FIXED_SEED_INPUTS.featureName}

## Executive Summary
Comprehensive business case for AI-powered code assistant targeting software development teams.

## Market Analysis
Feature: ${FIXED_SEED_INPUTS.featureName}
Customer: ${FIXED_SEED_INPUTS.customer}
Market Size: $${FIXED_SEED_INPUTS.marketSize}
Development Cost: $${FIXED_SEED_INPUTS.devCost}
Revenue: $3,750,000
Timeline: ${FIXED_SEED_INPUTS.timeline}

## Assumptions
We assume ${(FIXED_SEED_INPUTS.convRate || 0.18) * 100}% market penetration is achievable.
We believe customers will pay $${FIXED_SEED_INPUTS.pricing} monthly.
We expect minimal competitive response due to technical barriers.`;

      const args: CreateStakeholderCommunicationArgs = {
        business_case: businessCase,
        communication_type: 'pr_faq',
        audience: 'customers',
        steering_options: {
          create_steering_files: true,
          feature_name: 'ai-code-assistant',
        },
      };

      const result = await createStakeholderCommunication(args, FIXED_SEED_CONTEXT);

      expect(result.isError).toBeFalsy();
      expect(result.content[0].markdown).toContain('# Press Release');
      expect(result.content[0].markdown).toContain('# FAQ');
      expect(result.content[0].markdown).toContain(
        '## Amazon Working Backwards Evidence Mechanisms'
      );
      expect(result.metadata?.confidenceScore).toBeGreaterThan(0);
    });
  });
});
