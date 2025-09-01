// Unit tests for MCP quick validation tool handler

import { PMAgentMCPServer } from '../../mcp/server';
import { ValidateIdeaQuickArgs, MCPToolContext, MCPErrorCode } from '../../models/mcp';
import { QuickValidationResult } from '../../models/intent';

// Mock the AI Agent Pipeline
jest.mock('../../pipeline/ai-agent-pipeline', () => ({
  AIAgentPipeline: jest.fn().mockImplementation(() => ({
    validateIdeaQuick: jest.fn()
  }))
}));

// Mock MCP server config
jest.mock('../../mcp/server-config', () => ({
  MCP_SERVER_CONFIG: {
    name: 'test-server',
    version: '1.0.0',
    description: 'Test server',
    tools: []
  },
  MCPToolRegistry: {
    createDefault: jest.fn(() => ({
      getAllTools: jest.fn(() => []),
      getTool: jest.fn(),
      validateToolInput: jest.fn(() => ({ valid: true }))
    }))
  }
}));

// Mock MCP utilities
jest.mock('../../utils/mcp-error-handling', () => ({
  MCPErrorHandler: {
    createError: jest.fn((code, message, context) => new Error(`${code}: ${message}`)),
    createErrorResponse: jest.fn((error, context) => ({
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true
    }))
  },
  MCPResponseFormatter: {
    formatSuccess: jest.fn((data, format, metadata) => ({
      content: [{ type: format, text: typeof data === 'string' ? data : JSON.stringify(data) }],
      metadata
    }))
  },
  MCPLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    fatal: jest.fn(),
    setLogLevel: jest.fn(),
    logToolExecution: jest.fn()
  }
}));

