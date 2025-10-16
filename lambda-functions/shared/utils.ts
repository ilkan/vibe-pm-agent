// Shared utilities for Lambda functions
import {
  LambdaRequest,
  LambdaResponse,
  OpenAICompatibleResponse,
  ToolExecutionResult,
  EnvironmentConfig,
  LambdaError,
  ToolNotFoundError,
  ToolExecutionError
} from './types';

// Helper function to parse environment variables as boolean
function isEnvironmentVariableTrue(value: string | undefined): boolean {
  if (!value) return false;
  const normalizedValue = value.toLowerCase().trim();
  return ['true', '1', 'yes', 'on', 'enabled'].includes(normalizedValue);
}

// Environment configuration loader
export function loadEnvironmentConfig(): EnvironmentConfig {
  return {
    environment: (process.env.ENVIRONMENT as 'dev' | 'prod') || 'dev',
    logLevel: (process.env.LOG_LEVEL as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR') || 'INFO',
    mcpServerPath: process.env.MCP_SERVER_PATH,
    bedrockRegion: process.env.BEDROCK_REGION || 'us-east-1',
    apiGatewayUrl: process.env.API_GATEWAY_URL,
    enableCaching: process.env.ENABLE_CACHING === 'true',
    cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || '300'),
    externalAccessEnabled: isEnvironmentVariableTrue(process.env.EXTERNAL_ACCESS_ENABLED)
  };
}

// Logging utility
export class Logger {
  private config: EnvironmentConfig;

  constructor(config: EnvironmentConfig) {
    this.config = config;
  }

  private shouldLog(level: string): boolean {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= currentLevel;
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('DEBUG')) {
      console.log(JSON.stringify({
        level: 'DEBUG',
        timestamp: new Date().toISOString(),
        message,
        ...meta
      }));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('INFO')) {
      console.log(JSON.stringify({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        message,
        ...meta
      }));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('WARN')) {
      console.warn(JSON.stringify({
        level: 'WARN',
        timestamp: new Date().toISOString(),
        message,
        ...meta
      }));
    }
  }

  error(message: string, error?: Error, meta?: any): void {
    if (this.shouldLog('ERROR')) {
      console.error(JSON.stringify({
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        message,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined,
        ...meta
      }));
    }
  }
}

// Performance measurement utility
export class PerformanceTimer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  measure(): number {
    return Date.now() - this.startTime;
  }

  static measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const timer = new PerformanceTimer();
    return fn().then(result => ({
      result,
      duration: timer.measure()
    }));
  }
}

// Input validation utilities
export function validateLambdaRequest(request: any): LambdaRequest {
  if (!request || typeof request !== 'object') {
    throw new LambdaError('Invalid request format', 400, 'INVALID_REQUEST');
  }

  if (!request.toolName || typeof request.toolName !== 'string') {
    throw new LambdaError('toolName is required and must be a string', 400, 'INVALID_TOOL_NAME');
  }

  if (!request.toolArgs || typeof request.toolArgs !== 'object') {
    throw new LambdaError('toolArgs is required and must be an object', 400, 'INVALID_TOOL_ARGS');
  }

  return {
    toolName: request.toolName,
    toolArgs: request.toolArgs,
    requestId: request.requestId,
    environment: request.environment
  };
}

// Response formatting utilities
export function formatSuccessResponse(
  data: any,
  requestId?: string,
  toolName?: string,
  executionTime?: number
): LambdaResponse {
  const response: LambdaResponse = {
    success: true,
    data
  };

  if (requestId !== undefined) response.requestId = requestId;
  if (toolName !== undefined) response.toolName = toolName;
  if (executionTime !== undefined) response.executionTime = executionTime;

  return response;
}

export function formatErrorResponse(
  error: string | Error | LambdaError,
  requestId?: string,
  toolName?: string
): LambdaResponse {
  const errorMessage = error instanceof Error ? error.message : error;

  const response: LambdaResponse = {
    success: false,
    error: errorMessage
  };

  if (requestId !== undefined) response.requestId = requestId;
  if (toolName !== undefined) response.toolName = toolName;

  return response;
}

// OpenAI-compatible response formatting for Bedrock Agent
export function formatOpenAICompatibleResponse(
  data: any,
  toolName?: string,
  toolArgs?: Record<string, any>,
  requestId?: string,
  executionTime?: number
): OpenAICompatibleResponse {
  return {
    data,
    toolName,
    toolArgs,
    requestId,
    executionTime
  };
}

