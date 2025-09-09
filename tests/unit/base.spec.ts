import { BaseService, Result, VError } from '../../src/services/_base';

// Mock implementation for testing
class TestService extends BaseService {
  async successOperation(): Promise<Result<string>> {
    return this.success('Operation completed');
  }

  async errorOperation(): Promise<Result<string>> {
    return this.error('OPERATION_FAILED', 'Something went wrong');
  }

  async exceptionOperation(): Promise<Result<string>> {
    throw new Error('Unexpected error');
  }

  async wrappedOperation(): Promise<Result<string>> {
    try {
      throw new Error('Internal error');
    } catch (error) {
      return this.wrapError(error, 'WRAPPED_ERROR', 'Operation failed');
    }
  }
}

describe('BaseService Error Handling', () => {
  let service: TestService;

  beforeEach(() => {
    service = new TestService();
  });

  test('should return success result', async () => {
    const result = await service.successOperation();
    
    expect(result.success).toBe(true);
    expect(result.data).toBe('Operation completed');
    expect(result.error).toBeUndefined();
  });

  test('should return error result', async () => {
    const result = await service.errorOperation();
    
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('OPERATION_FAILED');
    expect(result.error?.message).toBe('Something went wrong');
  });

  test('should handle exceptions gracefully', async () => {
    const result = await service.exceptionOperation();
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('UNKNOWN_ERROR');
    expect(result.error?.message).toContain('Unexpected error');
  });

  test('should wrap errors correctly', async () => {
    const result = await service.wrappedOperation();
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('WRAPPED_ERROR');
    expect(result.error?.message).toBe('Operation failed');
    expect(result.error?.originalError).toBeDefined();
  });

  test('VError should contain all required properties', () => {
    const error = new VError('TEST_CODE', 'Test message');
    
    expect(error.code).toBe('TEST_CODE');
    expect(error.message).toBe('Test message');
    expect(error.timestamp).toBeDefined();
    expect(error.originalError).toBeUndefined();
  });

  test('VError should wrap original error', () => {
    const originalError = new Error('Original error');
    const error = new VError('TEST_CODE', 'Test message', originalError);
    
    expect(error.originalError).toBe(originalError);
  });
});