/**
 * SteeringFileManager Component
 * 
 * Handles file system operations for steering files including saving, conflict detection,
 * and intelligent filename generation.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  SteeringFile, 
  SaveResult, 
  ConflictInfo, 
  DocumentType,
  SteeringFileStats 
} from '../../models/steering';
import {
  SteeringFileValidator,
  SteeringLogger,
  SteeringFallbacks,
  SteeringOperationWrapper,
  FileSystemError,
  ValidationError
} from '../../utils/steering-error-handling';

/**
 * Configuration options for SteeringFileManager
 */
export interface SteeringFileManagerConfig {
  /** Base directory for steering files (default: .kiro/steering) */
  steeringDirectory: string;
  /** Whether to create backup files before overwriting */
  createBackups: boolean;
  /** Maximum number of versioned files to keep */
  maxVersions: number;
  /** Whether to validate file content before saving */
  validateContent: boolean;
}

/**
 * Default configuration for SteeringFileManager
 */
const DEFAULT_CONFIG: SteeringFileManagerConfig = {
  steeringDirectory: '.kiro/steering',
  createBackups: true,
  maxVersions: 5,
  validateContent: true
};

/**
 * SteeringFileManager handles all file system operations for steering files
 */
export class SteeringFileManager {
  private config: SteeringFileManagerConfig;
  private stats: SteeringFileStats;

