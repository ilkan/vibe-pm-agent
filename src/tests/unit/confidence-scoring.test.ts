/**
 * Unit tests for Confidence Scoring and Uncertainty Management System
 */

import {
  ConfidenceScorer,
  defaultConfidenceScorer,
  ConfidenceScore,
  ConfidenceComponent,
  UncertaintyFactor,
  ConfidenceRecommendation,
  UncertaintyIndicator
} from '../../utils/confidence-scoring';

import {
  CompetitorAnalysisResult,
  MarketSizingResult,
  SourceReference,
  DataQualityCheck,
  SWOTAnalysis,
  StrategyRecommendation,
  MarketAssumption,
  ConfidenceInterval,
  SOURCE_RELIABILITY_THRESHOLDS
} from '../../models/competitive';

describe('ConfidenceScorer', () => {
  let scorer: ConfidenceScorer;
  let mockCompetitiveResult: CompetitorAnalysisResult;
  let mockMarketSizingResult: MarketSizingResult;
  let mockDataQuality: DataQualityCheck;

  beforeEach(() => {
    scorer = new ConfidenceScorer();

    // Mock competitive analysis result
    mockCompetitiveResult = {
      competitiveMatrix: {
        competitors: [
          {
            name: 'Competitor A',
            marketShare: 25,
            strengths: ['Strong brand', 'Large user base'],
            weaknesses: ['High pricing'],
            keyFeatures: ['Feature 1', 'Feature 2'],
            pricing: {
              model: 'subscription',
              startingPrice: 99,
              currency: 'USD',
              valueProposition: 'Enterprise solution'
            },
            targetMarket: ['Enterprise'],
            recentMoves: [
              {
                date: '2024-01-01',
                type: 'product-launch',
                description: 'New feature launch',
                impact: 'medium',
                strategicImplication: 'Increased competition'
              }
            ]
          },
          {
            name: 'Competitor B',
            marketShare: 15,
            strengths: ['Low cost', 'Easy to use'],
            weaknesses: ['Limited features'],
            keyFeatures: ['Basic features'],
            pricing: {
              model: 'freemium',
              startingPrice: 0,
              currency: 'USD',
              valueProposition: 'Cost-effective'
            },
            targetMarket: ['SMB'],
            recentMoves: []
          }
        ],
        evaluationCriteria: [
          {
            name: 'Market Share',
            weight: 0.3,
            description: 'Current market position',
            measurementType: 'quantitative'
          }
        ],
        rankings: [
          {
            competitorName: 'Competitor A',
            overallScore: 8.5,
            criteriaScores: { 'Market Share': 9.0 },
            rank: 1,
            competitiveAdvantage: ['Strong brand']
          }
        ],
        differentiationOpportunities: ['Focus on SMB market'],
        marketContext: {
          industry: 'SaaS',
          geography: ['North America', 'Europe'],
          targetSegment: 'Enterprise',
          marketMaturity: 'growth',
          regulatoryEnvironment: ['GDPR'],
          technologyTrends: ['AI integration']
        }
      },
      swotAnalysis: [
        {
          competitorName: 'Competitor A',
          strengths: [
            { description: 'Strong brand recognition', impact: 'high', confidence: 0.9 },
            { description: 'Large customer base', impact: 'high', confidence: 0.8 }
          ],
          weaknesses: [
            { description: 'High pricing', impact: 'medium', confidence: 0.7 }
          ],
          opportunities: [
            { description: 'SMB market expansion', impact: 'high', confidence: 0.6 }
          ],
          threats: [
            { description: 'New entrants', impact: 'medium', confidence: 0.5 }
          ],
          strategicImplications: ['Focus on value proposition']
        }
      ],
      marketPositioning: {
        positioningMap: [
          {
            name: 'Price vs Features',
            lowEnd: 'Low Price',
            highEnd: 'High Features',
            importance: 0.8
          }
        ],
        competitorPositions: [
          {
            competitorName: 'Competitor A',
            coordinates: { 'Price vs Features': 0.8 },
            marketSegment: 'Enterprise'
          }
        ],
        marketGaps: [
          {
            description: 'Mid-market segment underserved',
            size: 'medium',
            difficulty: 'moderate',
            timeToMarket: '6-12 months',
            potentialValue: 50000000
          }
        ],
        recommendedPositioning: ['Target mid-market with balanced offering']
      },
      strategicRecommendations: [
        {
          type: 'differentiation',
          title: 'Focus on mid-market segment',
          description: 'Target underserved mid-market customers',
          rationale: ['Lower competition', 'Higher growth potential'],
          implementation: [
            {
              step: 1,
              action: 'Market research',
              timeline: '4 weeks',
              dependencies: [],
              successMetrics: ['Survey completion', 'Customer interviews']
            },
            {
              step: 2,
              action: 'Product development',
              timeline: '12 weeks',
              dependencies: ['Market research'],
              successMetrics: ['Feature completion', 'Beta testing']
            }
          ],
          expectedOutcome: 'Market entry within 6 months',
          riskLevel: 'medium',
          timeframe: '6 months',
          resourceRequirements: ['Product team', 'Marketing budget']
        }
      ],
      sourceAttribution: [
        {
          id: 'source1',
          type: 'gartner',
          title: 'Market Analysis Report 2024',
          organization: 'Gartner',
          publishDate: '2024-01-01',
          accessDate: '2024-01-15',
          reliability: 0.9,
          relevance: 0.85,
          dataFreshness: {
            status: 'fresh',
            ageInDays: 30,
            recommendedUpdateFrequency: 90,
            lastValidated: '2024-01-15'
          },
          citationFormat: 'Gartner (2024)',
          keyFindings: ['Market growing at 15% annually'],
          limitations: ['Limited geographic scope']
        },
        {
          id: 'source2',
          type: 'mckinsey',
          title: 'Industry Trends Report',
          organization: 'McKinsey & Company',
          publishDate: '2023-12-01',
          accessDate: '2024-01-15',
          reliability: 0.95,
          relevance: 0.8,
          dataFreshness: {
            status: 'recent',
            ageInDays: 45,
            recommendedUpdateFrequency: 180,
            lastValidated: '2024-01-15'
          },
          citationFormat: 'McKinsey (2023)',
          keyFindings: ['Digital transformation driving growth'],
          limitations: []
        }
      ],
      confidenceLevel: 'high',
      lastUpdated: '2024-01-15T10:00:00Z',
      dataQuality: {
        sourceReliability: 0.925,
        dataFreshness: 0.85,
        methodologyRigor: 0.8,
        overallConfidence: 0.85,
        qualityIndicators: [],
        recommendations: []
      }
    };

    // Mock market sizing result
    mockMarketSizingResult = {
      tam: {
        value: 10000000000,
        currency: 'USD',
        timeframe: '2024',
        growthRate: 0.15,
        methodology: 'top-down',
        dataQuality: 'high',
        calculationDate: '2024-01-15',
        geographicScope: ['North America', 'Europe'],
        marketSegments: ['Enterprise', 'SMB']
      },
      sam: {
        value: 2000000000,
        currency: 'USD',
        timeframe: '2024',
        growthRate: 0.12,
        methodology: 'bottom-up',
        dataQuality: 'high',
        calculationDate: '2024-01-15',
        geographicScope: ['North America'],
        marketSegments: ['Enterprise']
      },
      som: {
        value: 200000000,
        currency: 'USD',
        timeframe: '2024',
        growthRate: 0.10,
        methodology: 'value-theory',
        dataQuality: 'medium',
        calculationDate: '2024-01-15',
        geographicScope: ['North America'],
        marketSegments: ['Enterprise']
      },
      methodology: [
        {
          type: 'top-down',
          description: 'Industry report based calculation',
          dataSource: 'Gartner Market Research',
          reliability: 0.9,
          calculationSteps: [
            {
              step: 1,
              description: 'Total industry size',
              formula: 'Industry Size * Growth Rate',
              inputs: { industrySize: 8500000000, growthRate: 0.15 },
              output: 10000000000,
              assumptions: ['Consistent growth rate']
            }
          ],
          limitations: ['Geographic scope limited'],
          confidence: 0.85
        },
        {
          type: 'bottom-up',
          description: 'Customer segment based calculation',
          dataSource: 'Customer surveys and pricing analysis',
          reliability: 0.8,
          calculationSteps: [
            {
              step: 1,
              description: 'Customer count * Average revenue',
              formula: 'Customers * ARPU',
              inputs: { customers: 20000, arpu: 100000 },
              output: 2000000000,
              assumptions: ['Stable customer base']
            }
          ],
          limitations: ['Sample size constraints'],
          confidence: 0.75
        }
      ],
      scenarios: [
        {
          name: 'conservative',
          description: 'Conservative growth assumptions',
          tam: 8000000000,
          sam: 1500000000,
          som: 150000000,
          probability: 0.3,
          keyAssumptions: ['Lower growth rates', 'Increased competition'],
          riskFactors: ['Economic downturn', 'Market saturation']
        },
        {
          name: 'balanced',
          description: 'Balanced growth scenario',
          tam: 10000000000,
          sam: 2000000000,
          som: 200000000,
          probability: 0.5,
          keyAssumptions: ['Current growth trends continue'],
          riskFactors: ['Regulatory changes']
        },
        {
          name: 'aggressive',
          description: 'Optimistic growth scenario',
          tam: 12000000000,
          sam: 2500000000,
          som: 300000000,
          probability: 0.2,
          keyAssumptions: ['Accelerated digital adoption'],
          riskFactors: ['Technology disruption']
        }
      ],
      confidenceIntervals: [
        {
          marketType: 'tam',
          lowerBound: 8500000000,
          upperBound: 11500000000,
          confidenceLevel: 0.95,
          methodology: 'statistical'
        },
        {
          marketType: 'sam',
          lowerBound: 1700000000,
          upperBound: 2300000000,
          confidenceLevel: 0.90,
          methodology: 'expert-judgment'
        },
        {
          marketType: 'som',
          lowerBound: 150000000,
          upperBound: 250000000,
          confidenceLevel: 0.85,
          methodology: 'scenario-analysis'
        }
      ],
      sourceAttribution: [
        {
          id: 'market-source1',
          type: 'gartner',
          title: 'Global Market Size Report 2024',
          organization: 'Gartner',
          publishDate: '2024-01-01',
          accessDate: '2024-01-15',
          reliability: 0.95,
          relevance: 0.9,
          dataFreshness: {
            status: 'fresh',
            ageInDays: 15,
            recommendedUpdateFrequency: 90,
            lastValidated: '2024-01-15'
          },
          citationFormat: 'Gartner (2024)',
          keyFindings: ['Market size $10B with 15% growth'],
          limitations: []
        }
      ],
      assumptions: [
        {
          category: 'market-growth',
          description: 'Market will grow at 15% annually',
          value: 0.15,
          confidence: 0.8,
          impact: 'high',
          sourceReference: 'market-source1'
        },
        {
          category: 'penetration-rate',
          description: 'Can capture 10% of SAM',
          value: 0.10,
          confidence: 0.6,
          impact: 'high'
        },
        {
          category: 'pricing',
          description: 'Average customer value $100k annually',
          value: 100000,
          confidence: 0.7,
          impact: 'medium'
        }
      ],
      marketDynamics: {
        growthDrivers: ['Digital transformation', 'Remote work trends'],
        marketBarriers: ['High switching costs', 'Regulatory compliance'],
        seasonality: [
          {
            period: 'Q4',
            impact: 0.2,
            description: 'Budget cycles drive Q4 purchases'
          }
        ],
        cyclicalFactors: ['Economic cycles affect enterprise spending'],
        disruptiveForces: ['AI automation', 'New business models']
      }
    };

    // Mock data quality
    mockDataQuality = {
      sourceReliability: 0.9,
      dataFreshness: 0.85,
      methodologyRigor: 0.8,
      overallConfidence: 0.85,
      qualityIndicators: [
        {
          metric: 'Source Count',
          score: 0.8,
          description: '2 authoritative sources',
          impact: 'important'
        }
      ],
      recommendations: ['Add more recent data sources']
    };
  });

  describe('calculateCompetitiveAnalysisConfidence', () => {
    it('should calculate confidence score for complete competitive analysis', () => {
      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        mockCompetitiveResult,
        mockDataQuality
      );

      expect(confidenceScore.overall).toBeGreaterThan(0.7);
      expect(confidenceScore.reliabilityLevel).toBe('high');
      expect(confidenceScore.components).toHaveLength(5);
      expect(confidenceScore.uncertaintyFactors).toBeDefined();
      expect(confidenceScore.recommendations).toBeDefined();
      expect(confidenceScore.lastCalculated).toBeDefined();
    });

    it('should identify data quality component', () => {
      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        mockCompetitiveResult,
        mockDataQuality
      );

      const dataQualityComponent = confidenceScore.components.find(c => c.name === 'Data Quality');
      expect(dataQualityComponent).toBeDefined();
      expect(dataQualityComponent!.score).toBeGreaterThan(0.8);
      expect(dataQualityComponent!.uncertaintyImpact).toBe('low');
    });

    it('should identify competitor coverage component', () => {
      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        mockCompetitiveResult,
        mockDataQuality
      );

      const coverageComponent = confidenceScore.components.find(c => c.name === 'Competitor Coverage');
      expect(coverageComponent).toBeDefined();
      expect(coverageComponent!.contributingFactors).toContain('Competitor count: 2');
    });

    it('should handle insufficient competitors', () => {
      mockCompetitiveResult.competitiveMatrix.competitors = []; // No competitors

      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        mockCompetitiveResult,
        mockDataQuality
      );

      expect(confidenceScore.overall).toBeLessThan(0.75);
      expect(confidenceScore.reliabilityLevel).toBe('medium');
      
      const coverageComponent = confidenceScore.components.find(c => c.name === 'Competitor Coverage');
      expect(coverageComponent!.score).toBe(0);
      expect(coverageComponent!.uncertaintyImpact).toBe('high');
    });

    it('should handle poor source reliability', () => {
      mockCompetitiveResult.sourceAttribution = [
        {
          ...mockCompetitiveResult.sourceAttribution[0],
          reliability: 0.3 // Low reliability
        }
      ];

      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        mockCompetitiveResult,
        mockDataQuality
      );

      const sourceComponent = confidenceScore.components.find(c => c.name === 'Source Reliability');
      expect(sourceComponent!.score).toBeLessThanOrEqual(0.5);
      expect(sourceComponent!.uncertaintyImpact).toBe('high');
    });

    it('should identify uncertainty factors', () => {
      // Make market emerging to trigger uncertainty
      mockCompetitiveResult.competitiveMatrix.marketContext.marketMaturity = 'emerging';

      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        mockCompetitiveResult,
        mockDataQuality
      );

      const marketVolatilityFactor = confidenceScore.uncertaintyFactors.find(
        f => f.type === 'market-volatility'
      );
      expect(marketVolatilityFactor).toBeDefined();
      expect(marketVolatilityFactor!.severity).toBe('high');
    });

    it('should generate appropriate recommendations', () => {
      // Create low-quality scenario
      mockCompetitiveResult.competitiveMatrix.competitors = []; // No competitors
      mockCompetitiveResult.sourceAttribution = []; // No sources

      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        mockCompetitiveResult,
        { ...mockDataQuality, sourceReliability: 0 }
      );

      expect(confidenceScore.recommendations.length).toBeGreaterThan(0);
      
      const expandResearchRec = confidenceScore.recommendations.find(
        r => r.type === 'expand-research'
      );
      expect(expandResearchRec).toBeDefined();
      expect(expandResearchRec!.priority).toBe('immediate');
    });
  });

  describe('calculateMarketSizingConfidence', () => {
    it('should calculate confidence score for complete market sizing', () => {
      const confidenceScore = scorer.calculateMarketSizingConfidence(
        mockMarketSizingResult,
        mockDataQuality
      );

      expect(confidenceScore.overall).toBeGreaterThan(0.7);
      expect(confidenceScore.reliabilityLevel).toBe('high');
      expect(confidenceScore.components).toHaveLength(6);
      expect(confidenceScore.uncertaintyFactors).toBeDefined();
      expect(confidenceScore.recommendations).toBeDefined();
    });

    it('should identify methodology rigor component', () => {
      const confidenceScore = scorer.calculateMarketSizingConfidence(
        mockMarketSizingResult,
        mockDataQuality
      );

      const methodologyComponent = confidenceScore.components.find(c => c.name === 'Methodology Rigor');
      expect(methodologyComponent).toBeDefined();
      expect(methodologyComponent!.contributingFactors).toContain('Methodology diversity: top-down, bottom-up');
    });

    it('should identify market size logic component', () => {
      const confidenceScore = scorer.calculateMarketSizingConfidence(
        mockMarketSizingResult,
        mockDataQuality
      );

      const logicComponent = confidenceScore.components.find(c => c.name === 'Market Size Logic');
      expect(logicComponent).toBeDefined();
      expect(logicComponent!.score).toBeGreaterThan(0.8); // Should be logical
      expect(logicComponent!.contributingFactors).toContain('TAM > SAM (logical)');
      expect(logicComponent!.contributingFactors).toContain('SAM > SOM (logical)');
    });

    it('should detect illogical market size relationships', () => {
      mockMarketSizingResult.sam.value = 15000000000; // SAM > TAM (illogical)

      const confidenceScore = scorer.calculateMarketSizingConfidence(
        mockMarketSizingResult,
        mockDataQuality
      );

      const logicComponent = confidenceScore.components.find(c => c.name === 'Market Size Logic');
      expect(logicComponent!.score).toBeLessThan(0.5);
      expect(logicComponent!.uncertaintyImpact).toBe('critical');
    });

    it('should handle single methodology', () => {
      mockMarketSizingResult.methodology = [mockMarketSizingResult.methodology[0]]; // Only one method

      const confidenceScore = scorer.calculateMarketSizingConfidence(
        mockMarketSizingResult,
        mockDataQuality
      );

      const methodologyFactor = confidenceScore.uncertaintyFactors.find(
        f => f.type === 'methodology'
      );
      expect(methodologyFactor).toBeDefined();
      expect(methodologyFactor!.description).toContain('Single methodology increases sizing uncertainty');
    });

    it('should handle low-confidence assumptions', () => {
      mockMarketSizingResult.assumptions = [
        {
          category: 'market-growth',
          description: 'Uncertain growth rate',
          value: 0.15,
          confidence: 0.3, // Low confidence
          impact: 'high'
        }
      ];

      const confidenceScore = scorer.calculateMarketSizingConfidence(
        mockMarketSizingResult,
        mockDataQuality
      );

      const assumptionFactor = confidenceScore.uncertaintyFactors.find(
        f => f.type === 'assumption-risk'
      );
      expect(assumptionFactor).toBeDefined();
      expect(assumptionFactor!.severity).toBe('high');
    });

    it('should validate confidence intervals', () => {
      const confidenceScore = scorer.calculateMarketSizingConfidence(
        mockMarketSizingResult,
        mockDataQuality
      );

      const intervalComponent = confidenceScore.components.find(c => c.name === 'Confidence Intervals');
      expect(intervalComponent).toBeDefined();
      expect(intervalComponent!.score).toBeGreaterThan(0.8); // All intervals are valid
    });

    it('should handle invalid confidence intervals', () => {
      mockMarketSizingResult.confidenceIntervals = [
        {
          marketType: 'tam',
          lowerBound: 12000000000, // Lower > Upper (invalid)
          upperBound: 8000000000,
          confidenceLevel: 0.95,
          methodology: 'statistical'
        }
      ];

      const confidenceScore = scorer.calculateMarketSizingConfidence(
        mockMarketSizingResult,
        mockDataQuality
      );

      // Should have some recommendation due to invalid intervals
      expect(confidenceScore.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('generateUncertaintyIndicators', () => {
    it('should generate uncertainty indicators for competitive analysis', () => {
      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        mockCompetitiveResult,
        mockDataQuality
      );

      const indicators = scorer.generateUncertaintyIndicators(mockCompetitiveResult, confidenceScore);

      expect(indicators).toBeDefined();
      expect(Array.isArray(indicators)).toBe(true);
      
      if (indicators.length > 0) {
        const indicator = indicators[0];
        expect(indicator.metric).toBeDefined();
        expect(indicator.currentValue).toBeDefined();
        expect(indicator.uncertaintyRange).toBeDefined();
        expect(indicator.uncertaintyRange.lower).toBeLessThan(indicator.uncertaintyRange.upper);
        expect(indicator.lastUpdated).toBeDefined();
      }
    });

    it('should generate uncertainty indicators for market sizing', () => {
      const confidenceScore = scorer.calculateMarketSizingConfidence(
        mockMarketSizingResult,
        mockDataQuality
      );

      const indicators = scorer.generateUncertaintyIndicators(mockMarketSizingResult, confidenceScore);

      expect(indicators).toBeDefined();
      expect(Array.isArray(indicators)).toBe(true);
      expect(indicators.length).toBeGreaterThan(0);

      const tamIndicator = indicators.find(i => i.metric === 'Total Addressable Market (TAM)');
      expect(tamIndicator).toBeDefined();
      expect(tamIndicator!.currentValue).toBe(mockMarketSizingResult.tam.value);
      expect(tamIndicator!.trendDirection).toBe('increasing'); // Growth rate > 0
    });

    it('should calculate market share uncertainty for competitive analysis', () => {
      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        mockCompetitiveResult,
        mockDataQuality
      );

      const indicators = scorer.generateUncertaintyIndicators(mockCompetitiveResult, confidenceScore);

      const marketShareIndicator = indicators.find(i => i.metric === 'Market Share Distribution');
      if (marketShareIndicator) {
        expect(marketShareIndicator.currentValue).toBeGreaterThan(0);
        expect(marketShareIndicator.volatility).toBeGreaterThanOrEqual(0);
        expect(marketShareIndicator.uncertaintyRange.confidenceLevel).toBe(0.68);
      }
    });

    it('should calculate growth rate uncertainty for market sizing', () => {
      const confidenceScore = scorer.calculateMarketSizingConfidence(
        mockMarketSizingResult,
        mockDataQuality
      );

      const indicators = scorer.generateUncertaintyIndicators(mockMarketSizingResult, confidenceScore);

      const growthIndicator = indicators.find(i => i.metric === 'Market Growth Rate');
      expect(growthIndicator).toBeDefined();
      expect(growthIndicator!.currentValue).toBeCloseTo(0.123, 2); // Average of 0.15, 0.12, 0.10
      expect(growthIndicator!.trendDirection).toBe('increasing');
    });
  });

  describe('reliability level determination', () => {
    it('should determine very-high reliability', () => {
      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        mockCompetitiveResult,
        { ...mockDataQuality, overallConfidence: 0.95 }
      );

      expect(confidenceScore.reliabilityLevel).toBe('high');
    });

    it('should determine low reliability for poor data', () => {
      mockCompetitiveResult.competitiveMatrix.competitors = [];
      mockCompetitiveResult.sourceAttribution = [];

      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        mockCompetitiveResult,
        { ...mockDataQuality, sourceReliability: 0.2, overallConfidence: 0.3 }
      );

      expect(confidenceScore.reliabilityLevel).toBe('very-low');
    });

    it('should determine very-low reliability for critical issues', () => {
      mockCompetitiveResult.competitiveMatrix.competitors = [];
      mockCompetitiveResult.sourceAttribution = [];
      mockCompetitiveResult.swotAnalysis = [];
      mockCompetitiveResult.strategicRecommendations = [];

      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        mockCompetitiveResult,
        { ...mockDataQuality, sourceReliability: 0.1, overallConfidence: 0.1 }
      );

      expect(confidenceScore.reliabilityLevel).toBe('very-low');
    });
  });

  describe('recommendation generation', () => {
    it('should prioritize immediate recommendations for critical issues', () => {
      mockCompetitiveResult.competitiveMatrix.competitors = [];
      mockCompetitiveResult.sourceAttribution = [];

      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        mockCompetitiveResult,
        { ...mockDataQuality, sourceReliability: 0 }
      );

      const immediateRecs = confidenceScore.recommendations.filter(r => r.priority === 'immediate');
      expect(immediateRecs.length).toBeGreaterThan(0);
      
      const expandResearchRec = immediateRecs.find(r => r.type === 'expand-research');
      expect(expandResearchRec).toBeDefined();
      expect(expandResearchRec!.expectedImpact).toBeGreaterThan(0);
      expect(expandResearchRec!.specificActions).toBeDefined();
    });

    it('should generate methodology recommendations for market sizing', () => {
      mockMarketSizingResult.methodology = [mockMarketSizingResult.methodology[0]]; // Single method

      const confidenceScore = scorer.calculateMarketSizingConfidence(
        mockMarketSizingResult,
        mockDataQuality
      );

      // Should have recommendations for single methodology
      expect(confidenceScore.recommendations.length).toBeGreaterThan(0);
      expect(confidenceScore.uncertaintyFactors.some(f => f.type === 'methodology')).toBe(true);
    });

    it('should sort recommendations by priority and impact', () => {
      mockCompetitiveResult.competitiveMatrix.competitors = [];
      mockCompetitiveResult.sourceAttribution = [];

      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        mockCompetitiveResult,
        { ...mockDataQuality, sourceReliability: 0.3 }
      );

      const recommendations = confidenceScore.recommendations;
      expect(recommendations.length).toBeGreaterThan(1);

      // Check that immediate priority comes before high priority
      const immediateIndex = recommendations.findIndex(r => r.priority === 'immediate');
      const highIndex = recommendations.findIndex(r => r.priority === 'high');
      
      if (immediateIndex >= 0 && highIndex >= 0) {
        expect(immediateIndex).toBeLessThan(highIndex);
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty competitive analysis result', () => {
      const emptyResult: CompetitorAnalysisResult = {
        ...mockCompetitiveResult,
        competitiveMatrix: {
          ...mockCompetitiveResult.competitiveMatrix,
          competitors: []
        },
        swotAnalysis: [],
        strategicRecommendations: [],
        sourceAttribution: []
      };

      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        emptyResult,
        { ...mockDataQuality, sourceReliability: 0, overallConfidence: 0 }
      );

      expect(confidenceScore.overall).toBeLessThan(0.3);
      expect(confidenceScore.reliabilityLevel).toBe('very-low');
      expect(confidenceScore.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle empty market sizing result', () => {
      const emptyResult: MarketSizingResult = {
        ...mockMarketSizingResult,
        methodology: [],
        assumptions: [],
        confidenceIntervals: [],
        sourceAttribution: []
      };

      const confidenceScore = scorer.calculateMarketSizingConfidence(
        emptyResult,
        { ...mockDataQuality, sourceReliability: 0, methodologyRigor: 0 }
      );

      expect(confidenceScore.overall).toBeLessThan(0.3);
      expect(confidenceScore.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle missing market context', () => {
      mockCompetitiveResult.competitiveMatrix.marketContext = {
        industry: '',
        geography: [],
        targetSegment: '',
        marketMaturity: 'growth',
        regulatoryEnvironment: [],
        technologyTrends: []
      };

      const confidenceScore = scorer.calculateCompetitiveAnalysisConfidence(
        mockCompetitiveResult,
        mockDataQuality
      );

      const marketContextComponent = confidenceScore.components.find(c => c.name === 'Market Context');
      expect(marketContextComponent!.score).toBeLessThan(0.5);
    });
  });
});

