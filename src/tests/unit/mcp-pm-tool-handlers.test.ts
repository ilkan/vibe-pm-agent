// Unit tests for new PM-focused MCP tool handlers

import { PMAgentMCPServer } from '../../mcp/server';
import { 
  ManagementOnePagerArgs,
  PRFAQArgs,
  RequirementsArgs,
  DesignOptionsArgs,
  TaskPlanArgs,
  MCPToolContext
} from '../../models/mcp';

describe('PM-Focused MCP Tool Handlers', () => {
  let server: PMAgentMCPServer;
  let mockContext: MCPToolContext;

  beforeEach(() => {
    server = new PMAgentMCPServer();
    mockContext = {
      toolName: 'test_tool',
      sessionId: 'test-session-123',
      timestamp: Date.now(),
      requestId: 'req-123',
      traceId: 'trace-123'
    };
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('handleGenerateManagementOnePager', () => {
    test('should generate management one-pager with valid inputs', async () => {
      const args: ManagementOnePagerArgs = {
        requirements: 'System must provide urgent quota optimization for developer workflows',
        design: 'MCP server architecture with multi-stage pipeline and PM document generation',
        tasks: 'Implement PM document generation and MCP tool handlers',
        roi_inputs: {
          cost_naive: 100000,
          cost_balanced: 60000,
          cost_bold: 30000
        }
      };

      const result = await server.handleGenerateManagementOnePager(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown).toContain('# Management One-Pager');
      expect(result.content[0].markdown).toContain('## Answer');
      expect(result.content[0].markdown).toContain('## Because');
      expect(result.content[0].markdown).toContain('## ROI Snapshot');
      expect(result.metadata?.quotaUsed).toBe(2);
    });

    test('should handle missing optional parameters', async () => {
      const args: ManagementOnePagerArgs = {
        requirements: 'System must provide quota optimization',
        design: 'Basic MCP server architecture'
      };

      const result = await server.handleGenerateManagementOnePager(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content[0].markdown).toContain('Management One-Pager');
    });
  });

  describe('handleGeneratePRFAQ', () => {
    test('should generate PR-FAQ with valid inputs', async () => {
      const args: PRFAQArgs = {
        requirements: 'System must provide urgent quota optimization for developer workflows',
        design: 'MCP server architecture with multi-stage pipeline',
        target_date: '2024-06-15'
      };

      const result = await server.handleGeneratePRFAQ(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown).toContain('# Press Release');
      expect(result.content[0].markdown).toContain('# FAQ');
      expect(result.content[0].markdown).toContain('# Launch Checklist');
      expect(result.content[0].markdown).toContain('2024-06-15');
      expect(result.metadata?.quotaUsed).toBe(3);
    });

    test('should use default date when target_date not provided', async () => {
      const args: PRFAQArgs = {
        requirements: 'System must provide quota optimization',
        design: 'Basic MCP server architecture'
      };

      const result = await server.handleGeneratePRFAQ(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content[0].markdown).toContain('Press Release');
    });
  });

  describe('handleGenerateRequirements', () => {
    test('should generate requirements with context', async () => {
      const args: RequirementsArgs = {
        raw_intent: 'I want to optimize my workflow to reduce quota consumption and improve efficiency',
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

      const result = await server.handleGenerateRequirements(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json).toBeDefined();
      expect(result.content[0].json.data.businessGoal).toBeDefined();
      expect(result.content[0].json.data.userNeeds).toBeDefined();
      expect(result.content[0].json.data.priority.must).toBeInstanceOf(Array);
      expect(result.content[0].json.data.rightTimeVerdict.decision).toMatch(/^(do_now|do_later)$/);
      expect(result.metadata?.quotaUsed).toBe(2);
    });

    test('should generate requirements without context', async () => {
      const args: RequirementsArgs = {
        raw_intent: 'I want to optimize my workflow'
      };

      const result = await server.handleGenerateRequirements(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content[0].json.data.businessGoal).toBeDefined();
    });
  });

  describe('handleGenerateDesignOptions', () => {
    test('should generate design options with valid requirements', async () => {
      const args: DesignOptionsArgs = {
        requirements: 'System must provide urgent quota optimization with consulting-grade analysis and PM document generation capabilities'
      };

      const result = await server.handleGenerateDesignOptions(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json).toBeDefined();
      expect(result.content[0].json.data.problemFraming).toBeDefined();
      expect(result.content[0].json.data.options.conservative).toBeDefined();
      expect(result.content[0].json.data.options.balanced).toBeDefined();
      expect(result.content[0].json.data.options.bold).toBeDefined();
      expect(result.content[0].json.impactEffortMatrix).toBeDefined();
      expect(result.metadata?.quotaUsed).toBe(2);
    });
  });

  describe('handleGenerateTaskPlan', () => {
    test('should generate task plan with limits', async () => {
      const args: TaskPlanArgs = {
        design: 'MCP server architecture with multi-stage pipeline, PM document generation, and comprehensive testing framework',
        limits: {
          max_vibes: 1000,
          max_specs: 50,
          budget_usd: 100000
        }
      };

      const result = await server.handleGenerateTaskPlan(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json).toBeDefined();
      expect(result.content[0].json.data.guardrailsCheck).toBeDefined();
      expect(result.content[0].json.data.guardrailsCheck.limits.maxVibes).toBe(1000);
      expect(result.content[0].json.data.immediateWins).toBeInstanceOf(Array);
      expect(result.content[0].json.data.shortTerm).toBeInstanceOf(Array);
      expect(result.content[0].json.longTerm).toBeInstanceOf(Array);
      expect(result.metadata?.quotaUsed).toBe(2);
    });

    test('should generate task plan without limits', async () => {
      const args: TaskPlanArgs = {
        design: 'Basic MCP server architecture'
      };

      const result = await server.handleGenerateTaskPlan(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content[0].json.data.guardrailsCheck).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle errors gracefully in management one-pager generation', async () => {
      const args: ManagementOnePagerArgs = {
        requirements: '',
        design: ''
      };

      const result = await server.handleGenerateManagementOnePager(args, mockContext);

      // Should either succeed with minimal content or fail gracefully
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
    });

    test('should handle errors gracefully in PR-FAQ generation', async () => {
      const args: PRFAQArgs = {
        requirements: '',
        design: ''
      };

      const result = await server.handleGeneratePRFAQ(args, mockContext);

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
    });

    test('should handle errors gracefully in requirements generation', async () => {
      const args: RequirementsArgs = {
        raw_intent: ''
      };

      const result = await server.handleGenerateRequirements(args, mockContext);

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
    });
  });

  describe('Response Format Validation', () => {
    test('should return markdown format for management one-pager', async () => {
      const args: ManagementOnePagerArgs = {
        requirements: 'Test requirements',
        design: 'Test design'
      };

      const result = await server.handleGenerateManagementOnePager(args, mockContext);

      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown).toBeDefined();
      expect(result.content[0].text).toBeUndefined();
      expect(result.content[0].json).toBeUndefined();
    });

    test('should return json format for requirements', async () => {
      const args: RequirementsArgs = {
        raw_intent: 'Test intent'
      };

      const result = await server.handleGenerateRequirements(args, mockContext);

      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json).toBeDefined();
      expect(result.content[0].text).toBeUndefined();
      expect(result.content[0].markdown).toBeUndefined();
    });
  });
});