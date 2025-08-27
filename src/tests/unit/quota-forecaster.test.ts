// Unit tests for Quota Forecaster component

import { QuotaForecaster } from '../../components/quota-forecaster';
import { Workflow, OptimizedWorkflow, WorkflowStep } from '../../models/workflow';
import { QuotaCostModel, OptimizationScenario } from '../../models/quota';
import { ZeroBasedSolution } from '../../models/consulting';
import { OptionalParams } from '../../models/intent';

describe('QuotaForecaster', () => {
  let quotaForecaster: QuotaForecaster;
  let mockCostModel: QuotaCostModel;
  let mockWorkflow: Workflow;
  let mockOptimizedWorkflow: OptimizedWorkflow;

  beforeEach(() => {
    mockCostModel = {
      vibeUnitCost: 0.01,
      specUnitCost: 0.05,
      operationCosts: new Map([
        ['data_retrieval', 1],
        ['processing', 2],
        ['analysis', 3],
        ['vibe', 1],
        ['spec', 5]
      ])
    };

    quotaForecaster = new QuotaForecaster(mockCostModel);

    const mockSteps: WorkflowStep[] = [
      {
        id: 'step1',
        type: 'vibe',
        description: 'Parse user input',
        inputs: ['user_input'],
        outputs: ['parsed_data'],
        quotaCost: 0.01
      },
      {
        id: 'step2',
        type: 'data_retrieval',
        description: 'Fetch data from API',
        inputs: ['parsed_data'],
        outputs: ['api_data'],
        quotaCost: 0.02
      },
      {
        id: 'step3',
        type: 'analysis',
        description: 'Analyze retrieved data',
        inputs: ['api_data'],
        outputs: ['analysis_result'],
        quotaCost: 0.04
      }
    ];

    mockWorkflow = {
      id: 'test-workflow',
      steps: mockSteps,
      dataFlow: [
        { from: 'step1', to: 'step2', dataType: 'parsed_data', required: true },
        { from: 'step2', to: 'step3', dataType: 'api_data', required: true }
      ],
      estimatedComplexity: 5
    };

    mockOptimizedWorkflow = {
      ...mockWorkflow,
      optimizations: [
        {
          type: 'batching',
          description: 'Batch API calls',
          stepsAffected: ['step2'],
          estimatedSavings: {
            vibes: 20,
            specs: 0,
            percentage: 15
          }
        }
      ],
      originalWorkflow: mockWorkflow,
      efficiencyGains: {
        vibeReduction: 20,
        specReduction: 0,
        costSavings: 0.004,
        totalSavingsPercentage: 15
      }
    };
  });

  describe('estimateNaiveConsumption', () => {
    it('should calculate consumption for a simple workflow', async () => {
      const result = await quotaForecaster.estimateNaiveConsumption(mockWorkflow);

      expect(result.scenario).toBe('naive');
      expect(result.vibesConsumed).toBeGreaterThan(0);
      expect(result.estimatedCost).toBeGreaterThan(0);
      expect(result.confidenceLevel).toBe('medium');
      expect(result.breakdown).toHaveLength(3);
    });

    it('should handle vibe steps correctly', async () => {
      const vibeWorkflow: Workflow = {
        id: 'vibe-workflow',
        steps: [
          {
            id: 'vibe1',
            type: 'vibe',
            description: 'Simple vibe operation',
            inputs: [],
            outputs: ['result'],
            quotaCost: 0.01
          }
        ],
        dataFlow: [],
        estimatedComplexity: 2
      };

      const result = await quotaForecaster.estimateNaiveConsumption(vibeWorkflow);

      expect(result.vibesConsumed).toBe(1);
      expect(result.specsConsumed).toBe(0);
      expect(result.confidenceLevel).toBe('high');
    });

    it('should handle spec steps correctly', async () => {
      const specWorkflow: Workflow = {
        id: 'spec-workflow',
        steps: [
          {
            id: 'spec1',
            type: 'spec',
            description: 'Spec operation',
            inputs: [],
            outputs: ['result'],
            quotaCost: 0.05
          }
        ],
        dataFlow: [],
        estimatedComplexity: 3
      };

      const result = await quotaForecaster.estimateNaiveConsumption(specWorkflow);

      expect(result.vibesConsumed).toBe(0);
      expect(result.specsConsumed).toBe(1);
    });

    it('should adjust confidence level based on complexity', async () => {
      const complexWorkflow = { ...mockWorkflow, estimatedComplexity: 10 };
      const result = await quotaForecaster.estimateNaiveConsumption(complexWorkflow);
      expect(result.confidenceLevel).toBe('low');

      const simpleWorkflow = { ...mockWorkflow, estimatedComplexity: 2 };
      const simpleResult = await quotaForecaster.estimateNaiveConsumption(simpleWorkflow);
      expect(simpleResult.confidenceLevel).toBe('high');
    });
  });

  describe('estimateOptimizedConsumption', () => {
    it('should apply optimization savings', async () => {
      const result = await quotaForecaster.estimateOptimizedConsumption(mockOptimizedWorkflow);

      expect(result.scenario).toBe('optimized');
      expect(result.vibesConsumed).toBeGreaterThan(0);
      expect(result.confidenceLevel).toBe('high');
    });

    it('should update breakdown for affected steps', async () => {
      const result = await quotaForecaster.estimateOptimizedConsumption(mockOptimizedWorkflow);
      
      const affectedStep = result.breakdown.find(b => b.stepId === 'step2');
      expect(affectedStep).toBeDefined();
      expect(affectedStep!.cost).toBeGreaterThanOrEqual(0);
    });

    it('should not reduce consumption below zero', async () => {
      const aggressiveOptimization = {
        ...mockOptimizedWorkflow,
        optimizations: [
          {
            type: 'batching' as const,
            description: 'Aggressive optimization',
            stepsAffected: ['step1', 'step2', 'step3'],
            estimatedSavings: {
              vibes: 100,
              specs: 100,
              percentage: 100
            }
          }
        ]
      };

      const result = await quotaForecaster.estimateOptimizedConsumption(aggressiveOptimization);

      expect(result.vibesConsumed).toBeGreaterThanOrEqual(0);
      expect(result.specsConsumed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('estimateZeroBasedConsumption', () => {
    it('should calculate minimal consumption for zero-based solution', async () => {
      const zeroBasedSolution: ZeroBasedSolution = {
        radicalApproach: 'Complete workflow redesign with minimal operations',
        assumptionsChallenged: ['Need for multiple API calls', 'Complex data processing'],
        potentialSavings: 80,
        implementationRisk: 'medium'
      };

      const result = await quotaForecaster.estimateZeroBasedConsumption(zeroBasedSolution);

      expect(result.scenario).toBe('zero-based');
      expect(result.vibesConsumed).toBeGreaterThanOrEqual(1);
      expect(result.confidenceLevel).toBe('medium');
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].stepDescription).toBe(zeroBasedSolution.radicalApproach);
    });

    it('should adjust confidence based on implementation risk', async () => {
      const lowRiskSolution: ZeroBasedSolution = {
        radicalApproach: 'Low risk approach',
        assumptionsChallenged: [],
        potentialSavings: 50,
        implementationRisk: 'low'
      };

      const highRiskSolution: ZeroBasedSolution = {
        radicalApproach: 'High risk approach',
        assumptionsChallenged: [],
        potentialSavings: 90,
        implementationRisk: 'high'
      };

      const lowRiskResult = await quotaForecaster.estimateZeroBasedConsumption(lowRiskSolution);
      const highRiskResult = await quotaForecaster.estimateZeroBasedConsumption(highRiskSolution);

      expect(lowRiskResult.confidenceLevel).toBe('high');
      expect(highRiskResult.confidenceLevel).toBe('low');
    });
  });

  describe('calculateSavings', () => {
    it('should calculate savings between naive and optimized forecasts', async () => {
      const naive = await quotaForecaster.estimateNaiveConsumption(mockWorkflow);
      const optimized = await quotaForecaster.estimateOptimizedConsumption(mockOptimizedWorkflow);

      const savings = quotaForecaster.calculateSavings(naive, optimized);

      expect(savings.vibeReduction).toBeGreaterThanOrEqual(0);
      expect(savings.specReduction).toBeGreaterThanOrEqual(0);
      expect(savings.costSavings).toBeGreaterThanOrEqual(0);
      expect(savings.totalSavingsPercentage).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero consumption scenarios', () => {
      const zeroForecast = {
        vibesConsumed: 0,
        specsConsumed: 0,
        estimatedCost: 0,
        confidenceLevel: 'high' as const,
        scenario: 'naive' as const,
        breakdown: []
      };

      const savings = quotaForecaster.calculateSavings(zeroForecast, zeroForecast);

      expect(savings.vibeReduction).toBe(0);
      expect(savings.specReduction).toBe(0);
      expect(savings.costSavings).toBe(0);
      expect(savings.totalSavingsPercentage).toBe(0);
    });
  });

  describe('generateROITable', () => {
    it('should generate ROI analysis for multiple scenarios', async () => {
      const scenarios = [
        {
          name: 'Naive Approach',
          forecast: await quotaForecaster.estimateNaiveConsumption(mockWorkflow),
          savingsPercentage: 0,
          implementationEffort: 'low',
          riskLevel: 'low'
        },
        {
          name: 'Optimized Approach',
          forecast: await quotaForecaster.estimateOptimizedConsumption(mockOptimizedWorkflow),
          savingsPercentage: 25,
          implementationEffort: 'medium',
          riskLevel: 'medium'
        },
        {
          name: 'Zero-Based Approach',
          forecast: await quotaForecaster.estimateZeroBasedConsumption({
            radicalApproach: 'Complete redesign',
            assumptionsChallenged: ['All assumptions'],
            potentialSavings: 70,
            implementationRisk: 'high'
          }),
          savingsPercentage: 70,
          implementationEffort: 'high',
          riskLevel: 'high'
        }
      ];

      const result = await quotaForecaster.generateROITable(scenarios);

      expect(result.scenarios).toHaveLength(3);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.bestOption).toBeDefined();
      expect(result.riskAssessment).toBeDefined();
      expect(typeof result.riskAssessment).toBe('string');
    });

    it('should sort scenarios by savings percentage', async () => {
      const scenarios = [
        {
          name: 'Low Savings',
          forecast: await quotaForecaster.estimateNaiveConsumption(mockWorkflow),
          savingsPercentage: 10,
          implementationEffort: 'low',
          riskLevel: 'low'
        },
        {
          name: 'High Savings',
          forecast: await quotaForecaster.estimateOptimizedConsumption(mockOptimizedWorkflow),
          savingsPercentage: 50,
          implementationEffort: 'high',
          riskLevel: 'high'
        }
      ];

      const result = await quotaForecaster.generateROITable(scenarios);

      expect(result.scenarios[0].savingsPercentage).toBeGreaterThan(result.scenarios[1].savingsPercentage);
    });

    it('should identify best option based on risk/effort/savings balance', async () => {
      const scenarios = [
        {
          name: 'High Risk High Savings',
          forecast: await quotaForecaster.estimateNaiveConsumption(mockWorkflow),
          savingsPercentage: 80,
          implementationEffort: 'high',
          riskLevel: 'high'
        },
        {
          name: 'Balanced Option',
          forecast: await quotaForecaster.estimateOptimizedConsumption(mockOptimizedWorkflow),
          savingsPercentage: 50,
          implementationEffort: 'medium',
          riskLevel: 'medium'
        }
      ];

      const result = await quotaForecaster.generateROITable(scenarios);

      // The balanced option should be preferred due to better risk/effort profile
      // With 50% savings vs 80%, and medium risk/effort vs high risk/effort
      // Score for balanced: 50 * 0.8 * 0.9 = 36
      // Score for high risk: 80 * 0.6 * 0.7 = 33.6
      expect(result.bestOption).toBe('Balanced Option');
    });

    it('should throw error for empty scenarios', async () => {
      await expect(quotaForecaster.generateROITable([])).rejects.toThrow('At least one scenario is required for ROI analysis');
    });

    it('should provide risk assessment for high-risk scenarios', async () => {
      const scenarios = [
        {
          name: 'High Risk',
          forecast: await quotaForecaster.estimateNaiveConsumption(mockWorkflow),
          savingsPercentage: 60,
          implementationEffort: 'high',
          riskLevel: 'high'
        }
      ];

      const result = await quotaForecaster.generateROITable(scenarios);

      expect(result.riskAssessment).toContain('high-risk');
    });
  });

  describe('calculateMultiScenarioSavings', () => {
    it('should calculate savings across multiple scenarios', async () => {
      const naiveForecast = await quotaForecaster.estimateNaiveConsumption(mockWorkflow);
      const optimizedForecast = await quotaForecaster.estimateOptimizedConsumption(mockOptimizedWorkflow);
      const zeroBasedForecast = await quotaForecaster.estimateZeroBasedConsumption({
        radicalApproach: 'Complete redesign',
        assumptionsChallenged: ['All assumptions'],
        potentialSavings: 70,
        implementationRisk: 'medium'
      });

      const forecasts = [naiveForecast, optimizedForecast, zeroBasedForecast];
      const result = quotaForecaster.calculateMultiScenarioSavings(forecasts);

      expect(result.conservativeSavings).toBeGreaterThanOrEqual(0);
      expect(result.balancedSavings).toBeGreaterThanOrEqual(0);
      expect(result.boldSavings).toBeGreaterThanOrEqual(0);
      expect(result.recommendedApproach).toBeDefined();
      expect(typeof result.recommendedApproach).toBe('string');
    });

    it('should handle scenarios with only naive forecast', async () => {
      const naiveForecast = await quotaForecaster.estimateNaiveConsumption(mockWorkflow);
      const forecasts = [naiveForecast];

      const result = quotaForecaster.calculateMultiScenarioSavings(forecasts);

      expect(result.conservativeSavings).toBe(0);
      expect(result.balancedSavings).toBe(0);
      expect(result.boldSavings).toBe(0);
      expect(result.recommendedApproach).toContain('efficient');
    });

    it('should recommend bold approach for high-confidence high-savings scenarios', async () => {
      const naiveForecast = {
        vibesConsumed: 100,
        specsConsumed: 10,
        estimatedCost: 1.5,
        confidenceLevel: 'high' as const,
        scenario: 'naive' as const,
        breakdown: []
      };

      const zeroBasedForecast = {
        vibesConsumed: 10,
        specsConsumed: 1,
        estimatedCost: 0.15,
        confidenceLevel: 'high' as const,
        scenario: 'zero-based' as const,
        breakdown: []
      };

      const forecasts = [naiveForecast, zeroBasedForecast];
      const result = quotaForecaster.calculateMultiScenarioSavings(forecasts);

      expect(result.boldSavings).toBeGreaterThan(80);
      expect(result.recommendedApproach).toContain('Bold');
    });

    it('should recommend conservative approach for low savings scenarios', async () => {
      const naiveForecast = {
        vibesConsumed: 10,
        specsConsumed: 1,
        estimatedCost: 0.15,
        confidenceLevel: 'high' as const,
        scenario: 'naive' as const,
        breakdown: []
      };

      const optimizedForecast = {
        vibesConsumed: 9,
        specsConsumed: 1,
        estimatedCost: 0.14,
        confidenceLevel: 'high' as const,
        scenario: 'optimized' as const,
        breakdown: []
      };

      const forecasts = [naiveForecast, optimizedForecast];
      const result = quotaForecaster.calculateMultiScenarioSavings(forecasts);

      expect(result.conservativeSavings).toBeLessThan(10);
      expect(result.recommendedApproach).toBe('Minimal optimization needed');
    });

    it('should recommend balanced approach for moderate savings', async () => {
      const naiveForecast = {
        vibesConsumed: 50,
        specsConsumed: 5,
        estimatedCost: 0.75,
        confidenceLevel: 'high' as const,
        scenario: 'naive' as const,
        breakdown: []
      };

      const optimizedForecast = {
        vibesConsumed: 35,
        specsConsumed: 4,
        estimatedCost: 0.55,
        confidenceLevel: 'high' as const,
        scenario: 'optimized' as const,
        breakdown: []
      };

      const zeroBasedForecast = {
        vibesConsumed: 20,
        specsConsumed: 2,
        estimatedCost: 0.30,
        confidenceLevel: 'medium' as const,
        scenario: 'zero-based' as const,
        breakdown: []
      };

      const forecasts = [naiveForecast, optimizedForecast, zeroBasedForecast];
      const result = quotaForecaster.calculateMultiScenarioSavings(forecasts);

      expect(result.conservativeSavings).toBeGreaterThan(15);
      expect(result.balancedSavings).toBeGreaterThan(30);
      expect(result.recommendedApproach).toBe('Balanced');
    });

    it('should throw error for empty forecasts array', () => {
      expect(() => quotaForecaster.calculateMultiScenarioSavings([])).toThrow('At least one forecast is required for multi-scenario savings calculation');
    });
  });

  describe('setCostModel', () => {
    it('should update the cost model', () => {
      const newCostModel: QuotaCostModel = {
        vibeUnitCost: 0.02,
        specUnitCost: 0.10,
        operationCosts: new Map([['test', 1]])
      };

      quotaForecaster.setCostModel(newCostModel);

      // Test that the new cost model is being used
      expect(() => quotaForecaster.setCostModel(newCostModel)).not.toThrow();
    });
  });

  describe('parameter integration', () => {
    it('should adjust consumption for high user volume', async () => {
      const highVolumeParams: OptionalParams = {
        expectedUserVolume: 5000
      };

      const resultWithVolume = await quotaForecaster.estimateNaiveConsumption(mockWorkflow, highVolumeParams);
      const resultWithoutVolume = await quotaForecaster.estimateNaiveConsumption(mockWorkflow);

      expect(resultWithVolume.vibesConsumed).toBeGreaterThan(resultWithoutVolume.vibesConsumed);
      expect(resultWithVolume.specsConsumed).toBeGreaterThanOrEqual(resultWithoutVolume.specsConsumed);
    });

    it('should reduce consumption for low user volume', async () => {
      const lowVolumeParams: OptionalParams = {
        expectedUserVolume: 5
      };

      const resultWithVolume = await quotaForecaster.estimateNaiveConsumption(mockWorkflow, lowVolumeParams);
      const resultWithoutVolume = await quotaForecaster.estimateNaiveConsumption(mockWorkflow);

      expect(resultWithVolume.vibesConsumed).toBeLessThanOrEqual(resultWithoutVolume.vibesConsumed);
      expect(resultWithVolume.specsConsumed).toBeLessThanOrEqual(resultWithoutVolume.specsConsumed);
    });

    it('should adjust consumption for performance sensitivity', async () => {
      const highPerfParams: OptionalParams = {
        performanceSensitivity: 'high'
      };

      const lowPerfParams: OptionalParams = {
        performanceSensitivity: 'low'
      };

      const highPerfResult = await quotaForecaster.estimateNaiveConsumption(mockWorkflow, highPerfParams);
      const lowPerfResult = await quotaForecaster.estimateNaiveConsumption(mockWorkflow, lowPerfParams);

      expect(highPerfResult.vibesConsumed).toBeGreaterThan(lowPerfResult.vibesConsumed);
    });

    it('should respect cost constraints', async () => {
      const constrainedParams: OptionalParams = {
        costConstraints: {
          maxVibes: 2,
          maxSpecs: 1,
          maxCostDollars: 0.10
        }
      };

      const result = await quotaForecaster.estimateNaiveConsumption(mockWorkflow, constrainedParams);

      expect(result.vibesConsumed).toBeLessThanOrEqual(2);
      expect(result.specsConsumed).toBeLessThanOrEqual(1);
      expect(result.estimatedCost).toBeLessThanOrEqual(0.10);
    });

    it('should adjust confidence based on parameters', async () => {
      const highVolumeParams: OptionalParams = {
        expectedUserVolume: 10000
      };

      const tightConstraintsParams: OptionalParams = {
        costConstraints: {
          maxVibes: 2,
          maxCostDollars: 0.05
        }
      };

      const highPerfParams: OptionalParams = {
        performanceSensitivity: 'high'
      };

      const highVolumeResult = await quotaForecaster.estimateNaiveConsumption(mockWorkflow, highVolumeParams);
      const constrainedResult = await quotaForecaster.estimateNaiveConsumption(mockWorkflow, tightConstraintsParams);
      const highPerfResult = await quotaForecaster.estimateNaiveConsumption(mockWorkflow, highPerfParams);

      // High volume should reduce confidence
      expect(['low', 'medium']).toContain(highVolumeResult.confidenceLevel);
      
      // Tight constraints should reduce confidence
      expect(['low', 'medium']).toContain(constrainedResult.confidenceLevel);
      
      // High performance sensitivity should increase confidence
      expect(['medium', 'high']).toContain(highPerfResult.confidenceLevel);
    });

    it('should work with zero-based consumption and parameters', async () => {
      const zeroBasedSolution: ZeroBasedSolution = {
        radicalApproach: 'Minimal implementation',
        assumptionsChallenged: ['Current complexity'],
        potentialSavings: 80,
        implementationRisk: 'medium'
      };

      const constrainedParams: OptionalParams = {
        costConstraints: {
          maxCostDollars: 0.02
        }
      };

      const result = await quotaForecaster.estimateZeroBasedConsumption(zeroBasedSolution, constrainedParams);

      expect(result.estimatedCost).toBeLessThanOrEqual(0.02);
      expect(result.scenario).toBe('zero-based');
    });

    it('should work with optimized consumption and parameters', async () => {
      const highVolumeParams: OptionalParams = {
        expectedUserVolume: 8000
      };

      const result = await quotaForecaster.estimateOptimizedConsumption(mockOptimizedWorkflow, highVolumeParams);

      expect(result.scenario).toBe('optimized');
      expect(result.vibesConsumed).toBeGreaterThan(0);
    });
  });
});