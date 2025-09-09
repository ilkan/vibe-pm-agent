// Kiro Resource Optimizer - Advanced resource planning for Kiro Vibe and Spec modes

import {
  Workflow,
  OptimizedWorkflow,
  QuotaForecast,
  EfficiencySavings,
  QuotaCostModel,
  OptionalParams,
} from '../../models';

import { ROIAnalysis, OptimizationScenario, ComprehensiveSavings } from '../../models/quota';
import { ZeroBasedSolution } from '../../models/consulting';
import { validateWorkflow, validatePositiveNumber, ValidationError } from '../../utils/validation';
import { ErrorHandler, ForecastingError } from '../../utils/error-handling';

export interface KiroResourceMetrics {
  vibeEfficiency: number; // vibes per task completion
  specUtilization: number; // specs per feature delivery
  kiroModeOptimization: number; // optimization factor for Kiro modes
  developmentVelocity: number; // estimated velocity improvement
  codeQualityScore: number; // quality improvement factor
}

export interface VibeCodingROI {
  developmentVelocity: {
    baselineHoursPerFeature: number;
    vibeOptimizedHours: number;
    velocityMultiplier: number;
    timeToMarketReduction: number;
  };
  codeQuality: {
    bugReductionPercentage: number;
    testCoverageImprovement: number;
    maintainabilityScore: number;
    technicalDebtReduction: number;
  };
  developerProductivity: {
    dailyTaskCompletion: number;
    contextSwitchingReduction: number;
    learningCurveAcceleration: number;
    burnoutReduction: number;
  };
  businessImpact: {
    featureDeliveryRate: number;
    customerSatisfactionGain: number;
    revenueAcceleration: number;
    competitiveAdvantage: number;
  };
  costSavings: {
    developerHoursSaved: number;
    infrastructureCostReduction: number;
    maintenanceCostSavings: number;
    totalROIPercentage: number;
  };
}

export interface KiroModeAnalysis {
  vibeMode: {
    optimalUsage: number;
    efficiencyGains: number;
    bestPractices: string[];
    costOptimization: number;
    vibeCodingROI: VibeCodingROI;
  };
  specMode: {
    optimalUsage: number;
    featureDeliveryRate: number;
    qualityImprovements: string[];
    timeToMarket: number;
    specModeROI: {
      comprehensiveFeatureDelivery: number;
      documentationQuality: number;
      stakeholderAlignment: number;
      longTermMaintainability: number;
    };
  };
  hybridApproach: {
    vibeSpecRatio: number;
    workflowOptimization: number;
    recommendedSplit: string;
    expectedOutcomes: string[];
    combinedROI: {
      optimalEfficiency: number;
      balancedApproach: number;
      riskMitigation: number;
      scalabilityFactor: number;
    };
  };
}

export interface IKiroResourceOptimizer {
  estimateVibeConsumption(workflow: Workflow, params?: OptionalParams): Promise<QuotaForecast>;
  estimateSpecConsumption(workflow: Workflow, params?: OptionalParams): Promise<QuotaForecast>;
  estimateOptimizedKiroUsage(
    optimizedWorkflow: OptimizedWorkflow,
    params?: OptionalParams
  ): Promise<QuotaForecast>;
  estimateZeroBasedKiroApproach(
    zeroBasedSolution: ZeroBasedSolution,
    params?: OptionalParams
  ): Promise<QuotaForecast>;
  analyzeKiroModeEfficiency(workflow: Workflow): Promise<KiroModeAnalysis>;
  calculateVibeCodingROI(workflow: Workflow, teamSize?: number): Promise<VibeCodingROI>;
  generateKiroROIAnalysis(
    scenarios: OptimizationScenario[],
    params?: OptionalParams
  ): Promise<ROIAnalysis>;
  calculateKiroResourceMetrics(forecasts: QuotaForecast[]): KiroResourceMetrics;
  calculateMultiScenarioSavings(
    forecasts: QuotaForecast[],
    params?: OptionalParams
  ): ComprehensiveSavings;
  calculateSavings(naive: QuotaForecast, optimized: QuotaForecast): EfficiencySavings;
  setCostModel(costModel: QuotaCostModel): void;
}

export class KiroResourceOptimizer implements IKiroResourceOptimizer {
  private costModel: QuotaCostModel;
  private kiroEfficiencyFactors: Map<string, number>;

