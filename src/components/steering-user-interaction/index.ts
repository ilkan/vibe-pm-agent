/**
 * SteeringUserInteraction Component
 * 
 * Handles user interaction for steering file creation including prompts,
 * customization options, preview functionality, and summary reporting.
 */

import { SteeringFile, SteeringContext, DocumentType, SaveResult, InclusionRule } from '../../models/steering';
import { SteeringFileOptions } from '../../models/mcp';

/**
 * User preferences for steering file creation
 */
export interface SteeringUserPreferences {
  /** Whether to always create steering files without prompting */
  autoCreate: boolean;
  /** Default inclusion rule preference */
  defaultInclusionRule: InclusionRule;
  /** Whether to show preview before saving */
  showPreview: boolean;
  /** Whether to show summary after creation */
  showSummary: boolean;
  /** Custom naming preferences */
  namingPreferences: {
    useTimestamp: boolean;
    useFeaturePrefix: boolean;
    customPrefix?: string;
  };
}

/**
 * User prompt response for steering file creation
 */
export interface SteeringPromptResponse {
  /** Whether user wants to create steering files */
  createFiles: boolean;
  /** Custom options provided by user */
  customOptions?: Partial<SteeringFileOptions>;
  /** Whether to remember preferences for future */
  rememberPreferences: boolean;
}

/**
 * Preview information for steering file
 */
export interface SteeringFilePreview {
  /** The steering file being previewed */
  steeringFile: SteeringFile;
  /** Estimated file size in bytes */
  estimatedSize: number;
  /** Preview of the content (truncated if too long) */
  contentPreview: string;
  /** Whether content was truncated */
  truncated: boolean;
  /** Validation warnings if any */
  warnings: string[];
}

/**
 * Summary of steering file creation operation
 */
export interface SteeringCreationSummary {
  /** Total number of files processed */
  totalFiles: number;
  /** Number of files successfully created */
  filesCreated: number;
  /** Number of files updated */
  filesUpdated: number;
  /** Number of files skipped */
  filesSkipped: number;
  /** List of created/updated files with details */
  fileDetails: Array<{
    filename: string;
    action: string;
    documentType: DocumentType;
    fullPath?: string;
  }>;
  /** Total processing time */
  processingTimeMs: number;
  /** Any errors or warnings */
  issues: string[];
  /** Usage recommendations */
  usageRecommendations: string[];
}

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES: SteeringUserPreferences = {
  autoCreate: false,
  defaultInclusionRule: 'fileMatch',
  showPreview: true,
  showSummary: true,
  namingPreferences: {
    useTimestamp: false,
    useFeaturePrefix: true,
    customPrefix: undefined
  }
};

/**
 * SteeringUserInteraction handles all user interaction aspects of steering file creation
 */
export class SteeringUserInteraction {
  private preferences: SteeringUserPreferences;

  constructor(preferences: Partial<SteeringUserPreferences> = {}) {
    this.preferences = { ...DEFAULT_PREFERENCES, ...preferences };
  }

  /**
   * Prompt user for steering file creation confirmation and options
   */
  async promptForSteeringFileCreation(
    documentType: DocumentType,
    featureName: string,
    existingOptions?: SteeringFileOptions
  ): Promise<SteeringPromptResponse> {
    // If auto-create is enabled, skip prompting
    if (this.preferences.autoCreate) {
      return {
        createFiles: true,
        customOptions: this.buildDefaultOptions(documentType, featureName),
        rememberPreferences: false
      };
    }

    // In a real implementation, this would show an interactive prompt
    // For now, we'll simulate the prompt logic
    const response = await this.simulateUserPrompt(documentType, featureName, existingOptions);
    
    return response;
  }

  /**
   * Generate preview of steering file before saving
   */
  generatePreview(steeringFile: SteeringFile): SteeringFilePreview {
    const fullContent = this.generateFullFileContent(steeringFile);
    const estimatedSize = Buffer.byteLength(fullContent, 'utf8');
    
    // Truncate content if too long for preview
    const maxPreviewLength = 1000;
    const truncated = fullContent.length > maxPreviewLength;
    const contentPreview = truncated 
      ? fullContent.substring(0, maxPreviewLength) + '\n... [truncated]'
      : fullContent;

    // Generate validation warnings
    const warnings = this.validateSteeringFileForPreview(steeringFile);

    return {
      steeringFile,
      estimatedSize,
      contentPreview,
      truncated,
      warnings
    };
  }

