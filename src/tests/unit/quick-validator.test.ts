import { QuickValidator } from '../../components/quick-validator';
import { QuickValidationContext } from '../../models/intent';

describe('QuickValidator', () => {
  let validator: QuickValidator;

  beforeEach(() => {
    validator = new QuickValidator();
  });

  describe('validateIdeaQuick', () => {
    describe('PASS scenarios', () => {
      it('should pass for clear, simple ideas', async () => {
        const idea = 'I want to automate user onboarding to reduce manual work';
        const result = await validator.validateIdeaQuick(idea);

        expect(result.verdict).toBe('PASS');
        expect(result.reasoning).toContain('Clear objective with manageable complexity');
        expect(result.options).toHaveLength(3);
        expect(result.options[0].id).toBe('A');
        expect(result.options[1].id).toBe('B');
        expect(result.options[2].id).toBe('C');
        expect(result.processingTimeMs).toBeGreaterThan(0);
      });

      it('should pass for ideas with clear business objectives', async () => {
        const idea = 'Need to create a dashboard to help managers track team performance metrics';
        const result = await validator.validateIdeaQuick(idea);

        expect(result.verdict).toBe('PASS');
        expect(result.reasoning).toContain('Clear objective');
        expect(result.options[0].title).toBe('Quick Requirements');
        expect(result.options[1].title).toBe('Full Analysis');
      });

      it('should pass for optimization-focused ideas', async () => {
        const idea = 'Want to improve our deployment process to reduce downtime';
        const result = await validator.validateIdeaQuick(idea);

        expect(result.verdict).toBe('PASS');
        expect(result.options.every(opt => opt.nextStep.length > 0)).toBe(true);
      });
    });

    describe('FAIL scenarios', () => {
      it('should fail for empty or too vague ideas', async () => {
        const idea = 'help me';
        const result = await validator.validateIdeaQuick(idea);

        expect(result.verdict).toBe('FAIL');
        expect(result.reasoning).toContain('too vague or empty');
        expect(result.options[0].title).toBe('Simplify & Retry');
        expect(result.options[1].title).toBe('Add Context');
        expect(result.options[2].title).toBe('Research First');
      });

      it('should fail for ideas without clear objectives', async () => {
        const idea = 'There are some issues with the system and things are not working properly';
        const result = await validator.validateIdeaQuick(idea);

        expect(result.verdict).toBe('FAIL');
        expect(result.reasoning).toContain('Missing clear business objective');
      });

      it('should fail for high complexity + quota risk combinations', async () => {
        const idea = 'Build a real-time machine learning system that processes all user data continuously and generates insights for each user';
        const result = await validator.validateIdeaQuick(idea);

        expect(result.verdict).toBe('FAIL');
        expect(result.reasoning).toContain('High complexity + quota risks');
      });

      it('should fail for quota-intensive ideas with small budget', async () => {
        const idea = 'I want to loop through all users and analyze each one individually to improve performance';
        const context: QuickValidationContext = {
          budget_range: 'small'
        };
        const result = await validator.validateIdeaQuick(idea, context);

        expect(result.verdict).toBe('FAIL');
        expect(result.reasoning).toContain('Quota-intensive approach with limited budget');
      });
    });

    describe('Context-based validation', () => {
      it('should fail complex system work with small team', async () => {
        const idea = 'Build a comprehensive platform architecture with multiple integrations';
        const context: QuickValidationContext = {
          team_size: 1
        };
        const result = await validator.validateIdeaQuick(idea, context);

        expect(result.verdict).toBe('FAIL');
        expect(result.reasoning).toContain('Complex system work requires larger team');
      });

      it('should fail broad scope with high urgency', async () => {
        const idea = 'Create a comprehensive solution that handles all user management tasks';
        const context: QuickValidationContext = {
          urgency: 'high'
        };
        const result = await validator.validateIdeaQuick(idea, context);

        expect(result.verdict).toBe('FAIL');
        expect(result.reasoning).toContain('High urgency conflicts with broad scope');
      });

      it('should adjust options based on complexity and urgency', async () => {
        const complexIdea = 'Build a complex system with multiple integrations';
        const simpleIdea = 'Create a simple user form';
        
        const complexResult = await validator.validateIdeaQuick(complexIdea);
        const simpleUrgentResult = await validator.validateIdeaQuick(simpleIdea, { urgency: 'high' });

        // Complex ideas should get design options
        expect(complexResult.options[2].title).toBe('Design Options');
        
        // Simple urgent ideas should get direct implementation
        expect(simpleUrgentResult.options[2].title).toBe('Direct Implementation');
      });
    });

    describe('Option generation', () => {
      it('should provide exactly 3 options with proper structure', async () => {
        const idea = 'I want to automate report generation';
        const result = await validator.validateIdeaQuick(idea);

        expect(result.options).toHaveLength(3);
        
        result.options.forEach((option, index) => {
          expect(option.id).toBe(['A', 'B', 'C'][index]);
          expect(option.title).toBeTruthy();
          expect(option.description).toBeTruthy();
          expect(option.tradeoffs).toBeInstanceOf(Array);
          expect(option.tradeoffs.length).toBeGreaterThan(0);
          expect(option.nextStep).toBeTruthy();
        });
      });

      it('should provide different options for PASS vs FAIL', async () => {
        const passIdea = 'I want to create a user dashboard to improve visibility';
        const failIdea = 'help';

        const passResult = await validator.validateIdeaQuick(passIdea);
        const failResult = await validator.validateIdeaQuick(failIdea);

        // PASS options should focus on next steps
        expect(passResult.options[0].title).toBe('Quick Requirements');
        expect(passResult.options[1].title).toBe('Full Analysis');

        // FAIL options should focus on improvement
        expect(failResult.options[0].title).toBe('Simplify & Retry');
        expect(failResult.options[1].title).toBe('Add Context');
        expect(failResult.options[2].title).toBe('Research First');
      });
    });

    describe('Error handling', () => {
      it('should handle validation errors gracefully', async () => {
        // Mock an error in the validation process
        const originalMethod = validator['performQuickValidation'];
        validator['performQuickValidation'] = jest.fn().mockImplementation(() => {
          throw new Error('Validation service unavailable');
        });

        const result = await validator.validateIdeaQuick('test idea');

        expect(result.verdict).toBe('FAIL');
        expect(result.reasoning).toContain('Validation error');
        expect(result.options).toHaveLength(3);
        expect(result.options[0].title).toBe('Rephrase Idea');

        // Restore original method
        validator['performQuickValidation'] = originalMethod;
      });

      it('should provide error recovery options', async () => {
        // Force an error
        const originalMethod = validator['performQuickValidation'];
        validator['performQuickValidation'] = jest.fn().mockImplementation(() => {
          throw new Error('Test error');
        });

        const result = await validator.validateIdeaQuick('test idea');

        expect(result.options[0].title).toBe('Rephrase Idea');
        expect(result.options[1].title).toBe('Break Into Parts');
        expect(result.options[2].title).toBe('Get Help');

        // Restore original method
        validator['performQuickValidation'] = originalMethod;
      });
    });

    describe('Performance', () => {
      it('should complete validation quickly', async () => {
        const idea = 'I want to automate user notifications';
        const startTime = Date.now();
        
        const result = await validator.validateIdeaQuick(idea);
        
        const actualTime = Date.now() - startTime;
        expect(actualTime).toBeLessThan(1000); // Should complete in under 1 second
        expect(result.processingTimeMs).toBeLessThan(1000);
        expect(result.processingTimeMs).toBeGreaterThan(0);
      });

      it('should track processing time accurately', async () => {
        const idea = 'Create a simple user profile page';
        const result = await validator.validateIdeaQuick(idea);

        expect(result.processingTimeMs).toBeGreaterThan(0);
        expect(typeof result.processingTimeMs).toBe('number');
      });
    });

    describe('Business objective detection', () => {
      it('should detect various objective indicators', async () => {
        const objectives = [
          'I want to improve user experience',
          'Need to reduce processing time',
          'Should automate manual tasks',
          'Help users find information faster',
          'Create a better workflow',
          'Build a new feature',
          'Generate reports automatically'
        ];

        for (const objective of objectives) {
          const result = await validator.validateIdeaQuick(objective);
          expect(result.verdict).toBe('PASS');
        }
      });

      it('should fail when no clear objective is present', async () => {
        const nonObjectives = [
          'The system has some problems',
          'Users are complaining about things',
          'There are issues with the current setup',
          'Something is not working right'
        ];

        for (const nonObjective of nonObjectives) {
          const result = await validator.validateIdeaQuick(nonObjective);
          expect(result.verdict).toBe('FAIL');
          expect(result.reasoning).toContain('Missing clear business objective');
        }
      });
    });

    describe('Quota risk detection', () => {
      it('should identify quota-intensive patterns', async () => {
        const riskyPatterns = [
          'loop through all users',
          'for each item in the database',
          'iterate over every record',
          'process all files individually',
          'scan everything in the system',
          'check every single entry',
          'analyze all data points',
          'generate multiple reports for each user'
        ];

        for (const pattern of riskyPatterns) {
          const idea = `I want to ${pattern} to improve our system`;
          const result = await validator.validateIdeaQuick(idea, { budget_range: 'small' });
          
          expect(result.verdict).toBe('FAIL');
          expect(result.reasoning).toContain('Quota-intensive approach');
        }
      });
    });

    describe('Complexity assessment', () => {
      it('should identify high complexity indicators', async () => {
        const complexIndicators = [
          'real-time processing',
          'machine learning model',
          'big data analytics',
          'stream processing',
          'complex algorithms',
          'heavy computation'
        ];

        for (const indicator of complexIndicators) {
          const idea = `I want to build a system with ${indicator} and loop through all users to improve efficiency`;
          const context: QuickValidationContext = {
            budget_range: 'large' // Use large budget to avoid budget-related failure
          };
          const result = await validator.validateIdeaQuick(idea, context);
          

          expect(result.verdict).toBe('FAIL');
          expect(result.reasoning).toContain('High complexity + quota risks');
        }
      });
    });
  });
});