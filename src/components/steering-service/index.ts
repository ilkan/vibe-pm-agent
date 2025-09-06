/**
 * SteeringService Component
 * 
 * Service layer that orchestrates steering file creation from PM agent outputs.
 * This service integrates SteeringFileGenerator, SteeringFileManager, and other
 * components to provide a unified interface for MCP tool handlers.
 */

import { SteeringFileGenerator } from '../steering-file-generator';
import { SteeringFileManager } from '../steering-file-manager';
import { DocumentReferenceLinker } from '../document-reference-linker';
import { SteeringUserInteraction, SteeringUserPreferences, SteeringCreationSummary } from '../steering-user-interaction';
import { SteeringFilePreview } from '../steering-file-preview';
import { 
  SteeringFile, 
  SteeringContext, 
  DocumentType, 
  SaveResult,
  SteeringFileGenerationOptions,
  InclusionRule,
  SteeringFileCustomization,
  BatchOperationConfig,
  BatchOperationResult
} from '../../models/steering';
import { SteeringFileOptions } from '../../models/mcp';
import {
  SteeringFileValidator,
  SteeringLogger,
  SteeringOperationWrapper,
  ContentProcessingError
} from '../../utils/steering-error-handling';

/**
 * Configuration for the SteeringService
 */
export interface SteeringServiceConfig {
  /** Whether steering file creation is enabled globally */
  enabled: boolean;
  /** Default options for steering file generation */
  defaultOptions: SteeringFileGenerationOptions;
  /** Base directory for steering files */
  steeringDirectory: string;
  /** User interaction preferences */
  userPreferences?: Partial<SteeringUserPreferences>;
}

/**
 * Result of steering file creation operation
 */
export interface SteeringCreationResult {
  /** Whether steering files were created */
  created: boolean;
  /** List of save results for each steering file */
  results: SaveResult[];
  /** Summary message about the operation */
  message: string;
  /** Any warnings or issues encountered */
  warnings: string[];
  /** Detailed summary of the operation */
  summary?: SteeringCreationSummary;
  /** Whether user interaction was involved */
  userInteractionRequired: boolean;
}

/**
 * Default configuration for SteeringService
 */
const DEFAULT_CONFIG: SteeringServiceConfig = {
  enabled: true,
  defaultOptions: {
    autoSave: true,
    promptForConfirmation: false,
    includeReferences: true,
    namingStrategy: 'feature-based',
    overwriteExisting: false
  },
  steeringDirectory: '.kiro/steering'
};

/**
 * SteeringService orchestrates the creation of steering files from PM agent outputs
 */
export class SteeringService {
  private generator: SteeringFileGenerator;
  private manager: SteeringFileManager;
  private referenceLinker: DocumentReferenceLinker;
  private userInteraction: SteeringUserInteraction;
  private preview: SteeringFilePreview;
  private config: SteeringServiceConfig;

  constructor(config: Partial<SteeringServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.generator = new SteeringFileGenerator();
    this.manager = new SteeringFileManager({ 
      steeringDirectory: this.config.steeringDirectory 
    });
    this.referenceLinker = new DocumentReferenceLinker();
    this.userInteraction = new SteeringUserInteraction(this.config.userPreferences);
    this.preview = new SteeringFilePreview(this.manager);
  }

  /**
   * Create steering file from requirements document
   */
  async createFromRequirements(
    requirements: string, 
    steeringOptions?: SteeringFileOptions
  ): Promise<SteeringCreationResult> {
    SteeringLogger.info('Creating steering file from requirements document', {
      featureName: steeringOptions?.feature_name,
      contentLength: requirements.length
    });

    // Validate PM agent document before processing
    const validationResult = SteeringFileValidator.validatePMAgentDocument(requirements, DocumentType.REQUIREMENTS);
    
    if (!validationResult.isValid) {
      SteeringLogger.warn('Requirements document validation failed', {
        errors: validationResult.errors.map(e => e.message),
        warnings: validationResult.warnings
      });

      return {
        created: false,
        results: [],
        message: `Requirements document validation failed: ${validationResult.errors[0]?.message}`,
        warnings: validationResult.warnings,
        userInteractionRequired: false
      };
    }

    return this.createSteeringFileWithUserInteraction(
      requirements,
      DocumentType.REQUIREMENTS,
      steeringOptions,
      (content, context) => this.generator.generateFromRequirements(content, context)
    );
  }

