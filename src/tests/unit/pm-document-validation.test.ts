// Unit tests for PM document input validation

import {
  validateManagementOnePagerInputs,
  validatePRFAQInputs,
  validateRequirementsGenerationInputs,
  validateDesignOptionsInputs,
  validateTaskPlanInputs,
  validateStructuredDocument,
  PMDocumentValidationError
} from '../../utils/pm-document-validation';
import { ROIInputs, RequirementsContext, TaskLimits } from '../../components/pm-document-generator';

describe('PM Document Validation', () => {
  describe('validateManagementOnePagerInputs', () => {
    const validRequirements = 'This is a comprehensive requirements document that describes the user needs and business objectives for our new feature.';
    const validDesign = 'This is a detailed design document that outlines the architecture and implementation approach for the system.';

    it('should pass with valid inputs', () => {
      expect(() => {
        validateManagementOnePagerInputs(validRequirements, validDesign);
      }).not.toThrow();
    });

    it('should pass with valid inputs including tasks and ROI', () => {
      const validTasks = 'Task 1: Implement core functionality\nTask 2: Add validation\nTask 3: Write tests';
      const validROI: ROIInputs = {
        cost_naive: 50000,
        cost_balanced: 150000,
        cost_bold: 300000
      };

      expect(() => {
        validateManagementOnePagerInputs(validRequirements, validDesign, validTasks, validROI);
      }).not.toThrow();
    });

    it('should throw error for missing requirements', () => {
      expect(() => {
        validateManagementOnePagerInputs('', validDesign);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for missing design', () => {
      expect(() => {
        validateManagementOnePagerInputs(validRequirements, '');
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for requirements too short', () => {
      expect(() => {
        validateManagementOnePagerInputs('short', validDesign);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for design too short', () => {
      expect(() => {
        validateManagementOnePagerInputs(validRequirements, 'short');
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for requirements too long', () => {
      const tooLong = 'x'.repeat(50001);
      expect(() => {
        validateManagementOnePagerInputs(tooLong, validDesign);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for design too long', () => {
      const tooLong = 'x'.repeat(50001);
      expect(() => {
        validateManagementOnePagerInputs(validRequirements, tooLong);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for invalid tasks type', () => {
      expect(() => {
        validateManagementOnePagerInputs(validRequirements, validDesign, 123 as any);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for tasks too long', () => {
      const tooLongTasks = 'x'.repeat(30001);
      expect(() => {
        validateManagementOnePagerInputs(validRequirements, validDesign, tooLongTasks);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for invalid ROI inputs', () => {
      const invalidROI: ROIInputs = {
        cost_naive: -1000 // negative cost
      };

      expect(() => {
        validateManagementOnePagerInputs(validRequirements, validDesign, undefined, invalidROI);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for unreasonably high ROI costs', () => {
      const invalidROI: ROIInputs = {
        cost_naive: 20000000 // $20M - too high
      };

      expect(() => {
        validateManagementOnePagerInputs(validRequirements, validDesign, undefined, invalidROI);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for illogical ROI cost relationships', () => {
      const invalidROI: ROIInputs = {
        cost_naive: 10000,
        cost_balanced: 100000 // 10x naive cost - too high
      };

      expect(() => {
        validateManagementOnePagerInputs(validRequirements, validDesign, undefined, invalidROI);
      }).toThrow(PMDocumentValidationError);
    });
  });

  describe('validatePRFAQInputs', () => {
    const validRequirements = 'This is a comprehensive requirements document that describes the user needs and business objectives for our new feature.';
    const validDesign = 'This is a detailed design document that outlines the architecture and implementation approach for the system.';

    it('should pass with valid inputs', () => {
      expect(() => {
        validatePRFAQInputs(validRequirements, validDesign);
      }).not.toThrow();
    });

    it('should pass with valid target date', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 3);
      const targetDate = futureDate.toISOString().split('T')[0];

      expect(() => {
        validatePRFAQInputs(validRequirements, validDesign, targetDate);
      }).not.toThrow();
    });

    it('should throw error for missing requirements', () => {
      expect(() => {
        validatePRFAQInputs('', validDesign);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for missing design', () => {
      expect(() => {
        validatePRFAQInputs(validRequirements, '');
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for invalid date format', () => {
      expect(() => {
        validatePRFAQInputs(validRequirements, validDesign, '2024/12/31');
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for past date', () => {
      const pastDate = '2020-01-01';
      expect(() => {
        validatePRFAQInputs(validRequirements, validDesign, pastDate);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for date too far in future', () => {
      const farFutureDate = '2030-01-01';
      expect(() => {
        validatePRFAQInputs(validRequirements, validDesign, farFutureDate);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for invalid target date type', () => {
      expect(() => {
        validatePRFAQInputs(validRequirements, validDesign, 123 as any);
      }).toThrow(PMDocumentValidationError);
    });
  });

  describe('validateRequirementsGenerationInputs', () => {
    const validRawIntent = 'I want to build a system that optimizes developer workflows and reduces quota consumption through intelligent analysis.';

    it('should pass with valid raw intent', () => {
      expect(() => {
        validateRequirementsGenerationInputs(validRawIntent);
      }).not.toThrow();
    });

    it('should pass with valid context', () => {
      const validContext: RequirementsContext = {
        roadmapTheme: 'Developer Productivity',
        budget: 500000,
        quotas: {
          maxVibes: 10000,
          maxSpecs: 1000
        },
        deadlines: 'Q2 2025 launch target'
      };

      expect(() => {
        validateRequirementsGenerationInputs(validRawIntent, validContext);
      }).not.toThrow();
    });

    it('should throw error for missing raw intent', () => {
      expect(() => {
        validateRequirementsGenerationInputs('');
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for raw intent too short', () => {
      expect(() => {
        validateRequirementsGenerationInputs('short');
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for raw intent too long', () => {
      const tooLong = 'x'.repeat(10001);
      expect(() => {
        validateRequirementsGenerationInputs(tooLong);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for test/placeholder content', () => {
      expect(() => {
        validateRequirementsGenerationInputs('test');
      }).toThrow(PMDocumentValidationError);

      expect(() => {
        validateRequirementsGenerationInputs('hello');
      }).toThrow(PMDocumentValidationError);

      expect(() => {
        validateRequirementsGenerationInputs('example');
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for invalid context budget', () => {
      const invalidContext: RequirementsContext = {
        budget: -1000 // negative budget
      };

      expect(() => {
        validateRequirementsGenerationInputs(validRawIntent, invalidContext);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for unreasonably high budget', () => {
      const invalidContext: RequirementsContext = {
        budget: 200000000 // $200M - too high
      };

      expect(() => {
        validateRequirementsGenerationInputs(validRawIntent, invalidContext);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for invalid quota values', () => {
      const invalidContext: RequirementsContext = {
        quotas: {
          maxVibes: -100 // negative vibes
        }
      };

      expect(() => {
        validateRequirementsGenerationInputs(validRawIntent, invalidContext);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for unreasonably high quota values', () => {
      const invalidContext: RequirementsContext = {
        quotas: {
          maxVibes: 200000 // too high
        }
      };

      expect(() => {
        validateRequirementsGenerationInputs(validRawIntent, invalidContext);
      }).toThrow(PMDocumentValidationError);
    });
  });

  describe('validateDesignOptionsInputs', () => {
    const validRequirements = 'This is a comprehensive requirements document that describes the user needs and business objectives for our new feature.';

    it('should pass with valid requirements', () => {
      expect(() => {
        validateDesignOptionsInputs(validRequirements);
      }).not.toThrow();
    });

    it('should throw error for missing requirements', () => {
      expect(() => {
        validateDesignOptionsInputs('');
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for requirements too short', () => {
      expect(() => {
        validateDesignOptionsInputs('short');
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for requirements too long', () => {
      const tooLong = 'x'.repeat(50001);
      expect(() => {
        validateDesignOptionsInputs(tooLong);
      }).toThrow(PMDocumentValidationError);
    });
  });

  describe('validateTaskPlanInputs', () => {
    const validDesign = 'This is a detailed design document that outlines the architecture and implementation approach for the system.';

    it('should pass with valid design', () => {
      expect(() => {
        validateTaskPlanInputs(validDesign);
      }).not.toThrow();
    });

    it('should pass with valid limits', () => {
      const validLimits: TaskLimits = {
        maxVibes: 5000,
        maxSpecs: 500,
        budgetUSD: 250000
      };

      expect(() => {
        validateTaskPlanInputs(validDesign, validLimits);
      }).not.toThrow();
    });

    it('should throw error for missing design', () => {
      expect(() => {
        validateTaskPlanInputs('');
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for design too short', () => {
      expect(() => {
        validateTaskPlanInputs('short');
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for design too long', () => {
      const tooLong = 'x'.repeat(50001);
      expect(() => {
        validateTaskPlanInputs(tooLong);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for invalid limits', () => {
      const invalidLimits: TaskLimits = {
        maxVibes: -100 // negative vibes
      };

      expect(() => {
        validateTaskPlanInputs(validDesign, invalidLimits);
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for unreasonably high limits', () => {
      const invalidLimits: TaskLimits = {
        budgetUSD: 200000000 // $200M - too high
      };

      expect(() => {
        validateTaskPlanInputs(validDesign, invalidLimits);
      }).toThrow(PMDocumentValidationError);
    });
  });

  describe('validateStructuredDocument', () => {
    it('should pass with valid structured document', () => {
      const structuredDoc = `# Title\n\nThis is a paragraph.\n\n## Section\n\n- List item 1\n- List item 2`;
      
      expect(() => {
        validateStructuredDocument(structuredDoc, 'test', 'document');
      }).not.toThrow();
    });

    it('should throw error for empty document', () => {
      expect(() => {
        validateStructuredDocument('', 'test', 'document');
      }).toThrow(PMDocumentValidationError);
    });

    it('should throw error for document too short', () => {
      expect(() => {
        validateStructuredDocument('short', 'test', 'document');
      }).toThrow(PMDocumentValidationError);
    });

    it('should pass with unstructured but valid document', () => {
      const unstructuredDoc = 'This is a long paragraph without any structure but it contains enough content to be meaningful for analysis and processing.';
      
      expect(() => {
        validateStructuredDocument(unstructuredDoc, 'test', 'document');
      }).not.toThrow();
    });
  });

  describe('PMDocumentValidationError', () => {
    it('should create error with document type and field', () => {
      const error = new PMDocumentValidationError('Test message', 'management_onepager', 'requirements');
      
      expect(error.message).toBe('Test message');
      expect(error.documentType).toBe('management_onepager');
      expect(error.field).toBe('requirements');
      expect(error.name).toBe('PMDocumentValidationError');
    });

    it('should create error without document type and field', () => {
      const error = new PMDocumentValidationError('Test message');
      
      expect(error.message).toBe('Test message');
      expect(error.documentType).toBeUndefined();
      expect(error.field).toBeUndefined();
    });
  });

  describe('Content validation warnings', () => {
    it('should log warning for generic requirements content', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const genericRequirements = 'Build a system that does something useful for users and provides value to the business.';
      
      expect(() => {
        validateManagementOnePagerInputs(genericRequirements, 'This is a detailed technical architecture with components and interfaces.');
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Requirements document for management_onepager appears to be generic')
      );
      
      consoleSpy.mockRestore();
    });

    it('should log warning for generic design content', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const genericDesign = 'Standard architecture with typical design patterns and basic implementation approach.';
      
      expect(() => {
        validateManagementOnePagerInputs('This is a comprehensive requirements document with user stories and acceptance criteria.', genericDesign);
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Design document for management_onepager appears to be generic')
      );
      
      consoleSpy.mockRestore();
    });

    it('should log warning for unstructured long document', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const longUnstructured = 'This is a very long document without any structure like headers or lists. '.repeat(50);
      
      expect(() => {
        validateStructuredDocument(longUnstructured, 'test', 'document');
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: document for test appears to lack structure')
      );
      
      consoleSpy.mockRestore();
    });
  });
});