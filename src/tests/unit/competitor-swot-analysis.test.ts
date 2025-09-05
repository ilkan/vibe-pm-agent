/**
 * Unit Tests for SWOT Analysis and Strategic Recommendations
 * 
 * Tests the SWOT analysis generation and strategic recommendation engine
 * based on competitive gaps as specified in requirements 1.3 and 1.4.
 */

import { CompetitorAnalyzer, createCompetitorAnalyzer } from '../../components/competitor-analyzer';
import {
  CompetitiveAnalysisArgs,
  SWOTAnalysis,
  StrategyRecommendation,
  SWOTItem
} from '../../models/competitive';

describe('SWOT Analysis and Strategic Recommendations', () => {
  let analyzer: CompetitorAnalyzer;

  beforeEach(() => {
    analyzer = createCompetitorAnalyzer();
  });

  describe('SWOT Analysis Generation (Requirement 1.3)', () => {
    it('should generate comprehensive SWOT analysis for each competitor', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'AI-powered customer relationship management platform with predictive analytics',
        market_context: {
          industry: 'Software',
          geography: ['North America', 'Europe'],
          target_segment: 'Enterprise'
        },
        analysis_depth: 'comprehensive'
      };

      const result = await analyzer.analyzeCompetitors(args);
      const swotAnalysis = result.swotAnalysis;

      // Verify SWOT analysis exists for each competitor
      expect(swotAnalysis.length).toBe(result.competitiveMatrix.competitors.length);
      expect(swotAnalysis.length).toBeGreaterThan(0);

      swotAnalysis.forEach(swot => {
        // Verify all SWOT categories are present
        expect(swot.strengths).toBeDefined();
        expect(swot.weaknesses).toBeDefined();
        expect(swot.opportunities).toBeDefined();
        expect(swot.threats).toBeDefined();
        expect(swot.strategicImplications).toBeDefined();

        // Verify each category has meaningful content
        expect(swot.strengths.length).toBeGreaterThan(0);
        expect(swot.weaknesses.length).toBeGreaterThan(0);
        expect(swot.opportunities.length).toBeGreaterThan(0);
        expect(swot.threats.length).toBeGreaterThan(0);
        expect(swot.strategicImplications.length).toBeGreaterThan(0);
      });
    });

    it('should provide detailed SWOT items with impact assessment', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Blockchain-based identity verification system for financial services',
        market_context: {
          industry: 'Financial Services',
          geography: ['Global'],
          target_segment: 'Financial Institutions'
        },
        analysis_depth: 'standard'
      };

      const result = await analyzer.analyzeCompetitors(args);
      const firstCompetitorSWOT = result.swotAnalysis[0];

      // Test strengths structure
      firstCompetitorSWOT.strengths.forEach((strength: SWOTItem) => {
        expect(strength.description).toBeDefined();
        expect(strength.description.length).toBeGreaterThan(5);
        expect(['high', 'medium', 'low']).toContain(strength.impact);
        expect(strength.confidence).toBeGreaterThan(0);
        expect(strength.confidence).toBeLessThanOrEqual(1);
        expect(strength.sourceReference).toBeDefined();
      });

      // Test weaknesses structure
      firstCompetitorSWOT.weaknesses.forEach((weakness: SWOTItem) => {
        expect(weakness.description).toBeDefined();
        expect(weakness.description.length).toBeGreaterThan(5);
        expect(['high', 'medium', 'low']).toContain(weakness.impact);
        expect(weakness.confidence).toBeGreaterThan(0);
        expect(weakness.confidence).toBeLessThanOrEqual(1);
      });

      // Test opportunities structure
      firstCompetitorSWOT.opportunities.forEach((opportunity: SWOTItem) => {
        expect(opportunity.description).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(opportunity.impact);
        expect(opportunity.confidence).toBeGreaterThan(0);
        expect(opportunity.confidence).toBeLessThanOrEqual(1);
      });

      // Test threats structure
      firstCompetitorSWOT.threats.forEach((threat: SWOTItem) => {
        expect(threat.description).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(threat.impact);
        expect(threat.confidence).toBeGreaterThan(0);
        expect(threat.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should generate strategic implications based on SWOT analysis', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'IoT device management platform for smart manufacturing',
        analysis_depth: 'comprehensive'
      };

      const result = await analyzer.analyzeCompetitors(args);
      
      result.swotAnalysis.forEach(swot => {
        expect(swot.strategicImplications).toBeDefined();
        expect(swot.strategicImplications.length).toBeGreaterThan(0);
        
        swot.strategicImplications.forEach(implication => {
          expect(typeof implication).toBe('string');
          expect(implication.length).toBeGreaterThan(10);
          // Should provide actionable insights
          expect(implication).toMatch(/\b(competitive|strategy|market|position|advantage|focus|monitor|leverage)\b/i);
        });
      });
    });

    it('should correlate SWOT analysis with competitor characteristics', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'E-commerce personalization engine with machine learning',
        market_context: {
          industry: 'E-commerce',
          geography: ['North America'],
          target_segment: 'Online Retailers'
        },
        analysis_depth: 'standard'
      };

      const result = await analyzer.analyzeCompetitors(args);
      
      // Verify SWOT analysis reflects competitor data
      result.swotAnalysis.forEach((swot, index) => {
        const competitor = result.competitiveMatrix.competitors[index];
        
        // Strengths should align with competitor strengths
        const swotStrengthDescriptions = swot.strengths.map(s => s.description.toLowerCase());
        const competitorStrengths = competitor.strengths.map(s => s.toLowerCase());
        
        const hasAlignedStrengths = competitorStrengths.some(strength =>
          swotStrengthDescriptions.some(swotStrength => 
            swotStrength.includes(strength) || strength.includes(swotStrength.split(' ')[0])
          )
        );
        expect(hasAlignedStrengths).toBe(true);
      });
    });
  });

  describe('Strategic Recommendations Engine (Requirement 1.4)', () => {
    it('should generate strategic recommendations based on competitive gaps', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Cloud-based video editing platform for content creators',
        analysis_depth: 'comprehensive'
      };

      const result = await analyzer.analyzeCompetitors(args);
      const recommendations = result.strategicRecommendations;

      // Verify recommendations exist and are limited to reasonable number
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);

      recommendations.forEach((recommendation: StrategyRecommendation) => {
        // Verify recommendation structure
        expect(['differentiation', 'cost-leadership', 'focus', 'blue-ocean']).toContain(recommendation.type);
        expect(recommendation.title).toBeDefined();
        expect(recommendation.title.length).toBeGreaterThan(5);
        expect(recommendation.description).toBeDefined();
        expect(recommendation.description.length).toBeGreaterThan(20);
        expect(recommendation.rationale).toBeDefined();
        expect(recommendation.rationale.length).toBeGreaterThan(0);
        expect(recommendation.expectedOutcome).toBeDefined();
        expect(['low', 'medium', 'high']).toContain(recommendation.riskLevel);
        expect(recommendation.timeframe).toBeDefined();
        expect(recommendation.resourceRequirements).toBeDefined();
        expect(recommendation.resourceRequirements.length).toBeGreaterThan(0);
      });
    });

    it('should provide differentiation recommendations based on competitive matrix', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Real-time collaboration platform for remote teams',
        analysis_depth: 'standard'
      };

      const result = await analyzer.analyzeCompetitors(args);
      const recommendations = result.strategicRecommendations;

      // Should include at least one differentiation recommendation
      const differentiationRecs = recommendations.filter(rec => rec.type === 'differentiation');
      expect(differentiationRecs.length).toBeGreaterThan(0);

      differentiationRecs.forEach(rec => {
        expect(rec.title).toMatch(/differentiation/i);
        expect(rec.rationale.length).toBeGreaterThan(0);
        
        // Should reference competitive gaps or opportunities
        const rationale = rec.rationale.join(' ').toLowerCase();
        expect(rationale).toMatch(/\b(gap|opportunity|competitor|weakness|advantage)\b/);
      });
    });

    it('should include detailed implementation steps for each recommendation', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Automated testing platform for mobile applications',
        analysis_depth: 'comprehensive'
      };

      const result = await analyzer.analyzeCompetitors(args);
      const recommendations = result.strategicRecommendations;

      recommendations.forEach(recommendation => {
        expect(recommendation.implementation).toBeDefined();
        expect(recommendation.implementation.length).toBeGreaterThan(0);

        recommendation.implementation.forEach(step => {
          expect(step.step).toBeGreaterThan(0);
          expect(step.action).toBeDefined();
          expect(step.action.length).toBeGreaterThan(10);
          expect(step.timeline).toBeDefined();
          expect(step.dependencies).toBeDefined();
          expect(step.successMetrics).toBeDefined();
          expect(step.successMetrics.length).toBeGreaterThan(0);
          
          // Success metrics should be measurable
          step.successMetrics.forEach(metric => {
            expect(typeof metric).toBe('string');
            expect(metric.length).toBeGreaterThan(5);
          });
        });
      });
    });

    it('should generate blue ocean recommendations for market gaps', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Virtual reality training platform for healthcare professionals',
        market_context: {
          industry: 'Healthcare',
          geography: ['Global'],
          target_segment: 'Medical Training'
        },
        analysis_depth: 'comprehensive'
      };

      const result = await analyzer.analyzeCompetitors(args);
      const recommendations = result.strategicRecommendations;

      // Should include blue ocean recommendations for innovative features
      const blueOceanRecs = recommendations.filter(rec => rec.type === 'blue-ocean');
      expect(blueOceanRecs.length).toBeGreaterThan(0);

      blueOceanRecs.forEach(rec => {
        expect(rec.title).toMatch(/new market|create|uncontested/i);
        expect(rec.riskLevel).toBe('high'); // Blue ocean strategies are typically high risk
        expect(rec.timeframe).toMatch(/12|18|24/); // Should be longer timeframe
        
        // Should reference market opportunities
        const description = rec.description.toLowerCase();
        expect(description).toMatch(/\b(market|opportunity|new|innovative|first)\b/);
      });
    });

    it('should provide focus strategy recommendations for niche markets', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Specialized project management tool for construction companies',
        market_context: {
          industry: 'Construction',
          geography: ['North America'],
          target_segment: 'Construction Firms'
        },
        analysis_depth: 'standard'
      };

      const result = await analyzer.analyzeCompetitors(args);
      const recommendations = result.strategicRecommendations;

      // Should include focus strategy recommendations
      const focusRecs = recommendations.filter(rec => rec.type === 'focus');
      expect(focusRecs.length).toBeGreaterThan(0);

      focusRecs.forEach(rec => {
        expect(rec.title).toMatch(/focus|niche|segment/i);
        expect(rec.riskLevel).toBe('low'); // Focus strategies are typically lower risk
        
        // Should reference specialization or targeting
        const description = rec.description.toLowerCase();
        expect(description).toMatch(/\b(focus|niche|segment|specialize|target)\b/);
      });
    });

    it('should base recommendations on competitive analysis insights', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'AI-powered supply chain optimization platform',
        analysis_depth: 'comprehensive'
      };

      const result = await analyzer.analyzeCompetitors(args);
      
      // Verify recommendations are informed by competitive analysis
      const hasCompetitiveInsights = result.strategicRecommendations.some(rec => {
        const allText = (rec.title + ' ' + rec.description + ' ' + rec.rationale.join(' ')).toLowerCase();
        return allText.includes('competitor') || 
               allText.includes('competitive') || 
               allText.includes('market gap') ||
               allText.includes('differentiat');
      });
      
      expect(hasCompetitiveInsights).toBe(true);
    });

    it('should provide realistic timeframes and resource requirements', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Cybersecurity monitoring platform for small businesses',
        analysis_depth: 'standard'
      };

      const result = await analyzer.analyzeCompetitors(args);
      const recommendations = result.strategicRecommendations;

      recommendations.forEach(recommendation => {
        // Timeframes should be realistic
        expect(recommendation.timeframe).toMatch(/\d+(-\d+)?\s*(month|year)/i);
        
        // Resource requirements should be specific
        expect(recommendation.resourceRequirements.length).toBeGreaterThan(0);
        recommendation.resourceRequirements.forEach(resource => {
          expect(typeof resource).toBe('string');
          expect(resource.length).toBeGreaterThan(5);
        });
        
        // Risk levels should correlate with strategy type
        if (recommendation.type === 'blue-ocean') {
          expect(recommendation.riskLevel).toBe('high');
        } else if (recommendation.type === 'focus') {
          expect(recommendation.riskLevel).toBe('low');
        }
      });
    });
  });

  describe('Integration between SWOT and Strategic Recommendations', () => {
    it('should align strategic recommendations with SWOT insights', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Digital asset management platform for creative agencies',
        analysis_depth: 'comprehensive'
      };

      const result = await analyzer.analyzeCompetitors(args);
      
      // Extract common themes from SWOT analysis
      const allSWOTText = result.swotAnalysis.flatMap(swot => [
        ...swot.strengths.map(s => s.description),
        ...swot.weaknesses.map(w => w.description),
        ...swot.opportunities.map(o => o.description),
        ...swot.threats.map(t => t.description),
        ...swot.strategicImplications
      ]).join(' ').toLowerCase();

      // Verify recommendations address SWOT insights
      const recommendationText = result.strategicRecommendations.flatMap(rec => [
        rec.title,
        rec.description,
        ...rec.rationale
      ]).join(' ').toLowerCase();

      // Should have some thematic overlap
      const hasThematicAlignment = 
        (allSWOTText.includes('innovation') && recommendationText.includes('innovation')) ||
        (allSWOTText.includes('market') && recommendationText.includes('market')) ||
        (allSWOTText.includes('competitive') && recommendationText.includes('competitive')) ||
        (allSWOTText.includes('technology') && recommendationText.includes('technology'));

      expect(hasThematicAlignment).toBe(true);
    });

    it('should leverage competitor weaknesses in recommendations', async () => {
      const args: CompetitiveAnalysisArgs = {
        feature_idea: 'Customer support automation platform with natural language processing',
        analysis_depth: 'standard'
      };

      const result = await analyzer.analyzeCompetitors(args);
      
      // Extract competitor weaknesses
      const competitorWeaknesses = result.competitiveMatrix.competitors.flatMap(c => c.weaknesses);
      const swotWeaknesses = result.swotAnalysis.flatMap(swot => swot.weaknesses.map(w => w.description));
      
      // Recommendations should address these weaknesses as opportunities
      const addressesWeaknesses = result.strategicRecommendations.some(rec => {
        const recText = (rec.title + ' ' + rec.description + ' ' + rec.rationale.join(' ')).toLowerCase();
        return competitorWeaknesses.some(weakness => 
          recText.includes(weakness.toLowerCase().split(' ')[0])
        ) || swotWeaknesses.some(weakness =>
          recText.includes(weakness.toLowerCase().split(' ')[0])
        );
      });

      expect(addressesWeaknesses).toBe(true);
    });
  });

  describe('Quality and Validation', () => {
    it('should maintain consistent quality across different industries', async () => {
      const industries = [
        { industry: 'Financial Services', feature: 'Digital banking platform with AI fraud detection' },
        { industry: 'Healthcare', feature: 'Telemedicine platform with integrated diagnostics' },
        { industry: 'E-commerce', feature: 'Personalized shopping recommendation engine' },
        { industry: 'Software', feature: 'DevOps automation platform for CI/CD pipelines' }
      ];

      for (const testCase of industries) {
        const args: CompetitiveAnalysisArgs = {
          feature_idea: testCase.feature,
          market_context: {
            industry: testCase.industry,
            geography: ['Global'],
            target_segment: 'Enterprise'
          },
          analysis_depth: 'standard'
        };

        const result = await analyzer.analyzeCompetitors(args);
        
        // Verify consistent quality metrics
        expect(result.swotAnalysis.length).toBeGreaterThan(0);
        expect(result.strategicRecommendations.length).toBeGreaterThan(0);
        expect(result.dataQuality.overallConfidence).toBeGreaterThan(0.5);
        
        // Each SWOT should have all categories
        result.swotAnalysis.forEach(swot => {
          expect(swot.strengths.length).toBeGreaterThan(0);
          expect(swot.weaknesses.length).toBeGreaterThan(0);
          expect(swot.opportunities.length).toBeGreaterThan(0);
          expect(swot.threats.length).toBeGreaterThan(0);
        });
      }
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        'Very niche B2B workflow automation tool for dental practices',
        'Experimental quantum computing interface for research institutions',
        'Simple mobile app for tracking daily water intake'
      ];

      for (const featureIdea of edgeCases) {
        const args: CompetitiveAnalysisArgs = {
          feature_idea: featureIdea,
          analysis_depth: 'quick'
        };

        const result = await analyzer.analyzeCompetitors(args);
        
        // Should still generate meaningful analysis even for edge cases
        expect(result.swotAnalysis.length).toBeGreaterThan(0);
        expect(result.strategicRecommendations.length).toBeGreaterThan(0);
        
        // Quality might be lower but should still be valid
        expect(result.dataQuality.overallConfidence).toBeGreaterThan(0.3);
      }
    });
  });
});