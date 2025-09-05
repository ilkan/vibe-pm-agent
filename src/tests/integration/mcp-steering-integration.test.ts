/**
 * Integration tests for MCP tool handlers with steering file options
 */

import { PMAgentMCPServer } from '../../mcp/server';
import { 
  RequirementsArgs, 
  DesignOptionsArgs, 
  ManagementOnePagerArgs, 
  PRFAQArgs, 
  TaskPlanArgs,
  MCPToolContext,
  SteeringFileOptions
} from '../../models/mcp';
import { cleanupAfterTest } from '../utils/test-cleanup';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('MCP Steering Integration Tests', () => {
  let server: PMAgentMCPServer;
  let mockContext: MCPToolContext;
  const testSteeringDir = '.kiro/steering-test';

  beforeEach(() => {
    server = new PMAgentMCPServer();
    mockContext = {
      toolName: 'test-tool',
      sessionId: 'test-session',
      timestamp: Date.now(),
      requestId: 'test-request',
      traceId: 'test-trace'
    };
  });

  afterEach(async () => {
    // Clean up test steering files
    try {
      await fs.rm(testSteeringDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    
    // Clean up any test-generated steering files
    await cleanupAfterTest();
  });

  describe('handleGenerateRequirements with steering options', () => {
    test('should generate requirements and create steering file when requested', async () => {
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'test-feature',
        inclusion_rule: 'fileMatch',
        file_match_pattern: 'requirements*'
      };

      const args: RequirementsArgs = {
        raw_intent: 'Create a user authentication system with secure login and registration',
        steering_options: steeringOptions
      };

      const result = await server.handleGenerateRequirements(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json).toBeDefined();
      expect(result.metadata?.steeringFileCreated).toBe(true);
      
      if (result.metadata?.steeringFiles) {
        expect(result.metadata.steeringFiles).toHaveLength(1);
        expect(result.metadata.steeringFiles[0].filename).toContain('requirements');
        expect(result.metadata.steeringFiles[0].filename).toContain('test-feature');
      }
    });

    test('should generate requirements without steering file when not requested', async () => {
      const args: RequirementsArgs = {
        raw_intent: 'Create a user authentication system with secure login and registration'
      };

      const result = await server.handleGenerateRequirements(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('json');
      expect(result.metadata?.steeringFileCreated).toBe(false);
      expect(result.metadata?.steeringFiles).toBeUndefined();
    });

    test('should handle steering file creation failure gracefully', async () => {
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: '', // Invalid feature name should cause failure
        inclusion_rule: 'fileMatch'
      };

      const args: RequirementsArgs = {
        raw_intent: 'Create a user authentication system',
        steering_options: steeringOptions
      };

      const result = await server.handleGenerateRequirements(args, mockContext);

      expect(result.isError).toBe(false); // Main operation should still succeed
      expect(result.content[0].type).toBe('json');
      // Steering file creation may fail but shouldn't break the main operation
    });
  });

  describe('handleGenerateDesignOptions with steering options', () => {
    test('should generate design options and create steering file when requested', async () => {
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'auth-system',
        inclusion_rule: 'fileMatch',
        file_match_pattern: 'design*|architecture*'
      };

      const args: DesignOptionsArgs = {
        requirements: 'System must provide secure user authentication with login and registration capabilities',
        steering_options: steeringOptions
      };

      const result = await server.handleGenerateDesignOptions(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('json');
      expect(result.metadata?.steeringFileCreated).toBe(true);
      
      if (result.metadata?.steeringFiles) {
        expect(result.metadata.steeringFiles).toHaveLength(1);
        expect(result.metadata.steeringFiles[0].filename).toContain('design');
        expect(result.metadata.steeringFiles[0].filename).toContain('auth-system');
      }
    });
  });

  describe('handleGenerateManagementOnePager with steering options', () => {
    test('should generate one-pager and create steering file when requested', async () => {
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'executive-dashboard',
        inclusion_rule: 'manual',
        filename_prefix: 'exec'
      };

      const args: ManagementOnePagerArgs = {
        requirements: 'System must provide executive dashboard with key metrics and insights',
        design: 'Dashboard architecture with real-time data visualization and reporting capabilities',
        steering_options: steeringOptions
      };

      const result = await server.handleGenerateManagementOnePager(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('markdown');
      expect(result.metadata?.steeringFileCreated).toBe(true);
      
      if (result.metadata?.steeringFiles) {
        expect(result.metadata.steeringFiles).toHaveLength(1);
        expect(result.metadata.steeringFiles[0].filename).toContain('onepager');
        expect(result.metadata.steeringFiles[0].filename).toContain('executive-dashboard');
      }
    });
  });

  describe('handleGeneratePRFAQ with steering options', () => {
    test('should generate PR-FAQ and create steering file when requested', async () => {
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'product-launch',
        inclusion_rule: 'manual'
      };

      const args: PRFAQArgs = {
        requirements: 'Launch new product feature with comprehensive documentation',
        design: 'Feature architecture with user-facing components and backend services',
        target_date: '2024-06-01',
        steering_options: steeringOptions
      };

      const result = await server.handleGeneratePRFAQ(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown).toContain('Press Release');
      expect(result.content[0].markdown).toContain('FAQ');
      expect(result.metadata?.steeringFileCreated).toBe(true);
      
      if (result.metadata?.steeringFiles) {
        expect(result.metadata.steeringFiles).toHaveLength(1);
        expect(result.metadata.steeringFiles[0].filename).toContain('prfaq');
        expect(result.metadata.steeringFiles[0].filename).toContain('product-launch');
      }
    });
  });

  describe('handleGenerateTaskPlan with steering options', () => {
    test('should generate task plan and create steering file when requested', async () => {
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'implementation-plan',
        inclusion_rule: 'fileMatch',
        file_match_pattern: 'tasks*|implementation*'
      };

      const args: TaskPlanArgs = {
        design: 'Comprehensive system design with modular architecture and phased implementation approach',
        limits: {
          max_vibes: 50,
          max_specs: 10,
          budget_usd: 10000
        },
        steering_options: steeringOptions
      };

      const result = await server.handleGenerateTaskPlan(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json).toBeDefined();
      expect(result.metadata?.steeringFileCreated).toBe(true);
      
      if (result.metadata?.steeringFiles) {
        expect(result.metadata.steeringFiles).toHaveLength(1);
        expect(result.metadata.steeringFiles[0].filename).toContain('tasks');
        expect(result.metadata.steeringFiles[0].filename).toContain('implementation-plan');
      }
    });
  });

  describe('Steering file options validation', () => {
    test('should handle various inclusion rule options', async () => {
      const testCases = [
        { inclusion_rule: 'always' as const, expected: true },
        { inclusion_rule: 'fileMatch' as const, expected: true },
        { inclusion_rule: 'manual' as const, expected: true }
      ];

      for (const testCase of testCases) {
        const steeringOptions: SteeringFileOptions = {
          create_steering_files: true,
          feature_name: 'test-inclusion',
          inclusion_rule: testCase.inclusion_rule
        };

        const args: RequirementsArgs = {
          raw_intent: 'Test inclusion rule handling',
          steering_options: steeringOptions
        };

        const result = await server.handleGenerateRequirements(args, mockContext);
        expect(result.isError).toBe(false);
      }
    });

    test('should handle custom file match patterns', async () => {
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'custom-pattern',
        inclusion_rule: 'fileMatch',
        file_match_pattern: 'custom-*|special-*'
      };

      const args: RequirementsArgs = {
        raw_intent: 'Test custom file match pattern',
        steering_options: steeringOptions
      };

      const result = await server.handleGenerateRequirements(args, mockContext);
      expect(result.isError).toBe(false);
      expect(result.metadata?.steeringFileCreated).toBe(true);
    });

    test('should handle overwrite existing option', async () => {
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'overwrite-test',
        inclusion_rule: 'always',
        overwrite_existing: true
      };

      const args: RequirementsArgs = {
        raw_intent: 'Test overwrite existing files',
        steering_options: steeringOptions
      };

      const result = await server.handleGenerateRequirements(args, mockContext);
      expect(result.isError).toBe(false);
    });
  });

  describe('Error handling and edge cases', () => {
    test('should handle missing feature name gracefully', async () => {
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        // Missing feature_name
        inclusion_rule: 'always'
      };

      const args: RequirementsArgs = {
        raw_intent: 'Test missing feature name',
        steering_options: steeringOptions
      };

      const result = await server.handleGenerateRequirements(args, mockContext);
      expect(result.isError).toBe(false); // Main operation should succeed
      // Steering file creation may use default name
    });

    test('should handle invalid steering options gracefully', async () => {
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'test',
        inclusion_rule: 'invalid' as any // Invalid inclusion rule
      };

      const args: RequirementsArgs = {
        raw_intent: 'Test invalid steering options',
        steering_options: steeringOptions
      };

      const result = await server.handleGenerateRequirements(args, mockContext);
      expect(result.isError).toBe(false); // Main operation should succeed
    });
  });

  describe('Performance and concurrency', () => {
    test('should handle concurrent steering file creation', async () => {
      const promises = [];
      
      for (let i = 0; i < 3; i++) {
        const steeringOptions: SteeringFileOptions = {
          create_steering_files: true,
          feature_name: `concurrent-test-${i}`,
          inclusion_rule: 'always'
        };

        const args: RequirementsArgs = {
          raw_intent: `Concurrent test ${i}`,
          steering_options: steeringOptions
        };

        promises.push(server.handleGenerateRequirements(args, {
          ...mockContext,
          requestId: `concurrent-${i}`
        }));
      }

      const results = await Promise.all(promises);
      
      results.forEach((result, index) => {
        expect(result.isError).toBe(false);
        expect(result.metadata?.steeringFileCreated).toBe(true);
      });
    });
  });
});