// Convert Lambda response to OpenAI format
export function convertToOpenAIFormat(
  lambdaResponse: LambdaResponse,
  originalToolName?: string,
  originalToolArgs?: Record<string, any>
): OpenAICompatibleResponse {
  return {
    data: lambdaResponse.data,
    toolName: lambdaResponse.toolName || originalToolName,
    toolArgs: originalToolName && originalToolArgs ? originalToolArgs : undefined,
    requestId: lambdaResponse.requestId,
    executionTime: lambdaResponse.executionTime
  };
}

// Tool registry and discovery
export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, Function> = new Map();

  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  register(toolName: string, handler: Function): void {
    this.tools.set(toolName, handler);
  }

  get(toolName: string): Function | undefined {
    return this.tools.get(toolName);
  }

  list(): string[] {
    return Array.from(this.tools.keys());
  }

  has(toolName: string): boolean {
    return this.tools.has(toolName);
  }
}

// Error handling utility
export function handleError(error: unknown, toolName?: string): LambdaResponse {
  const logger = new Logger(loadEnvironmentConfig());

  if (error instanceof LambdaError) {
    logger.error(`Lambda error in tool ${toolName}`, error, { toolName });
    return formatErrorResponse(error, undefined, toolName);
  }

  if (error instanceof Error) {
    logger.error(`Unexpected error in tool ${toolName}`, error, { toolName });
    return formatErrorResponse(error.message, undefined, toolName);
  }

  logger.error(`Unknown error in tool ${toolName}`, new Error(String(error)), { toolName });
  return formatErrorResponse('An unknown error occurred', undefined, toolName);
}

// Async tool execution wrapper
export async function executeTool(
  toolName: string,
  toolArgs: Record<string, any>,
  handler: Function
): Promise<ToolExecutionResult> {
  const timer = new PerformanceTimer();
  const logger = new Logger(loadEnvironmentConfig());

  try {
    logger.info(`Executing tool: ${toolName}`, { toolName, args: toolArgs });

    const { result, duration } = await PerformanceTimer.measureAsync(() =>
      handler(toolArgs)
    );

    logger.info(`Tool executed successfully: ${toolName}`, {
      toolName,
      duration,
      success: true
    });

    return {
      toolName,
      success: true,
      result,
      executionTime: duration
    };
  } catch (error) {
    const duration = timer.measure();
    logger.error(`Tool execution failed: ${toolName}`, error as Error, {
      toolName,
      duration,
      args: toolArgs
    });

    return {
      toolName,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime: duration
    };
  }
}

// Environment-specific utilities
export function isProduction(): boolean {
  return loadEnvironmentConfig().environment === 'prod';
}

export function isDevelopment(): boolean {
  return loadEnvironmentConfig().environment === 'dev';
}

// CORS headers for API Gateway
export function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
  };
}

// Response formatting for API Gateway
export function formatApiGatewayResponse(
  statusCode: number,
  body: any,
  headers?: Record<string, string>
): any {
  return {
    statusCode,
    headers: {
      ...getCorsHeaders(),
      ...headers
    },
    body: JSON.stringify(body)
  };
}

// Utility to check if we're running in Lambda environment
export function isLambdaEnvironment(): boolean {
  return !!process.env.AWS_LAMBDA_FUNCTION_NAME;
}

// Memory usage tracking
export function getMemoryUsage(): { used: number; total: number; percentage: number } {
  const usage = process.memoryUsage();
  const used = usage.heapUsed + usage.external;
  const total = usage.heapTotal + usage.external;
  const percentage = Math.round((used / total) * 100);

  return { used, total, percentage };
}

// Timeout safety utility
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new LambdaError(timeoutMessage, 408, 'TIMEOUT')), timeoutMs)
    )
  ]);
}

// Safe JSON parsing
export function safeJsonParse(jsonString: string, fallback: any = null): any {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    const logger = new Logger(loadEnvironmentConfig());
    logger.warn('Failed to parse JSON', { error: (error as Error).message });
    return fallback;
  }
}

// Deep clone utility
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as any;
  }

  if (typeof obj === 'object') {
    const clonedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
}
