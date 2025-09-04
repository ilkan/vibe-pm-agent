/**
 * Unit tests for SteeringUserInteraction component
 */

import { SteeringUserInteraction, SteeringUserPreferences } from '../../components/steering-user-interaction';
import { DocumentType, SteeringFile, FrontMatter } from '../../models/steering';
import { SteeringFileOptions } from '../../models/mcp';

describe('SteeringUserInteraction', () => {
  let userInteraction: SteeringUserInteraction;
  let mockSteeringFile: SteeringFile;

  beforeEach(() => {
    userInteraction = new SteeringUserInteraction();
    
    mockSteeringFile = {
      filename: 'test-requirements.md',
      frontMatter: {
        inclusion: 'fileMatch',
        fileMatchPattern: 'requirements*|spec*',
        generatedBy: 'vibe-pm-agent',
        generatedAt: '2025-09-04T06:29:22.038Z',
        featureName: 'test-feature',
        documentType: DocumentType.REQUIREMENTS,
        description: 'Test requirements steering file'
      } as FrontMatter,
      content: '# Test Requirements\n\nThis is a test requirements document.',
      references: ['#[[file:.kiro/specs/test-feature/design.md]]'],
      fullPath: '.kiro/steering/test-requirements.md'
    };
  });

  describe('constructor', () => {
    it('should initialize with default preferences', () => {
      const interaction = new SteeringUserInteraction();
      const preferences = interaction.getPreferences();
      
      expect(preferences.autoCreate).toBe(false);
      expect(preferences.defaultInclusionRule).toBe('fileMatch');
      expect(preferences.showPreview).toBe(true);
      expect(preferences.showSummary).toBe(true);
    });

    it('should initialize with custom preferences', () => {
      const customPreferences: Partial<SteeringUserPreferences> = {
        autoCreate: true,
        defaultInclusionRule: 'always',
        showPreview: false
      };
      
      const interaction = new SteeringUserInteraction(customPreferences);
      const preferences = interaction.getPreferences();
      
      expect(preferences.autoCreate).toBe(true);
      expect(preferences.defaultInclusionRule).toBe('always');
      expect(preferences.showPreview).toBe(false);
      expect(preferences.showSummary).toBe(true); // Should keep default
    });
  });

  describe('promptForSteeringFileCreation', () => {
    it('should return auto-create response when autoCreate is enabled', async () => {
      userInteraction.updatePreferences({ autoCreate: true });
      
      const response = await userInteraction.promptForSteeringFileCreation(
        DocumentType.REQUIREMENTS,
        'test-feature'
      );
      
      expect(response.createFiles).toBe(true);
      expect(response.customOptions).toBeDefined();
      expect(response.customOptions?.feature_name).toBe('test-feature');
      expect(response.rememberPreferences).toBe(false);
    });

    it('should simulate user prompt when autoCreate is disabled', async () => {
      userInteraction.updatePreferences({ autoCreate: false });
      
      const response = await userInteraction.promptForSteeringFileCreation(
        DocumentType.REQUIREMENTS,
        'test-feature'
      );
      
      // Should auto-create for requirements based on shouldAutoCreateForDocumentType
      expect(response.createFiles).toBe(true);
      expect(response.customOptions).toBeDefined();
    });

    it('should handle different document types appropriately', async () => {
      userInteraction.updatePreferences({ autoCreate: false });
      
      // Requirements should auto-create
      const reqResponse = await userInteraction.promptForSteeringFileCreation(
        DocumentType.REQUIREMENTS,
        'test-feature'
      );
      expect(reqResponse.createFiles).toBe(true);
      
      // Design should auto-create
      const designResponse = await userInteraction.promptForSteeringFileCreation(
        DocumentType.DESIGN,
        'test-feature'
      );
      expect(designResponse.createFiles).toBe(true);
      
      // One-pager should not auto-create (would prompt in real implementation)
      const onePagerResponse = await userInteraction.promptForSteeringFileCreation(
        DocumentType.ONEPAGER,
        'test-feature'
      );
      expect(onePagerResponse.createFiles).toBe(false);
    });
  });

  describe('generatePreview', () => {
    it('should generate preview with correct content', () => {
      const preview = userInteraction.generatePreview(mockSteeringFile);
      
      expect(preview.steeringFile).toBe(mockSteeringFile);
      expect(preview.estimatedSize).toBeGreaterThan(0);
      expect(preview.contentPreview).toContain('---');
      expect(preview.contentPreview).toContain('inclusion: fileMatch');
      expect(preview.contentPreview).toContain('# Test Requirements');
      expect(preview.truncated).toBe(false);
    });

    it('should truncate long content in preview', () => {
      const longContent = 'A'.repeat(2000);
      const longSteeringFile = {
        ...mockSteeringFile,
        content: longContent
      };
      
      const preview = userInteraction.generatePreview(longSteeringFile);
      
      expect(preview.truncated).toBe(true);
      expect(preview.contentPreview).toContain('[truncated]');
      expect(preview.contentPreview.length).toBeLessThan(longContent.length);
    });

    it('should generate validation warnings for invalid content', () => {
      const invalidSteeringFile = {
        ...mockSteeringFile,
        content: '', // Empty content
        frontMatter: {
          ...mockSteeringFile.frontMatter,
          featureName: '', // Missing feature name
          inclusion: 'fileMatch' as const,
          fileMatchPattern: undefined // Missing pattern for fileMatch
        },
        references: [] // No references
      };
      
      const preview = userInteraction.generatePreview(invalidSteeringFile);
      
      expect(preview.warnings).toContain('Steering file content is empty');
      expect(preview.warnings).toContain('Feature name is missing from front-matter');
      expect(preview.warnings).toContain('File match pattern is required when inclusion rule is "fileMatch"');
      expect(preview.warnings).toContain('No file references found - steering file may not be well-connected');
    });
  });

  describe('showPreviewAndConfirm', () => {
    it('should return true when showPreview is disabled', async () => {
      userInteraction.updatePreferences({ showPreview: false });
      
      const preview = userInteraction.generatePreview(mockSteeringFile);
      const confirmed = await userInteraction.showPreviewAndConfirm(preview);
      
      expect(confirmed).toBe(true);
    });

    it('should simulate confirmation based on warnings', async () => {
      userInteraction.updatePreferences({ showPreview: true });
      
      // Preview with no warnings should be confirmed
      const goodPreview = userInteraction.generatePreview(mockSteeringFile);
      const goodConfirmed = await userInteraction.showPreviewAndConfirm(goodPreview);
      expect(goodConfirmed).toBe(true);
      
      // Preview with warnings should not be confirmed
      const badSteeringFile = {
        ...mockSteeringFile,
        content: ''
      };
      const badPreview = userInteraction.generatePreview(badSteeringFile);
      const badConfirmed = await userInteraction.showPreviewAndConfirm(badPreview);
      expect(badConfirmed).toBe(false);
    });
  });

  describe('generateSummary', () => {
    it('should generate comprehensive summary', () => {
      const mockResults = [
        {
          success: true,
          filename: 'test-requirements.md',
          action: 'created' as const,
          message: 'File created successfully',
          fullPath: '.kiro/steering/test-requirements.md'
        },
        {
          success: true,
          filename: 'test-design.md',
          action: 'updated' as const,
          message: 'File updated successfully',
          fullPath: '.kiro/steering/test-design.md'
        },
        {
          success: false,
          filename: 'test-failed.md',
          action: 'skipped' as const,
          message: 'File creation failed',
          fullPath: '.kiro/steering/test-failed.md'
        }
      ];
      
      const summary = userInteraction.generateSummary(mockResults, 1500);
      
      expect(summary.totalFiles).toBe(3);
      expect(summary.filesCreated).toBe(1);
      expect(summary.filesUpdated).toBe(1);
      expect(summary.filesSkipped).toBe(1);
      expect(summary.processingTimeMs).toBe(1500);
      expect(summary.fileDetails).toHaveLength(3);
      expect(summary.issues).toContain('File creation failed');
      expect(summary.usageRecommendations.length).toBeGreaterThan(0);
    });

    it('should generate appropriate usage recommendations', () => {
      const mockResults = [
        {
          success: true,
          filename: 'requirements-test.md',
          action: 'created' as const,
          message: 'File created successfully',
          fullPath: '.kiro/steering/requirements-test.md'
        },
        {
          success: true,
          filename: 'onepager-test.md',
          action: 'created' as const,
          message: 'File created successfully',
          fullPath: '.kiro/steering/onepager-test.md'
        }
      ];
      
      const summary = userInteraction.generateSummary(mockResults, 1000);
      
      expect(summary.usageRecommendations.some(rec => 
        rec.includes('new steering files created')
      )).toBe(true);
      expect(summary.usageRecommendations.some(rec => 
        rec.includes('fileMatch inclusion will automatically activate')
      )).toBe(true);
      expect(summary.usageRecommendations.some(rec => 
        rec.includes('Manual inclusion files can be activated using #filename')
      )).toBe(true);
    });
  });

  describe('customizeSteeringOptions', () => {
    it('should apply user preferences to steering options', () => {
      const baseOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'test-feature'
      };
      
      userInteraction.updatePreferences({
        defaultInclusionRule: 'always',
        namingPreferences: {
          useTimestamp: false,
          useFeaturePrefix: true,
          customPrefix: 'custom'
        }
      });
      
      const customized = userInteraction.customizeSteeringOptions(
        baseOptions,
        DocumentType.REQUIREMENTS,
        'test-feature'
      );
      
      expect(customized.inclusion_rule).toBe('always');
      expect(customized.filename_prefix).toBe('custom');
      expect(customized.feature_name).toBe('test-feature');
    });

    it('should use feature name as prefix when useFeaturePrefix is true', () => {
      const baseOptions: SteeringFileOptions = {
        create_steering_files: true
      };
      
      userInteraction.updatePreferences({
        namingPreferences: {
          useTimestamp: false,
          useFeaturePrefix: true
        }
      });
      
      const customized = userInteraction.customizeSteeringOptions(
        baseOptions,
        DocumentType.DESIGN,
        'my-feature'
      );
      
      expect(customized.filename_prefix).toBe('my-feature');
      expect(customized.feature_name).toBe('my-feature');
    });

    it('should set appropriate default inclusion rules for document types', () => {
      const baseOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'test'
      };
      
      // Requirements should default to fileMatch
      const reqCustomized = userInteraction.customizeSteeringOptions(
        baseOptions,
        DocumentType.REQUIREMENTS,
        'test'
      );
      expect(reqCustomized.inclusion_rule).toBe('fileMatch');
      
      // One-pager should default to manual
      const onePagerCustomized = userInteraction.customizeSteeringOptions(
        baseOptions,
        DocumentType.ONEPAGER,
        'test'
      );
      expect(onePagerCustomized.inclusion_rule).toBe('manual');
    });
  });

  describe('updatePreferences and getPreferences', () => {
    it('should update and retrieve preferences correctly', () => {
      const newPreferences: Partial<SteeringUserPreferences> = {
        autoCreate: true,
        showPreview: false,
        namingPreferences: {
          useTimestamp: true,
          useFeaturePrefix: false,
          customPrefix: 'test-prefix'
        }
      };
      
      userInteraction.updatePreferences(newPreferences);
      const retrieved = userInteraction.getPreferences();
      
      expect(retrieved.autoCreate).toBe(true);
      expect(retrieved.showPreview).toBe(false);
      expect(retrieved.namingPreferences.useTimestamp).toBe(true);
      expect(retrieved.namingPreferences.customPrefix).toBe('test-prefix');
      // Should preserve existing values not updated
      expect(retrieved.showSummary).toBe(true);
    });
  });

  describe('displaySummary', () => {
    it('should not display when showSummary is disabled', async () => {
      userInteraction.updatePreferences({ showSummary: false });
      
      const mockSummary = {
        totalFiles: 1,
        filesCreated: 1,
        filesUpdated: 0,
        filesSkipped: 0,
        fileDetails: [],
        processingTimeMs: 1000,
        issues: [],
        usageRecommendations: []
      };
      
      // Should not throw or cause issues
      await expect(userInteraction.displaySummary(mockSummary)).resolves.toBeUndefined();
    });

    it('should log summary when showSummary is enabled', async () => {
      userInteraction.updatePreferences({ showSummary: true });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockSummary = {
        totalFiles: 2,
        filesCreated: 1,
        filesUpdated: 1,
        filesSkipped: 0,
        fileDetails: [],
        processingTimeMs: 1500,
        issues: ['Test issue'],
        usageRecommendations: ['Test recommendation']
      };
      
      await userInteraction.displaySummary(mockSummary);
      
      expect(consoleSpy).toHaveBeenCalledWith('Steering File Creation Summary:');
      expect(consoleSpy).toHaveBeenCalledWith('- Total files processed: 2');
      expect(consoleSpy).toHaveBeenCalledWith('- Files created: 1');
      expect(consoleSpy).toHaveBeenCalledWith('- Files updated: 1');
      
      consoleSpy.mockRestore();
    });
  });
});