// Quota Forecaster component interface and implementation

import { Workflow, OptimizedWorkflow, QuotaForecast, EfficiencySavings, QuotaCostModel, OptionalParams } from '../../models';

import { ROIAnalysis, OptimizationScenario, ComprehensiveSavings } from '../../models/quota';
import { ZeroBasedSolution } from '../../models/consulting';
import { validateWorkflow, validatePositiveNumber, ValidationError } from '../../utils/validation';
import { ErrorHandler, ForecastingError } from '../../utils/error-handling';

export interface IQuotaForecaster {
  estimateNaiveConsumption(workflow: Workflow, params?: OptionalParams): Promise<QuotaForecast>;
  estimateOptimizedConsumption(optimizedWorkflow: OptimizedWorkflow, params?: OptionalParams): Promise<QuotaForecast>;
  estimateZeroBasedConsumption(zeroBasedSolution: ZeroBasedSolution, params?: OptionalParams): Promise<QuotaForecast>;
  generateROITable(scenarios: OptimizationScenario[], params?: OptionalParams): Promise<ROIAnalysis>;
  calculateMultiScenarioSavings(forecasts: QuotaForecast[], params?: OptionalParams): ComprehensiveSavings;
  calculateSavings(naive: QuotaForecast, optimized: QuotaForecast): EfficiencySavings;
  setCostModel(costModel: QuotaCostModel): void;
}

export class QuotaForecaster implements IQuotaForecaster {
  private costModel: QuotaCostModel;

  constructor(costModel?: QuotaCostModel) {
    // Default cost model - will be refined based on actual Kiro pricing
    this.costModel = costModel || {
      vibeUnitCost: 0.01, // $0.01 per vibe
      specUnitCost: 0.05, // $0.05 per spec
      operationCosts: new Map([
        ['data_retrieval', 1],
        ['processing', 2],
        ['analysis', 3],
        ['vibe', 1],
        ['spec', 5]
      ])
    };
  }

