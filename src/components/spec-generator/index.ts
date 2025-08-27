// Spec Generator component interface and implementation

import { 
  OptimizedWorkflow, 
  KiroSpec, 
  EnhancedKiroSpec,
  EfficiencySummary, 
  QuotaForecast,
  ConsultingSummary,
  ROIAnalysis,
  ThreeOptionAnalysis,
  SpecRequirement,
  SpecDesign,
  SpecTask,
  SpecMetadata,
  ComponentDescription,
  Evidence,
  OptimizationScenario
} from '../../models';

export interface ISpecGenerator {
  generateKiroSpec(optimizedWorkflow: OptimizedWorkflow, originalIntent: string): Promise<KiroSpec>;
  generateEnhancedKiroSpec(
    optimizedWorkflow: OptimizedWorkflow, 
    originalIntent: string,
    consultingSummary: ConsultingSummary,
    roiAnalysis: ROIAnalysis,
    alternativeOptions: ThreeOptionAnalysis
  ): Promise<EnhancedKiroSpec>;
  formatSpecWithConsultingInsights(spec: KiroSpec, summary: ConsultingSummary): EnhancedKiroSpec;
  generateEfficiencySummary(naive: QuotaForecast, optimized: QuotaForecast): EfficiencySummary;
  generateOptimizationNotes(optimizedWorkflow: OptimizedWorkflow): string[];
}

export class SpecGenerator implements ISpecGenerator {
  async generateKiroSpec(optimizedWorkflow: OptimizedWorkflow, originalIntent: string): Promise<KiroSpec> {
    const requirements = this.generateRequirements(optimizedWorkflow, originalIntent);
    const design = this.generateDesign(optimizedWorkflow);
    const tasks = this.generateTasks(optimizedWorkflow);
    const metadata = this.generateMetadata(optimizedWorkflow, originalIntent);

    return {
      name: this.generateSpecName(originalIntent),
      description: this.generateSpecDescription(originalIntent, optimizedWorkflow),
      requirements,
      design,
      tasks,
      metadata
    };
  }

  async generateEnhancedKiroSpec(
    optimizedWorkflow: OptimizedWorkflow, 
    originalIntent: string,
    consultingSummary: ConsultingSummary,
    roiAnalysis: ROIAnalysis,
    alternativeOptions: ThreeOptionAnalysis
  ): Promise<EnhancedKiroSpec> {
    const baseSpec = await this.generateKiroSpec(optimizedWorkflow, originalIntent);
    
    // Enhance metadata with consulting insights
    const enhancedMetadata: SpecMetadata = {
      ...baseSpec.metadata,
      optimizationApplied: [
        ...baseSpec.metadata.optimizationApplied,
        ...consultingSummary.techniquesApplied.map(t => t.techniqueName)
      ]
    };

    return {
      ...baseSpec,
      metadata: enhancedMetadata,
      consultingSummary,
      roiAnalysis,
      alternativeOptions
    };
  }

  formatSpecWithConsultingInsights(spec: KiroSpec, summary: ConsultingSummary): EnhancedKiroSpec {
    // Create ROI analysis based on consulting summary insights
    const roiAnalysis: ROIAnalysis = this.generateROIFromConsultingSummary(summary, spec);
    
    // Generate alternative options based on technique insights
    const alternativeOptions: ThreeOptionAnalysis = this.generateAlternativeOptionsFromInsights(summary);
    
    // Enhance the spec description with consulting insights
    const enhancedDescription = this.enhanceDescriptionWithInsights(spec.description, summary);
    
    // Add consulting technique metadata to spec metadata
    const enhancedMetadata: SpecMetadata = {
      ...spec.metadata,
      optimizationApplied: [
        ...spec.metadata.optimizationApplied,
        ...summary.techniquesApplied.map(t => t.techniqueName)
      ]
    };

    // Enhance requirements with consulting insights
    const enhancedRequirements = this.enhanceRequirementsWithInsights(spec.requirements, summary);
    
    // Enhance tasks with consulting recommendations
    const enhancedTasks = this.enhanceTasksWithInsights(spec.tasks, summary);

    return {
      ...spec,
      description: enhancedDescription,
      requirements: enhancedRequirements,
      tasks: enhancedTasks,
      metadata: enhancedMetadata,
      consultingSummary: summary,
      roiAnalysis,
      alternativeOptions
    };
  }

