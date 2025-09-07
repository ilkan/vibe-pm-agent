#!/usr/bin/env node

/**
 * Manual Test Cleanup Script
 * 
 * Provides comprehensive cleanup of test artifacts, steering files,
 * and other temporary files created during testing.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir, unlink, rm, access } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Test file patterns to identify and clean up
 */
const TEST_PATTERNS = [
  // Test steering files
  /^test-.*\.md$/,
  /^.*-test-.*\.md$/,
  /^ai-analytics-.*\.md$/,
  /^ai-business-platform-.*\.md$/,
  /^ai-customer-service-.*\.md$/,
  /^ai-project-management-.*\.md$/,
  /^ai-project-mgmt-.*\.md$/,
  /^validation-.*\.md$/,
  /^benchmark-.*\.md$/,
  /^performance-.*\.md$/,
  /^mcp-test-.*\.md$/,
  /^tool-test-.*\.md$/,
  /^handler-test-.*\.md$/,
  
  // Temporary files
  /.*\.tmp$/,
  /.*\.bak$/,
  /.*\.backup$/,
  /.*-\d{13}\.md$/, // Unix timestamp files
  
  // Test evidence
  /^test-.*\.json$/,
  /^perf-test-.*\.json$/,
  /^benchmark-.*\.json$/,
];

/**
 * Protected files that should never be deleted
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
 * Directories to clean
 */
const CLEANUP_DIRS = [
  '.kiro/steering',
  '.evidence',
  'coverage',
  'temp-test-steering',
  'test-specs-e2e'
];

/**
 * Check if a file should be cleaned up
 */
function shouldCleanFile(filename) {
  if (PROTECTED_FILES.includes(filename)) {
    return false;
  }
  
  return TEST_PATTERNS.some(pattern => pattern.test(filename));
}

/**
 * Clean files in a directory
 */
async function cleanDirectory(dirPath) {
  const cleaned = [];
  const errors = [];
  
  try {
    await access(join(rootDir, dirPath));
  } catch {
    // Directory doesn't exist
    return { cleaned, errors };
  }
  
  try {
    const files = await readdir(join(rootDir, dirPath));
    
    for (const file of files) {
      if (shouldCleanFile(file)) {
        try {
          const filePath = join(rootDir, dirPath, file);
          await unlink(filePath);
          cleaned.push(join(dirPath, file));
        } catch (error) {
          errors.push(`Failed to delete ${join(dirPath, file)}: ${error.message}`);
        }
      }
    }
  } catch (error) {
    errors.push(`Failed to read directory ${dirPath}: ${error.message}`);
  }
  
  return { cleaned, errors };
}

/**
 * Clean temporary directories entirely
 */
async function cleanTempDirectories() {
  const cleaned = [];
  const errors = [];
  
  const tempDirs = ['temp-test-steering', 'test-specs-e2e'];
  
  for (const dir of tempDirs) {
    try {
      await access(join(rootDir, dir));
      await rm(join(rootDir, dir), { recursive: true, force: true });
      cleaned.push(dir);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        errors.push(`Failed to delete directory ${dir}: ${error.message}`);
      }
    }
  }
  
  return { cleaned, errors };
}

/**
 * Main cleanup function
 */
async function runCleanup(options = {}) {
  const { verbose = false, dryRun = false } = options;
  
  console.log('🧹 Starting test artifact cleanup...\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be deleted\n');
  }
  
  let totalCleaned = 0;
  let totalErrors = 0;
  
  // Clean files in directories
  for (const dir of CLEANUP_DIRS) {
    if (verbose) {
      console.log(`Checking directory: ${dir}`);
    }
    
    const result = await cleanDirectory(dir);
    
    if (result.cleaned.length > 0) {
      console.log(`📁 ${dir}: ${result.cleaned.length} files cleaned`);
      if (verbose) {
        result.cleaned.forEach(file => console.log(`   ✅ ${file}`));
      }
    }
    
    if (result.errors.length > 0) {
      console.log(`❌ ${dir}: ${result.errors.length} errors`);
      if (verbose) {
        result.errors.forEach(error => console.log(`   ❌ ${error}`));
      }
    }
    
    totalCleaned += result.cleaned.length;
    totalErrors += result.errors.length;
  }
  
  // Clean temporary directories
  if (verbose) {
    console.log('\nCleaning temporary directories...');
  }
  
  const tempResult = await cleanTempDirectories();
  
  if (tempResult.cleaned.length > 0) {
    console.log(`📂 Directories removed: ${tempResult.cleaned.length}`);
    if (verbose) {
      tempResult.cleaned.forEach(dir => console.log(`   ✅ ${dir}`));
    }
  }
  
  if (tempResult.errors.length > 0) {
    console.log(`❌ Directory cleanup errors: ${tempResult.errors.length}`);
    if (verbose) {
      tempResult.errors.forEach(error => console.log(`   ❌ ${error}`));
    }
  }
  
  totalCleaned += tempResult.cleaned.length;
  totalErrors += tempResult.errors.length;
  
  // Summary
  console.log('\n📊 Cleanup Summary');
  console.log('==================');
  console.log(`✅ Total items cleaned: ${totalCleaned}`);
  console.log(`❌ Total errors: ${totalErrors}`);
  
  if (totalCleaned === 0 && totalErrors === 0) {
    console.log('🎉 No test artifacts found - workspace is clean!');
  } else if (totalErrors === 0) {
    console.log('🎉 Cleanup completed successfully!');
  } else {
    console.log('⚠️  Cleanup completed with some errors');
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    verbose: false,
    dryRun: false,
    help: false
  };
  
  for (const arg of args) {
    switch (arg) {
      case '-v':
      case '--verbose':
        options.verbose = true;
        break;
      case '-d':
      case '--dry-run':
        options.dryRun = true;
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
    }
  }
  
  return options;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
🧹 Test Cleanup Script

Usage: npm run cleanup [options]

Options:
  -v, --verbose    Show detailed output of cleaned files
  -d, --dry-run    Show what would be cleaned without deleting
  -h, --help       Show this help message

Examples:
  npm run cleanup              # Clean all test artifacts
  npm run cleanup -- --verbose # Clean with detailed output
  npm run cleanup -- --dry-run # Preview what would be cleaned

This script cleans up:
  • Test-generated steering files
  • Temporary test directories
  • Test evidence and benchmark files
  • Backup and temporary files

Protected files (never deleted):
  • product.md, structure.md, tech.md
  • Hackathon Rules.md
  • Core project files
`);
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  runCleanup(options)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Cleanup failed:', error);
      process.exit(1);
    });
}

export { runCleanup, shouldCleanFile, cleanDirectory };