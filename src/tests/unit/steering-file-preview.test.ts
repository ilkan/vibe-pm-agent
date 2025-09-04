/**
 * Unit tests for SteeringFilePreview component
 */

import { SteeringFilePreview } from '../../components/steering-file-preview';
import { SteeringFileManager } from '../../components/steering-file-manager';
import { FrontMatterProcessor } from '../../components/front-matter-processor';
import {
  SteeringFile,
  DocumentType,
  SteeringFileCustomization,
  BatchOperationConfig,
  ConflictInfo,
  SteeringFilePreviewInfo
} from '../../models/steering';

// Mock dependencies
jest.mock('../../components/steering-file-manager');
jest.mock('../../components/front-matter-processor');

describe('SteeringFilePreview', () => {
  let preview: SteeringFilePreview;
  let mockManager: jest.Mocked<SteeringFileManager>;
  let mockFrontMatterProcessor: jest.Mocked<FrontMatterProcessor>;

  const mockSteeringFile: SteeringFile = {
    filename: 'test-requirements.md',
    frontMatter: {
      inclusion: 'fileMatch',
      fileMatchPattern: 'requirements*',
      generatedBy: 'vibe-pm-agent',
      generatedAt: '2024-01-01T00:00:00.000Z',
      featureName: 'test-feature',
      documentType: DocumentType.REQUIREMENTS,
      description: 'Test requirements guidance'
    },
    content: '# Test Requirements\n\nThis is test content for requirements guidance.',
    references: ['#[[file:.kiro/specs/test-feature/design.md]]'],
    fullPath: '.kiro/steering/test-requirements.md'
  };

  beforeEach(() => {
    mockManager = new SteeringFileManager() as jest.Mocked<SteeringFileManager>;
    mockFrontMatterProcessor = new FrontMatterProcessor() as jest.Mocked<FrontMatterProcessor>;
    preview = new SteeringFilePreview(mockManager, mockFrontMatterProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePreview', () => {
    it('should generate preview without customization', async () => {
      const mockConflictInfo: ConflictInfo = {
        exists: false,
        suggestedAction: 'update'
      };

      mockManager.checkConflicts.mockResolvedValue(mockConflictInfo);

      const result = await preview.generatePreview(mockSteeringFile);

      expect(result).toMatchObject({
        steeringFile: mockSteeringFile,
        estimatedSize: expect.any(Number),
        previewContent: expect.stringContaining('---'),
        warnings: expect.any(Array),
        suggestions: expect.any(Array)
      });

      expect(result.previewContent).toContain('inclusion: fileMatch');
      expect(result.previewContent).toContain('featureName: test-feature');
      expect(result.previewContent).toContain('# Test Requirements');
      expect(result.estimatedSize).toBeGreaterThan(0);
    });

    it('should apply filename customization', async () => {
      const customization: SteeringFileCustomization = {
        filename: 'custom-requirements-name'
      };

      mockManager.checkConflicts.mockResolvedValue({
        exists: false,
        suggestedAction: 'update'
      });

      const result = await preview.generatePreview(mockSteeringFile, customization);

      expect(result.steeringFile.filename).toBe('custom-requirements-name.md');
    });

    it('should apply inclusion rule customization', async () => {
      const customization: SteeringFileCustomization = {
        inclusionRule: 'manual'
      };

      mockManager.checkConflicts.mockResolvedValue({
        exists: false,
        suggestedAction: 'update'
      });

      const result = await preview.generatePreview(mockSteeringFile, customization);

      expect(result.steeringFile.frontMatter.inclusion).toBe('manual');
      expect(result.previewContent).toContain('inclusion: manual');
    });

    it('should apply file match pattern customization', async () => {
      const customization: SteeringFileCustomization = {
        fileMatchPattern: 'custom-pattern*'
      };

      mockManager.checkConflicts.mockResolvedValue({
        exists: false,
        suggestedAction: 'update'
      });

      const result = await preview.generatePreview(mockSteeringFile, customization);

      expect(result.steeringFile.frontMatter.fileMatchPattern).toBe('custom-pattern*');
      expect(result.previewContent).toContain("fileMatchPattern: 'custom-pattern*'");
    });

    it('should apply description customization', async () => {
      const customization: SteeringFileCustomization = {
        description: 'Custom description for testing'
      };

      mockManager.checkConflicts.mockResolvedValue({
        exists: false,
        suggestedAction: 'update'
      });

      const result = await preview.generatePreview(mockSteeringFile, customization);

      expect(result.steeringFile.frontMatter.description).toBe('Custom description for testing');
      expect(result.previewContent).toContain('description: Custom description for testing');
    });

    it('should apply content modifications', async () => {
      const customization: SteeringFileCustomization = {
        contentModifications: {
          prependContent: '## Prepended Section\n\nThis is prepended.',
          appendContent: '## Appended Section\n\nThis is appended.',
          replacements: [
            { search: 'Test Requirements', replace: 'Modified Requirements' }
          ]
        }
      };

      mockManager.checkConflicts.mockResolvedValue({
        exists: false,
        suggestedAction: 'update'
      });

      const result = await preview.generatePreview(mockSteeringFile, customization);

      expect(result.steeringFile.content).toContain('## Prepended Section');
      expect(result.steeringFile.content).toContain('## Appended Section');
      expect(result.steeringFile.content).toContain('Modified Requirements');
      expect(result.steeringFile.content).not.toContain('Test Requirements');
    });

    it('should handle reference inclusion setting', async () => {
      const customization: SteeringFileCustomization = {
        includeReferences: false
      };

      mockManager.checkConflicts.mockResolvedValue({
        exists: false,
        suggestedAction: 'update'
      });

      const result = await preview.generatePreview(mockSteeringFile, customization);

      expect(result.steeringFile.references).toEqual([]);
    });

    it('should include conflict information when file exists', async () => {
      const mockConflictInfo: ConflictInfo = {
        exists: true,
        existingFile: '.kiro/steering/test-requirements.md',
        suggestedAction: 'version',
        reason: 'File was modified recently',
        suggestedFilename: 'test-requirements-2024-01-01.md'
      };

      mockManager.checkConflicts.mockResolvedValue(mockConflictInfo);

      const result = await preview.generatePreview(mockSteeringFile);

      expect(result.conflictInfo).toEqual(mockConflictInfo);
    });

    it('should generate validation warnings', async () => {
      const fileWithIssues: SteeringFile = {
        ...mockSteeringFile,
        content: '', // Empty content should generate warning
        frontMatter: {
          ...mockSteeringFile.frontMatter,
          inclusion: 'fileMatch',
          fileMatchPattern: undefined // Missing pattern should generate warning
        }
      };

      mockManager.checkConflicts.mockResolvedValue({
        exists: false,
        suggestedAction: 'update'
      });

      const result = await preview.generatePreview(fileWithIssues);

      expect(result.warnings).toEqual(expect.arrayContaining([
        expect.stringContaining('Content is very short'),
        expect.stringContaining('fileMatch inclusion rule requires a fileMatchPattern')
      ]));
    });

    it('should generate suggestions for improvement', async () => {
      const fileWithAlwaysInclusion: SteeringFile = {
        ...mockSteeringFile,
        frontMatter: {
          ...mockSteeringFile.frontMatter,
          inclusion: 'always',
          description: undefined
        },
        references: []
      };

      mockManager.checkConflicts.mockResolvedValue({
        exists: false,
        suggestedAction: 'update'
      });

      const result = await preview.generatePreview(fileWithAlwaysInclusion);

      expect(result.suggestions).toEqual(expect.arrayContaining([
        expect.stringContaining('Consider using fileMatch instead of always'),
        expect.stringContaining('Adding a description helps'),
        expect.stringContaining('Consider adding references')
      ]));
    });
  });

  describe('generateBatchPreview', () => {
    it('should generate previews for multiple files', async () => {
      const config: BatchOperationConfig = {
        steeringFiles: [
          mockSteeringFile,
          {
            ...mockSteeringFile,
            filename: 'test-design.md',
            frontMatter: {
              ...mockSteeringFile.frontMatter,
              documentType: DocumentType.DESIGN
            }
          }
        ],
        commonCustomization: {
          inclusionRule: 'manual'
        }
      };

      mockManager.checkConflicts.mockResolvedValue({
        exists: false,
        suggestedAction: 'update'
      });

      const results = await preview.generateBatchPreview(config);

      expect(results).toHaveLength(2);
      expect(results[0].steeringFile.frontMatter.inclusion).toBe('manual');
      expect(results[1].steeringFile.frontMatter.inclusion).toBe('manual');
    });

    it('should apply individual customizations', async () => {
      const config: BatchOperationConfig = {
        steeringFiles: [mockSteeringFile],
        individualCustomizations: {
          'test-requirements.md': {
            filename: 'individual-custom-name',
            description: 'Individual description'
          }
        }
      };

      mockManager.checkConflicts.mockResolvedValue({
        exists: false,
        suggestedAction: 'update'
      });

      const results = await preview.generateBatchPreview(config);

      expect(results[0].steeringFile.filename).toBe('individual-custom-name.md');
      expect(results[0].steeringFile.frontMatter.description).toBe('Individual description');
    });

    it('should handle errors gracefully when stopOnError is false', async () => {
      const invalidFile: SteeringFile = {
        ...mockSteeringFile,
        filename: '', // Invalid filename should cause error
        content: ''
      };

      const config: BatchOperationConfig = {
        steeringFiles: [invalidFile, mockSteeringFile],
        stopOnError: false
      };

      mockManager.checkConflicts.mockResolvedValue({
        exists: false,
        suggestedAction: 'update'
      });

      const results = await preview.generateBatchPreview(config);

      expect(results).toHaveLength(2);
      expect(results[0].warnings).toEqual(expect.arrayContaining([
        expect.stringContaining('Error generating preview')
      ]));
      expect(results[1].warnings).not.toEqual(expect.arrayContaining([
        expect.stringContaining('Error generating preview')
      ]));
    });

    it('should stop on first error when stopOnError is true', async () => {
      const invalidFile: SteeringFile = {
        ...mockSteeringFile,
        filename: '',
        content: ''
      };

      const config: BatchOperationConfig = {
        steeringFiles: [invalidFile, mockSteeringFile],
        stopOnError: true
      };

      mockManager.checkConflicts.mockResolvedValue({
        exists: false,
        suggestedAction: 'update'
      });

      const results = await preview.generateBatchPreview(config);

      expect(results).toHaveLength(1);
      expect(results[0].warnings).toEqual(expect.arrayContaining([
        expect.stringContaining('Error generating preview')
      ]));
    });
  });

  describe('executeBatchOperation', () => {
    it('should execute batch save operations successfully', async () => {
      const config: BatchOperationConfig = {
        steeringFiles: [mockSteeringFile]
      };

      mockManager.saveSteeringFile.mockResolvedValue({
        success: true,
        filename: 'test-requirements.md',
        action: 'created',
        message: 'File created successfully',
        fullPath: '.kiro/steering/test-requirements.md'
      });

      const result = await preview.executeBatchOperation(config);

      expect(result.totalProcessed).toBe(1);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.results[0].success).toBe(true);
      expect(result.summary).toContain('1 successful');
    });

    it('should handle save failures', async () => {
      const config: BatchOperationConfig = {
        steeringFiles: [mockSteeringFile]
      };

      mockManager.saveSteeringFile.mockResolvedValue({
        success: false,
        filename: 'test-requirements.md',
        action: 'skipped',
        message: 'Save failed',
        warnings: ['Permission denied']
      });

      const result = await preview.executeBatchOperation(config);

      expect(result.totalProcessed).toBe(1);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBe('Permission denied');
    });

    it('should apply common and individual customizations during batch operation', async () => {
      const config: BatchOperationConfig = {
        steeringFiles: [mockSteeringFile],
        commonCustomization: {
          inclusionRule: 'manual'
        },
        individualCustomizations: {
          'test-requirements.md': {
            description: 'Individual description'
          }
        }
      };

      mockManager.saveSteeringFile.mockResolvedValue({
        success: true,
        filename: 'test-requirements.md',
        action: 'created',
        message: 'File created successfully'
      });

      await preview.executeBatchOperation(config);

      expect(mockManager.saveSteeringFile).toHaveBeenCalledWith(
        expect.objectContaining({
          frontMatter: expect.objectContaining({
            inclusion: 'manual',
            description: 'Individual description'
          })
        })
      );
    });
  });

  describe('getCustomizationSuggestions', () => {
    it('should provide suggestions for requirements document type', () => {
      const suggestions = preview.getCustomizationSuggestions(
        DocumentType.REQUIREMENTS,
        'test-feature'
      );

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'inclusionRule',
          suggestion: 'fileMatch',
          reason: expect.stringContaining('Requirements guidance')
        })
      );

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'fileMatchPattern',
          suggestion: 'requirements*|spec*|*.md',
          reason: expect.stringContaining('Match requirements')
        })
      );

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'filename',
          suggestion: 'requirements-test-feature',
          reason: expect.stringContaining('Clear naming convention')
        })
      );
    });

    it('should provide suggestions for design document type', () => {
      const suggestions = preview.getCustomizationSuggestions(
        DocumentType.DESIGN,
        'test-feature'
      );

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'inclusionRule',
          suggestion: 'fileMatch',
          reason: expect.stringContaining('Design guidance')
        })
      );

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'fileMatchPattern',
          suggestion: 'design*|architecture*|*.ts|*.js',
          reason: expect.stringContaining('Match design files')
        })
      );
    });

    it('should provide manual inclusion suggestions for onepager and prfaq', () => {
      const onepagerSuggestions = preview.getCustomizationSuggestions(
        DocumentType.ONEPAGER,
        'test-feature'
      );

      const prfaqSuggestions = preview.getCustomizationSuggestions(
        DocumentType.PRFAQ,
        'test-feature'
      );

      expect(onepagerSuggestions).toContainEqual(
        expect.objectContaining({
          type: 'inclusionRule',
          suggestion: 'manual',
          reason: expect.stringContaining('Executive guidance')
        })
      );

      expect(prfaqSuggestions).toContainEqual(
        expect.objectContaining({
          type: 'inclusionRule',
          suggestion: 'manual',
          reason: expect.stringContaining('PR-FAQ guidance')
        })
      );
    });

    it('should provide task-specific suggestions for tasks document type', () => {
      const suggestions = preview.getCustomizationSuggestions(
        DocumentType.TASKS,
        'test-feature'
      );

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'fileMatchPattern',
          suggestion: 'tasks*|todo*|*.ts|*.js',
          reason: expect.stringContaining('Match task files')
        })
      );
    });

    it('should sanitize feature names in filename suggestions', () => {
      const suggestions = preview.getCustomizationSuggestions(
        DocumentType.REQUIREMENTS,
        'Test Feature With Spaces & Special Characters!'
      );

      const filenameSuggestion = suggestions.find(s => s.type === 'filename');
      expect(filenameSuggestion?.suggestion).toBe('requirements-test-feature-with-spaces-special-characters');
    });
  });

  describe('applyCustomizations', () => {
    it('should return unchanged file when no customization provided', async () => {
      const result = await preview.applyCustomizations(mockSteeringFile);

      expect(result).toEqual(mockSteeringFile);
      expect(result).not.toBe(mockSteeringFile); // Should be a copy
    });

    it('should sanitize and add .md extension to custom filenames', async () => {
      const customization: SteeringFileCustomization = {
        filename: 'Custom File Name With Spaces!'
      };

      const result = await preview.applyCustomizations(mockSteeringFile, customization);

      expect(result.filename).toBe('custom-file-name-with-spaces.md');
    });

    it('should preserve .md extension if already present', async () => {
      const customization: SteeringFileCustomization = {
        filename: 'custom-name.md'
      };

      const result = await preview.applyCustomizations(mockSteeringFile, customization);

      expect(result.filename).toBe('custom-name.md');
    });

    it('should apply all content modifications in correct order', async () => {
      const customization: SteeringFileCustomization = {
        contentModifications: {
          prependContent: 'PREPEND',
          appendContent: 'APPEND',
          replacements: [
            { search: 'Test', replace: 'Modified' }
          ]
        }
      };

      const result = await preview.applyCustomizations(mockSteeringFile, customization);

      expect(result.content).toMatch(/^PREPEND\n\n.*Modified Requirements.*APPEND$/s);
    });
  });
});