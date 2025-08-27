import { SpecGenerator } from '../../components/spec-generator';
import { 
  OptimizedWorkflow, 
  KiroSpec, 
  EnhancedKiroSpec,
  QuotaForecast,
  ConsultingSummary,
  ROIAnalysis,
  ThreeOptionAnalysis,
  TechniqueInsight,
  StructuredRecommendation,
  Evidence
} from '../../models';

describe('SpecGenerator', () => {
  let specGenerator: SpecGenerator;
  let mockOptimizedWorkflow: OptimizedWorkflow;
  let mockConsultingSummary: ConsultingSummary;
  let mockROIAnalysis: ROIAnalysis;
  let mockAlternativeOptions: ThreeOptionAnalysis;

  beforeEach(() => {
    specGenerator = new SpecGenerator();
    
    mockOptimizedWorkflow = {
      id: 'test-workflow',
      steps: [
        {
          id: 'step1',
          type: 'vibe',
          description: 'Analyze user requirements',
          inputs: ['user_input'],
          outputs: ['parsed_requirements'],
          quotaCost: 5
        },
        {
          id: 'step2',
          type: 'spec',
          description: 'Generate implementation plan',
          inputs: ['parsed_requirements'],
          outputs: ['implementation_plan'],
          quotaCost: 3
        }
      ],
      dataFlow: [
        {
          from: 'step1',
          to: 'step2',
          dataType: 'requirements',
          required: true
        }
      ],
      estimatedComplexity: 7,
      optimizations: [
        {
          type: 'batching',
          description: 'Batch similar analysis operations',
          stepsAffected: ['step1'],
          estimatedSavings: {
            vibes: 2,
            specs: 0,
            percentage: 25
          }
        }
      ],
      originalWorkflow: {
        id: 'original-workflow',
        steps: [
          {
            id: 'orig-step1',
            type: 'vibe',
            description: 'Analyze user requirements individually',
            inputs: ['user_input'],
            outputs: ['parsed_requirements'],
            quotaCost: 7
          },
          {
            id: 'orig-step2',
            type: 'spec',
            description: 'Generate implementation plan',
            inputs: ['parsed_requirements'],
            outputs: ['implementation_plan'],
            quotaCost: 3
          }
        ],
        dataFlow: [],
        estimatedComplexity: 10
      },
      efficiencyGains: {
        vibeReduction: 28.6,
        specReduction: 0,
        costSavings: 2,
        totalSavingsPercentage: 20
      }
    };

    const mockTechniqueInsight: TechniqueInsight = {
      techniqueName: 'MECE',
      keyInsight: 'Requirements can be categorized into mutually exclusive groups',
      supportingData: { categories: 3, overlap: 0 },
      actionableRecommendation: 'Group similar requirements for batch processing'
    };

    const mockEvidence: Evidence = {
      type: 'quantitative',
      description: 'Batching reduces API calls by 25%',
      source: 'optimization_analysis',
      confidence: 'high'
    };

    const mockRecommendation: StructuredRecommendation = {
      mainRecommendation: 'Implement batching optimization for requirement analysis',
      supportingReasons: ['Reduces quota consumption', 'Maintains functionality'],
      evidence: [mockEvidence],
      expectedOutcome: '25% reduction in vibe usage'
    };

    mockConsultingSummary = {
      executiveSummary: 'Analysis shows 20% efficiency improvement through batching optimization',
      keyFindings: ['Batching opportunities identified', 'No functionality loss'],
      recommendations: [mockRecommendation],
      techniquesApplied: [mockTechniqueInsight],
      supportingEvidence: [mockEvidence]
    };

    mockROIAnalysis = {
      scenarios: [
        {
          name: 'Optimized',
          forecast: {
            vibesConsumed: 5,
            specsConsumed: 3,
            estimatedCost: 8,
            confidenceLevel: 'high',
            scenario: 'optimized',
            breakdown: []
          },
          savingsPercentage: 20,
          implementationEffort: 'medium',
          riskLevel: 'low'
        }
      ],
      recommendations: ['Implement batching optimization'],
      bestOption: 'optimized',
      riskAssessment: 'Low risk with high confidence'
    };

    mockAlternativeOptions = {
      conservative: {
        name: 'Conservative',
        description: 'Minimal batching with low risk',
        quotaSavings: 15,
        implementationEffort: 'low',
        riskLevel: 'low',
        estimatedROI: 1.5
      },
      balanced: {
        name: 'Balanced',
        description: 'Moderate batching optimization',
        quotaSavings: 25,
        implementationEffort: 'medium',
        riskLevel: 'medium',
        estimatedROI: 2.0
      },
      bold: {
        name: 'Bold',
        description: 'Aggressive batching with caching',
        quotaSavings: 40,
        implementationEffort: 'high',
        riskLevel: 'high',
        estimatedROI: 3.0
      }
    };
  });

  describe('generateKiroSpec', () => {
    it('should generate a complete Kiro spec from optimized workflow', async () => {
      const originalIntent = 'Create a system to analyze user requirements and generate implementation plans';
      
      const result = await specGenerator.generateKiroSpec(mockOptimizedWorkflow, originalIntent);
      
      expect(result).toBeDefined();
      expect(result.name).toContain('Optimizer');
      expect(result.description).toContain(originalIntent);
      expect(result.description).toContain('20.0%'); // efficiency percentage
      expect(result.requirements).toHaveLength(3); // 2 functional + 1 optimization
      expect(result.design.components).toHaveLength(2); // vibe and spec handlers
      expect(result.tasks).toHaveLength(3); // 1 optimization + 2 implementation
      expect(result.metadata.originalIntent).toBe(originalIntent);
      expect(result.metadata.optimizationApplied).toContain('batching');
    });

    it('should generate requirements with proper priority based on quota cost', async () => {
      const result = await specGenerator.generateKiroSpec(mockOptimizedWorkflow, 'test intent');
      
      const highCostReq = result.requirements.find(req => req.id === 'REQ-1');
      expect(highCostReq?.priority).toBe('low'); // quotaCost = 5
      
      const optReq = result.requirements.find(req => req.id === 'REQ-OPT');
      expect(optReq?.priority).toBe('high');
      expect(optReq?.acceptanceCriteria[0]).toContain('20.0%');
    });

    it('should generate design with correct component structure', async () => {
      const result = await specGenerator.generateKiroSpec(mockOptimizedWorkflow, 'test intent');
      
      expect(result.design.overview).toContain('1 efficiency improvements');
      expect(result.design.architecture).toContain('20.0% quota reduction');
      expect(result.design.components).toHaveLength(2);
      expect(result.design.components[0].name).toBe('Vibe Handler');
      expect(result.design.components[1].name).toBe('Spec Handler');
    });

    it('should generate tasks with appropriate effort estimation', async () => {
      const result = await specGenerator.generateKiroSpec(mockOptimizedWorkflow, 'test intent');
      
      const optimizationTask = result.tasks.find(task => task.id === 'TASK-1');
      expect(optimizationTask?.description).toContain('batching optimization');
      expect(optimizationTask?.estimatedEffort).toBe('medium'); // 25% savings
      expect(optimizationTask?.subtasks).toHaveLength(1);
    });
  });

  describe('generateEnhancedKiroSpec', () => {
    it('should generate enhanced spec with consulting insights', async () => {
      const originalIntent = 'Optimize workflow efficiency';
      
      const result = await specGenerator.generateEnhancedKiroSpec(
        mockOptimizedWorkflow,
        originalIntent,
        mockConsultingSummary,
        mockROIAnalysis,
        mockAlternativeOptions
      );
      
      expect(result).toBeDefined();
      expect(result.consultingSummary).toBe(mockConsultingSummary);
      expect(result.roiAnalysis).toBe(mockROIAnalysis);
      expect(result.alternativeOptions).toBe(mockAlternativeOptions);
      expect(result.metadata.optimizationApplied).toContain('batching');
      expect(result.metadata.optimizationApplied).toContain('MECE');
    });

    it('should preserve all base spec properties in enhanced version', async () => {
      const result = await specGenerator.generateEnhancedKiroSpec(
        mockOptimizedWorkflow,
        'test intent',
        mockConsultingSummary,
        mockROIAnalysis,
        mockAlternativeOptions
      );
      
      expect(result.name).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.requirements).toBeDefined();
      expect(result.design).toBeDefined();
      expect(result.tasks).toBeDefined();
      expect(result.metadata).toBeDefined();
    });
  });

  describe('formatSpecWithConsultingInsights', () => {
    it('should format existing spec with consulting insights', () => {
      const baseSpec: KiroSpec = {
        name: 'Test Spec',
        description: 'Test description',
        requirements: [],
        design: {
          overview: 'Test overview',
          architecture: 'Test architecture',
          components: [],
          dataModels: []
        },
        tasks: [],
        metadata: {
          originalIntent: 'test',
          optimizationApplied: [],
          estimatedQuotaUsage: {
            vibesConsumed: 5,
            specsConsumed: 3,
            estimatedCost: 8,
            confidenceLevel: 'medium',
            scenario: 'optimized',
            breakdown: []
          },
          generatedAt: new Date(),
          version: '1.0.0'
        }
      };
      
      const result = specGenerator.formatSpecWithConsultingInsights(baseSpec, mockConsultingSummary);
      
      expect(result.consultingSummary).toBe(mockConsultingSummary);
      expect(result.roiAnalysis).toBeDefined();
      expect(result.alternativeOptions).toBeDefined();
      expect(result.alternativeOptions.conservative.quotaSavings).toBe(15);
      expect(result.alternativeOptions.balanced.quotaSavings).toBe(30);
      expect(result.alternativeOptions.bold.quotaSavings).toBe(50);
    });

    it('should enhance description with consulting insights', () => {
      const baseSpec: KiroSpec = {
        name: 'Test Spec',
        description: 'Original description',
        requirements: [],
        design: { overview: '', architecture: '', components: [], dataModels: [] },
        tasks: [],
        metadata: {
          originalIntent: 'test',
          optimizationApplied: [],
          estimatedQuotaUsage: {
            vibesConsumed: 5, specsConsumed: 3, estimatedCost: 8,
            confidenceLevel: 'medium', scenario: 'optimized', breakdown: []
          },
          generatedAt: new Date(),
          version: '1.0.0'
        }
      };
      
      const result = specGenerator.formatSpecWithConsultingInsights(baseSpec, mockConsultingSummary);
      
      expect(result.description).toContain('Original description');
      expect(result.description).toContain('Enhanced with consulting analysis');
      expect(result.description).toContain('Requirements can be categorized into mutually exclusive groups');
      expect(result.description).toContain('Implement batching optimization');
    });

    it('should add consulting requirements to existing requirements', () => {
      const baseSpec: KiroSpec = {
        name: 'Test Spec',
        description: 'Test description',
        requirements: [
          {
            id: 'REQ-1',
            userStory: 'Original requirement',
            acceptanceCriteria: ['Original criteria'],
            priority: 'high'
          }
        ],
        design: { overview: '', architecture: '', components: [], dataModels: [] },
        tasks: [],
        metadata: {
          originalIntent: 'test',
          optimizationApplied: [],
          estimatedQuotaUsage: {
            vibesConsumed: 5, specsConsumed: 3, estimatedCost: 8,
            confidenceLevel: 'medium', scenario: 'optimized', breakdown: []
          },
          generatedAt: new Date(),
          version: '1.0.0'
        }
      };
      
      const result = specGenerator.formatSpecWithConsultingInsights(baseSpec, mockConsultingSummary);
      
      expect(result.requirements).toHaveLength(2); // 1 original + 1 consulting
      expect(result.requirements[0].id).toBe('REQ-1');
      expect(result.requirements[1].id).toBe('REQ-CONSULTING-1');
      expect(result.requirements[1].userStory).toContain('MECE methodology');
      expect(result.requirements[1].acceptanceCriteria[0]).toContain('MECE is applied');
    });

    it('should add consulting tasks to existing tasks', () => {
      const baseSpec: KiroSpec = {
        name: 'Test Spec',
        description: 'Test description',
        requirements: [],
        design: { overview: '', architecture: '', components: [], dataModels: [] },
        tasks: [
          {
            id: 'TASK-1',
            description: 'Original task',
            requirements: ['REQ-1'],
            estimatedEffort: 'medium'
          }
        ],
        metadata: {
          originalIntent: 'test',
          optimizationApplied: [],
          estimatedQuotaUsage: {
            vibesConsumed: 5, specsConsumed: 3, estimatedCost: 8,
            confidenceLevel: 'medium', scenario: 'optimized', breakdown: []
          },
          generatedAt: new Date(),
          version: '1.0.0'
        }
      };
      
      const result = specGenerator.formatSpecWithConsultingInsights(baseSpec, mockConsultingSummary);
      
      expect(result.tasks).toHaveLength(2); // 1 original + 1 consulting
      expect(result.tasks[0].id).toBe('TASK-1');
      expect(result.tasks[1].id).toBe('TASK-CONSULTING-1');
      expect(result.tasks[1].description).toContain('Implement batching optimization');
      expect(result.tasks[1].subtasks).toHaveLength(2); // 2 supporting reasons
    });

    it('should generate ROI analysis from consulting summary', () => {
      const baseSpec: KiroSpec = {
        name: 'Test Spec',
        description: 'Test description',
        requirements: [],
        design: { overview: '', architecture: '', components: [], dataModels: [] },
        tasks: [],
        metadata: {
          originalIntent: 'test',
          optimizationApplied: [],
          estimatedQuotaUsage: {
            vibesConsumed: 10, specsConsumed: 5, estimatedCost: 15,
            confidenceLevel: 'medium', scenario: 'optimized', breakdown: []
          },
          generatedAt: new Date(),
          version: '1.0.0'
        }
      };
      
      const result = specGenerator.formatSpecWithConsultingInsights(baseSpec, mockConsultingSummary);
      
      expect(result.roiAnalysis.scenarios).toHaveLength(1);
      expect(result.roiAnalysis.scenarios[0].savingsPercentage).toBe(25); // extracted from "25% reduction"
      expect(result.roiAnalysis.scenarios[0].forecast.vibesConsumed).toBe(8); // 10 * (1 - 0.25)
      expect(result.roiAnalysis.recommendations).toContain('Implement batching optimization for requirement analysis');
      expect(result.roiAnalysis.riskAssessment).toContain('Low risk with strong quantitative evidence');
    });

    it('should update metadata with consulting techniques', () => {
      const baseSpec: KiroSpec = {
        name: 'Test Spec',
        description: 'Test description',
        requirements: [],
        design: { overview: '', architecture: '', components: [], dataModels: [] },
        tasks: [],
        metadata: {
          originalIntent: 'test',
          optimizationApplied: ['batching'],
          estimatedQuotaUsage: {
            vibesConsumed: 5, specsConsumed: 3, estimatedCost: 8,
            confidenceLevel: 'medium', scenario: 'optimized', breakdown: []
          },
          generatedAt: new Date(),
          version: '1.0.0'
        }
      };
      
      const result = specGenerator.formatSpecWithConsultingInsights(baseSpec, mockConsultingSummary);
      
      expect(result.metadata.optimizationApplied).toContain('batching');
      expect(result.metadata.optimizationApplied).toContain('MECE');
    });
  });

  describe('generateEfficiencySummary', () => {
    it('should calculate efficiency savings correctly', () => {
      const naiveForecast: QuotaForecast = {
        vibesConsumed: 10,
        specsConsumed: 5,
        estimatedCost: 15,
        confidenceLevel: 'medium',
        scenario: 'naive',
        breakdown: []
      };
      
      const optimizedForecast: QuotaForecast = {
        vibesConsumed: 7,
        specsConsumed: 4,
        estimatedCost: 11,
        confidenceLevel: 'high',
        scenario: 'optimized',
        breakdown: []
      };
      
      const result = specGenerator.generateEfficiencySummary(naiveForecast, optimizedForecast);
      
      expect(result.naiveApproach).toBe(naiveForecast);
      expect(result.optimizedApproach).toBe(optimizedForecast);
      expect(result.savings.vibeReduction).toBe(30); // (10-7)/10 * 100
      expect(result.savings.specReduction).toBe(20); // (5-4)/5 * 100
      expect(result.savings.costSavings).toBe(4); // 15-11
      expect(result.savings.totalSavingsPercentage).toBeCloseTo(26.67, 1); // 4/15 * 100
    });
  });

  describe('generateOptimizationNotes', () => {
    it('should generate appropriate notes for different optimization types', () => {
      const workflowWithMultipleOptimizations: OptimizedWorkflow = {
        ...mockOptimizedWorkflow,
        optimizations: [
          {
            type: 'batching',
            description: 'Batch operations',
            stepsAffected: ['step1', 'step2'],
            estimatedSavings: { vibes: 2, specs: 0, percentage: 25 }
          },
          {
            type: 'caching',
            description: 'Add cache layer',
            stepsAffected: ['step1'],
            estimatedSavings: { vibes: 1, specs: 0, percentage: 15 }
          },
          {
            type: 'decomposition',
            description: 'Split into smaller specs',
            stepsAffected: ['step1', 'step2', 'step3'],
            estimatedSavings: { vibes: 0, specs: 1, percentage: 10 }
          },
          {
            type: 'vibe_to_spec',
            description: 'Convert vibes to specs',
            stepsAffected: ['step1'],
            estimatedSavings: { vibes: 3, specs: 1, percentage: 30 }
          }
        ]
      };
      
      const result = specGenerator.generateOptimizationNotes(workflowWithMultipleOptimizations);
      
      expect(result).toHaveLength(4);
      expect(result[0]).toContain('Batched 2 operations');
      expect(result[0]).toContain('25%');
      expect(result[1]).toContain('caching layer');
      expect(result[1]).toContain('15%');
      expect(result[2]).toContain('Split workflow into 3 smaller specs');
      expect(result[3]).toContain('Converted 3 vibes to 1 specs');
    });

    it('should handle empty optimizations array', () => {
      const workflowWithNoOptimizations: OptimizedWorkflow = {
        ...mockOptimizedWorkflow,
        optimizations: []
      };
      
      const result = specGenerator.generateOptimizationNotes(workflowWithNoOptimizations);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('private helper methods', () => {
    it('should generate appropriate spec names from intent', async () => {
      const intents = [
        'Create a user authentication system',
        'Build data processing pipeline',
        'Implement real-time notifications'
      ];
      
      for (const intent of intents) {
        const result = await specGenerator.generateKiroSpec(mockOptimizedWorkflow, intent);
        expect(result.name).toMatch(/\w+\s+\w+\s+Optimizer/);
        expect(result.name).not.toContain('Create');
        expect(result.name).not.toContain('Build');
        expect(result.name).not.toContain('Implement');
      }
    });

    it('should generate metadata with correct quota calculations', async () => {
      const result = await specGenerator.generateKiroSpec(mockOptimizedWorkflow, 'test intent');
      
      expect(result.metadata.estimatedQuotaUsage.vibesConsumed).toBe(5);
      expect(result.metadata.estimatedQuotaUsage.specsConsumed).toBe(3);
      expect(result.metadata.estimatedQuotaUsage.estimatedCost).toBe(8);
      expect(result.metadata.estimatedQuotaUsage.breakdown).toHaveLength(2);
      expect(result.metadata.generatedAt).toBeInstanceOf(Date);
      expect(result.metadata.version).toBe('1.0.0');
    });
  });
});