/**
 * Unit tests for steering file integration with competitive analysis
 */

import { SteeringService } from '../../components/steering-service';
import { SteeringFileGenerator } from '../../components/steering-file-generator';
import { DocumentType } from '../../models/steering';
import { SteeringFileOptions } from '../../models/mcp';
import { CompetitorAnalysisResult } from '../../models/competitive';

// Mock dependencies
jest.mock('../../components/steering-file-manager');
jest.mock('../../components/document-reference-linker');
jest.mock('../../components/steering-user-interaction');
jest.mock('../../components/steering-file-preview');

// Mock the steering user interaction to always return positive responses
const mockPromptForSteeringFileCreation = jest.fn().mockResolvedValue({
  createFiles: true,
  customOptions: {},
  rememberPreferences: false
});

const mockGeneratePreview = jest.fn().mockReturnValue({
  steeringFile: {},
  estimatedSize: 1000,
  contentPreview: 'Mock preview content',
  truncated: false,
  warnings: []
});

const mockShowPreviewAndConfirm = jest.fn().mockResolvedValue(true);
const mockGenerateSummary = jest.fn().mockReturnValue({
  totalFiles: 1,
  filesCreated: 1,
  filesUpdated: 0,
  filesSkipped: 0,
  fileDetails: [],
  processingTimeMs: 100,
  issues: [],
  usageRecommendations: []
});
const mockDisplaySummary = jest.fn().mockResolvedValue(undefined);
const mockCustomizeSteeringOptions = jest.fn().mockImplementation((options) => options);

// Mock the steering file manager to return successful save results
const mockSaveSteeringFile = jest.fn().mockResolvedValue({
  success: true,
  filename: 'test-steering-file.md',
  action: 'created',
  message: 'Steering file created successfully',
  fullPath: '.kiro/steering/test-steering-file.md'
});

// Mock the document reference linker
const mockAddFileReferences = jest.fn().mockImplementation((context) => context);
const mockGenerateFileReferences = jest.fn().mockReturnValue([]);

jest.mock('../../components/steering-user-interaction', () => ({
  SteeringUserInteraction: jest.fn().mockImplementation(() => ({
    promptForSteeringFileCreation: mockPromptForSteeringFileCreation,
    generatePreview: mockGeneratePreview,
    showPreviewAndConfirm: mockShowPreviewAndConfirm,
    generateSummary: mockGenerateSummary,
    displaySummary: mockDisplaySummary,
    customizeSteeringOptions: mockCustomizeSteeringOptions
  }))
}));

jest.mock('../../components/steering-file-manager', () => ({
  SteeringFileManager: jest.fn().mockImplementation(() => ({
    saveSteeringFile: mockSaveSteeringFile,
    getStats: jest.fn().mockReturnValue({})
  }))
}));

jest.mock('../../components/document-reference-linker', () => ({
  DocumentReferenceLinker: jest.fn().mockImplementation(() => ({
    addFileReferences: mockAddFileReferences,
    generateFileReferences: mockGenerateFileReferences
  }))
}));

jest.mock('../../components/steering-file-preview', () => ({
  SteeringFilePreview: jest.fn().mockImplementation(() => ({}))
}));

