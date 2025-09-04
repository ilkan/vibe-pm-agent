/**
 * SteeringFilePreview Component
 * 
 * Provides preview generation and customization options for steering files
 * before they are saved to the file system.
 */

import { 
  SteeringFile, 
  SteeringContext, 
  FrontMatter, 
  DocumentType,
  InclusionRule,
  ConflictInfo 
} from '../../models/steering';
import { SteeringFileManager } from '../steering-file-manager';
import { FrontMatterProcessor } from '../front-matter-processor';

/**
 * Customization options for steering file generation
 */
export interface SteeringFileCustomization {
  /** Custom filename (without extension) */
  filename?: string;
  /** Custom inclusion rule */
  inclusionRule?: InclusionRule;
  /** Custom file match pattern */
  fileMatchPattern?: string;
  /** Custom description */
  description?: string;
  /** Whether to include file references */
  includeReferences?: boolean;
  /** Custom content modifications */
  contentModifications?: {
    /** Additional content to prepend */
    prependContent?: string;
    /** Additional content to append */
    appendContent?: string;
    /** Content replacements */
    replacements?: Array<{ search: string; replace: string }>;
  };
}

/**
 * Preview information for a steering file
 */
export interface SteeringFilePreviewInfo {
  /** The steering file that would be created */
  steeringFile: SteeringFile;
  /** Preview of the complete file content */
  previewContent: string;
  /** Estimated file size in bytes */
  estimatedSize: number;
  /** Conflict information if file already exists */
  conflictInfo?: ConflictInfo;
  /** Validation warnings or issues */
  warnings: string[];
  /** Suggestions for improvement */
  suggestions: string[];
}

/**
 * Batch operation configuration for multiple steering files
 */
export interface BatchOperationConfig {
  /** List of steering files to process */
  steeringFiles: SteeringFile[];
  /** Common customization to apply to all files */
  commonCustomization?: Partial<SteeringFileCustomization>;
  /** Individual customizations per file (by filename) */
  individualCustomizations?: Record<string, SteeringFileCustomization>;
  /** Whether to stop on first error */
  stopOnError?: boolean;
  /** Whether to create backups before batch operations */
  createBackups?: boolean;
}

/**
 * Result of a batch operation
 */
export interface BatchOperationResult {
  /** Total number of files processed */
  totalProcessed: number;
  /** Number of successful operations */
  successful: number;
  /** Number of failed operations */
  failed: number;
  /** Detailed results for each file */
  results: Array<{
    filename: string;
    success: boolean;
    message: string;
    error?: string;
  }>;
  /** Overall operation summary */
  summary: string;
}

/**
 * SteeringFilePreview provides preview and customization capabilities
 */
export class SteeringFilePreview {
  private steeringFileManager: SteeringFileManager;
  private frontMatterProcessor: FrontMatterProcessor;

  constructor(
    steeringFileManager?: SteeringFileManager,
    frontMatterProcessor?: FrontMatterProcessor
  ) {
    this.steeringFileManager = steeringFileManager || new SteeringFileManager();
    this.frontMatterProcessor = frontMatterProcessor || new FrontMatterProcessor();
  }

  /**
   * Generate a preview of a steering file with customization options
   */
  async generatePreview(
    baseSteeringFile: SteeringFile,
    customization?: SteeringFileCustomization
  ): Promise<SteeringFilePreviewInfo> {
    // Apply customizations to create the final steering file
    const customizedFile = await this.applyCustomizations(baseSteeringFile, customization);

    // Generate the complete file content
    const previewContent = this.generateCompleteFileContent(customizedFile);

    // Check for conflicts
    const conflictInfo = await this.steeringFileManager.checkConflicts(customizedFile.filename);

    // Validate and generate warnings/suggestions
    const { warnings, suggestions } = this.validateAndAnalyze(customizedFile, previewContent);

    return {
      steeringFile: customizedFile,
      previewContent,
      estimatedSize: Buffer.byteLength(previewContent, 'utf8'),
      conflictInfo: conflictInfo.exists ? conflictInfo : undefined,
      warnings,
      suggestions
    };
  }

