/**
 * Steering File Management Utilities
 * 
 * Provides utility methods for listing, organizing, cleaning up, and analyzing
 * existing steering files to maintain an efficient steering file system.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  SteeringFile, 
  FrontMatter, 
  DocumentType,
  SteeringFileStats,
  InclusionRule 
} from '../../models/steering';
import {
  SteeringLogger,
  SteeringOperationWrapper,
  FileSystemError
} from '../../utils/steering-error-handling';

/**
 * Information about a steering file discovered in the file system
 */
export interface SteeringFileInfo {
  /** Filename without path */
  filename: string;
  /** Full path to the file */
  fullPath: string;
  /** Parsed front-matter metadata */
  frontMatter: FrontMatter;
  /** File size in bytes */
  sizeBytes: number;
  /** Last modified timestamp */
  lastModified: Date;
  /** Creation timestamp */
  created: Date;
  /** Whether the file appears to be valid */
  isValid: boolean;
  /** Any validation errors found */
  validationErrors: string[];
}

/**
 * Analytics data about steering file usage and effectiveness
 */
export interface SteeringFileAnalytics {
  /** Total number of steering files */
  totalFiles: number;
  /** Files by document type */
  filesByType: Record<DocumentType, number>;
  /** Files by inclusion rule */
  filesByInclusionRule: Record<InclusionRule, number>;
  /** Average file age in days */
  averageAgeDays: number;
  /** Files that appear outdated (older than threshold) */
  outdatedFiles: SteeringFileInfo[];
  /** Files that appear unused (no recent access) */
  unusedFiles: SteeringFileInfo[];
  /** Files with validation issues */
  invalidFiles: SteeringFileInfo[];
  /** Total disk space used by steering files */
  totalSizeBytes: number;
  /** Most common feature names */
  topFeatures: Array<{ featureName: string; count: number }>;
  /** Files that reference non-existent documents */
  brokenReferences: Array<{ file: SteeringFileInfo; brokenRefs: string[] }>;
}

/**
 * Options for cleanup operations
 */
export interface CleanupOptions {
  /** Remove files older than this many days */
  maxAgeDays?: number;
  /** Remove files that haven't been accessed in this many days */
  maxUnusedDays?: number;
  /** Remove files with validation errors */
  removeInvalid?: boolean;
  /** Remove files with broken references */
  removeBrokenRefs?: boolean;
  /** Perform dry run without actually deleting files */
  dryRun?: boolean;
  /** Create backups before deletion */
  createBackups?: boolean;
}

/**
 * Result of a cleanup operation
 */
export interface CleanupResult {
  /** Number of files removed */
  filesRemoved: number;
  /** Number of files backed up */
  filesBackedUp: number;
  /** List of files that were removed */
  removedFiles: string[];
  /** List of files that were backed up */
  backedUpFiles: string[];
  /** Any errors encountered during cleanup */
  errors: string[];
  /** Total space freed in bytes */
  spaceFreedBytes: number;
}

/**
 * Configuration for steering file utilities
 */
export interface SteeringUtilitiesConfig {
  /** Base directory for steering files */
  steeringDirectory: string;
  /** Directory for backups */
  backupDirectory: string;
  /** Default age threshold for outdated files (days) */
  defaultMaxAgeDays: number;
  /** Default unused threshold (days) */
  defaultMaxUnusedDays: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SteeringUtilitiesConfig = {
  steeringDirectory: '.kiro/steering',
  backupDirectory: '.kiro/steering/.backups',
  defaultMaxAgeDays: 90,
  defaultMaxUnusedDays: 30
};

/**
 * SteeringFileUtilities provides management and analytics capabilities for steering files
 */
export class SteeringFileUtilities {
  private config: SteeringUtilitiesConfig;

