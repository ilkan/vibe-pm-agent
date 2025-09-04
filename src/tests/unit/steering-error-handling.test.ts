/**
 * Unit tests for steering file error handling and validation utilities
 */

import {
  SteeringFileValidator,
  SteeringLogger,
  SteeringFallbacks,
  SteeringOperationWrapper,
  SteeringErrorRecovery,
  SteeringFileError,
  ValidationError,
  FileSystemError,
  ContentProcessingError
} from '../../utils/steering-error-handling';
import { DocumentType, SteeringFile, FrontMatter } from '../../models/steering';
import * as fs from 'fs/promises';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('SteeringFileValidator', () => {
  describe('validateSteeringFile', () => {
    it('should validate a correct steering file', () => {
      const validSteeringFile: SteeringFile = {
        filename: 'test-feature.md',
        frontMatter: {
          inclusion: 'fileMatch',
          fileMatchPattern: 'requirements*',
          generatedBy: 'pm-agent-intent-optimizer',
          generatedAt: '2024-01-01T00:00:00.000Z',
          featureName: 'test-feature',
          documentType: DocumentType.REQUIREMENTS
        },
        content: '# Test Feature\n\nThis is a test steering file with sufficient content.',
        references: ['#[[file:.kiro/specs/test-feature/design.md]]']
      };

      const result = SteeringFileValidator.validateSteeringFile(validSteeringFile);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidSteeringFile: SteeringFile = {
        filename: 'test.md',
        frontMatter: {
          inclusion: 'manual',
          generatedBy: 'test',
          generatedAt: '2024-01-01T00:00:00.000Z',
          featureName: '',
          documentType: DocumentType.REQUIREMENTS
        },
        content: 'Test content',
        references: []
      };

      const result = SteeringFileValidator.validateSteeringFile(invalidSteeringFile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'featureName')).toBe(true);
    });

    it('should detect invalid filename', () => {
      const invalidSteeringFile: SteeringFile = {
        filename: 'test.txt',
        frontMatter: {
          inclusion: 'manual',
          generatedBy: 'test',
          generatedAt: '2024-01-01T00:00:00.000Z',
          featureName: 'test',
          documentType: DocumentType.REQUIREMENTS
        },
        content: 'Test content',
        references: []
      };

      const result = SteeringFileValidator.validateSteeringFile(invalidSteeringFile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'filename')).toBe(true);
    });

    it('should detect invalid inclusion rule', () => {
      const invalidSteeringFile: SteeringFile = {
        filename: 'test.md',
        frontMatter: {
          inclusion: 'invalid' as any,
          generatedBy: 'test',
          generatedAt: '2024-01-01T00:00:00.000Z',
          featureName: 'test',
          documentType: DocumentType.REQUIREMENTS
        },
        content: 'Test content',
        references: []
      };

      const result = SteeringFileValidator.validateSteeringFile(invalidSteeringFile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'inclusion')).toBe(true);
    });

    it('should warn about missing fileMatchPattern when inclusion is fileMatch', () => {
      const steeringFile: SteeringFile = {
        filename: 'test.md',
        frontMatter: {
          inclusion: 'fileMatch',
          generatedBy: 'test',
          generatedAt: '2024-01-01T00:00:00.000Z',
          featureName: 'test',
          documentType: DocumentType.REQUIREMENTS
        },
        content: 'Test content',
        references: []
      };

      const result = SteeringFileValidator.validateSteeringFile(steeringFile);

      expect(result.warnings.some(w => w.includes('fileMatchPattern'))).toBe(true);
    });
  });

  describe('validatePMAgentDocument', () => {
    it('should validate requirements document', () => {
      const requirementsContent = `
# Requirements Document

## User Story
As a developer, I want to create requirements, so that I can build features.

## Acceptance Criteria
1. WHEN the user creates requirements THEN the system SHALL validate them
      `;

      const result = SteeringFileValidator.validatePMAgentDocument(
        requirementsContent,
        DocumentType.REQUIREMENTS
      );

      expect(result.isValid).toBe(true);
    });

    it('should detect empty document', () => {
      const result = SteeringFileValidator.validatePMAgentDocument('', DocumentType.REQUIREMENTS);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'content')).toBe(true);
    });

    it('should warn about missing requirements language', () => {
      const content = 'This is just some random text without proper documentation.';

      const result = SteeringFileValidator.validatePMAgentDocument(content, DocumentType.REQUIREMENTS);

      expect(result.isValid).toBe(true); // Content is valid but has warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('typical requirements language'))).toBe(true);
    });

    it('should validate design document structure', () => {
      const designContent = `
# Design Document

## Architecture
This describes the system architecture.

## Components
- Component A
- Component B
      `;

      const result = SteeringFileValidator.validatePMAgentDocument(designContent, DocumentType.DESIGN);

      expect(result.isValid).toBe(true);
    });
  });
});

