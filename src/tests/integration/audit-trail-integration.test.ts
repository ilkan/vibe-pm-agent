// Integration tests for AuditTrailManager with citation system

import { AuditTrailManager } from '../../components/audit-trail-manager';
import { CitationService } from '../../components/citation-service';
import {
  AuditEventType,
  AuditSeverity,
  AuditUser,
  ComplianceCheckResult,
} from '../../models/audit';
import {
  Citation,
  CitationSourceType,
  CitationConfidence,
  EnhancedCitation,
} from '../../models/citations';

describe('AuditTrailManager Integration', () => {
  let auditManager: AuditTrailManager;
  let citationService: CitationService;
  let mockUser: AuditUser;

  beforeEach(() => {
    auditManager = new AuditTrailManager({
      enabled: true,
      logLevel: AuditSeverity.INFO,
      batchSize: 50,
    });

    citationService = new CitationService();

    mockUser = {
      userId: 'integration-test-user',
      username: 'integrationtest',
      email: 'integration@test.com',
      role: 'pm_analyst',
      sessionId: 'integration-session-123',
    };
  });

  describe('Citation Lifecycle Audit Trail', () => {
    it('should track complete citation lifecycle with audit trail', async () => {
      const documentId = 'integration-doc-123';
      const documentType = 'business_case';

      // Step 1: Create a new citation
      const newCitation: Citation = {
        id: 'integration-citation-123',
        title: 'Integration Test Citation',
        url: 'https://example.com/integration-test',
        domain: 'example.com',
        published_at: '2024-01-15',
        source_type: CitationSourceType.INDUSTRY_REPORT,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Integration testing improves software quality by 40%',
        organization: 'Integration Testing Institute',
        methodology: 'Survey of 500+ development teams',
        sample_size: 500,
        geographic_scope: 'Global',
        industry_focus: ['software', 'testing'],
      };

      // Log citation creation
      await auditManager.logCitationCreated(newCitation, mockUser, {
        documentId,
        documentType,
        toolUsed: 'enhance_citations',
        requestId: 'req-integration-123',
      });

      // Step 2: Validate the citation
      const validationResult = {
        isValid: true,
        accessibilityStatus: 'accessible',
        credibilityAssessment: {
          overallScore: 88,
          factors: {
            domainAuthority: 85,
            authorCredentials: 90,
            peerReviewStatus: 85,
            citationFrequency: 80,
            methodologyTransparency: 95,
          },
          riskFactors: [],
          confidenceLevel: 'high',
        },
        complianceStatus: {
          isCompliant: true,
          checkedStandards: ['iso_27001'],
          violations: [],
          recommendations: [],
        },
      };

      await auditManager.logCitationValidated(
        newCitation.id,
        validationResult,
        mockUser,
        {
          documentId,
          toolUsed: 'validate_sources',
          requestId: 'req-integration-124',
        }
      );

      // Step 3: Modify the citation
      const modifiedCitation = {
        ...newCitation,
        title: 'Updated Integration Test Citation',
        confidence: CitationConfidence.MEDIUM,
        key_finding: 'Integration testing improves software quality by 35-45%',
      };

      await auditManager.logCitationModified(
        newCitation.id,
        newCitation,
        modifiedCitation,
        mockUser,
        'Updated findings based on additional research',
        {
          documentId,
          toolUsed: 'enhance_citations',
          requestId: 'req-integration-125',
        }
      );

      // Step 4: Assess quality
      const qualityResult = {
        overallScore: 85,
        metrics: {
          sourceCredibility: 88,
          evidenceDiversity: 80,
          recencyScore: 90,
          methodologyTransparency: 95,
          sampleSizeAdequacy: 85,
        },
        qualityGaps: [],
        recommendations: ['Consider adding more recent sources'],
        complianceStatus: 'compliant',
      };

      await auditManager.logQualityAssessed(
        newCitation.id,
        'citation',
        qualityResult,
        mockUser,
        {
          documentId,
          toolUsed: 'audit_citation_quality',
          requestId: 'req-integration-126',
        }
      );

      // Step 5: Generate document using the citation
      await auditManager.logDocumentGenerated(
        documentId,
        documentType,
        [newCitation.id],
        mockUser,
        {
          toolUsed: 'generate_business_case',
          requestId: 'req-integration-127',
          qualityMetrics: { overallScore: 85 },
        }
      );

      // Step 6: Check compliance
      const complianceResult: ComplianceCheckResult = {
        standardId: 'sox_2002',
        isCompliant: true,
        overallScore: 92,
        checkedAt: new Date(),
        requirementResults: [
          {
            requirementId: 'sox_audit_trail',
            isCompliant: true,
            score: 95,
            evidence: [
              {
                id: 'evidence-1',
                type: 'audit_log',
                description: 'Complete audit trail found',
                timestamp: new Date(),
                source: 'audit_trail_manager',
                data: {},
              },
            ],
            issues: [],
            recommendations: [],
          },
        ],
        violations: [],
        recommendations: [],
        evidenceCollected: [],
        auditTrailComplete: true,
        documentationComplete: true,
      };

      await auditManager.logComplianceChecked(
        documentId,
        'sox_2002',
        complianceResult,
        mockUser,
        {
          toolUsed: 'validate_compliance',
          requestId: 'req-integration-128',
        }
      );

      // Verify complete audit trail
      const auditEntries = await auditManager.queryAuditTrail({
        resourceIds: [newCitation.id, documentId],
      });

      expect(auditEntries.length).toBeGreaterThanOrEqual(6);

      // Verify all event types are present
      const eventTypes = auditEntries.map(entry => entry.eventType);
      expect(eventTypes).toContain(AuditEventType.CITATION_CREATED);
      expect(eventTypes).toContain(AuditEventType.CITATION_VALIDATED);
      expect(eventTypes).toContain(AuditEventType.CITATION_MODIFIED);
      expect(eventTypes).toContain(AuditEventType.QUALITY_ASSESSED);
      expect(eventTypes).toContain(AuditEventType.DOCUMENT_GENERATED);
      expect(eventTypes).toContain(AuditEventType.COMPLIANCE_CHECKED);

      // Verify user attribution
      auditEntries.forEach(entry => {
        expect(entry.user.userId).toBe(mockUser.userId);
      });

      // Verify document context
      const documentRelatedEntries = auditEntries.filter(entry => entry.documentId === documentId);
      expect(documentRelatedEntries.length).toBeGreaterThan(0);

      // Generate comprehensive summary
      const summary = await auditManager.generateSummary({
        resourceIds: [newCitation.id, documentId],
      });

      expect(summary.totalEvents).toBeGreaterThanOrEqual(6);
      expect(summary.topUsers[0].userId).toBe(mockUser.userId);
      expect(summary.complianceStatus.overallScore).toBeGreaterThan(0);
    });

    it('should track citation deletion with proper audit trail', async () => {
      const citation: Citation = {
        id: 'deletion-test-citation',
        title: 'Citation to be Deleted',
        url: 'https://example.com/to-delete',
        domain: 'example.com',
        published_at: '2024-01-01',
        source_type: CitationSourceType.COMPANY_BLOG,
        confidence: CitationConfidence.LOW,
        key_finding: 'Test finding',
      };

      // Create citation
      await auditManager.logCitationCreated(citation, mockUser);

      // Delete citation
      await auditManager.logCitationDeleted(
        citation,
        mockUser,
        'Source no longer credible',
        {
          documentId: 'doc-deletion-test',
          toolUsed: 'audit_citation_quality',
        }
      );

      // Verify audit trail
      const entries = await auditManager.queryAuditTrail({
        resourceIds: [citation.id],
      });

      expect(entries).toHaveLength(2);
      
      const creationEntry = entries.find(e => e.eventType === AuditEventType.CITATION_CREATED);
      const deletionEntry = entries.find(e => e.eventType === AuditEventType.CITATION_DELETED);

      expect(creationEntry).toBeDefined();
      expect(deletionEntry).toBeDefined();
      expect(deletionEntry?.severity).toBe(AuditSeverity.WARNING);
      expect(deletionEntry?.previousState).toEqual(citation);
      expect(deletionEntry?.newState).toBeNull();
      expect(deletionEntry?.additionalMetadata?.deleteReason).toBe('Source no longer credible');
    });
  });

  describe('Compliance Integration', () => {
    it('should validate SOX compliance for financial documents', async () => {
      // Create financial document with citations
      const financialCitation: Citation = {
        id: 'financial-citation-123',
        title: 'Q4 Financial Performance Report',
        url: 'https://sec.gov/financial-report',
        domain: 'sec.gov',
        published_at: '2024-01-15',
        source_type: CitationSourceType.GOVERNMENT_DATA,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Revenue increased by 15% year-over-year',
        organization: 'SEC',
      };

      await auditManager.logCitationCreated(financialCitation, mockUser, {
        documentId: 'financial-doc-123',
        documentType: 'financial_report',
      });

      await auditManager.logDocumentGenerated(
        'financial-doc-123',
        'financial_report',
        [financialCitation.id],
        mockUser
      );

      // Validate SOX compliance
      const complianceResults = await auditManager.validateCompliance(['sox_2002']);
      
      expect(complianceResults).toHaveLength(1);
      expect(complianceResults[0].standardId).toBe('sox_2002');
      expect(complianceResults[0].auditTrailComplete).toBe(true);
    });

    it('should validate GDPR compliance for data processing', async () => {
      // Simulate data processing activity
      await auditManager.logDocumentGenerated(
        'gdpr-doc-123',
        'privacy_policy',
        [],
        mockUser,
        {
          toolUsed: 'generate_privacy_policy',
        }
      );

      // Validate GDPR compliance
      const complianceResults = await auditManager.validateCompliance(['gdpr_2018']);
      
      expect(complianceResults).toHaveLength(1);
      expect(complianceResults[0].standardId).toBe('gdpr_2018');
      // GDPR compliance might fail due to missing data processing logs
      expect(complianceResults[0].requirementResults).toBeDefined();
    });

    it('should validate ISO 27001 compliance for security documents', async () => {
      const securityCitation: Citation = {
        id: 'security-citation-123',
        title: 'Cybersecurity Best Practices 2024',
        url: 'https://nist.gov/cybersecurity-framework',
        domain: 'nist.gov',
        published_at: '2024-01-10',
        source_type: CitationSourceType.GOVERNMENT_DATA,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Multi-factor authentication reduces breach risk by 99.9%',
        organization: 'NIST',
      };

      await auditManager.logCitationCreated(securityCitation, mockUser, {
        documentId: 'security-doc-123',
        documentType: 'security_policy',
      });

      // Validate ISO 27001 compliance
      const complianceResults = await auditManager.validateCompliance(['iso_27001']);
      
      expect(complianceResults).toHaveLength(1);
      expect(complianceResults[0].standardId).toBe('iso_27001');
      expect(complianceResults[0].requirementResults).toBeDefined();
    });
  });

  describe('Audit Report Generation Integration', () => {
    beforeEach(async () => {
      // Set up test data
      const testCitation: Citation = {
        id: 'report-test-citation',
        title: 'Report Test Citation',
        url: 'https://example.com/report-test',
        domain: 'example.com',
        published_at: '2024-01-15',
        source_type: CitationSourceType.CONSULTING_STUDY,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Test finding for report generation',
      };

      await auditManager.logCitationCreated(testCitation, mockUser);
      await auditManager.logDocumentGenerated('report-doc-123', 'business_case', [testCitation.id], mockUser);
      
      const qualityResult = { overallScore: 88, qualityGaps: [], recommendations: [] };
      await auditManager.logQualityAssessed('report-doc-123', 'document', qualityResult, mockUser);
    });

    it('should generate comprehensive audit report with all sections', async () => {
      const report = await auditManager.generateAuditReport(
        {
          reportType: 'detailed',
          timeRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date(),
          },
          includeDetails: true,
          includeEvidence: true,
          includeRecommendations: true,
          format: 'json',
          complianceStandards: ['sox_2002', 'gdpr_2018'],
        },
        mockUser
      );

      expect(report.id).toBeDefined();
      expect(report.generatedBy).toEqual(mockUser);
      expect(report.summary.totalEvents).toBeGreaterThan(0);
      expect(report.entries.length).toBeGreaterThan(0);
      expect(report.complianceResults).toHaveLength(2);
      expect(report.hash).toBeDefined();

      // Verify report integrity
      expect(report.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash format
    });

    it('should generate user activity report', async () => {
      const report = await auditManager.generateAuditReport(
        {
          reportType: 'user_activity',
          timeRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date(),
          },
          includeDetails: true,
          includeEvidence: false,
          includeRecommendations: false,
          format: 'json',
          filters: {
            userIds: [mockUser.userId],
          },
        },
        mockUser
      );

      expect(report.entries.length).toBeGreaterThan(0);
      report.entries.forEach(entry => {
        expect(entry.user.userId).toBe(mockUser.userId);
      });

      expect(report.summary.topUsers[0].userId).toBe(mockUser.userId);
    });

    it('should generate resource changes report', async () => {
      const report = await auditManager.generateAuditReport(
        {
          reportType: 'resource_changes',
          timeRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date(),
          },
          includeDetails: true,
          includeEvidence: false,
          includeRecommendations: false,
          format: 'json',
          filters: {
            resourceTypes: ['citation', 'document'],
          },
        },
        mockUser
      );

      expect(report.entries.length).toBeGreaterThan(0);
      report.entries.forEach(entry => {
        expect(['citation', 'document']).toContain(entry.resourceType);
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large number of audit entries efficiently', async () => {
      const startTime = Date.now();
      
      // Create many audit entries
      const promises = [];
      for (let i = 0; i < 100; i++) {
        const citation: Citation = {
          id: `perf-test-citation-${i}`,
          title: `Performance Test Citation ${i}`,
          url: `https://example.com/perf-test-${i}`,
          domain: 'example.com',
          published_at: '2024-01-15',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.MEDIUM,
          key_finding: `Performance test finding ${i}`,
        };

        promises.push(auditManager.logCitationCreated(citation, mockUser));
      }

      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 5 seconds)
      expect(duration).toBeLessThan(5000);

      // Verify all entries were logged
      const entries = await auditManager.queryAuditTrail({
        eventTypes: [AuditEventType.CITATION_CREATED],
      });

      expect(entries.length).toBeGreaterThanOrEqual(100);
    });

    it('should efficiently query large audit trail', async () => {
      // Add some test data first
      for (let i = 0; i < 50; i++) {
        const citation: Citation = {
          id: `query-test-citation-${i}`,
          title: `Query Test Citation ${i}`,
          url: `https://example.com/query-test-${i}`,
          domain: 'example.com',
          published_at: '2024-01-15',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.MEDIUM,
          key_finding: `Query test finding ${i}`,
        };

        await auditManager.logCitationCreated(citation, mockUser);
      }

      const startTime = Date.now();
      
      // Query with various filters
      const results = await auditManager.queryAuditTrail({
        eventTypes: [AuditEventType.CITATION_CREATED],
        userIds: [mockUser.userId],
        limit: 20,
        sortBy: 'timestamp',
        sortOrder: 'desc',
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly (less than 100ms)
      expect(duration).toBeLessThan(100);
      expect(results.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should continue logging after encountering errors', async () => {
      // Try to log with invalid data
      try {
        await auditManager.logCitationCreated(null as any, mockUser);
      } catch (error) {
        // Expected to fail
      }

      // Should still be able to log valid data
      const validCitation: Citation = {
        id: 'recovery-test-citation',
        title: 'Recovery Test Citation',
        url: 'https://example.com/recovery-test',
        domain: 'example.com',
        published_at: '2024-01-15',
        source_type: CitationSourceType.INDUSTRY_REPORT,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Recovery test finding',
      };

      await expect(
        auditManager.logCitationCreated(validCitation, mockUser)
      ).resolves.not.toThrow();

      const entries = await auditManager.queryAuditTrail({
        resourceIds: [validCitation.id],
      });

      expect(entries).toHaveLength(1);
    });

    it('should handle concurrent audit logging', async () => {
      const promises = [];
      
      // Create concurrent logging operations
      for (let i = 0; i < 20; i++) {
        const citation: Citation = {
          id: `concurrent-test-citation-${i}`,
          title: `Concurrent Test Citation ${i}`,
          url: `https://example.com/concurrent-test-${i}`,
          domain: 'example.com',
          published_at: '2024-01-15',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.MEDIUM,
          key_finding: `Concurrent test finding ${i}`,
        };

        promises.push(auditManager.logCitationCreated(citation, mockUser));
      }

      // All should complete successfully
      await expect(Promise.all(promises)).resolves.not.toThrow();

      // Verify all entries were logged
      const entries = await auditManager.queryAuditTrail({
        eventTypes: [AuditEventType.CITATION_CREATED],
      });

      expect(entries.length).toBeGreaterThanOrEqual(20);
    });
  });
});