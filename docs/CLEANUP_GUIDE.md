# Test Cleanup Guide

This guide explains the comprehensive test cleanup system implemented in the Vibe PM Agent project to prevent test artifacts from accumulating and causing issues.

## Overview

The cleanup system automatically removes test-generated files, temporary directories, and other artifacts that can accumulate during testing, especially steering files created by MCP tools during integration tests.

## Cleanup Components

### 1. Automatic Cleanup (Jest Hooks)

**Location**: `src/tests/setup.ts`, `src/tests/global-teardown.ts`

- **After Each Test**: Cleans up timers, mocks, and test artifacts
- **After All Tests**: Final cleanup and memory leak prevention
- **Global Teardown**: Comprehensive cleanup when Jest exits

### 2. Manual Cleanup Script

**Usage**: 
```bash
npm run cleanup              # Clean all test artifacts
npm run cleanup:verbose      # Clean with detailed output  
npm run cleanup:dry-run      # Preview what would be cleaned
```

**Features**:
- Identifies and removes test-generated steering files
- Cleans temporary directories
- Removes test evidence and benchmark files
- Validates steering directory integrity
- Provides detailed reporting

### 3. CI/CD Integration

**Automatic cleanup in GitHub Actions**:
- Runs after unit tests (always, even on failure)
- Runs after integration tests (always, even on failure)
- Prevents test artifacts from affecting subsequent jobs

### 4. Pre-commit Hook (Optional)

**Setup**:
```bash
# Add to .git/hooks/pre-commit
#!/bin/sh
node scripts/pre-commit-cleanup.mjs
```

## What Gets Cleaned Up

### Test-Generated Steering Files

The system identifies and removes files matching these patterns:

```javascript
// Test feature names
/^test-.*\.md$/
/^.*-test-.*\.md$/
/^ai-analytics-.*\.md$/
/^ai-business-platform-.*\.md$/
/^ai-customer-service-.*\.md$/
/^ai-project-management-.*\.md$/
/^validation-.*\.md$/
/^benchmark-.*\.md$/
/^mcp-test-.*\.md$/

// Temporary files
/.*\.tmp$/
/.*\.bak$/
/.*\.backup$/
/.*-\d{13}\.md$/ // Unix timestamp files

// Test evidence
/^test-.*\.json$/
/^perf-test-.*\.json$/
/^benchmark-.*\.json$/
```

### Protected Files (Never Deleted)

These core files are always preserved:

- `product.md` - Product overview
- `structure.md` - Project structure
- `tech.md` - Technology stack
- `Hackathon Rules.md` - Official rules
- `.DS_Store`, `.gitkeep`, `README.md`

### Directories Cleaned

- `.kiro/steering` - Test steering files only
- `.evidence` - Test evidence files
- `coverage` - Temporary coverage files
- `temp-test-steering` - Entire directory removed
- `test-specs-e2e` - Entire directory removed

## Cleanup Validation

After cleanup, the system validates:

1. **Required Files Present**: Ensures core steering files exist
2. **No Test Artifacts**: Confirms no test files remain
3. **Directory Integrity**: Validates steering structure

## Memory Leak Prevention

The cleanup system also handles:

- Clearing Jest timers and mocks
- Forcing garbage collection (if available)
- Clearing intervals and timeouts
- Preventing open handles in tests

## Troubleshooting

### Common Issues

**1. "Cleanup had issues" warning**
```bash
# Run manual cleanup with verbose output
npm run cleanup:verbose
```

**2. Test files not being cleaned**
```bash
# Check what would be cleaned
npm run cleanup:dry-run

# Add new patterns to TEST_PATTERNS in src/tests/utils/test-cleanup.ts
```

**3. Protected file accidentally deleted**
```bash
# Check PROTECTED_FILES list in src/tests/utils/test-cleanup.ts
# Restore from git if needed
git checkout HEAD -- .kiro/steering/product.md
```

### Manual Cleanup

If automatic cleanup fails, you can manually clean:

```bash
# Remove all test steering files (be careful!)
find .kiro/steering -name "*test*" -type f -delete
find .kiro/steering -name "ai-*" -type f -delete

# Remove temporary directories
rm -rf temp-test-steering test-specs-e2e

# Clean evidence files
rm -f .evidence/test-*.json .evidence/perf-test-*.json
```

## Configuration

### Adding New Test Patterns

Edit `src/tests/utils/test-cleanup.ts`:

```javascript
const TEST_STEERING_PATTERNS = [
  // Add your new pattern here
  /^your-test-pattern-.*\.md$/,
  // ... existing patterns
];
```

### Adding Protected Files

```javascript
const PROTECTED_FILES = [
  'your-important-file.md',
  // ... existing protected files
];
```

### Customizing Cleanup Directories

```javascript
const CLEANUP_DIRECTORIES = [
  'your-test-directory',
  // ... existing directories
];
```

## Best Practices

### For Test Writers

1. **Use Descriptive Names**: Include "test" in temporary file names
2. **Clean Up in Tests**: Use `afterEach` hooks for test-specific cleanup
3. **Avoid Protected Names**: Don't create files matching protected patterns
4. **Use Temporary Directories**: Create files in `temp-*` directories when possible

### For CI/CD

1. **Always Run Cleanup**: Use `if: always()` in GitHub Actions
2. **Check Cleanup Results**: Monitor cleanup warnings and errors
3. **Validate After Cleanup**: Ensure required files still exist

### For Development

1. **Run Cleanup Regularly**: `npm run cleanup` after test sessions
2. **Use Dry Run**: Check what will be cleaned before running
3. **Monitor Steering Directory**: Keep an eye on `.kiro/steering` contents

## Integration with Test Runner

The test runner (`scripts/test-runner.mjs`) automatically includes cleanup:

```javascript
// Cleanup runs regardless of test results
const cleanupSuccess = await this.runCleanup();

// Reports cleanup status in final summary
if (!cleanupSuccess) {
  console.warn('⚠️ Note: Cleanup had issues, but tests passed');
}
```

## Monitoring and Reporting

Cleanup provides detailed reporting:

```
🧹 Starting test artifact cleanup...

📁 .kiro/steering: 3 files cleaned
📂 Directories removed: 1
📊 Cleanup Summary
==================
✅ Total items cleaned: 4
❌ Total errors: 0
🎉 Cleanup completed successfully!
```

The system tracks:
- Files cleaned by directory
- Directories removed
- Errors encountered
- Validation results
- Memory cleanup status

This comprehensive cleanup system ensures a clean development environment and prevents test artifacts from interfering with the project or CI/CD pipeline.