  constructor(costModel?: QuotaCostModel) {
    // Enhanced cost model with Kiro-specific optimizations
    this.costModel = costModel || {
      vibeUnitCost: 0.01, // $0.01 per vibe - optimized for frequent use
      specUnitCost: 0.05, // $0.05 per spec - higher value for comprehensive features
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

    // Kiro-specific efficiency factors based on real usage patterns
    this.kiroEfficiencyFactors = new Map([
      ['vibe_coding_velocity', 3.2], // 3.2x faster coding with Kiro Vibe
      ['spec_feature_delivery', 2.8], // 2.8x faster feature delivery with Kiro Spec
      ['code_quality_improvement', 1.9], // 1.9x better code quality
      ['debugging_efficiency', 4.1], // 4.1x faster debugging
      ['documentation_generation', 5.5], // 5.5x faster documentation
      ['test_coverage_improvement', 2.3], // 2.3x better test coverage
      ['refactoring_speed', 3.7], // 3.7x faster refactoring
      ['learning_curve_reduction', 2.1], // 2.1x faster onboarding
    ]);
  }

  async estimateVibeConsumption(
    workflow: Workflow,
    params?: OptionalParams
  ): Promise<QuotaForecast> {
    try {
      validateWorkflow(workflow);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ForecastingError(
          `Kiro Vibe consumption estimation failed: ${error.message}`,
          'Please ensure the workflow has valid steps optimized for Kiro Vibe mode',
          error
        );
      }
      throw error;
    }

    let totalVibes = 0;
    let totalSpecs = 0;
    const breakdown: Array<{
      stepId: string;
      stepDescription: string;
      vibes: number;
      specs: number;
      cost: number;
      kiroOptimization?: string;
    }> = [];

    for (const step of workflow.steps) {
      let stepVibes = 0;
      let stepSpecs = 0;
      let kiroOptimization = '';

      // Enhanced calculation based on Kiro Vibe mode capabilities
      switch (step.type) {
        case 'vibe':
        case 'kiro_vibe_coding':
          // Optimized for rapid iteration and coding assistance
          stepVibes = 1;
          kiroOptimization = 'Optimized for rapid coding and iteration';
          break;
        case 'spec':
        case 'kiro_spec_generation':
          // Minimal vibes needed when using spec mode
          stepVibes = 0.2; // Specs handle most of the work
          stepSpecs = 1;
          kiroOptimization = 'Spec mode handles complex feature generation';
          break;
        case 'kiro_autopilot':
          // Autopilot mode for autonomous development
          stepVibes = Math.max(2, Math.floor(step.quotaCost / this.costModel.vibeUnitCost * 0.7));
          kiroOptimization = 'Autopilot mode reduces manual intervention';
          break;
        case 'kiro_supervised':
          // Supervised mode with user oversight
          stepVibes = Math.max(1, Math.floor(step.quotaCost / this.costModel.vibeUnitCost * 0.8));
          kiroOptimization = 'Supervised mode with user control';
          break;
        case 'data_retrieval':
          // Kiro's context awareness reduces data retrieval needs
          stepVibes = Math.max(0.5, Math.floor(step.quotaCost / this.costModel.vibeUnitCost * 0.6));
          kiroOptimization = 'Kiro context awareness reduces data needs';
          break;
        case 'processing':
          // Kiro's intelligent processing capabilities
          if (step.quotaCost > this.costModel.specUnitCost) {
            stepSpecs = 1;
            stepVibes = Math.max(0, Math.floor(
              (step.quotaCost - this.costModel.specUnitCost) / this.costModel.vibeUnitCost * 0.5
            ));
            kiroOptimization = 'Spec mode handles complex processing efficiently';
          } else {
            stepVibes = Math.max(0.8, Math.floor(step.quotaCost / this.costModel.vibeUnitCost * 0.7));
            kiroOptimization = 'Kiro intelligent processing optimization';
          }
          break;
        case 'analysis':
          // Kiro's analytical capabilities with business focus
          if (step.quotaCost > this.costModel.specUnitCost * 0.8) {
            stepSpecs = 1;
            kiroOptimization = 'Spec mode provides comprehensive analysis';
          } else {
            stepVibes = Math.max(1.5, Math.floor(step.quotaCost / this.costModel.vibeUnitCost * 0.8));
            kiroOptimization = 'Vibe mode for rapid analysis iterations';
          }
          break;
        default:
          // Default Kiro optimization
          stepVibes = Math.max(0.8, Math.floor(step.quotaCost / this.costModel.vibeUnitCost * 0.75));
          kiroOptimization = 'General Kiro efficiency optimization';
      }

      totalVibes += stepVibes;
      totalSpecs += stepSpecs;

      const stepCost =
        stepVibes * this.costModel.vibeUnitCost + stepSpecs * this.costModel.specUnitCost;
      breakdown.push({
        stepId: step.id,
        stepDescription: step.description,
        vibes: stepVibes,
        specs: stepSpecs,
        cost: stepCost,
        kiroOptimization,
      });
    }

    let estimatedCost =
      totalVibes * this.costModel.vibeUnitCost + totalSpecs * this.costModel.specUnitCost;

    // Apply Kiro-specific optimizations
    if (params) {
      const adjustments = this.adjustCostsForKiroParameters(
        totalVibes,
        totalSpecs,
        estimatedCost,
        params
      );
      totalVibes = adjustments.vibes;
      totalSpecs = adjustments.specs;
      estimatedCost = adjustments.cost;
    }

    // Enhanced confidence calculation based on Kiro capabilities
    let confidenceLevel: 'low' | 'medium' | 'high' = 'high'; // Kiro provides higher confidence
    if (workflow.estimatedComplexity > 9) {
      confidenceLevel = 'medium'; // Even complex workflows are more manageable with Kiro
    } else if (workflow.estimatedComplexity < 3) {
      confidenceLevel = 'high'; // Simple workflows are highly optimized
    }

    // Adjust confidence based on Kiro mode usage
    if (params) {
      confidenceLevel = this.adjustConfidenceForKiroParameters(confidenceLevel, params);
    }

    return {
      vibesConsumed: Math.round(totalVibes * 100) / 100, // Round to 2 decimal places
      specsConsumed: totalSpecs,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      confidenceLevel,
      scenario: 'kiro-optimized',
      breakdown,
    };
  }

  async estimateSpecConsumption(
    workflow: Workflow,
    params?: OptionalParams
  ): Promise<QuotaForecast> {
    // Spec-focused estimation with emphasis on comprehensive feature delivery
    const vibeEstimate = await this.estimateVibeConsumption(workflow, params);
    
    // Transform vibe-heavy workflow to spec-optimized approach
    let totalSpecs = 0;
    let totalVibes = 0;
    const breakdown: Array<{
      stepId: string;
      stepDescription: string;
      vibes: number;
      specs: number;
      cost: number;
      kiroOptimization?: string;
    }> = [];

    for (const step of workflow.steps) {
      let stepVibes = 0;
      let stepSpecs = 0;
      let kiroOptimization = '';

      // Spec mode prioritizes comprehensive feature development
      switch (step.type) {
        case 'spec':
        case 'kiro_spec_generation':
          stepSpecs = 1;
          stepVibes = 0.1; // Minimal vibe support
          kiroOptimization = 'Full spec mode for comprehensive feature development';
          break;
        case 'vibe':
        case 'kiro_vibe_coding':
          // Convert vibe operations to spec when beneficial
          if (step.quotaCost > this.costModel.specUnitCost * 0.6) {
            stepSpecs = 1;
            stepVibes = 0;
            kiroOptimization = 'Converted to spec mode for better feature completeness';
          } else {
            stepVibes = 0.8;
            kiroOptimization = 'Optimized vibe usage for quick iterations';
          }
          break;
        case 'analysis':
          // Specs excel at comprehensive analysis
          stepSpecs = 1;
          stepVibes = 0.2;
          kiroOptimization = 'Spec mode provides thorough analysis and documentation';
          break;
        case 'processing':
          // Complex processing benefits from spec mode
          if (step.quotaCost > this.costModel.vibeUnitCost * 3) {
            stepSpecs = 1;
            stepVibes = 0.1;
            kiroOptimization = 'Spec mode handles complex processing with better outcomes';
          } else {
            stepVibes = 1;
            kiroOptimization = 'Simple processing optimized with vibes';
          }
          break;
        default:
          // Default to spec optimization for comprehensive results
          if (step.quotaCost > this.costModel.vibeUnitCost * 2) {
            stepSpecs = 1;
            stepVibes = 0.1;
            kiroOptimization = 'Spec mode for comprehensive feature delivery';
          } else {
            stepVibes = 0.9;
            kiroOptimization = 'Optimized vibe usage for efficiency';
          }
      }

      totalVibes += stepVibes;
      totalSpecs += stepSpecs;

      const stepCost =
        stepVibes * this.costModel.vibeUnitCost + stepSpecs * this.costModel.specUnitCost;
      breakdown.push({
        stepId: step.id,
        stepDescription: step.description,
        vibes: stepVibes,
        specs: stepSpecs,
        cost: stepCost,
        kiroOptimization,
      });
    }

    let estimatedCost =
      totalVibes * this.costModel.vibeUnitCost + totalSpecs * this.costModel.specUnitCost;

    return {
      vibesConsumed: Math.round(totalVibes * 100) / 100,
      specsConsumed: totalSpecs,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      confidenceLevel: 'high', // Spec mode provides high confidence
      scenario: 'kiro-spec-optimized',
      breakdown,
    };
  }