  constructor(config: Partial<SteeringUtilitiesConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * List all steering files with detailed information
   */
  async listSteeringFiles(): Promise<SteeringFileInfo[]> {
    SteeringLogger.info('Listing all steering files', { 
      directory: this.config.steeringDirectory 
    });

    return SteeringOperationWrapper.executeWithErrorHandling(
      async () => {
        const files: SteeringFileInfo[] = [];
        
        try {
          await fs.access(this.config.steeringDirectory);
        } catch {
          SteeringLogger.warn('Steering directory does not exist', {
            directory: this.config.steeringDirectory
          });
          return files;
        }

        const entries = await fs.readdir(this.config.steeringDirectory, { withFileTypes: true });
        const markdownFiles = entries.filter(entry => 
          entry.isFile() && entry.name.endsWith('.md')
        );

        for (const file of markdownFiles) {
          try {
            const fileInfo = await this.getSteeringFileInfo(file.name);
            files.push(fileInfo);
          } catch (error) {
            SteeringLogger.warn('Failed to process steering file', {
              filename: file.name,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        SteeringLogger.info('Steering file listing completed', {
          totalFiles: files.length,
          validFiles: files.filter(f => f.isValid).length
        });

        return files;
      },
      'listSteeringFiles'
    ).then(result => result.success ? result.result! : []);
  }

  /**
   * Organize steering files by feature, type, or other criteria
   */
  async organizeSteeringFiles(): Promise<{
    byFeature: Record<string, SteeringFileInfo[]>;
    byType: Record<DocumentType, SteeringFileInfo[]>;
    byInclusionRule: Record<InclusionRule, SteeringFileInfo[]>;
    invalid: SteeringFileInfo[];
    outdated: SteeringFileInfo[];
  }> {
    const files = await this.listSteeringFiles();
    
    const organized = {
      byFeature: {} as Record<string, SteeringFileInfo[]>,
      byType: {} as Record<DocumentType, SteeringFileInfo[]>,
      byInclusionRule: {} as Record<InclusionRule, SteeringFileInfo[]>,
      invalid: [] as SteeringFileInfo[],
      outdated: [] as SteeringFileInfo[]
    };

    const maxAge = this.config.defaultMaxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const file of files) {
      // Organize by feature
      const featureName = file.frontMatter?.featureName || 'unknown';
      if (!organized.byFeature[featureName]) {
        organized.byFeature[featureName] = [];
      }
      organized.byFeature[featureName].push(file);

      // Organize by document type
      if (file.frontMatter?.documentType) {
        const docType = file.frontMatter.documentType;
        if (!organized.byType[docType]) {
          organized.byType[docType] = [];
        }
        organized.byType[docType].push(file);
      }

      // Organize by inclusion rule
      if (file.frontMatter?.inclusion) {
        const inclusion = file.frontMatter.inclusion;
        if (!organized.byInclusionRule[inclusion]) {
          organized.byInclusionRule[inclusion] = [];
        }
        organized.byInclusionRule[inclusion].push(file);
      }

      // Categorize invalid files
      if (!file.isValid) {
        organized.invalid.push(file);
      }

      // Categorize outdated files
      if (now - file.lastModified.getTime() > maxAge) {
        organized.outdated.push(file);
      }
    }

    SteeringLogger.info('Steering files organized', {
      totalFeatures: Object.keys(organized.byFeature).length,
      totalTypes: Object.keys(organized.byType).length,
      invalidFiles: organized.invalid.length,
      outdatedFiles: organized.outdated.length
    });

    return organized;
  }

  /**
   * Generate comprehensive analytics about steering file usage and effectiveness
   */
  async generateAnalytics(): Promise<SteeringFileAnalytics> {
    SteeringLogger.info('Generating steering file analytics');

    const files = await this.listSteeringFiles();
    const now = Date.now();
    const maxAge = this.config.defaultMaxAgeDays * 24 * 60 * 60 * 1000;
    const maxUnused = this.config.defaultMaxUnusedDays * 24 * 60 * 60 * 1000;

    const analytics: SteeringFileAnalytics = {
      totalFiles: files.length,
      filesByType: {} as Record<DocumentType, number>,
      filesByInclusionRule: {} as Record<InclusionRule, number>,
      averageAgeDays: 0,
      outdatedFiles: [],
      unusedFiles: [],
      invalidFiles: [],
      totalSizeBytes: 0,
      topFeatures: [],
      brokenReferences: []
    };

    // Initialize counters
    Object.values(DocumentType).forEach(type => {
      analytics.filesByType[type] = 0;
    });

    const inclusionRules: InclusionRule[] = ['always', 'fileMatch', 'manual'];
    inclusionRules.forEach(rule => {
      analytics.filesByInclusionRule[rule] = 0;
    });

    const featureCounts: Record<string, number> = {};
    let totalAge = 0;

    for (const file of files) {
      // Count by type
      if (file.frontMatter?.documentType) {
        analytics.filesByType[file.frontMatter.documentType]++;
      }

      // Count by inclusion rule
      if (file.frontMatter?.inclusion) {
        analytics.filesByInclusionRule[file.frontMatter.inclusion]++;
      }

      // Calculate age
      const age = now - file.created.getTime();
      totalAge += age;

      // Check if outdated
      if (age > maxAge) {
        analytics.outdatedFiles.push(file);
      }

      // Check if unused (using last modified as proxy for access)
      if (now - file.lastModified.getTime() > maxUnused) {
        analytics.unusedFiles.push(file);
      }

      // Check if invalid
      if (!file.isValid) {
        analytics.invalidFiles.push(file);
      }

      // Count features
      const featureName = file.frontMatter?.featureName || 'unknown';
      featureCounts[featureName] = (featureCounts[featureName] || 0) + 1;

      // Sum file sizes
      analytics.totalSizeBytes += file.sizeBytes;

      // Check for broken references
      const brokenRefs = await this.checkBrokenReferences(file);
      if (brokenRefs.length > 0) {
        analytics.brokenReferences.push({ file, brokenRefs });
      }
    }

    // Calculate average age
    analytics.averageAgeDays = files.length > 0 
      ? Math.round(totalAge / files.length / (24 * 60 * 60 * 1000))
      : 0;

    // Get top features
    analytics.topFeatures = Object.entries(featureCounts)
      .map(([featureName, count]) => ({ featureName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    SteeringLogger.info('Analytics generation completed', {
      totalFiles: analytics.totalFiles,
      outdatedFiles: analytics.outdatedFiles.length,
      invalidFiles: analytics.invalidFiles.length,
      totalSizeMB: Math.round(analytics.totalSizeBytes / 1024 / 1024 * 100) / 100
    });

    return analytics;
  }

  /**
   * Clean up outdated or unused steering files
   */
  async cleanupSteeringFiles(options: CleanupOptions = {}): Promise<CleanupResult> {
    const opts = {
      maxAgeDays: options.maxAgeDays ?? this.config.defaultMaxAgeDays,
      maxUnusedDays: options.maxUnusedDays ?? this.config.defaultMaxUnusedDays,
      removeInvalid: options.removeInvalid ?? false,
      removeBrokenRefs: options.removeBrokenRefs ?? false,
      dryRun: options.dryRun ?? false,
      createBackups: options.createBackups ?? true
    };

    SteeringLogger.info('Starting steering file cleanup', { options: opts });

    const result: CleanupResult = {
      filesRemoved: 0,
      filesBackedUp: 0,
      removedFiles: [],
      backedUpFiles: [],
      errors: [],
      spaceFreedBytes: 0
    };

    const files = await this.listSteeringFiles();
    const now = Date.now();
    const maxAge = opts.maxAgeDays * 24 * 60 * 60 * 1000;
    const maxUnused = opts.maxUnusedDays * 24 * 60 * 60 * 1000;

    const filesToRemove: SteeringFileInfo[] = [];

    for (const file of files) {
      let shouldRemove = false;
      let reason = '';

      // Check age
      if (now - file.created.getTime() > maxAge) {
        shouldRemove = true;
        reason = `older than ${opts.maxAgeDays} days`;
      }

      // Check unused
      else if (now - file.lastModified.getTime() > maxUnused) {
        shouldRemove = true;
        reason = reason ? `${reason} and unused for ${opts.maxUnusedDays} days` 
                        : `unused for ${opts.maxUnusedDays} days`;
      }

      // Check invalid
      if (opts.removeInvalid && !file.isValid) {
        shouldRemove = true;
        reason = reason ? `${reason} and invalid` : 'invalid';
      }

      // Check broken references
      if (opts.removeBrokenRefs) {
        const brokenRefs = await this.checkBrokenReferences(file);
        if (brokenRefs.length > 0) {
          shouldRemove = true;
          reason = reason ? `${reason} and has broken references` : 'has broken references';
        }
      }

      if (shouldRemove) {
        filesToRemove.push(file);
        SteeringLogger.debug('File marked for removal', {
          filename: file.filename,
          reason
        });
      }
    }

    // Process removals
    for (const file of filesToRemove) {
      try {
        // Create backup if requested
        if (opts.createBackups && !opts.dryRun) {
          await this.createBackup(file);
          result.filesBackedUp++;
          result.backedUpFiles.push(file.filename);
        }

        // Remove file if not dry run
        if (!opts.dryRun) {
          await fs.unlink(file.fullPath);
          result.spaceFreedBytes += file.sizeBytes;
        }

        result.filesRemoved++;
        result.removedFiles.push(file.filename);

        SteeringLogger.info('Steering file removed', {
          filename: file.filename,
          dryRun: opts.dryRun,
          sizeBytes: file.sizeBytes
        });

      } catch (error) {
        const errorMsg = `Failed to remove ${file.filename}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        result.errors.push(errorMsg);
        SteeringLogger.error('Failed to remove steering file', {
          filename: file.filename,
          error: errorMsg
        });
      }
    }

    SteeringLogger.info('Steering file cleanup completed', {
      filesRemoved: result.filesRemoved,
      filesBackedUp: result.filesBackedUp,
      spaceFreedMB: Math.round(result.spaceFreedBytes / 1024 / 1024 * 100) / 100,
      errors: result.errors.length,
      dryRun: opts.dryRun
    });

    return result;
  }

  // Private helper methods

  private async getSteeringFileInfo(filename: string): Promise<SteeringFileInfo> {
    const fullPath = path.join(this.config.steeringDirectory, filename);
    const stats = await fs.stat(fullPath);
    const content = await fs.readFile(fullPath, 'utf8');

    const fileInfo: SteeringFileInfo = {
      filename,
      fullPath,
      frontMatter: {} as FrontMatter,
      sizeBytes: stats.size,
      lastModified: stats.mtime,
      created: stats.birthtime,
      isValid: false,
      validationErrors: []
    };

    try {
      // Parse front-matter
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontMatterMatch) {
        const frontMatterText = frontMatterMatch[1];
        fileInfo.frontMatter = this.parseFrontMatter(frontMatterText);
        fileInfo.isValid = this.validateFrontMatter(fileInfo.frontMatter);
      } else {
        fileInfo.validationErrors.push('No front-matter found');
      }

      // Additional validation
      if (!content.trim()) {
        fileInfo.validationErrors.push('File is empty');
      }

      if (fileInfo.validationErrors.length === 0 && fileInfo.frontMatter) {
        fileInfo.isValid = true;
      }

    } catch (error) {
      fileInfo.validationErrors.push(
        `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return fileInfo;
  }

  private parseFrontMatter(frontMatterText: string): FrontMatter {
    const lines = frontMatterText.split('\n');
    const frontMatter: Partial<FrontMatter> = {};

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        const cleanValue = value.replace(/^['"]|['"]$/g, ''); // Remove quotes

        switch (key) {
          case 'inclusion':
            frontMatter.inclusion = cleanValue as InclusionRule;
            break;
          case 'fileMatchPattern':
            frontMatter.fileMatchPattern = cleanValue;
            break;
          case 'generatedBy':
            frontMatter.generatedBy = cleanValue;
            break;
          case 'generatedAt':
            frontMatter.generatedAt = cleanValue;
            break;
          case 'featureName':
            frontMatter.featureName = cleanValue;
            break;
          case 'documentType':
            frontMatter.documentType = cleanValue as DocumentType;
            break;
          case 'description':
            frontMatter.description = cleanValue;
            break;
        }
      }
    }

    return frontMatter as FrontMatter;
  }

  private validateFrontMatter(frontMatter: FrontMatter): boolean {
    return !!(
      frontMatter.inclusion &&
      frontMatter.generatedBy &&
      frontMatter.generatedAt &&
      frontMatter.featureName &&
      frontMatter.documentType
    );
  }

  private async checkBrokenReferences(file: SteeringFileInfo): Promise<string[]> {
    try {
      const content = await fs.readFile(file.fullPath, 'utf8');
      const referencePattern = /#\[\[file:([^\]]+)\]\]/g;
      const brokenRefs: string[] = [];
      let match;

      while ((match = referencePattern.exec(content)) !== null) {
        const referencedPath = match[1];
        const fullReferencedPath = path.resolve(referencedPath);
        
        try {
          await fs.access(fullReferencedPath);
        } catch {
          brokenRefs.push(referencedPath);
        }
      }

      return brokenRefs;
    } catch {
      return [];
    }
  }

  private async createBackup(file: SteeringFileInfo): Promise<void> {
    try {
      // Ensure backup directory exists
      await fs.mkdir(this.config.backupDirectory, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupFilename = `${path.basename(file.filename, '.md')}-${timestamp}.md`;
      const backupPath = path.join(this.config.backupDirectory, backupFilename);

      await fs.copyFile(file.fullPath, backupPath);

      SteeringLogger.debug('Backup created', {
        original: file.filename,
        backup: backupFilename
      });

    } catch (error) {
      throw new FileSystemError(
        `Failed to create backup for ${file.filename}`,
        file.fullPath,
        error instanceof Error ? error : undefined
      );
    }
  }
}

export default SteeringFileUtilities;