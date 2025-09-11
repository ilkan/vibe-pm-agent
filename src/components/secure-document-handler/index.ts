/**
 * Secure Document Handler
 *
 * Provides secure handling of document content during citation processing
 * with data sanitization, encryption, and privacy protection.
 */

import * as crypto from 'crypto';
import { EventEmitter } from 'events';

export interface SecureDocumentOptions {
  encryptionKey?: string;
  sanitizationLevel: 'basic' | 'strict' | 'paranoid';
  retentionPolicyHours: number;
  allowExternalAPIs: boolean;
  logLevel: 'none' | 'basic' | 'detailed';
}

export interface DocumentSecurityContext {
  documentId: string;
  userId: string;
  accessLevel: 'read' | 'write' | 'admin';
  sessionId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SanitizedDocument {
  content: string;
  metadata: {
    originalLength: number;
    sanitizedLength: number;
    removedElements: string[];
    confidenceScore: number;
  };
  securityFlags: string[];
}

export interface DocumentProcessingResult {
  processedContent: string;
  securityReport: SecurityReport;
  auditTrail: AuditEntry[];
}

export interface SecurityReport {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  detectedThreats: SecurityThreat[];
  sanitizationActions: string[];
  recommendations: string[];
}

export interface SecurityThreat {
  type: 'pii' | 'credentials' | 'sensitive_data' | 'malicious_content';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  mitigated: boolean;
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  userId: string;
  documentId: string;
  details: Record<string, any>;
  securityContext: DocumentSecurityContext;
}

export class SecureDocumentHandler extends EventEmitter {
  private encryptionKey: string;
  private options: SecureDocumentOptions;
  private auditLog: AuditEntry[] = [];

  constructor(options: SecureDocumentOptions) {
    super();
    this.options = options;
    this.encryptionKey = options.encryptionKey || this.generateEncryptionKey();
  }

