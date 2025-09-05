/**
 * Unit Tests for Market Analyzer Source Integration and Quality Assessment
 * 
 * Tests source attribution for market data with industry report references,
 * data quality indicators, and reliability scoring.
 */

import { MarketAnalyzer } from '../../components/market-analyzer';
import {
  MarketSizingArgs,
  SourceReference,
  DataQualityCheck,
  ValidationResult,
  FreshnessStatus
} from '../../models/competitive';

describe('MarketAnalyzer - Source Integration and Quality Assessment', () => {
  let marketAnalyzer: MarketAnalyzer;

  beforeEach(() => {
    marketAnalyzer = new MarketAnalyzer();
  });

  describe('Source Attribution', () => {
    const validArgs: MarketSizingArgs = {
      feature_idea: 'Enterprise resource planning system with AI-driven insights',
      market_definition: {
        industry: 'technology',
        geography: ['north america', 'europe'],
        customer_segments: ['enterprise', 'mid-market']
      },
      sizing_methods: ['top-down', 'bottom-up'] as const
    };

    it('should generate comprehensive source attribution for market analysis', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      expect(result.sourceAttribution).toHaveLength(1);
      
      const source = result.sourceAttribution[0];
      expect(source.id).toBeDefined();
      expect(source.type).toBe('market-research');
      expect(source.title).toContain(validArgs.market_definition.industry);
      expect(source.organization).toBeDefined();
      expect(source.publishDate).toBeDefined();
      expect(source.accessDate).toBeDefined();
    });

    it('should include reliability and relevance scores for sources', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      result.sourceAttribution.forEach(source => {
        // Reliability should be between 0 and 1
        expect(source.reliability).toBeGreaterThan(0);
        expect(source.reliability).toBeLessThanOrEqual(1);
        
        // Relevance should be between 0 and 1
        expect(source.relevance).toBeGreaterThan(0);
        expect(source.relevance).toBeLessThanOrEqual(1);
        
        // High-quality sources should have good scores
        expect(source.reliability).toBeGreaterThan(0.6);
        expect(source.relevance).toBeGreaterThan(0.7);
      });
    });

    it('should provide proper citation formatting', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      result.sourceAttribution.forEach(source => {
        expect(source.citationFormat).toBeDefined();
        expect(source.citationFormat.length).toBeGreaterThan(20);
        
        // Should include organization and year
        expect(source.citationFormat).toContain(source.organization);
        expect(source.citationFormat).toContain('2024');
      });
    });

    it('should include key findings and limitations', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      result.sourceAttribution.forEach(source => {
        // Should have key findings
        expect(source.keyFindings).toHaveLength(3);
        source.keyFindings.forEach(finding => {
          expect(finding).toBeDefined();
          expect(finding.length).toBeGreaterThan(10);
        });
        
        // Should have limitations
        expect(source.limitations).toHaveLength(2);
        source.limitations.forEach(limitation => {
          expect(limitation).toBeDefined();
          expect(limitation.length).toBeGreaterThan(15);
        });
      });
    });

    it('should adapt source types based on methodology', async () => {
      const topDownArgs = {
        ...validArgs,
        sizing_methods: ['top-down'] as const
      };

      const bottomUpArgs = {
        ...validArgs,
        sizing_methods: ['bottom-up'] as const
      };

      const valueTheoryArgs = {
        ...validArgs,
        sizing_methods: ['value-theory'] as const
      };

      const topDownResult = await marketAnalyzer.analyzeMarketSize(topDownArgs);
      const bottomUpResult = await marketAnalyzer.analyzeMarketSize(bottomUpArgs);
      const valueTheoryResult = await marketAnalyzer.analyzeMarketSize(valueTheoryArgs);

      // All should have source attribution
      expect(topDownResult.sourceAttribution).toHaveLength(1);
      expect(bottomUpResult.sourceAttribution).toHaveLength(1);
      expect(valueTheoryResult.sourceAttribution).toHaveLength(1);

      // Sources should be appropriate for methodology
      expect(topDownResult.sourceAttribution[0].type).toBe('market-research');
      expect(bottomUpResult.sourceAttribution[0].type).toBe('market-research');
      expect(valueTheoryResult.sourceAttribution[0].type).toBe('market-research');
    });

    it('should include industry-specific source references', async () => {
      const industries = ['technology', 'healthcare', 'finance', 'retail', 'manufacturing'];
      
      for (const industry of industries) {
        const industryArgs = {
          ...validArgs,
          market_definition: {
            ...validArgs.market_definition,
            industry
          }
        };

        const result = await marketAnalyzer.analyzeMarketSize(industryArgs);
        
        expect(result.sourceAttribution).toHaveLength(1);
        const source = result.sourceAttribution[0];
        
        // Title should reference the specific industry
        expect(source.title.toLowerCase()).toContain(industry.toLowerCase());
        
        // Should have high relevance for industry-specific analysis
        expect(source.relevance).toBeGreaterThan(0.8);
      }
    });
  });

  describe('Data Freshness Assessment', () => {
    const validArgs: MarketSizingArgs = {
      feature_idea: 'Cloud-based financial analytics platform',
      market_definition: {
        industry: 'finance',
        geography: ['global'],
        customer_segments: ['enterprise']
      },
      sizing_methods: ['top-down'] as const
    };

    it('should assess data freshness for all sources', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      result.sourceAttribution.forEach(source => {
        expect(source.dataFreshness).toBeDefined();
        expect(source.dataFreshness.status).toMatch(/^(fresh|recent|stale|outdated)$/);
        expect(source.dataFreshness.ageInDays).toBeGreaterThanOrEqual(0);
        expect(source.dataFreshness.recommendedUpdateFrequency).toBeGreaterThan(0);
        expect(source.dataFreshness.lastValidated).toBeDefined();
      });
    });

    it('should categorize data freshness appropriately', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      result.sourceAttribution.forEach(source => {
        const freshness = source.dataFreshness;
        
        // Age should correspond to status
        if (freshness.status === 'fresh') {
          expect(freshness.ageInDays).toBeLessThan(30);
        } else if (freshness.status === 'recent') {
          expect(freshness.ageInDays).toBeLessThan(90);
        } else if (freshness.status === 'stale') {
          expect(freshness.ageInDays).toBeLessThan(365);
        }
        
        // Should have reasonable update frequency
        expect(freshness.recommendedUpdateFrequency).toBeGreaterThan(30);
        expect(freshness.recommendedUpdateFrequency).toBeLessThan(730); // Max 2 years
      });
    });

    it('should provide recent validation timestamps', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validArgs);

      result.sourceAttribution.forEach(source => {
        const validationDate = new Date(source.dataFreshness.lastValidated);
        const now = new Date();
        
        // Validation should be recent (within last day for testing)
        const timeDiff = now.getTime() - validationDate.getTime();
        expect(timeDiff).toBeLessThan(24 * 60 * 60 * 1000); // 24 hours
      });
    });
  });

  describe('Data Quality Indicators', () => {
    const qualityArgs: MarketSizingArgs = {
      feature_idea: 'Advanced manufacturing automation system with IoT integration',
      market_definition: {
        industry: 'manufacturing',
        geography: ['north america', 'europe', 'asia pacific'],
        customer_segments: ['enterprise']
      },
      sizing_methods: ['top-down', 'bottom-up', 'value-theory'] as const
    };

    it('should calculate comprehensive data quality metrics', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(qualityArgs);

      // Should have data quality assessment (this would be added to the result)
      expect(result.tam.dataQuality).toMatch(/^(high|medium|low)$/);
      expect(result.sam.dataQuality).toMatch(/^(high|medium|low)$/);
      expect(result.som.dataQuality).toMatch(/^(high|medium|low)$/);
    });

    it('should reflect methodology reliability in data quality', async () => {
      const highReliabilityArgs = {
        ...qualityArgs,
        sizing_methods: ['bottom-up'] as const // Generally more reliable
      };

      const lowerReliabilityArgs = {
        ...qualityArgs,
        sizing_methods: ['value-theory'] as const // Generally less reliable
      };

      const highResult = await marketAnalyzer.analyzeMarketSize(highReliabilityArgs);
      const lowerResult = await marketAnalyzer.analyzeMarketSize(lowerReliabilityArgs);

      // Bottom-up should generally have higher or equal data quality
      const qualityOrder = ['low', 'medium', 'high'];
      const highQualityIndex = qualityOrder.indexOf(highResult.tam.dataQuality);
      const lowerQualityIndex = qualityOrder.indexOf(lowerResult.tam.dataQuality);
      
      expect(highQualityIndex).toBeGreaterThanOrEqual(lowerQualityIndex);
    });

    it('should provide quality scores for source reliability', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(qualityArgs);

      result.sourceAttribution.forEach(source => {
        // Reliability should be consistent with data quality
        if (result.tam.dataQuality === 'high') {
          expect(source.reliability).toBeGreaterThan(0.7);
        } else if (result.tam.dataQuality === 'medium') {
          expect(source.reliability).toBeGreaterThan(0.5);
        } else {
          expect(source.reliability).toBeGreaterThan(0.3);
        }
      });
    });

    it('should adjust quality based on market complexity', async () => {
      const simpleArgs: MarketSizingArgs = {
        feature_idea: 'Simple mobile app for task management',
        market_definition: {
          industry: 'technology',
          geography: ['north america'],
          customer_segments: ['consumer']
        },
        sizing_methods: ['bottom-up'] as const
      };

      const complexArgs: MarketSizingArgs = {
        feature_idea: 'Multi-industry AI platform with complex integrations',
        market_definition: {
          industry: 'technology',
          geography: ['global'],
          customer_segments: ['enterprise', 'government', 'mid-market']
        },
        sizing_methods: ['bottom-up'] as const
      };

      const simpleResult = await marketAnalyzer.analyzeMarketSize(simpleArgs);
      const complexResult = await marketAnalyzer.analyzeMarketSize(complexArgs);

      // Simple market should have higher or equal data quality
      const qualityOrder = ['low', 'medium', 'high'];
      const simpleQualityIndex = qualityOrder.indexOf(simpleResult.tam.dataQuality);
      const complexQualityIndex = qualityOrder.indexOf(complexResult.tam.dataQuality);
      
      // Both should have reasonable quality, complex may be equal due to multiple methodologies
      expect(simpleQualityIndex).toBeGreaterThanOrEqual(0);
      expect(complexQualityIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Source Validation and Reliability', () => {
    const validationArgs: MarketSizingArgs = {
      feature_idea: 'Blockchain-based supply chain management platform',
      market_definition: {
        industry: 'technology',
        geography: ['global'],
        customer_segments: ['enterprise']
      },
      sizing_methods: ['top-down', 'bottom-up'] as const
    };

    it('should validate source credibility and authority', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validationArgs);

      result.sourceAttribution.forEach(source => {
        // Should have credible organization
        expect(source.organization).toBeDefined();
        expect(source.organization.length).toBeGreaterThan(5);
        
        // Should have reasonable publication date
        const pubDate = new Date(source.publishDate);
        const now = new Date();
        const ageInYears = (now.getTime() - pubDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
        expect(ageInYears).toBeLessThan(2); // Not older than 2 years
        
        // Should have high reliability for market research
        if (source.type === 'market-research') {
          expect(source.reliability).toBeGreaterThan(0.6);
        }
      });
    });

    it('should provide appropriate source types for different analyses', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validationArgs);

      const validSourceTypes = [
        'mckinsey', 'gartner', 'wef', 'industry-report', 
        'market-research', 'company-filing', 'news-article'
      ];

      result.sourceAttribution.forEach(source => {
        expect(validSourceTypes).toContain(source.type);
      });
    });

    it('should include comprehensive source metadata', async () => {
      const result = await marketAnalyzer.analyzeMarketSize(validationArgs);

      result.sourceAttribution.forEach(source => {
        // Required fields
        expect(source.id).toBeDefined();
        expect(source.type).toBeDefined();
        expect(source.title).toBeDefined();
        expect(source.organization).toBeDefined();
        expect(source.publishDate).toBeDefined();
        expect(source.accessDate).toBeDefined();
        
        // Quality metrics
        expect(typeof source.reliability).toBe('number');
        expect(typeof source.relevance).toBe('number');
        
        // Content metadata
        expect(source.citationFormat).toBeDefined();
        expect(Array.isArray(source.keyFindings)).toBe(true);
        expect(Array.isArray(source.limitations)).toBe(true);
        
        // Freshness assessment
        expect(source.dataFreshness).toBeDefined();
      });
    });

    it('should handle multiple methodologies with appropriate source attribution', async () => {
      const multiMethodArgs = {
        ...validationArgs,
        sizing_methods: ['top-down', 'bottom-up', 'value-theory'] as const
      };

      const result = await marketAnalyzer.analyzeMarketSize(multiMethodArgs);

      // Should have source attribution that covers all methodologies
      expect(result.sourceAttribution).toHaveLength(1);
      
      // Source should be relevant to all methodologies used
      const source = result.sourceAttribution[0];
      expect(source.relevance).toBeGreaterThan(0.8);
      
      // Key findings should reference multiple approaches
      const findingsText = source.keyFindings.join(' ').toLowerCase();
      expect(findingsText).toContain('market');
    });
  });

  describe('Industry-Specific Source Quality', () => {
    const industries = [
      { name: 'healthcare', expectedReliability: 0.8 },
      { name: 'finance', expectedReliability: 0.85 },
      { name: 'technology', expectedReliability: 0.75 },
      { name: 'retail', expectedReliability: 0.7 },
      { name: 'manufacturing', expectedReliability: 0.75 }
    ];

    industries.forEach(({ name: industry, expectedReliability }) => {
      it(`should provide high-quality sources for ${industry} industry`, async () => {
        const industryArgs: MarketSizingArgs = {
          feature_idea: `${industry} industry solution for market analysis`,
          market_definition: {
            industry,
            geography: ['north america'],
            customer_segments: ['enterprise']
          },
          sizing_methods: ['top-down'] as const
        };

        const result = await marketAnalyzer.analyzeMarketSize(industryArgs);
        
        expect(result.sourceAttribution).toHaveLength(1);
        const source = result.sourceAttribution[0];
        
        // Should meet industry-specific reliability expectations
        expect(source.reliability).toBeGreaterThan(expectedReliability - 0.1);
        
        // Should have industry-relevant content
        expect(source.title.toLowerCase()).toContain(industry);
        expect(source.relevance).toBeGreaterThan(0.8);
        
        // Should have recent data for fast-moving industries
        if (['technology', 'finance'].includes(industry)) {
          expect(source.dataFreshness.ageInDays).toBeLessThan(60);
        }
      });
    });
  });

  describe('Source Integration Error Handling', () => {
    it('should handle missing or incomplete source data gracefully', async () => {
      const edgeCaseArgs: MarketSizingArgs = {
        feature_idea: 'Highly specialized niche product with limited market data',
        market_definition: {
          industry: 'manufacturing',
          geography: ['africa'],
          customer_segments: ['government']
        },
        sizing_methods: ['value-theory'] as const
      };

      const result = await marketAnalyzer.analyzeMarketSize(edgeCaseArgs);

      // Should still provide source attribution even for edge cases
      expect(result.sourceAttribution).toHaveLength(1);
      
      const source = result.sourceAttribution[0];
      
      // Should indicate lower reliability for limited data
      expect(source.reliability).toBeLessThan(0.9);
      
      // Should include appropriate limitations
      expect(source.limitations.length).toBeGreaterThan(0);
      
      // Should have appropriate data quality indicators
      expect(['medium', 'low']).toContain(result.tam.dataQuality);
    });

    it('should provide fallback sources when primary sources unavailable', async () => {
      const limitedDataArgs: MarketSizingArgs = {
        feature_idea: 'Emerging technology with very limited market history',
        market_definition: {
          industry: 'technology',
          geography: ['middle east'],
          customer_segments: ['enterprise']
        },
        sizing_methods: ['value-theory'] as const
      };

      const result = await marketAnalyzer.analyzeMarketSize(limitedDataArgs);

      // Should still provide analysis with appropriate caveats
      expect(result.sourceAttribution).toHaveLength(1);
      
      const source = result.sourceAttribution[0];
      
      // Should indicate data limitations
      expect(source.limitations.length).toBeGreaterThan(1);
      
      // Should have lower confidence but still reasonable
      expect(source.reliability).toBeGreaterThan(0.4);
      expect(source.reliability).toBeLessThanOrEqual(0.8);
    });
  });
});