  /**
   * Show preview to user and get confirmation
   */
  async showPreviewAndConfirm(preview: SteeringFilePreview): Promise<boolean> {
    if (!this.preferences.showPreview) {
      return true;
    }

    // In a real implementation, this would show the preview to the user
    // For now, we'll simulate the confirmation
    return this.simulatePreviewConfirmation(preview);
  }

  /**
   * Generate summary of steering file creation operations
   */
  generateSummary(results: SaveResult[], processingTimeMs: number): SteeringCreationSummary {
    const summary: SteeringCreationSummary = {
      totalFiles: results.length,
      filesCreated: results.filter(r => r.action === 'created').length,
      filesUpdated: results.filter(r => r.action === 'updated').length,
      filesSkipped: results.filter(r => r.action === 'skipped').length,
      fileDetails: results.map(r => ({
        filename: r.filename,
        action: r.action,
        documentType: this.extractDocumentTypeFromFilename(r.filename),
        fullPath: r.fullPath
      })),
      processingTimeMs,
      issues: results.filter(r => !r.success).map(r => r.message),
      usageRecommendations: this.generateUsageRecommendations(results)
    };

    return summary;
  }

  /**
   * Display summary to user if enabled
   */
  async displaySummary(summary: SteeringCreationSummary): Promise<void> {
    if (!this.preferences.showSummary) {
      return;
    }

    // In a real implementation, this would display the summary to the user
    // For now, we'll log it or store it for later display
    this.logSummary(summary);
  }

  /**
   * Customize steering file options based on user preferences
   */
  customizeSteeringOptions(
    baseOptions: SteeringFileOptions,
    documentType: DocumentType,
    featureName: string
  ): SteeringFileOptions {
    const customized: SteeringFileOptions = { ...baseOptions };

    // Apply naming preferences
    if (this.preferences.namingPreferences.customPrefix) {
      customized.filename_prefix = this.preferences.namingPreferences.customPrefix;
    } else if (this.preferences.namingPreferences.useFeaturePrefix) {
      customized.filename_prefix = featureName;
    }

    // Apply default inclusion rule
    if (!customized.inclusion_rule) {
      // Use user preference if it's different from the default, otherwise use document type default
      if (this.preferences.defaultInclusionRule !== 'fileMatch') {
        customized.inclusion_rule = this.preferences.defaultInclusionRule;
      } else {
        customized.inclusion_rule = this.getDefaultInclusionRuleForType(documentType);
      }
    }

    // Set feature name if not provided
    if (!customized.feature_name) {
      customized.feature_name = featureName;
    }

    return customized;
  }

  /**
   * Update user preferences
   */
  updatePreferences(newPreferences: Partial<SteeringUserPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
  }

  /**
   * Get current user preferences
   */
  getPreferences(): SteeringUserPreferences {
    return { ...this.preferences };
  }

  // Private helper methods

  private async simulateUserPrompt(
    documentType: DocumentType,
    featureName: string,
    existingOptions?: SteeringFileOptions
  ): Promise<SteeringPromptResponse> {
    // Simulate user decision based on document type and preferences
    const shouldCreate = this.shouldAutoCreateForDocumentType(documentType);
    
    return {
      createFiles: shouldCreate,
      customOptions: shouldCreate ? this.buildDefaultOptions(documentType, featureName) : undefined,
      rememberPreferences: false
    };
  }

  private shouldAutoCreateForDocumentType(documentType: DocumentType): boolean {
    // Auto-create for requirements and design, prompt for others
    return documentType === DocumentType.REQUIREMENTS || documentType === DocumentType.DESIGN;
  }

  private buildDefaultOptions(documentType: DocumentType, featureName: string): SteeringFileOptions {
    return {
      create_steering_files: true,
      feature_name: featureName,
      inclusion_rule: this.getDefaultInclusionRuleForType(documentType),
      file_match_pattern: this.getDefaultFileMatchPattern(documentType),
      overwrite_existing: false
    };
  }

  private getDefaultInclusionRuleForType(documentType: DocumentType): InclusionRule {
    switch (documentType) {
      case DocumentType.REQUIREMENTS:
      case DocumentType.DESIGN:
      case DocumentType.TASKS:
        return 'fileMatch';
      case DocumentType.ONEPAGER:
      case DocumentType.PRFAQ:
        return 'manual';
      default:
        return 'manual';
    }
  }

  private getDefaultFileMatchPattern(documentType: DocumentType): string | undefined {
    switch (documentType) {
      case DocumentType.REQUIREMENTS:
        return 'requirements*|spec*';
      case DocumentType.DESIGN:
        return 'design*|architecture*';
      case DocumentType.TASKS:
        return 'tasks*|implementation*';
      default:
        return undefined;
    }
  }