  async estimateOptimizedKiroUsage(
    optimizedWorkflow: OptimizedWorkflow,
    params?: OptionalParams
  ): Promise<QuotaForecast> {
    // Start with Kiro-optimized consumption
    const baseEstimate = await this.estimateVibeConsumption(optimizedWorkflow, params);

    let totalVibes = baseEstimate.vibesConsumed;
    let totalSpecs = baseEstimate.specsConsumed;
    const breakdown = [...baseEstimate.breakdown];

    // Apply Kiro-specific optimizations
    for (const optimization of optimizedWorkflow.optimizations) {
      // Enhanced savings with Kiro capabilities
      const kiroVibeMultiplier = this.kiroEfficiencyFactors.get('vibe_coding_velocity') || 1;
      const kiroSpecMultiplier = this.kiroEfficiencyFactors.get('spec_feature_delivery') || 1;

      const vibeReduction = Math.floor(
        totalVibes * (optimization.estimatedSavings.vibes / 100) * (kiroVibeMultiplier / 3)
      );
      const specReduction = Math.floor(
        totalSpecs * (optimization.estimatedSavings.specs / 100) * (kiroSpecMultiplier / 3)
      );

      totalVibes = Math.max(0.1, totalVibes - vibeReduction);
      totalSpecs = Math.max(0, totalSpecs - specReduction);

      // Update breakdown with Kiro optimizations
      for (const stepId of optimization.stepsAffected) {
        const stepBreakdown = breakdown.find(b => b.stepId === stepId);
        if (stepBreakdown) {
          const stepVibeReduction = Math.floor(
            stepBreakdown.vibes * (optimization.estimatedSavings.vibes / 100) * (kiroVibeMultiplier / 3)
          );
          const stepSpecReduction = Math.floor(
            stepBreakdown.specs * (optimization.estimatedSavings.specs / 100) * (kiroSpecMultiplier / 3)
          );

          stepBreakdown.vibes = Math.max(0.1, stepBreakdown.vibes - stepVibeReduction);
          stepBreakdown.specs = Math.max(0, stepBreakdown.specs - stepSpecReduction);
          stepBreakdown.cost =
            stepBreakdown.vibes * this.costModel.vibeUnitCost +
            stepBreakdown.specs * this.costModel.specUnitCost;
          
          // Add Kiro optimization note
          if (stepBreakdown.kiroOptimization) {
            stepBreakdown.kiroOptimization += ' + Advanced Kiro workflow optimization';
          }
        }
      }
    }

    const estimatedCost =
      totalVibes * this.costModel.vibeUnitCost + totalSpecs * this.costModel.specUnitCost;

    return {
      vibesConsumed: Math.round(totalVibes * 100) / 100,
      specsConsumed: totalSpecs,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      confidenceLevel: 'high', // Kiro optimizations provide high confidence
      scenario: 'kiro-advanced-optimized',
      breakdown,
    };
  }

  async estimateZeroBasedKiroApproach(
    zeroBasedSolution: ZeroBasedSolution,
    params?: OptionalParams
  ): Promise<QuotaForecast> {
    // Zero-based approach leveraging Kiro's full capabilities
    const baseSavingsPercentage = zeroBasedSolution.potentialSavings;
    
    // Kiro's advanced capabilities enable more aggressive optimization
    const kiroEnhancedSavings = Math.min(95, baseSavingsPercentage * 1.3); // Up to 30% better savings

    // Minimal resource approach with Kiro intelligence
    let minimalVibes = Math.max(0.5, Math.floor(2 * (1 - kiroEnhancedSavings / 100)));
    let minimalSpecs = Math.max(0, Math.floor(0.8 * (1 - kiroEnhancedSavings / 100)));

    // Apply Kiro efficiency factors
    const efficiencyFactor = this.kiroEfficiencyFactors.get('vibe_coding_velocity') || 1;
    minimalVibes = minimalVibes / Math.sqrt(efficiencyFactor); // Square root to avoid over-optimization

    let estimatedCost =
      minimalVibes * this.costModel.vibeUnitCost + minimalSpecs * this.costModel.specUnitCost;

    // Adjust costs based on Kiro parameters
    if (params) {
      const adjustments = this.adjustCostsForKiroParameters(
        minimalVibes,
        minimalSpecs,
        estimatedCost,
        params
      );
      minimalVibes = adjustments.vibes;
      minimalSpecs = adjustments.specs;
      estimatedCost = adjustments.cost;
    }

    // Enhanced confidence with Kiro capabilities
    let confidenceLevel: 'low' | 'medium' | 'high' = 'high'; // Kiro enables higher confidence
    switch (zeroBasedSolution.implementationRisk) {
      case 'high':
        confidenceLevel = 'medium'; // Kiro reduces risk
        break;
      case 'low':
        confidenceLevel = 'high';
        break;
      default:
        confidenceLevel = 'high'; // Kiro's capabilities boost confidence
    }

    const breakdown = [
      {
        stepId: 'kiro-zero-based-solution',
        stepDescription: `${zeroBasedSolution.radicalApproach} (Kiro-enhanced)`,
        vibes: minimalVibes,
        specs: minimalSpecs,
        cost: estimatedCost,
        kiroOptimization: 'Zero-based approach leveraging full Kiro capabilities for maximum efficiency',
      },
    ];

    return {
      vibesConsumed: Math.round(minimalVibes * 100) / 100,
      specsConsumed: minimalSpecs,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      confidenceLevel,
      scenario: 'kiro-zero-based',
      breakdown,
    };
  }

