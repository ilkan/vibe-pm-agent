/**
 * Unit Tests for Competitor Analysis Component
 * 
 * Tests the core competitive analysis functionality including competitor identification,
 * competitive matrix generation, and ranking algorithms.
 */

import {
  CompetitorAnalyzer,
  createCompetitorAnalyzer,
  formatCompetitiveAnalysisResult
} from '../../components/competitor-analyzer';
import {
  CompetitiveAnalysisArgs,
  CompetitorAnalysisResult,
  CompetitiveAnalysisError,
  COMPETITIVE_ANALYSIS_DEFAULTS
} from '../../models/competitive';

describe('CompetitorAnalyzer', () => {
  let analyzer: CompetitorAnalyzer;

  beforeEach(() => {
    analyzer = createCompetitorAnalyzer();
  });

  describe('Constructor and Configuration', () => {
    it('should create analyzer with default configuration', () => {
      const defaultAnalyzer = new CompetitorAnalyzer();
      expect(defaultAnalyzer).toBeInstanceOf(CompetitorAnalyzer);
    });

    it('should create analyzer with custom configuration', () => {
      const customAnalyzer = new CompetitorAnalyzer({
        confidenceThreshold: 0.8,
        maxCompetitors: 15,
        minCompetitors: 5
      });
      expect(customAnalyzer).toBeInstanceOf(CompetitorAnalyzer);
    });

    it('should use factory function to create analyzer', () => {
      const factoryAnalyzer = createCompetitorAnalyzer({
        confidenceThreshold: 0.9
      });
      expect(factoryAnalyzer).toBeInstanceOf(CompetitorAnalyzer);
    });
  });

  describe('Input Validation', () => {
    it('should validate feature idea length', async () => {
      const shortFeatureArgs: CompetitiveAnalysisArgs = {
        feature_idea: 'short',
        analysis_depth: 'standard'
      };

      await expect(analyzer.analyzeCompetitors(shortFeatureArgs))
        .rejects
        .toThrow(CompetitiveAnalysisError);
    });

    it('should validate analysis depth values', async () => {
      const invalidDepthArgs: CompetitiveAnalysisArgs = {
        feature_idea: 'A comprehensive fintech payment platform for small businesses',
        analysis_depth: 'invalid' as any
      };

      await expect(analyzer.analyzeCompetitors(invalidDepthArgs))
        .rejects
        .toThrow(CompetitiveAnalysisError);
    });

    it('should accept valid input parameters', async () => {
      const validArgs: CompetitiveAnalysisArgs = {
        feature_idea: 'A comprehensive fintech payment platform for small businesses',
        analysis_depth: 'standard',
        market_context: {
          industry: 'Financial Services',
          geography: ['North America', 'Europe'],
          target_segment: 'SMB'
        }
      };

      const result = await analyzer.analyzeCompetitors(validArgs);
      expect(result).toBeDefined();
      expect(result.competitiveMatrix).toBeDefined();
    });
  });

  describe('Competitor Identification', () => {
    it('should identify competitors for fintech feature', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Mobile payment processing app with AI fraud detection',
        analysis_depth: 'standard'
      };

      const result = await analyzer.analyzeCompetitors(args);
      
      expect(result.competitiveMatrix.competitors).toBeDefined();
      expect(result.competitiveMatrix.competitors.length).toBeGreaterThan(0);
      expect(result.competitiveMatrix.competitors.length).toBeLessThanOrEqual(COMPETITIVE_ANALYSIS_DEFAULTS.MAX_COMPETITORS);
    });

    it('should identify competitors for healthcare feature', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Telemedicine platform with integrated patient records',
        market_context: {
          industry: 'Healthcare',
          geography: ['Global'],
          target_segment: 'Healthcare Providers'
        },
        analysis_depth: 'comprehensive'
      };

      const result = await analyzer.analyzeCompetitors(args);
      
      expect(result.competitiveMatrix.competitors).toBeDefined();
      expect(result.competitiveMatrix.competitors.length).toBeGreaterThan(0);
      
      // Check that competitors have healthcare-relevant characteristics
      const hasHealthcareCompetitors = result.competitiveMatrix.competitors.some(
        competitor => competitor.name.toLowerCase().includes('health')
      );
      expect(hasHealthcareCompetitors).toBe(true);
    });

    it('should limit competitors based on analysis depth', async () => {
      const quickArgs: CompetitiveAnalysisArgs = {
        feature_idea: 'E-commerce analytics dashboard with real-time insights',
        analysis_depth: 'quick'
      };

      const comprehensiveArgs: CompetitiveAnalysisArgs = {
        feature_idea: 'E-commerce analytics dashboard with real-time insights',
        analysis_depth: 'comprehensive'
      };

      const quickResult = await analyzer.analyzeCompetitors(quickArgs);
      const comprehensiveResult = await analyzer.analyzeCompetitors(comprehensiveArgs);

      expect(quickResult.competitiveMatrix.competitors.length).toBeLessThanOrEqual(3);
      expect(comprehensiveResult.competitiveMatrix.competitors.length).toBeGreaterThan(quickResult.competitiveMatrix.competitors.length);
    });
  });

  describe('Competitive Matrix Generation', () => {
    let analysisResult: CompetitorAnalysisResult;

    beforeEach(async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'SaaS project management tool with AI-powered scheduling',
        analysis_depth: 'standard'
      };
      analysisResult = await analyzer.analyzeCompetitors(args);
    });

    it('should generate competitive matrix with evaluation criteria', () => {
      const matrix = analysisResult.competitiveMatrix;
      
      expect(matrix.evaluationCriteria).toBeDefined();
      expect(matrix.evaluationCriteria.length).toBeGreaterThan(0);
      
      // Check that criteria have required properties
      matrix.evaluationCriteria.forEach(criterion => {
        expect(criterion.name).toBeDefined();
        expect(criterion.weight).toBeGreaterThan(0);
        expect(criterion.weight).toBeLessThanOrEqual(1);
        expect(criterion.description).toBeDefined();
        expect(['quantitative', 'qualitative']).toContain(criterion.measurementType);
      });
    });

    it('should generate competitor rankings', () => {
      const matrix = analysisResult.competitiveMatrix;
      
      expect(matrix.rankings).toBeDefined();
      expect(matrix.rankings.length).toBe(matrix.competitors.length);
      
      // Check ranking properties
      matrix.rankings.forEach((ranking, index) => {
        expect(ranking.competitorName).toBeDefined();
        expect(ranking.overallScore).toBeGreaterThan(0);
        expect(ranking.rank).toBe(index + 1);
        expect(ranking.criteriaScores).toBeDefined();
        expect(ranking.competitiveAdvantage).toBeDefined();
      });
    });

    it('should identify differentiation opportunities', () => {
      const matrix = analysisResult.competitiveMatrix;
      
      expect(matrix.differentiationOpportunities).toBeDefined();
      expect(matrix.differentiationOpportunities.length).toBeGreaterThan(0);
      
      // Check that opportunities are meaningful strings
      matrix.differentiationOpportunities.forEach(opportunity => {
        expect(typeof opportunity).toBe('string');
        expect(opportunity.length).toBeGreaterThan(10);
      });
    });

    it('should include market context in matrix', () => {
      const matrix = analysisResult.competitiveMatrix;
      
      expect(matrix.marketContext).toBeDefined();
      expect(matrix.marketContext.industry).toBeDefined();
      expect(matrix.marketContext.geography).toBeDefined();
      expect(matrix.marketContext.targetSegment).toBeDefined();
    });
  });

  describe('SWOT Analysis Generation', () => {
    let analysisResult: CompetitorAnalysisResult;

    beforeEach(async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Cloud-based CRM with advanced analytics and automation',
        analysis_depth: 'standard'
      };
      analysisResult = await analyzer.analyzeCompetitors(args);
    });

    it('should generate SWOT analysis for each competitor', () => {
      const swotAnalysis = analysisResult.swotAnalysis;
      
      expect(swotAnalysis).toBeDefined();
      expect(swotAnalysis.length).toBe(analysisResult.competitiveMatrix.competitors.length);
      
      swotAnalysis.forEach(swot => {
        expect(swot.competitorName).toBeDefined();
        expect(swot.strengths).toBeDefined();
        expect(swot.weaknesses).toBeDefined();
        expect(swot.opportunities).toBeDefined();
        expect(swot.threats).toBeDefined();
        expect(swot.strategicImplications).toBeDefined();
      });
    });

    it('should include detailed SWOT items with impact and confidence', () => {
      const swotAnalysis = analysisResult.swotAnalysis[0];
      
      // Check strengths structure
      swotAnalysis.strengths.forEach(strength => {
        expect(strength.description).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(strength.impact);
        expect(strength.confidence).toBeGreaterThan(0);
        expect(strength.confidence).toBeLessThanOrEqual(1);
      });

      // Check weaknesses structure
      swotAnalysis.weaknesses.forEach(weakness => {
        expect(weakness.description).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(weakness.impact);
        expect(weakness.confidence).toBeGreaterThan(0);
        expect(weakness.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should generate strategic implications', () => {
      const swotAnalysis = analysisResult.swotAnalysis[0];
      
      expect(swotAnalysis.strategicImplications).toBeDefined();
      expect(swotAnalysis.strategicImplications.length).toBeGreaterThan(0);
      
      swotAnalysis.strategicImplications.forEach(implication => {
        expect(typeof implication).toBe('string');
        expect(implication.length).toBeGreaterThan(5);
      });
    });
  });

  describe('Market Positioning Analysis', () => {
    let analysisResult: CompetitorAnalysisResult;

    beforeEach(async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Enterprise security platform with zero-trust architecture',
        analysis_depth: 'comprehensive'
      };
      analysisResult = await analyzer.analyzeCompetitors(args);
    });

    it('should define positioning axes', () => {
      const positioning = analysisResult.marketPositioning;
      
      expect(positioning.positioningMap).toBeDefined();
      expect(positioning.positioningMap.length).toBeGreaterThan(0);
      
      positioning.positioningMap.forEach(axis => {
        expect(axis.name).toBeDefined();
        expect(axis.lowEnd).toBeDefined();
        expect(axis.highEnd).toBeDefined();
        expect(axis.importance).toBeGreaterThan(0);
        expect(axis.importance).toBeLessThanOrEqual(1);
      });
    });

    it('should calculate competitor positions', () => {
      const positioning = analysisResult.marketPositioning;
      
      expect(positioning.competitorPositions).toBeDefined();
      expect(positioning.competitorPositions.length).toBe(analysisResult.competitiveMatrix.competitors.length);
      
      positioning.competitorPositions.forEach(position => {
        expect(position.competitorName).toBeDefined();
        expect(position.coordinates).toBeDefined();
        expect(position.marketSegment).toBeDefined();
        
        // Check that coordinates match positioning axes
        positioning.positioningMap.forEach(axis => {
          expect(position.coordinates[axis.name]).toBeDefined();
          expect(position.coordinates[axis.name]).toBeGreaterThanOrEqual(0);
          expect(position.coordinates[axis.name]).toBeLessThanOrEqual(1);
        });
      });
    });

    it('should identify market gaps', () => {
      const positioning = analysisResult.marketPositioning;
      
      expect(positioning.marketGaps).toBeDefined();
      expect(positioning.marketGaps.length).toBeGreaterThan(0);
      
      positioning.marketGaps.forEach(gap => {
        expect(gap.description).toBeDefined();
        expect(['large', 'medium', 'small']).toContain(gap.size);
        expect(['easy', 'moderate', 'hard']).toContain(gap.difficulty);
        expect(gap.timeToMarket).toBeDefined();
        expect(gap.potentialValue).toBeGreaterThan(0);
      });
    });

    it('should provide positioning recommendations', () => {
      const positioning = analysisResult.marketPositioning;
      
      expect(positioning.recommendedPositioning).toBeDefined();
      expect(positioning.recommendedPositioning.length).toBeGreaterThan(0);
      
      positioning.recommendedPositioning.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Strategic Recommendations', () => {
    let analysisResult: CompetitorAnalysisResult;

    beforeEach(async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'AI-powered customer service automation platform',
        analysis_depth: 'comprehensive'
      };
      analysisResult = await analyzer.analyzeCompetitors(args);
    });

    it('should generate strategic recommendations', () => {
      const recommendations = analysisResult.strategicRecommendations;
      
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);
      
      recommendations.forEach(recommendation => {
        expect(['differentiation', 'cost-leadership', 'focus', 'blue-ocean']).toContain(recommendation.type);
        expect(recommendation.title).toBeDefined();
        expect(recommendation.description).toBeDefined();
        expect(recommendation.rationale).toBeDefined();
        expect(recommendation.implementation).toBeDefined();
        expect(recommendation.expectedOutcome).toBeDefined();
        expect(['low', 'medium', 'high']).toContain(recommendation.riskLevel);
        expect(recommendation.timeframe).toBeDefined();
        expect(recommendation.resourceRequirements).toBeDefined();
      });
    });

    it('should include implementation steps in recommendations', () => {
      const recommendation = analysisResult.strategicRecommendations[0];
      
      expect(recommendation.implementation).toBeDefined();
      expect(recommendation.implementation.length).toBeGreaterThan(0);
      
      recommendation.implementation.forEach(step => {
        expect(step.step).toBeGreaterThan(0);
        expect(step.action).toBeDefined();
        expect(step.timeline).toBeDefined();
        expect(step.dependencies).toBeDefined();
        expect(step.successMetrics).toBeDefined();
      });
    });
  });

  describe('Source Attribution', () => {
    let analysisResult: CompetitorAnalysisResult;

    beforeEach(async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Blockchain-based supply chain management system',
        analysis_depth: 'standard'
      };
      analysisResult = await analyzer.analyzeCompetitors(args);
    });

    it('should include source attribution', () => {
      const sources = analysisResult.sourceAttribution;
      
      expect(sources).toBeDefined();
      expect(sources.length).toBeGreaterThan(0);
      
      sources.forEach(source => {
        expect(source.id).toBeDefined();
        expect(['mckinsey', 'gartner', 'wef', 'industry-report', 'market-research', 'company-filing', 'news-article']).toContain(source.type);
        expect(source.title).toBeDefined();
        expect(source.organization).toBeDefined();
        expect(source.publishDate).toBeDefined();
        expect(source.accessDate).toBeDefined();
        expect(source.reliability).toBeGreaterThan(0);
        expect(source.reliability).toBeLessThanOrEqual(1);
        expect(source.relevance).toBeGreaterThan(0);
        expect(source.relevance).toBeLessThanOrEqual(1);
      });
    });

    it('should include data freshness information', () => {
      const sources = analysisResult.sourceAttribution;
      
      sources.forEach(source => {
        expect(source.dataFreshness).toBeDefined();
        expect(['fresh', 'recent', 'stale', 'outdated']).toContain(source.dataFreshness.status);
        expect(source.dataFreshness.ageInDays).toBeGreaterThanOrEqual(0);
        expect(source.dataFreshness.recommendedUpdateFrequency).toBeGreaterThan(0);
        expect(source.dataFreshness.lastValidated).toBeDefined();
      });
    });

    it('should include credible sources like McKinsey and Gartner', () => {
      const sources = analysisResult.sourceAttribution;
      
      const hasCredibleSources = sources.some(source => 
        source.type === 'mckinsey' || source.type === 'gartner'
      );
      expect(hasCredibleSources).toBe(true);
    });
  });

  describe('Data Quality Assessment', () => {
    let analysisResult: CompetitorAnalysisResult;

    beforeEach(async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'IoT device management platform for smart cities',
        analysis_depth: 'comprehensive'
      };
      analysisResult = await analyzer.analyzeCompetitors(args);
    });

    it('should assess data quality', () => {
      const dataQuality = analysisResult.dataQuality;
      
      expect(dataQuality).toBeDefined();
      expect(dataQuality.sourceReliability).toBeGreaterThan(0);
      expect(dataQuality.sourceReliability).toBeLessThanOrEqual(1);
      expect(dataQuality.dataFreshness).toBeGreaterThan(0);
      expect(dataQuality.dataFreshness).toBeLessThanOrEqual(1);
      expect(dataQuality.methodologyRigor).toBeGreaterThan(0);
      expect(dataQuality.methodologyRigor).toBeLessThanOrEqual(1);
      expect(dataQuality.overallConfidence).toBeGreaterThan(0);
      expect(dataQuality.overallConfidence).toBeLessThanOrEqual(1);
    });

    it('should include quality indicators', () => {
      const dataQuality = analysisResult.dataQuality;
      
      expect(dataQuality.qualityIndicators).toBeDefined();
      expect(dataQuality.qualityIndicators.length).toBeGreaterThan(0);
      
      dataQuality.qualityIndicators.forEach(indicator => {
        expect(indicator.metric).toBeDefined();
        expect(indicator.score).toBeGreaterThan(0);
        expect(indicator.score).toBeLessThanOrEqual(1);
        expect(indicator.description).toBeDefined();
        expect(['critical', 'important', 'minor']).toContain(indicator.impact);
      });
    });

    it('should provide quality recommendations', () => {
      const dataQuality = analysisResult.dataQuality;
      
      expect(dataQuality.recommendations).toBeDefined();
      
      dataQuality.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(5);
      });
    });

    it('should determine appropriate confidence level', () => {
      const confidenceLevel = analysisResult.confidenceLevel;
      
      expect(['high', 'medium', 'low']).toContain(confidenceLevel);
      
      // Confidence level should correlate with data quality
      if (analysisResult.dataQuality.overallConfidence >= 0.8) {
        expect(confidenceLevel).toBe('high');
      } else if (analysisResult.dataQuality.overallConfidence >= 0.6) {
        expect(confidenceLevel).toBe('medium');
      } else {
        expect(confidenceLevel).toBe('low');
      }
    });
  });

  describe('Result Validation', () => {
    let analyzer: CompetitorAnalyzer;

    beforeEach(() => {
      analyzer = createCompetitorAnalyzer({
        minCompetitors: 3,
        confidenceThreshold: 0.7
      });
    });

    it('should validate analysis results', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Machine learning model deployment platform',
        analysis_depth: 'standard'
      };

      const result = await analyzer.analyzeCompetitors(args);
      const validation = analyzer.validateAnalysisResult(result);
      
      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
      expect(validation.confidence).toBeGreaterThanOrEqual(0);
      expect(validation.confidence).toBeLessThanOrEqual(1);
      expect(validation.warnings).toBeDefined();
      expect(validation.recommendations).toBeDefined();
      expect(validation.dataGaps).toBeDefined();
      expect(validation.qualityScore).toBeGreaterThanOrEqual(0);
      expect(validation.qualityScore).toBeLessThanOrEqual(1);
    });

    it('should identify insufficient competitor coverage', async () => {
      // Create analyzer with high minimum competitors to trigger warning
      const strictAnalyzer = createCompetitorAnalyzer({
        minCompetitors: 10,
        maxCompetitors: 15
      });

      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Niche B2B workflow automation tool',
        analysis_depth: 'quick'
      };

      const result = await strictAnalyzer.analyzeCompetitors(args);
      const validation = strictAnalyzer.validateAnalysisResult(result);
      
      expect(validation.warnings.some(warning => 
        warning.includes('competitors identified')
      )).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty feature idea', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: '',
        analysis_depth: 'standard'
      };

      await expect(analyzer.analyzeCompetitors(args))
        .rejects
        .toThrow(CompetitiveAnalysisError);
    });

    it('should handle invalid market context', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Valid feature description for testing error handling',
        market_context: {
          industry: '',
          geography: [],
          target_segment: ''
        },
        analysis_depth: 'standard'
      };

      // Should not throw error but handle gracefully
      const result = await analyzer.analyzeCompetitors(args);
      expect(result).toBeDefined();
    });

    it('should provide helpful error messages', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'short',
        analysis_depth: 'standard'
      };

      try {
        await analyzer.analyzeCompetitors(args);
        fail('Expected CompetitiveAnalysisError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CompetitiveAnalysisError);
        expect((error as CompetitiveAnalysisError).suggestions).toBeDefined();
        expect((error as CompetitiveAnalysisError).suggestions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Utility Functions', () => {
    it('should format analysis results for display', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Digital marketing automation platform with AI personalization',
        analysis_depth: 'standard'
      };

      const result = await analyzer.analyzeCompetitors(args);
      const formatted = formatCompetitiveAnalysisResult(result);
      
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(100);
      expect(formatted).toContain('# Competitive Analysis Report');
      expect(formatted).toContain('## Competitive Matrix');
      expect(formatted).toContain('## Key Strategic Insights');
      expect(formatted).toContain('## Analysis Quality');
    });

    it('should include all key sections in formatted output', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Video conferencing platform with advanced collaboration features',
        analysis_depth: 'comprehensive'
      };

      const result = await analyzer.analyzeCompetitors(args);
      const formatted = formatCompetitiveAnalysisResult(result);
      
      // Check for required sections
      expect(formatted).toContain('Analysis Date:');
      expect(formatted).toContain('Confidence Level:');
      expect(formatted).toContain('Competitors Analyzed:');
      expect(formatted).toContain('Overall Confidence:');
      expect(formatted).toContain('Source Reliability:');
      expect(formatted).toContain('Data Freshness:');
    });
  });

  describe('Performance and Scalability', () => {
    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();
      
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Enterprise resource planning system with modern UI',
        analysis_depth: 'comprehensive'
      };

      await analyzer.analyzeCompetitors(args);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple concurrent analyses', async () => {
      const args1: CompetitiveAnalysisArgs = {
        feature_idea: 'Social media management dashboard',
        analysis_depth: 'quick'
      };

      const args2: CompetitiveAnalysisArgs = {
        feature_idea: 'E-learning platform with gamification',
        analysis_depth: 'quick'
      };

      const args3: CompetitiveAnalysisArgs = {
        feature_idea: 'Real estate CRM with lead scoring',
        analysis_depth: 'quick'
      };

      const promises = [
        analyzer.analyzeCompetitors(args1),
        analyzer.analyzeCompetitors(args2),
        analyzer.analyzeCompetitors(args3)
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.competitiveMatrix).toBeDefined();
      });
    });
  });
});