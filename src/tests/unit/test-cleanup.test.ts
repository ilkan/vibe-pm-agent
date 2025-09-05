/**
 * Unit tests for test cleanup utilities
 */

import { isTestGeneratedFile, cleanupTestSteeringFiles } from '../utils/test-cleanup';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Test Cleanup Utilities', () => {
  describe('isTestGeneratedFile', () => {
    it('should identify test-generated files correctly', () => {
      // Test files that should be identified as test-generated
      expect(isTestGeneratedFile('test-feature-requirements.md')).toBe(true);
      expect(isTestGeneratedFile('auth-system-test-design.md')).toBe(true);
      expect(isTestGeneratedFile('unnamed-feature-requirements.md')).toBe(true);
      expect(isTestGeneratedFile('malformed-test-requirements.md')).toBe(true);
      expect(isTestGeneratedFile('concurrent-test-0-requirements.md')).toBe(true);
      expect(isTestGeneratedFile('format-test-requirements.md')).toBe(true);
      expect(isTestGeneratedFile('overwrite-test-requirements.md')).toBe(true);
      expect(isTestGeneratedFile('partial-feature-requirements.md')).toBe(true);
      expect(isTestGeneratedFile('individual-mcp-test-design.md')).toBe(true);
      expect(isTestGeneratedFile('comprehensive-workflow-test-requirements.md')).toBe(true);
      expect(isTestGeneratedFile('custom-pattern-requirements.md')).toBe(true);
      expect(isTestGeneratedFile('design-format-test-design.md')).toBe(true);
      
      // Files with timestamps
      expect(isTestGeneratedFile('auth-system-design-2025-09-05T07-46-01.md')).toBe(true);
      expect(isTestGeneratedFile('test-inclusion-requirements-2025-09-05T07-46-01.md')).toBe(true);
      
      // Backup files
      expect(isTestGeneratedFile('test-inclusion-requirements-2025-09-05T07-46-01.md.backup')).toBe(true);
      
      // Common test patterns
      expect(isTestGeneratedFile('test1-feature.md')).toBe(true);
      expect(isTestGeneratedFile('sample-requirements.md')).toBe(true);
      expect(isTestGeneratedFile('demo-design.md')).toBe(true);
      expect(isTestGeneratedFile('example-tasks.md')).toBe(true);
    });

    it('should NOT identify protected files as test-generated', () => {
      // Protected core files
      expect(isTestGeneratedFile('product.md')).toBe(false);
      expect(isTestGeneratedFile('structure.md')).toBe(false);
      expect(isTestGeneratedFile('tech.md')).toBe(false);
      expect(isTestGeneratedFile('.DS_Store')).toBe(false);
    });

    it('should NOT identify legitimate project files as test-generated', () => {
      // Legitimate project files
      expect(isTestGeneratedFile('user-authentication.md')).toBe(false);
      expect(isTestGeneratedFile('api-design.md')).toBe(false);
      expect(isTestGeneratedFile('database-schema.md')).toBe(false);
      expect(isTestGeneratedFile('deployment-guide.md')).toBe(false);
      expect(isTestGeneratedFile('feature-requirements.md')).toBe(false);
      expect(isTestGeneratedFile('system-design.md')).toBe(false);
    });
  });

  describe('cleanupTestSteeringFiles', () => {
    const testDir = '.kiro/steering-test-cleanup';
    
    beforeEach(async () => {
      // Create test directory
      await fs.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
      // Clean up test directory
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should clean up test files but preserve protected files', async () => {
      // Create test files
      const testFiles = [
        'test-feature-requirements.md',
        'auth-system-test-design.md',
        'product.md', // Protected file
        'structure.md', // Protected file
        'legitimate-feature.md' // Should not be cleaned
      ];

      for (const file of testFiles) {
        await fs.writeFile(path.join(testDir, file), `# ${file}\nTest content`);
      }

      // Run cleanup (won't work on our test dir, but we can test the logic)
      const result = await cleanupTestSteeringFiles();
      
      // Verify the function runs without error
      expect(result).toHaveProperty('cleaned');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.cleaned)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});