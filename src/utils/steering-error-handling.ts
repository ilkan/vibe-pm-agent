/**
 * Steering File Error Handling Utilities
 * 
 * Comprehensive error handling and validation for steering file operations
 * with graceful fallbacks and recovery strategies.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { SteeringFile, DocumentType, FrontMatter } from '../models/steering';

/**
 * Custom error types for steering file operations
 */
export class SteeringFileError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly operation: string,
    public readonly recoverable: boolean = true,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SteeringFileError';
  }
}

export class ValidationError extends SteeringFileError {
  constructor(message: string, public readonly field: string, cause?: Error) {
    super(message, 'VALIDATION_ERROR', 'validation', true, cause);
    this.name = 'ValidationError';
  }
}

export class FileSystemError extends SteeringFileError {
  constructor(message: string, public readonly filePath: string, cause?: Error) {
    super(message, 'FILESYSTEM_ERROR', 'file_operation', true, cause);
    this.name = 'FileSystemError';
  }
}

export class ContentProcessingError extends SteeringFileError {
  constructor(message: string, public readonly documentType: DocumentType, cause?: Error) {
    super(message, 'CONTENT_PROCESSING_ERROR', 'content_processing', true, cause);
    this.name = 'ContentProcessingError';
  }
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Recovery strategy interface
 */
export interface RecoveryStrategy {
  canRecover: boolean;
  strategy: 'retry' | 'fallback' | 'skip' | 'user_intervention';
  message: string;
  action?: () => Promise<void>;
}

/**
 * Error recovery context
 */
export interface ErrorRecoveryContext {
  operation: string;
  attemptCount: number;
  maxAttempts: number;
  lastError: Error;
  fallbackOptions: string[];
}

/**
 * Comprehensive validator for steering file content and structure
 */
export class SteeringFileValidator {
  private static readonly REQUIRED_FRONT_MATTER_FIELDS = [
    'inclusion',
    'generatedBy',
    'generatedAt',
    'featureName',
    'documentType'
  ];

  private static readonly VALID_INCLUSION_RULES = ['always', 'fileMatch', 'manual'];
  private static readonly VALID_DOCUMENT_TYPES = Object.values(DocumentType);

  /**
   * Validate a complete steering file
   */
  static validateSteeringFile(steeringFile: SteeringFile): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Validate filename
      this.validateFilename(steeringFile.filename, errors, warnings);

      // Validate front matter
      this.validateFrontMatter(steeringFile.frontMatter, errors, warnings, suggestions);

      // Validate content
      this.validateContent(steeringFile.content, errors, warnings, suggestions);

      // Validate references
      this.validateReferences(steeringFile.references, warnings, suggestions);

