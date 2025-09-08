/**
 * Integration tests for enhance_citations MCP tool
 */

import { enhanceCitations } from '../../mcp/tools/enhance_citations';
import { MCPToolContext } from '../../models/mcp';
import { CitationService } from '../../components/citation-service';

describe('enhance_citations Integration Tests', () => {
  let mockContext: MCPToolContext;

  beforeEach(() => {
    mockContext = {
      toolName: 'enhance_citations',
      sessionId: 'integration-test-session',
      timestamp: Date.now(),
      requestId: 'integration-test-request',
      traceId: 'integration-test-trace',
    };
  });

  describe('End-to-End Citation Enhancement', () => {
    it('should enhance a business case document with real citation components', async () => {
      const args = {
        document_content: `
# Business Case: AI-Powered Customer Service Platform

## Executive Summary
Our company should invest in an AI-powered customer service platform to improve response times and reduce operational costs. Industry data shows that companies implementing AI customer service see significant improvements in efficiency.

## Problem Statement
Current customer service response times average 24 hours, which is above industry standards. Manual ticket processing requires substantial human resources and leads to inconsistent service quality.

## Proposed Solution
Implement an AI-powered customer service platform that can:
- Automatically categorize and route customer inquiries
- Provide instant responses to common questions
- Escalate complex issues to human agents
- Generate performance analytics and insights

## Expected Benefits
- Reduce response times by 75%
- Decrease operational costs by 40%
- Improve customer satisfaction scores
- Enable 24/7 customer support coverage

## Investment Requirements
The platform requires an initial investment of $500,000 with ongoing operational costs of $50,000 annually.

## Risk Assessment
Primary risks include integration challenges and potential customer resistance to automated responses.
        `.trim(),
        document_type: 'business_case' as const,
        enhancement_options: {
          minimum_confidence: 70,
          industry_focus: 'technology',
          identify_unsupported_claims: true,
          suggest_additional_sources: true,
          perform_quality_assessment: true,
        },
        citation_options: {
          include_citations: true,
          minimum_citations: 3,
          citation_style: 'business' as const,
          include_bibliography: true,
          validate_sources: true,
          assess_quality: true,
          calculate_confidence: true,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      // Verify successful execution
      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('markdown');

      // Verify enhanced content structure
      const enhancedContent = result.content[0].markdown!;
      expect(enhancedContent).toContain('# Business Case');
      expect(enhancedContent).toContain('## References');
      expect(enhancedContent).toContain('Citation Enhancement Summary');

      // Verify metadata
      expect(result.metadata?.citations).toBeDefined();
      expect(result.metadata?.citations?.total_citations).toBeGreaterThan(0);
      expect(result.metadata?.citations?.quality_score).toBeGreaterThan(0);
      expect(result.metadata?.citations?.overall_confidence).toBeGreaterThan(0);

      // Verify enhancement metadata
      expect(result.metadata?.enhancement).toBeDefined();
      expect(result.metadata?.enhancement?.content_length_increase).toMatch(/\d+\.\d+%/);
    }, 30000); // Increased timeout for integration test

    it('should handle market analysis document with industry-specific citations', async () => {
      const args = {
        document_content: `
# SaaS Market Analysis: Customer Success Platform Opportunity

## Market Overview
The customer success software market is experiencing rapid growth, driven by increasing focus on customer retention and expansion revenue. SaaS companies are investing heavily in customer success tools to reduce churn and maximize customer lifetime value.

## Market Size and Growth
The global customer success software market is projected to grow significantly over the next five years. Key drivers include the shift to subscription business models and increased competition for customer retention.

## Competitive Landscape
Major players in the customer success space include established vendors and emerging startups. The market shows strong demand for integrated platforms that combine customer health scoring, automated workflows, and predictive analytics.

## Key Trends
- Integration with CRM and support systems
- AI-powered customer health scoring
- Automated customer journey orchestration
- Real-time customer sentiment analysis

## Market Opportunity
There is significant opportunity for new entrants that can provide better integration capabilities and more intuitive user experiences.
        `.trim(),
        document_type: 'market_analysis' as const,
        enhancement_options: {
          minimum_confidence: 75,
          industry_focus: 'saas',
          recency_requirement_months: 18,
          identify_unsupported_claims: true,
          suggest_additional_sources: true,
        },
        citation_options: {
          minimum_citations: 5,
          minimum_confidence: 'medium' as const,
          citation_style: 'business' as const,
          validate_sources: true,
          assess_quality: true,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.metadata?.citations?.total_citations).toBeGreaterThanOrEqual(3);
      expect(result.metadata?.enhancement?.citation_requirements_identified).toBeGreaterThan(0);
    }, 30000);

    it('should enhance executive one-pager with high-quality sources', async () => {
      const args = {
        document_content: `
# Executive One-Pager: Digital Transformation Initiative

## Opportunity
Accelerate digital transformation to improve operational efficiency and customer experience. Companies that successfully implement digital transformation initiatives see substantial ROI improvements.

## Solution
Implement cloud-first architecture, automate key business processes, and deploy AI-powered analytics across the organization.

## Investment
$2M initial investment with 18-month implementation timeline.

## Expected Returns
- 30% reduction in operational costs
- 50% improvement in process efficiency  
- 25% increase in customer satisfaction

## Next Steps
Secure executive approval and begin vendor selection process.
        `.trim(),
        document_type: 'executive_onepager' as const,
        enhancement_options: {
          minimum_confidence: 80,
          industry_focus: 'technology',
          perform_quality_assessment: true,
        },
        citation_options: {
          minimum_citations: 3,
          minimum_confidence: 'high' as const,
          citation_style: 'business' as const,
          show_confidence_indicators: true,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.metadata?.citations?.compliance_status).toBeDefined();
      expect(result.metadata?.citations?.credibility_score).toBeGreaterThan(70);
    }, 30000);
  });

  describe('Citation Format Support', () => {
    const testContent = `
# Test Document

This document contains claims about productivity improvements. Studies show that automation can increase productivity by 40%. Companies implementing AI solutions report significant cost savings.
    `.trim();

    it('should support business citation format', async () => {
      const args = {
        document_content: testContent,
        document_type: 'business_case' as const,
        citation_options: {
          citation_style: 'business' as const,
          include_bibliography: true,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      const content = result.content[0].markdown!;
      expect(content).toContain('## References');
      // Business format typically uses numbered references
      expect(content).toMatch(/\[\d+\]/);
    });

    it('should support APA citation format', async () => {
      const args = {
        document_content: testContent,
        document_type: 'market_analysis' as const,
        citation_options: {
          citation_style: 'apa' as const,
          include_bibliography: true,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      const content = result.content[0].markdown!;
      expect(content).toContain('## References');
    });

    it('should support inline citation format', async () => {
      const args = {
        document_content: testContent,
        document_type: 'competitive_analysis' as const,
        citation_options: {
          citation_style: 'inline' as const,
          include_bibliography: true,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      const content = result.content[0].markdown!;
      expect(content).toContain('## References');
    });
  });

  describe('Quality Assessment Integration', () => {
    it('should provide comprehensive quality assessment', async () => {
      const args = {
        document_content: `
# Quality Assessment Test Document

This document makes several claims that require validation:
- Market growth rates exceed 25% annually
- Customer satisfaction improves by 40% with new technology
- Implementation costs are typically under $100,000
- ROI is achieved within 12 months

These claims need proper citation support for credibility.
        `.trim(),
        document_type: 'business_case' as const,
        enhancement_options: {
          perform_quality_assessment: true,
          identify_unsupported_claims: true,
        },
        citation_options: {
          assess_quality: true,
          validate_sources: true,
          include_quality_report: true,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      
      // Verify quality assessment in content
      const content = result.content[0].markdown!;
      expect(content).toContain('Citation Enhancement Summary');
      expect(content).toContain('Enhancement Metrics');
      expect(content).toContain('Citation Quality Breakdown');

      // Verify quality metadata
      expect(result.metadata?.citations?.quality_score).toBeDefined();
      expect(result.metadata?.citations?.compliance_status).toBeDefined();
      expect(result.metadata?.enhancement?.quality_gaps_identified).toBeDefined();
    });

    it('should identify and report unsupported claims', async () => {
      const args = {
        document_content: `
# Document with Unsupported Claims

This analysis makes several bold claims without evidence:
- Our solution is 10x better than competitors
- Market size will triple in the next year  
- All customers will see immediate ROI
- Implementation is guaranteed to succeed

These statements require proper citation support.
        `.trim(),
        document_type: 'competitive_analysis' as const,
        enhancement_options: {
          identify_unsupported_claims: true,
          suggest_additional_sources: true,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.metadata?.enhancement?.unsupported_claims_found).toBeGreaterThan(0);
      
      const content = result.content[0].markdown!;
      expect(content).toContain('Unsupported Claims Analysis');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle very short documents', async () => {
      const args = {
        document_content: 'This is a very short document with minimal content.',
        document_type: 'executive_onepager' as const,
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      // Should still attempt enhancement even with minimal content
      expect(result.content[0].markdown).toBeDefined();
    });

    it('should handle documents without clear claims', async () => {
      const args = {
        document_content: `
# Simple Document

This document contains general information about business processes. It describes standard procedures and common practices without making specific claims or assertions that require citation support.

The content is descriptive rather than analytical.
        `.trim(),
        document_type: 'business_case' as const,
        enhancement_options: {
          identify_unsupported_claims: true,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.metadata?.enhancement?.unsupported_claims_found).toBe(0);
    });

    it('should handle citation options conflicts gracefully', async () => {
      const args = {
        document_content: 'Test document with conflicting options.',
        document_type: 'market_analysis' as const,
        citation_options: {
          include_citations: false,
          minimum_citations: 10, // Conflicting with include_citations: false
          assess_quality: true,   // Conflicting with no citations
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      // Should handle conflicts by respecting include_citations: false
      expect(result.metadata?.citations?.total_citations).toBe(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large documents efficiently', async () => {
      // Create a large document with multiple sections and claims
      const largeContent = Array(20).fill(0).map((_, i) => `
## Section ${i + 1}

This section discusses important business metrics and performance indicators. Research shows that companies implementing these practices see significant improvements in operational efficiency. Market data indicates strong growth trends in this area.

Key findings include:
- Performance improvements of 25-40%
- Cost reductions averaging 15-20%  
- Customer satisfaction increases of 30%
- Implementation success rates above 85%

These metrics demonstrate the value proposition for investment in this initiative.
      `).join('\n');

      const args = {
        document_content: `# Large Document Analysis\n\n${largeContent}`,
        document_type: 'market_analysis' as const,
        enhancement_options: {
          identify_unsupported_claims: true,
          suggest_additional_sources: false, // Disable to reduce processing time
        },
        citation_options: {
          minimum_citations: 5,
          assess_quality: true,
        },
      };

      const startTime = Date.now();
      const result = await enhanceCitations(args, mockContext);
      const executionTime = Date.now() - startTime;

      expect(result.isError).toBeFalsy();
      expect(executionTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(result.metadata?.citations?.total_citations).toBeGreaterThan(0);
    }, 45000); // Extended timeout for large document test
  });

  describe('Real Citation Service Integration', () => {
    it('should work with actual CitationService instance', async () => {
      const citationService = new CitationService();
      
      // Verify citation service has loaded default citations
      const testCriteria = {
        keywords: ['productivity', 'automation'],
        industry: 'technology',
        minimum_confidence: 'medium' as any,
      };

      const citations = await citationService.findRelevantCitations(testCriteria);
      expect(citations.length).toBeGreaterThan(0);

      // Test with actual service
      const args = {
        document_content: `
# Productivity Enhancement Analysis

Automation technologies are transforming business operations. Companies implementing automation solutions report significant productivity gains and cost savings.

Key benefits include:
- Reduced manual processing time
- Improved accuracy and consistency
- Lower operational costs
- Enhanced employee satisfaction

The business case for automation is compelling across multiple industries.
        `.trim(),
        document_type: 'business_case' as const,
        citation_options: {
          minimum_citations: 2,
          industry_focus: 'technology',
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.metadata?.citations?.total_citations).toBeGreaterThan(0);
    });
  });
});