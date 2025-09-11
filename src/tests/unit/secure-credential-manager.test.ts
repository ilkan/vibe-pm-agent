/**
 * Unit tests for Secure Credential Manager
 */

import {
  SecureCredentialManager,
  Credential,
  SecureCredentialOptions,
  CredentialMetadata,
} from '../../components/secure-credential-manager';

describe('SecureCredentialManager', () => {
  let credentialManager: SecureCredentialManager;
  let defaultOptions: SecureCredentialOptions;

  beforeEach(() => {
    defaultOptions = {
      encryptionKey: 'a'.repeat(64), // 64-character hex key
      encryptionConfig: {
        algorithm: 'aes-256-gcm',
        keyDerivation: 'pbkdf2',
        iterations: 10000,
        saltLength: 32,
        ivLength: 16,
      },
      auditLogging: true,
      maxRetentionDays: 90,
      requireApprovalForAccess: false,
    };

    credentialManager = new SecureCredentialManager(defaultOptions);
  });

  afterEach(() => {
    credentialManager.removeAllListeners();
  });

  describe('Credential Storage', () => {
    it('should store a new credential securely', async () => {
      const credentialData = {
        name: 'Test API Key',
        type: 'api_key' as const,
        provider: 'test-provider',
        description: 'Test credential for unit tests',
        metadata: {
          environment: 'development' as const,
          scope: ['read', 'write'],
          allowedDomains: ['api.test.com'],
          tags: ['test'],
          owner: 'test-user',
          team: 'engineering',
        },
        permissions: [],
        isActive: true,
      };

      const plainTextValue = 'sk_test_1234567890abcdef';
      const userId = 'user-123';

      const credentialId = await credentialManager.storeCredential(
        credentialData,
        plainTextValue,
        userId
      );

      expect(credentialId).toBeDefined();
      expect(typeof credentialId).toBe('string');
      expect(credentialId.length).toBeGreaterThan(0);
    });

    it('should emit events when storing credentials', async () => {
      const eventSpy = jest.fn();
      credentialManager.on('credentialStored', eventSpy);

      const credentialData = {
        name: 'Event Test Credential',
        type: 'api_key' as const,
        provider: 'test-provider',
        description: 'Test credential',
        metadata: {
          environment: 'development' as const,
          scope: [],
          allowedDomains: [],
          tags: [],
          owner: 'test-user',
          team: 'test',
        },
        permissions: [],
        isActive: true,
      };

      const credentialId = await credentialManager.storeCredential(
        credentialData,
        'test-value',
        'user-123'
      );

      expect(eventSpy).toHaveBeenCalledWith({
        credentialId,
        userId: 'user-123',
      });
    });

    it('should validate credential data before storing', async () => {
      const invalidCredentialData = {
        // Missing required fields
        description: 'Invalid credential',
        metadata: {} as CredentialMetadata,
        permissions: [],
        isActive: true,
      };

      await expect(
        credentialManager.storeCredential(invalidCredentialData as any, 'test-value', 'user-123')
      ).rejects.toThrow('Failed to store credential');
    });
  });

  describe('Credential Retrieval', () => {
    let testCredentialId: string;

    beforeEach(async () => {
      const credentialData = {
        name: 'Retrieval Test Credential',
        type: 'api_key' as const,
        provider: 'test-provider',
        description: 'Test credential for retrieval',
        metadata: {
          environment: 'development' as const,
          scope: ['read'],
          allowedDomains: ['api.test.com'],
          tags: ['test'],
          owner: 'test-user',
          team: 'engineering',
        },
        permissions: [
          {
            userId: 'user-123',
            role: 'user',
            actions: ['read', 'use'],
          },
        ],
        isActive: true,
      };

      testCredentialId = await credentialManager.storeCredential(
        credentialData,
        'test-secret-value',
        'user-123'
      );
    });

    it('should retrieve and decrypt credential', async () => {
      const decryptedValue = await credentialManager.retrieveCredential(
        testCredentialId,
        'user-123',
        'api_call',
        { apiEndpoint: 'https://api.test.com' }
      );

      expect(decryptedValue).toBe('test-secret-value');
    });

    it('should deny access for users without permissions', async () => {
      await expect(
        credentialManager.retrieveCredential(testCredentialId, 'unauthorized-user', 'api_call', {})
      ).rejects.toThrow('Insufficient permissions to access credential');
    });

    it('should deny access to inactive credentials', async () => {
      // Deactivate the credential
      await credentialManager.updateCredential(testCredentialId, { isActive: false });

      await expect(
        credentialManager.retrieveCredential(testCredentialId, 'user-123', 'api_call', {})
      ).rejects.toThrow('Credential is inactive');
    });

    it('should deny access to expired credentials', async () => {
      // Set expiration in the past
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await credentialManager.updateCredential(testCredentialId, { expiresAt: pastDate });

      await expect(
        credentialManager.retrieveCredential(testCredentialId, 'user-123', 'api_call', {})
      ).rejects.toThrow('Credential has expired');
    });

    it('should emit events when retrieving credentials', async () => {
      const eventSpy = jest.fn();
      credentialManager.on('credentialRetrieved', eventSpy);

      await credentialManager.retrieveCredential(testCredentialId, 'user-123', 'api_call', {});

      expect(eventSpy).toHaveBeenCalledWith({
        credentialId: testCredentialId,
        userId: 'user-123',
        purpose: 'api_call',
      });
    });

    it('should log usage when retrieving credentials', async () => {
      await credentialManager.retrieveCredential(testCredentialId, 'user-123', 'api_call', {
        apiEndpoint: 'https://api.test.com',
      });

      const logs = credentialManager.getUsageLogs({ credentialId: testCredentialId });
      expect(logs.length).toBeGreaterThan(0);

      const retrievalLog = logs.find(log => log.action === 'retrieved');
      expect(retrievalLog).toBeDefined();
      expect(retrievalLog?.userId).toBe('user-123');
      expect(retrievalLog?.purpose).toBe('api_call');
      expect(retrievalLog?.success).toBe(true);
    });
  });

  describe('Credential Updates', () => {
    let testCredentialId: string;

    beforeEach(async () => {
      const credentialData = {
        name: 'Update Test Credential',
        type: 'api_key' as const,
        provider: 'test-provider',
        description: 'Test credential for updates',
        metadata: {
          environment: 'development' as const,
          scope: ['read'],
          allowedDomains: ['api.test.com'],
          tags: ['test'],
          owner: 'test-user',
          team: 'engineering',
        },
        permissions: [
          {
            userId: 'user-123',
            role: 'admin',
            actions: ['read', 'use', 'update'],
          },
        ],
        isActive: true,
      };

      testCredentialId = await credentialManager.storeCredential(
        credentialData,
        'original-value',
        'user-123'
      );
    });

    it('should update credential metadata', async () => {
      const updates = {
        description: 'Updated description',
        metadata: {
          environment: 'production' as const,
          scope: ['read', 'write'],
          allowedDomains: ['api.prod.com'],
          tags: ['production'],
          owner: 'prod-user',
          team: 'operations',
        },
      };

      await credentialManager.updateCredential(testCredentialId, updates, undefined, 'user-123');

      // Verify update by checking if we can still retrieve (indicating successful update)
      const value = await credentialManager.retrieveCredential(
        testCredentialId,
        'user-123',
        'test',
        {}
      );
      expect(value).toBe('original-value');
    });

    it('should update credential value', async () => {
      const newValue = 'updated-secret-value';

      await credentialManager.updateCredential(testCredentialId, {}, newValue, 'user-123');

      const retrievedValue = await credentialManager.retrieveCredential(
        testCredentialId,
        'user-123',
        'test',
        {}
      );
      expect(retrievedValue).toBe(newValue);
    });

    it('should deny updates for users without permissions', async () => {
      await expect(
        credentialManager.updateCredential(
          testCredentialId,
          { description: 'Unauthorized update' },
          undefined,
          'unauthorized-user'
        )
      ).rejects.toThrow('Insufficient permissions to update credential');
    });

    it('should emit events when updating credentials', async () => {
      const eventSpy = jest.fn();
      credentialManager.on('credentialUpdated', eventSpy);

      await credentialManager.updateCredential(
        testCredentialId,
        { description: 'Updated' },
        undefined,
        'user-123'
      );

      expect(eventSpy).toHaveBeenCalledWith({
        credentialId: testCredentialId,
        userId: 'user-123',
      });
    });
  });

  describe('Credential Deletion', () => {
    let testCredentialId: string;

    beforeEach(async () => {
      const credentialData = {
        name: 'Delete Test Credential',
        type: 'api_key' as const,
        provider: 'test-provider',
        description: 'Test credential for deletion',
        metadata: {
          environment: 'development' as const,
          scope: ['read'],
          allowedDomains: ['api.test.com'],
          tags: ['test'],
          owner: 'test-user',
          team: 'engineering',
        },
        permissions: [
          {
            userId: 'user-123',
            role: 'admin',
            actions: ['read', 'use', 'delete'],
          },
        ],
        isActive: true,
      };

      testCredentialId = await credentialManager.storeCredential(
        credentialData,
        'delete-test-value',
        'user-123'
      );
    });

    it('should delete credential', async () => {
      await credentialManager.deleteCredential(testCredentialId, 'user-123');

      await expect(
        credentialManager.retrieveCredential(testCredentialId, 'user-123', 'test', {})
      ).rejects.toThrow('Credential not found');
    });

    it('should deny deletion for users without permissions', async () => {
      await expect(
        credentialManager.deleteCredential(testCredentialId, 'unauthorized-user')
      ).rejects.toThrow('Insufficient permissions to delete credential');
    });

    it('should emit events when deleting credentials', async () => {
      const eventSpy = jest.fn();
      credentialManager.on('credentialDeleted', eventSpy);

      await credentialManager.deleteCredential(testCredentialId, 'user-123');

      expect(eventSpy).toHaveBeenCalledWith({
        credentialId: testCredentialId,
        userId: 'user-123',
      });
    });
  });

  describe('Credential Listing', () => {
    let credentialIds: string[];

    beforeEach(async () => {
      credentialIds = [];

      // Create multiple test credentials
      const credentials = [
        {
          name: 'API Key 1',
          type: 'api_key' as const,
          provider: 'provider-1',
          metadata: {
            environment: 'development' as const,
            scope: [],
            allowedDomains: [],
            tags: [],
            owner: 'user1',
            team: 'team1',
          },
        },
        {
          name: 'OAuth Token 1',
          type: 'oauth_token' as const,
          provider: 'provider-2',
          metadata: {
            environment: 'production' as const,
            scope: [],
            allowedDomains: [],
            tags: [],
            owner: 'user2',
            team: 'team2',
          },
        },
        {
          name: 'API Key 2',
          type: 'api_key' as const,
          provider: 'provider-1',
          metadata: {
            environment: 'staging' as const,
            scope: [],
            allowedDomains: [],
            tags: [],
            owner: 'user1',
            team: 'team1',
          },
        },
      ];

      for (const cred of credentials) {
        const credentialData = {
          ...cred,
          description: 'Test credential',
          permissions: [
            {
              userId: 'user-123',
              role: 'user',
              actions: ['read'],
            },
          ],
          isActive: true,
        };

        const id = await credentialManager.storeCredential(
          credentialData,
          'test-value',
          'user-123'
        );
        credentialIds.push(id);
      }
    });

    it('should list all accessible credentials', async () => {
      const credentials = await credentialManager.listCredentials('user-123');

      expect(credentials.length).toBe(3);
      credentials.forEach(cred => {
        expect((cred as any).encryptedValue).toBeUndefined(); // Should not include encrypted value
        expect(cred.id).toBeDefined();
        expect(cred.name).toBeDefined();
      });
    });

    it('should filter credentials by type', async () => {
      const apiKeyCredentials = await credentialManager.listCredentials('user-123', {
        type: 'api_key',
      });

      expect(apiKeyCredentials.length).toBe(2);
      apiKeyCredentials.forEach(cred => {
        expect(cred.type).toBe('api_key');
      });
    });

    it('should filter credentials by provider', async () => {
      const provider1Credentials = await credentialManager.listCredentials('user-123', {
        provider: 'provider-1',
      });

      expect(provider1Credentials.length).toBe(2);
      provider1Credentials.forEach(cred => {
        expect(cred.provider).toBe('provider-1');
      });
    });

    it('should filter credentials by environment', async () => {
      const devCredentials = await credentialManager.listCredentials('user-123', {
        environment: 'development',
      });

      expect(devCredentials.length).toBe(1);
      expect(devCredentials[0].metadata.environment).toBe('development');
    });

    it('should only return credentials user has access to', async () => {
      const unauthorizedCredentials = await credentialManager.listCredentials('unauthorized-user');

      expect(unauthorizedCredentials.length).toBe(0);
    });
  });

  describe('Credential Rotation', () => {
    let testCredentialId: string;

    beforeEach(async () => {
      const credentialData = {
        name: 'Rotation Test Credential',
        type: 'api_key' as const,
        provider: 'test-provider',
        description: 'Test credential for rotation',
        metadata: {
          environment: 'development' as const,
          scope: ['read'],
          allowedDomains: ['api.test.com'],
          tags: ['test'],
          owner: 'test-user',
          team: 'engineering',
        },
        permissions: [
          {
            userId: 'user-123',
            role: 'admin',
            actions: ['read', 'use', 'update'],
          },
        ],
        isActive: true,
      };

      testCredentialId = await credentialManager.storeCredential(
        credentialData,
        'original-key',
        'user-123'
      );
    });

    it('should rotate credential value', async () => {
      const newValue = 'rotated-key-value';

      await credentialManager.rotateCredential(testCredentialId, newValue, 'user-123');

      const retrievedValue = await credentialManager.retrieveCredential(
        testCredentialId,
        'user-123',
        'test',
        {}
      );
      expect(retrievedValue).toBe(newValue);
    });

    it('should emit events when rotating credentials', async () => {
      const eventSpy = jest.fn();
      credentialManager.on('credentialRotated', eventSpy);

      await credentialManager.rotateCredential(testCredentialId, 'new-rotated-value', 'user-123');

      expect(eventSpy).toHaveBeenCalledWith({
        credentialId: testCredentialId,
        userId: 'user-123',
      });
    });

    it('should deny rotation for users without permissions', async () => {
      await expect(
        credentialManager.rotateCredential(testCredentialId, 'new-value', 'unauthorized-user')
      ).rejects.toThrow('Insufficient permissions to rotate credential');
    });

    it('should log rotation in usage logs', async () => {
      await credentialManager.rotateCredential(testCredentialId, 'rotated-value', 'user-123');

      const logs = credentialManager.getUsageLogs({ credentialId: testCredentialId });
      const rotationLog = logs.find(log => log.purpose === 'credential_rotation');

      expect(rotationLog).toBeDefined();
      expect(rotationLog?.action).toBe('updated');
      expect(rotationLog?.userId).toBe('user-123');
    });
  });

  describe('Usage Logging', () => {
    let testCredentialId: string;

    beforeEach(async () => {
      const credentialData = {
        name: 'Logging Test Credential',
        type: 'api_key' as const,
        provider: 'test-provider',
        description: 'Test credential for logging',
        metadata: {
          environment: 'development' as const,
          scope: ['read'],
          allowedDomains: ['api.test.com'],
          tags: ['test'],
          owner: 'test-user',
          team: 'engineering',
        },
        permissions: [
          {
            userId: 'user-123',
            role: 'user',
            actions: ['read', 'use'],
          },
        ],
        isActive: true,
      };

      testCredentialId = await credentialManager.storeCredential(
        credentialData,
        'logging-test-value',
        'user-123'
      );
    });

    it('should log successful credential retrieval', async () => {
      await credentialManager.retrieveCredential(testCredentialId, 'user-123', 'api_call', {
        apiEndpoint: 'https://api.test.com',
      });

      const logs = credentialManager.getUsageLogs({ credentialId: testCredentialId });
      const retrievalLog = logs.find(log => log.action === 'retrieved' && log.success);

      expect(retrievalLog).toBeDefined();
      expect(retrievalLog?.userId).toBe('user-123');
      expect(retrievalLog?.purpose).toBe('api_call');
      expect(retrievalLog?.context.apiEndpoint).toBe('https://api.test.com');
    });

    it('should log failed credential access attempts', async () => {
      try {
        await credentialManager.retrieveCredential(
          testCredentialId,
          'unauthorized-user',
          'api_call',
          {}
        );
      } catch (error) {
        // Expected to fail
      }

      const logs = credentialManager.getUsageLogs({ credentialId: testCredentialId });
      const failedLog = logs.find(log => log.action === 'retrieved' && !log.success);

      expect(failedLog).toBeDefined();
      expect(failedLog?.userId).toBe('unauthorized-user');
      expect(failedLog?.errorMessage).toBeDefined();
    });

    it('should filter usage logs', async () => {
      // Create multiple log entries
      await credentialManager.retrieveCredential(testCredentialId, 'user-123', 'api_call_1', {});
      await credentialManager.retrieveCredential(testCredentialId, 'user-123', 'api_call_2', {});

      // Filter by purpose
      const filteredLogs = credentialManager.getUsageLogs({
        credentialId: testCredentialId,
        userId: 'user-123',
      });

      expect(filteredLogs.length).toBeGreaterThan(0);
      filteredLogs.forEach(log => {
        expect(log.credentialId).toBe(testCredentialId);
        expect(log.userId).toBe('user-123');
      });
    });

    it('should emit usage log events', async () => {
      const logSpy = jest.fn();
      credentialManager.on('usageLogged', logSpy);

      await credentialManager.retrieveCredential(testCredentialId, 'user-123', 'api_call', {});

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          credentialId: testCredentialId,
          userId: 'user-123',
          action: 'retrieved',
          success: true,
        })
      );
    });
  });

  describe('Credential Health Monitoring', () => {
    beforeEach(async () => {
      // Create credentials with different states
      const credentials = [
        {
          name: 'Active Credential',
          isActive: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
        {
          name: 'Expired Credential',
          isActive: true,
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          name: 'Expiring Soon Credential',
          isActive: true,
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        },
        {
          name: 'Inactive Credential',
          isActive: false,
        },
      ];

      for (const cred of credentials) {
        const credentialData = {
          ...cred,
          type: 'api_key' as const,
          provider: 'test-provider',
          description: 'Health test credential',
          metadata: {
            environment: 'development' as const,
            scope: [],
            allowedDomains: [],
            tags: [],
            owner: 'test-user',
            team: 'test',
          },
          permissions: [],
        };

        await credentialManager.storeCredential(credentialData, 'test-value', 'user-123');
      }
    });

    it('should provide credential health summary', async () => {
      const health = await credentialManager.checkCredentialHealth();

      expect(health.total).toBe(4);
      expect(health.active).toBe(3); // 3 active credentials
      expect(health.expired).toBe(1); // 1 expired credential
      expect(health.expiringSoon).toBe(1); // 1 expiring soon
    });
  });

  describe('Encryption and Security', () => {
    it('should encrypt credential values securely', async () => {
      const credentialData = {
        name: 'Encryption Test',
        type: 'api_key' as const,
        provider: 'test-provider',
        description: 'Test encryption',
        metadata: {
          environment: 'development' as const,
          scope: [],
          allowedDomains: [],
          tags: [],
          owner: 'test-user',
          team: 'test',
        },
        permissions: [
          {
            userId: 'user-123',
            role: 'user',
            actions: ['read', 'use'],
          },
        ],
        isActive: true,
      };

      const plainTextValue = 'super-secret-api-key-12345';
      const credentialId = await credentialManager.storeCredential(
        credentialData,
        plainTextValue,
        'user-123'
      );

      // Retrieve and verify decryption
      const decryptedValue = await credentialManager.retrieveCredential(
        credentialId,
        'user-123',
        'test',
        {}
      );
      expect(decryptedValue).toBe(plainTextValue);
    });

    it('should handle encryption errors gracefully', async () => {
      // Create manager with invalid encryption config
      const invalidOptions = {
        ...defaultOptions,
        encryptionKey: 'invalid-short-key',
      };

      const invalidManager = new SecureCredentialManager(invalidOptions);

      const credentialData = {
        name: 'Invalid Encryption Test',
        type: 'api_key' as const,
        provider: 'test-provider',
        description: 'Test invalid encryption',
        metadata: {
          environment: 'development' as const,
          scope: [],
          allowedDomains: [],
          tags: [],
          owner: 'test-user',
          team: 'test',
        },
        permissions: [],
        isActive: true,
      };

      // Should handle encryption errors
      await expect(
        invalidManager.storeCredential(credentialData, 'test-value', 'user-123')
      ).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should emit error events', async () => {
      const errorSpy = jest.fn();
      credentialManager.on('credentialError', errorSpy);

      // Try to retrieve non-existent credential
      try {
        await credentialManager.retrieveCredential('non-existent-id', 'user-123', 'test', {});
      } catch (error) {
        // Expected to throw
      }

      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'retrieve',
          credentialId: 'non-existent-id',
          userId: 'user-123',
        })
      );
    });

    it('should handle concurrent access gracefully', async () => {
      const credentialData = {
        name: 'Concurrent Test',
        type: 'api_key' as const,
        provider: 'test-provider',
        description: 'Test concurrent access',
        metadata: {
          environment: 'development' as const,
          scope: [],
          allowedDomains: [],
          tags: [],
          owner: 'test-user',
          team: 'test',
        },
        permissions: [
          {
            userId: 'user-123',
            role: 'user',
            actions: ['read', 'use'],
          },
        ],
        isActive: true,
      };

      const credentialId = await credentialManager.storeCredential(
        credentialData,
        'concurrent-test-value',
        'user-123'
      );

      // Multiple concurrent retrievals
      const promises = Array.from({ length: 10 }, () =>
        credentialManager.retrieveCredential(credentialId, 'user-123', 'concurrent_test', {})
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBe('concurrent-test-value');
      });
    });
  });
});
