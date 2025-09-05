/**
 * Unit tests for MCP enhanced business opportunity tool handler
 */

import { PMAgentMCPServer } from '../../mcp/server';
import { EnhancedBusinessOpportunityArgs } from '../../models/competitive';
import { MCPToolContext } from '../../models/mcp';

describe('MCP Enhanced Business Opportunity Handler', () => {
  let server: PMAgentMCPServer;
  let mockContext: MCPToolContext;

  beforeEach(() => {
    server = new PMAgentMCPServer({ enableLogging: false });
    mockContext = {
      toolName: 'analyze_business_opportunity',
      sessionId: 'test-session-789',
      timestamp: Date.now(),
      requestId: 'test-request-789',
      traceId: 'test-trace-789'
    };
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('handleAnalyzeBusinessOpportunity', () => {
    it('should successfully analyze business opportunity with minimal input', async () => {
      const args: EnhancedBusinessOpportunityArgs = {
        feature_idea: 'AI-powered project management tool for software teams'
      };

      const result = await server.handleAnalyzeBusinessOpportunity(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      expect(result.metadata?.executionTime).toBeGreaterThan(0);

      const opportunityData = result.content[0].json;
      expect(opportunityData).toHaveProperty('featureIdea');
      expect(opportunityData).toHaveProperty('strategicFit');
      expect(opportunityData).toHaveProperty('marketTiming');
      expect(opportunityData).toHaveProperty('overallAssessment');
    });

    it('should include competitive analysis when requested', async () => {
      const args: EnhancedBusinessOpportunityArgs = {
        feature_idea: 'Enterprise collaboration platform',
        market_context: {
          industry: 'Software',
          geography: ['US'],
          target_segment: 'Enterprise'
        },
        include_competitive_analysis: true,
        analysis_depth: 'standard'
      };

      const result = await server.handleAnalyzeBusinessOpportunity(args, mockContext);

      expect(result.isError).toBe(false);
      const opportunityData = result.content[0].json;
      expect(opportunityData).toHaveProperty('competitiveAnalysis');
      expect(opportunityData.competitiveAnalysis).toBeDefined();
    });

    it('should include market sizing when requested', async () => {
      const args: EnhancedBusinessOpportunityArgs = {
        feature_idea: 'AI analytics platform',
        market_context: {
          industry: 'Analytics',
          geography: ['US', 'EU'],
          target_segment: 'SMB'
        },
        include_market_sizing: true
      };

      const result = await server.handleAnalyzeBusinessOpportunity(args, mockContext);

      expect(result.isError).toBe(false);
      const opportunityData = result.content[0].json;
      expect(opportunityData).toHaveProperty('marketSizing');
      expect(opportunityData.marketSizing).toBeDefined();
    });

    it('should exclude competitive analysis when not requested', async () => {
      const args: EnhancedBusinessOpportunityArgs = {
        feature_idea: 'Simple task tracker',
        include_competitive_analysis: false
      };

      const result = await server.handleAnalyzeBusinessOpportunity(args, mockContext);

      expect(result.isError).toBe(false);
      const opportunityData = result.content[0].json;
      expect(opportunityData.competitiveAnalysis).toBeUndefined();
    });

    it('should exclude market sizing when not requested', async () => {
      const args: EnhancedBusinessOpportunityArgs = {
        feature_idea: 'Basic utility app',
        include_market_sizing: false
      };

      const result = await server.handleAnalyzeBusinessOpportunity(args, mockContext);

      expect(result.isError).toBe(false);
      const opportunityData = result.content[0].json;
      expect(opportunityData.marketSizing).toBeUndefined();
    });

    it('should calculate quota usage correctly', async () => {
      const testCases = [
        { 
          args: { feature_idea: 'Test', include_competitive_analysis: false, include_market_sizing: false },
          expectedQuota: 2 
        },
        { 
          args: { feature_idea: 'Test', include_competitive_analysis: true, include_market_sizing: false, analysis_depth: 'quick' as const },
          expectedQuota: 4 // 2 base + 2 competitive
        },
        { 
          args: { feature_idea: 'Test', include_competitive_analysis: false, include_market_sizing: true },
          expectedQuota: 6 // 2 base + 4 market sizing
        },
        { 
          args: { feature_idea: 'Test', include_competitive_analysis: true, include_market_sizing: true, analysis_depth: 'comprehensive' as const },
          expectedQuota: 10 // 2 base + 4 competitive + 4 market sizing
        }
      ];

      for (const testCase of testCases) {
        const result = await server.handleAnalyzeBusinessOpportunity(testCase.args as EnhancedBusinessOpportunityArgs, mockContext);
        expect(result.isError).toBe(false);
        expect(result.metadata?.quotaUsed).toBe(testCase.expectedQuota);
      }
    });

    it('should validate required arguments', async () => {
      const invalidArgs = {} as EnhancedBusinessOpportunityArgs;

      const result = await server.handleAnalyzeBusinessOpportunity(invalidArgs, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('feature_idea is required');
    });

    it('should include strategic fit assessment', async () => {
      const args: EnhancedBusinessOpportunityArgs = {
        feature_idea: 'AI-powered analytics platform'
      };

      const result = await server.handleAnalyzeBusinessOpportunity(args, mockContext);

      expect(result.isError).toBe(false);
      const opportunityData = result.content[0].json;
      
      expect(opportunityData.strategicFit).toBeDefined();
      expect(opportunityData.strategicFit).toHaveProperty('alignmentScore');
      expect(opportunityData.strategicFit).toHaveProperty('competitiveAdvantage');
      expect(opportunityData.strategicFit).toHaveProperty('marketGaps');
      expect(opportunityData.strategicFit).toHaveProperty('entryBarriers');
      expect(opportunityData.strategicFit).toHaveProperty('successFactors');
    });

    it('should include market timing analysis', async () => {
      const args: EnhancedBusinessOpportunityArgs = {
        feature_idea: 'Digital transformation platform'
      };

      const result = await server.handleAnalyzeBusinessOpportunity(args, mockContext);

      expect(result.isError).toBe(false);
      const opportunityData = result.content[0].json;
      
      expect(opportunityData.marketTiming).toBeDefined();
      expect(opportunityData.marketTiming).toHaveProperty('readiness');
      expect(opportunityData.marketTiming).toHaveProperty('factors');
      expect(opportunityData.marketTiming).toHaveProperty('risks');
      expect(opportunityData.marketTiming).toHaveProperty('recommendation');
    });

    it('should include overall assessment with recommendations', async () => {
      const args: EnhancedBusinessOpportunityArgs = {
        feature_idea: 'Enterprise software solution'
      };

      const result = await server.handleAnalyzeBusinessOpportunity(args, mockContext);

      expect(result.isError).toBe(false);
      const opportunityData = result.content[0].json;
      
      expect(opportunityData.overallAssessment).toBeDefined();
      expect(opportunityData.overallAssessment).toHaveProperty('opportunityScore');
      expect(opportunityData.overallAssessment).toHaveProperty('confidence');
      expect(opportunityData.overallAssessment).toHaveProperty('recommendation');
      expect(opportunityData.overallAssessment).toHaveProperty('keyRisks');
      expect(opportunityData.overallAssessment).toHaveProperty('nextSteps');
      
      expect(Array.isArray(opportunityData.overallAssessment.keyRisks)).toBe(true);
      expect(Array.isArray(opportunityData.overallAssessment.nextSteps)).toBe(true);
    });

    it('should create steering file when requested', async () => {
      const args: EnhancedBusinessOpportunityArgs = {
        feature_idea: 'AI-powered business platform',
        steering_options: {
          create_steering_files: true,
          feature_name: 'ai-business-platform',
          inclusion_rule: 'fileMatch',
          file_match_pattern: 'business*'
        }
      };

      const result = await server.handleAnalyzeBusinessOpportunity(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.metadata?.steeringFileCreated).toBe(true);
      expect(result.metadata?.steeringFiles).toBeDefined();
      expect(result.metadata?.steeringFiles).toHaveLength(1);
    });
  });
});