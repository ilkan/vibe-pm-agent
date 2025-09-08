/**
 * Integration tests for Security and Privacy Controls
 * 
 * Tests the integration between all security components:
 * - Secure Document Handler
 * - Access Control Manager
 * - Data Anonymization Service
 * - Secure Credential Manager
 */

import { SecureDocumentHandler, DocumentSecurityContext, SecureDocumentOptions } from '../../components/secure-document-handler';
import { AccessControlManager, User, AccessRequest } from '../../components/access-control-manager';
import { DataAnonymizationService, AnonymizationOptions, AnonymizationContext } from '../../components/data-anonymization-service';
import { SecureCredentialManager, SecureCredentialOptions } from '../../components/secure-credential-manager';

describe('Security Integration Tests', () => {
  let documentHandler: SecureDocumentHandler;
  let accessControl: AccessControlManager;
  let anonymizationService: DataAnonymizationService;
  let credentialManager: SecureCredentialManager;
  let testUser: User;

  beforeEach(async () => {
    // Initialize all security components
    const documentOptions: SecureDocumentOptions = {
      sanitizationLevel: 'strict',
      retentionPolicyHours: 24,
      allowExternalAPIs: false,
      logLevel: 'basic'
    };
    documentHandler = new SecureDocumentHandler(documentOptions);

    accessControl = new AccessControlManager();
    anonymizationService = new DataAnonymizationService();

    const credentialOptions: SecureCredentialOptions = {
      encryptionKey: 'a'.repeat(64),
      encryptionConfig: {
        algorithm: 'aes-256-gcm',
        keyDerivation: 'pbkdf2',
        iterations: 10000,
        saltLength: 32,
        ivLength: 16
      },
      auditLogging: true,
      maxRetentionDays: 90,
      requireApprovalForAccess: false
    };
    credentialManager = new SecureCredentialManager(credentialOptions);

    // Create test user with appropriate permissions
    testUser = await accessControl.addUser({
      username: 'security-test-user',
      email: 'security@test.com',
      roles: [],
      permissions: [{
        id: 'document-access',
        resource: 'citation_data',
        action: 'read'
      }],
      isActive: true
    });
  });

  afterEach(() => {
    documentHandler.removeAllListeners();
    accessControl.removeAllListeners();
    anonymizationService.removeAllListeners();
    credentialManager.removeAllListeners();
  });

  describe('End-to-End Security Workflow', () => {
    it('should process sensitive document with full security pipeline', async () => {
      // 1. Store API credentials securely
      const credentialData = {
        name: 'External API Key',
        type: 'api_key' as const,
        provider: 'external-service',
        description: 'API key for external data source',
        metadata: {
          environment: 'production' as const,
          scope: ['read'],
          allowedDomains: ['api.external.com'],
          tags: ['citation', 'external'],
          owner: testUser.id,
          team: 'research'
        },
        permissions: [{
          userId: testUser.id,
          role: 'user',
          actions: ['read', 'use']
        }],
        isActive: true
      };

      const credentialId = await credentialManager.storeCredential(
        credentialData,
        'sk_live_1234567890abcdef',
        testUser.id
      );

      // 2. Check access permissions
      const accessRequest: AccessRequest = {
        userId: testUser.id,
        resource: 'citation_data',
        action: 'read',
        context: {
          documentId: 'test-doc-123',
          sessionId: 'session-456'
        },
        timestamp: new Date()
      };

      const accessResult = await accessControl.checkAccess(accessRequest);
      expect(accessResult.granted).toBe(true);

      // 3. Process sensitive document
      const sensitiveContent = `
        Business Analysis Report
        
        Contact: John Doe (john.doe@company.com)
        Phone: (555) 123-4567
        SSN: 123-45-6789
        
        API Key: sk_live_1234567890abcdef
        Credit Card: 4111-1111-1111-1111
        
        This confidential report contains proprietary information
        about our market strategy and competitive positioning.
      `;

      const securityContext: DocumentSecurityContext = {
        documentId: 'test-doc-123',
        userId: testUser.id,
        accessLevel: 'read',
        sessionId: 'session-456',
        timestamp: new Date(),
        ipAddress: '192.168.1.100'
      };

      const documentResult = await documentHandler.processDocument(sensitiveContent, securityContext);

      // Verify document was sanitized
      expect(documentResult.processedContent).not.toContain('john.doe@company.com');
      expect(documentResult.processedContent).not.toContain('(555) 123-4567');
      expect(documentResult.processedContent).not.toContain('123-45-6789');
      expect(documentResult.processedContent).not.toContain('sk_live_1234567890abcdef');
      expect(documentResult.processedContent).not.toContain('4111-1111-1111-1111');

      // Verify security threats were detected
      expect(documentResult.securityReport.detectedThreats.length).toBeGreaterThan(0);
      expect(documentResult.securityReport.riskLevel).toBe('critical');

      // 4. Anonymize data for external API call
      const anonymizationOptions: AnonymizationOptions = {
        level: 'strict',
        preserveStructure: true,
        preserveDataTypes: false,
        customRules: [],
        allowedFields: [],
        blockedFields: ['ssn', 'creditCard', 'apiKey']
      };

      const anonymizationContext: AnonymizationContext = {
        apiEndpoint: 'https://api.external.com/analyze',
        dataType: 'text',
        purpose: 'external_analysis',
        retentionPeriod: 24,
        complianceRequirements: ['GDPR', 'CCPA']
      };

      const anonymizedResult = await anonymizationService.anonymizeForExternalAPI(
        { content: documentResult.processedContent },
        anonymizationContext,
        anonymizationOptions
      );

      // Verify anonymization was applied
      expect(anonymizedResult.anonymizedData).toBeDefined();
      expect(anonymizedResult.metadata.preservationScore).toBeLessThan(100);

      // 5. Retrieve credentials for external API call
      const retrievedCredential = await credentialManager.retrieveCredential(
        credentialId,
        testUser.id,
        'external_api_call',
        { apiEndpoint: 'https://api.external.com/analyze' }
      );

      expect(retrievedCredential).toBe('sk_live_1234567890abcdef');

      // 6. Verify audit trails were created
      const accessLogs = accessControl.getAccessLogs({ userId: testUser.id });
      expect(accessLogs.length).toBeGreaterThan(0);

      const credentialLogs = credentialManager.getUsageLogs({ credentialId });
      expect(credentialLogs.length).toBeGreaterThan(0);

      expect(documentResult.auditTrail.length).toBeGreaterThan(0);
    });

    it('should deny access and prevent data leakage for unauthorized users', async () => {
      // Create unauthorized user
      const unauthorizedUser = await accessControl.addUser({
        username: 'unauthorized-user',
        email: 'unauthorized@test.com',
        roles: [],
        permissions: [], // No permissions
        isActive: true
      });

      // Try to access restricted resource
      const accessRequest: AccessRequest = {
        userId: unauthorizedUser.id,
        resource: 'audit_trail',
        action: 'read',
        context: {},
        timestamp: new Date()
      };

      const accessResult = await accessControl.checkAccess(accessRequest);
      expect(accessResult.granted).toBe(false);

      // Try to process sensitive document
      const sensitiveContent = 'Confidential: API Key sk_live_secret123';
      const securityContext: DocumentSecurityContext = {
        documentId: 'unauthorized-doc',
        userId: unauthorizedUser.id,
        accessLevel: 'read',
        sessionId: 'unauthorized-session',
        timestamp: new Date()
      };

      // Should still process but with strict sanitization
      const documentResult = await documentHandler.processDocument(sensitiveContent, securityContext);
      expect(documentResult.processedContent).not.toContain('sk_live_secret123');

      // Verify access denial was logged
      const accessLogs = accessControl.getAccessLogs({ 
        userId: unauthorizedUser.id,
        granted: false 
      });
      expect(accessLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Component Security Validation', () => {
    it('should validate user permissions before document processing', async () => {
      const restrictedContent = 'This document contains trade secrets and confidential information';
      
      // Check access first
      const accessRequest: AccessRequest = {
        userId: testUser.id,
        resource: 'citation_data',
        action: 'read',
        context: { documentId: 'restricted-doc' },
        timestamp: new Date()
      };

      const accessResult = await accessControl.checkAccess(accessRequest);
      
      if (accessResult.granted) {
        const securityContext: DocumentSecurityContext = {
          documentId: 'restricted-doc',
          userId: testUser.id,
          accessLevel: 'read',
          sessionId: 'session-789',
          timestamp: new Date()
        };

        const documentResult = await documentHandler.processDocument(restrictedContent, securityContext);
        expect(documentResult.processedContent).toBeDefined();
      } else {
        // Should not process document if access denied
        expect(accessResult.granted).toBe(false);
      }
    });

    it('should anonymize credentials before external API calls', async () => {
      // Store credential
      const credentialData = {
        name: 'Test Credential for Anonymization',
        type: 'api_key' as const,
        provider: 'test-provider',
        description: 'Test credential',
        metadata: {
          environment: 'development' as const,
          scope: ['read'],
          allowedDomains: ['api.test.com'],
          tags: ['test'],
          owner: testUser.id,
          team: 'test'
        },
        permissions: [{
          userId: testUser.id,
          role: 'user',
          actions: ['read', 'use']
        }],
        isActive: true
      };

      const credentialId = await credentialManager.storeCredential(
        credentialData,
        'secret-api-key-12345',
        testUser.id
      );

      // Simulate data that might contain credential references
      const dataWithCredentials = {
        apiKey: 'secret-api-key-12345',
        endpoint: 'https://api.test.com/data',
        user: 'test@company.com'
      };

      const anonymizationOptions: AnonymizationOptions = {
        level: 'maximum',
        preserveStructure: true,
        preserveDataTypes: false,
        customRules: [],
        allowedFields: ['endpoint'],
        blockedFields: ['apiKey']
      };

      const anonymizationContext: AnonymizationContext = {
        apiEndpoint: 'https://external-api.com/process',
        dataType: 'json',
        purpose: 'external_processing',
        retentionPeriod: 1,
        complianceRequirements: ['GDPR']
      };

      const anonymizedResult = await anonymizationService.anonymizeForExternalAPI(
        dataWithCredentials,
        anonymizationContext,
        anonymizationOptions
      );

      // Verify credential was removed/anonymized
      expect(anonymizedResult.anonymizedData.apiKey).toBeUndefined();
      expect(anonymizedResult.anonymizedData.endpoint).toBe('https://api.test.com/data'); // Allowed field preserved
      expect(anonymizedResult.anonymizedData.user).not.toBe('test@company.com'); // PII anonymized
    });

    it('should maintain audit trail across all security components', async () => {
      const testDocumentId = 'audit-test-doc';
      const testSessionId = 'audit-test-session';

      // 1. Access control check
      const accessRequest: AccessRequest = {
        userId: testUser.id,
        resource: 'citation_data',
        action: 'read',
        context: { 
          documentId: testDocumentId,
          sessionId: testSessionId
        },
        timestamp: new Date()
      };

      await accessControl.checkAccess(accessRequest);

      // 2. Document processing
      const securityContext: DocumentSecurityContext = {
        documentId: testDocumentId,
        userId: testUser.id,
        accessLevel: 'read',
        sessionId: testSessionId,
        timestamp: new Date()
      };

      await documentHandler.processDocument('Test content with email@test.com', securityContext);

      // 3. Credential access
      const credentialData = {
        name: 'Audit Test Credential',
        type: 'api_key' as const,
        provider: 'audit-provider',
        description: 'Credential for audit testing',
        metadata: {
          environment: 'development' as const,
          scope: ['read'],
          allowedDomains: ['api.audit.com'],
          tags: ['audit'],
          owner: testUser.id,
          team: 'audit'
        },
        permissions: [{
          userId: testUser.id,
          role: 'user',
          actions: ['read', 'use']
        }],
        isActive: true
      };

      const credentialId = await credentialManager.storeCredential(
        credentialData,
        'audit-test-key',
        testUser.id
      );

      await credentialManager.retrieveCredential(
        credentialId,
        testUser.id,
        'audit_test',
        { sessionId: testSessionId }
      );

      // 4. Data anonymization
      const anonymizationContext: AnonymizationContext = {
        apiEndpoint: 'https://api.audit.com/process',
        dataType: 'json',
        purpose: 'audit_test',
        retentionPeriod: 1,
        complianceRequirements: []
      };

      const anonymizationOptions: AnonymizationOptions = {
        level: 'basic',
        preserveStructure: true,
        preserveDataTypes: true,
        customRules: [],
        allowedFields: [],
        blockedFields: []
      };

      await anonymizationService.anonymizeForExternalAPI(
        { testData: 'audit@test.com' },
        anonymizationContext,
        anonymizationOptions
      );

      // Verify audit trails exist across all components
      const accessLogs = accessControl.getAccessLogs({ userId: testUser.id });
      expect(accessLogs.some(log => log.context.sessionId === testSessionId)).toBe(true);

      const credentialLogs = credentialManager.getUsageLogs({ credentialId });
      expect(credentialLogs.some(log => log.context.sessionId === testSessionId)).toBe(true);

      // Document handler audit trail is returned with processing result
      // Anonymization service emits events that can be captured for audit
    });
  });

  describe('Security Policy Enforcement', () => {
    it('should enforce data retention policies', async () => {
      // Create document handler with short retention
      const shortRetentionOptions: SecureDocumentOptions = {
        sanitizationLevel: 'basic',
        retentionPolicyHours: 0.001, // Very short for testing
        allowExternalAPIs: false,
        logLevel: 'basic'
      };

      const shortRetentionHandler = new SecureDocumentHandler(shortRetentionOptions);

      const securityContext: DocumentSecurityContext = {
        documentId: 'retention-test',
        userId: testUser.id,
        accessLevel: 'read',
        sessionId: 'retention-session',
        timestamp: new Date()
      };

      // Process document
      const result1 = await shortRetentionHandler.processDocument('Test content 1', securityContext);
      expect(result1.auditTrail.length).toBeGreaterThan(0);

      // Wait for retention cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Process another document to trigger cleanup
      const result2 = await shortRetentionHandler.processDocument('Test content 2', securityContext);
      
      // Should have limited audit trail due to retention policy
      expect(result2.auditTrail.length).toBeLessThanOrEqual(10);
    });

    it('should enforce access control policies consistently', async () => {
      // Create user with limited permissions
      const limitedUser = await accessControl.addUser({
        username: 'limited-user',
        email: 'limited@test.com',
        roles: [],
        permissions: [{
          id: 'limited-permission',
          resource: 'citation_data',
          action: 'read',
          conditions: [{
            field: 'ipAddress',
            operator: 'equals',
            value: '192.168.1.100'
          }]
        }],
        isActive: true
      });

      // Test access with matching condition
      const matchingRequest: AccessRequest = {
        userId: limitedUser.id,
        resource: 'citation_data',
        action: 'read',
        context: { ipAddress: '192.168.1.100' },
        timestamp: new Date()
      };

      const matchingResult = await accessControl.checkAccess(matchingRequest);
      expect(matchingResult.granted).toBe(true);

      // Test access with non-matching condition
      const nonMatchingRequest: AccessRequest = {
        userId: limitedUser.id,
        resource: 'citation_data',
        action: 'read',
        context: { ipAddress: '192.168.1.200' },
        timestamp: new Date()
      };

      const nonMatchingResult = await accessControl.checkAccess(nonMatchingRequest);
      expect(nonMatchingResult.granted).toBe(false);
    });

    it('should enforce encryption requirements for sensitive data', async () => {
      const highSensitivityContent = `
        password: admin123
        api_key: sk_live_very_secret_key
        credit_card: 4111-1111-1111-1111
        ssn: 123-45-6789
      `;

      const securityContext: DocumentSecurityContext = {
        documentId: 'high-sensitivity-doc',
        userId: testUser.id,
        accessLevel: 'read',
        sessionId: 'encryption-test',
        timestamp: new Date()
      };

      const result = await documentHandler.processDocument(highSensitivityContent, securityContext);

      // Should detect high risk and encrypt content
      expect(result.securityReport.riskLevel).toBe('critical');
      
      // If encrypted, content should be JSON format
      if (result.securityReport.riskLevel === 'critical') {
        expect(() => JSON.parse(result.processedContent)).not.toThrow();
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent security operations', async () => {
      const concurrentOperations = Array.from({ length: 20 }, async (_, i) => {
        // Access control check
        const accessRequest: AccessRequest = {
          userId: testUser.id,
          resource: 'citation_data',
          action: 'read',
          context: { additionalData: { requestId: i } },
          timestamp: new Date()
        };

        const accessResult = await accessControl.checkAccess(accessRequest);

        if (accessResult.granted) {
          // Document processing
          const securityContext: DocumentSecurityContext = {
            documentId: `concurrent-doc-${i}`,
            userId: testUser.id,
            accessLevel: 'read',
            sessionId: `concurrent-session-${i}`,
            timestamp: new Date()
          };

          const documentResult = await documentHandler.processDocument(
            `Test content ${i} with email${i}@test.com`,
            securityContext
          );

          // Data anonymization
          const anonymizationOptions: AnonymizationOptions = {
            level: 'basic',
            preserveStructure: true,
            preserveDataTypes: true,
            customRules: [],
            allowedFields: [],
            blockedFields: []
          };

          const anonymizationContext: AnonymizationContext = {
            apiEndpoint: `https://api.test.com/endpoint${i}`,
            dataType: 'text',
            purpose: `concurrent_test_${i}`,
            retentionPeriod: 1,
            complianceRequirements: []
          };

          await anonymizationService.anonymizeForExternalAPI(
            { content: documentResult.processedContent },
            anonymizationContext,
            anonymizationOptions
          );

          return { success: true, requestId: i };
        }

        return { success: false, requestId: i };
      });

      const startTime = Date.now();
      const results = await Promise.all(concurrentOperations);
      const endTime = Date.now();

      expect(results).toHaveLength(20);
      expect(results.every(r => r.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should maintain performance with large datasets', async () => {
      // Create large document with multiple sensitive data points
      const largeContent = Array.from({ length: 1000 }, (_, i) => 
        `Entry ${i}: email${i}@company.com, phone: 555-${String(i).padStart(4, '0')}`
      ).join('\n');

      const securityContext: DocumentSecurityContext = {
        documentId: 'large-doc-test',
        userId: testUser.id,
        accessLevel: 'read',
        sessionId: 'large-doc-session',
        timestamp: new Date()
      };

      const startTime = Date.now();
      const result = await documentHandler.processDocument(largeContent, securityContext);
      const endTime = Date.now();

      expect(result.processedContent).toBeDefined();
      expect(result.securityReport).toBeDefined();
      expect(endTime - startTime).toBeLessThan(15000); // Should complete within 15 seconds

      // Verify sanitization was applied
      expect(result.processedContent).not.toContain('email0@company.com');
      expect(result.processedContent).not.toContain('555-0000');
    });
  });

  describe('Compliance and Regulatory Requirements', () => {
    it('should support GDPR compliance workflow', async () => {
      const gdprData = {
        personalData: {
          name: 'Hans Mueller',
          email: 'hans.mueller@example.de',
          address: 'Hauptstraße 123, Berlin, Germany',
          phone: '+49 30 12345678'
        },
        businessData: {
          companyName: 'Example GmbH',
          vatNumber: 'DE123456789'
        }
      };

      // Anonymize for GDPR compliance
      const gdprAnonymizationOptions: AnonymizationOptions = {
        level: 'maximum',
        preserveStructure: true,
        preserveDataTypes: false,
        customRules: [],
        allowedFields: ['companyName'], // Business data may be preserved
        blockedFields: ['name', 'email', 'address', 'phone'] // Personal data must be anonymized
      };

      const gdprContext: AnonymizationContext = {
        apiEndpoint: 'https://api.external-eu.com/process',
        dataType: 'json',
        purpose: 'gdpr_compliant_processing',
        retentionPeriod: 24,
        complianceRequirements: ['GDPR']
      };

      const result = await anonymizationService.anonymizeForExternalAPI(
        gdprData,
        gdprContext,
        gdprAnonymizationOptions
      );

      // Verify GDPR compliance
      expect(result.anonymizedData.personalData?.name).not.toBe('Hans Mueller');
      expect(result.anonymizedData.personalData?.email).not.toBe('hans.mueller@example.de');
      expect(result.anonymizedData.personalData?.address).not.toBe('Hauptstraße 123, Berlin, Germany');
      expect(result.anonymizedData.personalData?.phone).not.toBe('+49 30 12345678');
      
      // Business data may be preserved if allowed
      expect(result.anonymizedData.businessData?.companyName).toBe('Example GmbH');
    });

    it('should support CCPA compliance workflow', async () => {
      const ccpaData = {
        consumerInfo: {
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '(555) 123-4567',
          address: '123 Main St, Los Angeles, CA 90210'
        },
        businessInfo: {
          transactionId: 'TXN-12345',
          amount: '$99.99'
        }
      };

      const ccpaAnonymizationOptions: AnonymizationOptions = {
        level: 'strict',
        preserveStructure: true,
        preserveDataTypes: false,
        customRules: [],
        allowedFields: ['transactionId'], // Transaction data may be preserved
        blockedFields: ['name', 'email', 'phone', 'address'] // Consumer data must be anonymized
      };

      const ccpaContext: AnonymizationContext = {
        apiEndpoint: 'https://api.external-us.com/process',
        dataType: 'json',
        purpose: 'ccpa_compliant_processing',
        retentionPeriod: 12,
        complianceRequirements: ['CCPA']
      };

      const result = await anonymizationService.anonymizeForExternalAPI(
        ccpaData,
        ccpaContext,
        ccpaAnonymizationOptions
      );

      // Verify CCPA compliance
      expect(result.anonymizedData.consumerInfo?.name).not.toBe('John Smith');
      expect(result.anonymizedData.consumerInfo?.email).not.toBe('john.smith@example.com');
      expect(result.anonymizedData.consumerInfo?.phone).not.toBe('(555) 123-4567');
      expect(result.anonymizedData.consumerInfo?.address).not.toBe('123 Main St, Los Angeles, CA 90210');
      
      // Business transaction data may be preserved
      expect(result.anonymizedData.businessInfo?.transactionId).toBe('TXN-12345');
    });
  });
});