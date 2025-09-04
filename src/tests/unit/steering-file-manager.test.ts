/**
 * Unit tests for SteeringFileManager component
 */

import { SteeringFileManager } from '../../components/steering-file-manager/index';
import { SteeringFile, DocumentType } from '../../models/steering';
import * as fs from 'fs/promises';

// Mock fs module
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  mkdir: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
  writeFile: jest.fn(),
  copyFile: jest.fn()
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('SteeringFileManager', () => {
  let manager: SteeringFileManager;
  let mockSteeringFile: SteeringFile;

  beforeEach(() => {
    jest.clearAllMocks();
    
    manager = new SteeringFileManager({
      steeringDirectory: '.kiro/steering',
      createBackups: true,
      maxVersions: 5,
      validateContent: true
    });

    mockSteeringFile = {
      filename: 'test-feature-requirements.md',
      frontMatter: {
        inclusion: 'fileMatch',
        fileMatchPattern: 'requirements*',
        generatedBy: 'vibe-pm-agent',
        generatedAt: '2024-01-01T00:00:00.000Z',
        featureName: 'test-feature',
        documentType: DocumentType.REQUIREMENTS,
        description: 'Test requirements steering file'
      },
      content: '\n# Requirements Guidance: Test Feature\n\nThis is test content.\n',
      references: ['#[[file:.kiro/specs/test-feature/design.md]]']
    };
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const defaultManager = new SteeringFileManager();
      const stats = defaultManager.getStats();
      
      expect(stats.filesCreated).toBe(0);
      expect(stats.filesUpdated).toBe(0);
      expect(stats.conflictsEncountered).toBe(0);
      expect(stats.documentTypesProcessed).toEqual([]);
    });

    it('should merge custom configuration with defaults', () => {
      const customManager = new SteeringFileManager({
        steeringDirectory: 'custom/steering',
        createBackups: false
      });
      
      expect(customManager).toBeDefined();
    });
  });

  describe('saveSteeringFile', () => {
    beforeEach(() => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);
    });

    it('should save a new steering file successfully', async () => {
      // Mock no existing file (directory exists, file doesn't)
      mockedFs.access
        .mockResolvedValueOnce(undefined) // directory exists
        .mockRejectedValueOnce(new Error('File not found')); // file doesn't exist
      
      const result = await manager.saveSteeringFile(mockSteeringFile);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
      expect(result.filename).toBe('test-feature-requirements.md');
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-feature-requirements.md'),
        expect.stringContaining('---'),
        'utf8'
      );
    });

    it('should update an existing steering file', async () => {
      // Mock existing file (old)
      mockedFs.stat.mockResolvedValue({
        mtime: new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours ago
      } as any);
      
      const result = await manager.saveSteeringFile(mockSteeringFile);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('updated');
    });

    it('should handle validation failure', async () => {
      const invalidFile = {
        ...mockSteeringFile,
        content: '', // Empty content should fail validation
      };
      
      const result = await manager.saveSteeringFile(invalidFile);
      
      expect(result.success).toBe(false);
      expect(result.action).toBe('skipped');
      expect(result.message).toContain('validation failed');
    });

    it('should handle file system errors gracefully', async () => {
      mockedFs.writeFile.mockRejectedValue(new Error('Permission denied'));
      
      const result = await manager.saveSteeringFile(mockSteeringFile);
      
      expect(result.success).toBe(false);
      expect(result.action).toBe('skipped');
      expect(result.message).toContain('Permission denied');
    });
  });

  describe('checkConflicts', () => {
    it('should return no conflict for non-existent file', async () => {
      mockedFs.access.mockRejectedValue(new Error('File not found'));
      
      const conflict = await manager.checkConflicts('new-file.md');
      
      expect(conflict.exists).toBe(false);
      expect(conflict.suggestedAction).toBe('update');
    });

    it('should suggest versioning for recently modified files', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.stat.mockResolvedValue({
        mtime: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      } as any);
      
      const conflict = await manager.checkConflicts('existing-file.md');
      
      expect(conflict.exists).toBe(true);
      expect(conflict.suggestedAction).toBe('version');
      expect(conflict.reason).toContain('modified recently');
      expect(conflict.suggestedFilename).toMatch(/existing-file-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.md/);
    });

    it('should suggest updating for older files', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.stat.mockResolvedValue({
        mtime: new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours ago
      } as any);
      
      const conflict = await manager.checkConflicts('old-file.md');
      
      expect(conflict.exists).toBe(true);
      expect(conflict.suggestedAction).toBe('update');
      expect(conflict.reason).toContain('older, safe to update');
    });
  });

  describe('resolveNaming', () => {
    it('should generate filename with document type prefix', () => {
      const filename = manager.resolveNaming('user-authentication', 'requirements');
      expect(filename).toBe('requirements-user-authentication.md');
    });

    it('should sanitize invalid characters in base name', () => {
      const filename = manager.resolveNaming('User Authentication & Login!', 'design');
      expect(filename).toBe('design-user-authentication-login.md');
    });

    it('should handle unknown document types', () => {
      const filename = manager.resolveNaming('test-feature', 'unknown');
      expect(filename).toBe('test-feature.md');
    });

    it('should remove consecutive dashes', () => {
      const filename = manager.resolveNaming('test---feature', 'design');
      expect(filename).toBe('design-test-feature.md');
    });
  });

  describe('listExistingSteeringFiles', () => {
    it('should return list of markdown files', async () => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.readdir.mockResolvedValue([
        'requirements-feature1.md',
        'design-feature2.md',
        'other-file.txt',
        'another-file.md'
      ] as any);
      
      const files = await manager.listExistingSteeringFiles();
      
      expect(files).toEqual([
        'requirements-feature1.md',
        'design-feature2.md',
        'another-file.md'
      ]);
    });

    it('should return empty array on directory access error', async () => {
      mockedFs.access.mockRejectedValue(new Error('Directory not found'));
      mockedFs.readdir.mockRejectedValue(new Error('Directory not found'));
      
      const files = await manager.listExistingSteeringFiles();
      
      expect(files).toEqual([]);
    });

    it('should create directory if it does not exist', async () => {
      mockedFs.access.mockRejectedValueOnce(new Error('Directory not found'));
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readdir.mockResolvedValue([] as any);
      
      await manager.listExistingSteeringFiles();
      
      expect(mockedFs.mkdir).toHaveBeenCalledWith('.kiro/steering', { recursive: true });
    });
  });

  describe('statistics tracking', () => {
    beforeEach(() => {
      mockedFs.access.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);
    });

    it('should track created files', async () => {
      mockedFs.access
        .mockResolvedValueOnce(undefined) // directory exists
        .mockRejectedValueOnce(new Error('File not found')); // file doesn't exist
      
      await manager.saveSteeringFile(mockSteeringFile);
      
      const stats = manager.getStats();
      expect(stats.filesCreated).toBe(1);
      expect(stats.filesUpdated).toBe(0);
      expect(stats.documentTypesProcessed).toContain(DocumentType.REQUIREMENTS);
    });

    it('should track updated files', async () => {
      mockedFs.stat.mockResolvedValue({
        mtime: new Date(Date.now() - 48 * 60 * 60 * 1000)
      } as any);
      
      await manager.saveSteeringFile(mockSteeringFile);
      
      const stats = manager.getStats();
      expect(stats.filesCreated).toBe(0);
      expect(stats.filesUpdated).toBe(1);
    });

    it('should reset statistics', () => {
      manager.resetStats();
      
      const stats = manager.getStats();
      expect(stats.filesCreated).toBe(0);
      expect(stats.filesUpdated).toBe(0);
      expect(stats.conflictsEncountered).toBe(0);
      expect(stats.documentTypesProcessed).toEqual([]);
      expect(stats.processingTimeMs).toBe(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle missing front-matter gracefully', async () => {
      const invalidFile = {
        ...mockSteeringFile,
        frontMatter: undefined as any
      };
      
      const result = await manager.saveSteeringFile(invalidFile);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('validation failed');
    });

    it('should handle missing filename gracefully', async () => {
      const invalidFile = {
        ...mockSteeringFile,
        filename: ''
      };
      
      const result = await manager.saveSteeringFile(invalidFile);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('validation failed');
    });
  });
});