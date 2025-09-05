/**
 * Test to validate the steering file extraction fix
 * This test ensures that the new extraction methods properly parse JSON data
 * and generate meaningful steering file content instead of generic templates.
 */

import { SteeringFileGenerator } from '../../components/steering-file-generator';
import { SteeringContext, DocumentType } from '../../models/steering';

describe('Steering File Extraction Fix', () => {
  let generator: SteeringFileGenerator;
  let mockContext: SteeringContext;

  beforeEach(() => {
    generator = new SteeringFileGenerator();
    mockContext = {
      featureName: 'ai-code-review-test',
      inclusionRule: 'manual',
      relatedFiles: []
    };
  });

  describe('Competitive Analysis Extraction', () => {
    const mockCompetitiveAnalysisJSON = JSON.stringify({
      competitiveMatrix: {
        competitors: [
          { name: "GitHub Copilot", marketShare: 35 },
          { name: "SonarQube", marketShare: 25 },
          { name: "Snyk", marketShare: 20 }
        ],
        differentiationOpportunities: [
          "Real-time AI-powered analysis",
          "Integrated security and quality scoring"
        ]
      },
      marketPositioning: {
        marketGaps: ["AI-powered technical debt analysis", "Unified security-quality platform"],
        recommendedPositioning: ["Premium AI-first solution", "Enterprise security focus"]
      },
      strategicRecommendations: [
        "Focus on GitHub integration as key differentiator",
        "Target enterprise customers with security compliance needs",
        "Build AI model specifically for code review workflows"
      ],
      swotAnalysis: [
        { competitor: "GitHub Copilot", strengths: ["Market leader", "Microsoft backing"] }
      ],
      confidenceLevel: "high",
      sourceAttribution: [
        { type: "gartner", title: "Developer Tools Market Analysis 2024" },
        { type: "mckinsey", title: "DevOps Transformation Report" }
      ],
      dataQuality: {
        overallConfidence: 0.85
      },
      lastUpdated: "2025-09-05T15:00:00Z"
    }, null, 2);

    test('should extract specific competitor names from JSON data', () => {
      const result = generator.generateFromCompetitiveAnalysis(mockCompetitiveAnalysisJSON, mockContext);
      
      expect(result.content).toContain('GitHub Copilot');
      expect(result.content).toContain('SonarQube');
      expect(result.content).toContain('Snyk');
      expect(result.content).toContain('3 competitors');
    });

    test('should extract market positioning insights', () => {
      const result = generator.generateFromCompetitiveAnalysis(mockCompetitiveAnalysisJSON, mockContext);
      
      expect(result.content).toContain('AI-powered technical debt analysis');
      expect(result.content).toContain('Unified security-quality platform');
      expect(result.content).toContain('Premium AI-first solution');
    });

    test('should extract strategic recommendations with details', () => {
      const result = generator.generateFromCompetitiveAnalysis(mockCompetitiveAnalysisJSON, mockContext);
      
      expect(result.content).toContain('GitHub integration as key differentiator');
      expect(result.content).toContain('enterprise customers with security compliance');
      expect(result.content).toContain('AI model specifically for code review');
    });

    test('should include source attribution', () => {
      const result = generator.generateFromCompetitiveAnalysis(mockCompetitiveAnalysisJSON, mockContext);
      
      expect(result.content).toContain('gartner');
      expect(result.content).toContain('mckinsey');
      expect(result.content).toContain('85% confidence');
    });

    test('should fallback gracefully for malformed JSON', () => {
      const malformedJSON = '{ invalid json }';
      const result = generator.generateFromCompetitiveAnalysis(malformedJSON, mockContext);
      
      // Should not throw error and should provide fallback content
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('Market Sizing Extraction', () => {
    const mockMarketSizingJSON = JSON.stringify({
      tam: { value: 50000000000, methodology: "top-down", growthRate: 0.15 },
      sam: { value: 5000000000, methodology: "bottom-up", growthRate: 0.12 },
      som: { value: 500000000, methodology: "value-theory", growthRate: 0.10 },
      methodology: [
        { type: "top-down", reliability: 0.8 },
        { type: "bottom-up", reliability: 0.9 },
        { type: "value-theory", reliability: 0.7 }
      ],
      scenarios: [
        { name: "conservative", type: "pessimistic" },
        { name: "balanced", type: "realistic" },
        { name: "aggressive", type: "optimistic" }
      ],
      assumptions: [
        "Developer tools market grows at 15% CAGR",
        "AI adoption in development accelerates",
        "Security compliance requirements increase"
      ],
      confidenceIntervals: [
        { confidenceLevel: 0.85 },
        { confidenceLevel: 0.90 },
        { confidenceLevel: 0.80 }
      ],
      sourceAttribution: [
        { type: "gartner", title: "DevOps Market Forecast 2024-2027" },
        { type: "mckinsey", title: "AI in Software Development" }
      ]
    }, null, 2);

    test('should extract specific TAM/SAM/SOM values', () => {
      const result = generator.generateFromMarketSizing(mockMarketSizingJSON, mockContext);
      
      expect(result.content).toContain('$50.0B');  // TAM
      expect(result.content).toContain('$5.0B');   // SAM (formatted as billions)
      expect(result.content).toContain('$500M');   // SOM
    });

    test('should extract market assumptions with details', () => {
      const result = generator.generateFromMarketSizing(mockMarketSizingJSON, mockContext);
      
      expect(result.content).toContain('15% CAGR');
      expect(result.content).toContain('AI adoption in development');
      expect(result.content).toContain('Security compliance requirements');
    });

    test('should extract methodologies used', () => {
      const result = generator.generateFromMarketSizing(mockMarketSizingJSON, mockContext);
      
      expect(result.content).toContain('top-down');
      expect(result.content).toContain('bottom-up');
      expect(result.content).toContain('value-theory');
    });

    test('should extract confidence levels', () => {
      const result = generator.generateFromMarketSizing(mockMarketSizingJSON, mockContext);
      
      expect(result.content).toContain('85%');  // Average confidence
    });

    test('should fallback gracefully for malformed JSON', () => {
      const malformedJSON = '{ invalid json }';
      const result = generator.generateFromMarketSizing(malformedJSON, mockContext);
      
      // Should not throw error and should provide fallback content
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('Content Quality Validation', () => {
    test('competitive analysis content should be significantly different from generic template', () => {
      const mockJSON = JSON.stringify({
        competitiveMatrix: { competitors: [{ name: "TestCompetitor" }] },
        strategicRecommendations: ["Specific recommendation"]
      });
      
      const result = generator.generateFromCompetitiveAnalysis(mockJSON, mockContext);
      
      // Should contain specific data, not just generic phrases
      expect(result.content).toContain('TestCompetitor');
      expect(result.content).toContain('Specific recommendation');
      
      // Should not be just the generic fallback
      expect(result.content).not.toBe('Competitive landscape insights derived from analysis.');
    });

    test('market sizing content should include actual financial figures', () => {
      const mockJSON = JSON.stringify({
        tam: { value: 1000000000 },  // $1B
        sam: { value: 100000000 }    // $100M
      });
      
      const result = generator.generateFromMarketSizing(mockJSON, mockContext);
      
      // Should contain actual dollar amounts
      expect(result.content).toMatch(/\$\d+[MB]/);  // Should contain dollar amounts with M or B
    });
  });
});