describe('SteeringLogger', () => {
  beforeEach(() => {
    SteeringLogger.clearLogs();
  });

  it('should log messages with different levels', () => {
    SteeringLogger.info('Info message');
    SteeringLogger.warn('Warning message');
    SteeringLogger.error('Error message');
    SteeringLogger.debug('Debug message');

    const logs = SteeringLogger.getLogs();
    expect(logs).toHaveLength(4);
    expect(logs[0].level).toBe('info');
    expect(logs[1].level).toBe('warn');
    expect(logs[2].level).toBe('error');
    expect(logs[3].level).toBe('debug');
  });

  it('should include metadata in logs', () => {
    const metadata = { featureName: 'test', operation: 'save' };
    SteeringLogger.info('Test message', metadata);

    const logs = SteeringLogger.getLogs();
    expect(logs[0].metadata).toEqual(metadata);
  });

  it('should filter logs by level', () => {
    SteeringLogger.info('Info message');
    SteeringLogger.warn('Warning message');
    SteeringLogger.error('Error message');

    const errorLogs = SteeringLogger.getLogsByLevel('error');
    expect(errorLogs).toHaveLength(1);
    expect(errorLogs[0].message).toBe('Error message');
  });

  it('should format logs as string', () => {
    SteeringLogger.info('Test message', { key: 'value' });

    const logString = SteeringLogger.getLogsAsString();
    expect(logString).toContain('INFO: Test message');
    expect(logString).toContain('{"key":"value"}');
  });

  it('should maintain maximum log entries', () => {
    // Add more than the maximum number of logs
    for (let i = 0; i < 1100; i++) {
      SteeringLogger.info(`Message ${i}`);
    }

    const logs = SteeringLogger.getLogs();
    expect(logs.length).toBeLessThanOrEqual(1000);
  });
});

