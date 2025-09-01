// Integration tests for PM document generation error scenarios

import { PMDocumentGenerator } from '../../components/pm-document-generator';
import { PMDocumentValidationError } from '../../utils/pm-document-validation';

describe('PM Document Generation Error Scenarios', () => {
  let generator: PMDocumentGenerator;

  beforeEach(() => {
    generator = new PMDocumentGenerator();
  });

  describe('Management One-Pager Error Handling', () => {
    it('should use fallback when requirements are invalid', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await generator.generateManagementOnePager('', 'valid design document with sufficient content');

      expect(result).toBeDefined();
      expect(result.answer).toContain('cautious implementation');
      expect(result.because).toHaveLength(3);
      expect(result.options.balanced.recommended).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using fallback management one-pager generation')
      );

      consoleSpy.mockRestore();
    });

    it('should handle malformed ROI inputs gracefully', async () => {
      const validRequirements = 'This is a comprehensive requirements document with user stories and business objectives.';
      const validDesign = 'This is a detailed design document with architecture and technical specifications.';
      const invalidROI = { cost_naive: -1000 } as any;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await generator.generateManagementOnePager(validRequirements, validDesign, undefined, invalidROI);

      expect(result).toBeDefined();
      expect(result.roiSnapshot).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should sanitize excessively long inputs', async () => {
      const longRequirements = 'This is a requirements document. '.repeat(2000); // Very long
      const validDesign = 'This is a detailed design document with architecture and technical specifications.';

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await generator.generateManagementOnePager(longRequirements, validDesign);

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('requirements input truncated')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('PR-FAQ Error Handling', () => {
    it('should use fallback when design is invalid', async () => {
      const validRequirements = 'This is a comprehensive requirements document with user stories and business objectives.';
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await generator.generatePRFAQ(validRequirements, '');

      expect(result).toBeDefined();
      expect(result.pressRelease.headline).toBeDefined();
      expect(result.faq).toHaveLength(10);
      expect(result.launchChecklist.length).toBeGreaterThan(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using fallback PR-FAQ generation')
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid target dates gracefully', async () => {
      const validRequirements = 'This is a comprehensive requirements document with user stories and business objectives.';
      const validDesign = 'This is a detailed design document with architecture and technical specifications.';
      const invalidDate = '2020-01-01'; // Past date

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await generator.generatePRFAQ(validRequirements, validDesign, invalidDate);

      expect(result).toBeDefined();
      expect(result.pressRelease.date).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Requirements Generation Error Handling', () => {
    it('should use fallback when raw intent is too short', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await generator.generateRequirements('short');

      expect(result).toBeDefined();
      expect(result.businessGoal).toBeDefined();
      expect(result.userNeeds.jobs.length).toBeGreaterThan(0);
      expect(result.priority.must.length).toBeGreaterThan(0);
      expect(result.rightTimeVerdict.decision).toMatch(/^(do_now|do_later)$/);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using fallback requirements generation')
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid context gracefully', async () => {
      const validIntent = 'I want to build a system that optimizes workflows and reduces costs through intelligent analysis.';
      const invalidContext = { budget: -1000 } as any;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await generator.generateRequirements(validIntent, invalidContext);

      expect(result).toBeDefined();
      expect(result.businessGoal).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Design Options Error Handling', () => {
    it('should use fallback when requirements are missing', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await generator.generateDesignOptions('');

      expect(result).toBeDefined();
      expect(result.problemFraming).toBeDefined();
      expect(result.options.conservative).toBeDefined();
      expect(result.options.balanced).toBeDefined();
      expect(result.options.bold).toBeDefined();
      expect(result.impactEffortMatrix).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using fallback design options generation')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Task Plan Error Handling', () => {
    it('should use fallback when design is invalid', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await generator.generateTaskPlan('');

      expect(result).toBeDefined();
      expect(result.guardrailsCheck).toBeDefined();
      expect(result.guardrailsCheck.id).toBe('0');
      expect(result.immediateWins.length).toBeGreaterThan(0);
      expect(result.shortTerm.length).toBeGreaterThan(0);
      expect(result.longTerm.length).toBeGreaterThan(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using fallback task plan generation')
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid limits gracefully', async () => {
      const validDesign = 'This is a detailed design document with architecture and technical specifications.';
      const invalidLimits = { maxVibes: -100 } as any;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await generator.generateTaskPlan(validDesign, invalidLimits);

      expect(result).toBeDefined();
      expect(result.guardrailsCheck.limits).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Input Sanitization', () => {
    it('should handle null inputs gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await generator.generateManagementOnePager(null as any, null as any);

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid requirements input')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid design input')
      );

      consoleSpy.mockRestore();
    });

    it('should handle non-string inputs gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await generator.generatePRFAQ(123 as any, { object: true } as any);

      expect(result).toBeDefined();
      expect(result.pressRelease.headline).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid requirements input')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid design input')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Graceful Degradation', () => {
    it('should provide meaningful fallback content', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Test with completely invalid inputs
      const onePager = await generator.generateManagementOnePager('', '');
      const prfaq = await generator.generatePRFAQ('', '');
      const requirements = await generator.generateRequirements('');
      const designOptions = await generator.generateDesignOptions('');
      const taskPlan = await generator.generateTaskPlan('');

      // Verify all documents are generated with meaningful content
      expect(onePager.answer).toContain('implementation');
      expect(onePager.because.every(reason => reason.length > 10)).toBe(true);

      expect(prfaq.pressRelease.headline).toContain('Product');
      expect(prfaq.faq.every(item => item.answer.length > 10)).toBe(true);

      expect(requirements.businessGoal).toContain('value');
      expect(requirements.userNeeds.jobs.every(job => job.length > 10)).toBe(true);

      expect(designOptions.problemFraming).toContain('analysis');
      expect(designOptions.options.balanced.summary).toContain('approach');

      expect(taskPlan.guardrailsCheck.name).toBe('Guardrails Check');
      expect(taskPlan.immediateWins.every(task => task.name.length > 5)).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should maintain document structure even with fallbacks', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const onePager = await generator.generateManagementOnePager('invalid', 'invalid');

      // Verify structure is maintained
      expect(onePager.because).toHaveLength(3);
      expect(onePager.risksAndMitigations).toHaveLength(3);
      expect(onePager.options.conservative).toBeDefined();
      expect(onePager.options.balanced).toBeDefined();
      expect(onePager.options.balanced.recommended).toBe(true);
      expect(onePager.options.bold).toBeDefined();
      expect(onePager.roiSnapshot.options.conservative.effort).toMatch(/^(Low|Med|High)$/);
      expect(onePager.roiSnapshot.options.balanced.impact).toMatch(/^(Med|High|VeryH)$/);

      consoleSpy.mockRestore();
    });
  });
});