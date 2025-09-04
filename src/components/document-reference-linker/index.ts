/**
 * DocumentReferenceLinker Component
 * 
 * This component handles the detection and generation of cross-references between
 * steering files and related documents in the .kiro/specs directory structure.
 * It provides intelligent file discovery and path resolution for creating
 * interconnected steering file guidance.
 */

import * as fs from 'fs';
import * as path from 'path';
import { SteeringContext, DocumentType } from '../../models/steering';

/**
 * Interface for file reference information
 */
export interface FileReference {
  /** Original file path */
  filePath: string;
  /** Reference string in #[[file:path]] format */
  reference: string;
  /** Type of document if detectable */
  documentType?: DocumentType;
  /** Whether the file exists */
  exists: boolean;
  /** Relative path from workspace root */
  relativePath: string;
}

/**
 * Configuration for reference detection
 */
export interface ReferenceDetectionConfig {
  /** Base directory to search for related files */
  baseDirectory: string;
  /** File extensions to include in search */
  includeExtensions: string[];
  /** Patterns to exclude from search */
  excludePatterns: string[];
  /** Maximum depth for directory traversal */
  maxDepth: number;
  /** Whether to validate file existence */
  validateExistence: boolean;
}

/**
 * Result of cross-reference validation
 */
export interface CrossReferenceValidation {
  /** Whether all references are valid */
  isValid: boolean;
  /** List of valid references */
  validReferences: FileReference[];
  /** List of invalid references with reasons */
  invalidReferences: Array<{
    reference: string;
    reason: string;
  }>;
  /** Suggested fixes for invalid references */
  suggestions: Array<{
    original: string;
    suggested: string;
    reason: string;
  }>;
}

/**
 * DocumentReferenceLinker handles file discovery and cross-reference generation
 * for steering files and related project documents.
 */
export class DocumentReferenceLinker {
  private config: ReferenceDetectionConfig;
  private workspaceRoot: string;

  constructor(workspaceRoot: string = process.cwd(), config?: Partial<ReferenceDetectionConfig>) {
    this.workspaceRoot = workspaceRoot;
    this.config = {
      baseDirectory: '.kiro/specs',
      includeExtensions: ['.md', '.txt', '.json'],
      excludePatterns: ['node_modules', '.git', 'dist', 'build'],
      maxDepth: 5,
      validateExistence: true,
      ...config
    };
  }

  /**
   * Add file references to a steering context by detecting related files
   */
  addFileReferences(context: SteeringContext): SteeringContext {
    const relatedFiles = this.detectRelatedFiles(context.featureName, context.projectName);
    
    return {
      ...context,
      relatedFiles: [...context.relatedFiles, ...relatedFiles]
    };
  }

  /**
   * Detect related files in the .kiro/specs directory structure
   */
  detectRelatedFiles(featureName: string, projectName?: string): string[] {
    const relatedFiles: string[] = [];
    const specsPath = path.join(this.workspaceRoot, this.config.baseDirectory);

    if (!fs.existsSync(specsPath)) {
      return relatedFiles;
    }

    // Look for feature-specific directory
    const featureDir = path.join(specsPath, featureName);
    if (fs.existsSync(featureDir)) {
      relatedFiles.push(...this.scanDirectory(featureDir, featureName));
    }

    // Look for project-specific directories if projectName is provided
    if (projectName) {
      const projectDir = path.join(specsPath, projectName);
      if (fs.existsSync(projectDir)) {
        relatedFiles.push(...this.scanDirectory(projectDir, projectName));
      }
    }

    // Look for files with similar names in other directories
    relatedFiles.push(...this.findSimilarFiles(specsPath, featureName));

    return this.deduplicateAndSort(relatedFiles);
  }

  /**
   * Generate #[[file:path]] references with relative paths
   */
  generateFileReferences(filePaths: string[]): FileReference[] {
    return filePaths.map(filePath => {
      const relativePath = this.toRelativePath(filePath);
      const reference = `#[[file:${relativePath}]]`;
      const exists = this.config.validateExistence ? fs.existsSync(path.join(this.workspaceRoot, relativePath)) : true;
      
      return {
        filePath,
        reference,
        documentType: this.detectDocumentType(filePath),
        exists,
        relativePath
      };
    });
  }

