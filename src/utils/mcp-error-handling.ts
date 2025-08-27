// MCP Server error handling utilities

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { 
  MCPError, 
  MCPErrorCode, 
  ErrorSeverity, 
  ErrorDetails, 
  MCPToolResult,
  MCPContent,
  LogLevel,
  LogEntry,
  MCPToolContext
} from '../models/mcp';

/**
 * Enhanced error handling for MCP operations
 */
export class MCPErrorHandler {
  /**
   * Create a standardized MCP error response
   */
  static createError(
    code: MCPErrorCode,
    message: string,
    context?: MCPToolContext,
    data?: any
  ): McpError {
    const errorDetails: ErrorDetails = {
      code,
      message,
      severity: this.getSeverityForCode(code),
      stage: context?.toolName ? 'tool_execution' : 'server',
      toolName: context?.toolName,
      sessionId: context?.sessionId,
      timestamp: Date.now(),
      context: data,
      retryable: this.isRetryable(code),
      suggestedAction: this.getSuggestedAction(code)
    };

    // Map MCP error codes to standard JSON-RPC error codes
    const jsonRpcCode = this.mapToJsonRpcCode(code);
    
    return new McpError(jsonRpcCode, message, errorDetails);
  }

  /**
   * Create error response content for tool results
   */
  static createErrorResponse(
    error: Error | McpError | MCPError,
    context?: MCPToolContext
  ): MCPToolResult {
    let errorDetails: ErrorDetails;
    let message: string;

    if (error instanceof McpError) {
      message = error.message;
      errorDetails = error.data as ErrorDetails || {
        code: this.mapFromJsonRpcCode(error.code),
        message: error.message,
        severity: ErrorSeverity.HIGH,
        timestamp: Date.now(),
        retryable: false
      };
    } else if ('code' in error && typeof error.code === 'number') {
      // Handle MCPError interface
      const mcpError = error as MCPError;
      message = mcpError.message;
      errorDetails = {
        code: mcpError.code,
        message: mcpError.message,
        severity: this.getSeverityForCode(mcpError.code),
        timestamp: Date.now(),
        retryable: this.isRetryable(mcpError.code),
        context: mcpError.data
      };
    } else {
      // Handle generic Error
      message = error.message || 'Unknown error occurred';
      errorDetails = {
        code: MCPErrorCode.INTERNAL_ERROR,
        message,
        severity: ErrorSeverity.HIGH,
        timestamp: Date.now(),
        stack: error.stack,
        retryable: false
      };
    }

    // Add context information
    if (context) {
      errorDetails.toolName = context.toolName;
      errorDetails.sessionId = context.sessionId;
    }

    const errorContent: MCPContent = {
      type: "text",
      text: JSON.stringify({
        error: true,
        code: errorDetails.code,
        message: errorDetails.message,
        severity: errorDetails.severity,
        timestamp: errorDetails.timestamp,
        retryable: errorDetails.retryable,
        suggestedAction: errorDetails.suggestedAction,
        context: errorDetails.context
      }, null, 2)
    };

    return {
      content: [errorContent],
      isError: true,
      metadata: {
        executionTime: context ? Date.now() - context.timestamp : undefined
      }
    };
  }

