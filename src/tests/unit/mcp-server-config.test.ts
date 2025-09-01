// Unit tests for MCP Server configuration and setup

import { MCP_SERVER_CONFIG, MCPToolRegistry, TOOL_SCHEMAS } from '../../mcp/server-config';
import { MCPTool } from '../../models/mcp';

describe('MCP Server Configuration', () => {
  describe('MCP_SERVER_CONFIG', () => {
    it('should have correct server metadata', () => {
      expect(MCP_SERVER_CONFIG.name).toBe('vibe-pm-agent');
      expect(MCP_SERVER_CONFIG.version).toBe('1.0.0');
      expect(MCP_SERVER_CONFIG.description).toContain('AI agent for optimizing developer intent');
    });

    it('should define all required tools', () => {
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

      const toolNames = MCP_SERVER_CONFIG.tools.map(tool => tool.name);
      expectedTools.forEach(toolName => {
        expect(toolNames).toContain(toolName);
      });
    });

    it('should have valid tool definitions', () => {
      MCP_SERVER_CONFIG.tools.forEach(tool => {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeTruthy();
        expect(tool.inputSchema.type).toBe('object');
        expect(typeof tool.handler).toBe('function');
      });
    });
  });

  describe('TOOL_SCHEMAS', () => {
    describe('optimizeIntent schema', () => {
      const schema = TOOL_SCHEMAS.optimizeIntent;

      it('should require intent parameter', () => {
        expect(schema.required).toContain('intent');
      });

      it('should have proper intent validation', () => {
        expect(schema.properties?.intent).toBeDefined();
        expect(schema.properties?.intent.type).toBe('string');
        expect(schema.properties?.intent.minLength).toBe(10);
        expect(schema.properties?.intent.maxLength).toBe(5000);
      });

      it('should have optional parameters with proper validation', () => {
        const params = schema.properties?.parameters;
        expect(params).toBeDefined();
        expect(params.type).toBe('object');
        
        const expectedUserVolume = params.properties?.expectedUserVolume;
        expect(expectedUserVolume?.type).toBe('number');
        expect(expectedUserVolume?.minimum).toBe(1);
        expect(expectedUserVolume?.maximum).toBe(1000000);

        const performanceSensitivity = params.properties?.performanceSensitivity;
        expect(performanceSensitivity?.enum).toEqual(['low', 'medium', 'high']);
      });
    });

    describe('analyzeWorkflow schema', () => {
      const schema = TOOL_SCHEMAS.analyzeWorkflow;

      it('should require workflow parameter', () => {
        expect(schema.required).toContain('workflow');
      });

      it('should validate workflow structure', () => {
        const workflow = schema.properties?.workflow;
        expect(workflow).toBeDefined();
        expect(workflow.properties?.id).toBeDefined();
        expect(workflow.properties?.steps).toBeDefined();
        expect(workflow.required).toContain('id');
        expect(workflow.required).toContain('steps');
      });

      it('should validate workflow steps', () => {
        const workflow = schema.properties?.workflow;
        const steps = workflow.properties?.steps;
        expect(steps.type).toBe('array');
        
        const stepItem = steps.items;
        expect(stepItem.properties?.type?.enum).toEqual(['vibe', 'spec', 'data_retrieval', 'processing']);
        expect(stepItem.required).toContain('id');
        expect(stepItem.required).toContain('type');
        expect(stepItem.required).toContain('description');
        expect(stepItem.required).toContain('quotaCost');
      });

      it('should validate consulting techniques', () => {
        const techniques = schema.properties?.techniques;
        expect(techniques?.type).toBe('array');
        expect(techniques?.items?.enum).toEqual([
          'MECE', 'Pyramid', 'ValueDriverTree', 'ZeroBased', 
          'ImpactEffort', 'ValueProp', 'OptionFraming'
        ]);
      });
    });

    describe('generateROIAnalysis schema', () => {
      const schema = TOOL_SCHEMAS.generateROIAnalysis;

      it('should require workflow parameter', () => {
        expect(schema.required).toContain('workflow');
      });

      it('should have optional optimizedWorkflow and zeroBasedSolution', () => {
        expect(schema.properties?.optimizedWorkflow).toBeDefined();
        expect(schema.properties?.zeroBasedSolution).toBeDefined();
        expect(schema.required).not.toContain('optimizedWorkflow');
        expect(schema.required).not.toContain('zeroBasedSolution');
      });
    });

    describe('getConsultingSummary schema', () => {
      const schema = TOOL_SCHEMAS.getConsultingSummary;

      it('should require analysis parameter', () => {
        expect(schema.required).toContain('analysis');
      });

      it('should validate analysis structure', () => {
        const analysis = schema.properties?.analysis;
        expect(analysis.required).toContain('techniquesUsed');
        expect(analysis.required).toContain('keyFindings');
        expect(analysis.required).toContain('totalQuotaSavings');
      });
    });

    describe('validateIdeaQuick schema', () => {
      const schema = TOOL_SCHEMAS.validateIdeaQuick;

      it('should require idea parameter', () => {
        expect(schema.required).toContain('idea');
      });

      it('should have proper idea validation', () => {
        expect(schema.properties?.idea).toBeDefined();
        expect(schema.properties?.idea.type).toBe('string');
        expect(schema.properties?.idea.minLength).toBe(5);
        expect(schema.properties?.idea.maxLength).toBe(2000);
      });

      it('should have optional context with proper validation', () => {
        const context = schema.properties?.context;
        expect(context).toBeDefined();
        expect(context.type).toBe('object');
        
        const urgency = context.properties?.urgency;
        expect(urgency?.enum).toEqual(['low', 'medium', 'high']);

        const budgetRange = context.properties?.budget_range;
        expect(budgetRange?.enum).toEqual(['small', 'medium', 'large']);

        const teamSize = context.properties?.team_size;
        expect(teamSize?.type).toBe('number');
        expect(teamSize?.minimum).toBe(1);
        expect(teamSize?.maximum).toBe(100);
      });
    });

    describe('generateManagementOnePager schema', () => {
      const schema = TOOL_SCHEMAS.generateManagementOnePager;

      it('should require requirements and design parameters', () => {
        expect(schema.required).toContain('requirements');
        expect(schema.required).toContain('design');
      });

      it('should have optional tasks and roi_inputs', () => {
        expect(schema.properties?.tasks).toBeDefined();
        expect(schema.properties?.roi_inputs).toBeDefined();
        expect(schema.required).not.toContain('tasks');
        expect(schema.required).not.toContain('roi_inputs');
      });

      it('should validate roi_inputs structure', () => {
        const roiInputs = schema.properties?.roi_inputs;
        expect(roiInputs.properties?.cost_naive?.type).toBe('number');
        expect(roiInputs.properties?.cost_balanced?.type).toBe('number');
        expect(roiInputs.properties?.cost_bold?.type).toBe('number');
      });
    });

    describe('generatePRFAQ schema', () => {
      const schema = TOOL_SCHEMAS.generatePRFAQ;

      it('should require requirements and design parameters', () => {
        expect(schema.required).toContain('requirements');
        expect(schema.required).toContain('design');
      });

      it('should have optional target_date', () => {
        expect(schema.properties?.target_date).toBeDefined();
        expect(schema.required).not.toContain('target_date');
      });
    });

    describe('generateRequirements schema', () => {
      const schema = TOOL_SCHEMAS.generateRequirements;

      it('should require raw_intent parameter', () => {
        expect(schema.required).toContain('raw_intent');
      });

      it('should have optional context with proper structure', () => {
        const context = schema.properties?.context;
        expect(context).toBeDefined();
        expect(context.properties?.roadmap_theme?.type).toBe('string');
        expect(context.properties?.budget?.type).toBe('number');
        expect(context.properties?.quotas?.properties?.maxVibes?.type).toBe('number');
        expect(context.properties?.quotas?.properties?.maxSpecs?.type).toBe('number');
      });
    });

    describe('generateDesignOptions schema', () => {
      const schema = TOOL_SCHEMAS.generateDesignOptions;

      it('should require requirements parameter', () => {
        expect(schema.required).toContain('requirements');
      });
    });

    describe('generateTaskPlan schema', () => {
      const schema = TOOL_SCHEMAS.generateTaskPlan;

      it('should require design parameter', () => {
        expect(schema.required).toContain('design');
      });

      it('should have optional limits with proper structure', () => {
        const limits = schema.properties?.limits;
        expect(limits).toBeDefined();
        expect(limits.properties?.max_vibes?.type).toBe('number');
        expect(limits.properties?.max_specs?.type).toBe('number');
        expect(limits.properties?.budget_usd?.type).toBe('number');
      });
    });
  });

  describe('MCPToolRegistry', () => {
    let registry: MCPToolRegistry;

    beforeEach(() => {
      registry = new MCPToolRegistry();
    });

    it('should register tools successfully', () => {
      const mockTool: MCPTool = {
        name: 'test_tool',
        description: 'Test tool',
        inputSchema: { type: 'object' },
        handler: async () => ({ content: [] })
      };

      registry.registerTool(mockTool);
      expect(registry.getTool('test_tool')).toBe(mockTool);
    });

    it('should prevent duplicate tool registration', () => {
      const mockTool: MCPTool = {
        name: 'test_tool',
        description: 'Test tool',
        inputSchema: { type: 'object' },
        handler: async () => ({ content: [] })
      };

      registry.registerTool(mockTool);
      expect(() => registry.registerTool(mockTool)).toThrow("Tool 'test_tool' is already registered");
    });

    it('should return undefined for non-existent tools', () => {
      expect(registry.getTool('non_existent')).toBeUndefined();
    });

    it('should return all registered tools', () => {
      const tool1: MCPTool = {
        name: 'tool1',
        description: 'Tool 1',
        inputSchema: { type: 'object' },
        handler: async () => ({ content: [] })
      };
      const tool2: MCPTool = {
        name: 'tool2',
        description: 'Tool 2',
        inputSchema: { type: 'object' },
        handler: async () => ({ content: [] })
      };

      registry.registerTool(tool1);
      registry.registerTool(tool2);

      const allTools = registry.getAllTools();
      expect(allTools).toHaveLength(2);
      expect(allTools).toContain(tool1);
      expect(allTools).toContain(tool2);
    });

    it('should return tool names for discovery', () => {
      const tool1: MCPTool = {
        name: 'tool1',
        description: 'Tool 1',
        inputSchema: { type: 'object' },
        handler: async () => ({ content: [] })
      };
      const tool2: MCPTool = {
        name: 'tool2',
        description: 'Tool 2',
        inputSchema: { type: 'object' },
        handler: async () => ({ content: [] })
      };

      registry.registerTool(tool1);
      registry.registerTool(tool2);

      const toolNames = registry.getToolNames();
      expect(toolNames).toEqual(['tool1', 'tool2']);
    });

    describe('validateToolInput', () => {
      beforeEach(() => {
        const mockTool: MCPTool = {
          name: 'test_tool',
          description: 'Test tool',
          inputSchema: {
            type: 'object',
            required: ['requiredField'],
            properties: {
              requiredField: { type: 'string' }
            }
          },
          handler: async () => ({ content: [] })
        };
        registry.registerTool(mockTool);
      });

      it('should validate required fields', () => {
        const validInput = { requiredField: 'value' };
        const result = registry.validateToolInput('test_tool', validInput);
        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });

      it('should detect missing required fields', () => {
        const invalidInput = {};
        const result = registry.validateToolInput('test_tool', invalidInput);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: requiredField');
      });

      it('should handle non-existent tools', () => {
        const result = registry.validateToolInput('non_existent', {});
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Tool 'non_existent' not found");
      });
    });

    describe('createDefault', () => {
      it('should create registry with default tools', () => {
        const defaultRegistry = MCPToolRegistry.createDefault();
        const toolNames = defaultRegistry.getToolNames();
        
        expect(toolNames).toContain('optimize_intent');
        expect(toolNames).toContain('analyze_workflow');
        expect(toolNames).toContain('generate_roi_analysis');
        expect(toolNames).toContain('get_consulting_summary');
        expect(toolNames).toContain('generate_management_onepager');
        expect(toolNames).toContain('generate_pr_faq');
        expect(toolNames).toContain('generate_requirements');
        expect(toolNames).toContain('generate_design_options');
        expect(toolNames).toContain('generate_task_plan');
        expect(toolNames).toContain('validate_idea_quick');
      });

      it('should have all tools from MCP_SERVER_CONFIG', () => {
        const defaultRegistry = MCPToolRegistry.createDefault();
        const registryTools = defaultRegistry.getAllTools();
        
        expect(registryTools).toHaveLength(MCP_SERVER_CONFIG.tools.length);
        
        MCP_SERVER_CONFIG.tools.forEach(configTool => {
          const registryTool = defaultRegistry.getTool(configTool.name);
          expect(registryTool).toBeDefined();
          expect(registryTool?.name).toBe(configTool.name);
          expect(registryTool?.description).toBe(configTool.description);
        });
      });
    });
  });
});