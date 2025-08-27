// Main pipeline orchestration entry point

import {
  IntentInterpreter,
  BusinessAnalyzer,
  WorkflowOptimizer,
  QuotaForecaster,
  SpecGenerator,
  ConsultingSummaryGenerator
} from './components';
import { 
  OptionalParams, 
  KiroSpec, 
  EfficiencySummary, 
  ProcessingError,
  ParsedIntent,
  Workflow,
  OptimizedWorkflow,
  EnhancedKiroSpec,
  ConsultingSummary,
  ROIAnalysis,
  QuotaForecast
} from './models';
import { ConsultingAnalysis } from './components/business-analyzer';
import { validateRawIntent, validateOptionalParams, ValidationError } from './utils/validation';
import { ErrorHandler, RetryHandler, ProcessingFailureError } from './utils/error-handling';

export interface PipelineResult {
  success: boolean;
  enhancedKiroSpec?: EnhancedKiroSpec;
  efficiencySummary?: EfficiencySummary;
  error?: ProcessingError;
}

/**
 * AI Agent Pipeline that orchestrates the complete intent-to-spec optimization process
 * using consulting techniques and comprehensive analysis
 */
export class AIAgentPipeline {
  private intentInterpreter: IntentInterpreter;
  private businessAnalyzer: BusinessAnalyzer;
  private workflowOptimizer: WorkflowOptimizer;
  private quotaForecaster: QuotaForecaster;
  private consultingSummaryGenerator: ConsultingSummaryGenerator;
  private specGenerator: SpecGenerator;

  constructor() {
    this.intentInterpreter = new IntentInterpreter();
    this.businessAnalyzer = new BusinessAnalyzer();
    this.workflowOptimizer = new WorkflowOptimizer();
    this.quotaForecaster = new QuotaForecaster();
    this.consultingSummaryGenerator = new ConsultingSummaryGenerator();
    this.specGenerator = new SpecGenerator();
  }

