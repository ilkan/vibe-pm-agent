/**
 * Unit tests for Competitive Data Quality Validation Framework
 */

import {
  DataQualityValidator,
  CompetitiveDataValidationError,
  GracefulDegradationManager,
  defaultDataQualityValidator
} from '../../utils/competitive-data-validation';

import {
  CompetitorAnalysisResult,
  MarketSizingResult,
  SourceReference,
  CompetitiveAnalysisError,
  MarketSizingError,
  COMPETITIVE_ANALYSIS_DEFAULTS,
  SOURCE_RELIABILITY_THRESHOLDS
} from '../../models/competitive';

describe('DataQualityValidator', () => {
  let validator: DataQualityValidator;

  beforeEach(() => {
    validator = new DataQualityValidator();
  });

  describe('validateCompetitiveAnalysisInput', () => {
    it('should validate valid competitive analysis input', () => {
      const featureIdea = 'AI-powered project management tool for software development teams';
      const marketContext = {
        industry: 'SaaS',
        geography: ['North America', 'Europe'],
        target_segment: 'Software Development Teams'
      };

      const result = validator.validateCompetitiveAnalysisInput(featureIdea, marketContext);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.warnings).toHaveLength(0);
      expect(result.dataGaps).toHaveLength(0);
    });

    it('should throw error for empty feature idea', () => {
      expect(() => {
        validator.validateCompetitiveAnalysisInput('');
      }).toThrow(CompetitiveDataValidationError);
    });

    it('should throw error for too short feature idea', () => {
      expect(() => {
        validator.validateCompetitiveAnalysisInput('short');
      }).toThrow(CompetitiveDataValidationError);
    });

    it('should handle missing market context gracefully', () => {
      const featureIdea = 'AI-powered project management tool for software development teams';
      
      const result = validator.validateCompetitiveAnalysisInput(featureIdea);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeLessThan(1.0);
      expect(result.dataGaps).toContain('Market context not provided');
      expect(result.recommendations).toContain('Provide industry, geography, and target segment for more accurate analysis');
    });

    it('should warn about very long feature descriptions', () => {
      const longFeatureIdea = 'A'.repeat(2500);
      
      const result = validator.validateCompetitiveAnalysisInput(longFeatureIdea);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Feature idea is very long and may impact analysis focus');
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should detect generic feature descriptions', () => {
      const genericFeatureIdea = 'Build a better app for users to improve their experience with enhanced features and optimized platform';
      
      const result = validator.validateCompetitiveAnalysisInput(genericFeatureIdea);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Feature description appears generic and may limit competitive analysis depth');
      expect(result.confidence).toBeLessThan(1.0);
    });
  });

  describe('validateMarketSizingInput', () => {
    it('should validate valid market sizing input', () => {
      const featureIdea = 'AI-powered project management tool';
      const marketDefinition = {
        industry: 'SaaS',
        geography: ['North America'],
        customer_segments: ['SMB', 'Enterprise']
      };
      const sizingMethods = ['top-down', 'bottom-up'];

      const result = validator.validateMarketSizingInput(featureIdea, marketDefinition, sizingMethods);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.warnings).toHaveLength(0);
    });

    it('should throw error for missing market definition', () => {
      const featureIdea = 'AI-powered project management tool';
      
      expect(() => {
        validator.validateMarketSizingInput(featureIdea, null, ['top-down']);
      }).toThrow(MarketSizingError);
    });

    it('should throw error for missing industry', () => {
      const featureIdea = 'AI-powered project management tool';
      const marketDefinition = {
        geography: ['North America']
      };
      
      expect(() => {
        validator.validateMarketSizingInput(featureIdea, marketDefinition, ['top-down']);
      }).toThrow(MarketSizingError);
    });

    it('should throw error for invalid sizing methods', () => {
      const featureIdea = 'AI-powered project management tool';
      const marketDefinition = {
        industry: 'SaaS'
      };
      
      expect(() => {
        validator.validateMarketSizingInput(featureIdea, marketDefinition, ['invalid-method']);
      }).toThrow(MarketSizingError);
    });

    it('should warn about single sizing method', () => {
      const featureIdea = 'AI-powered project management tool';
      const marketDefinition = {
        industry: 'SaaS'
      };
      
      const result = validator.validateMarketSizingInput(featureIdea, marketDefinition, ['top-down']);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Using only one sizing method may limit accuracy');
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should handle missing geography gracefully', () => {
      const featureIdea = 'AI-powered project management tool';
      const marketDefinition = {
        industry: 'SaaS'
      };
      
      const result = validator.validateMarketSizingInput(featureIdea, marketDefinition, ['top-down', 'bottom-up']);

      expect(result.isValid).toBe(true);
      expect(result.dataGaps).toContain('Geographic scope not specified');
      expect(result.confidence).toBeLessThan(1.0);
    });
  });

  describe('validateCompetitiveAnalysisResult', () => {
    let mockResult: CompetitorAnalysisResult;

    beforeEach(() => {
      mockResult = {
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
                valueProposition: 'Enterprise-grade solution'
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
            geography: ['North America'],
            targetSegment: 'Enterprise',
            marketMaturity: 'growth',
            regulatoryEnvironment: [],
            technologyTrends: []
          }
        },
        swotAnalysis: [
          {
            competitorName: 'Competitor A',
            strengths: [{ description: 'Strong brand', impact: 'high', confidence: 0.8 }],
            weaknesses: [{ description: 'High pricing', impact: 'medium', confidence: 0.7 }],
            opportunities: [],
            threats: [],
            strategicImplications: []
          }
        ],
        marketPositioning: {
          positioningMap: [],
          competitorPositions: [],
          marketGaps: [],
          recommendedPositioning: []
        },
        strategicRecommendations: [
          {
            type: 'differentiation',
            title: 'Focus on SMB market',
            description: 'Target small businesses',
            rationale: ['Lower competition'],
            implementation: [
              {
                step: 1,
                action: 'Research SMB needs',
                timeline: '2 weeks',
                dependencies: [],
                successMetrics: ['Survey completion']
              }
            ],
            expectedOutcome: 'Market entry',
            riskLevel: 'medium',
            timeframe: '6 months',
            resourceRequirements: ['Marketing team']
          }
        ],
        sourceAttribution: [
          {
            id: 'source1',
            type: 'gartner',
            title: 'Market Analysis Report',
            organization: 'Gartner',
            publishDate: '2024-01-01',
            accessDate: '2024-01-15',
            reliability: 0.9,
            relevance: 0.8,
            dataFreshness: {
              status: 'fresh',
              ageInDays: 30,
              recommendedUpdateFrequency: 90,
              lastValidated: '2024-01-15'
            },
            citationFormat: 'Gartner (2024)',
            keyFindings: ['Market growing at 15%'],
            limitations: []
          }
        ],
        confidenceLevel: 'high',
        lastUpdated: '2024-01-15',
        dataQuality: {
          sourceReliability: 0.9,
          dataFreshness: 0.8,
          methodologyRigor: 0.7,
          overallConfidence: 0.8,
          qualityIndicators: [],
          recommendations: []
        }
      };
    });

    it('should validate complete competitive analysis result', () => {
      const qualityCheck = validator.validateCompetitiveAnalysisResult(mockResult);

      expect(qualityCheck.overallConfidence).toBeGreaterThan(0.5);
      expect(qualityCheck.sourceReliability).toBeGreaterThan(0.8);
      expect(qualityCheck.qualityIndicators).toBeDefined();
      expect(Array.isArray(qualityCheck.recommendations)).toBe(true);
    });

    it('should handle result with no competitors', () => {
      mockResult.competitiveMatrix.competitors = [];

      const qualityCheck = validator.validateCompetitiveAnalysisResult(mockResult);

      expect(qualityCheck.overallConfidence).toBeLessThan(0.7);
      expect(qualityCheck.recommendations).toContain('Expand competitor research to identify market players');
    });

    it('should handle result with insufficient competitor data', () => {
      mockResult.competitiveMatrix.competitors = [
        {
          name: 'Incomplete Competitor',
          marketShare: 0,
          strengths: [],
          weaknesses: [],
          keyFeatures: [],
          pricing: {
            model: 'subscription',
            startingPrice: 0,
            currency: 'USD',
            valueProposition: ''
          },
          targetMarket: [],
          recentMoves: []
        }
      ];

      const qualityCheck = validator.validateCompetitiveAnalysisResult(mockResult);

      expect(qualityCheck.overallConfidence).toBeLessThan(0.85);
      expect(qualityCheck.recommendations).toContain('Gather more detailed information on key competitors');
    });

    it('should handle result with no source attribution', () => {
      mockResult.sourceAttribution = [];

      const qualityCheck = validator.validateCompetitiveAnalysisResult(mockResult);

      expect(qualityCheck.sourceReliability).toBe(0);
      expect(qualityCheck.recommendations).toContain('Add credible source references to support analysis');
    });
  });

  describe('validateMarketSizingResult', () => {
    let mockResult: MarketSizingResult;

    beforeEach(() => {
      mockResult = {
        tam: {
          value: 10000000000,
          currency: 'USD',
          timeframe: '2024',
          growthRate: 0.15,
          methodology: 'top-down',
          dataQuality: 'high',
          calculationDate: '2024-01-15',
          geographicScope: ['North America'],
          marketSegments: ['Enterprise']
        },
        sam: {
          value: 1000000000,
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
          value: 100000000,
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
            description: 'Industry report based',
            dataSource: 'Gartner',
            reliability: 0.9,
            calculationSteps: [],
            limitations: [],
            confidence: 0.8
          }
        ],
        scenarios: [],
        confidenceIntervals: [
          {
            marketType: 'tam',
            lowerBound: 8000000000,
            upperBound: 12000000000,
            confidenceLevel: 0.95,
            methodology: 'statistical'
          }
        ],
        sourceAttribution: [
          {
            id: 'source1',
            type: 'gartner',
            title: 'Market Size Report',
            organization: 'Gartner',
            publishDate: '2024-01-01',
            accessDate: '2024-01-15',
            reliability: 0.9,
            relevance: 0.9,
            dataFreshness: {
              status: 'fresh',
              ageInDays: 15,
              recommendedUpdateFrequency: 90,
              lastValidated: '2024-01-15'
            },
            citationFormat: 'Gartner (2024)',
            keyFindings: ['Market size $10B'],
            limitations: []
          }
        ],
        assumptions: [
          {
            category: 'market-growth',
            description: 'Market grows at 15% annually',
            value: 0.15,
            confidence: 0.8,
            impact: 'high'
          }
        ],
        marketDynamics: {
          growthDrivers: [],
          marketBarriers: [],
          seasonality: [],
          cyclicalFactors: [],
          disruptiveForces: []
        }
      };
    });

    it('should validate complete market sizing result', () => {
      const qualityCheck = validator.validateMarketSizingResult(mockResult);

      expect(qualityCheck.overallConfidence).toBeGreaterThan(0.5);
      expect(qualityCheck.sourceReliability).toBeGreaterThan(0.8);
      expect(qualityCheck.qualityIndicators).toBeDefined();
    });

    it('should detect illogical TAM/SAM/SOM relationship', () => {
      mockResult.sam.value = 15000000000; // SAM > TAM (illogical)

      const qualityCheck = validator.validateMarketSizingResult(mockResult);

      expect(qualityCheck.overallConfidence).toBeLessThan(0.85);
      const logicIndicator = qualityCheck.qualityIndicators.find(i => i.metric === 'Market Size Logic');
      expect(logicIndicator?.score).toBeLessThan(0.5);
    });

    it('should handle single methodology', () => {
      mockResult.methodology = [mockResult.methodology[0]]; // Only one methodology

      const qualityCheck = validator.validateMarketSizingResult(mockResult);

      expect(qualityCheck.recommendations).toContain('Use multiple sizing methodologies for validation');
    });

    it('should handle missing assumptions', () => {
      mockResult.assumptions = [];

      const qualityCheck = validator.validateMarketSizingResult(mockResult);

      expect(qualityCheck.recommendations).toContain('Document key market assumptions for transparency');
    });

    it('should handle invalid confidence intervals', () => {
      mockResult.confidenceIntervals = [
        {
          marketType: 'tam',
          lowerBound: 12000000000, // Lower > Upper (invalid)
          upperBound: 8000000000,
          confidenceLevel: 0.95,
          methodology: 'statistical'
        }
      ];

      const qualityCheck = validator.validateMarketSizingResult(mockResult);

      expect(qualityCheck.recommendations).toContain('Review and correct invalid confidence intervals');
    });
  });
});

