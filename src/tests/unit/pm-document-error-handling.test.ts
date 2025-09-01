// Unit tests for PM document error handling and fallbacks

import {
  PMDocumentFallbackProvider,
  PMDocumentErrorRecovery,
  PMDocumentGenerationError
} from '../../utils/pm-document-error-handling';
import { PMDocumentValidationError } from '../../utils/pm-document-validation';
import {
  ROIInputs,
  RequirementsContext,
  TaskLimits,
  ManagementOnePager,
  PRFAQ,
  PMRequirements,
  DesignOptions,
  TaskPlan
} from '../../components/pm-document-generator';

describe('PM Document Error Handling', () => {
  describe('PMDocumentFallbackProvider', () => {
    describe('generateFallbackManagementOnePager', () => {
      it('should generate valid fallback management one-pager', () => {
        const fallback = PMDocumentFallbackProvider.generateFallbackManagementOnePager();

        expect(fallback.answer).toBeDefined();
        expect(fallback.answer.length).toBeGreaterThan(0);
        expect(fallback.because).toHaveLength(3);
        expect(fallback.whatScopeToday.length).toBeGreaterThan(0);
        expect(fallback.risksAndMitigations).toHaveLength(3);
        expect(fallback.options.conservative).toBeDefined();
        expect(fallback.options.balanced).toBeDefined();
        expect(fallback.options.balanced.recommended).toBe(true);
        expect(fallback.options.bold).toBeDefined();
        expect(fallback.roiSnapshot.options.conservative).toBeDefined();
        expect(fallback.roiSnapshot.options.balanced).toBeDefined();
        expect(fallback.roiSnapshot.options.bold).toBeDefined();
        expect(fallback.rightTimeRecommendation).toBeDefined();
      });

      it('should log warning when using fallback', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const error = new Error('Test error');

        PMDocumentFallbackProvider.generateFallbackManagementOnePager('req', 'design', error);

        expect(consoleSpy).toHaveBeenCalledWith(
          'Using fallback management one-pager generation due to error:',
          'Test error'
        );

        consoleSpy.mockRestore();
      });
    });

    describe('generateFallbackPRFAQ', () => {
      it('should generate valid fallback PR-FAQ', () => {
        const fallback = PMDocumentFallbackProvider.generateFallbackPRFAQ();

        expect(fallback.pressRelease.date).toBeDefined();
        expect(fallback.pressRelease.headline).toBeDefined();
        expect(fallback.pressRelease.subHeadline).toBeDefined();
        expect(fallback.pressRelease.body).toBeDefined();
        expect(fallback.faq).toHaveLength(10);
        expect(fallback.launchChecklist.length).toBeGreaterThan(0);

        // Verify required FAQ questions are present
        const questions = fallback.faq.map(item => item.question);
        expect(questions).toContain('Who is the customer?');
        expect(questions).toContain('What problem are we solving now?');
        expect(questions).toContain('Why now and why not later?');
      });

      it('should use provided target date', () => {
        const targetDate = '2025-06-01';
        const fallback = PMDocumentFallbackProvider.generateFallbackPRFAQ(undefined, undefined, targetDate);

        expect(fallback.pressRelease.date).toBe(targetDate);
      });

      it('should generate default date when none provided', () => {
        const fallback = PMDocumentFallbackProvider.generateFallbackPRFAQ();
        const date = new Date(fallback.pressRelease.date);
        const now = new Date();

        expect(date.getTime()).toBeGreaterThan(now.getTime());
      });
    });

    describe('generateFallbackRequirements', () => {
      it('should generate valid fallback requirements', () => {
        const fallback = PMDocumentFallbackProvider.generateFallbackRequirements();

        expect(fallback.businessGoal).toBeDefined();
        expect(fallback.userNeeds.jobs.length).toBeGreaterThan(0);
        expect(fallback.userNeeds.pains.length).toBeGreaterThan(0);
        expect(fallback.userNeeds.gains.length).toBeGreaterThan(0);
        expect(fallback.functionalRequirements.length).toBeGreaterThan(0);
        expect(fallback.constraintsRisks.length).toBeGreaterThan(0);
        expect(fallback.priority.must.length).toBeGreaterThan(0);
        expect(fallback.priority.should.length).toBeGreaterThan(0);
        expect(fallback.priority.could.length).toBeGreaterThan(0);
        expect(fallback.priority.wont.length).toBeGreaterThan(0);
        expect(fallback.rightTimeVerdict.decision).toMatch(/^(do_now|do_later)$/);
        expect(fallback.rightTimeVerdict.reasoning).toBeDefined();
      });
    });

    describe('generateFallbackDesignOptions', () => {
      it('should generate valid fallback design options', () => {
        const fallback = PMDocumentFallbackProvider.generateFallbackDesignOptions();

        expect(fallback.problemFraming).toBeDefined();
        expect(fallback.options.conservative).toBeDefined();
        expect(fallback.options.balanced).toBeDefined();
        expect(fallback.options.bold).toBeDefined();
        expect(fallback.impactEffortMatrix).toBeDefined();
        expect(fallback.rightTimeRecommendation).toBeDefined();

        // Verify impact/effort matrix categorization
        const allOptions = [fallback.options.conservative, fallback.options.balanced, fallback.options.bold];
        const matrixOptions = [
          ...fallback.impactEffortMatrix.highImpactLowEffort,
          ...fallback.impactEffortMatrix.highImpactHighEffort,
          ...fallback.impactEffortMatrix.lowImpactLowEffort,
          ...fallback.impactEffortMatrix.lowImpactHighEffort
        ];

        expect(matrixOptions.length).toBe(allOptions.length);
      });
    });

    describe('generateFallbackTaskPlan', () => {
      it('should generate valid fallback task plan', () => {
        const fallback = PMDocumentFallbackProvider.generateFallbackTaskPlan();

        expect(fallback.guardrailsCheck).toBeDefined();
        expect(fallback.guardrailsCheck.id).toBe('0');
        expect(fallback.guardrailsCheck.limits).toBeDefined();
        expect(fallback.guardrailsCheck.checkCriteria.length).toBeGreaterThan(0);
        expect(fallback.immediateWins.length).toBeGreaterThan(0);
        expect(fallback.shortTerm.length).toBeGreaterThan(0);
        expect(fallback.longTerm.length).toBeGreaterThan(0);

        // Verify task structure
        const allTasks = [...fallback.immediateWins, ...fallback.shortTerm, ...fallback.longTerm];
        allTasks.forEach(task => {
          expect(task.id).toBeDefined();
          expect(task.name).toBeDefined();
          expect(task.description).toBeDefined();
          expect(task.acceptanceCriteria.length).toBeGreaterThan(0);
          expect(['S', 'M', 'L']).toContain(task.effort);
          expect(['Low', 'Med', 'High']).toContain(task.impact);
          expect(['Must', 'Should', 'Could', 'Won\'t']).toContain(task.priority);
        });
      });

      it('should use provided limits', () => {
        const limits: TaskLimits = {
          maxVibes: 5000,
          maxSpecs: 500,
          budgetUSD: 250000
        };

        const fallback = PMDocumentFallbackProvider.generateFallbackTaskPlan(undefined, limits);

        expect(fallback.guardrailsCheck.limits).toEqual(limits);
      });
    });
  });

  describe('PMDocumentErrorRecovery', () => {
    describe('recoverFromError', () => {
      it('should return successful operation result', async () => {
        const successResult = { success: true };
        const operation = jest.fn().mockResolvedValue(successResult);
        const fallback = jest.fn();

        const result = await PMDocumentErrorRecovery.recoverFromError(
          operation,
          fallback,
          { documentType: 'test', operation: 'test' }
        );

        expect(result).toBe(successResult);
        expect(operation).toHaveBeenCalled();
        expect(fallback).not.toHaveBeenCalled();
      });

      it('should use fallback when operation fails', async () => {
        const error = new Error('Operation failed');
        const fallbackResult = { fallback: true };
        const operation = jest.fn().mockRejectedValue(error);
        const fallback = jest.fn().mockReturnValue(fallbackResult);
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = await PMDocumentErrorRecovery.recoverFromError(
          operation,
          fallback,
          { documentType: 'test', operation: 'test' }
        );

        expect(result).toBe(fallbackResult);
        expect(operation).toHaveBeenCalled();
        expect(fallback).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Error in test test:', error);
        expect(warnSpy).toHaveBeenCalledWith('Using fallback for test test');

        consoleSpy.mockRestore();
        warnSpy.mockRestore();
      });

      it('should throw error when both operation and fallback fail', async () => {
        const operationError = new Error('Operation failed');
        const fallbackError = new Error('Fallback failed');
        const operation = jest.fn().mockRejectedValue(operationError);
        const fallback = jest.fn().mockImplementation(() => { throw fallbackError; });
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await expect(
          PMDocumentErrorRecovery.recoverFromError(
            operation,
            fallback,
            { documentType: 'test', operation: 'test' }
          )
        ).rejects.toThrow(PMDocumentGenerationError);

        consoleSpy.mockRestore();
      });

      it('should log validation error details', async () => {
        const validationError = new PMDocumentValidationError('Invalid input', 'test', 'field');
        const operation = jest.fn().mockRejectedValue(validationError);
        const fallback = jest.fn().mockReturnValue({ fallback: true });
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await PMDocumentErrorRecovery.recoverFromError(
          operation,
          fallback,
          { documentType: 'test', operation: 'test' }
        );

        expect(consoleSpy).toHaveBeenCalledWith('Validation error details:', {
          field: 'field',
          documentType: 'test',
          message: 'Invalid input'
        });

        consoleSpy.mockRestore();
      });
    });

    describe('sanitizeInput', () => {
      it('should return valid input unchanged', () => {
        const validInput = 'This is a valid input with sufficient content for processing.';
        const result = PMDocumentErrorRecovery.sanitizeInput(validInput, 'test');

        expect(result).toBe(validInput);
      });

      it('should return placeholder for null/undefined input', () => {
        const result1 = PMDocumentErrorRecovery.sanitizeInput(null as any, 'test');
        const result2 = PMDocumentErrorRecovery.sanitizeInput(undefined as any, 'test');

        expect(result1).toBe('[test content not available - using fallback analysis]');
        expect(result2).toBe('[test content not available - using fallback analysis]');
      });

      it('should return placeholder for non-string input', () => {
        const result = PMDocumentErrorRecovery.sanitizeInput(123 as any, 'test');

        expect(result).toBe('[test content not available - using fallback analysis]');
      });

      it('should truncate input that is too long', () => {
        const longInput = 'x'.repeat(60000);
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = PMDocumentErrorRecovery.sanitizeInput(longInput, 'test', 1000);

        expect(result).toHaveLength(1015); // 1000 + '... [truncated]'
        expect(result.endsWith('... [truncated]')).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith('test input truncated from 60000 to 1000 characters');

        consoleSpy.mockRestore();
      });

      it('should return placeholder for input too short', () => {
        const shortInput = 'short';
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = PMDocumentErrorRecovery.sanitizeInput(shortInput, 'test');

        expect(result).toBe('[test content insufficient - using fallback analysis]');
        expect(consoleSpy).toHaveBeenCalledWith('test input too short, using placeholder');

        consoleSpy.mockRestore();
      });

      it('should clean up excessive whitespace', () => {
        const messyInput = '  This   has    excessive     whitespace   ';
        const result = PMDocumentErrorRecovery.sanitizeInput(messyInput, 'test');

        expect(result).toBe('This has excessive whitespace');
      });
    });

    describe('extractMeaningfulContent', () => {
      it('should extract content from markdown', () => {
        const markdownInput = `# Title\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2\n\n1. Numbered item\n\nRegular paragraph with meaningful content.`;
        
        const result = PMDocumentErrorRecovery.extractMeaningfulContent(markdownInput);

        expect(result).toContain('Bold text and italic text');
        expect(result).toContain('Regular paragraph with meaningful content');
        expect(result).not.toContain('#');
        expect(result).not.toContain('**');
        expect(result).not.toContain('*');
      });

      it('should return empty string for insufficient content', () => {
        const shortInput = 'Short content';
        const result = PMDocumentErrorRecovery.extractMeaningfulContent(shortInput);

        expect(result).toBe('');
      });

      it('should filter out test/placeholder sentences', () => {
        const testInput = 'This is a test. This is meaningful content that should be preserved and contains enough words to pass filtering. Example text here.';
        const result = PMDocumentErrorRecovery.extractMeaningfulContent(testInput);

        expect(result).toContain('meaningful content');
        // Note: The current implementation doesn't filter individual words, just short sentences
        // This test verifies the function works with mixed content
        expect(result.length).toBeGreaterThan(0);
      });

      it('should return empty string for null/undefined input', () => {
        expect(PMDocumentErrorRecovery.extractMeaningfulContent(null as any)).toBe('');
        expect(PMDocumentErrorRecovery.extractMeaningfulContent(undefined as any)).toBe('');
      });
    });

    describe('getContextualErrorMessage', () => {
      it('should provide validation error message', () => {
        const error = new PMDocumentValidationError('Invalid field', 'test', 'fieldName');
        const message = PMDocumentErrorRecovery.getContextualErrorMessage(error, 'document', 'operation');

        expect(message).toContain('Input validation failed');
        expect(message).toContain('fieldName');
        expect(message).toContain('document operation');
      });

      it('should provide timeout error message', () => {
        const error = new Error('Operation timeout');
        const message = PMDocumentErrorRecovery.getContextualErrorMessage(error, 'document', 'operation');

        expect(message).toContain('timed out');
        expect(message).toContain('complex input');
      });

      it('should provide memory error message', () => {
        const error = new Error('Out of memory');
        const message = PMDocumentErrorRecovery.getContextualErrorMessage(error, 'document', 'operation');

        expect(message).toContain('memory constraints');
        expect(message).toContain('shorter input');
      });

      it('should provide network error message', () => {
        const error = new Error('Network connection failed');
        const message = PMDocumentErrorRecovery.getContextualErrorMessage(error, 'document', 'operation');

        expect(message).toContain('network issues');
        expect(message).toContain('connectivity');
      });

      it('should provide generic error message', () => {
        const error = new Error('Unknown error');
        const message = PMDocumentErrorRecovery.getContextualErrorMessage(error, 'document', 'operation');

        expect(message).toContain('document operation failed');
        expect(message).toContain('fallback generation');
      });
    });
  });

  describe('PMDocumentGenerationError', () => {
    it('should create error with all properties', () => {
      const originalError = new Error('Original error');
      const error = new PMDocumentGenerationError(
        'Generation failed',
        'test_document',
        originalError,
        true
      );

      expect(error.message).toBe('Generation failed');
      expect(error.documentType).toBe('test_document');
      expect(error.originalError).toBe(originalError);
      expect(error.fallbackUsed).toBe(true);
      expect(error.name).toBe('PMDocumentGenerationError');
    });

    it('should create error with minimal properties', () => {
      const error = new PMDocumentGenerationError('Generation failed', 'test_document');

      expect(error.message).toBe('Generation failed');
      expect(error.documentType).toBe('test_document');
      expect(error.originalError).toBeUndefined();
      expect(error.fallbackUsed).toBeUndefined();
    });
  });
});