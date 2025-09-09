/**
 * Amazon Template Processor - Unit Tests
 * Tests for PR/FAQ and Decision One-Pager template rendering with evidence mechanisms
 */

import { AmazonTemplateProcessor, TemplateContext } from '../../components/amazon-template-processor/index';
import { AssumptionLedger } from '../../models/assumptions';
import { ConfidenceScore } from '../../models/confidence';
import { ScenarioResults } from '../../models/scenarios';
import { HardQuestion } from '../../models/questions';
import { Citation } from '../../models/confidence';

describe('AmazonTemplateProcessor', () => {
  let processor: AmazonTemplateProcessor;
  let mockContext: TemplateContext;

  beforeEach(() => {
    processor = new AmazonTemplateProcessor();
    
    // Create comprehensive mock context with fixed seed for deterministic testing
    mockContext = {
      featureName: 'Smart Analytics Dashboard',
      customer: 'Enterprise SaaS Companies',
      problemOneLine: 'lack of real-time business intelligence and actionable insights',
      region: 'North America',
      competitors: ['Tableau', 'PowerBI', 'Looker'],
      
      ledger: {
        assumptions: [
          {
            id: 'A1',
            name: 'Market Size',
            value: '$2.5B',
            unit: 'USD',
            sourceUrls: ['https://example.com/market-research'],
            certainty: 'High',
            lastChecked: new Date('2024-01-15'),
            category: 'market',
            impact: 'critical'
          },
          {
            id: 'A2',
            name: 'Customer Acquisition Cost',
            value: 5000,
            unit: 'USD',
            sourceUrls: ['https://example.com/cac-analysis'],
            certainty: 'Medium',
            lastChecked: new Date('2024-01-10'),
            category: 'financial',
            impact: 'important'
          },
          {
            id: 'A3',
            name: 'Expected ROI',
            value: 180,
            unit: '%',
            sourceUrls: ['https://example.com/roi-projection'],
            certainty: 'Medium',
            lastChecked: new Date('2024-01-12'),
            category: 'financial',
            impact: 'critical'
          }
        ],
        coverage_pct: 85,
        lastUpdated: new Date('2024-01-15'),
        totalClaims: 10,
        backedClaims: 8
      } as AssumptionLedger,
      
      confidence: {
        total: 78,
        breakdown: {
          evidence: 82,
          recency: 75,
          diversity: 70,
          agreement: 85,
          coverage: 85,
          sensitivity: 72
        },
        explanation: 'Strong evidence base with good source diversity, moderate recency concerns',
        lowConfidence: false
      } as ConfidenceScore,
      
      scenarios: {
        scenarios: {
          bear: [
            { metric: 'Investment', bear: '$500K', base: '$750K', bull: '$1M', unit: 'USD' },
            { metric: 'Revenue', bear: '$1.2M', base: '$2.1M', bull: '$3.5M', unit: 'USD' },
            { metric: 'ROI', bear: '140%', base: '180%', bull: '250%', unit: '%' }
          ],
          base: [
            { metric: 'Investment', bear: '$500K', base: '$750K', bull: '$1M', unit: 'USD' },
            { metric: 'Revenue', bear: '$1.2M', base: '$2.1M', bull: '$3.5M', unit: 'USD' },
            { metric: 'ROI', bear: '140%', base: '180%', bull: '250%', unit: '%' }
          ],
          bull: [
            { metric: 'Investment', bear: '$500K', base: '$750K', bull: '$1M', unit: 'USD' },
            { metric: 'Revenue', bear: '$1.2M', base: '$2.1M', bull: '$3.5M', unit: 'USD' },
            { metric: 'ROI', bear: '140%', base: '180%', bull: '250%', unit: '%' }
          ]
        },
        elasticities: [
          {
            assumption: 'Customer Acquisition Cost',
            assumptionChange: '±20%',
            outcomeMetric: 'ROI',
            outcomeChange: '±14pp',
            sensitivity: 0.7
          },
          {
            assumption: 'Market Penetration',
            assumptionChange: '±20%',
            outcomeMetric: 'Revenue',
            outcomeChange: '±25%',
            sensitivity: 1.25
          }
        ],
        keyDrivers: [
          {
            assumption: 'Customer Acquisition Cost',
            assumptionId: 'A2',
            impact: 0.7,
            description: 'Primary driver of profitability'
          }
        ],
        sensitivityPct: 20
      } as ScenarioResults,
      
      hardQuestions: [
        {
          id: 1,
          question: 'How confident are we in the $2.5B market size assumption given recent economic headwinds?',
          targetAssumptions: ['A1'],
          category: 'market',
          severity: 'critical',
          evidenceNeeded: ['Updated market research', 'Economic impact analysis']
        },
        {
          id: 2,
          question: 'What if competitors respond faster than expected with similar features?',
          targetAssumptions: ['A3'],
          category: 'competitive',
          severity: 'important',
          evidenceNeeded: ['Competitive intelligence', 'IP analysis']
        }
      ] as HardQuestion[],
      
      citations: [
        {
          url: 'https://example.com/market-research',
          title: 'Enterprise Analytics Market Report 2024',
          date: '2024-01-01',
          rating: 'A',
          snippet: 'Market expected to reach $2.5B by 2025',
          sourceType: 'industry_report'
        },
        {
          url: 'https://example.com/cac-analysis',
          title: 'SaaS Customer Acquisition Benchmarks',
          date: '2023-12-15',
          rating: 'B',
          snippet: 'Average CAC for enterprise SaaS is $5,000',
          sourceType: 'research'
        }
      ] as Citation[],
      
      inputsHash: 'abc123def456',
      isoTimestamp: '2024-01-15T10:30:00Z',
      shortHash: 'abc123'
    };
  });

  describe('Template Rendering', () => {
    test('should render PR/FAQ template with all sections', () => {
      const result = processor.renderPRFAQ(mockContext);
      
      // Check front-matter
      expect(result).toContain('title: "PR/FAQ — Smart Analytics Dashboard"');
      expect(result).toContain('artifact_type: pr_faq');
      expect(result).toContain('inputs_hash: "abc123def456"');
      expect(result).toContain('profile: "amazon"');
      
      // Check confidence data in front-matter
      expect(result).toContain('total: 78');
      expect(result).toContain('"evidence":82');
      
      // Check main content sections
      expect(result).toContain('# PR/FAQ — Smart Analytics Dashboard');
      expect(result).toContain('## Press Release');
      expect(result).toContain('## Frequently Asked Questions');
      expect(result).toContain('## Evidence Mechanisms');
      
      // Check business content
      expect(result).toContain('Enterprise SaaS Companies');
      expect(result).toContain('lack of real-time business intelligence');
      expect(result).toContain('180% ROI improvement');
      
      // Check evidence mechanisms
      expect(result).toContain('### Assumption Ledger');
      expect(result).toContain('### Confidence Score');
      expect(result).toContain('### Scenario Range');
      expect(result).toContain('### Hard Questions');
      expect(result).toContain('### Citations');
    });

    test('should render Decision One-Pager template with all sections', () => {
      const result = processor.renderDecisionOnePager(mockContext);
      
      // Check front-matter
      expect(result).toContain('title: "Decision One-Pager — Smart Analytics Dashboard"');
      expect(result).toContain('artifact_type: decision_onepager');
      
      // Check main content sections
      expect(result).toContain('# Decision One-Pager — Smart Analytics Dashboard');
      expect(result).toContain('## Context');
      expect(result).toContain('## Options Considered');
      expect(result).toContain('## ROI Range');
      expect(result).toContain('## Risks & Blast Radius');
      expect(result).toContain('## Recommendation');
      expect(result).toContain('## Evidence Mechanisms');
      
      // Check decision content
      expect(result).toContain('**Decision:** GO');
      expect(result).toContain('**Confidence:** 78%');
      expect(result).toContain('A1, A2, A3');
      expect(result).toContain('85% coverage');
    });

    test('should handle low confidence scenarios', () => {
      const lowConfidenceContext = {
        ...mockContext,
        confidence: {
          ...mockContext.confidence,
          total: 45,
          lowConfidence: true
        }
      };
      
      const result = processor.renderPRFAQ(lowConfidenceContext);
      expect(result).toContain('⚠️ Human Review Recommended');
      expect(result).toContain('Confidence score below 60%');
    });
  });

  describe('Template Processing', () => {
    test('should process simple variables', () => {
      const template = 'Hello {{featureName}} for {{customer}}';
      const data = processor['enrichTemplateData'](mockContext);
      
      const result = processor.processTemplate(template, data);
      expect(result).toBe('Hello Smart Analytics Dashboard for Enterprise SaaS Companies');
    });

    test('should process json helpers', () => {
      const template = 'IDs: {{json assumptionIds}}';
      const data = processor['enrichTemplateData'](mockContext);
      
      const result = processor.processTemplate(template, data);
      expect(result).toContain('["A1","A2","A3"]');
    });

    test('should process loops', () => {
      const template = 'Bullets:\n{{#each solutionBullets}}- {{this}}\n{{/each}}';
      const data = processor['enrichTemplateData'](mockContext);
      
      const result = processor.processTemplate(template, data);
      expect(result).toContain('- Core Smart Analytics Dashboard functionality');
      expect(result).toContain('- Integrated analytics and reporting');
    });

    test('should process conditionals', () => {
      const template = '{{#if lowConfidence}}Warning!{{/if}}Normal content';
      const data = processor['enrichTemplateData'](mockContext);
      
      const result = processor.processTemplate(template, data);
      expect(result).toBe('Normal content'); // lowConfidence is false
      
      // Test with low confidence
      const lowConfidenceData = { ...data, lowConfidence: true };
      const lowResult = processor.processTemplate(template, lowConfidenceData);
      expect(lowResult).toBe('Warning!Normal content');
    });
  });

  describe('Template Validation', () => {
    test('should validate required sections', () => {
      const template = '# Title\n## Section 1\n## Section 2';
      const requiredSections = ['Section 1', 'Section 2', 'Missing Section'];
      const requiredVariables = ['var1'];
      
      const result = processor.validateTemplate(template, requiredSections, requiredVariables);
      
      expect(result.isValid).toBe(false);
      expect(result.missingSections).toContain('Missing Section');
      expect(result.missingVariables).toContain('var1');
    });

    test('should validate required variables', () => {
      const template = 'Hello {{name}} and {{age}}';
      const requiredSections: string[] = [];
      const requiredVariables = ['name', 'age', 'missing'];
      
      const result = processor.validateTemplate(template, requiredSections, requiredVariables);
      
      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toContain('missing');
      expect(result.missingVariables).not.toContain('name');
      expect(result.missingVariables).not.toContain('age');
    });

    test('should pass validation for complete template', () => {
      const template = `---
title: "Test"
---

# Title
## Required Section
## Evidence Mechanisms
### Assumption Ledger
### Confidence Score
Hello {{requiredVar}} {{featureName}} {{customer}} {{json test}}`;
      const requiredSections = ['Required Section'];
      const requiredVariables = ['requiredVar'];
      
      const result = processor.validateTemplate(template, requiredSections, requiredVariables);
      
      expect(result.isValid).toBe(true);
      expect(result.missingSections).toHaveLength(0);
      expect(result.missingVariables).toHaveLength(0);
    });
  });

  describe('Content Generation', () => {
    test('should generate assumption table', () => {
      const table = processor['generateAssumptionTable'](mockContext.ledger);
      
      expect(table).toContain('| ID | Name | Value | Certainty | Sources |');
      expect(table).toContain('| A1 | Market Size | $2.5B | High | 1 |');
      expect(table).toContain('| A2 | Customer Acquisition Cost | 5000 | Medium | 1 |');
      expect(table).toContain('| A3 | Expected ROI | 180 | Medium | 1 |');
    });

    test('should generate scenario table', () => {
      const table = processor['generateScenarioTable'](mockContext.scenarios);
      
      expect(table).toContain('| Metric | Bear | Base | Bull | Unit |');
      expect(table).toContain('| Investment | $500K | **$750K** | $1M | USD |');
      expect(table).toContain('| Revenue | $1.2M | **$2.1M** | $3.5M | USD |');
      expect(table).toContain('| ROI | 140% | **180%** | 250% | % |');
    });

    test('should generate ROI table', () => {
      const table = processor['generateROITable'](mockContext.scenarios);
      
      expect(table).toContain('| Scenario | Investment | Revenue | ROI | Confidence |');
      expect(table).toContain('| **Bear** | $500K | $1.2M | 140% | Low |');
      expect(table).toContain('| **Base** | **$750K** | **$2.1M** | **180%** | Medium |');
      expect(table).toContain('| **Bull** | $1M | $3.5M | 250% | High |');
    });

    test('should generate top sensitivities', () => {
      const sensitivities = processor['generateTopSensitivities'](mockContext.scenarios);
      
      expect(sensitivities).toContain('Customer Acquisition Cost ±20% → ROI ±14pp');
      expect(sensitivities).toContain('Market Penetration ±20% → Revenue ±25%');
    });

    test('should generate citations list', () => {
      const citations = processor['generateCitationsList'](mockContext.citations);
      
      expect(citations).toContain('1. [Enterprise Analytics Market Report 2024](https://example.com/market-research) - industry_report (A)');
      expect(citations).toContain('2. [SaaS Customer Acquisition Benchmarks](https://example.com/cac-analysis) - research (B)');
    });
  });

  describe('Performance Requirements', () => {
    test('should complete template rendering within 500ms', () => {
      const startTime = Date.now();
      
      processor.renderPRFAQ(mockContext);
      processor.renderDecisionOnePager(mockContext);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(500);
    });

    test('should handle large datasets efficiently', () => {
      // Create context with many assumptions
      const largeContext = {
        ...mockContext,
        ledger: {
          ...mockContext.ledger,
          assumptions: Array.from({ length: 50 }, (_, i) => ({
            id: `A${i + 1}`,
            name: `Assumption ${i + 1}`,
            value: `Value ${i + 1}`,
            unit: 'unit',
            sourceUrls: [`https://example.com/source-${i + 1}`],
            certainty: 'Medium' as const,
            lastChecked: new Date(),
            category: 'market' as const,
            impact: 'supporting' as const
          }))
        }
      };
      
      const startTime = Date.now();
      const result = processor.renderPRFAQ(largeContext);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(500);
      expect(result).toContain('A1');
      expect(result).toContain('A50');
    });
  });

  describe('Deterministic Output', () => {
    test('should produce identical output for identical inputs', () => {
      const result1 = processor.renderPRFAQ(mockContext);
      const result2 = processor.renderPRFAQ(mockContext);
      
      expect(result1).toBe(result2);
    });

    test('should produce identical output for Decision One-Pager', () => {
      const result1 = processor.renderDecisionOnePager(mockContext);
      const result2 = processor.renderDecisionOnePager(mockContext);
      
      expect(result1).toBe(result2);
    });

    test('should generate consistent hashes and timestamps', () => {
      const data1 = processor['enrichTemplateData'](mockContext);
      const data2 = processor['enrichTemplateData'](mockContext);
      
      // These should be identical since we're using the same input
      expect(data1.inputsHash).toBe(data2.inputsHash);
      expect(data1.isoTimestamp).toBe(data2.isoTimestamp);
      expect(data1.shortHash).toBe(data2.shortHash);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing data gracefully', () => {
      const incompleteContext = {
        ...mockContext,
        ledger: {
          ...mockContext.ledger,
          assumptions: []
        }
      };
      
      expect(() => processor.renderPRFAQ(incompleteContext)).not.toThrow();
      const result = processor.renderPRFAQ(incompleteContext);
      expect(result).toContain('Smart Analytics Dashboard');
    });

    test('should handle malformed template expressions', () => {
      const template = 'Hello {{invalid.deeply.nested.property}}';
      const data = processor['enrichTemplateData'](mockContext);
      
      const result = processor.processTemplate(template, data);
      expect(result).toContain('{{invalid.deeply.nested.property}}'); // Should leave unresolved
    });

    test('should handle json helper errors gracefully', () => {
      const template = 'Data: {{json nonexistent.property}}';
      const data = processor['enrichTemplateData'](mockContext);
      
      const result = processor.processTemplate(template, data);
      expect(result).toContain('Data: {}'); // Should fallback to empty object
    });
  });
});