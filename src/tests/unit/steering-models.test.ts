/**
 * Unit tests for steering file interfaces and data models
 */

import {
  DocumentType,
  InclusionRule,
  FrontMatter,
  SteeringContext,
  SteeringFile,
  SaveResult,
  ConflictInfo,
  SteeringFileTemplate,
  SteeringFileGenerationOptions,
  SteeringFileStats
} from '../../models/steering';

describe('Steering File Models', () => {
  describe('DocumentType enum', () => {
    it('should have all required document types', () => {
      expect(DocumentType.REQUIREMENTS).toBe('requirements');
      expect(DocumentType.DESIGN).toBe('design');
      expect(DocumentType.ONEPAGER).toBe('onepager');
      expect(DocumentType.PRFAQ).toBe('prfaq');
      expect(DocumentType.TASKS).toBe('tasks');
    });

    it('should have exactly 5 document types', () => {
      const documentTypes = Object.values(DocumentType);
      expect(documentTypes).toHaveLength(5);
    });
  });

  describe('InclusionRule type', () => {
    it('should accept valid inclusion rule values', () => {
      const validRules: InclusionRule[] = ['always', 'fileMatch', 'manual'];
      
      validRules.forEach(rule => {
        expect(['always', 'fileMatch', 'manual']).toContain(rule);
      });
    });
  });

  describe('FrontMatter interface', () => {
    it('should create valid front matter with required fields', () => {
      const frontMatter: FrontMatter = {
        inclusion: 'always',
        generatedBy: 'pm-agent-intent-optimizer',
        generatedAt: '2024-01-01T00:00:00.000Z',
        featureName: 'test-feature',
        documentType: DocumentType.REQUIREMENTS
      };

      expect(frontMatter.inclusion).toBe('always');
      expect(frontMatter.generatedBy).toBe('pm-agent-intent-optimizer');
      expect(frontMatter.generatedAt).toBe('2024-01-01T00:00:00.000Z');
      expect(frontMatter.featureName).toBe('test-feature');
      expect(frontMatter.documentType).toBe(DocumentType.REQUIREMENTS);
    });

    it('should support optional fields', () => {
      const frontMatter: FrontMatter = {
        inclusion: 'fileMatch',
        fileMatchPattern: '*.md',
        generatedBy: 'pm-agent-intent-optimizer',
        generatedAt: '2024-01-01T00:00:00.000Z',
        featureName: 'test-feature',
        documentType: DocumentType.DESIGN,
        description: 'Test description'
      };

      expect(frontMatter.fileMatchPattern).toBe('*.md');
      expect(frontMatter.description).toBe('Test description');
    });
  });

  describe('SteeringContext interface', () => {
    it('should create valid steering context', () => {
      const context: SteeringContext = {
        featureName: 'user-authentication',
        projectName: 'my-project',
        relatedFiles: ['requirements.md', 'design.md'],
        inclusionRule: 'fileMatch',
        fileMatchPattern: 'auth*'
      };

      expect(context.featureName).toBe('user-authentication');
      expect(context.projectName).toBe('my-project');
      expect(context.relatedFiles).toEqual(['requirements.md', 'design.md']);
      expect(context.inclusionRule).toBe('fileMatch');
      expect(context.fileMatchPattern).toBe('auth*');
    });

    it('should work with minimal required fields', () => {
      const context: SteeringContext = {
        featureName: 'minimal-feature',
        relatedFiles: [],
        inclusionRule: 'always'
      };

      expect(context.featureName).toBe('minimal-feature');
      expect(context.relatedFiles).toEqual([]);
      expect(context.inclusionRule).toBe('always');
    });
  });

  describe('SteeringFile interface', () => {
    it('should create complete steering file object', () => {
      const frontMatter: FrontMatter = {
        inclusion: 'always',
        generatedBy: 'pm-agent-intent-optimizer',
        generatedAt: '2024-01-01T00:00:00.000Z',
        featureName: 'test-feature',
        documentType: DocumentType.REQUIREMENTS
      };

      const steeringFile: SteeringFile = {
        filename: 'test-feature-requirements.md',
        frontMatter,
        content: '# Test Content',
        references: ['#[[file:design.md]]'],
        fullPath: '.kiro/steering/test-feature-requirements.md'
      };

      expect(steeringFile.filename).toBe('test-feature-requirements.md');
      expect(steeringFile.frontMatter).toBe(frontMatter);
      expect(steeringFile.content).toBe('# Test Content');
      expect(steeringFile.references).toEqual(['#[[file:design.md]]']);
      expect(steeringFile.fullPath).toBe('.kiro/steering/test-feature-requirements.md');
    });
  });

  describe('SaveResult interface', () => {
    it('should create successful save result', () => {
      const result: SaveResult = {
        success: true,
        filename: 'test-file.md',
        action: 'created',
        message: 'File created successfully',
        fullPath: '.kiro/steering/test-file.md',
        warnings: ['Minor formatting issue']
      };

      expect(result.success).toBe(true);
      expect(result.filename).toBe('test-file.md');
      expect(result.action).toBe('created');
      expect(result.message).toBe('File created successfully');
      expect(result.fullPath).toBe('.kiro/steering/test-file.md');
      expect(result.warnings).toEqual(['Minor formatting issue']);
    });

    it('should create failed save result', () => {
      const result: SaveResult = {
        success: false,
        filename: 'test-file.md',
        action: 'skipped',
        message: 'File already exists'
      };

      expect(result.success).toBe(false);
      expect(result.action).toBe('skipped');
      expect(result.message).toBe('File already exists');
    });

    it('should validate action types', () => {
      const validActions = ['created', 'updated', 'versioned', 'skipped'];
      
      validActions.forEach(action => {
        const result: SaveResult = {
          success: true,
          filename: 'test.md',
          action: action as any,
          message: 'Test'
        };
        expect(validActions).toContain(result.action);
      });
    });
  });

  describe('ConflictInfo interface', () => {
    it('should create conflict info with conflict', () => {
      const conflictInfo: ConflictInfo = {
        exists: true,
        existingFile: '.kiro/steering/existing-file.md',
        suggestedAction: 'version',
        reason: 'File already exists with different content',
        suggestedFilename: 'existing-file-v2.md'
      };

      expect(conflictInfo.exists).toBe(true);
      expect(conflictInfo.existingFile).toBe('.kiro/steering/existing-file.md');
      expect(conflictInfo.suggestedAction).toBe('version');
      expect(conflictInfo.reason).toBe('File already exists with different content');
      expect(conflictInfo.suggestedFilename).toBe('existing-file-v2.md');
    });

    it('should create conflict info without conflict', () => {
      const conflictInfo: ConflictInfo = {
        exists: false,
        suggestedAction: 'skip'
      };

      expect(conflictInfo.exists).toBe(false);
      expect(conflictInfo.suggestedAction).toBe('skip');
    });

    it('should validate suggested action types', () => {
      const validActions = ['update', 'version', 'rename', 'skip'];
      
      validActions.forEach(action => {
        const conflictInfo: ConflictInfo = {
          exists: true,
          suggestedAction: action as any
        };
        expect(validActions).toContain(conflictInfo.suggestedAction);
      });
    });
  });

  describe('SteeringFileTemplate interface', () => {
    it('should create valid template', () => {
      const template: SteeringFileTemplate = {
        documentType: DocumentType.REQUIREMENTS,
        defaultInclusionRule: 'fileMatch',
        defaultFileMatchPattern: 'requirements*',
        template: '# {featureName}\n\n{content}',
        requiredPlaceholders: ['featureName', 'content'],
        validateContent: (content: string) => content.length > 0
      };

      expect(template.documentType).toBe(DocumentType.REQUIREMENTS);
      expect(template.defaultInclusionRule).toBe('fileMatch');
      expect(template.defaultFileMatchPattern).toBe('requirements*');
      expect(template.template).toBe('# {featureName}\n\n{content}');
      expect(template.requiredPlaceholders).toEqual(['featureName', 'content']);
      expect(template.validateContent).toBeDefined();
      expect(template.validateContent!('test')).toBe(true);
      expect(template.validateContent!('')).toBe(false);
    });

    it('should work without optional fields', () => {
      const template: SteeringFileTemplate = {
        documentType: DocumentType.DESIGN,
        defaultInclusionRule: 'always',
        template: '# Design\n\n{content}',
        requiredPlaceholders: ['content']
      };

      expect(template.documentType).toBe(DocumentType.DESIGN);
      expect(template.defaultInclusionRule).toBe('always');
      expect(template.defaultFileMatchPattern).toBeUndefined();
      expect(template.validateContent).toBeUndefined();
    });
  });

  describe('SteeringFileGenerationOptions interface', () => {
    it('should create complete generation options', () => {
      const options: SteeringFileGenerationOptions = {
        autoSave: true,
        promptForConfirmation: false,
        includeReferences: true,
        namingStrategy: 'feature-based',
        filenamePrefix: 'pm-',
        overwriteExisting: false
      };

      expect(options.autoSave).toBe(true);
      expect(options.promptForConfirmation).toBe(false);
      expect(options.includeReferences).toBe(true);
      expect(options.namingStrategy).toBe('feature-based');
      expect(options.filenamePrefix).toBe('pm-');
      expect(options.overwriteExisting).toBe(false);
    });

    it('should work with minimal options', () => {
      const options: SteeringFileGenerationOptions = {
        autoSave: false,
        promptForConfirmation: true,
        includeReferences: false,
        overwriteExisting: true
      };

      expect(options.autoSave).toBe(false);
      expect(options.promptForConfirmation).toBe(true);
      expect(options.includeReferences).toBe(false);
      expect(options.overwriteExisting).toBe(true);
    });

    it('should validate naming strategy types', () => {
      const validStrategies = ['feature-based', 'timestamp-based', 'custom'];
      
      validStrategies.forEach(strategy => {
        const options: SteeringFileGenerationOptions = {
          autoSave: true,
          promptForConfirmation: false,
          includeReferences: true,
          namingStrategy: strategy as any,
          overwriteExisting: false
        };
        expect(validStrategies).toContain(options.namingStrategy);
      });
    });
  });

  describe('SteeringFileStats interface', () => {
    it('should create complete statistics', () => {
      const stats: SteeringFileStats = {
        filesCreated: 5,
        filesUpdated: 2,
        conflictsEncountered: 1,
        documentTypesProcessed: [DocumentType.REQUIREMENTS, DocumentType.DESIGN],
        processingTimeMs: 1500
      };

      expect(stats.filesCreated).toBe(5);
      expect(stats.filesUpdated).toBe(2);
      expect(stats.conflictsEncountered).toBe(1);
      expect(stats.documentTypesProcessed).toEqual([DocumentType.REQUIREMENTS, DocumentType.DESIGN]);
      expect(stats.processingTimeMs).toBe(1500);
    });

    it('should handle zero values', () => {
      const stats: SteeringFileStats = {
        filesCreated: 0,
        filesUpdated: 0,
        conflictsEncountered: 0,
        documentTypesProcessed: [],
        processingTimeMs: 0
      };

      expect(stats.filesCreated).toBe(0);
      expect(stats.filesUpdated).toBe(0);
      expect(stats.conflictsEncountered).toBe(0);
      expect(stats.documentTypesProcessed).toEqual([]);
      expect(stats.processingTimeMs).toBe(0);
    });
  });

  describe('Type validation and constraints', () => {
    it('should enforce required fields in interfaces', () => {
      // This test ensures TypeScript compilation catches missing required fields
      // The actual validation happens at compile time
      
      const createFrontMatter = (): FrontMatter => ({
        inclusion: 'always',
        generatedBy: 'test',
        generatedAt: '2024-01-01T00:00:00.000Z',
        featureName: 'test',
        documentType: DocumentType.REQUIREMENTS
      });

      const frontMatter = createFrontMatter();
      expect(frontMatter).toBeDefined();
    });

    it('should handle optional fields correctly', () => {
      const contextWithOptionals: SteeringContext = {
        featureName: 'test',
        relatedFiles: [],
        inclusionRule: 'fileMatch',
        fileMatchPattern: '*.ts',
        description: 'Test context'
      };

      const contextMinimal: SteeringContext = {
        featureName: 'test',
        relatedFiles: [],
        inclusionRule: 'always'
      };

      expect(contextWithOptionals.fileMatchPattern).toBe('*.ts');
      expect(contextWithOptionals.description).toBe('Test context');
      expect(contextMinimal.fileMatchPattern).toBeUndefined();
      expect(contextMinimal.description).toBeUndefined();
    });
  });
});