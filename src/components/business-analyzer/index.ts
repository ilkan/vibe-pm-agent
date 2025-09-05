// Business Analyzer component interface and implementation

import {
  ParsedIntent,
  Workflow,
  ConsultingTechnique,
  MECEAnalysis,
  QuotaDriverCategory,
  ValueDriverAnalysis,
  ValueDriver,
  ZeroBasedSolution,
  PrioritizedOptimizations,
  OptimizationOption,
  ValueProposition,
  ThreeOptionAnalysis,
  Optimization,
  OptionalParams,
  EnhancedBusinessOpportunity,
  BusinessOpportunity,
  StrategicFitAssessment,
  MarketTimingAnalysis,
  IntegratedInsight,
  OverallRecommendation,
  MarketSizingResult,
  CompetitorAnalysisResult
} from '../../models';
import { validateParsedIntent, validateWorkflow, validateConsultingTechniques, ValidationError } from '../../utils/validation';
import { ErrorHandler, AnalysisError } from '../../utils/error-handling';

export interface ConsultingAnalysis {
  techniquesUsed: ConsultingTechnique[];
  meceAnalysis?: MECEAnalysis;
  valueDriverAnalysis?: ValueDriverAnalysis;
  zeroBasedSolution?: ZeroBasedSolution;
  threeOptionAnalysis?: ThreeOptionAnalysis;
  prioritizedOptimizations?: PrioritizedOptimizations;
  valueProposition?: ValueProposition;
  keyFindings: string[];
  totalQuotaSavings: number;
  implementationComplexity: 'low' | 'medium' | 'high';
}

export interface IBusinessAnalyzer {
  selectTechniques(intent: ParsedIntent, params?: OptionalParams): ConsultingTechnique[];
  applyMECE(workflow: Workflow, params?: OptionalParams): MECEAnalysis;
  applyValueDriverTree(workflow: Workflow, params?: OptionalParams): ValueDriverAnalysis;
  applyZeroBasedDesign(intent: ParsedIntent, params?: OptionalParams): ZeroBasedSolution;
  applyImpactEffortMatrix(optimizations: Optimization[], params?: OptionalParams): PrioritizedOptimizations;
  applyValuePropositionCanvas(intent: ParsedIntent, params?: OptionalParams): ValueProposition;
  generateOptionFraming(workflow: Workflow, params?: OptionalParams): ThreeOptionAnalysis;
  analyzeWithTechniques(intent: ParsedIntent, techniques?: string[]): Promise<ConsultingAnalysis>;
  
  // Enhanced Business Opportunity Analysis (Task 4.1)
  analyzeEnhancedBusinessOpportunity(
    intent: ParsedIntent, 
    marketSizing?: MarketSizingResult, 
    competitiveAnalysis?: CompetitorAnalysisResult,
    params?: OptionalParams
  ): Promise<EnhancedBusinessOpportunity>;
  
  // Strategic Fit Assessment (Task 4.2)
  assessStrategicFit(
    intent: ParsedIntent,
    competitiveAnalysis?: CompetitorAnalysisResult,
    params?: OptionalParams
  ): StrategicFitAssessment;
  
  analyzeMarketTiming(
    intent: ParsedIntent,
    competitiveAnalysis?: CompetitorAnalysisResult,
    params?: OptionalParams
  ): MarketTimingAnalysis;
}

export class BusinessAnalyzer implements IBusinessAnalyzer {

  selectTechniques(intent: ParsedIntent, params?: OptionalParams): ConsultingTechnique[] {
    const allTechniques: ConsultingTechnique[] = [];

    // Analyze intent complexity and characteristics to select relevant techniques
    const hasComplexWorkflow = intent.operationsRequired.length > 5;
    const hasHighQuotaRisk = intent.potentialRisks.some(risk => risk.severity === 'high');
    const hasMultipleDataSources = intent.dataSourcesNeeded.length > 2;
    const hasProcessingRequirements = intent.technicalRequirements.some(req => req.type === 'processing');

    // Always apply MECE for quota driver categorization
    allTechniques.push({
      name: 'MECE',
      relevanceScore: 0.9,
      applicableScenarios: ['quota optimization', 'workflow analysis', 'cost breakdown']
    });

    // Apply Value Driver Tree for complex workflows with high quota impact
    if (hasComplexWorkflow || hasHighQuotaRisk) {
      allTechniques.push({
        name: 'ValueDriverTree',
        relevanceScore: 0.88, // Higher score for complex workflows
        applicableScenarios: ['cost analysis', 'optimization prioritization', 'root cause analysis']
      });
    }

    // Apply Zero-Based Design for workflows with significant inefficiencies
    if (hasHighQuotaRisk && intent.potentialRisks.length > 1) {
      allTechniques.push({
        name: 'ZeroBased',
        relevanceScore: 0.87, // Higher score to ensure it's selected for high-risk scenarios
        applicableScenarios: ['radical optimization', 'workflow redesign', 'assumption challenging']
      });
    }

    // Apply Impact vs Effort Matrix for multiple optimization opportunities
    if (intent.operationsRequired.length > 3) {
      allTechniques.push({
        name: 'ImpactEffort',
        relevanceScore: 0.75,
        applicableScenarios: ['optimization prioritization', 'resource allocation', 'quick wins identification']
      });
    }

    // Apply Value Proposition Canvas for user-focused workflows
    if (hasMultipleDataSources || hasProcessingRequirements) {
      allTechniques.push({
        name: 'ValueProp',
        relevanceScore: 0.6,
        applicableScenarios: ['user value alignment', 'feature prioritization', 'pain point analysis']
      });
    }

    // Always include Option Framing for alternative approaches
    allTechniques.push({
      name: 'OptionFraming',
      relevanceScore: 0.85,
      applicableScenarios: ['decision making', 'risk assessment', 'alternative evaluation']
    });

    // Adjust technique relevance based on optional parameters
    if (params) {
      this.adjustTechniqueRelevanceForParameters(allTechniques, params);
    }

    // Sort by relevance score and return top 3, ensuring we always have exactly 3
    const sortedTechniques = allTechniques.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // If we have fewer than 3, add additional techniques to reach 3
    if (sortedTechniques.length < 3) {
      const additionalTechniques = [
        {
          name: 'Pyramid' as const,
          relevanceScore: 0.5,
          applicableScenarios: ['structured communication', 'recommendation clarity']
        },
        {
          name: 'ValueDriverTree' as const,
          relevanceScore: 0.4,
          applicableScenarios: ['cost analysis', 'optimization prioritization']
        },
        {
          name: 'ImpactEffort' as const,
          relevanceScore: 0.3,
          applicableScenarios: ['optimization prioritization', 'resource allocation']
        }
      ];

      for (const technique of additionalTechniques) {
        if (sortedTechniques.length >= 3) break;
        if (!sortedTechniques.some(t => t.name === technique.name)) {
          sortedTechniques.push(technique);
        }
      }
    }

    return sortedTechniques.slice(0, 3);
  }

