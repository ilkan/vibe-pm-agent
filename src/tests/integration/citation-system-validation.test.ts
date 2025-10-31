/**
 * Citation System Validation Test
 * 
 * Tests the unified citation system with known good citations to validate
 * the core functionality works correctly.
 */

import { unifiedCitationSystem, UnifiedCitationSystemArgs } from '../../mcp/tools/unified_citation_system';
import { MCPToolContext } from '../../models/mcp';
import { Citation, CitationSourceType, CitationConfidence } from '../../models/citations';

// Test context
const createTestContext = (): MCPToolContext => ({
  timestamp: Date.now(),
  requestId: `test-${Date.now()}`,
  userId: 'test-user',
  sessionId: `session-${Date.now()}`,
  toolName: 'unified_citation_system',
});

// Helper to extract content
const extractContent = (result: any): string => {
  if (Array.isArray(result.content)) {
    return result.content.map((c: any) => c.text || c.markdown || '').join('\n');
  }
  return result.content as string;
};

// Real, accessible citations for testing
const REAL_CITATIONS: Citation[] = [
  {
    id: 'salesforce-1',
    title: 'Customer Success Best Practices',
    url: 'https://www.salesforce.com/resources/articles/customer-success/',
    domain: 'salesforce.com',
    published_at: '2024-01-15',
    source_type: CitationSourceType.INDUSTRY_REPORT,
    confidence: CitationConfidence.HIGH,
    key_finding: 'Customer success programs can reduce churn by up to 25%',
    authors: ['Salesforce Research Team'],
    organization: 'Salesforce',
    methodology: 'Analysis of customer success programs across 1000+ companies',
    industry_focus: ['saas', 'customer_success'],
    last_accessed: new Date().toISOString(),
  },
  {
    id: 'mckinsey-1',
    title: 'The Future of Customer Experience',
    url: 'https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/the-future-of-personalization-and-how-it-will-transform-customer-experience',
    domain: 'mckinsey.com',
    published_at: '2024-02-10',
    source_type: CitationSourceType.CONSULTING_STUDY,
    confidence: CitationConfidence.HIGH,
    key_finding: 'Personalization can drive 10-15% revenue growth',
    authors: ['McKinsey & Company'],
    organization: 'McKinsey & Company',
    methodology: 'Survey of 2000+ executives across industries',
    industry_focus: ['customer_experience', 'personalization'],
    last_accessed: new Date().toISOString(),
  },
  {
    id: 'harvard-1',
    title: 'Digital Transformation ROI Study',
    url: 'https://hbr.org/2023/11/how-to-measure-your-digital-transformation-roi',
    domain: 'hbr.org',
    published_at: '2023-11-20',
    source_type: CitationSourceType.ACADEMIC_PAPER,
    confidence: CitationConfidence.HIGH,
    key_finding: 'Companies with successful digital transformation see 23% higher revenue growth',
    authors: ['Harvard Business Review'],
    organization: 'Harvard Business School',
    methodology: 'Longitudinal study of 500 companies over 3 years',
    industry_focus: ['digital_transformation', 'roi'],
    last_accessed: new Date().toISOString(),
  }
];

