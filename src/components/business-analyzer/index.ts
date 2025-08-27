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
  OptionalParams
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
}