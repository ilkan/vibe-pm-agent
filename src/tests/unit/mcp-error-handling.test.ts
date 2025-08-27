// Unit tests for MCP error handling and response formatting

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { 
  MCPErrorHandler, 
  MCPResponseFormatter, 
  MCPLogger 
} from '../../utils/mcp-error-handling';
import { 
  MCPErrorCode, 
  ErrorSeverity, 
  MCPToolContext,
  LogLevel 
} from '../../models/mcp';

describe('MCP Error Handling', () => {
  describe('MCPErrorHandler', () => {
    const mockContext: MCPToolContext = {
      toolName: 'test_tool',
      sessionId: 'test-session',
      timestamp: Date.now(),
      requestId: 'test-request',
      traceId: 'test-trace'
    };

    describe('createError', () => {
      it('should create proper MCP error with context', () => {
        const error = MCPErrorHandler.createError(
          MCPErrorCode.VALIDATION_FAILED,
          'Invalid input parameters',
          mockContext,
          { field: 'intent', value: '' }
        );

        expect(error).toBeInstanceOf(McpError);
        expect(error.message).toBe('Invalid input parameters');
        expect(error.code).toBe(ErrorCode.InvalidParams);
        expect(error.data).toBeDefined();
        
        const errorData = error.data as any;
        expect(errorData.code).toBe(MCPErrorCode.VALIDATION_FAILED);
        expect(errorData.severity).toBe(ErrorSeverity.MEDIUM);
        expect(errorData.toolName).toBe('test_tool');
        expect(errorData.sessionId).toBe('test-session');
        expect(errorData.retryable).toBe(false);
        expect(errorData.suggestedAction).toContain('Validate input parameters');
      });

      it('should map error codes correctly to JSON-RPC codes', () => {
        const testCases = [
          { mcpCode: MCPErrorCode.PARSE_ERROR, expectedJsonRpc: ErrorCode.ParseError },
          { mcpCode: MCPErrorCode.INVALID_REQUEST, expectedJsonRpc: ErrorCode.InvalidRequest },
          { mcpCode: MCPErrorCode.METHOD_NOT_FOUND, expectedJsonRpc: ErrorCode.MethodNotFound },
          { mcpCode: MCPErrorCode.INVALID_PARAMS, expectedJsonRpc: ErrorCode.InvalidParams },
          { mcpCode: MCPErrorCode.INTERNAL_ERROR, expectedJsonRpc: ErrorCode.InternalError },
          { mcpCode: MCPErrorCode.TOOL_NOT_FOUND, expectedJsonRpc: ErrorCode.MethodNotFound },
          { mcpCode: MCPErrorCode.TOOL_EXECUTION_FAILED, expectedJsonRpc: ErrorCode.InternalError }
        ];

        testCases.forEach(({ mcpCode, expectedJsonRpc }) => {
          const error = MCPErrorHandler.createError(mcpCode, 'Test message');
          expect(error.code).toBe(expectedJsonRpc);
        });
      });

      it('should determine correct severity levels', () => {
        const testCases = [
          { code: MCPErrorCode.PARSE_ERROR, expectedSeverity: ErrorSeverity.CRITICAL },
          { code: MCPErrorCode.INTERNAL_ERROR, expectedSeverity: ErrorSeverity.CRITICAL },
          { code: MCPErrorCode.PIPELINE_ERROR, expectedSeverity: ErrorSeverity.CRITICAL },
          { code: MCPErrorCode.TOOL_NOT_FOUND, expectedSeverity: ErrorSeverity.HIGH },
          { code: MCPErrorCode.TOOL_EXECUTION_FAILED, expectedSeverity: ErrorSeverity.HIGH },
          { code: MCPErrorCode.INVALID_PARAMS, expectedSeverity: ErrorSeverity.MEDIUM },
          { code: MCPErrorCode.VALIDATION_FAILED, expectedSeverity: ErrorSeverity.MEDIUM },
          { code: MCPErrorCode.TIMEOUT, expectedSeverity: ErrorSeverity.LOW },
          { code: MCPErrorCode.RATE_LIMITED, expectedSeverity: ErrorSeverity.LOW }
        ];

        testCases.forEach(({ code, expectedSeverity }) => {
          const error = MCPErrorHandler.createError(code, 'Test message');
          const errorData = error.data as any;
          expect(errorData.severity).toBe(expectedSeverity);
        });
      });

      it('should determine retryable status correctly', () => {
        const retryableCodes = [
          MCPErrorCode.TIMEOUT,
          MCPErrorCode.RATE_LIMITED,
          MCPErrorCode.INSUFFICIENT_RESOURCES,
          MCPErrorCode.INTERNAL_ERROR
        ];

        const nonRetryableCodes = [
          MCPErrorCode.PARSE_ERROR,
          MCPErrorCode.INVALID_REQUEST,
          MCPErrorCode.METHOD_NOT_FOUND,
          MCPErrorCode.INVALID_PARAMS,
          MCPErrorCode.TOOL_NOT_FOUND,
          MCPErrorCode.VALIDATION_FAILED
        ];

        retryableCodes.forEach(code => {
          const error = MCPErrorHandler.createError(code, 'Test message');
          const errorData = error.data as any;
          expect(errorData.retryable).toBe(true);
        });

        nonRetryableCodes.forEach(code => {
          const error = MCPErrorHandler.createError(code, 'Test message');
          const errorData = error.data as any;
          expect(errorData.retryable).toBe(false);
        });
      });
    });

    describe('createErrorResponse', () => {
      it('should create error response from McpError', () => {
        const mcpError = MCPErrorHandler.createError(
          MCPErrorCode.VALIDATION_FAILED,
          'Validation failed',
          mockContext
        );

        const response = MCPErrorHandler.createErrorResponse(mcpError, mockContext);

        expect(response.isError).toBe(true);
        expect(response.content).toHaveLength(1);
        expect(response.content[0].type).toBe('json');
        expect(response.content[0].json).toBeDefined();
        expect(response.content[0].json.error).toBe(true);
        expect(response.content[0].json.code).toBe(MCPErrorCode.VALIDATION_FAILED);
        expect(response.content[0].json.message).toBe('Validation failed');
        expect(response.content[0].json.severity).toBe(ErrorSeverity.MEDIUM);
        expect(response.content[0].json.retryable).toBe(false);
        expect(response.metadata?.executionTime).toBeDefined();
      });

      it('should create error response from generic Error', () => {
        const genericError = new Error('Something went wrong');
        genericError.stack = 'Error stack trace';

        const response = MCPErrorHandler.createErrorResponse(genericError, mockContext);

        expect(response.isError).toBe(true);
        expect(response.content[0].json.error).toBe(true);
        expect(response.content[0].json.code).toBe(MCPErrorCode.INTERNAL_ERROR);
        expect(response.content[0].json.message).toBe('Something went wrong');
        expect(response.content[0].json.severity).toBe(ErrorSeverity.HIGH);
        expect(response.content[0].json.retryable).toBe(false);
      });

      it('should handle errors without context', () => {
        const error = new Error('No context error');
        const response = MCPErrorHandler.createErrorResponse(error);

        expect(response.isError).toBe(true);
        expect(response.content[0].json.error).toBe(true);
        expect(response.metadata?.executionTime).toBeUndefined();
      });
    });
  });

  describe('MCPResponseFormatter', () => {
    const testData = {
      title: 'Test Analysis',
      description: 'This is a test analysis',
      keyFindings: ['Finding 1', 'Finding 2'],
      recommendations: [
        {
          mainRecommendation: 'Implement optimization',
          supportingReasons: ['Reduces cost', 'Improves performance']
        },
        'Simple recommendation'
      ],
      additionalData: { complexity: 'medium', savings: 25 }
    };

    describe('formatSuccess', () => {
      it('should format JSON response correctly', () => {
        const response = MCPResponseFormatter.formatSuccess(
          testData,
          'json',
          { executionTime: 150 }
        );

        expect(response.isError).toBe(false);
        expect(response.content).toHaveLength(1);
        expect(response.content[0].type).toBe('json');
        expect(response.content[0].json).toBeDefined();
        expect(response.content[0].json.success).toBe(true);
        expect(response.content[0].json.data).toEqual(testData);
        expect(response.content[0].json.timestamp).toBeDefined();
        expect(response.metadata).toEqual({ executionTime: 150 });
      });

      it('should format text response correctly', () => {
        const response = MCPResponseFormatter.formatSuccess('Simple text response', 'text');

        expect(response.content[0].type).toBe('text');
        expect(response.content[0].text).toBe('Simple text response');
      });

      it('should format markdown response correctly', () => {
        const response = MCPResponseFormatter.formatSuccess(testData, 'markdown');

        expect(response.content[0].type).toBe('markdown');
        expect(response.content[0].markdown).toBeDefined();
        expect(response.content[0].markdown).toContain('# Test Analysis');
        expect(response.content[0].markdown).toContain('This is a test analysis');
        expect(response.content[0].markdown).toContain('## Key Findings');
        expect(response.content[0].markdown).toContain('1. Finding 1');
        expect(response.content[0].markdown).toContain('2. Finding 2');
        expect(response.content[0].markdown).toContain('## Recommendations');
        expect(response.content[0].markdown).toContain('**Implement optimization**');
        expect(response.content[0].markdown).toContain('- Reduces cost');
        expect(response.content[0].markdown).toContain('2. Simple recommendation');
        expect(response.content[0].markdown).toContain('## Additional Data');
        expect(response.content[0].markdown).toContain('```json');
      });

      it('should format resource response correctly', () => {
        const resourceData = {
          uri: 'file://test.json',
          mimeType: 'application/json',
          text: 'Resource content'
        };

        const response = MCPResponseFormatter.formatSuccess(resourceData, 'resource');

        expect(response.content[0].type).toBe('resource');
        expect(response.content[0].resource).toEqual(resourceData);
      });

      it('should fallback to JSON for invalid resource data', () => {
        const invalidResourceData = { content: 'Not a valid resource' };

        const response = MCPResponseFormatter.formatSuccess(invalidResourceData, 'resource');

        expect(response.content[0].type).toBe('json');
        expect(response.content[0].json.success).toBe(true);
        expect(response.content[0].json.data).toEqual(invalidResourceData);
      });

      it('should handle string data for markdown formatting', () => {
        const response = MCPResponseFormatter.formatSuccess('Simple markdown text', 'markdown');

        expect(response.content[0].type).toBe('markdown');
        expect(response.content[0].markdown).toBe('Simple markdown text');
      });

      it('should handle objects without special fields for markdown', () => {
        const simpleData = { value: 42, status: 'active' };
        const response = MCPResponseFormatter.formatSuccess(simpleData, 'markdown');

        expect(response.content[0].markdown).toContain('```json');
        expect(response.content[0].markdown).toContain('"value": 42');
        expect(response.content[0].markdown).toContain('"status": "active"');
      });
    });
  });

  describe('MCPLogger', () => {
    let consoleSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      MCPLogger.setLogLevel(LogLevel.DEBUG); // Enable all logging for tests
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    const mockContext: MCPToolContext = {
      toolName: 'test_tool',
      sessionId: 'test-session',
      timestamp: Date.now()
    };

    describe('logging methods', () => {
      it('should log info messages correctly', () => {
        MCPLogger.info('Test info message', mockContext, { extra: 'data' });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('"level":"INFO"')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('"message":"Test info message"')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('"component":"PMAgentMCPServer"')
        );
      });

      it('should log error messages correctly', () => {
        const testError = new Error('Test error');
        MCPLogger.error('Test error message', testError, mockContext);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('"level":"ERROR"')
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('"message":"Test error message"')
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('"error":{')
        );
      });

      it('should log warning messages correctly', () => {
        MCPLogger.warn('Test warning', mockContext);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('"level":"WARN"')
        );
      });

      it('should log debug messages correctly', () => {
        MCPLogger.debug('Test debug', mockContext);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('"level":"DEBUG"')
        );
      });

      it('should log fatal messages correctly', () => {
        const testError = new Error('Fatal error');
        MCPLogger.fatal('Test fatal', testError, mockContext);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('"level":"FATAL"')
        );
      });
    });

    describe('log level filtering', () => {
      it('should respect log level settings', () => {
        MCPLogger.setLogLevel(LogLevel.ERROR);

        MCPLogger.debug('Debug message');
        MCPLogger.info('Info message');
        MCPLogger.warn('Warning message');
        MCPLogger.error('Error message');

        expect(consoleSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('"level":"DEBUG"')
        );
        expect(consoleSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('"level":"INFO"')
        );
        expect(consoleSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('"level":"WARN"')
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('"level":"ERROR"')
        );
      });
    });

    describe('logToolExecution', () => {
      it('should log successful tool execution', () => {
        const startTime = Date.now() - 100;
        MCPLogger.logToolExecution(
          'test_tool',
          mockContext,
          startTime,
          true,
          undefined,
          { quotaUsed: 5 }
        );

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('"level":"INFO"')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('"message":"Tool test_tool completed"')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('"success":true')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('"duration"')
        );
      });

      it('should log failed tool execution', () => {
        const startTime = Date.now() - 200;
        const error = new Error('Tool failed');
        
        MCPLogger.logToolExecution(
          'test_tool',
          mockContext,
          startTime,
          false,
          error,
          { attemptNumber: 1 }
        );

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('"level":"ERROR"')
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('"message":"Tool test_tool failed"')
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('"success":false')
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('"error":{')
        );
      });
    });

    describe('structured logging', () => {
      it('should include all required fields in log entries', () => {
        MCPLogger.info('Test message', mockContext, { custom: 'metadata' });

        const logCall = consoleSpy.mock.calls[0][0];
        const logEntry = JSON.parse(logCall);

        expect(logEntry).toHaveProperty('level', 'INFO');
        expect(logEntry).toHaveProperty('timestamp');
        expect(logEntry).toHaveProperty('component', 'PMAgentMCPServer');
        expect(logEntry).toHaveProperty('message', 'Test message');
        expect(logEntry).toHaveProperty('context');
        expect(logEntry).toHaveProperty('metadata');
        expect(logEntry.context).toEqual(mockContext);
        expect(logEntry.metadata).toEqual({ custom: 'metadata' });
      });

      it('should format error information correctly', () => {
        const testError = new Error('Test error');
        testError.stack = 'Error stack trace';
        
        MCPLogger.error('Error occurred', testError, mockContext);

        const logCall = consoleErrorSpy.mock.calls[0][0];
        const logEntry = JSON.parse(logCall);

        expect(logEntry.error).toHaveProperty('message', 'Test error');
        expect(logEntry.error).toHaveProperty('stack', 'Error stack trace');
        expect(logEntry.error).toHaveProperty('type', 'Error');
      });
    });
  });
});