  /**
   * Apply customizations to a base steering file
   */
  async applyCustomizations(
    baseFile: SteeringFile,
    customization?: SteeringFileCustomization
  ): Promise<SteeringFile> {
    if (!customization) {
      return { ...baseFile };
    }

    const customizedFile: SteeringFile = {
      ...baseFile,
      frontMatter: { ...baseFile.frontMatter },
      content: baseFile.content
    };

    // Apply filename customization
    if (customization.filename) {
      let filename = customization.filename;
      // If filename already has .md extension, remove it before sanitizing
      if (filename.endsWith('.md')) {
        filename = filename.slice(0, -3);
      }
      const sanitizedFilename = this.sanitizeFilename(filename);
      customizedFile.filename = `${sanitizedFilename}.md`;
    }

    // Apply front-matter customizations
    if (customization.inclusionRule) {
      customizedFile.frontMatter.inclusion = customization.inclusionRule;
    }

    if (customization.fileMatchPattern) {
      customizedFile.frontMatter.fileMatchPattern = customization.fileMatchPattern;
    }

    if (customization.description) {
      customizedFile.frontMatter.description = customization.description;
    }

    // Apply content modifications
    if (customization.contentModifications) {
      customizedFile.content = this.applyContentModifications(
        customizedFile.content,
        customization.contentModifications
      );
    }

    // Handle reference inclusion
    if (customization.includeReferences === false) {
      customizedFile.references = [];
    }

    return customizedFile;
  }

  /**
   * Create multiple steering file previews for batch operations
   */
  async generateBatchPreview(
    config: BatchOperationConfig
  ): Promise<Array<SteeringFilePreviewInfo>> {
    const previews: Array<SteeringFilePreviewInfo> = [];

    for (const steeringFile of config.steeringFiles) {
      try {
        // Validate steering file first - throw error for invalid files
        if (!steeringFile.filename || steeringFile.filename.trim() === '') {
          throw new Error('Invalid steering file: filename is required');
        }

        // Combine common and individual customizations
        const customization = this.combineCustomizations(
          config.commonCustomization,
          config.individualCustomizations?.[steeringFile.filename]
        );

        const preview = await this.generatePreview(steeringFile, customization);
        previews.push(preview);
      } catch (error) {
        // Create error preview
        const errorPreview: SteeringFilePreviewInfo = {
          steeringFile,
          previewContent: `Error generating preview: ${error instanceof Error ? error.message : 'Unknown error'}`,
          estimatedSize: 0,
          warnings: [`Error generating preview: ${error instanceof Error ? error.message : 'Unknown error'}`],
          suggestions: ['Check the steering file content and customization options']
        };
        previews.push(errorPreview);

        if (config.stopOnError) {
          break;
        }
      }
    }

    return previews;
  }

