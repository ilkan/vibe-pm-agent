// Workflow Optimizer component interface and implementation

import { 
  Workflow, 
  WorkflowStep,
  OptimizedWorkflow, 
  EfficiencyIssue, 
  Optimization, 
  BatchedOperation, 
  CachedWorkflow,
  CachePoint,
  OptionalParams
} from '../../models';
import { validateWorkflow, ValidationError } from '../../utils/validation';
import { ErrorHandler, OptimizationError } from '../../utils/error-handling';

export interface SpecDefinition {
  id: string;
  name: string;
  description: string;
  steps: string[]; // workflow step ids
  estimatedQuotaCost: number;
}

export interface IWorkflowOptimizer {
  identifyOptimizationOpportunities(workflow: Workflow, issues: EfficiencyIssue[], params?: OptionalParams): Promise<Optimization[]>;
  applyBatchingStrategy(workflow: Workflow, params?: OptionalParams): Promise<BatchedOperation[]>;
  implementCachingLayer(workflow: Workflow, params?: OptionalParams): Promise<CachedWorkflow>;
  breakIntoSpecs(workflow: Workflow, params?: OptionalParams): Promise<SpecDefinition[]>;
  optimizeWorkflow(workflow: Workflow, issues: EfficiencyIssue[], params?: OptionalParams): Promise<OptimizedWorkflow>;
  optimizeWorkflow(workflow: Workflow, analysis: any, params?: OptionalParams): Promise<OptimizedWorkflow>;
}

