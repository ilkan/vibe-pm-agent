/**
 * TemplateProcessor Component
 * 
 * Handles template processing with placeholder replacement for steering file generation.
 * Provides utilities for content extraction and formatting from PM agent documents.
 */

// DocumentType import removed as it's not used in this component

/**
 * Template placeholder replacement interface
 */
export interface TemplatePlaceholders {
  [key: string]: string;
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  valid: boolean;
  missingPlaceholders: string[];
  unusedPlaceholders: string[];
  errors: string[];
}

/**
 * Content extraction configuration
 */
export interface ContentExtractionConfig {
  /** Maximum length for extracted sections */
  maxSectionLength?: number;
  /** Whether to preserve markdown formatting */
  preserveMarkdown?: boolean;
  /** Custom section delimiters */
  sectionDelimiters?: string[];
}

/**
 * Extracted content section
 */
export interface ExtractedSection {
  title: string;
  content: string;
  startLine: number;
  endLine: number;
  level: number;
}

/**
 * Template processor for steering file generation
 */
export class TemplateProcessor {
  private config: ContentExtractionConfig;

  constructor(config: ContentExtractionConfig = {}) {
    this.config = {
      maxSectionLength: 5000,
      preserveMarkdown: true,
      sectionDelimiters: ['#', '##', '###', '####'],
      ...config
    };
  }

  /**
   * Process template by replacing placeholders with actual values
   */
  processTemplate(template: string, placeholders: TemplatePlaceholders): string {
    let result = template;
    
    // Replace placeholders in {placeholder} format
    // First, find all placeholders in the template
    const placeholderRegex = /{([^}]+)}/g;
    let match;
    const foundPlaceholders = new Set<string>();
    
    while ((match = placeholderRegex.exec(result)) !== null) {
      foundPlaceholders.add(match[1]);
    }
    
    // Replace each found placeholder
    for (const placeholder of foundPlaceholders) {
      const value = placeholders[placeholder];
      const placeholderPattern = `{${placeholder}}`;
      const regex = new RegExp(placeholderPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(regex, value !== undefined ? value : '');
    }
    
    return result;
  }

  /**
   * Validate template against required placeholders
   */
  validateTemplate(template: string, requiredPlaceholders: string[]): TemplateValidationResult {
    const errors: string[] = [];
    const missingPlaceholders: string[] = [];
    const unusedPlaceholders: string[] = [];
    
    // Find all placeholders in template
    const placeholderRegex = /{([^}]+)}/g;
    const foundPlaceholders = new Set<string>();
    let match;
    
    while ((match = placeholderRegex.exec(template)) !== null) {
      foundPlaceholders.add(match[1]);
    }
    
    // Check for missing required placeholders
    for (const required of requiredPlaceholders) {
      if (!foundPlaceholders.has(required)) {
        missingPlaceholders.push(required);
      }
    }
    
    // Check for unused placeholders (placeholders in template but not in required list)
    for (const found of foundPlaceholders) {
      if (!requiredPlaceholders.includes(found)) {
        unusedPlaceholders.push(found);
      }
    }
    