      // Cross-validation checks
      this.performCrossValidation(steeringFile, errors, warnings, suggestions);

    } catch (error) {
      errors.push(new ValidationError(
        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'general',
        error instanceof Error ? error : undefined
      ));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validate PM agent document content before processing
   */
  static validatePMAgentDocument(content: string, documentType: DocumentType): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Basic content validation
      if (!content || content.trim().length === 0) {
        errors.push(new ValidationError('Document content is empty', 'content'));
        return { isValid: false, errors, warnings, suggestions };
      }

      // Document type specific validation
      switch (documentType) {
        case DocumentType.REQUIREMENTS:
          this.validateRequirementsDocument(content, errors, warnings, suggestions);
          break;
        case DocumentType.DESIGN:
          this.validateDesignDocument(content, errors, warnings, suggestions);
          break;
        case DocumentType.ONEPAGER:
          this.validateOnePagerDocument(content, errors, warnings, suggestions);
          break;
        case DocumentType.PRFAQ:
          this.validatePRFAQDocument(content, errors, warnings, suggestions);
          break;
        case DocumentType.TASKS:
          this.validateTasksDocument(content, errors, warnings, suggestions);
          break;
      }

      // Check for malformed markdown
      this.validateMarkdownStructure(content, warnings, suggestions);

    } catch (error) {
      errors.push(new ValidationError(
        `Document validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'document',
        error instanceof Error ? error : undefined
      ));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Private validation methods

  private static validateFilename(filename: string, errors: ValidationError[], warnings: string[]): void {
    if (!filename) {
      errors.push(new ValidationError('Filename is required', 'filename'));
      return;
    }

    if (!filename.endsWith('.md')) {
      errors.push(new ValidationError('Filename must end with .md extension', 'filename'));
    }

    if (filename.includes('/') || filename.includes('\\')) {
      errors.push(new ValidationError('Filename should not contain path separators', 'filename'));
    }

    if (filename.length > 255) {
      warnings.push('Filename is very long and may cause issues on some file systems');
    }

    // Check for invalid characters
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(filename)) {
      errors.push(new ValidationError('Filename contains invalid characters', 'filename'));
    }
  }

  private static validateFrontMatter(
    frontMatter: FrontMatter, 
    errors: ValidationError[], 
    warnings: string[], 
    suggestions: string[]
  ): void {
    if (!frontMatter) {
      errors.push(new ValidationError('Front matter is required', 'frontMatter'));
      return;
    }

    // Check required fields
    for (const field of this.REQUIRED_FRONT_MATTER_FIELDS) {
      if (!(field in frontMatter) || !frontMatter[field as keyof FrontMatter]) {
        errors.push(new ValidationError(`Required front matter field '${field}' is missing`, field));
      }
    }

    // Validate inclusion rule
    if (frontMatter.inclusion && !this.VALID_INCLUSION_RULES.includes(frontMatter.inclusion)) {
      errors.push(new ValidationError(
        `Invalid inclusion rule: ${frontMatter.inclusion}. Must be one of: ${this.VALID_INCLUSION_RULES.join(', ')}`,
        'inclusion'
      ));
    }

    // Validate document type
    if (frontMatter.documentType && !this.VALID_DOCUMENT_TYPES.includes(frontMatter.documentType)) {
      errors.push(new ValidationError(
        `Invalid document type: ${frontMatter.documentType}. Must be one of: ${this.VALID_DOCUMENT_TYPES.join(', ')}`,
        'documentType'
      ));
    }

    // Validate fileMatch pattern when inclusion is 'fileMatch'
    if (frontMatter.inclusion === 'fileMatch' && !frontMatter.fileMatchPattern) {
      warnings.push('fileMatchPattern is recommended when inclusion is set to "fileMatch"');
      suggestions.push('Consider adding a fileMatchPattern to specify which files this steering applies to');
    }

    // Validate timestamp format
    if (frontMatter.generatedAt) {
      try {
        const date = new Date(frontMatter.generatedAt);
        if (isNaN(date.getTime())) {
          errors.push(new ValidationError('generatedAt must be a valid ISO timestamp', 'generatedAt'));
        }
      } catch {
        errors.push(new ValidationError('generatedAt must be a valid ISO timestamp', 'generatedAt'));
      }
    }

    // Validate feature name
    if (frontMatter.featureName) {
      if (frontMatter.featureName.length < 2) {
        warnings.push('Feature name is very short');
      }
      if (frontMatter.featureName.length > 100) {
        warnings.push('Feature name is very long');
      }
    }
  }

  private static validateContent(
    content: string, 
    errors: ValidationError[], 
    warnings: string[], 
    suggestions: string[]
  ): void {
    if (!content || content.trim().length === 0) {
      errors.push(new ValidationError('Content is required', 'content'));
      return;
    }

    if (content.length < 50) {
      warnings.push('Content is very short for a steering file');
      suggestions.push('Consider adding more detailed guidance or context');
    }

    if (content.length > 50000) {
      warnings.push('Content is very long and may impact performance');
      suggestions.push('Consider breaking this into multiple steering files');
    }

    // Check for common markdown issues
    const lines = content.split('\n');
    let hasHeaders = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('#')) {
        hasHeaders = true;
      }
      
      // Check for very long lines
      if (line.length > 200) {
        warnings.push(`Line ${i + 1} is very long (${line.length} characters)`);
      }
    }

    if (!hasHeaders) {
      suggestions.push('Consider adding headers to structure the steering file content');
    }
  }

  private static validateReferences(references: string[], warnings: string[], suggestions: string[]): void {
    if (!references || references.length === 0) {
      suggestions.push('Consider adding file references to related documents using #[[file:path]] syntax');
      return;
    }

    const fileRefPattern = /^#\[\[file:[^\]]+\]\]$/;
    
    for (const ref of references) {
      if (!fileRefPattern.test(ref)) {
        warnings.push(`Reference "${ref}" does not follow the expected #[[file:path]] format`);
      }
    }
  }