  /**
   * Create steering file from design options document
   */
  async createFromDesignOptions(
    design: string, 
    steeringOptions?: SteeringFileOptions
  ): Promise<SteeringCreationResult> {
    SteeringLogger.info('Creating steering file from design document', {
      featureName: steeringOptions?.feature_name,
      contentLength: design.length
    });

    const validationResult = SteeringFileValidator.validatePMAgentDocument(design, DocumentType.DESIGN);
    
    if (!validationResult.isValid) {
      SteeringLogger.warn('Design document validation failed', {
        errors: validationResult.errors.map(e => e.message),
        warnings: validationResult.warnings
      });

      return {
        created: false,
        results: [],
        message: `Design document validation failed: ${validationResult.errors[0]?.message}`,
        warnings: validationResult.warnings,
        userInteractionRequired: false
      };
    }

    return this.createSteeringFileWithUserInteraction(
      design,
      DocumentType.DESIGN,
      steeringOptions,
      (content, context) => this.generator.generateFromDesign(content, context)
    );
  }

  /**
   * Create steering file from management one-pager document
   */
  async createFromOnePager(
    onePager: string, 
    steeringOptions?: SteeringFileOptions
  ): Promise<SteeringCreationResult> {
    SteeringLogger.info('Creating steering file from one-pager document', {
      featureName: steeringOptions?.feature_name,
      contentLength: onePager.length
    });

    const validationResult = SteeringFileValidator.validatePMAgentDocument(onePager, DocumentType.ONEPAGER);
    
    if (!validationResult.isValid) {
      SteeringLogger.warn('One-pager document validation failed', {
        errors: validationResult.errors.map(e => e.message),
        warnings: validationResult.warnings
      });

      return {
        created: false,
        results: [],
        message: `One-pager document validation failed: ${validationResult.errors[0]?.message}`,
        warnings: validationResult.warnings,
        userInteractionRequired: false
      };
    }

    return this.createSteeringFileWithUserInteraction(
      onePager,
      DocumentType.ONEPAGER,
      steeringOptions,
      (content, context) => this.generator.generateFromOnePager(content, context)
    );
  }

  /**
   * Create steering file from PR-FAQ document
   */
  async createFromPRFAQ(
    prfaq: string, 
    steeringOptions?: SteeringFileOptions
  ): Promise<SteeringCreationResult> {
    SteeringLogger.info('Creating steering file from PR-FAQ document', {
      featureName: steeringOptions?.feature_name,
      contentLength: prfaq.length
    });

    const validationResult = SteeringFileValidator.validatePMAgentDocument(prfaq, DocumentType.PRFAQ);
    
    if (!validationResult.isValid) {
      SteeringLogger.warn('PR-FAQ document validation failed', {
        errors: validationResult.errors.map(e => e.message),
        warnings: validationResult.warnings
      });

      return {
        created: false,
        results: [],
        message: `PR-FAQ document validation failed: ${validationResult.errors[0]?.message}`,
        warnings: validationResult.warnings,
        userInteractionRequired: false
      };
    }

    return this.createSteeringFileWithUserInteraction(
      prfaq,
      DocumentType.PRFAQ,
      steeringOptions,
      (content, context) => this.generator.generateFromPRFAQ(content, context)
    );
  }

  /**
   * Create steering file from task plan document
   */
  async createFromTaskPlan(
    taskPlan: string, 
    steeringOptions?: SteeringFileOptions
  ): Promise<SteeringCreationResult> {
    SteeringLogger.info('Creating steering file from task plan document', {
      featureName: steeringOptions?.feature_name,
      contentLength: taskPlan.length
    });

    const validationResult = SteeringFileValidator.validatePMAgentDocument(taskPlan, DocumentType.TASKS);
    
    if (!validationResult.isValid) {
      SteeringLogger.warn('Task plan document validation failed', {
        errors: validationResult.errors.map(e => e.message),
        warnings: validationResult.warnings
      });

      return {
        created: false,
        results: [],
        message: `Task plan document validation failed: ${validationResult.errors[0]?.message}`,
        warnings: validationResult.warnings,
        userInteractionRequired: false
      };
    }

    return this.createSteeringFileWithUserInteraction(
      taskPlan,
      DocumentType.TASKS,
      steeringOptions,
      (content, context) => this.generator.generateFromTaskPlan(content, context)
    );
  }