  private generateFullFileContent(steeringFile: SteeringFile): string {
    // Generate front-matter
    const frontMatter = [
      '---',
      `inclusion: ${steeringFile.frontMatter.inclusion}`,
    ];

    if (steeringFile.frontMatter.fileMatchPattern) {
      frontMatter.push(`fileMatchPattern: '${steeringFile.frontMatter.fileMatchPattern}'`);
    }

    frontMatter.push(
      `generatedBy: ${steeringFile.frontMatter.generatedBy}`,
      `generatedAt: ${steeringFile.frontMatter.generatedAt}`,
      `featureName: ${steeringFile.frontMatter.featureName}`,
      `documentType: ${steeringFile.frontMatter.documentType}`
    );

    if (steeringFile.frontMatter.description) {
      frontMatter.push(`description: ${steeringFile.frontMatter.description}`);
    }

    frontMatter.push('---', '');

    return frontMatter.join('\n') + steeringFile.content;
  }

  private validateSteeringFileForPreview(steeringFile: SteeringFile): string[] {
    const warnings: string[] = [];

    if (!steeringFile.content || steeringFile.content.trim().length === 0) {
      warnings.push('Steering file content is empty');
    }

    if (!steeringFile.frontMatter.featureName) {
      warnings.push('Feature name is missing from front-matter');
    }

    if (steeringFile.frontMatter.inclusion === 'fileMatch' && !steeringFile.frontMatter.fileMatchPattern) {
      warnings.push('File match pattern is required when inclusion rule is "fileMatch"');
    }

    if (steeringFile.references.length === 0) {
      warnings.push('No file references found - steering file may not be well-connected');
    }

    return warnings;
  }

  private async simulatePreviewConfirmation(preview: SteeringFilePreview): Promise<boolean> {
    // Simulate user confirmation - reject if there are critical errors
    const criticalWarnings = preview.warnings.filter(warning => 
      warning.includes('content is empty') || 
      warning.includes('Feature name is missing')
    );
    return criticalWarnings.length === 0;
  }

  private extractDocumentTypeFromFilename(filename: string): DocumentType {
    if (filename.includes('requirements')) return DocumentType.REQUIREMENTS;
    if (filename.includes('design')) return DocumentType.DESIGN;
    if (filename.includes('onepager')) return DocumentType.ONEPAGER;
    if (filename.includes('prfaq')) return DocumentType.PRFAQ;
    if (filename.includes('tasks')) return DocumentType.TASKS;
    return DocumentType.REQUIREMENTS; // default
  }

  private generateUsageRecommendations(results: SaveResult[]): string[] {
    const recommendations: string[] = [];

    const createdFiles = results.filter(r => r.success && r.action === 'created');
    if (createdFiles.length > 0) {
      recommendations.push(
        `${createdFiles.length} new steering files created. They will automatically guide future development work.`
      );
    }

    const updatedFiles = results.filter(r => r.success && r.action === 'updated');
    if (updatedFiles.length > 0) {
      recommendations.push(
        `${updatedFiles.length} steering files updated with latest guidance.`
      );
    }

    const fileMatchFiles = results.filter(r => 
      r.success && r.filename.includes('requirements') || r.filename.includes('design')
    );
    if (fileMatchFiles.length > 0) {
      recommendations.push(
        'Files with fileMatch inclusion will automatically activate when relevant files are opened.'
      );
    }

    const manualFiles = results.filter(r => 
      r.success && (r.filename.includes('onepager') || r.filename.includes('prfaq'))
    );
    if (manualFiles.length > 0) {
      recommendations.push(
        'Manual inclusion files can be activated using #filename in chat when needed.'
      );
    }

    return recommendations;
  }

  private logSummary(summary: SteeringCreationSummary): void {
    console.log('Steering File Creation Summary:');
    console.log(`- Total files processed: ${summary.totalFiles}`);
    console.log(`- Files created: ${summary.filesCreated}`);
    console.log(`- Files updated: ${summary.filesUpdated}`);
    console.log(`- Files skipped: ${summary.filesSkipped}`);
    console.log(`- Processing time: ${summary.processingTimeMs}ms`);
    
    if (summary.issues.length > 0) {
      console.log('Issues encountered:');
      summary.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    if (summary.usageRecommendations.length > 0) {
      console.log('Usage recommendations:');
      summary.usageRecommendations.forEach(rec => console.log(`  - ${rec}`));
    }
  }
}

export default SteeringUserInteraction;