    if (missingPlaceholders.length > 0) {
      errors.push(`Missing required placeholders: ${missingPlaceholders.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      missingPlaceholders,
      unusedPlaceholders,
      errors
    };
  }

  /**
   * Extract sections from markdown document based on headers
   */
  extractSections(document: string): ExtractedSection[] {
    const lines = document.split('\n');
    const sections: ExtractedSection[] = [];
    let currentSection: Partial<ExtractedSection> | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Check if this is a header line
      const headerMatch = trimmedLine.match(/^(#+)\s+(.+)$/);
      if (headerMatch) {
        // Save previous section if exists
        if (currentSection) {
          sections.push({
            ...currentSection,
            endLine: i - 1
          } as ExtractedSection);
        }
        
        // Start new section
        currentSection = {
          title: headerMatch[2],
          content: '',
          startLine: i,
          level: headerMatch[1].length
        };
      } else if (currentSection) {
        // Add content to current section
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    }
    
    // Add final section
    if (currentSection) {
      sections.push({
        ...currentSection,
        endLine: lines.length - 1
      } as ExtractedSection);
    }
    
    return sections;
  }

  /**
   * Extract specific section by title or keywords
   */
  extractSectionByKeywords(document: string, keywords: string[]): string | null {
    const sections = this.extractSections(document);
    
    for (const section of sections) {
      const titleLower = section.title.toLowerCase();
      if (keywords.some(keyword => titleLower.includes(keyword.toLowerCase()))) {
        return this.formatExtractedContent(section.content);
      }
    }
    
    return null;
  }

  /**
   * Extract business context from requirements document
   */
  extractBusinessContext(requirements: string): string {
    // Try to find introduction or overview section
    const contextSection = this.extractSectionByKeywords(requirements, [
      'introduction', 'overview', 'context', 'background', 'business'
    ]);
    
    if (contextSection) {
      return contextSection;
    }
    
    // Fallback: extract first paragraph after any header
    const lines = requirements.split('\n');
    let inContent = false;
    const contextLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('#')) {
        inContent = true;
        continue;
      }
      
      if (inContent && trimmed.length > 0) {
        contextLines.push(trimmed);
        if (contextLines.length >= 5) break; // Limit to first few lines
      }
    }
    
    return contextLines.length > 0 
      ? contextLines.join(' ')
      : 'Business context not explicitly defined in requirements.';
  }

  /**
   * Extract key requirements with MoSCoW prioritization
   */
  extractKeyRequirements(requirements: string): string {
    const sections = this.extractSections(requirements);
    const requirementSections = sections.filter(section => 
      section.title.toLowerCase().includes('requirement') ||
      section.title.toLowerCase().includes('acceptance criteria')
    );
    
    if (requirementSections.length > 0) {
      return requirementSections
        .map(section => `### ${section.title}\n${this.formatExtractedContent(section.content)}`)
        .join('\n\n');
    }
    
    // Fallback: look for EARS format requirements
    const earsRequirements = this.extractEARSRequirements(requirements);
    return earsRequirements || 'Requirements structure not found in standard format.';
  }