  private static performCrossValidation(
    steeringFile: SteeringFile,
    errors: ValidationError[],
    warnings: string[],
    suggestions: string[]
  ): void {
    // Check consistency between filename and front matter
    if (steeringFile.filename && steeringFile.frontMatter.featureName) {
      const sanitizedFeatureName = steeringFile.frontMatter.featureName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      
      if (!steeringFile.filename.toLowerCase().includes(sanitizedFeatureName)) {
        warnings.push('Filename does not appear to match the feature name');
        suggestions.push('Consider using a filename that includes the feature name for better organization');
      }
    }

    // Check if document type matches content structure
    if (steeringFile.frontMatter.documentType === DocumentType.REQUIREMENTS) {
      if (!steeringFile.content.toLowerCase().includes('requirement')) {
        warnings.push('Content does not appear to contain requirements-related information');
      }
    }
  }

  // Document type specific validation methods

  private static validateRequirementsDocument(
    content: string, 
    errors: ValidationError[], 
    warnings: string[], 
    suggestions: string[]
  ): void {
    const lowerContent = content.toLowerCase();
    
    if (!lowerContent.includes('requirement') && !lowerContent.includes('user story')) {
      warnings.push('Requirements document does not contain typical requirements language');
    }

    if (!lowerContent.includes('acceptance criteria') && !lowerContent.includes('shall')) {
      suggestions.push('Consider including acceptance criteria or formal requirements language');
    }
  }

  private static validateDesignDocument(
    content: string, 
    errors: ValidationError[], 
    warnings: string[], 
    suggestions: string[]
  ): void {
    const lowerContent = content.toLowerCase();
    
    if (!lowerContent.includes('design') && !lowerContent.includes('architecture')) {
      warnings.push('Design document does not contain typical design language');
    }

    if (!lowerContent.includes('component') && !lowerContent.includes('interface')) {
      suggestions.push('Consider including component or interface descriptions');
    }
  }

  private static validateOnePagerDocument(
    content: string, 
    errors: ValidationError[], 
    warnings: string[], 
    suggestions: string[]
  ): void {
    const lowerContent = content.toLowerCase();
    
    if (!lowerContent.includes('executive') && !lowerContent.includes('summary')) {
      warnings.push('One-pager document does not contain typical executive summary language');
    }

    if (!lowerContent.includes('roi') && !lowerContent.includes('cost') && !lowerContent.includes('benefit')) {
      suggestions.push('Consider including ROI or cost-benefit analysis');
    }
  }

  private static validatePRFAQDocument(
    content: string, 
    errors: ValidationError[], 
    warnings: string[], 
    suggestions: string[]
  ): void {
    const lowerContent = content.toLowerCase();
    
    if (!lowerContent.includes('press release') && !lowerContent.includes('faq')) {
      warnings.push('PR-FAQ document does not contain typical press release or FAQ language');
    }

    if (!lowerContent.includes('customer') && !lowerContent.includes('benefit')) {
      suggestions.push('Consider including customer benefits and value proposition');
    }
  }

  private static validateTasksDocument(
    content: string, 
    errors: ValidationError[], 
    warnings: string[], 
    suggestions: string[]
  ): void {
    const lowerContent = content.toLowerCase();
    
    if (!lowerContent.includes('task') && !lowerContent.includes('implementation')) {
      warnings.push('Tasks document does not contain typical task or implementation language');
    }

    if (!content.includes('- [ ]') && !content.includes('- [x]')) {
      suggestions.push('Consider using checkbox format for tasks (- [ ] Task description)');
    }
  }

  private static validateMarkdownStructure(content: string, warnings: string[], suggestions: string[]): void {
    // Check for common markdown issues
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeBlockCount = 0;
    
    for (const line of lines) {
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        codeBlockCount++;
      }
    }
    
    if (codeBlockCount % 2 !== 0) {
      warnings.push('Unmatched code block markers (```) detected');
    }
    
