/**
 * Unit tests for Amazon Working Backwards - Scenario Service
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ScenarioService } from '../../services/amazon/scenarios';
import { ScenarioContext, FinancialModel } from '../../models/scenarios';
import { AssumptionLedger } from '../../models/assumptions';

describe('ScenarioService', () => {
  let service: ScenarioService;
  let sampleContext: ScenarioContext;

  beforeEach(() => {
    service = new ScenarioService();
    
    const sampleLedger: AssumptionLedger = {
      assumptions: [
        {
          id: 'A1',
          name: 'Revenue',
          value: 1000000,
          sourceUrls: ['http://example.com'],
          certainty: 'High',
          lastChecked: new Date(),
          category: 'financial',
          impact: 'critical'
        },
        {
          id: 'A2',
          name: 'Development Cost',
          value: 500000,
          sourceUrls: ['http://example.com'],
          certainty: 'Medium',
          lastChecked: new Date(),
          category: 'financial',
          impact: 'critical'
        }
      ],
      coverage_pct: 100,
      lastUpdated: new Date(),
      totalClaims: 2,
      backedClaims: 2
    };

    const sampleFinancialModel: FinancialModel = {
      revenue: 1000000,
      costs: 500000,
      roi: 100,
      npv: 500000
    };

    sampleContext = {
      ledger: sampleLedger,
      basicCalc: sampleFinancialModel,
      topIds: ['A1', 'A2'],
      scenarioPct: 0.2
    };
  });

  describe('runScenarios', () => {
    it('should successfully generate bear/base/bull scenarios', async () => {
      const result = await service.runScenarios(sampleContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const scenarios = result.data!;
      expect(scenarios.scenarios.bear).toBeDefined();
      expect(scenarios.scenarios.base).toBeDefined();
      expect(scenarios.scenarios.bull).toBeDefined();
      expect(scenarios.elasticities).toBeDefined();
      expect(scenarios.keyDrivers).toBeDefined();
      expect(scenarios.sensitivityPct).toBe(20);
    });

    it('should generate scenarios for all financial metrics', async () => {
      const result = await service.runScenarios(sampleContext);
      
      expect(result.success).toBe(true);
      const scenarios = result.data!.scenarios;
      
      const expectedMetrics = ['Revenue', 'Costs', 'ROI', 'NPV'];
      expectedMetrics.forEach(metric => {
        expect(scenarios.base.find(s => s.metric === metric)).toBeDefined();
        expect(scenarios.bear.find(s => s.metric === metric)).toBeDefined();
        expect(scenarios.bull.find(s => s.metric === metric)).toBeDefined();
      });
    });

    it('should apply correct percentage changes for bear scenarios', async () => {
      const result = await service.runScenarios(sampleContext);
      
      expect(result.success).toBe(true);
      const scenarios = result.data!.scenarios;
      
      const revenueBase = scenarios.base.find(s => s.metric === 'Revenue');
      const revenueBear = scenarios.bear.find(s => s.metric === 'Revenue');
      
      expect(revenueBase?.base).toBe(1000000);
      expect(revenueBear?.bear).toBe(800000); // 20% reduction for positive metric
    });

    it('should apply correct percentage changes for bull scenarios', async () => {
      const result = await service.runScenarios(sampleContext);
      
      expect(result.success).toBe(true);
      const scenarios = result.data!.scenarios;
      
      const revenueBase = scenarios.base.find(s => s.metric === 'Revenue');
      const revenueBull = scenarios.bull.find(s => s.metric === 'Revenue');
      
      expect(revenueBase?.base).toBe(1000000);
      expect(revenueBull?.bull).toBe(1200000); // 20% increase for positive metric
    });

    it('should handle cost metrics inversely (bear increases, bull decreases)', async () => {
      const result = await service.runScenarios(sampleContext);
      
      expect(result.success).toBe(true);
      const scenarios = result.data!.scenarios;
      
      const costsBase = scenarios.base.find(s => s.metric === 'Costs');
      const costsBear = scenarios.bear.find(s => s.metric === 'Costs');
      const costsBull = scenarios.bull.find(s => s.metric === 'Costs');
      
      expect(costsBase?.base).toBe(500000);
      expect(costsBear?.bear).toBe(600000); // 20% increase for bear (worse case)
      expect(costsBull?.bull).toBe(400000); // 20% decrease for bull (better case)
    });

    it('should handle zero values gracefully', async () => {
      const zeroContext: ScenarioContext = {
        ...sampleContext,
        basicCalc: {
          revenue: 0,
          costs: 0,
          roi: 0,
          npv: 0
        }
      };

      const result = await service.runScenarios(zeroContext);
      
      expect(result.success).toBe(true);
      const scenarios = result.data!.scenarios;
      
      scenarios.base.forEach(scenario => {
        expect(scenario.base).toBe(0);
      });
      scenarios.bear.forEach(scenario => {
        expect(scenario.bear).toBe(0);
      });
      scenarios.bull.forEach(scenario => {
        expect(scenario.bull).toBe(0);
      });
    });

    it('should handle errors gracefully', async () => {
      const invalidContext = null as any;
      
      const result = await service.runScenarios(invalidContext);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SCENARIO_ANALYSIS_ERROR');
    });
  });

  describe('calculateElasticities', () => {
    it('should calculate elasticities for all metrics with specific assumptions', () => {
      const baseCase: FinancialModel = {
        revenue: 1000000,
        costs: 500000,
        roi: 100,
        npv: 500000
      };

      const scenarios = {
        bear: [
          { metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000 },
          { metric: 'ROI', bear: 80, base: 100, bull: 120 }
        ],
        base: [
          { metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000 },
          { metric: 'ROI', bear: 80, base: 100, bull: 120 }
        ],
        bull: [
          { metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000 },
          { metric: 'ROI', bear: 80, base: 100, bull: 120 }
        ]
      };

      const elasticities = service.calculateElasticities(baseCase, scenarios, sampleContext);
      
      expect(elasticities.length).toBeGreaterThan(0);
      expect(elasticities[0].assumptionChange).toBe('±20%');
      expect(elasticities[0].outcomeChange).toMatch(/±\d+(%|pp)/);
      expect(elasticities[0].assumption).toBeDefined();
      expect(elasticities[0].assumption).not.toBe('Key Assumptions'); // Should use specific assumption names
    });

    it('should sort elasticities by sensitivity (highest first)', () => {
      const baseCase: FinancialModel = {
        revenue: 1000000,
        costs: 500000,
        roi: 100,
        npv: 500000
      };

      const scenarios = {
        bear: [
          { metric: 'Revenue', bear: 900000, base: 1000000, bull: 1100000 }, // 10% change
          { metric: 'ROI', bear: 70, base: 100, bull: 130 } // 30% change
        ],
        base: [
          { metric: 'Revenue', bear: 900000, base: 1000000, bull: 1100000 },
          { metric: 'ROI', bear: 70, base: 100, bull: 130 }
        ],
        bull: [
          { metric: 'Revenue', bear: 900000, base: 1000000, bull: 1100000 },
          { metric: 'ROI', bear: 70, base: 100, bull: 130 }
        ]
      };

      const elasticities = service.calculateElasticities(baseCase, scenarios, sampleContext);
      
      expect(elasticities.length).toBeGreaterThan(0);
      // Should be sorted by sensitivity (descending)
      for (let i = 0; i < elasticities.length - 1; i++) {
        expect(elasticities[i].sensitivity).toBeGreaterThanOrEqual(elasticities[i + 1].sensitivity);
      }
    });

    it('should handle non-numeric values gracefully', () => {
      const baseCase: FinancialModel = {
        revenue: 1000000,
        costs: 500000,
        roi: 100,
        npv: 500000
      };

      const scenarios = {
        bear: [
          { metric: 'Revenue', bear: 'N/A', base: 1000000, bull: 1200000 }
        ],
        base: [
          { metric: 'Revenue', bear: 'N/A', base: 1000000, bull: 1200000 }
        ],
        bull: [
          { metric: 'Revenue', bear: 'N/A', base: 1000000, bull: 1200000 }
        ]
      };

      const elasticities = service.calculateElasticities(baseCase, scenarios, sampleContext);
      
      expect(elasticities).toHaveLength(0); // Should skip non-numeric values
    });

    it('should format outcome changes correctly for percentage vs absolute metrics', () => {
      const baseCase: FinancialModel = {
        revenue: 1000000,
        costs: 500000,
        roi: 100,
        npv: 500000
      };

      const scenarios = {
        bear: [
          { metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000 },
          { metric: 'ROI', bear: 80, base: 100, bull: 120 }
        ],
        base: [
          { metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000 },
          { metric: 'ROI', bear: 80, base: 100, bull: 120 }
        ],
        bull: [
          { metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000 },
          { metric: 'ROI', bear: 80, base: 100, bull: 120 }
        ]
      };

      const elasticities = service.calculateElasticities(baseCase, scenarios, sampleContext);
      
      const revenueElasticity = elasticities.find(e => e.outcomeMetric === 'Revenue');
      const roiElasticity = elasticities.find(e => e.outcomeMetric === 'ROI');
      
      if (revenueElasticity) {
        expect(revenueElasticity.outcomeChange).toMatch(/±\d+%/); // Percentage for revenue
      }
      if (roiElasticity) {
        expect(roiElasticity.outcomeChange).toMatch(/±\d+pp/); // Percentage points for ROI
      }
    });
  });

  describe('identifyKeyDrivers', () => {
    it('should identify key drivers from critical assumptions', () => {
      const elasticities = [
        {
          assumption: 'Revenue',
          assumptionChange: '±20%',
          outcomeMetric: 'Revenue',
          outcomeChange: '±15%',
          sensitivity: 15
        },
        {
          assumption: 'Development Cost',
          assumptionChange: '±20%',
          outcomeMetric: 'ROI',
          outcomeChange: '±10%',
          sensitivity: 10
        }
      ];

      const keyDrivers = service.identifyKeyDrivers(elasticities, sampleContext.ledger);
      
      expect(keyDrivers).toHaveLength(2); // Two assumptions in elasticities
      expect(keyDrivers[0].assumption).toBe('Revenue'); // Highest sensitivity first
      expect(keyDrivers[1].assumption).toBe('Development Cost');
    });

    it('should sort key drivers by impact (highest first)', () => {
      const elasticities = [
        {
          assumption: 'Key Assumptions',
          assumptionChange: '±20%',
          outcomeMetric: 'Revenue',
          outcomeChange: '±15%',
          sensitivity: 15
        }
      ];

      const keyDrivers = service.identifyKeyDrivers(elasticities, sampleContext.ledger);
      
      // Should be sorted by impact (descending)
      for (let i = 0; i < keyDrivers.length - 1; i++) {
        expect(keyDrivers[i].impact).toBeGreaterThanOrEqual(keyDrivers[i + 1].impact);
      }
    });

    it('should limit to top 5 assumptions', () => {
      // Create elasticities with many assumptions
      const manyElasticities = Array.from({ length: 10 }, (_, i) => ({
        assumption: `Assumption ${i + 1}`,
        assumptionChange: '±20%',
        outcomeMetric: 'Revenue',
        outcomeChange: '±15%',
        sensitivity: 15 - i // Decreasing sensitivity
      }));

      const largeLedger: AssumptionLedger = {
        assumptions: Array.from({ length: 10 }, (_, i) => ({
          id: `A${i + 1}`,
          name: `Assumption ${i + 1}`,
          value: 1000,
          sourceUrls: ['http://example.com'],
          certainty: 'High' as const,
          lastChecked: new Date(),
          category: 'financial' as const,
          impact: 'critical' as const
        })),
        coverage_pct: 100,
        lastUpdated: new Date(),
        totalClaims: 10,
        backedClaims: 10
      };

      const keyDrivers = service.identifyKeyDrivers(manyElasticities, largeLedger);
      
      expect(keyDrivers.length).toBeLessThanOrEqual(5); // Should limit to 5
    });

    it('should include meaningful descriptions', () => {
      const elasticities = [
        {
          assumption: 'Key Assumptions',
          assumptionChange: '±20%',
          outcomeMetric: 'Revenue',
          outcomeChange: '±15%',
          sensitivity: 15
        }
      ];

      const keyDrivers = service.identifyKeyDrivers(elasticities, sampleContext.ledger);
      
      keyDrivers.forEach(driver => {
        expect(driver.description).toBeDefined();
        expect(driver.description.length).toBeGreaterThan(0);
        expect(driver.description).toContain(driver.assumption);
      });
    });
  });

  describe('validateScenarios', () => {
    it('should validate consistent scenarios successfully', async () => {
      const validResults = {
        scenarios: {
          bear: [
            { metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000 },
            { metric: 'ROI', bear: 80, base: 100, bull: 120 },
            { metric: 'Costs', bear: 600000, base: 500000, bull: 400000 }
          ],
          base: [
            { metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000 },
            { metric: 'ROI', bear: 80, base: 100, bull: 120 },
            { metric: 'Costs', bear: 600000, base: 500000, bull: 400000 }
          ],
          bull: [
            { metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000 },
            { metric: 'ROI', bear: 80, base: 100, bull: 120 },
            { metric: 'Costs', bear: 600000, base: 500000, bull: 400000 }
          ]
        },
        elasticities: [
          {
            assumption: 'Revenue',
            assumptionChange: '±20%',
            outcomeMetric: 'ROI',
            outcomeChange: '±15%',
            sensitivity: 15
          }
        ],
        keyDrivers: [
          {
            assumption: 'Revenue',
            assumptionId: 'A1',
            impact: 15,
            description: 'Revenue shows high sensitivity'
          }
        ],
        sensitivityPct: 20
      };

      const result = await service.validateScenarios(validResults);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should detect inconsistent positive metric scenarios', async () => {
      const invalidResults = {
        scenarios: {
          bear: [
            { metric: 'Revenue', bear: 1200000, base: 1000000, bull: 800000 } // Inconsistent order
          ],
          base: [
            { metric: 'Revenue', bear: 1200000, base: 1000000, bull: 800000 }
          ],
          bull: [
            { metric: 'Revenue', bear: 1200000, base: 1000000, bull: 800000 }
          ]
        },
        elasticities: [],
        keyDrivers: [],
        sensitivityPct: 20
      };

      const result = await service.validateScenarios(invalidResults);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('consistency violation');
      expect(result.error?.message).toContain('positive metric');
    });

    it('should detect inconsistent cost metric scenarios', async () => {
      const invalidResults = {
        scenarios: {
          bear: [
            { metric: 'Costs', bear: 400000, base: 500000, bull: 600000 } // Wrong order for costs
          ],
          base: [
            { metric: 'Costs', bear: 400000, base: 500000, bull: 600000 }
          ],
          bull: [
            { metric: 'Costs', bear: 400000, base: 500000, bull: 600000 }
          ]
        },
        elasticities: [],
        keyDrivers: [],
        sensitivityPct: 20
      };

      const result = await service.validateScenarios(invalidResults);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('consistency violation');
      expect(result.error?.message).toContain('cost metric');
    });

    it('should detect unrealistic elasticity values', async () => {
      const invalidResults = {
        scenarios: {
          bear: [{ metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000 }],
          base: [{ metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000 }],
          bull: [{ metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000 }]
        },
        elasticities: [
          {
            assumption: 'Revenue',
            assumptionChange: '±20%',
            outcomeMetric: 'ROI',
            outcomeChange: '±1500%', // Unrealistic
            sensitivity: 1500
          }
        ],
        keyDrivers: [],
        sensitivityPct: 20
      };

      const result = await service.validateScenarios(invalidResults);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unrealistic elasticity');
    });

    it('should detect improperly sorted key drivers', async () => {
      const invalidResults = {
        scenarios: {
          bear: [{ metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000 }],
          base: [{ metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000 }],
          bull: [{ metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000 }]
        },
        elasticities: [],
        keyDrivers: [
          { assumption: 'Low Impact', assumptionId: 'A1', impact: 5, description: 'Low' },
          { assumption: 'High Impact', assumptionId: 'A2', impact: 15, description: 'High' } // Wrong order
        ],
        sensitivityPct: 20
      };

      const result = await service.validateScenarios(invalidResults);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Key drivers not properly sorted');
    });

    it('should handle string values in validation', async () => {
      const mixedResults = {
        scenarios: {
          bear: [
            { metric: 'Revenue', bear: 'N/A', base: 1000000, bull: 1200000 }
          ],
          base: [
            { metric: 'Revenue', bear: 'N/A', base: 1000000, bull: 1200000 }
          ],
          bull: [
            { metric: 'Revenue', bear: 'N/A', base: 1000000, bull: 1200000 }
          ]
        },
        elasticities: [],
        keyDrivers: [],
        sensitivityPct: 20
      };

      const result = await service.validateScenarios(mixedResults);
      
      expect(result.success).toBe(true); // Should skip validation for non-numeric values
    });
  });

  describe('scenario generation with assumption perturbation', () => {
    it('should generate scenarios based on top numeric assumptions', async () => {
      const contextWithNumericAssumptions: ScenarioContext = {
        ...sampleContext,
        ledger: {
          ...sampleContext.ledger,
          assumptions: [
            {
              id: 'A1',
              name: 'Customer Acquisition Cost',
              value: 100,
              unit: 'USD',
              sourceUrls: ['http://example.com'],
              certainty: 'High',
              lastChecked: new Date(),
              category: 'financial',
              impact: 'critical'
            },
            {
              id: 'A2',
              name: 'Conversion Rate',
              value: 0.05,
              unit: '%',
              sourceUrls: ['http://example.com'],
              certainty: 'Medium',
              lastChecked: new Date(),
              category: 'market',
              impact: 'critical'
            }
          ]
        }
      };

      const result = await service.runScenarios(contextWithNumericAssumptions);
      
      expect(result.success).toBe(true);
      const scenarios = result.data!;
      
      // Should have elasticities that reference specific assumptions
      expect(scenarios.elasticities.length).toBeGreaterThan(0);
      const hasSpecificAssumptions = scenarios.elasticities.some(e => 
        e.assumption === 'Customer Acquisition Cost' || e.assumption === 'Conversion Rate'
      );
      expect(hasSpecificAssumptions).toBe(true);
    });

    it('should limit key drivers to top 5', async () => {
      const largeLedger: AssumptionLedger = {
        assumptions: Array.from({ length: 10 }, (_, i) => ({
          id: `A${i + 1}`,
          name: `Critical Assumption ${i + 1}`,
          value: 1000 + i * 100,
          sourceUrls: ['http://example.com'],
          certainty: 'High' as const,
          lastChecked: new Date(),
          category: 'financial' as const,
          impact: 'critical' as const
        })),
        coverage_pct: 100,
        lastUpdated: new Date(),
        totalClaims: 10,
        backedClaims: 10
      };

      const largeContext: ScenarioContext = {
        ...sampleContext,
        ledger: largeLedger
      };

      const result = await service.runScenarios(largeContext);
      
      expect(result.success).toBe(true);
      expect(result.data!.keyDrivers.length).toBeLessThanOrEqual(5);
    });

    it('should include meaningful descriptions for key drivers', async () => {
      const result = await service.runScenarios(sampleContext);
      
      expect(result.success).toBe(true);
      const keyDrivers = result.data!.keyDrivers;
      
      keyDrivers.forEach(driver => {
        expect(driver.description).toBeDefined();
        expect(driver.description.length).toBeGreaterThan(10);
        expect(driver.description).toContain(driver.assumption);
      });
    });
  });
});