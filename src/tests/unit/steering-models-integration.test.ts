/**
 * Integration tests for steering file models to verify they work together correctly
 */

import {
  DocumentType,
  FrontMatter,
  SteeringContext,
  SteeringFile,
  SaveResult,
  ConflictInfo,
  SteeringFileTemplate,
  SteeringFileGenerationOptions
} from '../../models/steering';

describe('Steering File Models Integration', () => {
  describe('End-to-end workflow simulation', () => {
    it('should create a complete steering file workflow', () => {
      // Step 1: Create context for a requirements document
      const context: SteeringContext = {
        featureName: 'user-authentication',
        projectName: 'auth-system',
        relatedFiles: [
          '.kiro/specs/user-authentication/design.md',
          '.kiro/specs/user-authentication/tasks.md'
        ],
        inclusionRule: 'fileMatch',
        fileMatchPattern: 'auth*|user*|login*'
      };

      // Step 2: Create front matter
      const frontMatter: FrontMatter = {
        inclusion: context.inclusionRule,
        fileMatchPattern: context.fileMatchPattern,
        generatedBy: 'vibe-pm-agent',
        generatedAt: new Date().toISOString(),
        featureName: context.featureName,
        documentType: DocumentType.REQUIREMENTS,
        description: 'Requirements guidance for user authentication feature'
      };

      // Step 3: Create steering file
      const steeringFile: SteeringFile = {
        filename: `${context.featureName}-requirements.md`,
        frontMatter,
        content: `# Requirements Guidance: ${context.featureName}\n\nThis guidance contains requirements analysis...`,
        references: context.relatedFiles.map(file => `#[[file:${file}]]`),
        fullPath: `.kiro/steering/${context.featureName}-requirements.md`
      };

      // Step 4: Simulate save result
      const saveResult: SaveResult = {
        success: true,
        filename: steeringFile.filename,
        action: 'created',
        message: 'Steering file created successfully',
        fullPath: steeringFile.fullPath
      };

      // Verify the complete workflow
      expect(steeringFile.frontMatter.featureName).toBe(context.featureName);
      expect(steeringFile.references).toHaveLength(2);
      expect(steeringFile.references[0]).toBe('#[[file:.kiro/specs/user-authentication/design.md]]');
      expect(saveResult.success).toBe(true);
      expect(saveResult.action).toBe('created');
    });

    it('should handle conflict resolution workflow', () => {
      // Simulate a conflict scenario
      const conflictInfo: ConflictInfo = {
        exists: true,
        existingFile: '.kiro/steering/user-auth-requirements.md',
        suggestedAction: 'version',
        reason: 'File exists with different content',
        suggestedFilename: 'user-auth-requirements-v2.md'
      };

      // Create new steering file with versioned name
      const versionedFile: SteeringFile = {
        filename: conflictInfo.suggestedFilename!,
        frontMatter: {
          inclusion: 'fileMatch',
          fileMatchPattern: 'auth*',
          generatedBy: 'vibe-pm-agent',
          generatedAt: new Date().toISOString(),
          featureName: 'user-auth',
          documentType: DocumentType.REQUIREMENTS
        },
        content: '# Updated Requirements',
        references: []
      };

      const saveResult: SaveResult = {
        success: true,
        filename: versionedFile.filename,
        action: 'versioned',
        message: 'Created versioned file to avoid conflict'
      };

      expect(conflictInfo.suggestedAction).toBe('version');
      expect(versionedFile.filename).toBe('user-auth-requirements-v2.md');
      expect(saveResult.action).toBe('versioned');
    });

    it('should validate template usage workflow', () => {
      const template: SteeringFileTemplate = {
        documentType: DocumentType.DESIGN,
        defaultInclusionRule: 'fileMatch',
        defaultFileMatchPattern: 'design*|architecture*',
        template: `---
inclusion: {inclusion}
fileMatchPattern: '{fileMatchPattern}'
generatedBy: {generatedBy}
generatedAt: {generatedAt}
featureName: {featureName}
documentType: {documentType}
---

# Design Guidance: {featureName}

{content}

## Related Documents
{references}`,
        requiredPlaceholders: [
          'inclusion',
          'fileMatchPattern', 
          'generatedBy',
          'generatedAt',
          'featureName',
          'documentType',
          'content',
          'references'
        ],
        validateContent: (content: string) => content.includes('Design') && content.length > 10
      };

      // Test template validation
      expect(template.validateContent!('Design Options for Feature')).toBe(true);
      expect(template.validateContent!('Short')).toBe(false);
      expect(template.validateContent!('No design keyword')).toBe(false);

      // Verify template structure
      expect(template.requiredPlaceholders).toContain('featureName');
      expect(template.requiredPlaceholders).toContain('content');
      expect(template.template).toContain('{featureName}');
      expect(template.template).toContain('{content}');
    });

    it('should validate generation options workflow', () => {
      const options: SteeringFileGenerationOptions = {
        autoSave: true,
        promptForConfirmation: false,
        includeReferences: true,
        namingStrategy: 'feature-based',
        filenamePrefix: 'pm-',
        overwriteExisting: false
      };

      // Simulate using options in generation
      const baseFilename = 'user-auth-design';
      const finalFilename = options.filenamePrefix 
        ? `${options.filenamePrefix}${baseFilename}.md`
        : `${baseFilename}.md`;

      expect(finalFilename).toBe('pm-user-auth-design.md');
      expect(options.includeReferences).toBe(true);
      expect(options.autoSave).toBe(true);
    });
  });

  describe('Type safety and validation', () => {
    it('should enforce enum constraints', () => {
      const validDocumentTypes = Object.values(DocumentType);
      expect(validDocumentTypes).toEqual([
        'requirements',
        'design', 
        'onepager',
        'prfaq',
        'tasks',
        'competitive_analysis',
        'market_sizing'
      ]);

      // Test that enum values are strings
      validDocumentTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });

    it('should handle optional vs required fields correctly', () => {
      // Test minimal valid objects
      const minimalFrontMatter: FrontMatter = {
        inclusion: 'always',
        generatedBy: 'test',
        generatedAt: '2024-01-01T00:00:00Z',
        featureName: 'test',
        documentType: DocumentType.REQUIREMENTS
      };

      const minimalContext: SteeringContext = {
        featureName: 'test',
        relatedFiles: [],
        inclusionRule: 'always'
      };

      expect(minimalFrontMatter.fileMatchPattern).toBeUndefined();
      expect(minimalContext.projectName).toBeUndefined();
      expect(minimalContext.fileMatchPattern).toBeUndefined();
    });

    it('should validate cross-field consistency', () => {
      // When inclusion is 'fileMatch', fileMatchPattern should be provided
      const fileMatchFrontMatter: FrontMatter = {
        inclusion: 'fileMatch',
        fileMatchPattern: '*.ts',
        generatedBy: 'test',
        generatedAt: '2024-01-01T00:00:00Z',
        featureName: 'test',
        documentType: DocumentType.DESIGN
      };

      expect(fileMatchFrontMatter.inclusion).toBe('fileMatch');
      expect(fileMatchFrontMatter.fileMatchPattern).toBeDefined();

      // When inclusion is 'always', fileMatchPattern is not needed
      const alwaysFrontMatter: FrontMatter = {
        inclusion: 'always',
        generatedBy: 'test',
        generatedAt: '2024-01-01T00:00:00Z',
        featureName: 'test',
        documentType: DocumentType.TASKS
      };

      expect(alwaysFrontMatter.inclusion).toBe('always');
      expect(alwaysFrontMatter.fileMatchPattern).toBeUndefined();
    });
  });
});