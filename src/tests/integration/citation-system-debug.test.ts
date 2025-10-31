/**
 * Debug Test: Unified Citation System - Core Functionality
 * 
 * Simple test to debug and validate the unified citation system works with real data.
 */

import { unifiedCitationSystem, UnifiedCitationSystemArgs } from '../../mcp/tools/unified_citation_system';
import { MCPToolContext } from '../../models/mcp';

// Simple test context
const createTestContext = (): MCPToolContext => ({
  timestamp: Date.now(),
  requestId: `test-${Date.now()}`,
  userId: 'test-user',
  sessionId: `session-${Date.now()}`,
  toolName: 'unified_citation_system',
});

// Helper to extract content from MCP response
const extractContent = (result: any): string => {
  if (Array.isArray(result.content)) {
    return result.content.map((c: any) => c.text || c.markdown || '').join('\n');
  }
  return result.content as string;
};

describe('Citation System Debug Tests', () => {
  
  test('should discover sources with real web scraping', async () => {
    console.log('🔍 Testing source discovery...');
    
    const args: UnifiedCitationSystemArgs = {
      operation_mode: 'discover_sources',
      search_query: 'SaaS customer churn reduction strategies',
      citation_options: {
        max_sources: 3,
        minimum_confidence: 'medium',
        industry_focus: 'saas',
      },
      validation_options: {
        check_accessibility: true,
        timeout: 10000,
        retry_attempts: 1,
      }
    };

    try {
      const result = await unifiedCitationSystem(args, createTestContext());
      
      console.log('✅ Tool executed successfully');
      console.log('Result structure:', {
        hasContent: !!result.content,
        contentType: Array.isArray(result.content) ? 'array' : typeof result.content,
        hasMetadata: !!result.metadata,
        isError: result.isError
      });
      
      if (result.isError) {
        console.error('❌ Tool returned error:', result);
        throw new Error('Tool execution failed');
      }
      
      const content = extractContent(result);
      const metadata = result.metadata as any;
      
      console.log('Content preview:', content.substring(0, 200) + '...');
      console.log('Metadata:', metadata);
      
      // Basic validations
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
      
      if (metadata?.operation) {
        console.log(`📊 Citations found: ${metadata.operation.total_citations || 0}`);
        console.log(`⏱️  Processing time: ${metadata.executionTime || 0}ms`);
      }
      
    } catch (error) {
      console.error('❌ Test failed with error:', error);
      
      // Log the error details for debugging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      throw error;
    }
    
  }, 30000); // 30 second timeout

  test('should enhance content with citations', async () => {
    console.log('📝 Testing content enhancement...');
    
    const testContent = `
# SaaS Customer Retention Analysis

Customer churn is a major challenge for SaaS companies. Industry data shows that reducing churn by just 1% can significantly impact revenue.

## Key Findings
- Average SaaS churn rates vary by industry
- Proactive customer success programs show positive ROI
- AI-powered retention strategies are becoming more common

## Recommendations
Implement a comprehensive customer success program with predictive analytics to identify at-risk customers.
    `.trim();

    const args: UnifiedCitationSystemArgs = {
      operation_mode: 'enhance_content',
      document_content: testContent,
      document_type: 'business_case',
      citation_options: {
        minimum_citations: 2,
        citation_style: 'business',
        industry_focus: 'saas',
      },
      enhancement_options: {
        identify_unsupported_claims: true,
        perform_quality_assessment: true,
      }
    };

    try {
      const result = await unifiedCitationSystem(args, createTestContext());
      
      console.log('✅ Content enhancement executed');
      
      if (result.isError) {
        console.error('❌ Tool returned error:', result);
        throw new Error('Content enhancement failed');
      }
      
      const content = extractContent(result);
      const metadata = result.metadata as any;
      
      console.log('Original length:', testContent.length);
      console.log('Enhanced length:', content.length);
      console.log('Enhancement ratio:', (content.length / testContent.length).toFixed(2));
      
      // Basic validations
      expect(result).toBeDefined();
      expect(content.length).toBeGreaterThan(testContent.length);
      expect(content).toContain('SaaS Customer Retention Analysis');
      
      if (metadata?.operation) {
        console.log(`📊 Citations added: ${metadata.operation.total_citations || 0}`);
        console.log(`🎯 Quality score: ${metadata.operation.quality_score || 0}/100`);
      }
      
    } catch (error) {
      console.error('❌ Content enhancement failed:', error);
      throw error;
    }
    
  }, 30000);

});

// Manual test runner
export async function runDebugTest() {
  console.log('🧪 Running manual debug test...\n');
  
  try {
    // Test source discovery
    console.log('1️⃣  Testing source discovery...');
    const result1 = await unifiedCitationSystem({
      operation_mode: 'discover_sources',
      search_query: 'digital transformation ROI metrics',
      citation_options: {
        max_sources: 2,
        minimum_confidence: 'medium',
      },
      validation_options: {
        check_accessibility: true,
        timeout: 8000,
      }
    }, createTestContext());
    
    console.log('✅ Source discovery completed');
    console.log('Result type:', typeof result1.content);
    console.log('Is error:', result1.isError);
    
    if (!result1.isError) {
      const content1 = extractContent(result1);
      console.log('Content length:', content1.length);
      console.log('Content preview:', content1.substring(0, 150) + '...');
    }
    
    console.log('\n2️⃣  Testing content enhancement...');
    const result2 = await unifiedCitationSystem({
      operation_mode: 'enhance_content',
      document_content: 'Digital transformation initiatives show significant ROI improvements for enterprises.',
      document_type: 'business_case',
      citation_options: {
        minimum_citations: 1,
        citation_style: 'business',
      }
    }, createTestContext());
    
    console.log('✅ Content enhancement completed');
    console.log('Result type:', typeof result2.content);
    console.log('Is error:', result2.isError);
    
    if (!result2.isError) {
      const content2 = extractContent(result2);
      console.log('Enhanced content length:', content2.length);
    }
    
    console.log('\n🎉 Debug test completed successfully!');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runDebugTest().catch(console.error);
}