export class WorkflowOptimizer implements IWorkflowOptimizer {
  async identifyOptimizationOpportunities(workflow: Workflow, issues: EfficiencyIssue[], params?: OptionalParams): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];

    // Analyze workflow steps for optimization opportunities
    const stepAnalysis = this.analyzeWorkflowSteps(workflow);
    
    // Match issues with appropriate optimization strategies
    for (const issue of issues) {
      const optimization = this.matchIssueToOptimization(issue, stepAnalysis);
      if (optimization) {
        optimizations.push(optimization);
      }
    }

    // Identify additional opportunities from step patterns
    const patternOptimizations = this.identifyPatternOptimizations(workflow, stepAnalysis);
    optimizations.push(...patternOptimizations);

    // Remove duplicates and merge similar optimizations
    const consolidatedOptimizations = this.consolidateOptimizations(optimizations);

    // Adjust optimizations based on optional parameters
    if (params) {
      return this.adjustOptimizationsForParameters(consolidatedOptimizations, params);
    }

    return consolidatedOptimizations;
  }

  async applyBatchingStrategy(workflow: Workflow, params?: OptionalParams): Promise<BatchedOperation[]> {
    const batchedOperations: BatchedOperation[] = [];
    
    // Group similar operations that can be batched
    const batchableGroups = this.identifyBatchableOperations(workflow.steps);
    
    for (const group of batchableGroups) {
      if (group.length >= 2) { // Only batch if we have 2 or more similar operations
        const batchedOp = this.createBatchedOperation(group);
        batchedOperations.push(batchedOp);
      }
    }
    
    return batchedOperations;
  }

  async implementCachingLayer(workflow: Workflow, params?: OptionalParams): Promise<CachedWorkflow> {
    const cachePoints = this.identifyCachePoints(workflow);
    const estimatedHitRate = this.calculateOverallHitRate(cachePoints);
    
    return {
      ...workflow,
      cachePoints,
      estimatedHitRate
    };
  }

  async breakIntoSpecs(workflow: Workflow, params?: OptionalParams): Promise<SpecDefinition[]> {
    if (workflow.steps.length <= 3) {
      // Small workflows don't need decomposition
      return [];
    }
    
    const breakingPoints = this.identifyBreakingPoints(workflow);
    const specs = this.createSpecsFromBreakingPoints(workflow, breakingPoints);
    
    // If no natural breaking points were found but workflow is large enough, force decomposition
    if (specs.length === 0 && workflow.steps.length >= 4) {
      const midPoint = Math.floor(workflow.steps.length / 2);
      const forcedSpecs = this.createSpecsFromBreakingPoints(workflow, [midPoint]);
      return forcedSpecs;
    }
    
    return specs;
  }

  async optimizeWorkflow(workflow: Workflow, issuesOrAnalysis: EfficiencyIssue[] | any, params?: OptionalParams): Promise<OptimizedWorkflow> {
    // Validate workflow input
    try {
      validateWorkflow(workflow);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new OptimizationError(
          `Workflow optimization input validation failed: ${error.message}`,
          'Please ensure the workflow has valid steps and structure',
          error
        );
      }
      throw error;
    }

    // Handle both signatures: (workflow, issues) and (workflow, analysis)
    let issues: EfficiencyIssue[] = [];
    
    if (Array.isArray(issuesOrAnalysis)) {
      // Traditional signature with EfficiencyIssue[]
      issues = issuesOrAnalysis;
    } else {
      // New signature with ConsultingAnalysis - convert to issues
      const analysis = issuesOrAnalysis;
      issues = this.convertAnalysisToIssues(analysis, workflow);
    }

    // Identify optimization opportunities
    const optimizations = await this.identifyOptimizationOpportunities(workflow, issues, params);
    
    // Apply optimizations to create optimized workflow
    const optimizedWorkflow = await this.applyOptimizations(workflow, optimizations, params);
    
    return optimizedWorkflow;
  }

  private convertAnalysisToIssues(analysis: any, workflow: Workflow): EfficiencyIssue[] {
    const issues: EfficiencyIssue[] = [];
    
    // Convert MECE analysis findings to issues
    if (analysis.meceAnalysis) {
      for (const category of analysis.meceAnalysis.categories) {
        if (category.optimizationPotential > 30) {
          issues.push({
            type: category.name.includes('Vibe') ? 'unnecessary_vibes' : 'redundant_query',
            severity: category.optimizationPotential > 60 ? 'high' : 'medium',
            description: `High optimization potential in ${category.name}: ${category.optimizationPotential}%`,
            suggestedFix: `Optimize ${category.name} operations through ${category.name.includes('Vibe') ? 'spec conversion' : 'caching/batching'}`,
            stepsAffected: workflow.steps
              .filter(step => category.drivers.some((driver: string) => step.description.includes(driver.split(' ')[0])))
              .map(step => step.id)
          });
        }
      }
    }
    
    // Convert Value Driver analysis to issues
    if (analysis.valueDriverAnalysis) {
      for (const driver of analysis.valueDriverAnalysis.primaryDrivers) {
        if (driver.savingsPotential > 20) {
          issues.push({
            type: driver.name.includes('Vibe') ? 'unnecessary_vibes' : 'missing_cache',
            severity: driver.savingsPotential > 40 ? 'high' : 'medium',
            description: `Value driver ${driver.name} has ${driver.savingsPotential} savings potential`,
            suggestedFix: `Optimize ${driver.name} to reduce cost from ${driver.currentCost} to ${driver.optimizedCost}`,
            stepsAffected: workflow.steps
              .filter(step => step.description.toLowerCase().includes(driver.name.toLowerCase().split(' ')[0]))
              .map(step => step.id)
          });
        }
      }
    }
    
    // Convert Zero-Based solution to issues
    if (analysis.zeroBasedSolution && analysis.zeroBasedSolution.potentialSavings > 30) {
      issues.push({
        type: 'unnecessary_vibes',
        severity: 'high',
        description: `Zero-based analysis suggests ${analysis.zeroBasedSolution.potentialSavings}% savings through radical redesign`,
        suggestedFix: analysis.zeroBasedSolution.radicalApproach,
        stepsAffected: workflow.steps.map(step => step.id)
      });
    }
    
    // If no specific issues found, create general optimization issue
    if (issues.length === 0) {
      issues.push({
        type: 'redundant_query',
        severity: 'medium',
        description: 'General workflow optimization opportunities identified through consulting analysis',
        suggestedFix: 'Apply batching, caching, and spec conversion optimizations',
        stepsAffected: workflow.steps.map(step => step.id)
      });
    }
    
    return issues;
  }

  private async applyOptimizations(workflow: Workflow, optimizations: Optimization[], params?: OptionalParams): Promise<OptimizedWorkflow> {
    // Create a copy of the original workflow
    const optimizedSteps = [...workflow.steps];
    const appliedOptimizations: Optimization[] = [];
    
    // Apply each optimization
    for (const optimization of optimizations) {
      try {
        switch (optimization.type) {
          case 'batching':
            await this.applyBatchingOptimization(optimizedSteps, optimization);
            appliedOptimizations.push(optimization);
            break;
            
          case 'caching':
            await this.applyCachingOptimization(optimizedSteps, optimization);
            appliedOptimizations.push(optimization);
            break;
            
          case 'vibe_to_spec':
            await this.applyVibeToSpecOptimization(optimizedSteps, optimization);
            appliedOptimizations.push(optimization);
            break;
            
          case 'decomposition':
            // Decomposition is handled separately as it changes workflow structure
            appliedOptimizations.push(optimization);
            break;
        }
      } catch (error) {
        console.warn(`Failed to apply ${optimization.type} optimization:`, error);
      }
    }
    
    // Calculate efficiency gains
    const originalCost = workflow.steps.reduce((sum, step) => sum + step.quotaCost, 0);
    const optimizedCost = optimizedSteps.reduce((sum, step) => sum + step.quotaCost, 0);
    const totalSavingsPercentage = originalCost > 0 ? Math.round(((originalCost - optimizedCost) / originalCost) * 100) : 0;
    
    const efficiencyGains = {
      vibeReduction: this.calculateVibeReduction(workflow.steps, optimizedSteps),
      specReduction: this.calculateSpecReduction(workflow.steps, optimizedSteps),
      costSavings: originalCost - optimizedCost,
      totalSavingsPercentage
    };
    
    return {
      id: `${workflow.id}-optimized`,
      steps: optimizedSteps,
      dataFlow: workflow.dataFlow, // Keep original data flow for now
      estimatedComplexity: Math.max(1, workflow.estimatedComplexity - 1), // Reduce complexity slightly
      optimizations: appliedOptimizations,
      originalWorkflow: workflow,
      efficiencyGains
    };
  }

  private async applyBatchingOptimization(steps: WorkflowStep[], optimization: Optimization): Promise<void> {
    const affectedSteps = steps.filter(step => optimization.stepsAffected.includes(step.id));
    
    if (affectedSteps.length > 1) {
      // Reduce quota cost for batched operations
      const totalOriginalCost = affectedSteps.reduce((sum, step) => sum + step.quotaCost, 0);
      const batchedCost = Math.ceil(totalOriginalCost * 0.6); // 40% savings through batching
      
      // Update the first step to represent the batched operation
      const firstStep = affectedSteps[0];
      firstStep.quotaCost = batchedCost;
      firstStep.description = `Batched: ${firstStep.description}`;
      
      // Remove other steps from the batched group
      for (let i = 1; i < affectedSteps.length; i++) {
        const stepIndex = steps.findIndex(s => s.id === affectedSteps[i].id);
        if (stepIndex > -1) {
          steps.splice(stepIndex, 1);
        }
      }
    }
  }

  private async applyCachingOptimization(steps: WorkflowStep[], optimization: Optimization): Promise<void> {
    const affectedSteps = steps.filter(step => optimization.stepsAffected.includes(step.id));
    
    // Reduce quota cost for cached operations
    for (const step of affectedSteps) {
      step.quotaCost = Math.ceil(step.quotaCost * 0.4); // 60% savings through caching
      step.description = `Cached: ${step.description}`;
    }
  }

  private async applyVibeToSpecOptimization(steps: WorkflowStep[], optimization: Optimization): Promise<void> {
    const affectedSteps = steps.filter(step => optimization.stepsAffected.includes(step.id));
    
    // Convert vibe operations to spec operations
    for (const step of affectedSteps) {
      if (step.type === 'vibe') {
        step.type = 'spec';
        step.quotaCost = Math.ceil(step.quotaCost * 0.3); // 70% savings through spec conversion
        step.description = `Spec-based: ${step.description}`;
      }
    }
  }

  private calculateVibeReduction(originalSteps: WorkflowStep[], optimizedSteps: WorkflowStep[]): number {
    const originalVibes = originalSteps.filter(s => s.type === 'vibe').reduce((sum, s) => sum + s.quotaCost, 0);
    const optimizedVibes = optimizedSteps.filter(s => s.type === 'vibe').reduce((sum, s) => sum + s.quotaCost, 0);
    
    return originalVibes > 0 ? Math.round(((originalVibes - optimizedVibes) / originalVibes) * 100) : 0;
  }

  private calculateSpecReduction(originalSteps: WorkflowStep[], optimizedSteps: WorkflowStep[]): number {
    const originalSpecs = originalSteps.filter(s => s.type === 'spec').reduce((sum, s) => sum + s.quotaCost, 0);
    const optimizedSpecs = optimizedSteps.filter(s => s.type === 'spec').reduce((sum, s) => sum + s.quotaCost, 0);
    
    return originalSpecs > 0 ? Math.round(((originalSpecs - optimizedSpecs) / originalSpecs) * 100) : 0;
  }

  // Helper methods for optimization opportunity identification

  private analyzeWorkflowSteps(workflow: Workflow): StepAnalysis {
    const vibeSteps = workflow.steps.filter(step => step.type === 'vibe');
    const specSteps = workflow.steps.filter(step => step.type === 'spec');
    const dataRetrievalSteps = workflow.steps.filter(step => step.type === 'data_retrieval');
    
    // Identify similar operations that could be batched
    const similarOperations = this.findSimilarOperations(workflow.steps);
    
    // Identify repeated operations that could be cached
    const repeatedOperations = this.findRepeatedOperations(workflow.steps);
    
    // Calculate complexity metrics
    const totalQuotaCost = workflow.steps.reduce((sum, step) => sum + step.quotaCost, 0);
    const avgStepCost = totalQuotaCost / workflow.steps.length;
    
    return {
      vibeSteps,
      specSteps,
      dataRetrievalSteps,
      similarOperations,
      repeatedOperations,
      totalQuotaCost,
      avgStepCost,
      stepCount: workflow.steps.length
    };
  }

  private matchIssueToOptimization(issue: EfficiencyIssue, analysis: StepAnalysis): Optimization | null {
    switch (issue.type) {
      case 'redundant_query':
        return {
          type: 'caching',
          description: `Cache results for redundant queries: ${issue.description}`,
          stepsAffected: issue.stepsAffected,
          estimatedSavings: {
            vibes: this.calculateVibeSavings(issue.stepsAffected, analysis),
            specs: 0,
            percentage: this.calculateSavingsPercentage(issue.severity)
          }
        };

      case 'excessive_loops':
        return {
          type: 'batching',
          description: `Batch operations to reduce loop overhead: ${issue.description}`,
          stepsAffected: issue.stepsAffected,
          estimatedSavings: {
            vibes: this.calculateVibeSavings(issue.stepsAffected, analysis),
            specs: 0,
            percentage: this.calculateSavingsPercentage(issue.severity)
          }
        };

      case 'unnecessary_vibes':
        return {
          type: 'vibe_to_spec',
          description: `Convert repetitive vibes to structured specs: ${issue.description}`,
          stepsAffected: issue.stepsAffected,
          estimatedSavings: {
            vibes: this.calculateVibeSavings(issue.stepsAffected, analysis),
            specs: Math.ceil(issue.stepsAffected.length / 3), // Estimate spec conversion
            percentage: this.calculateSavingsPercentage(issue.severity)
          }
        };

      case 'missing_cache':
        return {
          type: 'caching',
          description: `Add caching layer for repeated operations: ${issue.description}`,
          stepsAffected: issue.stepsAffected,
          estimatedSavings: {
            vibes: this.calculateVibeSavings(issue.stepsAffected, analysis),
            specs: 0,
            percentage: this.calculateSavingsPercentage(issue.severity)
          }
        };

      default:
        return null;
    }
  }

  private identifyPatternOptimizations(workflow: Workflow, analysis: StepAnalysis): Optimization[] {
    const optimizations: Optimization[] = [];

    // Check for workflow decomposition opportunities
    if (analysis.stepCount > 10 && analysis.totalQuotaCost > 100) {
      optimizations.push({
        type: 'decomposition',
        description: 'Break complex workflow into smaller, reusable specs',
        stepsAffected: workflow.steps.map(step => step.id),
        estimatedSavings: {
          vibes: Math.floor(analysis.totalQuotaCost * 0.15), // 15% reduction through decomposition
          specs: Math.ceil(analysis.stepCount / 5), // Create multiple smaller specs
          percentage: 15
        }
      });
    }

    // Check for batching opportunities with similar operations
    if (analysis.similarOperations.length > 0) {
      for (const group of analysis.similarOperations) {
        if (group.length >= 3) {
          optimizations.push({
            type: 'batching',
            description: `Batch ${group.length} similar ${group[0].type} operations`,
            stepsAffected: group.map(step => step.id),
            estimatedSavings: {
              vibes: Math.floor(group.reduce((sum, step) => sum + step.quotaCost, 0) * 0.4), // 40% reduction
              specs: 0,
              percentage: 40
            }
          });
        }
      }
    }

    // Check for caching opportunities with repeated operations
    if (analysis.repeatedOperations.length > 0) {
      for (const group of analysis.repeatedOperations) {
        if (group.length >= 2) {
          optimizations.push({
            type: 'caching',
            description: `Cache results for ${group.length} repeated operations`,
            stepsAffected: group.map(step => step.id),
            estimatedSavings: {
              vibes: Math.floor(group.reduce((sum, step) => sum + step.quotaCost, 0) * 0.6), // 60% reduction
              specs: 0,
              percentage: 60
            }
          });
        }
      }
    }

    return optimizations;
  }

  private consolidateOptimizations(optimizations: Optimization[]): Optimization[] {
    const consolidated: Optimization[] = [];
    const processed = new Set<string>();

    for (const optimization of optimizations) {
      const key = `${optimization.type}-${optimization.stepsAffected.sort().join(',')}`;
      
      if (!processed.has(key)) {
        processed.add(key);
        
        // Find similar optimizations to merge
        const similar = optimizations.filter(opt => 
          opt.type === optimization.type && 
          opt.stepsAffected.some(step => optimization.stepsAffected.includes(step))
        );

        if (similar.length > 1) {
          // Merge similar optimizations
          const mergedSteps = [...new Set(similar.flatMap(opt => opt.stepsAffected))];
          const totalSavings = similar.reduce((sum, opt) => ({
            vibes: sum.vibes + opt.estimatedSavings.vibes,
            specs: sum.specs + opt.estimatedSavings.specs,
            percentage: Math.max(sum.percentage, opt.estimatedSavings.percentage)
          }), { vibes: 0, specs: 0, percentage: 0 });

          consolidated.push({
            type: optimization.type,
            description: `Consolidated ${optimization.type} optimization affecting ${mergedSteps.length} steps`,
            stepsAffected: mergedSteps,
            estimatedSavings: totalSavings
          });

          // Mark all similar optimizations as processed
          similar.forEach(opt => {
            const similarKey = `${opt.type}-${opt.stepsAffected.sort().join(',')}`;
            processed.add(similarKey);
          });
        } else {
          consolidated.push(optimization);
        }
      }
    }

    return consolidated;
  }

  private findSimilarOperations(steps: WorkflowStep[]): WorkflowStep[][] {
    const groups: Map<string, WorkflowStep[]> = new Map();
    
    for (const step of steps) {
      const key = `${step.type}-${step.description.substring(0, 20)}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(step);
    }
    
    return Array.from(groups.values()).filter(group => group.length > 1);
  }

  private findRepeatedOperations(steps: WorkflowStep[]): WorkflowStep[][] {
    const groups: Map<string, WorkflowStep[]> = new Map();
    
    for (const step of steps) {
      const key = `${step.type}-${step.description}-${step.inputs.join(',')}-${step.outputs.join(',')}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(step);
    }
    
    return Array.from(groups.values()).filter(group => group.length > 1);
  }

  private calculateVibeSavings(stepsAffected: string[], analysis: StepAnalysis): number {
    const affectedVibeSteps = analysis.vibeSteps.filter(step => stepsAffected.includes(step.id));
    return affectedVibeSteps.reduce((sum, step) => sum + step.quotaCost, 0);
  }

  private calculateSavingsPercentage(severity: 'low' | 'medium' | 'high'): number {
    switch (severity) {
      case 'low': return 10;
      case 'medium': return 25;
      case 'high': return 50;
      default: return 15;
    }
  }

  // Helper methods for batching optimization

  private identifyBatchableOperations(steps: WorkflowStep[]): WorkflowStep[][] {
    const groups: Map<string, WorkflowStep[]> = new Map();
    
    for (const step of steps) {
      // Group by operation type and similar patterns
      const batchKey = this.generateBatchKey(step);
      
      if (!groups.has(batchKey)) {
        groups.set(batchKey, []);
      }
      groups.get(batchKey)!.push(step);
    }
    
    // Filter groups to only include those with multiple operations
    return Array.from(groups.values()).filter(group => group.length >= 2);
  }

  private generateBatchKey(step: WorkflowStep): string {
    // Create a key that identifies similar operations that can be batched
    const typeKey = step.type;
    const operationPattern = this.extractOperationPattern(step.description);
    const inputPattern = this.extractInputPattern(step.inputs);
    
    return `${typeKey}-${operationPattern}-${inputPattern}`;
  }

  private extractOperationPattern(description: string): string {
    // Extract the operation pattern from description
    // Remove specific identifiers and keep the general pattern
    return description
      .toLowerCase()
      .replace(/\d+/g, 'N') // Replace numbers with N
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID') // Replace UUIDs
      .replace(/\b\w+@\w+\.\w+\b/g, 'EMAIL') // Replace emails
      .replace(/\b[a-z]+_\d+\b/gi, 'ITEM') // Replace item_123 patterns
      .trim();
  }

  private extractInputPattern(inputs: string[]): string {
    // Create a pattern from input types
    return inputs
      .map(input => {
        if (input.includes('id') || input.includes('Id')) return 'ID';
        if (input.includes('data') || input.includes('Data')) return 'DATA';
        if (input.includes('config') || input.includes('Config')) return 'CONFIG';
        return 'PARAM';
      })
      .sort()
      .join('-');
  }

  private createBatchedOperation(operations: WorkflowStep[]): BatchedOperation {
    const totalCost = operations.reduce((sum, op) => sum + op.quotaCost, 0);
    const batchSize = operations.length;
    
    // Calculate savings based on batch efficiency
    // Larger batches typically have better efficiency
    const efficiencyFactor = Math.min(0.7, 0.2 + (batchSize * 0.1)); // 20% base + 10% per item, max 70%
    const estimatedSavings = Math.floor(efficiencyFactor * 100);
    
    return {
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalOperations: operations.map(op => op.id),
      type: operations[0].type,
      description: `Batched ${operations[0].type} operations: ${this.extractOperationPattern(operations[0].description)}`,
      batchSize,
      estimatedSavings
    };
  }

  // Helper methods for caching optimization

  private identifyCachePoints(workflow: Workflow): CachePoint[] {
    const cachePoints: CachePoint[] = [];
    const stepFrequency = this.analyzeStepFrequency(workflow);
    
    for (const step of workflow.steps) {
      if (this.isCacheable(step)) {
        const cacheKey = this.generateCacheKey(step);
        const hitRate = this.estimateHitRate(step, stepFrequency);
        const ttl = this.calculateTTL(step);
        
        cachePoints.push({
          stepId: step.id,
          cacheKey,
          ttl,
          estimatedHitRate: hitRate
        });
      }
    }
    
    return cachePoints;
  }

  private isCacheable(step: WorkflowStep): boolean {
    // Determine if a step's results can be cached
    const cacheableTypes = ['vibe', 'data_retrieval', 'analysis'];
    
    if (!cacheableTypes.includes(step.type)) {
      return false;
    }
    
    // Check if the step has deterministic inputs (can produce consistent outputs)
    const deterministicPatterns = [
      /query|fetch|retrieve|get/i,
      /analyze|process|calculate/i,
      /validate|check|verify/i
    ];
    
    return deterministicPatterns.some(pattern => pattern.test(step.description));
  }

  private generateCacheKey(step: WorkflowStep): string {
    // Generate a cache key based on step characteristics
    const operationType = this.extractOperationPattern(step.description);
    const inputSignature = step.inputs.sort().join('|');
    
    return `${step.type}:${operationType}:${inputSignature}`;
  }

  private estimateHitRate(step: WorkflowStep, stepFrequency: Map<string, number>): number {
    const frequency = stepFrequency.get(step.id) || 1;
    const baseHitRate = 0.3; // 30% base hit rate
    
    // Higher frequency operations have higher hit rates
    const frequencyBonus = Math.min(0.5, (frequency - 1) * 0.1); // Up to 50% bonus
    
    // Data retrieval operations typically have higher hit rates
    const typeBonus = step.type === 'data_retrieval' ? 0.2 : 0;
    
    // Operations with simple inputs have higher hit rates
    const simplicityBonus = step.inputs.length <= 2 ? 0.1 : 0;
    
    return Math.min(0.9, baseHitRate + frequencyBonus + typeBonus + simplicityBonus);
  }

  private calculateTTL(step: WorkflowStep): number | undefined {
    // Calculate time-to-live based on operation type
    switch (step.type) {
      case 'data_retrieval':
        // Data retrieval can be cached longer
        return step.description.includes('config') ? 3600 : 1800; // 1 hour for config, 30 min for data
      
      case 'vibe':
        // Vibe operations have shorter cache times due to potential variability
        return 900; // 15 minutes
      
      case 'analysis':
        // Analysis results can be cached for moderate time
        return 1800; // 30 minutes
      
      default:
        return undefined; // No TTL for other types
    }
  }

  private analyzeStepFrequency(workflow: Workflow): Map<string, number> {
    const frequency = new Map<string, number>();
    
    // Count similar operations (same pattern)
    const patterns = new Map<string, string[]>();
    
    for (const step of workflow.steps) {
      const pattern = this.generateCacheKey(step);
      
      if (!patterns.has(pattern)) {
        patterns.set(pattern, []);
      }
      patterns.get(pattern)!.push(step.id);
    }
    
    // Set frequency based on pattern occurrence
    for (const [pattern, stepIds] of patterns) {
      const count = stepIds.length;
      for (const stepId of stepIds) {
        frequency.set(stepId, count);
      }
    }
    
    return frequency;
  }

  private calculateOverallHitRate(cachePoints: CachePoint[]): number {
    if (cachePoints.length === 0) {
      return 0;
    }
    
    const totalHitRate = cachePoints.reduce((sum, point) => sum + point.estimatedHitRate, 0);
    return totalHitRate / cachePoints.length;
  }

  // Helper methods for spec decomposition

  private identifyBreakingPoints(workflow: Workflow): number[] {
    const breakingPoints: number[] = [];
    const steps = workflow.steps;
    
    // Identify natural breaking points based on data flow and step characteristics
    for (let i = 1; i < steps.length; i++) {
      const currentStep = steps[i];
      const previousStep = steps[i - 1];
      
      if (this.isNaturalBreakingPoint(previousStep, currentStep, workflow)) {
        breakingPoints.push(i);
      }
    }
    
    // Ensure we don't create specs that are too small or too large
    const filteredBreakingPoints = this.filterBreakingPoints(breakingPoints, steps.length);
    
    return filteredBreakingPoints;
  }

  private isNaturalBreakingPoint(previousStep: WorkflowStep, currentStep: WorkflowStep, workflow: Workflow): boolean {
    // Check for type transitions that suggest natural boundaries
    if (previousStep.type !== currentStep.type) {
      return true;
    }
    
    // Check for cost boundaries (expensive operations should be isolated)
    if (previousStep.quotaCost >= 15 || currentStep.quotaCost >= 15) {
      return true;
    }
    
    // Check for functional boundaries based on description patterns
    if (this.hasFunctionalBoundary(previousStep, currentStep)) {
      return true;
    }
    
    // Check for data flow boundaries - less restrictive
    const hasStrongDataDependency = workflow.dataFlow.some(dep => 
      dep.from === previousStep.id && dep.to === currentStep.id && dep.required
    );
    
    // If there's no strong dependency and minimal overlap, it's a potential breaking point
    if (!hasStrongDataDependency && this.hasMinimalDataOverlap(previousStep, currentStep)) {
      return true;
    }
    
    return false;
  }

  private hasMinimalDataOverlap(step1: WorkflowStep, step2: WorkflowStep): boolean {
    const outputs1 = new Set(step1.outputs);
    const inputs2 = new Set(step2.inputs);
    
    // Check if there's minimal overlap between outputs of step1 and inputs of step2
    const overlap = [...outputs1].filter(output => inputs2.has(output));
    return overlap.length <= 1;
  }

  private hasFunctionalBoundary(step1: WorkflowStep, step2: WorkflowStep): boolean {
    const functionalKeywords = [
      ['validate', 'check', 'verify'],
      ['process', 'transform', 'convert'],
      ['analyze', 'calculate', 'compute'],
      ['fetch', 'retrieve', 'query'],
      ['store', 'save', 'persist'],
      ['format', 'render', 'display']
    ];
    
    const getCategory = (description: string) => {
      const lowerDesc = description.toLowerCase();
      return functionalKeywords.findIndex(keywords => 
        keywords.some(keyword => lowerDesc.includes(keyword))
      );
    };
    
    const category1 = getCategory(step1.description);
    const category2 = getCategory(step2.description);
    
    return category1 !== -1 && category2 !== -1 && category1 !== category2;
  }

  private filterBreakingPoints(breakingPoints: number[], totalSteps: number): number[] {
    const minSpecSize = 2;
    const maxSpecSize = 8;
    
    // If no natural breaking points found, create artificial ones for large workflows
    if (breakingPoints.length === 0 && totalSteps > maxSpecSize) {
      const artificialPoints: number[] = [];
      for (let i = maxSpecSize; i < totalSteps; i += maxSpecSize) {
        artificialPoints.push(Math.min(i, totalSteps - minSpecSize));
      }
      return artificialPoints.filter(point => point > 0 && point < totalSteps);
    }
    
    const filtered: number[] = [];
    let lastBreakingPoint = 0;
    
    for (const point of breakingPoints) {
      const segmentSize = point - lastBreakingPoint;
      
      // Only add breaking point if it creates reasonable segment sizes
      if (segmentSize >= minSpecSize) {
        filtered.push(point);
        lastBreakingPoint = point;
      }
    }
    
    // Ensure the last segment isn't too small
    const lastSegmentSize = totalSteps - lastBreakingPoint;
    if (lastSegmentSize < minSpecSize && filtered.length > 0) {
      // Remove the last breaking point to merge small final segment
      filtered.pop();
    }
    
    return filtered;
  }

  private createSpecsFromBreakingPoints(workflow: Workflow, breakingPoints: number[]): SpecDefinition[] {
    const specs: SpecDefinition[] = [];
    const allBreakingPoints = [0, ...breakingPoints, workflow.steps.length];
    
    for (let i = 0; i < allBreakingPoints.length - 1; i++) {
      const startIndex = allBreakingPoints[i];
      const endIndex = allBreakingPoints[i + 1];
      const segmentSteps = workflow.steps.slice(startIndex, endIndex);
      
      if (segmentSteps.length > 0) {
        const spec = this.createSpecDefinition(segmentSteps, i + 1, workflow.id);
        specs.push(spec);
      }
    }
    
    return specs;
  }

  private createSpecDefinition(steps: WorkflowStep[], specIndex: number, workflowId: string): SpecDefinition {
    const totalQuotaCost = steps.reduce((sum, step) => sum + step.quotaCost, 0);
    const primaryFunction = this.identifyPrimaryFunction(steps);
    
    return {
      id: `${workflowId}-spec-${specIndex}`,
      name: `${primaryFunction} Spec ${specIndex}`,
      description: `Handles ${primaryFunction.toLowerCase()} operations: ${steps.map(s => s.description).join(', ')}`,
      steps: steps.map(step => step.id),
      estimatedQuotaCost: totalQuotaCost
    };
  }

  private identifyPrimaryFunction(steps: WorkflowStep[]): string {
    const functionCounts = new Map<string, number>();
    
    const functions = [
      { keywords: ['validate', 'check', 'verify'], name: 'Validation' },
      { keywords: ['process', 'transform', 'convert'], name: 'Processing' },
      { keywords: ['analyze', 'calculate', 'compute'], name: 'Analysis' },
      { keywords: ['fetch', 'retrieve', 'query', 'get'], name: 'Data Retrieval' },
      { keywords: ['store', 'save', 'persist', 'write'], name: 'Data Storage' },
      { keywords: ['format', 'render', 'display', 'output'], name: 'Formatting' }
    ];
    
    for (const step of steps) {
      const lowerDesc = step.description.toLowerCase();
      
      for (const func of functions) {
        if (func.keywords.some(keyword => lowerDesc.includes(keyword))) {
          functionCounts.set(func.name, (functionCounts.get(func.name) || 0) + 1);
        }
      }
    }
    
    if (functionCounts.size === 0) {
      return 'General';
    }
    
    // Return the most common function
    return [...functionCounts.entries()]
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  private adjustOptimizationsForParameters(optimizations: Optimization[], params: OptionalParams): Optimization[] {
    return optimizations.map(optimization => {
      let adjustedOptimization = { ...optimization };

      // Adjust based on cost constraints
      if (params.costConstraints) {
        const { maxVibes, maxSpecs, maxCostDollars } = params.costConstraints;
        const hasTightConstraints = (maxVibes !== undefined && maxVibes < 20) || 
                                    (maxSpecs !== undefined && maxSpecs < 5) ||
                                    (maxCostDollars !== undefined && maxCostDollars < 10);

        if (hasTightConstraints) {
          // Increase savings potential for tight cost constraints
          adjustedOptimization.estimatedSavings = {
            ...adjustedOptimization.estimatedSavings,
            percentage: Math.min(85, adjustedOptimization.estimatedSavings.percentage * 1.2),
            vibes: Math.ceil(adjustedOptimization.estimatedSavings.vibes * 1.2),
            specs: Math.max(0, adjustedOptimization.estimatedSavings.specs - 1) // Reduce spec usage
          };
        }
      }

      // Adjust based on expected user volume
      if (params.expectedUserVolume !== undefined) {
        if (params.expectedUserVolume > 1000) {
          // High volume scenarios benefit more from caching and batching
          if (optimization.type === 'caching' || optimization.type === 'batching') {
            adjustedOptimization.estimatedSavings = {
              ...adjustedOptimization.estimatedSavings,
              percentage: Math.min(85, adjustedOptimization.estimatedSavings.percentage * 1.3),
              vibes: Math.ceil(adjustedOptimization.estimatedSavings.vibes * 1.3)
            };
          }
        }
      }

      // Adjust based on performance sensitivity
      if (params.performanceSensitivity === 'high') {
        // High performance sensitivity may reduce some savings but improve efficiency
        if (optimization.type === 'vibe_to_spec') {
          adjustedOptimization.estimatedSavings = {
            ...adjustedOptimization.estimatedSavings,
            percentage: Math.min(85, adjustedOptimization.estimatedSavings.percentage * 1.1)
          };
        }
      }

      return adjustedOptimization;
    });
  }
}

interface StepAnalysis {
  vibeSteps: WorkflowStep[];
  specSteps: WorkflowStep[];
  dataRetrievalSteps: WorkflowStep[];
  similarOperations: WorkflowStep[][];
  repeatedOperations: WorkflowStep[][];
  totalQuotaCost: number;
  avgStepCost: number;
  stepCount: number;
}