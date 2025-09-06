/**
 * Complete MCP Workflow Integration Test
 * Tests the full end-to-end workflow from business idea to executive communications
 */

import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';
import { MCPServerConfig } from '../../mcp/server-config';
import { MCPToolRegistry } from '../../mcp/server';

describe('Complete MCP Workflow Integration', () => {
  let pipeline: AIAgentPipeline;
  let toolRegistry: MCPToolRegistry;

  beforeAll(async () => {
    pipeline = new AIAgentPipeline();
    toolRegistry = new MCPToolRegistry();
    
    // Register all MCP tools
    const config = new MCPServerConfig();
    config.tools.forEach(tool => {
      toolRegistry.registerTool(tool);
    });
  });

  describe('Business Intelligence Workflow', () => {
    it('should complete full business analysis workflow', async () => {
      const businessIdea = "AI-powered customer support chatbot with sentiment analysis and automated ticket routing for SaaS companies";
      
      // Step 1: Analyze business opportunity
      const opportunityResult = await toolRegistry.callTool('analyze_business_opportunity', {
        idea: businessIdea,
        market_context: {
          industry: "SaaS",
          competition: "Zendesk, Intercom, Freshdesk",
          timeline: "Q2 2025",
          budget_range: "medium"
        }
      });

      expect(opportunityResult.content).toBeDefined();
      expect(opportunityResult.content[0].text).toContain('market opportunity');
      expect(opportunityResult.confidence).toBeGreaterThan(70);

      // Step 2: Generate business case
      const businessCaseResult = await toolRegistry.callTool('generate_business_case', {
        opportunity_analysis: opportunityResult.content[0].text,
        financial_inputs: {
          development_cost: 200000,
          expected_revenue: 800000,
          operational_cost: 100000,
          time_to_market: 8
        }
      });

      expect(businessCaseResult.content).toBeDefined();
      expect(businessCaseResult.content[0].text).toContain('ROI');
      expect(businessCaseResult.confidence).toBeGreaterThan(75);

      // Step 3: Create stakeholder communication
      const communicationResult = await toolRegistry.callTool('create_stakeholder_communication', {
        business_case: businessCaseResult.content[0].text,
        communication_type: "executive_onepager",
        audience: "executives"
      });

      expect(communicationResult.content).toBeDefined();
      expect(communicationResult.content[0].text).toContain('RECOMMENDATION');
      expect(communicationResult.confidence).toBeGreaterThan(80);

      // Verify workflow consistency
      expect(opportunityResult.citations.primarySources.length).toBeGreaterThan(0);
      expect(businessCaseResult.citations.primarySources.length).toBeGreaterThan(0);
      expect(communicationResult.citations.primarySources.length).toBeGreaterThan(0);
    }, 30000);

    it('should maintain citation consistency across workflow steps', async () => {
      const businessIdea = "Real-time inventory management system with predictive analytics";
      
      const step1 = await toolRegistry.callTool('analyze_business_opportunity', {
        idea: businessIdea,
        market_context: { industry: "Retail", budget_range: "large" }
      });

      const step2 = await toolRegistry.callTool('generate_business_case', {
        opportunity_analysis: step1.content[0].text,
        financial_inputs: { development_cost: 500000, expected_revenue: 2000000 }
      });

      // Check citation consistency
      const step1Sources = step1.citations.primarySources.map(s => s.title);
      const step2Sources = step2.citations.primarySources.map(s => s.title);
      
      // Should have some overlapping sources for consistency
      const overlap = step1Sources.filter(title => step2Sources.includes(title));
      expect(overlap.length).toBeGreaterThan(0);

      // All citations should have proper metadata
      [...step1.citations.primarySources, ...step2.citations.primarySources].forEach(source => {
        expect(source.credibilityRating).toMatch(/^[ABC]$/);
        expect(source.accessDate).toBeDefined();
        expect(source.url).toBeDefined();
      });
    }, 25000);
  });

  describe('PM Document Generation Workflow', () => {
    it('should generate complete PM document suite', async () => {
      const rawIntent = "Build a mobile app for food delivery with real-time tracking and AI-powered restaurant recommendations";

      // Step 1: Generate requirements
      const requirementsResult = await toolRegistry.callTool('generate_requirements', {
        raw_intent: rawIntent,
        context: {
          roadmap_theme: "Mobile-first customer experience",
          budget: 300000,
          deadlines: "Q3 2025 launch"
        }
      });

      expect(requirementsResult.content[0].text).toContain('Business Goal');
      expect(requirementsResult.content[0].text).toContain('MoSCoW');
      expect(requirementsResult.content[0].text).toContain('Go/No-Go');

      // Step 2: Generate design options
      const designResult = await toolRegistry.callTool('generate_design_options', {
        requirements: requirementsResult.content[0].text
      });

      expect(designResult.content[0].text).toContain('Conservative');
      expect(designResult.content[0].text).toContain('Balanced');
      expect(designResult.content[0].text).toContain('Bold');
      expect(designResult.content[0].text).toContain('Impact vs Effort');

      // Step 3: Generate task plan
      const taskPlanResult = await toolRegistry.callTool('generate_task_plan', {
        design: designResult.content[0].text,
        limits: {
          max_vibes: 100,
          max_specs: 50,
          budget_usd: 300000
        }
      });

      expect(taskPlanResult.content[0].text).toContain('Guardrails Check');
      expect(taskPlanResult.content[0].text).toContain('Immediate Wins');
      expect(taskPlanResult.content[0].text).toContain('Short-Term');
      expect(taskPlanResult.content[0].text).toContain('Long-Term');

      // Step 4: Generate management one-pager
      const onePagerResult = await toolRegistry.callTool('generate_management_onepager', {
        requirements: requirementsResult.content[0].text,
        design: designResult.content[0].text,
        tasks: taskPlanResult.content[0].text,
        roi_inputs: {
          cost_naive: 400000,
          cost_balanced: 300000,
          cost_bold: 250000
        }
      });

      expect(onePagerResult.content[0].text).toContain('RECOMMENDATION');
      expect(onePagerResult.content[0].text).toContain('Because');
      expect(onePagerResult.content[0].text).toContain('ROI');

      // Step 5: Generate PR-FAQ
      const prFaqResult = await toolRegistry.callTool('generate_pr_faq', {
        requirements: requirementsResult.content[0].text,
        design: designResult.content[0].text,
        target_date: "2025-09-01"
      });

      expect(prFaqResult.content[0].text).toContain('FOR IMMEDIATE RELEASE');
      expect(prFaqResult.content[0].text).toContain('Q:');
      expect(prFaqResult.content[0].text).toContain('Launch Checklist');

      // Verify document consistency
      const documents = [
        requirementsResult.content[0].text,
        designResult.content[0].text,
        taskPlanResult.content[0].text,
        onePagerResult.content[0].text,
        prFaqResult.content[0].text
      ];

      // All documents should reference the same core concept
      documents.forEach(doc => {
        expect(doc.toLowerCase()).toContain('food delivery');
      });
    }, 45000);

    it('should handle document generation with steering file creation', async () => {
      const requirementsResult = await toolRegistry.callTool('generate_requirements', {
        raw_intent: "AI-powered code review tool for development teams",
        steering_options: {
          create_steering_files: true,
          feature_name: "ai-code-review",
          inclusion_rule: "manual"
        }
      });

      expect(requirementsResult.content).toBeDefined();
      
      // Should include steering file information in response
      const hasSteeringInfo = requirementsResult.content.some(item => 
        item.text && item.text.includes('steering')
      );
      expect(hasSteeringInfo).toBe(true);
    }, 15000);
  });

  describe('Quick Validation Workflow', () => {
    it('should provide fast idea validation with structured options', async () => {
      const ideas = [
        "Blockchain-based social media platform",
        "AI-powered personal finance assistant",
        "Virtual reality fitness training app",
        "Automated code documentation generator"
      ];

      for (const idea of ideas) {
        const validationResult = await toolRegistry.callTool('validate_idea_quick', {
          idea: idea,
          context: {
            market_research_available: true,
            competitive_analysis_depth: "basic",
            time_constraint: "urgent"
          }
        });

        expect(validationResult.content[0].text).toMatch(/^(PASS|FAIL)/);
        expect(validationResult.content[0].text).toContain('Option A:');
        expect(validationResult.content[0].text).toContain('Option B:');
        expect(validationResult.content[0].text).toContain('Option C:');
        expect(validationResult.confidence).toBeGreaterThan(60);
        expect(validationResult.executionTime).toBeLessThan(5000); // Should be fast
      }
    }, 20000);

    it('should provide different recommendations for PASS vs FAIL ideas', async () => {
      const likelyPassIdea = "AI-powered customer support automation for SaaS companies";
      const likelyFailIdea = "Blockchain-powered social network for pets with NFT integration";

      const passResult = await toolRegistry.callTool('validate_idea_quick', {
        idea: likelyPassIdea
      });

      const failResult = await toolRegistry.callTool('validate_idea_quick', {
        idea: likelyFailIdea
      });

      // Results should be different
      expect(passResult.content[0].text).not.toBe(failResult.content[0].text);
      
      // Both should have structured options
      [passResult, failResult].forEach(result => {
        expect(result.content[0].text).toContain('Option A:');
        expect(result.content[0].text).toContain('Option B:');
        expect(result.content[0].text).toContain('Option C:');
      });
    }, 10000);
  });

  describe('Strategic Analysis Workflow', () => {
    it('should assess strategic alignment comprehensively', async () => {
      const alignmentResult = await toolRegistry.callTool('assess_strategic_alignment', {
        feature_concept: "AI-powered predictive analytics platform for enterprise customers",
        company_context: {
          mission: "Democratize AI for business intelligence",
          strategic_priorities: ["AI innovation", "Enterprise growth", "Market leadership"],
          current_okrs: [
            "Increase enterprise revenue by 40%",
            "Launch 3 new AI features",
            "Achieve 95% customer satisfaction"
          ],
          competitive_position: "Market challenger"
        }
      });

      expect(alignmentResult.content[0].text).toContain('Strategic Alignment');
      expect(alignmentResult.content[0].text).toContain('OKR');
      expect(alignmentResult.content[0].text).toContain('competitive');
      expect(alignmentResult.confidence).toBeGreaterThan(75);
    }, 15000);

    it('should validate market timing with multiple signals', async () => {
      const timingResult = await toolRegistry.callTool('validate_market_timing', {
        feature_idea: "Remote work collaboration platform with AI-powered meeting insights",
        market_signals: {
          customer_demand: "high",
          competitive_pressure: "medium",
          technical_readiness: "high",
          resource_availability: "medium"
        }
      });

      expect(timingResult.content[0].text).toContain('Market Timing');
      expect(timingResult.content[0].text).toMatch(/(NOW|LATER|WAIT)/);
      expect(timingResult.confidence).toBeGreaterThan(70);
    }, 12000);

    it('should optimize resource allocation with constraints', async () => {
      const optimizationResult = await toolRegistry.callTool('optimize_resource_allocation', {
        current_workflow: {
          team_size: 12,
          timeline: "9 months",
          budget: 500000,
          technical_debt: "medium"
        },
        optimization_goals: ["cost_reduction", "speed_improvement", "quality_increase"],
        resource_constraints: {
          budget: 400000,
          team_size: 10,
          timeline: "6 months",
          technical_debt: "low"
        }
      });

      expect(optimizationResult.content[0].text).toContain('Resource Optimization');
      expect(optimizationResult.content[0].text).toContain('recommendation');
      expect(optimizationResult.confidence).toBeGreaterThan(70);
    }, 15000);
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid input gracefully', async () => {
      const invalidInputs = [
        { tool: 'analyze_business_opportunity', args: { idea: "" } },
        { tool: 'generate_business_case', args: { opportunity_analysis: null } },
        { tool: 'validate_idea_quick', args: { idea: "x" } } // Too short
      ];

      for (const { tool, args } of invalidInputs) {
        const result = await toolRegistry.callTool(tool, args);
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('error');
      }
    });

    it('should handle missing optional parameters', async () => {
      const result = await toolRegistry.callTool('analyze_business_opportunity', {
        idea: "Simple mobile app for task management"
        // No market_context provided
      });

      expect(result.isError).toBe(false);
      expect(result.content).toBeDefined();
      expect(result.confidence).toBeGreaterThan(50);
    });

    it('should handle extremely long inputs', async () => {
      const longIdea = "A".repeat(10000); // Very long input
      
      const result = await toolRegistry.callTool('validate_idea_quick', {
        idea: longIdea
      });

      // Should handle gracefully, possibly with truncation
      expect(result.isError).toBe(false);
      expect(result.content).toBeDefined();
    });

    it('should maintain performance under load', async () => {
      const concurrentCalls = Array(5).fill(null).map((_, i) => 
        toolRegistry.callTool('validate_idea_quick', {
          idea: `Test idea ${i} for concurrent processing`
        })
      );

      const results = await Promise.all(concurrentCalls);
      
      results.forEach((result, i) => {
        expect(result.isError).toBe(false);
        expect(result.content[0].text).toContain(`Test idea ${i}` || 'PASS' || 'FAIL');
        expect(result.executionTime).toBeLessThan(10000);
      });
    }, 30000);
  });

  describe('Citation and Evidence Quality', () => {
    it('should maintain high citation quality across all tools', async () => {
      const tools = [
        'analyze_business_opportunity',
        'generate_business_case',
        'create_stakeholder_communication',
        'assess_strategic_alignment'
      ];

      for (const toolName of tools) {
        const result = await toolRegistry.callTool(toolName, {
          idea: "AI-powered business intelligence platform",
          feature_concept: "AI-powered business intelligence platform",
          business_case: "Strong ROI with 3.2x return on investment",
          company_context: { mission: "AI for everyone" }
        });

        expect(result.citations).toBeDefined();
        expect(result.citations.primarySources.length).toBeGreaterThan(0);
        
        // Check citation quality
        result.citations.primarySources.forEach(source => {
          expect(source.credibilityRating).toMatch(/^[ABC]$/);
          expect(source.title).toBeDefined();
          expect(source.publisher).toBeDefined();
        });

        expect(result.confidence).toBeGreaterThan(60);
      }
    }, 60000);

    it('should provide confidence intervals for quantitative claims', async () => {
      const businessCaseResult = await toolRegistry.callTool('generate_business_case', {
        opportunity_analysis: "Large market opportunity in AI automation",
        financial_inputs: {
          development_cost: 300000,
          expected_revenue: 1200000,
          operational_cost: 150000,
          time_to_market: 12
        }
      });

      expect(businessCaseResult.content[0].text).toMatch(/\d+%.*confidence/i);
      expect(businessCaseResult.content[0].text).toMatch(/±\s*\d+/); // Confidence intervals
    }, 20000);
  });
});