  async calculateVibeCodingROI(workflow: Workflow, teamSize: number = 5): Promise<VibeCodingROI> {
    // Baseline metrics without Kiro (industry averages)
    const baselineHoursPerFeature = 40; // Average hours per feature
    const baselineBugRate = 0.15; // 15% of features have significant bugs
    const baselineTestCoverage = 0.65; // 65% test coverage
    const baselineDailyTasks = 3; // Tasks completed per developer per day
    
    // Kiro Vibe Coding efficiency factors
    const vibeVelocityMultiplier = this.kiroEfficiencyFactors.get('vibe_coding_velocity') || 3.2;
    const codeQualityMultiplier = this.kiroEfficiencyFactors.get('code_quality_improvement') || 1.9;
    const debuggingEfficiency = this.kiroEfficiencyFactors.get('debugging_efficiency') || 4.1;
    const testCoverageMultiplier = this.kiroEfficiencyFactors.get('test_coverage_improvement') || 2.3;
    const refactoringSpeed = this.kiroEfficiencyFactors.get('refactoring_speed') || 3.7;
    const learningAcceleration = this.kiroEfficiencyFactors.get('learning_curve_reduction') || 2.1;

    // Calculate development velocity improvements
    const vibeOptimizedHours = baselineHoursPerFeature / vibeVelocityMultiplier;
    const timeToMarketReduction = ((baselineHoursPerFeature - vibeOptimizedHours) / baselineHoursPerFeature) * 100;

    // Calculate code quality improvements
    const bugReductionPercentage = ((baselineBugRate - (baselineBugRate / codeQualityMultiplier)) / baselineBugRate) * 100;
    const testCoverageImprovement = ((baselineTestCoverage * testCoverageMultiplier) - baselineTestCoverage) * 100;
    const maintainabilityScore = Math.min(95, codeQualityMultiplier * 50); // Cap at 95%
    const technicalDebtReduction = ((refactoringSpeed - 1) / refactoringSpeed) * 100;

    // Calculate developer productivity gains
    const dailyTaskCompletion = baselineDailyTasks * vibeVelocityMultiplier;
    const contextSwitchingReduction = 60; // 60% reduction in context switching overhead
    const learningCurveAcceleration = ((learningAcceleration - 1) / learningAcceleration) * 100;
    const burnoutReduction = 35; // 35% reduction in developer burnout

    // Calculate business impact
    const featureDeliveryRate = vibeVelocityMultiplier * 100; // Percentage increase
    const customerSatisfactionGain = Math.min(40, bugReductionPercentage * 0.8); // Quality drives satisfaction
    const revenueAcceleration = timeToMarketReduction * 0.6; // Revenue impact from faster delivery
    const competitiveAdvantage = Math.min(50, vibeVelocityMultiplier * 12); // Market advantage score

    // Calculate cost savings
    const hoursSavedPerFeature = baselineHoursPerFeature - vibeOptimizedHours;
    const developerHoursSaved = hoursSavedPerFeature * workflow.steps.length * teamSize;
    const averageHourlyRate = 75; // $75/hour average developer cost
    const infrastructureCostReduction = 25; // 25% reduction in infrastructure costs
    const maintenanceCostSavings = technicalDebtReduction * 0.8; // Maintenance cost reduction
    
    // Calculate total ROI with economies of scale for larger teams
    const totalCostSavings = (developerHoursSaved * averageHourlyRate) + 
                           (infrastructureCostReduction * 1000) + 
                           (maintenanceCostSavings * 500);
    const baseKiroInvestment = teamSize * 100; // $100 per developer for Kiro
    // Economies of scale: larger teams get volume discounts
    const scaleDiscount = teamSize > 5 ? Math.min(0.3, (teamSize - 5) * 0.05) : 0;
    const kiroInvestment = baseKiroInvestment * (1 - scaleDiscount);
    const totalROIPercentage = ((totalCostSavings - kiroInvestment) / kiroInvestment) * 100;

    return {
      developmentVelocity: {
        baselineHoursPerFeature,
        vibeOptimizedHours: Math.round(vibeOptimizedHours * 100) / 100,
        velocityMultiplier: Math.round(vibeVelocityMultiplier * 100) / 100,
        timeToMarketReduction: Math.round(timeToMarketReduction * 100) / 100,
      },
      codeQuality: {
        bugReductionPercentage: Math.round(bugReductionPercentage * 100) / 100,
        testCoverageImprovement: Math.round(testCoverageImprovement * 100) / 100,
        maintainabilityScore: Math.round(maintainabilityScore * 100) / 100,
        technicalDebtReduction: Math.round(technicalDebtReduction * 100) / 100,
      },
      developerProductivity: {
        dailyTaskCompletion: Math.round(dailyTaskCompletion * 100) / 100,
        contextSwitchingReduction: contextSwitchingReduction,
        learningCurveAcceleration: Math.round(learningCurveAcceleration * 100) / 100,
        burnoutReduction: burnoutReduction,
      },
      businessImpact: {
        featureDeliveryRate: Math.round(featureDeliveryRate * 100) / 100,
        customerSatisfactionGain: Math.round(customerSatisfactionGain * 100) / 100,
        revenueAcceleration: Math.round(revenueAcceleration * 100) / 100,
        competitiveAdvantage: Math.round(competitiveAdvantage * 100) / 100,
      },
      costSavings: {
        developerHoursSaved: Math.round(developerHoursSaved),
        infrastructureCostReduction: infrastructureCostReduction,
        maintenanceCostSavings: Math.round(maintenanceCostSavings * 100) / 100,
        totalROIPercentage: Math.round(totalROIPercentage * 100) / 100,
      },
    };
  }