    // Check for unescaped special characters that might cause issues
    if (content.includes('{{') || content.includes('}}')) {
      suggestions.push('Consider escaping template-like syntax if not intentional');
    }
  }
}
/**

 * Error recovery manager for steering file operations
 */
export class SteeringErrorRecovery {
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY_MS = 1000;

  /**
   * Determine recovery strategy for a given error
   */
  static determineRecoveryStrategy(error: Error, context: ErrorRecoveryContext): RecoveryStrategy {
    if (error instanceof FileSystemError) {
      return this.handleFileSystemError(error, context);
    }
    
    if (error instanceof ValidationError) {
      return this.handleValidationError(error, context);
    }
    
    if (error instanceof ContentProcessingError) {
      return this.handleContentProcessingError(error, context);
    }
    
    // Generic error handling
    return this.handleGenericError(error, context);
  }

  /**
   * Execute recovery strategy
   */
  static async executeRecovery(strategy: RecoveryStrategy, context: ErrorRecoveryContext): Promise<boolean> {
    try {
      switch (strategy.strategy) {
        case 'retry':
          if (context.attemptCount < context.maxAttempts) {
            await this.delay(this.RETRY_DELAY_MS * context.attemptCount);
            return true; // Indicate retry should be attempted
          }
          return false;
          
        case 'fallback':
          if (strategy.action) {
            await strategy.action();
            return true;
          }
          return false;
          
        case 'skip':
          SteeringLogger.warn(`Skipping operation: ${strategy.message}`, { context });
          return false;
          
        case 'user_intervention':
          SteeringLogger.error(`User intervention required: ${strategy.message}`, { 
            context, 
            error: context.lastError 
          });
          return false;
          
        default:
          return false;
      }
    } catch (recoveryError) {
      SteeringLogger.error('Recovery strategy failed', { 
        originalError: context.lastError,
        recoveryError,
        strategy: strategy.strategy
      });
      return false;
    }
  }

  // Private recovery strategy handlers

  private static handleFileSystemError(error: FileSystemError, context: ErrorRecoveryContext): RecoveryStrategy {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('permission') || errorMessage.includes('access')) {
      return {
        canRecover: false,
        strategy: 'user_intervention',
        message: `Permission denied for file operation: ${error.filePath}. Please check file permissions.`
      };
    }
    
    if (errorMessage.includes('no space') || errorMessage.includes('disk full')) {
      return {
        canRecover: false,
        strategy: 'user_intervention',
        message: 'Insufficient disk space. Please free up space and try again.'
      };
    }
    
    if (errorMessage.includes('not found') || errorMessage.includes('enoent')) {
      return {
        canRecover: true,
        strategy: 'fallback',
        message: 'Directory does not exist, attempting to create it',
        action: async () => {
          const dir = path.dirname(error.filePath);
          await fs.mkdir(dir, { recursive: true });
        }
      };
    }
    
    // Generic file system error - try retry
    if (context.attemptCount < context.maxAttempts) {
      return {
        canRecover: true,
        strategy: 'retry',
        message: `Retrying file operation (attempt ${context.attemptCount + 1}/${context.maxAttempts})`
      };
    }
    
