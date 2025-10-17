import { LambdaRequest, LambdaResponse, OpenAICompatibleResponse, ToolExecutionResult, EnvironmentConfig, LambdaError } from './types';
export declare function loadEnvironmentConfig(): EnvironmentConfig;
export declare class Logger {
    private config;
    constructor(config: EnvironmentConfig);
    private shouldLog;
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: Error, meta?: any): void;
}
export declare class PerformanceTimer {
    private startTime;
    constructor();
    measure(): number;
    static measureAsync<T>(fn: () => Promise<T>): Promise<{
        result: T;
        duration: number;
    }>;
}
export declare function validateLambdaRequest(request: any): LambdaRequest;
export declare function formatSuccessResponse(data: any, requestId?: string, toolName?: string, executionTime?: number): LambdaResponse;
export declare function formatErrorResponse(error: string | Error | LambdaError, requestId?: string, toolName?: string): LambdaResponse;
export declare function formatOpenAICompatibleResponse(data: any, toolName?: string, toolArgs?: Record<string, any>, requestId?: string, executionTime?: number): OpenAICompatibleResponse;
export declare function convertToOpenAIFormat(lambdaResponse: LambdaResponse, originalToolName?: string, originalToolArgs?: Record<string, any>): OpenAICompatibleResponse;
export declare class ToolRegistry {
    private static instance;
    private tools;
    static getInstance(): ToolRegistry;
    register(toolName: string, handler: Function): void;
    get(toolName: string): Function | undefined;
    list(): string[];
    has(toolName: string): boolean;
}
export declare function handleError(error: unknown, toolName?: string): LambdaResponse;
export declare function executeTool(toolName: string, toolArgs: Record<string, any>, handler: Function): Promise<ToolExecutionResult>;
export declare function isProduction(): boolean;
export declare function isDevelopment(): boolean;
export declare function getCorsHeaders(): Record<string, string>;
export declare function formatApiGatewayResponse(statusCode: number, body: any, headers?: Record<string, string>): any;
export declare function isLambdaEnvironment(): boolean;
export declare function getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
};
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage?: string): Promise<T>;
export declare function safeJsonParse(jsonString: string, fallback?: any): any;
export declare function deepClone<T>(obj: T): T;
//# sourceMappingURL=utils.d.ts.map