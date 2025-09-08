/**
 * Unit tests for Secure Document Handler
 */

import { SecureDocumentHandler, DocumentSecurityContext, SecureDocumentOptions } from '../../components/secure-document-handler';

describe('SecureDocumentHandler', () => {
  let handler: SecureDocumentHandler;
  let mockContext: DocumentSecurityContext;
  let defaultOptions: SecureDocumentOptions;

  beforeEach(() => {
    defaultOptions = {
      sanitizationLevel: 'strict',
      retentionPolicyHours: 24,
      allowExternalAPIs: false,
      logLevel: 'basic'
    };

    handler = new SecureDocumentHandler(defaultOptions);

    mockContext = {
      documentId: 'test-doc-123',
      userId: 'user-456',
      accessLevel: 'read',
      sessionId: 'session-789',
      timestamp: new Date(),
      ipAddress: '192.168.1.1',
      userAgent: 'test-agent'
    };
  });

  afterEach(() => {
    handler.removeAllListeners();
  });

  describe('Document Processing', () => {
    it('should process document with basic sanitization', async () => {
      const content = 'Contact John Doe at john.doe@example.com or call (555) 123-4567';
      
      const result = await handler.processDocument(content, mockContext);
      
      expect(result.processedContent).toBeDefined();
      expect(result.securityReport).toBeDefined();
      expect(result.auditTrail).toBeDefined();
      expect(result.securityReport.riskLevel).toBe('low');
    });

    it('should detect and sanitize PII in content', async () => {
      const content = 'User email: test@company.com, SSN: 123-45-6789, Phone: (555) 123-4567';
      
      const result = await handler.processDocument(content, mockContext);
      
      expect(result.processedContent).not.toContain('test@company.com');
      expect(result.processedContent).not.toContain('123-45-6789');
      expect(result.processedContent).not.toContain('(555) 123-4567');
      expect(result.securityReport.detectedThreats.length).toBeGreaterThan(0);
    });

    it('should handle different sanitization levels', async () => {
      const strictOptions: SecureDocumentOptions = {
        ...defaultOptions,
        sanitizationLevel: 'strict'
      };
      const strictHandler = new SecureDocumentHandler(strictOptions);
      
      const content = 'API Key: abc123def456ghi789, Credit Card: 4111-1111-1111-1111';
      
      const result = await strictHandler.processDocument(content, mockContext);
      
      expect(result.processedContent).not.toContain('abc123def456ghi789');
      expect(result.processedContent).not.toContain('4111-1111-1111-1111');
      expect(result.securityReport.riskLevel).toBe('high');
    });

    it('should encrypt content when risk level is high', async () => {
      const content = 'password: secret123, api_key: very_secret_key_12345';
      
      const result = await handler.processDocument(content, mockContext);
      
      if (result.securityReport.riskLevel === 'high' || result.securityReport.riskLevel === 'critical') {
        expect(result.processedContent).not.toEqual(content);
        // Should be encrypted JSON string
        expect(() => JSON.parse(result.processedContent)).not.toThrow();
      }
    });

    it('should emit events during processing', async () => {
      const eventSpy = jest.fn();
      handler.on('documentProcessed', eventSpy);
      
      const content = 'Safe content without sensitive data';
      
      await handler.processDocument(content, mockContext);
      
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        processedContent: expect.any(String),
        securityReport: expect.any(Object),
        auditTrail: expect.any(Array)
      }));
    });

    it('should handle processing errors gracefully', async () => {
      // Mock an error condition
      const invalidContext = { ...mockContext, documentId: '' };
      
      await expect(handler.processDocument('test content', invalidContext))
        .rejects.toThrow('Secure document processing failed');
    });
  });

  describe('Content Sanitization', () => {
    it('should remove email addresses', async () => {
      const content = 'Contact us at support@company.com or admin@test.org';
      
      const result = await handler.processDocument(content, mockContext);
      
      expect(result.processedContent).toContain('[EMAIL_REDACTED]');
      expect(result.processedContent).not.toContain('support@company.com');
      expect(result.processedContent).not.toContain('admin@test.org');
    });

    it('should remove phone numbers', async () => {
      const content = 'Call us at (555) 123-4567 or 555.987.6543';
      
      const result = await handler.processDocument(content, mockContext);
      
      expect(result.processedContent).toContain('[PHONE_REDACTED]');
      expect(result.processedContent).not.toContain('(555) 123-4567');
      expect(result.processedContent).not.toContain('555.987.6543');
    });

    it('should remove SSN patterns', async () => {
      const content = 'SSN: 123-45-6789 or 987654321';
      
      const result = await handler.processDocument(content, mockContext);
      
      expect(result.processedContent).toContain('[SSN_REDACTED]');
      expect(result.processedContent).not.toContain('123-45-6789');
    });

    it('should handle paranoid sanitization level', async () => {
      const paranoidOptions: SecureDocumentOptions = {
        ...defaultOptions,
        sanitizationLevel: 'paranoid'
      };
      const paranoidHandler = new SecureDocumentHandler(paranoidOptions);
      
      const content = 'Server IP: 192.168.1.100, Admin URL: https://admin.company.com/secret';
      
      const result = await paranoidHandler.processDocument(content, mockContext);
      
      expect(result.processedContent).toContain('[IP_REDACTED]');
      expect(result.processedContent).toContain('[SENSITIVE_URL_REDACTED]');
      expect(result.processedContent).not.toContain('192.168.1.100');
      expect(result.processedContent).not.toContain('https://admin.company.com/secret');
    });
  });

  describe('Security Analysis', () => {
    it('should detect PII threats', async () => {
      const content = 'User: John Doe, Email: john@example.com, Phone: 555-1234';
      
      const result = await handler.processDocument(content, mockContext);
      
      const piiThreats = result.securityReport.detectedThreats.filter(t => t.type === 'pii');
      expect(piiThreats.length).toBeGreaterThan(0);
    });

    it('should detect credential threats', async () => {
      const content = 'password: secret123, api_key: abc123def456';
      
      const result = await handler.processDocument(content, mockContext);
      
      const credentialThreats = result.securityReport.detectedThreats.filter(t => t.type === 'credentials');
      expect(credentialThreats.length).toBeGreaterThan(0);
      expect(result.securityReport.riskLevel).toBe('critical');
    });

    it('should detect sensitive business data', async () => {
      const content = 'This is confidential information about our proprietary algorithm';
      
      const result = await handler.processDocument(content, mockContext);
      
      const businessThreats = result.securityReport.detectedThreats.filter(t => t.type === 'sensitive_data');
      expect(businessThreats.length).toBeGreaterThan(0);
    });

    it('should provide security recommendations', async () => {
      const content = 'password: test123, email: user@company.com';
      
      const result = await handler.processDocument(content, mockContext);
      
      expect(result.securityReport.recommendations).toBeDefined();
      expect(result.securityReport.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt content correctly', () => {
      const originalContent = 'This is sensitive content that needs encryption';
      
      const encrypted = (handler as any).encryptContent(originalContent);
      expect(encrypted).not.toEqual(originalContent);
      expect(encrypted).toMatch(/^{.*}$/); // Should be JSON format
      
      const decrypted = handler.decryptContent(encrypted);
      expect(decrypted).toEqual(originalContent);
    });

    it('should handle decryption errors gracefully', () => {
      const invalidEncryptedData = 'invalid-encrypted-data';
      
      expect(() => handler.decryptContent(invalidEncryptedData))
        .toThrow('Failed to decrypt content');
    });
  });

  describe('Audit Trail', () => {
    it('should maintain audit trail of operations', async () => {
      const content = 'Test content for audit trail';
      
      const result = await handler.processDocument(content, mockContext);
      
      expect(result.auditTrail).toBeDefined();
      expect(result.auditTrail.length).toBeGreaterThan(0);
      
      const auditEntry = result.auditTrail[0];
      expect(auditEntry.userId).toBe(mockContext.userId);
      expect(auditEntry.documentId).toBe(mockContext.documentId);
      expect(auditEntry.timestamp).toBeDefined();
    });

    it('should clean up old audit entries based on retention policy', async () => {
      const shortRetentionOptions: SecureDocumentOptions = {
        ...defaultOptions,
        retentionPolicyHours: 0.001, // Very short retention for testing
        sanitizationLevel: 'basic'
      };
      const shortRetentionHandler = new SecureDocumentHandler(shortRetentionOptions);
      
      // Process a document
      await shortRetentionHandler.processDocument('test content', mockContext);
      
      // Wait for retention cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Process another document to trigger cleanup
      const result = await shortRetentionHandler.processDocument('test content 2', mockContext);
      
      // Should only have recent entries
      expect(result.auditTrail.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Configuration and Options', () => {
    it('should respect external API restrictions', async () => {
      const restrictedOptions: SecureDocumentOptions = {
        ...defaultOptions,
        allowExternalAPIs: false
      };
      const restrictedHandler = new SecureDocumentHandler(restrictedOptions);
      
      const content = 'Test content';
      const result = await restrictedHandler.processDocument(content, mockContext);
      
      expect(result).toBeDefined();
      // Should process without external API calls
    });

    it('should handle different log levels', async () => {
      const verboseOptions: SecureDocumentOptions = {
        ...defaultOptions,
        logLevel: 'detailed'
      };
      const verboseHandler = new SecureDocumentHandler(verboseOptions);
      
      const content = 'Test content with detailed logging';
      const result = await verboseHandler.processDocument(content, mockContext);
      
      expect(result.auditTrail.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed context gracefully', async () => {
      const malformedContext = {
        ...mockContext,
        timestamp: null as any
      };
      
      await expect(handler.processDocument('test', malformedContext))
        .rejects.toThrow();
    });

    it('should emit error events on failures', async () => {
      const errorSpy = jest.fn();
      handler.on('error', errorSpy);
      
      // Force an error condition
      const invalidContent = null as any;
      
      try {
        await handler.processDocument(invalidContent, mockContext);
      } catch (error) {
        // Expected to throw
      }
      
      // Should have emitted error event
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should process documents within reasonable time', async () => {
      const largeContent = 'A'.repeat(10000); // 10KB content
      const startTime = Date.now();
      
      await handler.processDocument(largeContent, mockContext);
      
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent processing', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        handler.processDocument(`Test content ${i}`, {
          ...mockContext,
          documentId: `doc-${i}`
        })
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.processedContent).toBeDefined();
        expect(result.securityReport).toBeDefined();
      });
    });
  });
});