describe('MCP Quick Validation Handler', () => {
  let server: PMAgentMCPServer;
  let mockPipeline: any;
  let mockContext: MCPToolContext;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    server = new PMAgentMCPServer({ enableLogging: false });
    mockPipeline = (server as any).pipeline;
    
    mockContext = {
      toolName: 'validate_idea_quick',
      sessionId: 'test-session-123',
      timestamp: Date.now(),
      requestId: 'req-123',
      traceId: 'trace-123'
    };
  });

  afterEach(async () => {
    // Clean up server resources to prevent hanging tests
    if (server) {
      try {
        await server.stop();
      } catch (error) {
        // Ignore cleanup errors in tests
      }
    }
  });

  describe('handleValidateIdeaQuick', () => {
    it('should handle successful quick validation with PASS verdict', async () => {
      // Arrange
      const args: ValidateIdeaQuickArgs = {
        idea: 'I want to create a simple dashboard to track user engagement metrics',
        context: {
          urgency: 'medium',
          budget_range: 'medium',
          team_size: 3
        }
      };

      const mockResult: QuickValidationResult = {
        verdict: 'PASS',
        reasoning: 'Clear objective with manageable complexity and quota usage',
        options: [
          {
            id: 'A',
            title: 'Quick Requirements',
            description: 'Generate structured requirements with MoSCoW prioritization',
            tradeoffs: ['Fast start', 'Basic structure', 'May need refinement'],
            nextStep: 'Run generate_requirements tool to create PM-grade requirements'
          },
          {
            id: 'B',
            title: 'Full Analysis',
            description: 'Complete optimization analysis with consulting techniques',
            tradeoffs: ['Comprehensive insights', 'Takes longer', 'Best ROI analysis'],
            nextStep: 'Run optimize_intent tool for complete consulting analysis'
          },
          {
            id: 'C',
            title: 'Design Options',
            description: 'Explore Conservative/Balanced/Bold design alternatives',
            tradeoffs: ['Strategic approach', 'Multiple paths', 'Informed decisions'],
            nextStep: 'Generate requirements first, then run generate_design_options'
          }
        ],
        processingTimeMs: 15
      };

      mockPipeline.validateIdeaQuick.mockResolvedValue(mockResult);

      // Act
      const result = await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      expect(mockPipeline.validateIdeaQuick).toHaveBeenCalledWith(args.idea, args.context);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('**Verdict:** PASS');
      expect(result.content[0].text).toContain('Clear objective with manageable complexity');
      expect(result.content[0].text).toContain('Option A: Quick Requirements');
      expect(result.content[0].text).toContain('Option B: Full Analysis');
      expect(result.content[0].text).toContain('Option C: Design Options');
      expect(result.metadata?.quotaUsed).toBe(1);
    });

    it('should handle successful quick validation with FAIL verdict', async () => {
      // Arrange
      const args: ValidateIdeaQuickArgs = {
        idea: 'Build something',
        context: {
          urgency: 'high',
          budget_range: 'small',
          team_size: 1
        }
      };

      const mockResult: QuickValidationResult = {
        verdict: 'FAIL',
        reasoning: 'Idea too vague or empty - needs more specific description',
        options: [
          {
            id: 'A',
            title: 'Simplify & Retry',
            description: 'Break down into smaller, clearer components',
            tradeoffs: ['Reduced scope', 'Faster validation', 'Lower risk'],
            nextStep: 'Rewrite idea focusing on one specific problem to solve'
          },
          {
            id: 'B',
            title: 'Add Context',
            description: 'Provide more details about objectives and constraints',
            tradeoffs: ['More upfront work', 'Better validation', 'Clearer direction'],
            nextStep: 'Specify business goal, success metrics, and resource constraints'
          },
          {
            id: 'C',
            title: 'Research First',
            description: 'Investigate similar solutions and best practices',
            tradeoffs: ['Delayed start', 'Better informed approach', 'Reduced risk'],
            nextStep: 'Study existing solutions and return with refined approach'
          }
        ],
        processingTimeMs: 8
      };

      mockPipeline.validateIdeaQuick.mockResolvedValue(mockResult);

      // Act
      const result = await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      expect(mockPipeline.validateIdeaQuick).toHaveBeenCalledWith(args.idea, args.context);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('**Verdict:** FAIL');
      expect(result.content[0].text).toContain('Idea too vague or empty');
      expect(result.content[0].text).toContain('Option A: Simplify & Retry');
      expect(result.content[0].text).toContain('Option B: Add Context');
      expect(result.content[0].text).toContain('Option C: Research First');
      expect(result.metadata?.quotaUsed).toBe(1);
    });

    it('should handle validation without context', async () => {
      // Arrange
      const args: ValidateIdeaQuickArgs = {
        idea: 'I need to automate our customer onboarding process to reduce manual work'
      };

      const mockResult: QuickValidationResult = {
        verdict: 'PASS',
        reasoning: 'Clear objective with manageable complexity and quota usage',
        options: [
          {
            id: 'A',
            title: 'Quick Requirements',
            description: 'Generate structured requirements with MoSCoW prioritization',
            tradeoffs: ['Fast start', 'Basic structure', 'May need refinement'],
            nextStep: 'Run generate_requirements tool to create PM-grade requirements'
          },
          {
            id: 'B',
            title: 'Full Analysis',
            description: 'Complete optimization analysis with consulting techniques',
            tradeoffs: ['Comprehensive insights', 'Takes longer', 'Best ROI analysis'],
            nextStep: 'Run optimize_intent tool for complete consulting analysis'
          },
          {
            id: 'C',
            title: 'Direct Implementation',
            description: 'Skip to task planning and start building',
            tradeoffs: ['Fastest execution', 'Skip analysis', 'Higher risk'],
            nextStep: 'Generate requirements and tasks, then start implementation'
          }
        ],
        processingTimeMs: 12
      };

      mockPipeline.validateIdeaQuick.mockResolvedValue(mockResult);

      // Act
      const result = await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      expect(mockPipeline.validateIdeaQuick).toHaveBeenCalledWith(args.idea, undefined);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('**Verdict:** PASS');
      expect(result.content[0].text).toContain('Option C: Direct Implementation');
    });

    it('should handle pipeline errors gracefully', async () => {
      // Arrange
      const args: ValidateIdeaQuickArgs = {
        idea: 'Test idea for error handling'
      };

      const mockError = new Error('Pipeline validation failed');
      mockPipeline.validateIdeaQuick.mockRejectedValue(mockError);

      // Act
      const result = await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      expect(mockPipeline.validateIdeaQuick).toHaveBeenCalledWith(args.idea, undefined);
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain('Error: Pipeline validation failed');
    });

    it('should log appropriate debug and info messages', async () => {
      // Arrange
      const args: ValidateIdeaQuickArgs = {
        idea: 'Create a monitoring system for API performance',
        context: {
          urgency: 'low',
          budget_range: 'large',
          team_size: 5
        }
      };

      const mockResult: QuickValidationResult = {
        verdict: 'PASS',
        reasoning: 'Clear objective with manageable complexity and quota usage',
        options: [
          {
            id: 'A',
            title: 'Quick Requirements',
            description: 'Generate structured requirements with MoSCoW prioritization',
            tradeoffs: ['Fast start', 'Basic structure', 'May need refinement'],
            nextStep: 'Run generate_requirements tool to create PM-grade requirements'
          },
          {
            id: 'B',
            title: 'Full Analysis',
            description: 'Complete optimization analysis with consulting techniques',
            tradeoffs: ['Comprehensive insights', 'Takes longer', 'Best ROI analysis'],
            nextStep: 'Run optimize_intent tool for complete consulting analysis'
          },
          {
            id: 'C',
            title: 'Design Options',
            description: 'Explore Conservative/Balanced/Bold design alternatives',
            tradeoffs: ['Strategic approach', 'Multiple paths', 'Informed decisions'],
            nextStep: 'Generate requirements first, then run generate_design_options'
          }
        ],
        processingTimeMs: 18
      };

      mockPipeline.validateIdeaQuick.mockResolvedValue(mockResult);

      const { MCPLogger } = require('../../utils/mcp-error-handling');

      // Act
      await server.handleValidateIdeaQuick(args, mockContext);

      // Assert
      expect(MCPLogger.debug).toHaveBeenCalledWith(
        'Starting quick idea validation',
        mockContext,
        expect.objectContaining({
          ideaLength: args.idea.length,
          hasContext: true,
          urgency: 'low',
          budgetRange: 'large',
          teamSize: 5
        })
      );

      expect(MCPLogger.info).toHaveBeenCalledWith(
        'Quick validation completed successfully',
        mockContext,
        expect.objectContaining({
          verdict: 'PASS',
          processingTime: 18,
          optionsCount: 3,
          reasoning: expect.stringContaining('Clear objective with manageable complexity')
        })
      );
    });
  });

  describe('formatQuickValidationResponse', () => {
    it('should format validation response with proper structure', () => {
      // Arrange
      const mockResult = {
        verdict: 'PASS',
        reasoning: 'Clear objective with manageable complexity and quota usage',
        options: [
          {
            id: 'A',
            title: 'Quick Requirements',
            description: 'Generate structured requirements with MoSCoW prioritization',
            tradeoffs: ['Fast start', 'Basic structure', 'May need refinement'],
            nextStep: 'Run generate_requirements tool to create PM-grade requirements'
          },
          {
            id: 'B',
            title: 'Full Analysis',
            description: 'Complete optimization analysis with consulting techniques',
            tradeoffs: ['Comprehensive insights', 'Takes longer', 'Best ROI analysis'],
            nextStep: 'Run optimize_intent tool for complete consulting analysis'
          }
        ]
      };

      // Act
      const formatted = (server as any).formatQuickValidationResponse(mockResult);

      // Assert
      expect(formatted).toContain('# Quick Validation Result');
      expect(formatted).toContain('**Verdict:** PASS');
      expect(formatted).toContain('**Reasoning:** Clear objective with manageable complexity');
      expect(formatted).toContain('## Next Steps (Choose One)');
      expect(formatted).toContain('### Option A: Quick Requirements');
      expect(formatted).toContain('### Option B: Full Analysis');
      expect(formatted).toContain('**Trade-offs:**');
      expect(formatted).toContain('- Fast start');
      expect(formatted).toContain('- Comprehensive insights');
      expect(formatted).toContain('**Next Step:** Run generate_requirements tool');
      expect(formatted).toContain('**Next Step:** Run optimize_intent tool');
      expect(formatted).toContain('---'); // Separator between options
    });

    it('should format FAIL verdict responses correctly', () => {
      // Arrange
      const mockResult = {
        verdict: 'FAIL',
        reasoning: 'Idea too vague or empty - needs more specific description',
        options: [
          {
            id: 'A',
            title: 'Simplify & Retry',
            description: 'Break down into smaller, clearer components',
            tradeoffs: ['Reduced scope', 'Faster validation'],
            nextStep: 'Rewrite idea focusing on one specific problem to solve'
          }
        ]
      };

      // Act
      const formatted = (server as any).formatQuickValidationResponse(mockResult);

      // Assert
      expect(formatted).toContain('**Verdict:** FAIL');
      expect(formatted).toContain('Idea too vague or empty');
      expect(formatted).toContain('### Option A: Simplify & Retry');
      expect(formatted).toContain('- Reduced scope');
      expect(formatted).toContain('- Faster validation');
    });
  });
});