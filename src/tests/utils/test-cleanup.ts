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
  
  // AI-generated test files (from recent cleanup)
  /^ai-analytics-.*\.(md)$/,
  /^ai-business-platform-.*\.(md)$/,
  /^ai-customer-service-.*\.(md)$/,
  /^ai-project-management-.*\.(md)$/,
  /^ai-project-mgmt-.*\.(md)$/,
  
  // Files with timestamps (likely test-generated)
  /.*-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.md$/,
  /.*-\d{13}\.md$/, // Unix timestamp
  
  // Backup files
  /.*\.backup$/,
  /.*\.bak$/,
  /.*\.tmp$/,
  
  // Common test naming patterns
  /^test\d+-.*\.(md)$/,
  /^sample-.*\.(md)$/,
  /^demo-.*\.(md)$/,
  /^example-.*\.(md)$/,
  /^validation-.*\.(md)$/,
  /^benchmark-.*\.(md)$/,
  /^performance-.*\.(md)$/,
  
  // MCP tool test artifacts
  /^mcp-test-.*\.(md)$/,
  /^tool-test-.*\.(md)$/,
  /^handler-test-.*\.(md)$/,
];

/**
 * Files that should NEVER be deleted (core steering files)
 */
const PROTECTED_FILES = [
  'product.md',
  'structure.md', 
  'tech.md',
  'Hackathon Rules.md',
  '.DS_Store',
  '.gitkeep',
  'README.md'
];

/**
 * Protected directories that should never be deleted entirely
 */
const PROTECTED_DIRECTORIES = [
  '.kiro/steering/prompts',
  '.kiro/specs/vibe-pm-agent',
  '.kiro/specs/competitive-market-analysis'
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
 * Clean up memory leaks and open handles
 */
export async function cleanupMemoryLeaks(): Promise<void> {
  // Clear all timers
  if (typeof jest !== 'undefined') {
    jest.clearAllTimers();
    jest.clearAllMocks();
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Clear any remaining intervals/timeouts
  const highestTimeoutId = setTimeout(() => {}, 0);
  for (let i = 0; i < highestTimeoutId; i++) {
    clearTimeout(i);
    clearInterval(i);
  }
}

/**
 * Clean up test evidence and temporary files
 */
export async function cleanupTestEvidence(): Promise<{
  cleaned: string[];
  errors: string[];
}> {
  const cleaned: string[] = [];
  const errors: string[] = [];
  
  const evidencePatterns = [
    '.evidence/test-*.json',
    '.evidence/perf-test-*.json',
    '.evidence/benchmark-*.json',
    'coverage/tmp-*',
    'temp-*',
    '*.tmp',
    '*.log'
  ];
  
  for (const pattern of evidencePatterns) {
    try {
      const glob = await import('glob');
      const files = glob.globSync(pattern);
      
      for (const file of files) {
        try {
          await fs.unlink(file);
          cleaned.push(file);
        } catch (error) {
          errors.push(`Failed to delete ${file}: ${error}`);
        }
      }
    } catch (error) {
      // Glob not available, skip pattern-based cleanup
    }
  }
  
  return { cleaned, errors };
}

/**
 * Validate steering directory integrity after cleanup
 */
export async function validateSteeringIntegrity(): Promise<{
  valid: boolean;
  missing: string[];
  unexpected: string[];
}> {
  const missing: string[] = [];
  const unexpected: string[] = [];
  
  try {
    const steeringDir = '.kiro/steering';
    const files = await fs.readdir(steeringDir);
    
    // Check for required files
    const requiredFiles = ['product.md', 'structure.md', 'tech.md'];
    for (const required of requiredFiles) {
      if (!files.includes(required)) {
        missing.push(required);
      }
    }
    
    // Check for unexpected test files that weren't cleaned
    for (const file of files) {
      if (isTestGeneratedFile(file)) {
        unexpected.push(file);
      }
    }
    
    return {
      valid: missing.length === 0 && unexpected.length === 0,
      missing,
      unexpected
    };
  } catch (error) {
    return {
      valid: false,
      missing: ['Error accessing steering directory'],
      unexpected: []
    };
  }
}

/**
 * Complete test cleanup - files, directories, memory, and validation
 */
export async function cleanupAllTestArtifacts(): Promise<{
  filesCleanup: { cleaned: string[]; errors: string[] };
  dirsCleanup: { cleaned: string[]; errors: string[] };
  evidenceCleanup: { cleaned: string[]; errors: string[] };
  memoryCleanup: boolean;
  validation: { valid: boolean; missing: string[]; unexpected: string[] };
}> {
  const filesCleanup = await cleanupTestSteeringFiles();
  const dirsCleanup = await cleanupTestDirectories();
  const evidenceCleanup = await cleanupTestEvidence();
  
  // Clean up memory leaks
  let memoryCleanup = false;
  try {
    await cleanupMemoryLeaks();
    memoryCleanup = true;
  } catch (error) {
    console.warn('Memory cleanup failed:', error);
  }
  
  // Validate integrity
  const validation = await validateSteeringIntegrity();
  
  return { 
    filesCleanup, 
    dirsCleanup, 
    evidenceCleanup,
    memoryCleanup,
    validation
  };
}

/**
 * Jest global teardown function
 */
export async function globalTeardown(): Promise<void> {
  console.log('🧹 Cleaning up test artifacts...');
  
  const result = await cleanupAllTestArtifacts();
  
  const totalCleaned = result.filesCleanup.cleaned.length + 
                      result.dirsCleanup.cleaned.length + 
                      result.evidenceCleanup.cleaned.length;
  const totalErrors = result.filesCleanup.errors.length + 
                     result.dirsCleanup.errors.length + 
                     result.evidenceCleanup.errors.length;
  
  if (totalCleaned > 0) {
    console.log(`✅ Cleaned up ${totalCleaned} test artifacts`);
    console.log(`   Files: ${result.filesCleanup.cleaned.length}`);
    console.log(`   Directories: ${result.dirsCleanup.cleaned.length}`);
    console.log(`   Evidence: ${result.evidenceCleanup.cleaned.length}`);
  }
  
  if (result.memoryCleanup) {
    console.log('✅ Memory cleanup completed');
  }
  
  // Report validation results
  if (result.validation.valid) {
    console.log('✅ Steering directory integrity validated');
  } else {
    if (result.validation.missing.length > 0) {
      console.warn(`⚠️  Missing required files: ${result.validation.missing.join(', ')}`);
    }
    if (result.validation.unexpected.length > 0) {
      console.warn(`⚠️  Unexpected test files remain: ${result.validation.unexpected.join(', ')}`);
    }
  }
  
  if (totalErrors > 0) {
    console.warn(`⚠️  ${totalErrors} cleanup errors occurred`);
    result.filesCleanup.errors.forEach(error => console.warn(`   Files: ${error}`));
    result.dirsCleanup.errors.forEach(error => console.warn(`   Dirs: ${error}`));
    result.evidenceCleanup.errors.forEach(error => console.warn(`   Evidence: ${error}`));
  }
}

/**
 * Manual cleanup function for use in individual tests
 */
export async function cleanupAfterTest(): Promise<void> {
  await cleanupAllTestArtifacts();
}