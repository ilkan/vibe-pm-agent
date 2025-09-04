/**
 * FrontMatterProcessor Component
 * 
 * Handles the generation of front-matter metadata for steering files based on
 * document type and context. Determines appropriate inclusion rules and formats
 * metadata according to Kiro steering file conventions.
 */

import {
  FrontMatter,
  SteeringContext,
  DocumentType,
  InclusionRule
} from '../../models/steering';

/**
 * Configuration for front-matter generation
 */
export interface FrontMatterConfig {
  /** Default generator identifier */
  generatorId: string;
  /** Whether to include optional description field */
  includeDescription: boolean;
  /** Custom timestamp format (defaults to ISO string) */
  timestampFormat?: 'iso' | 'unix' | 'custom';
  /** Custom timestamp formatter function */
  customTimestampFormatter?: () => string;
}

/**
 * Default file match patterns for different document types
 */
const DEFAULT_FILE_MATCH_PATTERNS: Record<DocumentType, string> = {
  [DocumentType.REQUIREMENTS]: 'requirements*|spec*|*requirements*',
  [DocumentType.DESIGN]: 'design*|architecture*|*design*|*arch*',
  [DocumentType.ONEPAGER]: '', // Manual inclusion by default
  [DocumentType.PRFAQ]: '', // Manual inclusion by default
  [DocumentType.TASKS]: 'tasks*|todo*|*tasks*|implementation*'
};

/**
 * Default inclusion rules for different document types
 */
const DEFAULT_INCLUSION_RULES: Record<DocumentType, InclusionRule> = {
  [DocumentType.REQUIREMENTS]: 'fileMatch',
  [DocumentType.DESIGN]: 'fileMatch',
  [DocumentType.ONEPAGER]: 'manual',
  [DocumentType.PRFAQ]: 'manual',
  [DocumentType.TASKS]: 'fileMatch'
};

/**
 * Processor for generating front-matter metadata for steering files
 */
export class FrontMatterProcessor {
  private config: FrontMatterConfig;

  constructor(config: Partial<FrontMatterConfig> = {}) {
    this.config = {
      generatorId: 'vibe-pm-agent',
      includeDescription: true,
      timestampFormat: 'iso',
      ...config
    };
  }

  /**
   * Generates front-matter for a steering file based on context and document type
   */
  generateFrontMatter(
    documentType: DocumentType,
    context: SteeringContext
  ): FrontMatter {
    const inclusionRule = this.determineInclusionRule(documentType, context);
    const fileMatchPattern = this.determineFileMatchPattern(documentType, context, inclusionRule);
    const timestamp = this.generateTimestamp();

    const frontMatter: FrontMatter = {
      inclusion: inclusionRule,
      generatedBy: this.config.generatorId,
      generatedAt: timestamp,
      featureName: context.featureName,
      documentType
    };

    // Add file match pattern if needed
    if (inclusionRule === 'fileMatch' && fileMatchPattern) {
      frontMatter.fileMatchPattern = fileMatchPattern;
    }

    // Add description if configured and available
    if (this.config.includeDescription && context.description) {
      frontMatter.description = context.description;
    }

    return frontMatter;
  }

  /**
   * Determines the appropriate inclusion rule based on document type and context
   */
  private determineInclusionRule(
    documentType: DocumentType,
    context: SteeringContext
  ): InclusionRule {
    // Use context-specified rule if provided
    if (context.inclusionRule) {
      return context.inclusionRule;
    }

    // Use default rule for document type
    return DEFAULT_INCLUSION_RULES[documentType];
  }

  /**
   * Determines the file match pattern for fileMatch inclusion rules
   */
  private determineFileMatchPattern(
    documentType: DocumentType,
    context: SteeringContext,
    inclusionRule: InclusionRule
  ): string | undefined {
    // Only needed for fileMatch inclusion
    if (inclusionRule !== 'fileMatch') {
      return undefined;
    }

    // Use context-specified pattern if provided
    if (context.fileMatchPattern) {
      return context.fileMatchPattern;
    }

    // Use default pattern for document type
    const defaultPattern = DEFAULT_FILE_MATCH_PATTERNS[documentType];
    return defaultPattern || undefined;
  }

  /**
   * Generates timestamp in the configured format
   */
  generateTimestamp(): string {
    switch (this.config.timestampFormat) {
      case 'unix':
        return Math.floor(Date.now() / 1000).toString();
      case 'custom':
        return this.config.customTimestampFormatter?.() || new Date().toISOString();
      case 'iso':
      default:
        return new Date().toISOString();
    }
  }

  /**
   * Formats front-matter as YAML string for inclusion in markdown files
   */
  formatFrontMatter(frontMatter: FrontMatter): string {
    const lines = ['---'];

    lines.push(`inclusion: ${frontMatter.inclusion}`);

    if (frontMatter.fileMatchPattern) {
      lines.push(`fileMatchPattern: '${frontMatter.fileMatchPattern}'`);
    }

    lines.push(`generatedBy: ${frontMatter.generatedBy}`);
    lines.push(`generatedAt: ${frontMatter.generatedAt}`);
    lines.push(`featureName: ${frontMatter.featureName}`);
    lines.push(`documentType: ${frontMatter.documentType}`);

    if (frontMatter.description) {
      lines.push(`description: '${frontMatter.description.replace(/'/g, "''")}'`);
    }

    lines.push('---');
    lines.push(''); // Empty line after front-matter

    return lines.join('\n');
  }

  /**
   * Validates that front-matter contains all required fields
   */
  validateFrontMatter(frontMatter: FrontMatter): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!frontMatter.inclusion) {
      errors.push('Missing required field: inclusion');
    }

    if (!frontMatter.generatedBy) {
      errors.push('Missing required field: generatedBy');
    }

    if (!frontMatter.generatedAt) {
      errors.push('Missing required field: generatedAt');
    }

    if (!frontMatter.featureName) {
      errors.push('Missing required field: featureName');
    }

    if (!frontMatter.documentType) {
      errors.push('Missing required field: documentType');
    }

    // Validate fileMatchPattern is present when inclusion is 'fileMatch'
    if (frontMatter.inclusion === 'fileMatch' && !frontMatter.fileMatchPattern) {
      errors.push('fileMatchPattern is required when inclusion is "fileMatch"');
    }

    // Validate timestamp format
    if (frontMatter.generatedAt) {
      const date = new Date(frontMatter.generatedAt);
      if (isNaN(date.getTime())) {
        errors.push('generatedAt must be a valid date string');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Updates the configuration for this processor
   */
  updateConfig(newConfig: Partial<FrontMatterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets the current configuration
   */
  getConfig(): FrontMatterConfig {
    return { ...this.config };
  }
}

export default FrontMatterProcessor;