// Unit tests for AuditTrailManager

import { AuditTrailManager } from '../../components/audit-trail-manager';
import {
  AuditEventType,
  AuditSeverity,
  AuditUser,
  AuditTrailQuery,
  ComplianceCheckResult,
  AuditReportConfig,
} from '../../models/audit';
import {
  Citation,
  CitationSourceType,
  CitationConfidence,
  EnhancedCitation,
} from '../../models/citations';

describe('AuditTrailManager', () => {
  let auditManager: AuditTrailManager;
  let mockUser: AuditUser;
  let mockCitation: Citation;
  let mockEnhancedCitation: EnhancedCitation;

  beforeEach(() => {
    auditManager = new AuditTrailManager({
      enabled: true,
      logLevel: AuditSeverity.INFO,
      batchSize: 10,
    });

    mockUser = {
      userId: 'test-user-123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'analyst',
      sessionId: 'session-456',
    };

    mockCitation = {
      id: 'citation-123',
      title: 'Test Citation',
      url: 'https://example.com/test',
      domain: 'example.com',
      published_at: '2024-01-15',
      source_type: CitationSourceType.INDUSTRY_REPORT,
      confidence: CitationConfidence.HIGH,
      key_finding: 'Test finding',
      organization: 'Test Organization',
    };

    mockEnhancedCitation = {
      ...mockCitation,
      validationStatus: {
        lastValidated: new Date(),
        accessibilityStatus: {
          isAccessible: true,
          accessType: 'free',
          lastChecked: new Date(),
          alternativeAccess: [],
          cacheAvailable: false,
        },
        credibilityAssessment: {
          overallScore: 85,
          factors: {
            domainAuthority: 80,
            authorCredentials: 90,
            peerReviewStatus: 85,
            citationFrequency: 75,
            methodologyTransparency: 95,
          },
          riskFactors: [],
          confidenceLevel: 'high',
          assessmentDate: new Date(),
        },
        complianceStatus: {
          isCompliant: true,
          checkedStandards: ['iso_27001'],
          violations: [],
          recommendations: [],
          lastChecked: new Date(),
        },
      },
      qualityMetrics: {
        credibilityScore: 85,
        relevanceScore: 90,
        recencyScore: 95,
        methodologyScore: 88,
        overallQuality: 89,
      },
      usageTracking: {
        timesUsed: 5,
        documentsReferenced: ['doc-1', 'doc-2'],
        lastUsed: new Date(),
        effectivenessRating: 4.5,
      },
      alternatives: {
        similarSources: [],
        updatedVersions: [],
        betterAlternatives: [],
      },
    };
  });

  describe('Citation Logging', () => {
    it('should log citation creation events', async () => {
      await auditManager.logCitationCreated(mockCitation, mockUser, {
        documentId: 'doc-123',
        documentType: 'business_case',
        toolUsed: 'enhance_citations',
        requestId: 'req-456',
      });

      const query: AuditTrailQuery = {
        eventTypes: [AuditEventType.CITATION_CREATED],
        resourceIds: [mockCitation.id],
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries).toHaveLength(1);

      const entry = entries[0];
      expect(entry.eventType).toBe(AuditEventType.CITATION_CREATED);
      expect(entry.severity).toBe(AuditSeverity.INFO);
      expect(entry.user.userId).toBe(mockUser.userId);
      expect(entry.resourceId).toBe(mockCitation.id);
      expect(entry.resourceType).toBe('citation');
      expect(entry.action).toBe('create_citation');
      expect(entry.newState).toEqual(mockCitation);
      expect(entry.previousState).toBeNull();
      expect(entry.documentId).toBe('doc-123');
      expect(entry.documentType).toBe('business_case');
      expect(entry.toolUsed).toBe('enhance_citations');
      expect(entry.requestId).toBe('req-456');
      expect(entry.additionalMetadata?.citationType).toBe(mockCitation.source_type);
      expect(entry.additionalMetadata?.confidence).toBe(mockCitation.confidence);
      expect(entry.additionalMetadata?.domain).toBe(mockCitation.domain);
    });

    it('should log citation modification events', async () => {
      const modifiedCitation = {
        ...mockCitation,
        title: 'Updated Test Citation',
        confidence: CitationConfidence.MEDIUM,
      };

      await auditManager.logCitationModified(
        mockCitation.id,
        mockCitation,
        modifiedCitation,
        mockUser,
        'Updated title and confidence level',
        {
          documentId: 'doc-123',
          toolUsed: 'validate_sources',
        }
      );

      const query: AuditTrailQuery = {
        eventTypes: [AuditEventType.CITATION_MODIFIED],
        resourceIds: [mockCitation.id],
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries).toHaveLength(1);

      const entry = entries[0];
      expect(entry.eventType).toBe(AuditEventType.CITATION_MODIFIED);
      expect(entry.severity).toBe(AuditSeverity.INFO);
      expect(entry.resourceId).toBe(mockCitation.id);
      expect(entry.previousState).toEqual(mockCitation);
      expect(entry.newState).toEqual(modifiedCitation);
      expect(entry.changeDescription).toContain('Updated title and confidence level');
      expect(entry.additionalMetadata?.changedFields).toContain('title');
      expect(entry.additionalMetadata?.changedFields).toContain('confidence');
      expect(entry.additionalMetadata?.changeReason).toBe('Updated title and confidence level');
    });

    it('should log citation deletion events with warning severity', async () => {
      await auditManager.logCitationDeleted(mockCitation, mockUser, 'Citation no longer relevant', {
        documentId: 'doc-123',
        toolUsed: 'audit_citation_quality',
      });

      const query: AuditTrailQuery = {
        eventTypes: [AuditEventType.CITATION_DELETED],
        resourceIds: [mockCitation.id],
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries).toHaveLength(1);

      const entry = entries[0];
      expect(entry.eventType).toBe(AuditEventType.CITATION_DELETED);
      expect(entry.severity).toBe(AuditSeverity.WARNING);
      expect(entry.resourceId).toBe(mockCitation.id);
      expect(entry.previousState).toEqual(mockCitation);
      expect(entry.newState).toBeNull();
      expect(entry.changeDescription).toContain('Citation no longer relevant');
      expect(entry.additionalMetadata?.deleteReason).toBe('Citation no longer relevant');
    });

    it('should log citation validation events', async () => {
      const validationResult = {
        isValid: true,
        accessibilityStatus: 'accessible',
        credibilityAssessment: { overallScore: 85 },
      };

      await auditManager.logCitationValidated(mockCitation.id, validationResult, mockUser, {
        documentId: 'doc-123',
        toolUsed: 'validate_sources',
      });

      const query: AuditTrailQuery = {
        eventTypes: [AuditEventType.CITATION_VALIDATED],
        resourceIds: [mockCitation.id],
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries).toHaveLength(1);

      const entry = entries[0];
      expect(entry.eventType).toBe(AuditEventType.CITATION_VALIDATED);
      expect(entry.severity).toBe(AuditSeverity.INFO);
      expect(entry.resourceType).toBe('validation');
      expect(entry.newState).toEqual(validationResult);
      expect(entry.additionalMetadata?.validationResult).toEqual(validationResult);
    });

    it('should log failed validation with warning severity', async () => {
      const validationResult = {
        isValid: false,
        accessibilityStatus: 'broken',
        credibilityAssessment: { overallScore: 45 },
        issues: ['URL not accessible', 'Low credibility score'],
      };

      await auditManager.logCitationValidated(mockCitation.id, validationResult, mockUser);

      const query: AuditTrailQuery = {
        eventTypes: [AuditEventType.CITATION_VALIDATED],
        resourceIds: [mockCitation.id],
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries).toHaveLength(1);

      const entry = entries[0];
      expect(entry.severity).toBe(AuditSeverity.WARNING);
      expect(entry.changeDescription).toContain('validation failed');
    });
  });

  describe('Document and Quality Logging', () => {
    it('should log document generation events', async () => {
      const citationsUsed = ['citation-1', 'citation-2', 'citation-3'];

      await auditManager.logDocumentGenerated('doc-123', 'business_case', citationsUsed, mockUser, {
        toolUsed: 'generate_business_case',
        requestId: 'req-789',
        qualityMetrics: { overallScore: 85 },
      });

      const query: AuditTrailQuery = {
        eventTypes: [AuditEventType.DOCUMENT_GENERATED],
        documentIds: ['doc-123'],
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries).toHaveLength(1);

      const entry = entries[0];
      expect(entry.eventType).toBe(AuditEventType.DOCUMENT_GENERATED);
      expect(entry.resourceId).toBe('doc-123');
      expect(entry.resourceType).toBe('document');
      expect(entry.documentType).toBe('business_case');
      expect(entry.newState?.citationsUsed).toEqual(citationsUsed);
      expect(entry.newState?.citationCount).toBe(3);
      expect(entry.additionalMetadata?.citationCount).toBe(3);
      expect(entry.additionalMetadata?.qualityMetrics).toEqual({ overallScore: 85 });
    });

    it('should log quality assessment events', async () => {
      const qualityResult = {
        overallScore: 92,
        qualityGaps: [],
        recommendations: ['Add more recent sources'],
      };

      await auditManager.logQualityAssessed('doc-123', 'document', qualityResult, mockUser, {
        toolUsed: 'audit_citation_quality',
      });

      const query: AuditTrailQuery = {
        eventTypes: [AuditEventType.QUALITY_ASSESSED],
        resourceIds: ['doc-123'],
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries).toHaveLength(1);

      const entry = entries[0];
      expect(entry.eventType).toBe(AuditEventType.QUALITY_ASSESSED);
      expect(entry.severity).toBe(AuditSeverity.INFO);
      expect(entry.newState).toEqual(qualityResult);
      expect(entry.additionalMetadata?.qualityScore).toBe(92);
      expect(entry.additionalMetadata?.recommendations).toBe(1);
    });

    it('should log low quality assessment with warning severity', async () => {
      const qualityResult = {
        overallScore: 65,
        qualityGaps: ['insufficient_sources', 'low_credibility'],
        recommendations: ['Add more credible sources', 'Update outdated citations'],
      };

      await auditManager.logQualityAssessed('citation-123', 'citation', qualityResult, mockUser);

      const query: AuditTrailQuery = {
        eventTypes: [AuditEventType.QUALITY_ASSESSED],
        resourceIds: ['citation-123'],
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries).toHaveLength(1);

      const entry = entries[0];
      expect(entry.severity).toBe(AuditSeverity.WARNING);
      expect(entry.additionalMetadata?.qualityGaps).toBe(2);
    });
  });

  describe('Compliance Logging', () => {
    it('should log compliance check events', async () => {
      const complianceResult: ComplianceCheckResult = {
        standardId: 'sox_2002',
        isCompliant: true,
        overallScore: 95,
        checkedAt: new Date(),
        requirementResults: [],
        violations: [],
        recommendations: [],
        evidenceCollected: [],
        auditTrailComplete: true,
        documentationComplete: true,
      };

      await auditManager.logComplianceChecked('doc-123', 'sox_2002', complianceResult, mockUser, {
        toolUsed: 'validate_compliance',
      });

      const query: AuditTrailQuery = {
        eventTypes: [AuditEventType.COMPLIANCE_CHECKED],
        resourceIds: ['doc-123'],
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries).toHaveLength(1);

      const entry = entries[0];
      expect(entry.eventType).toBe(AuditEventType.COMPLIANCE_CHECKED);
      expect(entry.severity).toBe(AuditSeverity.INFO);
      expect(entry.newState).toEqual(complianceResult);
      expect(entry.additionalMetadata?.standardId).toBe('sox_2002');
      expect(entry.additionalMetadata?.complianceScore).toBe(95);
      expect(entry.additionalMetadata?.violationsCount).toBe(0);
    });

    it('should log failed compliance check with error severity', async () => {
      const complianceResult: ComplianceCheckResult = {
        standardId: 'gdpr_2018',
        isCompliant: false,
        overallScore: 45,
        checkedAt: new Date(),
        requirementResults: [],
        violations: [
          {
            requirementId: 'gdpr_data_processing',
            severity: 'critical',
            description: 'Missing data processing logs',
            affectedResources: ['doc-123'],
            remediation: ['Add data processing logging'],
          },
        ],
        recommendations: [
          {
            priority: 'high',
            category: 'compliance',
            description: 'Implement GDPR compliance measures',
            actionItems: ['Add data processing logs'],
            estimatedEffort: 'medium',
            expectedBenefit: 'GDPR compliance',
          },
        ],
        evidenceCollected: [],
        auditTrailComplete: false,
        documentationComplete: false,
      };

      await auditManager.logComplianceChecked('doc-123', 'gdpr_2018', complianceResult, mockUser);

      const query: AuditTrailQuery = {
        eventTypes: [AuditEventType.COMPLIANCE_CHECKED],
        resourceIds: ['doc-123'],
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries).toHaveLength(1);

      const entry = entries[0];
      expect(entry.severity).toBe(AuditSeverity.ERROR);
      expect(entry.changeDescription).toContain('FAILED');
      expect(entry.additionalMetadata?.violationsCount).toBe(1);
      expect(entry.additionalMetadata?.recommendationsCount).toBe(1);
    });
  });

  describe('Audit Trail Querying', () => {
    beforeEach(async () => {
      // Add some test data
      await auditManager.logCitationCreated(mockCitation, mockUser);
      await auditManager.logCitationModified(
        mockCitation.id,
        mockCitation,
        { ...mockCitation, title: 'Modified' },
        mockUser,
        'Test modification'
      );
      await auditManager.logDocumentGenerated(
        'doc-123',
        'business_case',
        ['citation-123'],
        mockUser
      );
    });

    it('should query entries by event type', async () => {
      const query: AuditTrailQuery = {
        eventTypes: [AuditEventType.CITATION_CREATED],
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries).toHaveLength(1);
      expect(entries[0].eventType).toBe(AuditEventType.CITATION_CREATED);
    });

    it('should query entries by user ID', async () => {
      const query: AuditTrailQuery = {
        userIds: [mockUser.userId],
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries.length).toBeGreaterThan(0);
      entries.forEach(entry => {
        expect(entry.user.userId).toBe(mockUser.userId);
      });
    });

    it('should query entries by resource ID', async () => {
      const query: AuditTrailQuery = {
        resourceIds: [mockCitation.id],
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries.length).toBeGreaterThan(0);
      entries.forEach(entry => {
        expect(entry.resourceId).toBe(mockCitation.id);
      });
    });

    it('should query entries by date range', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const query: AuditTrailQuery = {
        startDate: oneHourAgo,
        endDate: now,
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries.length).toBeGreaterThan(0);
      entries.forEach(entry => {
        expect(entry.timestamp.getTime()).toBeGreaterThanOrEqual(oneHourAgo.getTime());
        expect(entry.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it('should apply pagination', async () => {
      const query: AuditTrailQuery = {
        limit: 2,
        offset: 0,
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries.length).toBeLessThanOrEqual(2);
    });

    it('should sort entries by timestamp descending by default', async () => {
      const entries = await auditManager.queryAuditTrail({});

      for (let i = 1; i < entries.length; i++) {
        expect(entries[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
          entries[i].timestamp.getTime()
        );
      }
    });

    it('should sort entries by severity ascending when specified', async () => {
      const query: AuditTrailQuery = {
        sortBy: 'severity',
        sortOrder: 'asc',
      };

      const entries = await auditManager.queryAuditTrail(query);

      const severityLevels = {
        [AuditSeverity.INFO]: 1,
        [AuditSeverity.WARNING]: 2,
        [AuditSeverity.ERROR]: 3,
        [AuditSeverity.CRITICAL]: 4,
      };

      for (let i = 1; i < entries.length; i++) {
        expect(severityLevels[entries[i - 1].severity]).toBeLessThanOrEqual(
          severityLevels[entries[i].severity]
        );
      }
    });
  });

  describe('Audit Trail Summary', () => {
    beforeEach(async () => {
      // Add diverse test data
      await auditManager.logCitationCreated(mockCitation, mockUser);
      await auditManager.logCitationModified(
        mockCitation.id,
        mockCitation,
        { ...mockCitation, title: 'Modified' },
        mockUser,
        'Test modification'
      );
      await auditManager.logDocumentGenerated(
        'doc-123',
        'business_case',
        ['citation-123'],
        mockUser
      );

      const qualityResult = { overallScore: 85, qualityGaps: [], recommendations: [] };
      await auditManager.logQualityAssessed('doc-123', 'document', qualityResult, mockUser);
    });

    it('should generate comprehensive summary', async () => {
      const summary = await auditManager.generateSummary();

      expect(summary.totalEvents).toBeGreaterThan(0);
      expect(summary.dateRange.start).toBeInstanceOf(Date);
      expect(summary.dateRange.end).toBeInstanceOf(Date);
      expect(summary.eventTypeDistribution).toBeDefined();
      expect(summary.severityDistribution).toBeDefined();
      expect(summary.topUsers).toBeDefined();
      expect(summary.topResources).toBeDefined();
      expect(summary.complianceStatus).toBeDefined();
    });

    it('should include event type distribution', async () => {
      const summary = await auditManager.generateSummary();

      expect(summary.eventTypeDistribution[AuditEventType.CITATION_CREATED]).toBe(1);
      expect(summary.eventTypeDistribution[AuditEventType.CITATION_MODIFIED]).toBe(1);
      expect(summary.eventTypeDistribution[AuditEventType.DOCUMENT_GENERATED]).toBe(1);
      expect(summary.eventTypeDistribution[AuditEventType.QUALITY_ASSESSED]).toBe(1);
    });

    it('should include top users', async () => {
      const summary = await auditManager.generateSummary();

      expect(summary.topUsers).toHaveLength(1);
      expect(summary.topUsers[0].userId).toBe(mockUser.userId);
      expect(summary.topUsers[0].eventCount).toBeGreaterThan(0);
    });

    it('should handle empty audit trail', async () => {
      const emptyManager = new AuditTrailManager();
      const summary = await emptyManager.generateSummary();

      expect(summary.totalEvents).toBe(0);
      expect(summary.topUsers).toHaveLength(0);
      expect(summary.topResources).toHaveLength(0);
    });
  });

  describe('Compliance Validation', () => {
    it('should validate compliance against SOX standard', async () => {
      // Add some audit entries first
      await auditManager.logCitationCreated(mockCitation, mockUser);
      await auditManager.logCitationModified(
        mockCitation.id,
        mockCitation,
        { ...mockCitation, title: 'Modified' },
        mockUser,
        'Test modification'
      );

      const results = await auditManager.validateCompliance(['sox_2002']);

      expect(results).toHaveLength(1);
      expect(results[0].standardId).toBe('sox_2002');
      expect(results[0].checkedAt).toBeInstanceOf(Date);
      expect(results[0].requirementResults).toBeDefined();
      expect(results[0].evidenceCollected).toBeDefined();
    });

    it('should validate compliance against multiple standards', async () => {
      const results = await auditManager.validateCompliance(['sox_2002', 'gdpr_2018', 'iso_27001']);

      expect(results).toHaveLength(3);
      expect(results.map(r => r.standardId)).toContain('sox_2002');
      expect(results.map(r => r.standardId)).toContain('gdpr_2018');
      expect(results.map(r => r.standardId)).toContain('iso_27001');
    });

    it('should handle unknown compliance standards', async () => {
      const results = await auditManager.validateCompliance(['unknown_standard']);

      expect(results).toHaveLength(0);
    });
  });

  describe('Audit Report Generation', () => {
    beforeEach(async () => {
      // Add test data
      await auditManager.logCitationCreated(mockCitation, mockUser);
      await auditManager.logDocumentGenerated(
        'doc-123',
        'business_case',
        ['citation-123'],
        mockUser
      );
    });

    it('should generate detailed audit report', async () => {
      const config: AuditReportConfig = {
        reportType: 'detailed',
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          end: new Date(),
        },
        includeDetails: true,
        includeEvidence: true,
        includeRecommendations: true,
        format: 'json',
      };

      const report = await auditManager.generateAuditReport(config, mockUser);

      expect(report.id).toBeDefined();
      expect(report.config).toEqual(config);
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.generatedBy).toEqual(mockUser);
      expect(report.summary).toBeDefined();
      expect(report.entries).toBeDefined();
      expect(report.entries.length).toBeGreaterThan(0);
      expect(report.hash).toBeDefined();
    });

    it('should generate compliance report', async () => {
      const config: AuditReportConfig = {
        reportType: 'compliance',
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        includeDetails: false,
        includeEvidence: true,
        includeRecommendations: true,
        format: 'json',
        complianceStandards: ['sox_2002', 'gdpr_2018'],
      };

      const report = await auditManager.generateAuditReport(config, mockUser);

      expect(report.complianceResults).toBeDefined();
      expect(report.complianceResults).toHaveLength(2);
    });

    it('should generate summary report without details', async () => {
      const config: AuditReportConfig = {
        reportType: 'summary',
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        includeDetails: false,
        includeEvidence: false,
        includeRecommendations: false,
        format: 'json',
      };

      const report = await auditManager.generateAuditReport(config, mockUser);

      expect(report.entries).toHaveLength(0); // No details included
      expect(report.summary).toBeDefined();
      expect(report.summary.totalEvents).toBeGreaterThan(0);
    });
  });

  describe('Configuration and Initialization', () => {
    it('should initialize with default configuration', () => {
      const manager = new AuditTrailManager();

      // Should not throw and should have reasonable defaults
      expect(manager).toBeInstanceOf(AuditTrailManager);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        enabled: false,
        logLevel: AuditSeverity.ERROR,
        batchSize: 50,
      };

      const manager = new AuditTrailManager(customConfig);

      expect(manager).toBeInstanceOf(AuditTrailManager);
    });

    it('should respect log level filtering', async () => {
      const manager = new AuditTrailManager({
        logLevel: AuditSeverity.ERROR,
      });

      // This should not be logged due to log level filtering
      await manager.logCitationCreated(mockCitation, mockUser);

      const entries = await manager.queryAuditTrail({});
      expect(entries).toHaveLength(0);
    });

    it('should respect enabled/disabled configuration', async () => {
      const manager = new AuditTrailManager({
        enabled: false,
      });

      await manager.logCitationCreated(mockCitation, mockUser);

      const entries = await manager.queryAuditTrail({});
      expect(entries).toHaveLength(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null/undefined citation gracefully', async () => {
      await expect(auditManager.logCitationCreated(null as any, mockUser)).rejects.toThrow();
    });

    it('should handle null/undefined user gracefully', async () => {
      await expect(auditManager.logCitationCreated(mockCitation, null as any)).rejects.toThrow();
    });

    it('should handle empty query results', async () => {
      const query: AuditTrailQuery = {
        eventTypes: [AuditEventType.BATCH_OPERATION], // Event type we haven't used
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries).toHaveLength(0);
    });

    it('should handle invalid date ranges in queries', async () => {
      const query: AuditTrailQuery = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2024-01-01'), // End before start
      };

      const entries = await auditManager.queryAuditTrail(query);
      expect(entries).toHaveLength(0);
    });
  });
});
