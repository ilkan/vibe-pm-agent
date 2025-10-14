/**
 * Unit tests for CurrentScenarioGenerator component
 */

import { CurrentScenarioGenerator } from '../../components/current-scenario-generator/index';
import { MarketContextFetcher } from '../../components/market-context-fetcher/index';
import { CaseType } from '../../models/interview';

// Mock the MarketContextFetcher
jest.mock('../../components/market-context-fetcher/index');

const MockedMarketContextFetcher = MarketContextFetcher as jest.MockedClass<typeof MarketContextFetcher>;

describe('CurrentScenarioGenerator', () => {
  let scenarioGenerator: CurrentScenarioGenerator;
  let mockMarketFetcher: jest.Mocked<MarketContextFetcher>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instance
    mockMarketFetcher = {
      getMarketIntelligence: jest.fn(),
      getIndustryTrends: jest.fn(),
      fetchMarketContext: jest.fn(),
      validateAssumptions: jest.fn(),
    } as any;

    // Mock constructor
    MockedMarketContextFetcher.mockImplementation(() => mockMarketFetcher);

    scenarioGenerator = new CurrentScenarioGenerator({
      useRealTimeData: true,
      includeCompetitiveContext: true,
      adaptToMarketConditions: true,
      maxScenarioComplexity: 'moderate',
    });
  });

  describe('generateCurrentScenario', () => {
    it('should generate a dynamic scenario with market intelligence', async () => {
      // Mock market intelligence response
      const mockMarketIntelligence = {
        industry: 'Technology',
        marketOverview: {
          size: 1000000000,
          growthRate: 0.15,
          maturity: 'growth' as const,
          keyDrivers: ['Digital transformation', 'AI adoption'],
        },
        competitiveLandscape: {
          numberOfCompetitors: 5,
          marketConcentration: 'medium' as const,
          topCompetitors: ['TechCorp A', 'TechCorp B'],
          competitiveIntensity: 'medium' as const,
        },
        opportunities: {
          marketGaps: ['SMB segment', 'Emerging markets'],
          emergingTrends: ['AI integration'],
          underservedSegments: ['Small businesses'],
        },
        risks: {
          competitiveThreats: ['New entrants'],
          marketRisks: ['Economic downturn'],
          regulatoryRisks: ['Data privacy'],
        },
        recommendations: {
          entryStrategy: ['Focus on differentiation'],
          positioningAdvice: ['Target underserved segments'],
          timingConsiderations: ['Market timing favorable'],
        },
      };

      // Mock industry trends response
      const mockIndustryTrends = {
        industry: 'Technology',
        currentTrends: [
          { name: 'AI adoption', impact: 'high' as const, timeframe: '1-2 years', confidence: 0.8 },
          { name: 'Cloud migration', impact: 'medium' as const, timeframe: '2-3 years', confidence: 0.7 },
        ],
        emergingTechnologies: ['Machine Learning', 'Edge Computing'],
        marketForces: ['Digital transformation'],
        customerBehaviorShifts: ['Self-service preference'],
        regulatoryChanges: ['Data privacy laws'],
        disruptiveFactors: ['New business models'],
      };

      // Mock market context response
      const mockMarketContext = {
        industry: 'Technology',
        marketSize: {
          tam: 1000000000,
          sam: 100000000,
          som: 10000000,
          currency: 'USD',
          timeframe: 'annual',
          growthRate: 0.15,
        },
        competitors: ['TechCorp A', 'TechCorp B'],
        trends: ['AI adoption', 'Cloud migration'],
        keyMetrics: { growth_rate: 0.15 },
        assumptions: ['Market growth continues'],
      };

      mockMarketFetcher.getMarketIntelligence.mockResolvedValue(mockMarketIntelligence);
      mockMarketFetcher.getIndustryTrends.mockResolvedValue(mockIndustryTrends);
      mockMarketFetcher.fetchMarketContext.mockResolvedValue(mockMarketContext as any);

      const request = {
        caseType: 'product_design' as CaseType,
        industry: 'Technology',
        difficulty: 3,
        timeConstraint: 45,
        targetCompany: 'TechStartup',
      };

      const result = await scenarioGenerator.generateCurrentScenario(request);

      expect(result).toMatchObject({
        baseScenario: {
          type: 'product_design',
          industry: 'Technology',
          company: 'TechStartup',
          difficulty: 3,
          estimatedTime: 45,
          tags: expect.arrayContaining(['current', 'real-time', 'product_design', 'Technology']),
        },
        marketContext: mockMarketContext,
        realTimeElements: {
          currentTrends: expect.arrayContaining(['AI adoption']),
          competitiveMovements: expect.any(Array),
          marketMetrics: expect.objectContaining({
            growth_rate: 0.15,
          }),
          timeSensitiveFactors: expect.any(Array),
        },
        validationFramework: {
          keyAssumptions: expect.any(Array),
          validationCriteria: expect.any(Array),
          successMetrics: expect.any(Array),
        },
      });

      expect(mockMarketFetcher.getMarketIntelligence).toHaveBeenCalledWith('Technology', ['Global']);
      expect(mockMarketFetcher.getIndustryTrends).toHaveBeenCalledWith('Technology');
      expect(mockMarketFetcher.fetchMarketContext).toHaveBeenCalledWith({
        industry: 'Technology',
        featureIdea: 'New product solution for Technology market',
      });
    });

    it('should handle different case types correctly', async () => {
      const mockMarketIntelligence = {
        marketOverview: { size: 1000000000, growthRate: 0.1, maturity: 'mature' as const, keyDrivers: [] },
        competitiveLandscape: { numberOfCompetitors: 3, marketConcentration: 'high' as const, topCompetitors: [], competitiveIntensity: 'low' as const },
        opportunities: { marketGaps: [], emergingTrends: [], underservedSegments: [] },
        risks: { competitiveThreats: [], marketRisks: [], regulatoryRisks: [] },
        recommendations: { entryStrategy: [], positioningAdvice: [], timingConsiderations: [] },
      };

      const mockIndustryTrends = {
        industry: 'Healthcare',
        currentTrends: [],
        emergingTechnologies: [],
        marketForces: [],
        customerBehaviorShifts: [],
        regulatoryChanges: [],
        disruptiveFactors: [],
      };

      const mockMarketContext = {
        industry: 'Healthcare',
        marketSize: { tam: 500000000, sam: 50000000, som: 5000000, growthRate: 0.08 },
        competitors: [],
        trends: [],
        keyMetrics: {},
        assumptions: [],
      };

      mockMarketFetcher.getMarketIntelligence.mockResolvedValue(mockMarketIntelligence as any);
      mockMarketFetcher.getIndustryTrends.mockResolvedValue(mockIndustryTrends);
      mockMarketFetcher.fetchMarketContext.mockResolvedValue(mockMarketContext as any);

      const caseTypes: CaseType[] = ['product_design', 'strategy', 'prioritization', 'market_entry'];

      for (const caseType of caseTypes) {
        const request = {
          caseType,
          industry: 'Healthcare',
          difficulty: 2,
        };

        const result = await scenarioGenerator.generateCurrentScenario(request);

        expect(result.baseScenario.type).toBe(caseType);
        expect(result.baseScenario.steps.length).toBeGreaterThan(0);
        expect(result.baseScenario.expectedFrameworks.length).toBeGreaterThan(0);
      }
    });

    it('should handle errors gracefully', async () => {
      mockMarketFetcher.getMarketIntelligence.mockRejectedValue(new Error('Market intelligence failed'));

      const request = {
        caseType: 'product_design' as CaseType,
        industry: 'Technology',
        difficulty: 3,
      };

      await expect(scenarioGenerator.generateCurrentScenario(request)).rejects.toThrow(
        'Failed to generate current scenario: Market intelligence failed'
      );
    });
  });

  describe('validateScenarioAssumptions', () => {
    it('should validate user assumptions against market data', async () => {
      // First generate a scenario
      const mockMarketIntelligence = {
        marketOverview: { size: 1000000000, growthRate: 0.15, maturity: 'growth' as const, keyDrivers: [] },
        competitiveLandscape: { numberOfCompetitors: 5, marketConcentration: 'medium' as const, topCompetitors: [], competitiveIntensity: 'medium' as const },
        opportunities: { marketGaps: [], emergingTrends: [], underservedSegments: [] },
        risks: { competitiveThreats: [], marketRisks: [], regulatoryRisks: [] },
        recommendations: { entryStrategy: [], positioningAdvice: [], timingConsiderations: [] },
      };

      const mockIndustryTrends = {
        industry: 'Technology',
        currentTrends: [],
        emergingTechnologies: [],
        marketForces: [],
        customerBehaviorShifts: [],
        regulatoryChanges: [],
        disruptiveFactors: [],
      };

      const mockMarketContext = {
        industry: 'Technology',
        marketSize: { tam: 1000000000, sam: 100000000, som: 10000000, growthRate: 0.15 },
        competitors: [],
        trends: [],
        keyMetrics: {},
        assumptions: [],
      };

      mockMarketFetcher.getMarketIntelligence.mockResolvedValue(mockMarketIntelligence as any);
      mockMarketFetcher.getIndustryTrends.mockResolvedValue(mockIndustryTrends);
      mockMarketFetcher.fetchMarketContext.mockResolvedValue(mockMarketContext as any);

      const scenario = await scenarioGenerator.generateCurrentScenario({
        caseType: 'product_design',
        industry: 'Technology',
        difficulty: 3,
      });

      // Mock validation response
      const mockValidationResults = [
        {
          assumption: 'Market is growing rapidly',
          isValid: true,
          confidence: 0.8,
          evidence: ['Growth rate of 15% supports assumption'],
          contradictions: [],
          recommendation: 'Assumption is valid',
        },
        {
          assumption: 'Competition is low',
          isValid: false,
          confidence: 0.6,
          evidence: [],
          contradictions: ['5 competitors indicate medium competition'],
          recommendation: 'Revise assumption about competition level',
        },
      ];

      mockMarketFetcher.validateAssumptions.mockResolvedValue(mockValidationResults);

      const userAssumptions = ['Market is growing rapidly', 'Competition is low'];
      const result = await scenarioGenerator.validateScenarioAssumptions(
        scenario.baseScenario.id,
        userAssumptions
      );

      expect(result).toMatchObject({
        scenarioId: scenario.baseScenario.id,
        userAssumptions,
        validationResults: mockValidationResults,
        marketAlignment: {
          score: 0.5, // 1 out of 2 assumptions valid
          alignedAssumptions: ['Market is growing rapidly'],
          contradictedAssumptions: ['Competition is low'],
          missingConsiderations: expect.any(Array),
        },
        recommendations: {
          adjustments: expect.any(Array),
          additionalResearch: expect.any(Array),
          riskMitigation: expect.any(Array),
        },
      });
    });

    it('should handle scenario not found', async () => {
      const userAssumptions = ['Test assumption'];
      
      await expect(
        scenarioGenerator.validateScenarioAssumptions('nonexistent-scenario', userAssumptions)
      ).rejects.toThrow('Scenario nonexistent-scenario not found');
    });
  });

  describe('integrateMarketTrends', () => {
    it('should enhance case study with market trends', async () => {
      const mockIndustryTrends = {
        industry: 'Technology',
        currentTrends: [
          { name: 'AI adoption', impact: 'high' as const, timeframe: '1-2 years', confidence: 0.8 },
          { name: 'Cloud migration', impact: 'medium' as const, timeframe: '2-3 years', confidence: 0.7 },
        ],
        emergingTechnologies: [],
        marketForces: [],
        customerBehaviorShifts: [],
        regulatoryChanges: [],
        disruptiveFactors: [],
      };

      mockMarketFetcher.getIndustryTrends.mockResolvedValue(mockIndustryTrends);

      const baseCaseStudy = {
        id: 'test-case',
        type: 'product_design' as CaseType,
        title: 'Test Case',
        scenario: 'Test scenario',
        context: 'Original context',
        constraints: ['Budget limit'],
        objectives: ['Complete design'],
        steps: [],
        expectedFrameworks: [],
        difficulty: 3,
        estimatedTime: 45,
        industry: 'Technology',
        tags: ['test'],
        marketData: {
          industry: 'Technology',
          marketSize: { tam: 1000000000, sam: 100000000, som: 10000000 },
          competitors: [],
          trends: [],
          keyMetrics: {},
          assumptions: [],
        },
      };

      const result = await scenarioGenerator.integrateMarketTrends(
        baseCaseStudy,
        ['AI adoption']
      );

      expect(result.context).toContain('Market Trends Context:');
      expect(result.context).toContain('AI adoption (high impact, 1-2 years)');
      expect(result.constraints).toContain('Consider impact of AI adoption trend');
      expect(result.marketData?.trends).toContain('AI adoption');
    });

    it('should return original case if no industry specified', async () => {
      const baseCaseStudy = {
        id: 'test-case',
        type: 'product_design' as CaseType,
        title: 'Test Case',
        scenario: 'Test scenario',
        context: 'Original context',
        constraints: [],
        objectives: [],
        steps: [],
        expectedFrameworks: [],
        difficulty: 3,
        estimatedTime: 45,
        tags: ['test'],
        // No industry specified
      };

      const result = await scenarioGenerator.integrateMarketTrends(baseCaseStudy);

      expect(result).toBe(baseCaseStudy); // Should return original unchanged
      expect(mockMarketFetcher.getIndustryTrends).not.toHaveBeenCalled();
    });
  });

  describe('getAvailableScenarioTypes', () => {
    it('should return available scenario types for industry', () => {
      const result = scenarioGenerator.getAvailableScenarioTypes('Technology');

      expect(result.length).toBeGreaterThan(0);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'product_design',
            description: expect.stringContaining('Technology'),
            complexity: expect.stringMatching(/^(simple|moderate|complex)$/),
            estimatedTime: expect.any(Number),
            requiredFrameworks: expect.any(Array),
          }),
        ])
      );
    });

    it('should filter by complexity configuration', () => {
      const simpleGenerator = new CurrentScenarioGenerator({
        maxScenarioComplexity: 'simple',
        useRealTimeData: false,
        includeCompetitiveContext: false,
        adaptToMarketConditions: false,
      });

      const result = simpleGenerator.getAvailableScenarioTypes('Technology');

      expect(result.every(scenario => scenario.complexity === 'simple')).toBe(true);
    });
  });

  describe('refreshScenarioWithLatestTrends', () => {
    it('should update scenario with latest trends', async () => {
      // First generate a scenario
      const mockMarketIntelligence = {
        marketOverview: { size: 1000000000, growthRate: 0.15, maturity: 'growth' as const, keyDrivers: [] },
        competitiveLandscape: { numberOfCompetitors: 5, marketConcentration: 'medium' as const, topCompetitors: [], competitiveIntensity: 'medium' as const },
        opportunities: { marketGaps: [], emergingTrends: [], underservedSegments: [] },
        risks: { competitiveThreats: [], marketRisks: [], regulatoryRisks: [] },
        recommendations: { entryStrategy: [], positioningAdvice: [], timingConsiderations: [] },
      };

      const mockIndustryTrends = {
        industry: 'Technology',
        currentTrends: [
          { name: 'Original trend', impact: 'medium' as const, timeframe: '2-3 years', confidence: 0.7 },
        ],
        emergingTechnologies: [],
        marketForces: [],
        customerBehaviorShifts: [],
        regulatoryChanges: [],
        disruptiveFactors: [],
      };

      const mockMarketContext = {
        industry: 'Technology',
        marketSize: { tam: 1000000000, sam: 100000000, som: 10000000, growthRate: 0.15 },
        competitors: [],
        trends: [],
        keyMetrics: {},
        assumptions: [],
      };

      mockMarketFetcher.getMarketIntelligence.mockResolvedValue(mockMarketIntelligence as any);
      mockMarketFetcher.getIndustryTrends.mockResolvedValue(mockIndustryTrends);
      mockMarketFetcher.fetchMarketContext.mockResolvedValue(mockMarketContext as any);

      const scenario = await scenarioGenerator.generateCurrentScenario({
        caseType: 'product_design',
        industry: 'Technology',
        difficulty: 3,
      });

      // Mock updated trends
      const updatedTrends = {
        industry: 'Technology',
        currentTrends: [
          { name: 'New AI trend', impact: 'high' as const, timeframe: '1-2 years', confidence: 0.9 },
        ],
        emergingTechnologies: [],
        marketForces: [],
        customerBehaviorShifts: [],
        regulatoryChanges: [],
        disruptiveFactors: ['Quantum computing'],
      };

      mockMarketFetcher.getIndustryTrends.mockResolvedValue(updatedTrends);

      const refreshedScenario = await scenarioGenerator.refreshScenarioWithLatestTrends(
        scenario.baseScenario.id
      );

      expect(refreshedScenario.realTimeElements.currentTrends).toContain('New AI trend');
      expect(refreshedScenario.realTimeElements.timeSensitiveFactors).toContain(
        'Disruptive factor: Quantum computing'
      );
    });

    it('should handle scenario not found', async () => {
      await expect(
        scenarioGenerator.refreshScenarioWithLatestTrends('nonexistent-scenario')
      ).rejects.toThrow('Scenario nonexistent-scenario not found');
    });
  });
});