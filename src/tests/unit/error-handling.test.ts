// Unit tests for error handling utilities

import { 
  ErrorHandler, 
  RetryHandler,
  ProcessingFailureError,
  OptimizationError,
  AnalysisError,
  ForecastingError,
  IntentParsingError
} from '../../utils/error-handling';
import { ValidationError } from '../../utils/validation';

describe('Error Handling Utilities', () => {
  describe('ProcessingFailureError', () => {
    it('should create error with correct properties', () => {
      const error = new ProcessingFailureError(
        'Test error',
        'analysis',
        'test_error',
        'Try again',
        true
      );

      expect(error.message).toBe('Test error');
      expect(error.stage).toBe('analysis');
      expect(error.errorType).toBe('test_error');
      expect(error.suggestedAction).toBe('Try again');
      expect(error.fallbackAvailable).toBe(true);
      expect(error.name).toBe('ProcessingFailureError');
    });
  });

  describe('Specific Error Types', () => {
    it('should create OptimizationError correctly', () => {
      const error = new OptimizationError('Optimization failed', 'Simplify workflow');
      expect(error.stage).toBe('optimization');
      expect(error.errorType).toBe('optimization_failed');
      expect(error.fallbackAvailable).toBe(true);
    });

    it('should create AnalysisError correctly', () => {
      const error = new AnalysisError('Analysis failed', 'Use basic techniques');
      expect(error.stage).toBe('analysis');
      expect(error.errorType).toBe('analysis_failed');
      expect(error.fallbackAvailable).toBe(true);
    });

    it('should create ForecastingError correctly', () => {
      const error = new ForecastingError('Forecasting failed', 'Use conservative estimates');
      expect(error.stage).toBe('forecasting');
      expect(error.errorType).toBe('forecasting_failed');
      expect(error.fallbackAvailable).toBe(true);
    });

    it('should create IntentParsingError correctly', () => {
      const error = new IntentParsingError('Parsing failed', 'Clarify intent');
      expect(error.stage).toBe('intent');
      expect(error.errorType).toBe('parsing_failed');
      expect(error.fallbackAvailable).toBe(false);
    });
  });

  describe('ErrorHandler.handleIntentParsingFailure', () => {
    it('should handle ValidationError', () => {
      const validationError = new ValidationError('Invalid input');
      
      expect(() => {
        ErrorHandler.handleIntentParsingFailure(validationError, 'test intent');
      }).toThrow(IntentParsingError);
    });

    it('should handle short intent', () => {
      const error = new Error('Generic error');
      
      expect(() => {
        ErrorHandler.handleIntentParsingFailure(error, 'short');
      }).toThrow(IntentParsingError);
    });

    it('should handle long intent', () => {
      const error = new Error('Generic error');
      const longIntent = 'a'.repeat(4000);
      
      expect(() => {
        ErrorHandler.handleIntentParsingFailure(error, longIntent);
      }).toThrow(IntentParsingError);
    });

    it('should handle generic parsing error', () => {
      const error = new Error('Generic error');
      
      expect(() => {
        ErrorHandler.handleIntentParsingFailure(error, 'normal length intent for testing');
      }).toThrow(IntentParsingError);
    });
  });

  describe('ErrorHandler.handleAnalysisFailure', () => {
    it('should return fallback analysis when provided', () => {
      const fallback = { test: 'fallback' };
      const result = ErrorHandler.handleAnalysisFailure(new Error('test'), fallback);
      expect(result).toBe(fallback);
    });

    it('should return minimal analysis when no fallback provided', () => {
      const result = ErrorHandler.handleAnalysisFailure(new Error('test'));
      expect(result.techniquesUsed).toHaveLength(1);
      expect(result.techniquesUsed[0].name).toBe('MECE');
      expect(result.totalQuotaSavings).toBe(10);
      expect(result.implementationComplexity).toBe('medium');
    });
  });

  describe('ErrorHandler.handleOptimizationFailure', () => {
    it('should return fallback optimization', () => {
      const originalWorkflow = {
        steps: [{ id: 'step-1', description: 'test' }]
      };
      
      const result = ErrorHandler.handleOptimizationFailure(new Error('test'), originalWorkflow);
      expect(result.optimizations).toHaveLength(1);
      expect(result.optimizations[0].type).toBe('caching');
      expect(result.efficiencyGains.totalSavingsPercentage).toBe(5);
    });
  });

  describe('ErrorHandler.handleForecastingFailure', () => {
    it('should return fallback forecast', () => {
      const workflow = { steps: [1, 2, 3] }; // 3 steps
      const result = ErrorHandler.handleForecastingFailure(new Error('test'), workflow);
      
      expect(result.vibesConsumed).toBe(6); // 3 * 2
      expect(result.specsConsumed).toBe(2); // ceil(3/2)
      expect(result.confidenceLevel).toBe('low');
      expect(result.scenario).toBe('fallback');
    });

    it('should handle missing workflow', () => {
      const result = ErrorHandler.handleForecastingFailure(new Error('test'));
      expect(result.vibesConsumed).toBe(6); // default 3 steps * 2
      expect(result.specsConsumed).toBe(2);
    });
  });

  describe('ErrorHandler.handleROIAnalysisFailure', () => {
    it('should return fallback ROI analysis', () => {
      const result = ErrorHandler.handleROIAnalysisFailure(new Error('test'));
      
      expect(result.scenarios).toHaveLength(2);
      expect(result.scenarios[0].name).toBe('Conservative');
      expect(result.scenarios[1].name).toBe('Balanced');
      expect(result.bestOption).toBe('Balanced');
    });

    it('should use provided baseline forecast', () => {
      const baseline = { estimatedCost: 10 };
      const result = ErrorHandler.handleROIAnalysisFailure(new Error('test'), baseline);
      
      expect(result.scenarios[0].forecast).toBe(baseline);
      expect(result.scenarios[1].forecast.estimatedCost).toBe(8); // 10 * 0.8
    });
  });

  describe('ErrorHandler.isRecoverable', () => {
    it('should identify recoverable errors', () => {
      const recoverableError = new OptimizationError('test', 'action');
      expect(ErrorHandler.isRecoverable(recoverableError)).toBe(true);
    });

    it('should identify non-recoverable errors', () => {
      const nonRecoverableError = new IntentParsingError('test', 'action');
      expect(ErrorHandler.isRecoverable(nonRecoverableError)).toBe(false);
      
      const validationError = new ValidationError('test');
      expect(ErrorHandler.isRecoverable(validationError)).toBe(false);
    });

    it('should default to recoverable for unknown errors', () => {
      const unknownError = new Error('test');
      expect(ErrorHandler.isRecoverable(unknownError)).toBe(true);
    });
  });

  describe('ErrorHandler.getFallbackStrategy', () => {
    it('should return appropriate strategies for each stage', () => {
      expect(ErrorHandler.getFallbackStrategy(new Error('test'), 'intent'))
        .toContain('Simplify intent description');
      expect(ErrorHandler.getFallbackStrategy(new Error('test'), 'analysis'))
        .toContain('basic analysis techniques');
      expect(ErrorHandler.getFallbackStrategy(new Error('test'), 'optimization'))
        .toContain('minimal optimization');
      expect(ErrorHandler.getFallbackStrategy(new Error('test'), 'forecasting'))
        .toContain('conservative estimates');
    });

    it('should handle validation errors specially', () => {
      const validationError = new ValidationError('test');
      expect(ErrorHandler.getFallbackStrategy(validationError, 'intent'))
        .toContain('Fix input validation');
    });
  });

  describe('ErrorHandler.toProcessingError', () => {
    it('should convert Error to ProcessingError', () => {
      const error = new Error('test message');
      const result = ErrorHandler.toProcessingError(error, 'analysis', 'test_type', 'test action');
      
      expect(result.stage).toBe('analysis');
      expect(result.type).toBe('test_type');
      expect(result.message).toBe('test message');
      expect(result.suggestedAction).toBe('test action');
      expect(result.fallbackAvailable).toBe(false);
    });

    it('should convert non-Error to ProcessingError', () => {
      const result = ErrorHandler.toProcessingError('string error', 'intent', 'test_type', 'test action', true);
      
      expect(result.message).toBe('string error');
      expect(result.fallbackAvailable).toBe(true);
    });
  });

  describe('ErrorHandler.safeExecute', () => {
    it('should return operation result on success', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const fallback = 'fallback';
      
      const result = await ErrorHandler.safeExecute(
        operation,
        fallback,
        { stage: 'analysis', operation: 'test' }
      );
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should return fallback on recoverable error', async () => {
      const operation = jest.fn().mockRejectedValue(new OptimizationError('test', 'action'));
      const fallback = 'fallback';
      
      const result = await ErrorHandler.safeExecute(
        operation,
        fallback,
        { stage: 'optimization', operation: 'test' }
      );
      
      expect(result).toBe('fallback');
    });

    it('should throw on non-recoverable error', async () => {
      const error = new ValidationError('test');
      const operation = jest.fn().mockRejectedValue(error);
      const fallback = 'fallback';
      
      await expect(ErrorHandler.safeExecute(
        operation,
        fallback,
        { stage: 'intent', operation: 'test' }
      )).rejects.toThrow(ValidationError);
    });
  });

  describe('RetryHandler.withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await RetryHandler.withRetry(operation, 3, 100);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient failures', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('transient'))
        .mockResolvedValue('success');
      
      const result = await RetryHandler.withRetry(operation, 3, 10);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry validation errors', async () => {
      const error = new ValidationError('test');
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(RetryHandler.withRetry(operation, 3, 10))
        .rejects.toThrow(ValidationError);
      
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should not retry intent parsing errors', async () => {
      const error = new IntentParsingError('test', 'action');
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(RetryHandler.withRetry(operation, 3, 10))
        .rejects.toThrow(IntentParsingError);
      
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw last error after max retries', async () => {
      const error = new Error('persistent failure');
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(RetryHandler.withRetry(operation, 2, 10))
        .rejects.toThrow('persistent failure');
      
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });
});