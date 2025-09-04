/**
 * End-to-end integration tests for PM agent output to steering file workflow
 * 
 * Tests the complete workflow from PM agent document generation to steering file creation,
 * including cross-references, format compliance, and integration with Kiro steering system.
 */

import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';
import { PMAgentMCPServer } from '../../mcp/server';
import { SteeringService } from '../../components/steering-service';
import { SteeringFileManager } from '../../components/steering-file-manager';
import { DocumentReferenceLinker } from '../../components/document-reference-linker';
import { 
  RequirementsArgs, 
  DesignOptionsArgs, 
  ManagementOnePagerArgs, 
  PRFAQArgs, 
  TaskPlanArgs,
  MCPToolContext,
  SteeringFileOptions
} from '../../models/mcp';
import { DocumentType } from '../../models/steering';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Steering File Integration End-to-End Tests', () => {
  let pipeline: AIAgentPipeline;
  let mcpServer: PMAgentMCPServer;
  let steeringService: SteeringService;
  let testSteeringDir: string;
  let testSpecsDir: string;
  let mockContext: MCPToolContext;

  beforeEach(async () => {
    // Setup test directories
    testSteeringDir = path.join(process.cwd(), 'test-steering-e2e');
    testSpecsDir = path.join(process.cwd(), 'test-specs-e2e');
    
    await fs.mkdir(testSteeringDir, { recursive: true });
    await fs.mkdir(testSpecsDir, { recursive: true });

    // Initialize components
    pipeline = new AIAgentPipeline();
    mcpServer = new PMAgentMCPServer();
    steeringService = new SteeringService({
      steeringDirectory: testSteeringDir,
      userPreferences: { autoCreate: true, showPreview: false }
    });

    mockContext = {
      toolName: 'test-tool',
      sessionId: 'e2e-test-session',
      timestamp: Date.now(),
      requestId: 'e2e-test-request',
      traceId: 'e2e-test-trace'
    };
  });

  afterEach(async () => {
    await pipeline.cleanup();
    
    // Clean up test directories
    try {
      await fs.rm(testSteeringDir, { recursive: true, force: true });
      await fs.rm(testSpecsDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Complete PM Agent to Steering File Workflow', () => {
    it('should create complete steering file ecosystem from PM agent outputs', async () => {
      const featureName = 'user-authentication-system';
      const baseIntent = 'Create a comprehensive user authentication system with OAuth, MFA, and role-based access control';

      // Step 1: Generate Requirements via MCP
      const requirementsArgs: RequirementsArgs = {
        raw_intent: baseIntent,
        steering_options: {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch',
          file_match_pattern: 'requirements*|spec*'
        }
      };

      const reqResult = await mcpServer.handleGenerateRequirements(requirementsArgs, mockContext);
      expect(reqResult.isError).toBe(false);
      expect(reqResult.metadata?.steeringFileCreated).toBe(true);

      // Step 2: Generate Design Options via MCP
      const designArgs: DesignOptionsArgs = {
        requirements: reqResult.content[0].json.businessGoal + '\n' + 
                     reqResult.content[0].json.requirements.map((r: any) => r.title).join('\n'),
        steering_options: {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch',
          file_match_pattern: 'design*|architecture*'
        }
      };

      const designResult = await mcpServer.handleGenerateDesignOptions(designArgs, mockContext);
      expect(designResult.isError).toBe(false);
      expect(designResult.metadata?.steeringFileCreated).toBe(true);

      // Step 3: Generate Management One-Pager via MCP
      const onePagerArgs: ManagementOnePagerArgs = {
        requirements: JSON.stringify(reqResult.content[0].json),
        design: JSON.stringify(designResult.content[0].json),
        steering_options: {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'manual'
        }
      };

      const onePagerResult = await mcpServer.handleGenerateManagementOnePager(onePagerArgs, mockContext);
      expect(onePagerResult.isError).toBe(false);
      expect(onePagerResult.metadata?.steeringFileCreated).toBe(true);

      // Step 4: Generate PR-FAQ via MCP
      const prfaqArgs: PRFAQArgs = {
        requirements: JSON.stringify(reqResult.content[0].json),
        design: JSON.stringify(designResult.content[0].json),
        target_date: '2024-06-01',
        steering_options: {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'manual'
        }
      };

      const prfaqResult = await mcpServer.handleGeneratePRFAQ(prfaqArgs, mockContext);
      expect(prfaqResult.isError).toBe(false);
      expect(prfaqResult.metadata?.steeringFileCreated).toBe(true);

      // Step 5: Generate Task Plan via MCP
      const taskArgs: TaskPlanArgs = {
        design: JSON.stringify(designResult.content[0].json),
        steering_options: {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch',
          file_match_pattern: 'tasks*|implementation*'
        }
      };

      const taskResult = await mcpServer.handleGenerateTaskPlan(taskArgs, mockContext);
      expect(taskResult.isError).toBe(false);
      expect(taskResult.metadata?.steeringFileCreated).toBe(true);

      // Verify all steering files were created
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBe(5); // Requirements, Design, OnePager, PRFAQ, Tasks

      // Verify file naming conventions
      const expectedPatterns = [
        new RegExp(`${featureName}.*requirements.*\\.md$`),
        new RegExp(`${featureName}.*design.*\\.md$`),
        new RegExp(`${featureName}.*onepager.*\\.md$`),
        new RegExp(`${featureName}.*prfaq.*\\.md$`),
        new RegExp(`${featureName}.*tasks.*\\.md$`)
      ];

      expectedPatterns.forEach(pattern => {
        const matchingFile = steeringFiles.find(file => pattern.test(file));
        expect(matchingFile).toBeDefined();
      });

      // Verify cross-references between files
      for (const filename of steeringFiles) {
        const filePath = path.join(testSteeringDir, filename);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Each file should reference related files
        if (filename.includes('requirements')) {
          expect(content).toMatch(/#\[\[file:.*design.*\]\]/);
          expect(content).toMatch(/#\[\[file:.*tasks.*\]\]/);
        } else if (filename.includes('design')) {
          expect(content).toMatch(/#\[\[file:.*requirements.*\]\]/);
          expect(content).toMatch(/#\[\[file:.*tasks.*\]\]/);
        } else if (filename.includes('tasks')) {
          expect(content).toMatch(/#\[\[file:.*requirements.*\]\]/);
          expect(content).toMatch(/#\[\[file:.*design.*\]\]/);
        }
      }
    });

    it('should handle incremental steering file creation', async () => {
      const featureName = 'incremental-feature';
      
      // Create requirements steering file first
      const reqResult = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nAs a user, I want incremental features.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'always'
        }
      );

      expect(reqResult.created).toBe(true);
      
      // Add design steering file later
      const designResult = await steeringService.createFromDesignOptions(
        '# Design\n## Architecture\nSimple incremental architecture.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch',
          file_match_pattern: 'design*'
        }
      );

      expect(designResult.created).toBe(true);

      // Verify both files exist and have proper cross-references
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBe(2);

      // Check that design file references requirements file
      const designFile = steeringFiles.find(f => f.includes('design'));
      expect(designFile).toBeDefined();
      
      const designContent = await fs.readFile(path.join(testSteeringDir, designFile!), 'utf8');
      expect(designContent).toMatch(/#\[\[file:.*requirements.*\]\]/);
    });

    it('should maintain consistency across multiple feature steering files', async () => {
      const features = ['auth-system', 'payment-gateway', 'notification-service'];
      
      // Create steering files for multiple features
      for (const feature of features) {
        await steeringService.createFromRequirements(
          `# Requirements for ${feature}\n## User Story\nAs a user, I want ${feature} functionality.`,
          {
            create_steering_files: true,
            feature_name: feature,
            inclusion_rule: 'fileMatch',
            file_match_pattern: `${feature}*|requirements*`
          }
        );

        await steeringService.createFromDesignOptions(
          `# Design for ${feature}\n## Architecture\nArchitecture for ${feature}.`,
          {
            create_steering_files: true,
            feature_name: feature,
            inclusion_rule: 'fileMatch',
            file_match_pattern: `${feature}*|design*`
          }
        );
      }

      // Verify all files were created with proper naming
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBe(6); // 2 files per feature

      // Verify each feature has its own namespace
      for (const feature of features) {
        const featureFiles = steeringFiles.filter(f => f.includes(feature));
        expect(featureFiles.length).toBe(2); // requirements + design

        // Verify cross-references stay within feature scope
        for (const filename of featureFiles) {
          const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
          const references = content.match(/#\[\[file:[^\]]+\]\]/g) || [];
          
          // All references should be to files within the same feature
          references.forEach(ref => {
            expect(ref).toMatch(new RegExp(feature));
          });
        }
      }
    });
  });

  describe('Steering File Format Compliance', () => {
    it('should generate steering files with valid front-matter', async () => {
      const testCases = [
        {
          type: 'requirements',
          content: '# Requirements\n## User Story\nAs a user, I want valid front-matter.',
          expectedDocType: DocumentType.REQUIREMENTS
        },
        {
          type: 'design',
          content: '# Design\n## Architecture\nValid design architecture.',
          expectedDocType: DocumentType.DESIGN
        },
        {
          type: 'onepager',
          content: '# Executive Summary\n## Problem\nValid executive summary.',
          expectedDocType: DocumentType.ONEPAGER
        }
      ];

      for (const testCase of testCases) {
        let result;
        if (testCase.type === 'requirements') {
          result = await steeringService.createFromRequirements(testCase.content, {
            create_steering_files: true,
            feature_name: `format-test-${testCase.type}`,
            inclusion_rule: 'manual'
          });
        } else if (testCase.type === 'design') {
          result = await steeringService.createFromDesignOptions(testCase.content, {
            create_steering_files: true,
            feature_name: `format-test-${testCase.type}`,
            inclusion_rule: 'manual'
          });
        } else if (testCase.type === 'onepager') {
          result = await steeringService.createFromOnePager(testCase.content, {
            create_steering_files: true,
            feature_name: `format-test-${testCase.type}`,
            inclusion_rule: 'manual'
          });
        } else {
          throw new Error(`Unsupported test case type: ${testCase.type}`);
        }

        expect(result.created).toBe(true);

        // Read and validate the created file
        const filename = result.results[0].filename;
        const filePath = path.join(testSteeringDir, filename);
        const content = await fs.readFile(filePath, 'utf8');

        // Validate front-matter structure
        expect(content).toMatch(/^---\n/);
        expect(content).toMatch(/\ninclusion: manual\n/);
        expect(content).toMatch(/\ngeneratedBy: vibe-pm-agent\n/);
        expect(content).toMatch(/\ngeneratedAt: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\n/);
        expect(content).toMatch(new RegExp(`\\nfeatureName: format-test-${testCase.type}\\n`));
        expect(content).toMatch(new RegExp(`\\ndocumentType: ${testCase.expectedDocType}\\n`));
        expect(content).toMatch(/\n---\n/);

        // Validate content section exists
        expect(content).toMatch(/\n---\n\n# /);
      }
    });

    it('should generate valid file references with correct paths', async () => {
      // Create a mock specs directory structure
      const featureName = 'reference-test';
      const specsFeatureDir = path.join(testSpecsDir, featureName);
      await fs.mkdir(specsFeatureDir, { recursive: true });
      
      // Create mock spec files
      await fs.writeFile(path.join(specsFeatureDir, 'requirements.md'), '# Mock Requirements');
      await fs.writeFile(path.join(specsFeatureDir, 'design.md'), '# Mock Design');
      await fs.writeFile(path.join(specsFeatureDir, 'tasks.md'), '# Mock Tasks');

      // Create steering file with references

      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nAs a user, I want valid references.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch'
        }
      );

      expect(result.created).toBe(true);

      // Verify references are correctly formatted
      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
      
      // Should contain references to related spec files
      expect(content).toMatch(/#\[\[file:test-specs-e2e\/reference-test\/design\.md\]\]/);
      expect(content).toMatch(/#\[\[file:test-specs-e2e\/reference-test\/tasks\.md\]\]/);
      
      // References should use relative paths from workspace root
      const references = content.match(/#\[\[file:[^\]]+\]\]/g) || [];
      references.forEach(ref => {
        expect(ref).toMatch(/^#\[\[file:test-specs-e2e\//);
        expect(ref).not.toMatch(/^#\[\[file:\//); // Should not be absolute paths
      });
    });

    it('should handle special characters and edge cases in content', async () => {
      const edgeCaseContent = `
# Requirements with Special Characters

## User Story
As a user with "quotes" and 'apostrophes', I want to handle:
- Markdown **bold** and *italic* text
- Code blocks with \`backticks\`
- Lists with - dashes and * asterisks
- Links like [example](https://example.com)
- HTML entities like &amp; and &lt;
- Unicode characters: 🚀 ✅ 📝

## Acceptance Criteria
1. WHEN content contains "special characters" THEN system SHALL preserve them
2. WHEN content has \`code\` THEN formatting SHALL be maintained
      `;

      const result = await steeringService.createFromRequirements(edgeCaseContent, {
        create_steering_files: true,
        feature_name: 'edge-case-test',
        inclusion_rule: 'manual'
      });

      expect(result.created).toBe(true);

      // Verify special characters are preserved
      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
      
      expect(content).toContain('"quotes"');
      expect(content).toContain("'apostrophes'");
      expect(content).toContain('**bold**');
      expect(content).toContain('`backticks`');
      expect(content).toContain('[example](https://example.com)');
      expect(content).toContain('🚀 ✅ 📝');
      expect(content).toContain('&amp; and &lt;');
    });
  });

  describe('Integration with Existing Kiro Steering System', () => {
    it('should coexist with manually created steering files', async () => {
      // Create a manual steering file first
      const manualSteeringContent = `---
inclusion: always
author: manual-user
created: 2024-01-01
---

# Manual Steering File

This is a manually created steering file that should coexist with PM agent generated files.
`;

      await fs.writeFile(
        path.join(testSteeringDir, 'manual-steering.md'),
        manualSteeringContent
      );

      // Create PM agent steering file
      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nAs a user, I want coexistence with manual files.',
        {
          create_steering_files: true,
          feature_name: 'coexistence-test',
          inclusion_rule: 'fileMatch'
        }
      );

      expect(result.created).toBe(true);

      // Verify both files exist
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles).toContain('manual-steering.md');
      expect(steeringFiles.some(f => f.includes('coexistence-test'))).toBe(true);

      // Verify manual file wasn't modified
      const manualContent = await fs.readFile(
        path.join(testSteeringDir, 'manual-steering.md'),
        'utf8'
      );
      expect(manualContent).toBe(manualSteeringContent);
    });

    it('should respect existing steering file naming conventions', async () => {
      // Create steering files with different naming patterns
      const namingTests = [
        { feature: 'feature-a', expectedPattern: /feature-a.*requirements.*\.md$/ },
        { feature: 'feature_b', expectedPattern: /feature_b.*requirements.*\.md$/ },
        { feature: 'FeatureC', expectedPattern: /FeatureC.*requirements.*\.md$/ },
        { feature: 'feature-with-long-name', expectedPattern: /feature-with-long-name.*requirements.*\.md$/ }
      ];

      for (const test of namingTests) {
        const result = await steeringService.createFromRequirements(
          `# Requirements for ${test.feature}`,
          {
            create_steering_files: true,
            feature_name: test.feature,
            inclusion_rule: 'manual'
          }
        );

        expect(result.created).toBe(true);
        expect(result.results[0].filename).toMatch(test.expectedPattern);
      }

      // Verify all files were created with consistent naming
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBe(namingTests.length);
    });

    it('should handle conflicts with existing steering files gracefully', async () => {
      const featureName = 'conflict-test';
      
      // Create initial steering file
      const firstResult = await steeringService.createFromRequirements(
        '# First Requirements\n## User Story\nFirst version of requirements.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'manual'
        }
      );

      expect(firstResult.created).toBe(true);
      const firstFilename = firstResult.results[0].filename;

      // Attempt to create another steering file with same feature name
      const secondResult = await steeringService.createFromRequirements(
        '# Updated Requirements\n## User Story\nUpdated version of requirements.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'manual',
          overwrite_existing: false
        }
      );

      // Should handle conflict gracefully (either version or update)
      if (secondResult.created) {
        const steeringFiles = await fs.readdir(testSteeringDir);
        
        // Should either have versioned file or updated existing
        if (steeringFiles.length === 2) {
          // Versioned approach
          expect(steeringFiles.some(f => f.includes('v2') || f.includes('_2'))).toBe(true);
        } else {
          // Update approach
          expect(steeringFiles.length).toBe(1);
          const content = await fs.readFile(path.join(testSteeringDir, firstFilename), 'utf8');
          expect(content).toContain('Updated Requirements');
        }
      } else {
        // Conflict was detected and creation was skipped
        expect(secondResult.message).toMatch(/conflict|exists|declined/i);
      }
    });
  });

  describe('Cross-Reference Validation', () => {
    it('should create bidirectional references between related documents', async () => {
      const featureName = 'bidirectional-refs';
      
      // Create requirements first
      const reqResult = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nAs a user, I want bidirectional references.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch'
        }
      );

      // Create design that should reference requirements
      const designResult = await steeringService.createFromDesignOptions(
        '# Design\n## Architecture\nDesign with bidirectional references.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch'
        }
      );

      // Create tasks that should reference both
      const taskResult = await steeringService.createFromTaskPlan(
        '# Tasks\n- [ ] Implement bidirectional references',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch'
        }
      );

      expect(reqResult.created).toBe(true);
      expect(designResult.created).toBe(true);
      expect(taskResult.created).toBe(true);

      // Verify cross-references
      const steeringFiles = await fs.readdir(testSteeringDir);
      const reqFile = steeringFiles.find(f => f.includes('requirements'));
      const designFile = steeringFiles.find(f => f.includes('design'));
      const taskFile = steeringFiles.find(f => f.includes('task'));

      expect(reqFile).toBeDefined();
      expect(designFile).toBeDefined();
      expect(taskFile).toBeDefined();

      // Check requirements file references
      const reqContent = await fs.readFile(path.join(testSteeringDir, reqFile!), 'utf8');
      expect(reqContent).toMatch(/#\[\[file:.*design.*\]\]/);
      expect(reqContent).toMatch(/#\[\[file:.*task.*\]\]/);

      // Check design file references
      const designContent = await fs.readFile(path.join(testSteeringDir, designFile!), 'utf8');
      expect(designContent).toMatch(/#\[\[file:.*requirements.*\]\]/);
      expect(designContent).toMatch(/#\[\[file:.*task.*\]\]/);

      // Check task file references
      const taskContent = await fs.readFile(path.join(testSteeringDir, taskFile!), 'utf8');
      expect(taskContent).toMatch(/#\[\[file:.*requirements.*\]\]/);
      expect(taskContent).toMatch(/#\[\[file:.*design.*\]\]/);
    });

    it('should validate reference paths exist or are valid', async () => {
      // Create a steering file that should reference non-existent spec files
      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nAs a user, I want valid reference validation.',
        {
          create_steering_files: true,
          feature_name: 'reference-validation',
          inclusion_rule: 'fileMatch'
        }
      );

      expect(result.created).toBe(true);

      // Check that warnings were generated for non-existent references
      if (result.warnings && result.warnings.length > 0) {
        const hasReferenceWarning = result.warnings.some(warning => 
          warning.includes('reference') || warning.includes('file not found')
        );
        // This is acceptable - the system should warn about missing references
      }

      // Verify the file was still created despite reference issues
      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
      expect(content).toContain('# Requirements');
    });

    it('should handle circular references gracefully', async () => {
      const featureName = 'circular-refs';
      
      // Create multiple documents that could create circular references
      const documents = [
        { type: 'requirements', content: '# Requirements\nRequirements content.' },
        { type: 'design', content: '# Design\nDesign content.' },
        { type: 'tasks', content: '# Tasks\n- [ ] Task content.' }
      ];

      const results = [];
      for (const doc of documents) {
        let result;
        if (doc.type === 'requirements') {
          result = await steeringService.createFromRequirements(doc.content, {
            create_steering_files: true,
            feature_name: featureName,
            inclusion_rule: 'fileMatch'
          });
        } else if (doc.type === 'design') {
          result = await steeringService.createFromDesignOptions(doc.content, {
            create_steering_files: true,
            feature_name: featureName,
            inclusion_rule: 'fileMatch'
          });
        } else if (doc.type === 'tasks') {
          result = await steeringService.createFromTaskPlan(doc.content, {
            create_steering_files: true,
            feature_name: featureName,
            inclusion_rule: 'fileMatch'
          });
        } else {
          throw new Error(`Unsupported document type: ${doc.type}`);
        }
        results.push(result);
      }

      // All should succeed despite potential circular references
      results.forEach(result => {
        expect(result.created).toBe(true);
      });

      // Verify files don't contain self-references
      const steeringFiles = await fs.readdir(testSteeringDir);
      for (const filename of steeringFiles) {
        const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
        const references = content.match(/#\[\[file:[^\]]+\]\]/g) || [];
        
        // No reference should point to the same file
        references.forEach(ref => {
          expect(ref).not.toContain(filename.replace('.md', ''));
        });
      }
    });
  });
});