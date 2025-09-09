/**
 * Integration tests for Amazon Working Backwards - All Mechanism Services
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  AssumptionLedgerService, 
  ConfidenceService, 
  ScenarioService, 
  HardQuestionsService,
  type BusinessInputs 
} from '../../services/amazon/index';
import { ConfidenceContext } from '../../models/confidence';
import { ScenarioContext } from '../../models/scenarios';
import { QuestionContext } from '../../models/questions';

describe('Amazon Mechanism Services Integration', () => {
  let assumptionService: AssumptionLedgerService;
  let confidenceService: ConfidenceService;
  let scenarioService: ScenarioService;
  let questionsService: HardQuestionsService;
  let sampleInputs: BusinessInputs;

  beforeEach(() => {
    assumptionService = new AssumptionLedgerService();
    confidenceService = new ConfidenceService();
    scenarioService = new ScenarioService();
    questionsService = new HardQuestionsService();

    sampleInputs = {
      featureName: 'AI-Powered Analytics Dashboard',
      customer: 'Enterprise data teams',
      region: 'North America',
      competitors: ['Tableau', 'Power BI', 'Looker'],
      pricing: 299,
      users: 50000,
      convRate: 12,
      devCost: 2000000,
      opsCost: 200000,
      marketSize: 50000000,
      competitiveAdvantage: 'AI-native architecture with real-time insights',
      timeline: '12 months',
      citations: [
        {
          url: 'https://gartner.com/analytics-market-2024',
          title: 'Analytics Market Report 2024',
          date: '2024-01-15',
          rating: 'A',
          snippet: 'Analytics market growing at 15% CAGR',
          sourceType: 'industry_report'
        },
        {
          url: 'https://forrester.com/enterprise-analytics',
          title: 'Enterprise Analytics Trends',
          date: '2024-02-01',
          rating: 'A',
          snippet: 'AI-powered analytics seeing rapid adoption',
          sourceType: 'research'
        },
        {
          url: 'https://techcrunch.com/analytics-funding',
          title: 'Analytics Startups Raise $2B',
          date: '2024-01-30',
          rating: 'B',
          snippet: 'Investors bullish on analytics space',
          sourceType: 'news'
        }
      ],
      assumptions: [
        'Enterprise customers will pay premium for AI features',
        'Market adoption of AI analytics will accelerate in 2024'
      ]
    };
  });

  describe('End-to-End Amazon Working Backwards Pipeline', () => {
    it('should execute complete pipeline from inputs to all mechanisms', async () => {
      // Step 1: Generate assumption ledger
      const ledgerResult = await assumptionService.normalizeLedger(sampleInputs);
      expect(ledgerResult.success).toBe(true);
      const ledger = ledgerResult.data!;

      // Step 2: Calculate confidence score
      const confidenceContext: ConfidenceContext = {
        citations: sampleInputs.citations!,
        ledgerCoveragePct: ledger.coverage_pct,
        assumptionCount: ledger.assumptions.length,
        sensitivityRisk: 'medium'
      };

      const confidenceResult = await confidenceService.computeConfidence(confidenceContext);
      expect(confidenceResult.success).toBe(true);
      const confidence = confidenceResult.data!;

      // Step 3: Run scenario analysis
      const scenarioContext: ScenarioContext = {
        ledger,
        basicCalc: {
          revenue: sampleInputs.pricing! * sampleInputs.users! * (sampleInputs.convRate! / 100),
          costs: sampleInputs.devCost! + sampleInputs.opsCost!,
          roi: 0, // Will be calculated
          npv: 0   // Will be calculated
        },
        topIds: ledger.assumptions.filter(a => a.impact === 'critical').map(a => a.id),
        scenarioPct: 0.2
      };

      // Calculate ROI and NPV
      scenarioContext.basicCalc.roi = ((scenarioContext.basicCalc.revenue - scenarioContext.basicCalc.costs) / scenarioContext.basicCalc.costs) * 100;
      scenarioContext.basicCalc.npv = scenarioContext.basicCalc.revenue - scenarioContext.basicCalc.costs;

      const scenarioResult = await scenarioService.runScenarios(scenarioContext);
      expect(scenarioResult.success).toBe(true);
      const scenarios = scenarioResult.data!;

      // Step 4: Generate hard questions
      const questionContext: QuestionContext = {
        ledger,
        weakestIds: ledger.assumptions.filter(a => a.certainty === 'Low').map(a => a.id),
        businessContext: `${sampleInputs.featureName} for ${sampleInputs.customer}`,
        competitiveContext: `Competing with ${sampleInputs.competitors?.join(', ')}`
      };

      const questionsResult = await questionsService.generateQuestions(questionContext);
      expect(questionsResult.success).toBe(true);
      const questions = questionsResult.data!;

      // Verify all mechanisms produced valid outputs
      expect(ledger.assumptions.length).toBeGreaterThan(0);
      expect(confidence.total).toBeGreaterThanOrEqual(0);
      expect(confidence.total).toBeLessThanOrEqual(100);
      expect(scenarios.scenarios.bear.length).toBeGreaterThan(0);
      expect(scenarios.scenarios.base.length).toBeGreaterThan(0);
      expect(scenarios.scenarios.bull.length).toBeGreaterThan(0);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(10);
    });

    it('should maintain data consistency across all mechanisms', async () => {
      // Generate all mechanism outputs
      const ledgerResult = await assumptionService.normalizeLedger(sampleInputs);
      const ledger = ledgerResult.data!;

      const confidenceContext: ConfidenceContext = {
        citations: sampleInputs.citations!,
        ledgerCoveragePct: ledger.coverage_pct,
        assumptionCount: ledger.assumptions.length
      };

      const confidenceResult = await confidenceService.computeConfidence(confidenceContext);
      const confidence = confidenceResult.data!;

      const scenarioContext: ScenarioContext = {
        ledger,
        basicCalc: { revenue: 1000000, costs: 500000, roi: 100, npv: 500000 },
        topIds: ledger.assumptions.slice(0, 3).map(a => a.id),
        scenarioPct: 0.2
      };

      const scenarioResult = await scenarioService.runScenarios(scenarioContext);
      const scenarios = scenarioResult.data!;

      const questionContext: QuestionContext = {
        ledger,
        weakestIds: ledger.assumptions.filter(a => a.certainty === 'Low').map(a => a.id),
        businessContext: sampleInputs.featureName
      };

      const questionsResult = await questionsService.generateQuestions(questionContext);
      const questions = questionsResult.data!;

      // Verify cross-mechanism consistency
      
      // Confidence should reflect ledger coverage
      expect(confidence.breakdown.coverage).toBe(ledger.coverage_pct);

      // Scenarios should reference ledger assumptions
      expect(scenarios.keyDrivers.every(driver => 
        ledger.assumptions.some(a => a.id === driver.assumptionId)
      )).toBe(true);

      // Questions should target actual assumption IDs
      const allAssumptionIds = ledger.assumptions.map(a => a.id);
      questions.forEach(question => {
        question.targetAssumptions.forEach(id => {
          expect(allAssumptionIds).toContain(id);
        });
      });

      // Scenario sensitivity percentage should match context
      expect(scenarios.sensitivityPct).toBe(20);
    });

    it('should handle edge cases gracefully across all services', async () => {
      // Test with minimal inputs
      const minimalInputs: BusinessInputs = {
        featureName: 'Minimal Feature',
        customer: 'Test Customer'
      };

      const ledgerResult = await assumptionService.normalizeLedger(minimalInputs);
      expect(ledgerResult.success).toBe(true);
      const ledger = ledgerResult.data!;

      const confidenceContext: ConfidenceContext = {
        citations: [],
        ledgerCoveragePct: ledger.coverage_pct,
        assumptionCount: ledger.assumptions.length
      };

      const confidenceResult = await confidenceService.computeConfidence(confidenceContext);
      expect(confidenceResult.success).toBe(true);

      const scenarioContext: ScenarioContext = {
        ledger,
        basicCalc: { revenue: 0, costs: 0, roi: 0, npv: 0 },
        topIds: [],
        scenarioPct: 0.2
      };

      const scenarioResult = await scenarioService.runScenarios(scenarioContext);
      expect(scenarioResult.success).toBe(true);

      const questionContext: QuestionContext = {
        ledger,
        weakestIds: [],
        businessContext: minimalInputs.featureName
      };

      const questionsResult = await questionsService.generateQuestions(questionContext);
      expect(questionsResult.success).toBe(true);

      // All services should handle minimal inputs without errors
      expect(ledgerResult.success).toBe(true);
      expect(confidenceResult.success).toBe(true);
      expect(scenarioResult.success).toBe(true);
      expect(questionsResult.success).toBe(true);
    });

    it('should produce deterministic outputs for identical inputs', async () => {
      // Run pipeline twice with identical inputs
      const run1Results = await runFullPipeline(sampleInputs);
      const run2Results = await runFullPipeline(sampleInputs);

      // Results should be identical (deterministic)
      expect(run1Results.ledger.assumptions.length).toBe(run2Results.ledger.assumptions.length);
      expect(run1Results.ledger.coverage_pct).toBe(run2Results.ledger.coverage_pct);
      
      expect(run1Results.confidence.total).toBe(run2Results.confidence.total);
      expect(run1Results.confidence.breakdown).toEqual(run2Results.confidence.breakdown);
      
      expect(run1Results.scenarios.sensitivityPct).toBe(run2Results.scenarios.sensitivityPct);
      expect(run1Results.scenarios.scenarios.base.length).toBe(run2Results.scenarios.scenarios.base.length);
      
      expect(run1Results.questions.length).toBe(run2Results.questions.length);
    });

    it('should complete full pipeline within performance requirements', async () => {
      const startTime = Date.now();
      
      await runFullPipeline(sampleInputs);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Should complete within 2 seconds (2000ms) for integration test
      expect(executionTime).toBeLessThan(2000);
    });
  });

  describe('Service Interdependencies', () => {
    it('should use assumption ledger output in confidence calculation', async () => {
      const ledgerResult = await assumptionService.normalizeLedger(sampleInputs);
      const ledger = ledgerResult.data!;

      const confidenceContext: ConfidenceContext = {
        citations: sampleInputs.citations!,
        ledgerCoveragePct: ledger.coverage_pct,
        assumptionCount: ledger.assumptions.length
      };

      const confidenceResult = await confidenceService.computeConfidence(confidenceContext);
      const confidence = confidenceResult.data!;

      // Confidence coverage should match ledger coverage
      expect(confidence.breakdown.coverage).toBe(ledger.coverage_pct);
    });

    it('should use assumption ledger in scenario analysis', async () => {
      const ledgerResult = await assumptionService.normalizeLedger(sampleInputs);
      const ledger = ledgerResult.data!;

      const scenarioContext: ScenarioContext = {
        ledger,
        basicCalc: { revenue: 1000000, costs: 500000, roi: 100, npv: 500000 },
        topIds: ledger.assumptions.filter(a => a.impact === 'critical').map(a => a.id),
        scenarioPct: 0.2
      };

      const scenarioResult = await scenarioService.runScenarios(scenarioContext);
      const scenarios = scenarioResult.data!;

      // Key drivers should reference actual assumptions from ledger
      scenarios.keyDrivers.forEach(driver => {
        const assumption = ledger.assumptions.find(a => a.id === driver.assumptionId);
        expect(assumption).toBeDefined();
        expect(assumption!.impact).toBe('critical');
      });
    });

    it('should use assumption ledger in hard questions generation', async () => {
      const ledgerResult = await assumptionService.normalizeLedger(sampleInputs);
      const ledger = ledgerResult.data!;

      const questionContext: QuestionContext = {
        ledger,
        weakestIds: ledger.assumptions.filter(a => a.certainty === 'Low').map(a => a.id),
        businessContext: sampleInputs.featureName
      };

      const questionsResult = await questionsService.generateQuestions(questionContext);
      const questions = questionsResult.data!;

      // Questions should target assumptions from the ledger
      const allAssumptionIds = ledger.assumptions.map(a => a.id);
      questions.forEach(question => {
        question.targetAssumptions.forEach(id => {
          expect(allAssumptionIds).toContain(id);
        });
      });
    });
  });

  // Helper function to run full pipeline
  async function runFullPipeline(inputs: BusinessInputs) {
    const ledgerResult = await assumptionService.normalizeLedger(inputs);
    const ledger = ledgerResult.data!;

    const confidenceContext: ConfidenceContext = {
      citations: inputs.citations || [],
      ledgerCoveragePct: ledger.coverage_pct,
      assumptionCount: ledger.assumptions.length
    };

    const confidenceResult = await confidenceService.computeConfidence(confidenceContext);
    const confidence = confidenceResult.data!;

    const scenarioContext: ScenarioContext = {
      ledger,
      basicCalc: {
        revenue: (inputs.pricing || 0) * (inputs.users || 0) * ((inputs.convRate || 0) / 100),
        costs: (inputs.devCost || 0) + (inputs.opsCost || 0),
        roi: 0,
        npv: 0
      },
      topIds: ledger.assumptions.filter(a => a.impact === 'critical').map(a => a.id),
      scenarioPct: 0.2
    };

    scenarioContext.basicCalc.roi = scenarioContext.basicCalc.revenue > 0 && scenarioContext.basicCalc.costs > 0 
      ? ((scenarioContext.basicCalc.revenue - scenarioContext.basicCalc.costs) / scenarioContext.basicCalc.costs) * 100 
      : 0;
    scenarioContext.basicCalc.npv = scenarioContext.basicCalc.revenue - scenarioContext.basicCalc.costs;

    const scenarioResult = await scenarioService.runScenarios(scenarioContext);
    const scenarios = scenarioResult.data!;

    const questionContext: QuestionContext = {
      ledger,
      weakestIds: ledger.assumptions.filter(a => a.certainty === 'Low').map(a => a.id),
      businessContext: inputs.featureName,
      competitiveContext: inputs.competitors?.join(', ')
    };

    const questionsResult = await questionsService.generateQuestions(questionContext);
    const questions = questionsResult.data!;

    return {
      ledger,
      confidence,
      scenarios,
      questions
    };
  }
});