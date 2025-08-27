// Integration tests for AI Agent Pipeline orchestration

import { AIAgentPipeline } from '../../pipeline';
import { 
  OptionalParams, 
  Workflow, 
  OptimizedWorkflow,
  ROIAnalysis,
  ConsultingSummary 
} from '../../models';
import { ConsultingAnalysis } from '../../components/business-analyzer';

describe('AIAgentPipeline Integration Tests', () => {
  let pipeline: AIAgentPipeline;

  beforeEach(() => {
    pipeline = new AIAgentPipeline();
  });

  describe('processIntent - Full Pipeline Execution', () => {
    it('should execute complete pipeline with consulting techniques', async () => {
      const rawIntent = 'I want to create a user management system that can handle user registration, authentication, and profile management efficiently';
      const params: OptionalParams = {
        expectedUserVolume: 1000,
        costConstraints: {
          maxCostDollars: 100
        },
        performanceSensitivity: 'medium'
      };

      const result = await pipeline.processIntent(rawIntent, params);

      expect(result.success).toBe(true);
      expect(result.enhancedKiroSpec).toBeDefined();
      expect(result.consultingSummary).toBeDefined();
      expect(result.roiAnalysis).toBeDefined();
      expect(result.metadata).toBeDefined();
      
      // Verify enhanced spec structure
      expect(result.enhancedKiroSpec!.name).toBeTruthy();
      expect(result.enhancedKiroSpec!.tasks).toHaveLength(expect.any(Number));
      expect(result.enhancedKiroSpec!.consultingSummary).toBeDefined();
      expect(result.enhancedKiroSpec!.roiAnalysis).toBeDefined();
      expect(result.enhancedKiroSpec!.alternativeOptions).toBeDefined();
      
      // Verify consulting summary
      expect(result.consultingSummary!.executiveSummary).toBeTruthy();
      expect(result.consultingSummary!.recommendations).toHaveLength(expect.any(Number));
      expect(result.consultingSummary!.techniquesApplied).toHaveLength(expect.any(Number));
      
      // Verify ROI analysis
      expect(result.roiAnalysis!.scenarios).toHaveLength(expect.any(Number));
      expect(result.roiAnalysis!.bestOption).toBeTruthy();
      expect(result.roiAnalysis!.recommendations).toHaveLength(expect.any(Number));
      
      // Verify metadata
      expect(result.metadata!.executionTime).toBeGreaterThan(0);
      expect(result.metadata!.sessionId).toBeTruthy();
      expect(result.metadata!.quotaUsed).toBeGreaterThan(0);
      expect(result.metadata!.optimizationsApplied).toBeGreaterThanOrEqual(0);
    }, 30000);

    it('should handle complex multi-step workflows', async () => {
      const complexIntent = `
        Create a comprehensive e-commerce platform that includes:
        1. Product catalog management with search and filtering
        2. Shopping cart and checkout process
        3. Payment processing integration
        4. Order management and tracking
        5. User reviews and ratings system
        6. Inventory management
        7. Analytics and reporting dashboard
      `;

      const result = await pipeline.processIntent(complexIntent);

      expect(result.success).toBe(true);
      expect(result.enhancedKiroSpec).toBeDefined();
      expect(result.enhancedKiroSpec!.tasks.length).toBeGreaterThan(5);
      expect(result.consultingSummary!.techniquesApplied.length).toBeGreaterThanOrEqual(2);
      expect(result.roiAnalysis!.scenarios.length).toBeGreaterThanOrEqual(3);
    }, 30000);

    it('should apply appropriate consulting techniques based on intent complexity', async () => {
      const businessIntent = 'Optimize our customer onboarding process to reduce churn and improve user activation rates';

      const result = await pipeline.processIntent(businessIntent);

      expect(result.success).toBe(true);
      expect(result.consultingSummary!.techniquesApplied).toContainEqual(
        expect.objectContaining({
          techniqueName: expect.stringMatching(/MECE|ValueDriverTree|ImpactEffort/)
        })
      );
      expect(result.roiAnalysis!.scenarios).toHaveLength(3);
      expect(result.enhancedKiroSpec!.alternativeOptions.conservative).toBeDefined();
      expect(result.enhancedKiroSpec!.alternativeOptions.balanced).toBeDefined();
      expect(result.enhancedKiroSpec!.alternativeOptions.bold).toBeDefined();
    });

    it('should handle validation errors gracefully', async () => {
      const invalidIntent = '';

      const result = await pipeline.processIntent(invalidIntent);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.stage).toBe('intent');
      expect(result.error!.type).toBe('validation_failed');
      expect(result.metadata).toBeDefined();
    });

    it('should provide fallback results when components fail', async () => {
      // Mock a scenario where business analysis might fail but pipeline continues
      const edgeCaseIntent = 'Do something with data';

      const result = await pipeline.processIntent(edgeCaseIntent);

      // Should still succeed with fallback mechanisms
      expect(result.success).toBe(true);
      expect(result.enhancedKiroSpec).toBeDefined();
      expect(result.metadata!.quotaUsed).toBeGreaterThan(0);
    });
  });

  describe('analyzeWorkflow - Individual Analysis Method', () => {
    it('should analyze existing workflow and provide consulting insights', async () => {
      const workflow: Workflow = {
        id: 'test-workflow-1',
        steps: [
          {
            id: 'step-1',
            type: 'data_retrieval',
            description: 'Fetch user data from database',
            inputs: [],
            outputs: ['userData'],
            quotaCost: 3
          },
          {
            id: 'step-2',
            type: 'vibe',
            description: 'Analyze user behavior patterns',
            inputs: ['userData'],
            outputs: ['behaviorAnalysis'],
            quotaCost: 8
          },
          {
            id: 'step-3',
            type: 'processing',
            description: 'Generate personalized recommendations',
            inputs: ['behaviorAnalysis'],
            outputs: ['recommendations'],
            quotaCost: 5
          }
        ],
        dataFlow: [],
        estimatedComplexity: 3
      };

      const analysis = await pipeline.analyzeWorkflow(workflow);

      expect(analysis).toBeDefined();
      expect(analysis.techniquesUsed).toHaveLength(expect.any(Number));
      expect(analysis.keyFindings).toHaveLength(expect.any(Number));
      expect(analysis.totalQuotaSavings).toBeGreaterThanOrEqual(0);
      expect(analysis.implementationComplexity).toBeDefined();
    });

    it('should apply specific techniques when requested', async () => {
      const workflow: Workflow = {
        id: 'test-workflow-2',
        steps: [
          {
            id: 'step-1',
            type: 'vibe',
            description: 'Process large dataset',
            inputs: [],
            outputs: ['processedData'],
            quotaCost: 15
          }
        ],
        dataFlow: [],
        estimatedComplexity: 2
      };

      const requestedTechniques = ['MECE', 'ValueDriverTree'];
      const analysis = await pipeline.analyzeWorkflow(workflow, requestedTechniques);

      expect(analysis.techniquesUsed.some(t => requestedTechniques.includes(t.name))).toBe(true);
    });

    it('should handle workflow analysis errors', async () => {
      const invalidWorkflow: Workflow = {
        id: '',
        steps: [],
        dataFlow: [],
        estimatedComplexity: 0
      };

      await expect(pipeline.analyzeWorkflow(invalidWorkflow)).rejects.toThrow();
    });
  });

  describe('generateROIAnalysis - Individual ROI Method', () => {
    it('should generate comprehensive ROI analysis with multiple scenarios', async () => {
      const baseWorkflow: Workflow = {
        id: 'base-workflow',
        steps: [
          {
            id: 'step-1',
            type: 'vibe',
            description: 'Expensive operation',
            inputs: [],
            outputs: ['result'],
            quotaCost: 20
          }
        ],
        dataFlow: [],
        estimatedComplexity: 1
      };

      const optimizedWorkflow: OptimizedWorkflow = {
        ...baseWorkflow,
        id: 'optimized-workflow',
        steps: [
          {
            id: 'step-1-opt',
            type: 'spec',
            description: 'Optimized operation',
            inputs: [],
            outputs: ['result'],
            quotaCost: 5
          }
        ],
        optimizations: [{
          type: 'vibe_to_spec',
          description: 'Converted vibe to spec',
          stepsAffected: ['step-1'],
          estimatedSavings: { vibes: 15, specs: 0, percentage: 75 }
        }],
        originalWorkflow: baseWorkflow,
        efficiencyGains: {
          vibeReduction: 15,
          specReduction: 0,
          totalSavingsPercentage: 75,
          costSavings: 15
        }
      };

      const roiAnalysis = await pipeline.generateROIAnalysis(baseWorkflow, optimizedWorkflow);

      expect(roiAnalysis).toBeDefined();
      expect(roiAnalysis.scenarios).toHaveLength(3);
      expect(roiAnalysis.scenarios.map(s => s.name)).toEqual(['Conservative', 'Balanced', 'Bold']);
      expect(roiAnalysis.bestOption).toBeTruthy();
      expect(roiAnalysis.recommendations).toHaveLength(expect.any(Number));
      
      // Verify savings calculations
      const balancedScenario = roiAnalysis.scenarios.find(s => s.name === 'Balanced');
      expect(balancedScenario!.savingsPercentage).toBeGreaterThan(0);
    });

    it('should handle ROI analysis with zero-based solution', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          { id: 'step-1', type: 'vibe', description: 'Operation 1', inputs: [], outputs: [], quotaCost: 10 },
          { id: 'step-2', type: 'vibe', description: 'Operation 2', inputs: [], outputs: [], quotaCost: 8 }
        ],
        dataFlow: [],
        estimatedComplexity: 2
      };

      const zeroBasedSolution = {
        radicalApproach: 'Complete redesign using batch processing',
        assumptionsChallenged: ['Individual processing assumption'],
        potentialSavings: 80,
        implementationRisk: 'medium' as const
      };

      const roiAnalysis = await pipeline.generateROIAnalysis(workflow, undefined, zeroBasedSolution);

      expect(roiAnalysis.scenarios).toHaveLength(3);
      const boldScenario = roiAnalysis.scenarios.find(s => s.name === 'Bold');
      expect(boldScenario!.savingsPercentage).toBeGreaterThan(0);
    });
  });

  describe('generateConsultingSummary - Individual Summary Method', () => {
    it('should generate professional consulting summary', async () => {
      const mockAnalysis: ConsultingAnalysis = {
        techniquesUsed: [
          { name: 'MECE', relevanceScore: 0.9, applicableScenarios: ['workflow analysis'] },
          { name: 'ValueDriverTree', relevanceScore: 0.8, applicableScenarios: ['cost optimization'] }
        ],
        keyFindings: [
          'Workflow has significant optimization potential',
          'Current approach uses excessive vibe operations'
        ],
        totalQuotaSavings: 45,
        implementationComplexity: 'medium',
        zeroBasedSolution: {
          radicalApproach: 'Batch processing approach',
          assumptionsChallenged: ['Real-time processing requirement'],
          potentialSavings: 60,
          implementationRisk: 'medium'
        }
      };

      const summary = await pipeline.generateConsultingSummary(mockAnalysis);

      expect(summary).toBeDefined();
      expect(summary.executiveSummary).toBeTruthy();
      expect(summary.recommendations).toHaveLength(expect.any(Number));
      expect(summary.techniquesApplied).toHaveLength(2);
      expect(summary.supportingEvidence).toHaveLength(expect.any(Number));
      
      // Verify pyramid principle structure
      expect(summary.recommendations[0].mainRecommendation).toBeTruthy();
      expect(summary.recommendations[0].supportingReasons).toHaveLength(expect.any(Number));
      expect(summary.recommendations[0].expectedOutcome).toBeTruthy();
    });

    it('should filter techniques when specific ones are requested', async () => {
      const mockAnalysis: ConsultingAnalysis = {
        techniquesUsed: [
          { name: 'MECE', relevanceScore: 0.9, applicableScenarios: ['analysis'] },
          { name: 'ValueDriverTree', relevanceScore: 0.8, applicableScenarios: ['optimization'] },
          { name: 'ImpactEffort', relevanceScore: 0.7, applicableScenarios: ['prioritization'] }
        ],
        keyFindings: ['Multiple optimization opportunities identified'],
        totalQuotaSavings: 30,
        implementationComplexity: 'low'
      };

      const requestedTechniques = ['MECE', 'ValueDriverTree'];
      const summary = await pipeline.generateConsultingSummary(mockAnalysis, requestedTechniques);

      expect(summary.techniquesApplied).toHaveLength(2);
      expect(summary.techniquesApplied.every(t => requestedTechniques.includes(t.techniqueName))).toBe(true);
    });
  });

  describe('Pipeline Performance and Monitoring', () => {
    it('should track execution metrics', async () => {
      const intent = 'Create a simple data processing workflow';
      
      const result = await pipeline.processIntent(intent);

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.executionTime).toBeGreaterThan(0);
      expect(result.metadata!.sessionId).toMatch(/^pipeline-\d+-[a-z0-9]+$/);
      expect(result.metadata!.quotaUsed).toBeGreaterThan(0);
      expect(typeof result.metadata!.optimizationsApplied).toBe('number');
    });

    it('should handle concurrent pipeline executions', async () => {
      const intents = [
        'Create user authentication system',
        'Build data analytics dashboard',
        'Implement notification service'
      ];

      const promises = intents.map(intent => pipeline.processIntent(intent));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.metadata!.sessionId).toBeTruthy();
      });

      // Verify unique session IDs
      const sessionIds = results.map(r => r.metadata!.sessionId);
      const uniqueSessionIds = new Set(sessionIds);
      expect(uniqueSessionIds.size).toBe(3);
    });

    it('should maintain performance under load', async () => {
      const intent = 'Process user data efficiently';
      const iterations = 5;
      
      const startTime = Date.now();
      const promises = Array(iterations).fill(null).map(() => pipeline.processIntent(intent));
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(iterations);
      results.forEach(result => expect(result.success).toBe(true));
      
      // Average execution time should be reasonable
      const averageTime = totalTime / iterations;
      expect(averageTime).toBeLessThan(10000); // Less than 10 seconds per execution
    }, 60000);
  });

  describe('Error Handling and Recovery', () => {
    it('should provide detailed error information on failure', async () => {
      const problematicIntent = null as any;

      const result = await pipeline.processIntent(problematicIntent);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.stage).toBeTruthy();
      expect(result.error!.type).toBeTruthy();
      expect(result.error!.message).toBeTruthy();
      expect(result.error!.suggestedAction).toBeTruthy();
      expect(result.metadata).toBeDefined();
    });

    it('should maintain session tracking even on errors', async () => {
      const invalidIntent = '';

      const result = await pipeline.processIntent(invalidIntent);

      expect(result.success).toBe(false);
      expect(result.metadata!.sessionId).toBeTruthy();
      expect(result.metadata!.executionTime).toBeGreaterThan(0);
    });
  });
});