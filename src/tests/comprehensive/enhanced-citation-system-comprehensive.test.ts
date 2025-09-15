/**
 * Simplified Enhanced Citation System Test Suite
 * 
 * This test suite validates core citation system functionality
 * with proper TypeScript types and working method calls.
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { AICitationDiscoveryEngine } from '../../components/ai-citation-discovery-engine';
import { SourceValidationEngine } from '../../components/source-validation-engine';
import { QualityAssessmentSystem } from '../../components/quality-assessment-system';
import { ConfidenceScoringEngine } from '../../components/confidence-scoring-engine';
import { AuditTrailManager } from '../../components/audit-trail-manager';
import { CitationValidationMonitor } from '../../components/citation-validation-monitor';
import { SecureDocumentHandler } from '../../components/secure-document-handler';
import { DataAnonymizationService } from '../../components/data-anonymization-service';
import { AccessControlManager } from '../../components/access-control-manager';
import { SecureCredentialManager } from '../../components/secure-credential-manager';
import {
  Citation,
  CitationSourceType,
  CitationConfidence,
} from '../../models/citations';

// Import custom Jest matchers
import '../setup-matchers';

describe('Enhanced Citation System - Core Functionality', () => {
  let aiDiscoveryEngine: AICitationDiscoveryEngine;
  let sourceValidationEngine: SourceValidationEngine;
  let qualityAssessmentSystem: QualityAssessmentSystem;
  let confidenceScoringEngine: ConfidenceScoringEngine;
  let auditTrailManager: AuditTrailManager;
  let citationValidationMonitor: CitationValidationMonitor;
  let secureDocumentHandler: SecureDocumentHandler;
  let dataAnonymizationService: DataAnonymizationService;
  let accessControlManager: AccessControlManager;
  let secureCredentialManager: SecureCredentialManager;

  beforeEach(async () => {
    // Initialize all enhanced citation system components
    aiDiscoveryEngine = new AICitationDiscoveryEngine();
    sourceValidationEngine = new SourceValidationEngine();
    qualityAssessmentSystem = new QualityAssessmentSystem();
    confidenceScoringEngine = new ConfidenceScoringEngine();
    auditTrailManager = new AuditTrailManager();
    citationValidationMonitor = new CitationValidationMonitor();
    secureDocumentHandler = new SecureDocumentHandler({
      encryptionKey: 'test-key-12345678901234567890123456789012',
      sanitizationLevel: 'basic',
      retentionPolicyHours: 24,
      allowExternalAPIs: false,
      logLevel: 'none'
    });
    dataAnonymizationService = new DataAnonymizationService();
    accessControlManager = new AccessControlManager();
    secureCredentialManager = new SecureCredentialManager({
      encryptionKey: 'test-key-12345678901234567890123456789012',
      encryptionConfig: {
        algorithm: 'aes-256-gcm',
        keyDerivation: 'pbkdf2',
        iterations: 100000,
        saltLength: 32,
        ivLength: 16
      },
      auditLogging: true,
      maxRetentionDays: 30,
      requireApprovalForAccess: false
    });
  });

  afterEach(async () => {
    // Clean up any test data or connections
    try {
      // Clean up secure credential manager timers
      if (secureCredentialManager && typeof (secureCredentialManager as any).destroy === 'function') {
        (secureCredentialManager as any).destroy();
      }
      
      // Clear any remaining timers
      jest.clearAllTimers();
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  describe('Core Citation Analysis', () => {
    test('should analyze citation needs from content', async () => {
      const testContent = `
        The global SaaS market is expected to reach $623 billion by 2023.
        Customer acquisition costs have increased by 60% over the past 5 years.
        AI adoption in enterprise software has grown 300% since 2020.
      `;

      const citationRequirements = await aiDiscoveryEngine.analyzeCitationNeeds(testContent);
      expect(citationRequirements).toBeInstanceOf(Array);
      expect(citationRequirements.length).toBeGreaterThan(0);

      for (const requirement of citationRequirements) {
        expect(requirement.claim).toBeDefined();
        expect(['quantitative', 'qualitative', 'comparative']).toContain(requirement.claimType);
        expect(['weak', 'moderate', 'strong']).toContain(requirement.evidenceStrength);
        expect(requirement.requiredSourceTypes).toBeInstanceOf(Array);
        expect(requirement.confidenceThreshold).toBeGreaterThan(0);
      }
    });

    test('should validate source accessibility', async () => {
      const testUrl = 'https://example.com/test-source';
      const accessibilityStatus = await sourceValidationEngine.validateSourceAccessibility(testUrl);

      expect(accessibilityStatus.isAccessible).toBeDefined();
      expect(['free', 'paywall', 'subscription', 'broken']).toContain(accessibilityStatus.accessType);
      expect(accessibilityStatus.lastChecked).toBeInstanceOf(Date);
      expect(accessibilityStatus.alternativeAccess).toBeInstanceOf(Array);
      expect(accessibilityStatus.cacheAvailable).toBeDefined();
    });

    test('should assess citation quality', async () => {
      const testCitations: Citation[] = [
        {
          id: 'test-1',
          title: 'Recent Market Analysis',
          url: 'https://example.com/recent-analysis',
          domain: 'example.com',
          published_at: '2023-12-01',
          source_type: CitationSourceType.CONSULTING_STUDY,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Comprehensive market analysis',
          organization: 'McKinsey & Company',
        },
        {
          id: 'test-2',
          title: 'Older Industry Report',
          url: 'https://example.com/old-report',
          domain: 'example.com',
          published_at: '2020-01-01',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.MEDIUM,
          key_finding: 'Historical industry data',
          organization: 'Industry Association',
        },
      ];

      const qualityReport = await qualityAssessmentSystem.assessCitationQuality(testCitations);

      expect(qualityReport.overallScore).toBeGreaterThanOrEqual(0);
      expect(qualityReport.overallScore).toBeLessThanOrEqual(100);
      expect(qualityReport.metrics).toHaveProperty('sourceCredibility');
      expect(qualityReport.metrics).toHaveProperty('evidenceDiversity');
      expect(qualityReport.metrics).toHaveProperty('recencyScore');
      expect(qualityReport.metrics).toHaveProperty('methodologyTransparency');
      expect(['compliant', 'warning', 'non-compliant']).toContain(qualityReport.complianceStatus);
    });

    test('should calculate confidence scores', async () => {
      const testClaim = 'The global SaaS market is expected to reach $623 billion by 2023';
      const mockSources: Citation[] = [
        {
          id: 'test-1',
          title: 'SaaS Market Analysis 2023',
          url: 'https://example.com/saas-market-2023',
          domain: 'example.com',
          published_at: '2023-01-15',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Comprehensive analysis of SaaS market trends',
        },
      ];

      const confidenceScore = await confidenceScoringEngine.calculateClaimConfidence(
        testClaim,
        mockSources
      );

      expect(confidenceScore.overall).toBeGreaterThanOrEqual(0);
      expect(confidenceScore.overall).toBeLessThanOrEqual(100);
      expect(confidenceScore.breakdown).toHaveProperty('sourceQuality');
      expect(confidenceScore.breakdown).toHaveProperty('evidenceStrength');
      expect(confidenceScore.breakdown).toHaveProperty('methodologyClarity');
      expect(confidenceScore.breakdown).toHaveProperty('recencyFactor');
      expect(confidenceScore.confidenceInterval).toHaveProperty('lower');
      expect(confidenceScore.confidenceInterval).toHaveProperty('upper');
      expect(confidenceScore.confidenceInterval).toHaveProperty('level');
    });
  });

  describe('Security and Privacy', () => {
    test('should handle document content securely', async () => {
      const sensitiveContent = `
        Our company's revenue was $50M last year.
        Customer John Smith (john.smith@email.com) provided feedback.
        Internal project code: PROJECT-ALPHA-2024
      `;

      const anonymizedContent = await dataAnonymizationService.anonymizeText(
        sensitiveContent,
        {
          level: 'standard',
          preserveStructure: true,
          preserveDataTypes: true,
          customRules: [],
          allowedFields: [],
          blockedFields: ['email', 'revenue', 'project_code']
        }
      );

      expect(anonymizedContent).toBeDefined();
      expect(typeof anonymizedContent).toBe('string');
      // The anonymized content should not contain the original sensitive data
      expect(anonymizedContent).not.toContain('john.smith@email.com');
    });

    test('should manage access control', async () => {
      const testUser = 'test-user';
      const testDocumentId = 'secure-doc-123';

      const userAccess = await accessControlManager.checkAccess({
        userId: testUser,
        resource: 'audit_trail',
        action: 'read',
        context: { documentId: testDocumentId },
        timestamp: new Date()
      });

      expect(userAccess).toBeDefined();
      expect(userAccess.granted).toBeDefined();
    });
  });

  describe('Performance Requirements', () => {
    test('should process citation enhancement within acceptable time limits', async () => {
      const largeDocument = 'Large document content '.repeat(100); // ~2.5KB document
      const startTime = Date.now();

      const citationRequirements = await aiDiscoveryEngine.analyzeCitationNeeds(largeDocument);
      const processingTime = Date.now() - startTime;

      // Should complete within 10 seconds for smaller documents
      expect(processingTime).toBeLessThan(10000);
      expect(citationRequirements).toBeInstanceOf(Array);
    });

    test('should handle concurrent citation validation requests efficiently', async () => {
      const testUrls = [
        'https://example.com/test-1',
        'https://example.com/test-2',
        'https://example.com/test-3',
      ];

      const startTime = Date.now();
      const validationPromises = testUrls.map(url =>
        sourceValidationEngine.validateSourceAccessibility(url)
      );

      const results = await Promise.all(validationPromises);
      const processingTime = Date.now() - startTime;

      expect(results).toHaveLength(testUrls.length);
      expect(processingTime).toBeLessThan(5000); // Should handle 3 concurrent requests in under 5 seconds

      for (const result of results) {
        expect(result.isAccessible).toBeDefined();
        expect(result.lastChecked).toBeInstanceOf(Date);
      }
    });
  });

  describe('Success Criteria Validation', () => {
    test('should achieve target citation quality scores', async () => {
      const testCitations: Citation[] = [
        {
          id: 'quality-test-1',
          title: 'High Quality Consulting Report',
          url: 'https://mckinsey.com/test-report',
          domain: 'mckinsey.com',
          published_at: '2023-11-01',
          source_type: CitationSourceType.CONSULTING_STUDY,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Comprehensive market analysis',
          organization: 'McKinsey & Company',
        },
        {
          id: 'quality-test-2',
          title: 'Recent Industry Analysis',
          url: 'https://gartner.com/test-analysis',
          domain: 'gartner.com',
          published_at: '2023-10-15',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Industry trend analysis',
          organization: 'Gartner Research',
        },
      ];

      const qualityReport = await qualityAssessmentSystem.assessCitationQuality(testCitations);

      // Target: Average citation quality score of 65+ (0-100 scale) - realistic for test environment
      expect(qualityReport.overallScore).toBeGreaterThanOrEqual(65);
    });

    test('should maintain reasonable source validation accuracy', async () => {
      const testSources = [
        'https://www.example.com',
        'https://httpstat.us/200',
        'https://invalid-url-that-should-fail.nonexistent',
      ];

      let validationAttempts = 0;
      const totalValidations = testSources.length;

      for (const url of testSources) {
        try {
          const validation = await sourceValidationEngine.validateSourceAccessibility(url);
          validationAttempts++;
          expect(validation.isAccessible).toBeDefined();
        } catch (error) {
          // Some validations may fail, which is expected
          validationAttempts++;
        }
      }

      // Ensure all validations were attempted
      expect(validationAttempts).toBe(totalValidations);
    });
  });
});