  /**
   * Get statistics about steering file operations
   */
  getStats() {
    return this.manager.getStats();
  }

  /**
   * Update user preferences for steering file creation
   */
  updateUserPreferences(preferences: Partial<SteeringUserPreferences>): void {
    this.userInteraction.updatePreferences(preferences);
  }

  /**
   * Get current user preferences
   */
  getUserPreferences(): SteeringUserPreferences {
    return this.userInteraction.getPreferences();
  }

  /**
   * Generate preview for a steering file with customization options
   */
  async generateSteeringFilePreview(
    content: string,
    documentType: DocumentType,
    steeringOptions?: SteeringFileOptions,
    customization?: SteeringFileCustomization
  ) {
    const context = this.buildSteeringContext(steeringOptions, documentType);
    const baseSteeringFile = await this.generateSteeringFileByType(content, context, documentType);
    
    // Add references if enabled
    await this.addReferencesWithErrorHandling(baseSteeringFile, context);
    
    return this.preview.generatePreview(baseSteeringFile, customization);
  }

  /**
   * Get customization suggestions for a document type
   */
  getCustomizationSuggestions(
    documentType: DocumentType,
    featureName: string,
    existingFiles?: string[]
  ) {
    return this.preview.getCustomizationSuggestions(documentType, featureName, existingFiles);
  }

  /**
   * Execute batch operations on multiple steering files
   */
  async executeBatchSteeringFileOperation(
    config: BatchOperationConfig
  ): Promise<BatchOperationResult> {
    SteeringLogger.info('Starting batch steering file operation', {
      fileCount: config.steeringFiles.length,
      stopOnError: config.stopOnError
    });

    return this.preview.executeBatchOperation(config);
  }

  /**
   * Create steering file from competitive analysis document
   */
  async createFromCompetitiveAnalysis(
    competitiveAnalysis: string, 
    steeringOptions?: SteeringFileOptions
  ): Promise<SteeringCreationResult> {
    return this.createSteeringFileWithUserInteraction(
      competitiveAnalysis,
      DocumentType.COMPETITIVE_ANALYSIS,
      steeringOptions,
      (content, context) => this.generator.generateFromCompetitiveAnalysis(content, context)
    );
  }

  /**
   * Create steering file from market sizing document
   */
  async createFromMarketSizing(
    marketSizing: string, 
    steeringOptions?: SteeringFileOptions
  ): Promise<SteeringCreationResult> {
    return this.createSteeringFileWithUserInteraction(
      marketSizing,
      DocumentType.MARKET_SIZING,
      steeringOptions,
      (content, context) => this.generator.generateFromMarketSizing(content, context)
    );
  }

  /**
   * Create steering file from business opportunity document
   */
  async createFromBusinessOpportunity(
    businessOpportunity: string, 
    steeringOptions?: SteeringFileOptions
  ): Promise<SteeringCreationResult> {
    return this.createSteeringFileWithUserInteraction(
      businessOpportunity,
      DocumentType.ONEPAGER, // Use onepager type for business opportunity
      steeringOptions,
      (content, context) => this.generator.generateFromOnePager(content, context)
    );
  }

  /**
   * Generate batch preview for multiple steering files
   */
  async generateBatchPreview(
    config: BatchOperationConfig
  ) {
    SteeringLogger.info('Generating batch preview', {
      fileCount: config.steeringFiles.length
    });

    return this.preview.generateBatchPreview(config);
  }

  // Private helper methods

