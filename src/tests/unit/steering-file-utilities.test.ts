/**
 * Unit Tests for Steering File Management Utilities
 * 
 * Tests the functionality for listing, organizing, cleaning up, and analyzing
 * steering files to maintain an efficient steering file system.
 */

import { jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  SteeringFileUtilities,
  SteeringFileInfo,
  SteeringFileAnalytics,
  CleanupOptions,
  CleanupResult
} from '../../components/steering-file-utilities';
import { DocumentType, InclusionRule } from '../../models/steering';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('SteeringFileUtilities', () => {
  let utilities: SteeringFileUtilities;
  const mockSteeringDir = '.kiro/steering';
  const mockBackupDir = '.kiro/steering/.backups';

  beforeEach(() => {
    jest.clearAllMocks();
    utilities = new SteeringFileUtilities({
      steeringDirectory: mockSteeringDir,
      backupDirectory: mockBackupDir
    });
  });

  describe('listSteeringFiles', () => {
    it('should list all steering files with detailed information', async () => {
      const mockFiles = [
        { name: 'requirements-feature-a.md', isFile: () => true },
        { name: 'design-feature-b.md', isFile: () => true },
        { name: 'not-markdown.txt', isFile: () => true },
        { name: 'subdirectory', isFile: () => false }
      ];

      const mockStats = {
        size: 1024,
        mtime: new Date('2024-01-15'),
        birthtime: new Date('2024-01-10')
      };

      const mockContent = `---
inclusion: fileMatch
fileMatchPattern: 'requirements*'
generatedBy: vibe-pm-agent
generatedAt: 2024-01-10T10:00:00Z
featureName: feature-a
documentType: requirements
---

# Requirements for Feature A

This is the content of the requirements document.`;

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.stat.mockResolvedValue(mockStats as any);
      mockFs.readFile.mockResolvedValue(mockContent);

      const result = await utilities.listSteeringFiles();

      expect(result).toHaveLength(2); // Only .md files
      expect(result[0]).toMatchObject({
        filename: 'requirements-feature-a.md',
        fullPath: path.join(mockSteeringDir, 'requirements-feature-a.md'),
        sizeBytes: 1024,
        isValid: true,
        validationErrors: []
      });
      expect(result[0].frontMatter).toMatchObject({
        inclusion: 'fileMatch',
        featureName: 'feature-a',
        documentType: 'requirements'
      });
    });

    it('should handle missing steering directory gracefully', async () => {
      mockFs.access.mockRejectedValue(new Error('Directory not found'));

      const result = await utilities.listSteeringFiles();

      expect(result).toEqual([]);
    });

    it('should handle invalid steering files', async () => {
      const mockFiles = [
        { name: 'invalid-file.md', isFile: () => true }
      ];

      const mockStats = {
        size: 512,
        mtime: new Date('2024-01-15'),
        birthtime: new Date('2024-01-10')
      };

      const invalidContent = `# Invalid File
This file has no front-matter.`;

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.stat.mockResolvedValue(mockStats as any);
      mockFs.readFile.mockResolvedValue(invalidContent);

      const result = await utilities.listSteeringFiles();

      expect(result).toHaveLength(1);
      expect(result[0].isValid).toBe(false);
      expect(result[0].validationErrors).toContain('No front-matter found');
    });

    it('should handle file processing errors gracefully', async () => {
      const mockFiles = [
        { name: 'error-file.md', isFile: () => true },
        { name: 'good-file.md', isFile: () => true }
      ];

      const mockStats = {
        size: 1024,
        mtime: new Date('2024-01-15'),
        birthtime: new Date('2024-01-10')
      };

      const goodContent = `---
inclusion: always
generatedBy: pm-agent
generatedAt: 2024-01-10T10:00:00Z
featureName: good-feature
documentType: design
---

# Good File`;

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.stat
        .mockRejectedValueOnce(new Error('Permission denied'))
        .mockResolvedValueOnce(mockStats as any);
      mockFs.readFile.mockResolvedValue(goodContent);

      const result = await utilities.listSteeringFiles();

      expect(result).toHaveLength(1); // Only the good file
      expect(result[0].filename).toBe('good-file.md');
    });
  });

  describe('organizeSteeringFiles', () => {
    it('should organize files by feature, type, and inclusion rule', async () => {
      const mockFileInfos: SteeringFileInfo[] = [
        {
          filename: 'requirements-feature-a.md',
          fullPath: '/path/requirements-feature-a.md',
          frontMatter: {
            inclusion: 'fileMatch' as InclusionRule,
            generatedBy: 'pm-agent',
            generatedAt: '2024-01-10T10:00:00Z',
            featureName: 'feature-a',
            documentType: DocumentType.REQUIREMENTS
          },
          sizeBytes: 1024,
          lastModified: new Date('2024-01-15'),
          created: new Date('2024-01-10'),
          isValid: true,
          validationErrors: []
        },
        {
          filename: 'design-feature-a.md',
          fullPath: '/path/design-feature-a.md',
          frontMatter: {
            inclusion: 'always' as InclusionRule,
            generatedBy: 'pm-agent',
            generatedAt: '2024-01-10T10:00:00Z',
            featureName: 'feature-a',
            documentType: DocumentType.DESIGN
          },
          sizeBytes: 2048,
          lastModified: new Date('2023-01-15'), // Old file
          created: new Date('2023-01-10'),
          isValid: true,
          validationErrors: []
        },
        {
          filename: 'invalid-file.md',
          fullPath: '/path/invalid-file.md',
          frontMatter: {} as any,
          sizeBytes: 512,
          lastModified: new Date('2024-01-15'),
          created: new Date('2024-01-10'),
          isValid: false,
          validationErrors: ['Missing required fields']
        }
      ];

      // Mock the listSteeringFiles method
      jest.spyOn(utilities, 'listSteeringFiles').mockResolvedValue(mockFileInfos);

      const result = await utilities.organizeSteeringFiles();

      expect(result.byFeature['feature-a']).toHaveLength(2);
      expect(result.byFeature['unknown']).toHaveLength(1);
      expect(result.byType[DocumentType.REQUIREMENTS]).toHaveLength(1);
      expect(result.byType[DocumentType.DESIGN]).toHaveLength(1);
      expect(result.byInclusionRule['fileMatch']).toHaveLength(1);
      expect(result.byInclusionRule['always']).toHaveLength(1);
      expect(result.invalid).toHaveLength(1);
      expect(result.outdated).toHaveLength(3); // All files are outdated (from 2024/2023)
    });
  });

  describe('generateAnalytics', () => {
    it('should generate comprehensive analytics', async () => {
      const mockFileInfos: SteeringFileInfo[] = [
        {
          filename: 'requirements-feature-a.md',
          fullPath: '/path/requirements-feature-a.md',
          frontMatter: {
            inclusion: 'fileMatch' as InclusionRule,
            generatedBy: 'pm-agent',
            generatedAt: '2024-01-10T10:00:00Z',
            featureName: 'feature-a',
            documentType: DocumentType.REQUIREMENTS
          },
          sizeBytes: 1024,
          lastModified: new Date('2024-01-15'),
          created: new Date('2024-01-10'),
          isValid: true,
          validationErrors: []
        },
        {
          filename: 'design-feature-a.md',
          fullPath: '/path/design-feature-a.md',
          frontMatter: {
            inclusion: 'always' as InclusionRule,
            generatedBy: 'pm-agent',
            generatedAt: '2024-01-10T10:00:00Z',
            featureName: 'feature-a',
            documentType: DocumentType.DESIGN
          },
          sizeBytes: 2048,
          lastModified: new Date('2023-01-15'), // Unused (old)
          created: new Date('2023-01-10'), // Outdated
          isValid: true,
          validationErrors: []
        },
        {
          filename: 'invalid-file.md',
          fullPath: '/path/invalid-file.md',
          frontMatter: {} as any,
          sizeBytes: 512,
          lastModified: new Date('2024-01-15'),
          created: new Date('2024-01-10'),
          isValid: false,
          validationErrors: ['Missing required fields']
        }
      ];

      jest.spyOn(utilities, 'listSteeringFiles').mockResolvedValue(mockFileInfos);
      
      // Mock checkBrokenReferences to return empty arrays
      jest.spyOn(utilities as any, 'checkBrokenReferences').mockResolvedValue([]);

      const analytics = await utilities.generateAnalytics();

      expect(analytics.totalFiles).toBe(3);
      expect(analytics.filesByType[DocumentType.REQUIREMENTS]).toBe(1);
      expect(analytics.filesByType[DocumentType.DESIGN]).toBe(1);
      expect(analytics.filesByInclusionRule['fileMatch']).toBe(1);
      expect(analytics.filesByInclusionRule['always']).toBe(1);
      expect(analytics.totalSizeBytes).toBe(3584); // 1024 + 2048 + 512
      expect(analytics.invalidFiles).toHaveLength(1);
      expect(analytics.outdatedFiles).toHaveLength(3); // All files are outdated
      expect(analytics.unusedFiles).toHaveLength(3); // All files are unused (older than 30 days)
      expect(analytics.topFeatures).toContainEqual({ featureName: 'feature-a', count: 2 });
      expect(analytics.averageAgeDays).toBeGreaterThan(0);
    });

    it('should handle broken references detection', async () => {
      const mockFileInfo: SteeringFileInfo = {
        filename: 'test-file.md',
        fullPath: '/path/test-file.md',
        frontMatter: {
          inclusion: 'always' as InclusionRule,
          generatedBy: 'pm-agent',
          generatedAt: '2024-01-10T10:00:00Z',
          featureName: 'test-feature',
          documentType: DocumentType.REQUIREMENTS
        },
        sizeBytes: 1024,
        lastModified: new Date('2024-01-15'),
        created: new Date('2024-01-10'),
        isValid: true,
        validationErrors: []
      };

      jest.spyOn(utilities, 'listSteeringFiles').mockResolvedValue([mockFileInfo]);
      jest.spyOn(utilities as any, 'checkBrokenReferences').mockResolvedValue(['broken-ref.md']);

      const analytics = await utilities.generateAnalytics();

      expect(analytics.brokenReferences).toHaveLength(1);
      expect(analytics.brokenReferences[0].file).toBe(mockFileInfo);
      expect(analytics.brokenReferences[0].brokenRefs).toContain('broken-ref.md');
    });
  });

  describe('cleanupSteeringFiles', () => {
    it('should clean up outdated and unused files', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
      const unusedDate = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000); // 40 days ago

      const mockFileInfos: SteeringFileInfo[] = [
        {
          filename: 'old-file.md',
          fullPath: '/path/old-file.md',
          frontMatter: {
            inclusion: 'always' as InclusionRule,
            generatedBy: 'pm-agent',
            generatedAt: oldDate.toISOString(),
            featureName: 'old-feature',
            documentType: DocumentType.REQUIREMENTS
          },
          sizeBytes: 1024,
          lastModified: unusedDate,
          created: oldDate,
          isValid: true,
          validationErrors: []
        },
        {
          filename: 'recent-file.md',
          fullPath: '/path/recent-file.md',
          frontMatter: {
            inclusion: 'always' as InclusionRule,
            generatedBy: 'pm-agent',
            generatedAt: now.toISOString(),
            featureName: 'recent-feature',
            documentType: DocumentType.DESIGN
          },
          sizeBytes: 2048,
          lastModified: now,
          created: now,
          isValid: true,
          validationErrors: []
        },
        {
          filename: 'invalid-file.md',
          fullPath: '/path/invalid-file.md',
          frontMatter: {} as any,
          sizeBytes: 512,
          lastModified: now,
          created: now,
          isValid: false,
          validationErrors: ['Invalid']
        }
      ];

      jest.spyOn(utilities, 'listSteeringFiles').mockResolvedValue(mockFileInfos);
      jest.spyOn(utilities as any, 'checkBrokenReferences').mockResolvedValue([]);
      jest.spyOn(utilities as any, 'createBackup').mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined as any);
      mockFs.unlink.mockResolvedValue(undefined);

      const options: CleanupOptions = {
        maxAgeDays: 90,
        maxUnusedDays: 30,
        removeInvalid: true,
        createBackups: true,
        dryRun: false
      };

      const result = await utilities.cleanupSteeringFiles(options);

      expect(result.filesRemoved).toBe(2); // old-file.md and invalid-file.md
      expect(result.removedFiles).toContain('old-file.md');
      expect(result.removedFiles).toContain('invalid-file.md');
      expect(result.removedFiles).not.toContain('recent-file.md');
      expect(result.spaceFreedBytes).toBe(1536); // 1024 + 512
      expect(result.filesBackedUp).toBe(2);
    });

    it('should perform dry run without actually removing files', async () => {
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
      
      const mockFileInfos: SteeringFileInfo[] = [
        {
          filename: 'old-file.md',
          fullPath: '/path/old-file.md',
          frontMatter: {
            inclusion: 'always' as InclusionRule,
            generatedBy: 'pm-agent',
            generatedAt: oldDate.toISOString(),
            featureName: 'old-feature',
            documentType: DocumentType.REQUIREMENTS
          },
          sizeBytes: 1024,
          lastModified: oldDate,
          created: oldDate,
          isValid: true,
          validationErrors: []
        }
      ];

      jest.spyOn(utilities, 'listSteeringFiles').mockResolvedValue(mockFileInfos);
      jest.spyOn(utilities as any, 'checkBrokenReferences').mockResolvedValue([]);

      const result = await utilities.cleanupSteeringFiles({ 
        maxAgeDays: 90, 
        dryRun: true 
      });

      expect(result.filesRemoved).toBe(1);
      expect(result.removedFiles).toContain('old-file.md');
      expect(result.filesBackedUp).toBe(0); // No backups in dry run
      expect(mockFs.unlink).not.toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
      
      const mockFileInfos: SteeringFileInfo[] = [
        {
          filename: 'error-file.md',
          fullPath: '/path/error-file.md',
          frontMatter: {
            inclusion: 'always' as InclusionRule,
            generatedBy: 'pm-agent',
            generatedAt: oldDate.toISOString(),
            featureName: 'error-feature',
            documentType: DocumentType.REQUIREMENTS
          },
          sizeBytes: 1024,
          lastModified: oldDate,
          created: oldDate,
          isValid: true,
          validationErrors: []
        }
      ];

      jest.spyOn(utilities, 'listSteeringFiles').mockResolvedValue(mockFileInfos);
      jest.spyOn(utilities as any, 'checkBrokenReferences').mockResolvedValue([]);
      jest.spyOn(utilities as any, 'createBackup').mockResolvedValue(undefined);
      mockFs.unlink.mockRejectedValue(new Error('Permission denied'));

      const result = await utilities.cleanupSteeringFiles({ 
        maxAgeDays: 90,
        createBackups: false 
      });

      expect(result.filesRemoved).toBe(0); // No files actually removed due to error
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Permission denied');
    });

    it('should clean up files with broken references', async () => {
      const mockFileInfo: SteeringFileInfo = {
        filename: 'broken-refs.md',
        fullPath: '/path/broken-refs.md',
        frontMatter: {
          inclusion: 'always' as InclusionRule,
          generatedBy: 'pm-agent',
          generatedAt: '2024-01-10T10:00:00Z',
          featureName: 'broken-feature',
          documentType: DocumentType.REQUIREMENTS
        },
        sizeBytes: 1024,
        lastModified: new Date(),
        created: new Date(),
        isValid: true,
        validationErrors: []
      };

      jest.spyOn(utilities, 'listSteeringFiles').mockResolvedValue([mockFileInfo]);
      jest.spyOn(utilities as any, 'checkBrokenReferences')
        .mockResolvedValue(['non-existent.md']);
      jest.spyOn(utilities as any, 'createBackup').mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);

      const result = await utilities.cleanupSteeringFiles({ 
        removeBrokenRefs: true,
        createBackups: false 
      });

      expect(result.filesRemoved).toBe(1);
      expect(result.removedFiles).toContain('broken-refs.md');
    });
  });

  describe('private helper methods', () => {
    describe('parseFrontMatter', () => {
      it('should parse front-matter correctly', () => {
        const frontMatterText = `inclusion: fileMatch
fileMatchPattern: 'requirements*'
generatedBy: vibe-pm-agent
generatedAt: 2024-01-10T10:00:00Z
featureName: test-feature
documentType: requirements
description: Test description`;

        const result = (utilities as any).parseFrontMatter(frontMatterText);

        expect(result).toMatchObject({
          inclusion: 'fileMatch',
          fileMatchPattern: 'requirements*',
          generatedBy: 'vibe-pm-agent',
          generatedAt: '2024-01-10T10:00:00Z',
          featureName: 'test-feature',
          documentType: 'requirements',
          description: 'Test description'
        });
      });

      it('should handle quoted values', () => {
        const frontMatterText = `inclusion: 'always'
generatedBy: "pm-agent"
featureName: 'test-feature'`;

        const result = (utilities as any).parseFrontMatter(frontMatterText);

        expect(result.inclusion).toBe('always');
        expect(result.generatedBy).toBe('pm-agent');
        expect(result.featureName).toBe('test-feature');
      });
    });

    describe('validateFrontMatter', () => {
      it('should validate complete front-matter', () => {
        const frontMatter = {
          inclusion: 'always' as InclusionRule,
          generatedBy: 'pm-agent',
          generatedAt: '2024-01-10T10:00:00Z',
          featureName: 'test-feature',
          documentType: DocumentType.REQUIREMENTS
        };

        const result = (utilities as any).validateFrontMatter(frontMatter);
        expect(result).toBe(true);
      });

      it('should reject incomplete front-matter', () => {
        const frontMatter = {
          inclusion: 'always' as InclusionRule,
          generatedBy: 'pm-agent'
          // Missing required fields
        };

        const result = (utilities as any).validateFrontMatter(frontMatter);
        expect(result).toBe(false);
      });
    });

    describe('checkBrokenReferences', () => {
      it('should detect broken file references', async () => {
        const fileInfo: SteeringFileInfo = {
          filename: 'test.md',
          fullPath: '/path/test.md',
          frontMatter: {} as any,
          sizeBytes: 1024,
          lastModified: new Date(),
          created: new Date(),
          isValid: true,
          validationErrors: []
        };

        const contentWithRefs = `# Test File

See also #[[file:existing.md]] and #[[file:missing.md]].

Another reference: #[[file:also-missing.md]]`;

        mockFs.readFile.mockResolvedValue(contentWithRefs);
        mockFs.access
          .mockResolvedValueOnce(undefined) // existing.md exists
          .mockRejectedValueOnce(new Error('Not found')) // missing.md doesn't exist
          .mockRejectedValueOnce(new Error('Not found')); // also-missing.md doesn't exist

        const result = await (utilities as any).checkBrokenReferences(fileInfo);

        expect(result).toEqual(['missing.md', 'also-missing.md']);
      });

      it('should handle files with no references', async () => {
        const fileInfo: SteeringFileInfo = {
          filename: 'test.md',
          fullPath: '/path/test.md',
          frontMatter: {} as any,
          sizeBytes: 1024,
          lastModified: new Date(),
          created: new Date(),
          isValid: true,
          validationErrors: []
        };

        const contentNoRefs = `# Test File

This file has no references.`;

        mockFs.readFile.mockResolvedValue(contentNoRefs);

        const result = await (utilities as any).checkBrokenReferences(fileInfo);

        expect(result).toEqual([]);
      });
    });

    describe('createBackup', () => {
      it('should create backup file with timestamp', async () => {
        const fileInfo: SteeringFileInfo = {
          filename: 'test.md',
          fullPath: '/path/test.md',
          frontMatter: {} as any,
          sizeBytes: 1024,
          lastModified: new Date(),
          created: new Date(),
          isValid: true,
          validationErrors: []
        };

        mockFs.mkdir.mockResolvedValue(undefined as any);
        mockFs.copyFile.mockResolvedValue(undefined);

        await (utilities as any).createBackup(fileInfo);

        expect(mockFs.mkdir).toHaveBeenCalledWith(mockBackupDir, { recursive: true });
        expect(mockFs.copyFile).toHaveBeenCalledWith(
          fileInfo.fullPath,
          expect.stringMatching(/\.kiro\/steering\/\.backups\/test-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.md/)
        );
      });

      it('should handle backup creation errors', async () => {
        const fileInfo: SteeringFileInfo = {
          filename: 'test.md',
          fullPath: '/path/test.md',
          frontMatter: {} as any,
          sizeBytes: 1024,
          lastModified: new Date(),
          created: new Date(),
          isValid: true,
          validationErrors: []
        };

        mockFs.mkdir.mockResolvedValue(undefined as any);
        mockFs.copyFile.mockRejectedValue(new Error('Backup failed'));

        await expect((utilities as any).createBackup(fileInfo)).rejects.toThrow('Failed to create backup');
      });
    });
  });
});