  /**
   * Execute batch operations on multiple steering files
   */
  async executeBatchOperation(
    config: BatchOperationConfig
  ): Promise<BatchOperationResult> {
    const results: BatchOperationResult['results'] = [];
    let successful = 0;
    let failed = 0;

    for (const steeringFile of config.steeringFiles) {
      try {
        // Apply customizations
        const customization = this.combineCustomizations(
          config.commonCustomization,
          config.individualCustomizations?.[steeringFile.filename]
        );

        const customizedFile = await this.applyCustomizations(steeringFile, customization);

        // Save the file
        const saveResult = await this.steeringFileManager.saveSteeringFile(customizedFile);

        if (saveResult.success) {
          successful++;
          results.push({
            filename: customizedFile.filename,
            success: true,
            message: saveResult.message
          });
        } else {
          failed++;
          results.push({
            filename: customizedFile.filename,
            success: false,
            message: saveResult.message,
            error: saveResult.warnings?.join(', ')
          });
        }
      } catch (error) {
        failed++;
        results.push({
          filename: steeringFile.filename,
          success: false,
          message: 'Failed to process file',
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        if (config.stopOnError) {
          break;
        }
      }
    }

    return {
      totalProcessed: results.length,
      successful,
      failed,
      results,
      summary: `Processed ${results.length} files: ${successful} successful, ${failed} failed`
    };
  }

  /**
   * Get customization suggestions based on document type and context
   */
  getCustomizationSuggestions(
    documentType: DocumentType,
    featureName: string,
    existingFiles?: string[]
  ): Array<{
    type: 'inclusionRule' | 'fileMatchPattern' | 'filename' | 'description';
    suggestion: string;
    reason: string;
  }> {
    const suggestions: Array<{
      type: 'inclusionRule' | 'fileMatchPattern' | 'filename' | 'description';
      suggestion: string;
      reason: string;
    }> = [];

    // Inclusion rule suggestions based on document type
    switch (documentType) {
      case DocumentType.REQUIREMENTS:
        suggestions.push({
          type: 'inclusionRule',
          suggestion: 'fileMatch',
          reason: 'Requirements guidance is most useful when working on spec or requirements files'
        });
        suggestions.push({
          type: 'fileMatchPattern',
          suggestion: 'requirements*|spec*|*.md',
          reason: 'Match requirements, spec, and markdown files for contextual guidance'
        });
        break;

      case DocumentType.DESIGN:
        suggestions.push({
          type: 'inclusionRule',
          suggestion: 'fileMatch',
          reason: 'Design guidance should activate when working on architecture or design files'
        });
        suggestions.push({
          type: 'fileMatchPattern',
          suggestion: 'design*|architecture*|*.ts|*.js',
          reason: 'Match design files and source code for implementation guidance'
        });
        break;

      case DocumentType.ONEPAGER:
        suggestions.push({
          type: 'inclusionRule',
          suggestion: 'manual',
          reason: 'Executive guidance is typically needed on-demand rather than automatically'
        });
        break;

      case DocumentType.PRFAQ:
        suggestions.push({
          type: 'inclusionRule',
          suggestion: 'manual',
          reason: 'PR-FAQ guidance is usually needed for specific communication tasks'
        });
        break;

      case DocumentType.TASKS:
        suggestions.push({
          type: 'inclusionRule',
          suggestion: 'fileMatch',
          reason: 'Task guidance helps during implementation work'
        });
        suggestions.push({
          type: 'fileMatchPattern',
          suggestion: 'tasks*|todo*|*.ts|*.js',
          reason: 'Match task files and source code for implementation guidance'
        });
        break;
    }

    // Filename suggestions
    const sanitizedFeatureName = this.sanitizeFilename(featureName);
    suggestions.push({
      type: 'filename',
      suggestion: `${documentType}-${sanitizedFeatureName}`,
      reason: 'Clear naming convention that includes document type and feature name'
    });

    // Description suggestions
    suggestions.push({
      type: 'description',
      suggestion: `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} guidance for ${featureName} feature`,
      reason: 'Descriptive summary of the steering file purpose'
    });

    return suggestions;
  }

  // Private helper methods

  private generateCompleteFileContent(steeringFile: SteeringFile): string {
    // Generate front-matter YAML
    const frontMatterLines = ['---'];
    
    // Add required front-matter fields
    frontMatterLines.push(`inclusion: ${steeringFile.frontMatter.inclusion}`);
    
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

    // Add content
    let content = steeringFile.content;

    // Add file references if they exist
    if (steeringFile.references && steeringFile.references.length > 0) {
      content += '\n\n## Related Documents\n';
      for (const reference of steeringFile.references) {
        content += `${reference}\n`;
      }
    }

    return frontMatterLines.join('\n') + content;
  }

  private validateAndAnalyze(
    steeringFile: SteeringFile,
    content: string
  ): { warnings: string[]; suggestions: string[] } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check file size
    const sizeInKB = Buffer.byteLength(content, 'utf8') / 1024;
    if (sizeInKB > 100) {
      warnings.push(`Large file size (${sizeInKB.toFixed(1)}KB). Consider splitting into smaller files.`);
    }

    // Check filename
    if (!steeringFile.filename || !steeringFile.filename.endsWith('.md')) {
      warnings.push('Filename should end with .md extension');
    }

    // Check inclusion rule consistency
    if (steeringFile.frontMatter.inclusion === 'fileMatch' && !steeringFile.frontMatter.fileMatchPattern) {
      warnings.push('fileMatch inclusion rule requires a fileMatchPattern');
    }

    // Check content quality
    if (!steeringFile.content || steeringFile.content.length < 100) {
      warnings.push('Content is very short. Consider adding more detailed guidance.');
    }

    // Generate suggestions
    if (steeringFile.frontMatter.inclusion === 'always') {
      suggestions.push('Consider using fileMatch instead of always to reduce context noise');
    }

    if (!steeringFile.frontMatter.description) {
      suggestions.push('Adding a description helps other developers understand the purpose');
    }

    if (!steeringFile.references || steeringFile.references.length === 0) {
      suggestions.push('Consider adding references to related files for better context');
    }

    return { warnings, suggestions };
  }

  private applyContentModifications(
    content: string,
    modifications: SteeringFileCustomization['contentModifications']
  ): string {
    if (!modifications) {
      return content;
    }

    let modifiedContent = content;

    // Apply prepend content
    if (modifications.prependContent) {
      modifiedContent = modifications.prependContent + '\n\n' + modifiedContent;
    }

    // Apply replacements
    if (modifications.replacements) {
      for (const replacement of modifications.replacements) {
        modifiedContent = modifiedContent.replace(
          new RegExp(replacement.search, 'g'),
          replacement.replace
        );
      }
    }

    // Apply append content
    if (modifications.appendContent) {
      modifiedContent = modifiedContent + '\n\n' + modifications.appendContent;
    }

    return modifiedContent;
  }

  private combineCustomizations(
    common?: Partial<SteeringFileCustomization>,
    individual?: SteeringFileCustomization
  ): SteeringFileCustomization | undefined {
    if (!common && !individual) {
      return undefined;
    }

    return {
      ...common,
      ...individual,
      contentModifications: {
        ...common?.contentModifications,
        ...individual?.contentModifications
      }
    };
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9\-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

export default SteeringFilePreview;