  constructor(config: Partial<SteeringFileManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      filesCreated: 0,
      filesUpdated: 0,
      conflictsEncountered: 0,
      documentTypesProcessed: [],
      processingTimeMs: 0
    };
  }

  /**
   * Save a steering file to the file system with comprehensive error handling and validation
   */
  async saveSteeringFile(steeringFile: SteeringFile): Promise<SaveResult> {
    const startTime = Date.now();
    
    SteeringLogger.info('Starting steering file save operation', {
      filename: steeringFile.filename,
      documentType: steeringFile.frontMatter.documentType,
      featureName: steeringFile.frontMatter.featureName
    });

    const result = await SteeringOperationWrapper.executeWithErrorHandling(
      async () => {
        // Validate steering file content first
        if (this.config.validateContent) {
          const validationResult = SteeringFileValidator.validateSteeringFile(steeringFile);
          
          if (!validationResult.isValid) {
            SteeringLogger.warn('Steering file validation failed, attempting recovery', {
              errors: validationResult.errors.map(e => e.message),
              warnings: validationResult.warnings
            });

            // Attempt to create a fallback steering file
            const fallbackFile = SteeringFallbacks.createFallbackSteeringFile(
              steeringFile.frontMatter.documentType,
              steeringFile.frontMatter.featureName,
              steeringFile.content,
              steeringFile.frontMatter
            );

            // Use fallback if original is severely broken
            if (validationResult.errors.length > 3) {
              steeringFile = fallbackFile;
              SteeringLogger.info('Using fallback steering file due to severe validation errors');
            } else {
              // Try to fix minor issues
              steeringFile = this.attemptValidationFixes(steeringFile, validationResult);
            }
          } else if (validationResult.warnings.length > 0) {
            SteeringLogger.warn('Steering file validation warnings', {
              warnings: validationResult.warnings,
              suggestions: validationResult.suggestions
            });
          }
        }

        // Ensure steering directory exists
        await this.ensureSteeringDirectoryWithErrorHandling();

        // Check for conflicts with enhanced error handling
        const conflictInfo = await this.checkConflictsWithErrorHandling(steeringFile.filename);
        
        if (conflictInfo.exists) {
          this.stats.conflictsEncountered++;
          SteeringLogger.info('Conflict detected, resolving', {
            existingFile: conflictInfo.existingFile,
            suggestedAction: conflictInfo.suggestedAction
          });
          
          const resolvedFilename = await this.resolveConflict(steeringFile, conflictInfo);
          steeringFile.filename = resolvedFilename;
        }

        // Generate full file path
        const fullPath = path.join(this.config.steeringDirectory, steeringFile.filename);
        steeringFile.fullPath = fullPath;

        // Create backup if file exists and backups are enabled
        if (this.config.createBackups && await this.fileExists(fullPath)) {
          await this.createBackupWithErrorHandling(fullPath);
        }

        // Generate the complete file content
        const fileContent = this.generateFileContent(steeringFile);

        // Write the file with error handling
        await this.writeFileWithErrorHandling(fullPath, fileContent);

        // Update statistics
        const action = conflictInfo.exists ? 'updated' : 'created';
        this.updateStats(action, steeringFile.frontMatter.documentType);

        SteeringLogger.info('Steering file saved successfully', {
          filename: steeringFile.filename,
          action,
          fullPath
        });

        return {
          success: true,
          filename: steeringFile.filename,
          action: action as 'created' | 'updated',
          message: `Steering file ${action} successfully`,
          fullPath
        };
      },
      'saveSteeringFile'
    );

    this.stats.processingTimeMs += Date.now() - startTime;

    if (!result.success) {
      SteeringLogger.error('Failed to save steering file', {
        filename: steeringFile.filename,
        error: result.error?.message,
        recoveryApplied: result.recoveryApplied
      });

      return {
        success: false,
        filename: steeringFile.filename,
        action: 'skipped',
        message: result.recoveryApplied 
          ? `Save failed but recovery applied: ${result.recoveryApplied}`
          : `Failed to save steering file: ${result.error?.message || 'Unknown error'}`,
        fullPath: steeringFile.fullPath,
        warnings: result.error ? [result.error.message] : undefined
      };
    }

    return result.result!;
  }

  /**
   * Check for conflicts with existing steering files
   */
  async checkConflicts(filename: string): Promise<ConflictInfo> {
    const fullPath = path.join(this.config.steeringDirectory, filename);
    
    try {
      const exists = await this.fileExists(fullPath);
      
      if (!exists) {
        return {
          exists: false,
          suggestedAction: 'update'
        };
      }

      // File exists, determine suggested action
      const stats = await fs.stat(fullPath);
      const isRecent = Date.now() - stats.mtime.getTime() < 24 * 60 * 60 * 1000; // 24 hours

      return {
        exists: true,
        existingFile: fullPath,
        suggestedAction: isRecent ? 'version' : 'update',
        reason: isRecent 
          ? 'File was modified recently, consider versioning'
          : 'File exists but is older, safe to update',
        suggestedFilename: isRecent ? this.generateVersionedFilename(filename) : filename
      };

    } catch (error) {
      return {
        exists: false,
        suggestedAction: 'update',
        reason: `Could not check file status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate intelligent filename based on feature name and document type
   */
  resolveNaming(baseName: string, documentType: string): string {
    // Sanitize base name
    const sanitizedBaseName = this.sanitizeFilename(baseName);
    
    // Generate filename based on document type
    const typePrefix = this.getDocumentTypePrefix(documentType);
    
    // Combine parts
    let filename: string;
    if (typePrefix) {
      filename = `${typePrefix}-${sanitizedBaseName}.md`;
    } else {
      filename = `${sanitizedBaseName}.md`;
    }

    return filename;
  }

  /**
   * List all existing steering files in the steering directory
   */
  async listExistingSteeringFiles(): Promise<string[]> {
    try {
      await this.ensureSteeringDirectory();
      const files = await fs.readdir(this.config.steeringDirectory);
      return files.filter(file => file.endsWith('.md'));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get statistics about steering file operations
   */
  getStats(): SteeringFileStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      filesCreated: 0,
      filesUpdated: 0,
      conflictsEncountered: 0,
      documentTypesProcessed: [],
      processingTimeMs: 0
    };
  }

  // Private helper methods

  private async ensureSteeringDirectory(): Promise<void> {
    try {
      await fs.access(this.config.steeringDirectory);
    } catch {
      await fs.mkdir(this.config.steeringDirectory, { recursive: true });
    }
  }

  private async ensureSteeringDirectoryWithErrorHandling(): Promise<void> {
    try {
      await fs.access(this.config.steeringDirectory);
    } catch {
      try {
        await fs.mkdir(this.config.steeringDirectory, { recursive: true });
        SteeringLogger.info('Created steering directory', { directory: this.config.steeringDirectory });
      } catch (error) {
        throw new FileSystemError(
          `Failed to create steering directory: ${this.config.steeringDirectory}`,
          this.config.steeringDirectory,
          error instanceof Error ? error : undefined
        );
      }
    }
  }

  private async checkConflictsWithErrorHandling(filename: string): Promise<ConflictInfo> {
    try {
      return await this.checkConflicts(filename);
    } catch (error) {
      SteeringLogger.warn('Error checking for conflicts, assuming no conflict', {
        filename,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        exists: false,
        suggestedAction: 'update',
        reason: 'Could not check for conflicts due to error'
      };
    }
  }

  private async createBackupWithErrorHandling(filePath: string): Promise<void> {
    try {
      const backupPath = `${filePath}.backup`;
      await fs.copyFile(filePath, backupPath);
      SteeringLogger.debug('Created backup file', { original: filePath, backup: backupPath });
    } catch (error) {
      // Backup failure shouldn't prevent the main operation
      SteeringLogger.warn('Failed to create backup file', {
        filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async writeFileWithErrorHandling(filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      throw new FileSystemError(
        `Failed to write steering file: ${filePath}`,
        filePath,
        error instanceof Error ? error : undefined
      );
    }
  }

  private attemptValidationFixes(steeringFile: SteeringFile, validationResult: any): SteeringFile {
    const fixedFile = { ...steeringFile };
    
    // Fix common validation issues
    for (const error of validationResult.errors) {
      if (error.field === 'filename' && !fixedFile.filename.endsWith('.md')) {
        fixedFile.filename = SteeringFallbacks.generateSafeFilename(
          fixedFile.filename,
          fixedFile.frontMatter.documentType
        );
        SteeringLogger.info('Fixed filename validation issue', { 
          original: steeringFile.filename,
          fixed: fixedFile.filename
        });
      }
      
      if (error.field === 'content' && (!fixedFile.content || fixedFile.content.trim().length === 0)) {
        fixedFile.content = SteeringFallbacks.generateMinimalContent(
          fixedFile.frontMatter.documentType,
          fixedFile.frontMatter.featureName
        );
        SteeringLogger.info('Fixed empty content validation issue');
      }
      
      if (error.field === 'generatedAt' && fixedFile.frontMatter.generatedAt) {
        try {
          new Date(fixedFile.frontMatter.generatedAt);
        } catch {
          fixedFile.frontMatter.generatedAt = new Date().toISOString();
          SteeringLogger.info('Fixed timestamp validation issue');
        }
      }
    }
    
    return fixedFile;
  }

  private updateStats(action: 'created' | 'updated', documentType: DocumentType): void {
    if (action === 'created') {
      this.stats.filesCreated++;
    } else {
      this.stats.filesUpdated++;
    }

    if (!this.stats.documentTypesProcessed.includes(documentType)) {
      this.stats.documentTypesProcessed.push(documentType);
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async resolveConflict(steeringFile: SteeringFile, conflictInfo: ConflictInfo): Promise<string> {
    switch (conflictInfo.suggestedAction) {
      case 'version':
        return this.generateVersionedFilename(steeringFile.filename);
      case 'rename':
        return conflictInfo.suggestedFilename || this.generateVersionedFilename(steeringFile.filename);
      case 'update':
      default:
        return steeringFile.filename;
    }
  }

  private generateVersionedFilename(originalFilename: string): string {
    const ext = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, ext);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${baseName}-${timestamp}${ext}`;
  }

  private async createBackup(filePath: string): Promise<void> {
    try {
      const backupPath = `${filePath}.backup`;
      await fs.copyFile(filePath, backupPath);
    } catch (error) {
      // Backup failure shouldn't prevent the main operation
      console.warn(`Failed to create backup for ${filePath}:`, error);
    }
  }

  private validateSteeringFileContent(steeringFile: SteeringFile): boolean {
    // Basic validation checks
    if (!steeringFile.content || steeringFile.content.trim().length === 0) {
      return false;
    }

    if (!steeringFile.frontMatter || !steeringFile.frontMatter.featureName) {
      return false;
    }

    if (!steeringFile.filename || !steeringFile.filename.endsWith('.md')) {
      return false;
    }

    return true;
  }

  private generateFileContent(steeringFile: SteeringFile): string {
    // Generate front-matter YAML
    const frontMatterLines = [
      '---',
      `inclusion: ${steeringFile.frontMatter.inclusion}`,
    ];

    if (steeringFile.frontMatter.fileMatchPattern) {
      frontMatterLines.push(`fileMatchPattern: '${steeringFile.frontMatter.fileMatchPattern}'`);
    }

    frontMatterLines.push(
      `generatedBy: ${steeringFile.frontMatter.generatedBy}`,
      `generatedAt: ${steeringFile.frontMatter.generatedAt}`,
      `featureName: ${steeringFile.frontMatter.featureName}`,
      `documentType: ${steeringFile.frontMatter.documentType}`
    );

    if (steeringFile.frontMatter.description) {
      frontMatterLines.push(`description: ${steeringFile.frontMatter.description}`);
    }

    frontMatterLines.push('---', '');

    // Combine front-matter and content
    return frontMatterLines.join('\n') + steeringFile.content;
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9\-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private getDocumentTypePrefix(documentType: string): string {
    const prefixMap: Record<string, string> = {
      [DocumentType.REQUIREMENTS]: 'requirements',
      [DocumentType.DESIGN]: 'design',
      [DocumentType.ONEPAGER]: 'onepager',
      [DocumentType.PRFAQ]: 'prfaq',
      [DocumentType.TASKS]: 'tasks'
    };

    return prefixMap[documentType] || '';
  }
}

export default SteeringFileManager;