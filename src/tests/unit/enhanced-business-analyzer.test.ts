/**
 * Unit tests for Enhanced Business Analyzer functionality
 * Tests for Task 4.1 and 4.2 implementation
 */

import { BusinessAnalyzer } from '../../components/business-analyzer';
import { 
  ParsedIntent, 
  MarketSizingResult, 
  CompetitorAnalysisResult,
  EnhancedBusinessOpportunity,
  StrategicFitAssessment,
  MarketTimingAnalysis
} from '../../models';

describe('Enhanced Business Analyzer', () => {
  let analyzer: BusinessAnalyzer;
  let mockIntent: ParsedIntent;
  let mockMarketSizing: MarketSizingResult;
  let mockCompetitiveAnalysis: CompetitorAnalysisResult;

  beforeEach(() => {
    analyzer = new BusinessAnalyzer();
    
    mockIntent = {
      businessObjective: 'Optimize development workflow efficiency',
      operationsRequired: [
        {
          id: 'op1',
          type: 'vibe',
          description: 'Generate code components',
          estimatedQuotaCost: 50
        },
        {
          id: 'op2',
          type: 'spec',
          description: 'Create technical specifications',
          estimatedQuotaCost: 20
        }
      ],
      technicalRequirements: [
        {
          type: 'processing',
          description: 'AI-powered code generation',
          complexity: 'medium',
          quotaImpact: 'significant'
        },
        {
          type: 'analysis',
          description: 'Workflow optimization',
          complexity: 'low',
          quotaImpact: 'moderate'
        }
      ],
      dataSourcesNeeded: [
        'Development metrics API',
        'Code repository data'
      ],
      potentialRisks: [
        {
          type: 'excessive_loops',
          description: 'AI model accuracy concerns',
          severity: 'medium',
          likelihood: 0.3
        }
      ]
    };

    mockMarketSizing = {
      tam: {
        value: 50000000000,
        currency: 'USD',
        timeframe: '5 years',
        growthRate: 15,
        methodology: 'top-down',
        dataQuality: 'high',
        calculationDate: '2024-01-01',
        geographicScope: ['North America', 'Europe'],
        marketSegments: ['Enterprise', 'SMB']
      },
      sam: {
        value: 5000000000,
        currency: 'USD',
        timeframe: '5 years',
        growthRate: 12,
        methodology: 'bottom-up',
        dataQuality: 'high',
        calculationDate: '2024-01-01',
        geographicScope: ['North America'],
        marketSegments: ['Enterprise']
      },
      som: {
        value: 500000000,
        currency: 'USD',
        timeframe: '5 years',
        growthRate: 10,
        methodology: 'value-theory',
        dataQuality: 'medium',
        calculationDate: '2024-01-01',
        geographicScope: ['North America'],
        marketSegments: ['Enterprise']
      },
      methodology: [
        {
          type: 'top-down',
          description: 'Industry report analysis',
          dataSource: 'Gartner Research',
          reliability: 0.9,
          calculationSteps: [],
          limitations: ['Market definition assumptions'],
          confidence: 0.85
        }
      ],
      scenarios: [
        {
          name: 'conservative',
          description: 'Conservative growth scenario',
          tam: 40000000000,
          sam: 4000000000,
          som: 400000000,
          probability: 0.3,
          keyAssumptions: ['Slower adoption', 'Economic headwinds'],
          riskFactors: ['Market saturation', 'Competitive pressure']
        }
      ],
      confidenceIntervals: [],
      sourceAttribution: [],
      assumptions: [],
      marketDynamics: {
        growthDrivers: ['AI adoption', 'Developer productivity focus'],
        marketBarriers: ['Technical complexity', 'Integration challenges'],
        seasonality: [],
        cyclicalFactors: ['Economic cycles'],
        disruptiveForces: ['New AI technologies']
      }
    };

    mockCompetitiveAnalysis = {
      competitiveMatrix: {
        competitors: [
          {
            name: 'Competitor A',
            marketShare: 25,
            strengths: ['Strong brand', 'Large user base'],
            weaknesses: ['High pricing', 'Limited AI features'],
            keyFeatures: ['Code completion', 'Debugging tools'],
            pricing: {
              model: 'subscription',
              startingPrice: 29,
              currency: 'USD',
              billingCycle: 'monthly',
              valueProposition: 'Comprehensive development suite'
            },
            targetMarket: ['Enterprise developers'],
            recentMoves: [
              {
                date: '2024-01-15',
                type: 'product-launch',
                description: 'AI code assistant launch',
                impact: 'high',
                strategicImplication: 'Increased AI competition'
              }
            ]
          }
        ],
        evaluationCriteria: [
          {
            name: 'AI Capabilities',
            weight: 30,
            description: 'Quality of AI-powered features',
            measurementType: 'qualitative'
          }
        ],
        rankings: [
          {
            competitorName: 'Competitor A',
            overallScore: 75,
            criteriaScores: { 'AI Capabilities': 70 },
            rank: 1,
            competitiveAdvantage: ['Market presence', 'Feature completeness']
          }
        ],
        differentiationOpportunities: ['Better AI integration', 'Workflow optimization'],
        marketContext: {
          industry: 'Developer Tools',
          geography: ['Global'],
          targetSegment: 'Professional Developers',
          marketMaturity: 'growth',
          regulatoryEnvironment: [],
          technologyTrends: ['AI/ML', 'Cloud-native development']
        }
      },
      swotAnalysis: [],
      marketPositioning: {
        positioningMap: [],
        competitorPositions: [],
        marketGaps: [
          {
            description: 'AI-powered workflow optimization',
            size: 'large',
            difficulty: 'moderate',
            timeToMarket: '6-12 months',
            potentialValue: 100000000
          }
        ],
        recommendedPositioning: ['AI-first development platform']
      },
      strategicRecommendations: [],
      sourceAttribution: [],
      confidenceLevel: 'high',
      lastUpdated: '2024-01-01',
      dataQuality: {
        sourceReliability: 0.85,
        dataFreshness: 0.9,
        methodologyRigor: 0.8,
        overallConfidence: 0.85,
        qualityIndicators: [],
        recommendations: []
      }
    };
  });

  describe('Enhanced Business Opportunity Analysis (Task 4.1)', () => {
    it('should analyze enhanced business opportunity with market sizing integration', async () => {
      const result = await analyzer.analyzeEnhancedBusinessOpportunity(
        mockIntent,
        mockMarketSizing,
        mockCompetitiveAnalysis
      );

      expect(result).toBeDefined();
      expect(result.businessOpportunity).toBeDefined();
      expect(result.marketSizing).toEqual(mockMarketSizing);
      expect(result.competitiveAnalysis).toEqual(mockCompetitiveAnalysis);
      expect(result.strategicFit).toBeDefined();
      expect(result.marketTiming).toBeDefined();
      expect(result.integratedInsights).toBeDefined();
      expect(result.overallRecommendation).toBeDefined();
    });

    it('should generate business opportunity with market validation', async () => {
      const result = await analyzer.analyzeEnhancedBusinessOpportunity(mockIntent);

      expect(result.businessOpportunity.marketValidation).toBeDefined();
      expect(result.businessOpportunity.marketValidation.targetMarket).toContain('Development metrics API');
      expect(result.businessOpportunity.marketValidation.marketNeed).toBe(mockIntent.businessObjective);
      expect(result.businessOpportunity.marketValidation.customerSegments).toHaveLength(1);
      expect(result.businessOpportunity.marketValidation.customerSegments[0].name).toBe('Development Teams');
    });

    it('should assess strategic alignment correctly', async () => {
      const result = await analyzer.analyzeEnhancedBusinessOpportunity(mockIntent);

      expect(result.businessOpportunity.strategicAlignment).toBeDefined();
      expect(result.businessOpportunity.strategicAlignment.alignmentScore).toBeGreaterThan(70);
      expect(result.businessOpportunity.strategicAlignment.okrAlignment).toHaveLength(2);
      expect(result.businessOpportunity.strategicAlignment.competitiveAdvantage).toContain('AI-powered workflow optimization');
    });

    it('should generate financial projections', async () => {
      const result = await analyzer.analyzeEnhancedBusinessOpportunity(mockIntent);

      expect(result.businessOpportunity.financialProjections).toHaveLength(2);
      expect(result.businessOpportunity.financialProjections[0].timeframe).toBe('Year 1');
      expect(result.businessOpportunity.financialProjections[0].roi).toBeGreaterThan(1);
      expect(result.businessOpportunity.financialProjections[1].timeframe).toBe('Year 2');
    });

    it('should assess risks and generate mitigation strategies', async () => {
      const result = await analyzer.analyzeEnhancedBusinessOpportunity(mockIntent);

      expect(result.businessOpportunity.riskAssessment).toBeDefined();
      expect(result.businessOpportunity.riskAssessment.risks).toHaveLength(1);
      expect(result.businessOpportunity.riskAssessment.risks[0].category).toBe('technical');
      expect(result.businessOpportunity.riskAssessment.mitigationStrategies).toHaveLength(1);
    });

    it('should create implementation plan with phases', async () => {
      const result = await analyzer.analyzeEnhancedBusinessOpportunity(mockIntent);

      expect(result.businessOpportunity.implementationPlan).toHaveLength(2);
      expect(result.businessOpportunity.implementationPlan[0].phase).toBe(1);
      expect(result.businessOpportunity.implementationPlan[0].name).toBe('Foundation & Planning');
      expect(result.businessOpportunity.implementationPlan[1].phase).toBe(2);
    });

    it('should define success metrics', async () => {
      const result = await analyzer.analyzeEnhancedBusinessOpportunity(mockIntent);

      expect(result.businessOpportunity.successMetrics).toHaveLength(2);
      expect(result.businessOpportunity.successMetrics[0].name).toBe('User Adoption Rate');
      expect(result.businessOpportunity.successMetrics[0].type).toBe('leading');
      expect(result.businessOpportunity.successMetrics[1].type).toBe('lagging');
    });

    it('should generate integrated insights when market sizing and competitive analysis are provided', async () => {
      const result = await analyzer.analyzeEnhancedBusinessOpportunity(
        mockIntent,
        mockMarketSizing,
        mockCompetitiveAnalysis
      );

      expect(result.integratedInsights).toHaveLength(2);
      expect(result.integratedInsights[0].type).toBe('market-competitive');
      expect(result.integratedInsights[1].type).toBe('strategic-timing');
      expect(result.integratedInsights[0].confidence).toBeGreaterThan(80);
    });

    it('should generate overall recommendation based on analysis', async () => {
      const result = await analyzer.analyzeEnhancedBusinessOpportunity(
        mockIntent,
        mockMarketSizing,
        mockCompetitiveAnalysis
      );

      expect(result.overallRecommendation).toBeDefined();
      expect(['strong-go', 'conditional-go', 'pivot', 'delay', 'no-go']).toContain(result.overallRecommendation.decision);
      expect(result.overallRecommendation.confidence).toBeGreaterThan(0);
      expect(result.overallRecommendation.keyReasons).toBeDefined();
      expect(result.overallRecommendation.nextSteps).toHaveLength(2);
    });
  });

  describe('Strategic Fit Assessment (Task 4.2)', () => {
    it('should assess strategic fit with competitive positioning', () => {
      const result = analyzer.assessStrategicFit(mockIntent, mockCompetitiveAnalysis);

      expect(result).toBeDefined();
      expect(result.alignmentScore).toBeGreaterThan(60);
      expect(result.competitiveAdvantage).toBeDefined();
      expect(result.marketGaps).toBeDefined();
      expect(result.entryBarriers).toBeDefined();
      expect(result.successFactors).toBeDefined();
      expect(result.strategicRecommendations).toBeDefined();
      expect(result.fitAnalysis).toBeDefined();
    });

    it('should identify market gaps correctly', () => {
      const result = analyzer.assessStrategicFit(mockIntent, mockCompetitiveAnalysis);

      expect(result.marketGaps).toHaveLength(2);
      expect(result.marketGaps[0].gapType).toBe('feature');
      expect(result.marketGaps[0].description).toBe('AI-powered workflow optimization');
      expect(result.marketGaps[0].size).toBe('large');
      expect(result.marketGaps[1].gapType).toBe('use-case');
    });

    it('should assess entry barriers', () => {
      const result = analyzer.assessStrategicFit(mockIntent, mockCompetitiveAnalysis);

      expect(result.entryBarriers).toHaveLength(2);
      expect(result.entryBarriers[0].type).toBe('technical');
      expect(result.entryBarriers[0].description).toContain('AI and ML expertise');
      expect(result.entryBarriers[1].type).toBe('brand');
    });

    it('should identify success factors', () => {
      const result = analyzer.assessStrategicFit(mockIntent, mockCompetitiveAnalysis);

      expect(result.successFactors).toHaveLength(2);
      expect(result.successFactors[0].factor).toBe('AI Integration Capability');
      expect(result.successFactors[0].importance).toBe(90);
      expect(result.successFactors[0].capabilityGap).toBe(20);
      expect(result.successFactors[1].factor).toBe('Developer Experience Design');
    });

    it('should generate strategic recommendations', () => {
      const result = analyzer.assessStrategicFit(mockIntent, mockCompetitiveAnalysis);

      expect(result.strategicRecommendations).toHaveLength(1);
      expect(result.strategicRecommendations[0].type).toBe('go');
      expect(result.strategicRecommendations[0].rationale).toContain('Strong strategic alignment');
      expect(result.strategicRecommendations[0].conditions).toContain('Secure AI expertise');
    });

    it('should perform comprehensive fit analysis', () => {
      const result = analyzer.assessStrategicFit(mockIntent, mockCompetitiveAnalysis);

      expect(result.fitAnalysis).toBeDefined();
      expect(result.fitAnalysis.marketFit).toBeDefined();
      expect(result.fitAnalysis.strategicFit).toBeDefined();
      expect(result.fitAnalysis.capabilityFit).toBeDefined();
      expect(result.fitAnalysis.timingFit).toBeDefined();
      expect(result.fitAnalysis.overallFit).toBeDefined();
      expect(result.fitAnalysis.keyInsights).toHaveLength(4);
    });

    it('should calculate alignment score based on intent characteristics', () => {
      // Test with productivity-focused intent
      const productivityIntent = {
        ...mockIntent,
        businessObjective: 'Improve developer productivity through AI automation'
      };

      const result = analyzer.assessStrategicFit(productivityIntent, mockCompetitiveAnalysis);
      expect(result.alignmentScore).toBeGreaterThan(80);
    });

    it('should adjust recommendations based on alignment score', () => {
      // Test with lower alignment intent
      const lowAlignmentIntent = {
        ...mockIntent,
        businessObjective: 'Basic file management system',
        technicalRequirements: [
          {
            type: 'data_retrieval' as const,
            description: 'File storage',
            complexity: 'low' as const,
            quotaImpact: 'minimal' as const
          }
        ]
      };

      const result = analyzer.assessStrategicFit(lowAlignmentIntent);
      expect(result.alignmentScore).toBeLessThan(80);
      expect(result.strategicRecommendations[0]?.type).toBe('pivot');
    });
  });

  describe('Market Timing Analysis', () => {
    it('should analyze market timing with competitive context', () => {
      const result = analyzer.analyzeMarketTiming(mockIntent, mockCompetitiveAnalysis);

      expect(result).toBeDefined();
      expect(result.timingScore).toBeGreaterThan(0);
      expect(result.marketReadiness).toBeDefined();
      expect(result.competitiveTiming).toBeDefined();
      expect(result.internalReadiness).toBeDefined();
      expect(result.externalFactors).toBeDefined();
      expect(result.timingRecommendation).toBeDefined();
    });

    it('should assess market readiness correctly', () => {
      const result = analyzer.analyzeMarketTiming(mockIntent, mockCompetitiveAnalysis);

      expect(result.marketReadiness.customerDemand).toBe(80);
      expect(result.marketReadiness.marketMaturity).toBe('growth');
      expect(result.marketReadiness.adoptionCurve).toBe('early-majority');
      expect(result.marketReadiness.marketSignals).toHaveLength(2);
      expect(result.marketReadiness.readinessScore).toBe(82);
    });

    it('should assess competitive timing', () => {
      const result = analyzer.analyzeMarketTiming(mockIntent, mockCompetitiveAnalysis);

      expect(result.competitiveTiming.competitorMoves).toHaveLength(1);
      expect(result.competitiveTiming.marketWindowSize).toBe('moderate');
      expect(result.competitiveTiming.firstMoverAdvantage).toBe(70);
      expect(result.competitiveTiming.competitiveResponse).toHaveLength(1);
    });

    it('should provide timing recommendations based on score', () => {
      const result = analyzer.analyzeMarketTiming(mockIntent, mockCompetitiveAnalysis);

      expect(result.timingRecommendation).toBeDefined();
      expect(['launch-now', 'launch-soon', 'delay', 'wait-and-see', 'abandon']).toContain(
        result.timingRecommendation.recommendation
      );
      expect(result.timingRecommendation.rationale).toBeDefined();
      expect(result.timingRecommendation.optimalTiming).toBeDefined();
    });
  });

  describe('Integration with Existing Analysis', () => {
    it('should maintain compatibility with existing consulting analysis', async () => {
      const consultingAnalysis = await analyzer.analyzeWithTechniques(mockIntent);
      
      expect(consultingAnalysis).toBeDefined();
      expect(consultingAnalysis.techniquesUsed).toBeDefined();
      expect(consultingAnalysis.keyFindings).toBeDefined();
      expect(consultingAnalysis.totalQuotaSavings).toBeGreaterThanOrEqual(0);
    });

    it('should work without market sizing or competitive analysis', async () => {
      const result = await analyzer.analyzeEnhancedBusinessOpportunity(mockIntent);

      expect(result).toBeDefined();
      expect(result.businessOpportunity).toBeDefined();
      expect(result.strategicFit).toBeDefined();
      expect(result.marketTiming).toBeDefined();
      expect(result.overallRecommendation).toBeDefined();
    });

    it('should handle optional parameters correctly', async () => {
      const params = {
        costConstraints: {
          maxVibes: 10,
          maxSpecs: 5,
          maxCostDollars: 1000
        }
      };

      const result = await analyzer.analyzeEnhancedBusinessOpportunity(mockIntent, undefined, undefined, params);

      expect(result).toBeDefined();
      expect(result.businessOpportunity.financialProjections[0].revenue).toBeLessThan(10000);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty technical requirements', async () => {
      const emptyIntent = {
        ...mockIntent,
        technicalRequirements: []
      };

      const result = await analyzer.analyzeEnhancedBusinessOpportunity(emptyIntent);
      expect(result).toBeDefined();
      expect(result.businessOpportunity.confidenceLevel).toBe('low');
    });

    it('should handle high-risk scenarios', async () => {
      const highRiskIntent = {
        ...mockIntent,
        potentialRisks: [
          { 
            type: 'excessive_loops' as const, 
            description: 'Critical system failure', 
            severity: 'high' as const,
            likelihood: 0.8
          },
          { 
            type: 'unnecessary_vibes' as const, 
            description: 'Data security breach', 
            severity: 'high' as const,
            likelihood: 0.7
          }
        ]
      };

      const result = await analyzer.analyzeEnhancedBusinessOpportunity(highRiskIntent);
      expect(result.businessOpportunity.riskAssessment.overallRiskLevel).toBe('high');
      expect(result.businessOpportunity.confidenceLevel).toBe('low');
    });

    it('should provide meaningful recommendations for low-alignment scenarios', () => {
      const lowAlignmentIntent = {
        ...mockIntent,
        businessObjective: 'Unrelated business objective',
        technicalRequirements: [],
        dataSourcesNeeded: [],
        operationsRequired: [],
        potentialRisks: []
      };

      const result = analyzer.assessStrategicFit(lowAlignmentIntent);
      expect(result.alignmentScore).toBeLessThan(70);
      expect(result.strategicRecommendations[0]?.type).toBe('pivot');
    });
  });
});