  generateEfficiencySummary(naive: QuotaForecast, optimized: QuotaForecast): EfficiencySummary {
    const vibeReduction = ((naive.vibesConsumed - optimized.vibesConsumed) / naive.vibesConsumed) * 100;
    const specReduction = ((naive.specsConsumed - optimized.specsConsumed) / naive.specsConsumed) * 100;
    const costSavings = naive.estimatedCost - optimized.estimatedCost;
    const totalSavingsPercentage = (costSavings / naive.estimatedCost) * 100;

    return {
      naiveApproach: naive,
      optimizedApproach: optimized,
      savings: {
        vibeReduction,
        specReduction,
        costSavings,
        totalSavingsPercentage
      }
    };
  }

  generateOptimizationNotes(optimizedWorkflow: OptimizedWorkflow): string[] {
    const notes: string[] = [];
    
    optimizedWorkflow.optimizations.forEach(opt => {
      switch (opt.type) {
        case 'batching':
          notes.push(`Batched ${opt.stepsAffected.length} operations to reduce API calls by ${opt.estimatedSavings.percentage}%`);
          break;
        case 'caching':
          notes.push(`Added caching layer to reduce redundant processing by ${opt.estimatedSavings.percentage}%`);
          break;
        case 'decomposition':
          notes.push(`Split workflow into ${opt.stepsAffected.length} smaller specs for better reusability`);
          break;
        case 'vibe_to_spec':
          notes.push(`Converted ${opt.estimatedSavings.vibes} vibes to ${opt.estimatedSavings.specs} specs for efficiency`);
          break;
      }
    });

    return notes;
  }

