/**
 * Unit Tests for Market Analyzer Confidence Intervals and Scenario Analysis
 * 
 * Tests confidence interval calculations for market estimates and 
 * multiple scenario generation (conservative, balanced, aggressive).
 */

import { MarketAnalyzer } from '../../components/market-analyzer';
import {
  MarketSizingArgs,
  MarketScenario,
  ConfidenceInterval,
  MARKET_SIZING_DEFAULTS
} from '../../models/competitive';

describe('MarketAnalyzer - Confidence Intervals and Scenarios', () => {
  let marketAnalyzer: MarketAnalyzer;

  beforeEach(() => {
    marketAnalyzer = new MarketAnalyzer();
  });

  describe('Confidence Interval Calculations', () => {
    const validArgs: MarketSizingArgs = {
      feature_idea: 'Advanced analytics platform for enterprise data processing',
      market_definition: {
        industry: 'technology',
        geography: ['north america', 'europe'],
        customer_segments: ['enterprise', 'mid-market']
      },
      sizing_methods: ['top-down', 'bottom-up'] as const
    };

    it('should calculate confidence intervals with proper statistical bounds', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      expect(result.confidenceIntervals).toHaveLength(3);
      
      result.confidenceIntervals.forEach(interval => {
        // Lower bound should be positive and less than upper bound
        expect(interval.lowerBound).toBeGreaterThan(0);
        expect(interval.upperBound).toBeGreaterThan(interval.lowerBound);
        
        // Confidence level should be between 0 and 1
        expect(interval.confidenceLevel).toBeGreaterThan(0);
        expect(interval.confidenceLevel).toBeLessThanOrEqual(1);
        
        // Should have methodology reference
        expect(interval.methodology).toBeDefined();
        expect(interval.methodology.length).toBeGreaterThan(0);
      });
    });

    it('should have TAM confidence interval wider than SAM and SOM', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      const tamInterval = result.confidenceIntervals.find(ci => ci.marketType === 'tam')!;
      const samInterval = result.confidenceIntervals.find(ci => ci.marketType === 'sam')!;
      const somInterval = result.confidenceIntervals.find(ci => ci.marketType === 'som')!;

      // Calculate interval widths
      const tamWidth = tamInterval.upperBound - tamInterval.lowerBound;
      const samWidth = samInterval.upperBound - samInterval.lowerBound;
      const somWidth = somInterval.upperBound - somInterval.lowerBound;

      // TAM should have the widest confidence interval (most uncertainty)
      expect(tamWidth).toBeGreaterThanOrEqual(samWidth);
      
      // SOM should have the widest relative interval due to highest uncertainty
      const tamRelativeWidth = tamWidth / result.tam.value;
      const somRelativeWidth = somWidth / result.som.value;
      expect(somRelativeWidth).toBeGreaterThan(tamRelativeWidth);
    });

    it('should contain actual market values within confidence intervals', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      const tamInterval = result.confidenceIntervals.find(ci => ci.marketType === 'tam')!;
      const samInterval = result.confidenceIntervals.find(ci => ci.marketType === 'sam')!;
      const somInterval = result.confidenceIntervals.find(ci => ci.marketType === 'som')!;

      // Actual values should fall within confidence intervals
      expect(result.tam.value).toBeGreaterThanOrEqual(tamInterval.lowerBound);
      expect(result.tam.value).toBeLessThanOrEqual(tamInterval.upperBound);
      
      expect(result.sam.value).toBeGreaterThanOrEqual(samInterval.lowerBound);
      expect(result.sam.value).toBeLessThanOrEqual(samInterval.upperBound);
      
      expect(result.som.value).toBeGreaterThanOrEqual(somInterval.lowerBound);
      expect(result.som.value).toBeLessThanOrEqual(somInterval.upperBound);
    });

    it('should adjust confidence levels based on methodology reliability', async () => {
      const topDownArgs = {
        ...validArgs,
        sizing_methods: ['top-down'] as const
      };

      const bottomUpArgs = {
        ...validArgs,
        sizing_methods: ['bottom-up'] as const
      };

      const topDownResult = await marketAnalyzer.analyzeMarketSize(topDownArgs);
      const bottomUpResult = await marketAnalyzer.analyzeMarketSize(bottomUpArgs);

      const topDownTamInterval = topDownResult.confidenceIntervals.find(ci => ci.marketType === 'tam')!;
      const bottomUpTamInterval = bottomUpResult.confidenceIntervals.find(ci => ci.marketType === 'tam')!;

      // Bottom-up methodology should have higher confidence (based on implementation)
      expect(bottomUpTamInterval.confidenceLevel).toBeGreaterThanOrEqual(topDownTamInterval.confidenceLevel);
    });

    it('should provide meaningful confidence intervals for different industries', async () => {
      const industries = ['technology', 'healthcare', 'finance', 'retail'];
      
      for (const industry of industries) {
        const industryArgs = {
          ...validArgs,
          market_definition: {
            ...validArgs.market_definition,
            industry
          }
        };

        const result = await marketAnalyzer.analyzeMarketSize(industryArgs);
        
        result.confidenceIntervals.forEach(interval => {
          // Should have reasonable confidence levels (not too low)
          expect(interval.confidenceLevel).toBeGreaterThan(0.4);
          
          // Interval should be meaningful (not too narrow or too wide)
          const relativeWidth = (interval.upperBound - interval.lowerBound) / 
                               ((interval.upperBound + interval.lowerBound) / 2);
          expect(relativeWidth).toBeGreaterThan(0.2); // At least 20% relative width
          expect(relativeWidth).toBeLessThan(3.0);    // Not more than 300% relative width
        });
      }
    });
  });

  describe('Scenario Analysis Generation', () => {
    const validArgs: MarketSizingArgs = {
      feature_idea: 'Cloud-based supply chain optimization platform',
      market_definition: {
        industry: 'manufacturing',
        geography: ['global'],
        customer_segments: ['enterprise']
      },
      sizing_methods: ['bottom-up', 'value-theory'] as const
    };

    it('should generate three distinct scenarios with proper characteristics', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      expect(result.scenarios).toHaveLength(3);

      const conservative = result.scenarios.find(s => s.name === 'conservative')!;
      const balanced = result.scenarios.find(s => s.name === 'balanced')!;
      const aggressive = result.scenarios.find(s => s.name === 'aggressive')!;

      // Conservative should have lowest values
      expect(conservative.tam).toBeLessThan(balanced.tam);
      expect(conservative.sam).toBeLessThan(balanced.sam);
      expect(conservative.som).toBeLessThan(balanced.som);

      // Aggressive should have highest values
      expect(aggressive.tam).toBeGreaterThan(balanced.tam);
      expect(aggressive.sam).toBeGreaterThan(balanced.sam);
      expect(aggressive.som).toBeGreaterThan(balanced.som);

      // Balanced should match base case values
      expect(balanced.tam).toBe(result.tam.value);
      expect(balanced.sam).toBe(result.sam.value);
      expect(balanced.som).toBe(result.som.value);
    });

    it('should assign appropriate probabilities to scenarios', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      const conservative = result.scenarios.find(s => s.name === 'conservative')!;
      const balanced = result.scenarios.find(s => s.name === 'balanced')!;
      const aggressive = result.scenarios.find(s => s.name === 'aggressive')!;

      // Probabilities should sum to 1.0
      const totalProbability = conservative.probability + balanced.probability + aggressive.probability;
      expect(totalProbability).toBeCloseTo(1.0, 1);

      // Balanced should have highest probability
      expect(balanced.probability).toBeGreaterThan(conservative.probability);
      expect(balanced.probability).toBeGreaterThan(aggressive.probability);

      // All probabilities should be positive
      expect(conservative.probability).toBeGreaterThan(0);
      expect(balanced.probability).toBeGreaterThan(0);
      expect(aggressive.probability).toBeGreaterThan(0);
    });

    it('should include meaningful assumptions and risk factors for each scenario', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      result.scenarios.forEach(scenario => {
        // Each scenario should have key assumptions
        expect(scenario.keyAssumptions).toHaveLength(3);
        scenario.keyAssumptions.forEach(assumption => {
          expect(assumption).toBeDefined();
          expect(assumption.length).toBeGreaterThan(10);
        });

        // Each scenario should have risk factors
        expect(scenario.riskFactors).toHaveLength(3);
        scenario.riskFactors.forEach(risk => {
          expect(risk).toBeDefined();
          expect(risk.length).toBeGreaterThan(10);
        });

        // Should have meaningful description
        expect(scenario.description).toBeDefined();
        expect(scenario.description.length).toBeGreaterThan(20);
      });
    });

    it('should reflect scenario characteristics in assumptions', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      const conservative = result.scenarios.find(s => s.name === 'conservative')!;
      const aggressive = result.scenarios.find(s => s.name === 'aggressive')!;

      // Conservative scenario should mention slower/cautious factors
      const conservativeText = conservative.keyAssumptions.join(' ').toLowerCase();
      expect(conservativeText).toMatch(/(slower|conservative|cautious|reduced|limited)/);

      // Aggressive scenario should mention faster/optimistic factors
      const aggressiveText = aggressive.keyAssumptions.join(' ').toLowerCase();
      expect(aggressiveText).toMatch(/(rapid|aggressive|optimistic|accelerated|strong)/);
    });

    it('should maintain TAM > SAM > SOM relationship in all scenarios', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      result.scenarios.forEach(scenario => {
        expect(scenario.tam).toBeGreaterThan(scenario.sam);
        expect(scenario.sam).toBeGreaterThan(scenario.som);
        expect(scenario.som).toBeGreaterThan(0);
      });
    });

    it('should scale scenarios proportionally across market types', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      const conservative = result.scenarios.find(s => s.name === 'conservative')!;
      const balanced = result.scenarios.find(s => s.name === 'balanced')!;
      const aggressive = result.scenarios.find(s => s.name === 'aggressive')!;

      // Calculate scaling factors
      const conservativeTamScale = conservative.tam / balanced.tam;
      const conservativeSamScale = conservative.sam / balanced.sam;
      const conservativeSomScale = conservative.som / balanced.som;

      const aggressiveTamScale = aggressive.tam / balanced.tam;
      const aggressiveSamScale = aggressive.sam / balanced.sam;
      const aggressiveSomScale = aggressive.som / balanced.som;

      // Conservative scaling should be consistent (within 10%)
      expect(Math.abs(conservativeTamScale - conservativeSamScale)).toBeLessThan(0.1);
      expect(Math.abs(conservativeSamScale - conservativeSomScale)).toBeLessThan(0.2); // SOM can vary more

      // Aggressive scaling should be consistent (within 15%)
      expect(Math.abs(aggressiveTamScale - aggressiveSamScale)).toBeLessThan(0.15);
      expect(Math.abs(aggressiveSamScale - aggressiveSomScale)).toBeLessThan(0.5); // SOM can vary more
    });
  });

  describe('Scenario Analysis Configuration', () => {
    const validArgs: MarketSizingArgs = {
      feature_idea: 'AI-powered customer service automation',
      market_definition: {
        industry: 'technology',
        geography: ['north america'],
        customer_segments: ['enterprise']
      },
      sizing_methods: ['top-down'] as const
    };

    it('should disable scenario analysis when configured', async () => {
      const analyzer = new MarketAnalyzer({ enableScenarioAnalysis: false });
      const result = await analyzer.analyzeMarketSize(validArgs);

      expect(result.scenarios).toHaveLength(0);
    });

    it('should enable scenario analysis by default', async () => {
      const analyzer = new MarketAnalyzer();
      const result = await analyzer.analyzeMarketSize(validArgs);

      expect(result.scenarios).toHaveLength(3);
    });

    it('should maintain confidence intervals regardless of scenario configuration', async () => {
      const enabledAnalyzer = new MarketAnalyzer({ enableScenarioAnalysis: true });
      const disabledAnalyzer = new MarketAnalyzer({ enableScenarioAnalysis: false });

      const enabledResult = await enabledAnalyzer.analyzeMarketSize(validArgs);
      const disabledResult = await disabledAnalyzer.analyzeMarketSize(validArgs);

      // Both should have confidence intervals
      expect(enabledResult.confidenceIntervals).toHaveLength(3);
      expect(disabledResult.confidenceIntervals).toHaveLength(3);

      // Confidence intervals should be similar (within 5%)
      for (let i = 0; i < 3; i++) {
        const enabledInterval = enabledResult.confidenceIntervals[i];
        const disabledInterval = disabledResult.confidenceIntervals[i];
        
        expect(enabledInterval.marketType).toBe(disabledInterval.marketType);
        expect(Math.abs(enabledInterval.confidenceLevel - disabledInterval.confidenceLevel)).toBeLessThan(0.05);
      }
    });
  });

  describe('Advanced Confidence Calculations', () => {
    const complexArgs: MarketSizingArgs = {
      feature_idea: 'Multi-modal transportation optimization system with AI and IoT integration',
      market_definition: {
        industry: 'technology',
        geography: ['north america', 'europe', 'asia pacific'],
        customer_segments: ['enterprise', 'government', 'mid-market']
      },
      sizing_methods: ['top-down', 'bottom-up', 'value-theory'] as const
    };

    it('should adjust confidence based on market complexity', async () => {
      const simpleArgs: MarketSizingArgs = {
        feature_idea: 'Simple task management app',
        market_definition: {
          industry: 'technology',
          geography: ['north america'],
          customer_segments: ['enterprise']
        },
        sizing_methods: ['bottom-up'] as const
      };

      const complexResult = await marketAnalyzer.analyzeMarketSize(complexArgs);
      const simpleResult = await marketAnalyzer.analyzeMarketSize(simpleArgs);

      const complexTamInterval = complexResult.confidenceIntervals.find(ci => ci.marketType === 'tam')!;
      const simpleTamInterval = simpleResult.confidenceIntervals.find(ci => ci.marketType === 'tam')!;

      // Complex market should have wider confidence intervals (lower confidence or wider bounds)
      const complexRelativeWidth = (complexTamInterval.upperBound - complexTamInterval.lowerBound) / 
                                  complexResult.tam.value;
      const simpleRelativeWidth = (simpleTamInterval.upperBound - simpleTamInterval.lowerBound) / 
                                 simpleResult.tam.value;

      expect(complexRelativeWidth).toBeGreaterThanOrEqual(simpleRelativeWidth);
    });

    it('should provide confidence intervals that reflect methodology uncertainty', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(complexArgs);

      // SOM should have lowest confidence due to highest uncertainty
      const tamInterval = result.confidenceIntervals.find(ci => ci.marketType === 'tam')!;
      const samInterval = result.confidenceIntervals.find(ci => ci.marketType === 'sam')!;
      const somInterval = result.confidenceIntervals.find(ci => ci.marketType === 'som')!;

      expect(tamInterval.confidenceLevel).toBeGreaterThanOrEqual(samInterval.confidenceLevel);
      expect(samInterval.confidenceLevel).toBeGreaterThanOrEqual(somInterval.confidenceLevel);
    });

    it('should handle edge cases in confidence calculations', async () => {
      const edgeCaseArgs: MarketSizingArgs = {
        feature_idea: 'Highly specialized niche B2B software for very specific industry vertical',
        market_definition: {
          industry: 'manufacturing',
          geography: ['middle east'],
          customer_segments: ['enterprise']
        },
        sizing_methods: ['value-theory'] as const
      };

      const result = await marketAnalyzer.analyzeMarketSize(edgeCaseArgs);

      // Should still provide valid confidence intervals even for edge cases
      expect(result.confidenceIntervals).toHaveLength(3);
      
      result.confidenceIntervals.forEach(interval => {
        expect(interval.lowerBound).toBeGreaterThan(0);
        expect(interval.upperBound).toBeGreaterThan(interval.lowerBound);
        expect(interval.confidenceLevel).toBeGreaterThan(0.3); // Should have some confidence
        expect(interval.confidenceLevel).toBeLessThanOrEqual(1.0);
      });
    });
  });

  describe('Scenario Risk Assessment', () => {
    const riskArgs: MarketSizingArgs = {
      feature_idea: 'Blockchain-based supply chain transparency platform',
      market_definition: {
        industry: 'technology',
        geography: ['global'],
        customer_segments: ['enterprise', 'mid-market']
      },
      sizing_methods: ['top-down', 'bottom-up'] as const
    };

    it('should identify different risk factors for each scenario', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(riskArgs);

      const conservative = result.scenarios.find(s => s.name === 'conservative')!;
      const balanced = result.scenarios.find(s => s.name === 'balanced')!;
      const aggressive = result.scenarios.find(s => s.name === 'aggressive')!;

      // Risk factors should be different across scenarios
      const conservativeRisks = new Set(conservative.riskFactors);
      const balancedRisks = new Set(balanced.riskFactors);
      const aggressiveRisks = new Set(aggressive.riskFactors);

      // Should have some unique risks per scenario
      const conservativeUnique = [...conservativeRisks].filter(r => !balancedRisks.has(r));
      const aggressiveUnique = [...aggressiveRisks].filter(r => !balancedRisks.has(r));

      expect(conservativeUnique.length).toBeGreaterThan(0);
      expect(aggressiveUnique.length).toBeGreaterThan(0);
    });

    it('should reflect appropriate risk levels in scenario probabilities', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(riskArgs);

      const conservative = result.scenarios.find(s => s.name === 'conservative')!;
      const aggressive = result.scenarios.find(s => s.name === 'aggressive')!;

      // Conservative scenario should have reasonable probability (not too low)
      expect(conservative.probability).toBeGreaterThan(0.15);

      // Aggressive scenario should have lower probability due to higher risk
      expect(aggressive.probability).toBeLessThan(conservative.probability);
    });
  });
});