describe('GracefulDegradationManager', () => {
  describe('handleInsufficientCompetitorData', () => {
    it('should handle no competitors', () => {
      const result = GracefulDegradationManager.handleInsufficientCompetitorData([]);

      expect(result.canProceed).toBe(false);
      expect(result.degradedAnalysis).toBe(true);
      expect(result.adjustedConfidence).toBe(0);
      expect(result.recommendations).toContain('No competitors identified. Cannot perform competitive analysis.');
    });

    it('should handle insufficient competitors', () => {
      const competitors = [{ name: 'Competitor 1' }]; // Only 1 competitor, need 3
      const result = GracefulDegradationManager.handleInsufficientCompetitorData(competitors, 3);

      expect(result.canProceed).toBe(true);
      expect(result.degradedAnalysis).toBe(true);
      expect(result.adjustedConfidence).toBeCloseTo(0.33, 1);
      expect(result.recommendations[0]).toContain('Limited competitor data (1/3)');
    });

    it('should handle sufficient competitors', () => {
      const competitors = [
        { name: 'Competitor 1' },
        { name: 'Competitor 2' },
        { name: 'Competitor 3' }
      ];
      const result = GracefulDegradationManager.handleInsufficientCompetitorData(competitors, 3);

      expect(result.canProceed).toBe(true);
      expect(result.degradedAnalysis).toBe(false);
      expect(result.adjustedConfidence).toBe(1.0);
      expect(result.recommendations).toHaveLength(0);
    });
  });

  describe('handleInsufficientMarketData', () => {
    it('should handle severely insufficient data', () => {
      const availableData = {}; // No data
      const requiredFields = ['industry', 'totalMarketSize', 'customerSegments'];
      
      const result = GracefulDegradationManager.handleInsufficientMarketData(availableData, requiredFields);

      expect(result.canProceed).toBe(false);
      expect(result.degradedAnalysis).toBe(true);
      expect(result.adjustedConfidence).toBe(0);
      expect(result.availableMethodologies).toHaveLength(0);
    });

    it('should handle partial data with some methodologies available', () => {
      const availableData = {
        industry: 'SaaS',
        totalMarketSize: 1000000000
      };
      const requiredFields = ['industry', 'totalMarketSize', 'customerSegments'];
      
      const result = GracefulDegradationManager.handleInsufficientMarketData(availableData, requiredFields);

      expect(result.canProceed).toBe(true);
      expect(result.degradedAnalysis).toBe(true);
      expect(result.availableMethodologies).toContain('top-down');
      expect(result.adjustedConfidence).toBeCloseTo(0.67, 1);
    });

    it('should handle complete data', () => {
      const availableData = {
        industry: 'SaaS',
        totalMarketSize: 1000000000,
        customerSegments: ['SMB', 'Enterprise'],
        pricingData: { average: 100 },
        valueProposition: 'High value',
        customerWillingness: 0.8
      };
      const requiredFields = ['industry', 'totalMarketSize', 'customerSegments'];
      
      const result = GracefulDegradationManager.handleInsufficientMarketData(availableData, requiredFields);

      expect(result.canProceed).toBe(true);
      expect(result.degradedAnalysis).toBe(false);
      expect(result.availableMethodologies).toContain('top-down');
      expect(result.availableMethodologies).toContain('bottom-up');
      expect(result.availableMethodologies).toContain('value-theory');
      expect(result.adjustedConfidence).toBe(1.0);
    });
  });

  describe('handleStaleData', () => {
    it('should handle mostly stale data', () => {
      const staleSources: SourceReference[] = [
        {
          id: 'source1',
          type: 'gartner',
          title: 'Old Report',
          organization: 'Gartner',
          publishDate: '2022-01-01',
          accessDate: '2024-01-15',
          reliability: 0.9,
          relevance: 0.8,
          dataFreshness: {
            status: 'stale',
            ageInDays: 400, // Very stale
            recommendedUpdateFrequency: 90,
            lastValidated: '2022-01-01'
          },
          citationFormat: 'Gartner (2022)',
          keyFindings: [],
          limitations: []
        }
      ];

      const result = GracefulDegradationManager.handleStaleData(staleSources, 90);

      expect(result.canProceed).toBe(true);
      expect(result.degradedAnalysis).toBe(true);
      expect(result.adjustedConfidence).toBe(0.4);
      expect(result.staleSourceCount).toBe(1);
      expect(result.recommendations).toContain('Most data sources are stale. Analysis reliability is significantly reduced.');
    });

    it('should handle fresh data', () => {
      const freshSources: SourceReference[] = [
        {
          id: 'source1',
          type: 'gartner',
          title: 'Recent Report',
          organization: 'Gartner',
          publishDate: '2024-01-01',
          accessDate: '2024-01-15',
          reliability: 0.9,
          relevance: 0.8,
          dataFreshness: {
            status: 'fresh',
            ageInDays: 15, // Very fresh
            recommendedUpdateFrequency: 90,
            lastValidated: '2024-01-15'
          },
          citationFormat: 'Gartner (2024)',
          keyFindings: [],
          limitations: []
        }
      ];

      const result = GracefulDegradationManager.handleStaleData(freshSources, 90);

      expect(result.canProceed).toBe(true);
      expect(result.degradedAnalysis).toBe(false);
      expect(result.adjustedConfidence).toBe(1.0);
      expect(result.staleSourceCount).toBe(0);
    });
  });
});

describe('CompetitiveDataValidationError', () => {
  it('should create error with all properties', () => {
    const error = new CompetitiveDataValidationError(
      'Test error',
      'competitive',
      'error',
      'test_field',
      ['suggestion1', 'suggestion2']
    );

    expect(error.message).toBe('Test error');
    expect(error.validationType).toBe('competitive');
    expect(error.severity).toBe('error');
    expect(error.field).toBe('test_field');
    expect(error.suggestions).toEqual(['suggestion1', 'suggestion2']);
    expect(error.name).toBe('CompetitiveDataValidationError');
  });
});

describe('defaultDataQualityValidator', () => {
  it('should be properly initialized', () => {
    expect(defaultDataQualityValidator).toBeInstanceOf(DataQualityValidator);
  });

  it('should validate basic input', () => {
    const result = defaultDataQualityValidator.validateCompetitiveAnalysisInput(
      'AI-powered project management tool for software teams'
    );

    expect(result.isValid).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
  });
});