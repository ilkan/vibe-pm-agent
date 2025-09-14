#!/usr/bin/env node

/**
 * Production build verification script
 * Ensures the production build is clean and optimized
 */

import { execSync } from 'child_process';
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, extname } from 'path';

const DIST_DIR = 'dist';
const MAX_BUNDLE_SIZE_MB = 5; // Maximum acceptable bundle size
const EXCLUDED_PATTERNS = [
  /demo/i,
  /test/i,
  /example/i,
  /mock/i,
  // Note: 'spec' is excluded here as it's used for Kiro specifications (production feature)
];

/**
 * Check if production build exists and is clean
 */
function verifyBuildExists() {
  console.log('🔍 Verifying production build exists...');
  
  try {
    const distStats = statSync(DIST_DIR);
    if (!distStats.isDirectory()) {
      throw new Error(`${DIST_DIR} is not a directory`);
    }
    console.log('✅ Production build directory exists');
  } catch (error) {
    console.error('❌ Production build directory not found');
    console.error('Run: npm run build:prod');
    process.exit(1);
  }
}

/**
 * Check bundle size
 */
function verifyBundleSize() {
  console.log('📊 Analyzing bundle size...');
  
  try {
    const output = execSync(`du -sh ${DIST_DIR}`, { encoding: 'utf8' });
    const sizeMatch = output.match(/^([\d.]+)([KMG]?)\s/);
    
    if (!sizeMatch) {
      throw new Error('Could not parse bundle size');
    }
    
    const [, size, unit] = sizeMatch;
    const sizeNum = parseFloat(size);
    
    let sizeMB;
    switch (unit) {
      case 'K':
        sizeMB = sizeNum / 1024;
        break;
      case 'M':
        sizeMB = sizeNum;
        break;
      case 'G':
        sizeMB = sizeNum * 1024;
        break;
      default:
        sizeMB = sizeNum / (1024 * 1024); // Bytes to MB
    }
    
    console.log(`📦 Bundle size: ${size}${unit || 'B'} (${sizeMB.toFixed(2)} MB)`);
    
    if (sizeMB > MAX_BUNDLE_SIZE_MB) {
      console.warn(`⚠️  Bundle size exceeds ${MAX_BUNDLE_SIZE_MB}MB threshold`);
      return false;
    }
    
    console.log('✅ Bundle size is acceptable');
    return true;
  } catch (error) {
    console.error('❌ Failed to analyze bundle size:', error.message);
    return false;
  }
}

/**
 * Check for demo/test content in production build
 */
function verifyNoTestContent() {
  console.log('🧹 Checking for demo/test content...');
  
  const foundIssues = [];
  
  function scanDirectory(dir) {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stats = statSync(fullPath);
      
      if (stats.isDirectory()) {
        // Check directory name
        if (EXCLUDED_PATTERNS.some(pattern => pattern.test(item))) {
          foundIssues.push(`Directory: ${fullPath}`);
        } else {
          scanDirectory(fullPath);
        }
      } else if (stats.isFile()) {
        // Check file name
        if (EXCLUDED_PATTERNS.some(pattern => pattern.test(item))) {
          foundIssues.push(`File: ${fullPath}`);
        }
        
        // Check file content for JavaScript files
        if (extname(item) === '.js') {
          try {
            const content = readFileSync(fullPath, 'utf8');
            
            // Look for actual demo/test code patterns (not just words in strings)
            const problematicPatterns = [
              /\.demo\./g,
              /\.test\./g,
              /\.mock\./g,
              /demo_/g,
              /test_/g,
              /mock_/g,
              /_demo/g,
              /_test/g,
              /_mock/g,
              // Exclude spec patterns as they're used for Kiro specifications
            ];
            
            const problematicMatches = problematicPatterns.reduce((acc, pattern) => {
              const matches = content.match(pattern) || [];
              return acc + matches.length;
            }, 0);
            
            // Only flag if there are many problematic matches (likely actual demo/test code)
            if (problematicMatches > 10) {
              foundIssues.push(`Content: ${fullPath} (${problematicMatches} demo/test code patterns)`);
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }
  }
  
  scanDirectory(DIST_DIR);
  
  if (foundIssues.length > 0) {
    console.error('❌ Found demo/test content in production build:');
    foundIssues.forEach(issue => console.error(`  - ${issue}`));
    return false;
  }
  
  console.log('✅ No demo/test content found');
  return true;
}

/**
 * Verify MCP server can start
 */
function verifyServerStart() {
  console.log('🚀 Testing MCP server startup...');
  
  try {
    // Set production environment
    process.env.NODE_ENV = 'production';
    
    // Use gtimeout on macOS if available, otherwise use a different approach
    let timeoutCmd = 'timeout';
    try {
      execSync('which gtimeout', { stdio: 'ignore' });
      timeoutCmd = 'gtimeout';
    } catch {
      try {
        execSync('which timeout', { stdio: 'ignore' });
      } catch {
        // No timeout command available, use Node.js timeout
        timeoutCmd = null;
      }
    }
    
    let output;
    if (timeoutCmd) {
      output = execSync(`${timeoutCmd} 10s node dist/mcp/cli.js --health 2>&1 || true`, {
        encoding: 'utf8',
        timeout: 15000,
      });
    } else {
      // Fallback: just test the health check directly
      output = execSync('node dist/mcp/cli.js --health 2>&1 || true', {
        encoding: 'utf8',
        timeout: 10000,
      });
    }
    
    if (output.includes('"status": "healthy"') || output.includes('"status":"healthy"')) {
      console.log('✅ MCP server starts successfully');
      return true;
    } else {
      console.error('❌ MCP server failed to start or report healthy status');
      console.error('Output:', output);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to test server startup:', error.message);
    return false;
  }
}

/**
 * Count JavaScript files and report statistics
 */
function reportBuildStats() {
  console.log('📈 Build statistics:');
  
  let jsFiles = 0;
  let dtsFiles = 0;
  let totalSize = 0;
  
  function countFiles(dir) {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stats = statSync(fullPath);
      
      if (stats.isDirectory()) {
        countFiles(fullPath);
      } else if (stats.isFile()) {
        totalSize += stats.size;
        
        if (extname(item) === '.js') {
          jsFiles++;
        } else if (extname(item) === '.d.ts') {
          dtsFiles++;
        }
      }
    }
  }
  
  countFiles(DIST_DIR);
  
  console.log(`  📄 JavaScript files: ${jsFiles}`);
  console.log(`  📋 TypeScript declarations: ${dtsFiles}`);
  console.log(`  💾 Total size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
}

/**
 * Main verification function
 */
function main() {
  console.log('🔧 Production Build Verification\n');
  
  const checks = [
    verifyBuildExists,
    verifyBundleSize,
    verifyNoTestContent,
    verifyServerStart,
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const result = check();
      if (result === false) {
        allPassed = false;
      }
    } catch (error) {
      console.error(`❌ Check failed: ${error.message}`);
      allPassed = false;
    }
    console.log(''); // Add spacing
  }
  
  reportBuildStats();
  console.log('');
  
  if (allPassed) {
    console.log('🎉 All production build checks passed!');
    console.log('✅ Build is ready for deployment');
    process.exit(0);
  } else {
    console.log('💥 Some production build checks failed');
    console.log('❌ Build needs optimization before deployment');
    process.exit(1);
  }
}

// Run verification
main();