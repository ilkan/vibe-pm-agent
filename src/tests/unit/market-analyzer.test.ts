/**
 * Unit Tests for Market Analyzer Component
 * 
 * Tests TAM/SAM/SOM calculation engine with multiple methodologies
 * including top-down, bottom-up, and value-theory calculations.
 */

import { MarketAnalyzer } from '../../components/market-analyzer';
import {
  MarketSizingArgs,
  MarketSizingResult,
  MarketSizingError,
  MARKET_SIZING_DEFAULTS
} from '../../models/competitive';

describe('MarketAnalyzer', () => {
  let marketAnalyzer: MarketAnalyzer;

  beforeEach(() => {
    marketAnalyzer = new MarketAnalyzer();
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with default configuration', () => {
      const analyzer = new MarketAnalyzer();
      expect(analyzer).toBeInstanceOf(MarketAnalyzer);
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        defaultTimeframe: '3 years',
        defaultCurrency: 'EUR',
        confidenceThreshold: 0.8,
        enableScenarioAnalysis: false
      };
      
      const analyzer = new MarketAnalyzer(customConfig);
      expect(analyzer).toBeInstanceOf(MarketAnalyzer);
    });
  });

  describe('Market Sizing Analysis', () => {
    const validArgs: MarketSizingArgs = {
      feature_idea: 'AI-powered customer service automation platform that reduces support costs by 40%',
      market_definition: {
        industry: 'technology',
        geography: ['north america', 'europe'],
        customer_segments: ['enterprise', 'mid-market']
      },
      sizing_methods: ['top-down', 'bottom-up'] as const
    };

    it('should perform comprehensive market sizing analysis', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      expect(result).toBeDefined();
      expect(result.tam).toBeDefined();
      expect(result.sam).toBeDefined();
      expect(result.som).toBeDefined();
      expect(result.methodology).toHaveLength(2);
      expect(result.scenarios).toHaveLength(3);
      expect(result.confidenceIntervals).toHaveLength(3);
      expect(result.sourceAttribution).toHaveLength(1);
      expect(result.assumptions).toHaveLength(3);
      expect(result.marketDynamics).toBeDefined();
    });

    it('should validate TAM is larger than SAM which is larger than SOM', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      expect(result.tam.value).toBeGreaterThan(result.sam.value);
      expect(result.sam.value).toBeGreaterThan(result.som.value);
      expect(result.som.value).toBeGreaterThan(0);
    });

    it('should include proper currency and timeframe', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      expect(result.tam.currency).toBe(MARKET_SIZING_DEFAULTS.DEFAULT_CURRENCY);
      expect(result.sam.currency).toBe(MARKET_SIZING_DEFAULTS.DEFAULT_CURRENCY);
      expect(result.som.currency).toBe(MARKET_SIZING_DEFAULTS.DEFAULT_CURRENCY);
      
      expect(result.tam.timeframe).toBe(MARKET_SIZING_DEFAULTS.DEFAULT_TIMEFRAME);
      expect(result.sam.timeframe).toBe(MARKET_SIZING_DEFAULTS.DEFAULT_TIMEFRAME);
      expect(result.som.timeframe).toBe(MARKET_SIZING_DEFAULTS.DEFAULT_TIMEFRAME);
    });

    it('should include calculation dates', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      expect(result.tam.calculationDate).toBeDefined();
      expect(result.sam.calculationDate).toBeDefined();
      expect(result.som.calculationDate).toBeDefined();
      
      // Verify dates are recent (within last minute)
      const now = new Date();
      const tamDate = new Date(result.tam.calculationDate);
      expect(now.getTime() - tamDate.getTime()).toBeLessThan(60000);
    });

    it('should include geographic scope and market segments', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      expect(result.tam.geographicScope).toEqual(validArgs.market_definition.geography);
      expect(result.tam.marketSegments).toEqual(validArgs.market_definition.customer_segments);
    });
  });

  describe('TAM Calculation Methodologies', () => {
    const baseArgs: MarketSizingArgs = {
      feature_idea: 'Enterprise workflow automation tool',
      market_definition: {
        industry: 'technology',
        geography: ['global'],
        customer_segments: ['enterprise']
      },
      sizing_methods: [] as ('top-down' | 'bottom-up' | 'value-theory')[]
    };

    it('should calculate TAM using top-down methodology', async () => {
      const args = { ...baseArgs, sizing_methods: ['top-down'] as const };
      const result = await marketAnalyzer.analyzeMarketSize(args);

      expect(result.tam.methodology).toBe('top-down');
      expect(result.tam.value).toBeGreaterThan(0);
      expect(result.tam.dataQuality).toMatch(/^(high|medium|low)$/);
    });

    it('should calculate TAM using bottom-up methodology', async () => {
      const args = { ...baseArgs, sizing_methods: ['bottom-up'] as const };
      const result = await marketAnalyzer.analyzeMarketSize(args);

      expect(result.tam.methodology).toBe('bottom-up');
      expect(result.tam.value).toBeGreaterThan(0);
      expect(result.tam.dataQuality).toMatch(/^(high|medium|low)$/);
    });

    it('should calculate TAM using value-theory methodology', async () => {
      const args = { ...baseArgs, sizing_methods: ['value-theory'] as const };
      const result = await marketAnalyzer.analyzeMarketSize(args);

      expect(result.tam.methodology).toBe('value-theory');
      expect(result.tam.value).toBeGreaterThan(0);
      expect(result.tam.dataQuality).toMatch(/^(high|medium|low)$/);
    });

    it('should handle multiple methodologies and select best result', async () => {
      const args = { ...baseArgs, sizing_methods: ['top-down', 'bottom-up', 'value-theory'] as const };
      const result = await marketAnalyzer.analyzeMarketSize(args);

      expect(result.methodology).toHaveLength(3);
      expect(result.tam.value).toBeGreaterThan(0);
      
      // Should have methodology information for all three approaches
      const methodologyTypes = result.methodology.map(m => m.type);
      expect(methodologyTypes).toContain('top-down');
      expect(methodologyTypes).toContain('bottom-up');
      expect(methodologyTypes).toContain('value-theory');
    });

    it('should use default methodologies when none specified', async () => {
      const args = { ...baseArgs }; // No sizing_methods specified
      const result = await marketAnalyzer.analyzeMarketSize(args);

      expect(result.methodology.length).toBeGreaterThan(0);
      
      // Should use default methodologies
      const methodologyTypes = result.methodology.map(m => m.type);
      MARKET_SIZING_DEFAULTS.DEFAULT_SIZING_METHODS.forEach(method => {
        expect(methodologyTypes).toContain(method);
      });
    });
  });

  describe('SAM and SOM Calculations', () => {
    const validArgs: MarketSizingArgs = {
      feature_idea: 'Cloud-based inventory management system',
      market_definition: {
        industry: 'retail',
        geography: ['north america'],
        customer_segments: ['mid-market', 'small business']
      },
      sizing_methods: ['bottom-up'] as const
    };

    it('should calculate SAM as percentage of TAM', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      const samPercentage = result.sam.value / result.tam.value;
      expect(samPercentage).toBeGreaterThan(0);
      expect(samPercentage).toBeLessThanOrEqual(0.4); // Should not exceed 40%
      expect(result.sam.methodology).toContain('SAM derived from');
    });

    it('should calculate SOM as percentage of SAM', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      const somPercentage = result.som.value / result.sam.value;
      expect(somPercentage).toBeGreaterThan(0);
      expect(somPercentage).toBeLessThanOrEqual(0.15); // Should not exceed 15%
      expect(result.som.methodology).toContain('SOM derived from');
    });

    it('should adjust SAM based on geographic reach', async () => {
      const globalArgs = {
        ...validArgs,
        market_definition: {
          ...validArgs.market_definition,
          geography: ['global']
        }
      };
      
      const regionalArgs = {
        ...validArgs,
        market_definition: {
          ...validArgs.market_definition,
          geography: ['north america']
        }
      };

      const globalResult = await marketAnalyzer.analyzeMarketSize(globalArgs);
      const regionalResult = await marketAnalyzer.analyzeMarketSize(regionalArgs);

      // Global should have higher SAM percentage due to broader reach
      const globalSamPercentage = globalResult.sam.value / globalResult.tam.value;
      const regionalSamPercentage = regionalResult.sam.value / regionalResult.tam.value;
      
      expect(globalSamPercentage).toBeGreaterThanOrEqual(regionalSamPercentage);
    });

    it('should adjust SAM based on customer segments', async () => {
      const multiSegmentArgs = {
        ...validArgs,
        market_definition: {
          ...validArgs.market_definition,
          customer_segments: ['enterprise', 'mid-market', 'small business']
        }
      };
      
      const singleSegmentArgs = {
        ...validArgs,
        market_definition: {
          ...validArgs.market_definition,
          customer_segments: ['enterprise']
        }
      };

      const multiResult = await marketAnalyzer.analyzeMarketSize(multiSegmentArgs);
      const singleResult = await marketAnalyzer.analyzeMarketSize(singleSegmentArgs);

      // Multi-segment should have higher SAM percentage
      const multiSamPercentage = multiResult.sam.value / multiResult.tam.value;
      const singleSamPercentage = singleResult.sam.value / singleResult.tam.value;
      
      expect(multiSamPercentage).toBeGreaterThanOrEqual(singleSamPercentage);
    });
  });

  describe('Scenario Analysis', () => {
    const validArgs: MarketSizingArgs = {
      feature_idea: 'AI-powered financial planning tool',
      market_definition: {
        industry: 'finance',
        geography: ['europe'],
        customer_segments: ['enterprise']
      },
      sizing_methods: ['top-down'] as const
    };

    it('should generate three scenarios by default', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      expect(result.scenarios).toHaveLength(3);
      
      const scenarioNames = result.scenarios.map(s => s.name);
      expect(scenarioNames).toContain('conservative');
      expect(scenarioNames).toContain('balanced');
      expect(scenarioNames).toContain('aggressive');
    });

    it('should have conservative scenario with lower values', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      const conservative = result.scenarios.find(s => s.name === 'conservative')!;
      const balanced = result.scenarios.find(s => s.name === 'balanced')!;
      
      expect(conservative.tam).toBeLessThan(balanced.tam);
      expect(conservative.sam).toBeLessThan(balanced.sam);
      expect(conservative.som).toBeLessThan(balanced.som);
    });

    it('should have aggressive scenario with higher values', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      const aggressive = result.scenarios.find(s => s.name === 'aggressive')!;
      const balanced = result.scenarios.find(s => s.name === 'balanced')!;
      
      expect(aggressive.tam).toBeGreaterThan(balanced.tam);
      expect(aggressive.sam).toBeGreaterThan(balanced.sam);
      expect(aggressive.som).toBeGreaterThan(balanced.som);
    });

    it('should include probability and assumptions for each scenario', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      result.scenarios.forEach(scenario => {
        expect(scenario.probability).toBeGreaterThan(0);
        expect(scenario.probability).toBeLessThanOrEqual(1);
        expect(scenario.keyAssumptions).toHaveLength(3);
        expect(scenario.riskFactors).toHaveLength(3);
        expect(scenario.description).toBeDefined();
      });
    });

    it('should disable scenario analysis when configured', async () => {
      const analyzer = new MarketAnalyzer({ enableScenarioAnalysis: false });
      const result = await analyzer.analyzeMarketSize(validArgs);

      expect(result.scenarios).toHaveLength(0);
    });
  });

  describe('Confidence Intervals', () => {
    const validArgs: MarketSizingArgs = {
      feature_idea: 'Healthcare data analytics platform',
      market_definition: {
        industry: 'healthcare',
        geography: ['north america'],
        customer_segments: ['enterprise']
      },
      sizing_methods: ['bottom-up'] as const
    };

    it('should generate confidence intervals for TAM, SAM, and SOM', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      expect(result.confidenceIntervals).toHaveLength(3);
      
      const intervalTypes = result.confidenceIntervals.map(ci => ci.marketType);
      expect(intervalTypes).toContain('tam');
      expect(intervalTypes).toContain('sam');
      expect(intervalTypes).toContain('som');
    });

    it('should have valid confidence interval bounds', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      result.confidenceIntervals.forEach(interval => {
        expect(interval.lowerBound).toBeGreaterThan(0);
        expect(interval.upperBound).toBeGreaterThan(interval.lowerBound);
        expect(interval.confidenceLevel).toBeGreaterThan(0);
        expect(interval.confidenceLevel).toBeLessThanOrEqual(1);
        expect(interval.methodology).toBeDefined();
      });
    });

    it('should have TAM confidence interval containing actual TAM value', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      const tamInterval = result.confidenceIntervals.find(ci => ci.marketType === 'tam')!;
      expect(result.tam.value).toBeGreaterThanOrEqual(tamInterval.lowerBound);
      expect(result.tam.value).toBeLessThanOrEqual(tamInterval.upperBound);
    });

    it('should have decreasing confidence levels from TAM to SOM', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      const tamInterval = result.confidenceIntervals.find(ci => ci.marketType === 'tam')!;
      const samInterval = result.confidenceIntervals.find(ci => ci.marketType === 'sam')!;
      const somInterval = result.confidenceIntervals.find(ci => ci.marketType === 'som')!;

      expect(tamInterval.confidenceLevel).toBeGreaterThanOrEqual(samInterval.confidenceLevel);
      expect(samInterval.confidenceLevel).toBeGreaterThanOrEqual(somInterval.confidenceLevel);
    });
  });

  describe('Market Assumptions and Dynamics', () => {
    const validArgs: MarketSizingArgs = {
      feature_idea: 'Manufacturing optimization software',
      market_definition: {
        industry: 'manufacturing',
        geography: ['asia pacific'],
        customer_segments: ['enterprise']
      },
      sizing_methods: ['value-theory'] as const
    };

    it('should generate market assumptions', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      expect(result.assumptions).toHaveLength(3);
      
      const categories = result.assumptions.map(a => a.category);
      expect(categories).toContain('market-growth');
      expect(categories).toContain('penetration-rate');
      expect(categories).toContain('pricing');
    });

    it('should include confidence and impact for each assumption', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      result.assumptions.forEach(assumption => {
        expect(assumption.confidence).toBeGreaterThan(0);
        expect(assumption.confidence).toBeLessThanOrEqual(1);
        expect(assumption.impact).toMatch(/^(high|medium|low)$/);
        expect(assumption.description).toBeDefined();
        expect(assumption.value).toBeDefined();
      });
    });

    it('should analyze market dynamics', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      expect(result.marketDynamics.growthDrivers).toHaveLength(4);
      expect(result.marketDynamics.marketBarriers).toHaveLength(4);
      expect(result.marketDynamics.seasonality).toHaveLength(1);
      expect(result.marketDynamics.cyclicalFactors).toHaveLength(3);
      expect(result.marketDynamics.disruptiveForces).toHaveLength(4);
    });

    it('should include seasonality patterns', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      result.marketDynamics.seasonality.forEach(pattern => {
        expect(pattern.period).toBeDefined();
        expect(pattern.impact).toBeGreaterThan(0);
        expect(pattern.description).toBeDefined();
      });
    });
  });

  describe('Source Attribution', () => {
    const validArgs: MarketSizingArgs = {
      feature_idea: 'Government compliance management system',
      market_definition: {
        industry: 'technology',
        geography: ['north america'],
        customer_segments: ['government']
      },
      sizing_methods: ['top-down'] as const
    };

    it('should generate source attribution', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      expect(result.sourceAttribution).toHaveLength(1);
      
      const source = result.sourceAttribution[0];
      expect(source.id).toBeDefined();
      expect(source.type).toBe('market-research');
      expect(source.title).toContain(validArgs.market_definition.industry);
      expect(source.reliability).toBeGreaterThan(0);
      expect(source.relevance).toBeGreaterThan(0);
    });

    it('should include data freshness information', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      const source = result.sourceAttribution[0];
      expect(source.dataFreshness.status).toMatch(/^(fresh|recent|stale|outdated)$/);
      expect(source.dataFreshness.ageInDays).toBeGreaterThanOrEqual(0);
      expect(source.dataFreshness.recommendedUpdateFrequency).toBeGreaterThan(0);
      expect(source.dataFreshness.lastValidated).toBeDefined();
    });

    it('should include citation format and key findings', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      const source = result.sourceAttribution[0];
      expect(source.citationFormat).toBeDefined();
      expect(source.keyFindings).toHaveLength(3);
      expect(source.limitations).toHaveLength(2);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should throw error for missing feature idea', async () => {
      const invalidArgs = {
        feature_idea: '',
        market_definition: {
          industry: 'technology',
          geography: ['global'],
          customer_segments: ['enterprise']
        },
        sizing_methods: ['top-down'] as const
      };

      await expect(marketAnalyzer.analyzeMarketSize(invalidArgs))
        .rejects.toThrow(MarketSizingError);
    });

    it('should throw error for short feature idea', async () => {
      const invalidArgs = {
        feature_idea: 'short',
        market_definition: {
          industry: 'technology',
          geography: ['global'],
          customer_segments: ['enterprise']
        },
        sizing_methods: ['top-down'] as const
      };

      await expect(marketAnalyzer.analyzeMarketSize(invalidArgs))
        .rejects.toThrow(MarketSizingError);
    });

    it('should throw error for missing industry', async () => {
      const invalidArgs = {
        feature_idea: 'Valid feature idea with sufficient length',
        market_definition: {
          industry: '',
          geography: ['global'],
          customer_segments: ['enterprise']
        },
        sizing_methods: ['top-down'] as const
      };

      await expect(marketAnalyzer.analyzeMarketSize(invalidArgs))
        .rejects.toThrow(MarketSizingError);
    });

    it('should throw error for empty geography', async () => {
      const invalidArgs = {
        feature_idea: 'Valid feature idea with sufficient length',
        market_definition: {
          industry: 'technology',
          geography: [],
          customer_segments: ['enterprise']
        },
        sizing_methods: ['top-down'] as const
      };

      await expect(marketAnalyzer.analyzeMarketSize(invalidArgs))
        .rejects.toThrow(MarketSizingError);
    });

    it('should throw error for empty customer segments', async () => {
      const invalidArgs = {
        feature_idea: 'Valid feature idea with sufficient length',
        market_definition: {
          industry: 'technology',
          geography: ['global'],
          customer_segments: []
        },
        sizing_methods: ['top-down'] as const
      };

      await expect(marketAnalyzer.analyzeMarketSize(invalidArgs))
        .rejects.toThrow(MarketSizingError);
    });

    it('should throw error for unsupported methodology', async () => {
      const invalidArgs = {
        feature_idea: 'Valid feature idea with sufficient length',
        market_definition: {
          industry: 'technology',
          geography: ['global'],
          customer_segments: ['enterprise']
        },
        sizing_methods: ['unsupported-method' as any]
      };

      await expect(marketAnalyzer.analyzeMarketSize(invalidArgs))
        .rejects.toThrow(MarketSizingError);
    });

    it('should include helpful error suggestions', async () => {
      const invalidArgs = {
        feature_idea: '',
        market_definition: {
          industry: 'technology',
          geography: ['global'],
          customer_segments: ['enterprise']
        },
        sizing_methods: ['top-down'] as const
      };

      try {
        await marketAnalyzer.analyzeMarketSize(invalidArgs);
      } catch (error) {
        expect(error).toBeInstanceOf(MarketSizingError);
        const marketError = error as MarketSizingError;
        expect(marketError.suggestions).toHaveLength(2);
        expect(marketError.code).toBe('INVALID_MARKET_DEFINITION');
      }
    });
  });

  describe('Performance and Timing', () => {
    const validArgs: MarketSizingArgs = {
      feature_idea: 'Performance test feature for market sizing analysis',
      market_definition: {
        industry: 'technology',
        geography: ['global'],
        customer_segments: ['enterprise', 'mid-market']
      },
      sizing_methods: ['top-down', 'bottom-up', 'value-theory'] as const
    };

    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();
      await marketAnalyzer.analyzeMarketSize(validArgs);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle timeout configuration', async () => {
      const fastAnalyzer = new MarketAnalyzer({ maxCalculationTime: 1 }); // 1ms timeout
      
      // Should still complete but may log warning
      const result = await fastAnalyzer.analyzeMarketSize(validArgs);
      expect(result).toBeDefined();
    });
  });

  describe('Industry-Specific Calculations', () => {
    const industries = ['technology', 'healthcare', 'finance', 'retail', 'manufacturing'];

    industries.forEach(industry => {
      it(`should handle ${industry} industry calculations`, async () => {
        const args: MarketSizingArgs = {
          feature_idea: `${industry} specific solution for market analysis`,
          market_definition: {
            industry,
            geography: ['global'],
            customer_segments: ['enterprise']
          },
          sizing_methods: ['top-down'] as const
        };

        const result = await marketAnalyzer.analyzeMarketSize(args);
        
        expect(result.tam.value).toBeGreaterThan(0);
        expect(result.tam.growthRate).toBeGreaterThan(0);
        expect(result.tam.growthRate).toBeLessThan(1); // Should be reasonable growth rate
      });
    });

    it('should apply different growth rates by industry', async () => {
      const techArgs: MarketSizingArgs = {
        feature_idea: 'Technology solution',
        market_definition: {
          industry: 'technology',
          geography: ['global'],
          customer_segments: ['enterprise']
        },
        sizing_methods: ['top-down'] as const
      };

      const retailArgs: MarketSizingArgs = {
        feature_idea: 'Retail solution',
        market_definition: {
          industry: 'retail',
          geography: ['global'],
          customer_segments: ['enterprise']
        },
        sizing_methods: ['top-down'] as const
      };

      const techResult = await marketAnalyzer.analyzeMarketSize(techArgs);
      const retailResult = await marketAnalyzer.analyzeMarketSize(retailArgs);

      // Technology should typically have higher growth rate than retail
      expect(techResult.tam.growthRate).toBeGreaterThan(retailResult.tam.growthRate);
    });
  });

  describe('Geographic Scope Impact', () => {
    const baseArgs = {
      feature_idea: 'Geographic scope test feature',
      market_definition: {
        industry: 'technology',
        customer_segments: ['enterprise']
      },
      sizing_methods: ['top-down'] as const
    };

    it('should calculate larger TAM for global scope', async () => {
      const globalArgs = {
        ...baseArgs,
        market_definition: {
          ...baseArgs.market_definition,
          geography: ['global']
        }
      };

      const regionalArgs = {
        ...baseArgs,
        market_definition: {
          ...baseArgs.market_definition,
          geography: ['north america']
        }
      };

      const globalResult = await marketAnalyzer.analyzeMarketSize(globalArgs);
      const regionalResult = await marketAnalyzer.analyzeMarketSize(regionalArgs);

      expect(globalResult.tam.value).toBeGreaterThan(regionalResult.tam.value);
    });

    it('should handle multiple regions correctly', async () => {
      const multiRegionArgs = {
        ...baseArgs,
        market_definition: {
          ...baseArgs.market_definition,
          geography: ['north america', 'europe', 'asia pacific']
        }
      };

      const singleRegionArgs = {
        ...baseArgs,
        market_definition: {
          ...baseArgs.market_definition,
          geography: ['north america']
        }
      };

      const multiResult = await marketAnalyzer.analyzeMarketSize(multiRegionArgs);
      const singleResult = await marketAnalyzer.analyzeMarketSize(singleRegionArgs);

      expect(multiResult.tam.value).toBeGreaterThan(singleResult.tam.value);
    });
  });
});