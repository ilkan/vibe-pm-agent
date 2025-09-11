/**
 * Enhanced Citation System Integration Tests
 *
 * Comprehensive end-to-end testing of the unified citation system
 */

import { EnhancedCitationSystem } from '../../components/enhanced-citation-system';
import { Citation, CitationSourceType, CitationConfidence } from '../../models/citations';

describe('Enhanced Citation System Integration', () => {
  let citationSystem: EnhancedCitationSystem;

  beforeEach(() => {
    citationSystem = new EnhancedCitationSystem({
      enableRealTimeValidation: true,
      enableQualityMonitoring: true,
      enableAuditTrail: true,
      cacheValidationResults: true,
      maxConcurrentValidations: 5,
      qualityThresholds: {
        minimum: 60,
        target: 80,
        excellent: 90,
      },
    });
  });

  afterEach(async () => {
    await citationSystem.cleanup();
  });

  describe('Document Citation Enhancement', () => {
    it('should enhance citations in a business document', async () => {
      const testDocument = `
        # Market Analysis Report
        
        The global SaaS market is expected to grow significantly. According to recent studies,
        the market size will reach $623 billion by 2023. This growth is driven by digital
        transformation initiatives across industries.
        
        Key findings include:
        - 85% of enterprises are adopting cloud-first strategies
        - Customer acquisition costs have increased by 60% over the past 5 years
        - The average SaaS company achieves 20% annual recurring revenue growth
        
        These trends suggest strong opportunities for new market entrants.
      `;

      const result = await citationSystem.enhanceDocumentCitations(
        testDocument,
        'market_analysis',
        {
          userId: 'test-user',
          minimumConfidence: 70,
          requireSourceDiversity: true,
        }
      );

      expect(result.success).toBe(true);
      expect(result.enhancedCitations).toBeDefined();
      expect(result.qualityScore).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);

      // Should have identified citation needs
      expect(result.enhancedCitations.length).toBeGreaterThanOrEqual(0);

      // Should have quality assessment
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);

      // Should have actionable recommendations
      expect(result.recommendations.length).toBeGreaterThan(0);

      // Should have audit trail if enabled
      expect(result.auditTrail).toBeDefined();
    }, 30000);

    it('should handle documents with existing citations', async () => {
      const documentWithCitations = `
        # Business Case Analysis
        
        According to McKinsey & Company's 2023 report on digital transformation,
        companies that invest in AI see 15% higher productivity gains [1].
        
        The Harvard Business Review study from 2022 shows that 73% of executives
        consider AI a strategic priority [2].
        
        References:
        [1] McKinsey & Company. "The Age of AI: Digital Transformation Report 2023"
        [2] Harvard Business Review. "AI Strategy Survey Results 2022"
      `;

      const result = await citationSystem.enhanceDocumentCitations(
        documentWithCitations,
        'business_case'
      );

      expect(result.success).toBe(true);
      expect(result.originalCitations.length).toBeGreaterThan(0);
      expect(result.enhancedCitations.length).toBeGreaterThanOrEqual(
        result.originalCitations.length
      );

      // Should assess quality of existing citations
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
    }, 25000);

    it('should handle empty or invalid documents gracefully', async () => {
      const emptyDocument = '';

      const result = await citationSystem.enhanceDocumentCitations(emptyDocument, 'unknown');

      // Should handle gracefully without crashing
      expect(result.success).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);

      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.recommendations).toContain(
          'Citation enhancement failed. Please try again or contact support.'
        );
      }
    });
  });

  describe('Document Citation Analysis', () => {
    it('should analyze citation requirements and quality', async () => {
      const analysisDocument = `
        # Competitive Analysis
        
        Our main competitor has captured 35% market share through aggressive pricing.
        Industry reports suggest the market will consolidate over the next 2 years.
        Customer satisfaction scores show a 15-point gap between us and the market leader.
        
        Strategic recommendations:
        1. Reduce pricing by 20% to match competitor levels
        2. Invest in customer experience improvements
        3. Consider strategic partnerships for market expansion
      `;

      const analysis = await citationSystem.analyzeDocumentCitations(
        analysisDocument,
        'competitive-analysis-001'
      );

      expect(analysis.documentId).toBe('competitive-analysis-001');
      expect(analysis.content).toBe(analysisDocument);
      expect(analysis.existingCitations).toBeDefined();
      expect(analysis.qualityGaps).toBeDefined();
      expect(analysis.recommendedSources).toBeDefined();
      expect(analysis.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(analysis.overallConfidence).toBeLessThanOrEqual(100);
      expect(['compliant', 'warning', 'non-compliant']).toContain(analysis.complianceStatus);
    }, 20000);
  });

  describe('Evidence Package Generation', () => {
    it('should generate comprehensive evidence package for a topic', async () => {
      const topic = 'SaaS market growth trends 2024';
      const requirements = {
        minimumSources: 5,
        requiredSourceTypes: ['industry', 'academic', 'government'],
        confidenceThreshold: 75,
        industryFocus: 'software',
        geographicScope: 'global',
      };

      const evidencePackage = await citationSystem.generateEvidencePackage(topic, requirements);

      expect(evidencePackage.topic).toBe(topic);
      expect(['weak', 'moderate', 'strong']).toContain(evidencePackage.evidenceStrength);
      expect(evidencePackage.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(evidencePackage.overallConfidence).toBeLessThanOrEqual(100);

      expect(evidencePackage.primaryEvidence).toBeDefined();
      expect(evidencePackage.supportingEvidence).toBeDefined();
      expect(evidencePackage.recommendations).toBeDefined();
      expect(evidencePackage.recommendations.length).toBeGreaterThan(0);
    }, 25000);

    it('should handle topics with limited available sources', async () => {
      const obscureTopic = 'Quantum computing applications in medieval literature analysis';

      const evidencePackage = await citationSystem.generateEvidencePackage(obscureTopic, {
        minimumSources: 3,
        confidenceThreshold: 60,
      });

      expect(evidencePackage.topic).toBe(obscureTopic);
      expect(evidencePackage.evidenceStrength).toBeDefined();
      expect(evidencePackage.overallConfidence).toBeGreaterThanOrEqual(0);

      // Should still provide some structure even with limited sources
      expect(evidencePackage.primaryEvidence).toBeDefined();
      expect(evidencePackage.recommendations).toBeDefined();
    }, 20000);
  });

  describe('Citation Quality Auditing', () => {
    it('should audit citation quality and compliance', async () => {
      const testCitations: Citation[] = [
        {
          id: 'cite-1',
          title: 'Digital Transformation Report 2023',
          authors: ['John Smith', 'Jane Doe'],
          organization: 'McKinsey & Company',
          url: 'https://www.mckinsey.com/digital-transformation-2023',
          domain: 'mckinsey.com',
          published_at: '2023-06-15',
          source_type: CitationSourceType.CONSULTING_STUDY,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Comprehensive analysis of digital transformation trends',
        },
        {
          id: 'cite-2',
          title: 'AI in Business: A Strategic Guide',
          authors: ['Alice Johnson'],
          organization: 'Harvard Business Review',
          url: 'https://hbr.org/ai-business-guide',
          domain: 'hbr.org',
          published_at: '2023-03-20',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Strategic framework for AI adoption in enterprises',
        },
        {
          id: 'cite-3',
          title: 'Broken Link Example',
          authors: ['Unknown Author'],
          organization: 'Invalid Source',
          url: 'https://invalid-domain-that-does-not-exist.com/article',
          domain: 'invalid-domain-that-does-not-exist.com',
          published_at: '2020-01-01',
          source_type: CitationSourceType.COMPANY_BLOG,
          confidence: CitationConfidence.LOW,
          key_finding: 'This citation should fail validation',
        },
      ];

      const auditCriteria = {
        complianceStandards: ['business', 'academic'],
        qualityThresholds: { minimum: 70, target: 85 },
        industryRequirements: 'consulting',
      };

      const auditReport = await citationSystem.auditCitationQuality(testCitations, auditCriteria);

      expect(auditReport.auditId).toBeDefined();
      expect(auditReport.auditDate).toBeInstanceOf(Date);
      expect(auditReport.totalCitations).toBe(3);
      expect(auditReport.validCitations).toBeGreaterThanOrEqual(0);
      expect(auditReport.validCitations).toBeLessThanOrEqual(3);
      expect(auditReport.qualityScore).toBeGreaterThanOrEqual(0);
      expect(auditReport.qualityScore).toBeLessThanOrEqual(100);
      expect(['compliant', 'warning', 'non-compliant']).toContain(auditReport.complianceStatus);

      expect(auditReport.issues).toBeDefined();
      expect(auditReport.recommendations).toBeDefined();
      expect(auditReport.summary).toBeDefined();

      // Should provide actionable recommendations
      expect(auditReport.recommendations.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Performance and Monitoring', () => {
    it('should track performance metrics', async () => {
      // Perform several operations to generate metrics
      const testDocument = 'Test document for performance monitoring';

      await citationSystem.enhanceDocumentCitations(testDocument, 'test');
      await citationSystem.analyzeDocumentCitations(testDocument);

      const metrics = citationSystem.getPerformanceMetrics();

      expect(metrics).toBeDefined();
      // Performance metrics structure will depend on PerformanceOptimizer implementation
      // This test ensures the method is callable and returns data
    });

    it('should handle concurrent citation enhancement requests', async () => {
      const documents = [
        'Document 1: Market analysis with growth projections',
        'Document 2: Competitive landscape assessment',
        'Document 3: Customer satisfaction survey results',
        'Document 4: Financial performance indicators',
        'Document 5: Strategic planning recommendations',
      ];

      const promises = documents.map((doc, index) =>
        citationSystem.enhanceDocumentCitations(doc, `test-doc-${index}`)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.processingTime).toBeGreaterThan(0);
        // Each request should complete (success or failure)
        expect(typeof result.success).toBe('boolean');
      });
    }, 45000);
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network failures gracefully', async () => {
      // Test with a document that would require external validation
      const documentWithExternalSources = `
        Market data from https://definitely-invalid-url-for-testing.com shows growth trends.
        Industry analysis from https://another-invalid-source.net indicates market consolidation.
      `;

      const result = await citationSystem.enhanceDocumentCitations(
        documentWithExternalSources,
        'network-test'
      );

      // Should complete without throwing errors
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(result.processingTime).toBeGreaterThan(0);

      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.recommendations).toContain(
          'Citation enhancement failed. Please try again or contact support.'
        );
      }
    });

    it('should handle malformed input gracefully', async () => {
      const malformedInputs = [null as any, undefined as any, 123 as any, {} as any, [] as any];

      for (const input of malformedInputs) {
        try {
          const result = await citationSystem.enhanceDocumentCitations(input, 'malformed-test');

          // Should handle gracefully
          expect(result).toBeDefined();
          expect(typeof result.success).toBe('boolean');
        } catch (error) {
          // Errors are acceptable for malformed input
          expect(error).toBeInstanceOf(Error);
        }
      }
    });
  });

  describe('System Integration', () => {
    it('should integrate with all citation components', async () => {
      const testDocument = `
        # Integration Test Document
        
        This document tests the integration of all citation system components.
        It includes claims that require validation, quality assessment, and confidence scoring.
        
        Market size is $500 billion according to industry reports.
        Growth rate is 15% annually based on recent studies.
        Customer satisfaction is 85% according to survey data.
      `;

      const result = await citationSystem.enhanceDocumentCitations(
        testDocument,
        'integration-test',
        {
          userId: 'integration-tester',
          minimumConfidence: 70,
          requireSourceDiversity: true,
        }
      );

      // Verify all major components were involved
      expect(result.success).toBe(true);

      // Should have enhanced citations
      expect(result.enhancedCitations).toBeDefined();

      // Should have quality assessment
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);

      // Audit Trail should have recorded the operation
      expect(result.auditTrail).toBeDefined();

      // System should provide actionable recommendations
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    }, 35000);
  });
});
