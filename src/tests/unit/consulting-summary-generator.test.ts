import { 
  ConsultingSummaryGenerator, 
  AnalysisFindings,
  ExecutiveSummary 
} from '../../components/consulting-summary-generator';
import { ConsultingAnalysis } from '../../components/business-analyzer';
import {
  ConsultingTechnique,
  MECEAnalysis,
  ValueDriverAnalysis,
  ZeroBasedSolution,
  ThreeOptionAnalysis,
  PrioritizedOptimizations,
  ValueProposition,
  ConsultingSummary,
  StructuredRecommendation,
  TechniqueInsight,
  Evidence
} from '../../models/consulting';

describe('ConsultingSummaryGenerator', () => {
  let generator: ConsultingSummaryGenerator;
  let mockAnalysis: ConsultingAnalysis;
  let mockTechniques: ConsultingTechnique[];

  beforeEach(() => {
    generator = new ConsultingSummaryGenerator();
    
    // Mock consulting techniques
    mockTechniques = [
      {
        name: 'MECE',
        relevanceScore: 0.8,
        applicableScenarios: ['workflow optimization', 'quota analysis']
      },
      {
        name: 'ValueDriverTree',
        relevanceScore: 0.9,
        applicableScenarios: ['cost optimization', 'efficiency analysis']
      },
      {
        name: 'ZeroBased',
        relevanceScore: 0.7,
        applicableScenarios: ['radical redesign', 'process reengineering']
      }
    ];

    // Mock analysis data
    mockAnalysis = {
      techniquesUsed: mockTechniques,
      meceAnalysis: {
        categories: [
          {
            name: 'Data Processing',
            drivers: ['API calls', 'Data transformation'],
            quotaImpact: 45,
            optimizationPotential: 30
          },
          {
            name: 'User Interface',
            drivers: ['Rendering', 'State management'],
            quotaImpact: 25,
            optimizationPotential: 15
          }
        ],
        totalCoverage: 95,
        overlaps: []
      },
      valueDriverAnalysis: {
        primaryDrivers: [
          {
            name: 'API Efficiency',
            currentCost: 100,
            optimizedCost: 60,
            savingsPotential: 40
          }
        ],
        secondaryDrivers: [],
        rootCauses: ['Redundant API calls', 'Inefficient batching']
      },
      zeroBasedSolution: {
        radicalApproach: 'Replace multiple API calls with single batch operation',
        assumptionsChallenged: ['Individual API calls are necessary', 'Real-time updates required'],
        potentialSavings: 60,
        implementationRisk: 'medium'
      },
      threeOptionAnalysis: {
        conservative: {
          name: 'Conservative',
          description: 'Basic optimization',
          quotaSavings: 20,
          implementationEffort: 'low',
          riskLevel: 'low',
          estimatedROI: 150
        },
        balanced: {
          name: 'Balanced',
          description: 'Moderate optimization',
          quotaSavings: 35,
          implementationEffort: 'medium',
          riskLevel: 'medium',
          estimatedROI: 200
        },
        bold: {
          name: 'Bold',
          description: 'Aggressive optimization',
          quotaSavings: 55,
          implementationEffort: 'high',
          riskLevel: 'high',
          estimatedROI: 250
        }
      },
      keyFindings: [
        'Data processing operations consume 45% of quota',
        'API efficiency improvements offer 40% savings potential',
        'Zero-based redesign could achieve 60% quota reduction'
      ],
      totalQuotaSavings: 45,
      implementationComplexity: 'medium'
    };
  });

  describe('generateConsultingSummary', () => {
    it('should generate a complete consulting summary', () => {
      const summary = generator.generateConsultingSummary(mockAnalysis, mockTechniques);

      expect(summary).toBeDefined();
      expect(summary.executiveSummary).toContain('3 consulting techniques');
      expect(summary.executiveSummary).toContain('45% potential quota savings');
      expect(summary.keyFindings).toHaveLength(3);
      expect(summary.recommendations).toHaveLength(4); // Based on mock data
      expect(summary.techniquesApplied).toHaveLength(3);
      expect(summary.supportingEvidence).toHaveLength(5); // 1 quantitative + 3 technique evidence + 1 MECE evidence
    });

    it('should include all key findings from analysis', () => {
      const summary = generator.generateConsultingSummary(mockAnalysis, mockTechniques);

      expect(summary.keyFindings).toEqual(mockAnalysis.keyFindings);
    });

    it('should generate technique insights for all provided techniques', () => {
      const summary = generator.generateConsultingSummary(mockAnalysis, mockTechniques);

      expect(summary.techniquesApplied).toHaveLength(mockTechniques.length);
      expect(summary.techniquesApplied.map(t => t.techniqueName)).toEqual(['MECE', 'ValueDriverTree', 'ZeroBased']);
    });
  });

  describe('applyPyramidPrinciple', () => {
    it('should structure recommendations using pyramid principle', () => {
      const findings: AnalysisFindings = {
        primaryFindings: ['Finding 1', 'Finding 2'],
        supportingData: [{ savings: 30 }, { efficiency: 'high' }],
        recommendations: ['Optimize API calls', 'Implement caching'],
        evidence: [
          {
            type: 'quantitative',
            description: 'API optimization saves 30%',
            source: 'Analysis',
            confidence: 'high'
          }
        ]
      };

      const structured = generator.applyPyramidPrinciple(findings);

      expect(structured).toHaveLength(2);
      expect(structured[0].mainRecommendation).toBe('Optimize API calls');
      expect(structured[0].supportingReasons).toBeDefined();
      expect(structured[0].evidence).toBeDefined();
      expect(structured[0].expectedOutcome).toBeDefined();
    });

    it('should provide supporting reasons for each recommendation', () => {
      const findings: AnalysisFindings = {
        primaryFindings: ['API calls are inefficient', 'Caching would help'],
        supportingData: [{}],
        recommendations: ['Optimize API calls'],
        evidence: []
      };

      const structured = generator.applyPyramidPrinciple(findings);

      expect(structured[0].supportingReasons).toContain('API calls are inefficient');
    });

    it('should generate expected outcomes for recommendations', () => {
      const findings: AnalysisFindings = {
        primaryFindings: [],
        supportingData: [{ quotaSavings: 25 }],
        recommendations: ['Test recommendation'],
        evidence: []
      };

      const structured = generator.applyPyramidPrinciple(findings);

      expect(structured[0].expectedOutcome).toContain('25% reduction');
    });
  });

  describe('formatTechniqueInsights', () => {
    it('should format MECE technique insights correctly', () => {
      const meceInsight = generator.formatTechniqueInsights(mockTechniques[0], mockAnalysis);

      expect(meceInsight.techniqueName).toBe('MECE');
      expect(meceInsight.keyInsight).toContain('2 mutually exclusive quota driver categories');
      expect(meceInsight.keyInsight).toContain('95% coverage');
      expect(meceInsight.actionableRecommendation).toContain('Data Processing');
      expect(meceInsight.supportingData).toBe(mockAnalysis.meceAnalysis);
    });

    it('should format ValueDriverTree technique insights correctly', () => {
      const valueDriverInsight = generator.formatTechniqueInsights(mockTechniques[1], mockAnalysis);

      expect(valueDriverInsight.techniqueName).toBe('ValueDriverTree');
      expect(valueDriverInsight.keyInsight).toContain('API Efficiency');
      expect(valueDriverInsight.keyInsight).toContain('40% savings potential');
      expect(valueDriverInsight.actionableRecommendation).toContain('API Efficiency');
      expect(valueDriverInsight.supportingData).toBe(mockAnalysis.valueDriverAnalysis);
    });

    it('should format ZeroBased technique insights correctly', () => {
      const zeroBasedInsight = generator.formatTechniqueInsights(mockTechniques[2], mockAnalysis);

      expect(zeroBasedInsight.techniqueName).toBe('ZeroBased');
      expect(zeroBasedInsight.keyInsight).toContain('2 assumptions');
      expect(zeroBasedInsight.keyInsight).toContain('60% savings');
      expect(zeroBasedInsight.actionableRecommendation).toContain('Replace multiple API calls');
      expect(zeroBasedInsight.supportingData).toBe(mockAnalysis.zeroBasedSolution);
    });

    it('should handle OptionFraming technique insights', () => {
      const optionFramingTechnique: ConsultingTechnique = {
        name: 'OptionFraming',
        relevanceScore: 0.8,
        applicableScenarios: ['decision making']
      };

      const insight = generator.formatTechniqueInsights(optionFramingTechnique, mockAnalysis);

      expect(insight.techniqueName).toBe('OptionFraming');
      expect(insight.keyInsight).toContain('Conservative (20%)');
      expect(insight.keyInsight).toContain('Balanced (35%)');
      expect(insight.keyInsight).toContain('Bold (55%)');
      expect(insight.actionableRecommendation).toContain('approach based on risk-reward');
    });

    it('should provide default insights for unknown techniques', () => {
      const unknownTechnique: ConsultingTechnique = {
        name: 'Pyramid', // Not handled in switch statement
        relevanceScore: 0.6,
        applicableScenarios: ['communication']
      };

      const insight = generator.formatTechniqueInsights(unknownTechnique, mockAnalysis);

      expect(insight.techniqueName).toBe('Pyramid');
      expect(insight.keyInsight).toContain('0.6 relevance score');
      expect(insight.actionableRecommendation).toBe('Review technique-specific recommendations in detailed analysis');
    });
  });

  describe('createExecutiveSummary', () => {
    it('should create comprehensive executive summary', () => {
      const mockRecommendations: StructuredRecommendation[] = [
        {
          mainRecommendation: 'Optimize API efficiency',
          supportingReasons: ['High impact', 'Low effort'],
          evidence: [],
          expectedOutcome: '40% savings'
        }
      ];

      const summary = generator.createExecutiveSummary(mockAnalysis, mockRecommendations);

      expect(summary.overview).toContain('3 consulting techniques');
      expect(summary.overview).toContain('MECE, ValueDriverTree, ZeroBased');
      expect(summary.overview).toContain('45% potential quota savings');
      expect(summary.keyRecommendation).toBe('Optimize API efficiency');
      expect(summary.expectedImpact).toContain('45% while maintaining full functionality');
      expect(summary.nextSteps).toHaveLength(5);
    });

    it('should handle different implementation complexity levels', () => {
      const lowComplexityAnalysis = { ...mockAnalysis, implementationComplexity: 'low' as const };
      const highComplexityAnalysis = { ...mockAnalysis, implementationComplexity: 'high' as const };

      const lowSummary = generator.createExecutiveSummary(lowComplexityAnalysis, []);
      const highSummary = generator.createExecutiveSummary(highComplexityAnalysis, []);

      expect(lowSummary.expectedImpact).toContain('Low implementation complexity ensures rapid deployment');
      expect(highSummary.expectedImpact).toContain('High implementation complexity demands phased rollout');
    });

    it('should provide default recommendation when none available', () => {
      const summary = generator.createExecutiveSummary(mockAnalysis, []);

      expect(summary.keyRecommendation).toBe('No specific recommendations available');
    });

    it('should include standard next steps', () => {
      const summary = generator.createExecutiveSummary(mockAnalysis, []);

      expect(summary.nextSteps).toContain('Review detailed technique-specific insights');
      expect(summary.nextSteps).toContain('Prioritize recommendations based on impact-effort analysis');
      expect(summary.nextSteps).toContain('Begin implementation with highest-ROI optimizations');
      expect(summary.nextSteps).toContain('Monitor quota consumption improvements');
      expect(summary.nextSteps).toContain('Iterate based on performance metrics');
    });
  });

  describe('pyramid principle structure quality', () => {
    it('should follow answer-first structure in recommendations', () => {
      const summary = generator.generateConsultingSummary(mockAnalysis, mockTechniques);

      summary.recommendations.forEach(rec => {
        // Main recommendation should be clear and actionable (the "answer")
        expect(rec.mainRecommendation).toBeTruthy();
        expect(rec.mainRecommendation.length).toBeGreaterThan(10);
        
        // Should have supporting reasons (the "why")
        expect(rec.supportingReasons).toBeDefined();
        expect(rec.supportingReasons.length).toBeGreaterThan(0);
        
        // Should have evidence (the "proof")
        expect(rec.evidence).toBeDefined();
        
        // Should have expected outcome
        expect(rec.expectedOutcome).toBeTruthy();
      });
    });

    it('should provide clear and actionable technique insights', () => {
      const summary = generator.generateConsultingSummary(mockAnalysis, mockTechniques);

      summary.techniquesApplied.forEach(insight => {
        // Key insight should be specific and measurable
        expect(insight.keyInsight).toBeTruthy();
        expect(insight.keyInsight.length).toBeGreaterThan(20);
        
        // Actionable recommendation should be concrete
        expect(insight.actionableRecommendation).toBeTruthy();
        expect(insight.actionableRecommendation.length).toBeGreaterThan(15);
        
        // Supporting data should be present
        expect(insight.supportingData).toBeDefined();
      });
    });
  });

  describe('consulting summary quality', () => {
    it('should generate professional-grade executive summary', () => {
      const summary = generator.generateConsultingSummary(mockAnalysis, mockTechniques);

      // Executive summary should be comprehensive but concise
      expect(summary.executiveSummary.length).toBeGreaterThan(100);
      expect(summary.executiveSummary.length).toBeLessThan(500);
      
      // Should mention key metrics
      expect(summary.executiveSummary).toContain('45%');
      expect(summary.executiveSummary).toContain('techniques');
      expect(summary.executiveSummary).toContain('optimization');
    });

    it('should provide evidence-based recommendations', () => {
      const summary = generator.generateConsultingSummary(mockAnalysis, mockTechniques);

      // Should have supporting evidence for claims
      expect(summary.supportingEvidence.length).toBeGreaterThan(0);
      
      // Evidence should include both quantitative and qualitative
      const hasQuantitative = summary.supportingEvidence.some(e => e.type === 'quantitative');
      const hasQualitative = summary.supportingEvidence.some(e => e.type === 'qualitative');
      
      expect(hasQuantitative).toBe(true);
      expect(hasQualitative).toBe(true);
    });

    it('should maintain consistency across all sections', () => {
      const summary = generator.generateConsultingSummary(mockAnalysis, mockTechniques);

      // Quota savings should be consistent across sections
      expect(summary.executiveSummary).toContain('45%');
      
      // Number of techniques should match
      expect(summary.techniquesApplied).toHaveLength(mockTechniques.length);
      
      // Key findings should match input
      expect(summary.keyFindings).toEqual(mockAnalysis.keyFindings);
    });
  });
});