describe('SteeringFallbacks', () => {
  describe('generateSafeFilename', () => {
    it('should generate safe filename from invalid input', () => {
      const unsafeFilename = 'test<>:|?*.txt';
      const safeFilename = SteeringFallbacks.generateSafeFilename(unsafeFilename, DocumentType.REQUIREMENTS);

      expect(safeFilename).toMatch(/\.md$/);
      expect(safeFilename).not.toMatch(/[<>:|?*]/);
    });

    it('should handle empty filename', () => {
      const safeFilename = SteeringFallbacks.generateSafeFilename('', DocumentType.REQUIREMENTS);

      expect(safeFilename).toMatch(/requirements-.*\.md$/);
    });

    it('should preserve valid parts of filename', () => {
      const filename = 'valid-feature-name.md';
      const safeFilename = SteeringFallbacks.generateSafeFilename(filename, DocumentType.REQUIREMENTS);

      expect(safeFilename).toBe('valid-feature-name.md');
    });
  });

  describe('generateMinimalContent', () => {
    it('should generate minimal content for each document type', () => {
      const content = SteeringFallbacks.generateMinimalContent(DocumentType.REQUIREMENTS, 'test-feature');

      expect(content).toContain('Requirements Guidance: test-feature');
      expect(content).toContain('Generated:');
      expect(content).toContain('## Notes');
    });

    it('should include feature name in content', () => {
      const featureName = 'my-awesome-feature';
      const content = SteeringFallbacks.generateMinimalContent(DocumentType.DESIGN, featureName);

      expect(content).toContain(featureName);
    });
  });

  describe('generateSafeFrontMatter', () => {
    it('should generate valid front matter', () => {
      const frontMatter = SteeringFallbacks.generateSafeFrontMatter(
        DocumentType.REQUIREMENTS,
        'test-feature'
      );

      expect(frontMatter.inclusion).toBe('manual');
      expect(frontMatter.featureName).toBe('test-feature');
      expect(frontMatter.documentType).toBe(DocumentType.REQUIREMENTS);
      expect(frontMatter.generatedBy).toContain('fallback');
    });

    it('should preserve valid original front matter', () => {
      const originalFrontMatter = {
        inclusion: 'fileMatch' as const,
        fileMatchPattern: 'test*',
        description: 'Original description'
      };

      const frontMatter = SteeringFallbacks.generateSafeFrontMatter(
        DocumentType.REQUIREMENTS,
        'test-feature',
        originalFrontMatter
      );

      expect(frontMatter.inclusion).toBe('fileMatch');
      expect(frontMatter.fileMatchPattern).toBe('test*');
      expect(frontMatter.description).toBe('Original description');
    });
  });

  describe('createFallbackSteeringFile', () => {
    it('should create complete fallback steering file', () => {
      const fallbackFile = SteeringFallbacks.createFallbackSteeringFile(
        DocumentType.REQUIREMENTS,
        'test-feature'
      );

      expect(fallbackFile.filename).toMatch(/\.md$/);
      expect(fallbackFile.frontMatter.featureName).toBe('test-feature');
      expect(fallbackFile.content).toContain('test-feature');
      expect(fallbackFile.references).toEqual([]);
    });
  });
});

describe('SteeringErrorRecovery', () => {
  describe('determineRecoveryStrategy', () => {
    it('should handle file system permission errors', () => {
      const error = new FileSystemError('Permission denied', '/test/path');
      const context = {
        operation: 'save',
        attemptCount: 1,
        maxAttempts: 3,
        lastError: error,
        fallbackOptions: []
      };

      const strategy = SteeringErrorRecovery.determineRecoveryStrategy(error, context);

      expect(strategy.canRecover).toBe(false);
      expect(strategy.strategy).toBe('user_intervention');
      expect(strategy.message).toContain('Permission denied');
    });

    it('should handle file not found errors with fallback', () => {
      const error = new FileSystemError('ENOENT: no such file or directory', '/test/path');
      const context = {
        operation: 'save',
        attemptCount: 1,
        maxAttempts: 3,
        lastError: error,
        fallbackOptions: []
      };

      const strategy = SteeringErrorRecovery.determineRecoveryStrategy(error, context);

      expect(strategy.canRecover).toBe(true);
      expect(strategy.strategy).toBe('fallback');
      expect(strategy.action).toBeDefined();
    });

    it('should handle validation errors', () => {
      const error = new ValidationError('Invalid content', 'content');
      const context = {
        operation: 'validate',
        attemptCount: 1,
        maxAttempts: 3,
        lastError: error,
        fallbackOptions: []
      };

      const strategy = SteeringErrorRecovery.determineRecoveryStrategy(error, context);

      expect(strategy.canRecover).toBe(false);
      expect(strategy.strategy).toBe('user_intervention');
    });

    it('should retry for content processing errors', () => {
      const error = new ContentProcessingError('Processing failed', DocumentType.REQUIREMENTS);
      const context = {
        operation: 'process',
        attemptCount: 1,
        maxAttempts: 3,
        lastError: error,
        fallbackOptions: []
      };

      const strategy = SteeringErrorRecovery.determineRecoveryStrategy(error, context);

      expect(strategy.canRecover).toBe(true);
      expect(strategy.strategy).toBe('retry');
    });
  });

  describe('executeRecovery', () => {
    it('should execute retry strategy', async () => {
      const strategy = {
        canRecover: true,
        strategy: 'retry' as const,
        message: 'Retrying operation'
      };
      const context = {
        operation: 'test',
        attemptCount: 1,
        maxAttempts: 3,
        lastError: new Error('Test error'),
        fallbackOptions: []
      };

      const result = await SteeringErrorRecovery.executeRecovery(strategy, context);

      expect(result).toBe(true);
    });

    it('should execute fallback strategy with action', async () => {
      let actionExecuted = false;
      const strategy = {
        canRecover: true,
        strategy: 'fallback' as const,
        message: 'Using fallback',
        action: async () => {
          actionExecuted = true;
        }
      };
      const context = {
        operation: 'test',
        attemptCount: 1,
        maxAttempts: 3,
        lastError: new Error('Test error'),
        fallbackOptions: []
      };

      const result = await SteeringErrorRecovery.executeRecovery(strategy, context);

      expect(result).toBe(true);
      expect(actionExecuted).toBe(true);
    });

    it('should handle skip strategy', async () => {
      const strategy = {
        canRecover: false,
        strategy: 'skip' as const,
        message: 'Skipping operation'
      };
      const context = {
        operation: 'test',
        attemptCount: 3,
        maxAttempts: 3,
        lastError: new Error('Test error'),
        fallbackOptions: []
      };

      const result = await SteeringErrorRecovery.executeRecovery(strategy, context);

      expect(result).toBe(false);
    });
  });
});

