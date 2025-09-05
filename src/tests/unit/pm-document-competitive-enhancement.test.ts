/**
 * Unit tests for PM Document Generator competitive enhancements
 * Tests the integration of competitive analysis and market sizing data
 * into management one-pagers and PR-FAQs
 */

import { PMDocumentGenerator } from '../../components/pm-document-generator';

describe('PMDocumentGenerator Competitive Enhancements', () => {
  let generator: PMDocumentGenerator;
  
  const mockCompetitiveAnalysis = {
    competitiveMatrix: {
      competitors: [
        {
          name: 'Competitor A',
          strengths: ['Strong brand', 'Large user base'],
          weaknesses: ['High pricing', 'Limited features'],
          marketShare: 25
        },
        {
          name: 'Competitor B', 
          strengths: ['Innovation', 'User experience'],
          weaknesses: ['Limited resources', 'Market validation'],
          marketShare: 15
        }
      ],
      differentiationOpportunities: [
        'Address industry-wide high pricing',
        'Focus on underserved market segments'
      ]
    },
    swotAnalysis: [
      {
        competitorName: 'Our Solution',
        strengths: [
          { description: 'Technology leadership and innovation', impact: 'high' },
          { description: 'Strong customer focus and support', impact: 'high' }
        ],
        weaknesses: [],
        opportunities: [],
        threats: []
      }
    ],
    marketPositioning: {
      marketGaps: [
        { description: 'Mid-market segment with balanced features and pricing' },
        { description: 'Premium features at competitive pricing' }
      ],
      recommendedPositioning: [
        'Target underserved mid-market segment',
        'Differentiate through superior user experience'
      ]
    },
    strategicRecommendations: [
      {
        type: 'differentiation',
        title: 'Feature-Based Differentiation',
        description: 'Develop unique capabilities that competitors lack'
      }
    ]
  };

  const mockMarketSizing = {
    tam: { value: 50000000000, currency: 'USD', methodology: 'top-down' },
    sam: { value: 5000000000, currency: 'USD', methodology: 'bottom-up' },
    som: { value: 500000000, currency: 'USD', methodology: 'value-theory' }
  };

  beforeEach(() => {
    generator = new PMDocumentGenerator();
  });

  describe('generateManagementOnePager with competitive insights', () => {
    const requirements = `
      # Requirements Document
      
      ## User Story
      As a product manager, I want to build an AI-powered workflow optimization tool to reduce costs and improve efficiency, so that I can deliver better value to customers while maintaining competitive advantage.
      
      ## Functional Requirements
      - Automated workflow analysis and optimization
      - Cost reduction through intelligent resource allocation
      - Competitive positioning and market analysis
      - Real-time performance monitoring and reporting
    `;
    const design = `
      # Design Document
      
      ## Architecture
      MCP-based architecture with modular components for scalability and integration.
      
      ## Components
      - Workflow analyzer for identifying optimization opportunities
      - Cost calculator for ROI analysis
      - Competitive intelligence module
      - Reporting and visualization dashboard
    `;

    test('should include competitive positioning when competitive analysis is provided', async () => {
      const result = await generator.generateManagementOnePager(
        requirements,
        design,
        undefined,
        undefined,
        mockCompetitiveAnalysis,
        mockMarketSizing
      );

      expect(result.competitivePositioning).toBeDefined();
      expect(result.competitivePositioning?.marketPosition).toContain('medium market opportunity');
      expect(result.competitivePositioning?.keyDifferentiators).toHaveLength(3);
      expect(result.competitivePositioning?.competitiveAdvantages).toContain('Technology leadership and innovation');
    });

    test('should not include competitive positioning when no competitive analysis provided', async () => {
      const result = await generator.generateManagementOnePager(requirements, design);

      expect(result.competitivePositioning).toBeUndefined();
    });

    test('should handle competitive analysis with missing data gracefully', async () => {
      const incompleteAnalysis = {
        competitiveMatrix: { competitors: [] },
        strategicRecommendations: []
      };

      const result = await generator.generateManagementOnePager(
        requirements,
        design,
        undefined,
        undefined,
        incompleteAnalysis
      );

      expect(result.competitivePositioning).toBeDefined();
      expect(result.competitivePositioning?.marketPosition).toContain('First-mover advantage');
      expect(result.competitivePositioning?.keyDifferentiators).toContain('Superior user experience and functionality');
    });
  });

  describe('generatePRFAQ with competitive differentiation', () => {
    const requirements = `
      # Requirements Document
      
      ## User Story
      As a product manager, I want to create a competitive analysis tool for product managers, so that I can make informed strategic decisions based on market intelligence.
      
      ## Functional Requirements
      - Comprehensive competitor analysis and SWOT assessment
      - Market positioning and gap analysis
      - Strategic recommendations and differentiation strategies
      - Integration with existing PM workflows
    `;
    const design = `
      # Design Document
      
      ## Architecture
      Comprehensive competitor analysis with SWOT and market positioning capabilities.
      
      ## Components
      - Competitor identification and ranking system
      - SWOT analysis engine
      - Market positioning mapper
      - Strategic recommendation generator
    `;

    test('should include competitive differentiation when competitive analysis is provided', async () => {
      const result = await generator.generatePRFAQ(
        requirements,
        design,
        '2025-12-01',
        mockCompetitiveAnalysis,
        mockMarketSizing
      );

      expect(result.competitiveDifferentiation).toBeDefined();
      expect(result.competitiveDifferentiation?.uniqueValueProposition).toContain('500M market opportunity');
      expect(result.competitiveDifferentiation?.competitorComparison).toHaveLength(2);
      expect(result.competitiveDifferentiation?.marketDifferentiators).toContain('Address industry-wide high pricing');
    });

    test('should enhance press release headline with competitive advantage', async () => {
      const result = await generator.generatePRFAQ(
        requirements,
        design,
        '2025-12-01',
        mockCompetitiveAnalysis
      );

      expect(result.pressRelease.headline).toContain('Leveraging Target underserved mid-market segment');
    });

    test('should enhance FAQ with competitive comparison', async () => {
      const result = await generator.generatePRFAQ(
        requirements,
        design,
        '2025-12-01',
        mockCompetitiveAnalysis
      );

      const competitiveFAQ = result.faq.find(item => 
        item.question.toLowerCase().includes('compare') && 
        item.question.toLowerCase().includes('alternatives')
      );

      expect(competitiveFAQ).toBeDefined();
      expect(competitiveFAQ?.answer).toContain('Target underserved mid-market segment');
      expect(competitiveFAQ?.answer).toContain('Competitor A');
      expect(competitiveFAQ?.answer).toContain('high pricing');
    });

    test('should not include competitive differentiation when no competitive analysis provided', async () => {
      const result = await generator.generatePRFAQ(requirements, design, '2025-12-01');

      expect(result.competitiveDifferentiation).toBeUndefined();
    });
  });

  describe('competitive positioning helper methods', () => {
    test('should extract market position correctly', async () => {
      const positioning = (generator as any).generateCompetitivePositioning(
        mockCompetitiveAnalysis,
        mockMarketSizing
      );

      expect(positioning.marketPosition).toContain('medium market opportunity');
      expect(positioning.marketPosition).toContain('2 key competitors');
    });

    test('should extract key differentiators from competitive matrix', async () => {
      const positioning = (generator as any).generateCompetitivePositioning(mockCompetitiveAnalysis);

      expect(positioning.keyDifferentiators).toContain('Address industry-wide high pricing');
      expect(positioning.keyDifferentiators).toContain('Feature-Based Differentiation');
    });

    test('should generate competitive advantages from SWOT analysis', async () => {
      const positioning = (generator as any).generateCompetitivePositioning(mockCompetitiveAnalysis);

      expect(positioning.competitiveAdvantages).toContain('Technology leadership and innovation');
    });

    test('should handle empty competitive analysis gracefully', async () => {
      const emptyAnalysis = {
        competitiveMatrix: { competitors: [], differentiationOpportunities: [] },
        swotAnalysis: [],
        marketPositioning: { marketGaps: [], recommendedPositioning: [] },
        strategicRecommendations: []
      };

      const positioning = (generator as any).generateCompetitivePositioning(emptyAnalysis);

      expect(positioning.marketPosition).toContain('First-mover advantage');
      expect(positioning.keyDifferentiators).toContain('Superior user experience and functionality');
      expect(positioning.competitiveAdvantages).toContain('Technology leadership and innovation');
    });
  });

  describe('competitive differentiation helper methods', () => {
    test('should generate unique value proposition with market sizing', async () => {
      const differentiation = (generator as any).generateCompetitiveDifferentiation(
        mockCompetitiveAnalysis,
        mockMarketSizing
      );

      expect(differentiation.uniqueValueProposition).toContain('500M market opportunity');
      expect(differentiation.uniqueValueProposition).toContain('address industry-wide high pricing');
    });

    test('should create competitor comparisons', async () => {
      const differentiation = (generator as any).generateCompetitiveDifferentiation(mockCompetitiveAnalysis);

      expect(differentiation.competitorComparison).toHaveLength(2);
      expect(differentiation.competitorComparison[0].competitorName).toBe('Competitor A');
      expect(differentiation.competitorComparison[0].theirWeakness).toBe('High pricing');
      expect(differentiation.competitorComparison[0].ourAdvantage).toContain('Competitive pricing');
    });

    test('should generate competitive comparison FAQ answer', async () => {
      const answer = (generator as any).generateCompetitiveComparisonAnswer(mockCompetitiveAnalysis);

      expect(answer).toContain('Target underserved mid-market segment');
      expect(answer).toContain('address industry-wide high pricing');
      expect(answer).toContain('Competitor A');
      expect(answer).toContain('high pricing');
    });

    test('should provide default answer when no competitive analysis available', async () => {
      const answer = (generator as any).generateCompetitiveComparisonAnswer();

      expect(answer).toContain('consulting-grade analysis');
      expect(answer).toContain('MCP protocol');
    });
  });

  describe('error handling and edge cases', () => {
    test('should handle null competitive analysis gracefully', async () => {
      const result = await generator.generateManagementOnePager(
        'test requirements',
        'test design',
        undefined,
        undefined,
        null
      );

      expect(result.competitivePositioning).toBeUndefined();
    });

    test('should handle competitive analysis with null values', async () => {
      const nullAnalysis = {
        competitiveMatrix: null,
        swotAnalysis: null,
        marketPositioning: null,
        strategicRecommendations: null
      };

      const positioning = (generator as any).generateCompetitivePositioning(nullAnalysis);

      expect(positioning).toBeDefined();
      expect(positioning.marketPosition).toContain('First-mover advantage');
    });

    test('should handle market sizing with zero values', async () => {
      const zeroMarketSizing = {
        som: { value: 0, currency: 'USD', methodology: 'test' }
      };

      const positioning = (generator as any).generateCompetitivePositioning(
        mockCompetitiveAnalysis,
        zeroMarketSizing
      );

      expect(positioning.marketPosition).toContain('Competitive market with opportunity');
    });
  });
});