/**
 * Amazon Template Processor - Snapshot Tests
 * Deterministic output validation with fixed seed for consistent results
 */

import { AmazonTemplateProcessor, TemplateContext } from '../../components/amazon-template-processor/index';
import { AssumptionLedger } from '../../models/assumptions';
import { ConfidenceScore } from '../../models/confidence';
import { ScenarioResults } from '../../models/scenarios';
import { HardQuestion } from '../../models/questions';
import { Citation } from '../../models/confidence';

describe('AmazonTemplateProcessor Snapshots', () => {
  let processor: AmazonTemplateProcessor;
  let fixedSeedContext: TemplateContext;

  beforeAll(() => {
    processor = new AmazonTemplateProcessor();
    
    // Fixed seed context for deterministic testing
    fixedSeedContext = {
      featureName: 'AI-Powered Analytics Platform',
      customer: 'Mid-Market SaaS Companies',
      problemOneLine: 'struggle with fragmented data insights and manual reporting processes',
      region: 'North America',
      competitors: ['Mixpanel', 'Amplitude', 'Segment'],
      
      ledger: {
        assumptions: [
          {
            id: 'A1',
            name: 'Total Addressable Market',
            value: '$1.8B',
            unit: 'USD',
            sourceUrls: ['https://research.gartner.com/analytics-market-2024'],
            certainty: 'High',
            lastChecked: new Date('2024-01-15T10:00:00Z'),
            category: 'market',
            impact: 'critical'
          },
          {
            id: 'A2',
            name: 'Average Deal Size',
            value: 25000,
            unit: 'USD',
            sourceUrls: ['https://salesforce.com/saas-benchmarks'],
            certainty: 'Medium',
            lastChecked: new Date('2024-01-10T15:30:00Z'),
            category: 'financial',
            impact: 'important'
          },
          {
            id: 'A3',
            name: 'Market Growth Rate',
            value: 23,
            unit: '%',
            sourceUrls: ['https://idc.com/analytics-growth-forecast'],
            certainty: 'High',
            lastChecked: new Date('2024-01-12T09:15:00Z'),
            category: 'market',
            impact: 'critical'
          },
          {
            id: 'A4',
            name: 'Customer Churn Rate',
            value: 8,
            unit: '%',
            sourceUrls: ['https://recurly.com/churn-benchmarks'],
            certainty: 'Medium',
            lastChecked: new Date('2024-01-08T14:45:00Z'),
            category: 'financial',
            impact: 'important'
          }
        ],
        coverage_pct: 92,
        lastUpdated: new Date('2024-01-15T10:00:00Z'),
        totalClaims: 12,
        backedClaims: 11
      } as AssumptionLedger,
      
      confidence: {
        total: 84,
        breakdown: {
          evidence: 88,
          recency: 82,
          diversity: 79,
          agreement: 91,
          coverage: 92,
          sensitivity: 76
        },
        explanation: 'High-quality evidence with strong source agreement and excellent coverage. Minor concerns around sensitivity to market changes.',
        lowConfidence: false
      } as ConfidenceScore,
      
      scenarios: {
        scenarios: {
          bear: [
            { metric: 'Development Investment', bear: '$800K', base: '$1.2M', bull: '$1.8M', unit: 'USD' },
            { metric: 'Annual Revenue', bear: '$2.4M', base: '$4.2M', bull: '$7.1M', unit: 'USD' },
            { metric: 'Customer Count', bear: '96', base: '168', bull: '284', unit: 'customers' },
            { metric: 'ROI', bear: '200%', base: '250%', bull: '295%', unit: '%' },
            { metric: 'Payback Period', bear: '18', base: '12', bull: '8', unit: 'months' }
          ],
          base: [
            { metric: 'Development Investment', bear: '$800K', base: '$1.2M', bull: '$1.8M', unit: 'USD' },
            { metric: 'Annual Revenue', bear: '$2.4M', base: '$4.2M', bull: '$7.1M', unit: 'USD' },
            { metric: 'Customer Count', bear: '96', base: '168', bull: '284', unit: 'customers' },
            { metric: 'ROI', bear: '200%', base: '250%', bull: '295%', unit: '%' },
            { metric: 'Payback Period', bear: '18', base: '12', bull: '8', unit: 'months' }
          ],
          bull: [
            { metric: 'Development Investment', bear: '$800K', base: '$1.2M', bull: '$1.8M', unit: 'USD' },
            { metric: 'Annual Revenue', bear: '$2.4M', base: '$4.2M', bull: '$7.1M', unit: 'USD' },
            { metric: 'Customer Count', bear: '96', base: '168', bull: '284', unit: 'customers' },
            { metric: 'ROI', bear: '200%', base: '250%', bull: '295%', unit: '%' },
            { metric: 'Payback Period', bear: '18', base: '12', bull: '8', unit: 'months' }
          ]
        },
        elasticities: [
          {
            assumption: 'Average Deal Size',
            assumptionChange: '±20%',
            outcomeMetric: 'Annual Revenue',
            outcomeChange: '±18%',
            sensitivity: 0.9
          },
          {
            assumption: 'Market Growth Rate',
            assumptionChange: '±20%',
            outcomeMetric: 'Customer Count',
            outcomeChange: '±22%',
            sensitivity: 1.1
          },
          {
            assumption: 'Customer Churn Rate',
            assumptionChange: '±20%',
            outcomeMetric: 'ROI',
            outcomeChange: '±12%',
            sensitivity: 0.6
          }
        ],
        keyDrivers: [
          {
            assumption: 'Average Deal Size',
            assumptionId: 'A2',
            impact: 0.9,
            description: 'Primary revenue driver with high sensitivity'
          },
          {
            assumption: 'Market Growth Rate',
            assumptionId: 'A3',
            impact: 1.1,
            description: 'Key market expansion factor'
          }
        ],
        sensitivityPct: 20
      } as ScenarioResults,
      
      hardQuestions: [
        {
          id: 1,
          question: 'How will the recent economic downturn affect our $1.8B TAM assumption, especially given enterprise budget freezes?',
          targetAssumptions: ['A1', 'A3'],
          category: 'market',
          severity: 'critical',
          evidenceNeeded: ['Q4 2023 enterprise spending data', 'Updated market research', 'Customer budget surveys']
        },
        {
          id: 2,
          question: 'What if competitors like Mixpanel reduce pricing by 30% to defend market share?',
          targetAssumptions: ['A2'],
          category: 'competitive',
          severity: 'important',
          evidenceNeeded: ['Competitive pricing intelligence', 'Value proposition differentiation analysis']
        },
        {
          id: 3,
          question: 'Can we realistically achieve 8% churn when industry average is 12% for new products?',
          targetAssumptions: ['A4'],
          category: 'execution',
          severity: 'important',
          evidenceNeeded: ['Customer success benchmarks', 'Product stickiness analysis', 'Onboarding effectiveness data']
        }
      ] as HardQuestion[],
      
      citations: [
        {
          url: 'https://research.gartner.com/analytics-market-2024',
          title: 'Analytics and Business Intelligence Market Forecast 2024-2026',
          date: '2024-01-01',
          rating: 'A',
          snippet: 'The analytics market is projected to reach $1.8B by 2025 with 23% CAGR',
          sourceType: 'industry_report'
        },
        {
          url: 'https://salesforce.com/saas-benchmarks',
          title: 'SaaS Sales Benchmarks Report 2024',
          date: '2023-12-20',
          rating: 'A',
          snippet: 'Mid-market SaaS average deal size ranges from $20K-$30K annually',
          sourceType: 'industry_report'
        },
        {
          url: 'https://idc.com/analytics-growth-forecast',
          title: 'IDC Analytics Platform Growth Projections',
          date: '2024-01-05',
          rating: 'A',
          snippet: 'Analytics platforms showing 23% year-over-year growth in enterprise segment',
          sourceType: 'research'
        },
        {
          url: 'https://recurly.com/churn-benchmarks',
          title: 'SaaS Churn Rate Benchmarks by Industry',
          date: '2023-11-15',
          rating: 'B',
          snippet: 'Analytics SaaS products average 8-12% monthly churn in first year',
          sourceType: 'industry_report'
        }
      ] as Citation[],
      
      inputsHash: 'fixed-seed-hash-12345abcdef67890',
      isoTimestamp: '2024-01-15T10:30:00.000Z',
      shortHash: 'fixed123'
    };
  });

  describe('PR/FAQ Template Snapshots', () => {
    test('should generate consistent PR/FAQ output with fixed seed', () => {
      const result = processor.renderPRFAQ(fixedSeedContext);
      expect(result).toMatchSnapshot('pr-faq-fixed-seed');
    });

    test('should generate identical PR/FAQ output on multiple runs', () => {
      const result1 = processor.renderPRFAQ(fixedSeedContext);
      const result2 = processor.renderPRFAQ(fixedSeedContext);
      const result3 = processor.renderPRFAQ(fixedSeedContext);
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1).toMatchSnapshot('pr-faq-deterministic');
    });
  });

  describe('Decision One-Pager Template Snapshots', () => {
    test('should generate consistent Decision One-Pager output with fixed seed', () => {
      const result = processor.renderDecisionOnePager(fixedSeedContext);
      expect(result).toMatchSnapshot('decision-onepager-fixed-seed');
    });

    test('should generate identical Decision One-Pager output on multiple runs', () => {
      const result1 = processor.renderDecisionOnePager(fixedSeedContext);
      const result2 = processor.renderDecisionOnePager(fixedSeedContext);
      const result3 = processor.renderDecisionOnePager(fixedSeedContext);
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1).toMatchSnapshot('decision-onepager-deterministic');
    });
  });

  describe('Template Validation Snapshots', () => {
    test('should validate PR/FAQ template structure', () => {
      const requiredSections = [
        'Press Release',
        'Frequently Asked Questions',
        'Evidence Mechanisms',
        'Assumption Ledger',
        'Confidence Score',
        'Scenario Range',
        'Hard Questions',
        'Citations'
      ];
      
      const requiredVariables = [
        'featureName',
        'customer',
        'problemOneLine',
        'confidence.total',
        'ledgerCoveragePct'
      ];
      
      const template = processor['getPRFAQTemplate']();
      const validation = processor.validateTemplate(template, requiredSections, requiredVariables);
      
      expect(validation).toMatchSnapshot('pr-faq-validation');
    });

    test('should validate Decision One-Pager template structure', () => {
      const requiredSections = [
        'Context',
        'Options Considered',
        'ROI Range',
        'Risks & Blast Radius',
        'Recommendation',
        'Evidence Mechanisms'
      ];
      
      const requiredVariables = [
        'featureName',
        'customer',
        'confidence.total',
        'ledgerCoveragePct'
      ];
      
      const template = processor['getDecisionOnePagerTemplate']();
      const validation = processor.validateTemplate(template, requiredSections, requiredVariables);
      
      expect(validation).toMatchSnapshot('decision-onepager-validation');
    });
  });

  describe('Evidence Mechanism Snapshots', () => {
    test('should generate consistent assumption table', () => {
      const table = processor['generateAssumptionTable'](fixedSeedContext.ledger);
      expect(table).toMatchSnapshot('assumption-table');
    });

    test('should generate consistent scenario table', () => {
      const table = processor['generateScenarioTable'](fixedSeedContext.scenarios);
      expect(table).toMatchSnapshot('scenario-table');
    });

    test('should generate consistent ROI table', () => {
      const table = processor['generateROITable'](fixedSeedContext.scenarios);
      expect(table).toMatchSnapshot('roi-table');
    });

    test('should generate consistent citations list', () => {
      const citations = processor['generateCitationsList'](fixedSeedContext.citations);
      expect(citations).toMatchSnapshot('citations-list');
    });

    test('should generate consistent sensitivities', () => {
      const sensitivities = processor['generateTopSensitivities'](fixedSeedContext.scenarios);
      expect(sensitivities).toMatchSnapshot('top-sensitivities');
    });
  });

  describe('Template Data Enrichment Snapshots', () => {
    test('should generate consistent enriched template data', () => {
      const enrichedData = processor['enrichTemplateData'](fixedSeedContext);
      
      // Remove functions and dates for snapshot consistency
      const snapshotData = {
        ...enrichedData,
        ledger: {
          ...enrichedData.ledger,
          assumptions: enrichedData.ledger.assumptions.map(a => ({
            ...a,
            lastChecked: a.lastChecked.toISOString()
          })),
          lastUpdated: enrichedData.ledger.lastUpdated.toISOString()
        }
      };
      
      expect(snapshotData).toMatchSnapshot('enriched-template-data');
    });
  });

  describe('Performance Validation', () => {
    test('should complete template rendering within performance requirements', () => {
      const iterations = 10;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        processor.renderPRFAQ(fixedSeedContext);
        processor.renderDecisionOnePager(fixedSeedContext);
        const end = Date.now();
        times.push(end - start);
      }
      
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      
      const performanceMetrics = {
        averageTime: Math.round(avgTime * 10) / 10, // Round to 1 decimal place
        maxTime: Math.round(maxTime),
        iterations: iterations,
        withinRequirement: maxTime < 500
      };
      
      // Don't snapshot performance metrics as they vary by machine
      expect(performanceMetrics.withinRequirement).toBe(true);
      expect(maxTime).toBeLessThan(500); // Must be under 500ms
    });
  });
});