// Unit tests for Kiro Resource Optimizer component

import { KiroResourceOptimizer } from '../../components/kiro-resource-optimizer';
import { Workflow, OptimizedWorkflow, WorkflowStep } from '../../models/workflow';
import { QuotaCostModel, OptimizationScenario } from '../../models/quota';
import { ZeroBasedSolution } from '../../models/consulting';
import { OptionalParams } from '../../models/intent';

describe('KiroResourceOptimizer', () => {
  let kiroResourceOptimizer: KiroResourceOptimizer;
  let mockCostModel: QuotaCostModel;
  let mockWorkflow: Workflow;
  let mockOptimizedWorkflow: OptimizedWorkflow;

  beforeEach(() => {
    mockCostModel = {
      vibeUnitCost: 0.01,
      specUnitCost: 0.05,
      operationCosts: new Map([
        ['kiro_vibe_coding', 1],
        ['kiro_spec_generation', 5],
        ['kiro_autopilot', 2],
        ['kiro_supervised', 1.5],
        ['data_retrieval', 1],
        ['processing', 2],
        ['analysis', 3],
        ['vibe', 1],
        ['spec', 5],
      ]),
    };

    kiroResourceOptimizer = new KiroResourceOptimizer(mockCostModel);

    const mockSteps: WorkflowStep[] = [
      {
        id: 'step1',
        description: 'Kiro vibe coding session',
        type: 'kiro_vibe_coding',
        quotaCost: 1,
        inputs: [],
        outputs: ['code'],
      },
      {
        id: 'step2',
        description: 'Kiro spec generation',
        type: 'kiro_spec_generation',
        quotaCost: 5,
        inputs: ['code'],
        outputs: ['spec'],
      },
      {
        id: 'step3',
        description: 'Analysis with Kiro',
        type: 'analysis',
        quotaCost: 3,
        inputs: ['spec'],
        outputs: ['analysis'],
      },
    ];

    mockWorkflow = {
      id: 'test-workflow',
      name: 'Test Kiro Workflow',
      description: 'A test workflow for Kiro optimization',
      steps: mockSteps,
      dataFlow: [],
      estimatedComplexity: 5,
    };

    mockOptimizedWorkflow = {
      ...mockWorkflow,
      optimizations: [
        {
          id: 'opt1',
          description: 'Kiro autopilot optimization',
          type: 'kiro_optimization',
          stepsAffected: ['step1', 'step2'],
          estimatedSavings: {
            vibes: 30,
            specs: 20,
            percentage: 25,
            time: 40,
          },
        },
      ],
      originalWorkflow: mockWorkflow,
      efficiencyGains: {
        vibeReduction: 30,
        specReduction: 20,
        costSavings: 100,
        totalSavingsPercentage: 25,
      },
    };
  });

  describe('estimateVibeConsumption', () => {
    it('should calculate Kiro-optimized vibe consumption', async () => {
      const result = await kiroResourceOptimizer.estimateVibeConsumption(mockWorkflow);

      expect(result.scenario).toBe('kiro-optimized');
      expect(result.vibesConsumed).toBeGreaterThan(0);
      expect(result.confidenceLevel).toBe('high'); // Kiro provides higher confidence
      expect(result.breakdown).toHaveLength(3);
      expect(result.breakdown[0].kiroOptimization).toContain('Optimized for rapid coding');
    });

    it('should handle Kiro vibe mode specifically', async () => {
      const vibeWorkflow = {
        ...mockWorkflow,
        steps: [
          {
            id: 'vibe1',
            description: 'Kiro vibe coding',
            type: 'kiro_vibe_coding' as const,
            quotaCost: 1,
            inputs: [],
            outputs: ['code'],
          },
        ],
      };

      const result = await kiroResourceOptimizer.estimateVibeConsumption(vibeWorkflow);

      expect(result.vibesConsumed).toBe(1);
      expect(result.specsConsumed).toBe(0);
      expect(result.breakdown[0].kiroOptimization).toContain('rapid coding');
    });

    it('should handle Kiro spec mode with minimal vibes', async () => {
      const specWorkflow = {
        ...mockWorkflow,
        steps: [
          {
            id: 'spec1',
            description: 'Kiro spec generation',
            type: 'kiro_spec_generation' as const,
            quotaCost: 5,
            inputs: [],
            outputs: ['spec'],
          },
        ],
      };

      const result = await kiroResourceOptimizer.estimateVibeConsumption(specWorkflow);

      expect(result.vibesConsumed).toBe(0.2); // Minimal vibes for spec mode
      expect(result.specsConsumed).toBe(1);
      expect(result.breakdown[0].kiroOptimization).toContain('Spec mode handles');
    });

    it('should handle Kiro autopilot mode', async () => {
      const autopilotWorkflow = {
        ...mockWorkflow,
        steps: [
          {
            id: 'autopilot1',
            description: 'Kiro autopilot development',
            type: 'kiro_autopilot' as const,
            quotaCost: 2,
            inputs: [],
            outputs: ['automated-code'],
          },
        ],
      };

      const result = await kiroResourceOptimizer.estimateVibeConsumption(autopilotWorkflow);

      expect(result.vibesConsumed).toBeGreaterThan(0);
      expect(result.breakdown[0].kiroOptimization).toContain('Autopilot mode');
    });

    it('should adjust confidence level based on Kiro capabilities', async () => {
      const complexWorkflow = { ...mockWorkflow, estimatedComplexity: 10 };
      const result = await kiroResourceOptimizer.estimateVibeConsumption(complexWorkflow);
      expect(result.confidenceLevel).toBe('medium'); // Kiro makes complex workflows more manageable

      const simpleWorkflow = { ...mockWorkflow, estimatedComplexity: 2 };
      const simpleResult = await kiroResourceOptimizer.estimateVibeConsumption(simpleWorkflow);
      expect(simpleResult.confidenceLevel).toBe('high');
    });
  });

  describe('estimateSpecConsumption', () => {
    it('should optimize for spec-focused development', async () => {
      const result = await kiroResourceOptimizer.estimateSpecConsumption(mockWorkflow);

      expect(result.scenario).toBe('kiro-spec-optimized');
      expect(result.confidenceLevel).toBe('high');
      expect(result.specsConsumed).toBeGreaterThan(0);
    });

    it('should convert vibe operations to specs when beneficial', async () => {
      const vibeHeavyWorkflow = {
        ...mockWorkflow,
        steps: [
          {
            id: 'heavy-vibe',
            description: 'Complex vibe operation',
            type: 'vibe' as const,
            quotaCost: 4, // High cost that benefits from spec conversion
            inputs: [],
            outputs: ['complex-code'],
          },
        ],
      };

      const result = await kiroResourceOptimizer.estimateSpecConsumption(vibeHeavyWorkflow);

      expect(result.specsConsumed).toBe(1);
      expect(result.vibesConsumed).toBe(0);
      expect(result.breakdown[0].kiroOptimization).toContain('Converted to spec mode');
    });
  });

  describe('estimateOptimizedKiroUsage', () => {
    it('should apply Kiro-enhanced optimizations', async () => {
      const result = await kiroResourceOptimizer.estimateOptimizedKiroUsage(mockOptimizedWorkflow);

      expect(result.scenario).toBe('kiro-advanced-optimized');
      expect(result.confidenceLevel).toBe('high');
      expect(result.vibesConsumed).toBeGreaterThan(0);
    });

    it('should update breakdown with Kiro optimization notes', async () => {
      const result = await kiroResourceOptimizer.estimateOptimizedKiroUsage(mockOptimizedWorkflow);

      const optimizedStep = result.breakdown.find(b => b.stepId === 'step1');
      expect(optimizedStep?.kiroOptimization).toContain('Advanced Kiro workflow optimization');
    });
  });

  describe('estimateZeroBasedKiroApproach', () => {
    it('should leverage Kiro capabilities for aggressive optimization', async () => {
      const zeroBasedSolution: ZeroBasedSolution = {
        radicalApproach: 'Complete Kiro-native development approach',
        potentialSavings: 70,
        implementationRisk: 'medium',
        keyAssumptions: ['Full Kiro adoption', 'Team training completed'],
      };

      const result = await kiroResourceOptimizer.estimateZeroBasedKiroApproach(zeroBasedSolution);

      expect(result.scenario).toBe('kiro-zero-based');
      expect(result.confidenceLevel).toBe('high'); // Kiro enables higher confidence
      expect(result.vibesConsumed).toBeLessThan(2); // Aggressive optimization
      expect(result.breakdown[0].kiroOptimization).toContain('full Kiro capabilities');
    });

    it('should enhance savings with Kiro capabilities', async () => {
      const zeroBasedSolution: ZeroBasedSolution = {
        radicalApproach: 'Kiro-first development',
        potentialSavings: 50,
        implementationRisk: 'low',
        keyAssumptions: ['Kiro expertise available'],
      };

      const result = await kiroResourceOptimizer.estimateZeroBasedKiroApproach(zeroBasedSolution);

      expect(result.vibesConsumed).toBeLessThan(1); // Enhanced savings
      expect(result.confidenceLevel).toBe('high');
    });
  });

  describe('calculateVibeCodingROI', () => {
    it('should calculate comprehensive Vibe Coding ROI metrics', async () => {
      const roi = await kiroResourceOptimizer.calculateVibeCodingROI(mockWorkflow, 5);

      // Development velocity metrics
      expect(roi.developmentVelocity.baselineHoursPerFeature).toBe(40);
      expect(roi.developmentVelocity.vibeOptimizedHours).toBeLessThan(40);
      expect(roi.developmentVelocity.velocityMultiplier).toBeGreaterThan(1);
      expect(roi.developmentVelocity.timeToMarketReduction).toBeGreaterThan(0);

      // Code quality metrics
      expect(roi.codeQuality.bugReductionPercentage).toBeGreaterThan(0);
      expect(roi.codeQuality.testCoverageImprovement).toBeGreaterThan(0);
      expect(roi.codeQuality.maintainabilityScore).toBeGreaterThan(50);
      expect(roi.codeQuality.technicalDebtReduction).toBeGreaterThan(0);

      // Developer productivity metrics
      expect(roi.developerProductivity.dailyTaskCompletion).toBeGreaterThan(3);
      expect(roi.developerProductivity.contextSwitchingReduction).toBe(60);
      expect(roi.developerProductivity.learningCurveAcceleration).toBeGreaterThan(0);
      expect(roi.developerProductivity.burnoutReduction).toBe(35);

      // Business impact metrics
      expect(roi.businessImpact.featureDeliveryRate).toBeGreaterThan(100);
      expect(roi.businessImpact.customerSatisfactionGain).toBeGreaterThan(0);
      expect(roi.businessImpact.revenueAcceleration).toBeGreaterThan(0);
      expect(roi.businessImpact.competitiveAdvantage).toBeGreaterThan(0);

      // Cost savings metrics
      expect(roi.costSavings.developerHoursSaved).toBeGreaterThan(0);
      expect(roi.costSavings.infrastructureCostReduction).toBe(25);
      expect(roi.costSavings.maintenanceCostSavings).toBeGreaterThan(0);
      expect(roi.costSavings.totalROIPercentage).toBeGreaterThan(0);
    });

    it('should scale ROI calculations based on team size', async () => {
      const smallTeamROI = await kiroResourceOptimizer.calculateVibeCodingROI(mockWorkflow, 3);
      const largeTeamROI = await kiroResourceOptimizer.calculateVibeCodingROI(mockWorkflow, 10);

      expect(largeTeamROI.costSavings.developerHoursSaved).toBeGreaterThan(
        smallTeamROI.costSavings.developerHoursSaved
      );
      // ROI percentage should be similar or better for larger teams due to economies of scale
      expect(largeTeamROI.costSavings.totalROIPercentage).toBeGreaterThanOrEqual(
        smallTeamROI.costSavings.totalROIPercentage * 0.6 // Allow for reasonable variance in scaling
      );
    });
  });

  describe('analyzeKiroModeEfficiency', () => {
    it('should provide comprehensive Kiro mode analysis with Vibe Coding ROI', async () => {
      const analysis = await kiroResourceOptimizer.analyzeKiroModeEfficiency(mockWorkflow);

      expect(analysis.vibeMode.optimalUsage).toBeGreaterThan(0);
      expect(analysis.vibeMode.efficiencyGains).toBeGreaterThan(0);
      expect(analysis.vibeMode.bestPractices.some(p => p.includes('rapid prototyping'))).toBe(true);
      expect(analysis.vibeMode.vibeCodingROI).toBeDefined();
      expect(analysis.vibeMode.vibeCodingROI.developmentVelocity.velocityMultiplier).toBeGreaterThan(1);

      expect(analysis.specMode.optimalUsage).toBeGreaterThan(0);
      expect(analysis.specMode.featureDeliveryRate).toBeGreaterThan(1);
      expect(analysis.specMode.qualityImprovements.some(q => q.includes('Comprehensive feature documentation'))).toBe(true);
      expect(analysis.specMode.specModeROI).toBeDefined();
      expect(analysis.specMode.specModeROI.comprehensiveFeatureDelivery).toBeGreaterThan(100);

      expect(analysis.hybridApproach.vibeSpecRatio).toBeGreaterThan(0);
      expect(analysis.hybridApproach.vibeSpecRatio).toBeLessThanOrEqual(1);
      expect(analysis.hybridApproach.recommendedSplit).toMatch(/\d+% Vibe, \d+% Spec/);
      expect(analysis.hybridApproach.combinedROI).toBeDefined();
      expect(analysis.hybridApproach.combinedROI.optimalEfficiency).toBeGreaterThan(100);
    });

    it('should include enhanced best practices for Vibe mode', async () => {
      const analysis = await kiroResourceOptimizer.analyzeKiroModeEfficiency(mockWorkflow);

      expect(analysis.vibeMode.bestPractices.some(p => p.includes('real-time collaboration'))).toBe(true);
      expect(analysis.vibeMode.bestPractices.some(p => p.includes('technical debt incrementally'))).toBe(true);
      expect(analysis.vibeMode.bestPractices.length).toBeGreaterThan(4);
    });

    it('should adjust recommendations based on workflow complexity', async () => {
      const complexWorkflow = { ...mockWorkflow, estimatedComplexity: 9 };
      const analysis = await kiroResourceOptimizer.analyzeKiroModeEfficiency(complexWorkflow);

      // Complex workflows should favor more spec usage
      expect(analysis.hybridApproach.vibeSpecRatio).toBeLessThanOrEqual(0.5);
    });

    it('should provide ROI metrics in expected outcomes', async () => {
      const analysis = await kiroResourceOptimizer.analyzeKiroModeEfficiency(mockWorkflow);

      const roiOutcome = analysis.hybridApproach.expectedOutcomes.find(outcome =>
        outcome.includes('ROI from Vibe Coding')
      );
      expect(roiOutcome).toBeDefined();
      expect(roiOutcome).toMatch(/\d+% ROI from Vibe Coding/);
    });
  });

  describe('calculateKiroResourceMetrics', () => {
    it('should calculate Kiro-specific metrics', async () => {
      const forecast1 = await kiroResourceOptimizer.estimateVibeConsumption(mockWorkflow);
      const forecast2 = await kiroResourceOptimizer.estimateSpecConsumption(mockWorkflow);

      const metrics = kiroResourceOptimizer.calculateKiroResourceMetrics([forecast1, forecast2]);

      expect(metrics.vibeEfficiency).toBeGreaterThan(0);
      expect(metrics.specUtilization).toBeGreaterThan(0);
      expect(metrics.kiroModeOptimization).toBeGreaterThan(0);
      expect(metrics.developmentVelocity).toBeGreaterThan(1); // Should show improvement
      expect(metrics.codeQualityScore).toBeGreaterThan(0);
    });
  });

  describe('generateKiroROIAnalysis', () => {
    it('should provide comprehensive Kiro-enhanced ROI analysis with Vibe Coding metrics', async () => {
      const scenarios: OptimizationScenario[] = [
        {
          name: 'Kiro Vibe Mode',
          forecast: await kiroResourceOptimizer.estimateVibeConsumption(mockWorkflow),
          savingsPercentage: 40,
          implementationEffort: 'low',
          riskLevel: 'low',
        },
        {
          name: 'Kiro Spec Mode',
          forecast: await kiroResourceOptimizer.estimateSpecConsumption(mockWorkflow),
          savingsPercentage: 60,
          implementationEffort: 'medium',
          riskLevel: 'low',
        },
      ];

      const analysis = await kiroResourceOptimizer.generateKiroROIAnalysis(scenarios);

      // Check for Vibe Coding ROI recommendations
      expect(analysis.recommendations.some(r => r.includes('Vibe Coding ROI'))).toBe(true);
      expect(analysis.recommendations.some(r => r.includes('Development Velocity'))).toBe(true);
      expect(analysis.recommendations.some(r => r.includes('Quality Improvements'))).toBe(true);
      expect(analysis.recommendations.some(r => r.includes('Developer Productivity'))).toBe(true);
      expect(analysis.recommendations.some(r => r.includes('Cost Savings'))).toBe(true);

      // Check for Kiro Resource Optimization recommendations
      expect(analysis.recommendations.some(r => 
        r.includes('Kiro Resource Optimization') && r.includes('efficiency gains')
      )).toBe(true);

      // Check for business metrics
      expect(analysis.recommendations.some(r => r.includes('Business Metrics'))).toBe(true);
      expect(analysis.recommendations.some(r => r.includes('Technical Health'))).toBe(true);

      expect(analysis.riskAssessment).toContain('Kiro Resource Optimizer');
      expect(analysis.riskAssessment).toContain('Vibe Coding');
      expect(analysis.bestOption).toMatch(/Kiro/);
    });

    it('should provide detailed Vibe vs Spec recommendations with ROI metrics', async () => {
      const scenarios: OptimizationScenario[] = [
        {
          name: 'Kiro Vibe Approach',
          forecast: await kiroResourceOptimizer.estimateVibeConsumption(mockWorkflow),
          savingsPercentage: 50,
          implementationEffort: 'low',
          riskLevel: 'low',
        },
        {
          name: 'Kiro Spec Approach',
          forecast: await kiroResourceOptimizer.estimateSpecConsumption(mockWorkflow),
          savingsPercentage: 30,
          implementationEffort: 'medium',
          riskLevel: 'low',
        },
      ];

      const analysis = await kiroResourceOptimizer.generateKiroROIAnalysis(scenarios);

      // Should recommend Vibe mode due to higher savings
      expect(analysis.recommendations.some(r => 
        r.includes('Vibe Mode Advantage') && r.includes('development velocity')
      )).toBe(true);
      expect(analysis.recommendations.some(r => 
        r.includes('Vibe Mode Business Impact') && r.includes('competitive advantage')
      )).toBe(true);
    });

    it('should recommend hybrid approach when savings are balanced', async () => {
      const scenarios: OptimizationScenario[] = [
        {
          name: 'Kiro Vibe Approach',
          forecast: await kiroResourceOptimizer.estimateVibeConsumption(mockWorkflow),
          savingsPercentage: 45,
          implementationEffort: 'low',
          riskLevel: 'low',
        },
        {
          name: 'Kiro Spec Approach',
          forecast: await kiroResourceOptimizer.estimateSpecConsumption(mockWorkflow),
          savingsPercentage: 40,
          implementationEffort: 'medium',
          riskLevel: 'low',
        },
      ];

      const analysis = await kiroResourceOptimizer.generateKiroROIAnalysis(scenarios);

      expect(analysis.recommendations.some(r => 
        r.includes('Hybrid Approach Optimal')
      )).toBe(true);
      expect(analysis.recommendations.some(r => 
        r.includes('Combined ROI') && r.includes('blended return')
      )).toBe(true);
    });

    it('should include enhanced risk assessment with Vibe Coding capabilities', async () => {
      const scenarios: OptimizationScenario[] = [
        {
          name: 'High Risk Kiro Approach',
          forecast: await kiroResourceOptimizer.estimateVibeConsumption(mockWorkflow),
          savingsPercentage: 70,
          implementationEffort: 'high',
          riskLevel: 'high',
        },
      ];

      const analysis = await kiroResourceOptimizer.generateKiroROIAnalysis(scenarios);

      expect(analysis.riskAssessment).toContain('context switching reduction');
      expect(analysis.riskAssessment).toContain('bug reduction');
      expect(analysis.riskAssessment).toContain('development velocity');
      expect(analysis.riskAssessment).toContain('feedback cycles');
    });

    it('should apply enhanced scoring with Vibe Coding factors', async () => {
      const scenarios: OptimizationScenario[] = [
        {
          name: 'Standard Approach',
          forecast: await kiroResourceOptimizer.estimateVibeConsumption(mockWorkflow),
          savingsPercentage: 30,
          implementationEffort: 'medium',
          riskLevel: 'medium',
        },
        {
          name: 'Kiro Vibe Optimized',
          forecast: await kiroResourceOptimizer.estimateVibeConsumption(mockWorkflow),
          savingsPercentage: 35,
          implementationEffort: 'medium',
          riskLevel: 'medium',
        },
      ];

      const analysis = await kiroResourceOptimizer.generateKiroROIAnalysis(scenarios);

      // Kiro Vibe approach should be selected due to enhanced scoring
      expect(analysis.bestOption).toBe('Kiro Vibe Optimized');
    });
  });

  describe('calculateMultiScenarioSavings', () => {
    it('should provide Kiro-enhanced savings analysis', async () => {
      const forecasts = [
        await kiroResourceOptimizer.estimateVibeConsumption(mockWorkflow),
        await kiroResourceOptimizer.estimateOptimizedKiroUsage(mockOptimizedWorkflow),
      ];

      const savings = kiroResourceOptimizer.calculateMultiScenarioSavings(forecasts);

      expect(savings.conservativeSavings).toBeGreaterThanOrEqual(0);
      expect(savings.balancedSavings).toBeGreaterThanOrEqual(0);
      expect(savings.boldSavings).toBeGreaterThanOrEqual(0);
      expect(savings.recommendedApproach).toContain('Kiro');
    });

    it('should recommend Kiro-specific approaches', async () => {
      const forecasts = [
        await kiroResourceOptimizer.estimateVibeConsumption(mockWorkflow),
        await kiroResourceOptimizer.estimateOptimizedKiroUsage(mockOptimizedWorkflow),
      ];

      const savings = kiroResourceOptimizer.calculateMultiScenarioSavings(forecasts);

      expect(savings.recommendedApproach).toMatch(
        /Kiro|Conservative|Balanced|Bold|efficiency|optimization/
      );
    });
  });

  describe('backward compatibility', () => {
    it('should maintain legacy method names', async () => {
      // Test that legacy methods still work
      const naiveResult = await kiroResourceOptimizer.estimateNaiveConsumption(mockWorkflow);
      const optimizedResult = await kiroResourceOptimizer.estimateOptimizedConsumption(mockOptimizedWorkflow);
      
      expect(naiveResult).toBeDefined();
      expect(optimizedResult).toBeDefined();
      expect(naiveResult.scenario).toBe('kiro-optimized');
      expect(optimizedResult.scenario).toBe('kiro-advanced-optimized');
    });

    it('should support legacy ROI table generation', async () => {
      const scenarios: OptimizationScenario[] = [
        {
          name: 'Test Scenario',
          forecast: await kiroResourceOptimizer.estimateVibeConsumption(mockWorkflow),
          savingsPercentage: 30,
          implementationEffort: 'medium',
          riskLevel: 'low',
        },
      ];

      const roiTable = await kiroResourceOptimizer.generateROITable(scenarios);
      expect(roiTable).toBeDefined();
      expect(roiTable.scenarios).toHaveLength(1);
    });
  });

  describe('Kiro parameter adjustments', () => {
    it('should apply Kiro-specific cost adjustments', async () => {
      const params: OptionalParams = {
        expectedUserVolume: 100,
        performanceSensitivity: 'high',
        costConstraints: {
          maxVibes: 5,
          maxSpecs: 2,
          maxCostDollars: 0.5,
        },
      };

      const result = await kiroResourceOptimizer.estimateVibeConsumption(mockWorkflow, params);

      expect(result.vibesConsumed).toBeLessThanOrEqual(5);
      expect(result.specsConsumed).toBeLessThanOrEqual(2);
      expect(result.estimatedCost).toBeLessThanOrEqual(0.5);
    });

    it('should boost confidence with Kiro capabilities', async () => {
      const params: OptionalParams = {
        performanceSensitivity: 'high',
      };

      const result = await kiroResourceOptimizer.estimateVibeConsumption(mockWorkflow, params);

      // Kiro should boost confidence even with high performance requirements
      expect(result.confidenceLevel).toBe('high');
    });
  });
});