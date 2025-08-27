// Error handling utilities for processing failures and recovery

import { ProcessingError } from '../models';
import { ValidationError } from './validation';

export class ProcessingFailureError extends Error {
  constructor(
    message: string,
    public stage: ProcessingError['stage'],
    public errorType: string,
    public suggestedAction: string,
    public fallbackAvailable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ProcessingFailureError';
  }
}

export class OptimizationError extends ProcessingFailureError {
  constructor(message: string, suggestedAction: string, originalError?: Error) {
    super(message, 'optimization', 'optimization_failed', suggestedAction, true, originalError);
    this.name = 'OptimizationError';
  }
}

export class AnalysisError extends ProcessingFailureError {
  constructor(message: string, suggestedAction: string, originalError?: Error) {
    super(message, 'analysis', 'analysis_failed', suggestedAction, true, originalError);
    this.name = 'AnalysisError';
  }
}

export class ForecastingError extends ProcessingFailureError {
  constructor(message: string, suggestedAction: string, originalError?: Error) {
    super(message, 'forecasting', 'forecasting_failed', suggestedAction, true, originalError);
    this.name = 'ForecastingError';
  }
}

export class IntentParsingError extends ProcessingFailureError {
  constructor(message: string, suggestedAction: string, originalError?: Error) {
    super(message, 'intent', 'parsing_failed', suggestedAction, false, originalError);
    this.name = 'IntentParsingError';
  }
}

/**
 * Error handler that provides fallback strategies and recovery mechanisms
 */
export class ErrorHandler {
  /**
   * Handle intent parsing failures with fallback strategies
   */
  static handleIntentParsingFailure(error: unknown, rawIntent: string): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    
    if (error instanceof ValidationError) {
      throw new IntentParsingError(
        `Input validation failed: ${errorMessage}`,
        'Please check your input format and try again with a clearer description',
        error
      );
    }

    if (rawIntent.length < 20) {
      throw new IntentParsingError(
        'Intent description is too brief to parse effectively',
        'Please provide more detailed information about what you want to build',
        error instanceof Error ? error : new Error(errorMessage)
      );
    }

    if (rawIntent.length > 3000) {
      throw new IntentParsingError(
        'Intent description is too complex to parse effectively',
        'Please break down your requirements into smaller, more focused descriptions',
        error instanceof Error ? error : new Error(errorMessage)
      );
    }

