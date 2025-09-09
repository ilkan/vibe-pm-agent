/**
 * End-to-end integration test for Amazon Working Backwards Steering Integration
 * Tests the complete workflow from business inputs to Kiro steering files
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  AssumptionLedgerService, 
  ConfidenceService, 
  ScenarioService, 
  HardQuestionsService,
  SteeringWriter,
  BusinessInputs 
} from '../../services/amazon';
import { readFile, rm, access } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp } from 'fs/promises';

describe('Amazon Steering End-to-End Integration', () => {
  let tempDir: string;
  let assumptionLedgerService: AssumptionLedgerService;
  let confidenceService: ConfidenceService;
  let scenarioService: ScenarioService;
  let hardQuestionsService: HardQuestionsService;
  let steeringWriter: SteeringWriter;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await mkdtemp(join(tmpdir(), 'amazon-e2e-test-'));
    
    // Initialize all services
    assumptionLedgerService = new AssumptionLedgerService();
    confidenceService = new ConfidenceService();
    scenarioService = new ScenarioService();
    hardQuestionsService = new HardQuestionsService();
    steeringWriter = new SteeringWriter(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Complete Amazon Working Backwards Workflow', () => {
    it('should process business inputs through all mechanisms and generate steering files', async () => {
      // Step 1: Define comprehensive business inputs
      const businessInputs: BusinessInputs = {
        featureName: 'AI-Powered Customer Analytics Platform',
        customer: 'Enterprise SaaS Companies',
        region: 'North America',
        competitors: ['Mixpanel', 'Amplitude', 'Adobe Analytics'],
        pricing: 499,
        users: 75000,
        convRate: 0.12,
        devCost: 3500000,
        opsCost: 750000,
        marketSize: 25000000000,
        competitiveAdvantage: 'Real-time AI-driven customer behavior prediction with 95% accuracy',
        timeline: '24 months',
        citations: [
          {
            url: 'https://gartner.com/customer-analytics-market-2024',
            title: 'Customer Analytics Market Report 2024',
            date: '2024-02-15',
            rating: 'A',
            snippet: 'Customer analytics market growing at 23% CAGR, reaching $25B by 2026',
            sourceType: 'industry_report'
          },
          {
            url: 'https://mckinsey.com/ai-analytics-pricing-study',
            title: 'AI Analytics Pricing Benchmarks',
            date: '2024-01-20',
            rating: 'A',
            snippet: 'Enterprise AI analytics platforms average $400-600 per user annually',
            sourceType: 'research'
          }
        ],
        assumptions: [
          'AI accuracy will maintain 95% prediction rate at scale',
          'Enterprise customers willing to pay premium for real-time insights'
        ]
      };

      // Step 2: Generate assumption ledger
      const ledgerResult = await assumptionLedgerService.normalizeLedger(businessInputs);
      expect(ledgerResult.success).toBe(true);
      const ledger = ledgerResult.data!;
      
      expect(ledger.assumptions.length).toBeGreaterThan(5);
      expect(ledger.coverage_pct).toBeGreaterThan(0);

      // Step 3: Calculate confidence score
      const confidenceResult = await confidenceService.computeConfidence({
        citations: businessInputs.citations || [],
        ledgerCoveragePct: ledger.coverage_pct,
        assumptionCount: ledger.assumptions.length,
        sensitivityRisk: 'medium'
      });
      expect(confidenceResult.success).toBe(true);
      const confidence = confidenceResult.data!;
      
      expect(confidence.total).toBeGreaterThan(0);
      expect(confidence.total).toBeLessThanOrEqual(100);
      expect(confidence.breakdown.evidence).toBeGreaterThan(0);

      // Step 4: Run scenario analysis
      const basicFinancialModel = {
        revenue: (businessInputs.users || 0) * (businessInputs.pricing || 0),
        costs: (businessInputs.devCost || 0) + (businessInputs.opsCost || 0),
        roi: 0, // Will be calculated
        npv: 0  // Will be calculated
      };
      basicFinancialModel.roi = ((basicFinancialModel.revenue - basicFinancialModel.costs) / basicFinancialModel.costs) * 100;
      basicFinancialModel.npv = basicFinancialModel.revenue - basicFinancialModel.costs;

      const scenarioResult = await scenarioService.runScenarios({
        ledger,
        basicCalc: basicFinancialModel,
        topIds: ledger.assumptions.slice(0, 5).map(a => a.id),
        scenarioPct: 0.2
      });
      expect(scenarioResult.success).toBe(true);
      const scenarios = scenarioResult.data!;
      
      expect(scenarios.scenarios.base.length).toBeGreaterThan(0);
      expect(scenarios.elasticities.length).toBeGreaterThan(0);
      expect(scenarios.keyDrivers.length).toBeGreaterThan(0);

      // Step 5: Generate hard questions
      const weakestIds = ledger.assumptions
        .filter(a => a.certainty === 'Low' || a.sourceUrls.length === 0)
        .map(a => a.id)
        .slice(0, 3);

      const questionsResult = await hardQuestionsService.generateQuestions({
        ledger,
        weakestIds,
        businessContext: `${businessInputs.featureName} for ${businessInputs.customer}`,
        competitiveContext: businessInputs.competitors?.join(', ')
      });
      expect(questionsResult.success).toBe(true);
      const hardQuestions = questionsResult.data!;
      
      expect(hardQuestions.length).toBeGreaterThan(0);
      expect(hardQuestions.length).toBeLessThanOrEqual(10);

      // Step 6: Generate inputs hash
      const inputsHash = steeringWriter.generateInputsHash(businessInputs);
      expect(inputsHash).toHaveLength(64);

      // Step 7: Create and write PR/FAQ steering package
      const prfaqPackage = steeringWriter.createSteeringPackage(
        businessInputs.featureName,
        'pr_faq',
        generateSamplePRFAQ(businessInputs, ledger, confidence, scenarios),
        ledger,
        confidence,
        scenarios,
        hardQuestions,
        businessInputs.citations || [],
        inputsHash
      );

      const prfaqResult = await steeringWriter.writeSteering(prfaqPackage);
      expect(prfaqResult.success).toBe(true);

      // Step 8: Create and write Decision One-Pager steering package
      const onepagerPackage = steeringWriter.createSteeringPackage(
        businessInputs.featureName,
        'decision_onepager',
        generateSampleOnePager(businessInputs, ledger, confidence, scenarios),
        ledger,
        confidence,
        scenarios,
        hardQuestions,
        businessInputs.citations || [],
        inputsHash
      );

      const onepagerResult = await steeringWriter.writeSteering(onepagerPackage);
      expect(onepagerResult.success).toBe(true);

      // Step 9: Verify complete file structure was created
      const featureSlug = 'ai-powered-customer-analytics-platform';
      const baseDir = join(tempDir, '.kiro', 'steering', 'working-backwards', featureSlug);
      
      // Check main directory exists
      await expect(access(baseDir)).resolves.not.toThrow();
      
      // Check attachments directory exists
      const attachmentsDir = join(baseDir, 'attachments');
      await expect(access(attachmentsDir)).resolves.not.toThrow();
      
      // Check latest.json exists
      const latestPath = join(baseDir, 'latest.json');
      await expect(access(latestPath)).resolves.not.toThrow();
      
      // Verify latest.json content
      const latestContent = await readFile(latestPath, 'utf-8');
      const latestData = JSON.parse(latestContent);
      expect(latestData.featureSlug).toBe(featureSlug);
      expect(latestData.artifactFilename).toBeDefined();
      expect(latestData.attachmentPaths).toHaveLength(3);

      // Step 10: Verify PR/FAQ document structure
      const prfaqPath = prfaqResult.data!.artifactPath;
      const prfaqContent = await readFile(prfaqPath, 'utf-8');
      
      // Check YAML front matter
      expect(prfaqContent).toContain('---');
      expect(prfaqContent).toContain('title: "PR/FAQ — AI-Powered Customer Analytics Platform"');
      expect(prfaqContent).toContain('artifact_type: pr_faq');
      expect(prfaqContent).toContain('profile: "amazon"');
      expect(prfaqContent).toContain(`inputs_hash: "${inputsHash}"`);
      
      // Check confidence data in front matter
      expect(prfaqContent).toContain('confidence:');
      expect(prfaqContent).toContain(`total: ${confidence.total}`);
      expect(prfaqContent).toContain('breakdown:');
      
      // Check assumptions data in front matter
      expect(prfaqContent).toContain('assumptions:');
      expect(prfaqContent).toContain('coverage_pct:');
      
      // Check scenarios data in front matter
      expect(prfaqContent).toContain('scenarios:');
      expect(prfaqContent).toContain('pct: 20');
      
      // Check attachment paths in front matter
      expect(prfaqContent).toContain('paths:');
      expect(prfaqContent).toContain('assumptions_json:');
      expect(prfaqContent).toContain('citations_json:');
      expect(prfaqContent).toContain('scenarios_json:');

      // Step 11: Verify Decision One-Pager document structure
      const onepagerPath = onepagerResult.data!.artifactPath;
      const onepagerContent = await readFile(onepagerPath, 'utf-8');
      
      expect(onepagerContent).toContain('title: "Decision One-Pager — AI-Powered Customer Analytics Platform"');
      expect(onepagerContent).toContain('artifact_type: decision_onepager');

      // Step 12: Verify all JSON attachments are valid and complete
      const shortHash = inputsHash.substring(0, 8);
      
      // Check assumptions attachment
      const assumptionsPath = join(attachmentsDir, `assumptions-${shortHash}.json`);
      await expect(access(assumptionsPath)).resolves.not.toThrow();
      const assumptionsContent = await readFile(assumptionsPath, 'utf-8');
      const assumptionsData = JSON.parse(assumptionsContent);
      expect(assumptionsData.assumptions).toHaveLength(ledger.assumptions.length);
      expect(assumptionsData.coverage_pct).toBe(ledger.coverage_pct);
      
      // Check citations attachment
      const citationsPath = join(attachmentsDir, `citations-${shortHash}.json`);
      await expect(access(citationsPath)).resolves.not.toThrow();
      const citationsContent = await readFile(citationsPath, 'utf-8');
      const citationsData = JSON.parse(citationsContent);
      expect(citationsData).toHaveLength(businessInputs.citations!.length);
      
      // Check scenarios attachment
      const scenariosPath = join(attachmentsDir, `scenarios-${shortHash}.json`);
      await expect(access(scenariosPath)).resolves.not.toThrow();
      const scenariosContent = await readFile(scenariosPath, 'utf-8');
      const scenariosData = JSON.parse(scenariosContent);
      expect(scenariosData.scenarios).toBeDefined();
      expect(scenariosData.elasticities).toBeDefined();
      expect(scenariosData.keyDrivers).toBeDefined();
      expect(scenariosData.hardQuestions).toBeDefined();
      expect(scenariosData.hardQuestions).toHaveLength(hardQuestions.length);

      // Step 13: Verify mechanism integration quality
      expect(ledger.assumptions.some(a => a.impact === 'critical')).toBe(true);
      expect(confidence.breakdown.evidence).toBeGreaterThan(50); // Should have decent evidence from citations
      expect(scenarios.keyDrivers.some(kd => kd.impact > 10)).toBe(true); // Should have meaningful drivers
      expect(hardQuestions.some(q => q.severity === 'critical')).toBe(true); // Should have critical questions
    });

    it('should handle change detection through inputs hash', async () => {
      const businessInputs: BusinessInputs = {
        featureName: 'Test Feature',
        customer: 'Test Customer',
        pricing: 100
      };

      // Generate first hash
      const hash1 = steeringWriter.generateInputsHash(businessInputs);

      // Generate second hash with same inputs
      const hash2 = steeringWriter.generateInputsHash(businessInputs);
      expect(hash1).toBe(hash2);

      // Generate third hash with modified inputs
      const modifiedInputs = { ...businessInputs, pricing: 200 };
      const hash3 = steeringWriter.generateInputsHash(modifiedInputs);
      expect(hash1).not.toBe(hash3);

      // Verify hash affects file naming
      const mockLedger = {
        assumptions: [],
        coverage_pct: 0,
        lastUpdated: new Date(),
        totalClaims: 0,
        backedClaims: 0
      };

      const mockConfidence = {
        total: 50,
        breakdown: { evidence: 50, recency: 50, diversity: 50, agreement: 50, coverage: 50, sensitivity: 50 },
        explanation: 'Test',
        lowConfidence: true
      };

      const mockScenarios = {
        scenarios: { bear: [], base: [], bull: [] },
        elasticities: [],
        keyDrivers: [],
        sensitivityPct: 20
      };

      const package1 = steeringWriter.createSteeringPackage(
        'Test Feature',
        'pr_faq',
        '# Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        [],
        [],
        hash1
      );

      const package2 = steeringWriter.createSteeringPackage(
        'Test Feature',
        'pr_faq',
        '# Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        [],
        [],
        hash3
      );

      // Different hashes should result in different attachment filenames
      expect(package1.attachments[0].filename).not.toBe(package2.attachments[0].filename);
      expect(package1.frontMatter.paths.assumptions_json).not.toBe(package2.frontMatter.paths.assumptions_json);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle minimal business inputs gracefully', async () => {
      const minimalInputs: BusinessInputs = {
        featureName: 'Minimal Feature',
        customer: 'Test Customer'
      };

      // Should still generate valid assumption ledger
      const ledgerResult = await assumptionLedgerService.normalizeLedger(minimalInputs);
      expect(ledgerResult.success).toBe(true);
      
      // Should generate valid hash
      const inputsHash = steeringWriter.generateInputsHash(minimalInputs);
      expect(inputsHash).toHaveLength(64);
      
      // Should create valid steering package
      const mockConfidence = {
        total: 30,
        breakdown: { evidence: 30, recency: 30, diversity: 30, agreement: 30, coverage: 30, sensitivity: 30 },
        explanation: 'Low confidence due to minimal inputs',
        lowConfidence: true
      };

      const mockScenarios = {
        scenarios: { bear: [], base: [], bull: [] },
        elasticities: [],
        keyDrivers: [],
        sensitivityPct: 20
      };

      const package_ = steeringWriter.createSteeringPackage(
        minimalInputs.featureName,
        'pr_faq',
        '# Minimal Content',
        ledgerResult.data!,
        mockConfidence,
        mockScenarios,
        [],
        [],
        inputsHash
      );

      expect(package_.featureSlug).toBe('minimal-feature');
      expect(package_.attachments).toHaveLength(3);
    });

    it('should handle service failures gracefully', async () => {
      const businessInputs: BusinessInputs = {
        featureName: 'Test Feature',
        customer: 'Test Customer'
      };

      // Test assumption ledger service failure handling
      const ledgerResult = await assumptionLedgerService.normalizeLedger(businessInputs);
      if (!ledgerResult.success) {
        expect(ledgerResult.error).toBeDefined();
        expect(ledgerResult.error?.code).toBe('ASSUMPTION_LEDGER_ERROR');
      }

      // Even with service failures, hash generation should work
      const inputsHash = steeringWriter.generateInputsHash(businessInputs);
      expect(inputsHash).toHaveLength(64);
    });
  });
});

/**
 * Generate sample PR/FAQ content for testing
 */
