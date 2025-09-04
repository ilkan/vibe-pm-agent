/**
 * Integration tests for steering file error handling and validation
 */

import { SteeringFileManager } from '../../components/steering-file-manager';
import { SteeringService } from '../../components/steering-service';
import { DocumentType, SteeringFile } from '../../models/steering';
import {
  SteeringLogger,
  SteeringFallbacks,
  ValidationError,
  FileSystemError
} from '../../utils/steering-error-handling';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

// Mock fs for controlled testing
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Steering Error Handling Integration', () => {
  let tempDir: string;
  let steeringManager: SteeringFileManager;
  let steeringService: SteeringService;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(tmpdir(), `steering-test-${Date.now()}`);
    
    // Reset mocks
    jest.clearAllMocks();
    SteeringLogger.clearLogs();

    // Configure components with test directory
    steeringManager = new SteeringFileManager({
      steeringDirectory: tempDir,
      createBackups: true,
      maxVersions: 3,
      validateContent: true
    });

    steeringService = new SteeringService({
      enabled: true,
      steeringDirectory: tempDir,
      defaultOptions: {
        autoSave: true,
        promptForConfirmation: false,
        includeReferences: true,
        namingStrategy: 'feature-based',
        overwriteExisting: false
      }
    });
  });

  describe('SteeringFileManager Error Handling', () => {
    it('should handle permission errors gracefully', async () => {
      const steeringFile: SteeringFile = {
        filename: 'test-feature.md',
        frontMatter: {
          inclusion: 'manual',
          generatedBy: 'test',
          generatedAt: new Date().toISOString(),
          featureName: 'test-feature',
          documentType: DocumentType.REQUIREMENTS
        },
        content: 'Test content',
        references: []
      };

      // Mock permission error
      mockFs.access.mockRejectedValue(new Error('Permission denied'));
      mockFs.mkdir.mockRejectedValue(new Error('EACCES: permission denied'));

      const result = await steeringManager.saveSteeringFile(steeringFile);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to save steering file');
      
      // Check that error was logged
      const errorLogs = SteeringLogger.getLogsByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
    });

    it('should create directory when it does not exist', async () => {
      const steeringFile: SteeringFile = {
        filename: 'test-feature.md',
        frontMatter: {
          inclusion: 'manual',
          generatedBy: 'test',
          generatedAt: new Date().toISOString(),
          featureName: 'test-feature',
          documentType: DocumentType.REQUIREMENTS
        },
        content: 'Test content',
        references: []
      };

      // Mock directory not existing, then successful creation
      mockFs.access
        .mockRejectedValueOnce(new Error('ENOENT: no such file or directory'))
        .mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ mtime: new Date() } as any);

      const result = await steeringManager.saveSteeringFile(steeringFile);

      expect(result.success).toBe(true);
      expect(mockFs.mkdir).toHaveBeenCalledWith(tempDir, { recursive: true });
      
      // Check that directory creation was logged
      const infoLogs = SteeringLogger.getLogsByLevel('info');
      expect(infoLogs.some(log => log.message.includes('Created steering directory'))).toBe(true);
    });

    it('should handle file write errors with retry', async () => {
      const steeringFile: SteeringFile = {
        filename: 'test-feature.md',
        frontMatter: {
          inclusion: 'manual',
          generatedBy: 'test',
          generatedAt: new Date().toISOString(),
          featureName: 'test-feature',
          documentType: DocumentType.REQUIREMENTS
        },
        content: 'Test content',
        references: []
      };

      // Mock successful directory access but failed write, then success
      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ mtime: new Date(Date.now() - 48 * 60 * 60 * 1000) } as any);
      mockFs.writeFile
        .mockRejectedValueOnce(new Error('Temporary write failure'))
        .mockResolvedValue(undefined);

      const result = await steeringManager.saveSteeringFile(steeringFile);

      expect(result.success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);
      
      // Check retry was logged
      const logs = SteeringLogger.getLogs();
      expect(logs.some(log => log.message.includes('succeeded after'))).toBe(true);
    });

    it('should use fallback content for invalid steering files', async () => {
      const invalidSteeringFile: SteeringFile = {
        filename: 'invalid<>file.txt', // Invalid filename
        frontMatter: {
          inclusion: 'invalid' as any, // Invalid inclusion rule
          generatedBy: '',
          generatedAt: 'invalid-date',
          featureName: '',
          documentType: DocumentType.REQUIREMENTS
        },
        content: '', // Empty content
        references: []
      };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ mtime: new Date(Date.now() - 48 * 60 * 60 * 1000) } as any);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await steeringManager.saveSteeringFile(invalidSteeringFile);

      expect(result.success).toBe(true);
      
      // Check that fallback was used
      const warnLogs = SteeringLogger.getLogsByLevel('warn');
      expect(warnLogs.some(log => log.message.includes('validation failed'))).toBe(true);
      
      // Verify the file was written with corrected content
      expect(mockFs.writeFile).toHaveBeenCalled();
      const writeCall = mockFs.writeFile.mock.calls[0];
      const writtenContent = writeCall[1] as string;
      expect(writtenContent).toContain('featureName: unnamed-feature');
      expect(writtenContent).toContain('inclusion: manual');
    });

    it('should handle backup creation failures gracefully', async () => {
      const steeringFile: SteeringFile = {
        filename: 'existing-file.md',
        frontMatter: {
          inclusion: 'manual',
          generatedBy: 'test',
          generatedAt: new Date().toISOString(),
          featureName: 'test-feature',
          documentType: DocumentType.REQUIREMENTS
        },
        content: 'Test content',
        references: []
      };

      // Mock existing file and backup failure
      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ mtime: new Date(Date.now() - 48 * 60 * 60 * 1000) } as any);
      mockFs.copyFile.mockRejectedValue(new Error('Backup failed'));
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await steeringManager.saveSteeringFile(steeringFile);

      expect(result.success).toBe(true);
      
      // Check that backup failure was logged but didn't prevent save
      const warnLogs = SteeringLogger.getLogsByLevel('warn');
      expect(warnLogs.some(log => log.message.includes('Failed to create backup'))).toBe(true);
    });
  });

  describe('SteeringService Error Handling', () => {
    it('should validate PM agent documents before processing', async () => {
      const emptyRequirements = '';

      const result = await steeringService.createFromRequirements(emptyRequirements, {
        create_steering_files: true,
        feature_name: 'test-feature'
      });

      expect(result.created).toBe(false);
      expect(result.message).toContain('validation failed');
      expect(result.warnings).toBeDefined();
    });

    it('should handle malformed PM agent documents', async () => {
      const malformedRequirements = 'This is not a proper requirements document.';

      const result = await steeringService.createFromRequirements(malformedRequirements, {
        create_steering_files: true,
        feature_name: 'test-feature'
      });

      // Should still process but with warnings
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    });

    it('should handle content processing errors', async () => {
      const validRequirements = `
# Requirements Document

## User Story
As a developer, I want to create requirements, so that I can build features.

## Acceptance Criteria
1. WHEN the user creates requirements THEN the system SHALL validate them
      `;

      // Mock the generator to throw an error
      const originalGenerator = steeringService['generator'];
      steeringService['generator'] = {
        ...originalGenerator,
        generateFromRequirements: jest.fn().mockImplementation(() => {
          throw new Error('Content processing failed');
        })
      } as any;

      const result = await steeringService.createFromRequirements(validRequirements, {
        create_steering_files: true,
        feature_name: 'test-feature'
      });

      expect(result.created).toBe(false);
      expect(result.message).toContain('Failed');
      
      // Check error was logged
      const errorLogs = SteeringLogger.getLogsByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
    });

    it('should handle reference linking failures gracefully', async () => {
      const validRequirements = `
# Requirements Document

## User Story
As a developer, I want to create requirements, so that I can build features.
      `;

      // Mock reference linker to throw error
      const originalReferenceLinker = steeringService['referenceLinker'];
      steeringService['referenceLinker'] = {
        ...originalReferenceLinker,
        addFileReferences: jest.fn().mockImplementation(() => {
          throw new Error('Reference linking failed');
        })
      } as any;

      // Mock successful file operations
      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ mtime: new Date(Date.now() - 48 * 60 * 60 * 1000) } as any);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await steeringService.createFromRequirements(validRequirements, {
        create_steering_files: true,
        feature_name: 'test-feature'
      });

      // Should still succeed despite reference linking failure
      expect(result.created).toBe(true);
      
      // Check warning was logged
      const warnLogs = SteeringLogger.getLogsByLevel('warn');
      expect(warnLogs.some(log => log.message.includes('Failed to add file references'))).toBe(true);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from temporary file system issues', async () => {
      const steeringFile: SteeringFile = {
        filename: 'recovery-test.md',
        frontMatter: {
          inclusion: 'manual',
          generatedBy: 'test',
          generatedAt: new Date().toISOString(),
          featureName: 'recovery-test',
          documentType: DocumentType.REQUIREMENTS
        },
        content: 'Test content for recovery',
        references: []
      };

      // Simulate temporary failure then success
      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ mtime: new Date(Date.now() - 48 * 60 * 60 * 1000) } as any);
      mockFs.writeFile
        .mockRejectedValueOnce(new Error('EMFILE: too many open files'))
        .mockRejectedValueOnce(new Error('EAGAIN: resource temporarily unavailable'))
        .mockResolvedValue(undefined);

      const result = await steeringManager.saveSteeringFile(steeringFile);

      expect(result.success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalledTimes(3);
      
      // Check retry attempts were logged
      const logs = SteeringLogger.getLogs();
      expect(logs.some(log => log.message.includes('succeeded after'))).toBe(true);
    });

    it('should use fallback strategies for severe validation failures', async () => {
      const severelyInvalidFile: SteeringFile = {
        filename: '', // Empty filename
        frontMatter: {
          inclusion: 'invalid' as any,
          generatedBy: '',
          generatedAt: 'not-a-date',
          featureName: '',
          documentType: 'invalid' as any
        },
        content: '', // Empty content
        references: ['invalid-reference']
      };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ mtime: new Date(Date.now() - 48 * 60 * 60 * 1000) } as any);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await steeringManager.saveSteeringFile(severelyInvalidFile);

      expect(result.success).toBe(true);
      
      // Check that fallback was used due to severe validation errors
      const infoLogs = SteeringLogger.getLogsByLevel('info');
      expect(infoLogs.some(log => log.message.includes('Using fallback steering file'))).toBe(true);
      
      // Verify fallback content was written
      expect(mockFs.writeFile).toHaveBeenCalled();
      const writeCall = mockFs.writeFile.mock.calls[0];
      const writtenContent = writeCall[1] as string;
      expect(writtenContent).toContain('minimal content due to processing issues');
    });
  });

  describe('Logging and Monitoring', () => {
    it('should log all steering file operations', async () => {
      const steeringFile: SteeringFile = {
        filename: 'logging-test.md',
        frontMatter: {
          inclusion: 'manual',
          generatedBy: 'test',
          generatedAt: new Date().toISOString(),
          featureName: 'logging-test',
          documentType: DocumentType.REQUIREMENTS
        },
        content: 'Test content for logging',
        references: []
      };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ mtime: new Date(Date.now() - 48 * 60 * 60 * 1000) } as any);
      mockFs.writeFile.mockResolvedValue(undefined);

      await steeringManager.saveSteeringFile(steeringFile);

      const logs = SteeringLogger.getLogs();
      
      // Check that operation start and success were logged
      expect(logs.some(log => log.message.includes('Starting steering file save operation'))).toBe(true);
      expect(logs.some(log => log.message.includes('Steering file saved successfully'))).toBe(true);
      
      // Check that metadata was included
      const startLog = logs.find(log => log.message.includes('Starting steering file save operation'));
      expect(startLog?.metadata).toEqual({
        filename: 'logging-test.md',
        documentType: DocumentType.REQUIREMENTS,
        featureName: 'logging-test'
      });
    });

    it('should export logs to file', async () => {
      SteeringLogger.info('Test log entry');
      SteeringLogger.error('Test error entry');

      const logFilePath = path.join(tempDir, 'test-logs.txt');
      
      // Mock successful file write
      mockFs.writeFile.mockResolvedValue(undefined);

      await SteeringLogger.exportLogs(logFilePath);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        logFilePath,
        expect.stringContaining('INFO: Test log entry'),
        'utf8'
      );
    });

    it('should filter logs by level for export', async () => {
      SteeringLogger.info('Info message');
      SteeringLogger.warn('Warning message');
      SteeringLogger.error('Error message');

      const logFilePath = path.join(tempDir, 'error-logs.txt');
      
      mockFs.writeFile.mockResolvedValue(undefined);

      await SteeringLogger.exportLogs(logFilePath, 'error');

      const writeCall = mockFs.writeFile.mock.calls[0];
      const logContent = writeCall[1] as string;
      
      expect(logContent).toContain('ERROR: Error message');
      expect(logContent).not.toContain('INFO: Info message');
      expect(logContent).not.toContain('WARN: Warning message');
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track error statistics', async () => {
      const steeringFile: SteeringFile = {
        filename: 'stats-test.md',
        frontMatter: {
          inclusion: 'manual',
          generatedBy: 'test',
          generatedAt: new Date().toISOString(),
          featureName: 'stats-test',
          documentType: DocumentType.REQUIREMENTS
        },
        content: 'Test content',
        references: []
      };

      // Mock conflict scenario
      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ mtime: new Date() } as any); // Recent file
      mockFs.writeFile.mockResolvedValue(undefined);

      await steeringManager.saveSteeringFile(steeringFile);

      const stats = steeringManager.getStats();
      expect(stats.conflictsEncountered).toBe(1);
      expect(stats.filesCreated).toBe(0);
      expect(stats.filesUpdated).toBe(1);
      expect(stats.documentTypesProcessed).toContain(DocumentType.REQUIREMENTS);
    });

    it('should reset statistics', async () => {
      // Generate some stats first
      const steeringFile: SteeringFile = {
        filename: 'reset-test.md',
        frontMatter: {
          inclusion: 'manual',
          generatedBy: 'test',
          generatedAt: new Date().toISOString(),
          featureName: 'reset-test',
          documentType: DocumentType.REQUIREMENTS
        },
        content: 'Test content',
        references: []
      };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockRejectedValue(new Error('ENOENT: no such file or directory')); // No existing file
      mockFs.writeFile.mockResolvedValue(undefined);

      await steeringManager.saveSteeringFile(steeringFile);

      let stats = steeringManager.getStats();
      expect(stats.filesCreated).toBe(1);

      steeringManager.resetStats();

      stats = steeringManager.getStats();
      expect(stats.filesCreated).toBe(0);
      expect(stats.filesUpdated).toBe(0);
      expect(stats.conflictsEncountered).toBe(0);
      expect(stats.documentTypesProcessed).toEqual([]);
    });
  });
});