  /**
   * Validate cross-references and provide suggestions for fixes
   */
  validateCrossReferences(references: string[]): CrossReferenceValidation {
    const validReferences: FileReference[] = [];
    const invalidReferences: Array<{ reference: string; reason: string }> = [];
    const suggestions: Array<{ original: string; suggested: string; reason: string }> = [];

    for (const reference of references) {
      const filePath = this.extractFilePathFromReference(reference);
      
      if (!filePath) {
        invalidReferences.push({
          reference,
          reason: 'Invalid reference format. Expected #[[file:path]]'
        });
        continue;
      }

      const fullPath = path.join(this.workspaceRoot, filePath);
      const exists = fs.existsSync(fullPath);

      if (exists) {
        validReferences.push({
          filePath,
          reference,
          documentType: this.detectDocumentType(filePath),
          exists: true,
          relativePath: filePath
        });
      } else {
        invalidReferences.push({
          reference,
          reason: `File does not exist: ${filePath}`
        });

        // Try to find similar files and suggest alternatives
        const suggestion = this.findSimilarFile(filePath);
        if (suggestion) {
          suggestions.push({
            original: reference,
            suggested: `#[[file:${suggestion}]]`,
            reason: `File not found, but similar file exists: ${suggestion}`
          });
        }
      }
    }

    return {
      isValid: invalidReferences.length === 0,
      validReferences,
      invalidReferences,
      suggestions
    };
  }

