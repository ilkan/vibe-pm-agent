#!/usr/bin/env node

/**
 * Simple script to check for potentially unused imports
 * This is a basic implementation - for production use, consider tools like ts-unused-exports
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const TYPESCRIPT_EXTENSIONS = ['.ts', '.tsx'];
const IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  'coverage',
  '.git',
  '__tests__',
  '__mocks__',
  '.test.',
  '.spec.',
];

/**
 * Check if a file should be ignored
 */
function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

/**
 * Get all TypeScript files recursively
 */
function getTypeScriptFiles(dir, files = []) {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    
    if (shouldIgnoreFile(fullPath)) {
      continue;
    }
    
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      getTypeScriptFiles(fullPath, files);
    } else if (TYPESCRIPT_EXTENSIONS.includes(extname(fullPath))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Extract imports from a TypeScript file
 */
function extractImports(content) {
  const imports = [];
  const importRegex = /^import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"];?$/gm;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const [fullMatch, namedImports, namespaceImport, defaultImport, modulePath] = match;
    
    if (namedImports) {
      // Named imports: import { a, b, c } from 'module'
      const names = namedImports.split(',').map(name => name.trim());
      imports.push(...names);
    } else if (namespaceImport) {
      // Namespace import: import * as name from 'module'
      imports.push(namespaceImport);
    } else if (defaultImport) {
      // Default import: import name from 'module'
      imports.push(defaultImport);
    }
  }
  
  return imports;
}

/**
 * Check if an import is used in the file content
 */
function isImportUsed(importName, content) {
  // Remove import statements to avoid false positives
  const contentWithoutImports = content.replace(/^import\s+.*$/gm, '');
  
  // Simple regex to check if the import is used
  // This is basic and may have false positives/negatives
  const usageRegex = new RegExp(`\\b${importName}\\b`, 'g');
  return usageRegex.test(contentWithoutImports);
}

/**
 * Analyze a single file for unused imports
 */
function analyzeFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const imports = extractImports(content);
    const unusedImports = [];
    
    for (const importName of imports) {
      if (!isImportUsed(importName, content)) {
        unusedImports.push(importName);
      }
    }
    
    return {
      filePath,
      totalImports: imports.length,
      unusedImports,
      hasUnusedImports: unusedImports.length > 0,
    };
  } catch (error) {
    console.warn(`Warning: Could not analyze ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Checking for unused imports...\n');
  
  const files = getTypeScriptFiles('src');
  const results = [];
  let totalUnusedImports = 0;
  
  for (const file of files) {
    const result = analyzeFile(file);
    if (result) {
      results.push(result);
      totalUnusedImports += result.unusedImports.length;
    }
  }
  
  // Report results
  const filesWithUnusedImports = results.filter(r => r.hasUnusedImports);
  
  if (filesWithUnusedImports.length === 0) {
    console.log('✅ No unused imports detected!');
    return;
  }
  
  console.log(`⚠️  Found ${totalUnusedImports} potentially unused imports in ${filesWithUnusedImports.length} files:\n`);
  
  for (const result of filesWithUnusedImports) {
    console.log(`📄 ${result.filePath}`);
    for (const unusedImport of result.unusedImports) {
      console.log(`   - ${unusedImport}`);
    }
    console.log('');
  }
  
  console.log('Note: This is a basic check and may have false positives.');
  console.log('Please review each case manually before removing imports.');
  
  // Exit with non-zero code if unused imports found (for CI)
  if (process.env.CI && totalUnusedImports > 0) {
    process.exit(1);
  }
}

main();