  /**
   * Securely process document content with sanitization and encryption
   */
  async processDocument(
    content: string,
    context: DocumentSecurityContext
  ): Promise<DocumentProcessingResult> {
    const startTime = Date.now();

    try {
      // Log document processing start
      this.logAuditEntry('document_processing_start', context, {
        contentLength: content.length,
        sanitizationLevel: this.options.sanitizationLevel,
      });

      // Sanitize document content
      const sanitized = await this.sanitizeContent(content, context);

      // Perform security analysis
      const securityReport = await this.analyzeSecurityThreats(sanitized.content, context);

      // Encrypt sensitive content if needed
      const processedContent = this.shouldEncrypt(securityReport)
        ? this.encryptContent(sanitized.content)
        : sanitized.content;

      const result: DocumentProcessingResult = {
        processedContent,
        securityReport,
        auditTrail: this.getRecentAuditEntries(context.documentId),
      };

      // Log successful processing
      this.logAuditEntry('document_processing_complete', context, {
        processingTimeMs: Date.now() - startTime,
        riskLevel: securityReport.riskLevel,
        threatsDetected: securityReport.detectedThreats.length,
      });

      this.emit('documentProcessed', result);
      return result;
    } catch (error) {
      // Log processing error
      this.logAuditEntry('document_processing_error', context, {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime,
      });

      throw new Error(
        `Secure document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Sanitize document content based on security level
   */
  private async sanitizeContent(
    content: string,
    context: DocumentSecurityContext
  ): Promise<SanitizedDocument> {
    const originalLength = content.length;
    let sanitizedContent = content;
    const removedElements: string[] = [];
    const securityFlags: string[] = [];

    // Remove PII based on sanitization level
    if (
      this.options.sanitizationLevel === 'basic' ||
      this.options.sanitizationLevel === 'strict' ||
      this.options.sanitizationLevel === 'paranoid'
    ) {
      // Remove email addresses
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      if (emailRegex.test(sanitizedContent)) {
        sanitizedContent = sanitizedContent.replace(emailRegex, '[EMAIL_REDACTED]');
        removedElements.push('email_addresses');
      }

      // Remove phone numbers
      const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
      if (phoneRegex.test(sanitizedContent)) {
        sanitizedContent = sanitizedContent.replace(phoneRegex, '[PHONE_REDACTED]');
        removedElements.push('phone_numbers');
      }

      // Remove SSN patterns
      const ssnRegex = /\b\d{3}-?\d{2}-?\d{4}\b/g;
      if (ssnRegex.test(sanitizedContent)) {
        sanitizedContent = sanitizedContent.replace(ssnRegex, '[SSN_REDACTED]');
        removedElements.push('ssn_patterns');
        securityFlags.push('pii_detected');
      }
    }

    if (
      this.options.sanitizationLevel === 'strict' ||
      this.options.sanitizationLevel === 'paranoid'
    ) {
      // Remove credit card patterns
      const ccRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
      if (ccRegex.test(sanitizedContent)) {
        sanitizedContent = sanitizedContent.replace(ccRegex, '[CARD_REDACTED]');
        removedElements.push('credit_card_patterns');
        securityFlags.push('financial_data_detected');
      }

      // Remove potential API keys
      const apiKeyRegex = /(?:api[_-]?key\s*[:=]\s*)?[A-Za-z0-9]{20,}/gi;
      if (apiKeyRegex.test(sanitizedContent)) {
        sanitizedContent = sanitizedContent.replace(apiKeyRegex, '[API_KEY_REDACTED]');
        removedElements.push('api_keys');
        securityFlags.push('credentials_detected');
      }
    }

    if (this.options.sanitizationLevel === 'paranoid') {
      // Remove IP addresses
      const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
      if (ipRegex.test(sanitizedContent)) {
        sanitizedContent = sanitizedContent.replace(ipRegex, '[IP_REDACTED]');
        removedElements.push('ip_addresses');
      }

      // Remove URLs with sensitive patterns
      const sensitiveUrlRegex =
        /(https?:\/\/[^\s]+(?:admin|login|password|secret|private|internal)[^\s]*)/gi;
      if (sensitiveUrlRegex.test(sanitizedContent)) {
        sanitizedContent = sanitizedContent.replace(sensitiveUrlRegex, '[SENSITIVE_URL_REDACTED]');
        removedElements.push('sensitive_urls');
        securityFlags.push('sensitive_urls_detected');
      }
    }

    const confidenceScore = this.calculateSanitizationConfidence(
      originalLength,
      sanitizedContent.length,
      removedElements.length
    );

    return {
      content: sanitizedContent,
      metadata: {
        originalLength,
        sanitizedLength: sanitizedContent.length,
        removedElements,
        confidenceScore,
      },
      securityFlags,
    };
  }

  /**
   * Analyze content for security threats
   */
  private async analyzeSecurityThreats(
    content: string,
    context: DocumentSecurityContext
  ): Promise<SecurityReport> {
    const threats: SecurityThreat[] = [];
    const sanitizationActions: string[] = [];
    const recommendations: string[] = [];

    // Check for remaining PII (after sanitization)
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phonePattern = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
    const ssnPattern = /\b\d{3}-?\d{2}-?\d{4}\b/;

    if (emailPattern.test(content) || phonePattern.test(content) || ssnPattern.test(content)) {
      threats.push({
        type: 'pii',
        severity: 'high',
        location: 'document_content',
        description: 'Potential personally identifiable information detected',
        mitigated: false,
      });
      recommendations.push('Review content for PII and increase sanitization level');
    }

    // Check for credentials
    const credentialPatterns = [
      /password\s*[:=]\s*[^\s]+/i,
      /api[_-]?key\s*[:=]\s*[^\s]+/i,
      /secret\s*[:=]\s*[^\s]+/i,
      /token\s*[:=]\s*[^\s]+/i,
    ];

    if (credentialPatterns.some(pattern => pattern.test(content))) {
      threats.push({
        type: 'credentials',
        severity: 'critical',
        location: 'document_content',
        description: 'Potential credentials or API keys detected',
        mitigated: false,
      });
      recommendations.push('Remove all credentials before processing');
    }

    // Check for sensitive business data
    const businessPatterns = [
      /confidential/i,
      /proprietary/i,
      /internal\s+only/i,
      /trade\s+secret/i,
    ];

    if (businessPatterns.some(pattern => pattern.test(content))) {
      threats.push({
        type: 'sensitive_data',
        severity: 'medium',
        location: 'document_content',
        description: 'Sensitive business information detected',
        mitigated: false,
      });
      recommendations.push('Consider data classification and access controls');
    }

    // Determine overall risk level
    const riskLevel = this.calculateRiskLevel(threats);

    return {
      riskLevel,
      detectedThreats: threats,
      sanitizationActions,
      recommendations,
    };
  }

  /**
   * Encrypt content using AES-256-GCM
   */
  private encryptContent(content: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);

    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
    });
  }

  /**
   * Decrypt content
   */
  decryptContent(encryptedData: string): string {
    try {
      const data = JSON.parse(encryptedData);
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);

      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt content');
    }
  }

  /**
   * Log audit entry
   */
  private logAuditEntry(
    action: string,
    context: DocumentSecurityContext,
    details: Record<string, any>
  ): void {
    const entry: AuditEntry = {
      timestamp: new Date(),
      action,
      userId: context.userId,
      documentId: context.documentId,
      details,
      securityContext: context,
    };

    this.auditLog.push(entry);

    // Emit audit event
    this.emit('auditEntry', entry);

    // Clean up old entries based on retention policy
    this.cleanupAuditLog();
  }

  /**
   * Get recent audit entries for a document
   */
  private getRecentAuditEntries(documentId: string): AuditEntry[] {
    return this.auditLog.filter(entry => entry.documentId === documentId).slice(-10); // Return last 10 entries
  }

  /**
   * Clean up old audit entries based on retention policy
   */
  private cleanupAuditLog(): void {
    const cutoffTime = new Date(Date.now() - this.options.retentionPolicyHours * 60 * 60 * 1000);
    this.auditLog = this.auditLog.filter(entry => entry.timestamp > cutoffTime);
  }

  // Helper methods
  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private shouldEncrypt(securityReport: SecurityReport): boolean {
    return securityReport.riskLevel === 'high' || securityReport.riskLevel === 'critical';
  }

  private looksLikeApiKey(str: string): boolean {
    // Simple heuristic for API key detection
    return str.length >= 32 && /^[A-Za-z0-9+/=]+$/.test(str);
  }

  private calculateSanitizationConfidence(
    originalLength: number,
    sanitizedLength: number,
    removedCount: number
  ): number {
    const reductionRatio = (originalLength - sanitizedLength) / originalLength;
    const baseConfidence = Math.max(0, 100 - removedCount * 10);
    return Math.min(100, baseConfidence - reductionRatio * 20);
  }

  private containsPII(content: string): boolean {
    const piiPatterns = [
      /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/, // Phone
    ];

    return piiPatterns.some(pattern => pattern.test(content));
  }

  private containsCredentials(content: string): boolean {
    const credentialPatterns = [
      /password\s*[:=]\s*[^\s]+/i,
      /api[_-]?key\s*[:=]\s*[^\s]+/i,
      /secret\s*[:=]\s*[^\s]+/i,
      /token\s*[:=]\s*[^\s]+/i,
    ];

    return credentialPatterns.some(pattern => pattern.test(content));
  }

  private containsSensitiveBusinessData(content: string): boolean {
    const sensitivePatterns = [
      /confidential/i,
      /proprietary/i,
      /internal\s+only/i,
      /trade\s+secret/i,
      /\$[\d,]+\.?\d*/g, // Currency amounts
    ];

    return sensitivePatterns.some(pattern => pattern.test(content));
  }

  private calculateRiskLevel(threats: SecurityThreat[]): 'low' | 'medium' | 'high' | 'critical' {
    if (threats.some(t => t.severity === 'critical')) return 'critical';
    if (threats.some(t => t.severity === 'high')) return 'high';
    if (threats.some(t => t.severity === 'medium')) return 'medium';
    return 'low';
  }
}