  async estimateNaiveConsumption(workflow: Workflow, params?: OptionalParams): Promise<QuotaForecast> {
    // Validate workflow input
    try {
      validateWorkflow(workflow);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ForecastingError(
          `Quota forecasting input validation failed: ${error.message}`,
          'Please ensure the workflow has valid steps with quota costs',
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
    }> = [];

    for (const step of workflow.steps) {
      let stepVibes = 0;
      let stepSpecs = 0;

      // Calculate consumption based on step type
      switch (step.type) {
        case 'vibe':
          stepVibes = 1; // Each vibe step consumes 1 vibe
          break;
        case 'spec':
          stepSpecs = 1; // Each spec step consumes 1 spec
          break;
        case 'data_retrieval':
          // Data retrieval typically requires vibes for processing
          stepVibes = Math.max(1, Math.floor(step.quotaCost / this.costModel.vibeUnitCost));
          break;
        case 'processing':
          // Processing operations may use vibes or specs depending on complexity
          if (step.quotaCost > this.costModel.specUnitCost) {
            stepSpecs = 1;
            stepVibes = Math.max(0, Math.floor((step.quotaCost - this.costModel.specUnitCost) / this.costModel.vibeUnitCost));
          } else {
            stepVibes = Math.max(1, Math.floor(step.quotaCost / this.costModel.vibeUnitCost));
          }
          break;
        case 'analysis':
          // Analysis typically requires multiple vibes or a spec
          if (step.quotaCost > this.costModel.specUnitCost * 0.8) {
            stepSpecs = 1;
          } else {
            stepVibes = Math.max(2, Math.floor(step.quotaCost / this.costModel.vibeUnitCost));
          }
          break;
        default:
          // Default to vibe consumption
          stepVibes = Math.max(1, Math.floor(step.quotaCost / this.costModel.vibeUnitCost));
      }

      totalVibes += stepVibes;
      totalSpecs += stepSpecs;

      const stepCost = (stepVibes * this.costModel.vibeUnitCost) + (stepSpecs * this.costModel.specUnitCost);
      breakdown.push({
        stepId: step.id,
        stepDescription: step.description,
        vibes: stepVibes,
        specs: stepSpecs,
        cost: stepCost
      });
    }

    let estimatedCost = (totalVibes * this.costModel.vibeUnitCost) + (totalSpecs * this.costModel.specUnitCost);

    // Adjust costs based on optional parameters
    if (params) {
      const adjustments = this.adjustCostsForParameters(totalVibes, totalSpecs, estimatedCost, params);
      totalVibes = adjustments.vibes;
      totalSpecs = adjustments.specs;
      estimatedCost = adjustments.cost;
    }

    // Confidence level based on workflow complexity
    let confidenceLevel: 'low' | 'medium' | 'high' = 'medium';
    if (workflow.estimatedComplexity > 8) {
      confidenceLevel = 'low';
    } else if (workflow.estimatedComplexity < 4) {
      confidenceLevel = 'high';
    }

    // Adjust confidence based on parameters
    if (params) {
      confidenceLevel = this.adjustConfidenceForParameters(confidenceLevel, params);
    }

    return {
      vibesConsumed: totalVibes,
      specsConsumed: totalSpecs,
      estimatedCost,
      confidenceLevel,
      scenario: 'naive',
      breakdown
    };
  }

  async estimateOptimizedConsumption(optimizedWorkflow: OptimizedWorkflow, params?: OptionalParams): Promise<QuotaForecast> {
    // Start with naive consumption
    const naiveEstimate = await this.estimateNaiveConsumption(optimizedWorkflow, params);
    
    let totalVibes = naiveEstimate.vibesConsumed;
    let totalSpecs = naiveEstimate.specsConsumed;
    const breakdown = [...naiveEstimate.breakdown];

    // Apply optimization savings
    for (const optimization of optimizedWorkflow.optimizations) {
      const vibeReduction = Math.floor(totalVibes * (optimization.estimatedSavings.vibes / 100));
      const specReduction = Math.floor(totalSpecs * (optimization.estimatedSavings.specs / 100));

      totalVibes = Math.max(0, totalVibes - vibeReduction);
      totalSpecs = Math.max(0, totalSpecs - specReduction);

      // Update breakdown for affected steps
      for (const stepId of optimization.stepsAffected) {
        const stepBreakdown = breakdown.find(b => b.stepId === stepId);
        if (stepBreakdown) {
          const stepVibeReduction = Math.floor(stepBreakdown.vibes * (optimization.estimatedSavings.vibes / 100));
          const stepSpecReduction = Math.floor(stepBreakdown.specs * (optimization.estimatedSavings.specs / 100));
          
          stepBreakdown.vibes = Math.max(0, stepBreakdown.vibes - stepVibeReduction);
          stepBreakdown.specs = Math.max(0, stepBreakdown.specs - stepSpecReduction);
          stepBreakdown.cost = (stepBreakdown.vibes * this.costModel.vibeUnitCost) + 
                              (stepBreakdown.specs * this.costModel.specUnitCost);
        }
      }
    }

    const estimatedCost = (totalVibes * this.costModel.vibeUnitCost) + (totalSpecs * this.costModel.specUnitCost);

    // Confidence level is typically higher for optimized workflows due to better analysis
    let confidenceLevel: 'low' | 'medium' | 'high' = 'high';
    if (optimizedWorkflow.estimatedComplexity > 8) {
      confidenceLevel = 'medium';
    }

    return {
      vibesConsumed: totalVibes,
      specsConsumed: totalSpecs,
      estimatedCost,
      confidenceLevel,
      scenario: 'optimized',
      breakdown
    };
  }

  async estimateZeroBasedConsumption(zeroBasedSolution: ZeroBasedSolution, params?: OptionalParams): Promise<QuotaForecast> {
    // Zero-based approach assumes radical redesign with minimal consumption
    // Apply aggressive savings based on the zero-based solution potential
    const baseSavingsPercentage = zeroBasedSolution.potentialSavings;
    
    // Create a minimal workflow representation for zero-based calculation
    let minimalVibes = Math.max(1, Math.floor(3 * (1 - baseSavingsPercentage / 100))); // Minimum viable vibes
    let minimalSpecs = Math.max(0, Math.floor(1 * (1 - baseSavingsPercentage / 100))); // Minimal specs needed
    
    let estimatedCost = (minimalVibes * this.costModel.vibeUnitCost) + (minimalSpecs * this.costModel.specUnitCost);

    // Adjust costs based on optional parameters
    if (params) {
      const adjustments = this.adjustCostsForParameters(minimalVibes, minimalSpecs, estimatedCost, params);
      minimalVibes = adjustments.vibes;
      minimalSpecs = adjustments.specs;
      estimatedCost = adjustments.cost;
    }

    // Confidence level depends on implementation risk
    let confidenceLevel: 'low' | 'medium' | 'high' = 'medium';
    switch (zeroBasedSolution.implementationRisk) {
      case 'high':
        confidenceLevel = 'low';
        break;
      case 'low':
        confidenceLevel = 'high';
        break;
      default:
        confidenceLevel = 'medium';
    }

    // Adjust confidence based on parameters
    if (params) {
      confidenceLevel = this.adjustConfidenceForParameters(confidenceLevel, params);
    }

    const breakdown = [{
      stepId: 'zero-based-solution',
      stepDescription: zeroBasedSolution.radicalApproach,
      vibes: minimalVibes,
      specs: minimalSpecs,
      cost: estimatedCost
    }];

    return {
      vibesConsumed: minimalVibes,
      specsConsumed: minimalSpecs,
      estimatedCost,
      confidenceLevel,
      scenario: 'zero-based',
      breakdown
    };
  }

  calculateSavings(naive: QuotaForecast, optimized: QuotaForecast): EfficiencySavings {
    const vibeReduction = naive.vibesConsumed > 0 ? 
      ((naive.vibesConsumed - optimized.vibesConsumed) / naive.vibesConsumed) * 100 : 0;
    
    const specReduction = naive.specsConsumed > 0 ? 
      ((naive.specsConsumed - optimized.specsConsumed) / naive.specsConsumed) * 100 : 0;
    
    const costSavings = naive.estimatedCost - optimized.estimatedCost;
    
    const totalSavingsPercentage = naive.estimatedCost > 0 ? 
      (costSavings / naive.estimatedCost) * 100 : 0;

    return {
      vibeReduction,
      specReduction,
      costSavings,
      totalSavingsPercentage
    };
  }

  async generateROITable(scenarios: OptimizationScenario[], params?: OptionalParams): Promise<ROIAnalysis> {
    if (scenarios.length === 0) {
      throw new Error('At least one scenario is required for ROI analysis');
    }

    // Sort scenarios by savings percentage for better comparison
    const sortedScenarios = [...scenarios].sort((a, b) => b.savingsPercentage - a.savingsPercentage);
    
    // Calculate baseline (typically the first/naive scenario)
    const baselineScenario = scenarios.find(s => s.name.toLowerCase().includes('naive') || s.name.toLowerCase().includes('raw')) 
                           || scenarios[0];
    const baselineCost = baselineScenario.forecast.estimatedCost;

    // Generate recommendations based on scenario analysis
    const recommendations: string[] = [];
    
    // Find the best balanced option (good savings with reasonable effort/risk)
    const balancedOptions = scenarios.filter(s => 
      s.riskLevel === 'medium' && 
      s.implementationEffort === 'medium' && 
      s.savingsPercentage > 20
    );
    
    if (balancedOptions.length > 0) {
      const bestBalanced = balancedOptions.reduce((best, current) => 
        current.savingsPercentage > best.savingsPercentage ? current : best
      );
      recommendations.push(`Consider ${bestBalanced.name} for balanced risk/reward (${bestBalanced.savingsPercentage}% savings)`);
    }

    // Find high-impact, low-risk options
    const lowRiskHighImpact = scenarios.filter(s => 
      s.riskLevel === 'low' && 
      s.savingsPercentage > 15
    );
    
    if (lowRiskHighImpact.length > 0) {
      const bestLowRisk = lowRiskHighImpact.reduce((best, current) => 
        current.savingsPercentage > best.savingsPercentage ? current : best
      );
      recommendations.push(`${bestLowRisk.name} offers ${bestLowRisk.savingsPercentage}% savings with low risk`);
    }

    // Identify high-savings options with warnings
    const highSavingsOptions = scenarios.filter(s => s.savingsPercentage > 50);
    if (highSavingsOptions.length > 0) {
      const bestHighSavings = highSavingsOptions.reduce((best, current) => 
        current.savingsPercentage > best.savingsPercentage ? current : best
      );
      recommendations.push(`${bestHighSavings.name} offers maximum savings (${bestHighSavings.savingsPercentage}%) but requires ${bestHighSavings.implementationEffort} effort and ${bestHighSavings.riskLevel} risk`);
    }

    // Determine best overall option
    let bestOption = scenarios[0];
    let bestScore = 0;

    for (const scenario of scenarios) {
      // Scoring algorithm: savings percentage weighted by risk and effort factors
      let riskFactor = 1.0;
      switch (scenario.riskLevel) {
        case 'low': riskFactor = 1.0; break;
        case 'medium': riskFactor = 0.8; break;
        case 'high': riskFactor = 0.6; break;
      }

      let effortFactor = 1.0;
      switch (scenario.implementationEffort) {
        case 'low': effortFactor = 1.0; break;
        case 'medium': effortFactor = 0.9; break;
        case 'high': effortFactor = 0.7; break;
      }

      const score = scenario.savingsPercentage * riskFactor * effortFactor;
      if (score > bestScore) {
        bestScore = score;
        bestOption = scenario;
      }
    }

    // Generate risk assessment
    const highRiskScenarios = scenarios.filter(s => s.riskLevel === 'high');
    const riskAssessment = highRiskScenarios.length > 0 
      ? `${highRiskScenarios.length} high-risk scenarios identified. Consider starting with lower-risk options and gradually implementing more aggressive optimizations.`
      : 'Most scenarios present manageable risk levels. Implementation can proceed with confidence.';

    return {
      scenarios: sortedScenarios,
      recommendations,
      bestOption: bestOption.name,
      riskAssessment
    };
  }

  calculateMultiScenarioSavings(forecasts: QuotaForecast[], params?: OptionalParams): ComprehensiveSavings {
    if (forecasts.length === 0) {
      throw new Error('At least one forecast is required for multi-scenario savings calculation');
    }

    // Find baseline (naive) forecast
    const naiveForecast = forecasts.find(f => f.scenario === 'naive') || forecasts[0];
    const baselineCost = naiveForecast.estimatedCost;

    // Find different scenario forecasts
    const optimizedForecast = forecasts.find(f => f.scenario === 'optimized');
    const zeroBasedForecast = forecasts.find(f => f.scenario === 'zero-based');

    // Calculate conservative savings (optimized approach or best available)
    let conservativeSavings = 0;
    const conservativeForecast = optimizedForecast || forecasts.find(f => f.scenario !== 'naive' && f.scenario !== 'zero-based');
    if (conservativeForecast && baselineCost > 0) {
      conservativeSavings = ((baselineCost - conservativeForecast.estimatedCost) / baselineCost) * 100;
    }

    // Calculate balanced savings (average of optimized and zero-based if available)
    let balancedSavings = conservativeSavings;
    if (zeroBasedForecast && baselineCost > 0) {
      const zeroBasedSavingsPercentage = ((baselineCost - zeroBasedForecast.estimatedCost) / baselineCost) * 100;
      balancedSavings = (conservativeSavings + zeroBasedSavingsPercentage) / 2;
    }

    // Calculate bold savings (zero-based approach if available, otherwise optimized)
    let boldSavings = conservativeSavings;
    if (zeroBasedForecast && baselineCost > 0) {
      boldSavings = ((baselineCost - zeroBasedForecast.estimatedCost) / baselineCost) * 100;
    }

    // Determine recommended approach based on savings and risk analysis
    let recommendedApproach = 'Conservative';
    
    // Risk-adjusted recommendation logic
    if (boldSavings > 80 && zeroBasedForecast?.confidenceLevel !== 'low') {
      recommendedApproach = 'Bold (high impact potential)';
    } else if (boldSavings > 60 && zeroBasedForecast?.confidenceLevel === 'high') {
      recommendedApproach = 'Bold';
    } else if (balancedSavings > 30 && conservativeSavings > 15) {
      recommendedApproach = 'Balanced';
    } else if (conservativeSavings > 10) {
      recommendedApproach = 'Conservative';
    } else if (conservativeSavings < 5) {
      recommendedApproach = 'Current approach is already efficient';
    } else {
      recommendedApproach = 'Minimal optimization needed';
    }

    return {
      conservativeSavings: Math.max(0, conservativeSavings),
      balancedSavings: Math.max(0, balancedSavings),
      boldSavings: Math.max(0, boldSavings),
      recommendedApproach
    };
  }

  setCostModel(costModel: QuotaCostModel): void {
    this.costModel = costModel;
  }

  private adjustCostsForParameters(vibes: number, specs: number, cost: number, params: OptionalParams): { vibes: number; specs: number; cost: number } {
    let adjustedVibes = vibes;
    let adjustedSpecs = specs;
    let adjustedCost = cost;

    // Adjust based on expected user volume
    if (params.expectedUserVolume !== undefined) {
      if (params.expectedUserVolume > 1000) {
        // High volume scenarios may need more robust operations (higher consumption)
        adjustedVibes = Math.ceil(adjustedVibes * 1.2);
        adjustedSpecs = Math.ceil(adjustedSpecs * 1.1);
      } else if (params.expectedUserVolume < 10) {
        // Low volume scenarios can use simpler operations (lower consumption)
        adjustedVibes = Math.max(1, Math.floor(adjustedVibes * 0.8));
        adjustedSpecs = Math.max(0, Math.floor(adjustedSpecs * 0.9));
      }
    }

    // Adjust based on performance sensitivity
    if (params.performanceSensitivity === 'high') {
      // High performance needs may require more efficient but costly operations
      adjustedVibes = Math.ceil(adjustedVibes * 1.1);
      adjustedSpecs = Math.ceil(adjustedSpecs * 1.05);
    } else if (params.performanceSensitivity === 'low') {
      // Low performance sensitivity allows for more cost-effective operations
      adjustedVibes = Math.max(1, Math.floor(adjustedVibes * 0.9));
      adjustedSpecs = Math.max(0, Math.floor(adjustedSpecs * 0.95));
    }

    // Check against cost constraints
    if (params.costConstraints) {
      const { maxVibes, maxSpecs, maxCostDollars } = params.costConstraints;
      
      // Apply hard limits if specified
      if (maxVibes !== undefined && adjustedVibes > maxVibes) {
        adjustedVibes = maxVibes;
      }
      
      if (maxSpecs !== undefined && adjustedSpecs > maxSpecs) {
        adjustedSpecs = maxSpecs;
      }
      
      // Recalculate cost and check against budget
      adjustedCost = (adjustedVibes * this.costModel.vibeUnitCost) + (adjustedSpecs * this.costModel.specUnitCost);
      
      if (maxCostDollars !== undefined && adjustedCost > maxCostDollars) {
        // Reduce consumption to fit budget, prioritizing specs over vibes
        const targetCost = maxCostDollars;
        const specCost = adjustedSpecs * this.costModel.specUnitCost;
        
        if (specCost <= targetCost) {
          // Keep specs, reduce vibes to fit remaining budget
          const remainingBudget = targetCost - specCost;
          adjustedVibes = Math.max(0, Math.floor(remainingBudget / this.costModel.vibeUnitCost));
        } else {
          // Reduce specs to fit budget, set vibes to minimum
          adjustedSpecs = Math.max(0, Math.floor(targetCost / this.costModel.specUnitCost));
          adjustedVibes = Math.max(1, Math.floor((targetCost - (adjustedSpecs * this.costModel.specUnitCost)) / this.costModel.vibeUnitCost));
        }
        
        adjustedCost = (adjustedVibes * this.costModel.vibeUnitCost) + (adjustedSpecs * this.costModel.specUnitCost);
      }
    } else {
      // Recalculate cost with adjusted consumption
      adjustedCost = (adjustedVibes * this.costModel.vibeUnitCost) + (adjustedSpecs * this.costModel.specUnitCost);
    }

    return {
      vibes: adjustedVibes,
      specs: adjustedSpecs,
      cost: adjustedCost
    };
  }

  private adjustConfidenceForParameters(baseConfidence: 'low' | 'medium' | 'high', params: OptionalParams): 'low' | 'medium' | 'high' {
    let confidence = baseConfidence;

    // High user volume may reduce confidence due to scale complexity
    if (params.expectedUserVolume !== undefined && params.expectedUserVolume > 5000) {
      if (confidence === 'high') confidence = 'medium';
      else if (confidence === 'medium') confidence = 'low';
    }

    // Tight cost constraints may reduce confidence due to optimization pressure
    if (params.costConstraints) {
      const { maxVibes, maxSpecs, maxCostDollars } = params.costConstraints;
      const hasTightConstraints = (maxVibes !== undefined && maxVibes < 10) || 
                                  (maxSpecs !== undefined && maxSpecs < 3) ||
                                  (maxCostDollars !== undefined && maxCostDollars < 5);

      if (hasTightConstraints) {
        if (confidence === 'high') confidence = 'medium';
        else if (confidence === 'medium') confidence = 'low';
      }
    }

    // High performance sensitivity may increase confidence due to better optimization
    if (params.performanceSensitivity === 'high') {
      if (confidence === 'low') confidence = 'medium';
      else if (confidence === 'medium') confidence = 'high';
    }

    return confidence;
  }
}