  applyMECE(workflow: Workflow, params?: OptionalParams): MECEAnalysis {
    const categories: QuotaDriverCategory[] = [];

    // Categorize workflow steps into mutually exclusive categories
    const vibeOperations = workflow.steps.filter(step => step.type === 'vibe');
    const specOperations = workflow.steps.filter(step => step.type === 'spec');
    const dataOperations = workflow.steps.filter(step => step.type === 'data_retrieval');
    const processingOperations = workflow.steps.filter(step => step.type === 'processing');
    const analysisOperations = workflow.steps.filter(step => step.type === 'analysis');

    // Vibe Operations Category
    if (vibeOperations.length > 0) {
      const vibeQuotaImpact = vibeOperations.reduce((sum, step) => sum + step.quotaCost, 0);
      categories.push({
        name: 'Vibe Operations',
        drivers: vibeOperations.map(step => step.description),
        quotaImpact: vibeQuotaImpact,
        optimizationPotential: this.calculateOptimizationPotential(vibeOperations, 'vibe')
      });
    }

    // Spec Operations Category
    if (specOperations.length > 0) {
      const specQuotaImpact = specOperations.reduce((sum, step) => sum + step.quotaCost, 0);
      categories.push({
        name: 'Spec Operations',
        drivers: specOperations.map(step => step.description),
        quotaImpact: specQuotaImpact,
        optimizationPotential: this.calculateOptimizationPotential(specOperations, 'spec')
      });
    }

    // Data Retrieval Category
    if (dataOperations.length > 0) {
      const dataQuotaImpact = dataOperations.reduce((sum, step) => sum + step.quotaCost, 0);
      categories.push({
        name: 'Data Retrieval',
        drivers: dataOperations.map(step => step.description),
        quotaImpact: dataQuotaImpact,
        optimizationPotential: this.calculateOptimizationPotential(dataOperations, 'data_retrieval')
      });
    }

    // Processing Operations Category
    if (processingOperations.length > 0) {
      const processingQuotaImpact = processingOperations.reduce((sum, step) => sum + step.quotaCost, 0);
      categories.push({
        name: 'Processing Operations',
        drivers: processingOperations.map(step => step.description),
        quotaImpact: processingQuotaImpact,
        optimizationPotential: this.calculateOptimizationPotential(processingOperations, 'processing')
      });
    }

    // Analysis Operations Category
    if (analysisOperations.length > 0) {
      const analysisQuotaImpact = analysisOperations.reduce((sum, step) => sum + step.quotaCost, 0);
      categories.push({
        name: 'Analysis Operations',
        drivers: analysisOperations.map(step => step.description),
        quotaImpact: analysisQuotaImpact,
        optimizationPotential: this.calculateOptimizationPotential(analysisOperations, 'analysis')
      });
    }

    // Calculate total coverage and check for overlaps
    const totalSteps = workflow.steps.length;
    const categorizedSteps = categories.reduce((sum, cat) => sum + cat.drivers.length, 0);
    const totalCoverage = totalSteps > 0 ? (categorizedSteps / totalSteps) * 100 : 0;

    // Check for potential overlaps (steps that could belong to multiple categories)
    const overlaps: string[] = [];
    workflow.steps.forEach(step => {
      if (step.type === 'processing' && step.description.toLowerCase().includes('data')) {
        overlaps.push(`${step.description} could be categorized as both Processing and Data Retrieval`);
      }
    });

    return {
      categories,
      totalCoverage,
      overlaps
    };
  }

  private calculateOptimizationPotential(steps: any[], stepType: string): number {
    // Calculate optimization potential based on step type and characteristics
    let potential = 0;

    switch (stepType) {
      case 'vibe':
        // High optimization potential for vibes - can often be converted to specs
        potential = steps.length > 1 ? 70 : 30;
        break;
      case 'spec':
        // Moderate optimization potential for specs - can be batched or cached
        potential = steps.length > 2 ? 40 : 20;
        break;
      case 'data_retrieval':
        // High optimization potential - can be cached or batched
        potential = steps.length > 1 ? 60 : 25;
        break;
      case 'processing':
        // Moderate optimization potential - can be optimized for efficiency
        potential = 35;
        break;
      case 'analysis':
        // Lower optimization potential - usually necessary as-is
        potential = 20;
        break;
      default:
        potential = 25;
    }

    // Increase potential if there are many similar steps (batching opportunity)
    if (steps.length > 3) {
      potential += 15;
    }

    return Math.min(potential, 85); // Cap at 85%
  }