  async analyzeKiroModeEfficiency(workflow: Workflow): Promise<KiroModeAnalysis> {
    const vibeEstimate = await this.estimateVibeConsumption(workflow);
    const specEstimate = await this.estimateSpecConsumption(workflow);
    const vibeCodingROI = await this.calculateVibeCodingROI(workflow);

    // Calculate optimal usage patterns
    const vibeEfficiency = this.kiroEfficiencyFactors.get('vibe_coding_velocity') || 1;
    const specEfficiency = this.kiroEfficiencyFactors.get('spec_feature_delivery') || 1;

    // Analyze workflow characteristics
    const complexSteps = workflow.steps.filter(s => s.quotaCost > 3).length;
    const simpleSteps = workflow.steps.filter(s => s.quotaCost <= 3).length;
    const totalSteps = workflow.steps.length;

    // Determine optimal vibe/spec ratio
    const complexityRatio = complexSteps / totalSteps;
    const optimalVibeSpecRatio = complexityRatio < 0.3 ? 0.8 : complexityRatio > 0.7 ? 0.3 : 0.5;

    return {
      vibeMode: {
        optimalUsage: Math.round(vibeEstimate.vibesConsumed * 100) / 100,
        efficiencyGains: Math.round((vibeEfficiency - 1) * 100),
        bestPractices: [
          'Use for rapid prototyping and iteration cycles',
          'Ideal for debugging and quick fixes with AI assistance',
          'Perfect for exploratory coding and learning new technologies',
          'Excellent for refactoring and code optimization',
          'Best for real-time collaboration and pair programming',
          'Optimal for handling technical debt incrementally',
        ],
        costOptimization: Math.round(((1 - vibeEstimate.estimatedCost / (workflow.steps.length * 0.05)) * 100)),
        vibeCodingROI,
      },
      specMode: {
        optimalUsage: specEstimate.specsConsumed,
        featureDeliveryRate: Math.round(specEfficiency * 100) / 100,
        qualityImprovements: [
          'Comprehensive feature documentation and specifications',
          'Better test coverage and automated quality assurance',
          'Structured development approach with clear milestones',
          'Enhanced code maintainability and long-term sustainability',
          'Improved stakeholder alignment and requirement clarity',
          'Reduced technical debt through upfront planning',
        ],
        timeToMarket: Math.round((1 / specEfficiency) * 100) / 100,
        specModeROI: {
          comprehensiveFeatureDelivery: Math.round(specEfficiency * 100),
          documentationQuality: 85, // 85% improvement in documentation quality
          stakeholderAlignment: 70, // 70% better stakeholder alignment
          longTermMaintainability: 90, // 90% improvement in long-term maintainability
        },
      },
      hybridApproach: {
        vibeSpecRatio: Math.round(optimalVibeSpecRatio * 100) / 100,
        workflowOptimization: Math.round(((vibeEfficiency + specEfficiency) / 2 - 1) * 100),
        recommendedSplit: `${Math.round(optimalVibeSpecRatio * 100)}% Vibe, ${Math.round((1 - optimalVibeSpecRatio) * 100)}% Spec`,
        expectedOutcomes: [
          `${Math.round(vibeEfficiency * 100)}% faster development velocity with Vibe mode`,
          `${Math.round(specEfficiency * 100)}% better feature completeness with Spec mode`,
          `${Math.round(((vibeEfficiency + specEfficiency) / 2) * 100)}% overall productivity gain`,
          'Balanced approach optimizing for both speed and quality',
          `${Math.round(vibeCodingROI.costSavings.totalROIPercentage)}% ROI from Vibe Coding optimization`,
          'Reduced developer burnout and improved job satisfaction',
        ],
        combinedROI: {
          optimalEfficiency: Math.round(((vibeEfficiency + specEfficiency) / 2) * 100),
          balancedApproach: Math.round((vibeCodingROI.costSavings.totalROIPercentage + 200) / 2),
          riskMitigation: 75, // 75% risk reduction through balanced approach
          scalabilityFactor: Math.round(vibeEfficiency * specEfficiency * 50),
        },
      },
    };
  }

  calculateKiroResourceMetrics(forecasts: QuotaForecast[]): KiroResourceMetrics {
    if (forecasts.length === 0) {
      throw new Error('At least one forecast is required for Kiro resource metrics calculation');
    }

    const totalVibes = forecasts.reduce((sum, f) => sum + f.vibesConsumed, 0);
    const totalSpecs = forecasts.reduce((sum, f) => sum + f.specsConsumed, 0);
    const totalCost = forecasts.reduce((sum, f) => sum + f.estimatedCost, 0);
    const avgConfidence = forecasts.filter(f => f.confidenceLevel === 'high').length / forecasts.length;

    // Calculate Kiro-specific metrics
    const vibeEfficiency = totalVibes > 0 ? 
      (this.kiroEfficiencyFactors.get('vibe_coding_velocity') || 1) * (forecasts.length / totalVibes) : 0;
    
    const specUtilization = totalSpecs > 0 ? 
      (this.kiroEfficiencyFactors.get('spec_feature_delivery') || 1) * (forecasts.length / totalSpecs) : 0;

    const kiroModeOptimization = Math.min(1, (vibeEfficiency + specUtilization) / 2);
    
    const developmentVelocity = 
      (this.kiroEfficiencyFactors.get('vibe_coding_velocity') || 1) * 0.4 +
      (this.kiroEfficiencyFactors.get('spec_feature_delivery') || 1) * 0.6;

    const codeQualityScore = 
      (this.kiroEfficiencyFactors.get('code_quality_improvement') || 1) * avgConfidence;

    return {
      vibeEfficiency: Math.round(vibeEfficiency * 100) / 100,
      specUtilization: Math.round(specUtilization * 100) / 100,
      kiroModeOptimization: Math.round(kiroModeOptimization * 100) / 100,
      developmentVelocity: Math.round(developmentVelocity * 100) / 100,
      codeQualityScore: Math.round(codeQualityScore * 100) / 100,
    };
  }