    throw new IntentParsingError(
      `Failed to parse intent: ${errorMessage}`,
      'Try rephrasing your intent with more specific technical details',
      error instanceof Error ? error : new Error(errorMessage)
    );
  }

  /**
   * Handle business analysis failures with fallback strategies
   */
  static handleAnalysisFailure(error: unknown, fallbackAnalysis?: any): any {
    const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';
    
    if (fallbackAnalysis) {
      console.warn(`Analysis failed, using fallback: ${errorMessage}`);
      return fallbackAnalysis;
    }

    // Create minimal fallback analysis
    const minimalAnalysis = {
      techniquesUsed: [
        { name: 'MECE', relevanceScore: 0.5, applicableScenarios: ['general'] }
      ],
      keyFindings: ['Basic analysis completed with limited techniques'],
      totalQuotaSavings: 10,
      implementationComplexity: 'medium' as const
    };

    console.warn(`Analysis failed, using minimal fallback: ${errorMessage}`);
    return minimalAnalysis;
  }

  /**
   * Handle workflow optimization failures with fallback strategies
   */
  static handleOptimizationFailure(error: unknown, originalWorkflow: any): any {
    const errorMessage = error instanceof Error ? error.message : 'Unknown optimization error';
    
    // Create fallback optimized workflow with minimal changes
    const fallbackOptimization = {
      ...originalWorkflow,
      optimizations: [{
        type: 'caching',
        description: 'Basic caching optimization (fallback)',
        stepsAffected: [originalWorkflow.steps?.[0]?.id || 'step-1'],
        estimatedSavings: { vibes: 0, specs: 0, percentage: 5 }
      }],
      efficiencyGains: {
        vibeReduction: 5,
        specReduction: 0,
        totalSavingsPercentage: 5,
        costSavings: 0
      },
      originalWorkflow
    };

    console.warn(`Optimization failed, using fallback: ${errorMessage}`);
    return fallbackOptimization;
  }

  /**
   * Handle quota forecasting failures with fallback strategies
   */
  static handleForecastingFailure(error: unknown, workflow?: any): any {
    const errorMessage = error instanceof Error ? error.message : 'Unknown forecasting error';
    
    // Create conservative fallback forecast
    const stepCount = workflow?.steps?.length || 3;
    const fallbackForecast = {
      vibesConsumed: stepCount * 2,
      specsConsumed: Math.ceil(stepCount / 2),
      estimatedCost: stepCount * 0.05,
      confidenceLevel: 'low' as const,
      scenario: 'fallback' as const,
      breakdown: [{
        stepId: 'fallback',
        stepDescription: 'Fallback estimation',
        vibes: stepCount * 2,
        specs: Math.ceil(stepCount / 2),
        cost: stepCount * 0.05
      }]
    };

    console.warn(`Forecasting failed, using fallback: ${errorMessage}`);
    return fallbackForecast;
  }

  /**
   * Handle ROI analysis failures with fallback strategies
   */
  static handleROIAnalysisFailure(error: unknown, baselineForecast?: any): any {
    const errorMessage = error instanceof Error ? error.message : 'Unknown ROI analysis error';
    
    const fallbackROI = {
      scenarios: [{
        name: 'Conservative',
        forecast: baselineForecast || this.handleForecastingFailure(error),
        savingsPercentage: 0,
        implementationEffort: 'none',
        riskLevel: 'none'
      }, {
        name: 'Balanced',
        forecast: {
          ...baselineForecast || this.handleForecastingFailure(error),
          estimatedCost: (baselineForecast?.estimatedCost || 0.15) * 0.8
        },
        savingsPercentage: 20,
        implementationEffort: 'medium',
        riskLevel: 'low'
      }],
      recommendations: ['Apply moderate optimization for balanced risk-reward'],
      bestOption: 'Balanced',
      riskAssessment: 'Low risk with moderate savings potential'
    };

    console.warn(`ROI analysis failed, using fallback: ${errorMessage}`);
    return fallbackROI;
  }

  /**
   * Convert any error to a ProcessingError
   */
  static toProcessingError(
    error: unknown, 
    stage: ProcessingError['stage'], 
    type: string, 
    suggestedAction: string,
    fallbackAvailable: boolean = false
  ): ProcessingError {
    const message = error instanceof Error ? error.message : String(error);
    
    return {
      stage,
      type,
      message,
      suggestedAction,
      fallbackAvailable
    };
  }

  /**
   * Determine if an error is recoverable
   */
  static isRecoverable(error: unknown): boolean {
    if (error instanceof ProcessingFailureError) {
      return error.fallbackAvailable;
    }
    
    if (error instanceof ValidationError) {
      return false; // Validation errors require user input correction
    }
    
    // Most processing errors are recoverable with fallbacks
    return true;
  }

  /**
   * Get appropriate fallback strategy for an error
   */
  static getFallbackStrategy(error: unknown, stage: ProcessingError['stage']): string {
    if (error instanceof ValidationError) {
      return 'Fix input validation issues and retry';
    }

    switch (stage) {
      case 'intent':
        return 'Simplify intent description or provide more specific details';
      case 'analysis':
        return 'Use basic analysis techniques with reduced complexity';
      case 'optimization':
        return 'Apply minimal optimization strategies with lower risk';
      case 'forecasting':
        return 'Use conservative estimates based on workflow complexity';
      default:
        return 'Retry with simplified parameters or reduced complexity';
    }
  }

  /**
   * Log error with appropriate context
   */
  static logError(error: unknown, context: Record<string, any> = {}): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      level: 'ERROR',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
      recoverable: this.isRecoverable(error),
      ...context
    };
    
    console.error(JSON.stringify(errorInfo));
  }

  /**
   * Create a safe execution wrapper that handles errors gracefully
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    fallbackValue: T,
    errorContext: { stage: ProcessingError['stage']; operation: string }
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logError(error, errorContext);
      
      if (this.isRecoverable(error)) {
        console.warn(`Operation ${errorContext.operation} failed, using fallback value`);
        return fallbackValue;
      }
      
      throw error;
    }
  }
}

/**
 * Retry mechanism for transient failures
 */
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000,
    backoffMultiplier: number = 2
  ): Promise<T> {
    let lastError: unknown;
    let currentDelay = delayMs;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry validation errors or other non-transient errors
        if (error instanceof ValidationError || error instanceof IntentParsingError) {
          throw error;
        }

        if (attempt === maxRetries) {
          break;
        }

        console.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${currentDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoffMultiplier;
      }
    }

    throw lastError;
  }
}