  /**
   * Extract EARS format requirements (WHEN...THEN...SHALL)
   */
  private extractEARSRequirements(document: string): string | null {
    const lines = document.split('\n');
    const earsLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^\d+\.\s+(WHEN|IF|WHERE|WHILE).*THEN.*SHALL/i)) {
        earsLines.push(trimmed);
      }
    }
    
    return earsLines.length > 0 ? earsLines.join('\n') : null;
  }

  /**
   * Extract design options (Conservative/Balanced/Bold)
   */
  extractDesignOptions(design: string): string {
    const optionsSection = this.extractSectionByKeywords(design, [
      'design options', 'options', 'approaches', 'alternatives'
    ]);
    
    if (optionsSection) {
      return optionsSection;
    }
    
    // Look for Conservative/Balanced/Bold pattern
    const lines = design.split('\n');
    const optionLines: string[] = [];
    let inOptions = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.toLowerCase().includes('conservative') || 
          trimmed.toLowerCase().includes('balanced') || 
          trimmed.toLowerCase().includes('bold')) {
        inOptions = true;
        optionLines.push(line);
      } else if (inOptions && (trimmed.startsWith('#') || trimmed.length === 0)) {
        if (trimmed.startsWith('#')) break;
      } else if (inOptions) {
        optionLines.push(line);
      }
    }
    
    return optionLines.length > 0 
      ? optionLines.join('\n')
      : 'Design options not explicitly structured in document.';
  }

  /**
   * Extract Impact vs Effort matrix
   */
  extractImpactEffortMatrix(design: string): string {
    const matrixSection = this.extractSectionByKeywords(design, [
      'impact', 'effort', 'matrix', 'analysis'
    ]);
    
    if (matrixSection) {
      return matrixSection;
    }
    
    // Look for table or structured impact/effort content
    const lines = design.split('\n');
    const matrixLines: string[] = [];
    
    for (const line of lines) {
      if (line.includes('|') && (
          line.toLowerCase().includes('impact') || 
          line.toLowerCase().includes('effort') ||
          line.toLowerCase().includes('high') ||
          line.toLowerCase().includes('medium') ||
          line.toLowerCase().includes('low')
      )) {
        matrixLines.push(line);
      }
    }
    
    return matrixLines.length > 0 
      ? matrixLines.join('\n')
      : 'Impact vs Effort analysis not found in structured format.';
  }

  /**
   * Extract executive summary from one-pager
   */
  extractExecutiveSummary(onePager: string): string {
    const summarySection = this.extractSectionByKeywords(onePager, [
      'executive summary', 'summary', 'overview', 'recommendation'
    ]);
    
    if (summarySection) {
      return summarySection;
    }
    
    // Fallback: extract first substantial paragraph
    const lines = onePager.split('\n');
    const summaryLines: string[] = [];
    let foundContent = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!foundContent && trimmed.length > 50) {
        foundContent = true;
        summaryLines.push(trimmed);
      } else if (foundContent && trimmed.length > 0) {
        summaryLines.push(trimmed);
        if (summaryLines.join(' ').length > 300) break;
      }
    }
    
    return summaryLines.length > 0 
      ? summaryLines.join(' ')
      : 'Executive summary not found in one-pager.';
  }

  /**
   * Extract ROI analysis from one-pager
   */
  extractROIAnalysis(onePager: string): string {
    const roiSection = this.extractSectionByKeywords(onePager, [
      'roi', 'return on investment', 'cost', 'benefit', 'savings', 'financial'
    ]);
    
    if (roiSection) {
      return roiSection;
    }
    
    // Look for financial data patterns
    const lines = onePager.split('\n');
    const roiLines: string[] = [];
    
    for (const line of lines) {
      if (line.match(/\$[\d,]+/) || 
          line.toLowerCase().includes('cost') ||
          line.toLowerCase().includes('saving') ||
          line.toLowerCase().includes('roi')) {
        roiLines.push(line);
      }
    }
    
    return roiLines.length > 0 
      ? roiLines.join('\n')
      : 'ROI analysis not found in structured format.';
  }

  /**
   * Extract task breakdown from task plan
   */
  extractTaskBreakdown(taskPlan: string): string {
    const lines = taskPlan.split('\n');
    const taskLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Match checkbox tasks or numbered tasks
      if (trimmed.match(/^-\s*\[[\sx]\]/) || 
          trimmed.match(/^\d+\./) ||
          trimmed.match(/^\d+\.\d+/)) {
        taskLines.push(line);
      }
    }
    
    return taskLines.length > 0 
      ? taskLines.join('\n')
      : 'Task breakdown not found in standard format.';
  }

  /**
   * Format extracted content for inclusion in steering files
   */
  private formatExtractedContent(content: string): string {
    if (!this.config.preserveMarkdown) {
      // Strip markdown formatting
      return content
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/`(.*?)`/g, '$1') // Remove inline code
        .trim();
    }
    
    // Preserve markdown but clean up
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .substring(0, this.config.maxSectionLength || 5000);
  }

  /**
   * Generate file references in #[[file:path]] format
   */
  generateFileReferences(relatedFiles: string[]): string[] {
    return relatedFiles
      .filter(file => file && file.trim().length > 0)
      .map(file => `#[[file:${file.trim()}]]`);
  }

  /**
   * Format file references as markdown content
   */
  formatFileReferences(references: string[]): string {
    if (references.length === 0) {
      return '*No related documents found.*';
    }
    
    return references.join('\n');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ContentExtractionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ContentExtractionConfig {
    return { ...this.config };
  }
}

export default TemplateProcessor;