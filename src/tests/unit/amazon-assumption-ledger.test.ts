/**
 * Unit tests for Amazon Working Backwards - Assumption Ledger Service
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  AssumptionLedgerService,
  type BusinessInputs,
} from '../../services/amazon/assumption-ledger';
import { AssumptionLedger, Assumption } from '../../models/assumptions';

describe('AssumptionLedgerService', () => {
  let service: AssumptionLedgerService;
  let sampleInputs: BusinessInputs;

  beforeEach(() => {
    service = new AssumptionLedgerService();
    sampleInputs = {
      featureName: 'AI Assistant',
      customer: 'Enterprise customers',
      pricing: 99,
      users: 10000,
      convRate: 15,
      devCost: 500000,
      opsCost: 50000,
      marketSize: 10000000,
      competitiveAdvantage: 'First-mover advantage in AI space',
      timeline: '6 months',
      citations: [
        {
          url: 'https://example.com/market-research',
          title: 'AI Market Research 2024',
          date: '2024-01-15',
          rating: 'A',
          snippet: 'Market size projected at $10B',
          sourceType: 'industry_report',
        },
      ],
      assumptions: ['Customer adoption rate will be 20%'],
    };
  });

  describe('normalizeLedger', () => {
    it('should successfully normalize business inputs into assumption ledger', async () => {
      const result = await service.normalizeLedger(sampleInputs);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const ledger = result.data!;
      expect(ledger.assumptions.length).toBeGreaterThan(0);
      expect(ledger.coverage_pct).toBeGreaterThanOrEqual(0);
      expect(ledger.lastUpdated).toBeInstanceOf(Date);
      expect(ledger.totalClaims).toBe(ledger.assumptions.length);
      expect(ledger.backedClaims).toBeGreaterThanOrEqual(0);
    });

    it('should assign sequential A# IDs to assumptions', async () => {
      const result = await service.normalizeLedger(sampleInputs);

      expect(result.success).toBe(true);
      const assumptions = result.data!.assumptions;

      expect(assumptions[0].id).toBe('A1');
      expect(assumptions[1].id).toBe('A2');
      if (assumptions.length > 2) {
        expect(assumptions[2].id).toBe('A3');
      }
    });

    it('should categorize assumptions correctly', async () => {
      const result = await service.normalizeLedger(sampleInputs);

      expect(result.success).toBe(true);
      const assumptions = result.data!.assumptions;

      const pricingAssumption = assumptions.find(a => a.name.includes('Pricing'));
      expect(pricingAssumption?.category).toBe('financial');
      expect(pricingAssumption?.impact).toBe('critical');

      const usersAssumption = assumptions.find(a => a.name.includes('User'));
      expect(usersAssumption?.category).toBe('market');
      expect(usersAssumption?.impact).toBe('critical');
    });

    it('should handle empty inputs gracefully', async () => {
      const emptyInputs: BusinessInputs = {
        featureName: 'Test Feature',
        customer: 'Test Customer',
      };

      const result = await service.normalizeLedger(emptyInputs);

      expect(result.success).toBe(true);
      expect(result.data!.assumptions).toHaveLength(0);
      expect(result.data!.coverage_pct).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      // Force an error by passing invalid data
      const invalidInputs = null as any;

      const result = await service.normalizeLedger(invalidInputs);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ASSUMPTION_LEDGER_ERROR');
    });

    it('should map citations to relevant assumptions', async () => {
      const inputsWithCitations: BusinessInputs = {
        featureName: 'AI Assistant',
        customer: 'Enterprise customers',
        pricing: 99,
        marketSize: 10000000,
        citations: [
          {
            url: 'https://mckinsey.com/ai-market-report',
            title: 'AI Market Analysis 2024',
            snippet: 'AI market size expected to reach $10B by 2025',
            sourceType: 'industry_report',
            rating: 'A',
          },
          {
            url: 'https://example.com/pricing-study',
            title: 'SaaS Pricing Study',
            snippet: 'Enterprise software pricing averages $99/month',
            sourceType: 'research',
            rating: 'B',
          },
        ],
      };

      const result = await service.normalizeLedger(inputsWithCitations);

      expect(result.success).toBe(true);
      const assumptions = result.data!.assumptions;

      // Check that market size assumption got the relevant citation
      const marketAssumption = assumptions.find(a => a.name.includes('Market'));
      expect(marketAssumption?.sourceUrls).toContain('https://mckinsey.com/ai-market-report');

      // Check that pricing assumption got the relevant citation
      const pricingAssumption = assumptions.find(a => a.name.includes('Pricing'));
      expect(pricingAssumption?.sourceUrls).toContain('https://example.com/pricing-study');
    });

    it('should sort assumptions by priority', async () => {
      const result = await service.normalizeLedger(sampleInputs);

      expect(result.success).toBe(true);
      const assumptions = result.data!.assumptions;

      // Critical assumptions should come first
      const firstFewAssumptions = assumptions.slice(0, 3);
      expect(firstFewAssumptions.every(a => a.impact === 'critical')).toBe(true);
    });
  });

  describe('calculateCoverage', () => {
    it('should calculate weighted coverage percentage correctly', () => {
      const assumptions: Assumption[] = [
        {
          id: 'A1',
          name: 'Test 1',
          value: 100,
          sourceUrls: ['http://example.com'],
          certainty: 'High',
          lastChecked: new Date(),
          category: 'market',
          impact: 'critical', // weight: 3, multiplier: 1.0 = 3
        },
        {
          id: 'A2',
          name: 'Test 2',
          value: 200,
          sourceUrls: [],
          certainty: 'Medium',
          lastChecked: new Date(),
          category: 'financial',
          impact: 'important', // weight: 2, no sources = 0
        },
      ];

      const coverage = service.calculateCoverage(assumptions);
      // Total weight: 3 + 2 = 5
      // Covered weight: 3 * 1.0 + 0 = 3
      // Coverage: 3/5 * 100 = 60%
      expect(coverage).toBe(60);
    });

    it('should return 0 for empty assumptions array', () => {
      const coverage = service.calculateCoverage([]);
      expect(coverage).toBe(0);
    });

    it('should account for certainty quality in coverage calculation', () => {
      const assumptions: Assumption[] = [
        {
          id: 'A1',
          name: 'Test 1',
          value: 100,
          sourceUrls: ['http://example.com'],
          certainty: 'High',
          lastChecked: new Date(),
          category: 'market',
          impact: 'critical', // weight: 3, multiplier: 1.0 = 3
        },
        {
          id: 'A2',
          name: 'Test 2',
          value: 200,
          sourceUrls: ['http://example2.com'],
          certainty: 'Low',
          lastChecked: new Date(),
          category: 'financial',
          impact: 'important', // weight: 2, multiplier: 0.4 = 0.8
        },
      ];

      const coverage = service.calculateCoverage(assumptions);
      // Total weight: 3 + 2 = 5
      // Covered weight: 3 * 1.0 + 2 * 0.4 = 3.8
      // Coverage: 3.8/5 * 100 = 76%
      expect(coverage).toBe(76);
    });

    it('should return 100 when all assumptions have high-quality sources', () => {
      const assumptions: Assumption[] = [
        {
          id: 'A1',
          name: 'Test 1',
          value: 100,
          sourceUrls: ['http://example.com'],
          certainty: 'High',
          lastChecked: new Date(),
          category: 'market',
          impact: 'critical',
        },
        {
          id: 'A2',
          name: 'Test 2',
          value: 200,
          sourceUrls: ['http://example2.com'],
          certainty: 'High',
          lastChecked: new Date(),
          category: 'financial',
          impact: 'important',
        },
      ];

      const coverage = service.calculateCoverage(assumptions);
      expect(coverage).toBe(100);
    });
  });

  describe('identifyGaps', () => {
    it('should identify missing source gaps', async () => {
      const ledger: AssumptionLedger = {
        assumptions: [
          {
            id: 'A1',
            name: 'Test Assumption',
            value: 100,
            sourceUrls: [],
            certainty: 'High',
            lastChecked: new Date(),
            category: 'market',
            impact: 'critical',
          },
        ],
        coverage_pct: 0,
        lastUpdated: new Date(),
        totalClaims: 1,
        backedClaims: 0,
      };

      const result = await service.identifyGaps(ledger);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].gapType).toBe('missing_source');
      expect(result.data![0].assumptionId).toBe('A1');
    });

    it('should identify low certainty gaps', async () => {
      const ledger: AssumptionLedger = {
        assumptions: [
          {
            id: 'A1',
            name: 'Test Assumption',
            value: 100,
            sourceUrls: ['http://example.com'],
            certainty: 'Low',
            lastChecked: new Date(),
            category: 'market',
            impact: 'critical',
          },
        ],
        coverage_pct: 100,
        lastUpdated: new Date(),
        totalClaims: 1,
        backedClaims: 1,
      };

      const result = await service.identifyGaps(ledger);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].gapType).toBe('low_certainty');
    });

    it('should identify stale data gaps', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 days ago

      const ledger: AssumptionLedger = {
        assumptions: [
          {
            id: 'A1',
            name: 'Test Assumption',
            value: 100,
            sourceUrls: ['http://example.com'],
            certainty: 'High',
            lastChecked: oldDate,
            category: 'market',
            impact: 'critical',
          },
        ],
        coverage_pct: 100,
        lastUpdated: new Date(),
        totalClaims: 1,
        backedClaims: 1,
      };

      const result = await service.identifyGaps(ledger);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].gapType).toBe('stale_data');
    });

    it('should return empty array when no gaps exist', async () => {
      const ledger: AssumptionLedger = {
        assumptions: [
          {
            id: 'A1',
            name: 'Test Assumption',
            value: 100,
            sourceUrls: ['http://example.com'],
            certainty: 'High',
            lastChecked: new Date(),
            category: 'market',
            impact: 'critical',
          },
        ],
        coverage_pct: 100,
        lastUpdated: new Date(),
        totalClaims: 1,
        backedClaims: 1,
      };

      const result = await service.identifyGaps(ledger);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('validateSources', () => {
    it('should update lastChecked timestamp for all assumptions', async () => {
      const assumptions: Assumption[] = [
        {
          id: 'A1',
          name: 'Test 1',
          value: 100,
          sourceUrls: ['https://mckinsey.com/report'],
          certainty: 'Medium',
          lastChecked: new Date('2020-01-01'),
          category: 'market',
          impact: 'critical',
        },
      ];

      const validated = await service.validateSources(assumptions);

      expect(validated[0].lastChecked.getTime()).toBeGreaterThan(new Date('2020-01-01').getTime());
    });

    it('should assign high certainty for A-tier sources', async () => {
      const assumptions: Assumption[] = [
        {
          id: 'A1',
          name: 'Test 1',
          value: 100,
          sourceUrls: ['https://mckinsey.com/report', 'https://harvard.edu/study'],
          certainty: 'Medium',
          lastChecked: new Date('2020-01-01'),
          category: 'market',
          impact: 'critical',
        },
      ];

      const validated = await service.validateSources(assumptions);

      expect(validated[0].certainty).toBe('High');
    });

    it('should assign medium certainty for B-tier sources', async () => {
      const assumptions: Assumption[] = [
        {
          id: 'A1',
          name: 'Test 1',
          value: 100,
          sourceUrls: ['https://techcrunch.com/article'],
          certainty: 'Low',
          lastChecked: new Date('2020-01-01'),
          category: 'market',
          impact: 'critical',
        },
      ];

      const validated = await service.validateSources(assumptions);

      expect(validated[0].certainty).toBe('Medium');
    });

    it('should filter out invalid URLs', async () => {
      const assumptions: Assumption[] = [
        {
          id: 'A1',
          name: 'Test 1',
          value: 100,
          sourceUrls: ['https://mckinsey.com/report', 'invalid-url', 'https://harvard.edu/study'],
          certainty: 'Medium',
          lastChecked: new Date('2020-01-01'),
          category: 'market',
          impact: 'critical',
        },
      ];

      const validated = await service.validateSources(assumptions);

      expect(validated[0].sourceUrls).toEqual([
        'https://mckinsey.com/report',
        'https://harvard.edu/study',
      ]);
      expect(validated[0].certainty).toBe('High'); // A-tier sources
    });

    it('should preserve all other assumption properties', async () => {
      const assumptions: Assumption[] = [
        {
          id: 'A1',
          name: 'Test 1',
          value: 100,
          sourceUrls: ['https://example.com'],
          certainty: 'High',
          lastChecked: new Date('2020-01-01'),
          category: 'market',
          impact: 'critical',
        },
      ];

      const validated = await service.validateSources(assumptions);

      expect(validated[0].id).toBe('A1');
      expect(validated[0].name).toBe('Test 1');
      expect(validated[0].value).toBe(100);
      expect(validated[0].category).toBe('market');
      expect(validated[0].impact).toBe('critical');
    });

    it('should handle assumptions without sources', async () => {
      const assumptions: Assumption[] = [
        {
          id: 'A1',
          name: 'Test 1',
          value: 100,
          sourceUrls: [],
          certainty: 'Low',
          lastChecked: new Date('2020-01-01'),
          category: 'market',
          impact: 'critical',
        },
      ];

      const validated = await service.validateSources(assumptions);

      expect(validated[0].sourceUrls).toEqual([]);
      expect(validated[0].certainty).toBe('Medium'); // Default for no sources
    });
  });
});
