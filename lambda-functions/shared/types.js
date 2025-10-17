"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolExecutionError = exports.ToolNotFoundError = exports.LambdaError = void 0;
// Error types
class LambdaError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'LambdaError';
    }
}
exports.LambdaError = LambdaError;
class ToolNotFoundError extends LambdaError {
    constructor(toolName) {
        super(`Tool '${toolName}' not found`, 404, 'TOOL_NOT_FOUND');
        this.name = 'ToolNotFoundError';
    }
}
exports.ToolNotFoundError = ToolNotFoundError;
class ToolExecutionError extends LambdaError {
    constructor(toolName, message) {
        super(`Tool '${toolName}' execution failed: ${message}`, 500, 'TOOL_EXECUTION_ERROR');
        this.name = 'ToolExecutionError';
    }
}
exports.ToolExecutionError = ToolExecutionError;
//# sourceMappingURL=types.js.map