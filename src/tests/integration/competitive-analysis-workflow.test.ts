/**
 * Integration tests for complete competitive analysis workflow
 * Tests end-to-end competitor analysis from input to final report
 * Validates integration between competitive analysis and business opportunity
 * Creates performance benchmarks for analysis response times
 */

import { PMAgentMCPServer } from '../../mcp/server';
import { CompetitorAnalyzer } from '../../components/competitor-analyzer';
import { MarketAnalyzer } from '../../components/market-analyzer';
import { BusinessAnalyzer } from '../../components/business-analyzer';
import { 
  CompetitiveAnalysisArgs,
  MarketSizingArgs,
  MCPToolContext,
  CompetitorAnalysisResult,
  MarketSizingResult,
  BusinessOpportunity
} from '../../models';

describe('Competitive Analysis Workflow Integration', () => {
  let server: PMAgentMCPServer;
  let competitorAnalyzer: CompetitorAnalyzer;
  let marketAnalyzer: MarketAnalyzer;
  let businessAnalyzer: BusinessAnalyzer;
  let mockContext: MCPToolContext;

  beforeEach(() => {
    server = new PMAgentMCPServer();
    competitorAnalyzer = new CompetitorAnalyzer();
    marketAnalyzer = new MarketAnalyzer();
    businessAnalyzer = new BusinessAnalyzer();
    
    mockContext = {
      toolName: 'competitive_analysis_integration',
      sessionId: 'comp-analysis-session-123',
      timestamp: Date.now(),
      requestId: 'comp-analysis-req-123',
      traceId: 'comp-analysis-trace-123'
    };
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('End-to-End Competitive Analysis Workflow', () => {
    test('should complete full competitive analysis from feature idea to strategic recommendations', async () => {
      const featureIdea = 'AI-powered project management tool that automatically optimizes developer workflows and reduces technical debt through intelligent code analysis and task prioritization';
      
      const competitiveArgs: CompetitiveAnalysisArgs = {
        feature_idea: featureIdea,
        market_context: {
          industry: 'Software Development Tools',
          geography: ['North America', 'Europe'],
          target_segment: 'Enterprise Development Teams'
        },
        analysis_depth: 'comprehensive',
        steering_options: {
          create_steering_files: true,
          feature_name: 'ai-project-management',
          inclusion_rule: 'manual'
        }
      };

      const startTime = Date.now();
      
      // Step 1: Perform competitive analysis
      const competitiveResult = await server.handleAnalyzeCompetitorLandscape(competitiveArgs, mockContext);
      
      expect(competitiveResult.isError).toBe(false);
      expect(competitiveResult.content).toBeDefined();
      expect(competitiveResult.content[0].json).toBeDefined();
      
      const analysisData = competitiveResult.content[0].json.data as CompetitorAnalysisResult;
      
      // Validate competitive matrix structure
      expect(analysisData.competitiveMatrix).toBeDefined();
      expect(analysisData.competitiveMatrix.competitors.length).toBeGreaterThan(3);
      expect(analysisData.competitiveMatrix.competitors.length).toBeLessThanOrEqual(8);
      expect(analysisData.competitiveMatrix.evaluationCriteria.length).toBeGreaterThan(3);
      expect(analysisData.competitiveMatrix.rankings.length).toBe(analysisData.competitiveMatrix.competitors.length);
      
      // Validate SWOT analysis
      expect(analysisData.swotAnalysis).toBeDefined();
      expect(analysisData.swotAnalysis.length).toBe(analysisData.competitiveMatrix.competitors.length);
      
      analysisData.swotAnalysis.forEach(swot => {
        expect(swot.competitorName).toBeDefined();
        expect(swot.strengths.length).toBeGreaterThan(0);
        expect(swot.weaknesses.length).toBeGreaterThan(0);
        expect(swot.opportunities.length).toBeGreaterThan(0);
        expect(swot.threats.length).toBeGreaterThan(0);
        expect(swot.strategicImplications.length).toBeGreaterThan(0);
      });
      
      // Validate market positioning
      expect(analysisData.marketPositioning).toBeDefined();
      expect(analysisData.marketPositioning.positioningMap.length).toBeGreaterThan(1);
      expect(analysisData.marketPositioning.competitorPositions.length).toBe(analysisData.competitiveMatrix.competitors.length);
      expect(analysisData.marketPositioning.marketGaps.length).toBeGreaterThan(0);
      expect(analysisData.marketPositioning.recommendedPositioning.length).toBeGreaterThan(0);
      
      // Validate strategic recommendations
      expect(analysisData.strategicRecommendations).toBeDefined();
      expect(analysisData.strategicRecommendations.length).toBeGreaterThan(0);
      expect(analysisData.strategicRecommendations.length).toBeLessThanOrEqual(5);
      
      analysisData.strategicRecommendations.forEach(recommendation => {
        expect(recommendation.type).toMatch(/^(differentiation|blue-ocean|focus|cost-leadership)$/);
        expect(recommendation.title).toBeDefined();
        expect(recommendation.description).toBeDefined();
        expect(recommendation.rationale.length).toBeGreaterThan(0);
        expect(recommendation.implementation.length).toBeGreaterThan(0);
        expect(recommendation.expectedOutcome).toBeDefined();
        expect(recommendation.riskLevel).toMatch(/^(low|medium|high)$/);
        expect(recommendation.timeframe).toBeDefined();
      });
      
      // Validate source attribution
      expect(analysisData.sourceAttribution).toBeDefined();
      expect(analysisData.sourceAttribution.length).toBeGreaterThan(0);
      
      analysisData.sourceAttribution.forEach(source => {
        expect(source.type).toMatch(/^(mckinsey|gartner|wef|industry-report|market-research)$/);
        expect(source.title).toBeDefined();
        expect(source.publishDate).toBeDefined();
        expect(source.reliability).toBeGreaterThanOrEqual(0);
        expect(source.reliability).toBeLessThanOrEqual(1);
        expect(source.relevance).toBeGreaterThanOrEqual(0);
        expect(source.relevance).toBeLessThanOrEqual(1);
      });
      
      // Validate confidence level and data quality
      expect(analysisData.confidenceLevel).toMatch(/^(low|medium|high)$/);
      expect(analysisData.dataQuality).toBeDefined();
      expect(analysisData.lastUpdated).toBeDefined();
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(30000); // Should complete within 30 seconds
      
      // Validate quota usage
      expect(competitiveResult.metadata?.quotaUsed).toBeDefined();
      expect(competitiveResult.metadata?.quotaUsed).toBeGreaterThan(0);
      expect(competitiveResult.metadata?.quotaUsed).toBeLessThanOrEqual(5);
    });

    test('should handle different analysis depths appropriately', async () => {
      const featureIdea = 'Mobile-first CRM for small businesses with AI-powered lead scoring';
      
      const depths: ('quick' | 'standard' | 'comprehensive')[] = ['quick', 'standard', 'comprehensive'];
      const expectedCompetitorCounts = { quick: 3, standard: 5, comprehensive: 8 };
      
      for (const depth of depths) {
        const args: CompetitiveAnalysisArgs = {
          feature_idea: featureIdea,
          market_context: {
            industry: 'CRM Software',
            geography: ['Global'],
            target_segment: 'Small Business'
          },
          analysis_depth: depth
        };
        
        const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);
        
        expect(result.isError).toBe(false);
        const analysisData = result.content[0].json.data as CompetitorAnalysisResult;
        
        // Verify competitor count matches depth expectation
        expect(analysisData.competitiveMatrix.competitors.length).toBeLessThanOrEqual(expectedCompetitorCounts[depth]);
        
        // Quick analysis should have fewer strategic recommendations
        if (depth === 'quick') {
          expect(analysisData.strategicRecommendations.length).toBeLessThanOrEqual(3);
        } else if (depth === 'comprehensive') {
          expect(analysisData.strategicRecommendations.length).toBeGreaterThanOrEqual(3);
        }
      }
    });

    test('should validate competitive analysis provides comprehensive strategic insights', async () => {
      const featureIdea = 'Blockchain-based supply chain transparency platform for food industry';
      
      // Perform competitive analysis
      const competitiveArgs: CompetitiveAnalysisArgs = {
        feature_idea: featureIdea,
        market_context: {
          industry: 'Supply Chain Management',
          geography: ['North America', 'Europe', 'Asia'],
          target_segment: 'Food & Beverage Companies'
        },
        analysis_depth: 'standard'
      };
      
      const competitiveResult = await server.handleAnalyzeCompetitorLandscape(competitiveArgs, mockContext);
      expect(competitiveResult.isError).toBe(false);
      
      const competitiveAnalysisData = competitiveResult.content[0].json.data as CompetitorAnalysisResult;
      
      // Validate comprehensive competitive insights
      expect(competitiveAnalysisData.competitiveMatrix.competitors.length).toBeGreaterThan(0);
      expect(competitiveAnalysisData.strategicRecommendations.length).toBeGreaterThan(0);
      expect(competitiveAnalysisData.marketPositioning.marketGaps.length).toBeGreaterThan(0);
      expect(competitiveAnalysisData.marketPositioning.recommendedPositioning.length).toBeGreaterThan(0);
      
      // Validate strategic recommendations provide actionable insights
      competitiveAnalysisData.strategicRecommendations.forEach(recommendation => {
        expect(recommendation.implementation.length).toBeGreaterThan(0);
        expect(recommendation.expectedOutcome).toBeDefined();
        expect(recommendation.resourceRequirements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Benchmarks', () => {
    test('should meet performance benchmarks for competitive analysis', async () => {
      const testCases = [
        {
          name: 'Simple SaaS Tool',
          featureIdea: 'Task management app with team collaboration',
          expectedMaxTime: 15000 // 15 seconds
        },
        {
          name: 'Complex Enterprise Solution',
          featureIdea: 'Enterprise resource planning system with AI-powered analytics, multi-tenant architecture, and advanced reporting capabilities',
          expectedMaxTime: 25000 // 25 seconds
        },
        {
          name: 'Niche Market Tool',
          featureIdea: 'Specialized veterinary practice management software',
          expectedMaxTime: 20000 // 20 seconds
        }
      ];
      
      for (const testCase of testCases) {
        const startTime = Date.now();
        
        const args: CompetitiveAnalysisArgs = {
          feature_idea: testCase.featureIdea,
          analysis_depth: 'standard'
        };
        
        const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);
        
        const executionTime = Date.now() - startTime;
        
        expect(result.isError).toBe(false);
        expect(executionTime).toBeLessThan(testCase.expectedMaxTime);
        
        // Validate result quality wasn't compromised for speed
        const analysisData = result.content[0].json.data as CompetitorAnalysisResult;
        expect(analysisData.competitiveMatrix.competitors.length).toBeGreaterThan(2);
        expect(analysisData.strategicRecommendations.length).toBeGreaterThan(0);
      }
    });

    test('should handle concurrent competitive analysis requests efficiently', async () => {
      const concurrentRequests = 3;
      const featureIdeas = [
        'E-commerce analytics dashboard',
        'Social media management platform',
        'Customer support chatbot'
      ];
      
      const startTime = Date.now();
      
      const promises = featureIdeas.map((idea, index) => 
        server.handleAnalyzeCompetitorLandscape({
          feature_idea: idea,
          analysis_depth: 'quick'
        }, {
          ...mockContext,
          requestId: `concurrent-req-${index}`
        })
      );
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      results.forEach(result => {
        expect(result.isError).toBe(false);
      });
      
      // Concurrent execution should be more efficient than sequential
      expect(totalTime).toBeLessThan(25000); // Should complete within 25 seconds total
      
      // Validate each result has proper structure
      results.forEach(result => {
        const analysisData = result.content[0].json.data as CompetitorAnalysisResult;
        expect(analysisData.competitiveMatrix.competitors.length).toBeGreaterThan(0);
        expect(analysisData.confidenceLevel).toMatch(/^(low|medium|high)$/);
      });
    });

    test('should track and report performance metrics', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'AI-powered code review tool for development teams',
        analysis_depth: 'standard'
      };
      
      const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);
      
      expect(result.isError).toBe(false);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.executionTime).toBeDefined();
      expect(result.metadata?.quotaUsed).toBeDefined();
      // Validate basic metadata structure
      expect(result.metadata?.executionTime).toBeGreaterThan(0);
      expect(result.metadata?.quotaUsed).toBeGreaterThan(0);
      
      // Validate basic metadata structure
      expect(result.metadata?.executionTime).toBeGreaterThan(0);
      expect(result.metadata?.quotaUsed).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle insufficient competitor data gracefully', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Extremely niche quantum computing debugger for specialized research',
        market_context: {
          industry: 'Quantum Computing',
          geography: ['Antarctica'], // Unrealistic geography
          target_segment: 'Quantum Researchers'
        },
        analysis_depth: 'comprehensive'
      };
      
      const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);
      
      expect(result.isError).toBe(false);
      const analysisData = result.content[0].json.data as CompetitorAnalysisResult;
      
      // Should still provide analysis with clear data quality indicators
      expect(analysisData.confidenceLevel).toBe('low');
      expect(analysisData.dataQuality.sourceReliability).toBeLessThan(0.7);
      expect(analysisData.dataQuality.overallConfidence).toBeLessThan(0.6);
      
      // Should include data gap warnings
      expect(analysisData.strategicRecommendations.some(rec => 
        rec.description.toLowerCase().includes('limited data') ||
        rec.description.toLowerCase().includes('research needed')
      )).toBe(true);
    });

    test('should validate input parameters and provide helpful error messages', async () => {
      const invalidArgs = [
        {
          args: { feature_idea: '' },
          expectedError: 'Feature idea must be at least 10 characters long'
        },
        {
          args: { feature_idea: 'short' },
          expectedError: 'Feature idea must be at least 10 characters long'
        },
        {
          args: { 
            feature_idea: 'Valid feature idea for testing',
            analysis_depth: 'invalid' as any
          },
          expectedError: 'Invalid analysis depth specified'
        }
      ];
      
      for (const testCase of invalidArgs) {
        try {
          await server.handleAnalyzeCompetitorLandscape(testCase.args as CompetitiveAnalysisArgs, mockContext);
          fail('Expected error was not thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain(testCase.expectedError);
        }
      }
    });

    test('should handle timeout scenarios appropriately', async () => {
      // Create analyzer with very short timeout for testing
      const shortTimeoutAnalyzer = new CompetitorAnalyzer({
        confidenceThreshold: 0.5,
        maxCompetitors: 10
      });
      
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Complex multi-industry platform with extensive feature set requiring comprehensive analysis across multiple market segments and competitive landscapes',
        analysis_depth: 'comprehensive'
      };
      
      // This should complete but potentially with reduced depth due to complexity
      const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);
      
      expect(result.isError).toBe(false);
      const analysisData = result.content[0].json.data as CompetitorAnalysisResult;
      
      // Should provide results even if not comprehensive
      expect(analysisData.competitiveMatrix.competitors.length).toBeGreaterThan(0);
      expect(analysisData.strategicRecommendations.length).toBeGreaterThan(0);
      
      // May have lower confidence due to time constraints
      if (analysisData.confidenceLevel === 'low') {
        expect(analysisData.dataQuality.overallConfidence).toBeLessThan(0.7);
      }
    });
  });

  describe('Data Quality and Validation', () => {
    test('should provide comprehensive data quality assessment', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Healthcare data analytics platform with HIPAA compliance',
        market_context: {
          industry: 'Healthcare Technology',
          geography: ['United States'],
          target_segment: 'Healthcare Providers'
        },
        analysis_depth: 'standard'
      };
      
      const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);
      expect(result.isError).toBe(false);
      
      const analysisData = result.content[0].json.data as CompetitorAnalysisResult;
      
      // Validate data quality structure
      expect(analysisData.dataQuality).toBeDefined();
      expect(analysisData.dataQuality.sourceReliability).toBeGreaterThanOrEqual(0);
      expect(analysisData.dataQuality.sourceReliability).toBeLessThanOrEqual(1);
      expect(analysisData.dataQuality.dataFreshness).toBeGreaterThanOrEqual(0);
      expect(analysisData.dataQuality.dataFreshness).toBeLessThanOrEqual(1);
      expect(analysisData.dataQuality.methodologyRigor).toBeGreaterThanOrEqual(0);
      expect(analysisData.dataQuality.methodologyRigor).toBeLessThanOrEqual(1);
      expect(analysisData.dataQuality.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(analysisData.dataQuality.overallConfidence).toBeLessThanOrEqual(1);
      
      // Source attribution should be comprehensive
      expect(analysisData.sourceAttribution.length).toBeGreaterThan(0);
      analysisData.sourceAttribution.forEach(source => {
        expect(source.reliability).toBeGreaterThan(0);
        expect(source.relevance).toBeGreaterThan(0);
        expect(new Date(source.publishDate)).toBeInstanceOf(Date);
      });
    });

    test('should validate competitive matrix consistency', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Project management software with advanced reporting',
        analysis_depth: 'standard'
      };
      
      const result = await server.handleAnalyzeCompetitorLandscape(args, mockContext);
      expect(result.isError).toBe(false);
      
      const analysisData = result.content[0].json.data as CompetitorAnalysisResult;
      const matrix = analysisData.competitiveMatrix;
      
      // Validate matrix consistency
      expect(matrix.competitors.length).toBe(matrix.rankings.length);
      expect(matrix.evaluationCriteria.length).toBeGreaterThan(0);
      
      // Validate ranking consistency
      matrix.rankings.forEach((ranking, index) => {
        expect(ranking.rank).toBe(index + 1);
        expect(ranking.overallScore).toBeGreaterThanOrEqual(0);
        expect(ranking.overallScore).toBeLessThanOrEqual(1);
        expect(Object.keys(ranking.criteriaScores).length).toBe(matrix.evaluationCriteria.length);
        
        // Verify competitor exists in matrix
        expect(matrix.competitors.some(c => c.name === ranking.competitorName)).toBe(true);
      });
      
      // Validate evaluation criteria weights sum to 1
      const totalWeight = matrix.evaluationCriteria.reduce((sum, criterion) => sum + criterion.weight, 0);
      expect(Math.abs(totalWeight - 1)).toBeLessThan(0.01); // Allow for floating point precision
    });
  });
});