// Integration tests for MCP Server error handling and response formatting

import { PMAgentMCPServer } from '../../mcp/server';
import { MCPToolRegistry } from '../../mcp/server-config';
import { 
  MCPServerOptions, 
  MCPToolContext,
  OptimizeIntentArgs,
  AnalyzeWorkflowArgs,
  GenerateROIArgs,
  ConsultingSummaryArgs,
  LogLevel
} from '../../models/mcp';
import { Workflow } from '../../models/workflow';
import { ConsultingAnalysis } from '../../components/business-analyzer';
import { MCPLogger } from '../../utils/mcp-error-handling';

// Mock the AIAgentPipeline
jest.mock('../../main', () => ({
  AIAgentPipeline: jest.fn().mockImplementation(() => ({
    processIntent: jest.fn(),
    analyzeWorkflow: jest.fn(),
    generateROIAnalysis: jest.fn(),
    generateConsultingSummary: jest.fn()
  }))
}));

describe('MCP Server Error Handling Integration', () => {
  let server: PMAgentMCPServer;
  let mockPipeline: any;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Set up console spies to capture logging
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Initialize server with logging enabled
    const options: MCPServerOptions = {
      enableLogging: true,
      enableMetrics: true
    };
    
    server = new PMAgentMCPServer(options);
    mockPipeline = (server as any).pipeline;
    
    // Set debug logging for comprehensive test coverage
    MCPLogger.setLogLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Tool Input Validation', () => {
    const mockContext: MCPToolContext = {
      toolName: 'optimize_intent',
      sessionId: 'test-session',
      timestamp: Date.now(),
      requestId: 'test-request',
      traceId: 'test-trace'
    };

    it('should handle missing required parameters', async () => {
      const invalidArgs = {} as OptimizeIntentArgs; // Missing required 'intent' field

      const result = await server.handleOptimizeIntent(invalidArgs, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json.error).toBe(true);
      expect(result.content[0].json.message).toBeDefined();
      expect(result.metadata?.executionTime).toBeDefined();
    });

    it('should handle invalid parameter types', async () => {
      const invalidArgs: OptimizeIntentArgs = {
        intent: '', // Too short based on schema
        parameters: {
          expectedUserVolume: -1, // Invalid negative value
          performanceSensitivity: 'invalid' as any // Invalid enum value
        }
      };

      // Mock pipeline to simulate validation at the handler level
      mockPipeline.processIntent.mockRejectedValue(
        new Error('Invalid parameters: intent too short, expectedUserVolume must be positive')
      );

      const result = await server.handleOptimizeIntent(invalidArgs, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].json.error).toBe(true);
      expect(result.content[0].json.message).toContain('Invalid parameters');
    });

    it('should validate workflow structure for analyze_workflow', async () => {
      const invalidWorkflow = {
        // Missing required 'id' and 'steps' fields
        dataFlow: [],
        estimatedComplexity: 1
      } as unknown as Workflow;

      const args: AnalyzeWorkflowArgs = {
        workflow: invalidWorkflow
      };

      const mockContext: MCPToolContext = {
        toolName: 'analyze_workflow',
        sessionId: 'test-session',
        timestamp: Date.now()
      };

      mockPipeline.analyzeWorkflow.mockRejectedValue(
        new Error('Invalid workflow: missing required fields')
      );

      const result = await server.handleAnalyzeWorkflow(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].json.message).toBeDefined();
    });
  });

  describe('Pipeline Error Handling', () => {
    it('should handle pipeline timeout errors', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Create a complex system with many components'
      };

      const mockContext: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'test-session',
        timestamp: Date.now()
      };

      // Simulate timeout error
      mockPipeline.processIntent.mockRejectedValue(
        new Error('Request timeout: Processing took too long')
      );

      const result = await server.handleOptimizeIntent(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].json.error).toBe(true);
      expect(result.content[0].json.message).toContain('timeout');
      
      // Verify error logging
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"ERROR"')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('optimize_intent handler failed')
      );
    });

    it('should handle pipeline resource exhaustion', async () => {
      const args: GenerateROIArgs = {
        workflow: {
          id: 'test-workflow',
          steps: [
            { id: 'step-1', type: 'vibe', description: 'Process', inputs: [], outputs: [], quotaCost: 10 }
          ],
          dataFlow: [],
          estimatedComplexity: 1
        }
      };

      const mockContext: MCPToolContext = {
        toolName: 'generate_roi_analysis',
        sessionId: 'test-session',
        timestamp: Date.now()
      };

      // Simulate resource exhaustion
      mockPipeline.generateROIAnalysis.mockRejectedValue(
        new Error('Insufficient resources: Too many concurrent requests')
      );

      const result = await server.handleGenerateROI(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].json.message).toContain('Insufficient resources');
    });

    it('should handle pipeline internal errors', async () => {
      const mockAnalysis: ConsultingAnalysis = {
        techniquesUsed: [],
        keyFindings: [],
        totalQuotaSavings: 0,
        implementationComplexity: 'low'
      };

      const args: ConsultingSummaryArgs = {
        analysis: mockAnalysis
      };

      const mockContext: MCPToolContext = {
        toolName: 'get_consulting_summary',
        sessionId: 'test-session',
        timestamp: Date.now()
      };

      // Simulate internal pipeline error
      mockPipeline.generateConsultingSummary.mockRejectedValue(
        new Error('Internal error: Failed to process consulting techniques')
      );

      const result = await server.handleConsultingSummary(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].json.error).toBe(true);
      expect(result.content[0].json.message).toContain('Internal error');
    });
  });

  describe('Response Formatting', () => {
    it('should format successful responses with proper metadata', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Create a simple user registration system',
        parameters: {
          expectedUserVolume: 100,
          performanceSensitivity: 'medium'
        }
      };

      const mockContext: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'test-session',
        timestamp: Date.now()
      };

      const mockResult = {
        success: true,
        enhancedKiroSpec: {
          name: 'User Registration System',
          description: 'Simple registration',
          requirements: [],
          design: { overview: 'Test design' },
          tasks: [],
          consultingSummary: {
            executiveSummary: 'Test summary',
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
        },
        efficiencySummary: {
          naiveApproach: { vibesConsumed: 10, specsConsumed: 2, estimatedCost: 50, confidenceLevel: 'medium', scenario: 'naive', breakdown: [] },
          optimizedApproach: { vibesConsumed: 5, specsConsumed: 4, estimatedCost: 30, confidenceLevel: 'high', scenario: 'optimized', breakdown: [] },
          savings: { vibeReduction: 50, specReduction: -100, costSavings: 40, totalSavingsPercentage: 40 },
          optimizationNotes: ['Applied batching']
        }
      };

      mockPipeline.processIntent.mockResolvedValue(mockResult);

      const result = await server.handleOptimizeIntent(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json.success).toBe(true);
      expect(result.content[0].json.data).toBeDefined();
      expect(result.content[0].json.data.enhancedKiroSpec).toBeDefined();
      expect(result.content[0].json.data.metadata).toBeDefined();
      expect(result.content[0].json.data.metadata.processingTime).toBeDefined();
      expect(result.content[0].json.data.metadata.intentLength).toBe(args.intent.length);
      expect(result.metadata?.executionTime).toBeDefined();
      expect(result.metadata?.quotaUsed).toBeDefined();
    });

    it('should format workflow analysis as markdown', async () => {
      const mockWorkflow: Workflow = {
        id: 'test-workflow',
        steps: [
          { id: 'step-1', type: 'vibe', description: 'Analyze', inputs: [], outputs: [], quotaCost: 5 }
        ],
        dataFlow: [],
        estimatedComplexity: 1
      };

      const args: AnalyzeWorkflowArgs = {
        workflow: mockWorkflow,
        techniques: ['MECE', 'ValueDriverTree']
      };

      const mockContext: MCPToolContext = {
        toolName: 'analyze_workflow',
        sessionId: 'test-session',
        timestamp: Date.now()
      };

      const mockAnalysis: ConsultingAnalysis = {
        techniquesUsed: [
          { name: 'MECE', relevanceScore: 0.9, applicableScenarios: ['analysis'] }
        ],
        keyFindings: ['Optimization opportunity found'],
        totalQuotaSavings: 25,
        implementationComplexity: 'medium'
      };

      mockPipeline.analyzeWorkflow.mockResolvedValue(mockAnalysis);

      const result = await server.handleAnalyzeWorkflow(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown).toBeDefined();
      expect(result.content[0].markdown).toContain('Additional Data');
      expect(result.content[0].markdown).toContain('Optimization opportunity found');
    });

    it('should include proper content type headers and metadata', async () => {
      const mockAnalysis: ConsultingAnalysis = {
        techniquesUsed: [
          { name: 'Pyramid', relevanceScore: 0.8, applicableScenarios: ['communication'] }
        ],
        keyFindings: ['Clear structure needed'],
        totalQuotaSavings: 15,
        implementationComplexity: 'low'
      };

      const args: ConsultingSummaryArgs = {
        analysis: mockAnalysis,
        techniques: ['Pyramid']
      };

      const mockContext: MCPToolContext = {
        toolName: 'get_consulting_summary',
        sessionId: 'test-session',
        timestamp: Date.now()
      };

      const mockSummary = {
        executiveSummary: 'Analysis shows clear optimization path',
        keyFindings: ['Structure improvements needed'],
        recommendations: [],
        techniquesApplied: [],
        supportingEvidence: []
      };

      mockPipeline.generateConsultingSummary.mockResolvedValue(mockSummary);

      const result = await server.handleConsultingSummary(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown).toContain('Analysis shows clear optimization path');
      expect(result.metadata?.executionTime).toBeDefined();
      expect(result.metadata?.quotaUsed).toBe(1);
    });
  });

  describe('Logging and Monitoring', () => {
    it('should log tool execution start and completion', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Test intent for logging'
      };

      const mockContext: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'test-session',
        timestamp: Date.now()
      };

      const mockResult = {
        success: true,
        enhancedKiroSpec: {
          name: 'Test Spec',
          description: 'Test',
          requirements: [],
          design: { overview: 'Test' },
          tasks: [],
          consultingSummary: {
            executiveSummary: 'Test',
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

      await server.handleOptimizeIntent(args, mockContext);

      // Verify debug logging for processing start
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"DEBUG"')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Processing intent optimization')
      );

      // Verify info logging for completion
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"INFO"')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Intent optimization completed successfully')
      );
    });

    it('should log errors with proper context and stack traces', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Test intent that will fail'
      };

      const mockContext: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'test-session',
        timestamp: Date.now()
      };

      const testError = new Error('Pipeline processing failed');
      testError.stack = 'Error stack trace here';

      mockPipeline.processIntent.mockRejectedValue(testError);

      await server.handleOptimizeIntent(args, mockContext);

      // Verify error logging with context
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"ERROR"')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('optimize_intent handler failed')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"error":{')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Pipeline processing failed')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error stack trace here')
      );
    });

    it('should track performance metrics', async () => {
      const args: GenerateROIArgs = {
        workflow: {
          id: 'perf-test-workflow',
          steps: [
            { id: 'step-1', type: 'spec', description: 'Test', inputs: [], outputs: [], quotaCost: 3 }
          ],
          dataFlow: [],
          estimatedComplexity: 1
        }
      };

      const mockContext: MCPToolContext = {
        toolName: 'generate_roi_analysis',
        sessionId: 'test-session',
        timestamp: Date.now()
      };

      const mockROIAnalysis = {
        scenarios: [
          {
            name: 'Current',
            forecast: { vibesConsumed: 5, specsConsumed: 2, estimatedCost: 25, confidenceLevel: 'high', scenario: 'naive', breakdown: [] },
            savingsPercentage: 0,
            implementationEffort: 'none',
            riskLevel: 'none'
          }
        ],
        recommendations: ['Test recommendation'],
        bestOption: 'Current',
        riskAssessment: 'Low risk'
      };

      mockPipeline.generateROIAnalysis.mockResolvedValue(mockROIAnalysis);

      const result = await server.handleGenerateROI(args, mockContext);

      expect(result.metadata?.executionTime).toBeDefined();
      expect(result.metadata?.quotaUsed).toBe(2);

      // Verify performance logging
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"INFO"')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ROI analysis completed')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"scenarioCount":1')
      );
    });
  });

  describe('Server Status and Health', () => {
    it('should track server metrics correctly', () => {
      const status = server.getStatus();

      expect(status.status).toBe('healthy');
      expect(status.toolsRegistered).toBeGreaterThan(0);
      expect(status.performance).toBeDefined();
      expect(status.performance.totalRequests).toBeDefined();
      expect(status.performance.errorRate).toBeDefined();
      expect(status.performance.averageResponseTime).toBeDefined();
      expect(status.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should update metrics after tool executions', async () => {
      const initialStatus = server.getStatus();
      const initialRequests = initialStatus.performance.totalRequests;

      // Simulate metrics update by calling the private method through reflection
      const updateMetrics = (server as any).updateMetrics;
      updateMetrics.call(server, 150, false); // 150ms response time, no error

      const updatedStatus = server.getStatus();
      expect(updatedStatus.performance.totalRequests).toBeGreaterThan(initialRequests);
      expect(updatedStatus.performance.averageResponseTime).toBeGreaterThan(0);
      expect(updatedStatus.performance.errorRate).toBe(0);
    });
  });
});