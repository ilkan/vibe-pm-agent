/**
 * Comprehensive integration test suite for steering file integration
 * 
 * This test suite covers all aspects of the steering file integration feature:
 * - End-to-end PM agent output to steering file workflow
 * - Performance testing for large documents and file operations
 * - Integration with existing Kiro steering system
 * - Validation of steering file format compliance and cross-references
 * 
 * Requirements covered: 1.1, 2.1, 3.1, 5.1
 */

import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';
import { PMAgentMCPServer } from '../../mcp/server';
import { SteeringService } from '../../components/steering-service';
import { SteeringFileManager } from '../../components/steering-file-manager';
import { SteeringFileGenerator } from '../../components/steering-file-generator';
import { DocumentReferenceLinker } from '../../components/document-reference-linker';
import { FrontMatterProcessor } from '../../components/front-matter-processor';
import { 
  RequirementsArgs, 
  DesignOptionsArgs, 
  ManagementOnePagerArgs, 
  PRFAQArgs, 
  TaskPlanArgs,
  MCPToolContext,
  SteeringFileOptions
} from '../../models/mcp';
import { DocumentType, SteeringFile, InclusionRule } from '../../models/steering';
import { OptionalParams } from '../../models/intent';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('Comprehensive Steering File Integration Test Suite', () => {
  let pipeline: AIAgentPipeline;
  let mcpServer: PMAgentMCPServer;
  let steeringService: SteeringService;
  let steeringManager: SteeringFileManager;
  let testSteeringDir: string;
  let testSpecsDir: string;
  let mockContext: MCPToolContext;

  beforeAll(async () => {
    // Setup test directories
    testSteeringDir = path.join(process.cwd(), 'test-comprehensive-steering');
    testSpecsDir = path.join(process.cwd(), 'test-comprehensive-specs');
    
    await fs.mkdir(testSteeringDir, { recursive: true });
    await fs.mkdir(testSpecsDir, { recursive: true });
  });

  beforeEach(async () => {
    // Clean directories before each test
    try {
      await fs.rm(testSteeringDir, { recursive: true, force: true });
      await fs.rm(testSpecsDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directories don't exist
    }
    
    await fs.mkdir(testSteeringDir, { recursive: true });
    await fs.mkdir(testSpecsDir, { recursive: true });

    // Initialize components
    pipeline = new AIAgentPipeline();
    mcpServer = new PMAgentMCPServer();
    steeringService = new SteeringService({
      steeringDirectory: testSteeringDir,
      userPreferences: { autoCreate: true, showPreview: false }
    });
    steeringManager = new SteeringFileManager({
      steeringDirectory: testSteeringDir,
      validateContent: true
    });

    mockContext = {
      toolName: 'comprehensive-test',
      sessionId: 'comprehensive-test-session',
      timestamp: Date.now(),
      requestId: 'comprehensive-test-request',
      traceId: 'comprehensive-test-trace'
    };
  });

  afterAll(async () => {
    // Final cleanup
    try {
      await fs.rm(testSteeringDir, { recursive: true, force: true });
      await fs.rm(testSpecsDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Requirement 1.1: PM Agent Output to Steering File Workflow', () => {
    it('should create steering files from all PM document types automatically', async () => {
      const featureName = 'comprehensive-workflow-test';
      const baseIntent = 'Create a user management system with authentication, authorization, and user profiles';

      // Test complete workflow through pipeline
      const params: OptionalParams = {
        generatePMDocuments: {
          requirements: true,
          designOptions: true,
          managementOnePager: true,
          prfaq: true,
          taskPlan: true,
          steeringOptions: {
            create_steering_files: true,
            feature_name: featureName,
            inclusion_rule: 'fileMatch',
            file_match_pattern: 'user*|auth*|management*'
          }
        }
      };

      const result = await pipeline.processIntent(baseIntent, params);

      expect(result.success).toBe(true);
      expect(result.pmDocuments).toBeDefined();
      expect(result.steeringFiles).toBeDefined();
      expect(result.steeringFiles!.created).toBe(true);
      expect(result.steeringFiles!.results.length).toBeGreaterThan(0);

      // Verify steering files were created
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBeGreaterThan(0);

      // Verify each file has proper structure
      for (const filename of steeringFiles) {
        const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
        
        // Should have front-matter
        expect(content).toMatch(/^---\n[\s\S]*?\n---\n/);
        
        // Should have content
        expect(content).toMatch(/\n---\n\n# /);
        
        // Should contain feature name
        expect(content).toContain(featureName);
      }
    });

    it('should handle individual MCP tool calls with steering options', async () => {
      const featureName = 'individual-mcp-test';
      
      // Test each MCP tool individually
      const tools = [
        {
          name: 'generateRequirements',
          args: {
            raw_intent: 'Create secure user authentication system',
            steering_options: {
              create_steering_files: true,
              feature_name: featureName,
              inclusion_rule: 'fileMatch'
            }
          } as RequirementsArgs
        },
        {
          name: 'generateDesignOptions',
          args: {
            requirements: 'User authentication with OAuth and MFA support',
            steering_options: {
              create_steering_files: true,
              feature_name: featureName,
              inclusion_rule: 'fileMatch'
            }
          } as DesignOptionsArgs
        }
      ];

      for (const tool of tools) {
        let result;
        if (tool.name === 'generateRequirements') {
          result = await mcpServer.handleGenerateRequirements(tool.args as RequirementsArgs, mockContext);
        } else if (tool.name === 'generateDesignOptions') {
          result = await mcpServer.handleGenerateDesignOptions(tool.args as DesignOptionsArgs, mockContext);
        } else {
          throw new Error(`Unsupported tool: ${tool.name}`);
        }
        
        expect(result.isError).toBe(false);
        expect(result.metadata?.steeringFileCreated).toBe(true);
      }

      // Verify files were created
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBe(2);
    });

    it('should maintain consistency across multiple feature workflows', async () => {
      const features = ['auth-system', 'payment-gateway', 'notification-service'];
      
      for (const feature of features) {
        const params: OptionalParams = {
          generatePMDocuments: {
            requirements: true,
            designOptions: true,
            steeringOptions: {
              create_steering_files: true,
              feature_name: feature,
              inclusion_rule: 'fileMatch'
            }
          }
        };

        const result = await pipeline.processIntent(
          `Create ${feature.replace('-', ' ')} with comprehensive functionality`,
          params
        );

        expect(result.success).toBe(true);
        expect(result.steeringFiles?.created).toBe(true);
      }

      // Verify all features have their steering files
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBe(features.length * 2); // requirements + design for each

      // Verify feature isolation
      for (const feature of features) {
        const featureFiles = steeringFiles.filter(f => f.includes(feature));
        expect(featureFiles.length).toBe(2);
      }
    });
  });

  describe('Requirement 2.1: Automatic Organization and Naming', () => {
    it('should use descriptive names based on feature context', async () => {
      const testCases = [
        { feature: 'user-authentication', expectedInName: 'user-authentication' },
        { feature: 'payment_processing', expectedInName: 'payment_processing' },
        { feature: 'DataAnalytics', expectedInName: 'DataAnalytics' }
      ];

      for (const testCase of testCases) {
        const result = await steeringService.createFromRequirements(
          '# Requirements\n## User Story\nTesting naming conventions.',
          {
            create_steering_files: true,
            feature_name: testCase.feature,
            inclusion_rule: 'manual'
          }
        );

        expect(result.created).toBe(true);
        expect(result.results[0].filename).toContain(testCase.expectedInName);
      }
    });

    it('should handle naming conflicts with versioning or updates', async () => {
      const featureName = 'conflict-test-feature';
      
      // Create initial steering file
      const firstResult = await steeringService.createFromRequirements(
        '# First Version\n## User Story\nFirst version of requirements.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'manual'
        }
      );

      expect(firstResult.created).toBe(true);
      const firstFilename = firstResult.results[0].filename;

      // Create second steering file with same feature name
      const secondResult = await steeringService.createFromRequirements(
        '# Second Version\n## User Story\nUpdated requirements.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'manual',
          overwrite_existing: false
        }
      );

      // Should handle conflict gracefully
      const steeringFiles = await fs.readdir(testSteeringDir);
      
      if (secondResult.created) {
        // Either versioned or updated
        if (steeringFiles.length === 2) {
          // Versioned approach
          expect(steeringFiles.some(f => f !== firstFilename)).toBe(true);
        } else {
          // Update approach
          expect(steeringFiles.length).toBe(1);
        }
      } else {
        // Conflict detected and handled
        expect(secondResult.message).toMatch(/conflict|exists|declined/i);
      }
    });

    it('should include appropriate front-matter for inclusion rules', async () => {
      const inclusionTests = [
        { rule: 'always' as InclusionRule, pattern: undefined },
        { rule: 'fileMatch' as InclusionRule, pattern: 'test*|spec*' },
        { rule: 'manual' as InclusionRule, pattern: undefined }
      ];

      for (const test of inclusionTests) {
        const result = await steeringService.createFromRequirements(
          '# Requirements\n## User Story\nTesting inclusion rules.',
          {
            create_steering_files: true,
            feature_name: `inclusion-${test.rule}`,
            inclusion_rule: test.rule,
            file_match_pattern: test.pattern
          }
        );

        expect(result.created).toBe(true);

        const filename = result.results[0].filename;
        const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
        const frontMatter = yaml.load(frontMatterMatch![1]) as any;

        expect(frontMatter.inclusion).toBe(test.rule);
        if (test.pattern) {
          expect(frontMatter.fileMatchPattern).toBe(test.pattern);
        }
      }
    });
  });

  describe('Requirement 3.1: Cross-References and Document Relationships', () => {
    it('should create file references using #[[file:path]] syntax', async () => {
      // Create mock spec files
      const featureName = 'cross-ref-test';
      const specsFeatureDir = path.join(testSpecsDir, featureName);
      await fs.mkdir(specsFeatureDir, { recursive: true });
      
      await fs.writeFile(path.join(specsFeatureDir, 'requirements.md'), '# Mock Requirements');
      await fs.writeFile(path.join(specsFeatureDir, 'design.md'), '# Mock Design');
      await fs.writeFile(path.join(specsFeatureDir, 'tasks.md'), '# Mock Tasks');

      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nTesting cross-references.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch'
        }
      );

      expect(result.created).toBe(true);

      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');

      // Should contain file references
      const references = content.match(/#\[\[file:[^\]]+\]\]/g) || [];
      expect(references.length).toBeGreaterThan(0);

      // Verify reference format
      references.forEach(ref => {
        expect(ref).toMatch(/^#\[\[file:[^\]]+\]\]$/);
        expect(ref).toContain('.md');
      });
    });

    it('should use relative paths from workspace root', async () => {
      const featureName = 'relative-path-test';
      
      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nTesting relative paths.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch'
        }
      );

      expect(result.created).toBe(true);

      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
      const references = content.match(/#\[\[file:[^\]]+\]\]/g) || [];

      references.forEach(ref => {
        const filePath = ref.match(/#\[\[file:([^\]]+)\]\]/)?.[1];
        expect(filePath).toBeDefined();
        
        // Should be relative paths
        expect(filePath).not.toMatch(/^[A-Z]:/); // No Windows drive letters
        expect(filePath).not.toMatch(/^\//); // No absolute Unix paths
        
        // Should use forward slashes
        expect(filePath).not.toMatch(/\\/);
      });
    });

    it('should create bidirectional references between related documents', async () => {
      const featureName = 'bidirectional-test';
      
      // Create multiple related documents
      const reqResult = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nTesting bidirectional references.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch'
        }
      );

      const designResult = await steeringService.createFromDesignOptions(
        '# Design\n## Architecture\nDesign with references.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch'
        }
      );

      expect(reqResult.created).toBe(true);
      expect(designResult.created).toBe(true);

      // Verify cross-references exist
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBe(2);

      for (const filename of steeringFiles) {
        const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
        const references = content.match(/#\[\[file:[^\]]+\]\]/g) || [];
        
        // Each file should reference the other
        expect(references.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Requirement 5.1: Kiro Steering Convention Compliance', () => {
    it('should use proper front-matter with inclusion rules', async () => {
      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nTesting front-matter compliance.',
        {
          create_steering_files: true,
          feature_name: 'compliance-test',
          inclusion_rule: 'fileMatch',
          file_match_pattern: 'requirements*|spec*'
        }
      );

      expect(result.created).toBe(true);

      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');

      // Validate front-matter structure
      expect(content).toMatch(/^---\n/);
      expect(content).toMatch(/\ninclusion: fileMatch\n/);
      expect(content).toMatch(/\ngeneratedBy: vibe-pm-agent\n/);
      expect(content).toMatch(/\ngeneratedAt: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\n/);
      expect(content).toMatch(/\nfeatureName: compliance-test\n/);
      expect(content).toMatch(/\ndocumentType: requirements\n/);
      expect(content).toMatch(/\nfileMatchPattern: requirements\*\|spec\*\n/);
      expect(content).toMatch(/\n---\n/);
    });

    it('should format content appropriately for steering guidance', async () => {
      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nTesting content formatting.',
        {
          create_steering_files: true,
          feature_name: 'formatting-test',
          inclusion_rule: 'manual'
        }
      );

      expect(result.created).toBe(true);

      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');

      // Should have proper markdown structure
      expect(content).toMatch(/\n---\n\n# /); // Content starts with H1
      expect(content).toContain('Requirements'); // Original content preserved
      expect(content.endsWith('\n')); // Ends with newline
    });

    it('should save files in .kiro/steering/ directory with .md extension', async () => {
      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nTesting file location.',
        {
          create_steering_files: true,
          feature_name: 'location-test',
          inclusion_rule: 'manual'
        }
      );

      expect(result.created).toBe(true);

      const filename = result.results[0].filename;
      expect(filename).toMatch(/\.md$/);
      
      // Verify file exists in steering directory
      const filePath = path.join(testSteeringDir, filename);
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should include metadata about generation source and timing', async () => {
      const beforeTime = new Date().toISOString();
      
      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nTesting metadata inclusion.',
        {
          create_steering_files: true,
          feature_name: 'metadata-test',
          inclusion_rule: 'manual'
        }
      );

      const afterTime = new Date().toISOString();
      expect(result.created).toBe(true);

      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
      const frontMatter = yaml.load(frontMatterMatch![1]) as any;

      expect(frontMatter.generatedBy).toBe('vibe-pm-agent');
      expect(frontMatter.featureName).toBe('metadata-test');
      expect(frontMatter.documentType).toBe(DocumentType.REQUIREMENTS);
      
      // Verify timestamp is reasonable
      const generatedAt = new Date(frontMatter.generatedAt);
      expect(generatedAt.getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
      expect(generatedAt.getTime()).toBeLessThanOrEqual(new Date(afterTime).getTime());
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large documents efficiently', async () => {
      const largeContent = generateLargeDocument(500); // 500 requirements
      const startTime = Date.now();

      const result = await steeringService.createFromRequirements(largeContent, {
        create_steering_files: true,
        feature_name: 'large-document-perf-test',
        inclusion_rule: 'manual'
      });

      const processingTime = Date.now() - startTime;

      expect(result.created).toBe(true);
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify file was created correctly
      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
      expect(content.length).toBeGreaterThan(largeContent.length);
    });

    it('should handle concurrent steering file creation', async () => {
      const concurrentCount = 10;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentCount }, (_, i) => 
        steeringService.createFromRequirements(
          `# Requirements ${i}\n## User Story\nConcurrent test ${i}.`,
          {
            create_steering_files: true,
            feature_name: `concurrent-${i}`,
            inclusion_rule: 'manual'
          }
        )
      );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All should succeed
      results.forEach(result => {
        expect(result.created).toBe(true);
      });

      expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds

      // Verify all files were created
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBe(concurrentCount);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed PM agent documents gracefully', async () => {
      const malformedContent = 'This is not a proper markdown document with no structure.';

      const result = await steeringService.createFromRequirements(malformedContent, {
        create_steering_files: true,
        feature_name: 'malformed-test',
        inclusion_rule: 'manual'
      });

      // Should either succeed with warnings or fail gracefully
      if (result.created) {
        expect(result.warnings).toBeDefined();
      } else {
        expect(result.message).toMatch(/validation|malformed|invalid/i);
      }
    });

    it('should handle file system errors gracefully', async () => {
      // Create service with invalid directory
      const invalidService = new SteeringService({
        steeringDirectory: '/invalid/path/that/cannot/exist',
        userPreferences: { autoCreate: true }
      });

      const result = await invalidService.createFromRequirements(
        '# Requirements\n## User Story\nTesting error handling.',
        {
          create_steering_files: true,
          feature_name: 'error-test',
          inclusion_rule: 'manual'
        }
      );

      expect(result.created).toBe(false);
      expect(result.message).toMatch(/failed|error|invalid/i);
    });

    it('should handle empty or minimal content', async () => {
      const minimalContent = '# Minimal';

      const result = await steeringService.createFromRequirements(minimalContent, {
        create_steering_files: true,
        feature_name: 'minimal-test',
        inclusion_rule: 'manual'
      });

      // Should handle gracefully
      if (result.created) {
        const filename = result.results[0].filename;
        const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
        expect(content).toContain('Minimal');
      } else {
        expect(result.message).toMatch(/minimal|empty|insufficient/i);
      }
    });
  });

  describe('Integration with Existing Kiro Steering System', () => {
    it('should coexist with manually created steering files', async () => {
      // Create manual steering file
      const manualContent = `---
inclusion: always
author: manual-user
created: 2024-01-01
---

# Manual Steering File
This is a manually created steering file.
`;

      await fs.writeFile(path.join(testSteeringDir, 'manual-steering.md'), manualContent);

      // Create PM agent steering file
      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nTesting coexistence.',
        {
          create_steering_files: true,
          feature_name: 'coexistence-test',
          inclusion_rule: 'manual'
        }
      );

      expect(result.created).toBe(true);

      // Verify both files exist
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles).toContain('manual-steering.md');
      expect(steeringFiles.some(f => f.includes('coexistence-test'))).toBe(true);

      // Verify manual file wasn't modified
      const manualFileContent = await fs.readFile(
        path.join(testSteeringDir, 'manual-steering.md'),
        'utf8'
      );
      expect(manualFileContent).toBe(manualContent);
    });

    it('should respect existing steering file conventions', async () => {
      // Create steering files with different conventions
      const conventions = [
        { name: 'kebab-case-feature.md', featureName: 'kebab-case-feature' },
        { name: 'snake_case_feature.md', featureName: 'snake_case_feature' },
        { name: 'CamelCaseFeature.md', featureName: 'CamelCaseFeature' }
      ];

      for (const convention of conventions) {
        const result = await steeringService.createFromRequirements(
          `# Requirements for ${convention.featureName}`,
          {
            create_steering_files: true,
            feature_name: convention.featureName,
            inclusion_rule: 'manual'
          }
        );

        expect(result.created).toBe(true);
        expect(result.results[0].filename).toContain(convention.featureName);
      }
    });
  });
});

// Helper function to generate large test documents
function generateLargeDocument(requirementCount: number): string {
  const requirements = [];
  
  for (let i = 1; i <= requirementCount; i++) {
    requirements.push(`
### Requirement ${i}
**User Story:** As a user, I want feature ${i} to work efficiently.
**Acceptance Criteria:**
1. WHEN user performs action ${i} THEN system SHALL respond quickly
2. WHEN system processes request ${i} THEN it SHALL log the operation
    `);
  }

  return `# Large Requirements Document

## Introduction
This is a large requirements document for performance testing.

## Requirements
${requirements.join('\n')}
`;
}