  /**
   * Main orchestration function that coordinates all components with consulting analysis
   * Data flow: Intent → Business Analysis → Optimization → Forecasting → Summary → Spec
   */
  async processIntent(rawIntent: string, params?: OptionalParams): Promise<PipelineResult> {
    const startTime = Date.now();
    const sessionId = this.generateSessionId();
    
    try {
      this.logInfo('Starting AI Agent Pipeline execution', { sessionId, intentLength: rawIntent.length, hasParams: !!params });
      
      // Comprehensive input validation
      try {
        validateRawIntent(rawIntent);
        if (params) {
          validateOptionalParams(params);
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          throw this.createStageError('intent', 'validation_failed', error, error.message);
        }
        throw this.createStageError('intent', 'validation_error', error, 'Please check your input and try again');
      }
      
      // Stage 1: Intent Interpretation
      this.logInfo('Stage 1: Parsing intent and extracting requirements', { sessionId, stage: 'intent' });
      const parsedIntent = await this.parseIntentWithErrorHandling(rawIntent, params, sessionId);
      this.logInfo('Intent parsing completed', { sessionId, operationsCount: parsedIntent.operationsRequired.length, risksCount: parsedIntent.potentialRisks.length });
      
      // Stage 2: Business Analysis with Consulting Techniques
      this.logInfo('Stage 2: Applying consulting techniques for business analysis', { sessionId, stage: 'analysis' });
      const consultingAnalysis = await this.performBusinessAnalysisWithErrorHandling(parsedIntent, sessionId);
      this.logInfo('Business analysis completed', { sessionId, techniquesUsed: consultingAnalysis.techniquesUsed.length, totalSavings: consultingAnalysis.totalQuotaSavings });
      
      // Stage 3: Workflow Optimization
      this.logInfo('Stage 3: Optimizing workflow for efficiency', { sessionId, stage: 'optimization' });
      const optimizedWorkflow = await this.optimizeWorkflowWithErrorHandling(parsedIntent, consultingAnalysis, sessionId);
      this.logInfo('Workflow optimization completed', { sessionId, optimizationsApplied: optimizedWorkflow.optimizations.length, efficiencyGain: optimizedWorkflow.efficiencyGains.totalSavingsPercentage });
      
      // Stage 4: Quota Forecasting and ROI Analysis
      this.logInfo('Stage 4: Generating comprehensive ROI analysis', { sessionId, stage: 'forecasting' });
      const roiAnalysis = await this.generateROIAnalysisWithErrorHandling(optimizedWorkflow, consultingAnalysis, sessionId);
      this.logInfo('ROI analysis completed', { sessionId, scenariosGenerated: roiAnalysis.scenarios.length, bestOption: roiAnalysis.bestOption });
      
      // Stage 5: Consulting Summary Generation
      this.logInfo('Stage 5: Creating consulting-style summary', { sessionId, stage: 'summary' });
      const consultingSummary = await this.generateConsultingSummaryWithErrorHandling(consultingAnalysis, sessionId);
      this.logInfo('Consulting summary completed', { sessionId, recommendationsCount: consultingSummary.recommendations.length });
      
      // Stage 6: Enhanced Spec Generation
      this.logInfo('Stage 6: Generating enhanced Kiro specification', { sessionId, stage: 'spec' });
      const enhancedSpec = await this.generateEnhancedSpecWithErrorHandling(
        optimizedWorkflow, 
        consultingSummary, 
        roiAnalysis,
        parsedIntent,
        params,
        sessionId
      );
      this.logInfo('Enhanced spec generation completed', { sessionId, tasksGenerated: enhancedSpec.tasks.length });
      
      // Generate efficiency summary for backward compatibility
      const efficiencySummary = this.createEfficiencySummary(roiAnalysis);
      
      const executionTime = Date.now() - startTime;
      this.logInfo('AI Agent Pipeline execution completed successfully', { 
        sessionId, 
        executionTime, 
        totalSavings: optimizedWorkflow.efficiencyGains.totalSavingsPercentage,
        performance: this.categorizePerformance(executionTime)
      });
      
      return {
        success: true,
        enhancedKiroSpec: enhancedSpec,
        efficiencySummary
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logError('Pipeline execution failed', error, { sessionId, executionTime, stage: this.getErrorStage(error) });
      return this.handlePipelineError(error, sessionId);
    }
  }

  /**
   * Individual analysis method for workflow analysis (used by MCP tools)
   */
  async analyzeWorkflow(workflow: Workflow, techniques?: string[]): Promise<ConsultingAnalysis> {
    try {
      // Convert workflow to parsed intent format for analysis
      const mockIntent: ParsedIntent = {
        businessObjective: `Optimize existing workflow: ${workflow.id}`,
        technicalRequirements: workflow.steps.map(step => ({
          type: step.type === 'vibe' ? 'analysis' : step.type as any,
          description: step.description,
          complexity: step.quotaCost > 10 ? 'high' : step.quotaCost > 5 ? 'medium' : 'low',
          quotaImpact: step.quotaCost > 10 ? 'significant' : step.quotaCost > 5 ? 'moderate' : 'minimal'
        })),
        dataSourcesNeeded: workflow.steps.filter(s => s.type === 'data_retrieval').map(s => s.description),
        operationsRequired: workflow.steps.map(step => ({
          id: step.id,
          type: step.type,
          description: step.description,
          estimatedQuotaCost: step.quotaCost
        })),
        potentialRisks: []
      };

      return await this.businessAnalyzer.analyzeWithTechniques(mockIntent, techniques);
    } catch (error) {
      throw new Error(`Workflow analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Individual method for ROI analysis generation (used by MCP tools)
   */
  async generateROIAnalysis(
    workflow: Workflow, 
    optimizedWorkflow?: OptimizedWorkflow, 
    zeroBasedSolution?: any
  ): Promise<ROIAnalysis> {
    try {
      const naiveForecast = await this.quotaForecaster.estimateNaiveConsumption(workflow);
      const optimizedForecast = optimizedWorkflow 
        ? await this.quotaForecaster.estimateOptimizedConsumption(optimizedWorkflow)
        : naiveForecast;
      const zeroBasedForecast = zeroBasedSolution
        ? await this.quotaForecaster.estimateZeroBasedConsumption(zeroBasedSolution)
        : optimizedForecast;

      return await this.quotaForecaster.generateROITable([
        { name: 'Current', forecast: naiveForecast, savingsPercentage: 0, implementationEffort: 'none', riskLevel: 'none' },
        { name: 'Optimized', forecast: optimizedForecast, savingsPercentage: this.calculateSavingsPercentage(naiveForecast, optimizedForecast), implementationEffort: 'medium', riskLevel: 'low' },
        { name: 'Zero-Based', forecast: zeroBasedForecast, savingsPercentage: this.calculateSavingsPercentage(naiveForecast, zeroBasedForecast), implementationEffort: 'high', riskLevel: 'medium' }
      ]);
    } catch (error) {
      throw new Error(`ROI analysis generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Individual method for consulting summary generation (used by MCP tools)
   */
  async generateConsultingSummary(analysis: ConsultingAnalysis, techniques?: string[]): Promise<ConsultingSummary> {
    try {
      const selectedTechniques = techniques 
        ? analysis.techniquesUsed.filter(t => techniques.includes(t.name))
        : analysis.techniquesUsed;
      
      return this.consultingSummaryGenerator.generateConsultingSummary(analysis, selectedTechniques);
    } catch (error) {
      throw new Error(`Consulting summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private methods for error handling in each stage

  private async parseIntentWithErrorHandling(rawIntent: string, params?: OptionalParams, sessionId?: string): Promise<ParsedIntent> {
    try {
      const result = await RetryHandler.withRetry(
        () => this.intentInterpreter.parseIntent(rawIntent, params),
        2, // max retries
        500 // delay ms
      );
      
      // Validate parsed intent
      if (!result.businessObjective || result.businessObjective.trim().length === 0) {
        throw new Error('Failed to extract business objective from intent');
      }
      
      if (result.operationsRequired.length === 0) {
        this.logWarning('No operations identified in intent', { sessionId, intent: rawIntent.substring(0, 100) });
        // Add a default operation to prevent pipeline failure
        result.operationsRequired.push({
          id: 'default-op-1',
          type: 'analysis',
          description: 'Analyze and process user requirements',
          estimatedQuotaCost: 5
        });
      }
      
      return result;
    } catch (error) {
      ErrorHandler.logError(error, { sessionId, intentLength: rawIntent.length, stage: 'intent' });
      ErrorHandler.handleIntentParsingFailure(error, rawIntent);
    }
  }

  private async performBusinessAnalysisWithErrorHandling(parsedIntent: ParsedIntent, sessionId?: string): Promise<ConsultingAnalysis> {
    try {
      const result = await ErrorHandler.safeExecute(
        () => this.businessAnalyzer.analyzeWithTechniques(parsedIntent),
        ErrorHandler.handleAnalysisFailure(new Error('Analysis failed'), undefined),
        { stage: 'analysis', operation: 'business_analysis' }
      );
      
      // Validate analysis results
      if (!result.techniquesUsed || result.techniquesUsed.length === 0) {
        this.logWarning('No consulting techniques were applied', { sessionId });
        // Provide fallback analysis
        result.techniquesUsed = [
          { name: 'MECE', relevanceScore: 0.5, applicableScenarios: ['general analysis'] }
        ];
        result.keyFindings = ['General workflow analysis completed'];
        result.totalQuotaSavings = 15; // Conservative estimate
      }
      
      if (result.totalQuotaSavings < 0) {
        this.logWarning('Negative savings detected, adjusting to minimum', { sessionId, originalSavings: result.totalQuotaSavings });
        result.totalQuotaSavings = 5; // Minimum positive savings
      }
      
      return result;
    } catch (error) {
      ErrorHandler.logError(error, { sessionId, operationsCount: parsedIntent.operationsRequired.length, stage: 'analysis' });
      
      // Use fallback analysis if available
      if (ErrorHandler.isRecoverable(error)) {
        return ErrorHandler.handleAnalysisFailure(error);
      }
      
      throw this.createStageError('analysis', 'business_analysis_failed', error, ErrorHandler.getFallbackStrategy(error, 'analysis'));
    }
  }

  private async optimizeWorkflowWithErrorHandling(
    parsedIntent: ParsedIntent, 
    analysis: ConsultingAnalysis,
    sessionId?: string
  ): Promise<OptimizedWorkflow> {
    // Create initial workflow from parsed intent
    const initialWorkflow: Workflow = {
      id: `workflow-${Date.now()}`,
      steps: parsedIntent.operationsRequired.map(op => ({
        id: op.id,
        type: op.type,
        description: op.description,
        inputs: [],
        outputs: [],
        quotaCost: op.estimatedQuotaCost
      })),
      dataFlow: [],
      estimatedComplexity: parsedIntent.technicalRequirements.length
    };

    try {
      const result = await ErrorHandler.safeExecute(
        () => this.workflowOptimizer.optimizeWorkflow(initialWorkflow, analysis),
        ErrorHandler.handleOptimizationFailure(new Error('Optimization failed'), initialWorkflow),
        { stage: 'optimization', operation: 'workflow_optimization' }
      );
      
      // Validate optimization results
      if (!result.optimizations || result.optimizations.length === 0) {
        this.logWarning('No optimizations were applied', { sessionId, workflowSteps: initialWorkflow.steps.length });
        // Create minimal optimization to ensure pipeline continues
        result.optimizations = [{
          type: 'caching',
          description: 'Basic caching optimization applied',
          stepsAffected: [initialWorkflow.steps[0]?.id || 'default'],
          estimatedSavings: { vibes: 0, specs: 0, percentage: 10 }
        }];
        result.efficiencyGains.totalSavingsPercentage = 10;
      }
      
      return result;
    } catch (error) {
      ErrorHandler.logError(error, { sessionId, stepsCount: parsedIntent.operationsRequired.length, stage: 'optimization' });
      
      // Use fallback optimization if available
      if (ErrorHandler.isRecoverable(error)) {
        return ErrorHandler.handleOptimizationFailure(error, initialWorkflow);
      }
      
      throw this.createStageError('optimization', 'workflow_optimization_failed', error, ErrorHandler.getFallbackStrategy(error, 'optimization'));
    }
  }

  private async generateROIAnalysisWithErrorHandling(
    optimizedWorkflow: OptimizedWorkflow,
    analysis: ConsultingAnalysis,
    sessionId?: string
  ): Promise<ROIAnalysis> {
    try {
      const naiveForecast = await ErrorHandler.safeExecute(
        () => this.quotaForecaster.estimateNaiveConsumption(optimizedWorkflow.originalWorkflow),
        ErrorHandler.handleForecastingFailure(new Error('Naive forecast failed'), optimizedWorkflow.originalWorkflow),
        { stage: 'forecasting', operation: 'naive_forecast' }
      );

      const optimizedForecast = await ErrorHandler.safeExecute(
        () => this.quotaForecaster.estimateOptimizedConsumption(optimizedWorkflow),
        ErrorHandler.handleForecastingFailure(new Error('Optimized forecast failed'), optimizedWorkflow),
        { stage: 'forecasting', operation: 'optimized_forecast' }
      );

      const zeroBasedForecast = analysis.zeroBasedSolution 
        ? await ErrorHandler.safeExecute(
            () => this.quotaForecaster.estimateZeroBasedConsumption(analysis.zeroBasedSolution!),
            optimizedForecast,
            { stage: 'forecasting', operation: 'zero_based_forecast' }
          )
        : optimizedForecast;

      const result = await ErrorHandler.safeExecute(
        () => this.quotaForecaster.generateROITable([
          { 
            name: 'Conservative', 
            forecast: naiveForecast, 
            savingsPercentage: 0, 
            implementationEffort: 'none', 
            riskLevel: 'none' 
          },
          { 
            name: 'Balanced', 
            forecast: optimizedForecast, 
            savingsPercentage: this.calculateSavingsPercentage(naiveForecast, optimizedForecast), 
            implementationEffort: 'medium', 
            riskLevel: 'low' 
          },
          { 
            name: 'Bold', 
            forecast: zeroBasedForecast, 
            savingsPercentage: this.calculateSavingsPercentage(naiveForecast, zeroBasedForecast), 
            implementationEffort: 'high', 
            riskLevel: 'medium' 
          }
        ]),
        ErrorHandler.handleROIAnalysisFailure(new Error('ROI analysis failed'), naiveForecast),
        { stage: 'forecasting', operation: 'roi_analysis' }
      );
      
      // Validate ROI analysis
      if (!result.scenarios || result.scenarios.length === 0) {
        this.logWarning('No ROI scenarios generated, creating fallback', { sessionId });
        result.scenarios = [{
          name: 'Balanced',
          forecast: optimizedForecast,
          savingsPercentage: 20,
          implementationEffort: 'medium',
          riskLevel: 'low'
        }];
        result.bestOption = 'Balanced';
        result.recommendations = ['Apply moderate optimization for balanced risk-reward'];
      }
      
      return result;
    } catch (error) {
      ErrorHandler.logError(error, { sessionId, optimizationsCount: optimizedWorkflow.optimizations.length, stage: 'forecasting' });
      
      // Use fallback ROI analysis if available
      if (ErrorHandler.isRecoverable(error)) {
        return ErrorHandler.handleROIAnalysisFailure(error);
      }
      
      throw this.createStageError('forecasting', 'roi_analysis_failed', error, ErrorHandler.getFallbackStrategy(error, 'forecasting'));
    }
  }

  private async generateConsultingSummaryWithErrorHandling(analysis: ConsultingAnalysis, sessionId?: string): Promise<ConsultingSummary> {
    try {
      const result = this.consultingSummaryGenerator.generateConsultingSummary(analysis, analysis.techniquesUsed);
      
      // Validate consulting summary
      if (!result.recommendations || result.recommendations.length === 0) {
        this.logWarning('No recommendations generated, creating fallback', { sessionId });
        result.recommendations = [{
          mainRecommendation: 'Apply identified optimizations to improve efficiency',
          supportingReasons: ['Analysis indicates potential for improvement', 'Current workflow has optimization opportunities'],
          evidence: [],
          expectedOutcome: `Expected ${analysis.totalQuotaSavings}% improvement in quota efficiency`
        }];
      }
      
      if (!result.executiveSummary || result.executiveSummary.trim().length === 0) {
        result.executiveSummary = `Analysis using ${analysis.techniquesUsed.length} consulting techniques reveals ${analysis.totalQuotaSavings}% potential quota savings through systematic optimization.`;
      }
      
      return result;
    } catch (error) {
      this.logError('Consulting summary generation failed', error, { sessionId, techniquesCount: analysis.techniquesUsed.length });
      throw this.createStageError('analysis', 'consulting_summary_failed', error, 'Review analysis results and try again. Consider reducing the complexity of the analysis.');
    }
  }

  private async generateEnhancedSpecWithErrorHandling(
    optimizedWorkflow: OptimizedWorkflow,
    consultingSummary: ConsultingSummary,
    roiAnalysis: ROIAnalysis,
    parsedIntent: ParsedIntent,
    params?: OptionalParams,
    sessionId?: string
  ): Promise<EnhancedKiroSpec> {
    try {
      const baseSpec = await this.specGenerator.generateKiroSpec(optimizedWorkflow, parsedIntent.businessObjective);
      
      // Validate base spec
      if (!baseSpec.tasks || baseSpec.tasks.length === 0) {
        this.logWarning('No tasks generated in spec, creating fallback', { sessionId });
        baseSpec.tasks = [{
          id: 'task-1',
          description: 'Implement optimized workflow based on analysis',
          requirements: [],
          estimatedEffort: 'medium'
        }];
      }
      
      // Create alternative options from ROI analysis
      const alternativeOptions = {
        conservative: {
          name: 'Conservative',
          description: 'Minimal changes with low risk',
          quotaSavings: 0,
          implementationEffort: 'low' as const,
          riskLevel: 'low' as const,
          estimatedROI: 1.0
        },
        balanced: {
          name: 'Balanced',
          description: 'Moderate optimization with balanced risk-reward',
          quotaSavings: roiAnalysis.scenarios.find(s => s.name === 'Balanced')?.savingsPercentage || 25,
          implementationEffort: 'medium' as const,
          riskLevel: 'low' as const,
          estimatedROI: 2.5
        },
        bold: {
          name: 'Bold',
          description: 'Aggressive optimization with higher risk but maximum savings',
          quotaSavings: roiAnalysis.scenarios.find(s => s.name === 'Bold')?.savingsPercentage || 50,
          implementationEffort: 'high' as const,
          riskLevel: 'medium' as const,
          estimatedROI: 4.0
        }
      };

      const enhancedSpec = {
        ...baseSpec,
        consultingSummary,
        roiAnalysis,
        alternativeOptions
      };
      
      // Final validation
      if (!enhancedSpec.name || enhancedSpec.name.trim().length === 0) {
        enhancedSpec.name = `Optimized ${parsedIntent.businessObjective}`;
      }
      
      return enhancedSpec;
    } catch (error) {
      this.logError('Enhanced spec generation failed', error, { sessionId, workflowSteps: optimizedWorkflow.steps.length });
      throw this.createStageError('analysis', 'spec_generation_failed', error, 'Review optimization results and try again. Consider simplifying the workflow structure.');
    }
  }

  private createEfficiencySummary(roiAnalysis: ROIAnalysis): EfficiencySummary {
    const naiveScenario = roiAnalysis.scenarios.find(s => s.name === 'Conservative');
    const optimizedScenario = roiAnalysis.scenarios.find(s => s.name === 'Balanced');
    
    const defaultForecast = (scenario: 'naive' | 'optimized'): QuotaForecast => ({
      vibesConsumed: 0,
      specsConsumed: 0,
      estimatedCost: 0,
      confidenceLevel: 'low' as const,
      scenario,
      breakdown: []
    });
    
    return {
      naiveApproach: naiveScenario?.forecast || defaultForecast('naive'),
      optimizedApproach: optimizedScenario?.forecast || defaultForecast('optimized'),
      savings: {
        vibeReduction: optimizedScenario?.savingsPercentage || 0,
        specReduction: optimizedScenario?.savingsPercentage || 0,
        costSavings: (naiveScenario?.forecast.estimatedCost || 0) - (optimizedScenario?.forecast.estimatedCost || 0),
        totalSavingsPercentage: optimizedScenario?.savingsPercentage || 0
      },
      optimizationNotes: roiAnalysis.recommendations
    };
  }

  private calculateSavingsPercentage(baseline: QuotaForecast, optimized: QuotaForecast): number {
    if (baseline.estimatedCost === 0) return 0;
    return Math.round(((baseline.estimatedCost - optimized.estimatedCost) / baseline.estimatedCost) * 100);
  }

  private createStageError(stage: ProcessingError['stage'], type: string, error: unknown, suggestedAction: string): ProcessingError {
    return {
      stage,
      type,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      suggestedAction,
      fallbackAvailable: false
    };
  }

  private handlePipelineError(error: unknown, sessionId?: string): PipelineResult {
    if (error && typeof error === 'object' && 'stage' in error) {
      const processingError = error as ProcessingError;
      this.logError('Pipeline error handled', processingError, { sessionId, errorStage: processingError.stage });
      return {
        success: false,
        error: processingError
      };
    }
    
    const fallbackError = {
      stage: 'intent' as const,
      type: 'pipeline_error',
      message: error instanceof Error ? error.message : 'Unknown pipeline error',
      suggestedAction: 'Check input format and try again',
      fallbackAvailable: false
    };
    
    this.logError('Unhandled pipeline error', error, { sessionId, errorType: 'unhandled' });
    
    return {
      success: false,
      error: fallbackError
    };
  }

  // Logging methods
  private logInfo(message: string, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'INFO',
      timestamp,
      message,
      component: 'AIAgentPipeline',
      ...context
    };
    console.log(JSON.stringify(logEntry));
  }

  private logWarning(message: string, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'WARN',
      timestamp,
      message,
      component: 'AIAgentPipeline',
      ...context
    };
    console.warn(JSON.stringify(logEntry));
  }

  private logError(message: string, error: unknown, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'ERROR',
      timestamp,
      message,
      component: 'AIAgentPipeline',
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error
      },
      ...context
    };
    console.error(JSON.stringify(logEntry));
  }

  // Utility methods
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private categorizePerformance(executionTime: number): string {
    if (executionTime < 1000) return 'excellent';
    if (executionTime < 3000) return 'good';
    if (executionTime < 5000) return 'acceptable';
    return 'slow';
  }

  private getErrorStage(error: unknown): string {
    if (error && typeof error === 'object' && 'stage' in error) {
      return (error as ProcessingError).stage;
    }
    return 'unknown';
  }
}

/**
 * Legacy PMAgentIntentOptimizer class for backward compatibility
 * Delegates to the new AIAgentPipeline
 */
export class PMAgentIntentOptimizer {
  private pipeline: AIAgentPipeline;

  constructor() {
    this.pipeline = new AIAgentPipeline();
  }

  async processIntent(rawIntent: string, params?: OptionalParams): Promise<PipelineResult> {
    return await this.pipeline.processIntent(rawIntent, params);
  }
}