  private async createSteeringFileWithUserInteraction(
    content: string,
    documentType: DocumentType,
    steeringOptions?: SteeringFileOptions,
    generator?: (content: string, context: SteeringContext) => SteeringFile
  ): Promise<SteeringCreationResult> {
    const startTime = Date.now();
    
    if (!this.shouldCreateSteeringFiles(steeringOptions)) {
      return this.createSkippedResult('Steering file creation disabled');
    }

    const result = await SteeringOperationWrapper.executeWithErrorHandling(
      async () => {
        // Get user confirmation and preferences
        const featureName = steeringOptions?.feature_name || 'unnamed-feature';
        const promptResponse = await this.userInteraction.promptForSteeringFileCreation(
          documentType,
          featureName,
          steeringOptions
        );

        if (!promptResponse.createFiles) {
          return this.createSkippedResult('User declined steering file creation');
        }

        // Merge user preferences with provided options
        const finalOptions = this.mergeSteeringOptions(steeringOptions, promptResponse.customOptions);
        const customizedOptions = this.userInteraction.customizeSteeringOptions(
          finalOptions,
          documentType,
          featureName
        );

        const context = this.buildSteeringContext(customizedOptions, documentType);
        
        // Generate steering file with error handling
        let steeringFile: SteeringFile;
        try {
          if (generator) {
            steeringFile = generator(content, context);
          } else {
            steeringFile = await this.generateSteeringFileByType(content, context, documentType);
          }
        } catch (error) {
          throw new ContentProcessingError(
            `Failed to generate steering file from ${documentType} document`,
            documentType,
            error instanceof Error ? error : undefined
          );
        }
        
        // Add file references with error handling
        await this.addReferencesWithErrorHandling(steeringFile, context);

        // Show preview if enabled
        const preview = this.userInteraction.generatePreview(steeringFile);
        const previewConfirmed = await this.userInteraction.showPreviewAndConfirm(preview);
        
        if (!previewConfirmed) {
          return this.createSkippedResult('User declined after preview');
        }
        
        const saveResult = await this.manager.saveSteeringFile(steeringFile);
        const processingTime = Date.now() - startTime;
        
        // Generate and display summary
        const summary = this.userInteraction.generateSummary([saveResult], processingTime);
        await this.userInteraction.displaySummary(summary);
        
        const documentTypeName = documentType.charAt(0).toUpperCase() + documentType.slice(1);
        
        return {
          created: saveResult.success,
          results: [saveResult],
          message: saveResult.success 
            ? `${documentTypeName} steering file created: ${saveResult.filename}`
            : `Failed to create ${documentTypeName.toLowerCase()} steering file: ${saveResult.message}`,
          warnings: preview.warnings,
          summary,
          userInteractionRequired: true
        };
      },
      `createSteeringFile_${documentType}`
    );

    if (!result.success) {
      SteeringLogger.error('Steering file creation failed', {
        documentType,
        error: result.error?.message,
        recoveryApplied: result.recoveryApplied
      });

      return this.createErrorResult(result.error || new Error('Unknown error'), documentType);
    }

    return result.result!;
  }

  private shouldCreateSteeringFiles(options?: SteeringFileOptions): boolean {
    if (!this.config.enabled) {
      return false;
    }
    
    return options?.create_steering_files ?? false;
  }

  private buildSteeringContext(
    options: SteeringFileOptions | undefined, 
    documentType: DocumentType
  ): SteeringContext {
    const featureName = options?.feature_name || 'unnamed-feature';
    const inclusionRule = options?.inclusion_rule || this.getDefaultInclusionRule(documentType);
    
    return {
      featureName,
      projectName: undefined,
      relatedFiles: [], // Will be populated by reference linker
      inclusionRule,
      fileMatchPattern: options?.file_match_pattern || this.getDefaultFileMatchPattern(documentType),
      description: `Generated from PM agent ${documentType} document`
    };
  }

