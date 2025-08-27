// Accuracy validation tests for AI Agent Pipeline

import { PMAgentMCPServer } from '../../mcp/server';
import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';
import { 
  MCPServerOptions,
  MCPToolContext,
  OptimizeIntentArgs,
  AnalyzeWorkflowArgs,
  GenerateROIArgs
} from '../../models/mcp';
import { Workflow } from '../../models/workflow';

describe('AI Agent Pipeline Accuracy Validation', () => {
  let server: PMAgentMCPServer;
  let pipeline: AIAgentPipeline;

  beforeEach(() => {
    const options: MCPServerOptions = {
      enableLogging: false,
      enableMetrics: true
    };
    
    server = new PMAgentMCPServer(options);
    pipeline = new AIAgentPipeline();
  });

  describe('Quota Estimation Accuracy', () => {
    it('should provide accurate quota estimates for known workflow patterns', async () => {
      const testCases = [
        {
          name: 'Simple CRUD API',
          intent: 'Create a REST API with user authentication, CRUD operations for posts, and basic validation',
          expectedVibeRange: { min: 8, max: 20 },
          expectedSpecRange: { min: 2, max: 8 },
          expectedSavingsRange: { min: 10, max: 40 }
        },
        {
          name: 'Data Processing Pipeline',
          intent: 'Build a data processing system that ingests CSV files, validates data, transforms records, and stores in database',
          expectedVibeRange: { min: 15, max: 35 },
          expectedSpecRange: { min: 3, max: 10 },
          expectedSavingsRange: { min: 15, max: 50 }
        },
        {
          name: 'E-commerce Platform',
          intent: 'Create an e-commerce platform with product catalog, shopping cart, payment processing, order management, and inventory tracking',
          expectedVibeRange: { min: 30, max: 70 },
          expectedSpecRange: { min: 8, max: 20 },
          expectedSavingsRange: { min: 20, max: 60 }
        }
      ];

      for (const testCase of testCases) {
        const args: OptimizeIntentArgs = {
          intent: testCase.intent,
          parameters: {
            expectedUserVolume: 1000,
            performanceSensitivity: 'medium'
          }
        };

        const context: MCPToolContext = {
          toolName: 'optimize_intent',
          sessionId: `quota-accuracy-${testCase.name.toLowerCase().replace(/\s+/g, '-')}`,
          timestamp: Date.now()
        };

        const result = await server.handleOptimizeIntent(args, context);
        expect(result.isError).toBeFalsy();

        const responseData = result.content[0].json;
        const efficiencySummary = responseData.data.efficiencySummary;

        // Validate naive approach estimates
        expect(efficiencySummary.naiveApproach.vibesConsumed).toBeGreaterThanOrEqual(testCase.expectedVibeRange.min);
        expect(efficiencySummary.naiveApproach.vibesConsumed).toBeLessThanOrEqual(testCase.expectedVibeRange.max);
        expect(efficiencySummary.naiveApproach.specsConsumed).toBeGreaterThanOrEqual(testCase.expectedSpecRange.min);
        expect(efficiencySummary.naiveApproach.specsConsumed).toBeLessThanOrEqual(testCase.expectedSpecRange.max);

        // Validate optimization provides expected savings
        const actualSavings = efficiencySummary.savings.totalSavingsPercentage;
        expect(actualSavings).toBeGreaterThanOrEqual(testCase.expectedSavingsRange.min);
        expect(actualSavings).toBeLessThanOrEqual(testCase.expectedSavingsRange.max);

        // Validate optimized approach is better than naive
        expect(efficiencySummary.optimizedApproach.vibesConsumed).toBeLessThan(efficiencySummary.naiveApproach.vibesConsumed);
        expect(efficiencySummary.optimizedApproach.estimatedCost).toBeLessThan(efficiencySummary.naiveApproach.estimatedCost);

        console.log(`${testCase.name} Accuracy Results:
          Naive Vibes: ${efficiencySummary.naiveApproach.vibesConsumed} (expected: ${testCase.expectedVibeRange.min}-${testCase.expectedVibeRange.max})
          Naive Specs: ${efficiencySummary.naiveApproach.specsConsumed} (expected: ${testCase.expectedSpecRange.min}-${testCase.expectedSpecRange.max})
          Savings: ${actualSavings.toFixed(1)}% (expected: ${testCase.expectedSavingsRange.min}-${testCase.expectedSavingsRange.max}%)`);
      }
    });

    it('should scale quota estimates appropriately with user volume', async () => {
      const baseIntent = 'Create a notification service with email, SMS, and push notification capabilities';
      const volumeTestCases = [
        { volume: 100, expectedMultiplier: 1.0 },
        { volume: 1000, expectedMultiplier: 1.2 },
        { volume: 10000, expectedMultiplier: 1.5 },
        { volume: 100000, expectedMultiplier: 2.0 }
      ];

      const baselineResult = await server.handleOptimizeIntent({
        intent: baseIntent,
        parameters: {
          expectedUserVolume: volumeTestCases[0].volume,
          performanceSensitivity: 'medium'
        }
      }, {
        toolName: 'optimize_intent',
        sessionId: 'volume-scaling-baseline',
        timestamp: Date.now()
      });

      expect(baselineResult.isError).toBeFalsy();
      const baselineData = baselineResult.content[0].json;
      const baselineVibes = baselineData.data.efficiencySummary.naiveApproach.vibesConsumed;

      for (let i = 1; i < volumeTestCases.length; i++) {
        const testCase = volumeTestCases[i];
        
        const result = await server.handleOptimizeIntent({
          intent: baseIntent,
          parameters: {
            expectedUserVolume: testCase.volume,
            performanceSensitivity: 'medium'
          }
        }, {
          toolName: 'optimize_intent',
          sessionId: `volume-scaling-${testCase.volume}`,
          timestamp: Date.now()
        });

        expect(result.isError).toBeFalsy();
        const responseData = result.content[0].json;
        const actualVibes = responseData.data.efficiencySummary.naiveApproach.vibesConsumed;
        const actualMultiplier = actualVibes / baselineVibes;

        // Allow 30% variance in scaling
        expect(actualMultiplier).toBeGreaterThanOrEqual(testCase.expectedMultiplier * 0.7);
        expect(actualMultiplier).toBeLessThanOrEqual(testCase.expectedMultiplier * 1.3);

        console.log(`Volume ${testCase.volume}: ${actualVibes} vibes (${actualMultiplier.toFixed(2)}x baseline, expected: ${testCase.expectedMultiplier}x)`);
      }
    });

    it('should adjust estimates based on performance sensitivity', async () => {
      const intent = 'Build a real-time chat application with message history, user presence, and file sharing';
      const sensitivityLevels = ['low', 'medium', 'high'] as const;
      const results = [];

      for (const sensitivity of sensitivityLevels) {
        const args: OptimizeIntentArgs = {
          intent,
          parameters: {
            expectedUserVolume: 5000,
            performanceSensitivity: sensitivity
          }
        };

        const context: MCPToolContext = {
          toolName: 'optimize_intent',
          sessionId: `sensitivity-${sensitivity}`,
          timestamp: Date.now()
        };

        const result = await server.handleOptimizeIntent(args, context);
        expect(result.isError).toBeFalsy();

        const responseData = result.content[0].json;
        const efficiencySummary = responseData.data.efficiencySummary;

        results.push({
          sensitivity,
          vibesConsumed: efficiencySummary.naiveApproach.vibesConsumed,
          savingsPercentage: efficiencySummary.savings.totalSavingsPercentage,
          optimizationCount: efficiencySummary.optimizationNotes.length
        });
      }

      // Validate that high sensitivity leads to more optimization
      const lowSensitivity = results.find(r => r.sensitivity === 'low')!;
      const highSensitivity = results.find(r => r.sensitivity === 'high')!;

      expect(highSensitivity.savingsPercentage).toBeGreaterThanOrEqual(lowSensitivity.savingsPercentage);
      expect(highSensitivity.optimizationCount).toBeGreaterThanOrEqual(lowSensitivity.optimizationCount);

      console.log('Performance Sensitivity Results:');
      results.forEach(result => {
        console.log(`  ${result.sensitivity}: ${result.vibesConsumed} vibes, ${result.savingsPercentage.toFixed(1)}% savings, ${result.optimizationCount} optimizations`);
      });
    });
  });

  describe('Consulting Analysis Accuracy', () => {
    it('should select appropriate consulting techniques based on problem domain', async () => {
      const domainTestCases = [
        {
          domain: 'Strategic Planning',
          intent: 'Design a 5-year digital transformation roadmap for a traditional manufacturing company',
          expectedTechniques: ['MECE', 'ValueDriverTree'],
          shouldNotInclude: []
        },
        {
          domain: 'Process Optimization',
          intent: 'Optimize the order fulfillment process to reduce delivery time and costs',
          expectedTechniques: ['ValueDriverTree', 'ImpactEffort'],
          shouldNotInclude: []
        },
        {
          domain: 'Technical Architecture',
          intent: 'Design a microservices architecture for a high-traffic e-commerce platform',
          expectedTechniques: ['MECE', 'ImpactEffort'],
          shouldNotInclude: []
        },
        {
          domain: 'Cost Optimization',
          intent: 'Reduce cloud infrastructure costs while maintaining performance and reliability',
          expectedTechniques: ['ValueDriverTree', 'ZeroBased'],
          shouldNotInclude: []
        }
      ];

      for (const testCase of domainTestCases) {
        const args: OptimizeIntentArgs = {
          intent: testCase.intent,
          parameters: {
            expectedUserVolume: 2000,
            performanceSensitivity: 'medium'
          }
        };

        const context: MCPToolContext = {
          toolName: 'optimize_intent',
          sessionId: `domain-${testCase.domain.toLowerCase().replace(/\s+/g, '-')}`,
          timestamp: Date.now()
        };

        const result = await server.handleOptimizeIntent(args, context);
        expect(result.isError).toBeFalsy();

        const responseData = result.content[0].json;
        const consultingSummary = responseData.data.enhancedKiroSpec.consultingSummary;
        const appliedTechniques = consultingSummary.techniquesApplied.map((t: any) => t.techniqueName);

        // Validate expected techniques are applied
        testCase.expectedTechniques.forEach(expectedTechnique => {
          expect(appliedTechniques).toContain(expectedTechnique);
        });

        // Validate techniques that shouldn't be included
        testCase.shouldNotInclude.forEach(excludedTechnique => {
          expect(appliedTechniques).not.toContain(excludedTechnique);
        });

        // Validate technique count (should be 2-3 as per requirements)
        expect(appliedTechniques.length).toBeGreaterThanOrEqual(2);
        expect(appliedTechniques.length).toBeLessThanOrEqual(3);

        console.log(`${testCase.domain}: Applied techniques: ${appliedTechniques.join(', ')}`);
      }
    });

    it('should provide accurate MECE analysis breakdown', async () => {
      const workflow: Workflow = {
        id: 'mece-analysis-test',
        steps: [
          { id: 'user-input', type: 'vibe', description: 'Collect user input', inputs: [], outputs: ['input-data'], quotaCost: 3 },
          { id: 'validation', type: 'vibe', description: 'Validate input data', inputs: ['input-data'], outputs: ['validated-data'], quotaCost: 4 },
          { id: 'business-logic', type: 'vibe', description: 'Apply business rules', inputs: ['validated-data'], outputs: ['processed-data'], quotaCost: 8 },
          { id: 'data-storage', type: 'spec', description: 'Store processed data', inputs: ['processed-data'], outputs: ['stored-data'], quotaCost: 2 },
          { id: 'notification', type: 'vibe', description: 'Send notifications', inputs: ['stored-data'], outputs: [], quotaCost: 5 },
          { id: 'audit-log', type: 'spec', description: 'Log audit trail', inputs: ['stored-data'], outputs: [], quotaCost: 1 }
        ],
        dataFlow: [],
        estimatedComplexity: 6
      };

      const args: AnalyzeWorkflowArgs = {
        workflow,
        techniques: ['MECE']
      };

      const context: MCPToolContext = {
        toolName: 'analyze_workflow',
        sessionId: 'mece-analysis-test',
        timestamp: Date.now()
      };

      const result = await server.handleAnalyzeWorkflow(args, context);
      expect(result.isError).toBeFalsy();

      const markdownContent = result.content[0].markdown!;

      // Validate MECE categories are present
      expect(markdownContent).toContain('MECE');
      expect(markdownContent).toContain('Input Processing'); // Should categorize input-related steps
      expect(markdownContent).toContain('Business Logic'); // Should categorize processing steps
      expect(markdownContent).toContain('Output Operations'); // Should categorize output steps

      // Validate quota breakdown is accurate
      const totalQuotaCost = workflow.steps.reduce((sum, step) => sum + step.quotaCost, 0);
      expect(markdownContent).toContain(totalQuotaCost.toString()); // Should mention total quota cost

      // Validate optimization opportunities are identified
      expect(markdownContent).toContain('optimization'); // Should mention optimization opportunities
      expect(markdownContent).toContain('batching'); // Should identify batching opportunities
    });

    it('should provide accurate Value Driver Tree analysis', async () => {
      const complexWorkflow: Workflow = {
        id: 'value-driver-analysis',
        steps: [
          { id: 'api-call-1', type: 'vibe', description: 'Fetch customer data', inputs: [], outputs: ['customer-data'], quotaCost: 5 },
          { id: 'api-call-2', type: 'vibe', description: 'Fetch product catalog', inputs: [], outputs: ['products'], quotaCost: 6 },
          { id: 'api-call-3', type: 'vibe', description: 'Fetch pricing rules', inputs: [], outputs: ['pricing'], quotaCost: 4 },
          { id: 'calculation', type: 'vibe', description: 'Calculate personalized prices', inputs: ['customer-data', 'products', 'pricing'], outputs: ['calculated-prices'], quotaCost: 10 },
          { id: 'recommendation', type: 'vibe', description: 'Generate product recommendations', inputs: ['customer-data', 'products'], outputs: ['recommendations'], quotaCost: 12 },
          { id: 'formatting', type: 'spec', description: 'Format response', inputs: ['calculated-prices', 'recommendations'], outputs: ['response'], quotaCost: 2 }
        ],
        dataFlow: [],
        estimatedComplexity: 8
      };

      const args: AnalyzeWorkflowArgs = {
        workflow: complexWorkflow,
        techniques: ['ValueDriverTree']
      };

      const context: MCPToolContext = {
        toolName: 'analyze_workflow',
        sessionId: 'value-driver-analysis',
        timestamp: Date.now()
      };

      const result = await server.handleAnalyzeWorkflow(args, context);
      expect(result.isError).toBeFalsy();

      const markdownContent = result.content[0].markdown!;

      // Validate Value Driver Tree analysis
      expect(markdownContent).toContain('ValueDriverTree');
      expect(markdownContent).toContain('Primary Drivers'); // Should identify primary cost drivers
      expect(markdownContent).toContain('API calls'); // Should identify API calls as major cost driver
      expect(markdownContent).toContain('ML processing'); // Should identify ML/recommendation as cost driver

      // Validate cost breakdown
      const highCostSteps = complexWorkflow.steps.filter(step => step.quotaCost >= 10);
      highCostSteps.forEach(step => {
        expect(markdownContent.toLowerCase()).toContain(step.description.toLowerCase().split(' ')[0]); // Should mention high-cost operations
      });

      // Validate optimization suggestions
      expect(markdownContent).toContain('caching'); // Should suggest caching for repeated API calls
      expect(markdownContent).toContain('batching'); // Should suggest batching for multiple API calls
    });

    it('should provide accurate ROI calculations across scenarios', async () => {
      const testWorkflow: Workflow = {
        id: 'roi-calculation-test',
        steps: [
          { id: 'step-1', type: 'vibe', description: 'Data ingestion', inputs: [], outputs: ['data'], quotaCost: 8 },
          { id: 'step-2', type: 'vibe', description: 'Data processing', inputs: ['data'], outputs: ['processed'], quotaCost: 12 },
          { id: 'step-3', type: 'vibe', description: 'Analysis', inputs: ['processed'], outputs: ['results'], quotaCost: 15 },
          { id: 'step-4', type: 'spec', description: 'Report generation', inputs: ['results'], outputs: ['report'], quotaCost: 3 }
        ],
        dataFlow: [],
        estimatedComplexity: 5
      };

      const args: GenerateROIArgs = {
        workflow: testWorkflow
      };

      const context: MCPToolContext = {
        toolName: 'generate_roi_analysis',
        sessionId: 'roi-calculation-test',
        timestamp: Date.now()
      };

      const result = await server.handleGenerateROI(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const roiAnalysis = responseData.data.roiAnalysis;

      // Validate ROI scenarios
      expect(roiAnalysis.scenarios).toHaveLength(2); // Should have at least current and optimized scenarios
      
      const currentScenario = roiAnalysis.scenarios.find((s: any) => s.name.toLowerCase().includes('conservative') || s.name.toLowerCase().includes('current'));
      const optimizedScenario = roiAnalysis.scenarios.find((s: any) => s.name.toLowerCase().includes('balanced') || s.name.toLowerCase().includes('optimized'));
      
      expect(currentScenario).toBeDefined();
      expect(optimizedScenario).toBeDefined();

      // Validate quota calculations
      const totalQuotaCost = testWorkflow.steps.reduce((sum, step) => sum + step.quotaCost, 0);
      expect(currentScenario.forecast.vibesConsumed + currentScenario.forecast.specsConsumed).toBeGreaterThanOrEqual(totalQuotaCost * 0.8);
      expect(currentScenario.forecast.vibesConsumed + currentScenario.forecast.specsConsumed).toBeLessThanOrEqual(totalQuotaCost * 1.2);

      // Validate optimization provides savings
      expect(optimizedScenario.savingsPercentage).toBeGreaterThan(0);
      expect(optimizedScenario.savingsPercentage).toBeLessThan(80); // Should be realistic
      expect(optimizedScenario.forecast.estimatedCost).toBeLessThan(currentScenario.forecast.estimatedCost);

      // Validate cost calculations are consistent
      expect(currentScenario.forecast.estimatedCost).toBeGreaterThan(0);
      expect(optimizedScenario.forecast.estimatedCost).toBeGreaterThan(0);

      console.log(`ROI Analysis Results:
        Current Cost: $${currentScenario.forecast.estimatedCost.toFixed(2)}
        Optimized Cost: $${optimizedScenario.forecast.estimatedCost.toFixed(2)}
        Savings: ${optimizedScenario.savingsPercentage.toFixed(1)}%`);
    });
  });

  describe('Spec Format Accuracy', () => {
    it('should generate complete and valid Kiro spec structure', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Create a customer support ticketing system with user authentication, ticket management, and reporting dashboard',
        parameters: {
          expectedUserVolume: 2000,
          performanceSensitivity: 'medium'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'spec-structure-validation',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const enhancedKiroSpec = responseData.data.enhancedKiroSpec;

      // Validate required Kiro spec fields
      expect(enhancedKiroSpec.name).toBeDefined();
      expect(typeof enhancedKiroSpec.name).toBe('string');
      expect(enhancedKiroSpec.name.length).toBeGreaterThan(5);

      expect(enhancedKiroSpec.description).toBeDefined();
      expect(typeof enhancedKiroSpec.description).toBe('string');
      expect(enhancedKiroSpec.description.length).toBeGreaterThan(20);

      expect(enhancedKiroSpec.requirements).toBeDefined();
      expect(Array.isArray(enhancedKiroSpec.requirements)).toBe(true);
      expect(enhancedKiroSpec.requirements.length).toBeGreaterThan(0);

      expect(enhancedKiroSpec.design).toBeDefined();
      expect(enhancedKiroSpec.design.overview).toBeDefined();
      expect(typeof enhancedKiroSpec.design.overview).toBe('string');

      expect(enhancedKiroSpec.tasks).toBeDefined();
      expect(Array.isArray(enhancedKiroSpec.tasks)).toBe(true);
      expect(enhancedKiroSpec.tasks.length).toBeGreaterThan(0);

      // Validate enhanced fields
      expect(enhancedKiroSpec.consultingSummary).toBeDefined();
      expect(enhancedKiroSpec.roiAnalysis).toBeDefined();
      expect(enhancedKiroSpec.alternativeOptions).toBeDefined();

      // Validate metadata
      expect(enhancedKiroSpec.metadata).toBeDefined();
      expect(enhancedKiroSpec.metadata.originalIntent).toBe(args.intent);
      expect(enhancedKiroSpec.metadata.optimizationApplied).toBeDefined();
      expect(Array.isArray(enhancedKiroSpec.metadata.optimizationApplied)).toBe(true);
      expect(enhancedKiroSpec.metadata.consultingTechniquesUsed).toBeDefined();
      expect(Array.isArray(enhancedKiroSpec.metadata.consultingTechniquesUsed)).toBe(true);

      // Validate requirements structure
      enhancedKiroSpec.requirements.forEach((req: any) => {
        expect(req.description).toBeDefined();
        expect(typeof req.description).toBe('string');
        expect(req.priority).toBeDefined();
      });

      // Validate tasks structure
      enhancedKiroSpec.tasks.forEach((task: any) => {
        expect(task.description).toBeDefined();
        expect(typeof task.description).toBe('string');
        expect(task.description.length).toBeGreaterThan(5);
      });

      console.log(`Spec Structure Validation:
        Name: "${enhancedKiroSpec.name}"
        Requirements: ${enhancedKiroSpec.requirements.length}
        Tasks: ${enhancedKiroSpec.tasks.length}
        Consulting Techniques: ${enhancedKiroSpec.metadata.consultingTechniquesUsed.length}
        Optimizations: ${enhancedKiroSpec.metadata.optimizationApplied.length}`);
    });

    it('should maintain consistency between requirements and tasks', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Build an inventory management system with product tracking, stock alerts, supplier management, and reporting',
        parameters: {
          expectedUserVolume: 1500,
          performanceSensitivity: 'medium'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'consistency-validation',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const enhancedKiroSpec = responseData.data.enhancedKiroSpec;

      // Extract key concepts from requirements
      const requirementTexts = enhancedKiroSpec.requirements.map((req: any) => req.description.toLowerCase()).join(' ');
      const taskTexts = enhancedKiroSpec.tasks.map((task: any) => task.description.toLowerCase()).join(' ');

      // Key concepts that should appear in both requirements and tasks
      const keyConcepts = ['inventory', 'product', 'stock', 'supplier', 'report'];

      keyConcepts.forEach(concept => {
        if (requirementTexts.includes(concept)) {
          expect(taskTexts).toContain(concept); // If mentioned in requirements, should be addressed in tasks
        }
      });

      // Validate that tasks address the main intent components
      const intentComponents = ['inventory management', 'product tracking', 'stock alerts', 'supplier management', 'reporting'];
      let addressedComponents = 0;

      intentComponents.forEach(component => {
        const componentWords = component.split(' ');
        const isAddressed = componentWords.some(word => taskTexts.includes(word));
        if (isAddressed) {
          addressedComponents++;
        }
      });

      expect(addressedComponents).toBeGreaterThanOrEqual(Math.floor(intentComponents.length * 0.6)); // At least 60% of components should be addressed

      console.log(`Consistency Validation:
        Intent Components Addressed: ${addressedComponents}/${intentComponents.length}
        Requirements-Tasks Alignment: ${keyConcepts.filter(c => requirementTexts.includes(c) && taskTexts.includes(c)).length}/${keyConcepts.length} concepts`);
    });
  });
});