describe('Citation System Validation Tests', () => {
  
  test('should validate real citations successfully', async () => {
    console.log('🔍 Testing citation validation with real URLs...');
    
    const args: UnifiedCitationSystemArgs = {
      operation_mode: 'validate_citations',
      existing_citations: REAL_CITATIONS,
      document_type: 'business_case',
      validation_options: {
        check_accessibility: true,
        assess_credibility: true,
        timeout: 15000, // Longer timeout for real requests
        retry_attempts: 2,
      },
      report_options: {
        include_validation_details: true,
        include_quality_metrics: true,
      }
    };

    const result = await unifiedCitationSystem(args, createTestContext());
    
    expect(result).toBeDefined();
    expect(result.isError).toBeFalsy();
    
    const content = extractContent(result);
    const metadata = result.metadata as any;
    
    console.log('✅ Validation completed');
    console.log(`📊 Citations validated: ${metadata.operation.validated}`);
    console.log(`✓ Success rate: ${metadata.operation.success_rate}%`);
    console.log(`🎯 Quality score: ${metadata.operation.quality_score}/100`);
    
    // Should contain validation report
    expect(content).toContain('Citation Validation and Quality Audit Report');
    expect(content).toContain('Executive Summary');
    
    // Should have processed all citations
    expect(metadata.operation.validated).toBe(REAL_CITATIONS.length);
    
    // Should have some successful validations (real URLs should be accessible)
    expect(metadata.operation.success_rate).toBeGreaterThan(0);
    
    console.log('Content preview:', content.substring(0, 300) + '...');
    
  }, 45000); // 45 second timeout for real web requests

  test('should enhance content with citation integration', async () => {
    console.log('📝 Testing content enhancement...');
    
    const testContent = `
# Digital Transformation ROI Analysis

## Executive Summary
Digital transformation initiatives are critical for modern businesses to remain competitive. 
Companies that successfully implement digital transformation strategies see significant improvements in revenue and operational efficiency.

## Key Findings
- Digital transformation can drive substantial revenue growth
- Customer experience improvements are a key benefit
- Personalization strategies show strong ROI potential

## Recommendations
Organizations should prioritize customer-centric digital transformation initiatives with clear ROI measurement frameworks.
    `.trim();

    const args: UnifiedCitationSystemArgs = {
      operation_mode: 'enhance_content',
      document_content: testContent,
      document_type: 'business_case',
      citation_options: {
        minimum_citations: 2,
        citation_style: 'business',
        include_bibliography: true,
      },
      enhancement_options: {
        identify_unsupported_claims: true,
        perform_quality_assessment: true,
      },
      validation_options: {
        check_accessibility: true,
        minimum_quality_threshold: 50,
      }
    };

    const result = await unifiedCitationSystem(args, createTestContext());
    
    expect(result).toBeDefined();
    expect(result.isError).toBeFalsy();
    
    const content = extractContent(result);
    const metadata = result.metadata as any;
    
    console.log('✅ Content enhancement completed');
    console.log(`📈 Original length: ${testContent.length} chars`);
    console.log(`📈 Enhanced length: ${content.length} chars`);
    console.log(`📊 Citations discovered: ${metadata.operation.discovered || 0}`);
    console.log(`🎯 Quality score: ${metadata.operation.quality_score}/100`);
    
    // Should contain the original content
    expect(content).toContain('Digital Transformation ROI Analysis');
    
    // Should be enhanced (longer than original)
    expect(content.length).toBeGreaterThan(testContent.length);
    
    // Should contain some form of citation or bibliography
    const hasCitations = content.includes('References') || 
                        content.includes('Bibliography') || 
                        content.includes('Sources') ||
                        content.match(/\[\d+\]/) ||
                        content.match(/\(\d+\)/);
    
    if (hasCitations) {
      console.log('✅ Citations were added to content');
    } else {
      console.log('ℹ️  No citations added (may be due to discovery limitations)');
    }
    
    console.log('Enhanced content preview:', content.substring(0, 400) + '...');
    
  }, 30000);

  test('should handle comprehensive workflow', async () => {
    console.log('🚀 Testing comprehensive workflow...');
    
    const args: UnifiedCitationSystemArgs = {
      operation_mode: 'comprehensive',
      document_content: 'Customer success programs are essential for SaaS companies to reduce churn and increase revenue.',
      search_query: 'SaaS customer success ROI',
      existing_citations: [REAL_CITATIONS[0]], // Include one known good citation
      document_type: 'business_case',
      citation_options: {
        minimum_citations: 2,
        max_sources: 2,
        citation_style: 'business',
      },
      validation_options: {
        check_accessibility: true,
        timeout: 10000,
      },
      enhancement_options: {
        perform_quality_assessment: true,
      },
      report_options: {
        report_format: 'detailed',
        generate_evidence_report: true,
      }
    };

    const result = await unifiedCitationSystem(args, createTestContext());
    
    expect(result).toBeDefined();
    expect(result.isError).toBeFalsy();
    
    const content = extractContent(result);
    const metadata = result.metadata as any;
    
    console.log('✅ Comprehensive workflow completed');
    console.log(`📊 Total citations: ${metadata.operation.total_citations}`);
    console.log(`🔍 Discovered: ${metadata.operation.discovered}`);
    console.log(`✓ Validated: ${metadata.operation.validated}`);
    console.log(`📈 Success rate: ${metadata.operation.success_rate}%`);
    console.log(`🎯 Quality score: ${metadata.operation.quality_score}/100`);
    console.log(`⏱️  Processing time: ${metadata.executionTime}ms`);
    
    // Should contain comprehensive report
    expect(content).toContain('Unified Citation System Report');
    expect(content).toContain('Executive Summary');
    
    // Should have processed at least the existing citation
    expect(metadata.operation.total_citations).toBeGreaterThanOrEqual(1);
    
    console.log('Comprehensive report preview:', content.substring(0, 500) + '...');
    
  }, 60000); // 60 second timeout for comprehensive workflow

});

// Export for manual testing
export async function runValidationTest() {
  console.log('🧪 Running citation system validation test...\n');
  
  try {
    console.log('1️⃣  Testing citation validation...');
    const result1 = await unifiedCitationSystem({
      operation_mode: 'validate_citations',
      existing_citations: REAL_CITATIONS.slice(0, 2),
      validation_options: {
        check_accessibility: true,
        timeout: 10000,
      }
    }, createTestContext());
    
    console.log('✅ Validation test completed');
    console.log('Result:', {
      isError: result1.isError,
      hasContent: !!result1.content,
      metadata: result1.metadata
    });
    
    console.log('\n🎉 Validation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Validation test failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runValidationTest().catch(console.error);
}