  private getDefaultInclusionRule(documentType: DocumentType): InclusionRule {
    switch (documentType) {
      case DocumentType.REQUIREMENTS:
        return 'fileMatch';
      case DocumentType.DESIGN:
        return 'fileMatch';
      case DocumentType.ONEPAGER:
        return 'manual';
      case DocumentType.PRFAQ:
        return 'manual';
      case DocumentType.TASKS:
        return 'fileMatch';
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

  private async generateSteeringFileByType(
    content: string, 
    context: SteeringContext, 
    documentType: DocumentType
  ): Promise<SteeringFile> {
    switch (documentType) {
      case DocumentType.REQUIREMENTS:
        return this.generator.generateFromRequirements(content, context);
      case DocumentType.DESIGN:
        return this.generator.generateFromDesign(content, context);
      case DocumentType.ONEPAGER:
        return this.generator.generateFromOnePager(content, context);
      case DocumentType.PRFAQ:
        return this.generator.generateFromPRFAQ(content, context);
      case DocumentType.TASKS:
        return this.generator.generateFromTaskPlan(content, context);
      default:
        throw new ContentProcessingError(`Unsupported document type: ${documentType}`, documentType);
    }
  }

  private async addReferences(steeringFile: SteeringFile, context: SteeringContext): Promise<void> {
    if (!this.config.defaultOptions.includeReferences) {
      return;
    }

    try {
      const updatedContext = this.referenceLinker.addFileReferences(context);
      
      // Generate file references and add them to the steering file content
      if (updatedContext && updatedContext.relatedFiles && updatedContext.relatedFiles.length > 0) {
        const fileReferences = this.referenceLinker.generateFileReferences(updatedContext.relatedFiles);
        const validReferences = fileReferences.filter(ref => ref.exists);
        
        if (validReferences.length > 0) {
          const referencesSection = '\n\n## Related Documents\n\n' + 
            validReferences.map(ref => ref.reference).join('\n');
          
          steeringFile.content += referencesSection;
          steeringFile.references = validReferences.map(ref => ref.reference);
        }
      }
    } catch (error) {
      // Reference linking failure shouldn't prevent steering file creation
      console.warn('Failed to add file references:', error);
    }
  }

  private async addReferencesWithErrorHandling(steeringFile: SteeringFile, context: SteeringContext): Promise<void> {
    if (!this.config.defaultOptions.includeReferences) {
      return;
    }

    try {
      const updatedContext = this.referenceLinker.addFileReferences(context);
      
      // Generate file references and add them to the steering file content
      if (updatedContext && updatedContext.relatedFiles && updatedContext.relatedFiles.length > 0) {
        const fileReferences = this.referenceLinker.generateFileReferences(updatedContext.relatedFiles);
        const validReferences = fileReferences.filter(ref => ref.exists);
        
        if (validReferences.length > 0) {
          const referencesSection = '\n\n## Related Documents\n\n' + 
            validReferences.map(ref => ref.reference).join('\n');
          
          steeringFile.content += referencesSection;
          steeringFile.references = validReferences.map(ref => ref.reference);
          
          SteeringLogger.debug('Added file references to steering file', {
            referenceCount: validReferences.length,
            references: validReferences.map(ref => ref.reference)
          });
        }
      }
    } catch (error) {
      // Reference linking failure shouldn't prevent steering file creation
      SteeringLogger.warn('Failed to add file references', {
        error: error instanceof Error ? error.message : 'Unknown error',
        featureName: context.featureName
      });
    }
  }

  private createSkippedResult(reason: string): SteeringCreationResult {
    return {
      created: false,
      results: [],
      message: `Steering file creation skipped: ${reason}`,
      warnings: [],
      userInteractionRequired: false
    };
  }

  private createErrorResult(error: unknown, documentType: string): SteeringCreationResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      created: false,
      results: [],
      message: `Failed to create ${documentType} steering file: ${errorMessage}`,
      warnings: [errorMessage],
      userInteractionRequired: false
    };
  }

  private mergeSteeringOptions(
    baseOptions?: SteeringFileOptions,
    customOptions?: Partial<SteeringFileOptions>
  ): SteeringFileOptions {
    return {
      ...baseOptions,
      ...customOptions,
      create_steering_files: true // Always true when we reach this point
    };
  }
  /**
   * Create steering file from business case analysis
   */
  async createFromBusinessCase(
    businessCase: string,
    steeringOptions?: SteeringFileOptions
  ): Promise<SteeringCreationResult> {
    return this.createSteeringFileWithUserInteraction(
      businessCase,
      DocumentType.ONEPAGER,
      steeringOptions,
      (content, context) => this.generator.generateFromOnePager(content, context)
    );
  }

  /**
   * Create steering file from stakeholder communication
   */
  async createFromStakeholderCommunication(
    communication: string,
    steeringOptions?: SteeringFileOptions
  ): Promise<SteeringCreationResult> {
    return this.createSteeringFileWithUserInteraction(
      communication,
      DocumentType.ONEPAGER,
      steeringOptions,
      (content, context) => this.generator.generateFromOnePager(content, context)
    );
  }

  /**
   * Create steering file from strategic alignment analysis
   */
  async createFromStrategicAlignment(
    alignment: string,
    steeringOptions?: SteeringFileOptions
  ): Promise<SteeringCreationResult> {
    return this.createSteeringFileWithUserInteraction(
      alignment,
      DocumentType.REQUIREMENTS,
      steeringOptions,
      (content, context) => this.generator.generateFromRequirements(content, context)
    );
  }
}

export default SteeringService;