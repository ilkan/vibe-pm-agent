// Edge case and error scenario validation tests

import { PMAgentMCPServer } from '../../mcp/server';
import { 
  MCPServerOptions,
  MCPToolContext,
  OptimizeIntentArgs,
  AnalyzeWorkflowArgs,
  GenerateROIArgs,
  ConsultingSummaryArgs
} from '../../models/mcp';
import { Workflow } from '../../models/workflow';
import { ConsultingAnalysis } from '../../components/business-analyzer';

describe('Edge Case and Error Scenario Validation', () => {
  let server: PMAgentMCPServer;

  beforeEach(() => {
    const options: MCPServerOptions = {
      enableLogging: false,
      enableMetrics: true
    };
    
    server = new PMAgentMCPServer(options);
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle minimal valid intent', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Create API' // Minimal but valid intent
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'minimal-intent-test',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      
      // Should handle minimal intent gracefully
      expect(result.isError).toBeFalsy();
      expect(result.content[0].json.success).toBe(true);
      expect(result.content[0].json.data.enhancedKiroSpec.name).toBeDefined();
      expect(result.content[0].json.data.enhancedKiroSpec.description).toBeDefined();
    });

    it('should handle maximum length intent', async () => {
      // Create a very long but valid intent (near the 5000 character limit)
      const longIntent = `
        Create a comprehensive enterprise software platform that includes ${Array(100).fill('advanced').join(' ')} 
        features for managing complex business operations across multiple departments including 
        ${Array(50).fill('human resources, finance, operations, marketing, sales, customer service').join(', ')} 
        with integration capabilities for ${Array(30).fill('third-party systems').join(', ')} 
        and support for ${Array(20).fill('multiple languages, currencies, time zones').join(', ')} 
        while maintaining ${Array(25).fill('high security, performance, scalability, reliability').join(', ')} 
        standards and compliance with ${Array(15).fill('various industry regulations').join(', ')}.
      `.trim();

      const args: OptimizeIntentArgs = {
        intent: longIntent.substring(0, 4999), // Ensure it's under the limit
        parameters: {
          expectedUserVolume: 50000,
          performanceSensitivity: 'high'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'max-length-intent-test',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      
      // Should handle long intent without issues
      expect(result.isError).toBeFalsy();
      expect(result.content[0].json.success).toBe(true);
      expect(result.metadata?.executionTime).toBeLessThan(20000); // Should complete within reasonable time
    });

    it('should handle extreme parameter values', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Create a scalable system for massive user base',
        parameters: {
          expectedUserVolume: 1000000, // Maximum allowed value
          costConstraints: { maxCostDollars: 0.01 }, // Very low cost constraint
          performanceSensitivity: 'high'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'extreme-params-test',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      
      expect(result.isError).toBeFalsy();
      
      const responseData = result.content[0].json;
      const efficiencySummary = responseData.data.efficiencySummary;
      
      // Should respect extreme cost constraints
      expect(efficiencySummary.optimizedApproach.estimatedCost).toBeLessThanOrEqual(args.parameters!.costConstraints!.maxCostDollars! * 10); // Allow significant tolerance for extreme constraints
      
      // Should acknowledge high user volume in optimization
      const specContent = JSON.stringify(responseData.data.enhancedKiroSpec).toLowerCase();
      expect(specContent).toContain('scal'); // Should mention scalability
    });

    it('should handle workflow with no steps', async () => {
      const emptyWorkflow: Workflow = {
        id: 'empty-workflow',
        steps: [], // No steps
        dataFlow: [],
        estimatedComplexity: 0
      };

      const args: AnalyzeWorkflowArgs = {
        workflow: emptyWorkflow
      };

      const context: MCPToolContext = {
        toolName: 'analyze_workflow',
        sessionId: 'empty-workflow-test',
        timestamp: Date.now()
      };

      const result = await server.handleAnalyzeWorkflow(args, context);
      
      // Should handle empty workflow gracefully
      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown).toContain('No steps'); // Should indicate empty workflow
    });

    it('should handle workflow with circular dependencies', async () => {
      const circularWorkflow: Workflow = {
        id: 'circular-workflow',
        steps: [
          { id: 'step-1', type: 'vibe', description: 'Process A', inputs: ['output-c'], outputs: ['output-a'], quotaCost: 3 },
          { id: 'step-2', type: 'vibe', description: 'Process B', inputs: ['output-a'], outputs: ['output-b'], quotaCost: 4 },
          { id: 'step-3', type: 'vibe', description: 'Process C', inputs: ['output-b'], outputs: ['output-c'], quotaCost: 2 }
        ],
        dataFlow: [
          { from: 'step-1', to: 'step-2', dataType: 'output-a', required: true },
          { from: 'step-2', to: 'step-3', dataType: 'output-b', required: true },
          { from: 'step-3', to: 'step-1', dataType: 'output-c', required: true } // Circular dependency
        ],
        estimatedComplexity: 3
      };

      const args: AnalyzeWorkflowArgs = {
        workflow: circularWorkflow
      };

      const context: MCPToolContext = {
        toolName: 'analyze_workflow',
        sessionId: 'circular-workflow-test',
        timestamp: Date.now()
      };

      const result = await server.handleAnalyzeWorkflow(args, context);
      
      expect(result.isError).toBeFalsy();
      expect(result.content[0].markdown).toContain('circular'); // Should identify circular dependency
    });

    it('should handle workflow with extremely high quota costs', async () => {
      const expensiveWorkflow: Workflow = {
        id: 'expensive-workflow',
        steps: [
          { id: 'expensive-step-1', type: 'vibe', description: 'Complex ML processing', inputs: [], outputs: ['ml-results'], quotaCost: 1000 },
          { id: 'expensive-step-2', type: 'vibe', description: 'Large data processing', inputs: ['ml-results'], outputs: ['processed-data'], quotaCost: 800 },
          { id: 'expensive-step-3', type: 'vibe', description: 'Advanced analytics', inputs: ['processed-data'], outputs: ['analytics'], quotaCost: 1200 }
        ],
        dataFlow: [],
        estimatedComplexity: 10
      };

      const args: GenerateROIArgs = {
        workflow: expensiveWorkflow
      };

      const context: MCPToolContext = {
        toolName: 'generate_roi_analysis',
        sessionId: 'expensive-workflow-test',
        timestamp: Date.now()
      };

      const result = await server.handleGenerateROI(args, context);
      
      expect(result.isError).toBeFalsy();
      
      const responseData = result.content[0].json;
      const roiAnalysis = responseData.data.roiAnalysis;
      
      // Should identify significant optimization opportunities for expensive workflows
      const optimizedScenario = roiAnalysis.scenarios.find((s: any) => s.name.toLowerCase().includes('optimized'));
      expect(optimizedScenario).toBeDefined();
      expect(optimizedScenario.savingsPercentage).toBeGreaterThan(30); // Should achieve significant savings
      
      // Should recommend cost reduction strategies
      expect(roiAnalysis.recommendations.some((rec: string) => 
        rec.toLowerCase().includes('cost') || rec.toLowerCase().includes('optim')
      )).toBe(true);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle malformed intent gracefully', async () => {
      const malformedIntents = [
        '', // Empty string
        '   ', // Only whitespace
        'a', // Too short
        '???', // Only special characters
        '123456789', // Only numbers
        'CREATE CREATE CREATE', // Repetitive
      ];

      for (const intent of malformedIntents) {
        const args: OptimizeIntentArgs = { intent };
        const context: MCPToolContext = {
          toolName: 'optimize_intent',
          sessionId: `malformed-test-${intent.length}`,
          timestamp: Date.now()
        };

        const result = await server.handleOptimizeIntent(args, context);
        
        // Should either succeed with basic processing or fail gracefully
        if (result.isError) {
          expect(result.content[0].json.error).toBe(true);
          expect(result.content[0].json.message).toBeDefined();
        } else {
          expect(result.content[0].json.success).toBe(true);
        }
      }
    });

    it('should handle invalid parameter combinations', async () => {
      const invalidParameterSets = [
        {
          expectedUserVolume: -100, // Negative value
          performanceSensitivity: 'medium' as const
        },
        {
          expectedUserVolume: 1000000000, // Extremely high value
          costConstraints: { maxCostDollars: -50 } // Negative cost
        },
        {
          costConstraints: { maxCostDollars: 0 }, // Zero cost constraint
          performanceSensitivity: 'invalid' as any // Invalid enum value
        }
      ];

      for (const parameters of invalidParameterSets) {
        const args: OptimizeIntentArgs = {
          intent: 'Create a test system',
          parameters
        };

        const context: MCPToolContext = {
          toolName: 'optimize_intent',
          sessionId: `invalid-params-test-${Date.now()}`,
          timestamp: Date.now()
        };

        const result = await server.handleOptimizeIntent(args, context);
        
        // Should handle invalid parameters gracefully
        if (result.isError) {
          expect(result.content[0].json.message).toContain('parameter'); // Should mention parameter issue
        } else {
          // If it succeeds, should have applied reasonable defaults
          expect(result.content[0].json.success).toBe(true);
        }
      }
    });

    it('should handle corrupted workflow data', async () => {
      const corruptedWorkflows = [
        {
          id: null, // Null ID
          steps: [{ id: 'step-1', type: 'vibe', description: 'Test', inputs: [], outputs: [], quotaCost: 5 }],
          dataFlow: [],
          estimatedComplexity: 1
        },
        {
          id: 'test-workflow',
          steps: [
            { id: '', type: 'vibe', description: '', inputs: null, outputs: undefined, quotaCost: -5 } // Invalid step data
          ],
          dataFlow: null,
          estimatedComplexity: 'invalid'
        },
        {
          id: 'test-workflow',
          steps: [
            { id: 'step-1', type: 'invalid-type' as any, description: 'Test', inputs: [], outputs: [], quotaCost: 'invalid' as any }
          ],
          dataFlow: [],
          estimatedComplexity: 1
        }
      ];

      for (const workflow of corruptedWorkflows) {
        const args: AnalyzeWorkflowArgs = {
          workflow: workflow as any
        };

        const context: MCPToolContext = {
          toolName: 'analyze_workflow',
          sessionId: `corrupted-workflow-test-${Date.now()}`,
          timestamp: Date.now()
        };

        const result = await server.handleAnalyzeWorkflow(args, context);
        
        // Should handle corrupted data gracefully
        if (result.isError) {
          expect(result.content[0].json.error).toBe(true);
          expect(result.content[0].json.message).toBeDefined();
        } else {
          // If it succeeds, should have handled the corruption
          expect(result.content[0].type).toBe('markdown');
        }
      }
    });

    it('should handle memory pressure scenarios', async () => {
      // Create a workflow with many steps to simulate memory pressure
      const largeWorkflow: Workflow = {
        id: 'memory-pressure-test',
        steps: Array.from({ length: 1000 }, (_, index) => ({
          id: `step-${index}`,
          type: index % 2 === 0 ? 'vibe' : 'spec',
          description: `Processing step ${index} with complex operations and data transformations`,
          inputs: index > 0 ? [`output-${index - 1}`] : [],
          outputs: [`output-${index}`],
          quotaCost: Math.floor(Math.random() * 10) + 1
        })),
        dataFlow: Array.from({ length: 999 }, (_, index) => ({
          from: `step-${index}`,
          to: `step-${index + 1}`,
          dataType: `output-${index}`,
          required: true
        })),
        estimatedComplexity: 1000
      };

      const args: AnalyzeWorkflowArgs = {
        workflow: largeWorkflow,
        techniques: ['MECE', 'ValueDriverTree', 'ImpactEffort'] // Apply multiple techniques
      };

      const context: MCPToolContext = {
        toolName: 'analyze_workflow',
        sessionId: 'memory-pressure-test',
        timestamp: Date.now()
      };

      const startTime = Date.now();
      const result = await server.handleAnalyzeWorkflow(args, context);
      const executionTime = Date.now() - startTime;

      // Should handle large workflows without crashing
      expect(result.isError).toBeFalsy();
      expect(executionTime).toBeLessThan(30000); // Should complete within 30 seconds even for large workflows
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown).toContain('1000'); // Should reference the large number of steps
    });

    it('should handle concurrent error scenarios', async () => {
      const errorProneRequests = [
        {
          intent: '', // Empty intent
          sessionId: 'error-concurrent-1'
        },
        {
          intent: 'Create system',
          parameters: { expectedUserVolume: -1000 }, // Invalid parameter
          sessionId: 'error-concurrent-2'
        },
        {
          intent: 'a'.repeat(6000), // Too long intent
          sessionId: 'error-concurrent-3'
        },
        {
          intent: null as any, // Null intent
          sessionId: 'error-concurrent-4'
        },
        {
          intent: 'Valid intent for testing error isolation',
          sessionId: 'error-concurrent-5'
        }
      ];

      const requests = errorProneRequests.map((req, index) => {
        const args: OptimizeIntentArgs = {
          intent: req.intent,
          parameters: req.parameters
        };

        const context: MCPToolContext = {
          toolName: 'optimize_intent',
          sessionId: req.sessionId,
          timestamp: Date.now(),
          requestId: `error-req-${index}`,
          traceId: `error-trace-${index}`
        };

        return server.handleOptimizeIntent(args, context);
      });

      const results = await Promise.all(requests);

      // Should handle all requests without crashing
      expect(results).toHaveLength(errorProneRequests.length);
      
      // At least one request should succeed (the valid one)
      const successfulResults = results.filter(result => !result.isError);
      expect(successfulResults.length).toBeGreaterThan(0);
      
      // Error results should have proper error format
      const errorResults = results.filter(result => result.isError);
      errorResults.forEach(result => {
        expect(result.content[0].json.error).toBe(true);
        expect(result.content[0].json.message).toBeDefined();
        expect(result.metadata?.executionTime).toBeDefined();
      });
    });
  });

  describe('Resource Limits and Constraints', () => {
    it('should respect processing time limits', async () => {
      const timeIntensiveIntent = `
        Create an extremely complex system with hundreds of microservices, 
        thousands of API endpoints, complex data relationships, advanced ML pipelines,
        real-time processing, complex business rules, multiple integrations,
        advanced security, compliance requirements, and global scalability.
      `;

      const args: OptimizeIntentArgs = {
        intent: timeIntensiveIntent,
        parameters: {
          expectedUserVolume: 1000000,
          costConstraints: { maxCostDollars: 10000 },
          performanceSensitivity: 'high'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'time-limit-test',
        timestamp: Date.now()
      };

      const startTime = Date.now();
      const result = await server.handleOptimizeIntent(args, context);
      const executionTime = Date.now() - startTime;

      // Should complete within reasonable time even for complex intents
      expect(executionTime).toBeLessThan(25000); // 25 second limit
      expect(result.isError).toBeFalsy();
      expect(result.metadata?.executionTime).toBeLessThan(25000);
    });

    it('should handle quota calculation edge cases', async () => {
      const edgeCaseWorkflow: Workflow = {
        id: 'quota-edge-case',
        steps: [
          { id: 'zero-cost', type: 'spec', description: 'Zero cost operation', inputs: [], outputs: ['data'], quotaCost: 0 },
          { id: 'high-cost', type: 'vibe', description: 'Very expensive operation', inputs: ['data'], outputs: ['result'], quotaCost: 999999 },
          { id: 'fractional-cost', type: 'vibe', description: 'Fractional cost', inputs: ['result'], outputs: ['final'], quotaCost: 0.1 }
        ],
        dataFlow: [],
        estimatedComplexity: 3
      };

      const args: GenerateROIArgs = {
        workflow: edgeCaseWorkflow
      };

      const context: MCPToolContext = {
        toolName: 'generate_roi_analysis',
        sessionId: 'quota-edge-case-test',
        timestamp: Date.now()
      };

      const result = await server.handleGenerateROI(args, context);
      
      expect(result.isError).toBeFalsy();
      
      const responseData = result.content[0].json;
      const roiAnalysis = responseData.data.roiAnalysis;
      
      // Should handle edge cases in quota calculations
      expect(roiAnalysis.scenarios).toHaveLength(2); // Should have at least 2 scenarios
      
      const currentScenario = roiAnalysis.scenarios[0];
      expect(currentScenario.forecast.vibesConsumed).toBeGreaterThan(0); // Should handle zero and fractional costs
      expect(currentScenario.forecast.estimatedCost).toBeGreaterThan(0);
      expect(currentScenario.forecast.estimatedCost).toBeLessThan(Infinity); // Should not overflow
    });

    it('should handle analysis with insufficient data', async () => {
      const minimalAnalysis: ConsultingAnalysis = {
        techniquesUsed: [], // No techniques
        keyFindings: [], // No findings
        totalQuotaSavings: 0, // No savings
        implementationComplexity: 'low'
      };

      const args: ConsultingSummaryArgs = {
        analysis: minimalAnalysis,
        techniques: [] // No specific techniques requested
      };

      const context: MCPToolContext = {
        toolName: 'get_consulting_summary',
        sessionId: 'insufficient-data-test',
        timestamp: Date.now()
      };

      const result = await server.handleConsultingSummary(args, context);
      
      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown).toContain('No'); // Should indicate insufficient data
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain data consistency across multiple tool calls', async () => {
      const baseIntent = 'Create a user management system with authentication and authorization';
      
      // First call: optimize intent
      const optimizeArgs: OptimizeIntentArgs = {
        intent: baseIntent,
        parameters: {
          expectedUserVolume: 1000,
          performanceSensitivity: 'medium'
        }
      };

      const optimizeContext: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'consistency-test',
        timestamp: Date.now()
      };

      const optimizeResult = await server.handleOptimizeIntent(optimizeArgs, optimizeContext);
      expect(optimizeResult.isError).toBeFalsy();

      // Extract workflow from the result for subsequent analysis
      const enhancedSpec = optimizeResult.content[0].json.data.enhancedKiroSpec;
      
      // Create a workflow based on the spec for analysis
      const derivedWorkflow: Workflow = {
        id: 'derived-from-spec',
        steps: [
          { id: 'auth-step', type: 'vibe', description: 'User authentication', inputs: [], outputs: ['auth-token'], quotaCost: 3 },
          { id: 'authz-step', type: 'vibe', description: 'Authorization check', inputs: ['auth-token'], outputs: ['permissions'], quotaCost: 2 },
          { id: 'user-mgmt', type: 'spec', description: 'User management operations', inputs: ['permissions'], outputs: ['user-data'], quotaCost: 4 }
        ],
        dataFlow: [],
        estimatedComplexity: 3
      };

      // Second call: analyze the derived workflow
      const analyzeArgs: AnalyzeWorkflowArgs = {
        workflow: derivedWorkflow
      };

      const analyzeContext: MCPToolContext = {
        toolName: 'analyze_workflow',
        sessionId: 'consistency-test',
        timestamp: Date.now()
      };

      const analyzeResult = await server.handleAnalyzeWorkflow(analyzeArgs, analyzeContext);
      expect(analyzeResult.isError).toBeFalsy();

      // Third call: generate ROI for the workflow
      const roiArgs: GenerateROIArgs = {
        workflow: derivedWorkflow
      };

      const roiContext: MCPToolContext = {
        toolName: 'generate_roi_analysis',
        sessionId: 'consistency-test',
        timestamp: Date.now()
      };

      const roiResult = await server.handleGenerateROI(roiArgs, roiContext);
      expect(roiResult.isError).toBeFalsy();

      // Validate consistency across calls
      const roiData = roiResult.content[0].json.data.roiAnalysis;
      const totalWorkflowCost = derivedWorkflow.steps.reduce((sum, step) => sum + step.quotaCost, 0);
      
      // ROI analysis should reflect the workflow costs
      const currentScenario = roiData.scenarios.find((s: any) => s.name.toLowerCase().includes('current') || s.name.toLowerCase().includes('naive'));
      expect(currentScenario).toBeDefined();
      expect(currentScenario.forecast.vibesConsumed + currentScenario.forecast.specsConsumed).toBeGreaterThanOrEqual(totalWorkflowCost * 0.8);
    });

    it('should validate cross-tool data integrity', async () => {
      const testWorkflow: Workflow = {
        id: 'integrity-test-workflow',
        steps: [
          { id: 'step-1', type: 'vibe', description: 'Data processing', inputs: [], outputs: ['processed'], quotaCost: 5 },
          { id: 'step-2', type: 'spec', description: 'Data storage', inputs: ['processed'], outputs: [], quotaCost: 2 }
        ],
        dataFlow: [
          { from: 'step-1', to: 'step-2', dataType: 'processed', required: true }
        ],
        estimatedComplexity: 2
      };

      // Analyze workflow
      const analyzeResult = await server.handleAnalyzeWorkflow({
        workflow: testWorkflow,
        techniques: ['MECE']
      }, {
        toolName: 'analyze_workflow',
        sessionId: 'integrity-test',
        timestamp: Date.now()
      });

      expect(analyzeResult.isError).toBeFalsy();

      // Generate ROI for same workflow
      const roiResult = await server.handleGenerateROI({
        workflow: testWorkflow
      }, {
        toolName: 'generate_roi_analysis',
        sessionId: 'integrity-test',
        timestamp: Date.now()
      });

      expect(roiResult.isError).toBeFalsy();

      // Both should reference the same workflow characteristics
      const analyzeContent = analyzeResult.content[0].markdown;
      const roiData = roiResult.content[0].json.data.roiAnalysis;

      // Should both reference the total quota cost (7 = 5 + 2)
      expect(analyzeContent).toContain('7'); // Total quota cost
      
      const totalQuotaFromROI = roiData.scenarios[0].forecast.vibesConsumed + roiData.scenarios[0].forecast.specsConsumed;
      expect(totalQuotaFromROI).toBeGreaterThanOrEqual(7 * 0.9); // Allow some variance
    });
  });
});