  private generateSpecName(originalIntent: string): string {
    // Extract key words from intent and create a spec name
    const stopWords = ['create', 'build', 'implement', 'make', 'develop', 'design', 'write', 'add', 'the', 'and', 'for', 'with', 'that', 'this'];
    const words = originalIntent.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 3);
    
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Optimizer';
  }

  private generateSpecDescription(originalIntent: string, optimizedWorkflow: OptimizedWorkflow): string {
    const savingsPercentage = optimizedWorkflow.efficiencyGains.totalSavingsPercentage;
    return `Optimized implementation of: "${originalIntent}". This spec reduces quota consumption by ${savingsPercentage.toFixed(1)}% through ${optimizedWorkflow.optimizations.length} optimization strategies.`;
  }

  private generateRequirements(optimizedWorkflow: OptimizedWorkflow, originalIntent: string): SpecRequirement[] {
    const requirements: SpecRequirement[] = [];
    
    // Generate functional requirements based on workflow steps
    optimizedWorkflow.steps.forEach((step, index) => {
      if (step.type !== 'processing') {
        requirements.push({
          id: `REQ-${index + 1}`,
          userStory: `As a user, I want the system to ${step.description.toLowerCase()}, so that I can achieve my intended outcome efficiently.`,
          acceptanceCriteria: [
            `WHEN the system processes ${step.type} operations THEN it SHALL complete within quota limits`,
            `WHEN ${step.description} is executed THEN it SHALL produce the expected outputs: ${step.outputs.join(', ')}`
          ],
          priority: step.quotaCost > 10 ? 'high' : step.quotaCost > 5 ? 'medium' : 'low'
        });
      }
    });

    // Add optimization requirements
    requirements.push({
      id: `REQ-OPT`,
      userStory: `As a user, I want the system to be optimized for quota efficiency, so that I can minimize costs while maintaining functionality.`,
      acceptanceCriteria: [
        `WHEN the optimized workflow runs THEN it SHALL consume ${optimizedWorkflow.efficiencyGains.totalSavingsPercentage.toFixed(1)}% fewer resources than the naive approach`,
        `WHEN optimizations are applied THEN all original functionality SHALL be preserved`
      ],
      priority: 'high'
    });

    return requirements;
  }

  private generateDesign(optimizedWorkflow: OptimizedWorkflow): SpecDesign {
    const components: ComponentDescription[] = [];
    
    // Group steps by type to create logical components
    const stepsByType = optimizedWorkflow.steps.reduce((acc, step) => {
      if (!acc[step.type]) acc[step.type] = [];
      acc[step.type].push(step);
      return acc;
    }, {} as Record<string, typeof optimizedWorkflow.steps>);

    Object.entries(stepsByType).forEach(([type, steps]) => {
      components.push({
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Handler`,
        purpose: `Manages ${type} operations with optimized quota usage`,
        interfaces: steps.map(s => `I${s.id}Handler`),
        dependencies: steps.flatMap(s => s.inputs).filter((v, i, a) => a.indexOf(v) === i)
      });
    });

    return {
      overview: `Optimized workflow implementation with ${optimizedWorkflow.optimizations.length} efficiency improvements`,
      architecture: `Pipeline architecture with ${components.length} main components, optimized for ${optimizedWorkflow.efficiencyGains.totalSavingsPercentage.toFixed(1)}% quota reduction`,
      components,
      dataModels: optimizedWorkflow.dataFlow.map(df => df.dataType).filter((v, i, a) => a.indexOf(v) === i)
    };
  }

  private generateTasks(optimizedWorkflow: OptimizedWorkflow): SpecTask[] {
    const tasks: SpecTask[] = [];
    
    // Create tasks for each optimization
    optimizedWorkflow.optimizations.forEach((opt, index) => {
      tasks.push({
        id: `TASK-${index + 1}`,
        description: `Implement ${opt.type} optimization: ${opt.description}`,
        requirements: [`REQ-OPT`],
        estimatedEffort: opt.estimatedSavings.percentage > 30 ? 'large' : opt.estimatedSavings.percentage > 15 ? 'medium' : 'small',
        subtasks: opt.stepsAffected.map(stepId => ({
          id: `TASK-${index + 1}-${stepId}`,
          description: `Apply ${opt.type} to step ${stepId}`,
          requirements: [`REQ-OPT`],
          estimatedEffort: 'small' as const
        }))
      });
    });

    // Create implementation tasks for each workflow step
    optimizedWorkflow.steps.forEach((step, index) => {
      tasks.push({
        id: `IMPL-${index + 1}`,
        description: `Implement ${step.description}`,
        requirements: [`REQ-${index + 1}`],
        estimatedEffort: step.quotaCost > 10 ? 'large' : step.quotaCost > 5 ? 'medium' : 'small'
      });
    });

    return tasks;
  }

  private generateMetadata(optimizedWorkflow: OptimizedWorkflow, originalIntent: string): SpecMetadata {
    return {
      originalIntent,
      optimizationApplied: optimizedWorkflow.optimizations.map(opt => opt.type),
      estimatedQuotaUsage: {
        vibesConsumed: optimizedWorkflow.steps.reduce((sum, step) => 
          sum + (step.type === 'vibe' ? step.quotaCost : 0), 0),
        specsConsumed: optimizedWorkflow.steps.reduce((sum, step) => 
          sum + (step.type === 'spec' ? step.quotaCost : 0), 0),
        estimatedCost: optimizedWorkflow.steps.reduce((sum, step) => sum + step.quotaCost, 0),
        confidenceLevel: 'medium' as const,
        scenario: 'optimized' as const,
        breakdown: optimizedWorkflow.steps.map(step => ({
          stepId: step.id,
          stepDescription: step.description,
          vibes: step.type === 'vibe' ? step.quotaCost : 0,
          specs: step.type === 'spec' ? step.quotaCost : 0,
          cost: step.quotaCost
        }))
      },
      generatedAt: new Date(),
      version: '1.0.0'
    };
  }

  private generateROIFromConsultingSummary(summary: ConsultingSummary, spec: KiroSpec): ROIAnalysis {
    // Extract quantitative evidence for ROI calculations
    const quantitativeEvidence = summary.supportingEvidence.filter(e => e.type === 'quantitative');
    
    // Create scenarios based on consulting recommendations
    const scenarios: OptimizationScenario[] = summary.recommendations.map((rec, index) => {
      const baseQuota = spec.metadata.estimatedQuotaUsage;
      const savingsPercentage = this.extractSavingsFromRecommendation(rec.expectedOutcome);
      
      return {
        name: `Scenario ${index + 1}`,
        forecast: {
          ...baseQuota,
          vibesConsumed: Math.round(baseQuota.vibesConsumed * (1 - savingsPercentage / 100)),
          specsConsumed: Math.round(baseQuota.specsConsumed * (1 - savingsPercentage / 100)),
          estimatedCost: Math.round(baseQuota.estimatedCost * (1 - savingsPercentage / 100)),
          scenario: 'optimized' as const
        },
        savingsPercentage,
        implementationEffort: this.assessImplementationEffort(rec.supportingReasons),
        riskLevel: this.assessRiskLevel(rec.evidence)
      };
    });

    return {
      scenarios,
      recommendations: summary.recommendations.map(r => r.mainRecommendation),
      bestOption: this.selectBestOption(scenarios),
      riskAssessment: this.generateRiskAssessment(summary.supportingEvidence)
    };
  }

  private generateAlternativeOptionsFromInsights(summary: ConsultingSummary): ThreeOptionAnalysis {
    // Find technique insights that suggest different approaches
    const meceInsight = summary.techniquesApplied.find(t => t.techniqueName === 'MECE');
    const valueDriverInsight = summary.techniquesApplied.find(t => t.techniqueName === 'ValueDriverTree');
    const zeroBasedInsight = summary.techniquesApplied.find(t => t.techniqueName === 'ZeroBased');

    return {
      conservative: {
        name: 'Conservative',
        description: meceInsight?.actionableRecommendation || 'Minimal changes with systematic categorization',
        quotaSavings: 15,
        implementationEffort: 'low',
        riskLevel: 'low',
        estimatedROI: 1.3
      },
      balanced: {
        name: 'Balanced',
        description: valueDriverInsight?.actionableRecommendation || 'Value-driven optimization with moderate changes',
        quotaSavings: 30,
        implementationEffort: 'medium',
        riskLevel: 'medium',
        estimatedROI: 2.2
      },
      bold: {
        name: 'Bold',
        description: zeroBasedInsight?.actionableRecommendation || 'Radical redesign from first principles',
        quotaSavings: 50,
        implementationEffort: 'high',
        riskLevel: 'high',
        estimatedROI: 3.8
      }
    };
  }

  private enhanceDescriptionWithInsights(originalDescription: string, summary: ConsultingSummary): string {
    const keyInsights = summary.techniquesApplied.map(t => t.keyInsight).join('; ');
    const mainRecommendation = summary.recommendations[0]?.mainRecommendation || 'optimization strategies';
    
    return `${originalDescription} Enhanced with consulting analysis: ${keyInsights}. Primary recommendation: ${mainRecommendation}.`;
  }

  private enhanceRequirementsWithInsights(requirements: SpecRequirement[], summary: ConsultingSummary): SpecRequirement[] {
    // Add consulting-driven requirements
    const consultingRequirements: SpecRequirement[] = summary.techniquesApplied.map((technique, index) => ({
      id: `REQ-CONSULTING-${index + 1}`,
      userStory: `As a stakeholder, I want the system to apply ${technique.techniqueName} methodology, so that ${technique.keyInsight.toLowerCase()}.`,
      acceptanceCriteria: [
        `WHEN ${technique.techniqueName} is applied THEN the system SHALL ${technique.actionableRecommendation.toLowerCase()}`,
        `WHEN consulting analysis is complete THEN it SHALL provide measurable insights as evidence`
      ],
      priority: 'medium' as const
    }));

    return [...requirements, ...consultingRequirements];
  }

  private enhanceTasksWithInsights(tasks: SpecTask[], summary: ConsultingSummary): SpecTask[] {
    // Add tasks based on consulting recommendations
    const consultingTasks: SpecTask[] = summary.recommendations.map((rec, index) => ({
      id: `TASK-CONSULTING-${index + 1}`,
      description: `Implement consulting recommendation: ${rec.mainRecommendation}`,
      requirements: [`REQ-CONSULTING-${index + 1}`],
      estimatedEffort: this.mapEffortFromReasons(rec.supportingReasons),
      subtasks: rec.supportingReasons.map((reason, subIndex) => ({
        id: `TASK-CONSULTING-${index + 1}-${subIndex + 1}`,
        description: `Address: ${reason}`,
        requirements: [`REQ-CONSULTING-${index + 1}`],
        estimatedEffort: 'small' as const
      }))
    }));

    return [...tasks, ...consultingTasks];
  }

  private extractSavingsFromRecommendation(expectedOutcome: string): number {
    // Extract percentage from strings like "25% reduction in vibe usage"
    const match = expectedOutcome.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 20; // default to 20% if no percentage found
  }

  private assessImplementationEffort(reasons: string[]): string {
    // Assess effort based on number and complexity of reasons
    if (reasons.length <= 2) return 'low';
    if (reasons.length <= 4) return 'medium';
    return 'high';
  }

  private assessRiskLevel(evidence: Evidence[]): string {
    // Assess risk based on evidence confidence
    const highConfidenceCount = evidence.filter(e => e.confidence === 'high').length;
    const totalEvidence = evidence.length;
    
    if (totalEvidence === 0) return 'medium';
    const confidenceRatio = highConfidenceCount / totalEvidence;
    
    if (confidenceRatio >= 0.7) return 'low';
    if (confidenceRatio >= 0.4) return 'medium';
    return 'high';
  }

  private selectBestOption(scenarios: OptimizationScenario[]): string {
    // Select scenario with best balance of savings and low risk
    const bestScenario = scenarios.reduce((best, current) => {
      const bestScore = best.savingsPercentage * (best.riskLevel === 'low' ? 1.5 : best.riskLevel === 'medium' ? 1.0 : 0.5);
      const currentScore = current.savingsPercentage * (current.riskLevel === 'low' ? 1.5 : current.riskLevel === 'medium' ? 1.0 : 0.5);
      return currentScore > bestScore ? current : best;
    });
    
    return bestScenario.name;
  }

  private generateRiskAssessment(evidence: Evidence[]): string {
    const riskFactors: string[] = [];
    
    const lowConfidenceEvidence = evidence.filter(e => e.confidence === 'low');
    if (lowConfidenceEvidence.length > 0) {
      riskFactors.push(`${lowConfidenceEvidence.length} low-confidence assumptions`);
    }
    
    const qualitativeEvidence = evidence.filter(e => e.type === 'qualitative');
    if (qualitativeEvidence.length > evidence.length * 0.6) {
      riskFactors.push('predominantly qualitative evidence');
    }
    
    if (riskFactors.length === 0) {
      return 'Low risk with strong quantitative evidence and high confidence';
    }
    
    return `Medium risk due to: ${riskFactors.join(', ')}`;
  }

  private mapEffortFromReasons(reasons: string[]): 'small' | 'medium' | 'large' {
    // Map effort based on complexity indicators in reasons
    const complexityIndicators = ['redesign', 'restructure', 'fundamental', 'complete', 'comprehensive'];
    const hasComplexity = reasons.some(reason => 
      complexityIndicators.some(indicator => reason.toLowerCase().includes(indicator))
    );
    
    if (hasComplexity) return 'large';
    if (reasons.length > 3) return 'medium';
    return 'small';
  }
}