    return {
      canRecover: false,
      strategy: 'skip',
      message: `File system operation failed after ${context.maxAttempts} attempts`
    };
  }

  private static handleValidationError(error: ValidationError, context: ErrorRecoveryContext): RecoveryStrategy {
    if (error.field === 'content' && error.message.includes('empty')) {
      return {
        canRecover: true,
        strategy: 'fallback',
        message: 'Using minimal content template for empty content',
        action: async () => {
          // This would be handled by the calling code to use a fallback template
        }
      };
    }
    
    if (error.field === 'filename') {
      return {
        canRecover: true,
        strategy: 'fallback',
        message: 'Generating safe filename',
        action: async () => {
          // This would be handled by the calling code to generate a safe filename
        }
      };
    }
    
    // Most validation errors require user intervention
    return {
      canRecover: false,
      strategy: 'user_intervention',
      message: `Validation failed: ${error.message}. Please correct the input and try again.`
    };
  }

  private static handleContentProcessingError(error: ContentProcessingError, context: ErrorRecoveryContext): RecoveryStrategy {
    if (error.message.includes('malformed') || error.message.includes('parse')) {
      return {
        canRecover: true,
        strategy: 'fallback',
        message: 'Using simplified content processing for malformed document',
        action: async () => {
          // This would be handled by the calling code to use simplified processing
        }
      };
    }
    
    // Try retry for transient processing errors
    if (context.attemptCount < context.maxAttempts) {
      return {
        canRecover: true,
        strategy: 'retry',
        message: `Retrying content processing (attempt ${context.attemptCount + 1}/${context.maxAttempts})`
      };
    }
    
    return {
      canRecover: false,
      strategy: 'skip',
      message: `Content processing failed after ${context.maxAttempts} attempts`
    };
  }

  private static handleGenericError(error: Error, context: ErrorRecoveryContext): RecoveryStrategy {
    // Try retry for unknown errors
    if (context.attemptCount < context.maxAttempts) {
      return {
        canRecover: true,
        strategy: 'retry',
        message: `Retrying operation (attempt ${context.attemptCount + 1}/${context.maxAttempts})`
      };
    }
    
    return {
      canRecover: false,
      strategy: 'skip',
      message: `Operation failed after ${context.maxAttempts} attempts: ${error.message}`
    };
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Logging utility for steering file operations
 */
export class SteeringLogger {
  private static logs: LogEntry[] = [];
  private static readonly MAX_LOG_ENTRIES = 1000;

  /**
   * Log an info message
   */
  static info(message: string, metadata?: Record<string, any>): void {
    this.addLog('info', message, metadata);
  }

  /**
   * Log a warning message
   */
  static warn(message: string, metadata?: Record<string, any>): void {
    this.addLog('warn', message, metadata);
  }

  /**
   * Log an error message
   */
  static error(message: string, metadata?: Record<string, any>): void {
    this.addLog('error', message, metadata);
  }

  /**
   * Log a debug message
   */
  static debug(message: string, metadata?: Record<string, any>): void {
    this.addLog('debug', message, metadata);
  }

  /**
   * Get all log entries
   */
  static getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get log entries by level
   */
  static getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear all logs
   */
  static clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get logs as formatted string
   */
  static getLogsAsString(level?: LogLevel): string {
    const logsToFormat = level ? this.getLogsByLevel(level) : this.logs;
    
    return logsToFormat
      .map(log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${
        log.metadata ? ` | ${JSON.stringify(log.metadata)}` : ''
      }`)
      .join('\n');
  }

  /**
   * Export logs to file
   */
  static async exportLogs(filePath: string, level?: LogLevel): Promise<void> {
    try {
      const logContent = this.getLogsAsString(level);
      await fs.writeFile(filePath, logContent, 'utf8');
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  }

  private static addLog(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata
    };

    this.logs.push(logEntry);

    // Maintain max log entries
    if (this.logs.length > this.MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(-this.MAX_LOG_ENTRIES);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? console.error : 
                           level === 'warn' ? console.warn : 
                           console.log;
      
      consoleMethod(`[SteeringFile] ${message}`, metadata || '');
    }
  }
}

/**
 * Log entry interface
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Log level type
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Graceful fallback utilities for steering file operations
 */
export class SteeringFallbacks {
  /**
   * Generate a safe filename when the original fails validation
   */
  static generateSafeFilename(originalFilename: string, documentType: DocumentType): string {
    try {
      // Remove invalid characters and normalize
      let safeFilename = originalFilename
        .replace(/[<>:"|?*]/g, '')
        .replace(/[/\\]/g, '-')
        .replace(/\s+/g, '-')
        .toLowerCase();

      // Ensure it has the right extension
      if (!safeFilename.endsWith('.md')) {
        safeFilename = safeFilename.replace(/\.[^.]*$/, '') + '.md';
      }

      // If still invalid, generate a new one
      if (safeFilename.length < 3 || safeFilename === '.md') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        safeFilename = `${documentType}-${timestamp}.md`;
      }

      return safeFilename;
    } catch (error) {
      // Ultimate fallback
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      return `steering-file-${timestamp}.md`;
    }
  }

  /**
   * Generate minimal content when original content is invalid
   */
  static generateMinimalContent(documentType: DocumentType, featureName: string): string {
    const timestamp = new Date().toISOString();
    
    return `# ${documentType.charAt(0).toUpperCase() + documentType.slice(1)} Guidance: ${featureName}

This steering file was generated with minimal content due to processing issues with the original document.

Generated: ${timestamp}

## Notes

The original document could not be processed properly. Please review and update this steering file with appropriate guidance content.

## Related Documents

Please add references to related files using the #[[file:path]] syntax.
`;
  }

  /**
   * Generate safe front matter when original fails validation
   */
  static generateSafeFrontMatter(
    documentType: DocumentType, 
    featureName: string, 
    originalFrontMatter?: Partial<FrontMatter>
  ): FrontMatter {
    const timestamp = new Date().toISOString();
    
    // Validate the original inclusion rule
    const validInclusionRules = ['always', 'fileMatch', 'manual'];
    const safeInclusion = originalFrontMatter?.inclusion && validInclusionRules.includes(originalFrontMatter.inclusion) 
      ? originalFrontMatter.inclusion 
      : 'manual';
    
    return {
      inclusion: safeInclusion,
      fileMatchPattern: originalFrontMatter?.fileMatchPattern,
      generatedBy: originalFrontMatter?.generatedBy || 'vibe-pm-agent-fallback',
      generatedAt: timestamp,
      featureName: featureName || 'unnamed-feature',
      documentType,
      description: originalFrontMatter?.description || `Fallback ${documentType} guidance`
    };
  }

  /**
   * Create a complete fallback steering file
   */
  static createFallbackSteeringFile(
    documentType: DocumentType,
    featureName: string,
    originalContent?: string,
    originalFrontMatter?: Partial<FrontMatter>
  ): SteeringFile {
    const safeFeatureName = featureName || 'unnamed-feature';
    const filename = this.generateSafeFilename(`${documentType}-${safeFeatureName}.md`, documentType);
    const frontMatter = this.generateSafeFrontMatter(documentType, safeFeatureName, originalFrontMatter);
    
    let content = originalContent;
    if (!content || content.trim().length === 0) {
      content = this.generateMinimalContent(documentType, safeFeatureName);
    }

    return {
      filename,
      frontMatter,
      content,
      references: []
    };
  }
}

/**
 * Comprehensive error handling wrapper for steering file operations
 */
export class SteeringOperationWrapper {
  /**
   * Execute a steering file operation with comprehensive error handling
   */
  static async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxAttempts: number = 3
  ): Promise<{ success: boolean; result?: T; error?: Error; recoveryApplied?: string }> {
    let lastError: Error | null = null;
    let attemptCount = 0;

    while (attemptCount < maxAttempts) {
      try {
        SteeringLogger.debug(`Executing ${operationName}`, { attempt: attemptCount + 1, maxAttempts });
        
        const result = await operation();
        
        if (attemptCount > 0) {
          SteeringLogger.info(`${operationName} succeeded after ${attemptCount + 1} attempts`);
        }
        
        return { success: true, result };
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attemptCount++;
        
        SteeringLogger.warn(`${operationName} failed on attempt ${attemptCount}`, { 
          error: lastError.message,
          attempt: attemptCount,
          maxAttempts
        });

        if (attemptCount < maxAttempts) {
          const context: ErrorRecoveryContext = {
            operation: operationName,
            attemptCount,
            maxAttempts,
            lastError,
            fallbackOptions: []
          };

          const strategy = SteeringErrorRecovery.determineRecoveryStrategy(lastError, context);
          
          if (strategy.canRecover) {
            const recovered = await SteeringErrorRecovery.executeRecovery(strategy, context);
            
            if (recovered && strategy.strategy === 'retry') {
              continue; // Retry the operation
            } else if (recovered) {
              return { 
                success: true, 
                recoveryApplied: strategy.message 
              };
            }
          }
        }
      }
    }

    SteeringLogger.error(`${operationName} failed after ${maxAttempts} attempts`, { 
      finalError: lastError?.message,
      totalAttempts: attemptCount
    });

    return { 
      success: false, 
      error: lastError || new Error(`${operationName} failed after ${maxAttempts} attempts`) 
    };
  }
}