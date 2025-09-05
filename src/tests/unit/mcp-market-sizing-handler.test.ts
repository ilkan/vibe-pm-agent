/**
 * Unit tests for MCP market sizing tool handler
 */

import { PMAgentMCPServer } from '../../mcp/server';
import { MarketSizingArgs } from '../../models/competitive';
import { MCPToolContext } from '../../models/mcp';

describe('MCP Market Sizing Handler', () => {
  let server: PMAgentMCPServer;
  let mockContext: MCPToolContext;

  beforeEach(() => {
    server = new PMAgentMCPServer({ enableLogging: false });
    mockContext = {
      toolName: 'calculate_market_sizing',
      sessionId: 'test-session-456',
      timestamp: Date.now(),
      requestId: 'test-request-456',
      traceId: 'test-trace-456'
    };
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('handleCalculateMarketSizing', () => {
    it('should successfully calculate market sizing with minimal input', async () => {
      const args: MarketSizingArgs = {
        feature_idea: 'AI-powered project management tool for software teams',
        market_definition: {
          industry: 'Software'
        },
        sizing_methods: ['top-down', 'bottom-up']
      };

      const result = await server.handleCalculateMarketSizing(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      expect(result.metadata?.executionTime).toBeGreaterThan(0);
      expect(result.metadata?.quotaUsed).toBe(4); // 2 methods * 2 quota units each

      const sizingData = result.content[0].json;
      expect(sizingData).toHaveProperty('tam');
      expect(sizingData).toHaveProperty('sam');
      expect(sizingData).toHaveProperty('som');
      expect(sizingData).toHaveProperty('methodology');
      expect(sizingData).toHaveProperty('scenarios');
      expect(sizingData).toHaveProperty('confidenceIntervals');
      expect(sizingData).toHaveProperty('sourceAttribution');
      expect(sizingData).toHaveProperty('assumptions');
    });

    it('should handle comprehensive market definition', async () => {
      const args: MarketSizingArgs = {
        feature_idea: 'Enterprise collaboration platform with AI features',
        market_definition: {
          industry: 'Enterprise Software',
          geography: ['US', 'EU', 'APAC'],
          customer_segments: ['Large Enterprise', 'Mid-Market', 'SMB']
        },
        sizing_methods: ['top-down', 'bottom-up', 'value-theory']
      };

      const result = await server.handleCalculateMarketSizing(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.metadata?.quotaUsed).toBe(6); // 3 methods * 2 quota units each

      const sizingData = result.content[0].json;
      expect(sizingData.tam.geographicScope).toEqual(['US', 'EU', 'APAC']);
      expect(sizingData.sam.marketSegments).toEqual(['Large Enterprise', 'Mid-Market', 'SMB']);
      expect(sizingData.methodology).toHaveLength(3);
    });

    it('should validate TAM/SAM/SOM hierarchy', async () => {
      const args: MarketSizingArgs = {
        feature_idea: 'Project management software',
        market_definition: {
          industry: 'Software'
        },
        sizing_methods: ['top-down']
      };

      const result = await server.handleCalculateMarketSizing(args, mockContext);

      expect(result.isError).toBe(false);

      const sizingData = result.content[0].json;
      expect(sizingData.tam.value).toBeGreaterThan(sizingData.sam.value);
      expect(sizingData.sam.value).toBeGreaterThan(sizingData.som.value);
      expect(sizingData.tam.value).toBe(50000000000); // $50B
      expect(sizingData.sam.value).toBe(5000000000);  // $5B
      expect(sizingData.som.value).toBe(500000000);   // $500M
    });

    it('should include multiple scenarios with different probabilities', async () => {
      const args: MarketSizingArgs = {
        feature_idea: 'AI analytics platform',
        market_definition: {
          industry: 'Analytics'
        },
        sizing_methods: ['bottom-up']
      };

      const result = await server.handleCalculateMarketSizing(args, mockContext);

      expect(result.isError).toBe(false);

      const sizingData = result.content[0].json;
      expect(sizingData.scenarios).toHaveLength(3);
      
      const scenarios = sizingData.scenarios;
      const conservative = scenarios.find((s: any) => s.name === 'conservative');
      const balanced = scenarios.find((s: any) => s.name === 'balanced');
      const aggressive = scenarios.find((s: any) => s.name === 'aggressive');

      expect(conservative).toBeDefined();
      expect(balanced).toBeDefined();
      expect(aggressive).toBeDefined();

      expect(conservative!.probability).toBe(0.3);
      expect(balanced!.probability).toBe(0.5);
      expect(aggressive!.probability).toBe(0.2);

      // Validate scenario hierarchy
      expect(conservative!.tam).toBeLessThan(balanced!.tam);
      expect(balanced!.tam).toBeLessThan(aggressive!.tam);
    });

    it('should include confidence intervals for each market type', async () => {
      const args: MarketSizingArgs = {
        feature_idea: 'Enterprise software solution',
        market_definition: {
          industry: 'Enterprise Software'
        },
        sizing_methods: ['top-down', 'bottom-up']
      };

      const result = await server.handleCalculateMarketSizing(args, mockContext);

      expect(result.isError).toBe(false);

      const sizingData = result.content[0].json;
      expect(sizingData.confidenceIntervals).toHaveLength(3);

      const tamInterval = sizingData.confidenceIntervals.find((ci: any) => ci.marketType === 'tam');
      const samInterval = sizingData.confidenceIntervals.find((ci: any) => ci.marketType === 'sam');
      const somInterval = sizingData.confidenceIntervals.find((ci: any) => ci.marketType === 'som');

      expect(tamInterval).toBeDefined();
      expect(samInterval).toBeDefined();
      expect(somInterval).toBeDefined();

      expect(tamInterval!.lowerBound).toBeLessThan(tamInterval!.upperBound);
      expect(tamInterval!.confidenceLevel).toBe(0.95);
    });

    it('should create steering file when requested', async () => {
      const args: MarketSizingArgs = {
        feature_idea: 'AI-powered analytics platform',
        market_definition: {
          industry: 'Analytics'
        },
        sizing_methods: ['top-down'],
        steering_options: {
          create_steering_files: true,
          feature_name: 'ai-analytics',
          inclusion_rule: 'fileMatch',
          file_match_pattern: 'market*'
        }
      };

      const result = await server.handleCalculateMarketSizing(args, mockContext);

      expect(result.isError).toBe(false);
      expect(result.metadata?.steeringFileCreated).toBe(true);
      expect(result.metadata?.steeringFiles).toBeDefined();
      expect(result.metadata?.steeringFiles).toHaveLength(1);
    });

    it('should validate required arguments', async () => {
      const invalidArgs = {
        feature_idea: 'Test feature'
        // Missing market_definition
      } as MarketSizingArgs;

      const result = await server.handleCalculateMarketSizing(invalidArgs, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('market_definition with industry are required');
    });

    it('should validate market definition industry requirement', async () => {
      const args: MarketSizingArgs = {
        feature_idea: 'Test feature',
        market_definition: {
          // Missing industry
          geography: ['US']
        } as any,
        sizing_methods: ['top-down']
      };

      const result = await server.handleCalculateMarketSizing(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('market_definition with industry are required');
    });

    it('should handle different sizing methods correctly', async () => {
      const testCases = [
        { methods: ['top-down'], expectedQuota: 2 },
        { methods: ['bottom-up'], expectedQuota: 2 },
        { methods: ['value-theory'], expectedQuota: 2 },
        { methods: ['top-down', 'bottom-up'], expectedQuota: 4 },
        { methods: ['top-down', 'bottom-up', 'value-theory'], expectedQuota: 6 }
      ];

      for (const testCase of testCases) {
        const args: MarketSizingArgs = {
          feature_idea: 'Test feature for sizing methods',
          market_definition: {
            industry: 'Test Industry'
          },
          sizing_methods: testCase.methods as any
        };

        const result = await server.handleCalculateMarketSizing(args, mockContext);

        expect(result.isError).toBe(false);
        expect(result.metadata?.quotaUsed).toBe(testCase.expectedQuota);
        expect(result.content[0].json.methodology).toHaveLength(testCase.methods.length);
      }
    });

    it('should include proper source attribution', async () => {
      const args: MarketSizingArgs = {
        feature_idea: 'Enterprise software solution',
        market_definition: {
          industry: 'Software'
        },
        sizing_methods: ['top-down']
      };

      const result = await server.handleCalculateMarketSizing(args, mockContext);

      expect(result.isError).toBe(false);

      const sizingData = result.content[0].json;
      expect(sizingData.sourceAttribution).toHaveLength(1);
      expect(sizingData.sourceAttribution[0]).toHaveProperty('type', 'gartner');
      expect(sizingData.sourceAttribution[0]).toHaveProperty('reliability');
      expect(sizingData.sourceAttribution[0]).toHaveProperty('relevance');
      expect(sizingData.sourceAttribution[0]).toHaveProperty('citationFormat');
      expect(sizingData.sourceAttribution[0]).toHaveProperty('dataFreshness');
    });

    it('should include market assumptions with confidence levels', async () => {
      const args: MarketSizingArgs = {
        feature_idea: 'AI-powered platform',
        market_definition: {
          industry: 'AI/ML'
        },
        sizing_methods: ['bottom-up']
      };

      const result = await server.handleCalculateMarketSizing(args, mockContext);

      expect(result.isError).toBe(false);

      const sizingData = result.content[0].json;
      expect(sizingData.assumptions).toHaveLength(2);
      
      const growthAssumption = sizingData.assumptions.find((a: any) => a.category === 'market-growth');
      const penetrationAssumption = sizingData.assumptions.find((a: any) => a.category === 'penetration-rate');

      expect(growthAssumption).toBeDefined();
      expect(penetrationAssumption).toBeDefined();
      expect(growthAssumption!.confidence).toBeGreaterThan(0);
      expect(growthAssumption!.impact).toBe('high');
    });

    it('should include market dynamics analysis', async () => {
      const args: MarketSizingArgs = {
        feature_idea: 'Digital transformation platform',
        market_definition: {
          industry: 'Digital Transformation'
        },
        sizing_methods: ['value-theory']
      };

      const result = await server.handleCalculateMarketSizing(args, mockContext);

      expect(result.isError).toBe(false);

      const sizingData = result.content[0].json;
      expect(sizingData.marketDynamics).toBeDefined();
      expect(sizingData.marketDynamics).toHaveProperty('growthDrivers');
      expect(sizingData.marketDynamics).toHaveProperty('marketBarriers');
      expect(sizingData.marketDynamics).toHaveProperty('seasonality');
      expect(sizingData.marketDynamics).toHaveProperty('cyclicalFactors');
      expect(sizingData.marketDynamics).toHaveProperty('disruptiveForces');

      expect(Array.isArray(sizingData.marketDynamics.growthDrivers)).toBe(true);
      expect(Array.isArray(sizingData.marketDynamics.marketBarriers)).toBe(true);
      expect(Array.isArray(sizingData.marketDynamics.seasonality)).toBe(true);
    });
  });
});