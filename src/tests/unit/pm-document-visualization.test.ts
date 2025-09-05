/**
 * Unit tests for PM Document Generator visualization and export features
 * Tests Mermaid diagram generation and competitive data export functionality
 */

import { PMDocumentGenerator } from '../../components/pm-document-generator';

describe('PMDocumentGenerator Visualization and Export', () => {
  let generator: PMDocumentGenerator;
  
  const mockCompetitiveAnalysis = {
    competitiveMatrix: {
      competitors: [
        {
          name: 'Competitor A',
          marketShare: 25,
          strengths: ['Strong brand', 'Large user base'],
          weaknesses: ['High pricing', 'Limited features'],
          keyFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
          pricing: { startingPrice: 150, model: 'subscription' }
        },
        {
          name: 'Competitor B',
          marketShare: 15,
          strengths: ['Innovation', 'User experience'],
          weaknesses: ['Limited resources', 'Market validation'],
          keyFeatures: ['Feature A', 'Feature B'],
          pricing: { startingPrice: 75, model: 'freemium' }
        }
      ],
      rankings: [
        {
          competitorName: 'Competitor A',
          overallScore: 8.5,
          rank: 1,
          competitiveAdvantage: ['Market leadership', 'Brand recognition']
        },
        {
          competitorName: 'Competitor B',
          overallScore: 7.2,
          rank: 2,
          competitiveAdvantage: ['Innovation focus', 'User experience']
        }
      ],
      differentiationOpportunities: [
        'Address industry-wide high pricing',
        'Focus on underserved market segments'
      ]
    },
    marketPositioning: {
      positioningMap: {
        axes: ['Price', 'Features']
      },
      competitorPositions: [
        {
          competitorName: 'Competitor A',
          coordinates: { Price: 0.8, Features: 0.7 }
        }
      ],
      marketGaps: [
        { description: 'Mid-market segment with balanced features and pricing' },
        { description: 'Premium features at competitive pricing' }
      ],
      recommendedPositioning: [
        'Target underserved mid-market segment',
        'Differentiate through superior user experience'
      ]
    },
    swotAnalysis: [
      {
        competitorName: 'Our Solution',
        strengths: [
          { description: 'Technology leadership and innovation' },
          { description: 'Strong customer focus and support' }
        ],
        weaknesses: [
          { description: 'Limited market presence' }
        ],
        opportunities: [
          { description: 'Market expansion potential' },
          { description: 'Technology advancement opportunities' }
        ],
        threats: [
          { description: 'Increased competitive pressure' },
          { description: 'Regulatory changes' }
        ],
        strategicImplications: [
          'Focus on differentiation strategies',
          'Monitor competitive moves closely'
        ]
      }
    ],
    strategicRecommendations: [
      {
        type: 'differentiation',
        title: 'Feature-Based Differentiation',
        description: 'Develop unique capabilities that competitors lack'
      },
      {
        type: 'focus',
        title: 'Niche Market Focus',
        description: 'Target specific customer segments'
      }
    ]
  };

  beforeEach(() => {
    generator = new PMDocumentGenerator();
  });

  describe('generateCompetitiveVisualization', () => {
    test('should generate competitive matrix visualization', () => {
      const result = generator.generateCompetitiveVisualization(mockCompetitiveAnalysis, 'matrix');

      expect(result.visualizationType).toBe('matrix');
      expect(result.mermaidDiagram).toContain('graph TD');
      expect(result.mermaidDiagram).toContain('Competitive Matrix');
      expect(result.mermaidDiagram).toContain('Competitor A');
      expect(result.mermaidDiagram).toContain('Market Share: 25%');
      expect(result.exportData.format).toBe('json');
      expect(result.exportData.filename).toContain('competitive-matrix');
    });

    test('should generate positioning map visualization', () => {
      const result = generator.generateCompetitiveVisualization(mockCompetitiveAnalysis, 'positioning');

      expect(result.visualizationType).toBe('positioning');
      expect(result.mermaidDiagram).toContain('graph LR');
      expect(result.mermaidDiagram).toContain('Market Positioning Map');
      expect(result.mermaidDiagram).toContain('Price Axis');
      expect(result.mermaidDiagram).toContain('Features Axis');
      expect(result.exportData.format).toBe('json');
      expect(result.exportData.filename).toContain('market-positioning');
    });

    test('should generate SWOT analysis visualization', () => {
      const result = generator.generateCompetitiveVisualization(mockCompetitiveAnalysis, 'swot');

      expect(result.visualizationType).toBe('swot');
      expect(result.mermaidDiagram).toContain('graph TD');
      expect(result.mermaidDiagram).toContain('SWOT Analysis');
      expect(result.mermaidDiagram).toContain('Strengths');
      expect(result.mermaidDiagram).toContain('Weaknesses');
      expect(result.mermaidDiagram).toContain('Opportunities');
      expect(result.mermaidDiagram).toContain('Threats');
      expect(result.exportData.format).toBe('json');
      expect(result.exportData.filename).toContain('swot-analysis');
    });

    test('should default to matrix visualization when no type specified', () => {
      const result = generator.generateCompetitiveVisualization(mockCompetitiveAnalysis);

      expect(result.visualizationType).toBe('matrix');
      expect(result.mermaidDiagram).toContain('Competitive Matrix');
    });

    test('should handle empty competitive analysis gracefully', () => {
      const emptyAnalysis = {
        competitiveMatrix: { competitors: [] },
        marketPositioning: {},
        swotAnalysis: []
      };

      const result = generator.generateCompetitiveVisualization(emptyAnalysis, 'matrix');

      expect(result.mermaidDiagram).toContain('No Competitive Data Available');
      expect(result.mermaidDiagram).toContain('Conduct Market Research');
    });
  });

  describe('Mermaid diagram generation', () => {
    test('should generate valid competitive matrix diagram structure', () => {
      const result = generator.generateCompetitiveVisualization(mockCompetitiveAnalysis, 'matrix');
      const diagram = result.mermaidDiagram;

      expect(diagram).toContain('graph TD');
      expect(diagram).toContain('subgraph "Competitive Matrix"');
      expect(diagram).toContain('C1["Competitor A');
      expect(diagram).toContain('C2["Competitor B');
      expect(diagram).toContain('US["Our Solution');
      expect(diagram).toContain('Strengths:');
      expect(diagram).toContain('Weaknesses:');
    });

    test('should generate valid positioning map diagram structure', () => {
      const result = generator.generateCompetitiveVisualization(mockCompetitiveAnalysis, 'positioning');
      const diagram = result.mermaidDiagram;

      expect(diagram).toContain('graph LR');
      expect(diagram).toContain('subgraph "Market Positioning Map"');
      expect(diagram).toContain('Price Axis');
      expect(diagram).toContain('Features Axis');
      expect(diagram).toContain('Low Price');
      expect(diagram).toContain('High Price');
      expect(diagram).toContain('Basic Features');
      expect(diagram).toContain('Advanced Features');
    });

    test('should generate valid SWOT diagram structure', () => {
      const result = generator.generateCompetitiveVisualization(mockCompetitiveAnalysis, 'swot');
      const diagram = result.mermaidDiagram;

      expect(diagram).toContain('graph TD');
      expect(diagram).toContain('subgraph "SWOT Analysis"');
      expect(diagram).toContain('Internal Factors');
      expect(diagram).toContain('External Factors');
      expect(diagram).toContain('S[Strengths]');
      expect(diagram).toContain('W[Weaknesses]');
      expect(diagram).toContain('O[Opportunities]');
      expect(diagram).toContain('T[Threats]');
    });

    test('should limit competitors in diagrams to prevent overcrowding', () => {
      const largeAnalysis = {
        ...mockCompetitiveAnalysis,
        competitiveMatrix: {
          ...mockCompetitiveAnalysis.competitiveMatrix,
          competitors: Array.from({ length: 10 }, (_, i) => ({
            name: `Competitor ${i + 1}`,
            marketShare: 10 - i,
            strengths: ['Strength 1'],
            weaknesses: ['Weakness 1'],
            keyFeatures: ['Feature 1']
          }))
        }
      };

      const result = generator.generateCompetitiveVisualization(largeAnalysis, 'matrix');
      const diagram = result.mermaidDiagram;

      // Should only include first 5 competitors
      expect(diagram).toContain('C1["Competitor 1');
      expect(diagram).toContain('C5["Competitor 5');
      expect(diagram).not.toContain('C6["Competitor 6');
    });
  });

  describe('exportCompetitiveData', () => {
    test('should export data in JSON format by default', () => {
      const result = generator.exportCompetitiveData(mockCompetitiveAnalysis);

      expect(result.format).toBe('json');
      expect(result.filename).toContain('.json');
      expect(result.data).toHaveProperty('competitiveMatrix');
      expect(result.data.competitiveMatrix.competitors).toHaveLength(2);
      expect(result.timestamp).toBeDefined();
    });

    test('should export data in CSV format', () => {
      const result = generator.exportCompetitiveData(mockCompetitiveAnalysis, 'csv');

      expect(result.format).toBe('csv');
      expect(result.filename).toContain('.csv');
      expect(typeof result.data).toBe('string');
      expect(result.data).toContain('Name,Market Share,Strengths,Weaknesses,Key Features');
      expect(result.data).toContain('Competitor A');
      expect(result.data).toContain('25');
    });

    test('should export data in Markdown format', () => {
      const result = generator.exportCompetitiveData(mockCompetitiveAnalysis, 'markdown');

      expect(result.format).toBe('markdown');
      expect(result.filename).toContain('.md');
      expect(typeof result.data).toBe('string');
      expect(result.data).toContain('# Competitive Analysis Report');
      expect(result.data).toContain('## Competitive Matrix');
      expect(result.data).toContain('| Competitor | Market Share |');
      expect(result.data).toContain('## Strategic Recommendations');
      expect(result.data).toContain('## Market Gaps and Opportunities');
    });

    test('should include proper CSV escaping for special characters', () => {
      const analysisWithSpecialChars = {
        competitiveMatrix: {
          competitors: [
            {
              name: 'Competitor "A"',
              marketShare: 25,
              strengths: ['Strong, reliable brand', 'Large user base'],
              weaknesses: ['High pricing', 'Limited features'],
              keyFeatures: ['Feature 1', 'Feature 2']
            }
          ]
        }
      };

      const result = generator.exportCompetitiveData(analysisWithSpecialChars, 'csv');

      expect(result.data).toContain('"Competitor ""A"""');
      expect(result.data).toContain('"Strong, reliable brand; Large user base"');
    });

    test('should generate proper markdown table structure', () => {
      const result = generator.exportCompetitiveData(mockCompetitiveAnalysis, 'markdown');
      const lines = result.data.split('\n');
      
      const tableHeaderIndex = lines.findIndex((line: string) => line.includes('| Competitor | Market Share |'));
      expect(tableHeaderIndex).toBeGreaterThan(-1);
      
      const separatorLine = lines[tableHeaderIndex + 1];
      expect(separatorLine).toContain('|------------|');
      
      const dataLine = lines[tableHeaderIndex + 2];
      expect(dataLine).toContain('| Competitor A | 25% |');
    });
  });

  describe('export data structure validation', () => {
    test('should include all required fields in JSON export', () => {
      const result = generator.exportCompetitiveData(mockCompetitiveAnalysis, 'json');

      expect(result.data).toHaveProperty('competitiveMatrix');
      expect(result.data).toHaveProperty('generatedAt');
      expect(result.data).toHaveProperty('analysisType');
      expect(result.data.competitiveMatrix).toHaveProperty('competitors');
      expect(result.data.competitiveMatrix).toHaveProperty('rankings');
      expect(result.data.competitiveMatrix).toHaveProperty('differentiationOpportunities');
    });

    test('should include competitor details in export', () => {
      const result = generator.exportCompetitiveData(mockCompetitiveAnalysis, 'json');
      const competitor = result.data.competitiveMatrix.competitors[0];

      expect(competitor).toHaveProperty('name');
      expect(competitor).toHaveProperty('marketShare');
      expect(competitor).toHaveProperty('strengths');
      expect(competitor).toHaveProperty('weaknesses');
      expect(competitor).toHaveProperty('keyFeatures');
      expect(competitor).toHaveProperty('pricing');
    });

    test('should include ranking information in export', () => {
      const result = generator.exportCompetitiveData(mockCompetitiveAnalysis, 'json');
      const ranking = result.data.competitiveMatrix.rankings[0];

      expect(ranking).toHaveProperty('competitorName');
      expect(ranking).toHaveProperty('overallScore');
      expect(ranking).toHaveProperty('rank');
      expect(ranking).toHaveProperty('competitiveAdvantage');
    });

    test('should generate unique filenames with timestamps', () => {
      const result1 = generator.exportCompetitiveData(mockCompetitiveAnalysis, 'json');
      const result2 = generator.exportCompetitiveData(mockCompetitiveAnalysis, 'csv');
      const result3 = generator.exportCompetitiveData(mockCompetitiveAnalysis, 'markdown');

      expect(result1.filename).toContain('competitive-matrix');
      expect(result1.filename).toContain('.json');
      expect(result2.filename).toContain('competitive-analysis');
      expect(result2.filename).toContain('.csv');
      expect(result3.filename).toContain('competitive-analysis');
      expect(result3.filename).toContain('.md');

      // All should have today's date
      const today = new Date().toISOString().split('T')[0];
      expect(result1.filename).toContain(today);
      expect(result2.filename).toContain(today);
      expect(result3.filename).toContain(today);
    });
  });

  describe('error handling and edge cases', () => {
    test('should handle missing competitor data gracefully', () => {
      const emptyAnalysis = {
        competitiveMatrix: { competitors: [] }
      };

      const result = generator.exportCompetitiveData(emptyAnalysis, 'json');

      expect(result.data.competitiveMatrix.competitors).toHaveLength(0);
      expect(result.format).toBe('json');
      expect(result.filename).toBeDefined();
    });

    test('should handle null competitive analysis', () => {
      const result = generator.exportCompetitiveData(null, 'json');

      expect(result.data.competitiveMatrix.competitors).toHaveLength(0);
      expect(result.format).toBe('json');
    });

    test('should handle undefined properties in competitor data', () => {
      const incompleteAnalysis = {
        competitiveMatrix: {
          competitors: [
            {
              name: 'Incomplete Competitor'
              // Missing other properties
            }
          ]
        }
      };

      const result = generator.exportCompetitiveData(incompleteAnalysis, 'csv');

      expect(result.data).toContain('Incomplete Competitor');
      expect(result.data).toContain('0'); // Default market share
      expect(result.data).toContain('""'); // Empty strings for missing arrays
    });

    test('should generate fallback diagram for empty SWOT data', () => {
      const emptySwotAnalysis = {
        swotAnalysis: [
          {
            competitorName: 'Our Solution',
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: []
          }
        ]
      };

      const result = generator.generateCompetitiveVisualization(emptySwotAnalysis, 'swot');

      expect(result.mermaidDiagram).toContain('SWOT Analysis');
      expect(result.mermaidDiagram).toContain('S[Strengths]');
      expect(result.mermaidDiagram).toContain('W[Weaknesses]');
    });
  });
});