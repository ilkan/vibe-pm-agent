/**
 * Integration tests for market sizing and business case generation
 * Tests complete market sizing workflow with multiple methodologies
 * Validates integration with enhanced business opportunity analysis
 * Creates integration tests for stakeholder communication generation
 */

import { PMAgentMCPServer } from '../../mcp/server';
import { MarketAnalyzer } from '../../components/market-analyzer';
import { BusinessAnalyzer } from '../../components/business-analyzer';
import { PMDocumentGenerator } from '../../components/pm-document-generator';
import { 
  MarketSizingArgs,
  MarketSizingResult,
  BusinessOpportunity,
  MCPToolContext,
  ManagementOnePagerArgs,
  PRFAQArgs
} from '../../models';

describe('Market Sizing and Business Case Integration', () => {
  let server: PMAgentMCPServer;
  let marketAnalyzer: MarketAnalyzer;
  let businessAnalyzer: BusinessAnalyzer;
  let documentGenerator: PMDocumentGenerator;
  let mockContext: MCPToolContext;

  beforeEach(() => {
    server = new PMAgentMCPServer();
    marketAnalyzer = new MarketAnalyzer();
    businessAnalyzer = new BusinessAnalyzer();
    documentGenerator = new PMDocumentGenerator();
    
    mockContext = {
      toolName: 'market_sizing_integration',
      sessionId: 'market-sizing-session-123',
      timestamp: Date.now(),
      requestId: 'market-sizing-req-123',
      traceId: 'market-sizing-trace-123'
    };
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('Complete Market Sizing Workflow', () => {
    test('should perform comprehensive TAM/SAM/SOM analysis with multiple methodologies', async () => {
      const featureIdea = 'AI-powered customer service automation platform for e-commerce businesses';
      
      const marketSizingArgs: MarketSizingArgs = {
        feature_idea: featureIdea,
        market_definition: {
          industry: 'Customer Service Software',
          geography: ['North America', 'Europe', 'Asia-Pacific'],
          customer_segments: ['E-commerce SMBs', 'Enterprise E-commerce', 'Marketplace Platforms']
        },
        sizing_methods: ['top-down', 'bottom-up', 'value-theory'],
        steering_options: {
          create_steering_files: true,
          feature_name: 'ai-customer-service',
          inclusion_rule: 'manual'
        }
      };

      const startTime = Date.now();
      
      const result = await server.handleCalculateMarketSizing(marketSizingArgs, mockContext);
      
      expect(result.isError).toBe(false);
      expect(result.content).toBeDefined();
      expect(result.content[0].json).toBeDefined();
      
      const marketData = result.content[0].json.data as MarketSizingResult;
      
      // Validate TAM calculation
      expect(marketData.tam).toBeDefined();
      expect(marketData.tam.value).toBeGreaterThan(0);
      expect(marketData.tam.currency).toBe('USD');
      expect(marketData.tam.timeframe).toBeDefined();
      expect(marketData.tam.growthRate).toBeGreaterThanOrEqual(0);
      expect(marketData.tam.methodology).toBeDefined();
      expect(marketData.tam.dataQuality).toMatch(/^(low|medium|high)$/);
      
      // Validate SAM calculation
      expect(marketData.sam).toBeDefined();
      expect(marketData.sam.value).toBeGreaterThan(0);
      expect(marketData.sam.value).toBeLessThanOrEqual(marketData.tam.value);
      expect(marketData.sam.currency).toBe(marketData.tam.currency);
      expect(marketData.sam.methodology).toBeDefined();
      
      // Validate SOM calculation
      expect(marketData.som).toBeDefined();
      expect(marketData.som.value).toBeGreaterThan(0);
      expect(marketData.som.value).toBeLessThanOrEqual(marketData.sam.value);
      expect(marketData.som.currency).toBe(marketData.tam.currency);
      expect(marketData.som.methodology).toBeDefined();
      
      // Validate methodologies documentation
      expect(marketData.methodology).toBeDefined();
      expect(marketData.methodology.length).toBe(3); // top-down, bottom-up, value-theory
      
      marketData.methodology.forEach(method => {
        expect(method.type).toMatch(/^(top-down|bottom-up|value-theory)$/);
        expect(method.description).toBeDefined();
        expect(method.dataSource).toBeDefined();
        expect(method.reliability).toBeGreaterThanOrEqual(0);
        expect(method.reliability).toBeLessThanOrEqual(1);
      });
      
      // Validate scenarios
      expect(marketData.scenarios).toBeDefined();
      expect(marketData.scenarios.length).toBeGreaterThanOrEqual(3); // Conservative, Balanced, Aggressive
      
      marketData.scenarios.forEach(scenario => {
        expect(scenario.name).toMatch(/^(conservative|balanced|aggressive)$/i);
        expect(scenario.tam).toBeGreaterThan(0);
        expect(scenario.sam).toBeGreaterThan(0);
        expect(scenario.som).toBeGreaterThan(0);
        expect(scenario.probability).toBeGreaterThan(0);
        expect(scenario.probability).toBeLessThanOrEqual(1);
        expect(scenario.keyAssumptions.length).toBeGreaterThan(0);
      });
      
      // Validate confidence intervals
      expect(marketData.confidenceIntervals).toBeDefined();
      expect(marketData.confidenceIntervals.length).toBe(3); // TAM, SAM, SOM
      
      marketData.confidenceIntervals.forEach(interval => {
        expect(interval.marketType).toMatch(/^(tam|sam|som)$/);
        expect(interval.lowerBound).toBeGreaterThan(0);
        expect(interval.upperBound).toBeGreaterThan(interval.lowerBound);
        expect(interval.confidenceLevel).toBeGreaterThanOrEqual(0.8);
        expect(interval.confidenceLevel).toBeLessThanOrEqual(0.99);
      });
      
      // Validate source attribution
      expect(marketData.sourceAttribution).toBeDefined();
      expect(marketData.sourceAttribution.length).toBeGreaterThan(0);
      
      marketData.sourceAttribution.forEach(source => {
        expect(source.type).toMatch(/^(mckinsey|gartner|wef|industry-report|market-research)$/);
        expect(source.title).toBeDefined();
        expect(source.publishDate).toBeDefined();
        expect(source.reliability).toBeGreaterThanOrEqual(0);
        expect(source.reliability).toBeLessThanOrEqual(1);
      });
      
      // Validate market assumptions
      expect(marketData.assumptions).toBeDefined();
      expect(marketData.assumptions.length).toBeGreaterThan(0);
      
      marketData.assumptions.forEach(assumption => {
        expect(assumption.category).toMatch(/^(market-growth|penetration-rate|pricing|competition|technology)$/);
        expect(assumption.description).toBeDefined();
        expect(assumption.confidence).toBeGreaterThanOrEqual(0);
        expect(assumption.confidence).toBeLessThanOrEqual(1);
        expect(assumption.impact).toMatch(/^(low|medium|high)$/);
      });
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(25000); // Should complete within 25 seconds
      
      // Validate quota usage
      expect(result.metadata?.quotaUsed).toBeDefined();
      expect(result.metadata?.quotaUsed).toBeGreaterThan(0);
      expect(result.metadata?.quotaUsed).toBeLessThanOrEqual(4);
    });

    test('should handle different sizing methodologies appropriately', async () => {
      const featureIdea = 'Blockchain-based supply chain tracking for pharmaceutical industry';
      
      const methodologyTests = [
        {
          methods: ['top-down'],
          expectedCharacteristics: { reliabilityRange: [0.6, 0.9], focusArea: 'market-size' }
        },
        {
          methods: ['bottom-up'],
          expectedCharacteristics: { reliabilityRange: [0.7, 0.95], focusArea: 'customer-count' }
        },
        {
          methods: ['value-theory'],
          expectedCharacteristics: { reliabilityRange: [0.5, 0.8], focusArea: 'value-proposition' }
        },
        {
          methods: ['top-down', 'bottom-up', 'value-theory'],
          expectedCharacteristics: { reliabilityRange: [0.8, 0.95], focusArea: 'comprehensive' }
        }
      ];
      
      for (const test of methodologyTests) {
        const args: MarketSizingArgs = {
          feature_idea: featureIdea,
          market_definition: {
            industry: 'Pharmaceutical Supply Chain',
            geography: ['Global'],
            customer_segments: ['Pharmaceutical Manufacturers', 'Distributors', 'Pharmacies']
          },
          sizing_methods: test.methods as ('top-down' | 'bottom-up' | 'value-theory')[]
        };
        
        const result = await server.handleCalculateMarketSizing(args, mockContext);
        
        expect(result.isError).toBe(false);
        const marketData = result.content[0].json.data as MarketSizingResult;
        
        // Verify methodology count matches request
        expect(marketData.methodology.length).toBe(test.methods.length);
        
        // Verify methodology types match request
        test.methods.forEach(method => {
          expect(marketData.methodology.some(m => m.type === method)).toBe(true);
        });
        
        // Verify reliability characteristics
        const avgReliability = marketData.methodology.reduce((sum, m) => sum + m.reliability, 0) / marketData.methodology.length;
        expect(avgReliability).toBeGreaterThanOrEqual(test.expectedCharacteristics.reliabilityRange[0]);
        expect(avgReliability).toBeLessThanOrEqual(test.expectedCharacteristics.reliabilityRange[1]);
        
        // Multiple methodologies should provide higher confidence
        if (test.methods.length > 1) {
          expect(marketData.confidenceIntervals.every(ci => ci.confidenceLevel >= 0.85)).toBe(true);
        }
      }
    });

    test('should validate market sizing provides comprehensive market analysis', async () => {
      const featureIdea = 'IoT-enabled smart building management system for commercial real estate';
      
      // Perform market sizing analysis
      const marketSizingArgs: MarketSizingArgs = {
        feature_idea: featureIdea,
        market_definition: {
          industry: 'Smart Building Technology',
          geography: ['North America', 'Europe'],
          customer_segments: ['Commercial Real Estate Owners', 'Property Management Companies', 'Facility Managers']
        },
        sizing_methods: ['top-down', 'bottom-up']
      };
      
      const marketResult = await server.handleCalculateMarketSizing(marketSizingArgs, mockContext);
      expect(marketResult.isError).toBe(false);
      
      const marketData = marketResult.content[0].json.data as MarketSizingResult;
      
      // Validate comprehensive market analysis
      expect(marketData.tam.value).toBeGreaterThan(0);
      expect(marketData.sam.value).toBeGreaterThan(0);
      expect(marketData.som.value).toBeGreaterThan(0);
      
      // Validate market assumptions provide strategic context
      expect(marketData.assumptions.length).toBeGreaterThan(0);
      expect(marketData.scenarios.length).toBeGreaterThanOrEqual(3);
      expect(marketData.confidenceIntervals.length).toBe(3); // TAM, SAM, SOM
      
      // Validate methodologies provide reliable analysis
      expect(marketData.methodology.length).toBe(2); // top-down, bottom-up
      marketData.methodology.forEach(method => {
        expect(method.reliability).toBeGreaterThan(0.5);
        expect(method.calculationSteps.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Stakeholder Communication Integration', () => {
    test('should generate executive one-pager with integrated market sizing data', async () => {
      const featureIdea = 'AI-powered fraud detection system for financial institutions';
      
      // Perform market sizing analysis
      const marketSizingArgs: MarketSizingArgs = {
        feature_idea: featureIdea,
        market_definition: {
          industry: 'Financial Technology',
          geography: ['Global'],
          customer_segments: ['Banks', 'Credit Unions', 'Fintech Companies', 'Payment Processors']
        },
        sizing_methods: ['top-down', 'bottom-up', 'value-theory']
      };
      
      const marketResult = await server.handleCalculateMarketSizing(marketSizingArgs, mockContext);
      expect(marketResult.isError).toBe(false);
      
      // Generate management one-pager with market data
      const onePagerArgs: ManagementOnePagerArgs = {
        requirements: `AI-powered fraud detection system with market opportunity of $${Math.round(marketResult.content[0].json.data.tam.value / 1000000000)}B TAM`,
        design: 'AI-powered fraud detection with machine learning algorithms and real-time processing',
        tasks: 'Implementation plan with ML model development, integration, and deployment phases',
        roi_inputs: {
          cost_naive: 5000000,
          cost_balanced: 3000000,
          cost_bold: 2000000
        }
      };
      
      const onePagerResult = await server.handleGenerateManagementOnePager(onePagerArgs, mockContext);
      expect(onePagerResult.isError).toBe(false);
      
      const markdown = onePagerResult.content[0].markdown;
      expect(markdown).toBeDefined();
      
      // Validate market sizing integration in one-pager
      const marketData = marketResult.content[0].json.data as MarketSizingResult;
      
      // Should include TAM/SAM/SOM figures
      expect(markdown).toContain('TAM');
      expect(markdown).toContain('SAM');
      expect(markdown).toContain('SOM');
      
      // Should include market size values (formatted)
      const tamBillions = Math.round(marketData.tam.value / 1000000000);
      const samBillions = Math.round(marketData.sam.value / 1000000000);
      
      if (tamBillions >= 1) {
        expect(markdown).toContain(`$${tamBillions}B`);
      }
      if (samBillions >= 1) {
        expect(markdown).toContain(`$${samBillions}B`);
      }
      
      // Should include market growth information
      expect(markdown).toContain('growth');
      expect(markdown).toContain('%');
      
      // Should reference market opportunity in strategic context
      expect(markdown?.includes('market opportunity') || markdown?.includes('market size')).toBe(true);
      
      // Validate ROI section incorporates market data
      expect(markdown).toContain('## ROI Snapshot');
      expect(markdown).toContain('revenue');
      expect(markdown).toContain('market share');
    });

    test('should generate PR-FAQ with market positioning and opportunity context', async () => {
      const featureIdea = 'Sustainable packaging optimization platform for e-commerce';
      
      // Perform market sizing analysis
      const marketSizingArgs: MarketSizingArgs = {
        feature_idea: featureIdea,
        market_definition: {
          industry: 'Sustainable Packaging',
          geography: ['North America', 'Europe'],
          customer_segments: ['E-commerce Retailers', 'Packaging Manufacturers', 'Logistics Companies']
        },
        sizing_methods: ['top-down', 'bottom-up']
      };
      
      const marketResult = await server.handleCalculateMarketSizing(marketSizingArgs, mockContext);
      expect(marketResult.isError).toBe(false);
      
      // Generate PR-FAQ with market context
      const prfaqArgs: PRFAQArgs = {
        requirements: `Sustainable packaging optimization platform with market opportunity of $${Math.round(marketResult.content[0].json.data.tam.value / 1000000000)}B TAM`,
        design: 'AI-powered packaging optimization with sustainability metrics and cost analysis',
        target_date: '2025-06-30'
      };
      
      const prfaqResult = await server.handleGeneratePRFAQ(prfaqArgs, mockContext);
      expect(prfaqResult.isError).toBe(false);
      
      const markdown = prfaqResult.content[0].markdown;
      expect(markdown).toBeDefined();
      
      // Validate market context in PR-FAQ
      expect(markdown).toContain('# Press Release');
      expect(markdown).toContain('# FAQ');
      
      // Should address market opportunity in press release
      expect(markdown?.includes('market') || markdown?.includes('opportunity')).toBe(true);
      expect(markdown?.includes('sustainable') || markdown?.includes('packaging')).toBe(true);
      
      // FAQ should address market questions
      expect(markdown?.includes('market size') || markdown?.includes('market opportunity')).toBe(true);
      expect(markdown?.includes('competition') || markdown?.includes('competitive')).toBe(true);
      
      // Should include target date
      expect(markdown).toContain('2025-06-30');
      
      // Validate FAQ structure includes market-related questions
      const faqQuestions = markdown?.match(/\*\*Q\d+:/g);
      expect(faqQuestions?.length).toBe(10);
      
      // Should address market timing and opportunity
      expect(markdown?.includes('Why now') || markdown?.includes('market timing')).toBe(true);
      expect(markdown?.includes('customer') || markdown?.includes('market need')).toBe(true);
    });

    test('should generate stakeholder communication with competitive and market context', async () => {
      const featureIdea = 'Telemedicine platform for rural healthcare access';
      
      // Perform comprehensive market analysis
      const marketSizingArgs: MarketSizingArgs = {
        feature_idea: featureIdea,
        market_definition: {
          industry: 'Telemedicine',
          geography: ['United States', 'Canada'],
          customer_segments: ['Rural Healthcare Providers', 'Patients in Underserved Areas', 'Healthcare Systems']
        },
        sizing_methods: ['top-down', 'bottom-up', 'value-theory']
      };
      
      const marketResult = await server.handleCalculateMarketSizing(marketSizingArgs, mockContext);
      expect(marketResult.isError).toBe(false);
      
      // Generate stakeholder communication with market data
      const onePagerArgs = {
        requirements: `Telemedicine platform for rural healthcare with market opportunity of $${Math.round(marketResult.content[0].json.data.tam.value / 1000000000)}B TAM`,
        design: 'Telemedicine platform with rural healthcare focus and regulatory compliance',
        tasks: 'Implementation plan with healthcare compliance and rural deployment'
      };
      
      const stakeholderResult = await server.handleGenerateManagementOnePager(onePagerArgs, mockContext);
      expect(stakeholderResult.isError).toBe(false);
      
      const presentation = stakeholderResult.content[0].markdown;
      expect(presentation).toBeDefined();
      
      // Validate management one-pager structure
      expect(presentation).toContain('# Management One-Pager');
      expect(presentation).toContain('## Answer');
      expect(presentation).toContain('## Because');
      expect(presentation).toContain('## What (Scope Today)');
      expect(presentation).toContain('## Risks & Mitigations');
      expect(presentation).toContain('## Options');
      expect(presentation).toContain('## ROI Snapshot');
      
      // Should include market sizing data
      const marketData = marketResult.content[0].json.data as MarketSizingResult;
      expect(presentation?.includes('TAM') || presentation?.includes('Total Addressable Market')).toBe(true);
      expect(presentation?.includes('SAM') || presentation?.includes('Serviceable Addressable Market')).toBe(true);
      
      // Should include financial projections based on market data
      expect(presentation).toContain('revenue');
      expect(presentation).toContain('$');
      expect(presentation).toContain('%');
      
      // Should address competitive positioning
      expect(presentation?.includes('competitive') || presentation?.includes('competition')).toBe(true);
      expect(presentation?.includes('differentiation') || presentation?.includes('advantage')).toBe(true);
      
      // Should include risk mitigation
      expect(presentation).toContain('risk');
      expect(presentation).toContain('mitigation');
    });
  });

  describe('Performance and Quality Validation', () => {
    test('should meet performance benchmarks for market sizing analysis', async () => {
      const testCases = [
        {
          name: 'Single Methodology',
          methods: ['top-down'],
          expectedMaxTime: 10000 // 10 seconds
        },
        {
          name: 'Dual Methodology',
          methods: ['top-down', 'bottom-up'],
          expectedMaxTime: 15000 // 15 seconds
        },
        {
          name: 'Comprehensive Analysis',
          methods: ['top-down', 'bottom-up', 'value-theory'],
          expectedMaxTime: 20000 // 20 seconds
        }
      ];
      
      for (const testCase of testCases) {
        const startTime = Date.now();
        
        const args: MarketSizingArgs = {
          feature_idea: 'Cloud-based inventory management for retail chains',
          market_definition: {
            industry: 'Retail Technology',
            geography: ['Global'],
            customer_segments: ['Retail Chains', 'Franchise Operations']
          },
          sizing_methods: testCase.methods as ('top-down' | 'bottom-up' | 'value-theory')[]
        };
        
        const result = await server.handleCalculateMarketSizing(args, mockContext);
        
        const executionTime = Date.now() - startTime;
        
        expect(result.isError).toBe(false);
        expect(executionTime).toBeLessThan(testCase.expectedMaxTime);
        
        // Validate result quality wasn't compromised for speed
        const marketData = result.content[0].json.data as MarketSizingResult;
        expect(marketData.tam.value).toBeGreaterThan(0);
        expect(marketData.sam.value).toBeGreaterThan(0);
        expect(marketData.som.value).toBeGreaterThan(0);
        expect(marketData.methodology.length).toBe(testCase.methods.length);
      }
    });

    test('should validate market sizing data consistency and logic', async () => {
      const args: MarketSizingArgs = {
        feature_idea: 'Digital transformation consulting platform for manufacturing',
        market_definition: {
          industry: 'Manufacturing Consulting',
          geography: ['North America', 'Europe', 'Asia'],
          customer_segments: ['Manufacturing Companies', 'Industrial Equipment Manufacturers']
        },
        sizing_methods: ['top-down', 'bottom-up', 'value-theory']
      };
      
      const result = await server.handleCalculateMarketSizing(args, mockContext);
      expect(result.isError).toBe(false);
      
      const marketData = result.content[0].json.data as MarketSizingResult;
      
      // Validate market size hierarchy: TAM >= SAM >= SOM
      expect(marketData.tam.value).toBeGreaterThanOrEqual(marketData.sam.value);
      expect(marketData.sam.value).toBeGreaterThanOrEqual(marketData.som.value);
      
      // Validate growth rates are reasonable
      expect(marketData.tam.growthRate).toBeGreaterThanOrEqual(-0.1); // -10% minimum
      expect(marketData.tam.growthRate).toBeLessThanOrEqual(1.0); // 100% maximum
      expect(marketData.sam.growthRate).toBeGreaterThanOrEqual(-0.1);
      expect(marketData.sam.growthRate).toBeLessThanOrEqual(1.0);
      expect(marketData.som.growthRate).toBeGreaterThanOrEqual(-0.1);
      expect(marketData.som.growthRate).toBeLessThanOrEqual(1.0);
      
      // Validate scenario consistency
      marketData.scenarios.forEach(scenario => {
        expect(scenario.tam).toBeGreaterThanOrEqual(scenario.sam);
        expect(scenario.sam).toBeGreaterThanOrEqual(scenario.som);
        
        // Conservative scenario should have lower projections than aggressive
        if (scenario.name.toLowerCase() === 'conservative') {
          const aggressive = marketData.scenarios.find(s => s.name.toLowerCase() === 'aggressive');
          if (aggressive) {
            expect(scenario.tam).toBeLessThanOrEqual(aggressive.tam);
            expect(scenario.sam).toBeLessThanOrEqual(aggressive.sam);
            expect(scenario.som).toBeLessThanOrEqual(aggressive.som);
          }
        }
      });
      
      // Validate confidence intervals
      marketData.confidenceIntervals.forEach(interval => {
        expect(interval.lowerBound).toBeLessThan(interval.upperBound);
        expect(interval.confidenceLevel).toBeGreaterThanOrEqual(0.8);
        expect(interval.confidenceLevel).toBeLessThanOrEqual(0.99);
        
        // Confidence interval should contain the point estimate
        const pointEstimate = marketData[interval.marketType as keyof MarketSizingResult] as any;
        if (pointEstimate && typeof pointEstimate === 'object' && 'value' in pointEstimate) {
          expect(pointEstimate.value).toBeGreaterThanOrEqual(interval.lowerBound);
          expect(pointEstimate.value).toBeLessThanOrEqual(interval.upperBound);
        }
      });
    });

    test('should handle edge cases and provide appropriate fallbacks', async () => {
      const edgeCases = [
        {
          name: 'Niche Market',
          args: {
            feature_idea: 'Specialized veterinary software for exotic animal practices',
            market_definition: {
              industry: 'Veterinary Software',
              geography: ['United States'],
              customer_segments: ['Exotic Animal Veterinarians']
            },
            sizing_methods: ['bottom-up'] as ('top-down' | 'bottom-up' | 'value-theory')[]
          },
          expectedCharacteristics: {
            smallMarket: true,
            lowerConfidence: true
          }
        },
        {
          name: 'Emerging Market',
          args: {
            feature_idea: 'Quantum computing cloud services for research institutions',
            market_definition: {
              industry: 'Quantum Computing',
              geography: ['Global'],
              customer_segments: ['Research Institutions', 'Technology Companies']
            },
            sizing_methods: ['value-theory'] as ('top-down' | 'bottom-up' | 'value-theory')[]
          },
          expectedCharacteristics: {
            highGrowth: true,
            highUncertainty: true
          }
        }
      ];
      
      for (const edgeCase of edgeCases) {
        const result = await server.handleCalculateMarketSizing(edgeCase.args, mockContext);
        
        expect(result.isError).toBe(false);
        const marketData = result.content[0].json.data as MarketSizingResult;
        
        if (edgeCase.expectedCharacteristics.smallMarket) {
          // Niche markets should have smaller SOM values
          expect(marketData.som.value).toBeLessThan(1000000000); // Less than $1B
        }
        
        if (edgeCase.expectedCharacteristics.lowerConfidence) {
          // Should have lower confidence indicators
          const avgConfidence = marketData.confidenceIntervals.reduce((sum, ci) => sum + ci.confidenceLevel, 0) / marketData.confidenceIntervals.length;
          expect(avgConfidence).toBeLessThan(0.9);
        }
        
        if (edgeCase.expectedCharacteristics.highGrowth) {
          // Emerging markets should show high growth potential
          expect(marketData.tam.growthRate).toBeGreaterThan(0.1); // >10% growth
        }
        
        if (edgeCase.expectedCharacteristics.highUncertainty) {
          // Should have wider confidence intervals
          marketData.confidenceIntervals.forEach(interval => {
            const range = interval.upperBound - interval.lowerBound;
            const midpoint = (interval.upperBound + interval.lowerBound) / 2;
            const relativeRange = range / midpoint;
            expect(relativeRange).toBeGreaterThan(0.3); // >30% relative uncertainty
          });
        }
        
        // All edge cases should still provide complete analysis
        expect(marketData.tam.value).toBeGreaterThan(0);
        expect(marketData.sam.value).toBeGreaterThan(0);
        expect(marketData.som.value).toBeGreaterThan(0);
        expect(marketData.methodology.length).toBeGreaterThan(0);
        expect(marketData.assumptions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Integration Error Handling', () => {
    test('should handle invalid market definitions gracefully', async () => {
      const invalidArgs = [
        {
          args: {
            feature_idea: 'Valid feature idea',
            market_definition: {
              industry: '',
              geography: [],
              customer_segments: []
            },
            sizing_methods: ['top-down'] as ('top-down' | 'bottom-up' | 'value-theory')[]
          },
          expectedError: 'Invalid market definition'
        },
        {
          args: {
            feature_idea: '',
            market_definition: {
              industry: 'Technology',
              geography: ['Global'],
              customer_segments: ['Businesses']
            },
            sizing_methods: ['top-down'] as ('top-down' | 'bottom-up' | 'value-theory')[]
          },
          expectedError: 'Feature idea is required'
        }
      ];
      
      for (const testCase of invalidArgs) {
        try {
          await server.handleCalculateMarketSizing(testCase.args as MarketSizingArgs, mockContext);
          fail('Expected error was not thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain(testCase.expectedError);
        }
      }
    });

    test('should provide degraded service when data sources are limited', async () => {
      const args: MarketSizingArgs = {
        feature_idea: 'Highly specialized quantum encryption for satellite communications',
        market_definition: {
          industry: 'Quantum Encryption',
          geography: ['Antarctica'], // Unrealistic geography
          customer_segments: ['Satellite Operators']
        },
        sizing_methods: ['top-down', 'bottom-up', 'value-theory']
      };
      
      const result = await server.handleCalculateMarketSizing(args, mockContext);
      
      expect(result.isError).toBe(false);
      const marketData = result.content[0].json.data as MarketSizingResult;
      
      // Should still provide analysis with appropriate warnings
      expect(marketData.tam.value).toBeGreaterThan(0);
      expect(marketData.sam.value).toBeGreaterThan(0);
      expect(marketData.som.value).toBeGreaterThan(0);
      
      // Should indicate lower data quality
      expect(marketData.tam.dataQuality).toMatch(/^(low|medium)$/);
      expect(marketData.sam.dataQuality).toMatch(/^(low|medium)$/);
      expect(marketData.som.dataQuality).toMatch(/^(low|medium)$/);
      
      // Should have lower confidence intervals
      const avgConfidence = marketData.confidenceIntervals.reduce((sum, ci) => sum + ci.confidenceLevel, 0) / marketData.confidenceIntervals.length;
      expect(avgConfidence).toBeLessThan(0.85);
      
      // Should include assumptions about data limitations
      expect(marketData.assumptions.some(assumption => 
        assumption.description.toLowerCase().includes('limited data') ||
        assumption.description.toLowerCase().includes('estimate') ||
        assumption.confidence < 0.6
      )).toBe(true);
    });
  });
});