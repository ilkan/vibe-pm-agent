// Integration test for PM-focused MCP tools
// Tests the complete flow from MCP tool call to PM document generation

import { PMAgentMCPServer } from '../../mcp/server';
import { 
  ManagementOnePagerArgs,
  PRFAQArgs,
  RequirementsArgs,
  DesignOptionsArgs,
  TaskPlanArgs,
  MCPToolContext
} from '../../models/mcp';

describe('PM-Focused MCP Tools Integration', () => {
  let server: PMAgentMCPServer;
  let mockContext: MCPToolContext;

  beforeEach(() => {
    server = new PMAgentMCPServer();
    mockContext = {
      toolName: 'integration_test',
      sessionId: 'integration-session-123',
      timestamp: Date.now(),
      requestId: 'integration-req-123',
      traceId: 'integration-trace-123'
    };
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('Complete PM Workflow Integration', () => {
    test('should execute complete PM workflow: requirements → design → tasks → one-pager → PR-FAQ', async () => {
      const rawIntent = 'I want to build a PM Agent that optimizes developer workflows by reducing quota consumption through intelligent analysis and automation';

      // Step 1: Generate requirements
      const requirementsArgs: RequirementsArgs = {
        raw_intent: rawIntent,
        context: {
          roadmap_theme: 'Developer Experience',
          budget: 200000,
          quotas: { maxVibes: 2000, maxSpecs: 100 },
          deadlines: 'Q2 2024 launch target'
        }
      };

      const requirementsResult = await server.handleGenerateRequirements(requirementsArgs, mockContext);
      expect(requirementsResult.isError).toBe(false);
      expect(requirementsResult.content[0].json.data.businessGoal).toBeDefined();
      expect(requirementsResult.content[0].json.data.rightTimeVerdict.decision).toMatch(/^(do_now|do_later)$/);

      // Step 2: Generate design options
      const designArgs: DesignOptionsArgs = {
        requirements: JSON.stringify(requirementsResult.content[0].json.data)
      };

      const designResult = await server.handleGenerateDesignOptions(designArgs, mockContext);
      expect(designResult.isError).toBe(false);
      expect(designResult.content[0].json.data.options.conservative).toBeDefined();
      expect(designResult.content[0].json.data.options.balanced).toBeDefined();
      expect(designResult.content[0].json.data.options.bold).toBeDefined();

      // Step 3: Generate task plan
      const taskArgs: TaskPlanArgs = {
        design: JSON.stringify(designResult.content[0].json),
        limits: {
          max_vibes: 2000,
          max_specs: 100,
          budget_usd: 200000
        }
      };

      const taskResult = await server.handleGenerateTaskPlan(taskArgs, mockContext);
      expect(taskResult.isError).toBe(false);
      expect(taskResult.content[0].json.data.guardrailsCheck).toBeDefined();
      expect(taskResult.content[0].json.data.immediateWins.length).toBeGreaterThan(0);

      // Step 4: Generate management one-pager
      const onePagerArgs: ManagementOnePagerArgs = {
        requirements: JSON.stringify(requirementsResult.content[0].json.data),
        design: JSON.stringify(designResult.content[0].json.data),
        tasks: JSON.stringify(taskResult.content[0].json.data),
        roi_inputs: {
          cost_naive: 300000,
          cost_balanced: 200000,
          cost_bold: 150000
        }
      };

      const onePagerResult = await server.handleGenerateManagementOnePager(onePagerArgs, mockContext);
      expect(onePagerResult.isError).toBe(false);
      expect(onePagerResult.content[0].markdown).toContain('# Management One-Pager');
      expect(onePagerResult.content[0].markdown).toContain('## Answer');
      expect(onePagerResult.content[0].markdown).toContain('## ROI Snapshot');

      // Step 5: Generate PR-FAQ
      const prfaqArgs: PRFAQArgs = {
        requirements: JSON.stringify(requirementsResult.content[0].json.data),
        design: JSON.stringify(designResult.content[0].json.data),
        target_date: '2024-06-30'
      };

      const prfaqResult = await server.handleGeneratePRFAQ(prfaqArgs, mockContext);
      expect(prfaqResult.isError).toBe(false);
      expect(prfaqResult.content[0].markdown).toContain('# Press Release');
      expect(prfaqResult.content[0].markdown).toContain('# FAQ');
      expect(prfaqResult.content[0].markdown).toContain('2024-06-30');

      // Verify all steps completed successfully
      expect(requirementsResult.metadata?.quotaUsed).toBe(2);
      expect(designResult.metadata?.quotaUsed).toBe(2);
      expect(taskResult.metadata?.quotaUsed).toBe(2);
      expect(onePagerResult.metadata?.quotaUsed).toBe(2);
      expect(prfaqResult.metadata?.quotaUsed).toBe(3);

      // Total quota used should be 11 (2+2+2+2+3)
      const totalQuotaUsed = (requirementsResult.metadata?.quotaUsed || 0) +
                            (designResult.metadata?.quotaUsed || 0) +
                            (taskResult.metadata?.quotaUsed || 0) +
                            (onePagerResult.metadata?.quotaUsed || 0) +
                            (prfaqResult.metadata?.quotaUsed || 0);
      expect(totalQuotaUsed).toBe(11);
    });

    test('should handle minimal inputs gracefully', async () => {
      const minimalIntent = 'Optimize workflow';

      // Test with minimal requirements
      const requirementsResult = await server.handleGenerateRequirements({
        raw_intent: minimalIntent
      }, mockContext);
      expect(requirementsResult.isError).toBe(false);

      // Test with minimal design options
      const designResult = await server.handleGenerateDesignOptions({
        requirements: 'Basic optimization requirements'
      }, mockContext);
      expect(designResult.isError).toBe(false);

      // Test with minimal task plan
      const taskResult = await server.handleGenerateTaskPlan({
        design: 'Basic design approach'
      }, mockContext);
      expect(taskResult.isError).toBe(false);

      // Test with minimal one-pager
      const onePagerResult = await server.handleGenerateManagementOnePager({
        requirements: 'Basic requirements',
        design: 'Basic design'
      }, mockContext);
      expect(onePagerResult.isError).toBe(false);

      // Test with minimal PR-FAQ
      const prfaqResult = await server.handleGeneratePRFAQ({
        requirements: 'Basic requirements',
        design: 'Basic design'
      }, mockContext);
      expect(prfaqResult.isError).toBe(false);
    });
  });

  describe('Performance and Quota Tracking', () => {
    test('should track quota usage accurately across all PM tools', async () => {
      const testCases = [
        { tool: 'generate_requirements', expectedQuota: 2 },
        { tool: 'generate_design_options', expectedQuota: 2 },
        { tool: 'generate_task_plan', expectedQuota: 2 },
        { tool: 'generate_management_onepager', expectedQuota: 2 },
        { tool: 'generate_pr_faq', expectedQuota: 3 }
      ];

      for (const testCase of testCases) {
        let result;
        switch (testCase.tool) {
          case 'generate_requirements':
            result = await server.handleGenerateRequirements({
              raw_intent: 'Test intent for quota tracking'
            }, mockContext);
            break;
          case 'generate_design_options':
            result = await server.handleGenerateDesignOptions({
              requirements: 'Test requirements for quota tracking'
            }, mockContext);
            break;
          case 'generate_task_plan':
            result = await server.handleGenerateTaskPlan({
              design: 'Test design for quota tracking'
            }, mockContext);
            break;
          case 'generate_management_onepager':
            result = await server.handleGenerateManagementOnePager({
              requirements: 'Test requirements',
              design: 'Test design'
            }, mockContext);
            break;
          case 'generate_pr_faq':
            result = await server.handleGeneratePRFAQ({
              requirements: 'Test requirements',
              design: 'Test design'
            }, mockContext);
            break;
        }

        expect(result?.metadata?.quotaUsed).toBe(testCase.expectedQuota);
      }
    });

    test('should complete PM document generation within reasonable time', async () => {
      const startTime = Date.now();

      const result = await server.handleGenerateManagementOnePager({
        requirements: 'System must provide urgent quota optimization for developer workflows with consulting-grade analysis',
        design: 'MCP server architecture with multi-stage pipeline, PM document generation, and comprehensive testing framework'
      }, mockContext);

      const executionTime = Date.now() - startTime;

      expect(result.isError).toBe(false);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.metadata?.executionTime).toBeDefined();
    });
  });

  describe('Content Quality Validation', () => {
    test('should generate high-quality management one-pager content', async () => {
      const result = await server.handleGenerateManagementOnePager({
        requirements: 'System must provide urgent quota optimization for developer workflows with consulting-grade analysis and PM document generation capabilities',
        design: 'MCP server architecture with multi-stage AI pipeline, business analysis components, and comprehensive PM document generation',
        roi_inputs: {
          cost_naive: 250000,
          cost_balanced: 150000,
          cost_bold: 100000
        }
      }, mockContext);

      expect(result.isError).toBe(false);
      const markdown = result.content[0].markdown;
      expect(markdown).toBeDefined();

      // Verify Pyramid Principle structure
      expect(markdown).toContain('## Answer');
      expect(markdown).toContain('## Because');
      expect(markdown).toContain('## What (Scope Today)');
      expect(markdown).toContain('## Risks & Mitigations');
      expect(markdown).toContain('## Options');
      expect(markdown).toContain('## ROI Snapshot');
      expect(markdown).toContain('## Right-Time Recommendation');

      // Verify content quality
      expect(markdown).toContain('Conservative');
      expect(markdown).toContain('Balanced ✅');
      expect(markdown).toContain('Bold');
      expect(markdown!.split('\n').length).toBeLessThan(120); // Should be under 120 lines
    });

    test('should generate comprehensive PR-FAQ content', async () => {
      const result = await server.handleGeneratePRFAQ({
        requirements: 'System must provide urgent quota optimization for developer workflows with consulting-grade analysis',
        design: 'MCP server architecture with multi-stage AI pipeline and PM document generation',
        target_date: '2024-07-15'
      }, mockContext);

      expect(result.isError).toBe(false);
      const markdown = result.content[0].markdown;
      expect(markdown).toBeDefined();

      // Verify PR-FAQ structure
      expect(markdown).toContain('# Press Release');
      expect(markdown).toContain('# FAQ');
      expect(markdown).toContain('# Launch Checklist');
      expect(markdown).toContain('2024-07-15');

      // Verify FAQ questions
      expect(markdown).toContain('Who is the customer?');
      expect(markdown).toContain('What problem are we solving now?');
      expect(markdown).toContain('Why now and why not later?');
      expect(markdown).toContain('How will we measure success');

      // Count FAQ questions (should be exactly 10)
      const faqQuestions = markdown!.match(/\*\*Q\d+:/g);
      expect(faqQuestions?.length).toBe(10);
    });
  });
});