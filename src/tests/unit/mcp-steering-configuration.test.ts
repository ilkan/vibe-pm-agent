/**
 * Unit tests for MCP server configuration with steering file features
 */

import { MCP_SERVER_CONFIG, MCPToolRegistry, TOOL_SCHEMAS } from '../../mcp/server-config';
import { SteeringFileOptions } from '../../models/mcp';

describe('MCP Steering Configuration Tests', () => {
  describe('Tool Schema Validation', () => {
    test('should include steering_options in generate_requirements schema', () => {
      const schema = TOOL_SCHEMAS.generateRequirements;
      
      expect(schema.properties).toBeDefined();
      expect(schema.properties).toHaveProperty('steering_options');
      
      if (schema.properties) {
        expect(schema.properties.steering_options).toEqual({
        type: 'object',
        properties: {
          create_steering_files: { 
            type: 'boolean', 
            description: 'Whether to create steering files from generated documents' 
          },
          feature_name: { 
            type: 'string', 
            description: 'Feature name for organizing steering files' 
          },
          filename_prefix: { 
            type: 'string', 
            description: 'Custom filename prefix for steering files' 
          },
          inclusion_rule: { 
            type: 'string', 
            enum: ['always', 'fileMatch', 'manual'],
            description: 'How the steering file should be included in context' 
          },
          file_match_pattern: { 
            type: 'string', 
            description: 'File match pattern when inclusion_rule is \'fileMatch\'' 
          },
          overwrite_existing: { 
            type: 'boolean', 
            description: 'Whether to overwrite existing steering files' 
          }
        },
        description: 'Optional steering file creation options'
      });
      }
    });

    test('should include steering_options in generate_design_options schema', () => {
      const schema = TOOL_SCHEMAS.generateDesignOptions;
      
      expect(schema.properties).toBeDefined();
      expect(schema.properties).toHaveProperty('steering_options');
      
      if (schema.properties && typeof schema.properties.steering_options === 'object') {
        expect(schema.properties.steering_options.type).toBe('object');
        if ('properties' in schema.properties.steering_options && schema.properties.steering_options.properties) {
          expect(schema.properties.steering_options.properties).toHaveProperty('create_steering_files');
          expect(schema.properties.steering_options.properties).toHaveProperty('feature_name');
          expect(schema.properties.steering_options.properties).toHaveProperty('inclusion_rule');
        }
      }
    });

    test('should include steering_options in generate_management_onepager schema', () => {
      const schema = TOOL_SCHEMAS.generateManagementOnePager;
      
      expect(schema.properties).toBeDefined();
      expect(schema.properties).toHaveProperty('steering_options');
      
      if (schema.properties && typeof schema.properties.steering_options === 'object') {
        expect(schema.properties.steering_options.type).toBe('object');
        if ('properties' in schema.properties.steering_options && 
            schema.properties.steering_options.properties &&
            typeof schema.properties.steering_options.properties.inclusion_rule === 'object' &&
            'enum' in schema.properties.steering_options.properties.inclusion_rule) {
          expect(schema.properties.steering_options.properties.inclusion_rule.enum).toEqual(['always', 'fileMatch', 'manual']);
        }
      }
    });

    test('should include steering_options in generate_pr_faq schema', () => {
      const schema = TOOL_SCHEMAS.generatePRFAQ;
      
      expect(schema.properties).toBeDefined();
      expect(schema.properties).toHaveProperty('steering_options');
      
      if (schema.properties && typeof schema.properties.steering_options === 'object') {
        expect(schema.properties.steering_options.type).toBe('object');
        if ('properties' in schema.properties.steering_options && schema.properties.steering_options.properties) {
          expect(schema.properties.steering_options.properties).toHaveProperty('file_match_pattern');
          expect(schema.properties.steering_options.properties).toHaveProperty('overwrite_existing');
        }
      }
    });

    test('should include steering_options in generate_task_plan schema', () => {
      const schema = TOOL_SCHEMAS.generateTaskPlan;
      
      expect(schema.properties).toBeDefined();
      expect(schema.properties).toHaveProperty('steering_options');
      
      if (schema.properties && typeof schema.properties.steering_options === 'object') {
        expect(schema.properties.steering_options.type).toBe('object');
        if ('properties' in schema.properties.steering_options && schema.properties.steering_options.properties) {
          expect(schema.properties.steering_options.properties).toHaveProperty('filename_prefix');
        }
      }
    });

    test('should not include steering_options in non-PM document tools', () => {
      const nonPMTools = [
        'optimizeIntent',
        'analyzeWorkflow', 
        'generateROIAnalysis',
        'getConsultingSummary',
        'validateIdeaQuick'
      ];

      nonPMTools.forEach(toolName => {
        const schema = TOOL_SCHEMAS[toolName as keyof typeof TOOL_SCHEMAS];
        expect(schema.properties).not.toHaveProperty('steering_options');
      });
    });
  });

  describe('Tool Registration', () => {
    test('should register all tools with updated descriptions', () => {
      const registry = MCPToolRegistry.createDefault();
      const tools = registry.getAllTools();
      
      expect(tools).toHaveLength(10);
      
      const pmDocumentTools = tools.filter(tool => 
        ['generate_requirements', 'generate_design_options', 'generate_management_onepager', 
         'generate_pr_faq', 'generate_task_plan'].includes(tool.name)
      );
      
      pmDocumentTools.forEach(tool => {
        expect(tool.description).toContain('steering file');
      });
    });

    test('should have correct tool descriptions for steering file features', () => {
      const registry = MCPToolRegistry.createDefault();
      
      const requirementsTool = registry.getTool('generate_requirements');
      expect(requirementsTool?.description).toContain('requirements guidance');
      
      const designTool = registry.getTool('generate_design_options');
      expect(designTool?.description).toContain('design guidance');
      
      const onePagerTool = registry.getTool('generate_management_onepager');
      expect(onePagerTool?.description).toContain('future development guidance');
      
      const prfaqTool = registry.getTool('generate_pr_faq');
      expect(prfaqTool?.description).toContain('product clarity guidance');
      
      const tasksTool = registry.getTool('generate_task_plan');
      expect(tasksTool?.description).toContain('implementation guidance');
    });
  });

  describe('Steering Options Validation', () => {
    test('should validate valid steering options', () => {
      const registry = MCPToolRegistry.createDefault();
      
      const validOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'test-feature',
        inclusion_rule: 'fileMatch',
        file_match_pattern: 'test*',
        overwrite_existing: false
      };

      const input = {
        raw_intent: 'Test intent',
        steering_options: validOptions
      };

      const validation = registry.validateToolInput('generate_requirements', input);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toBeUndefined();
    });

    test('should validate inclusion rule enum values', () => {
      const registry = MCPToolRegistry.createDefault();
      
      const validInclusionRules = ['always', 'fileMatch', 'manual'];
      
      validInclusionRules.forEach(rule => {
        const input = {
          raw_intent: 'Test intent',
          steering_options: {
            create_steering_files: true,
            feature_name: 'test',
            inclusion_rule: rule
          }
        };

        const validation = registry.validateToolInput('generate_requirements', input);
        expect(validation.valid).toBe(true);
      });
    });

    test('should handle optional steering options', () => {
      const registry = MCPToolRegistry.createDefault();
      
      const inputWithoutSteering = {
        raw_intent: 'Test intent without steering options'
      };

      const validation = registry.validateToolInput('generate_requirements', inputWithoutSteering);
      expect(validation.valid).toBe(true);
    });

    test('should handle partial steering options', () => {
      const registry = MCPToolRegistry.createDefault();
      
      const partialOptions = {
        raw_intent: 'Test intent',
        steering_options: {
          create_steering_files: true,
          feature_name: 'test-feature'
          // Missing other optional fields
        }
      };

      const validation = registry.validateToolInput('generate_requirements', partialOptions);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Schema Consistency', () => {
    test('should have consistent steering_options schema across all PM tools', () => {
      const pmToolSchemas = [
        TOOL_SCHEMAS.generateRequirements,
        TOOL_SCHEMAS.generateDesignOptions,
        TOOL_SCHEMAS.generateManagementOnePager,
        TOOL_SCHEMAS.generatePRFAQ,
        TOOL_SCHEMAS.generateTaskPlan
      ];

      const expectedSteeringSchema = {
        type: 'object',
        properties: {
          create_steering_files: { 
            type: 'boolean', 
            description: 'Whether to create steering files from generated documents' 
          },
          feature_name: { 
            type: 'string', 
            description: 'Feature name for organizing steering files' 
          },
          filename_prefix: { 
            type: 'string', 
            description: 'Custom filename prefix for steering files' 
          },
          inclusion_rule: { 
            type: 'string', 
            enum: ['always', 'fileMatch', 'manual'],
            description: 'How the steering file should be included in context' 
          },
          file_match_pattern: { 
            type: 'string', 
            description: 'File match pattern when inclusion_rule is \'fileMatch\'' 
          },
          overwrite_existing: { 
            type: 'boolean', 
            description: 'Whether to overwrite existing steering files' 
          }
        },
        description: 'Optional steering file creation options'
      };

      pmToolSchemas.forEach(schema => {
        expect(schema.properties).toBeDefined();
        if (schema.properties) {
          expect(schema.properties.steering_options).toEqual(expectedSteeringSchema);
        }
      });
    });

    test('should have consistent property types across steering options', () => {
      const pmToolSchemas = [
        TOOL_SCHEMAS.generateRequirements,
        TOOL_SCHEMAS.generateDesignOptions,
        TOOL_SCHEMAS.generateManagementOnePager,
        TOOL_SCHEMAS.generatePRFAQ,
        TOOL_SCHEMAS.generateTaskPlan
      ];

      pmToolSchemas.forEach(schema => {
        expect(schema.properties).toBeDefined();
        if (schema.properties && 
            typeof schema.properties.steering_options === 'object' &&
            'properties' in schema.properties.steering_options &&
            schema.properties.steering_options.properties) {
          const steeringProps = schema.properties.steering_options.properties;
          
          if (typeof steeringProps.create_steering_files === 'object') {
            expect(steeringProps.create_steering_files.type).toBe('boolean');
          }
          if (typeof steeringProps.feature_name === 'object') {
            expect(steeringProps.feature_name.type).toBe('string');
          }
          if (typeof steeringProps.filename_prefix === 'object') {
            expect(steeringProps.filename_prefix.type).toBe('string');
          }
          if (typeof steeringProps.inclusion_rule === 'object') {
            expect(steeringProps.inclusion_rule.type).toBe('string');
            if ('enum' in steeringProps.inclusion_rule) {
              expect(steeringProps.inclusion_rule.enum).toEqual(['always', 'fileMatch', 'manual']);
            }
          }
          if (typeof steeringProps.file_match_pattern === 'object') {
            expect(steeringProps.file_match_pattern.type).toBe('string');
          }
          if (typeof steeringProps.overwrite_existing === 'object') {
            expect(steeringProps.overwrite_existing.type).toBe('boolean');
          }
        }
      });
    });
  });

  describe('MCP Server Configuration', () => {
    test('should have correct server metadata', () => {
      expect(MCP_SERVER_CONFIG.name).toBe('vibe-pm-agent');
      expect(MCP_SERVER_CONFIG.version).toBe('1.0.0');
      expect(MCP_SERVER_CONFIG.description).toContain('consulting techniques');
    });

    test('should register all expected tools', () => {
      const expectedTools = [
        'optimize_intent',
        'analyze_workflow',
        'generate_roi_analysis',
        'get_consulting_summary',
        'generate_management_onepager',
        'generate_pr_faq',
        'generate_requirements',
        'generate_design_options',
        'generate_task_plan',
        'validate_idea_quick'
      ];

      expect(MCP_SERVER_CONFIG.tools).toHaveLength(expectedTools.length);
      
      const toolNames = MCP_SERVER_CONFIG.tools.map(tool => tool.name);
      expectedTools.forEach(expectedTool => {
        expect(toolNames).toContain(expectedTool);
      });
    });

    test('should have proper tool handler placeholders', () => {
      MCP_SERVER_CONFIG.tools.forEach(tool => {
        expect(tool.handler).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      });
    });
  });

  describe('Tool Discovery', () => {
    test('should support tool discovery through registry', () => {
      const registry = MCPToolRegistry.createDefault();
      
      const toolNames = registry.getToolNames();
      expect(toolNames).toContain('generate_requirements');
      expect(toolNames).toContain('generate_design_options');
      expect(toolNames).toContain('generate_management_onepager');
      expect(toolNames).toContain('generate_pr_faq');
      expect(toolNames).toContain('generate_task_plan');
    });

    test('should provide tool metadata for steering-enabled tools', () => {
      const registry = MCPToolRegistry.createDefault();
      
      const steeringEnabledTools = [
        'generate_requirements',
        'generate_design_options', 
        'generate_management_onepager',
        'generate_pr_faq',
        'generate_task_plan'
      ];

      steeringEnabledTools.forEach(toolName => {
        const tool = registry.getTool(toolName);
        expect(tool).toBeDefined();
        expect(tool?.inputSchema.properties).toHaveProperty('steering_options');
        expect(tool?.description).toContain('steering file');
      });
    });
  });

  describe('Error Handling Configuration', () => {
    test('should handle tool registration errors', () => {
      const registry = new MCPToolRegistry();
      
      const duplicateTool = {
        name: 'test_tool',
        description: 'Test tool',
        inputSchema: { type: 'object', properties: {}, required: [] },
        handler: async () => ({ content: [], isError: false })
      };

      registry.registerTool(duplicateTool);
      
      expect(() => {
        registry.registerTool(duplicateTool);
      }).toThrow('Tool \'test_tool\' is already registered');
    });

    test('should handle missing tool validation', () => {
      const registry = MCPToolRegistry.createDefault();
      
      const validation = registry.validateToolInput('nonexistent_tool', {});
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Tool \'nonexistent_tool\' not found');
    });

    test('should handle missing required fields validation', () => {
      const registry = MCPToolRegistry.createDefault();
      
      const validation = registry.validateToolInput('generate_requirements', {});
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing required field: raw_intent');
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain compatibility with existing tool calls without steering options', () => {
      const registry = MCPToolRegistry.createDefault();
      
      const legacyInputs = [
        {
          toolName: 'generate_requirements',
          input: { raw_intent: 'Build authentication system' }
        },
        {
          toolName: 'generate_design_options',
          input: { requirements: 'System requirements...' }
        },
        {
          toolName: 'generate_management_onepager',
          input: { requirements: 'Requirements...', design: 'Design...' }
        },
        {
          toolName: 'generate_pr_faq',
          input: { requirements: 'Requirements...', design: 'Design...' }
        },
        {
          toolName: 'generate_task_plan',
          input: { design: 'Design document...' }
        }
      ];

      legacyInputs.forEach(({ toolName, input }) => {
        const validation = registry.validateToolInput(toolName, input);
        expect(validation.valid).toBe(true);
      });
    });

    test('should not break existing tool schemas', () => {
      const registry = MCPToolRegistry.createDefault();
      
      // Verify that adding steering_options doesn't break existing required fields
      const requirementsTool = registry.getTool('generate_requirements');
      expect(requirementsTool?.inputSchema.required).toEqual(['raw_intent']);
      
      const designTool = registry.getTool('generate_design_options');
      expect(designTool?.inputSchema.required).toEqual(['requirements']);
      
      const onePagerTool = registry.getTool('generate_management_onepager');
      expect(onePagerTool?.inputSchema.required).toEqual(['requirements', 'design']);
    });
  });
});