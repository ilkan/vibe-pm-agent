/**
 * Enhanced Citation System End-to-End Tests
 *
 * Real-world testing with actual business documents and MCP tool integration
 */

import { EnhancedCitationSystem } from '../../components/enhanced-citation-system';
import { enhanceCitations } from '../../mcp/tools/enhance_citations';
import { validateAndAuditCitations } from '../../mcp/tools/validate_and_audit_citations';
import { Citation } from '../../models/citations';

describe('Enhanced Citation System E2E Tests', () => {
  let citationSystem: EnhancedCitationSystem;

  beforeAll(() => {
    citationSystem = new EnhancedCitationSystem({
      enableRealTimeValidation: true,
      enableQualityMonitoring: true,
      enableAuditTrail: true,
      qualityThresholds: {
        minimum: 60,
        target: 80,
        excellent: 90,
      },
    });
  });

  afterAll(async () => {
    await citationSystem.cleanup();
  });

  describe('Real Business Document Processing', () => {
    it('should process a complete business case document', async () => {
      const businessCaseDocument = `
        # Business Case: AI-Powered Customer Service Platform
        
        ## Executive Summary
        
        This business case proposes the development of an AI-powered customer service platform
        to improve response times and customer satisfaction while reducing operational costs.
        
        ## Market Opportunity
        
        The global customer service software market is valued at $8.2 billion and is expected
        to grow at 15.2% CAGR through 2028. Key drivers include:
        
        - Increasing customer expectations for 24/7 support
        - Rising labor costs in traditional call centers
        - Advances in natural language processing technology
        - Growing adoption of omnichannel customer experiences
        
        ## Competitive Analysis
        
        Current market leaders include Zendesk, Salesforce Service Cloud, and Freshworks.
        However, there is a gap in the market for AI-first solutions that can handle complex
        customer inquiries without human intervention.
        
        ## Financial Projections
        
        - Development cost: $2.5M over 18 months
        - Expected revenue: $5M in Year 1, $15M in Year 2, $35M in Year 3
        - Customer acquisition cost: $1,200 per enterprise customer
        - Average customer lifetime value: $45,000
        - Break-even point: Month 14
        
        ## Risk Assessment
        
        Key risks include competitive response, technology adoption challenges,
        and regulatory compliance requirements in different markets.
        
        ## Recommendation
        
        We recommend proceeding with development based on strong market demand,
        competitive positioning, and favorable financial projections.
      `;

      const result = await citationSystem.enhanceDocumentCitations(
        businessCaseDocument,
        'business_case',
        {
          userId: 'business-analyst',
          minimumConfidence: 75,
          requireSourceDiversity: true,
        }
      );

      expect(result.success).toBe(true);
      expect(result.enhancedCitations.length).toBeGreaterThan(0);

      // Should identify multiple citation needs
      const marketDataClaims = result.enhancedCitations.filter(
        c => c.title.toLowerCase().includes('market') || c.summary?.toLowerCase().includes('market')
      );
      expect(marketDataClaims.length).toBeGreaterThan(0);

      // Should have high-quality citations for financial claims
      const financialCitations = result.enhancedCitations.filter(
        c =>
          c.title.toLowerCase().includes('financial') ||
          c.title.toLowerCase().includes('revenue') ||
          c.summary?.toLowerCase().includes('cost')
      );

      if (financialCitations.length > 0) {
        const avgQuality =
          financialCitations.reduce((sum, c) => sum + (c.qualityMetrics?.overallQuality || 0), 0) /
          financialCitations.length;
        expect(avgQuality).toBeGreaterThan(60);
      }

      // Should provide actionable recommendations
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(
        result.recommendations.some(
          r => r.includes('market') || r.includes('financial') || r.includes('competitive')
        )
      ).toBe(true);

      // Should have reasonable processing time
      expect(result.processingTime).toBeLessThan(30000); // 30 seconds max
    }, 45000);

    it('should process a market analysis report', async () => {
      const marketAnalysisDocument = `
        # SaaS Market Analysis Q4 2024
        
        ## Market Size and Growth
        
        The global Software-as-a-Service (SaaS) market reached $195 billion in 2023
        and is projected to grow at a compound annual growth rate (CAGR) of 18.7%
        from 2024 to 2030.
        
        ## Key Market Segments
        
        ### Customer Relationship Management (CRM)
        - Market share: 23% of total SaaS market
        - Leading vendors: Salesforce (19.8%), Microsoft (4.2%), Oracle (2.1%)
        - Growth rate: 12.5% annually
        
        ### Enterprise Resource Planning (ERP)
        - Market share: 18% of total SaaS market
        - Leading vendors: SAP (7.1%), Oracle (4.8%), Microsoft (3.2%)
        - Growth rate: 8.9% annually
        
        ### Human Capital Management (HCM)
        - Market share: 15% of total SaaS market
        - Leading vendors: Workday (12.3%), ADP (8.7%), SAP (6.1%)
        - Growth rate: 15.2% annually
        
        ## Regional Analysis
        
        North America continues to dominate the SaaS market with 60% market share,
        followed by Europe (25%) and Asia-Pacific (12%). However, Asia-Pacific
        shows the highest growth rate at 25.3% CAGR.
        
        ## Technology Trends
        
        Key trends driving SaaS adoption include:
        - AI and machine learning integration (78% of vendors)
        - Mobile-first design (85% of new applications)
        - API-first architecture (92% of enterprise solutions)
        - Industry-specific solutions (67% growth in vertical SaaS)
        
        ## Challenges and Opportunities
        
        Main challenges include data security concerns (cited by 73% of enterprises),
        integration complexity (68%), and vendor lock-in fears (54%).
        
        Opportunities include expansion into emerging markets, AI-powered features,
        and industry-specific solutions.
      `;

      const analysis = await citationSystem.analyzeDocumentCitations(
        marketAnalysisDocument,
        'saas-market-analysis-q4-2024'
      );

      expect(analysis.documentId).toBe('saas-market-analysis-q4-2024');
      expect(analysis.citationRequirements.length).toBeGreaterThan(5);

      // Should identify quantitative claims requiring citations
      const quantitativeClaims = analysis.citationRequirements.filter(
        req => req.claimType === 'quantitative'
      );
      expect(quantitativeClaims.length).toBeGreaterThan(0);

      // Should recommend sources for market data
      expect(analysis.recommendedSources.length).toBeGreaterThan(0);
      const marketDataSources = analysis.recommendedSources.filter(
        source =>
          source.source.toLowerCase().includes('gartner') ||
          source.source.toLowerCase().includes('forrester') ||
          source.source.toLowerCase().includes('idc') ||
          source.title.toLowerCase().includes('market')
      );
      expect(marketDataSources.length).toBeGreaterThan(0);

      // Should identify compliance status
      expect(['compliant', 'warning', 'non-compliant']).toContain(analysis.complianceStatus);

      // Should have quality gaps for unsupported claims
      expect(analysis.qualityGaps.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('MCP Tool Integration', () => {
    it('should work with enhance_citations MCP tool', async () => {
      const mcpRequest = {
        document_content: `
          # Product Roadmap Analysis
          
          Our product roadmap shows 40% feature completion rate compared to industry average.
          Customer satisfaction scores indicate 15% improvement needed in user experience.
          Market research suggests 60% of users want mobile-first features.
          
          Competitive analysis shows we're behind in AI integration capabilities.
        `,
        document_type: 'competitive_analysis',
        enhancement_options: {
          minimum_confidence: 70,
          source_diversity_requirement: 80,
          recency_requirement_months: 12,
          industry_focus: 'software',
          geographic_scope: 'global',
        },
      };

      const mcpResult = await enhanceCitations(mcpRequest);

      expect(mcpResult).toBeDefined();
      expect(mcpResult.enhanced_document).toBeDefined();
      expect(mcpResult.citation_analysis).toBeDefined();
      expect(mcpResult.quality_report).toBeDefined();

      // Should include enhanced citations in the document
      expect(mcpResult.enhanced_document.length).toBeGreaterThan(
        mcpRequest.document_content.length
      );

      // Should provide quality metrics
      expect(mcpResult.quality_report.overall_score).toBeGreaterThanOrEqual(0);
      expect(mcpResult.quality_report.overall_score).toBeLessThanOrEqual(100);

      // Should include confidence scores
      expect(mcpResult.citation_analysis.confidence_scores).toBeDefined();

      // Should provide recommendations
      expect(mcpResult.citation_analysis.recommendations).toBeDefined();
      expect(mcpResult.citation_analysis.recommendations.length).toBeGreaterThan(0);
    }, 35000);

    it('should work with validate_and_audit_citations MCP tool', async () => {
      const testCitations: Citation[] = [
        {
          id: 'test-cite-1',
          title: 'Global SaaS Market Report 2024',
          authors: ['Research Team'],
          source: 'Gartner Inc.',
          url: 'https://www.gartner.com/en/newsroom/press-releases/2024-saas-market',
          publishedDate: new Date('2024-01-15'),
          type: 'report',
          summary: 'Comprehensive analysis of SaaS market trends and projections',
        },
        {
          id: 'test-cite-2',
          title: 'Customer Experience Trends',
          authors: ['Jane Smith', 'John Doe'],
          source: 'Forrester Research',
          url: 'https://www.forrester.com/report/customer-experience-trends-2024',
          publishedDate: new Date('2024-03-10'),
          type: 'report',
          summary: 'Analysis of customer experience trends and best practices',
        },
      ];

      const mcpRequest = {
        sources: testCitations,
        validation_criteria: {
          check_accessibility: true,
          assess_credibility: true,
          verify_compliance: true,
          find_alternatives: true,
        },
        audit_options: {
          compliance_standards: ['business', 'academic'],
          quality_thresholds: { minimum: 70, target: 85 },
          generate_report: true,
        },
      };

      const mcpResult = await validateAndAuditCitations(mcpRequest);

      expect(mcpResult).toBeDefined();
      expect(mcpResult.validation_results).toBeDefined();
      expect(mcpResult.validation_results.length).toBe(2);

      // Should validate each citation
      mcpResult.validation_results.forEach(result => {
        expect(result.citation_id).toBeDefined();
        expect(typeof result.is_accessible).toBe('boolean');
        expect(result.credibility_score).toBeGreaterThanOrEqual(0);
        expect(result.credibility_score).toBeLessThanOrEqual(100);
        expect(result.validation_timestamp).toBeDefined();
      });

      // Should provide audit report
      expect(mcpResult.audit_report).toBeDefined();
      expect(mcpResult.audit_report.total_citations).toBe(2);
      expect(mcpResult.audit_report.overall_quality_score).toBeGreaterThanOrEqual(0);
      expect(mcpResult.audit_report.overall_quality_score).toBeLessThanOrEqual(100);

      // Should include recommendations
      expect(mcpResult.audit_report.recommendations).toBeDefined();
      expect(Array.isArray(mcpResult.audit_report.recommendations)).toBe(true);
    }, 30000);
  });

  describe('Performance Validation', () => {
    it('should meet performance requirements for large documents', async () => {
      // Create a large business document
      const largeDocument = `
        # Comprehensive Market Analysis Report
        
        ${Array(50)
          .fill(0)
          .map(
            (_, i) => `
        ## Section ${i + 1}: Market Segment Analysis
        
        Market segment ${i + 1} shows ${Math.floor(Math.random() * 50) + 10}% growth rate.
        Customer acquisition costs are $${Math.floor(Math.random() * 1000) + 500} per customer.
        Revenue projections indicate $${Math.floor(Math.random() * 10) + 1}M potential.
        Competitive landscape includes ${Math.floor(Math.random() * 5) + 2} major players.
        
        Key findings:
        - Market size: $${Math.floor(Math.random() * 100) + 50}M
        - Growth rate: ${Math.floor(Math.random() * 20) + 5}% CAGR
        - Customer satisfaction: ${Math.floor(Math.random() * 30) + 70}%
        - Market penetration: ${Math.floor(Math.random() * 40) + 10}%
        `
          )
          .join('\n')}
      `;

      const startTime = Date.now();
      const result = await citationSystem.enhanceDocumentCitations(
        largeDocument,
        'large_market_analysis'
      );
      const processingTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(60000); // Should complete within 60 seconds
      expect(result.processingTime).toBeLessThan(60000);

      // Should handle large documents without memory issues
      expect(result.enhancedCitations).toBeDefined();
      expect(result.qualityReport).toBeDefined();
      expect(result.recommendations).toBeDefined();

      // Should provide reasonable number of citations (not excessive)
      expect(result.enhancedCitations.length).toBeLessThan(200);
      expect(result.enhancedCitations.length).toBeGreaterThan(0);
    }, 90000);

    it('should handle concurrent processing efficiently', async () => {
      const documents = Array(5)
        .fill(0)
        .map((_, i) => ({
          content: `
          # Business Analysis ${i + 1}
          
          Market analysis shows ${Math.floor(Math.random() * 50) + 10}% growth opportunity.
          Customer research indicates ${Math.floor(Math.random() * 30) + 70}% satisfaction rate.
          Competitive analysis reveals ${Math.floor(Math.random() * 5) + 2} major competitors.
          Financial projections suggest $${Math.floor(Math.random() * 10) + 1}M revenue potential.
        `,
          type: 'business_analysis',
          id: `concurrent-test-${i + 1}`,
        }));

      const startTime = Date.now();
      const promises = documents.map(doc =>
        citationSystem.enhanceDocumentCitations(doc.content, doc.type, { userId: doc.id })
      );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(5);
      expect(totalTime).toBeLessThan(45000); // Should complete all within 45 seconds

      // All requests should complete successfully or with graceful errors
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
        expect(result.processingTime).toBeGreaterThan(0);

        if (result.success) {
          expect(result.enhancedCitations).toBeDefined();
          expect(result.qualityReport).toBeDefined();
          expect(result.recommendations).toBeDefined();
        } else {
          expect(result.error).toBeDefined();
        }
      });
    }, 60000);
  });

  describe('Quality Validation', () => {
    it('should maintain citation quality standards', async () => {
      const qualityTestDocument = `
        # Strategic Business Plan
        
        Market research from leading consulting firms indicates significant growth opportunities.
        Financial analysis based on industry benchmarks shows favorable ROI projections.
        Customer surveys conducted by reputable research organizations reveal high demand.
        Competitive intelligence from authoritative sources suggests market gaps.
        
        Key metrics:
        - Market size: Based on Gartner research
        - Growth rate: According to McKinsey analysis
        - Customer satisfaction: Per Forrester studies
        - Competitive positioning: From BCG reports
      `;

      const result = await citationSystem.enhanceDocumentCitations(
        qualityTestDocument,
        'business_plan',
        {
          minimumConfidence: 80,
          requireSourceDiversity: true,
        }
      );

      expect(result.success).toBe(true);

      // Should meet quality thresholds
      expect(result.qualityReport.overallScore).toBeGreaterThanOrEqual(60);

      // Should have diverse source types
      const sourceTypes = new Set(result.enhancedCitations.map(c => c.type));
      expect(sourceTypes.size).toBeGreaterThan(1);

      // Should include authoritative sources
      const authoritativeSources = result.enhancedCitations.filter(
        c =>
          c.source.toLowerCase().includes('mckinsey') ||
          c.source.toLowerCase().includes('gartner') ||
          c.source.toLowerCase().includes('forrester') ||
          c.source.toLowerCase().includes('bcg') ||
          c.source.toLowerCase().includes('harvard')
      );
      expect(authoritativeSources.length).toBeGreaterThan(0);

      // Should have high confidence scores for authoritative sources
      authoritativeSources.forEach(source => {
        const confidence = result.confidenceScores.get(source.id);
        if (confidence) {
          expect(confidence.overall).toBeGreaterThan(70);
        }
      });
    }, 40000);

    it('should identify and flag low-quality citations', async () => {
      const lowQualityDocument = `
        # Market Analysis with Poor Sources
        
        According to a blog post I found online, the market is growing rapidly.
        Some random website claims that customers are very satisfied.
        An outdated report from 2015 suggests competitive advantages exist.
        Unverified social media posts indicate strong demand.
      `;

      const result = await citationSystem.enhanceDocumentCitations(
        lowQualityDocument,
        'market_analysis'
      );

      expect(result.success).toBe(true);

      // Should identify quality issues
      expect(result.qualityReport.qualityGaps.length).toBeGreaterThan(0);

      // Should provide improvement recommendations
      expect(
        result.recommendations.some(
          r =>
            r.toLowerCase().includes('quality') ||
            r.toLowerCase().includes('credible') ||
            r.toLowerCase().includes('authoritative')
        )
      ).toBe(true);

      // Should suggest better sources
      const betterSources = result.enhancedCitations.filter(
        c => c.qualityMetrics && c.qualityMetrics.overallQuality > 70
      );
      expect(betterSources.length).toBeGreaterThan(0);
    }, 25000);
  });

  describe('System Reliability', () => {
    it('should maintain system stability under stress', async () => {
      // Simulate high load with multiple document types
      const stressTestDocuments = [
        {
          content: 'Business case with financial projections and market analysis',
          type: 'business_case',
        },
        {
          content: 'Competitive analysis with SWOT and market positioning',
          type: 'competitive_analysis',
        },
        {
          content: 'Market research with customer surveys and trend analysis',
          type: 'market_analysis',
        },
        { content: 'Executive summary with strategic recommendations', type: 'executive_onepager' },
        { content: 'Product roadmap with feature prioritization', type: 'pr_faq' },
      ];

      const iterations = 3; // Run multiple iterations
      const allPromises: Promise<any>[] = [];

      for (let i = 0; i < iterations; i++) {
        const iterationPromises = stressTestDocuments.map((doc, index) =>
          citationSystem.enhanceDocumentCitations(`${doc.content} - Iteration ${i + 1}`, doc.type, {
            userId: `stress-test-${i}-${index}`,
          })
        );
        allPromises.push(...iterationPromises);
      }

      const results = await Promise.all(allPromises);

      expect(results).toHaveLength(stressTestDocuments.length * iterations);

      // System should remain stable
      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);

      // At least 80% should succeed under stress
      expect(successfulResults.length / results.length).toBeGreaterThan(0.8);

      // Failed results should have proper error handling
      failedResults.forEach(result => {
        expect(result.error).toBeDefined();
        expect(result.recommendations).toBeDefined();
        expect(result.processingTime).toBeGreaterThan(0);
      });

      // System should still be responsive
      const metrics = citationSystem.getPerformanceMetrics();
      expect(metrics).toBeDefined();
    }, 120000);
  });
});