function generateSamplePRFAQ(
  inputs: BusinessInputs,
  ledger: any,
  confidence: any,
  scenarios: any
): string {
  return `# PR/FAQ — ${inputs.featureName}

## Press Release

**FOR IMMEDIATE RELEASE**

**${inputs.featureName} Launches to Transform ${inputs.customer} Analytics**

*Revolutionary AI-powered platform delivers real-time customer insights with unprecedented accuracy*

Today, we announced the launch of ${inputs.featureName}, a breakthrough analytics platform designed specifically for ${inputs.customer}. This innovative solution addresses the critical need for real-time, AI-driven customer behavior prediction in an increasingly competitive market.

## Why Now?

The customer analytics market is experiencing explosive growth, reaching $${(inputs.marketSize || 0) / 1000000000}B globally. ${inputs.customer} are struggling with fragmented data and delayed insights that prevent them from making timely, data-driven decisions.

## Customer Problem

${inputs.customer} face three critical challenges:
- Fragmented customer data across multiple touchpoints
- Delayed insights that arrive too late for actionable decisions  
- Lack of predictive capabilities to anticipate customer behavior

## Solution

${inputs.featureName} solves these problems through:
- Real-time data integration from all customer touchpoints
- AI-powered predictive analytics with 95% accuracy
- Intuitive dashboards that surface actionable insights instantly

## Success Metrics

- **North Star Metric**: Customer Lifetime Value increase of 25%
- **Leading Indicators**: 
  - Time to insight: <5 minutes (vs. industry average of 2 hours)
  - Prediction accuracy: 95% (vs. industry average of 70%)
  - Customer retention improvement: 15%

## Evidence Mechanisms

### Assumption Ledger
Coverage: ${ledger.coverage_pct}% of claims backed by documented assumptions

### Confidence Score
Overall confidence: ${confidence.total}/100
- Evidence quality: ${confidence.breakdown.evidence}/100
- Data recency: ${confidence.breakdown.recency}/100

### Scenario Analysis
Bear/Base/Bull scenarios show ROI range of ${scenarios.scenarios.bear[0]?.bear || 'N/A'} to ${scenarios.scenarios.bull[0]?.bull || 'N/A'}

Key drivers: ${scenarios.keyDrivers.map((kd: any) => kd.assumption).join(', ')}`;
}

