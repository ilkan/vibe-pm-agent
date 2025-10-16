import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import { AuthService } from '../../components/auth-service/index';

describe('AuthService', () => {
  const testCredentialPath = '.aws/test-auth-keys.json';
  let authService: AuthService;

  const validCredentials = {
    apiKeys: [
      {
        keyId: 'auth-test-1',
        hashedKey: '2688f4e126ca5efd4a60022073e6cd90017626e56c3f30b194d53e6299edfe3c', // hash of 'test-api-key-12345'
        clientName: 'Auth Test Client',
        permissions: ['all'],
        enabled: true,
        rateLimit: {
          requestsPerMinute: 60,
          requestsPerHour: 1000,
          burstLimit: 10
        },
        expiresAt: null
      }
    ]
  };

  beforeEach(() => {
    authService = new AuthService(testCredentialPath);
    fs.writeFileSync(testCredentialPath, JSON.stringify(validCredentials, null, 2));
  });

  afterEach(() => {
    if (fs.existsSync(testCredentialPath)) {
      fs.unlinkSync(testCredentialPath);
    }
  });

  describe('authenticateRequest', () => {
    it('should authenticate valid API key in X-API-Key header', async () => {
      const headers = { 'X-API-Key': 'test-api-key-12345' };
      const result = await authService.authenticateRequest(headers);
      
      expect(result.isAuthenticated).toBe(true);
      expect(result.clientId).toBe('auth-test-1');
      expect(result.clientName).toBe('Auth Test Client');
      expect(result.permissions).toEqual(['all']);
    });

    it('should authenticate valid API key in lowercase header', async () => {
      const headers = { 'x-api-key': 'test-api-key-12345' };
      const result = await authService.authenticateRequest(headers);
      
      expect(result.isAuthenticated).toBe(true);
      expect(result.clientId).toBe('auth-test-1');
    });

    it('should authenticate valid API key in Authorization Bearer header', async () => {
      const headers = { 'authorization': 'Bearer test-api-key-12345' };
      const result = await authService.authenticateRequest(headers);
      
      expect(result.isAuthenticated).toBe(true);
      expect(result.clientId).toBe('auth-test-1');
    });

    it('should reject request without API key', async () => {
      const headers = {};
      const result = await authService.authenticateRequest(headers);
      
      expect(result.isAuthenticated).toBe(false);
      expect(result.error).toContain('API key is required');
    });

    it('should reject request with invalid API key', async () => {
      const headers = { 'X-API-Key': 'invalid-key-that-is-long-enough' };
      const result = await authService.authenticateRequest(headers);
      
      expect(result.isAuthenticated).toBe(false);
      expect(result.error).toContain('Invalid');
    });
  });

  describe('hasPermission', () => {
    it('should grant permission for "all" permissions', async () => {
      const headers = { 'X-API-Key': 'test-api-key-12345' };
      const authResult = await authService.authenticateRequest(headers);
      
      expect(authService.hasPermission(authResult, 'read')).toBe(true);
      expect(authService.hasPermission(authResult, 'write')).toBe(true);
      expect(authService.hasPermission(authResult, 'admin')).toBe(true);
    });

    it('should deny permission for unauthenticated request', () => {
      const authResult = { isAuthenticated: false };
      
      expect(authService.hasPermission(authResult, 'read')).toBe(false);
    });

    it('should check specific permissions', async () => {
      // Create credentials with specific permissions
      const specificCredentials = {
        apiKeys: [
          {
            keyId: 'specific-test',
            hashedKey: '2688f4e126ca5efd4a60022073e6cd90017626e56c3f30b194d53e6299edfe3c',
            clientName: 'Specific Client',
            permissions: ['read', 'write'],
            enabled: true,
            rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000, burstLimit: 10 },
            expiresAt: null
          }
        ]
      };
      
      fs.writeFileSync(testCredentialPath, JSON.stringify(specificCredentials, null, 2));
      
      const headers = { 'X-API-Key': 'test-api-key-12345' };
      const authResult = await authService.authenticateRequest(headers);
      
      expect(authService.hasPermission(authResult, 'read')).toBe(true);
      expect(authService.hasPermission(authResult, 'write')).toBe(true);
      expect(authService.hasPermission(authResult, 'admin')).toBe(false);
    });
  });

  describe('createAuthErrorResponse', () => {
    it('should create proper error response structure', () => {
      const authResult = { isAuthenticated: false, error: 'Test error' };
      const response = authService.createAuthErrorResponse(authResult);
      
      expect(response.statusCode).toBe(401);
      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.error.message).toBe('Test error');
      expect(body.error.timestamp).toBeDefined();
    });

    it('should create forbidden response with custom status code', () => {
      const authResult = { isAuthenticated: false, error: 'Insufficient permissions' };
      const response = authService.createAuthErrorResponse(authResult, 403);
      
      expect(response.statusCode).toBe(403);
      
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('FORBIDDEN');
    });
  });
});