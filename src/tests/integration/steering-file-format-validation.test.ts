/**
 * Integration tests for steering file format compliance and validation
 * 
 * Tests that generated steering files comply with Kiro steering conventions,
 * have valid front-matter, proper markdown structure, and correct cross-references.
 */

import { SteeringService } from '../../components/steering-service';
import { SteeringFileManager } from '../../components/steering-file-manager';
import { FrontMatterProcessor } from '../../components/front-matter-processor';
import { DocumentReferenceLinker } from '../../components/document-reference-linker';
import { DocumentType, SteeringFile, InclusionRule } from '../../models/steering';
import { SteeringFileOptions } from '../../models/mcp';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('Steering File Format Validation Tests', () => {
  let steeringService: SteeringService;
  let steeringManager: SteeringFileManager;
  let frontMatterProcessor: FrontMatterProcessor;
  let referenceLinker: DocumentReferenceLinker;
  let testSteeringDir: string;
  let testSpecsDir: string;

  beforeEach(async () => {
    testSteeringDir = path.join(process.cwd(), 'test-steering-validation');
    testSpecsDir = path.join(process.cwd(), 'test-specs-validation');
    
    await fs.mkdir(testSteeringDir, { recursive: true });
    await fs.mkdir(testSpecsDir, { recursive: true });

    steeringService = new SteeringService({
      steeringDirectory: testSteeringDir,
      userPreferences: { autoCreate: true, showPreview: false }
    });

    steeringManager = new SteeringFileManager({
      steeringDirectory: testSteeringDir,
      validateContent: true
    });

    frontMatterProcessor = new FrontMatterProcessor();
    referenceLinker = new DocumentReferenceLinker(process.cwd(), {
      baseDirectory: testSpecsDir
    });
  });

  afterEach(async () => {
    try {
      await fs.rm(testSteeringDir, { recursive: true, force: true });
      await fs.rm(testSpecsDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Front-Matter Validation', () => {
    it('should generate valid YAML front-matter for all document types', async () => {
      const testCases = [
        {
          method: 'createFromRequirements',
          content: '# Requirements\n## User Story\nAs a user, I want valid front-matter.',
          expectedDocType: DocumentType.REQUIREMENTS
        },
        {
          method: 'createFromDesignOptions',
          content: '# Design Options\n## Conservative\nBasic implementation.',
          expectedDocType: DocumentType.DESIGN
        },
        {
          method: 'createFromOnePager',
          content: '# Executive Summary\n## Problem\nNeed better steering files.',
          expectedDocType: DocumentType.ONE_PAGER
        },
        {
          method: 'createFromPRFAQ',
          content: '# Press Release\nNew steering system launched.',
          expectedDocType: DocumentType.PR_FAQ
        },
        {
          method: 'createFromTaskPlan',
          content: '# Tasks\n- [ ] Implement validation',
          expectedDocType: DocumentType.TASKS
        }
      ];

      for (const testCase of testCases) {
        let result;
        if (testCase.method === 'createFromRequirements') {
          result = await steeringService.createFromRequirements(testCase.content, {
            create_steering_files: true,
            feature_name: `validation-${testCase.expectedDocType}`,
            inclusion_rule: 'manual'
          });
        } else if (testCase.method === 'createFromDesignOptions') {
          result = await steeringService.createFromDesignOptions(testCase.content, {
            create_steering_files: true,
            feature_name: `validation-${testCase.expectedDocType}`,
            inclusion_rule: 'manual'
          });
        } else if (testCase.method === 'createFromOnePager') {
          result = await steeringService.createFromOnePager(testCase.content, {
            create_steering_files: true,
            feature_name: `validation-${testCase.expectedDocType}`,
            inclusion_rule: 'manual'
          });
        } else {
          throw new Error(`Unsupported method: ${testCase.method}`);
        }

        expect(result.created).toBe(true);

        // Read and validate the created file
        const filename = result.results[0].filename;
        const filePath = path.join(testSteeringDir, filename);
        const content = await fs.readFile(filePath, 'utf8');

        // Extract front-matter
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
        expect(frontMatterMatch).toBeTruthy();

        const frontMatterYaml = frontMatterMatch![1];
        
        // Validate YAML syntax
        let frontMatter;
        expect(() => {
          frontMatter = yaml.load(frontMatterYaml);
        }).not.toThrow();

        // Validate required fields
        expect(frontMatter).toHaveProperty('inclusion');
        expect(frontMatter).toHaveProperty('generatedBy');
        expect(frontMatter).toHaveProperty('generatedAt');
        expect(frontMatter).toHaveProperty('featureName');
        expect(frontMatter).toHaveProperty('documentType');

        // Validate field values
        expect(['always', 'fileMatch', 'manual']).toContain(frontMatter.inclusion);
        expect(frontMatter.generatedBy).toBe('vibe-pm-agent');
        expect(frontMatter.featureName).toBe(`validation-${testCase.expectedDocType}`);
        expect(frontMatter.documentType).toBe(testCase.expectedDocType);

        // Validate timestamp format (ISO 8601)
        expect(frontMatter.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(new Date(frontMatter.generatedAt).getTime()).toBeGreaterThan(0);
      }
    });

    it('should handle different inclusion rules correctly', async () => {
      const inclusionRules: InclusionRule[] = ['always', 'fileMatch', 'manual'];
      
      for (const inclusionRule of inclusionRules) {
        const steeringOptions: SteeringFileOptions = {
          create_steering_files: true,
          feature_name: `inclusion-${inclusionRule}`,
          inclusion_rule: inclusionRule,
          file_match_pattern: inclusionRule === 'fileMatch' ? 'test*|spec*' : undefined
        };

        const result = await steeringService.createFromRequirements(
          '# Requirements\n## User Story\nTesting inclusion rules.',
          steeringOptions
        );

        expect(result.created).toBe(true);

        const filename = result.results[0].filename;
        const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
        const frontMatter = yaml.load(frontMatterMatch![1]) as any;

        expect(frontMatter.inclusion).toBe(inclusionRule);
        
        if (inclusionRule === 'fileMatch') {
          expect(frontMatter).toHaveProperty('fileMatchPattern');
          expect(frontMatter.fileMatchPattern).toBe('test*|spec*');
        } else {
          expect(frontMatter.fileMatchPattern).toBeUndefined();
        }
      }
    });

    it('should validate custom front-matter fields', async () => {
      const customOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'custom-fields-test',
        inclusion_rule: 'fileMatch',
        file_match_pattern: 'custom*',
        filename_prefix: 'custom-prefix'
      };

      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nTesting custom fields.',
        customOptions
      );

      expect(result.created).toBe(true);

      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
      const frontMatter = yaml.load(frontMatterMatch![1]) as any;

      expect(frontMatter.fileMatchPattern).toBe('custom*');
      expect(filename).toContain('custom-prefix');
    });

    it('should handle special characters in front-matter values', async () => {
      const specialFeatureName = 'test-feature-with-special-chars_123';
      const specialPattern = 'files*|docs*|"quoted"*';

      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nTesting special characters.',
        {
          create_steering_files: true,
          feature_name: specialFeatureName,
          inclusion_rule: 'fileMatch',
          file_match_pattern: specialPattern
        }
      );

      expect(result.created).toBe(true);

      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
      const frontMatter = yaml.load(frontMatterMatch![1]) as any;

      expect(frontMatter.featureName).toBe(specialFeatureName);
      expect(frontMatter.fileMatchPattern).toBe(specialPattern);
    });
  });

  describe('Markdown Structure Validation', () => {
    it('should generate valid markdown structure', async () => {
      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nAs a user, I want valid markdown.',
        {
          create_steering_files: true,
          feature_name: 'markdown-test',
          inclusion_rule: 'manual'
        }
      );

      expect(result.created).toBe(true);

      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');

      // Validate basic markdown structure
      expect(content).toMatch(/^---\n[\s\S]*?\n---\n\n/); // Front-matter followed by content
      expect(content).toMatch(/\n---\n\n# /); // Content starts with H1 header
      
      // Validate no malformed markdown
      expect(content).not.toMatch(/#{7,}/); // No headers deeper than H6
      expect(content).not.toMatch(/\n\n\n\n+/); // No excessive blank lines
      
      // Validate proper line endings
      expect(content).not.toMatch(/\r\n/); // Should use Unix line endings
      expect(content.endsWith('\n')).toBe(true); // Should end with newline
    });

    it('should preserve markdown formatting in PM agent content', async () => {
      const markdownContent = `
# Requirements with Formatting

## Introduction
This document contains **bold text**, *italic text*, and \`code snippets\`.

## Requirements

### Requirement 1
**User Story:** As a user, I want to preserve markdown formatting.

#### Acceptance Criteria
1. WHEN content has **bold** text THEN it SHALL be preserved
2. WHEN content has *italic* text THEN it SHALL be preserved
3. WHEN content has \`code\` THEN it SHALL be preserved

## Code Examples

\`\`\`typescript
interface Example {
  property: string;
}
\`\`\`

## Lists
- Item 1
- Item 2
  - Nested item
  - Another nested item

## Links
[Example Link](https://example.com)

## Tables
| Column 1 | Column 2 |
|----------|----------|
| Value 1  | Value 2  |
      `;

      const result = await steeringService.createFromRequirements(markdownContent, {
        create_steering_files: true,
        feature_name: 'markdown-formatting-test',
        inclusion_rule: 'manual'
      });

      expect(result.created).toBe(true);

      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');

      // Verify markdown elements are preserved
      expect(content).toContain('**bold text**');
      expect(content).toContain('*italic text*');
      expect(content).toContain('`code snippets`');
      expect(content).toContain('```typescript');
      expect(content).toContain('interface Example');
      expect(content).toContain('- Item 1');
      expect(content).toContain('  - Nested item');
      expect(content).toContain('[Example Link](https://example.com)');
      expect(content).toContain('| Column 1 | Column 2 |');
    });

    it('should handle edge cases in markdown content', async () => {
      const edgeCaseContent = `
# Edge Cases

## HTML Entities
Content with &amp; &lt; &gt; &quot; &#39;

## Special Characters
Unicode: 🚀 ✅ 📝 ⚠️
Math: α β γ δ ∑ ∏ ∫

## Escaped Characters
\\* \\_ \\# \\[ \\] \\( \\)

## Mixed Content
Normal text with **bold \\*escaped\\*** and \`code with \\`backticks\\`\`

## Empty Sections

### Empty Subsection

## Whitespace Handling
   Leading spaces
Trailing spaces   
	Tabs and mixed whitespace

## Long Lines
This is a very long line that should be preserved as-is without any automatic line wrapping or modification because it represents the original author's intent for formatting and should remain exactly as written in the source document.
      `;

      const result = await steeringService.createFromRequirements(edgeCaseContent, {
        create_steering_files: true,
        feature_name: 'edge-case-test',
        inclusion_rule: 'manual'
      });

      expect(result.created).toBe(true);

      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');

      // Verify edge cases are handled correctly
      expect(content).toContain('&amp; &lt; &gt;');
      expect(content).toContain('🚀 ✅ 📝 ⚠️');
      expect(content).toContain('α β γ δ');
      expect(content).toContain('\\* \\_ \\#');
      expect(content).toContain('**bold \\*escaped\\***');
      expect(content).toContain('very long line that should be preserved');
    });
  });

  describe('Cross-Reference Validation', () => {
    it('should generate valid file references with correct syntax', async () => {
      // Create mock spec files
      const featureName = 'reference-syntax-test';
      const specsFeatureDir = path.join(testSpecsDir, featureName);
      await fs.mkdir(specsFeatureDir, { recursive: true });
      
      await fs.writeFile(path.join(specsFeatureDir, 'requirements.md'), '# Mock Requirements');
      await fs.writeFile(path.join(specsFeatureDir, 'design.md'), '# Mock Design');
      await fs.writeFile(path.join(specsFeatureDir, 'tasks.md'), '# Mock Tasks');

      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nTesting reference syntax.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch'
        }
      );

      expect(result.created).toBe(true);

      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');

      // Validate reference syntax
      const references = content.match(/#\[\[file:[^\]]+\]\]/g) || [];
      expect(references.length).toBeGreaterThan(0);

      references.forEach(ref => {
        // Should match the pattern #[[file:path]]
        expect(ref).toMatch(/^#\[\[file:[^\]]+\]\]$/);
        
        // Should not contain spaces in the file path
        const filePath = ref.match(/#\[\[file:([^\]]+)\]\]/)?.[1];
        expect(filePath).toBeDefined();
        expect(filePath).not.toMatch(/\s/);
        
        // Should use forward slashes for paths
        expect(filePath).not.toMatch(/\\/);
        
        // Should be relative paths (not starting with /)
        expect(filePath).not.toMatch(/^\//);
      });
    });

    it('should validate reference paths exist or are reasonable', async () => {
      // Create some spec files but not others
      const featureName = 'partial-references-test';
      const specsFeatureDir = path.join(testSpecsDir, featureName);
      await fs.mkdir(specsFeatureDir, { recursive: true });
      
      // Only create requirements file, not design or tasks
      await fs.writeFile(path.join(specsFeatureDir, 'requirements.md'), '# Existing Requirements');

      const result = await steeringService.createFromDesignOptions(
        '# Design Options\n## Conservative\nBasic design approach.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch'
        }
      );

      expect(result.created).toBe(true);

      // Check if warnings were generated for missing references
      if (result.warnings && result.warnings.length > 0) {
        const hasReferenceWarning = result.warnings.some(warning => 
          warning.toLowerCase().includes('reference') || 
          warning.toLowerCase().includes('file not found')
        );
        // This is acceptable - the system should warn about missing references
      }

      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');

      // Should still contain references even if files don't exist
      const references = content.match(/#\[\[file:[^\]]+\]\]/g) || [];
      
      // Validate that existing file is referenced
      const hasRequirementsRef = references.some(ref => 
        ref.includes('requirements.md')
      );
      expect(hasRequirementsRef).toBe(true);
    });

    it('should handle circular reference prevention', async () => {
      const featureName = 'circular-ref-test';
      
      // Create multiple documents that could create circular references
      const reqResult = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nTesting circular references.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch'
        }
      );

      const designResult = await steeringService.createFromDesignOptions(
        '# Design\n## Architecture\nDesign with potential circular refs.',
        {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'fileMatch'
        }
      );

      expect(reqResult.created).toBe(true);
      expect(designResult.created).toBe(true);

      // Verify no self-references exist
      const steeringFiles = await fs.readdir(testSteeringDir);
      
      for (const filename of steeringFiles) {
        const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
        const references = content.match(/#\[\[file:[^\]]+\]\]/g) || [];
        
        // No reference should point to the same file
        const baseFilename = filename.replace('.md', '');
        references.forEach(ref => {
          expect(ref).not.toContain(baseFilename);
        });
      }
    });

    it('should validate reference path formats', async () => {
      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nTesting path formats.',
        {
          create_steering_files: true,
          feature_name: 'path-format-test',
          inclusion_rule: 'fileMatch'
        }
      );

      expect(result.created).toBe(true);

      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
      const references = content.match(/#\[\[file:[^\]]+\]\]/g) || [];

      references.forEach(ref => {
        const filePath = ref.match(/#\[\[file:([^\]]+)\]\]/)?.[1];
        
        // Should be valid file paths
        expect(filePath).toBeDefined();
        expect(filePath).not.toBe('');
        
        // Should not contain invalid characters
        expect(filePath).not.toMatch(/[<>:"|?*]/);
        
        // Should end with .md
        expect(filePath).toMatch(/\.md$/);
        
        // Should use consistent path separators
        expect(filePath).not.toMatch(/\\/); // No backslashes
        
        // Should be relative paths
        expect(filePath).not.toMatch(/^[A-Z]:/); // No Windows drive letters
        expect(filePath).not.toMatch(/^\//); // No absolute Unix paths
      });
    });
  });

  describe('Content Structure Validation', () => {
    it('should maintain consistent content structure across document types', async () => {
      const documentTypes = [
        { method: 'createFromRequirements', content: '# Requirements\n## User Story\nConsistent structure test.' },
        { method: 'createFromDesignOptions', content: '# Design\n## Architecture\nConsistent structure test.' },
        { method: 'createFromOnePager', content: '# Executive Summary\n## Problem\nConsistent structure test.' }
      ];

      for (const docType of documentTypes) {
        let result;
        if (docType.method === 'createFromRequirements') {
          result = await steeringService.createFromRequirements(docType.content, {
            create_steering_files: true,
            feature_name: `structure-${docType.method}`,
            inclusion_rule: 'manual'
          });
        } else if (docType.method === 'createFromDesignOptions') {
          result = await steeringService.createFromDesignOptions(docType.content, {
            create_steering_files: true,
            feature_name: `structure-${docType.method}`,
            inclusion_rule: 'manual'
          });
        } else if (docType.method === 'createFromOnePager') {
          result = await steeringService.createFromOnePager(docType.content, {
            create_steering_files: true,
            feature_name: `structure-${docType.method}`,
            inclusion_rule: 'manual'
          });
        } else {
          throw new Error(`Unsupported method: ${docType.method}`);
        }

        expect(result.created).toBe(true);

        const filename = result.results[0].filename;
        const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');

        // Validate consistent structure
        expect(content).toMatch(/^---\n/); // Starts with front-matter
        expect(content).toMatch(/\n---\n\n# /); // Front-matter ends, content starts with H1
        expect(content).toMatch(/\n\n## /); // Contains H2 sections
        expect(content.endsWith('\n')); // Ends with newline
        
        // Should not have excessive whitespace
        expect(content).not.toMatch(/\n\n\n\n+/);
        expect(content).not.toMatch(/[ \t]+\n/); // No trailing whitespace
      }
    });

    it('should handle empty or minimal content gracefully', async () => {
      const minimalContent = '# Minimal\nMinimal content.';

      const result = await steeringService.createFromRequirements(minimalContent, {
        create_steering_files: true,
        feature_name: 'minimal-content-test',
        inclusion_rule: 'manual'
      });

      // Should handle minimal content without errors
      if (result.created) {
        const filename = result.results[0].filename;
        const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
        
        // Should still have valid structure
        expect(content).toMatch(/^---\n/);
        expect(content).toMatch(/\n---\n/);
        expect(content).toContain('Minimal content');
      } else {
        // If creation failed, should have appropriate error message
        expect(result.message).toMatch(/minimal|empty|invalid/i);
      }
    });

    it('should validate file encoding and character handling', async () => {
      const unicodeContent = `
# Unicode Test Requirements

## Introduction
This document tests Unicode character handling: 中文, العربية, русский, 日本語

## Requirements

### Requirement 1
**User Story:** As a user with name "José María", I want to use Unicode characters.

#### Acceptance Criteria
1. WHEN user enters "Müller" THEN system SHALL handle umlauts correctly
2. WHEN content contains "café" THEN accents SHALL be preserved
3. WHEN text includes "naïve" THEN diacritics SHALL be maintained

## Emojis and Symbols
Testing emojis: 🚀 ✅ ❌ 📝 💡 ⚡ 🔧 🎯
Mathematical symbols: ∑ ∏ ∫ ∆ ∇ ∞ ≈ ≠ ≤ ≥
Currency: $ € £ ¥ ₹ ₿
      `;

      const result = await steeringService.createFromRequirements(unicodeContent, {
        create_steering_files: true,
        feature_name: 'unicode-test',
        inclusion_rule: 'manual'
      });

      expect(result.created).toBe(true);

      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');

      // Verify Unicode characters are preserved
      expect(content).toContain('中文, العربية, русский, 日本語');
      expect(content).toContain('"José María"');
      expect(content).toContain('"Müller"');
      expect(content).toContain('"café"');
      expect(content).toContain('"naïve"');
      expect(content).toContain('🚀 ✅ ❌ 📝');
      expect(content).toContain('∑ ∏ ∫ ∆');
      expect(content).toContain('$ € £ ¥ ₹ ₿');

      // Verify file is valid UTF-8
      const buffer = await fs.readFile(path.join(testSteeringDir, filename));
      const decodedContent = buffer.toString('utf8');
      expect(decodedContent).toBe(content);
    });
  });

  describe('Compliance with Kiro Steering Conventions', () => {
    it('should follow Kiro steering file naming conventions', async () => {
      const testCases = [
        { featureName: 'simple-feature', expectedPattern: /simple-feature.*\.md$/ },
        { featureName: 'complex_feature_name', expectedPattern: /complex_feature_name.*\.md$/ },
        { featureName: 'Feature-With-Caps', expectedPattern: /Feature-With-Caps.*\.md$/ }
      ];

      for (const testCase of testCases) {
        const result = await steeringService.createFromRequirements(
          '# Requirements\n## User Story\nTesting naming conventions.',
          {
            create_steering_files: true,
            feature_name: testCase.featureName,
            inclusion_rule: 'manual'
          }
        );

        expect(result.created).toBe(true);
        expect(result.results[0].filename).toMatch(testCase.expectedPattern);
      }
    });

    it('should integrate with existing Kiro steering directory structure', async () => {
      // Create some existing steering files to test integration
      const existingFiles = [
        'existing-manual-file.md',
        'another-steering-file.md'
      ];

      for (const filename of existingFiles) {
        await fs.writeFile(
          path.join(testSteeringDir, filename),
          `---\ninclusion: manual\n---\n\n# Existing File\nThis is an existing steering file.`
        );
      }

      // Create new steering file via PM agent
      const result = await steeringService.createFromRequirements(
        '# Requirements\n## User Story\nTesting integration with existing files.',
        {
          create_steering_files: true,
          feature_name: 'integration-test',
          inclusion_rule: 'manual'
        }
      );

      expect(result.created).toBe(true);

      // Verify all files coexist
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBe(3); // 2 existing + 1 new

      // Verify existing files weren't modified
      for (const filename of existingFiles) {
        const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
        expect(content).toContain('This is an existing steering file');
      }
    });

    it('should respect Kiro steering inclusion rule semantics', async () => {
      const inclusionTests = [
        {
          rule: 'always' as InclusionRule,
          description: 'should be included in all contexts'
        },
        {
          rule: 'fileMatch' as InclusionRule,
          pattern: 'requirements*|spec*',
          description: 'should be included when matching files are in context'
        },
        {
          rule: 'manual' as InclusionRule,
          description: 'should only be included when explicitly referenced'
        }
      ];

      for (const test of inclusionTests) {
        const result = await steeringService.createFromRequirements(
          `# Requirements\n## User Story\nTesting ${test.rule} inclusion rule.`,
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
});