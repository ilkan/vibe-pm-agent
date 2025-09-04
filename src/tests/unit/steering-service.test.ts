/**
 * Unit tests for SteeringService component
 */

import { SteeringService } from '../../components/steering-service';
import { SteeringFileOptions } from '../../models/mcp';
import { DocumentType, SteeringFile, SaveResult } from '../../models/steering';

// Mock the dependencies
jest.mock('../../components/steering-file-generator');
jest.mock('../../components/steering-file-manager');
jest.mock('../../components/document-reference-linker');

// Import the mocked classes
import { SteeringFileGenerator } from '../../components/steering-file-generator';
import { SteeringFileManager } from '../../components/steering-file-manager';
import { DocumentReferenceLinker } from '../../components/document-reference-linker';

// Create mock implementations
const MockedSteeringFileGenerator = SteeringFileGenerator as jest.MockedClass<typeof SteeringFileGenerator>;
const MockedSteeringFileManager = SteeringFileManager as jest.MockedClass<typeof SteeringFileManager>;
const MockedDocumentReferenceLinker = DocumentReferenceLinker as jest.MockedClass<typeof DocumentReferenceLinker>;

describe('SteeringService', () => {
  let service: SteeringService;
  let mockGenerator: jest.Mocked<SteeringFileGenerator>;
  let mockManager: jest.Mocked<SteeringFileManager>;
  let mockReferenceLinker: jest.Mocked<DocumentReferenceLinker>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockGenerator = {
      generateFromRequirements: jest.fn(),
      generateFromDesign: jest.fn(),
      generateFromOnePager: jest.fn(),
      generateFromPRFAQ: jest.fn(),
      generateFromTaskPlan: jest.fn()
    } as any;

    mockManager = {
      saveSteeringFile: jest.fn(),
      checkConflicts: jest.fn(),
      resolveNaming: jest.fn(),
      listExistingSteeringFiles: jest.fn(),
      getStats: jest.fn()
    } as any;

    mockReferenceLinker = {
      addFileReferences: jest.fn(),
      generateFileReferences: jest.fn(),
      detectRelatedFiles: jest.fn(),
      validateCrossReferences: jest.fn()
    } as any;

    // Setup mock implementations
    MockedSteeringFileGenerator.mockImplementation(() => mockGenerator);
    MockedSteeringFileManager.mockImplementation(() => mockManager);
    MockedDocumentReferenceLinker.mockImplementation(() => mockReferenceLinker);

    // Setup default mock return values
    const mockSteeringFile: SteeringFile = {
      filename: 'test-steering-file.md',
      frontMatter: {
        inclusion: 'fileMatch',
        generatedBy: 'vibe-pm-agent',
        generatedAt: new Date().toISOString(),
        featureName: 'test-feature',
        documentType: DocumentType.REQUIREMENTS
      },
      content: 'Test steering file content',
      references: []
    };

    const mockSaveResult: SaveResult = {
      success: true,
      filename: 'test-steering-file.md',
      action: 'created',
      message: 'Steering file created successfully',
      fullPath: '.kiro/steering/test-steering-file.md'
    };

    mockGenerator.generateFromRequirements.mockReturnValue(mockSteeringFile);
    mockGenerator.generateFromDesign.mockReturnValue(mockSteeringFile);
    mockGenerator.generateFromOnePager.mockReturnValue(mockSteeringFile);
    mockGenerator.generateFromPRFAQ.mockReturnValue(mockSteeringFile);
    mockGenerator.generateFromTaskPlan.mockReturnValue(mockSteeringFile);

    mockManager.saveSteeringFile.mockResolvedValue(mockSaveResult);
    mockManager.getStats.mockReturnValue({
      filesCreated: 0,
      filesUpdated: 0,
      conflictsEncountered: 0,
      documentTypesProcessed: [],
      processingTimeMs: 0
    });

    mockReferenceLinker.addFileReferences.mockImplementation((context) => context);
    mockReferenceLinker.generateFileReferences.mockReturnValue([]);

    service = new SteeringService({
      userPreferences: {
        autoCreate: true
      }
    });
  });

  describe('createFromRequirements', () => {
    test('should create steering file from requirements when enabled', async () => {
      const requirements = JSON.stringify({
        businessGoal: 'Improve user authentication',
        functionalRequirements: ['Secure login', 'User registration'],
        priority: { must: ['Security'], should: ['UX'], could: [], wont: [] }
      });

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'auth-system',
        inclusion_rule: 'fileMatch',
        file_match_pattern: 'requirements*'
      };

      const result = await service.createFromRequirements(requirements, steeringOptions);

      expect(result.created).toBe(true);
      expect(result.message).toContain('Requirements steering file created');
      expect(result.results).toHaveLength(1);
    });

    test('should skip creation when steering files disabled', async () => {
      const requirements = 'Test requirements';
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: false,
        feature_name: 'test'
      };

      const result = await service.createFromRequirements(requirements, steeringOptions);

      expect(result.created).toBe(false);
      expect(result.message).toContain('disabled');
      expect(result.results).toHaveLength(0);
    });

    test('should skip creation when no steering options provided', async () => {
      const requirements = 'Test requirements';

      const result = await service.createFromRequirements(requirements);

      expect(result.created).toBe(false);
      expect(result.message).toContain('disabled');
    });
  });

  describe('createFromDesignOptions', () => {
    test('should create steering file from design options when enabled', async () => {
      const design = JSON.stringify({
        problemFraming: 'Design system architecture',
        options: {
          conservative: { description: 'Basic approach' },
          balanced: { description: 'Moderate approach' },
          bold: { description: 'Advanced approach' }
        }
      });

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'design-system',
        inclusion_rule: 'fileMatch',
        file_match_pattern: 'design*'
      };

      const result = await service.createFromDesignOptions(design, steeringOptions);

      expect(result.created).toBe(true);
      expect(result.message).toContain('Design steering file created');
    });
  });

  describe('createFromOnePager', () => {
    test('should create steering file from one-pager when enabled', async () => {
      const onePager = `# Executive Summary
      
      This is a management one-pager with key insights and recommendations.
      
      ## Options
      - Conservative: Low risk approach
      - Balanced: Moderate risk/reward
      - Bold: High impact approach`;

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'executive-summary',
        inclusion_rule: 'manual'
      };

      const result = await service.createFromOnePager(onePager, steeringOptions);

      expect(result.created).toBe(true);
      expect(result.message).toContain('One-pager steering file created');
    });
  });

  describe('createFromPRFAQ', () => {
    test('should create steering file from PR-FAQ when enabled', async () => {
      const prfaq = `# Press Release
      
      New feature launch announcement.
      
      # FAQ
      
      **Q1: What is this feature?**
      A: This is a new capability for users.
      
      # Launch Checklist
      
      - [ ] Feature development complete
      - [ ] Testing complete`;

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'product-launch',
        inclusion_rule: 'manual'
      };

      const result = await service.createFromPRFAQ(prfaq, steeringOptions);

      expect(result.created).toBe(true);
      expect(result.message).toContain('PR-FAQ steering file created');
    });
  });

  describe('createFromTaskPlan', () => {
    test('should create steering file from task plan when enabled', async () => {
      const taskPlan = JSON.stringify({
        task_plan: {
          guardrailsCheck: { limits: { max_vibes: 50 } },
          immediateWins: ['Setup project structure'],
          shortTerm: ['Implement core features'],
          longTerm: ['Scale and optimize']
        }
      });

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'implementation',
        inclusion_rule: 'fileMatch',
        file_match_pattern: 'tasks*'
      };

      const result = await service.createFromTaskPlan(taskPlan, steeringOptions);

      expect(result.created).toBe(true);
      expect(result.message).toContain('Task plan steering file created');
    });
  });

  describe('Configuration and options handling', () => {
    test('should use default inclusion rules for different document types', async () => {
      const testCases = [
        { method: 'createFromRequirements', content: 'requirements', expectedRule: 'fileMatch' },
        { method: 'createFromDesignOptions', content: 'design', expectedRule: 'fileMatch' },
        { method: 'createFromOnePager', content: 'onepager', expectedRule: 'manual' },
        { method: 'createFromPRFAQ', content: 'prfaq', expectedRule: 'manual' },
        { method: 'createFromTaskPlan', content: 'tasks', expectedRule: 'fileMatch' }
      ];

      for (const testCase of testCases) {
        const steeringOptions: SteeringFileOptions = {
          create_steering_files: true,
          feature_name: 'test-defaults'
          // No inclusion_rule specified, should use defaults
        };

        const method = service[testCase.method as keyof SteeringService] as Function;
        const result = await method.call(service, testCase.content, steeringOptions);

        expect(result.created).toBe(true);
      }
    });

    test('should handle custom filename prefixes', async () => {
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'custom-prefix-test',
        filename_prefix: 'custom',
        inclusion_rule: 'always'
      };

      const result = await service.createFromRequirements('test', steeringOptions);
      expect(result.created).toBe(true);
    });

    test('should handle overwrite existing option', async () => {
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'overwrite-test',
        inclusion_rule: 'always',
        overwrite_existing: true
      };

      const result = await service.createFromRequirements('test', steeringOptions);
      expect(result.created).toBe(true);
    });
  });

  describe('Error handling', () => {
    test('should handle missing feature name gracefully', async () => {
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        // Missing feature_name
        inclusion_rule: 'always'
      };

      const result = await service.createFromRequirements('test', steeringOptions);
      
      // Should still attempt creation with default name
      expect(result.created).toBe(true);
    });

    test('should handle service errors gracefully', async () => {
      // Mock a service that throws an error
      const errorService = new SteeringService({
        userPreferences: {
          autoCreate: true
        }
      });
      
      // Override the generator to throw an error
      (errorService as any).generator = {
        generateFromRequirements: () => {
          throw new Error('Generator error');
        }
      };

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'error-test'
      };

      const result = await errorService.createFromRequirements('test', steeringOptions);
      
      expect(result.created).toBe(false);
      expect(result.message).toContain('Failed to create');
      expect(result.warnings).toContain('Generator error');
    });
  });

  describe('Statistics and monitoring', () => {
    test('should provide statistics about operations', () => {
      const stats = service.getStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.filesCreated).toBe('number');
      expect(typeof stats.filesUpdated).toBe('number');
      expect(typeof stats.conflictsEncountered).toBe('number');
      expect(Array.isArray(stats.documentTypesProcessed)).toBe(true);
      expect(typeof stats.processingTimeMs).toBe('number');
    });
  });
});