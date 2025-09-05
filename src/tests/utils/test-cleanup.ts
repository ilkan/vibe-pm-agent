/**
 * Test Cleanup Utilities
 * 
 * Utilities for cleaning up test-generated files, especially steering files
 * that accumulate during test runs.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Patterns that identify test-generated steering files
 */
const TEST_STEERING_PATTERNS = [
  // Test feature names
  /^test-.*\.(md)$/,
  /^.*-test-.*\.(md)$/,
  /^unnamed-feature-.*\.(md)$/,
  /^malformed-test-.*\.(md)$/,
  /^concurrent-test-.*\.(md)$/,
  /^format-test-.*\.(md)$/,
  /^overwrite-test-.*\.(md)$/,
  /^partial-feature-.*\.(md)$/,
  /^individual-mcp-test-.*\.(md)$/,
  /^comprehensive-workflow-test-.*\.(md)$/,
  /^custom-pattern-.*\.(md)$/,
  /^design-format-test-.*\.(md)$/,
  /^auth-system-.*\.(md)$/,
  /^oauth-auth-.*\.(md)$/,
  /^user-authentication-.*\.(md)$/,
  /^notification-service-.*\.(md)$/,
  /^payment-gateway-.*\.(md)$/,
  /^executive-dashboard-.*\.(md)$/,
  /^product-launch-.*\.(md)$/,
  /^implementation-plan-.*\.(md)$/,
  
  // Files with timestamps (likely test-generated)
  /.*-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.md$/,
  
  // Backup files
  /.*\.backup$/,
  
  // Common test naming patterns
  /^test\d+-.*\.(md)$/,
  /^sample-.*\.(md)$/,
  /^demo-.*\.(md)$/,
  /^example-.*\.(md)$/,
];

/**
 * Files that should NEVER be deleted (core steering files)
 */
const PROTECTED_FILES = [
  'product.md',
  'structure.md',
  'tech.md',
  '.DS_Store'
];

/**
 * Directories to clean up test files from
 */
const CLEANUP_DIRECTORIES = [
  '.kiro/steering',
  'test-specs-e2e',
  'temp-test-steering'
];

/**
 * Check if a filename matches test patterns
 */
export function isTestGeneratedFile(filename: string): boolean {
  // Never delete protected files
  if (PROTECTED_FILES.includes(filename)) {
    return false;
  }
  
  // Check against test patterns
  return TEST_STEERING_PATTERNS.some(pattern => pattern.test(filename));
}

/**
 * Clean up test-generated steering files
 */
export async function cleanupTestSteeringFiles(): Promise<{
  cleaned: string[];
  errors: string[];
}> {
  const cleaned: string[] = [];
  const errors: string[] = [];
  
  for (const dir of CLEANUP_DIRECTORIES) {
    try {
      // Check if directory exists
      try {
        await fs.access(dir);
      } catch {
        // Directory doesn't exist, skip
        continue;
      }
      
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        if (isTestGeneratedFile(file)) {
          try {
            const filePath = path.join(dir, file);
            await fs.unlink(filePath);
            cleaned.push(filePath);
          } catch (error) {
            errors.push(`Failed to delete ${path.join(dir, file)}: ${error}`);
          }
        }
      }
    } catch (error) {
      errors.push(`Failed to process directory ${dir}: ${error}`);
    }
  }
  
  return { cleaned, errors };
}

/**
 * Clean up test directories entirely
 */
export async function cleanupTestDirectories(): Promise<{
  cleaned: string[];
  errors: string[];
}> {
  const cleaned: string[] = [];
  const errors: string[] = [];
  
  const testDirs = [
    'test-specs-e2e',
    'temp-test-steering'
  ];
  
  for (const dir of testDirs) {
    try {
      // Check if directory exists
      try {
        await fs.access(dir);
      } catch {
        // Directory doesn't exist, skip
        continue;
      }
      
      await fs.rm(dir, { recursive: true, force: true });
      cleaned.push(dir);
    } catch (error) {
      errors.push(`Failed to delete directory ${dir}: ${error}`);
    }
  }
  
  return { cleaned, errors };
}

/**
 * Complete test cleanup - files and directories
 */
export async function cleanupAllTestArtifacts(): Promise<{
  filesCleanup: { cleaned: string[]; errors: string[] };
  dirsCleanup: { cleaned: string[]; errors: string[] };
}> {
  const filesCleanup = await cleanupTestSteeringFiles();
  const dirsCleanup = await cleanupTestDirectories();
  
  return { filesCleanup, dirsCleanup };
}

/**
 * Jest global teardown function
 */
export async function globalTeardown(): Promise<void> {
  console.log('🧹 Cleaning up test artifacts...');
  
  const result = await cleanupAllTestArtifacts();
  
  const totalCleaned = result.filesCleanup.cleaned.length + result.dirsCleanup.cleaned.length;
  const totalErrors = result.filesCleanup.errors.length + result.dirsCleanup.errors.length;
  
  if (totalCleaned > 0) {
    console.log(`✅ Cleaned up ${totalCleaned} test artifacts`);
  }
  
  if (totalErrors > 0) {
    console.warn(`⚠️  ${totalErrors} cleanup errors occurred`);
    result.filesCleanup.errors.forEach(error => console.warn(`   ${error}`));
    result.dirsCleanup.errors.forEach(error => console.warn(`   ${error}`));
  }
}

/**
 * Manual cleanup function for use in individual tests
 */
export async function cleanupAfterTest(): Promise<void> {
  await cleanupAllTestArtifacts();
}