describe('defaultConfidenceScorer', () => {
  it('should be properly initialized', () => {
    expect(defaultConfidenceScorer).toBeInstanceOf(ConfidenceScorer);
  });

  it('should calculate confidence for basic competitive analysis', () => {
    const mockResult: CompetitorAnalysisResult = {
      competitiveMatrix: {
        competitors: [
          {
            name: 'Test Competitor',
            marketShare: 20,
            strengths: ['Strong brand'],
            weaknesses: ['High price'],
            keyFeatures: ['Feature 1'],
            pricing: {
              model: 'subscription',
              startingPrice: 100,
              currency: 'USD',
              valueProposition: 'Value'
            },
            targetMarket: ['Enterprise'],
            recentMoves: []
          }
        ],
        evaluationCriteria: [],
        rankings: [],
        differentiationOpportunities: [],
        marketContext: {
          industry: 'SaaS',
          geography: ['US'],
          targetSegment: 'Enterprise',
          marketMaturity: 'growth',
          regulatoryEnvironment: [],
          technologyTrends: []
        }
      },
      swotAnalysis: [],
      marketPositioning: {
        positioningMap: [],
        competitorPositions: [],
        marketGaps: [],
        recommendedPositioning: []
      },
      strategicRecommendations: [],
      sourceAttribution: [],
      confidenceLevel: 'medium',
      lastUpdated: '2024-01-15',
      dataQuality: {
        sourceReliability: 0.5,
        dataFreshness: 0.5,
        methodologyRigor: 0.5,
        overallConfidence: 0.5,
        qualityIndicators: [],
        recommendations: []
      }
    };

    const mockDataQuality: DataQualityCheck = {
      sourceReliability: 0.5,
      dataFreshness: 0.5,
      methodologyRigor: 0.5,
      overallConfidence: 0.5,
      qualityIndicators: [],
      recommendations: []
    };

    const confidenceScore = defaultConfidenceScorer.calculateCompetitiveAnalysisConfidence(
      mockResult,
      mockDataQuality
    );

    expect(confidenceScore.overall).toBeGreaterThan(0);
    expect(confidenceScore.overall).toBeLessThan(1);
    expect(confidenceScore.components).toBeDefined();
    expect(confidenceScore.uncertaintyFactors).toBeDefined();
    expect(confidenceScore.recommendations).toBeDefined();
  });
});