/**
 * Integration tests for SteeringUserInteraction with SteeringService
 */

import { SteeringService } from '../../components/steering-service';
import { SteeringUserInteraction, SteeringUserPreferences } from '../../components/steering-user-interaction';
import { DocumentType } from '../../models/steering';
import { SteeringFileOptions } from '../../models/mcp';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('SteeringUserInteraction Integration', () => {
  let steeringService: SteeringService;
  let testSteeringDir: string;

  beforeEach(async () => {
    // Create temporary steering directory for tests
    testSteeringDir = path.join(__dirname, '../../temp-steering-test');
    
    try {
      await fs.mkdir(testSteeringDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Initialize steering service with test directory
    steeringService = new SteeringService({
      steeringDirectory: testSteeringDir,
      userPreferences: {
        autoCreate: false,
        showPreview: true,
        showSummary: true
      }
    });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testSteeringDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('End-to-End Steering File Creation with User Interaction', () => {
    it('should create steering file with user preferences applied', async () => {
      const mockRequirements = `
# Test Requirements

## Introduction
This is a test requirements document for user interaction testing.

## Requirements

### Requirement 1
**User Story:** As a developer, I want to test steering file creation, so that I can verify user interaction works.

#### Acceptance Criteria
1. WHEN requirements are processed THEN steering files SHALL be created with user preferences
2. WHEN user preferences are applied THEN the steering file SHALL reflect those preferences
      `;

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'user-interaction-test',
        inclusion_rule: 'fileMatch',
        file_match_pattern: 'requirements*|spec*'
      };

      // Update user preferences
      steeringService.updateUserPreferences({
        autoCreate: true,
        showPreview: false,
        namingPreferences: {
          useFeaturePrefix: true,
          useTimestamp: false
        }
      });

      const result = await steeringService.createFromRequirements(mockRequirements, steeringOptions);

      expect(result.created).toBe(true);
      expect(result.userInteractionRequired).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.summary).toBeDefined();
      expect(result.summary?.filesCreated).toBe(1);

      // Verify file was actually created
      const createdFile = result.results[0];
      expect(createdFile.success).toBe(true);
      expect(createdFile.fullPath).toBeDefined();
      
      if (createdFile.fullPath) {
        const fileExists = await fs.access(createdFile.fullPath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);

        // Verify file content includes user preferences
        const fileContent = await fs.readFile(createdFile.fullPath, 'utf8');
        expect(fileContent).toContain('inclusion: fileMatch');
        expect(fileContent).toContain('featureName: user-interaction-test');
        expect(fileContent).toContain('requirements*|spec*');
      }
    });

    it('should handle user declining steering file creation', async () => {
      const mockDesign = `
# Test Design

## Overview
This is a test design document.

## Architecture
Simple test architecture for user interaction testing.
      `;

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'declined-test'
      };

      // Set preferences to not auto-create for design documents
      steeringService.updateUserPreferences({
        autoCreate: false
      });

      // Mock the user interaction to simulate declining
      const userInteraction = new SteeringUserInteraction({ autoCreate: false });
      jest.spyOn(userInteraction, 'promptForSteeringFileCreation').mockResolvedValue({
        createFiles: false,
        rememberPreferences: false
      });

      // Replace the service's user interaction with our mocked one
      (steeringService as any).userInteraction = userInteraction;

      const result = await steeringService.createFromDesignOptions(mockDesign, steeringOptions);

      expect(result.created).toBe(false);
      expect(result.message).toContain('User declined steering file creation');
      expect(result.results).toHaveLength(0);
    });

    it('should handle preview confirmation workflow', async () => {
      const mockOnePager = `
# Executive Summary: Test Feature

## Problem Statement
Testing user interaction for steering file creation.

## Solution Overview
Implement comprehensive user interaction system.

## ROI Analysis
- Cost savings: Significant
- Implementation effort: Medium
- Timeline: 2 weeks
      `;

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'preview-test',
        inclusion_rule: 'manual'
      };

      // Set preferences to show preview
      steeringService.updateUserPreferences({
        autoCreate: true,
        showPreview: true
      });

      const result = await steeringService.createFromOnePager(mockOnePager, steeringOptions);

      expect(result.created).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary?.usageRecommendations.some(rec => 
        rec.includes('Manual inclusion files can be activated using #filename')
      )).toBe(true);
    });

    it('should generate comprehensive summary with multiple files', async () => {
      const mockContent = 'Test content for summary generation';
      
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'summary-test'
      };

      // Enable auto-create to avoid prompts
      steeringService.updateUserPreferences({
        autoCreate: true,
        showSummary: true
      });

      // Create multiple steering files
      const reqResult = await steeringService.createFromRequirements(mockContent, steeringOptions);
      const designResult = await steeringService.createFromDesignOptions(mockContent, steeringOptions);

      expect(reqResult.created).toBe(true);
      expect(designResult.created).toBe(true);

      // Verify summaries contain appropriate information
      expect(reqResult.summary?.totalFiles).toBe(1);
      expect(reqResult.summary?.filesCreated).toBe(1);
      expect(reqResult.summary?.usageRecommendations.length).toBeGreaterThan(0);

      expect(designResult.summary?.totalFiles).toBe(1);
      expect(designResult.summary?.filesCreated).toBe(1);
    });

    it('should handle custom naming preferences', async () => {
      const mockTaskPlan = `
# Implementation Plan

## Tasks
- [ ] 1. Implement user interaction system
- [ ] 2. Add preview functionality
- [ ] 3. Create summary reporting
      `;

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'custom-naming-test'
      };

      // Set custom naming preferences
      steeringService.updateUserPreferences({
        autoCreate: true,
        namingPreferences: {
          useFeaturePrefix: true,
          useTimestamp: false,
          customPrefix: 'custom-prefix'
        }
      });

      const result = await steeringService.createFromTaskPlan(mockTaskPlan, steeringOptions);

      expect(result.created).toBe(true);
      // The custom prefix should be applied to the filename
      expect(result.results[0].filename).toMatch(/custom-prefix|custom-naming-test/);
    });

    it('should preserve user preferences across multiple operations', async () => {
      const mockContent = 'Test content for preference persistence';
      
      const initialPreferences: Partial<SteeringUserPreferences> = {
        autoCreate: true,
        defaultInclusionRule: 'always',
        showPreview: false,
        showSummary: false
      };

      steeringService.updateUserPreferences(initialPreferences);

      // Verify preferences are applied
      const retrievedPreferences = steeringService.getUserPreferences();
      expect(retrievedPreferences.autoCreate).toBe(true);
      expect(retrievedPreferences.defaultInclusionRule).toBe('always');
      expect(retrievedPreferences.showPreview).toBe(false);

      // Create multiple steering files
      const result1 = await steeringService.createFromRequirements(mockContent, {
        create_steering_files: true,
        feature_name: 'persistence-test-1'
      });

      const result2 = await steeringService.createFromDesignOptions(mockContent, {
        create_steering_files: true,
        feature_name: 'persistence-test-2'
      });

      // Both should succeed with consistent preferences
      expect(result1.created).toBe(true);
      expect(result2.created).toBe(true);

      // Verify preferences are still the same
      const finalPreferences = steeringService.getUserPreferences();
      expect(finalPreferences.autoCreate).toBe(true);
      expect(finalPreferences.defaultInclusionRule).toBe('always');
    });
  });

  describe('Error Handling in User Interaction', () => {
    it('should handle file system errors gracefully', async () => {
      const mockContent = 'Test content for error handling';
      
      // Create service with invalid directory to trigger errors
      const invalidService = new SteeringService({
        steeringDirectory: '/invalid/path/that/does/not/exist',
        userPreferences: { autoCreate: true }
      });

      const result = await invalidService.createFromRequirements(mockContent, {
        create_steering_files: true,
        feature_name: 'error-test'
      });

      expect(result.created).toBe(false);
      expect(result.message).toMatch(/Failed to create|User declined|Steering file creation skipped/);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle malformed content gracefully', async () => {
      const malformedContent = ''; // Empty content

      steeringService.updateUserPreferences({
        autoCreate: true,
        showPreview: true
      });

      const result = await steeringService.createFromPRFAQ(malformedContent, {
        create_steering_files: true,
        feature_name: 'malformed-test'
      });

      // Should handle malformed content gracefully - might succeed with warnings or fail
      if (result.created) {
        expect(result.warnings).toBeDefined();
      } else {
        expect(result.message).toMatch(/declined|skipped|failed/i);
      }
    });
  });
});