describe('SteeringOperationWrapper', () => {
  beforeEach(() => {
    SteeringLogger.clearLogs();
  });

  it('should execute successful operation', async () => {
    const operation = jest.fn().mockResolvedValue('success');

    const result = await SteeringOperationWrapper.executeWithErrorHandling(
      operation,
      'testOperation'
    );

    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry failed operations', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success');

    const result = await SteeringOperationWrapper.executeWithErrorHandling(
      operation,
      'testOperation',
      3
    );

    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should fail after max attempts', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'));

    const result = await SteeringOperationWrapper.executeWithErrorHandling(
      operation,
      'testOperation',
      2
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Persistent failure');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should log operation attempts', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success');

    await SteeringOperationWrapper.executeWithErrorHandling(
      operation,
      'testOperation',
      2
    );

    const logs = SteeringLogger.getLogs();
    expect(logs.some(log => log.message.includes('Executing testOperation'))).toBe(true);
    expect(logs.some(log => log.message.includes('succeeded after'))).toBe(true);
  });
});

describe('Custom Error Types', () => {
  it('should create SteeringFileError with correct properties', () => {
    const error = new SteeringFileError(
      'Test error',
      'TEST_CODE',
      'test_operation',
      true,
      new Error('Cause')
    );

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.operation).toBe('test_operation');
    expect(error.recoverable).toBe(true);
    expect(error.cause).toBeDefined();
    expect(error.name).toBe('SteeringFileError');
  });

  it('should create ValidationError with field information', () => {
    const error = new ValidationError('Invalid field', 'testField');

    expect(error.field).toBe('testField');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.operation).toBe('validation');
    expect(error.name).toBe('ValidationError');
  });

  it('should create FileSystemError with file path', () => {
    const error = new FileSystemError('File operation failed', '/test/path');

    expect(error.filePath).toBe('/test/path');
    expect(error.code).toBe('FILESYSTEM_ERROR');
    expect(error.operation).toBe('file_operation');
    expect(error.name).toBe('FileSystemError');
  });

  it('should create ContentProcessingError with document type', () => {
    const error = new ContentProcessingError('Processing failed', DocumentType.REQUIREMENTS);

    expect(error.documentType).toBe(DocumentType.REQUIREMENTS);
    expect(error.code).toBe('CONTENT_PROCESSING_ERROR');
    expect(error.operation).toBe('content_processing');
    expect(error.name).toBe('ContentProcessingError');
  });
});