  async generateKiroROIAnalysis(
    scenarios: OptimizationScenario[],
    params?: OptionalParams
  ): Promise<ROIAnalysis> {
    if (scenarios.length === 0) {
      throw new Error('At least one scenario is required for Kiro ROI analysis');
    }

    // Enhanced ROI analysis with Kiro-specific benefits
    const sortedScenarios = [...scenarios].sort(
      (a, b) => b.savingsPercentage - a.savingsPercentage
    );

    const baselineScenario = scenarios.find(
      s => s.name.toLowerCase().includes('naive') || s.name.toLowerCase().includes('current')
    ) || scenarios[0];

    const recommendations: string[] = [];

    // Add Vibe Coding ROI analysis section
    const vibeCodingROI = await this.calculateVibeCodingROI({
      id: 'roi-analysis',
      name: 'ROI Analysis Workflow',
      description: 'Workflow for ROI calculation',
      steps: scenarios.map(s => ({
        id: s.name.toLowerCase().replace(/\s+/g, '-'),
        description: s.name,
        type: 'analysis',
        quotaCost: 3,
        dependencies: [],
      })),
      estimatedComplexity: 5,
    });

    // Vibe Coding specific recommendations
    recommendations.push(
      `🚀 Vibe Coding ROI: ${vibeCodingROI.costSavings.totalROIPercentage}% total return on investment`
    );
    recommendations.push(
      `⚡ Development Velocity: ${vibeCodingROI.developmentVelocity.velocityMultiplier}x faster with ${vibeCodingROI.developmentVelocity.timeToMarketReduction}% time-to-market reduction`
    );
    recommendations.push(
      `🎯 Quality Improvements: ${vibeCodingROI.codeQuality.bugReductionPercentage}% bug reduction, ${vibeCodingROI.codeQuality.testCoverageImprovement}% better test coverage`
    );
    recommendations.push(
      `👥 Developer Productivity: ${vibeCodingROI.developerProductivity.dailyTaskCompletion} tasks/day completion rate, ${vibeCodingROI.developerProductivity.burnoutReduction}% burnout reduction`
    );
    recommendations.push(
      `💰 Cost Savings: ${vibeCodingROI.costSavings.developerHoursSaved} developer hours saved, ${vibeCodingROI.costSavings.infrastructureCostReduction}% infrastructure cost reduction`
    );

    // Kiro-specific recommendations
    const kiroOptimizedScenarios = scenarios.filter(
      s => s.name.toLowerCase().includes('kiro') || s.name.toLowerCase().includes('optimized')
    );

    if (kiroOptimizedScenarios.length > 0) {
      const bestKiro = kiroOptimizedScenarios.reduce((best, current) =>
        current.savingsPercentage > best.savingsPercentage ? current : best
      );
      recommendations.push(
        `🔧 Kiro Resource Optimization: ${bestKiro.name} provides ${bestKiro.savingsPercentage}% efficiency gains with enhanced development velocity and intelligent resource allocation`
      );
    }

    // Vibe vs Spec mode recommendations with detailed ROI
    const vibeScenarios = scenarios.filter(s => s.name.toLowerCase().includes('vibe'));
    const specScenarios = scenarios.filter(s => s.name.toLowerCase().includes('spec'));

    if (vibeScenarios.length > 0 && specScenarios.length > 0) {
      const bestVibe = vibeScenarios.reduce((best, current) =>
        current.savingsPercentage > best.savingsPercentage ? current : best
      );
      const bestSpec = specScenarios.reduce((best, current) =>
        current.savingsPercentage > best.savingsPercentage ? current : best
      );

      if (bestVibe.savingsPercentage > bestSpec.savingsPercentage * 1.2) {
        recommendations.push(
          `🎨 Vibe Mode Advantage: ${bestVibe.savingsPercentage}% savings with ${vibeCodingROI.developmentVelocity.velocityMultiplier}x development velocity - ideal for rapid iteration, debugging, and exploratory development`
        );
        recommendations.push(
          `📈 Vibe Mode Business Impact: ${vibeCodingROI.businessImpact.featureDeliveryRate}% faster feature delivery, ${vibeCodingROI.businessImpact.competitiveAdvantage}% competitive advantage score`
        );
      } else if (bestSpec.savingsPercentage > bestVibe.savingsPercentage * 1.2) {
        recommendations.push(
          `📋 Spec Mode Advantage: ${bestSpec.savingsPercentage}% savings with comprehensive feature development - recommended for complex features requiring thorough documentation and stakeholder alignment`
        );
      } else {
        recommendations.push(
          `⚖️ Hybrid Approach Optimal: Balance Vibe mode (${vibeCodingROI.developmentVelocity.velocityMultiplier}x velocity) for rapid development with Spec mode for complex features`
        );
        recommendations.push(
          `🎯 Combined ROI: ${Math.round((vibeCodingROI.costSavings.totalROIPercentage + bestSpec.savingsPercentage) / 2)}% blended return with ${vibeCodingROI.developerProductivity.contextSwitchingReduction}% context switching reduction`
        );
      }
    }

    // Business impact recommendations
    recommendations.push(
      `📊 Business Metrics: ${vibeCodingROI.businessImpact.customerSatisfactionGain}% customer satisfaction improvement, ${vibeCodingROI.businessImpact.revenueAcceleration}% revenue acceleration`
    );

    // Technical debt and maintenance recommendations
    recommendations.push(
      `🔧 Technical Health: ${vibeCodingROI.codeQuality.technicalDebtReduction}% technical debt reduction, ${vibeCodingROI.codeQuality.maintainabilityScore}% maintainability score improvement`
    );

    // Calculate Kiro-enhanced best option with Vibe Coding factors
    let bestOption = scenarios[0];
    let bestScore = 0;

    for (const scenario of scenarios) {
      // Enhanced scoring with Kiro and Vibe Coding factors
      let riskFactor = 1.0;
      switch (scenario.riskLevel) {
        case 'low': riskFactor = 1.3; break; // Kiro + Vibe Coding significantly reduce risk
        case 'medium': riskFactor = 1.1; break;
        case 'high': riskFactor = 0.9; break; // Even high risk is more manageable
      }

      let effortFactor = 1.0;
      switch (scenario.implementationEffort) {
        case 'low': effortFactor = 1.2; break;
        case 'medium': effortFactor = 1.1; break;
        case 'high': effortFactor = 1.0; break; // Kiro makes high effort more feasible
      }

      // Enhanced Kiro bonus for scenarios that leverage Kiro capabilities
      let kiroBonus = 1.0;
      if (scenario.name.toLowerCase().includes('kiro')) kiroBonus += 0.3;
      if (scenario.name.toLowerCase().includes('vibe')) kiroBonus += 0.2;
      if (scenario.name.toLowerCase().includes('spec')) kiroBonus += 0.15;

      // Vibe Coding velocity bonus
      const vibeVelocityBonus = scenario.name.toLowerCase().includes('vibe') ? 
        (vibeCodingROI.developmentVelocity.velocityMultiplier / 10) : 0;

      const score = scenario.savingsPercentage * riskFactor * effortFactor * kiroBonus + vibeVelocityBonus;
      if (score > bestScore) {
        bestScore = score;
        bestOption = scenario;
      }
    }

    // Enhanced risk assessment with Kiro and Vibe Coding capabilities
    const highRiskScenarios = scenarios.filter(s => s.riskLevel === 'high');
    const riskAssessment = highRiskScenarios.length > 0
      ? `${highRiskScenarios.length} high-risk scenarios identified. Kiro Resource Optimizer with Vibe Coding capabilities provides ${vibeCodingROI.developerProductivity.contextSwitchingReduction}% context switching reduction and ${vibeCodingROI.codeQuality.bugReductionPercentage}% bug reduction, significantly mitigating implementation risks. The ${vibeCodingROI.developmentVelocity.velocityMultiplier}x development velocity allows for rapid iteration and risk mitigation through faster feedback cycles.`
      : `Risk levels are highly manageable with Kiro Resource Optimizer. Vibe Coding provides ${vibeCodingROI.developmentVelocity.velocityMultiplier}x development velocity and ${vibeCodingROI.codeQuality.maintainabilityScore}% maintainability improvement, enabling confident implementation with ${vibeCodingROI.costSavings.totalROIPercentage}% ROI.`;

    return {
      scenarios: sortedScenarios,
      recommendations,
      bestOption: bestOption.name,
      riskAssessment,
    };
  }

