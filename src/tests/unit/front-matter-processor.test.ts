/**
 * Unit tests for FrontMatterProcessor component
 */

import { FrontMatterProcessor } from '../../components/front-matter-processor/index';
import { DocumentType, SteeringContext, FrontMatter } from '../../models/steering';

describe('FrontMatterProcessor', () => {
  let processor: FrontMatterProcessor;

  beforeEach(() => {
    processor = new FrontMatterProcessor();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const config = processor.getConfig();
      expect(config.generatorId).toBe('vibe-pm-agent');
      expect(config.includeDescription).toBe(true);
      expect(config.timestampFormat).toBe('iso');
    });

    it('should accept custom configuration', () => {
      const customProcessor = new FrontMatterProcessor({
        generatorId: 'custom-generator',
        includeDescription: false,
        timestampFormat: 'unix'
      });
      
      const config = customProcessor.getConfig();
      expect(config.generatorId).toBe('custom-generator');
      expect(config.includeDescription).toBe(false);
      expect(config.timestampFormat).toBe('unix');
    });
  });

  describe('generateFrontMatter', () => {
    const baseContext: SteeringContext = {
      featureName: 'user-authentication',
      projectName: 'test-project',
      relatedFiles: ['auth.ts', 'user.model.ts'],
      inclusionRule: 'fileMatch',
      fileMatchPattern: 'auth*'
    };

    it('should generate front-matter for requirements document', () => {
      const frontMatter = processor.generateFrontMatter(DocumentType.REQUIREMENTS, baseContext);
      
      expect(frontMatter.inclusion).toBe('fileMatch');
      expect(frontMatter.fileMatchPattern).toBe('auth*');
      expect(frontMatter.generatedBy).toBe('vibe-pm-agent');
      expect(frontMatter.featureName).toBe('user-authentication');
      expect(frontMatter.documentType).toBe(DocumentType.REQUIREMENTS);
      expect(frontMatter.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO format
    });

    it('should generate front-matter for design document', () => {
      const frontMatter = processor.generateFrontMatter(DocumentType.DESIGN, baseContext);
      
      expect(frontMatter.inclusion).toBe('fileMatch');
      expect(frontMatter.documentType).toBe(DocumentType.DESIGN);
      expect(frontMatter.fileMatchPattern).toBe('auth*');
    });

    it('should generate front-matter for one-pager document with manual inclusion', () => {
      const frontMatter = processor.generateFrontMatter(DocumentType.ONEPAGER, baseContext);
      
      expect(frontMatter.inclusion).toBe('fileMatch'); // Uses context rule
      expect(frontMatter.documentType).toBe(DocumentType.ONEPAGER);
    });

    it('should use default inclusion rules when not specified in context', () => {
      const contextWithoutRule: SteeringContext = {
        featureName: 'test-feature',
        relatedFiles: [],
        inclusionRule: 'always' // This will be overridden by context
      };

      const requirementsFM = processor.generateFrontMatter(DocumentType.REQUIREMENTS, {
        ...contextWithoutRule,
        inclusionRule: undefined as any
      });
      expect(requirementsFM.inclusion).toBe('fileMatch'); // Default for requirements

      const onePagerFM = processor.generateFrontMatter(DocumentType.ONEPAGER, {
        ...contextWithoutRule,
        inclusionRule: undefined as any
      });
      expect(onePagerFM.inclusion).toBe('manual'); // Default for one-pager
    });

    it('should use default file match patterns when not specified', () => {
      const contextWithoutPattern: SteeringContext = {
        featureName: 'test-feature',
        relatedFiles: [],
        inclusionRule: 'fileMatch'
      };

      const requirementsFM = processor.generateFrontMatter(DocumentType.REQUIREMENTS, contextWithoutPattern);
      expect(requirementsFM.fileMatchPattern).toBe('requirements*|spec*|*requirements*');

      const designFM = processor.generateFrontMatter(DocumentType.DESIGN, contextWithoutPattern);
      expect(designFM.fileMatchPattern).toBe('design*|architecture*|*design*|*arch*');

      const tasksFM = processor.generateFrontMatter(DocumentType.TASKS, contextWithoutPattern);
      expect(tasksFM.fileMatchPattern).toBe('tasks*|todo*|*tasks*|implementation*');
    });

    it('should not include fileMatchPattern for manual inclusion', () => {
      const manualContext: SteeringContext = {
        featureName: 'test-feature',
        relatedFiles: [],
        inclusionRule: 'manual'
      };

      const frontMatter = processor.generateFrontMatter(DocumentType.REQUIREMENTS, manualContext);
      expect(frontMatter.inclusion).toBe('manual');
      expect(frontMatter.fileMatchPattern).toBeUndefined();
    });

    it('should include description when provided and configured', () => {
      const contextWithDescription: SteeringContext = {
        featureName: 'test-feature',
        relatedFiles: [],
        inclusionRule: 'always',
        description: 'Test steering file for authentication'
      };

      const frontMatter = processor.generateFrontMatter(DocumentType.REQUIREMENTS, contextWithDescription);
      expect(frontMatter.description).toBe('Test steering file for authentication');
    });

    it('should not include description when includeDescription is false', () => {
      const processorNoDesc = new FrontMatterProcessor({ includeDescription: false });
      const contextWithDescription: SteeringContext = {
        featureName: 'test-feature',
        relatedFiles: [],
        inclusionRule: 'always',
        description: 'Test description'
      };

      const frontMatter = processorNoDesc.generateFrontMatter(DocumentType.REQUIREMENTS, contextWithDescription);
      expect(frontMatter.description).toBeUndefined();
    });
  });

  describe('generateTimestamp', () => {
    it('should generate ISO timestamp by default', () => {
      const timestamp = processor.generateTimestamp();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(() => new Date(timestamp)).not.toThrow();
    });

    it('should generate unix timestamp when configured', () => {
      const unixProcessor = new FrontMatterProcessor({ timestampFormat: 'unix' });
      const timestamp = unixProcessor.generateTimestamp();
      expect(timestamp).toMatch(/^\d+$/);
      expect(parseInt(timestamp)).toBeGreaterThan(1600000000); // After 2020
    });

    it('should use custom timestamp formatter when provided', () => {
      const customProcessor = new FrontMatterProcessor({
        timestampFormat: 'custom',
        customTimestampFormatter: () => '2024-01-01T00:00:00Z'
      });
      const timestamp = customProcessor.generateTimestamp();
      expect(timestamp).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('formatFrontMatter', () => {
    it('should format complete front-matter as YAML', () => {
      const frontMatter: FrontMatter = {
        inclusion: 'fileMatch',
        fileMatchPattern: 'auth*|user*',
        generatedBy: 'vibe-pm-agent',
        generatedAt: '2024-01-01T00:00:00Z',
        featureName: 'user-authentication',
        documentType: DocumentType.REQUIREMENTS,
        description: 'Authentication requirements guidance'
      };

      const formatted = processor.formatFrontMatter(frontMatter);
      const lines = formatted.split('\n');

      expect(lines[0]).toBe('---');
      expect(lines).toContain('inclusion: fileMatch');
      expect(lines).toContain("fileMatchPattern: 'auth*|user*'");
      expect(lines).toContain('generatedBy: vibe-pm-agent');
      expect(lines).toContain('generatedAt: 2024-01-01T00:00:00Z');
      expect(lines).toContain('featureName: user-authentication');
      expect(lines).toContain('documentType: requirements');
      expect(lines).toContain("description: 'Authentication requirements guidance'");
      expect(lines[lines.length - 2]).toBe('---');
      expect(lines[lines.length - 1]).toBe(''); // Empty line at end
    });

    it('should format front-matter without optional fields', () => {
      const frontMatter: FrontMatter = {
        inclusion: 'manual',
        generatedBy: 'vibe-pm-agent',
        generatedAt: '2024-01-01T00:00:00Z',
        featureName: 'test-feature',
        documentType: DocumentType.ONEPAGER
      };

      const formatted = processor.formatFrontMatter(frontMatter);
      expect(formatted).not.toContain('fileMatchPattern');
      expect(formatted).not.toContain('description');
      expect(formatted).toContain('inclusion: manual');
    });

    it('should escape single quotes in description', () => {
      const frontMatter: FrontMatter = {
        inclusion: 'always',
        generatedBy: 'test',
        generatedAt: '2024-01-01T00:00:00Z',
        featureName: 'test',
        documentType: DocumentType.REQUIREMENTS,
        description: "User's authentication requirements"
      };

      const formatted = processor.formatFrontMatter(frontMatter);
      expect(formatted).toContain("description: 'User''s authentication requirements'");
    });
  });

  describe('validateFrontMatter', () => {
    const validFrontMatter: FrontMatter = {
      inclusion: 'fileMatch',
      fileMatchPattern: 'auth*',
      generatedBy: 'vibe-pm-agent',
      generatedAt: '2024-01-01T00:00:00Z',
      featureName: 'user-authentication',
      documentType: DocumentType.REQUIREMENTS
    };

    it('should validate complete front-matter as valid', () => {
      const result = processor.validateFrontMatter(validFrontMatter);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidFrontMatter = {
        inclusion: 'fileMatch',
        // Missing other required fields
      } as FrontMatter;

      const result = processor.validateFrontMatter(invalidFrontMatter);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: generatedBy');
      expect(result.errors).toContain('Missing required field: generatedAt');
      expect(result.errors).toContain('Missing required field: featureName');
      expect(result.errors).toContain('Missing required field: documentType');
    });

    it('should require fileMatchPattern for fileMatch inclusion', () => {
      const frontMatterWithoutPattern: FrontMatter = {
        ...validFrontMatter,
        inclusion: 'fileMatch',
        fileMatchPattern: undefined
      };

      const result = processor.validateFrontMatter(frontMatterWithoutPattern);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('fileMatchPattern is required when inclusion is "fileMatch"');
    });

    it('should validate timestamp format', () => {
      const frontMatterWithInvalidDate: FrontMatter = {
        ...validFrontMatter,
        generatedAt: 'invalid-date'
      };

      const result = processor.validateFrontMatter(frontMatterWithInvalidDate);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('generatedAt must be a valid date string');
    });

    it('should allow manual inclusion without fileMatchPattern', () => {
      const manualFrontMatter: FrontMatter = {
        ...validFrontMatter,
        inclusion: 'manual',
        fileMatchPattern: undefined
      };

      const result = processor.validateFrontMatter(manualFrontMatter);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration partially', () => {
      processor.updateConfig({ generatorId: 'new-generator' });
      const config = processor.getConfig();
      expect(config.generatorId).toBe('new-generator');
      expect(config.includeDescription).toBe(true); // Should remain unchanged
    });

    it('should update multiple configuration options', () => {
      processor.updateConfig({
        generatorId: 'updated-generator',
        includeDescription: false,
        timestampFormat: 'unix'
      });
      
      const config = processor.getConfig();
      expect(config.generatorId).toBe('updated-generator');
      expect(config.includeDescription).toBe(false);
      expect(config.timestampFormat).toBe('unix');
    });
  });

  describe('integration with different document types', () => {
    const testCases = [
      {
        documentType: DocumentType.REQUIREMENTS,
        expectedInclusion: 'fileMatch' as const,
        expectedPattern: 'requirements*|spec*|*requirements*'
      },
      {
        documentType: DocumentType.DESIGN,
        expectedInclusion: 'fileMatch' as const,
        expectedPattern: 'design*|architecture*|*design*|*arch*'
      },
      {
        documentType: DocumentType.ONEPAGER,
        expectedInclusion: 'manual' as const,
        expectedPattern: undefined
      },
      {
        documentType: DocumentType.PRFAQ,
        expectedInclusion: 'manual' as const,
        expectedPattern: undefined
      },
      {
        documentType: DocumentType.TASKS,
        expectedInclusion: 'fileMatch' as const,
        expectedPattern: 'tasks*|todo*|*tasks*|implementation*'
      }
    ];

    testCases.forEach(({ documentType, expectedInclusion, expectedPattern }) => {
      it(`should generate appropriate front-matter for ${documentType} documents`, () => {
        const context: SteeringContext = {
          featureName: 'test-feature',
          relatedFiles: [],
          inclusionRule: undefined as any // Use defaults
        };

        const frontMatter = processor.generateFrontMatter(documentType, context);
        
        expect(frontMatter.documentType).toBe(documentType);
        expect(frontMatter.inclusion).toBe(expectedInclusion);
        
        if (expectedPattern) {
          expect(frontMatter.fileMatchPattern).toBe(expectedPattern);
        } else {
          expect(frontMatter.fileMatchPattern).toBeUndefined();
        }
      });
    });
  });
});