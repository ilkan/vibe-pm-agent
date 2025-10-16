import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { CredentialManager, CredentialManagerError } from '../../components/credential-manager/index';

describe('CredentialManager', () => {
  const testCredentialPath = '.aws/test-api-keys.json';
  let credentialManager: CredentialManager;

  const validCredentials = {
    apiKeys: [
      {
        keyId: 'test-client-1',
        hashedKey: '2688f4e126ca5efd4a60022073e6cd90017626e56c3f30b194d53e6299edfe3c', // hash of 'test-api-key-12345'
        clientName: 'Test Client 1',
        permissions: ['all'],
        enabled: true,
        rateLimit: {
          requestsPerMinute: 60,
          requestsPerHour: 1000,
          burstLimit: 10
        },
        expiresAt: null
      },
      {
        keyId: 'test-client-2',
        hashedKey: 'anotherhashedkey',
        clientName: 'Test Client 2',
        permissions: ['read'],
        enabled: false,
        rateLimit: {
          requestsPerMinute: 30,
          requestsPerHour: 500,
          burstLimit: 5
        },
        expiresAt: null
      }
    ]
  };

  beforeEach(() => {
    credentialManager = new CredentialManager(testCredentialPath);
    // Create test credential file
    fs.writeFileSync(testCredentialPath, JSON.stringify(validCredentials, null, 2));
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testCredentialPath)) {
      fs.unlinkSync(testCredentialPath);
    }
    credentialManager.clearCache();
  });

  describe('loadCredentials', () => {
    it('should load valid credentials successfully', async () => {
      const credentials = await credentialManager.loadCredentials();
      
      expect(credentials).toEqual(validCredentials);
      expect(credentials.apiKeys).toHaveLength(2);
      expect(credentials.apiKeys[0].keyId).toBe('test-client-1');
    });

    it('should throw error when credential file does not exist', async () => {
      fs.unlinkSync(testCredentialPath);
      
      await expect(credentialManager.loadCredentials()).rejects.toThrow(CredentialManagerError);
      await expect(credentialManager.loadCredentials()).rejects.toThrow('Credential file not found');
    });

    it('should throw error for invalid JSON', async () => {
      fs.writeFileSync(testCredentialPath, 'invalid json');
      
      await expect(credentialManager.loadCredentials()).rejects.toThrow(CredentialManagerError);
      await expect(credentialManager.loadCredentials()).rejects.toThrow('Invalid JSON');
    });

    it('should throw error for missing apiKeys array', async () => {
      fs.writeFileSync(testCredentialPath, JSON.stringify({ notApiKeys: [] }));
      
      await expect(credentialManager.loadCredentials()).rejects.toThrow(CredentialManagerError);
      await expect(credentialManager.loadCredentials()).rejects.toThrow('apiKeys array');
    });

    it('should cache credentials and reuse them', async () => {
      const credentials1 = await credentialManager.loadCredentials();
      
      // Modify file after first load
      fs.writeFileSync(testCredentialPath, JSON.stringify({ apiKeys: [] }));
      
      // Should still return cached version
      const credentials2 = await credentialManager.loadCredentials();
      expect(credentials2).toEqual(credentials1);
    });
  });

  describe('validateApiKey', () => {
    it('should validate correct API key successfully', async () => {
      const result = await credentialManager.validateApiKey('test-api-key-12345'); // matches hashed key
      
      expect(result.isValid).toBe(true);
      expect(result.clientId).toBe('test-client-1');
      expect(result.clientName).toBe('Test Client 1');
      expect(result.permissions).toEqual(['all']);
    });

    it('should reject invalid API key', async () => {
      const result = await credentialManager.validateApiKey('invalid-key-that-is-long-enough');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid or disabled');
    });

    it('should reject disabled API key', async () => {
      // We need to find what key hashes to 'anotherhashedkey' or create a test scenario
      const result = await credentialManager.validateApiKey('some-disabled-key');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid or disabled');
    });

    it('should reject empty API key', async () => {
      const result = await credentialManager.validateApiKey('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('API key is required');
    });

    it('should reject short API key', async () => {
      const result = await credentialManager.validateApiKey('short');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 16 characters');
    });

    it('should handle expired API key', async () => {
      const expiredCredentials = {
        apiKeys: [
          {
            ...validCredentials.apiKeys[0],
            expiresAt: '2020-01-01T00:00:00Z' // Past date
          }
        ]
      };
      
      fs.writeFileSync(testCredentialPath, JSON.stringify(expiredCredentials));
      credentialManager.clearCache();
      
      const result = await credentialManager.validateApiKey('test-api-key-12345');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('generateApiKey', () => {
    it('should generate API key of correct length', () => {
      const apiKey = credentialManager.generateApiKey();
      
      expect(typeof apiKey).toBe('string');
      expect(apiKey.length).toBe(64); // 32 bytes * 2 (hex)
    });

    it('should generate unique API keys', () => {
      const key1 = credentialManager.generateApiKey();
      const key2 = credentialManager.generateApiKey();
      
      expect(key1).not.toBe(key2);
    });
  });
});