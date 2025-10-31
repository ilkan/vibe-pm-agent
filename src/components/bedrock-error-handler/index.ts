import { BedrockError, NemotronServiceError } from '../../models/bedrock';

/**
 * Bedrock Error Handler for service reliability
 * Provides fallback mechanisms and retry logic for Bedrock service failures
 */
export class BedrockErrorHandler {
  private maxRetries: number;
  private baseDelay: number;

  constructor(maxRetries: number = 3, baseDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  /**
   * Execute operation with fallback to original MCP response when Bedrock unavailable
   */
  async executeWithFallback<T>(
    bedrockOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      return await this.executeWithRetry(bedrockOperation, context);
    } catch (error) {
      console.warn(`Bedrock operation failed, using fallback: ${error.message}`, {
        context,
        error: error.message
      });
      
      try {
        return await fallbackOperation();
      } catch (fallbackError) {
        console.error('Both Bedrock and fallback operations failed', {
          bedrockError: error.message,
          fallbackError: fallbackError.message,
          context
        });
        throw new BedrockError(
          'Both primary and fallback operations failed',
          'COMPLETE_FAILURE',
          500,
          {
            bedrockError: error.message,
            fallbackError: fallbackError.message
          }
        );
      }
    }
  }

  /**
   * Execute operation with retry logic and exponential backoff
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries) {
          break;
        }

        if (this.isRetryableError(error)) {
          const delay = this.calculateDelay(attempt);
          console.warn(`Bedrock operation failed (attempt ${attempt}/${this.maxRetries}), retrying in ${delay}ms`, {
            error: error.message,
            context,
            attempt
          });
          
          await this.sleep(delay);
        } else {
          // Non-retryable error, fail immediately
          throw error;
        }
      }
    }

    throw new BedrockError(
      `Operation failed after ${this.maxRetries} attempts: ${lastError.message}`,
      'MAX_RETRIES_EXCEEDED',
      500,
      { originalError: lastError.message, context }
    );
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retryable errors
    const retryableErrors = [
      'ThrottlingException',
      'ServiceUnavailableException',
      'InternalServerException',
      'TooManyRequestsException',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND'
    ];

    // Non-retryable errors
    const nonRetryableErrors = [
      'ValidationException',
      'AccessDeniedException',
      'ResourceNotFoundException',
      'ModelNotReadyException'
    ];

    const errorCode = error.name || error.code || error.message;
    
    // Check for non-retryable errors first
    if (nonRetryableErrors.some(code => errorCode.includes(code))) {
      return false;
    }

    // Check for retryable errors
    if (retryableErrors.some(code => errorCode.includes(code))) {
      return true;
    }

    // Default to retryable for unknown errors (with caution)
    return true;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle specific Bedrock service errors
   */
  handleBedrockError(error: any, context?: string): BedrockError {
    const errorCode = error.name || error.code || 'UNKNOWN_ERROR';
    const statusCode = error.$metadata?.httpStatusCode || 500;

    switch (errorCode) {
      case 'ThrottlingException':
        return new BedrockError(
          'Bedrock service is throttling requests. Please reduce request rate.',
          'THROTTLING',
          429,
          { context, originalError: error.message }
        );

      case 'ValidationException':
        return new BedrockError(
          'Invalid request parameters for Bedrock model.',
          'VALIDATION_ERROR',
          400,
          { context, originalError: error.message }
        );

      case 'AccessDeniedException':
        return new BedrockError(
          'Access denied to Bedrock model. Check IAM permissions.',
          'ACCESS_DENIED',
          403,
          { context, originalError: error.message }
        );

      case 'ResourceNotFoundException':
        return new BedrockError(
          'Bedrock model not found. Verify model ID and region.',
          'MODEL_NOT_FOUND',
          404,
          { context, originalError: error.message }
        );

      case 'ModelNotReadyException':
        return new BedrockError(
          'Bedrock model is not ready. Please try again later.',
          'MODEL_NOT_READY',
          503,
          { context, originalError: error.message }
        );

      case 'ServiceUnavailableException':
        return new BedrockError(
          'Bedrock service is temporarily unavailable.',
          'SERVICE_UNAVAILABLE',
          503,
          { context, originalError: error.message }
        );

      default:
        return new BedrockError(
          `Bedrock operation failed: ${error.message}`,
          'BEDROCK_ERROR',
          statusCode,
          { context, originalError: error.message }
        );
    }
  }

  /**
   * Handle Nemotron service specific errors
   */
  handleNemotronError(error: any, context?: string): NemotronServiceError {
    const errorCode = error.name || error.code || 'UNKNOWN_ERROR';

    switch (errorCode) {
      case 'MODEL_TIMEOUT':
        return new NemotronServiceError(
          'Nemotron model response timeout. Try reducing input size.',
          'TIMEOUT',
          { context, originalError: error.message }
        );

      case 'INVALID_PROMPT':
        return new NemotronServiceError(
          'Invalid prompt format for Nemotron model.',
          'INVALID_PROMPT',
          { context, originalError: error.message }
        );

      case 'CONTEXT_LENGTH_EXCEEDED':
        return new NemotronServiceError(
          'Input context length exceeds Nemotron model limits.',
          'CONTEXT_TOO_LONG',
          { context, originalError: error.message }
        );

      default:
        return new NemotronServiceError(
          `Nemotron service error: ${error.message}`,
          'NEMOTRON_ERROR',
          { context, originalError: error.message }
        );
    }
  }

  /**
   * Create graceful degradation response
   */
  createDegradedResponse(originalResponse: any, error: Error, context?: string): any {
    return {
      ...originalResponse,
      bedrockEnhancement: null,
      nemotronEnhancement: null,
      degradationInfo: {
        reason: 'Bedrock service unavailable',
        error: error.message,
        timestamp: new Date().toISOString(),
        context,
        fallbackUsed: true
      },
      confidence: Math.max((originalResponse.confidence || 0.5) - 0.1, 0.1) // Reduce confidence slightly
    };
  }

  /**
   * Log error with appropriate level and context
   */
  logError(error: Error, level: 'warn' | 'error' = 'error', context?: any): void {
    const logData = {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };

    if (level === 'warn') {
      console.warn('Bedrock service warning:', logData);
    } else {
      console.error('Bedrock service error:', logData);
    }
  }
}