/**
 * Generate sample Decision One-Pager content for testing
 */
function generateSampleOnePager(
  inputs: BusinessInputs,
  ledger: any,
  confidence: any,
  scenarios: any
): string {
  return `# Decision One-Pager — ${inputs.featureName}

## Context

${inputs.customer} need advanced analytics capabilities to compete in the rapidly evolving digital landscape. Current solutions lack real-time processing and predictive accuracy required for modern customer engagement.

## Options Considered

| Option | Pros | Cons | Investment |
|--------|------|------|------------|
| **Status Quo** | No additional investment | Falling behind competitors | $0 |
| **Build ${inputs.featureName}** | Market leadership, custom fit | High development cost | $${(inputs.devCost || 0).toLocaleString()} |
| **Partner Solution** | Faster time to market | Limited customization | $${((inputs.devCost || 0) * 0.6).toLocaleString()} |

## ROI Range

| Scenario | Revenue | Costs | ROI |
|----------|---------|-------|-----|
| **Bear** | $${(scenarios.scenarios.bear[0]?.bear || 0).toLocaleString()} | $${((inputs.devCost || 0) + (inputs.opsCost || 0)).toLocaleString()} | ${Math.round(((scenarios.scenarios.bear[0]?.bear || 0) - ((inputs.devCost || 0) + (inputs.opsCost || 0))) / ((inputs.devCost || 0) + (inputs.opsCost || 0)) * 100)}% |
| **Base** | $${(scenarios.scenarios.base[0]?.base || 0).toLocaleString()} | $${((inputs.devCost || 0) + (inputs.opsCost || 0)).toLocaleString()} | ${Math.round(((scenarios.scenarios.base[0]?.base || 0) - ((inputs.devCost || 0) + (inputs.opsCost || 0))) / ((inputs.devCost || 0) + (inputs.opsCost || 0)) * 100)}% |
| **Bull** | $${(scenarios.scenarios.bull[0]?.bull || 0).toLocaleString()} | $${((inputs.devCost || 0) + (inputs.opsCost || 0)).toLocaleString()} | ${Math.round(((scenarios.scenarios.bull[0]?.bull || 0) - ((inputs.devCost || 0) + (inputs.opsCost || 0))) / ((inputs.devCost || 0) + (inputs.opsCost || 0)) * 100)}% |

## Recommendation

**GO** - Proceed with ${inputs.featureName} development

**Rationale**: Strong market opportunity ($${(inputs.marketSize || 0) / 1000000000}B), clear customer need, and competitive differentiation through AI accuracy.

**Confidence Level**: ${confidence.total}/100 ${confidence.lowConfidence ? '(Human review recommended)' : ''}

## Evidence Mechanisms

### Key Assumptions (${ledger.coverage_pct}% coverage)
${ledger.assumptions.slice(0, 3).map((a: any) => `- ${a.id}: ${a.name} (${a.certainty} certainty)`).join('\n')}

### Sensitivity Analysis
Top drivers: ${scenarios.keyDrivers.slice(0, 3).map((kd: any) => `${kd.assumption} (${kd.impact}% impact)`).join(', ')}`;
}