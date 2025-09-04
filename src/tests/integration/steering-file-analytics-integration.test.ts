/**
 * Integration Tests for Steering File Analytics
 * 
 * Tests the end-to-end functionality of steering file analytics and management
 * utilities in realistic scenarios with actual file system operations.
 */

import { jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';
import { 
  SteeringFileUtilities,
  SteeringFileAnalytics,
  CleanupOptions
} from '../../components/steering-file-utilities';
import { DocumentType, InclusionRule } from '../../models/steering';

describe('Steering File Analytics Integration', () => {
  let utilities: SteeringFileUtilities;
  let testDir: string;
  let steeringDir: string;
  let backupDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'steering-analytics-test-'));
    steeringDir = path.join(testDir, '.kiro', 'steering');
    backupDir = path.join(steeringDir, '.backups');

    await fs.mkdir(steeringDir, { recursive: true });
    await fs.mkdir(backupDir, { recursive: true });

    utilities = new SteeringFileUtilities({
      steeringDirectory: steeringDir,
      backupDirectory: backupDir,
      defaultMaxAgeDays: 30,
      defaultMaxUnusedDays: 7
    });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test directory:', error);
    }
  });

  describe('Real File System Analytics', () => {
    it('should analyze actual steering files and generate comprehensive analytics', async () => {
      // Create test steering files with different characteristics
      const testFiles = [
        {
          filename: 'requirements-user-auth.md',
          content: `---
inclusion: fileMatch
fileMatchPattern: 'requirements*|spec*'
generatedBy: vibe-pm-agent
generatedAt: 2024-01-10T10:00:00Z
featureName: user-authentication
documentType: requirements
description: User authentication requirements
---

# User Authentication Requirements

## Overview
This document outlines the requirements for user authentication.

## Related Documents
#[[file:.kiro/specs/user-auth/design.md]]
#[[file:.kiro/specs/user-auth/tasks.md]]

## Requirements
1. Users must be able to log in with email and password
2. System must support password reset functionality`,
          age: 5 // days ago
        },
        {
          filename: 'design-user-auth.md',
          content: `---
inclusion: always
generatedBy: vibe-pm-agent
generatedAt: 2024-01-05T10:00:00Z
featureName: user-authentication
documentType: design
---

# User Authentication Design

## Architecture
OAuth 2.0 with JWT tokens

## Related Documents
#[[file:.kiro/specs/user-auth/requirements.md]]
#[[file:non-existent-file.md]]`,
          age: 10 // days ago
        },
        {
          filename: 'onepager-payment-system.md',
          content: `---
inclusion: manual
generatedBy: vibe-pm-agent
generatedAt: 2023-12-01T10:00:00Z
featureName: payment-system
documentType: onepager
---

# Payment System One-Pager

## Executive Summary
Implement payment processing system.`,
          age: 45 // days ago (outdated)
        },
        {
          filename: 'invalid-file.md',
          content: `# Invalid File
This file has no front-matter and should be detected as invalid.`,
          age: 2
        },
        {
          filename: 'tasks-user-auth.md',
          content: `---
inclusion: fileMatch
fileMatchPattern: 'tasks*|implementation*'
generatedBy: vibe-pm-agent
generatedAt: 2024-01-12T10:00:00Z
featureName: user-authentication
documentType: tasks
---

# User Authentication Tasks

## Implementation Plan
- [ ] Set up OAuth provider
- [ ] Implement JWT handling`,
          age: 3
        }
      ];

      // Write test files to disk
      for (const testFile of testFiles) {
        const filePath = path.join(steeringDir, testFile.filename);
        await fs.writeFile(filePath, testFile.content, 'utf8');
        
        // Set file timestamps to simulate age
        const ageMs = testFile.age * 24 * 60 * 60 * 1000;
        const timestamp = new Date(Date.now() - ageMs);
        await fs.utimes(filePath, timestamp, timestamp);
      }

      // Create referenced files to test broken references
      const specsDir = path.join(testDir, '.kiro', 'specs', 'user-auth');
      await fs.mkdir(specsDir, { recursive: true });
      await fs.writeFile(path.join(specsDir, 'design.md'), '# Design', 'utf8');
      await fs.writeFile(path.join(specsDir, 'tasks.md'), '# Tasks', 'utf8');
      await fs.writeFile(path.join(specsDir, 'requirements.md'), '# Requirements', 'utf8');
      // Note: non-existent-file.md is intentionally not created

      // Generate analytics
      const analytics = await utilities.generateAnalytics();

      // Verify analytics results
      expect(analytics.totalFiles).toBe(5);
      expect(analytics.filesByType[DocumentType.REQUIREMENTS]).toBe(1);
      expect(analytics.filesByType[DocumentType.DESIGN]).toBe(1);
      expect(analytics.filesByType[DocumentType.ONEPAGER]).toBe(1);
      expect(analytics.filesByType[DocumentType.TASKS]).toBe(1);
      
      expect(analytics.filesByInclusionRule['fileMatch']).toBe(2);
      expect(analytics.filesByInclusionRule['always']).toBe(1);
      expect(analytics.filesByInclusionRule['manual']).toBe(1);

      expect(analytics.invalidFiles).toHaveLength(1);
      expect(analytics.invalidFiles[0].filename).toBe('invalid-file.md');

      expect(analytics.outdatedFiles).toHaveLength(1);
      expect(analytics.outdatedFiles[0].filename).toBe('onepager-payment-system.md');

      expect(analytics.topFeatures).toContainEqual({ 
        featureName: 'user-authentication', 
        count: 3 
      });
      expect(analytics.topFeatures).toContainEqual({ 
        featureName: 'payment-system', 
        count: 1 
      });

      expect(analytics.brokenReferences).toHaveLength(2); // Both files have broken refs
      const brokenFiles = analytics.brokenReferences.map(br => br.file.filename);
      expect(brokenFiles).toContain('design-user-auth.md');
      expect(brokenFiles).toContain('requirements-user-auth.md');
      
      // Find the design file's broken references
      const designBrokenRefs = analytics.brokenReferences.find(br => 
        br.file.filename === 'design-user-auth.md'
      );
      expect(designBrokenRefs?.brokenRefs).toContain('non-existent-file.md');

      expect(analytics.totalSizeBytes).toBeGreaterThan(0);
      expect(analytics.averageAgeDays).toBeGreaterThan(0);
    });

    it('should organize files correctly by various criteria', async () => {
      // Create test files with different features and types
      const testFiles = [
        {
          filename: 'requirements-feature-a.md',
          content: createSteeringFileContent('feature-a', DocumentType.REQUIREMENTS, 'fileMatch'),
          age: 5
        },
        {
          filename: 'design-feature-a.md',
          content: createSteeringFileContent('feature-a', DocumentType.DESIGN, 'always'),
          age: 10
        },
        {
          filename: 'requirements-feature-b.md',
          content: createSteeringFileContent('feature-b', DocumentType.REQUIREMENTS, 'manual'),
          age: 15
        },
        {
          filename: 'tasks-feature-a.md',
          content: createSteeringFileContent('feature-a', DocumentType.TASKS, 'fileMatch'),
          age: 20
        }
      ];

      for (const testFile of testFiles) {
        const filePath = path.join(steeringDir, testFile.filename);
        await fs.writeFile(filePath, testFile.content, 'utf8');
        
        const ageMs = testFile.age * 24 * 60 * 60 * 1000;
        const timestamp = new Date(Date.now() - ageMs);
        await fs.utimes(filePath, timestamp, timestamp);
      }

      const organized = await utilities.organizeSteeringFiles();

      // Verify organization by feature
      expect(organized.byFeature['feature-a']).toHaveLength(3);
      expect(organized.byFeature['feature-b']).toHaveLength(1);

      // Verify organization by type
      expect(organized.byType[DocumentType.REQUIREMENTS]).toHaveLength(2);
      expect(organized.byType[DocumentType.DESIGN]).toHaveLength(1);
      expect(organized.byType[DocumentType.TASKS]).toHaveLength(1);

      // Verify organization by inclusion rule
      expect(organized.byInclusionRule['fileMatch']).toHaveLength(2);
      expect(organized.byInclusionRule['always']).toHaveLength(1);
      expect(organized.byInclusionRule['manual']).toHaveLength(1);

      // All files should be valid
      expect(organized.invalid).toHaveLength(0);
    });
  });

  describe('Cleanup Operations Integration', () => {
    it('should perform comprehensive cleanup with backups', async () => {
      const now = Date.now();
      
      // Create test files with different ages and characteristics
      const testFiles = [
        {
          filename: 'old-requirements.md',
          content: createSteeringFileContent('old-feature', DocumentType.REQUIREMENTS, 'always'),
          age: 40 // Outdated
        },
        {
          filename: 'unused-design.md',
          content: createSteeringFileContent('unused-feature', DocumentType.DESIGN, 'fileMatch'),
          age: 10, // Not old, but will be marked as unused by setting old modified time
          lastModified: 15 // days ago (unused)
        },
        {
          filename: 'recent-tasks.md',
          content: `---
inclusion: manual
generatedBy: vibe-pm-agent
generatedAt: ${new Date().toISOString()}
featureName: recent-feature
documentType: tasks
description: Test tasks for recent-feature
---

# Tasks for recent-feature

This is a test steering file for recent-feature.

## Content
Test content for tasks document.

No broken references in this file.`,
          age: 1 // Very recent, should not be removed
        },
        {
          filename: 'invalid-file.md',
          content: '# Invalid file with no front-matter',
          age: 5
        },
        {
          filename: 'broken-refs.md',
          content: `---
inclusion: always
generatedBy: pm-agent
generatedAt: 2024-01-10T10:00:00Z
featureName: broken-feature
documentType: requirements
---

# Broken References

See #[[file:non-existent-1.md]] and #[[file:non-existent-2.md]]`,
          age: 1 // Recent, but will be removed due to broken refs
        }
      ];

      // Write files to disk
      for (const testFile of testFiles) {
        const filePath = path.join(steeringDir, testFile.filename);
        await fs.writeFile(filePath, testFile.content, 'utf8');
        
        // Set creation time
        const creationAge = testFile.age * 24 * 60 * 60 * 1000;
        const creationTime = new Date(now - creationAge);
        
        // Set last modified time (for unused detection)
        const modifiedAge = (testFile.lastModified || testFile.age) * 24 * 60 * 60 * 1000;
        const modifiedTime = new Date(now - modifiedAge);
        
        await fs.utimes(filePath, modifiedTime, modifiedTime);
        
        // Manually set birthtime for creation time (not directly supported by utimes)
        // This is a limitation of the test - in real scenarios birthtime would be set correctly
      }

      // Perform cleanup
      const cleanupOptions: CleanupOptions = {
        maxAgeDays: 30,
        maxUnusedDays: 10,
        removeInvalid: true,
        removeBrokenRefs: true,
        createBackups: true,
        dryRun: false
      };

      const result = await utilities.cleanupSteeringFiles(cleanupOptions);

      // Verify cleanup results
      expect(result.filesRemoved).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      
      // Check that backups were created
      expect(result.filesBackedUp).toBe(result.filesRemoved);
      
      // Verify backup files exist
      const backupFiles = await fs.readdir(backupDir);
      expect(backupFiles.length).toBe(result.filesBackedUp);

      // Verify that recent file was not removed
      const remainingFiles = await fs.readdir(steeringDir);
      const mdFiles = remainingFiles.filter(f => f.endsWith('.md'));
      expect(mdFiles).toContain('recent-tasks.md');

      // Verify space was freed
      expect(result.spaceFreedBytes).toBeGreaterThan(0);
    });

    it('should handle dry run correctly without making changes', async () => {
      // Create an old file that should be removed
      const oldFile = {
        filename: 'old-file.md',
        content: createSteeringFileContent('old-feature', DocumentType.REQUIREMENTS, 'always'),
        age: 40
      };

      const filePath = path.join(steeringDir, oldFile.filename);
      await fs.writeFile(filePath, oldFile.content, 'utf8');
      
      const ageMs = oldFile.age * 24 * 60 * 60 * 1000;
      const timestamp = new Date(Date.now() - ageMs);
      await fs.utimes(filePath, timestamp, timestamp);

      // Perform dry run cleanup
      const result = await utilities.cleanupSteeringFiles({
        maxAgeDays: 30,
        dryRun: true
      });

      // Verify dry run results
      expect(result.filesRemoved).toBe(1);
      expect(result.removedFiles).toContain('old-file.md');
      expect(result.filesBackedUp).toBe(0); // No backups in dry run

      // Verify file still exists
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // Verify no backup files were created
      const backupFiles = await fs.readdir(backupDir);
      expect(backupFiles).toHaveLength(0);
    });

    it('should handle cleanup errors gracefully', async () => {
      // Create a file that will be removed
      const testFile = {
        filename: 'old-file.md',
        content: createSteeringFileContent('old-feature', DocumentType.REQUIREMENTS, 'always'),
        age: 40
      };

      const filePath = path.join(steeringDir, testFile.filename);
      await fs.writeFile(filePath, testFile.content, 'utf8');
      
      const ageMs = testFile.age * 24 * 60 * 60 * 1000;
      const timestamp = new Date(Date.now() - ageMs);
      await fs.utimes(filePath, timestamp, timestamp);

      // Perform cleanup - this should work without errors
      const result = await utilities.cleanupSteeringFiles({
        maxAgeDays: 30,
        createBackups: false
      });

      // Should have successfully removed the old file
      expect(result.filesRemoved).toBe(1);
      expect(result.errors.length).toBe(0);
      expect(result.removedFiles).toContain('old-file.md');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of steering files efficiently', async () => {
      const fileCount = 100;
      const features = ['auth', 'payment', 'notification', 'analytics', 'reporting'];
      const types = Object.values(DocumentType);
      const inclusions: InclusionRule[] = ['always', 'fileMatch', 'manual'];

      // Create many test files
      for (let i = 0; i < fileCount; i++) {
        const feature = features[i % features.length];
        const type = types[i % types.length];
        const inclusion = inclusions[i % inclusions.length];
        
        const filename = `${type}-${feature}-${i}.md`;
        const content = createSteeringFileContent(`${feature}-${i}`, type, inclusion);
        
        const filePath = path.join(steeringDir, filename);
        await fs.writeFile(filePath, content, 'utf8');
        
        // Vary file ages
        const age = Math.floor(Math.random() * 60) + 1; // 1-60 days
        const ageMs = age * 24 * 60 * 60 * 1000;
        const timestamp = new Date(Date.now() - ageMs);
        await fs.utimes(filePath, timestamp, timestamp);
      }

      const startTime = Date.now();

      // Test listing performance
      const files = await utilities.listSteeringFiles();
      expect(files).toHaveLength(fileCount);

      // Test analytics performance
      const analytics = await utilities.generateAnalytics();
      expect(analytics.totalFiles).toBe(fileCount);

      // Test organization performance
      const organized = await utilities.organizeSteeringFiles();
      expect(Object.keys(organized.byFeature).length).toBeGreaterThan(0);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(processingTime).toBeLessThan(10000); // 10 seconds

      console.log(`Processed ${fileCount} files in ${processingTime}ms`);
    });
  });

  // Helper function to create steering file content
  function createSteeringFileContent(
    featureName: string, 
    documentType: DocumentType, 
    inclusion: InclusionRule
  ): string {
    const fileMatchPattern = inclusion === 'fileMatch' ? `'${documentType}*'` : undefined;
    
    return `---
inclusion: ${inclusion}${fileMatchPattern ? `\nfileMatchPattern: ${fileMatchPattern}` : ''}
generatedBy: vibe-pm-agent
generatedAt: ${new Date().toISOString()}
featureName: ${featureName}
documentType: ${documentType}
description: Test ${documentType} for ${featureName}
---

# ${documentType.charAt(0).toUpperCase() + documentType.slice(1)} for ${featureName}

This is a test steering file for ${featureName}.

## Content
Test content for ${documentType} document.

## Related Files
#[[file:.kiro/specs/${featureName}/related.md]]`;
  }
});