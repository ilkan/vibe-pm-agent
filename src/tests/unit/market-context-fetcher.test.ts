/**
 * Unit tests for MarketContextFetcher component
 */

import { MarketContextFetcher } from '../../components/market-context-fetcher/index';
import { MarketAnalyzer } from '../../components/market-analyzer/index';
import { CompetitorAnalyzer } from '../../components/competitor-analyzer/index';

// Mock the dependencies
jest.mock('../../components/market-analyzer/index');
jest.mock('../../components/competitor-analyzer/index');

const MockedMarketAnalyzer = MarketAnalyzer as jest.MockedClass<typeof MarketAnalyzer>;
const MockedCompetitorAnalyzer = CompetitorAnalyzer as jest.MockedClass<typeof CompetitorAnalyzer>;

describe('MarketContextFetcher', () => {
  let marketFetcher: MarketContextFetcher;
  let mockMarketAnalyzer: jest.Mocked<MarketAnalyzer>;
  let mockCompetitorAnalyzer: jest.Mocked<CompetitorAnalyzer>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockMarketAnalyzer = {
      analyzeMarketSize: jest.fn(),
    } as any;

    mockCompetitorAnalyzer = {
      analyzeCompetitors: jest.fn(),
    } as any;

    // Mock constructors
    MockedMarketAnalyzer.mockImplementation(() => mockMarketAnalyzer);
    MockedCompetitorAnalyzer.mockImplementation(() => mockCompetitorAnalyzer);

    marketFetcher = new MarketContextFetcher({
      enableRealTimeData: true,
      cacheTimeout: 1000, // 1 second for testing
      confidenceThreshold: 0.6,
      maxRetries: 3,
    });
  });

  describe('fetchMarketContext', () => {
    it('should fetch comprehensive market context successfully', async () => {
      // Mock market sizing response
      const mockMarketSizing = {
        tam: { value: 1000000000, currency: 'USD', timeframe: 'annual', growthRate: 0.15 },
        sam: { value: 100000000, currency: 'USD', timeframe: 'annual', growthRate: 0.15 },
        som: { value: 10000000, currency: 'USD', timeframe: 'annual', growthRate: 0.15 },
        sourceAttribution: [{ title: 'Market Research Report' }],
        confidenceIntervals: [{ confidenceLevel: 0.8 }],
        assumptions: [{ description: 'Market growth continues' }],
        marketDynamics: {
          growthDrivers: ['Digital transformation', 'AI adoption'],
          disruptiveForces: ['New technologies'],
        },
      };

      // Mock competitive analysis response
      const mockCompetitiveData = {
        competitiveMatrix: {
          competitors: [
            { name: 'Competitor A', marketShare: 30 },
            { name: 'Competitor B', marketShare: 25 },
          ],
          differentiationOpportunities: ['Feature gap', 'Market segment'],
        },
        swotAnalysis: [
          {
            competitorName: 'Competitor A',
            strengths: [],
            weaknesses: [],
            opportunities: [{ description: 'Market expansion' }],
            threats: [],
            strategicImplications: [],
          },
        ],
        marketPositioning: {
          marketGaps: [
            { description: 'Mid-market opportunity' },
            { description: 'SMB segment' },
          ],
        },
        strategicRecommendations: [],
        sourceAttribution: [{ title: 'Competitive Intelligence' }],
        confidenceLevel: 'medium' as const,
        lastUpdated: new Date().toISOString(),
        dataQuality: { overallScore: 0.7 } as any,
      };

      mockMarketAnalyzer.analyzeMarketSize.mockResolvedValue(mockMarketSizing as any);
      mockCompetitorAnalyzer.analyzeCompetitors.mockResolvedValue(mockCompetitiveData as any);

      const request = {
        industry: 'Technology',
        geography: ['North America'],
        customerSegments: ['Enterprise'],
      };

      const result = await marketFetcher.fetchMarketContext(request);

      expect(result).toMatchObject({
        industry: 'Technology',
        marketSize: {
          tam: 1000000000,
          sam: 100000000,
          som: 10000000,
          currency: 'USD',
          timeframe: 'annual',
          growthRate: 0.15,
        },
        competitors: ['Competitor A', 'Competitor B'],
        trends: expect.arrayContaining(['Digital transformation']),
        competitiveInsights: {
          marketLeader: 'Competitor A',
          marketGaps: ['Mid-market opportunity', 'SMB segment'],
          differentiationOpportunities: ['Feature gap', 'Market segment'],
        },
      });

      expect(mockMarketAnalyzer.analyzeMarketSize).toHaveBeenCalledWith({
        feature_idea: 'Market analysis for Technology',
        market_definition: {
          industry: 'Technology',
          geography: ['North America'],
          customer_segments: ['Enterprise'],
        },
        sizing_methods: ['top-down', 'bottom-up'],
      });

      expect(mockCompetitorAnalyzer.analyzeCompetitors).toHaveBeenCalledWith({
        feature_idea: 'Competitive analysis for Technology',
        market_context: {
          industry: 'Technology',
          geography: ['North America'],
          target_segment: 'Enterprise',
        },
        analysis_depth: 'standard',
      });
    });

    it('should handle errors gracefully', async () => {
      mockMarketAnalyzer.analyzeMarketSize.mockRejectedValue(new Error('Market analysis failed'));

      const request = {
        industry: 'Technology',
      };

      await expect(marketFetcher.fetchMarketContext(request)).rejects.toThrow(
        'Failed to fetch market context: Market analysis failed'
      );
    });

    it('should use cache when available', async () => {
      const mockMarketSizing = {
        tam: { value: 1000000000, currency: 'USD', timeframe: 'annual', growthRate: 0.15 },
        sam: { value: 100000000, currency: 'USD', timeframe: 'annual', growthRate: 0.15 },
        som: { value: 10000000, currency: 'USD', timeframe: 'annual', growthRate: 0.15 },
        sourceAttribution: [{ title: 'Market Research Report' }],
        confidenceIntervals: [{ confidenceLevel: 0.8 }],
        assumptions: [{ description: 'Market growth continues' }],
        marketDynamics: { growthDrivers: [], disruptiveForces: [] },
      };

      const mockCompetitiveData = {
        competitiveMatrix: {
          competitors: [{ name: 'Competitor A', marketShare: 30 }],
          differentiationOpportunities: [],
        },
        marketPositioning: { marketGaps: [] },
        sourceAttribution: [],
        confidenceLevel: 0.7,
      };

      mockMarketAnalyzer.analyzeMarketSize.mockResolvedValue(mockMarketSizing as any);
      mockCompetitorAnalyzer.analyzeCompetitors.mockResolvedValue(mockCompetitiveData as any);

      const request = { industry: 'Technology' };

      // First call
      await marketFetcher.fetchMarketContext(request);
      expect(mockMarketAnalyzer.analyzeMarketSize).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await marketFetcher.fetchMarketContext(request);
      expect(mockMarketAnalyzer.analyzeMarketSize).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateAssumptions', () => {
    it('should validate assumptions against market data', async () => {
      const mockMarketContext = {
        industry: 'Technology',
        marketSize: { tam: 1000000000, sam: 100000000, som: 10000000, growthRate: 0.15 },
        competitors: ['Competitor A', 'Competitor B'],
        trends: ['AI adoption'],
        keyMetrics: {},
        assumptions: [],
      };

      // Mock fetchMarketContext to return our test data
      jest.spyOn(marketFetcher, 'fetchMarketContext').mockResolvedValue(mockMarketContext as any);

      const request = {
        assumptions: ['Market is growing rapidly', 'Competition is intense'],
        industry: 'Technology',
      };

      const result = await marketFetcher.validateAssumptions(request);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        assumption: 'Market is growing rapidly',
        isValid: expect.any(Boolean),
        confidence: expect.any(Number),
        evidence: expect.any(Array),
        contradictions: expect.any(Array),
        recommendation: expect.any(String),
      });
    });

    it('should handle validation errors gracefully', async () => {
      jest.spyOn(marketFetcher, 'fetchMarketContext').mockRejectedValue(new Error('Fetch failed'));

      const request = {
        assumptions: ['Test assumption'],
        industry: 'Technology',
      };

      await expect(marketFetcher.validateAssumptions(request)).rejects.toThrow(
        'Failed to validate assumptions: Fetch failed'
      );
    });
  });

  describe('getMarketIntelligence', () => {
    it('should return comprehensive market intelligence', async () => {
      const mockMarketContext = {
        industry: 'Technology',
        marketSize: { tam: 1000000000, growthRate: 0.15 },
        competitors: ['Competitor A', 'Competitor B', 'Competitor C'],
        trends: ['AI adoption', 'Cloud migration'],
        competitiveInsights: {
          marketLeader: 'Competitor A',
          marketGaps: ['SMB segment'],
          differentiationOpportunities: ['Feature innovation'],
        },
      };

      jest.spyOn(marketFetcher, 'fetchMarketContext').mockResolvedValue(mockMarketContext as any);

      const result = await marketFetcher.getMarketIntelligence('Technology');

      expect(result).toMatchObject({
        industry: 'Technology',
        marketOverview: {
          size: 1000000000,
          growthRate: 0.15,
          maturity: expect.any(String),
          keyDrivers: expect.any(Array),
        },
        competitiveLandscape: {
          numberOfCompetitors: 3,
          marketConcentration: expect.any(String),
          topCompetitors: expect.arrayContaining(['Competitor A']),
          competitiveIntensity: expect.any(String),
        },
        opportunities: {
          marketGaps: expect.any(Array),
          emergingTrends: expect.any(Array),
          underservedSegments: expect.any(Array),
        },
        risks: {
          competitiveThreats: expect.any(Array),
          marketRisks: expect.any(Array),
          regulatoryRisks: expect.any(Array),
        },
        recommendations: {
          entryStrategy: expect.any(Array),
          positioningAdvice: expect.any(Array),
          timingConsiderations: expect.any(Array),
        },
      });
    });
  });

  describe('getIndustryTrends', () => {
    it('should return industry-specific trends', async () => {
      const mockMarketContext = {
        industry: 'Technology',
        trends: ['AI adoption', 'Cloud migration', 'Remote work'],
      };

      jest.spyOn(marketFetcher, 'fetchMarketContext').mockResolvedValue(mockMarketContext as any);

      const result = await marketFetcher.getIndustryTrends('Technology');

      expect(result).toMatchObject({
        industry: 'Technology',
        currentTrends: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            impact: expect.stringMatching(/^(low|medium|high)$/),
            timeframe: expect.any(String),
            confidence: expect.any(Number),
          }),
        ]),
        emergingTechnologies: expect.arrayContaining([
          'Quantum Computing',
          'Edge Computing',
          'AR/VR',
        ]),
        marketForces: expect.any(Array),
        customerBehaviorShifts: expect.any(Array),
        regulatoryChanges: expect.any(Array),
        disruptiveFactors: expect.any(Array),
      });
    });
  });

  describe('caching behavior', () => {
    it('should cache data and respect timeout', async () => {
      const mockMarketSizing = {
        tam: { value: 1000000000, currency: 'USD', timeframe: 'annual', growthRate: 0.15 },
        sam: { value: 100000000, currency: 'USD', timeframe: 'annual', growthRate: 0.15 },
        som: { value: 10000000, currency: 'USD', timeframe: 'annual', growthRate: 0.15 },
        sourceAttribution: [],
        confidenceIntervals: [{ confidenceLevel: 0.8 }],
        assumptions: [],
        marketDynamics: { growthDrivers: [], disruptiveForces: [] },
      };

      const mockCompetitiveData = {
        competitiveMatrix: { competitors: [], differentiationOpportunities: [] },
        swotAnalysis: [],
        marketPositioning: { marketGaps: [] },
        strategicRecommendations: [],
        sourceAttribution: [],
        confidenceLevel: 'medium' as const,
        lastUpdated: new Date().toISOString(),
        dataQuality: { overallScore: 0.7 } as any,
      };

      mockMarketAnalyzer.analyzeMarketSize.mockResolvedValue(mockMarketSizing as any);
      mockCompetitorAnalyzer.analyzeCompetitors.mockResolvedValue(mockCompetitiveData as any);

      const request = { industry: 'Technology' };

      // First call
      await marketFetcher.fetchMarketContext(request);
      expect(mockMarketAnalyzer.analyzeMarketSize).toHaveBeenCalledTimes(1);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Second call after cache expiry should fetch again
      await marketFetcher.fetchMarketContext(request);
      expect(mockMarketAnalyzer.analyzeMarketSize).toHaveBeenCalledTimes(2);
    });
  });
});