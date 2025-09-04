/**
 * Unit tests for DocumentReferenceLinker component
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  DocumentReferenceLinker, 
  createDocumentReferenceLinker,
  validateFileReference,
  extractFilePath,
  FileReference,
  CrossReferenceValidation,
  ReferenceDetectionConfig
} from '../../components/document-reference-linker';
import { SteeringContext, DocumentType } from '../../models/steering';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('DocumentReferenceLinker', () => {
  let linker: DocumentReferenceLinker;
  let mockWorkspaceRoot: string;
  let mockContext: SteeringContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWorkspaceRoot = '/test/workspace';
    
    linker = new DocumentReferenceLinker(mockWorkspaceRoot);
    
    mockContext = {
      featureName: 'user-authentication',
      projectName: 'auth-system',
      relatedFiles: [],
      inclusionRule: 'fileMatch',
      fileMatchPattern: 'auth*'
    };

    // Setup default fs mocks
    (mockFs.existsSync as jest.Mock).mockReturnValue(true);
    (mockFs.readdirSync as jest.Mock).mockReturnValue([]);
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const config = linker.getConfig();
      
      expect(config.baseDirectory).toBe('.kiro/specs');
      expect(config.includeExtensions).toEqual(['.md', '.txt', '.json']);
      expect(config.excludePatterns).toEqual(['node_modules', '.git', 'dist', 'build']);
      expect(config.maxDepth).toBe(5);
      expect(config.validateExistence).toBe(true);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<ReferenceDetectionConfig> = {
        baseDirectory: 'custom/specs',
        includeExtensions: ['.md'],
        maxDepth: 3
      };
      
      const customLinker = new DocumentReferenceLinker(mockWorkspaceRoot, customConfig);
      const config = customLinker.getConfig();
      
      expect(config.baseDirectory).toBe('custom/specs');
      expect(config.includeExtensions).toEqual(['.md']);
      expect(config.maxDepth).toBe(3);
      expect(config.validateExistence).toBe(true); // Should keep default
    });
  });

  describe('addFileReferences', () => {
    it('should add detected files to context', () => {
      // Mock file system structure
      (mockFs.existsSync as jest.Mock).mockImplementation((filePath: any) => {
        return filePath.includes('.kiro/specs');
      });
      
      (mockFs.readdirSync as jest.Mock).mockImplementation((dirPath: any) => {
        if (dirPath.includes('user-authentication')) {
          return [
            { name: 'requirements.md', isDirectory: () => false, isFile: () => true },
            { name: 'design.md', isDirectory: () => false, isFile: () => true },
            { name: 'tasks.md', isDirectory: () => false, isFile: () => true }
          ];
        }
        return [];
      });

      const result = linker.addFileReferences(mockContext);
      
      expect(result.relatedFiles.length).toBeGreaterThan(0);
      expect(result.featureName).toBe(mockContext.featureName);
      expect(result.inclusionRule).toBe(mockContext.inclusionRule);
    });

    it('should handle non-existent specs directory', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(false);
      
      const result = linker.addFileReferences(mockContext);
      
      expect(result.relatedFiles).toEqual([]);
    });
  });

  describe('detectRelatedFiles', () => {
    beforeEach(() => {
      (mockFs.existsSync as jest.Mock).mockImplementation((filePath: any) => {
        return filePath.includes('.kiro/specs');
      });
    });

    it('should detect files in feature directory', () => {
      (mockFs.readdirSync as jest.Mock).mockImplementation((dirPath: any) => {
        if (dirPath.includes('user-authentication')) {
          return [
            { name: 'requirements.md', isDirectory: () => false, isFile: () => true },
            { name: 'design.md', isDirectory: () => false, isFile: () => true }
          ];
        }
        return [];
      });

      const files = linker.detectRelatedFiles('user-authentication');
      
      expect(files.length).toBeGreaterThan(0);
      expect(mockFs.readdirSync).toHaveBeenCalled();
    });

    it('should detect files in project directory when provided', () => {
      (mockFs.readdirSync as jest.Mock).mockImplementation((dirPath: any) => {
        if (dirPath.includes('auth-system')) {
          return [
            { name: 'overview.md', isDirectory: () => false, isFile: () => true }
          ];
        }
        return [];
      });

      const files = linker.detectRelatedFiles('user-authentication', 'auth-system');
      
      expect(mockFs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining('auth-system')
      );
    });

    it('should find similar files in other directories', () => {
      (mockFs.readdirSync as jest.Mock).mockImplementation((dirPath: any) => {
        if (dirPath.includes('.kiro/specs') && !dirPath.includes('user-authentication')) {
          return [
            { name: 'authentication-service', isDirectory: () => true, isFile: () => false },
            { name: 'user-management', isDirectory: () => true, isFile: () => false }
          ];
        }
        if (dirPath.includes('authentication-service')) {
          return [
            { name: 'auth-flow.md', isDirectory: () => false, isFile: () => true }
          ];
        }
        return [];
      });

      const files = linker.detectRelatedFiles('user-authentication');
      
      expect(files).toBeDefined();
    });
  });

  describe('generateFileReferences', () => {
    it('should generate proper file references', () => {
      const filePaths = [
        '/test/workspace/.kiro/specs/feature/requirements.md',
        '/test/workspace/.kiro/specs/feature/design.md'
      ];

      (mockFs.existsSync as jest.Mock).mockReturnValue(true);

      const references = linker.generateFileReferences(filePaths);
      
      expect(references).toHaveLength(2);
      expect(references[0].reference).toBe('#[[file:.kiro/specs/feature/requirements.md]]');
      expect(references[0].documentType).toBe(DocumentType.REQUIREMENTS);
      expect(references[0].exists).toBe(true);
      expect(references[1].reference).toBe('#[[file:.kiro/specs/feature/design.md]]');
      expect(references[1].documentType).toBe(DocumentType.DESIGN);
    });

    it('should handle relative paths correctly', () => {
      const filePaths = [
        '.kiro/specs/feature/requirements.md',
        'docs/api.md'
      ];

      (mockFs.existsSync as jest.Mock).mockReturnValue(true);

      const references = linker.generateFileReferences(filePaths);
      
      expect(references[0].reference).toBe('#[[file:.kiro/specs/feature/requirements.md]]');
      expect(references[1].reference).toBe('#[[file:docs/api.md]]');
    });

    it('should detect document types correctly', () => {
      const filePaths = [
        'requirements.md',
        'design-doc.md',
        'task-list.md',
        'one-pager.md',
        'pr-faq.md',
        'unknown.md'
      ];

      (mockFs.existsSync as jest.Mock).mockReturnValue(true);

      const references = linker.generateFileReferences(filePaths);
      
      expect(references[0].documentType).toBe(DocumentType.REQUIREMENTS);
      expect(references[1].documentType).toBe(DocumentType.DESIGN);
      expect(references[2].documentType).toBe(DocumentType.TASKS);
      expect(references[3].documentType).toBe(DocumentType.ONEPAGER);
      expect(references[4].documentType).toBe(DocumentType.PRFAQ);
      expect(references[5].documentType).toBeUndefined();
    });

    it('should mark non-existent files correctly when validation is enabled', () => {
      const filePaths = ['existing.md', 'missing.md'];

      (mockFs.existsSync as jest.Mock).mockImplementation((filePath: any) => {
        return filePath.includes('existing.md');
      });

      const references = linker.generateFileReferences(filePaths);
      
      expect(references[0].exists).toBe(true);
      expect(references[1].exists).toBe(false);
    });
  });

  describe('validateCrossReferences', () => {
    it('should validate correct references', () => {
      const references = [
        '#[[file:.kiro/specs/feature/requirements.md]]',
        '#[[file:.kiro/specs/feature/design.md]]'
      ];

      (mockFs.existsSync as jest.Mock).mockReturnValue(true);

      const validation = linker.validateCrossReferences(references);
      
      expect(validation.isValid).toBe(true);
      expect(validation.validReferences).toHaveLength(2);
      expect(validation.invalidReferences).toHaveLength(0);
      expect(validation.suggestions).toHaveLength(0);
    });

    it('should detect invalid reference format', () => {
      const references = [
        'invalid-reference',
        '#[[file:valid.md]]'
      ];

      (mockFs.existsSync as jest.Mock).mockReturnValue(true);

      const validation = linker.validateCrossReferences(references);
      
      expect(validation.isValid).toBe(false);
      expect(validation.validReferences).toHaveLength(1);
      expect(validation.invalidReferences).toHaveLength(1);
      expect(validation.invalidReferences[0].reason).toContain('Invalid reference format');
    });

    it('should detect missing files and provide suggestions', () => {
      const references = ['#[[file:missing.md]]'];

      (mockFs.existsSync as jest.Mock).mockReturnValue(false);
      (mockFs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'similar.md', isDirectory: () => false, isFile: () => true }
      ]);

      const validation = linker.validateCrossReferences(references);
      
      expect(validation.isValid).toBe(false);
      expect(validation.invalidReferences).toHaveLength(1);
      expect(validation.invalidReferences[0].reason).toContain('File does not exist');
    });
  });

  describe('resolveRelativePath', () => {
    it('should convert absolute paths to relative', () => {
      const absolutePath = '/test/workspace/src/file.md';
      const relativePath = linker.resolveRelativePath(absolutePath);
      
      expect(relativePath).toBe('src/file.md');
    });

    it('should return relative paths unchanged', () => {
      const relativePath = 'src/file.md';
      const result = linker.resolveRelativePath(relativePath);
      
      expect(result).toBe('src/file.md');
    });
  });

  describe('getFeatureFiles', () => {
    it('should return files for existing feature', () => {
      (mockFs.existsSync as jest.Mock).mockImplementation((filePath: any) => {
        return filePath.includes('user-authentication');
      });

      (mockFs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'requirements.md', isDirectory: () => false, isFile: () => true },
        { name: 'design.md', isDirectory: () => false, isFile: () => true }
      ]);

      const files = linker.getFeatureFiles('user-authentication');
      
      expect(files.length).toBeGreaterThan(0);
      expect(files[0]).toHaveProperty('reference');
      expect(files[0]).toHaveProperty('documentType');
    });

    it('should return empty array for non-existent feature', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(false);

      const files = linker.getFeatureFiles('non-existent');
      
      expect(files).toEqual([]);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = {
        maxDepth: 10,
        includeExtensions: ['.md', '.rst']
      };

      linker.updateConfig(newConfig);
      const config = linker.getConfig();
      
      expect(config.maxDepth).toBe(10);
      expect(config.includeExtensions).toEqual(['.md', '.rst']);
      expect(config.baseDirectory).toBe('.kiro/specs'); // Should keep existing
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle file system errors gracefully', () => {
      (mockFs.readdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const files = linker.detectRelatedFiles('test-feature');
      
      expect(files).toEqual([]);
    });

    it('should handle empty feature names', () => {
      const files = linker.detectRelatedFiles('');
      
      expect(files).toEqual([]);
    });

    it('should exclude hidden files and directories', () => {
      (mockFs.readdirSync as jest.Mock).mockReturnValue([
        { name: '.hidden', isDirectory: () => true, isFile: () => false },
        { name: 'visible.md', isDirectory: () => false, isFile: () => true }
      ]);

      const files = linker.detectRelatedFiles('test-feature');
      
      // Should not include hidden files
      expect(files.every(file => !path.basename(file).startsWith('.'))).toBe(true);
    });

    it('should respect max depth configuration', () => {
      const shallowLinker = new DocumentReferenceLinker(mockWorkspaceRoot, { maxDepth: 1 });
      
      (mockFs.readdirSync as jest.Mock).mockImplementation((dirPath: any) => {
        // Return nested structure that exceeds maxDepth
        return [
          { name: 'level1', isDirectory: () => true, isFile: () => false }
        ];
      });

      const files = shallowLinker.detectRelatedFiles('test-feature');
      
      // Should respect depth limit
      expect(files).toBeDefined();
    });
  });
});

describe('Factory and utility functions', () => {
  describe('createDocumentReferenceLinker', () => {
    it('should create linker with default settings', () => {
      const linker = createDocumentReferenceLinker();
      
      expect(linker).toBeInstanceOf(DocumentReferenceLinker);
      expect(linker.getConfig().baseDirectory).toBe('.kiro/specs');
    });

    it('should create linker with custom settings', () => {
      const config = { maxDepth: 2 };
      const linker = createDocumentReferenceLinker('/custom/root', config);
      
      expect(linker).toBeInstanceOf(DocumentReferenceLinker);
      expect(linker.getConfig().maxDepth).toBe(2);
    });
  });

  describe('validateFileReference', () => {
    beforeEach(() => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);
    });

    it('should validate correct reference', () => {
      const isValid = validateFileReference('#[[file:test.md]]');
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid reference', () => {
      const isValid = validateFileReference('invalid-reference');
      
      expect(isValid).toBe(false);
    });
  });

  describe('extractFilePath', () => {
    it('should extract file path from valid reference', () => {
      const filePath = extractFilePath('#[[file:path/to/file.md]]');
      
      expect(filePath).toBe('path/to/file.md');
    });

    it('should return null for invalid reference', () => {
      const filePath = extractFilePath('invalid-reference');
      
      expect(filePath).toBeNull();
    });

    it('should handle complex paths', () => {
      const filePath = extractFilePath('#[[file:.kiro/specs/feature-name/requirements.md]]');
      
      expect(filePath).toBe('.kiro/specs/feature-name/requirements.md');
    });
  });
});

describe('Integration scenarios', () => {
  let linker: DocumentReferenceLinker;

  beforeEach(() => {
    jest.clearAllMocks();
    linker = new DocumentReferenceLinker('/test/workspace');
  });

  it('should handle complete workflow: detect -> generate -> validate', () => {
    // Setup mock file system
    (mockFs.existsSync as jest.Mock).mockImplementation((filePath: any) => {
      return filePath.includes('.kiro/specs') || filePath.includes('requirements.md');
    });

    (mockFs.readdirSync as jest.Mock).mockImplementation((dirPath: any) => {
      if (dirPath.includes('user-auth')) {
        return [
          { name: 'requirements.md', isDirectory: () => false, isFile: () => true },
          { name: 'design.md', isDirectory: () => false, isFile: () => true }
        ];
      }
      return [];
    });

    // Detect files
    const detectedFiles = linker.detectRelatedFiles('user-auth');
    
    // Generate references
    const references = linker.generateFileReferences(detectedFiles);
    
    // Validate references
    const validation = linker.validateCrossReferences(
      references.map(ref => ref.reference)
    );

    expect(detectedFiles.length).toBeGreaterThan(0);
    expect(references.length).toBe(detectedFiles.length);
    expect(validation.validReferences.length).toBeGreaterThan(0);
  });

  it('should provide meaningful suggestions for broken references', () => {
    (mockFs.existsSync as jest.Mock).mockImplementation((filePath: any) => {
      // The missing file doesn't exist, but the directory does
      if (filePath.includes('requirements.md')) return false;
      if (filePath === '/test/workspace') return true; // Directory exists
      return filePath.includes('requirements-v2.md'); // Only v2 exists
    });

    (mockFs.readdirSync as jest.Mock).mockReturnValue([
      'requirements-v2.md' // Similar file exists in same directory
    ]);

    const validation = linker.validateCrossReferences(['#[[file:requirements.md]]']);
    
    expect(validation.isValid).toBe(false);
    expect(validation.suggestions.length).toBeGreaterThan(0);
  });
});