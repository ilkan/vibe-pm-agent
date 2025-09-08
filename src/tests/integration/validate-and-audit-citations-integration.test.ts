/**
 * Integration tests for validate_and_audit_citations MCP tool
 * 
 * Tests the comprehensive citation validation and quality auditing functionality
 * including source validation, credibility assessment, compliance checking,
 * and evidence report generation.
 */

import { validateAndAuditCitations, ValidateAndAuditCitationsArgs } from '../../mcp/tools/validate_and_audit_citations';
import { MCPToolContext } from '../../models/mcp';
import { Citation, CitationSourceType, CitationConfidence } from '../../models/citations';

describe('validate_and_audit_citations Integration Tests', () => {
  let mockContext: MCPToolContext;

  beforeEach(() => {
    mockContext = {
      toolName: 'validate_and_audit_citations',
      sessionId: 'test-session',
      timestamp: Date.now(),
      requestId: 'test-request-123',
      userId: 'test-user',
    };
  });

  describe('Basic Validation and Audit', () => {
    it('should validate and audit a single high-quality citation', async () => {
      const citations: Citation[] = [
        {
          id: 'test-citation-1',
          title: 'Digital Transformation in Enterprise Software',
          url: 'https://mckinsey.com/digital-transformation-study',
          domain: 'mckinsey.com',
          authors: ['Dr. Sarah Johnson', 'Michael Chen'],
          organization: 'McKinsey & Company',
          published_at: '2024-01-15',
          source_type: CitationSourceType.CONSULTING_STUDY,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Companies implementing comprehensive digital transformation see 23% revenue increase',
          methodology: 'Survey of 500 enterprise companies across 15 industries',
          sample_size: 500,
          industry_focus: ['technology', 'enterprise software'],
          last_accessed: '2024-01-20',
        },
      ];

      const args: ValidateAndAuditCitationsArgs = {
        citations,
        document_type: 'business_case',
        validation_options: {
          check_accessibility: true,
          assess_credibility: true,
          verify_compliance: true,
          find_alternatives: true,
        },
        audit_options: {
          perform_quality_assessment: true,
          identify_quality_gaps: true,
          generate_recommendations: true,
          minimum_quality_threshold: 70,
        },
        report_options: {
          generate_evidence_report: true,
          include_validation_details: true,
          include_quality_metrics: true,
          include_recommendations: true,
          report_format: 'detailed',
        },
      };

      const result = await validateAndAuditCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('markdown');
      
      const content = result.content[0].markdown!;
      expect(content).toContain('Citation Validation and Quality Audit Report');
      expect(content).toContain('Executive Summary');
      expect(content).toContain('Validation Results');
      expect(content).toContain('Quality Assessment');
      expect(content).toContain('Evidence Analysis');
      expect(content).toContain('Audit Trail');

      // Check metadata
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.quotaUsed).toBeGreaterThan(0);
    });

    it('should handle multiple citations with mixed quality', async () => {
      const citations: Citation[] = [
        {
          id: 'high-quality-1',
          title: 'Enterprise AI Adoption Study 2024',
          url: 'https://bcg.com/ai-adoption-study-2024',
          domain: 'bcg.com',
          authors: ['Dr. Lisa Wang', 'Robert Smith'],
          organization: 'Boston Consulting Group',
          published_at: '2024-02-01',
          source_type: CitationSourceType.CONSULTING_STUDY,
          confidence: CitationConfidence.HIGH,
          key_finding: 'AI adoption increases operational efficiency by 35%',
          methodology: 'Comprehensive survey and case study analysis',
          sample_size: 750,
          industry_focus: ['artificial intelligence', 'enterprise'],
          last_accessed: '2024-02-15',
        },
        {
          id: 'medium-quality-1',
          title: 'Industry Report on Digital Trends',
          url: 'https://techreport.com/digital-trends-2023',
          domain: 'techreport.com',
          authors: ['John Doe'],
          organization: 'Tech Report Inc',
          published_at: '2023-06-15',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.MEDIUM,
          key_finding: 'Digital transformation spending increased 15% year-over-year',
          methodology: '',
          sample_size: 0,
          industry_focus: ['technology'],
          last_accessed: '2024-01-10',
        },
        {
          id: 'low-quality-1',
          title: 'Blog Post About Tech Trends',
          url: 'https://broken-link.com/tech-trends',
          domain: 'broken-link.com',
          authors: [],
          organization: '',
          published_at: '2022-03-10',
          source_type: CitationSourceType.COMPANY_BLOG,
          confidence: CitationConfidence.LOW,
          key_finding: 'Technology is changing rapidly',
          methodology: '',
          sample_size: 0,
          industry_focus: ['technology'],
          last_accessed: '2024-01-05',
        },
      ];

      const args: ValidateAndAuditCitationsArgs = {
        citations,
        document_type: 'market_analysis',
        audit_options: {
          minimum_quality_threshold: 60,
          required_diversity_score: 50,
          max_source_age_months: 24,
        },
      };

      const result = await validateAndAuditCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('markdown');
      
      const content = result.content[0].markdown!;
      expect(content).toContain('3');
      expect(content).toContain('Quality Gaps Identified');
      expect(content).toContain('Improvement Recommendations');
      expect(content).toContain('Failed Validations');

      // Should identify quality issues (at least one of these should be present)
      const hasQualityIssues = content.includes('Quality Gaps Identified') || 
                               content.includes('Improvement Recommendations') ||
                               content.includes('Failed Validations') ||
                               content.includes('WARNING') ||
                               content.includes('NON-COMPLIANT');
      expect(hasQualityIssues).toBe(true);
    });
  });

  describe('Validation Options', () => {
    it('should respect validation option settings', async () => {
      const citations: Citation[] = [
        {
          id: 'test-citation-1',
          title: 'Test Study',
          url: 'https://example.com/study',
          domain: 'example.com',
          authors: ['Test Author'],
          organization: 'Test Org',
          published_at: '2024-01-01',
          source_type: CitationSourceType.RESEARCH_PUBLICATION,
          confidence: CitationConfidence.MEDIUM,
          key_finding: 'Test finding',
          methodology: 'Test methodology',
          sample_size: 100,
          industry_focus: ['test'],
          last_accessed: '2024-01-15',
        },
      ];

      const args: ValidateAndAuditCitationsArgs = {
        citations,
        validation_options: {
          check_accessibility: false,
          assess_credibility: true,
          verify_compliance: false,
          find_alternatives: false,
          timeout: 5000,
          retry_attempts: 1,
          compliance_standards: ['business'],
        },
      };

      const result = await validateAndAuditCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('markdown');
      
      // Should still provide validation results even with limited options
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.quotaUsed).toBeGreaterThan(0);
    });

    it('should handle custom compliance standards', async () => {
      const citations: Citation[] = [
        {
          id: 'academic-citation',
          title: 'Academic Research Paper',
          url: 'https://university.edu/research-paper',
          domain: 'university.edu',
          authors: ['Dr. Academic Researcher'],
          organization: 'University Research Center',
          published_at: '2024-01-01',
          source_type: CitationSourceType.ACADEMIC_PAPER,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Academic finding with peer review',
          methodology: 'Rigorous academic methodology',
          sample_size: 1000,
          industry_focus: ['research'],
          last_accessed: '2024-01-15',
        },
      ];

      const args: ValidateAndAuditCitationsArgs = {
        citations,
        validation_options: {
          compliance_standards: ['academic', 'regulatory'],
        },
        audit_options: {
          require_methodology: true,
          minimum_sample_size: 500,
        },
      };

      const result = await validateAndAuditCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('markdown');
      
      const content = result.content[0].markdown!;
      // Should show some compliance status (compliant, warning, or non-compliant)
      const hasComplianceStatus = content.includes('compliant') || 
                                  content.includes('COMPLIANT') ||
                                  content.includes('WARNING') ||
                                  content.includes('warning');
      expect(hasComplianceStatus).toBe(true);
    });
  });

  describe('Quality Assessment Features', () => {
    it('should identify insufficient sources', async () => {
      const citations: Citation[] = [
        {
          id: 'single-citation',
          title: 'Single Source Study',
          url: 'https://example.com/single-study',
          domain: 'example.com',
          authors: ['Single Author'],
          organization: 'Single Org',
          published_at: '2024-01-01',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.MEDIUM,
          key_finding: 'Single finding',
          methodology: '',
          sample_size: 0,
          industry_focus: ['test'],
          last_accessed: '2024-01-15',
        },
      ];

      const args: ValidateAndAuditCitationsArgs = {
        citations,
        audit_options: {
          identify_quality_gaps: true,
          minimum_quality_threshold: 70,
        },
      };

      const result = await validateAndAuditCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('markdown');
      
      const content = result.content[0].markdown!;
      expect(
        content.includes('INSUFFICIENT_SOURCES') || 
        content.includes('Only 1 sources provided') ||
        content.includes('minimum 3 recommended')
      ).toBe(true);
    });

    it('should identify outdated sources', async () => {
      const citations: Citation[] = [
        {
          id: 'old-citation-1',
          title: 'Old Study from 2020',
          url: 'https://example.com/old-study-2020',
          domain: 'example.com',
          authors: ['Old Author'],
          organization: 'Old Org',
          published_at: '2020-01-01', // 4+ years old
          source_type: CitationSourceType.RESEARCH_PUBLICATION,
          confidence: CitationConfidence.MEDIUM,
          key_finding: 'Old finding',
          methodology: 'Old methodology',
          sample_size: 100,
          industry_focus: ['test'],
          last_accessed: '2024-01-15',
        },
        {
          id: 'old-citation-2',
          title: 'Another Old Study from 2019',
          url: 'https://example.com/old-study-2019',
          domain: 'example.com',
          authors: ['Another Old Author'],
          organization: 'Another Old Org',
          published_at: '2019-06-01', // 4+ years old
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.LOW,
          key_finding: 'Another old finding',
          methodology: '',
          sample_size: 0,
          industry_focus: ['test'],
          last_accessed: '2024-01-15',
        },
        {
          id: 'very-old-citation',
          title: 'Very Old Study from 2018',
          url: 'https://example.com/very-old-study-2018',
          domain: 'example.com',
          authors: ['Very Old Author'],
          organization: 'Very Old Org',
          published_at: '2018-01-01', // 6+ years old
          source_type: CitationSourceType.WHITE_PAPER,
          confidence: CitationConfidence.LOW,
          key_finding: 'Very old finding',
          methodology: '',
          sample_size: 0,
          industry_focus: ['test'],
          last_accessed: '2024-01-15',
        },
      ];

      const args: ValidateAndAuditCitationsArgs = {
        citations,
        audit_options: {
          max_source_age_months: 36, // 3 years
          identify_quality_gaps: true,
        },
      };

      const result = await validateAndAuditCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('markdown');
      
      const content = result.content[0].markdown!;
      expect(
        content.includes('OUTDATED_SOURCES') || 
        content.includes('older than 3 years') ||
        content.includes('recent sources')
      ).toBe(true);
    });

    it('should identify methodology transparency issues', async () => {
      const citations: Citation[] = [
        {
          id: 'no-methodology-1',
          title: 'Research Without Methodology',
          url: 'https://example.com/research-no-method',
          domain: 'example.com',
          authors: ['Research Author'],
          organization: 'Research Org',
          published_at: '2024-01-01',
          source_type: CitationSourceType.RESEARCH_PUBLICATION,
          confidence: CitationConfidence.MEDIUM,
          key_finding: 'Research finding without clear methodology',
          methodology: '', // Missing methodology
          sample_size: 0, // Missing sample size
          industry_focus: ['research'],
          last_accessed: '2024-01-15',
        },
        {
          id: 'no-methodology-2',
          title: 'Survey Without Details',
          url: 'https://example.com/survey-no-details',
          domain: 'example.com',
          authors: ['Survey Author'],
          organization: 'Survey Org',
          published_at: '2024-01-01',
          source_type: CitationSourceType.SURVEY_DATA,
          confidence: CitationConfidence.MEDIUM,
          key_finding: 'Survey finding without methodology details',
          methodology: '', // Missing methodology
          sample_size: 0, // Missing sample size
          industry_focus: ['survey'],
          last_accessed: '2024-01-15',
        },
        {
          id: 'no-methodology-3',
          title: 'Benchmark Study Without Method',
          url: 'https://example.com/benchmark-no-method',
          domain: 'example.com',
          authors: ['Benchmark Author'],
          organization: 'Benchmark Org',
          published_at: '2024-01-01',
          source_type: CitationSourceType.BENCHMARK_STUDY,
          confidence: CitationConfidence.MEDIUM,
          key_finding: 'Benchmark finding without clear methodology',
          methodology: '', // Missing methodology
          sample_size: 0, // Missing sample size
          industry_focus: ['benchmark'],
          last_accessed: '2024-01-15',
        },
      ];

      const args: ValidateAndAuditCitationsArgs = {
        citations,
        audit_options: {
          require_methodology: true,
          identify_quality_gaps: true,
        },
      };

      const result = await validateAndAuditCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('markdown');
      
      const content = result.content[0].markdown!;
      expect(
        content.includes('METHODOLOGY_UNCLEAR') || 
        content.includes('methodology details') ||
        content.includes('research sources lack methodology')
      ).toBe(true);
    });
  });

  describe('Evidence Report Generation', () => {
    it('should generate comprehensive evidence report', async () => {
      const citations: Citation[] = [
        {
          id: 'evidence-1',
          title: 'Strong Evidence Source',
          url: 'https://harvard.edu/business-study',
          domain: 'harvard.edu',
          authors: ['Dr. Harvard Professor'],
          organization: 'Harvard Business School',
          published_at: '2024-01-01',
          source_type: CitationSourceType.ACADEMIC_PAPER,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Strong evidence supports the hypothesis with 95% confidence',
          methodology: 'Rigorous experimental design with control groups',
          sample_size: 2000,
          industry_focus: ['business', 'research'],
          last_accessed: '2024-01-15',
        },
        {
          id: 'evidence-2',
          title: 'Supporting Industry Data',
          url: 'https://gartner.com/industry-analysis',
          domain: 'gartner.com',
          authors: ['Gartner Analyst'],
          organization: 'Gartner Inc',
          published_at: '2024-01-15',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Industry data confirms the trend with consistent growth patterns',
          methodology: 'Market analysis and vendor surveys',
          sample_size: 500,
          industry_focus: ['technology', 'market analysis'],
          last_accessed: '2024-01-20',
        },
      ];

      const args: ValidateAndAuditCitationsArgs = {
        citations,
        document_content: 'This document analyzes the strong evidence for business transformation trends.',
        report_options: {
          generate_evidence_report: true,
          include_validation_details: true,
          include_quality_metrics: true,
          include_recommendations: true,
          include_alternatives: true,
          report_format: 'detailed',
        },
      };

      const result = await validateAndAuditCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('markdown');
      
      const content = result.content[0].markdown!;
      expect(content).toContain('Evidence Analysis');
      expect(content).toContain('Evidence Strength');
      expect(content).toContain('Key Findings');
      expect(content).toContain('Strong evidence supports');
      expect(content).toContain('Industry data confirms');
    });

    it('should handle different report formats', async () => {
      const citations: Citation[] = [
        {
          id: 'format-test',
          title: 'Format Test Citation',
          url: 'https://example.com/format-test',
          domain: 'example.com',
          authors: ['Format Author'],
          organization: 'Format Org',
          published_at: '2024-01-01',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.MEDIUM,
          key_finding: 'Format test finding',
          methodology: 'Format test methodology',
          sample_size: 100,
          industry_focus: ['test'],
          last_accessed: '2024-01-15',
        },
      ];

      // Test summary format
      const summaryArgs: ValidateAndAuditCitationsArgs = {
        citations,
        report_options: {
          report_format: 'summary',
          include_validation_details: false,
          include_quality_metrics: true,
          include_recommendations: false,
        },
      };

      const summaryResult = await validateAndAuditCitations(summaryArgs, mockContext);
      expect(summaryResult.isError).toBeFalsy();
      expect(summaryResult.content).toBeDefined();
      expect(summaryResult.content[0].type).toBe('markdown');
      expect(summaryResult.content[0].markdown!).toContain('Executive Summary');

      // Test executive format
      const executiveArgs: ValidateAndAuditCitationsArgs = {
        citations,
        report_options: {
          report_format: 'executive',
          include_validation_details: false,
          include_quality_metrics: false,
          include_recommendations: true,
        },
      };

      const executiveResult = await validateAndAuditCitations(executiveArgs, mockContext);
      expect(executiveResult.isError).toBeFalsy();
      expect(executiveResult.content).toBeDefined();
      expect(executiveResult.content[0].type).toBe('markdown');
      expect(executiveResult.content[0].markdown!).toContain('Executive Summary');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty citations array', async () => {
      const args: ValidateAndAuditCitationsArgs = {
        citations: [],
      };

      const result = await validateAndAuditCitations(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('json');
      expect(JSON.stringify(result.content[0].json)).toContain('citations array is required');
    });

    it('should handle invalid citation data', async () => {
      const invalidCitations = [
        {
          id: 'invalid-1',
          // Missing required fields
          title: '',
          url: '',
          source_type: 'invalid_type' as any,
          confidence: 'invalid_confidence' as any,
        },
      ] as Citation[];

      const args: ValidateAndAuditCitationsArgs = {
        citations: invalidCitations,
      };

      const result = await validateAndAuditCitations(args, mockContext);

      // Should handle gracefully and still provide some results
      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown!).toContain('Citation Validation and Quality Audit Report');
    });

    it('should handle validation failures gracefully', async () => {
      const citations: Citation[] = [
        {
          id: 'failing-citation',
          title: 'Citation That Will Fail Validation',
          url: 'https://broken-domain-that-will-fail.com/broken-path',
          domain: 'broken-domain-that-will-fail.com',
          authors: [],
          organization: '',
          published_at: 'invalid-date',
          source_type: CitationSourceType.COMPANY_BLOG,
          confidence: CitationConfidence.LOW,
          key_finding: '',
          methodology: '',
          sample_size: 0,
          industry_focus: [],
          last_accessed: '',
        },
      ];

      const args: ValidateAndAuditCitationsArgs = {
        citations,
        validation_options: {
          timeout: 1000, // Short timeout to force failures
          retry_attempts: 1,
        },
      };

      const result = await validateAndAuditCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('markdown');
      
      const content = result.content[0].markdown!;
      expect(content).toContain('Failed Validations');
      expect(content.includes('Critical Issues') || content.includes('Quality Gaps')).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple citations efficiently', async () => {
      const citations: Citation[] = Array.from({ length: 10 }, (_, i) => ({
        id: `perf-citation-${i + 1}`,
        title: `Performance Test Citation ${i + 1}`,
        url: `https://example${i + 1}.com/study`,
        domain: `example${i + 1}.com`,
        authors: [`Author ${i + 1}`],
        organization: `Organization ${i + 1}`,
        published_at: '2024-01-01',
        source_type: CitationSourceType.INDUSTRY_REPORT,
        confidence: CitationConfidence.MEDIUM,
        key_finding: `Finding ${i + 1}`,
        methodology: `Methodology ${i + 1}`,
        sample_size: 100 + i * 10,
        industry_focus: ['performance', 'test'],
        last_accessed: '2024-01-15',
      }));

      const startTime = Date.now();

      const args: ValidateAndAuditCitationsArgs = {
        citations,
        validation_options: {
          timeout: 5000,
          retry_attempts: 1,
        },
      };

      const result = await validateAndAuditCitations(args, mockContext);
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown!).toContain('10');
      expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
      
      // Check that all citations were processed
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.quotaUsed).toBeGreaterThan(0);
    });

    it('should respect timeout settings', async () => {
      const citations: Citation[] = [
        {
          id: 'timeout-test',
          title: 'Timeout Test Citation',
          url: 'https://timeout-test.com/slow-response',
          domain: 'timeout-test.com',
          authors: ['Timeout Author'],
          organization: 'Timeout Org',
          published_at: '2024-01-01',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.MEDIUM,
          key_finding: 'Timeout test finding',
          methodology: 'Timeout test methodology',
          sample_size: 100,
          industry_focus: ['timeout'],
          last_accessed: '2024-01-15',
        },
      ];

      const args: ValidateAndAuditCitationsArgs = {
        citations,
        validation_options: {
          timeout: 1000, // Very short timeout
          retry_attempts: 1,
        },
      };

      const startTime = Date.now();
      const result = await validateAndAuditCitations(args, mockContext);
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(processingTime).toBeLessThan(5000); // Should respect timeout settings
    });
  });

  describe('Integration with Existing Components', () => {
    it('should integrate with SourceValidationEngine correctly', async () => {
      const citations: Citation[] = [
        {
          id: 'integration-test-1',
          title: 'Integration Test Citation',
          url: 'https://mckinsey.com/integration-test',
          domain: 'mckinsey.com',
          authors: ['Integration Author'],
          organization: 'McKinsey & Company',
          published_at: '2024-01-01',
          source_type: CitationSourceType.CONSULTING_STUDY,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Integration test finding',
          methodology: 'Integration test methodology',
          sample_size: 500,
          industry_focus: ['integration'],
          last_accessed: '2024-01-15',
        },
      ];

      const args: ValidateAndAuditCitationsArgs = {
        citations,
        validation_options: {
          check_accessibility: true,
          assess_credibility: true,
          verify_compliance: true,
        },
      };

      const result = await validateAndAuditCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('markdown');
      
      const content = result.content[0].markdown!;
      expect(content).toContain('Accessibility Status');
      // Should show high quality scores for McKinsey domain
      expect(content).toContain('Source Credibility');
      expect(content).toContain('100/100');
      expect(result.metadata).toBeDefined();
    });

    it('should integrate with QualityAssessmentSystem correctly', async () => {
      const citations: Citation[] = [
        {
          id: 'quality-integration-1',
          title: 'Quality Integration Test',
          url: 'https://harvard.edu/quality-test',
          domain: 'harvard.edu',
          authors: ['Dr. Quality Researcher'],
          organization: 'Harvard University',
          published_at: '2024-01-01',
          source_type: CitationSourceType.ACADEMIC_PAPER,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Quality integration finding',
          methodology: 'Rigorous quality methodology',
          sample_size: 1000,
          industry_focus: ['quality'],
          last_accessed: '2024-01-15',
        },
      ];

      const args: ValidateAndAuditCitationsArgs = {
        citations,
        audit_options: {
          perform_quality_assessment: true,
          identify_quality_gaps: true,
          generate_recommendations: true,
        },
      };

      const result = await validateAndAuditCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('markdown');
      
      const content = result.content[0].markdown!;
      expect(content).toContain('Quality Assessment');
      expect(content).toContain('Quality Metrics Breakdown');
      expect(result.metadata).toBeDefined();
    });
  });
});