/**
 * Base service class with standardized error handling and result patterns
 */

export class VError extends Error {
  public readonly code: string;
  public readonly timestamp: string;
  public readonly originalError?: Error;

  constructor(code: string, message: string, originalError?: Error) {
    super(message);
    this.name = 'VError';
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.originalError = originalError;
  }
}

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: VError;
}

export abstract class BaseService {
  /**
   * Create a successful result
   */
  protected success<T>(data: T): Result<T> {
    return {
      success: true,
      data,
    };
  }

  /**
   * Create an error result
   */
  protected error<T>(code: string, message: string): Result<T> {
    return {
      success: false,
      error: new VError(code, message),
    };
  }

  /**
   * Wrap an existing error into a VError result
   */
  protected wrapError<T>(error: unknown, code: string, message: string): Result<T> {
    const originalError = error instanceof Error ? error : new Error(String(error));
    return {
      success: false,
      error: new VError(code, message, originalError),
    };
  }

  /**
   * Handle async operations with automatic error wrapping
   */
  protected async handleAsync<T>(
    operation: () => Promise<T>,
    errorCode: string = 'UNKNOWN_ERROR'
  ): Promise<Result<T>> {
    try {
      const result = await operation();
      return this.success(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.wrapError(error, errorCode, errorMessage);
    }
  }
}
