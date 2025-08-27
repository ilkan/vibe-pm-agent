// Unit tests for validation utilities

import { 
  validateRawIntent, 
  validateOptionalParams, 
  validateParsedIntent,
  validateWorkflow,
  validateConsultingTechniques,
  validateStringArray,
  validatePositiveNumber,
  validateNonEmptyString,
  ValidationError 
} from '../../utils/validation';
import { OptionalParams, ParsedIntent, Workflow, ConsultingTechnique } from '../../models';

describe('Validation Utilities', () => {
  describe('validateRawIntent', () => {
    it('should accept valid intent strings', () => {
      const validIntent = 'I want to create a user authentication system with login and registration';
      expect(() => validateRawIntent(validIntent)).not.toThrow();
    });

    it('should reject empty or null intent', () => {
      expect(() => validateRawIntent('')).toThrow(ValidationError);
      expect(() => validateRawIntent(null as any)).toThrow(ValidationError);
      expect(() => validateRawIntent(undefined as any)).toThrow(ValidationError);
    });

    it('should reject intent that is too short', () => {
      expect(() => validateRawIntent('short')).toThrow(ValidationError);
    });

    it('should reject intent that is too long', () => {
      const longIntent = 'a'.repeat(5001);
      expect(() => validateRawIntent(longIntent)).toThrow(ValidationError);
    });

    it('should reject test or greeting inputs', () => {
      expect(() => validateRawIntent('test')).toThrow(ValidationError);
      expect(() => validateRawIntent('hello')).toThrow(ValidationError);
      expect(() => validateRawIntent('hi')).toThrow(ValidationError);
      expect(() => validateRawIntent('a')).toThrow(ValidationError);
    });
  });

  describe('validateOptionalParams', () => {
    it('should accept valid optional parameters', () => {
      const validParams: OptionalParams = {
        expectedUserVolume: 100,
        costConstraints: {
          maxVibes: 50,
          maxSpecs: 10,
          maxCostDollars: 25.00
        },
        performanceSensitivity: 'high'
      };

      expect(() => validateOptionalParams(validParams)).not.toThrow();
    });

    it('should reject negative user volume', () => {
      const invalidParams: OptionalParams = {
        expectedUserVolume: -1
      };

      expect(() => validateOptionalParams(invalidParams)).toThrow(ValidationError);
    });

    it('should reject invalid performance sensitivity', () => {
      const invalidParams: OptionalParams = {
        performanceSensitivity: 'invalid' as any
      };

      expect(() => validateOptionalParams(invalidParams)).toThrow(ValidationError);
    });

    it('should reject negative cost constraints', () => {
      const invalidParams: OptionalParams = {
        costConstraints: {
          maxVibes: -1
        }
      };

      expect(() => validateOptionalParams(invalidParams)).toThrow(ValidationError);
    });

    it('should reject unreasonably high user volume', () => {
      const invalidParams: OptionalParams = {
        expectedUserVolume: 2000000
      };

      expect(() => validateOptionalParams(invalidParams)).toThrow(ValidationError);
    });

    it('should reject unreasonably high cost constraints', () => {
      const invalidParams: OptionalParams = {
        costConstraints: {
          maxVibes: 20000
        }
      };

      expect(() => validateOptionalParams(invalidParams)).toThrow(ValidationError);
    });
  });

  describe('validateParsedIntent', () => {
    const validParsedIntent: ParsedIntent = {
      businessObjective: 'Create user authentication system',
      technicalRequirements: [{
        type: 'processing',
        description: 'Handle user login',
        complexity: 'medium',
        quotaImpact: 'moderate'
      }],
      dataSourcesNeeded: ['user_data'],
      operationsRequired: [{
        id: 'op-1',
        type: 'processing',
        description: 'User authentication',
        estimatedQuotaCost: 3
      }],
      potentialRisks: []
    };

    it('should accept valid parsed intent', () => {
      expect(() => validateParsedIntent(validParsedIntent)).not.toThrow();
    });

    it('should reject null or undefined intent', () => {
      expect(() => validateParsedIntent(null as any)).toThrow(ValidationError);
      expect(() => validateParsedIntent(undefined as any)).toThrow(ValidationError);
    });

    it('should reject intent with empty business objective', () => {
      const invalidIntent = { ...validParsedIntent, businessObjective: '' };
      expect(() => validateParsedIntent(invalidIntent)).toThrow(ValidationError);
    });

    it('should reject intent with no operations', () => {
      const invalidIntent = { ...validParsedIntent, operationsRequired: [] };
      expect(() => validateParsedIntent(invalidIntent)).toThrow(ValidationError);
    });

    it('should reject operations with invalid types', () => {
      const invalidIntent: ParsedIntent = {
        ...validParsedIntent,
        operationsRequired: [{
          id: 'op-1',
          type: 'invalid' as any,
          description: 'Test',
          estimatedQuotaCost: 1
        }]
      };
      expect(() => validateParsedIntent(invalidIntent)).toThrow(ValidationError);
    });

    it('should reject operations with negative quota cost', () => {
      const invalidIntent: ParsedIntent = {
        ...validParsedIntent,
        operationsRequired: [{
          id: 'op-1',
          type: 'processing',
          description: 'Test',
          estimatedQuotaCost: -1
        }]
      };
      expect(() => validateParsedIntent(invalidIntent)).toThrow(ValidationError);
    });
  });

  describe('validateWorkflow', () => {
    const validWorkflow: Workflow = {
      id: 'workflow-1',
      steps: [{
        id: 'step-1',
        type: 'processing',
        description: 'Process data',
        inputs: [],
        outputs: [],
        quotaCost: 2
      }],
      dataFlow: [],
      estimatedComplexity: 1
    };

    it('should accept valid workflow', () => {
      expect(() => validateWorkflow(validWorkflow)).not.toThrow();
    });

    it('should reject null or undefined workflow', () => {
      expect(() => validateWorkflow(null as any)).toThrow(ValidationError);
      expect(() => validateWorkflow(undefined as any)).toThrow(ValidationError);
    });

    it('should reject workflow with empty steps', () => {
      const invalidWorkflow = { ...validWorkflow, steps: [] };
      expect(() => validateWorkflow(invalidWorkflow)).toThrow(ValidationError);
    });

    it('should reject workflow with invalid step type', () => {
      const invalidWorkflow = {
        ...validWorkflow,
        steps: [{
          id: 'step-1',
          type: 'invalid' as any,
          description: 'Test',
          inputs: [],
          outputs: [],
          quotaCost: 1
        }]
      };
      expect(() => validateWorkflow(invalidWorkflow)).toThrow(ValidationError);
    });

    it('should reject workflow with negative complexity', () => {
      const invalidWorkflow = { ...validWorkflow, estimatedComplexity: -1 };
      expect(() => validateWorkflow(invalidWorkflow)).toThrow(ValidationError);
    });
  });

  describe('validateConsultingTechniques', () => {
    const validTechniques: ConsultingTechnique[] = [{
      name: 'MECE',
      relevanceScore: 0.8,
      applicableScenarios: ['analysis']
    }];

    it('should accept valid consulting techniques', () => {
      expect(() => validateConsultingTechniques(validTechniques)).not.toThrow();
    });

    it('should reject empty techniques array', () => {
      expect(() => validateConsultingTechniques([])).toThrow(ValidationError);
    });

    it('should reject techniques with invalid names', () => {
      const invalidTechniques: ConsultingTechnique[] = [{
        name: 'Invalid' as any,
        relevanceScore: 0.5,
        applicableScenarios: ['test']
      }];
      expect(() => validateConsultingTechniques(invalidTechniques)).toThrow(ValidationError);
    });

    it('should reject techniques with invalid relevance scores', () => {
      const invalidTechniques: ConsultingTechnique[] = [{
        name: 'MECE',
        relevanceScore: 1.5,
        applicableScenarios: ['test']
      }];
      expect(() => validateConsultingTechniques(invalidTechniques)).toThrow(ValidationError);
    });
  });

  describe('validateStringArray', () => {
    it('should accept valid string arrays', () => {
      expect(() => validateStringArray(['a', 'b', 'c'], 'test')).not.toThrow();
    });

    it('should reject non-arrays', () => {
      expect(() => validateStringArray('not array' as any, 'test')).toThrow(ValidationError);
    });

    it('should reject arrays with empty strings', () => {
      expect(() => validateStringArray(['a', '', 'c'], 'test')).toThrow(ValidationError);
    });

    it('should reject arrays with non-strings', () => {
      expect(() => validateStringArray(['a', 123, 'c'] as any, 'test')).toThrow(ValidationError);
    });
  });

  describe('validatePositiveNumber', () => {
    it('should accept positive numbers', () => {
      expect(() => validatePositiveNumber(5, 'test')).not.toThrow();
      expect(() => validatePositiveNumber(0, 'test')).not.toThrow();
    });

    it('should reject negative numbers', () => {
      expect(() => validatePositiveNumber(-1, 'test')).toThrow(ValidationError);
    });

    it('should reject non-numbers', () => {
      expect(() => validatePositiveNumber('5' as any, 'test')).toThrow(ValidationError);
      expect(() => validatePositiveNumber(NaN, 'test')).toThrow(ValidationError);
    });
  });

  describe('validateNonEmptyString', () => {
    it('should accept non-empty strings', () => {
      expect(() => validateNonEmptyString('valid', 'test')).not.toThrow();
    });

    it('should reject empty strings', () => {
      expect(() => validateNonEmptyString('', 'test')).toThrow(ValidationError);
      expect(() => validateNonEmptyString('   ', 'test')).toThrow(ValidationError);
    });

    it('should reject non-strings', () => {
      expect(() => validateNonEmptyString(123 as any, 'test')).toThrow(ValidationError);
      expect(() => validateNonEmptyString(null as any, 'test')).toThrow(ValidationError);
    });
  });
});