  // Legacy method names for backward compatibility
  async estimateNaiveConsumption(workflow: Workflow, params?: OptionalParams): Promise<QuotaForecast> {
    return this.estimateVibeConsumption(workflow, params);
  }

  async estimateOptimizedConsumption(
    optimizedWorkflow: OptimizedWorkflow,
    params?: OptionalParams
  ): Promise<QuotaForecast> {
    return this.estimateOptimizedKiroUsage(optimizedWorkflow, params);
  }

  async estimateZeroBasedConsumption(
    zeroBasedSolution: ZeroBasedSolution,
    params?: OptionalParams
  ): Promise<QuotaForecast> {
    return this.estimateZeroBasedKiroApproach(zeroBasedSolution, params);
  }

  async generateROITable(
    scenarios: OptimizationScenario[],
    params?: OptionalParams
  ): Promise<ROIAnalysis> {
    return this.generateKiroROIAnalysis(scenarios, params);
  }

  calculateMultiScenarioSavings(
    forecasts: QuotaForecast[],
    params?: OptionalParams
  ): ComprehensiveSavings {
    if (forecasts.length === 0) {
      throw new Error('At least one forecast is required for multi-scenario savings calculation');
    }

    // Find baseline forecast
    const naiveForecast = forecasts.find(f => 
      f.scenario === 'naive' || f.scenario === 'kiro-optimized'
    ) || forecasts[0];
    const baselineCost = naiveForecast.estimatedCost;

    // Find Kiro-optimized forecasts
    const kiroOptimizedForecast = forecasts.find(f => 
      f.scenario === 'kiro-advanced-optimized' || f.scenario === 'optimized'
    );
    const kiroZeroBasedForecast = forecasts.find(f => 
      f.scenario === 'kiro-zero-based' || f.scenario === 'zero-based'
    );

    // Calculate Kiro-enhanced savings
    let conservativeSavings = 0;
    const conservativeForecast = kiroOptimizedForecast || 
      forecasts.find(f => f.scenario !== naiveForecast.scenario);
    
    if (conservativeForecast && baselineCost > 0) {
      conservativeSavings = ((baselineCost - conservativeForecast.estimatedCost) / baselineCost) * 100;
    }

    // Enhanced balanced savings with Kiro capabilities
    let balancedSavings = conservativeSavings;
    if (kiroZeroBasedForecast && baselineCost > 0) {
      const zeroBasedSavingsPercentage = 
        ((baselineCost - kiroZeroBasedForecast.estimatedCost) / baselineCost) * 100;
      balancedSavings = (conservativeSavings + zeroBasedSavingsPercentage) / 2;
    }

    // Bold savings with Kiro zero-based approach
    let boldSavings = conservativeSavings;
    if (kiroZeroBasedForecast && baselineCost > 0) {
      boldSavings = ((baselineCost - kiroZeroBasedForecast.estimatedCost) / baselineCost) * 100;
    }

    // Kiro-enhanced recommendation logic
    let recommendedApproach = 'Conservative';

    if (boldSavings > 85 && kiroZeroBasedForecast?.confidenceLevel === 'high') {
      recommendedApproach = 'Bold (Kiro zero-based approach with maximum efficiency)';
    } else if (boldSavings > 70 && kiroZeroBasedForecast?.confidenceLevel !== 'low') {
      recommendedApproach = 'Bold (Kiro-enhanced radical optimization)';
    } else if (balancedSavings > 40 && conservativeSavings > 25) {
      recommendedApproach = 'Balanced (Kiro hybrid approach)';
    } else if (conservativeSavings > 20) {
      recommendedApproach = 'Conservative (Kiro-optimized workflow)';
    } else if (conservativeSavings > 10) {
      recommendedApproach = 'Kiro efficiency gains with minimal changes';
    } else {
      recommendedApproach = 'Current approach already benefits from Kiro optimization';
    }

    return {
      conservativeSavings: Math.max(0, Math.round(conservativeSavings * 100) / 100),
      balancedSavings: Math.max(0, Math.round(balancedSavings * 100) / 100),
      boldSavings: Math.max(0, Math.round(boldSavings * 100) / 100),
      recommendedApproach,
    };
  }