  applyValueDriverTree(workflow: Workflow, params?: OptionalParams): ValueDriverAnalysis {
    const primaryDrivers: ValueDriver[] = [];
    const secondaryDrivers: ValueDriver[] = [];
    const rootCauses: string[] = [];

    // Analyze workflow steps to identify value drivers
    const totalQuotaCost = workflow.steps.reduce((sum, step) => sum + step.quotaCost, 0);

    // Group steps by type and analyze their cost impact
    const stepsByType = workflow.steps.reduce((acc, step) => {
      if (!acc[step.type]) acc[step.type] = [];
      acc[step.type].push(step);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(stepsByType).forEach(([type, steps]) => {
      const currentCost = steps.reduce((sum, step) => sum + step.quotaCost, 0);
      const costPercentage = (currentCost / totalQuotaCost) * 100;

      // Estimate optimized cost based on step type
      let optimizedCost = currentCost;
      let savingsPotential = 0;

      switch (type) {
        case 'vibe':
          // Vibes can often be reduced by 50-70% through spec conversion
          optimizedCost = currentCost * 0.4;
          savingsPotential = currentCost * 0.6;
          if (steps.length > 1) {
            rootCauses.push('Multiple vibe operations that could be consolidated into specs');
          }
          break;
        case 'data_retrieval':
          // Data retrieval can be optimized through caching
          optimizedCost = currentCost * 0.6;
          savingsPotential = currentCost * 0.4;
          if (steps.length > 2) {
            rootCauses.push('Repeated data retrieval operations without caching');
          }
          break;
        case 'processing':
          // Processing can be optimized through batching
          optimizedCost = currentCost * 0.75;
          savingsPotential = currentCost * 0.25;
          break;
        default:
          optimizedCost = currentCost * 0.9;
          savingsPotential = currentCost * 0.1;
      }

      const driver: ValueDriver = {
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Operations`,
        currentCost,
        optimizedCost,
        savingsPotential
      };

      // Classify as primary or secondary driver based on cost impact
      if (costPercentage > 20) {
        primaryDrivers.push(driver);
      } else {
        secondaryDrivers.push(driver);
      }
    });

    // Add root causes for workflow complexity
    if (workflow.estimatedComplexity > 7) {
      rootCauses.push('High workflow complexity leading to increased quota consumption');
    }

    if (workflow.dataFlow.length > workflow.steps.length) {
      rootCauses.push('Complex data dependencies creating inefficient execution paths');
    }

    return {
      primaryDrivers: primaryDrivers.sort((a, b) => b.savingsPotential - a.savingsPotential),
      secondaryDrivers: secondaryDrivers.sort((a, b) => b.savingsPotential - a.savingsPotential),
      rootCauses
    };
  }

  applyZeroBasedDesign(intent: ParsedIntent, params?: OptionalParams): ZeroBasedSolution {
    const assumptionsChallenged: string[] = [];
    let radicalApproach = '';
    let potentialSavings = 0;
    let implementationRisk: 'low' | 'medium' | 'high' = 'medium';

    // Challenge common assumptions about workflow design
    if (intent.operationsRequired.some(op => op.type === 'vibe')) {
      assumptionsChallenged.push('Assumption: Complex logic requires vibe operations');
      radicalApproach += 'Replace all vibe operations with pre-defined spec templates. ';
      potentialSavings += 60;
    }

    if (intent.dataSourcesNeeded.length > 2) {
      assumptionsChallenged.push('Assumption: Multiple data sources must be queried separately');
      radicalApproach += 'Implement a unified data aggregation layer to batch all data requests. ';
      potentialSavings += 40;
    }

    if (intent.technicalRequirements.some(req => req.complexity === 'high')) {
      assumptionsChallenged.push('Assumption: Complex requirements need complex implementations');
      radicalApproach += 'Break down complex requirements into simple, composable operations. ';
      potentialSavings += 30;
      implementationRisk = 'high';
    }

    if (intent.potentialRisks.length > 2) {
      assumptionsChallenged.push('Assumption: Current workflow structure is necessary');
      radicalApproach += 'Redesign workflow from scratch using event-driven architecture with minimal state. ';
      potentialSavings += 50;
      implementationRisk = 'high';
    }

    // If no major assumptions to challenge, provide a conservative zero-based approach
    if (assumptionsChallenged.length === 0) {
      assumptionsChallenged.push('Assumption: Current approach is the most efficient');
      radicalApproach = 'Implement a completely stateless, functional approach with maximum reusability and minimal quota consumption.';
      potentialSavings = 25;
      implementationRisk = 'low';
    }

    // Adjust risk based on potential savings
    if (potentialSavings > 80) {
      implementationRisk = 'high';
    } else if (potentialSavings > 40) {
      implementationRisk = 'medium';
    } else {
      implementationRisk = 'low';
    }

    return {
      radicalApproach: radicalApproach.trim(),
      assumptionsChallenged,
      potentialSavings: Math.min(potentialSavings, 85), // Cap at 85%
      implementationRisk
    };
  }

  applyImpactEffortMatrix(optimizations: Optimization[], params?: OptionalParams): PrioritizedOptimizations {
    const matrix: PrioritizedOptimizations = {
      highImpactLowEffort: [],
      highImpactHighEffort: [],
      lowImpactLowEffort: [],
      lowImpactHighEffort: []
    };

    optimizations.forEach(optimization => {
      // Convert optimization to OptimizationOption format
      const effort = this.assessImplementationEffort(optimization);
      const option: OptimizationOption = {
        name: optimization.type,
        description: optimization.description,
        quotaSavings: optimization.estimatedSavings.percentage,
        implementationEffort: effort,
        riskLevel: this.assessRiskLevel(optimization),
        estimatedROI: this.calculateROI(optimization)
      };

      // Categorize based on impact (quota savings) and effort
      const isHighImpact = option.quotaSavings > 30;
      const isLowEffort = effort === 'low';

      if (isHighImpact && isLowEffort) {
        matrix.highImpactLowEffort.push(option);
      } else if (isHighImpact && !isLowEffort) {
        matrix.highImpactHighEffort.push(option);
      } else if (!isHighImpact && isLowEffort) {
        matrix.lowImpactLowEffort.push(option);
      } else {
        matrix.lowImpactHighEffort.push(option);
      }
    });

    // Sort each category by ROI
    Object.keys(matrix).forEach(key => {
      matrix[key as keyof PrioritizedOptimizations].sort((a, b) => b.estimatedROI - a.estimatedROI);
    });

    return matrix;
  }

  private assessImplementationEffort(optimization: Optimization): 'low' | 'medium' | 'high' {
    switch (optimization.type) {
      case 'caching':
        return 'low';
      case 'batching':
        return optimization.stepsAffected.length > 5 ? 'medium' : 'low';
      case 'vibe_to_spec':
        return 'medium';
      case 'decomposition':
        return 'high';
      default:
        return 'medium';
    }
  }

  private assessRiskLevel(optimization: Optimization): 'low' | 'medium' | 'high' {
    if (optimization.estimatedSavings.percentage > 60) return 'high';
    if (optimization.estimatedSavings.percentage > 30) return 'medium';
    return 'low';
  }

  private calculateROI(optimization: Optimization): number {
    const effort = this.assessImplementationEffort(optimization);
    const effortScore = effort === 'low' ? 1 : effort === 'medium' ? 2 : 3;
    return optimization.estimatedSavings.percentage / effortScore;
  }

  applyValuePropositionCanvas(intent: ParsedIntent, params?: OptionalParams): ValueProposition {
    const userJobs: string[] = [];
    const painPoints: string[] = [];
    const gainCreators: string[] = [];
    const painRelievers: string[] = [];

    // Extract user jobs from business objective and technical requirements
    userJobs.push(intent.businessObjective);
    intent.technicalRequirements.forEach(req => {
      userJobs.push(`Execute ${req.type} operations efficiently`);
    });

    // Identify pain points from risks and complexity
    intent.potentialRisks.forEach(risk => {
      painPoints.push(`Risk of ${risk.description}`);
    });

    if (intent.operationsRequired.length > 5) {
      painPoints.push('Managing complex workflow with many operations');
    }

    if (intent.dataSourcesNeeded.length > 2) {
      painPoints.push('Coordinating data from multiple sources');
    }

    // Define gain creators (benefits of optimization)
    gainCreators.push('Reduced quota consumption and costs');
    gainCreators.push('Faster workflow execution');
    gainCreators.push('More predictable resource usage');
    gainCreators.push('Improved workflow maintainability');

    // Define pain relievers (how optimization addresses pain points)
    painRelievers.push('Automated optimization reduces manual effort');
    painRelievers.push('Risk mitigation through systematic analysis');
    painRelievers.push('Clear cost visibility and forecasting');
    painRelievers.push('Simplified workflow structure');

    const valuePropositionStatement = `Transform complex, quota-intensive workflows into optimized, cost-effective solutions that ${intent.businessObjective.toLowerCase()} while minimizing resource consumption and operational risks.`;

    return {
      userJobs,
      painPoints,
      gainCreators,
      painRelievers,
      valuePropositionStatement
    };
  }

  generateOptionFraming(workflow: Workflow, params?: OptionalParams): ThreeOptionAnalysis {
    const totalQuotaCost = workflow.steps.reduce((sum, step) => sum + step.quotaCost, 0);

    // Conservative Option: Low-risk, moderate savings
    const conservative: OptimizationOption = {
      name: 'Conservative Optimization',
      description: 'Apply safe, proven optimization techniques with minimal workflow changes',
      quotaSavings: Math.round(totalQuotaCost * 0.25), // 25% savings
      implementationEffort: 'low',
      riskLevel: 'low',
      estimatedROI: 8.3 // 25% savings / 3 effort units
    };

    // Balanced Option: Moderate risk, good savings
    const balanced: OptimizationOption = {
      name: 'Balanced Optimization',
      description: 'Combine multiple optimization strategies for significant improvements with manageable risk',
      quotaSavings: Math.round(totalQuotaCost * 0.45), // 45% savings
      implementationEffort: 'medium',
      riskLevel: 'medium',
      estimatedROI: 22.5 // 45% savings / 2 effort units
    };

    // Bold Option: Higher risk, maximum savings
    const bold: OptimizationOption = {
      name: 'Bold Transformation',
      description: 'Radical workflow redesign using zero-based principles for maximum efficiency',
      quotaSavings: Math.round(totalQuotaCost * 0.70), // 70% savings
      implementationEffort: 'high',
      riskLevel: 'high',
      estimatedROI: 23.3 // 70% savings / 3 effort units
    };

    // Adjust options based on optional parameters
    if (params) {
      this.adjustOptionFramingForParameters({ conservative, balanced, bold }, params);
    }

    return {
      conservative,
      balanced,
      bold
    };
  }

  private adjustTechniqueRelevanceForParameters(techniques: ConsultingTechnique[], params: OptionalParams): void {
    // Adjust technique relevance based on cost constraints
    if (params.costConstraints) {
      const { maxVibes, maxSpecs, maxCostDollars } = params.costConstraints;
      const hasTightConstraints = (maxVibes !== undefined && maxVibes < 20) ||
        (maxSpecs !== undefined && maxSpecs < 5) ||
        (maxCostDollars !== undefined && maxCostDollars < 10);

      if (hasTightConstraints) {
        // Boost Zero-Based Design for tight cost constraints
        const zeroBasedTechnique = techniques.find(t => t.name === 'ZeroBased');
        if (zeroBasedTechnique) {
          zeroBasedTechnique.relevanceScore += 0.15;
        }

        // Boost Value Driver Tree for cost analysis
        const valueDriverTechnique = techniques.find(t => t.name === 'ValueDriverTree');
        if (valueDriverTechnique) {
          valueDriverTechnique.relevanceScore += 0.1;
        }
      }
    }

    // Adjust based on expected user volume
    if (params.expectedUserVolume !== undefined) {
      if (params.expectedUserVolume > 1000) {
        // High volume scenarios benefit from Impact vs Effort Matrix
        const impactEffortTechnique = techniques.find(t => t.name === 'ImpactEffort');
        if (impactEffortTechnique) {
          impactEffortTechnique.relevanceScore += 0.1;
        }
      }
    }

    // Adjust based on performance sensitivity
    if (params.performanceSensitivity === 'high') {
      // High performance sensitivity benefits from Value Driver Tree
      const valueDriverTechnique = techniques.find(t => t.name === 'ValueDriverTree');
      if (valueDriverTechnique) {
        valueDriverTechnique.relevanceScore += 0.08;
      }
    }
  }

  private adjustOptionFramingForParameters(options: ThreeOptionAnalysis, params: OptionalParams): void {
    // Adjust savings and effort based on cost constraints
    if (params.costConstraints) {
      const { maxVibes, maxSpecs, maxCostDollars } = params.costConstraints;
      const hasTightConstraints = (maxVibes !== undefined && maxVibes < 20) ||
        (maxSpecs !== undefined && maxSpecs < 5) ||
        (maxCostDollars !== undefined && maxCostDollars < 10);

      if (hasTightConstraints) {
        // Increase savings potential for all options when constraints are tight
        options.conservative.quotaSavings = Math.ceil(options.conservative.quotaSavings * 1.2);
        options.balanced.quotaSavings = Math.ceil(options.balanced.quotaSavings * 1.15);
        options.bold.quotaSavings = Math.ceil(options.bold.quotaSavings * 1.1);

        // Adjust descriptions to reflect cost focus
        options.conservative.description += ' with focus on cost reduction';
        options.balanced.description += ' prioritizing cost-effectiveness';
        options.bold.description += ' with aggressive cost optimization';
      }
    }

    // Adjust based on performance sensitivity
    if (params.performanceSensitivity === 'high') {
      // High performance sensitivity may require more effort but better results
      options.balanced.implementationEffort = 'high';
      options.bold.implementationEffort = 'high';

      // Update descriptions
      options.balanced.description += ' with performance optimization';
      options.bold.description += ' prioritizing maximum performance';
    } else if (params.performanceSensitivity === 'low') {
      // Low performance sensitivity allows for simpler implementations
      options.conservative.implementationEffort = 'low';
      options.balanced.implementationEffort = 'low';

      // Update descriptions
      options.conservative.description += ' with minimal complexity';
      options.balanced.description += ' using simple approaches';
    }

    // Recalculate ROI based on adjusted values
    const effortScores = { low: 1, medium: 2, high: 3 };
    options.conservative.estimatedROI = options.conservative.quotaSavings / effortScores[options.conservative.implementationEffort];
    options.balanced.estimatedROI = options.balanced.quotaSavings / effortScores[options.balanced.implementationEffort];
    options.bold.estimatedROI = options.bold.quotaSavings / effortScores[options.bold.implementationEffort];
  }

  /**
   * Main method that coordinates all consulting techniques to analyze the parsed intent
   * and generate comprehensive consulting analysis
   */
  async analyzeWithTechniques(intent: ParsedIntent, techniques?: string[]): Promise<ConsultingAnalysis> {
    // Validate inputs
    try {
      validateParsedIntent(intent);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new AnalysisError(
          `Business analysis input validation failed: ${error.message}`,
          'Please ensure the parsed intent contains valid technical requirements and operations',
          error
        );
      }
      throw error;
    }

    // Select relevant techniques (either provided or auto-selected)
    const selectedTechniques = techniques
      ? this.filterTechniquesByNames(techniques)
      : this.selectTechniques(intent);

    // Validate selected techniques
    try {
      validateConsultingTechniques(selectedTechniques);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new AnalysisError(
          `Consulting techniques validation failed: ${error.message}`,
          'Using fallback analysis techniques',
          error
        );
      }
      throw error;
    }

    // Create initial workflow from intent for analysis
    const workflow: Workflow = {
      id: `workflow-${Date.now()}`,
      steps: intent.operationsRequired.map(op => ({
        id: op.id,
        type: op.type,
        description: op.description,
        inputs: [],
        outputs: [],
        quotaCost: op.estimatedQuotaCost
      })),
      dataFlow: [],
      estimatedComplexity: intent.technicalRequirements.length
    };

    const analysis: ConsultingAnalysis = {
      techniquesUsed: selectedTechniques,
      keyFindings: [],
      totalQuotaSavings: 0,
      implementationComplexity: 'medium'
    };

    // Apply each selected technique
    for (const technique of selectedTechniques) {
      switch (technique.name) {
        case 'MECE':
          analysis.meceAnalysis = this.applyMECE(workflow);
          analysis.keyFindings.push(`MECE analysis identified ${analysis.meceAnalysis.categories.length} quota driver categories with ${analysis.meceAnalysis.totalCoverage}% coverage`);
          break;

        case 'ValueDriverTree':
          analysis.valueDriverAnalysis = this.applyValueDriverTree(workflow);
          const topDriver = analysis.valueDriverAnalysis.primaryDrivers[0];
          if (topDriver) {
            analysis.keyFindings.push(`Value driver analysis reveals ${topDriver.name} as primary cost driver with ${topDriver.savingsPotential} savings potential`);
          }
          break;

        case 'ZeroBased':
          analysis.zeroBasedSolution = this.applyZeroBasedDesign(intent);
          analysis.keyFindings.push(`Zero-based design challenges ${analysis.zeroBasedSolution.assumptionsChallenged.length} assumptions with ${analysis.zeroBasedSolution.potentialSavings}% potential savings`);
          break;

        case 'OptionFraming':
          analysis.threeOptionAnalysis = this.generateOptionFraming(workflow);
          analysis.keyFindings.push(`Option framing provides Conservative (${analysis.threeOptionAnalysis.conservative.quotaSavings}%), Balanced (${analysis.threeOptionAnalysis.balanced.quotaSavings}%), and Bold (${analysis.threeOptionAnalysis.bold.quotaSavings}%) approaches`);
          break;

        case 'ImpactEffort':
          // Create mock optimizations for impact-effort analysis
          const mockOptimizations: Optimization[] = [
            {
              type: 'caching',
              description: 'Implement caching layer for data operations',
              stepsAffected: workflow.steps.filter(s => s.type === 'data_retrieval').map(s => s.id),
              estimatedSavings: { vibes: 0, specs: 0, percentage: 30 }
            },
            {
              type: 'batching',
              description: 'Batch similar operations together',
              stepsAffected: workflow.steps.filter(s => s.type === 'processing').map(s => s.id),
              estimatedSavings: { vibes: 0, specs: 0, percentage: 25 }
            },
            {
              type: 'vibe_to_spec',
              description: 'Convert vibe operations to spec templates',
              stepsAffected: workflow.steps.filter(s => s.type === 'vibe').map(s => s.id),
              estimatedSavings: { vibes: 0, specs: 0, percentage: 50 }
            }
          ];
          analysis.prioritizedOptimizations = this.applyImpactEffortMatrix(mockOptimizations);
          const quickWins = analysis.prioritizedOptimizations.highImpactLowEffort.length;
          analysis.keyFindings.push(`Impact-effort analysis identified ${quickWins} high-impact, low-effort quick wins`);
          break;

        case 'ValueProp':
          analysis.valueProposition = this.applyValuePropositionCanvas(intent);
          analysis.keyFindings.push(`Value proposition addresses ${analysis.valueProposition.painPoints.length} pain points and creates ${analysis.valueProposition.gainCreators.length} value drivers`);
          break;
      }
    }

    // Calculate total quota savings from all techniques
    analysis.totalQuotaSavings = this.calculateTotalQuotaSavings(analysis);

    // Determine implementation complexity
    analysis.implementationComplexity = this.assessImplementationComplexity(analysis);

    // Add overall findings
    analysis.keyFindings.unshift(`Applied ${selectedTechniques.length} consulting techniques (${selectedTechniques.map(t => t.name).join(', ')}) for comprehensive workflow analysis`);

    return analysis;
  }

  private filterTechniquesByNames(techniqueNames: string[]): ConsultingTechnique[] {
    const allTechniques: ConsultingTechnique[] = [
      { name: 'MECE', relevanceScore: 0.9, applicableScenarios: ['quota optimization', 'workflow analysis'] },
      { name: 'ValueDriverTree', relevanceScore: 0.8, applicableScenarios: ['cost analysis', 'optimization prioritization'] },
      { name: 'ZeroBased', relevanceScore: 0.7, applicableScenarios: ['radical optimization', 'workflow redesign'] },
      { name: 'OptionFraming', relevanceScore: 0.85, applicableScenarios: ['decision making', 'risk assessment'] },
      { name: 'ImpactEffort', relevanceScore: 0.75, applicableScenarios: ['optimization prioritization', 'resource allocation'] },
      { name: 'ValueProp', relevanceScore: 0.6, applicableScenarios: ['user value alignment', 'feature prioritization'] },
      { name: 'Pyramid', relevanceScore: 0.5, applicableScenarios: ['structured communication', 'recommendation clarity'] }
    ];

    return allTechniques.filter(technique =>
      techniqueNames.some(name =>
        name.toLowerCase() === technique.name.toLowerCase() ||
        name.toLowerCase().includes(technique.name.toLowerCase())
      )
    );
  }

  private calculateTotalQuotaSavings(analysis: ConsultingAnalysis): number {
    let totalSavings = 0;
    let savingsCount = 0;

    // Collect savings from different analyses
    if (analysis.zeroBasedSolution) {
      totalSavings += analysis.zeroBasedSolution.potentialSavings;
      savingsCount++;
    }

    if (analysis.threeOptionAnalysis) {
      totalSavings += analysis.threeOptionAnalysis.balanced.quotaSavings;
      savingsCount++;
    }

    if (analysis.valueDriverAnalysis) {
      const driverSavings = analysis.valueDriverAnalysis.primaryDrivers
        .reduce((sum, driver) => sum + driver.savingsPotential, 0);
      totalSavings += driverSavings;
      savingsCount++;
    }

    if (analysis.prioritizedOptimizations) {
      const quickWinSavings = analysis.prioritizedOptimizations.highImpactLowEffort
        .reduce((sum, opt) => sum + opt.quotaSavings, 0);
      totalSavings += quickWinSavings;
      savingsCount++;
    }

    // Return average savings if multiple techniques provide estimates
    return savingsCount > 0 ? Math.round(totalSavings / savingsCount) : 0;
  }

  private assessImplementationComplexity(analysis: ConsultingAnalysis): 'low' | 'medium' | 'high' {
    let complexityScore = 0;

    // Factor in zero-based solution risk
    if (analysis.zeroBasedSolution) {
      switch (analysis.zeroBasedSolution.implementationRisk) {
        case 'high': complexityScore += 3; break;
        case 'medium': complexityScore += 2; break;
        case 'low': complexityScore += 1; break;
      }
    }

    // Factor in number of techniques used
    complexityScore += analysis.techniquesUsed.length * 0.5;

    // Factor in total savings (higher savings often mean more complex changes)
    if (analysis.totalQuotaSavings > 60) complexityScore += 2;
    else if (analysis.totalQuotaSavings > 30) complexityScore += 1;

    // Determine complexity level
    if (complexityScore >= 5) return 'high';
    if (complexityScore >= 3) return 'medium';
    return 'low';
  }

  // ============================================================================
  // Enhanced Business Opportunity Analysis (Task 4.1)
  // ============================================================================

  /**
   * Analyzes enhanced business opportunity with integrated market sizing and competitive context
   * Requirements: 3.1, 3.2, 3.3
   */
  async analyzeEnhancedBusinessOpportunity(
    intent: ParsedIntent,
    marketSizing?: MarketSizingResult,
    competitiveAnalysis?: CompetitorAnalysisResult,
    params?: OptionalParams
  ): Promise<EnhancedBusinessOpportunity> {
    // Generate base business opportunity analysis
    const businessOpportunity = await this.generateBusinessOpportunity(intent, params);
    
    // Assess strategic fit with competitive positioning
    const strategicFit = this.assessStrategicFit(intent, competitiveAnalysis, params);
    
    // Analyze market timing
    const marketTiming = this.analyzeMarketTiming(intent, competitiveAnalysis, params);
    
    // Generate integrated insights
    const integratedInsights = this.generateIntegratedInsights(
      businessOpportunity,
      marketSizing,
      competitiveAnalysis,
      strategicFit,
      marketTiming
    );
    
    // Generate overall recommendation
    const overallRecommendation = this.generateOverallRecommendation(
      businessOpportunity,
      marketSizing,
      competitiveAnalysis,
      strategicFit,
      marketTiming,
      integratedInsights
    );

    return {
      businessOpportunity,
      marketSizing,
      competitiveAnalysis,
      strategicFit,
      marketTiming,
      integratedInsights,
      overallRecommendation
    };
  }

  private async generateBusinessOpportunity(intent: ParsedIntent, params?: OptionalParams): Promise<BusinessOpportunity> {
    const id = `opportunity-${Date.now()}`;
    
    // Extract market validation from intent
    const marketValidation = {
      targetMarket: intent.dataSourcesNeeded,
      marketNeed: intent.businessObjective,
      customerSegments: this.extractCustomerSegments(intent),
      competitiveLandscape: intent.potentialRisks.map(risk => risk.description),
      marketTrends: this.identifyMarketTrends(intent),
      validationSources: intent.dataSourcesNeeded
    };

    // Assess strategic alignment
    const strategyAlignment = {
      companyMission: 'Enhance development productivity and decision-making',
      strategicPriorities: ['Developer Experience', 'AI Integration', 'Workflow Optimization'],
      okrAlignment: this.assessOKRAlignment(intent),
      competitiveAdvantage: this.identifyCompetitiveAdvantages(intent),
      alignmentScore: this.calculateAlignmentScore(intent)
    };

    // Generate financial projections
    const financialProjections = this.generateFinancialProjections(intent, params);

    // Assess risks
    const riskAssessment = this.generateRiskAssessment(intent);

    // Create implementation plan
    const implementationPlan = this.generateImplementationPlan(intent);

    // Define success metrics
    const successMetrics = this.generateSuccessMetrics(intent);

    return {
      id,
      title: `Business Opportunity: ${intent.businessObjective}`,
      description: `Enhanced business opportunity analysis for ${intent.businessObjective} with integrated market and competitive context`,
      marketValidation,
      strategicAlignment: strategyAlignment,
      financialProjections,
      riskAssessment,
      implementationPlan,
      successMetrics,
      confidenceLevel: this.calculateConfidenceLevel(intent, params),
      lastUpdated: new Date().toISOString()
    };
  }

  // ============================================================================
  // Strategic Fit Assessment (Task 4.2)
  // ============================================================================

  /**
   * Implements strategic alignment scoring with competitive positioning
   * Requirements: 3.2, 3.4
   */
  assessStrategicFit(
    intent: ParsedIntent,
    competitiveAnalysis?: CompetitorAnalysisResult,
    params?: OptionalParams
  ): StrategicFitAssessment {
    // Calculate alignment score based on multiple factors
    const alignmentScore = this.calculateStrategicAlignmentScore(intent, competitiveAnalysis);
    
    // Identify competitive advantages
    const competitiveAdvantage = this.identifyCompetitiveAdvantages(intent, competitiveAnalysis);
    
    // Analyze market gaps
    const marketGaps = this.analyzeMarketGaps(intent, competitiveAnalysis);
    
    // Assess entry barriers
    const entryBarriers = this.assessEntryBarriers(intent, competitiveAnalysis);
    
    // Identify success factors
    const successFactors = this.identifySuccessFactors(intent, competitiveAnalysis);
    
    // Generate strategic recommendations
    const strategicRecommendations = this.generateStrategicRecommendations(
      intent,
      competitiveAnalysis,
      alignmentScore,
      marketGaps,
      entryBarriers
    );
    
    // Perform comprehensive fit analysis
    const fitAnalysis = this.performFitAnalysis(
      intent,
      competitiveAnalysis,
      alignmentScore,
      marketGaps,
      entryBarriers,
      successFactors
    );

    return {
      alignmentScore,
      competitiveAdvantage,
      marketGaps,
      entryBarriers,
      successFactors,
      strategicRecommendations,
      fitAnalysis
    };
  }

  /**
   * Analyzes market timing with competitive context
   */
  analyzeMarketTiming(
    intent: ParsedIntent,
    competitiveAnalysis?: CompetitorAnalysisResult,
    params?: OptionalParams
  ): MarketTimingAnalysis {
    const marketReadiness = this.assessMarketReadiness(intent);
    const competitiveTiming = this.assessCompetitiveTiming(competitiveAnalysis);
    const internalReadiness = this.assessInternalReadiness(intent, params);
    const externalFactors = this.identifyExternalFactors(intent);
    
    const timingScore = this.calculateTimingScore(
      marketReadiness,
      competitiveTiming,
      internalReadiness,
      externalFactors
    );
    
    const timingRecommendation = this.generateTimingRecommendation(
      timingScore,
      marketReadiness,
      competitiveTiming,
      internalReadiness,
      externalFactors
    );

    return {
      timingScore,
      marketReadiness,
      competitiveTiming,
      internalReadiness,
      externalFactors,
      timingRecommendation
    };
  }

  // ============================================================================
  // Helper Methods for Enhanced Analysis
  // ============================================================================

  private extractCustomerSegments(intent: ParsedIntent) {
    return [
      {
        name: 'Development Teams',
        size: 1000000,
        characteristics: ['Technical', 'Efficiency-focused', 'Tool-savvy'],
        painPoints: intent.potentialRisks.map(risk => risk.description),
        willingness_to_pay: 100
      }
    ];
  }

  private identifyMarketTrends(intent: ParsedIntent): string[] {
    const trends = ['AI-driven development tools', 'Workflow automation', 'Developer productivity focus'];
    
    if (intent.technicalRequirements.some(req => req.type === 'processing' || req.type === 'analysis')) {
      trends.push('AI integration in development workflows');
    }
    
    if (intent.operationsRequired.some(op => op.type === 'vibe')) {
      trends.push('Code generation and AI assistance');
    }
    
    return trends;
  }

  private assessOKRAlignment(intent: ParsedIntent) {
    return [
      {
        objective: 'Improve Developer Productivity',
        keyResults: ['Reduce development time by 30%', 'Increase code quality scores'],
        alignmentStrength: 'strong' as const
      },
      {
        objective: 'Enhance AI Integration',
        keyResults: ['Deploy AI tools across development lifecycle'],
        alignmentStrength: intent.technicalRequirements.some(req => req.type === 'processing' || req.type === 'analysis') ? 'strong' as const : 'moderate' as const
      }
    ];
  }

  private identifyCompetitiveAdvantages(intent: ParsedIntent, competitiveAnalysis?: CompetitorAnalysisResult): string[] {
    const advantages = [
      'Integrated development environment',
      'AI-powered workflow optimization',
      'Comprehensive PM toolkit'
    ];

    if (competitiveAnalysis?.marketPositioning.marketGaps) {
      competitiveAnalysis.marketPositioning.marketGaps.forEach(gap => {
        if (gap.size === 'large') {
          advantages.push(`First-mover advantage in ${gap.description}`);
        }
      });
    }

    return advantages;
  }

  private calculateAlignmentScore(intent: ParsedIntent): number {
    let score = 70; // Base alignment score
    
    // Boost for AI-related requirements (processing and analysis)
    if (intent.technicalRequirements.some(req => req.type === 'processing' || req.type === 'analysis')) {
      score += 15;
    }
    
    // Boost for workflow optimization focus
    if (intent.businessObjective.toLowerCase().includes('optimize') || 
        intent.businessObjective.toLowerCase().includes('efficiency')) {
      score += 10;
    }
    
    // Penalty for high complexity
    if (intent.technicalRequirements.length > 5) {
      score -= 5;
    }
    
    return Math.min(Math.max(score, 0), 100);
  }

  private generateFinancialProjections(intent: ParsedIntent, params?: OptionalParams) {
    const baseRevenue = params?.costConstraints?.maxCostDollars || 50000;
    
    return [
      {
        timeframe: 'Year 1',
        revenue: baseRevenue * 2,
        costs: baseRevenue * 0.7,
        profit: baseRevenue * 1.3,
        roi: 1.86,
        assumptions: ['Market adoption rate: 15%', 'Customer retention: 85%']
      },
      {
        timeframe: 'Year 2',
        revenue: baseRevenue * 4,
        costs: baseRevenue * 1.2,
        profit: baseRevenue * 2.8,
        roi: 2.33,
        assumptions: ['Market adoption rate: 25%', 'Customer retention: 90%']
      }
    ];
  }

  private generateRiskAssessment(intent: ParsedIntent) {
    const risks = intent.potentialRisks.map(risk => ({
      category: 'technical' as const,
      description: risk.description,
      probability: risk.severity === 'high' ? 0.7 : risk.severity === 'medium' ? 0.4 : 0.2,
      impact: risk.severity === 'high' ? 8 : risk.severity === 'medium' ? 5 : 3,
      riskScore: (risk.severity === 'high' ? 0.7 : risk.severity === 'medium' ? 0.4 : 0.2) * 
                 (risk.severity === 'high' ? 8 : risk.severity === 'medium' ? 5 : 3)
    }));

    const mitigationStrategies = risks.map(risk => ({
      riskCategory: risk.category,
      strategy: `Implement comprehensive testing and validation for ${risk.description}`,
      effectiveness: 0.8,
      cost: 5000
    }));

    const overallRiskLevel = risks.some(r => r.riskScore > 5) ? 'high' as const :
                           risks.some(r => r.riskScore > 3) ? 'medium' as const : 'low' as const;

    return {
      risks,
      mitigationStrategies,
      overallRiskLevel
    };
  }

  private generateImplementationPlan(intent: ParsedIntent) {
    return [
      {
        phase: 1,
        name: 'Foundation & Planning',
        duration: '4 weeks',
        deliverables: ['Technical architecture', 'Resource allocation', 'Risk mitigation plan'],
        resources: ['Senior Developer', 'Product Manager', 'UX Designer'],
        dependencies: ['Stakeholder approval', 'Budget allocation'],
        milestones: ['Architecture review', 'Team formation', 'Project kickoff']
      },
      {
        phase: 2,
        name: 'Core Development',
        duration: '8 weeks',
        deliverables: ['Core functionality', 'Integration tests', 'Documentation'],
        resources: ['Development Team', 'QA Engineer', 'Technical Writer'],
        dependencies: ['Phase 1 completion', 'Development environment setup'],
        milestones: ['MVP completion', 'Integration testing', 'Performance validation']
      }
    ];
  }

  private generateSuccessMetrics(intent: ParsedIntent) {
    return [
      {
        name: 'User Adoption Rate',
        type: 'leading' as const,
        target: 75,
        unit: 'percentage',
        measurementFrequency: 'weekly',
        dataSource: 'Analytics platform'
      },
      {
        name: 'Workflow Efficiency Improvement',
        type: 'lagging' as const,
        target: 30,
        unit: 'percentage',
        measurementFrequency: 'monthly',
        dataSource: 'Performance metrics'
      }
    ];
  }

  private calculateConfidenceLevel(intent: ParsedIntent, params?: OptionalParams): 'high' | 'medium' | 'low' {
    let confidenceScore = 60; // Lower base score
    
    // Boost confidence for well-defined requirements
    if (intent.technicalRequirements.length >= 2) {
      confidenceScore += 15;
    }
    
    // Boost confidence for clear business objective
    if (intent.businessObjective.length > 20) {
      confidenceScore += 10;
    }
    
    // Reduce confidence for high-risk scenarios
    if (intent.potentialRisks.some(risk => risk.severity === 'high')) {
      confidenceScore -= 35;
    }
    
    // Reduce confidence for empty requirements
    if (intent.technicalRequirements.length === 0) {
      confidenceScore -= 30;
    }
    
    // Reduce confidence for multiple high risks
    const highRiskCount = intent.potentialRisks.filter(risk => risk.severity === 'high').length;
    if (highRiskCount > 1) {
      confidenceScore -= 15;
    }
    
    if (confidenceScore >= 75) return 'high';
    if (confidenceScore >= 45) return 'medium';
    return 'low';
  }

  private calculateStrategicAlignmentScore(intent: ParsedIntent, competitiveAnalysis?: CompetitorAnalysisResult): number {
    let score = 60; // Base score
    
    // Strategic alignment factors
    if (intent.businessObjective.toLowerCase().includes('productivity')) score += 20;
    if (intent.businessObjective.toLowerCase().includes('efficiency')) score += 15;
    if (intent.technicalRequirements.some(req => req.type === 'processing' || req.type === 'analysis')) score += 15;
    
    // Competitive positioning boost
    if (competitiveAnalysis?.marketPositioning.marketGaps.some(gap => gap.size === 'large')) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }

  private analyzeMarketGaps(intent: ParsedIntent, competitiveAnalysis?: CompetitorAnalysisResult) {
    const gaps = [];
    
    // AI integration gap
    if (intent.technicalRequirements.some(req => req.type === 'processing' || req.type === 'analysis')) {
      gaps.push({
        gapType: 'feature' as const,
        description: 'AI-powered workflow optimization',
        size: 'large' as const,
        competitorCoverage: 30,
        opportunityScore: 85,
        addressabilityScore: 90,
        timeToMarket: '6-12 months',
        resourceRequirements: ['AI expertise', 'Development team', 'Data infrastructure']
      });
    }
    
    // Workflow automation gap
    gaps.push({
      gapType: 'use-case' as const,
      description: 'Comprehensive PM workflow automation',
      size: 'medium' as const,
      competitorCoverage: 45,
      opportunityScore: 70,
      addressabilityScore: 80,
      timeToMarket: '3-6 months',
      resourceRequirements: ['Product expertise', 'Integration capabilities']
    });
    
    return gaps;
  }

  private assessEntryBarriers(intent: ParsedIntent, competitiveAnalysis?: CompetitorAnalysisResult) {
    return [
      {
        type: 'technical' as const,
        description: 'AI and ML expertise requirements',
        height: 'medium' as const,
        overcomability: 75,
        timeToOvercome: '6-12 months',
        costToOvercome: 200000,
        strategicImportance: 85
      },
      {
        type: 'brand' as const,
        description: 'Developer tool market recognition',
        height: 'medium' as const,
        overcomability: 60,
        timeToOvercome: '12-18 months',
        costToOvercome: 150000,
        strategicImportance: 70
      }
    ];
  }

  private identifySuccessFactors(intent: ParsedIntent, competitiveAnalysis?: CompetitorAnalysisResult) {
    return [
      {
        factor: 'AI Integration Capability',
        importance: 90,
        currentCapability: 70,
        capabilityGap: 20,
        developmentPlan: ['Hire AI specialists', 'Develop ML models', 'Create training datasets'],
        timeToAchieve: '6 months',
        investmentRequired: 150000
      },
      {
        factor: 'Developer Experience Design',
        importance: 85,
        currentCapability: 80,
        capabilityGap: 5,
        developmentPlan: ['UX research', 'Usability testing', 'Interface optimization'],
        timeToAchieve: '3 months',
        investmentRequired: 75000
      }
    ];
  }

  private generateStrategicRecommendations(
    intent: ParsedIntent,
    competitiveAnalysis: CompetitorAnalysisResult | undefined,
    alignmentScore: number,
    marketGaps: any[],
    entryBarriers: any[]
  ) {
    const recommendations = [];
    
    if (alignmentScore > 80 && marketGaps.some(gap => gap.size === 'large')) {
      recommendations.push({
        type: 'go' as const,
        rationale: ['Strong strategic alignment', 'Large market opportunity', 'Competitive advantage potential'],
        conditions: ['Secure AI expertise', 'Validate market demand'],
        timeline: '6-12 months',
        resourceRequirements: ['Development team', 'AI specialists', 'Product managers'],
        expectedOutcomes: ['Market leadership', 'Revenue growth', 'Competitive differentiation'],
        riskMitigation: ['Phased rollout', 'Customer validation', 'Competitive monitoring']
      });
    } else if (alignmentScore > 60) {
      recommendations.push({
        type: 'pivot' as const,
        rationale: ['Moderate alignment', 'Market opportunity exists', 'Entry barriers manageable'],
        conditions: ['Refine value proposition', 'Strengthen capabilities'],
        timeline: '3-6 months preparation',
        resourceRequirements: ['Strategy team', 'Market research', 'Capability development'],
        expectedOutcomes: ['Improved market fit', 'Reduced execution risk'],
        riskMitigation: ['Market validation', 'Capability assessment', 'Competitive analysis']
      });
    } else {
      // For low alignment scores, recommend pivot or delay
      recommendations.push({
        type: 'pivot' as const,
        rationale: ['Low strategic alignment', 'Significant changes needed', 'Market opportunity unclear'],
        conditions: ['Reassess strategic fit', 'Identify alternative approaches', 'Strengthen value proposition'],
        timeline: '6-9 months preparation',
        resourceRequirements: ['Strategy team', 'Market research', 'Product development'],
        expectedOutcomes: ['Better market alignment', 'Clearer value proposition'],
        riskMitigation: ['Thorough market validation', 'Stakeholder alignment', 'Iterative approach']
      });
    }
    
    return recommendations;
  }

  private performFitAnalysis(
    intent: ParsedIntent,
    competitiveAnalysis: CompetitorAnalysisResult | undefined,
    alignmentScore: number,
    marketGaps: any[],
    entryBarriers: any[],
    successFactors: any[]
  ) {
    const marketFit = {
      score: 75,
      confidence: 80,
      factors: [
        { name: 'Market Size', weight: 30, score: 80, rationale: 'Large developer market' },
        { name: 'Customer Need', weight: 25, score: 85, rationale: 'Strong productivity focus' },
        { name: 'Market Timing', weight: 20, score: 70, rationale: 'AI adoption growing' },
        { name: 'Competition', weight: 25, score: 65, rationale: 'Moderate competitive intensity' }
      ],
      recommendation: 'Strong market fit with growth potential'
    };

    const strategicFit = {
      score: alignmentScore,
      confidence: 85,
      factors: [
        { name: 'Mission Alignment', weight: 40, score: alignmentScore, rationale: 'Aligns with productivity mission' },
        { name: 'Capability Fit', weight: 35, score: 70, rationale: 'Good technical capabilities' },
        { name: 'Resource Availability', weight: 25, score: 75, rationale: 'Adequate resources available' }
      ],
      recommendation: alignmentScore > 80 ? 'Excellent strategic fit' : 'Good strategic alignment'
    };

    const capabilityFit = {
      score: 72,
      confidence: 75,
      factors: successFactors.map(factor => ({
        name: factor.factor,
        weight: factor.importance / 100 * 25,
        score: factor.currentCapability,
        rationale: `Current capability: ${factor.currentCapability}%`
      })),
      recommendation: 'Capabilities adequate with development needed'
    };

    const timingFit = {
      score: 78,
      confidence: 70,
      factors: [
        { name: 'Market Readiness', weight: 40, score: 80, rationale: 'Market ready for AI tools' },
        { name: 'Internal Readiness', weight: 35, score: 75, rationale: 'Good internal capabilities' },
        { name: 'Competitive Timing', weight: 25, score: 70, rationale: 'Window of opportunity exists' }
      ],
      recommendation: 'Good timing for market entry'
    };

    const overallFit = {
      score: Math.round((marketFit.score + strategicFit.score + capabilityFit.score + timingFit.score) / 4),
      confidence: Math.round((marketFit.confidence + strategicFit.confidence + capabilityFit.confidence + timingFit.confidence) / 4),
      factors: [
        { name: 'Market Fit', weight: 25, score: marketFit.score, rationale: marketFit.recommendation },
        { name: 'Strategic Fit', weight: 30, score: strategicFit.score, rationale: strategicFit.recommendation },
        { name: 'Capability Fit', weight: 25, score: capabilityFit.score, rationale: capabilityFit.recommendation },
        { name: 'Timing Fit', weight: 20, score: timingFit.score, rationale: timingFit.recommendation }
      ],
      recommendation: 'Proceed with strategic opportunity'
    };

    return {
      marketFit,
      strategicFit,
      capabilityFit,
      timingFit,
      overallFit,
      keyInsights: [
        'Strong market opportunity in developer productivity space',
        'AI integration capabilities need strengthening',
        'Competitive window exists for 12-18 months',
        'Strategic alignment supports investment decision'
      ]
    };
  }

  private assessMarketReadiness(intent: ParsedIntent) {
    return {
      customerDemand: 80,
      marketMaturity: 'growth' as const,
      adoptionCurve: 'early-majority' as const,
      marketSignals: [
        {
          type: 'demand' as const,
          signal: 'Increasing developer productivity focus',
          strength: 'strong' as const,
          trend: 'increasing' as const,
          impact: 85
        },
        {
          type: 'technology' as const,
          signal: 'AI tool adoption in development',
          strength: 'strong' as const,
          trend: 'increasing' as const,
          impact: 90
        }
      ],
      readinessScore: 82
    };
  }

  private assessCompetitiveTiming(competitiveAnalysis?: CompetitorAnalysisResult) {
    return {
      competitorMoves: competitiveAnalysis?.competitiveMatrix.competitors.flatMap(comp => 
        comp.recentMoves.map(move => ({
          competitor: comp.name,
          move: move.description,
          timing: move.date,
          impact: move.impact === 'high' ? 80 : move.impact === 'medium' ? 50 : 20,
          responseRequired: move.impact === 'high'
        }))
      ) || [],
      marketWindowSize: 'moderate' as const,
      firstMoverAdvantage: 70,
      competitiveResponse: [
        {
          scenario: 'Major competitor launches similar feature',
          probability: 0.6,
          timeframe: '12-18 months',
          impact: 70,
          counterStrategy: ['Accelerate development', 'Enhance differentiation', 'Strengthen partnerships']
        }
      ],
      timingAdvantage: 65
    };
  }

  private assessInternalReadiness(intent: ParsedIntent, params?: OptionalParams) {
    return {
      capabilityReadiness: 75,
      resourceAvailability: params?.costConstraints ? 70 : 85,
      organizationalAlignment: 80,
      technicalReadiness: intent.technicalRequirements.length > 3 ? 70 : 85,
      overallReadiness: 77,
      readinessGaps: [
        {
          area: 'AI Expertise',
          currentState: 'Basic AI knowledge',
          requiredState: 'Advanced AI/ML capabilities',
          gapSize: 30,
          timeToClose: '6 months',
          effort: 8
        }
      ]
    };
  }

  private identifyExternalFactors(intent: ParsedIntent) {
    return [
      {
        category: 'technological' as const,
        factor: 'AI technology advancement',
        impact: 85,
        probability: 0.9,
        timeframe: '12 months',
        mitigation: ['Stay current with AI developments', 'Build flexible architecture']
      },
      {
        category: 'economic' as const,
        factor: 'Developer tool market growth',
        impact: 70,
        probability: 0.8,
        timeframe: '24 months',
        mitigation: ['Monitor market trends', 'Adjust pricing strategy']
      }
    ];
  }

  private calculateTimingScore(marketReadiness: any, competitiveTiming: any, internalReadiness: any, externalFactors: any[]): number {
    const marketScore = marketReadiness.readinessScore;
    const competitiveScore = competitiveTiming.timingAdvantage;
    const internalScore = internalReadiness.overallReadiness;
    const externalScore = externalFactors.reduce((sum, factor) => sum + factor.impact * factor.probability, 0) / externalFactors.length;
    
    return Math.round((marketScore * 0.3 + competitiveScore * 0.25 + internalScore * 0.25 + externalScore * 0.2));
  }

  private generateTimingRecommendation(
    timingScore: number,
    marketReadiness: any,
    competitiveTiming: any,
    internalReadiness: any,
    externalFactors: any[]
  ) {
    if (timingScore >= 80) {
      return {
        recommendation: 'launch-now' as const,
        rationale: ['Optimal market conditions', 'Strong competitive position', 'High internal readiness'],
        optimalTiming: 'Immediate launch recommended',
        conditions: ['Secure necessary resources', 'Finalize go-to-market strategy'],
        risks: ['Competitive response', 'Resource constraints'],
        alternatives: ['Phased launch approach', 'Partnership strategy']
      };
    } else if (timingScore >= 65) {
      return {
        recommendation: 'launch-soon' as const,
        rationale: ['Good market conditions', 'Reasonable competitive window', 'Adequate preparation time'],
        optimalTiming: '3-6 months',
        conditions: ['Address capability gaps', 'Strengthen market position'],
        risks: ['Market timing shift', 'Competitive preemption'],
        alternatives: ['Accelerated timeline', 'Strategic partnerships']
      };
    } else {
      return {
        recommendation: 'delay' as const,
        rationale: ['Market not fully ready', 'Internal capabilities need development', 'Competitive risks high'],
        optimalTiming: '6-12 months',
        conditions: ['Develop capabilities', 'Monitor market evolution', 'Strengthen competitive position'],
        risks: ['Missing market window', 'Competitive advantage erosion'],
        alternatives: ['Pivot strategy', 'Partnership approach', 'Niche market entry']
      };
    }
  }

  private generateIntegratedInsights(
    businessOpportunity: BusinessOpportunity,
    marketSizing?: MarketSizingResult,
    competitiveAnalysis?: CompetitorAnalysisResult,
    strategicFit?: StrategicFitAssessment,
    marketTiming?: MarketTimingAnalysis
  ): IntegratedInsight[] {
    const insights: IntegratedInsight[] = [];

    // Market-Competitive Insight
    if (marketSizing && competitiveAnalysis) {
      insights.push({
        type: 'market-competitive',
        insight: `Market opportunity of $${marketSizing.tam.value.toLocaleString()} TAM with ${competitiveAnalysis.competitiveMatrix.competitors.length} major competitors presents significant growth potential`,
        supportingData: [
          { source: 'market-sizing', dataPoint: 'TAM', value: marketSizing.tam.value, context: 'Total addressable market size' },
          { source: 'competitive-analysis', dataPoint: 'Competitor Count', value: competitiveAnalysis.competitiveMatrix.competitors.length, context: 'Number of direct competitors' }
        ],
        implications: [
          'Large market validates opportunity size',
          'Competitive landscape requires differentiation strategy',
          'Market share capture potential exists'
        ],
        actionItems: [
          'Develop competitive differentiation strategy',
          'Focus on underserved market segments',
          'Monitor competitive moves closely'
        ],
        confidence: 85
      });
    }

    // Strategic-Timing Insight
    if (strategicFit && marketTiming) {
      insights.push({
        type: 'strategic-timing',
        insight: `Strategic alignment score of ${strategicFit.alignmentScore}% combined with timing score of ${marketTiming.timingScore}% indicates favorable conditions for investment`,
        supportingData: [
          { source: 'strategic-fit', dataPoint: 'Alignment Score', value: strategicFit.alignmentScore, context: 'Strategic alignment percentage' },
          { source: 'timing-analysis', dataPoint: 'Timing Score', value: marketTiming.timingScore, context: 'Market timing favorability' }
        ],
        implications: [
          'Strong strategic fit supports long-term success',
          'Market timing favors early entry',
          'Internal capabilities align with opportunity'
        ],
        actionItems: [
          'Accelerate development timeline',
          'Secure necessary resources',
          'Establish market entry strategy'
        ],
        confidence: 80
      });
    }

    return insights;
  }

  private generateOverallRecommendation(
    businessOpportunity: BusinessOpportunity,
    marketSizing?: MarketSizingResult,
    competitiveAnalysis?: CompetitorAnalysisResult,
    strategicFit?: StrategicFitAssessment,
    marketTiming?: MarketTimingAnalysis,
    integratedInsights?: IntegratedInsight[]
  ): OverallRecommendation {
    // Calculate overall scores
    const strategicScore = strategicFit?.alignmentScore || 70;
    const timingScore = marketTiming?.timingScore || 70;
    const marketScore = marketSizing ? 80 : 70;
    const competitiveScore = competitiveAnalysis ? 75 : 70;
    
    const overallScore = (strategicScore + timingScore + marketScore + competitiveScore) / 4;
    const confidence = Math.min(90, overallScore);

    let decision: 'strong-go' | 'conditional-go' | 'pivot' | 'delay' | 'no-go';
    let keyReasons: string[];
    let conditions: string[];

    if (overallScore >= 80) {
      decision = 'strong-go';
      keyReasons = [
        'Excellent strategic alignment',
        'Favorable market conditions',
        'Strong competitive position',
        'Optimal timing for launch'
      ];
      conditions = [
        'Secure adequate funding',
        'Assemble experienced team',
        'Establish go-to-market strategy'
      ];
    } else if (overallScore >= 70) {
      decision = 'conditional-go';
      keyReasons = [
        'Good strategic fit',
        'Reasonable market opportunity',
        'Manageable competitive risks',
        'Acceptable timing window'
      ];
      conditions = [
        'Address identified capability gaps',
        'Validate market assumptions',
        'Develop risk mitigation strategies',
        'Secure stakeholder alignment'
      ];
    } else if (overallScore >= 60) {
      decision = 'pivot';
      keyReasons = [
        'Moderate strategic alignment',
        'Market opportunity exists but limited',
        'Competitive challenges present',
        'Timing requires optimization'
      ];
      conditions = [
        'Refine value proposition',
        'Identify niche market segments',
        'Strengthen competitive differentiation',
        'Improve internal capabilities'
      ];
    } else {
      decision = 'delay';
      keyReasons = [
        'Strategic alignment needs improvement',
        'Market conditions not optimal',
        'High competitive risks',
        'Internal readiness insufficient'
      ];
      conditions = [
        'Develop core capabilities',
        'Wait for better market conditions',
        'Strengthen competitive position',
        'Reassess strategic priorities'
      ];
    }

    const nextSteps = [
      {
        step: 'Stakeholder Review',
        owner: 'Product Manager',
        timeline: '1 week',
        dependencies: ['Analysis completion'],
        deliverables: ['Stakeholder presentation', 'Decision documentation'],
        successCriteria: ['Stakeholder alignment', 'Clear decision path']
      },
      {
        step: 'Resource Planning',
        owner: 'Engineering Manager',
        timeline: '2 weeks',
        dependencies: ['Stakeholder approval'],
        deliverables: ['Resource allocation plan', 'Timeline estimate'],
        successCriteria: ['Resource commitment', 'Realistic timeline']
      }
    ];

    const resourceRequirements = [
      {
        type: 'human' as const,
        description: 'Development team',
        quantity: 5,
        unit: 'FTE',
        timeframe: '6 months',
        criticality: 'critical' as const
      },
      {
        type: 'financial' as const,
        description: 'Development budget',
        quantity: 500000,
        unit: 'USD',
        timeframe: '12 months',
        criticality: 'critical' as const
      }
    ];

    return {
      decision,
      confidence,
      keyReasons,
      conditions,
      nextSteps,
      timeline: decision === 'strong-go' ? '3-6 months' : decision === 'conditional-go' ? '6-9 months' : '9-12 months',
      resourceRequirements,
      successProbability: confidence
    };
  }
}