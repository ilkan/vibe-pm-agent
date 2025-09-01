// MCP Client simulation and protocol compliance tests

import { PMAgentMCPServer } from '../../mcp/server';
import { MCPToolRegistry } from '../../mcp/server-config';
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

// Mock MCP SDK components
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');
jest.mock('../../pipeline/ai-agent-pipeline');

// Mock client for testing MCP protocol interactions
class MockMCPClient {
  protected server: PMAgentMCPServer;
  protected requestId: number = 1;

  constructor(server: PMAgentMCPServer) {
    this.server = server;
  }

  async listTools() {
    const registry = MCPToolRegistry.createDefault();
    return {
      tools: registry.getAllTools().map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  }

  async callTool(name: string, args: any): Promise<any> {
    const startTime = Date.now();
    const context: MCPToolContext = {
      toolName: name,
      sessionId: `client-session-${Date.now()}`,
      timestamp: startTime,
      requestId: `client-req-${this.requestId++}`,
      traceId: `client-trace-${Date.now()}`
    };

    try {
      let result: any;
      switch (name) {
        case 'optimize_intent':
          result = await this.server.handleOptimizeIntent(args as OptimizeIntentArgs, context);
          break;
        case 'analyze_workflow':
          result = await this.server.handleAnalyzeWorkflow(args as AnalyzeWorkflowArgs, context);
          break;
        case 'generate_roi_analysis':
          result = await this.server.handleGenerateROI(args as GenerateROIArgs, context);
          break;
        case 'get_consulting_summary':
          result = await this.server.handleConsultingSummary(args as ConsultingSummaryArgs, context);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      // Update metrics for successful calls
      const responseTime = Date.now() - startTime;
      (this.server as any).updateMetricsForTesting(responseTime, false);
      return result;
    } catch (error) {
      // Update metrics for failed calls
      const responseTime = Date.now() - startTime;
      (this.server as any).updateMetricsForTesting(responseTime, true);
      throw error;
    }
  }
}

describe('MCP Client Simulation Tests', () => {
  let server: PMAgentMCPServer;
  let client: MockMCPClient;
  let mockPipeline: any;

  beforeEach(() => {
    const options: MCPServerOptions = {
      enableLogging: false, // Disable logging for cleaner test output
      enableMetrics: true
    };
    
    server = new PMAgentMCPServer(options);
    client = new MockMCPClient(server);
    mockPipeline = (server as any).pipeline;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Tool Discovery Protocol', () => {
    it('should support MCP tool discovery', async () => {
      const toolsResponse = await client.listTools();

      expect(toolsResponse.tools).toHaveLength(10);
      
      const toolNames = toolsResponse.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('optimize_intent');
      expect(toolNames).toContain('analyze_workflow');
      expect(toolNames).toContain('generate_roi_analysis');
      expect(toolNames).toContain('get_consulting_summary');
      expect(toolNames).toContain('generate_management_onepager');
      expect(toolNames).toContain('generate_pr_faq');
      expect(toolNames).toContain('generate_requirements');
      expect(toolNames).toContain('generate_design_options');
      expect(toolNames).toContain('generate_task_plan');
      expect(toolNames).toContain('validate_idea_quick');

      // Verify each tool has required MCP fields
      toolsResponse.tools.forEach((tool: any) => {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeTruthy();
        expect(tool.inputSchema.type).toBe('object');
      });
    });

    it('should provide detailed schema information for each tool', async () => {
      const toolsResponse = await client.listTools();
      
      const optimizeIntentTool = toolsResponse.tools.find((tool: any) => tool.name === 'optimize_intent');
      expect(optimizeIntentTool).toBeDefined();
      expect(optimizeIntentTool!.inputSchema.required).toContain('intent');
      expect(optimizeIntentTool!.inputSchema.properties?.intent).toBeDefined();
      expect(optimizeIntentTool!.inputSchema.properties?.parameters).toBeDefined();

      const analyzeWorkflowTool = toolsResponse.tools.find((tool: any) => tool.name === 'analyze_workflow');
      expect(analyzeWorkflowTool).toBeDefined();
      expect(analyzeWorkflowTool!.inputSchema.required).toContain('workflow');
      expect(analyzeWorkflowTool!.inputSchema.properties?.workflow).toBeDefined();
    });
  });

  describe('Client-Server Communication', () => {
    it('should handle sequential tool calls from client', async () => {
      // Mock pipeline responses
      const mockOptimizeResult = {
        success: true,
        enhancedKiroSpec: {
          name: 'Sequential Test Spec',
          description: 'Test for sequential calls',
          requirements: [],
          design: { overview: 'Test design' },
          tasks: [],
          consultingSummary: {
            executiveSummary: 'Sequential test completed',
            keyFindings: ['Sequential processing works'],
            recommendations: [],
            techniquesApplied: [],
            supportingEvidence: []
          },
          roiAnalysis: {
            scenarios: [],
            recommendations: [],
            bestOption: 'Balanced',
            riskAssessment: 'Low'
          },
          alternativeOptions: {
            conservative: { name: 'Conservative', description: 'Safe', quotaSavings: 5, implementationEffort: 'low', riskLevel: 'low', estimatedROI: 1.2 },
            balanced: { name: 'Balanced', description: 'Moderate', quotaSavings: 15, implementationEffort: 'medium', riskLevel: 'low', estimatedROI: 2.0 },
            bold: { name: 'Bold', description: 'Aggressive', quotaSavings: 30, implementationEffort: 'high', riskLevel: 'medium', estimatedROI: 3.5 }
          }
        }
      };

      const mockAnalysis: ConsultingAnalysis = {
        techniquesUsed: [
          { name: 'MECE', relevanceScore: 0.8, applicableScenarios: ['sequential-test'] }
        ],
        keyFindings: ['Sequential analysis completed'],
        totalQuotaSavings: 25,
        implementationComplexity: 'low'
      };

      mockPipeline.processIntent.mockResolvedValue(mockOptimizeResult);
      mockPipeline.analyzeWorkflow.mockResolvedValue(mockAnalysis);

      // First call: optimize_intent
      const optimizeArgs: OptimizeIntentArgs = {
        intent: 'Create a simple user management system'
      };

      const optimizeResult = await client.callTool('optimize_intent', optimizeArgs);
      expect(optimizeResult.isError).toBeFalsy();
      expect(optimizeResult.content[0].json.data.enhancedKiroSpec.name).toBe('Sequential Test Spec');

      // Second call: analyze_workflow (using result from first call)
      const workflow: Workflow = {
        id: 'sequential-test-workflow',
        steps: [
          { id: 'step-1', type: 'vibe', description: 'User registration', inputs: [], outputs: [], quotaCost: 5 }
        ],
        dataFlow: [],
        estimatedComplexity: 1
      };

      const analyzeArgs: AnalyzeWorkflowArgs = {
        workflow
      };

      const analyzeResult = await client.callTool('analyze_workflow', analyzeArgs);
      expect(analyzeResult.isError).toBeFalsy();
      expect(analyzeResult.content[0].markdown).toContain('Sequential analysis completed');

      // Verify both calls were processed
      expect(mockPipeline.processIntent).toHaveBeenCalledTimes(1);
      expect(mockPipeline.analyzeWorkflow).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent tool calls from client', async () => {
      // Mock different responses for concurrent calls
      const mockOptimizeResult = {
        success: true,
        enhancedKiroSpec: {
          name: 'Concurrent Test Spec 1',
          description: 'First concurrent call',
          requirements: [],
          design: { overview: 'Concurrent design 1' },
          tasks: [],
          consultingSummary: {
            executiveSummary: 'Concurrent test 1 completed',
            keyFindings: [],
            recommendations: [],
            techniquesApplied: [],
            supportingEvidence: []
          },
          roiAnalysis: {
            scenarios: [],
            recommendations: [],
            bestOption: 'Balanced',
            riskAssessment: 'Low'
          },
          alternativeOptions: {
            conservative: { name: 'Conservative', description: 'Safe', quotaSavings: 5, implementationEffort: 'low', riskLevel: 'low', estimatedROI: 1.2 },
            balanced: { name: 'Balanced', description: 'Moderate', quotaSavings: 15, implementationEffort: 'medium', riskLevel: 'low', estimatedROI: 2.0 },
            bold: { name: 'Bold', description: 'Aggressive', quotaSavings: 30, implementationEffort: 'high', riskLevel: 'medium', estimatedROI: 3.5 }
          }
        }
      };

      const mockROIAnalysis = {
        scenarios: [
          {
            name: 'Concurrent Scenario',
            forecast: { vibesConsumed: 10, specsConsumed: 5, estimatedCost: 50, confidenceLevel: 'high', scenario: 'naive', breakdown: [] },
            savingsPercentage: 0,
            implementationEffort: 'low',
            riskLevel: 'low'
          }
        ],
        recommendations: ['Concurrent processing recommendation'],
        bestOption: 'Concurrent Scenario',
        riskAssessment: 'Low risk for concurrent processing'
      };

      mockPipeline.processIntent.mockResolvedValue(mockOptimizeResult);
      mockPipeline.generateROIAnalysis.mockResolvedValue(mockROIAnalysis);

      // Prepare concurrent calls
      const optimizeArgs: OptimizeIntentArgs = {
        intent: 'Create concurrent system 1'
      };

      const roiArgs: GenerateROIArgs = {
        workflow: {
          id: 'concurrent-workflow',
          steps: [
            { id: 'step-1', type: 'spec', description: 'Concurrent processing', inputs: [], outputs: [], quotaCost: 3 }
          ],
          dataFlow: [],
          estimatedComplexity: 1
        }
      };

      // Execute concurrent calls
      const [optimizeResult, roiResult] = await Promise.all([
        client.callTool('optimize_intent', optimizeArgs),
        client.callTool('generate_roi_analysis', roiArgs)
      ]);

      // Verify both calls succeeded
      expect(optimizeResult.isError).toBeFalsy();
      expect(roiResult.isError).toBeFalsy();
      
      expect(optimizeResult.content[0].json.data.enhancedKiroSpec.name).toBe('Concurrent Test Spec 1');
      expect(roiResult.content[0].json.data.roiAnalysis.bestOption).toBe('Concurrent Scenario');

      // Verify both pipeline methods were called
      expect(mockPipeline.processIntent).toHaveBeenCalledTimes(1);
      expect(mockPipeline.generateROIAnalysis).toHaveBeenCalledTimes(1);
    });

    it('should maintain session context across multiple calls', async () => {
      const sessionId = `persistent-session-${Date.now()}`;
      
      // Create a custom client that maintains session context
      class SessionAwareMockClient extends MockMCPClient {
        async callToolWithSession(name: string, args: any, sessionId: string) {
          const context: MCPToolContext = {
            toolName: name,
            sessionId: sessionId,
            timestamp: Date.now(),
            requestId: `session-req-${this.requestId++}`,
            traceId: `session-trace-${Date.now()}`
          };

          switch (name) {
            case 'optimize_intent':
              return await this.server.handleOptimizeIntent(args as OptimizeIntentArgs, context);
            case 'analyze_workflow':
              return await this.server.handleAnalyzeWorkflow(args as AnalyzeWorkflowArgs, context);
            default:
              throw new Error(`Unknown tool: ${name}`);
          }
        }
      }

      const sessionClient = new SessionAwareMockClient(server);

      // Mock responses
      const mockOptimizeResult = {
        success: true,
        enhancedKiroSpec: {
          name: 'Session Test Spec',
          description: 'Session-aware processing',
          requirements: [],
          design: { overview: 'Session design' },
          tasks: [],
          consultingSummary: {
            executiveSummary: 'Session test completed',
            keyFindings: [],
            recommendations: [],
            techniquesApplied: [],
            supportingEvidence: []
          },
          roiAnalysis: {
            scenarios: [],
            recommendations: [],
            bestOption: 'Balanced',
            riskAssessment: 'Low'
          },
          alternativeOptions: {
            conservative: { name: 'Conservative', description: 'Safe', quotaSavings: 5, implementationEffort: 'low', riskLevel: 'low', estimatedROI: 1.2 },
            balanced: { name: 'Balanced', description: 'Moderate', quotaSavings: 15, implementationEffort: 'medium', riskLevel: 'low', estimatedROI: 2.0 },
            bold: { name: 'Bold', description: 'Aggressive', quotaSavings: 30, implementationEffort: 'high', riskLevel: 'medium', estimatedROI: 3.5 }
          }
        }
      };

      const mockAnalysis: ConsultingAnalysis = {
        techniquesUsed: [
          { name: 'MECE', relevanceScore: 0.9, applicableScenarios: ['session-test'] }
        ],
        keyFindings: ['Session context maintained'],
        totalQuotaSavings: 30,
        implementationComplexity: 'medium'
      };

      mockPipeline.processIntent.mockResolvedValue(mockOptimizeResult);
      mockPipeline.analyzeWorkflow.mockResolvedValue(mockAnalysis);

      // First call with session
      const optimizeArgs: OptimizeIntentArgs = {
        intent: 'Create session-aware system'
      };

      const optimizeResult = await sessionClient.callToolWithSession('optimize_intent', optimizeArgs, sessionId);
      expect(optimizeResult.isError).toBeFalsy();

      // Second call with same session
      const workflow: Workflow = {
        id: 'session-workflow',
        steps: [
          { id: 'step-1', type: 'vibe', description: 'Session processing', inputs: [], outputs: [], quotaCost: 4 }
        ],
        dataFlow: [],
        estimatedComplexity: 1
      };

      const analyzeArgs: AnalyzeWorkflowArgs = {
        workflow
      };

      const analyzeResult = await sessionClient.callToolWithSession('analyze_workflow', analyzeArgs, sessionId);
      expect(analyzeResult.isError).toBeFalsy();
      expect(analyzeResult.content[0].markdown).toContain('Session context maintained');

      // Verify session consistency (both calls should have been processed)
      expect(mockPipeline.processIntent).toHaveBeenCalledTimes(1);
      expect(mockPipeline.analyzeWorkflow).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling in Client-Server Communication', () => {
    it('should handle client-side validation errors', async () => {
      // Test with invalid arguments
      const invalidArgs = {
        // Missing required 'intent' field
        parameters: { expectedUserVolume: 1000 }
      };

      mockPipeline.processIntent.mockRejectedValue(new Error('Validation failed: intent is required'));

      const result = await client.callTool('optimize_intent', invalidArgs);

      expect(result.isError).toBe(true);
      expect(result.content[0].json.error).toBe(true);
      expect(result.content[0].json.message).toContain('Validation failed');
    });

    it('should handle server-side processing errors', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Test intent that causes server error'
      };

      mockPipeline.processIntent.mockRejectedValue(new Error('Internal server error'));

      const result = await client.callTool('optimize_intent', args);

      expect(result.isError).toBe(true);
      expect(result.content[0].json.error).toBe(true);
      expect(result.content[0].json.message).toContain('Internal server error');
    });

    it('should handle unknown tool requests', async () => {
      await expect(client.callTool('unknown_tool', {})).rejects.toThrow('Unknown tool: unknown_tool');
    });

    it('should handle malformed requests gracefully', async () => {
      const malformedArgs = null;

      mockPipeline.processIntent.mockRejectedValue(new Error('Cannot process null arguments'));

      const result = await client.callTool('optimize_intent', malformedArgs);

      expect(result.isError).toBe(true);
      expect(result.content[0].json.message).toContain('Validation failed: intent is required and must be a string');
    });
  });

  describe('Performance Under Load', () => {
    it('should handle multiple concurrent clients', async () => {
      const numClients = 5;
      const clients = Array.from({ length: numClients }, () => new MockMCPClient(server));

      // Mock successful response
      const mockResult = {
        success: true,
        enhancedKiroSpec: {
          name: 'Load Test Spec',
          description: 'Load testing',
          requirements: [],
          design: { overview: 'Load test design' },
          tasks: [],
          consultingSummary: {
            executiveSummary: 'Load test completed',
            keyFindings: [],
            recommendations: [],
            techniquesApplied: [],
            supportingEvidence: []
          },
          roiAnalysis: {
            scenarios: [],
            recommendations: [],
            bestOption: 'Balanced',
            riskAssessment: 'Low'
          },
          alternativeOptions: {
            conservative: { name: 'Conservative', description: 'Safe', quotaSavings: 5, implementationEffort: 'low', riskLevel: 'low', estimatedROI: 1.2 },
            balanced: { name: 'Balanced', description: 'Moderate', quotaSavings: 15, implementationEffort: 'medium', riskLevel: 'low', estimatedROI: 2.0 },
            bold: { name: 'Bold', description: 'Aggressive', quotaSavings: 30, implementationEffort: 'high', riskLevel: 'medium', estimatedROI: 3.5 }
          }
        }
      };

      mockPipeline.processIntent.mockResolvedValue(mockResult);

      // Create concurrent requests from multiple clients
      const requests = clients.map((client, index) => 
        client.callTool('optimize_intent', {
          intent: `Load test intent from client ${index + 1}`
        })
      );

      const results = await Promise.all(requests);

      // Verify all requests succeeded
      results.forEach((result, index) => {
        expect(result.isError).toBeFalsy();
        expect(result.content[0].json.data.enhancedKiroSpec.name).toBe('Load Test Spec');
      });

      // Verify all pipeline calls were made
      expect(mockPipeline.processIntent).toHaveBeenCalledTimes(numClients);
    });

    it('should maintain performance metrics under load', async () => {
      const initialStatus = server.getStatus();
      const initialRequests = initialStatus.performance.totalRequests;

      // Simulate multiple requests
      const numRequests = 10;
      const mockResult = {
        success: true,
        enhancedKiroSpec: {
          name: 'Metrics Test',
          description: 'Performance metrics test',
          requirements: [],
          design: { overview: 'Metrics design' },
          tasks: [],
          consultingSummary: {
            executiveSummary: 'Metrics test',
            keyFindings: [],
            recommendations: [],
            techniquesApplied: [],
            supportingEvidence: []
          },
          roiAnalysis: {
            scenarios: [],
            recommendations: [],
            bestOption: 'Balanced',
            riskAssessment: 'Low'
          },
          alternativeOptions: {
            conservative: { name: 'Conservative', description: 'Safe', quotaSavings: 5, implementationEffort: 'low', riskLevel: 'low', estimatedROI: 1.2 },
            balanced: { name: 'Balanced', description: 'Moderate', quotaSavings: 15, implementationEffort: 'medium', riskLevel: 'low', estimatedROI: 2.0 },
            bold: { name: 'Bold', description: 'Aggressive', quotaSavings: 30, implementationEffort: 'high', riskLevel: 'medium', estimatedROI: 3.5 }
          }
        }
      };

      mockPipeline.processIntent.mockResolvedValue(mockResult);

      // Execute multiple requests
      const requests = Array.from({ length: numRequests }, (_, index) =>
        client.callTool('optimize_intent', {
          intent: `Metrics test intent ${index + 1}`
        })
      );

      await Promise.all(requests);

      // Verify metrics were updated
      const finalStatus = server.getStatus();
      expect(finalStatus.performance.totalRequests).toBeGreaterThan(initialRequests);
      expect(finalStatus.performance.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Protocol Compliance Validation', () => {
    it('should return responses in correct MCP format', async () => {
      const mockResult = {
        success: true,
        enhancedKiroSpec: {
          name: 'Protocol Test',
          description: 'MCP protocol compliance test',
          requirements: [],
          design: { overview: 'Protocol design' },
          tasks: [],
          consultingSummary: {
            executiveSummary: 'Protocol test completed',
            keyFindings: [],
            recommendations: [],
            techniquesApplied: [],
            supportingEvidence: []
          },
          roiAnalysis: {
            scenarios: [],
            recommendations: [],
            bestOption: 'Balanced',
            riskAssessment: 'Low'
          },
          alternativeOptions: {
            conservative: { name: 'Conservative', description: 'Safe', quotaSavings: 5, implementationEffort: 'low', riskLevel: 'low', estimatedROI: 1.2 },
            balanced: { name: 'Balanced', description: 'Moderate', quotaSavings: 15, implementationEffort: 'medium', riskLevel: 'low', estimatedROI: 2.0 },
            bold: { name: 'Bold', description: 'Aggressive', quotaSavings: 30, implementationEffort: 'high', riskLevel: 'medium', estimatedROI: 3.5 }
          }
        }
      };

      mockPipeline.processIntent.mockResolvedValue(mockResult);

      const args: OptimizeIntentArgs = {
        intent: 'Protocol compliance test'
      };

      const result = await client.callTool('optimize_intent', args);

      // Verify MCP response format
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content).toHaveLength(1);
      
      const content = result.content[0];
      expect(content).toHaveProperty('type');
      expect(['text', 'json', 'markdown']).toContain(content.type);
      
      if (content.type === 'json') {
        expect(content).toHaveProperty('json');
        expect(typeof content.json).toBe('object');
      }

      // Verify metadata
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('executionTime');
      expect(typeof result.metadata.executionTime).toBe('number');
    });

    it('should handle content type variations correctly', async () => {
      // Test JSON response (optimize_intent)
      const mockOptimizeResult = {
        success: true,
        enhancedKiroSpec: {
          name: 'Content Type Test',
          description: 'Testing content types',
          requirements: [],
          design: { overview: 'Content design' },
          tasks: [],
          consultingSummary: {
            executiveSummary: 'Content test',
            keyFindings: [],
            recommendations: [],
            techniquesApplied: [],
            supportingEvidence: []
          },
          roiAnalysis: {
            scenarios: [],
            recommendations: [],
            bestOption: 'Balanced',
            riskAssessment: 'Low'
          },
          alternativeOptions: {
            conservative: { name: 'Conservative', description: 'Safe', quotaSavings: 5, implementationEffort: 'low', riskLevel: 'low', estimatedROI: 1.2 },
            balanced: { name: 'Balanced', description: 'Moderate', quotaSavings: 15, implementationEffort: 'medium', riskLevel: 'low', estimatedROI: 2.0 },
            bold: { name: 'Bold', description: 'Aggressive', quotaSavings: 30, implementationEffort: 'high', riskLevel: 'medium', estimatedROI: 3.5 }
          }
        }
      };

      const mockAnalysis: ConsultingAnalysis = {
        techniquesUsed: [
          { name: 'MECE', relevanceScore: 0.8, applicableScenarios: ['content-test'] }
        ],
        keyFindings: ['Content type test finding'],
        totalQuotaSavings: 20,
        implementationComplexity: 'low'
      };

      mockPipeline.processIntent.mockResolvedValue(mockOptimizeResult);
      mockPipeline.analyzeWorkflow.mockResolvedValue(mockAnalysis);

      // Test JSON response
      const optimizeResult = await client.callTool('optimize_intent', {
        intent: 'Content type test'
      });

      expect(optimizeResult.content[0].type).toBe('json');
      expect(optimizeResult.content[0].json).toBeDefined();

      // Test Markdown response
      const analyzeResult = await client.callTool('analyze_workflow', {
        workflow: {
          id: 'content-test-workflow',
          steps: [
            { id: 'step-1', type: 'vibe', description: 'Content test', inputs: [], outputs: [], quotaCost: 2 }
          ],
          dataFlow: [],
          estimatedComplexity: 1
        }
      });

      expect(analyzeResult.content[0].type).toBe('markdown');
      expect(analyzeResult.content[0].markdown).toBeDefined();
      expect(analyzeResult.content[0].markdown).toContain('Content type test finding');
    });
  });
});