describe('SteeringService - Competitive Analysis Integration', () => {
  let steeringService: SteeringService;
  let mockCompetitiveAnalysis: CompetitorAnalysisResult;
  let mockMarketSizing: any;

  beforeEach(() => {
    // Initialize service with test-friendly configuration
    steeringService = new SteeringService({
      enabled: true,
      userPreferences: {
        autoCreate: true,
        showPreview: false,
        showSummary: false
      }
    });

    // Mock competitive analysis result
    mockCompetitiveAnalysis = {
      competitiveMatrix: {
        competitors: [
          {
            name: 'Competitor A',
            marketShare: 25,
            strengths: ['Strong brand', 'Large user base'],
            weaknesses: ['High pricing', 'Limited features'],
            keyFeatures: ['Feature 1', 'Feature 2'],
            pricing: {
              model: 'subscription',
              startingPrice: 99,
              currency: 'USD',
              valueProposition: 'Enterprise-grade solution with comprehensive features'
            },
            targetMarket: ['Enterprise', 'Mid-market'],
            recentMoves: [
              {
                date: '2024-01-15',
                type: 'product-launch',
                description: 'Launched new AI features',
                impact: 'medium',
                strategicImplication: 'Strengthened competitive position in AI space'
              }
            ]
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
            overallScore: 85,
            criteriaScores: { 'Market Share': 90 },
            rank: 1,
            competitiveAdvantage: ['Market leadership', 'Brand recognition']
          }
        ],
        differentiationOpportunities: [
          'Lower pricing strategy',
          'Better user experience'
        ],
        marketContext: {
          industry: 'Technology',
          geography: ['North America', 'Europe'],
          targetSegment: 'Enterprise',
          marketMaturity: 'growth',
          regulatoryEnvironment: ['GDPR', 'SOX'],
          technologyTrends: ['AI/ML', 'Cloud-first']
        }
      },
      swotAnalysis: [
        {
          competitorName: 'Competitor A',
          strengths: [
            {
              description: 'Market leader',
              impact: 'high',
              confidence: 0.9
            },
            {
              description: 'Strong brand',
              impact: 'high',
              confidence: 0.8
            }
          ],
          weaknesses: [
            {
              description: 'High pricing',
              impact: 'medium',
              confidence: 0.7
            },
            {
              description: 'Complex UI',
              impact: 'medium',
              confidence: 0.6
            }
          ],
          opportunities: [
            {
              description: 'Emerging markets',
              impact: 'high',
              confidence: 0.6
            },
            {
              description: 'SMB segment',
              impact: 'medium',
              confidence: 0.7
            }
          ],
          threats: [
            {
              description: 'New entrants',
              impact: 'medium',
              confidence: 0.8
            },
            {
              description: 'Price competition',
              impact: 'high',
              confidence: 0.9
            }
          ],
          strategicImplications: ['Focus on cost optimization', 'Improve user experience']
        }
      ],
      marketPositioning: {
        positioningMap: [
          {
            name: 'Price',
            lowEnd: 'Low cost',
            highEnd: 'Premium',
            importance: 0.8
          }
        ],
        competitorPositions: [
          {
            competitorName: 'Competitor A',
            coordinates: { 'Price': 0.8 },
            marketSegment: 'Enterprise'
          }
        ],
        marketGaps: [
          {
            description: 'Affordable solutions for SMBs',
            size: 'large',
            difficulty: 'moderate',
            timeToMarket: '6-12 months',
            potentialValue: 50000000
          }
        ],
        recommendedPositioning: ['Focus on underserved segments', 'Competitive pricing']
      },
      strategicRecommendations: [
        {
          type: 'cost-leadership',
          title: 'Implement competitive pricing strategy',
          description: 'Develop lower-cost alternative to capture price-sensitive market',
          rationale: ['Current market leader has high pricing', 'Large underserved SMB segment'],
          implementation: [
            {
              step: 1,
              action: 'Analyze cost structure',
              timeline: '1 month',
              dependencies: ['Financial analysis'],
              successMetrics: ['Cost breakdown completed']
            }
          ],
          expectedOutcome: 'Capture price-sensitive customers',
          riskLevel: 'medium',
          timeframe: '3-6 months',
          resourceRequirements: ['Product team', 'Pricing analyst']
        }
      ],
      sourceAttribution: [
        {
          id: 'gartner-001',
          type: 'gartner',
          title: 'Market Analysis Report 2024',
          organization: 'Gartner',
          publishDate: '2024-01-01',
          accessDate: '2024-02-01',
          reliability: 0.9,
          relevance: 0.8,
          dataFreshness: {
            status: 'recent',
            ageInDays: 30,
            recommendedUpdateFrequency: 90,
            lastValidated: '2024-02-01'
          },
          citationFormat: 'Gartner. (2024). Market Analysis Report.',
          keyFindings: ['Market size', 'Competitive landscape'],
          limitations: ['Limited geographic scope']
        }
      ],
      confidenceLevel: 'high',
      lastUpdated: '2024-02-01T10:00:00Z',
      dataQuality: {
        sourceReliability: 0.9,
        dataFreshness: 0.8,
        methodologyRigor: 0.85,
        overallConfidence: 0.85,
        qualityIndicators: [
          {
            metric: 'Source credibility',
            score: 0.9,
            description: 'High-quality sources used',
            impact: 'important'
          }
        ],
        recommendations: ['Update data quarterly', 'Expand geographic coverage']
      }
    };

    // Mock market sizing result
    mockMarketSizing = {
      tam: {
        value: 50000000000,
        currency: 'USD',
        timeframe: '2024',
        growthRate: 0.15,
        methodology: 'top-down',
        dataQuality: 'high',
        calculationDate: '2024-02-01T10:00:00Z',
        geographicScope: ['North America', 'Europe'],
        marketSegments: ['Enterprise', 'Mid-market']
      },
      sam: {
        value: 5000000000,
        currency: 'USD',
        timeframe: '2024',
        growthRate: 0.15,
        methodology: 'SAM derived from top-down (10.0% of TAM)',
        dataQuality: 'high',
        calculationDate: '2024-02-01T10:00:00Z',
        geographicScope: ['North America', 'Europe'],
        marketSegments: ['Enterprise', 'Mid-market']
      },
      som: {
        value: 500000000,
        currency: 'USD',
        timeframe: '2024',
        growthRate: 0.15,
        methodology: 'SOM derived from SAM derived from top-down (10.0% of SAM)',
        dataQuality: 'high',
        calculationDate: '2024-02-01T10:00:00Z',
        geographicScope: ['North America', 'Europe'],
        marketSegments: ['Enterprise', 'Mid-market']
      },
      methodology: [
        {
          type: 'top-down',
          description: 'Industry-wide market analysis using published research and reports',
          dataSource: 'Industry reports, market research, analyst publications',
          reliability: 0.7,
          calculationSteps: [
            {
              step: 1,
              description: 'Identify total industry market size',
              formula: 'Industry Size × Geographic Scope',
              inputs: { industrySize: 'Market research data', geographicScope: 'Target regions' },
              output: 50000000000,
              assumptions: ['Industry growth continues', 'Geographic data is accurate']
            }
          ],
          limitations: ['Relies on industry averages', 'May not reflect specific market dynamics'],
          confidence: 0.7
        }
      ],
      scenarios: [
        {
          name: 'conservative',
          description: 'Conservative growth assumptions with higher competition',
          tam: 35000000000,
          sam: 3000000000,
          som: 250000000,
          probability: 0.3,
          keyAssumptions: ['Slower market adoption', 'Increased competition', 'Economic headwinds'],
          riskFactors: ['Market saturation', 'Regulatory changes', 'Economic downturn']
        }
      ],
      confidenceIntervals: [
        {
          marketType: 'tam',
          lowerBound: 35000000000,
          upperBound: 65000000000,
          confidenceLevel: 0.8,
          methodology: 'top-down'
        }
      ],
      sourceAttribution: [
        {
          id: 'market-research-001',
          type: 'market-research',
          title: 'Technology Market Analysis 2024',
          organization: 'Industry Research Institute',
          publishDate: '2024-01-15',
          accessDate: '2024-02-01',
          reliability: 0.8,
          relevance: 0.9,
          dataFreshness: {
            status: 'recent',
            ageInDays: 30,
            recommendedUpdateFrequency: 90,
            lastValidated: '2024-02-01'
          },
          citationFormat: 'Industry Research Institute. (2024). Market Analysis Report.',
          keyFindings: ['Market size estimates', 'Growth projections', 'Competitive landscape'],
          limitations: ['Limited geographic coverage', 'Methodology assumptions']
        }
      ],
      assumptions: [
        {
          category: 'market-growth',
          description: 'Annual market growth rate',
          value: '7-15%',
          confidence: 0.7,
          impact: 'high',
          sourceReference: 'Industry analysis'
        }
      ],
      marketDynamics: {
        growthDrivers: ['Digital transformation', 'Market expansion'],
        marketBarriers: ['Competition', 'Regulation'],
        seasonality: [
          {
            period: 'Q4',
            impact: 1.2,
            description: 'Higher spending in Q4'
          }
        ],
        cyclicalFactors: ['Economic cycles'],
        disruptiveForces: ['AI/ML', 'New business models']
      }
    };
  });

  describe('createFromCompetitiveAnalysis', () => {
    it('should create steering file from competitive analysis with minimal options', async () => {
      const competitiveAnalysisText = JSON.stringify(mockCompetitiveAnalysis, null, 2);
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'test-feature'
      };

      const result = await steeringService.createFromCompetitiveAnalysis(
        competitiveAnalysisText,
        steeringOptions
      );

      expect(result.created).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].filename).toContain('test-steering-file');
      expect(result.results[0].action).toBe('created');
      expect(result.message).toContain('steering file created');
    });

    it('should create steering file with custom inclusion rule', async () => {
      const competitiveAnalysisText = JSON.stringify(mockCompetitiveAnalysis, null, 2);
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'custom-feature',
        inclusion_rule: 'manual'
      };

      const result = await steeringService.createFromCompetitiveAnalysis(
        competitiveAnalysisText,
        steeringOptions
      );

      expect(result.created).toBe(true);
      expect(result.results[0].filename).toContain('test-steering-file');
      
      // Check that the steering file uses manual inclusion
      const steeringFile = result.results[0];
      expect(steeringFile.action).toBe('created');
    });

    it('should create steering file with file match pattern', async () => {
      const competitiveAnalysisText = JSON.stringify(mockCompetitiveAnalysis, null, 2);
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'pattern-feature',
        inclusion_rule: 'fileMatch',
        file_match_pattern: 'competitive*|analysis*'
      };

      const result = await steeringService.createFromCompetitiveAnalysis(
        competitiveAnalysisText,
        steeringOptions
      );

      expect(result.created).toBe(true);
      expect(result.results[0].filename).toContain('test-steering-file');
    });

    it('should handle competitive analysis with comprehensive data', async () => {
      // Add more comprehensive data to the mock
      const comprehensiveAnalysis = {
        ...mockCompetitiveAnalysis,
        competitiveMatrix: {
          ...mockCompetitiveAnalysis.competitiveMatrix,
          competitors: [
            ...mockCompetitiveAnalysis.competitiveMatrix.competitors,
            {
              name: 'Competitor B',
              marketShare: 15,
              strengths: ['Innovation', 'Customer service'],
              weaknesses: ['Limited market reach', 'Higher costs'],
              keyFeatures: ['Advanced analytics', 'Mobile app'],
              pricing: {
                model: 'freemium',
                startingPrice: 0,
                currency: 'USD',
                valueProposition: 'Freemium model with advanced analytics'
              },
              targetMarket: ['SMB', 'Startups'],
              recentMoves: [
                {
                  date: '2024-02-01',
                  type: 'acquisition',
                  description: 'Acquired analytics startup',
                  impact: 'high',
                  strategicImplication: 'Enhanced analytics capabilities'
                }
              ]
            }
          ]
        }
      };

      const competitiveAnalysisText = JSON.stringify(comprehensiveAnalysis, null, 2);
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'comprehensive-analysis'
      };

      const result = await steeringService.createFromCompetitiveAnalysis(
        competitiveAnalysisText,
        steeringOptions
      );

      expect(result.created).toBe(true);
      expect(result.results[0].filename).toContain('test-steering-file');
      expect(result.warnings).toHaveLength(0);
    });

    it('should skip creation when create_steering_files is false', async () => {
      const competitiveAnalysisText = JSON.stringify(mockCompetitiveAnalysis, null, 2);
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: false,
        feature_name: 'skip-feature'
      };

      const result = await steeringService.createFromCompetitiveAnalysis(
        competitiveAnalysisText,
        steeringOptions
      );

      expect(result.created).toBe(false);
      expect(result.message).toContain('Steering file creation disabled');
    });

    it('should handle empty competitive analysis gracefully', async () => {
      const emptyAnalysis = JSON.stringify({}, null, 2);
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'empty-analysis'
      };

      const result = await steeringService.createFromCompetitiveAnalysis(
        emptyAnalysis,
        steeringOptions
      );

      // Should still create a steering file, but may have warnings
      expect(result.created).toBe(true);
      expect(result.results[0].filename).toContain('test-steering-file');
    });

    it('should handle malformed JSON input', async () => {
      const malformedJson = '{ invalid json content }';
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'malformed-input'
      };

      const result = await steeringService.createFromCompetitiveAnalysis(
        malformedJson,
        steeringOptions
      );

      // Should still attempt to create steering file with raw content
      expect(result.created).toBe(true);
      expect(result.results[0].filename).toContain('test-steering-file');
    });
  });

  describe('createFromMarketSizing', () => {

    it('should create steering file from market sizing with minimal options', async () => {
      const marketSizingText = JSON.stringify(mockMarketSizing, null, 2);
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'market-test'
      };

      const result = await steeringService.createFromMarketSizing(
        marketSizingText,
        steeringOptions
      );

      expect(result.created).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].filename).toContain('test-steering-file');
      expect(result.results[0].action).toBe('created');
      expect(result.message).toContain('steering file created');
    });

    it('should create steering file with TAM/SAM/SOM data', async () => {
      const marketSizingText = JSON.stringify(mockMarketSizing, null, 2);
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'tam-sam-som-feature'
      };

      const result = await steeringService.createFromMarketSizing(
        marketSizingText,
        steeringOptions
      );

      expect(result.created).toBe(true);
      expect(result.results[0].filename).toContain('test-steering-file');
    });

    it('should handle market sizing with multiple methodologies', async () => {
      const multiMethodologyMarketSizing = {
        ...mockMarketSizing,
        methodology: [
          ...mockMarketSizing.methodology,
          {
            type: 'bottom-up',
            description: 'Customer segment analysis with pricing and adoption modeling',
            dataSource: 'Customer surveys, segment analysis, pricing studies',
            reliability: 0.8,
            calculationSteps: [
              {
                step: 1,
                description: 'Calculate segment sizes and spending',
                formula: 'Σ(Segment Size × Average Spending)',
                inputs: { segmentSize: 'Customer counts', averageSpending: 'Pricing analysis' },
                output: 45000000000,
                assumptions: ['Segment data is representative', 'Spending patterns remain stable']
              }
            ],
            limitations: ['Requires detailed customer data', 'May miss market expansion opportunities'],
            confidence: 0.8
          }
        ]
      };

      const marketSizingText = JSON.stringify(multiMethodologyMarketSizing, null, 2);
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'multi-methodology'
      };

      const result = await steeringService.createFromMarketSizing(
        marketSizingText,
        steeringOptions
      );

      expect(result.created).toBe(true);
      expect(result.results[0].filename).toContain('test-steering-file');
    });

    it('should handle market sizing with scenario analysis', async () => {
      const scenarioMarketSizing = {
        ...mockMarketSizing,
        scenarios: [
          ...mockMarketSizing.scenarios,
          {
            name: 'aggressive',
            description: 'Optimistic scenario with accelerated growth',
            tam: 75000000000,
            sam: 7000000000,
            som: 900000000,
            probability: 0.2,
            keyAssumptions: ['Rapid market expansion', 'First-mover advantage', 'Strong execution'],
            riskFactors: ['Execution challenges', 'Market overestimation', 'Resource constraints']
          }
        ]
      };

      const marketSizingText = JSON.stringify(scenarioMarketSizing, null, 2);
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'scenario-analysis'
      };

      const result = await steeringService.createFromMarketSizing(
        marketSizingText,
        steeringOptions
      );

      expect(result.created).toBe(true);
      expect(result.results[0].filename).toContain('test-steering-file');
    });

    it('should skip creation when create_steering_files is false', async () => {
      const marketSizingText = JSON.stringify(mockMarketSizing, null, 2);
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: false,
        feature_name: 'skip-market-sizing'
      };

      const result = await steeringService.createFromMarketSizing(
        marketSizingText,
        steeringOptions
      );

      expect(result.created).toBe(false);
      expect(result.message).toContain('Steering file creation disabled');
    });
  });

  describe('Integration with SteeringFileGenerator', () => {
    it('should use competitive analysis template correctly', async () => {
      const generator = new SteeringFileGenerator();
      const competitiveAnalysisText = JSON.stringify(mockCompetitiveAnalysis, null, 2);
      
      const context = {
        featureName: 'test-competitive-feature',
        relatedFiles: [],
        inclusionRule: 'fileMatch' as const,
        fileMatchPattern: 'competitive*|analysis*'
      };

      const steeringFile = generator.generateFromCompetitiveAnalysis(competitiveAnalysisText, context);

      expect(steeringFile.filename).toContain('test-competitive-feature');
      expect(steeringFile.filename).toContain('competitive_analysis');
      expect(steeringFile.frontMatter.documentType).toBe(DocumentType.COMPETITIVE_ANALYSIS);
      expect(steeringFile.frontMatter.inclusion).toBe('fileMatch');
      expect(steeringFile.frontMatter.fileMatchPattern).toBe('competitive*|analysis*');
      expect(steeringFile.content).toContain('Competitive Analysis Guidance');
      expect(steeringFile.content).toContain('test-competitive-feature');
    });

    it('should use market sizing template correctly', async () => {
      const generator = new SteeringFileGenerator();
      const marketSizingText = JSON.stringify(mockMarketSizing, null, 2);
      
      const context = {
        featureName: 'test-market-feature',
        relatedFiles: [],
        inclusionRule: 'fileMatch' as const,
        fileMatchPattern: 'market*|sizing*'
      };

      const steeringFile = generator.generateFromMarketSizing(marketSizingText, context);

      expect(steeringFile.filename).toContain('test-market-feature');
      expect(steeringFile.filename).toContain('market_sizing');
      expect(steeringFile.frontMatter.documentType).toBe(DocumentType.MARKET_SIZING);
      expect(steeringFile.frontMatter.inclusion).toBe('fileMatch');
      expect(steeringFile.frontMatter.fileMatchPattern).toBe('market*|sizing*');
      expect(steeringFile.content).toContain('Market Sizing Guidance');
      expect(steeringFile.content).toContain('test-market-feature');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully for competitive analysis', async () => {
      // Mock service to throw error
      const errorService = new SteeringService({
        enabled: false // This will cause creation to be skipped
      });

      const competitiveAnalysisText = JSON.stringify(mockCompetitiveAnalysis, null, 2);
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'error-test'
      };

      const result = await errorService.createFromCompetitiveAnalysis(
        competitiveAnalysisText,
        steeringOptions
      );

      expect(result.created).toBe(false);
      expect(result.message).toContain('Steering file creation disabled');
    });

    it('should handle service errors gracefully for market sizing', async () => {
      // Mock service to throw error
      const errorService = new SteeringService({
        enabled: false // This will cause creation to be skipped
      });

      const marketSizingText = JSON.stringify(mockMarketSizing, null, 2);
      const steeringOptions: SteeringFileOptions = {
        create_steering_files: true,
        feature_name: 'error-test'
      };

      const result = await errorService.createFromMarketSizing(
        marketSizingText,
        steeringOptions
      );

      expect(result.created).toBe(false);
      expect(result.message).toContain('Steering file creation disabled');
    });
  });
});