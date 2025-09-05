/**
 * Steering File System Interfaces and Data Models
 * 
 * This module defines the core interfaces and types for the steering file integration
 * system that converts PM agent outputs into Kiro steering files.
 */

/**
 * Enum defining the types of documents that can be converted to steering files
 */
export enum DocumentType {
  REQUIREMENTS = 'requirements',
  DESIGN = 'design',
  ONEPAGER = 'onepager',
  PRFAQ = 'prfaq',
  TASKS = 'tasks',
  COMPETITIVE_ANALYSIS = 'competitive_analysis',
  MARKET_SIZING = 'market_sizing'
}

/**
 * Type definition for inclusion rules that determine when steering files are loaded
 */
export type InclusionRule = 'always' | 'fileMatch' | 'manual';

/**
 * Interface for front-matter metadata in steering files
 */
export interface FrontMatter {
  /** How the steering file should be included in context */
  inclusion: InclusionRule;
  /** Pattern to match files when inclusion is 'fileMatch' */
  fileMatchPattern?: string;
  /** Tool or system that generated this steering file */
  generatedBy: string;
  /** ISO timestamp when the file was generated */
  generatedAt: string;
  /** Name of the feature this steering file relates to */
  featureName: string;
  /** Type of document this steering file was generated from */
  documentType: DocumentType;
  /** Optional description of the steering file purpose */
  description?: string;
}

/**
 * Context information used when generating steering files
 */
export interface SteeringContext {
  /** Name of the feature being documented */
  featureName: string;
  /** Optional project name for organization */
  projectName?: string;
  /** List of related files that should be referenced */
  relatedFiles: string[];
  /** How this steering file should be included */
  inclusionRule: InclusionRule;
  /** Pattern for file matching when inclusionRule is 'fileMatch' */
  fileMatchPattern?: string;
  /** Optional custom description */
  description?: string;
}

/**
 * Complete steering file representation
 */
export interface SteeringFile {
  /** Filename for the steering file (without path) */
  filename: string;
  /** Front-matter metadata */
  frontMatter: FrontMatter;
  /** Main content of the steering file */
  content: string;
  /** List of file references using #[[file:path]] syntax */
  references: string[];
  /** Full file path where this should be saved */
  fullPath?: string;
}

/**
 * Result of saving a steering file operation
 */
export interface SaveResult {
  /** Whether the save operation was successful */
  success: boolean;
  /** Final filename that was used */
  filename: string;
  /** Action that was taken during save */
  action: 'created' | 'updated' | 'versioned' | 'skipped';
  /** Human-readable message about the operation */
  message: string;
  /** Full path where the file was saved */
  fullPath?: string;
  /** Any warnings or additional information */
  warnings?: string[];
}

/**
 * Information about potential conflicts when saving steering files
 */
export interface ConflictInfo {
  /** Whether a conflict exists */
  exists: boolean;
  /** Path to the existing conflicting file */
  existingFile?: string;
  /** Recommended action to resolve the conflict */
  suggestedAction: 'update' | 'version' | 'rename' | 'skip';
  /** Human-readable explanation of the conflict */
  reason?: string;
  /** Suggested new filename if renaming is recommended */
  suggestedFilename?: string;
}

/**
 * Template interface for generating steering files from different document types
 */
export interface SteeringFileTemplate {
  /** Type of document this template handles */
  documentType: DocumentType;
  /** Default inclusion rule for this document type */
  defaultInclusionRule: InclusionRule;
  /** Default file match pattern if applicable */
  defaultFileMatchPattern?: string;
  /** Template string with placeholders for content generation */
  template: string;
  /** List of required placeholders in the template */
  requiredPlaceholders: string[];
  /** Optional validation function for document content */
  validateContent?: (content: string) => boolean;
}

/**
 * Configuration options for steering file generation
 */
export interface SteeringFileGenerationOptions {
  /** Whether to automatically save generated steering files */
  autoSave: boolean;
  /** Whether to prompt user for confirmation before saving */
  promptForConfirmation: boolean;
  /** Whether to create file references to related documents */
  includeReferences: boolean;
  /** Custom naming strategy for generated files */
  namingStrategy?: 'feature-based' | 'timestamp-based' | 'custom';
  /** Custom filename prefix */
  filenamePrefix?: string;
  /** Whether to overwrite existing files without prompting */
  overwriteExisting: boolean;
}

/**
 * Statistics about steering file operations
 */
export interface SteeringFileStats {
  /** Total number of steering files created */
  filesCreated: number;
  /** Total number of steering files updated */
  filesUpdated: number;
  /** Total number of conflicts encountered */
  conflictsEncountered: number;
  /** List of document types processed */
  documentTypesProcessed: DocumentType[];
  /** Total processing time in milliseconds */
  processingTimeMs: number;
}

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