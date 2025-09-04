/**
 * Integration tests for AI Agent Pipeline steering file generation
 * 
 * Tests the integration between the AI Agent Pipeline and the SteeringService
 * to ensure PM documents are properly converted to steering files.
 */

import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';
import { SteeringService } from '../../components/steering-service';
import { OptionalParams } from '../../models/intent';
import { SteeringFileOptions } from '../../models/mcp';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('AI Agent Pipeline Steering Integration', () => {
  let pipeline: AIAgentPipeline;
  let testSteeringDir: string;

  beforeEach(async () => {
    pipeline = new AIAgentPipeline();
    testSteeringDir = path.join(process.cwd(), 'test-steering');
    
    // Ensure test directory exists
    try {
      await fs.mkdir(testSteeringDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  afterEach(async () => {
    await pipeline.cleanup();
    
    // Clean up test steering files
    try {
      await fs.rm(testSteeringDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('createSteeringFilesFromDocuments', () => {
    it('should create steering files from all PM document types', async () => {
      const pmDocuments = {
        requirements: `# Requirements Document
## Business Goal
Improve user authentication system

## Requirements
### 1. User Login
**User Story:** As a user, I want to log in securely
**Acceptance Criteria:**
1. WHEN user enters valid credentials THEN system SHALL authenticate user
2. WHEN user enters invalid credentials THEN system SHALL reject login`,

        designOptions: `# Design Options
## Problem Framing
Need to implement secure authentication

## Conservative Option
Basic username/password authentication

## Balanced Option  
OAuth integration with social providers

## Bold Option
Biometric authentication system`,

        managementOnePager: `# Executive Summary
## Problem
Current authentication system is outdated

## Solution
Implement modern authentication with OAuth

## ROI
- 50% reduction in support tickets
- 30% improvement in user satisfaction`,

        prfaq: {
          pressRelease: `# Press Release
New Authentication System Launches

We're excited to announce our new secure authentication system...`,
          faq: `# FAQ
Q: How does the new system work?
A: It uses modern OAuth standards...`,
          launchChecklist: `# Launch Checklist
- [ ] Security audit complete
- [ ] User documentation updated`
        },

        taskPlan: `# Implementation Plan
## Phase 1: Setup
- [ ] 1. Configure OAuth providers
- [ ] 2. Update database schema

## Phase 2: Implementation  
- [ ] 1. Implement OAuth flow
- [ ] 2. Add user interface`
      };

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'user-authentication',
        inclusion_rule: 'fileMatch',
        overwrite_existing: false
      };

      const result = await pipeline.createSteeringFilesFromDocuments(
        pmDocuments,
        steeringOptions,
        'test-session-1'
      );

      expect(result.created).toBe(true);
      expect(result.results).toHaveLength(5); // All 5 document types
      expect(result.summary).toContain('Successfully created');
      
      // Verify each document type was processed
      const documentTypes = ['requirements', 'design', 'one-pager', 'PR-FAQ', 'task plan'];
      documentTypes.forEach(docType => {
        const hasResult = result.results.some(r => r.message.toLowerCase().includes(docType.toLowerCase()));
        expect(hasResult).toBe(true);
      });
    });

    it('should handle missing documents gracefully', async () => {
      const pmDocuments = {
        requirements: '# Basic Requirements\nSome requirements here'
        // Only requirements, missing other document types
      };

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'partial-feature',
        inclusion_rule: 'fileMatch'
      };

      const result = await pipeline.createSteeringFilesFromDocuments(
        pmDocuments,
        steeringOptions,
        'test-session-2'
      );

      expect(result.created).toBe(true);
      expect(result.results).toHaveLength(1); // Only requirements
      expect(result.results[0].message).toContain('Requirements steering file created');
    });

    it('should skip steering file creation when not requested', async () => {
      const pmDocuments = {
        requirements: '# Requirements\nSome content'
      };

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: false,
        feature_name: 'skip-test'
      };

      const result = await pipeline.createSteeringFilesFromDocuments(
        pmDocuments,
        steeringOptions,
        'test-session-3'
      );

      expect(result.created).toBe(false);
      expect(result.results).toHaveLength(0);
      expect(result.summary).toContain('not requested');
    });

    it('should handle steering file creation errors gracefully', async () => {
      const pmDocuments = {
        requirements: 'valid content' // Use valid content but mock the service to fail
      };

      // Mock SteeringService to throw error for this test
      const originalCreateFromRequirements = SteeringService.prototype.createFromRequirements;
      SteeringService.prototype.createFromRequirements = jest.fn().mockRejectedValue(
        new Error('Test steering service error')
      );

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'error-test'
      };

      const result = await pipeline.createSteeringFilesFromDocuments(
        pmDocuments,
        steeringOptions,
        'test-session-4'
      );

      expect(result.created).toBe(false);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].created).toBe(false);
      expect(result.results[0].message).toContain('Failed to create');
      expect(result.results[0].warnings).toContain('Test steering service error');

      // Restore original method
      SteeringService.prototype.createFromRequirements = originalCreateFromRequirements;
    });
  });

  describe('promptForSteeringFilePreferences', () => {
    it('should generate default preferences for document types', async () => {
      const documentTypes = ['requirements', 'design', 'tasks'];
      const featureName = 'test-feature';

      const preferences = await pipeline.promptForSteeringFilePreferences(
        documentTypes,
        featureName,
        'test-session-5'
      );

      expect(preferences).toBeDefined();
      expect(preferences!.create_steering_files).toBe(true);
      expect(preferences!.feature_name).toBe(featureName);
      expect(preferences!.inclusion_rule).toBe('fileMatch');
      expect(preferences!.overwrite_existing).toBe(false);
    });

    it('should return undefined for empty document types', async () => {
      const preferences = await pipeline.promptForSteeringFilePreferences(
        [],
        'test-feature',
        'test-session-6'
      );

      expect(preferences).toBeUndefined();
    });

    it('should use default feature name when not provided', async () => {
      const preferences = await pipeline.promptForSteeringFilePreferences(
        ['requirements'],
        undefined,
        'test-session-7'
      );

      expect(preferences).toBeDefined();
      expect(preferences!.feature_name).toBe('unnamed-feature');
    });
  });

  describe('Full Pipeline Integration', () => {
    it('should create steering files during full pipeline execution', async () => {
      const rawIntent = 'Create a user authentication system with OAuth integration';
      const params: OptionalParams = {
        generatePMDocuments: {
          requirements: true,
          designOptions: true,
          managementOnePager: true,
          steeringOptions: {
            create_steering_files: true,
            feature_name: 'oauth-auth',
            inclusion_rule: 'fileMatch',
            overwrite_existing: false
          }
        }
      };

      const result = await pipeline.processIntent(rawIntent, params);

      expect(result.success).toBe(true);
      expect(result.pmDocuments).toBeDefined();
      expect(result.steeringFiles).toBeDefined();
      expect(result.steeringFiles!.created).toBe(true);
      expect(result.steeringFiles!.results.length).toBeGreaterThan(0);
    });

    it('should not create steering files when PM documents are not generated', async () => {
      const rawIntent = 'Create a simple task management system';
      const params: OptionalParams = {
        // No generatePMDocuments specified
      };

      const result = await pipeline.processIntent(rawIntent, params);

      expect(result.success).toBe(true);
      expect(result.pmDocuments).toBeUndefined();
      expect(result.steeringFiles).toBeUndefined();
    });

    it('should not create steering files when steering options are disabled', async () => {
      const rawIntent = 'Create a notification system';
      const params: OptionalParams = {
        generatePMDocuments: {
          requirements: true,
          steeringOptions: {
            create_steering_files: false,
            feature_name: 'notifications'
          }
        }
      };

      const result = await pipeline.processIntent(rawIntent, params);

      expect(result.success).toBe(true);
      expect(result.pmDocuments).toBeDefined();
      expect(result.steeringFiles).toBeUndefined();
    });
  });

  describe('Document Formatting', () => {
    it('should format requirements object as markdown', async () => {
      const requirementsObj = {
        businessGoal: 'Improve user experience',
        requirements: [
          {
            title: 'User Registration',
            userStory: 'As a new user, I want to register easily',
            acceptanceCriteria: [
              'WHEN user provides valid email THEN system SHALL create account',
              'WHEN user provides invalid email THEN system SHALL show error'
            ]
          }
        ]
      };

      const pmDocuments = {
        requirements: requirementsObj
      };

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'format-test'
      };

      const result = await pipeline.createSteeringFilesFromDocuments(
        pmDocuments,
        steeringOptions,
        'test-session-8'
      );

      expect(result.created).toBe(true);
      expect(result.results[0].created).toBe(true);
    });

    it('should format design options object as markdown', async () => {
      const designObj = {
        problemFraming: 'Need to choose authentication method',
        options: {
          conservative: {
            name: 'Basic Auth',
            summary: 'Simple username/password',
            impact: 'Medium',
            effort: 'Low'
          },
          balanced: {
            name: 'OAuth',
            summary: 'Third-party authentication',
            impact: 'High',
            effort: 'Medium'
          }
        }
      };

      const pmDocuments = {
        designOptions: designObj
      };

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'design-format-test'
      };

      const result = await pipeline.createSteeringFilesFromDocuments(
        pmDocuments,
        steeringOptions,
        'test-session-9'
      );

      expect(result.created).toBe(true);
      expect(result.results[0].created).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle SteeringService errors without failing pipeline', async () => {
      // Mock SteeringService to throw error
      const originalCreateFromRequirements = SteeringService.prototype.createFromRequirements;
      SteeringService.prototype.createFromRequirements = jest.fn().mockRejectedValue(
        new Error('Steering service error')
      );

      const pmDocuments = {
        requirements: '# Test Requirements'
      };

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'error-handling-test'
      };

      const result = await pipeline.createSteeringFilesFromDocuments(
        pmDocuments,
        steeringOptions,
        'test-session-10'
      );

      expect(result.created).toBe(false);
      expect(result.results[0].message).toContain('Failed to create');
      expect(result.results[0].warnings).toContain('Steering service error');

      // Restore original method
      SteeringService.prototype.createFromRequirements = originalCreateFromRequirements;
    });

    it('should handle malformed document objects gracefully', async () => {
      const pmDocuments = {
        requirements: { invalid: 'structure' } as any
      };

      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'malformed-test'
      };

      const result = await pipeline.createSteeringFilesFromDocuments(
        pmDocuments,
        steeringOptions,
        'test-session-11'
      );

      // Should still attempt to create steering files, even with malformed input
      expect(result.results).toHaveLength(1);
    });
  });
});