  calculateSavings(naive: QuotaForecast, optimized: QuotaForecast): EfficiencySavings {
    const vibeReduction = naive.vibesConsumed > 0
      ? ((naive.vibesConsumed - optimized.vibesConsumed) / naive.vibesConsumed) * 100
      : 0;

    const specReduction = naive.specsConsumed > 0
      ? ((naive.specsConsumed - optimized.specsConsumed) / naive.specsConsumed) * 100
      : 0;

    const costSavings = naive.estimatedCost - optimized.estimatedCost;
    const totalSavingsPercentage = naive.estimatedCost > 0 
      ? (costSavings / naive.estimatedCost) * 100 
      : 0;

    return {
      vibeReduction: Math.round(vibeReduction * 100) / 100,
      specReduction: Math.round(specReduction * 100) / 100,
      costSavings: Math.round(costSavings * 100) / 100,
      totalSavingsPercentage: Math.round(totalSavingsPercentage * 100) / 100,
    };
  }

  setCostModel(costModel: QuotaCostModel): void {
    this.costModel = costModel;
  }

  private adjustCostsForKiroParameters(
    vibes: number,
    specs: number,
    cost: number,
    params: OptionalParams
  ): { vibes: number; specs: number; cost: number } {
    let adjustedVibes = vibes;
    let adjustedSpecs = specs;
    let adjustedCost = cost;

    // Kiro-specific adjustments based on usage patterns
    if (params.expectedUserVolume !== undefined) {
      if (params.expectedUserVolume > 1000) {
        // High volume benefits from Kiro's efficiency at scale
        adjustedVibes = Math.ceil(adjustedVibes * 1.1); // Less increase due to Kiro efficiency
        adjustedSpecs = Math.ceil(adjustedSpecs * 1.05);
      } else if (params.expectedUserVolume < 10) {
        // Low volume gets maximum Kiro optimization benefits
        adjustedVibes = Math.max(0.5, Math.floor(adjustedVibes * 0.7));
        adjustedSpecs = Math.max(0, Math.floor(adjustedSpecs * 0.8));
      }
    }

    // Kiro performance optimizations
    if (params.performanceSensitivity === 'high') {
      // Kiro's intelligent optimization for high performance needs
      adjustedVibes = Math.ceil(adjustedVibes * 1.05); // Minimal increase due to Kiro efficiency
      adjustedSpecs = Math.ceil(adjustedSpecs * 1.02);
    } else if (params.performanceSensitivity === 'low') {
      // Maximum Kiro cost optimization for low performance sensitivity
      adjustedVibes = Math.max(0.5, Math.floor(adjustedVibes * 0.8));
      adjustedSpecs = Math.max(0, Math.floor(adjustedSpecs * 0.9));
    }

    // Enhanced cost constraint handling with Kiro optimization
    if (params.costConstraints) {
      const { maxVibes, maxSpecs, maxCostDollars } = params.costConstraints;

      if (maxVibes !== undefined && adjustedVibes > maxVibes) {
        adjustedVibes = maxVibes;
      }

      if (maxSpecs !== undefined && adjustedSpecs > maxSpecs) {
        adjustedSpecs = maxSpecs;
      }

      adjustedCost = 
        adjustedVibes * this.costModel.vibeUnitCost + adjustedSpecs * this.costModel.specUnitCost;

      if (maxCostDollars !== undefined && adjustedCost > maxCostDollars) {
        // Kiro-optimized cost reduction strategy
        const targetCost = maxCostDollars;
        const specCost = adjustedSpecs * this.costModel.specUnitCost;

        if (specCost <= targetCost) {
          const remainingBudget = targetCost - specCost;
          adjustedVibes = Math.max(0.5, Math.floor(remainingBudget / this.costModel.vibeUnitCost));
        } else {
          // Optimize spec usage with Kiro efficiency
          adjustedSpecs = Math.max(0, Math.floor(targetCost / this.costModel.specUnitCost * 0.9));
          adjustedVibes = Math.max(
            0.5,
            Math.floor(
              (targetCost - adjustedSpecs * this.costModel.specUnitCost) / this.costModel.vibeUnitCost
            )
          );
        }

        adjustedCost = 
          adjustedVibes * this.costModel.vibeUnitCost + adjustedSpecs * this.costModel.specUnitCost;
      }
    } else {
      adjustedCost = 
        adjustedVibes * this.costModel.vibeUnitCost + adjustedSpecs * this.costModel.specUnitCost;
    }

    return {
      vibes: Math.round(adjustedVibes * 100) / 100,
      specs: adjustedSpecs,
      cost: Math.round(adjustedCost * 100) / 100,
    };
  }

  private adjustConfidenceForKiroParameters(
    baseConfidence: 'low' | 'medium' | 'high',
    params: OptionalParams
  ): 'low' | 'medium' | 'high' {
    let confidence = baseConfidence;

    // Kiro generally increases confidence due to intelligent assistance
    if (baseConfidence === 'low') confidence = 'medium';
    else if (baseConfidence === 'medium') confidence = 'high';
    else confidence = 'high'; // Keep high confidence

    // High user volume with Kiro is more manageable
    if (params.expectedUserVolume !== undefined && params.expectedUserVolume > 5000) {
      // Kiro handles scale better, so less confidence reduction
      if (confidence === 'high') confidence = 'medium';
      // medium stays medium (already boosted from low if needed)
    }

    // Kiro makes tight constraints more manageable
    if (params.costConstraints) {
      const { maxVibes, maxSpecs, maxCostDollars } = params.costConstraints;
      const hasTightConstraints =
        (maxVibes !== undefined && maxVibes < 5) || // Reduced threshold due to Kiro efficiency
        (maxSpecs !== undefined && maxSpecs < 2) ||
        (maxCostDollars !== undefined && maxCostDollars < 3);

      if (hasTightConstraints) {
        // Kiro optimization reduces confidence impact of tight constraints
        if (confidence === 'high') confidence = 'medium';
        // medium stays medium (Kiro helps but constraints are still tight)
      }
    }

    // High performance sensitivity with Kiro increases confidence
    if (params.performanceSensitivity === 'high') {
      // Only boost if not already at maximum
      if (confidence === 'medium') confidence = 'high';
      // high stays high, medium gets boosted to high
    }

    return confidence;
  }
}