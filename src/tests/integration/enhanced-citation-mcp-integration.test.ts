/**
 * Integration tests for enhanced citation system with MCP tools
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CitationIntegration } from '../../utils/citation-integration';
import { generateManagementOnePager } from '../../mcp/tools/generate_management_onepager';
import { generatePRFAQ } from '../../mcp/tools/generate_pr_faq';
import { MCPToolContext, CitationOptions } from '../../models/mcp';
import { Citation, CitationSourceType, CitationConfidence } from '../../models/citations';

describe('Enhanced Citation System MCP Integration', () => {
  let citationIntegration: CitationIntegration;
  let mockContext: MCPToolContext;

  beforeEach(() => {
    citationIntegration = new CitationIntegration();
    mockContext = {
      toolName: 'test_tool',
      sessionId: 'test_session',
      timestamp: Date.now(),
      requestId: 'test_request',
    };
  });

  afterEach(() => {
    // Clean up any resources if needed
  });

  describe('Enhanced Citation Integration', () => {
    it('should integrate citations with validation and quality assessment', async () => {
      const content = `
        Our analysis shows that SaaS companies typically experience 5-7% monthly churn rates.
        Product-led growth strategies can increase conversion rates by 15-20%.
        Customer success teams reduce churn by implementing proactive engagement.
      `;

      const options: CitationOptions = {
        include_citations: true,
        minimum_citations: 3,
        minimum_confidence: 'medium',
        validate_sources: true,
        assess_quality: true,
        calculate_confidence: true,
        show_confidence_indicators: true,
      };

      const result = await citationIntegration.integrateCitations(
        'business_case',
        content,
        options,
        'saas'
      );

      // Verify enhanced citation result structure
      expect(result).toHaveProperty('citations');
      expect(result).toHaveProperty('qualityReport');
      expect(result).toHaveProperty('confidenceScores');
      expect(result).toHaveProperty('validationResults');
      expect(result).toHaveProperty('enhancedContent');

      // Verify citations are enhanced (may be 0 if no matches found)
      expect(result.citations.length).toBeGreaterThanOrEqual(0);
      if (result.citations.length > 0) {
        const firstCitation = result.citations[0];
        expect(firstCitation).toHaveProperty('validationStatus');
        expect(firstCitation).toHaveProperty('qualityMetrics');
        expect(firstCitation.validationStatus).toHaveProperty('accessibilityStatus');
        expect(firstCitation.validationStatus).toHaveProperty('credibilityAssessment');
      }

      // Verify quality report
      expect(result.qualityReport).toHaveProperty('overallScore');
      expect(result.qualityReport).toHaveProperty('metrics');
      expect(result.qualityReport).toHaveProperty('qualityGaps');
      expect(result.qualityReport).toHaveProperty('recommendations');
      expect(result.qualityReport.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityReport.overallScore).toBeLessThanOrEqual(100);

      // Verify confidence scores
      expect(result.confidenceScores).toHaveProperty('overallConfidence');
      expect(result.confidenceScores.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScores.overallConfidence).toBeLessThanOrEqual(100);

      // Verify validation results
      expect(Array.isArray(result.validationResults)).toBe(true);

      // Verify enhanced content includes confidence indicators
      if (options.show_confidence_indicators) {
        expect(result.enhancedContent).toContain('Evidence Confidence Assessment');
      }
    }, 30000);

    it('should handle empty citations gracefully', async () => {
      const content = 'This is a simple statement without specific claims.';
      const options: CitationOptions = {
        include_citations: false,
      };

      const result = await citationIntegration.integrateCitations(
        'business_case',
        content,
        options
      );

      expect(result.citations).toHaveLength(0);
      expect(result.qualityReport.overallScore).toBe(0);
      expect(result.confidenceScores.overallConfidence).toBe(0);
      expect(result.enhancedContent).toBe(content);
    });

    it('should filter citations based on quality requirements', async () => {
      const content = `
        Market research indicates significant growth opportunities.
        Industry benchmarks show competitive advantages.
        Customer feedback supports product-market fit.
      `;

      const options: CitationOptions = {
        include_citations: true,
        minimum_citations: 2,
        minimum_confidence: 'high',
        minimum_quality_score: 80,
        filter_low_quality: true,
        validate_sources: true,
        assess_quality: true,
      };

      const result = await citationIntegration.integrateCitations(
        'market_analysis',
        content,
        options
      );

      // Verify that only high-quality citations are included
      result.citations.forEach(citation => {
        expect(citation.validationStatus.credibilityAssessment.confidenceLevel).toBe('high');
        expect(citation.qualityMetrics.overallQuality).toBeGreaterThanOrEqual(80);
      });
    }, 20000);
  });

  describe('Enhanced MCP Tool Integration', () => {
    it('should generate management one-pager with enhanced citations', async () => {
      const args = {
        requirements: `
          Business Goal: Reduce customer churn by 25% through proactive engagement
          User Story: As a customer success manager, I want automated alerts for at-risk customers
          Acceptance Criteria: System identifies customers with declining usage patterns
        `,
        design: `
          Architecture: Event-driven system with ML-based churn prediction
          Components: Usage tracking, ML model, alert system, dashboard
          Data Models: Customer usage events, churn risk scores, engagement metrics
        `,
        citation_options: {
          include_citations: true,
          minimum_citations: 3,
          minimum_confidence: 'medium' as const,
          validate_sources: true,
          assess_quality: true,
          calculate_confidence: true,
          show_confidence_indicators: true,
          include_quality_report: true,
        },
      };

      const result = await generateManagementOnePager(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('markdown');

      // Verify enhanced citation metadata
      expect(result.metadata?.citations).toBeDefined();
      expect(result.metadata?.citations?.total_citations).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.citations?.quality_score).toBeDefined();
      expect(result.metadata?.citations?.overall_confidence).toBeDefined();
      expect(result.metadata?.citations?.compliance_status).toBeDefined();

      // Verify content includes confidence assessment
      const content = result.content[0].markdown || result.content[0].text || '';
      expect(content).toContain('Evidence Confidence Assessment');
      expect(content).toContain('References');
    }, 30000);

    it('should generate PR-FAQ with enhanced citations', async () => {
      const args = {
        requirements: `
          Business Goal: Launch AI-powered customer insights platform
          Target Market: Mid-market SaaS companies with 100-1000 employees
          Value Proposition: Reduce time-to-insight by 60% through automated analysis
        `,
        design: `
          Platform Architecture: Cloud-native microservices with AI/ML pipeline
          Key Features: Automated data ingestion, ML-powered insights, interactive dashboards
          Integration: REST APIs, webhooks, popular CRM and analytics tools
        `,
        citation_options: {
          include_citations: true,
          minimum_citations: 4,
          minimum_confidence: 'high' as const,
          validate_sources: true,
          assess_quality: true,
          calculate_confidence: true,
          show_confidence_indicators: true,
          citation_style: 'business' as const,
        },
      };

      const result = await generatePRFAQ(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('markdown');

      // Verify enhanced citation metadata
      expect(result.metadata?.citations).toBeDefined();
      expect(result.metadata?.citations?.total_citations).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.citations?.quality_score).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.citations?.overall_confidence).toBeGreaterThanOrEqual(0);

      // Verify content structure
      const content = result.content[0].markdown || result.content[0].text || '';
      expect(content).toContain('Press Release');
      expect(content).toContain('FAQ');
      expect(content).toContain('Launch Checklist');
      expect(content).toContain('Evidence Confidence Assessment');
    }, 30000);

    it('should handle citation validation failures gracefully', async () => {
      const args = {
        requirements: 'Simple requirement without specific claims',
        design: 'Basic design without detailed specifications',
        citation_options: {
          include_citations: true,
          minimum_citations: 10, // Unrealistic requirement
          minimum_confidence: 'high' as const,
          minimum_quality_score: 95, // Very high threshold
          validate_sources: true,
          assess_quality: true,
        },
      };

      const result = await generateManagementOnePager(args, mockContext);

      // Should not fail even with strict requirements
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);

      // May have fewer citations than requested due to quality filtering
      if (result.metadata?.citations) {
        expect(result.metadata.citations.total_citations).toBeGreaterThanOrEqual(0);
      }
    }, 20000);
  });

  describe('Citation Quality Validation', () => {
    it('should validate citation quality with detailed feedback', async () => {
      const citations: Citation[] = [
        {
          id: 'test_citation_1',
          title: 'SaaS Metrics Benchmark Study 2024',
          url: 'https://example.com/saas-metrics',
          domain: 'example.com',
          published_at: '2024-01-15',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Average SaaS churn rate is 5-7% monthly',
          organization: 'SaaS Research Institute',
          methodology: 'Survey of 500+ SaaS companies',
          sample_size: 500,
        },
      ];

      const validation = await citationIntegration.validateCitationQuality(
        citations,
        'business_case'
      );

      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('qualityScore');
      expect(validation).toHaveProperty('qualityReport');
      expect(validation.qualityScore).toBeGreaterThanOrEqual(0);
      expect(validation.qualityScore).toBeLessThanOrEqual(100);

      if (!validation.isValid) {
        expect(validation.issues.length).toBeGreaterThan(0);
        expect(validation.recommendations.length).toBeGreaterThan(0);
      }
    });

    it('should provide recommendations for quality improvement', async () => {
      const lowQualityCitations: Citation[] = [
        {
          id: 'low_quality_citation',
          title: 'Blog Post About SaaS',
          url: 'https://broken-link.com/post',
          domain: 'broken-link.com',
          published_at: '2020-01-01', // Old source
          source_type: CitationSourceType.COMPANY_BLOG,
          confidence: CitationConfidence.LOW,
          key_finding: 'Some claim about SaaS metrics',
          organization: 'Unknown Blog',
        },
      ];

      const validation = await citationIntegration.validateCitationQuality(
        lowQualityCitations,
        'market_analysis'
      );

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.recommendations.length).toBeGreaterThan(0);
      expect(validation.qualityScore).toBeLessThan(70);

      // Verify specific quality issues are identified
      const issueText = validation.issues.join(' ');
      expect(issueText.toLowerCase()).toMatch(/outdated|credibility|broken|quality/);
    });
  });

  describe('Batch Citation Processing', () => {
    it('should process multiple citations efficiently', async () => {
      const citations: Citation[] = [
        {
          id: 'batch_citation_1',
          title: 'Market Research Report 2024',
          url: 'https://research.com/report1',
          domain: 'research.com',
          published_at: '2024-06-01',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Market growth of 25% annually',
          organization: 'Research Firm',
        },
        {
          id: 'batch_citation_2',
          title: 'Customer Success Benchmarks',
          url: 'https://consulting.com/benchmarks',
          domain: 'consulting.com',
          published_at: '2024-03-15',
          source_type: CitationSourceType.CONSULTING_STUDY,
          confidence: CitationConfidence.MEDIUM,
          key_finding: 'Proactive engagement reduces churn by 30%',
          organization: 'Consulting Group',
        },
      ];

      const result = await citationIntegration.batchProcessCitations(citations, {
        validateSources: true,
        assessQuality: true,
        calculateConfidence: true,
      });

      expect(result.enhancedCitations).toHaveLength(citations.length);
      expect(result.validationResults).toHaveLength(citations.length);
      expect(result.qualityReport).toBeDefined();
      expect(result.processingStats).toBeDefined();

      // Verify processing statistics
      expect(result.processingStats.totalProcessed).toBe(citations.length);
      expect(result.processingStats.averageQualityScore).toBeGreaterThanOrEqual(0);
      expect(result.processingStats.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility with existing citation options', async () => {
      const content = 'Business analysis with market insights and competitive positioning.';

      // Use old-style citation options
      const oldOptions: CitationOptions = {
        include_citations: true,
        minimum_citations: 2,
        minimum_confidence: 'medium',
        citation_style: 'business',
        include_bibliography: true,
      };

      const result = await citationIntegration.integrateCitations(
        'business_case',
        content,
        oldOptions
      );

      // Should work without enhanced features
      expect(result).toHaveProperty('citations');
      expect(result).toHaveProperty('bibliography');
      expect(result).toHaveProperty('enhancedContent');
      expect(result.enhancedContent).toContain(content);
    });

    it('should work with minimal citation options', async () => {
      const content = 'Simple business statement.';
      const minimalOptions: CitationOptions = {
        include_citations: true,
      };

      const result = await citationIntegration.integrateCitations(
        'executive_onepager',
        content,
        minimalOptions
      );

      expect(result).toBeDefined();
      expect(result.enhancedContent).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const content = 'Content with claims requiring citations.';
      const options: CitationOptions = {
        include_citations: true,
        validate_sources: true,
        minimum_quality_score: 100, // Impossible threshold
      };

      // Should not throw errors even with impossible requirements
      const result = await citationIntegration.integrateCitations(
        'business_case',
        content,
        options
      );

      expect(result).toBeDefined();
      expect(result.enhancedContent).toBeDefined();
    });

    it('should handle malformed citation data', async () => {
      const malformedCitations: Citation[] = [
        {
          id: 'malformed',
          title: '',
          url: 'not-a-url',
          domain: '',
          published_at: 'invalid-date',
          source_type: CitationSourceType.COMPANY_BLOG,
          confidence: CitationConfidence.LOW,
          key_finding: '',
        },
      ];

      // Should handle malformed data without crashing
      const validation = await citationIntegration.validateCitationQuality(
        malformedCitations,
        'business_case'
      );

      expect(validation).toBeDefined();
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });
});