  /**
   * Determine error severity based on error code
   */
  private static getSeverityForCode(code: MCPErrorCode): ErrorSeverity {
    switch (code) {
      case MCPErrorCode.PARSE_ERROR:
      case MCPErrorCode.INTERNAL_ERROR:
      case MCPErrorCode.PIPELINE_ERROR:
        return ErrorSeverity.CRITICAL;
      
      case MCPErrorCode.TOOL_NOT_FOUND:
      case MCPErrorCode.METHOD_NOT_FOUND:
      case MCPErrorCode.TOOL_EXECUTION_FAILED:
        return ErrorSeverity.HIGH;
      
      case MCPErrorCode.INVALID_PARAMS:
      case MCPErrorCode.VALIDATION_FAILED:
        return ErrorSeverity.MEDIUM;
      
      case MCPErrorCode.TIMEOUT:
      case MCPErrorCode.RATE_LIMITED:
      case MCPErrorCode.INSUFFICIENT_RESOURCES:
        return ErrorSeverity.LOW;
      
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Determine if error is retryable
   */
  private static isRetryable(code: MCPErrorCode): boolean {
    switch (code) {
      case MCPErrorCode.TIMEOUT:
      case MCPErrorCode.RATE_LIMITED:
      case MCPErrorCode.INSUFFICIENT_RESOURCES:
      case MCPErrorCode.INTERNAL_ERROR:
        return true;
      
      case MCPErrorCode.PARSE_ERROR:
      case MCPErrorCode.INVALID_REQUEST:
      case MCPErrorCode.METHOD_NOT_FOUND:
      case MCPErrorCode.INVALID_PARAMS:
      case MCPErrorCode.TOOL_NOT_FOUND:
      case MCPErrorCode.VALIDATION_FAILED:
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Get suggested action for error code
   */
  private static getSuggestedAction(code: MCPErrorCode): string {
    switch (code) {
      case MCPErrorCode.PARSE_ERROR:
        return 'Check request format and JSON syntax';
      
      case MCPErrorCode.INVALID_REQUEST:
        return 'Verify request structure and required fields';
      
      case MCPErrorCode.METHOD_NOT_FOUND:
      case MCPErrorCode.TOOL_NOT_FOUND:
        return 'Check available tools and method names';
      
      case MCPErrorCode.INVALID_PARAMS:
      case MCPErrorCode.VALIDATION_FAILED:
        return 'Validate input parameters against schema';
      
      case MCPErrorCode.TIMEOUT:
        return 'Retry with simpler request or increase timeout';
      
      case MCPErrorCode.RATE_LIMITED:
        return 'Wait before retrying or reduce request frequency';
      
      case MCPErrorCode.INSUFFICIENT_RESOURCES:
        return 'Simplify request or try again later';
      
      case MCPErrorCode.INTERNAL_ERROR:
      case MCPErrorCode.PIPELINE_ERROR:
        return 'Contact support if problem persists';
      
      default:
        return 'Review request and try again';
    }
  }

  /**
   * Map MCP error codes to JSON-RPC error codes
   */
  private static mapToJsonRpcCode(code: MCPErrorCode): ErrorCode {
    switch (code) {
      case MCPErrorCode.PARSE_ERROR:
        return ErrorCode.ParseError;
      case MCPErrorCode.INVALID_REQUEST:
        return ErrorCode.InvalidRequest;
      case MCPErrorCode.METHOD_NOT_FOUND:
      case MCPErrorCode.TOOL_NOT_FOUND:
        return ErrorCode.MethodNotFound;
      case MCPErrorCode.INVALID_PARAMS:
      case MCPErrorCode.VALIDATION_FAILED:
        return ErrorCode.InvalidParams;
      case MCPErrorCode.INTERNAL_ERROR:
      case MCPErrorCode.TOOL_EXECUTION_FAILED:
      case MCPErrorCode.PIPELINE_ERROR:
      case MCPErrorCode.TIMEOUT:
      case MCPErrorCode.RATE_LIMITED:
      case MCPErrorCode.INSUFFICIENT_RESOURCES:
      default:
        return ErrorCode.InternalError;
    }
  }

  /**
   * Map JSON-RPC error codes back to MCP error codes
   */
  private static mapFromJsonRpcCode(code: ErrorCode): MCPErrorCode {
    switch (code) {
      case ErrorCode.ParseError:
        return MCPErrorCode.PARSE_ERROR;
      case ErrorCode.InvalidRequest:
        return MCPErrorCode.INVALID_REQUEST;
      case ErrorCode.MethodNotFound:
        return MCPErrorCode.METHOD_NOT_FOUND;
      case ErrorCode.InvalidParams:
        return MCPErrorCode.INVALID_PARAMS;
      case ErrorCode.InternalError:
      default:
        return MCPErrorCode.INTERNAL_ERROR;
    }
  }
}

/**
 * Response formatting utilities for different content types
 */
export class MCPResponseFormatter {
  /**
   * Format successful response with proper content type
   */
  static formatSuccess(
    data: any,
    contentType: 'text' | 'json' | 'markdown' | 'resource' = 'json',
    metadata?: Record<string, any>
  ): MCPToolResult {
    const content: MCPContent[] = [];

    switch (contentType) {
      case 'text':
        content.push({
          type: 'text',
          text: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
        });
        break;

      case 'json':
        content.push({
          type: 'text',
          text: JSON.stringify({
            success: true,
            data,
            timestamp: new Date().toISOString()
          }, null, 2)
        });
        break;

      case 'markdown':
        content.push({
          type: 'markdown',
          markdown: typeof data === 'string' ? data : this.formatAsMarkdown(data)
        });
        break;

      case 'resource':
        if (data.uri && data.mimeType) {
          content.push({
            type: 'resource',
            resource: data
          });
        } else {
          // Fallback to JSON if not a proper resource
          content.push({
            type: 'json',
            json: { success: true, data }
          });
        }
        break;
    }

    return {
      content,
      isError: false,
      metadata
    };
  }

  /**
   * Format data as markdown for better readability
   */
  private static formatAsMarkdown(data: any): string {
    if (typeof data === 'string') {
      return data;
    }

    if (typeof data === 'object' && data !== null) {
      let markdown = '';
      
      if (data.title || data.name) {
        markdown += `# ${data.title || data.name}\n\n`;
      }

      if (data.description) {
        markdown += `${data.description}\n\n`;
      }

      if (data.summary || data.executiveSummary) {
        markdown += `## Summary\n\n${data.summary || data.executiveSummary}\n\n`;
      }

      if (data.keyFindings && Array.isArray(data.keyFindings)) {
        markdown += `## Key Findings\n\n`;
        data.keyFindings.forEach((finding: string, index: number) => {
          markdown += `${index + 1}. ${finding}\n`;
        });
        markdown += '\n';
      }

      if (data.recommendations && Array.isArray(data.recommendations)) {
        markdown += `## Recommendations\n\n`;
        data.recommendations.forEach((rec: any, index: number) => {
          if (typeof rec === 'string') {
            markdown += `${index + 1}. ${rec}\n`;
          } else if (rec.mainRecommendation) {
            markdown += `${index + 1}. **${rec.mainRecommendation}**\n`;
            if (rec.supportingReasons && Array.isArray(rec.supportingReasons)) {
              rec.supportingReasons.forEach((reason: string) => {
                markdown += `   - ${reason}\n`;
              });
            }
          }
        });
        markdown += '\n';
      }

      // Add any remaining data as JSON
      const remainingData = { ...data };
      delete remainingData.title;
      delete remainingData.name;
      delete remainingData.description;
      delete remainingData.summary;
      delete remainingData.executiveSummary;
      delete remainingData.keyFindings;
      delete remainingData.recommendations;

      if (Object.keys(remainingData).length > 0) {
        markdown += `## Additional Data\n\n\`\`\`json\n${JSON.stringify(remainingData, null, 2)}\n\`\`\`\n`;
      }

      return markdown;
    }

    return `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
  }
}

/**
 * Enhanced logging utilities for MCP operations
 */
export class MCPLogger {
  private static logLevel: LogLevel = LogLevel.INFO;

  /**
   * Set the minimum log level
   */
  static setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Log an info message
   */
  static info(message: string, context?: MCPToolContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }

  /**
   * Log a warning message
   */
  static warn(message: string, context?: MCPToolContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context, undefined, metadata);
  }

  /**
   * Log an error message
   */
  static error(message: string, error?: Error, context?: MCPToolContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error, metadata);
  }

  /**
   * Log a debug message
   */
  static debug(message: string, context?: MCPToolContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context, undefined, metadata);
  }

  /**
   * Log a fatal error message
   */
  static fatal(message: string, error?: Error, context?: MCPToolContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context, error, metadata);
  }

  /**
   * Core logging method
   */
  private static log(
    level: LogLevel,
    message: string,
    context?: MCPToolContext,
    error?: Error,
    metadata?: Record<string, any>,
    duration?: number
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      component: 'PMAgentMCPServer',
      message,
      context,
      metadata,
      duration
    };

    if (error) {
      logEntry.error = {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      };
    }

    const output = level === LogLevel.ERROR || level === LogLevel.FATAL ? console.error : console.log;
    output(JSON.stringify(logEntry));
  }

  /**
   * Check if message should be logged based on current log level
   */
  private static shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Log tool execution with timing
   */
  static logToolExecution(
    toolName: string,
    context: MCPToolContext,
    startTime: number,
    success: boolean,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    const duration = Date.now() - startTime;
    const message = `Tool ${toolName} ${success ? 'completed' : 'failed'}`;
    
    const logMetadata = {
      ...metadata,
      success,
      duration,
      toolName,
      sessionId: context.sessionId
    };

    if (success) {
      this.log(LogLevel.INFO, message, context, undefined, logMetadata, duration);
    } else {
      this.log(LogLevel.ERROR, message, context, error, logMetadata, duration);
    }
  }
}