#!/usr/bin/env node

/**
 * Pre-commit Cleanup Hook
 * 
 * Ensures test artifacts are cleaned up before commits
 */

import { runCleanup } from './cleanup.mjs';

async function preCommitCleanup() {
  console.log('🔍 Pre-commit cleanup check...');
  
  try {
    // Run cleanup in dry-run mode to check what would be cleaned
    await runCleanup({ dryRun: true, verbose: false });
    
    // Run actual cleanup
    await runCleanup({ verbose: false });
    
    console.log('✅ Pre-commit cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Pre-commit cleanup failed:', error);
    console.error('Please run "npm run cleanup" manually and try again');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  preCommitCleanup();
}

export { preCommitCleanup };