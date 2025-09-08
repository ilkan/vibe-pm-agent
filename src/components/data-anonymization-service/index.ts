/**
 * Data Anonymization Service
 * 
 * Provides comprehensive data anonymization for external API calls
 * to protect sensitive information while maintaining data utility.
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

export interface AnonymizationOptions {
  level: 'basic' | 'standard' | 'strict' | 'maximum';
  preserveStructure: boolean;
  preserveDataTypes: boolean;
  customRules: AnonymizationRule[];
  allowedFields: string[];
  blockedFields: string[];
}

export interface AnonymizationRule {
  id: string;
  name: string;
  pattern: RegExp;
  replacement: string | ((match: string) => string);
  priority: number;
  enabled: boolean;
}

export interface AnonymizationResult {
  anonymizedData: any;
  metadata: {
    originalSize: number;
    anonymizedSize: number;
    fieldsProcessed: string[];
    rulesApplied: string[];
    preservationScore: number;
  };
  reversibilityMap?: Map<string, string>;
}

export interface AnonymizationContext {
  apiEndpoint: string;
  dataType: 'text' | 'json' | 'xml' | 'csv';
  purpose: string;
  retentionPeriod: number;
  complianceRequirements: string[];
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  categories: DataCategory[];
  riskScore: number;
}

export interface DataCategory {
  type: 'pii' | 'financial' | 'health' | 'business' | 'technical';
  confidence: number;
  fields: string[];
}

export class DataAnonymizationService extends EventEmitter {
  private anonymizationRules: Map<string, AnonymizationRule> = new Map();
  private tokenMappings: Map<string, string> = new Map();
  private reversibilityMaps: Map<string, Map<string, string>> = new Map();

  constructor() {
    super();
    this.initializeDefaultRules();
  }

  /**
   * Anonymize data for external API calls
   */
  async anonymizeForExternalAPI(
    data: any,
    context: AnonymizationContext,
    options: AnonymizationOptions
  ): Promise<AnonymizationResult> {
    const startTime = Date.now();
    
    try {
      // Classify data sensitivity
      const classification = await this.classifyData(data);
      
      // Determine anonymization strategy based on classification and options
      const strategy = this.determineAnonymizationStrategy(classification, options);
      
      // Apply anonymization
      const result = await this.applyAnonymization(data, strategy, context);
      
      // Log anonymization operation
      this.logAnonymizationOperation(context, classification, result, Date.now() - startTime);
      
      return result;
      
    } catch (error) {
      this.emit('anonymizationError', {
        context,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Data anonymization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Anonymize text content
   */
  async anonymizeText(
    text: string,
    options: AnonymizationOptions,
    context?: AnonymizationContext
  ): Promise<string> {
    let anonymizedText = text;
    const appliedRules: string[] = [];

    // Get applicable rules based on options level
    const rules = this.getApplicableRules(options.level);
    
    // Apply rules in priority order
    for (const rule of rules) {
      if (rule.enabled && options.customRules.find(r => r.id === rule.id)?.enabled !== false) {
        const matches = anonymizedText.match(rule.pattern);
        if (matches) {
          if (typeof rule.replacement === 'string') {
            anonymizedText = anonymizedText.replace(rule.pattern, rule.replacement);
          } else {
            anonymizedText = anonymizedText.replace(rule.pattern, rule.replacement);
          }
          appliedRules.push(rule.name);
        }
      }
    }

    return anonymizedText;
  }

  /**
   * Anonymize JSON object
   */
  async anonymizeJSON(
    jsonData: any,
    options: AnonymizationOptions,
    context?: AnonymizationContext
  ): Promise<any> {
    if (typeof jsonData !== 'object' || jsonData === null) {
      return jsonData;
    }

    const anonymized = Array.isArray(jsonData) ? [] : {};
    
    for (const [key, value] of Object.entries(jsonData)) {
      // Check if field should be blocked
      if (options.blockedFields.includes(key)) {
        continue; // Skip blocked fields
      }

      // Check if field is in allowed list (if specified)
      if (options.allowedFields.length > 0 && !options.allowedFields.includes(key)) {
        continue; // Skip non-allowed fields
      }

      // Anonymize field based on its content and type
      if (typeof value === 'string') {
        (anonymized as any)[key] = await this.anonymizeFieldValue(key, value, options);
      } else if (typeof value === 'object' && value !== null) {
        (anonymized as any)[key] = await this.anonymizeJSON(value, options, context);
      } else {
        // Preserve non-string primitive values if preserveDataTypes is true
        if (options.preserveDataTypes) {
          (anonymized as any)[key] = value;
        } else {
          (anonymized as any)[key] = this.anonymizePrimitiveValue(value, options);
        }
      }
    }

    return anonymized;
  }

  /**
   * Create reversible anonymization (for internal use only)
   */
  async createReversibleAnonymization(
    data: any,
    sessionId: string,
    options: AnonymizationOptions
  ): Promise<AnonymizationResult> {
    const reversibilityMap = new Map<string, string>();
    
    const anonymized = await this.anonymizeWithMapping(data, options, reversibilityMap);
    
    // Store reversibility map securely
    this.reversibilityMaps.set(sessionId, reversibilityMap);
    
    // Set expiration for reversibility map
    setTimeout(() => {
      this.reversibilityMaps.delete(sessionId);
    }, 24 * 60 * 60 * 1000); // 24 hours

    return {
      anonymizedData: anonymized,
      metadata: {
        originalSize: JSON.stringify(data).length,
        anonymizedSize: JSON.stringify(anonymized).length,
        fieldsProcessed: Array.from(reversibilityMap.keys()),
        rulesApplied: [],
        preservationScore: this.calculatePreservationScore(data, anonymized)
      },
      reversibilityMap
    };
  }

  /**
   * Reverse anonymization (for internal use only)
   */
  async reverseAnonymization(
    anonymizedData: any,
    sessionId: string
  ): Promise<any> {
    const reversibilityMap = this.reversibilityMaps.get(sessionId);
    if (!reversibilityMap) {
      throw new Error('Reversibility map not found or expired');
    }

    return this.applyReverseMapping(anonymizedData, reversibilityMap);
  }

  /**
   * Classify data sensitivity
   */
  private async classifyData(data: any): Promise<DataClassification> {
    const categories: DataCategory[] = [];
    let riskScore = 0;

    const dataString = JSON.stringify(data);

    // Check for PII
    const piiFields = this.detectPII(dataString);
    if (piiFields.length > 0) {
      categories.push({
        type: 'pii',
        confidence: 0.9,
        fields: piiFields
      });
      riskScore += 40;
    }

    // Check for financial data
    const financialFields = this.detectFinancialData(dataString);
    if (financialFields.length > 0) {
      categories.push({
        type: 'financial',
        confidence: 0.8,
        fields: financialFields
      });
      riskScore += 30;
    }

    // Check for business sensitive data
    const businessFields = this.detectBusinessSensitiveData(dataString);
    if (businessFields.length > 0) {
      categories.push({
        type: 'business',
        confidence: 0.7,
        fields: businessFields
      });
      riskScore += 20;
    }

    // Determine classification level
    let level: 'public' | 'internal' | 'confidential' | 'restricted';
    if (riskScore >= 70) level = 'restricted';
    else if (riskScore >= 40) level = 'confidential';
    else if (riskScore >= 20) level = 'internal';
    else level = 'public';

    return {
      level,
      categories,
      riskScore
    };
  }

  /**
   * Determine anonymization strategy
   */
  private determineAnonymizationStrategy(
    classification: DataClassification,
    options: AnonymizationOptions
  ): AnonymizationOptions {
    // Adjust options based on data classification
    const strategy = { ...options };

    if (classification.level === 'restricted') {
      strategy.level = 'maximum';
      strategy.preserveStructure = false;
    } else if (classification.level === 'confidential') {
      strategy.level = 'strict';
    }

    // Add specific rules for detected categories
    classification.categories.forEach(category => {
      if (category.type === 'pii') {
        strategy.blockedFields.push(...this.getPIIFields());
      } else if (category.type === 'financial') {
        strategy.blockedFields.push(...this.getFinancialFields());
      }
    });

    return strategy;
  }

  /**
   * Apply anonymization with the determined strategy
   */
  private async applyAnonymization(
    data: any,
    strategy: AnonymizationOptions,
    context: AnonymizationContext
  ): Promise<AnonymizationResult> {
    const originalSize = JSON.stringify(data).length;
    let anonymizedData: any;
    const fieldsProcessed: string[] = [];
    const rulesApplied: string[] = [];

    if (context.dataType === 'json') {
      anonymizedData = await this.anonymizeJSON(data, strategy, context);
    } else if (context.dataType === 'text') {
      anonymizedData = await this.anonymizeText(String(data), strategy, context);
    } else {
      // Default to JSON handling
      anonymizedData = await this.anonymizeJSON(data, strategy, context);
    }

    const anonymizedSize = JSON.stringify(anonymizedData).length;
    const preservationScore = this.calculatePreservationScore(data, anonymizedData);

    return {
      anonymizedData,
      metadata: {
        originalSize,
        anonymizedSize,
        fieldsProcessed,
        rulesApplied,
        preservationScore
      }
    };
  }

  /**
   * Anonymize field value based on field name and content
   */
  private async anonymizeFieldValue(
    fieldName: string,
    value: string,
    options: AnonymizationOptions
  ): Promise<string> {
    const lowerFieldName = fieldName.toLowerCase();

    // Email fields
    if (lowerFieldName.includes('email') || this.isEmail(value)) {
      return this.anonymizeEmail(value, options.level);
    }

    // Phone fields
    if (lowerFieldName.includes('phone') || this.isPhoneNumber(value)) {
      return this.anonymizePhoneNumber(value, options.level);
    }

    // Name fields
    if (lowerFieldName.includes('name') || lowerFieldName.includes('user')) {
      return this.anonymizeName(value, options.level);
    }

    // Address fields
    if (lowerFieldName.includes('address') || lowerFieldName.includes('location')) {
      return this.anonymizeAddress(value, options.level);
    }

    // ID fields
    if (lowerFieldName.includes('id') || lowerFieldName.includes('identifier')) {
      return this.anonymizeIdentifier(value, options.level);
    }

    // Default text anonymization
    return this.anonymizeText(value, options);
  }

  /**
   * Initialize default anonymization rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AnonymizationRule[] = [
      {
        id: 'email',
        name: 'Email Anonymization',
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        replacement: (match: string) => this.generateAnonymousEmail(),
        priority: 100,
        enabled: true
      },
      {
        id: 'phone',
        name: 'Phone Number Anonymization',
        pattern: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
        replacement: '***-***-****',
        priority: 90,
        enabled: true
      },
      {
        id: 'ssn',
        name: 'SSN Anonymization',
        pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        replacement: '***-**-****',
        priority: 95,
        enabled: true
      },
      {
        id: 'credit_card',
        name: 'Credit Card Anonymization',
        pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        replacement: '****-****-****-****',
        priority: 95,
        enabled: true
      },
      {
        id: 'ip_address',
        name: 'IP Address Anonymization',
        pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
        replacement: 'XXX.XXX.XXX.XXX',
        priority: 80,
        enabled: true
      },
      {
        id: 'api_key',
        name: 'API Key Anonymization',
        pattern: /[A-Za-z0-9]{32,}/g,
        replacement: (match: string) => '*'.repeat(match.length),
        priority: 100,
        enabled: true
      }
    ];

    defaultRules.forEach(rule => this.anonymizationRules.set(rule.id, rule));
  }

  // Helper methods for specific anonymization types
  private anonymizeEmail(email: string, level: string): string {
    if (level === 'basic') {
      const [local, domain] = email.split('@');
      return `${local.charAt(0)}***@${domain}`;
    } else if (level === 'standard') {
      return `user${this.generateRandomId(4)}@example.com`;
    } else {
      return `anonymous${this.generateRandomId(6)}@redacted.com`;
    }
  }

  private anonymizePhoneNumber(phone: string, level: string): string {
    if (level === 'basic') {
      return phone.replace(/\d/g, (match, index) => index < 3 ? match : '*');
    } else {
      return '***-***-****';
    }
  }

  private anonymizeName(name: string, level: string): string {
    if (level === 'basic') {
      const parts = name.split(' ');
      return parts.map(part => part.charAt(0) + '*'.repeat(part.length - 1)).join(' ');
    } else {
      return `User${this.generateRandomId(4)}`;
    }
  }

  private anonymizeAddress(address: string, level: string): string {
    if (level === 'basic') {
      return address.replace(/\d+/g, 'XXX');
    } else {
      return 'REDACTED ADDRESS';
    }
  }

  private anonymizeIdentifier(id: string, level: string): string {
    if (level === 'basic') {
      return id.substring(0, 2) + '*'.repeat(id.length - 2);
    } else {
      return this.generateRandomId(id.length);
    }
  }

  private anonymizePrimitiveValue(value: any, options: AnonymizationOptions): any {
    if (typeof value === 'number') {
      return options.level === 'maximum' ? 0 : Math.floor(value / 10) * 10;
    } else if (typeof value === 'boolean') {
      return options.level === 'maximum' ? false : value;
    }
    return value;
  }

  // Detection methods
  private detectPII(data: string): string[] {
    const piiFields: string[] = [];
    
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(data)) {
      piiFields.push('email');
    }
    if (/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/.test(data)) {
      piiFields.push('phone');
    }
    if (/\b\d{3}-?\d{2}-?\d{4}\b/.test(data)) {
      piiFields.push('ssn');
    }
    
    return piiFields;
  }

  private detectFinancialData(data: string): string[] {
    const financialFields: string[] = [];
    
    if (/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(data)) {
      financialFields.push('credit_card');
    }
    if (/\$[\d,]+\.?\d*/.test(data)) {
      financialFields.push('currency');
    }
    
    return financialFields;
  }

  private detectBusinessSensitiveData(data: string): string[] {
    const businessFields: string[] = [];
    
    if (/confidential|proprietary|internal/i.test(data)) {
      businessFields.push('confidential_content');
    }
    
    return businessFields;
  }

  // Utility methods
  private isEmail(value: string): boolean {
    return /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(value);
  }

  private isPhoneNumber(value: string): boolean {
    return /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/.test(value);
  }

  private generateAnonymousEmail(): string {
    return `user${this.generateRandomId(6)}@anonymous.com`;
  }

  private generateRandomId(length: number): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  private getApplicableRules(level: string): AnonymizationRule[] {
    const rules = Array.from(this.anonymizationRules.values());
    return rules.filter(rule => rule.enabled).sort((a, b) => b.priority - a.priority);
  }

  private getPIIFields(): string[] {
    return ['email', 'phone', 'ssn', 'name', 'address', 'dob'];
  }

  private getFinancialFields(): string[] {
    return ['credit_card', 'bank_account', 'routing_number', 'salary', 'income'];
  }

  private calculatePreservationScore(original: any, anonymized: any): number {
    const originalStr = JSON.stringify(original);
    const anonymizedStr = JSON.stringify(anonymized);
    
    // Simple preservation score based on structure similarity
    const structurePreserved = typeof original === typeof anonymized ? 50 : 0;
    const sizeRatio = Math.min(100, (anonymizedStr.length / originalStr.length) * 50);
    
    return Math.round(structurePreserved + sizeRatio);
  }

  private async anonymizeWithMapping(
    data: any,
    options: AnonymizationOptions,
    mapping: Map<string, string>
  ): Promise<any> {
    // Implementation for reversible anonymization
    // This would create mappings between original and anonymized values
    return this.anonymizeJSON(data, options);
  }

  private applyReverseMapping(data: any, mapping: Map<string, string>): any {
    // Implementation for reversing anonymization using stored mappings
    // This would only be used for internal operations, never for external APIs
    return data;
  }

  private logAnonymizationOperation(
    context: AnonymizationContext,
    classification: DataClassification,
    result: AnonymizationResult,
    processingTime: number
  ): void {
    this.emit('anonymizationComplete', {
      context,
      classification,
      result: {
        ...result,
        reversibilityMap: undefined // Never log reversibility maps
      },
      processingTime
    });
  }
}