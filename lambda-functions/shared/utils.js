"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = exports.PerformanceTimer = exports.Logger = void 0;
exports.loadEnvironmentConfig = loadEnvironmentConfig;
exports.validateLambdaRequest = validateLambdaRequest;
exports.formatSuccessResponse = formatSuccessResponse;
exports.formatErrorResponse = formatErrorResponse;
exports.formatOpenAICompatibleResponse = formatOpenAICompatibleResponse;
exports.convertToOpenAIFormat = convertToOpenAIFormat;
exports.handleError = handleError;
exports.executeTool = executeTool;
exports.isProduction = isProduction;
exports.isDevelopment = isDevelopment;
exports.getCorsHeaders = getCorsHeaders;
exports.formatApiGatewayResponse = formatApiGatewayResponse;
exports.isLambdaEnvironment = isLambdaEnvironment;
exports.getMemoryUsage = getMemoryUsage;
exports.withTimeout = withTimeout;
exports.safeJsonParse = safeJsonParse;
exports.deepClone = deepClone;
// Shared utilities for Lambda functions
const types_1 = require("./types");
// Helper function to parse environment variables as boolean
function isEnvironmentVariableTrue(value) {
    if (!value)
        return false;
    const normalizedValue = value.toLowerCase().trim();
    return ['true', '1', 'yes', 'on', 'enabled'].includes(normalizedValue);
}
// Environment configuration loader
function loadEnvironmentConfig() {
    return {
        environment: process.env.ENVIRONMENT || 'dev',
        logLevel: process.env.LOG_LEVEL || 'INFO',
        mcpServerPath: process.env.MCP_SERVER_PATH,
        bedrockRegion: process.env.BEDROCK_REGION || 'us-east-1',
        apiGatewayUrl: process.env.API_GATEWAY_URL,
        enableCaching: process.env.ENABLE_CACHING === 'true',
        cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || '300'),
        externalAccessEnabled: isEnvironmentVariableTrue(process.env.EXTERNAL_ACCESS_ENABLED)
    };
}
// Logging utility
class Logger {
    constructor(config) {
        this.config = config;
    }
    shouldLog(level) {
        const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        const currentLevel = levels.indexOf(this.config.logLevel);
        const messageLevel = levels.indexOf(level);
        return messageLevel >= currentLevel;
    }
    debug(message, meta) {
        if (this.shouldLog('DEBUG')) {
            console.log(JSON.stringify({
                level: 'DEBUG',
                timestamp: new Date().toISOString(),
                message,
                ...meta
            }));
        }
    }
    info(message, meta) {
        if (this.shouldLog('INFO')) {
            console.log(JSON.stringify({
                level: 'INFO',
                timestamp: new Date().toISOString(),
                message,
                ...meta
            }));
        }
    }
    warn(message, meta) {
        if (this.shouldLog('WARN')) {
            console.warn(JSON.stringify({
                level: 'WARN',
                timestamp: new Date().toISOString(),
                message,
                ...meta
            }));
        }
    }
    error(message, error, meta) {
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
exports.Logger = Logger;
// Performance measurement utility
class PerformanceTimer {
    constructor() {
        this.startTime = Date.now();
    }
    measure() {
        return Date.now() - this.startTime;
    }
    static measureAsync(fn) {
        const timer = new PerformanceTimer();
        return fn().then(result => ({
            result,
            duration: timer.measure()
        }));
    }
}
exports.PerformanceTimer = PerformanceTimer;
// Input validation utilities
function validateLambdaRequest(request) {
    if (!request || typeof request !== 'object') {
        throw new types_1.LambdaError('Invalid request format', 400, 'INVALID_REQUEST');
    }
    if (!request.toolName || typeof request.toolName !== 'string') {
        throw new types_1.LambdaError('toolName is required and must be a string', 400, 'INVALID_TOOL_NAME');
    }
    if (!request.toolArgs || typeof request.toolArgs !== 'object') {
        throw new types_1.LambdaError('toolArgs is required and must be an object', 400, 'INVALID_TOOL_ARGS');
    }
    return {
        toolName: request.toolName,
        toolArgs: request.toolArgs,
        requestId: request.requestId,
        environment: request.environment
    };
}
// Response formatting utilities
function formatSuccessResponse(data, requestId, toolName, executionTime) {
    const response = {
        success: true,
        data
    };
    if (requestId !== undefined)
        response.requestId = requestId;
    if (toolName !== undefined)
        response.toolName = toolName;
    if (executionTime !== undefined)
        response.executionTime = executionTime;
    return response;
}
function formatErrorResponse(error, requestId, toolName) {
    const errorMessage = error instanceof Error ? error.message : error;
    const response = {
        success: false,
        error: errorMessage
    };
    if (requestId !== undefined)
        response.requestId = requestId;
    if (toolName !== undefined)
        response.toolName = toolName;
    return response;
}
// OpenAI-compatible response formatting for Bedrock Agent
function formatOpenAICompatibleResponse(data, toolName, toolArgs, requestId, executionTime) {
    return {
        data,
        toolName,
        toolArgs,
        requestId,
        executionTime
    };
}
// Convert Lambda response to OpenAI format
function convertToOpenAIFormat(lambdaResponse, originalToolName, originalToolArgs) {
    return {
        data: lambdaResponse.data,
        toolName: lambdaResponse.toolName || originalToolName,
        toolArgs: originalToolName && originalToolArgs ? originalToolArgs : undefined,
        requestId: lambdaResponse.requestId,
        executionTime: lambdaResponse.executionTime
    };
}
// Tool registry and discovery
class ToolRegistry {
    constructor() {
        this.tools = new Map();
    }
    static getInstance() {
        if (!ToolRegistry.instance) {
            ToolRegistry.instance = new ToolRegistry();
        }
        return ToolRegistry.instance;
    }
    register(toolName, handler) {
        this.tools.set(toolName, handler);
    }
    get(toolName) {
        return this.tools.get(toolName);
    }
    list() {
        return Array.from(this.tools.keys());
    }
    has(toolName) {
        return this.tools.has(toolName);
    }
}
exports.ToolRegistry = ToolRegistry;
// Error handling utility
function handleError(error, toolName) {
    const logger = new Logger(loadEnvironmentConfig());
    if (error instanceof types_1.LambdaError) {
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
async function executeTool(toolName, toolArgs, handler) {
    const timer = new PerformanceTimer();
    const logger = new Logger(loadEnvironmentConfig());
    try {
        logger.info(`Executing tool: ${toolName}`, { toolName, args: toolArgs });
        const { result, duration } = await PerformanceTimer.measureAsync(() => handler(toolArgs));
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
    }
    catch (error) {
        const duration = timer.measure();
        logger.error(`Tool execution failed: ${toolName}`, error, {
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
function isProduction() {
    return loadEnvironmentConfig().environment === 'prod';
}
function isDevelopment() {
    return loadEnvironmentConfig().environment === 'dev';
}
// CORS headers for API Gateway
function getCorsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json'
    };
}
// Response formatting for API Gateway
function formatApiGatewayResponse(statusCode, body, headers) {
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
function isLambdaEnvironment() {
    return !!process.env.AWS_LAMBDA_FUNCTION_NAME;
}
// Memory usage tracking
function getMemoryUsage() {
    const usage = process.memoryUsage();
    const used = usage.heapUsed + usage.external;
    const total = usage.heapTotal + usage.external;
    const percentage = Math.round((used / total) * 100);
    return { used, total, percentage };
}
// Timeout safety utility
function withTimeout(promise, timeoutMs, timeoutMessage = 'Operation timed out') {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new types_1.LambdaError(timeoutMessage, 408, 'TIMEOUT')), timeoutMs))
    ]);
}
// Safe JSON parsing
function safeJsonParse(jsonString, fallback = null) {
    try {
        return JSON.parse(jsonString);
    }
    catch (error) {
        const logger = new Logger(loadEnvironmentConfig());
        logger.warn('Failed to parse JSON', { error: error.message });
        return fallback;
    }
}
// Deep clone utility
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
    return obj;
}
//# sourceMappingURL=utils.js.map