  /**
   * Resolve relative paths from workspace root
   */
  resolveRelativePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return path.relative(this.workspaceRoot, filePath);
    }
    return filePath;
  }

  /**
   * Get all files in a feature directory that should be cross-referenced
   */
  getFeatureFiles(featureName: string): FileReference[] {
    const featureDir = path.join(this.workspaceRoot, this.config.baseDirectory, featureName);
    
    if (!fs.existsSync(featureDir)) {
      return [];
    }

    const files = this.scanDirectory(featureDir, featureName);
    return this.generateFileReferences(files);
  }

  /**
   * Private helper methods
   */

  private scanDirectory(dirPath: string, contextName: string, currentDepth: number = 0): string[] {
    if (currentDepth >= this.config.maxDepth) {
      return [];
    }

    const files: string[] = [];
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (this.shouldExclude(entry.name)) {
          continue;
        }

        if (entry.isDirectory()) {
          files.push(...this.scanDirectory(fullPath, contextName, currentDepth + 1));
        } else if (entry.isFile() && this.shouldInclude(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Silently handle permission errors or other file system issues
    }

    return files;
  }

  private findSimilarFiles(baseDir: string, featureName: string): string[] {
    const similarFiles: string[] = [];
    
    try {
      const entries = fs.readdirSync(baseDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !this.shouldExclude(entry.name)) {
          const dirPath = path.join(baseDir, entry.name);
          const files = this.scanDirectory(dirPath, entry.name);
          
          // Include files that might be related to the feature
          const relatedFiles = files.filter(file => 
            this.isFileRelated(file, featureName)
          );
          
          similarFiles.push(...relatedFiles);
        }
      }
    } catch (error) {
      // Silently handle errors
    }

    return similarFiles;
  }

  private isFileRelated(filePath: string, featureName: string): boolean {
    const fileName = path.basename(filePath, path.extname(filePath));
    const featureWords = featureName.toLowerCase().split(/[-_\s]/);
    const fileWords = fileName.toLowerCase().split(/[-_\s]/);
    
    // Check if any feature words appear in the filename
    return featureWords.some(word => 
      fileWords.some(fileWord => 
        fileWord.includes(word) || word.includes(fileWord)
      )
    );
  }

  private shouldInclude(fileName: string): boolean {
    const ext = path.extname(fileName).toLowerCase();
    return this.config.includeExtensions.includes(ext);
  }

  private shouldExclude(name: string): boolean {
    return this.config.excludePatterns.some(pattern => 
      name.includes(pattern) || name.startsWith('.')
    );
  }

  private toRelativePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return path.relative(this.workspaceRoot, filePath);
    }
    
    // If it's already relative but starts with workspace root, make it relative
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.startsWith(this.workspaceRoot)) {
      return path.relative(this.workspaceRoot, normalizedPath);
    }
    
    return normalizedPath;
  }

  private detectDocumentType(filePath: string): DocumentType | undefined {
    const fileName = path.basename(filePath, path.extname(filePath)).toLowerCase();
    
    if (fileName.includes('requirement')) return DocumentType.REQUIREMENTS;
    if (fileName.includes('design')) return DocumentType.DESIGN;
    if (fileName.includes('task')) return DocumentType.TASKS;
    if (fileName.includes('onepager') || fileName.includes('one-pager')) return DocumentType.ONEPAGER;
    if (fileName.includes('prfaq') || fileName.includes('pr-faq')) return DocumentType.PRFAQ;
    
    return undefined;
  }

  private extractFilePathFromReference(reference: string): string | null {
    const match = reference.match(/^#\[\[file:(.+)\]\]$/);
    return match ? match[1] : null;
  }

  private findSimilarFile(targetPath: string): string | null {
    const targetDir = path.dirname(targetPath);
    const targetName = path.basename(targetPath, path.extname(targetPath));
    const targetExt = path.extname(targetPath);
    
    const searchDir = path.join(this.workspaceRoot, targetDir);
    
    if (!fs.existsSync(searchDir)) {
      return null;
    }

    try {
      const files = fs.readdirSync(searchDir);
      
      // Look for files with similar names
      for (const file of files) {
        const fileName = path.basename(file, path.extname(file));
        const fileExt = path.extname(file);
        
        // Check for similar name and same extension
        if (fileExt === targetExt && this.isSimilarName(fileName, targetName)) {
          return path.join(targetDir, file);
        }
      }
    } catch (error) {
      // Handle errors silently
    }

    return null;
  }

  private isSimilarName(name1: string, name2: string): boolean {
    const normalize = (name: string) => name.toLowerCase().replace(/[-_\s]/g, '');
    const normalized1 = normalize(name1);
    const normalized2 = normalize(name2);
    
    // Check for exact match after normalization
    if (normalized1 === normalized2) return true;
    
    // Check for substring match
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
    
    // Check for similar words
    const words1 = name1.toLowerCase().split(/[-_\s]/);
    const words2 = name2.toLowerCase().split(/[-_\s]/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length > 0 && commonWords.length >= Math.min(words1.length, words2.length) * 0.5;
  }

  private deduplicateAndSort(files: string[]): string[] {
    const uniqueFiles = Array.from(new Set(files.map(file => this.toRelativePath(file))));
    
    return uniqueFiles.sort((a, b) => {
      // Sort by document type priority, then alphabetically
      const typeA = this.detectDocumentType(a);
      const typeB = this.detectDocumentType(b);
      
      const typePriority = {
        [DocumentType.REQUIREMENTS]: 1,
        [DocumentType.DESIGN]: 2,
        [DocumentType.TASKS]: 3,
        [DocumentType.ONEPAGER]: 4,
        [DocumentType.PRFAQ]: 5
      };
      
      const priorityA = typeA ? typePriority[typeA] : 999;
      const priorityB = typeB ? typePriority[typeB] : 999;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      return a.localeCompare(b);
    });
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ReferenceDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ReferenceDetectionConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create a DocumentReferenceLinker instance
 */
export function createDocumentReferenceLinker(
  workspaceRoot?: string, 
  config?: Partial<ReferenceDetectionConfig>
): DocumentReferenceLinker {
  return new DocumentReferenceLinker(workspaceRoot, config);
}

/**
 * Utility function to validate a single file reference
 */
export function validateFileReference(reference: string, workspaceRoot: string = process.cwd()): boolean {
  const linker = new DocumentReferenceLinker(workspaceRoot);
  const validation = linker.validateCrossReferences([reference]);
  return validation.isValid;
}

/**
 * Utility function to extract file path from reference string
 */
export function extractFilePath(reference: string): string | null {
  const match = reference.match(/^#\[\[file:(.+)\]\]$/);
  return match ? match[1] : null;
}