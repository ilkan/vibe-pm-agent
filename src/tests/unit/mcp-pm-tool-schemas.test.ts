// Unit tests for new PM-focused MCP tool schema validation

import { TOOL_SCHEMAS, MCPToolRegistry } from '../../mcp/server-config';

describe('PM-Focused MCP Tool Schemas', () => {
  let registry: MCPToolRegistry;

  beforeEach(() => {
    registry = MCPToolRegistry.createDefault();
  });

  describe('generate_management_onepager schema', () => {
    test('should validate valid input with all fields', () => {
      const validInput = {
        requirements: 'System must provide urgent quota optimization',
        design: 'MCP server architecture with multi-stage pipeline',
        tasks: 'Implement PM document generation',
        roi_inputs: {
          cost_naive: 100000,
          cost_balanced: 60000,
          cost_bold: 30000
        }
      };

      const result = registry.validateToolInput('generate_management_onepager', validInput);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('should validate input with only required fields', () => {
      const validInput = {
        requirements: 'System must provide urgent quota optimization',
        design: 'MCP server architecture with multi-stage pipeline'
      };

      const result = registry.validateToolInput('generate_management_onepager', validInput);
      expect(result.valid).toBe(true);
    });

    test('should reject input missing required fields', () => {
      const invalidInput = {
        requirements: 'System must provide urgent quota optimization'
        // Missing design field
      };

      const result = registry.validateToolInput('generate_management_onepager', invalidInput);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: design');
    });

    test('should have correct schema structure', () => {
      const schema = TOOL_SCHEMAS.generateManagementOnePager;
      expect(schema.type).toBe('object');
      expect(schema.required).toEqual(['requirements', 'design']);
      expect(schema.properties?.requirements?.type).toBe('string');
      expect(schema.properties?.design?.type).toBe('string');
      expect(schema.properties?.tasks?.type).toBe('string');
      expect(schema.properties?.roi_inputs?.type).toBe('object');
    });
  });

  describe('generate_pr_faq schema', () => {
    test('should validate valid input with all fields', () => {
      const validInput = {
        requirements: 'System must provide urgent quota optimization',
        design: 'MCP server architecture with multi-stage pipeline',
        target_date: '2024-06-15'
      };

      const result = registry.validateToolInput('generate_pr_faq', validInput);
      expect(result.valid).toBe(true);
    });

    test('should validate input with only required fields', () => {
      const validInput = {
        requirements: 'System must provide urgent quota optimization',
        design: 'MCP server architecture with multi-stage pipeline'
      };

      const result = registry.validateToolInput('generate_pr_faq', validInput);
      expect(result.valid).toBe(true);
    });

    test('should reject input missing required fields', () => {
      const invalidInput = {
        design: 'MCP server architecture with multi-stage pipeline'
        // Missing requirements field
      };

      const result = registry.validateToolInput('generate_pr_faq', invalidInput);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: requirements');
    });

    test('should have correct schema structure', () => {
      const schema = TOOL_SCHEMAS.generatePRFAQ;
      expect(schema.type).toBe('object');
      expect(schema.required).toEqual(['requirements', 'design']);
      expect(schema.properties?.requirements?.type).toBe('string');
      expect(schema.properties?.design?.type).toBe('string');
      expect(schema.properties?.target_date?.type).toBe('string');
    });
  });

  describe('generate_requirements schema', () => {
    test('should validate valid input with context', () => {
      const validInput = {
        raw_intent: 'I want to optimize my workflow to reduce quota consumption',
        context: {
          roadmap_theme: 'Developer Experience',
          budget: 100000,
          quotas: {
            maxVibes: 1000,
            maxSpecs: 50
          },
          deadlines: 'Q1 2024 launch target'
        }
      };

      const result = registry.validateToolInput('generate_requirements', validInput);
      expect(result.valid).toBe(true);
    });

    test('should validate input with only required field', () => {
      const validInput = {
        raw_intent: 'I want to optimize my workflow to reduce quota consumption'
      };

      const result = registry.validateToolInput('generate_requirements', validInput);
      expect(result.valid).toBe(true);
    });

    test('should reject input missing required field', () => {
      const invalidInput = {
        context: {
          roadmap_theme: 'Developer Experience'
        }
        // Missing raw_intent field
      };

      const result = registry.validateToolInput('generate_requirements', invalidInput);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: raw_intent');
    });

    test('should have correct schema structure', () => {
      const schema = TOOL_SCHEMAS.generateRequirements;
      expect(schema.type).toBe('object');
      expect(schema.required).toEqual(['raw_intent']);
      expect(schema.properties?.raw_intent?.type).toBe('string');
      expect(schema.properties?.context?.type).toBe('object');
    });
  });

  describe('generate_design_options schema', () => {
    test('should validate valid input', () => {
      const validInput = {
        requirements: 'System must provide urgent quota optimization with consulting-grade analysis'
      };

      const result = registry.validateToolInput('generate_design_options', validInput);
      expect(result.valid).toBe(true);
    });

    test('should reject input missing required field', () => {
      const invalidInput = {};

      const result = registry.validateToolInput('generate_design_options', invalidInput);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: requirements');
    });

    test('should have correct schema structure', () => {
      const schema = TOOL_SCHEMAS.generateDesignOptions;
      expect(schema.type).toBe('object');
      expect(schema.required).toEqual(['requirements']);
      expect(schema.properties?.requirements?.type).toBe('string');
    });
  });

  describe('generate_task_plan schema', () => {
    test('should validate valid input with limits', () => {
      const validInput = {
        design: 'MCP server architecture with multi-stage pipeline and PM document generation',
        limits: {
          max_vibes: 1000,
          max_specs: 50,
          budget_usd: 100000
        }
      };

      const result = registry.validateToolInput('generate_task_plan', validInput);
      expect(result.valid).toBe(true);
    });

    test('should validate input with only required field', () => {
      const validInput = {
        design: 'MCP server architecture with multi-stage pipeline and PM document generation'
      };

      const result = registry.validateToolInput('generate_task_plan', validInput);
      expect(result.valid).toBe(true);
    });

    test('should reject input missing required field', () => {
      const invalidInput = {
        limits: {
          max_vibes: 1000
        }
        // Missing design field
      };

      const result = registry.validateToolInput('generate_task_plan', invalidInput);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: design');
    });

    test('should have correct schema structure', () => {
      const schema = TOOL_SCHEMAS.generateTaskPlan;
      expect(schema.type).toBe('object');
      expect(schema.required).toEqual(['design']);
      expect(schema.properties?.design?.type).toBe('string');
      expect(schema.properties?.limits?.type).toBe('object');
    });
  });

  describe('Tool Registry Integration', () => {
    test('should register all PM-focused tools', () => {
      const toolNames = registry.getToolNames();
      
      expect(toolNames).toContain('generate_management_onepager');
      expect(toolNames).toContain('generate_pr_faq');
      expect(toolNames).toContain('generate_requirements');
      expect(toolNames).toContain('generate_design_options');
      expect(toolNames).toContain('generate_task_plan');
    });

    test('should have correct tool count including new PM tools', () => {
      const allTools = registry.getAllTools();
      expect(allTools.length).toBe(10); // 4 original + 5 new PM tools + 1 quick validation tool
    });

    test('should retrieve PM tools with correct descriptions', () => {
      const onePagerTool = registry.getTool('generate_management_onepager');
      expect(onePagerTool?.description).toContain('executive-ready management one-pager');
      expect(onePagerTool?.description).toContain('Pyramid Principle');

      const prfaqTool = registry.getTool('generate_pr_faq');
      expect(prfaqTool?.description).toContain('Amazon-style PR-FAQ');

      const requirementsTool = registry.getTool('generate_requirements');
      expect(requirementsTool?.description).toContain('MoSCoW prioritization');

      const designTool = registry.getTool('generate_design_options');
      expect(designTool?.description).toContain('Impact vs Effort analysis');

      const taskTool = registry.getTool('generate_task_plan');
      expect(taskTool?.description).toContain('phased implementation plan');
    });
  });

  describe('Schema Validation Edge Cases', () => {
    test('should handle empty string inputs appropriately', () => {
      const inputWithEmptyStrings = {
        requirements: '',
        design: ''
      };

      // Empty strings should still pass basic validation (business logic validation happens later)
      const result = registry.validateToolInput('generate_management_onepager', inputWithEmptyStrings);
      expect(result.valid).toBe(true);
    });

    test('should handle null and undefined values', () => {
      const inputWithNulls = {
        requirements: 'Valid requirements',
        design: 'Valid design',
        tasks: null,
        roi_inputs: undefined
      };

      const result = registry.validateToolInput('generate_management_onepager', inputWithNulls);
      expect(result.valid).toBe(true);
    });

    test('should validate nested object structures', () => {
      const inputWithNestedObjects = {
        raw_intent: 'Optimize workflow',
        context: {
          quotas: {
            maxVibes: 1000,
            maxSpecs: 50
          }
        }
      };

      const result = registry.validateToolInput('generate_requirements', inputWithNestedObjects);
      expect(result.valid).toBe(true);
    });
  });
});