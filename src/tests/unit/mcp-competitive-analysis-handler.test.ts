/**
 * Unit tests for MCP competitive analysis tool handler
 */

import { PMAgentMCPServer } from '../../mcp/server';
import { CompetitiveAnalysisArgs } from '../../models/competitive';
import { MCPToolContext, MCPErrorCode } from '../../models/mcp';

describe('MCP Competitive Analysis Handler', () => {
  let server: PMAgentMCPServer;
  let mockContext: MCPToolContext;

  beforeEach(() => {
    server = new PMAgentMCPServer({ enableLogging: false });
    mockContext = {
      toolName: 'analyze_competitor_landscape',
      sessionId: 'test-session-123',
      timestamp: Date.now(),
      requestId: 'test-request-123',
      traceId: 'test-trace-123'
    };
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('handleAnalyzeCompetitorLandscape', () => {
    it('should successfully analyze competitor landscape with minimal input', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'AI-powered project management tool for software teams',
        analysis_depth: 'standard'
      };

      const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      expect(result.metadata?.executionTime).toBeGreaterThan(0);
      expect(result.metadata?.quotaUsed).toBe(3); // Standard analysis uses 3 quota units

      const analysisData = result.content[0].json.data;
      expect(analysisData).toHaveProperty('competitiveMatrix');
      expect(analysisData).toHaveProperty('swotAnalysis');
      expect(analysisData).toHaveProperty('marketPositioning');
      expect(analysisData).toHaveProperty('strategicRecommendations');
      expect(analysisData).toHaveProperty('sourceAttribution');
      expect(analysisData).toHaveProperty('confidenceLevel');
      expect(analysisData.confidenceLevel).toBe('medium');
    });

    it('should handle comprehensive analysis with market context', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Enterprise collaboration platform with AI features',
        market_context: {
          industry: 'Software',
          geography: ['US', 'EU'],
          target_segment: 'Enterprise'
        },
        analysis_depth: 'comprehensive'
      };

      const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.metadata?.quotaUsed).toBe(4); // Comprehensive analysis uses 4 quota units

      const analysisData = result.content[0].json.data;
      expect(analysisData.confidenceLevel).toBe('high');
      expect(analysisData.competitiveMatrix.marketContext.industry).toBe('Software');
    });

    it('should handle quick analysis with reduced quota usage', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Simple task tracking app',
        analysis_depth: 'quick'
      };

      const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.metadata?.quotaUsed).toBe(2); // Quick analysis uses 2 quota units

      const analysisData = result.content[0].json.data;
      expect(analysisData.confidenceLevel).toBe('low');
    });

    it('should create steering file when requested', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'AI-powered project management tool',
        analysis_depth: 'standard',
        steering_options: {
          create_steering_files: true,
          feature_name: 'ai-project-mgmt',
          inclusion_rule: 'fileMatch',
          file_match_pattern: 'competitive*'
        }
      };

      const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.metadata?.steeringFileCreated).toBe(true);
      expect(result.metadata?.steeringFiles).toBeDefined();
      expect(result.metadata?.steeringFiles).toHaveLength(1);
    });

    it('should validate required arguments', async () => {
      const invalidArgs = {} as CompetitiveAnalysisArgs;

      const result = await server.handleAnalyzeCompetitorLandscape(invalidArgs, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].json.message).toContain('feature_idea is required');
    });

    it('should handle empty feature idea', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: '',
        analysis_depth: 'standard'
      };

      const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].json.message).toContain('feature_idea is required');
    });

    it('should include proper source attribution', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Enterprise software solution',
        analysis_depth: 'standard'
      };

      const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);

      expect(result.isError).toBe(false);

      const analysisData = result.content[0].json.data;
      expect(analysisData.sourceAttribution).toHaveLength(1);
      expect(analysisData.sourceAttribution[0]).toHaveProperty('type');
      expect(analysisData.sourceAttribution[0]).toHaveProperty('reliability');
      expect(analysisData.sourceAttribution[0]).toHaveProperty('relevance');
      expect(analysisData.sourceAttribution[0]).toHaveProperty('citationFormat');
    });

    it('should include competitive matrix with proper structure', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Project management software',
        analysis_depth: 'standard'
      };

      const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);

      expect(result.isError).toBe(false);

      const analysisData = result.content[0].json.data;
      const matrix = analysisData.competitiveMatrix;
      
      expect(matrix).toHaveProperty('competitors');
      expect(matrix).toHaveProperty('evaluationCriteria');
      expect(matrix).toHaveProperty('rankings');
      expect(matrix).toHaveProperty('differentiationOpportunities');
      expect(matrix).toHaveProperty('marketContext');
      
      expect(Array.isArray(matrix.competitors)).toBe(true);
      expect(Array.isArray(matrix.evaluationCriteria)).toBe(true);
      expect(Array.isArray(matrix.differentiationOpportunities)).toBe(true);
    });

    it('should include strategic recommendations', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'AI-powered analytics platform',
        analysis_depth: 'comprehensive'
      };

      const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);

      expect(result.isError).toBe(false);

      const analysisData = result.content[0].json.data;
      expect(analysisData.strategicRecommendations).toHaveLength(1);
      
      const recommendation = analysisData.strategicRecommendations[0];
      expect(recommendation).toHaveProperty('type');
      expect(recommendation).toHaveProperty('title');
      expect(recommendation).toHaveProperty('description');
      expect(recommendation).toHaveProperty('rationale');
      expect(recommendation).toHaveProperty('riskLevel');
      expect(recommendation).toHaveProperty('timeframe');
    });

    it('should handle analysis depth parameter correctly', async () => {
      const testCases = [
        { depth: 'quick' as const, expectedQuota: 2, expectedConfidence: 'low' as const },
        { depth: 'standard' as const, expectedQuota: 3, expectedConfidence: 'medium' as const },
        { depth: 'comprehensive' as const, expectedQuota: 4, expectedConfidence: 'high' as const }
      ];

      for (const testCase of testCases) {
        const args: CompetitiveAnalysisArgs = {
          feature_idea: 'Test feature for depth analysis',
          analysis_depth: testCase.depth
        };

        const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);

        expect(result.isError).toBe(false);
        expect(result.metadata?.quotaUsed).toBe(testCase.expectedQuota);
        expect(result.content[0].json.data.confidenceLevel).toBe(testCase.expectedConfidence);
      }
    });
  });
});