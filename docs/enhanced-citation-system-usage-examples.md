# Enhanced Citation System - Usage Examples and Best Practices

## Overview

This document provides comprehensive usage examples and best practices for implementing the Enhanced Citation System in real-world scenarios. It covers common use cases, integration patterns, and optimization strategies.

## Table of Contents

1. [Quick Start Examples](#quick-start-examples)
2. [Advanced Usage Patterns](#advanced-usage-patterns)
3. [Integration Scenarios](#integration-scenarios)
4. [Performance Optimization](#performance-optimization)
5. [Error Handling Strategies](#error-handling-strategies)
6. [Best Practices](#best-practices)
7. [Troubleshooting Guide](#troubleshooting-guide)

## Quick Start Examples

### Basic Document Enhancement

```typescript
import { MCPClient } from '@modelcontextprotocol/sdk';

// Initialize MCP client
const mcpClient = new MCPClient();

async function enhanceBusinessCase() {
  const businessCaseContent = `
    # Market Opportunity Analysis
    
    The global SaaS market is expected to reach $623 billion by 2023, 
    driven by increased digital transformation initiatives. Customer 
    acquisition costs have risen by 60% over the past five years, 
    making retention strategies more critical than ever.
    
    Our analysis shows that companies implementing AI-powered customer 
    success platforms see 40% higher retention rates and 25% lower 
    churn compared to traditional approaches.
  `;

  try {
    const result = await mcpClient.callTool('mcp_vibe_pm_agent_enhance_citations', {
      document_content: businessCaseContent,
      document_type: 'business_case',
      enhancement_options: {
        minimum_confidence: 80,
        source_diversity_requirement: 75,
        recency_requirement_months: 12,
        industry_focus: 'SaaS',
        geographic_scope: 'Global',
        citation_format: 'Business'
      }
    });

    console.log('Enhanced Document:', result.enhanced_document);
    console.log('Citation Summary:', result.citation_summary);
    console.log('Quality Score:', result.quality_assessment.overall_score);
    
    return result;
  } catch (error) {
    console.error('Enhancement failed:', error);
    throw error;
  }
}
```

### Source Validation Workflow

```typescript
async function validateExistingSources() {
  const existingSources = [
    {
      id: 'source-1',
      title: 'SaaS Market Growth Report 2023',
      url: 'https://example.com/saas-report-2023',
      published_date: '2023-06-15T00:00:00Z',
      credibility_rating: 'A',
      source_type: 'INDUSTRY_REPORT',
      author: 'Market Research Inc.',
      summary: 'Comprehensive analysis of SaaS market trends and projections'
    },
    {
      id: 'source-2',
      title: 'Customer Acquisition Cost Trends',
      url: 'https://example.com/cac-trends',
      published_date: '2023-03-20T00:00:00Z',
      credibility_rating: 'B',
      source_type: 'CONSULTING_REPORT',
      author: 'Business Analytics Corp',
      summary: 'Analysis of customer acquisition cost trends across industries'
    }
  ];

  try {
    const result = await mcpClient.callTool('mcp_vibe_pm_agent_validate_and_audit_citations', {
      sources: existingSources,
      validation_criteria: {
        check_accessibility: true,
        assess_credibility: true,
        verify_compliance: true,
        find_alternatives: true,
        quality_threshold: 75
      },
      audit_options: {
        document_id: 'business-case-2023-q4',
        user_id: 'analyst-123',
        compliance_standards: ['business_intelligence', 'financial_reporting']
      }
    });

    console.log('Validation Summary:', result.validation_summary);
    console.log('Source Validations:', result.source_validations);
    console.log('Audit Trail ID:', result.audit_trail_id);
    
    return result;
  } catch (error) {
    console.error('Validation failed:', error);
    throw error;
  }
}
```

## Advanced Usage Patterns

### Batch Document Processing

```typescript
class BatchCitationProcessor {
  private mcpClient: MCPClient;
  private processingQueue: Array<{id: string, content: string, type: string}> = [];
  private results: Map<string, any> = new Map();

  constructor(mcpClient: MCPClient) {
    this.mcpClient = mcpClient;
  }

  async addDocument(id: string, content: string, type: string) {
    this.processingQueue.push({ id, content, type });
  }

  async processBatch(batchSize: number = 5, delayMs: number = 1000) {
    const batches = this.chunkArray(this.processingQueue, batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length}`);
      
      const batchPromises = batch.map(doc => this.processDocument(doc));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const doc = batch[index];
        if (result.status === 'fulfilled') {
          this.results.set(doc.id, result.value);
        } else {
          this.results.set(doc.id, { error: result.reason });
        }
      });

      // Add delay between batches to respect rate limits
      if (i < batches.length - 1) {
        await this.delay(delayMs);
      }
    }

    return this.results;
  }

  private async processDocument(doc: {id: string, content: string, type: string}) {
    try {
      const result = await this.mcpClient.callTool('mcp_vibe_pm_agent_enhance_citations', {
        document_content: doc.content,
        document_type: doc.type,
        enhancement_options: {
          minimum_confidence: 75,
          source_diversity_requirement: 70,
          recency_requirement_months: 18
        }
      });

      return {
        id: doc.id,
        success: true,
        citationCount: result.citation_summary.total_citations,
        qualityScore: result.quality_assessment.overall_score,
        confidence: result.citation_summary.average_confidence
      };
    } catch (error) {
      return {
        id: doc.id,
        success: false,
        error: error.message
      };
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const processor = new BatchCitationProcessor(mcpClient);

// Add documents to process
await processor.addDocument('doc1', businessCaseContent, 'business_case');
await processor.addDocument('doc2', marketAnalysisContent, 'market_analysis');
await processor.addDocument('doc3', executiveSummaryContent, 'executive_onepager');

// Process all documents in batches
const results = await processor.processBatch(3, 2000);

results.forEach((result, docId) => {
  if (result.success) {
    console.log(`${docId}: ${result.citationCount} citations, quality: ${result.qualityScore}`);
  } else {
    console.error(`${docId}: Failed - ${result.error}`);
  }
});
```

### Real-time Citation Monitoring

```typescript
import { EventEmitter } from 'events';

class CitationMonitor extends EventEmitter {
  private mcpClient: MCPClient;
  private monitoredDocuments: Map<string, any> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(mcpClient: MCPClient) {
    super();
    this.mcpClient = mcpClient;
  }

  addDocument(documentId: string, sources: any[]) {
    this.monitoredDocuments.set(documentId, {
      sources,
      lastChecked: new Date(),
      status: 'active'
    });
    
    this.emit('documentAdded', { documentId, sourceCount: sources.length });
  }

  startMonitoring(intervalMs: number = 3600000) { // Default: 1 hour
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.checkAllDocuments();
    }, intervalMs);

    this.emit('monitoringStarted', { interval: intervalMs });
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.emit('monitoringStopped');
  }

  private async checkAllDocuments() {
    for (const [documentId, docData] of this.monitoredDocuments) {
      try {
        await this.checkDocument(documentId, docData);
      } catch (error) {
        this.emit('checkError', { documentId, error: error.message });
      }
    }
  }

  private async checkDocument(documentId: string, docData: any) {
    const result = await this.mcpClient.callTool('mcp_vibe_pm_agent_validate_and_audit_citations', {
      sources: docData.sources,
      validation_criteria: {
        check_accessibility: true,
        assess_credibility: true,
        quality_threshold: 70
      }
    });

    const issues = this.analyzeValidationResult(result);
    
    if (issues.length > 0) {
      this.emit('issuesDetected', {
        documentId,
        issues,
        validationSummary: result.validation_summary
      });
    }

    // Update last checked time
    docData.lastChecked = new Date();
    this.monitoredDocuments.set(documentId, docData);

    this.emit('documentChecked', {
      documentId,
      status: issues.length > 0 ? 'issues' : 'healthy',
      issueCount: issues.length
    });
  }

  private analyzeValidationResult(result: any): string[] {
    const issues: string[] = [];

    // Check for broken links
    const brokenLinks = result.source_validations.filter(
      (validation: any) => !validation.accessibility_status.is_accessible
    );
    if (brokenLinks.length > 0) {
      issues.push(`${brokenLinks.length} broken links detected`);
    }

    // Check for low credibility sources
    const lowCredibility = result.source_validations.filter(
      (validation: any) => validation.credibility_assessment.overall_score < 60
    );
    if (lowCredibility.length > 0) {
      issues.push(`${lowCredibility.length} sources with low credibility`);
    }

    // Check overall quality
    if (result.validation_summary.overall_quality_score < 70) {
      issues.push(`Overall quality score below threshold: ${result.validation_summary.overall_quality_score}`);
    }

    return issues;
  }
}

// Usage
const monitor = new CitationMonitor(mcpClient);

// Set up event listeners
monitor.on('documentAdded', (data) => {
  console.log(`Monitoring document ${data.documentId} with ${data.sourceCount} sources`);
});

monitor.on('issuesDetected', (data) => {
  console.warn(`Issues detected in document ${data.documentId}:`, data.issues);
  // Send alert to team
  sendAlert(`Citation issues in ${data.documentId}`, data.issues);
});

monitor.on('documentChecked', (data) => {
  console.log(`Document ${data.documentId} status: ${data.status}`);
});

// Add documents to monitor
monitor.addDocument('quarterly-report', quarterlySources);
monitor.addDocument('market-analysis', marketSources);

// Start monitoring every 2 hours
monitor.startMonitoring(7200000);
```

## Integration Scenarios

### Kiro Spec Integration

```typescript
// Kiro hook for automatic citation enhancement
export const citationEnhancementHook = {
  name: 'enhance-citations-on-save',
  trigger: 'file:save',
  filePattern: '**/*.md',
  action: async (context: any) => {
    const { filePath, content } = context;
    
    // Check if this is a business document that needs citations
    const businessDocumentPatterns = [
      /# Business Case/i,
      /# Market Analysis/i,
      /# Executive Summary/i,
      /# Competitive Analysis/i
    ];

    const isBusinessDocument = businessDocumentPatterns.some(pattern => 
      pattern.test(content)
    );

    if (isBusinessDocument) {
      try {
        console.log(`Enhancing citations for ${filePath}`);
        
        const documentType = determineDocumentType(content);
        const enhanced = await enhanceDocument(content, documentType);
        
        if (enhanced.qualityReport.overallScore > 75) {
          await writeFile(filePath, enhanced.enhancedContent);
          console.log(`✅ Enhanced ${filePath} with ${enhanced.citationSummary.totalCitations} citations (Quality: ${enhanced.qualityReport.overallScore})`);
          
          // Create citation report
          const reportPath = filePath.replace('.md', '-citations.json');
          await writeFile(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            filePath,
            citationSummary: enhanced.citationSummary,
            qualityReport: enhanced.qualityReport,
            documentConfidence: enhanced.documentConfidence
          }, null, 2));
          
        } else {
          console.warn(`⚠️ Citation quality too low for ${filePath} (${enhanced.qualityReport.overallScore}). Manual review required.`);
        }
      } catch (error) {
        console.error(`❌ Citation enhancement failed for ${filePath}:`, error.message);
      }
    }
  }
};

function determineDocumentType(content: string): string {
  if (/# Business Case/i.test(content)) return 'business_case';
  if (/# Market Analysis/i.test(content)) return 'market_analysis';
  if (/# Executive Summary/i.test(content)) return 'executive_onepager';
  if (/# Competitive Analysis/i.test(content)) return 'competitive_analysis';
  return 'business_case'; // default
}
```

### CI/CD Pipeline Integration

```typescript
// GitHub Actions workflow integration
class CitationQualityChecker {
  private mcpClient: MCPClient;
  private qualityThresholds: Record<string, number>;

  constructor(mcpClient: MCPClient) {
    this.mcpClient = mcpClient;
    this.qualityThresholds = {
      'business_case': 80,
      'market_analysis': 75,
      'executive_onepager': 85,
      'competitive_analysis': 80,
      'pr_faq': 70
    };
  }

  async checkPullRequest(changedFiles: string[]): Promise<{passed: boolean, report: any}> {
    const businessDocuments = changedFiles.filter(file => 
      file.endsWith('.md') && this.isBusinessDocument(file)
    );

    if (businessDocuments.length === 0) {
      return { passed: true, report: { message: 'No business documents to check' } };
    }

    const results = [];
    let overallPassed = true;

    for (const file of businessDocuments) {
      const content = await this.readFile(file);
      const documentType = this.determineDocumentType(content);
      const threshold = this.qualityThresholds[documentType] || 75;

      try {
        const result = await this.mcpClient.callTool('mcp_vibe_pm_agent_enhance_citations', {
          document_content: content,
          document_type: documentType,
          enhancement_options: {
            minimum_confidence: threshold,
            source_diversity_requirement: 70
          }
        });

        const qualityScore = result.quality_assessment.overall_score;
        const passed = qualityScore >= threshold;
        
        if (!passed) {
          overallPassed = false;
        }

        results.push({
          file,
          documentType,
          qualityScore,
          threshold,
          passed,
          citationCount: result.citation_summary.total_citations,
          recommendations: result.recommendations.slice(0, 3) // Top 3 recommendations
        });

      } catch (error) {
        overallPassed = false;
        results.push({
          file,
          documentType,
          passed: false,
          error: error.message
        });
      }
    }

    return {
      passed: overallPassed,
      report: {
        checkedFiles: businessDocuments.length,
        results,
        summary: this.generateSummary(results)
      }
    };
  }

  private generateSummary(results: any[]): string {
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const avgQuality = results
      .filter(r => r.qualityScore)
      .reduce((sum, r) => sum + r.qualityScore, 0) / results.length;

    return `Citation Quality Check: ${passed}/${results.length} documents passed. Average quality score: ${avgQuality.toFixed(1)}`;
  }

  private isBusinessDocument(filePath: string): boolean {
    const businessKeywords = ['business-case', 'market-analysis', 'executive', 'competitive'];
    return businessKeywords.some(keyword => filePath.toLowerCase().includes(keyword));
  }

  private determineDocumentType(content: string): string {
    // Implementation similar to previous example
    if (/# Business Case/i.test(content)) return 'business_case';
    if (/# Market Analysis/i.test(content)) return 'market_analysis';
    if (/# Executive Summary/i.test(content)) return 'executive_onepager';
    if (/# Competitive Analysis/i.test(content)) return 'competitive_analysis';
    return 'business_case';
  }

  private async readFile(filePath: string): Promise<string> {
    // Implementation depends on environment (Node.js fs, GitHub API, etc.)
    const fs = require('fs').promises;
    return await fs.readFile(filePath, 'utf-8');
  }
}

// Usage in CI/CD
async function runCitationQualityCheck() {
  const checker = new CitationQualityChecker(mcpClient);
  const changedFiles = process.env.CHANGED_FILES?.split(',') || [];
  
  const result = await checker.checkPullRequest(changedFiles);
  
  if (result.passed) {
    console.log('✅ Citation quality check passed');
    console.log(result.report.summary);
    process.exit(0);
  } else {
    console.error('❌ Citation quality check failed');
    console.error(result.report.summary);
    
    // Output detailed results for failed documents
    result.report.results
      .filter((r: any) => !r.passed)
      .forEach((r: any) => {
        console.error(`\n${r.file}:`);
        if (r.error) {
          console.error(`  Error: ${r.error}`);
        } else {
          console.error(`  Quality Score: ${r.qualityScore}/${r.threshold}`);
          console.error(`  Citations: ${r.citationCount}`);
          if (r.recommendations) {
            console.error('  Recommendations:');
            r.recommendations.forEach((rec: any) => {
              console.error(`    - ${rec.description}`);
            });
          }
        }
      });
    
    process.exit(1);
  }
}
```

## Performance Optimization

### Intelligent Caching Strategy

```typescript
class CitationCache {
  private cache: Map<string, any> = new Map();
  private ttl: Map<string, number> = new Map();
  private defaultTTL = {
    validation: 24 * 60 * 60 * 1000, // 24 hours
    credibility: 7 * 24 * 60 * 60 * 1000, // 7 days
    quality: 60 * 60 * 1000, // 1 hour
    discovery: 12 * 60 * 60 * 1000 // 12 hours
  };

  set(key: string, value: any, type: keyof typeof this.defaultTTL = 'validation') {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + this.defaultTTL[type]);
  }

  get(key: string): any | null {
    const expiry = this.ttl.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  generateKey(type: string, ...params: any[]): string {
    return `${type}:${params.map(p => JSON.stringify(p)).join(':')}`;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.ttl.entries()) {
      if (now > expiry) {
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    }
  }
}

class OptimizedCitationProcessor {
  private cache = new CitationCache();
  private mcpClient: MCPClient;

  constructor(mcpClient: MCPClient) {
    this.mcpClient = mcpClient;
    
    // Cleanup cache every hour
    setInterval(() => this.cache.cleanup(), 60 * 60 * 1000);
  }

  async enhanceDocumentWithCache(content: string, type: string, options: any = {}) {
    const cacheKey = this.cache.generateKey('enhancement', content, type, options);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('Using cached enhancement result');
      return cached;
    }

    const result = await this.mcpClient.callTool('mcp_vibe_pm_agent_enhance_citations', {
      document_content: content,
      document_type: type,
      enhancement_options: options
    });

    this.cache.set(cacheKey, result, 'quality');
    return result;
  }

  async validateSourcesWithCache(sources: any[], options: any = {}) {
    const results = [];
    const uncachedSources = [];
    const sourceMap = new Map();

    // Check cache for each source
    for (const source of sources) {
      const cacheKey = this.cache.generateKey('validation', source.url, options);
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        results.push(cached);
      } else {
        uncachedSources.push(source);
        sourceMap.set(source.id, source);
      }
    }

    // Validate uncached sources
    if (uncachedSources.length > 0) {
      const validationResult = await this.mcpClient.callTool('mcp_vibe_pm_agent_validate_and_audit_citations', {
        sources: uncachedSources,
        validation_criteria: options
      });

      // Cache individual validation results
      validationResult.source_validations.forEach((validation: any) => {
        const source = sourceMap.get(validation.citation_id);
        if (source) {
          const cacheKey = this.cache.generateKey('validation', source.url, options);
          this.cache.set(cacheKey, validation, 'validation');
        }
      });

      results.push(...validationResult.source_validations);
    }

    return {
      source_validations: results,
      validation_summary: this.calculateSummary(results)
    };
  }

  private calculateSummary(validations: any[]) {
    return {
      total_sources: validations.length,
      accessible_sources: validations.filter(v => v.accessibility_status.is_accessible).length,
      high_credibility_sources: validations.filter(v => v.credibility_assessment.overall_score >= 80).length,
      overall_quality_score: validations.reduce((sum, v) => sum + v.quality_score, 0) / validations.length
    };
  }
}
```

### Concurrent Processing with Rate Limiting

```typescript
class RateLimitedProcessor {
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;
  private maxConcurrent = 5;
  private requestsPerSecond = 10;
  private lastRequestTime = 0;

  async addRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, this.maxConcurrent);
      
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      const minInterval = 1000 / this.requestsPerSecond;
      
      if (timeSinceLastRequest < minInterval) {
        await this.delay(minInterval - timeSinceLastRequest);
      }

      // Process batch concurrently
      await Promise.allSettled(batch.map(fn => fn()));
      this.lastRequestTime = Date.now();
    }

    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage with citation processing
class ConcurrentCitationProcessor {
  private rateLimiter = new RateLimitedProcessor();
  private mcpClient: MCPClient;

  constructor(mcpClient: MCPClient) {
    this.mcpClient = mcpClient;
  }

  async processMultipleDocuments(documents: Array<{id: string, content: string, type: string}>) {
    const promises = documents.map(doc => 
      this.rateLimiter.addRequest(() => this.processDocument(doc))
    );

    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => ({
      documentId: documents[index].id,
      success: result.status === 'fulfilled',
      result: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  private async processDocument(doc: {id: string, content: string, type: string}) {
    return await this.mcpClient.callTool('mcp_vibe_pm_agent_enhance_citations', {
      document_content: doc.content,
      document_type: doc.type,
      enhancement_options: {
        minimum_confidence: 75,
        source_diversity_requirement: 70
      }
    });
  }
}
```

## Error Handling Strategies

### Comprehensive Error Recovery

```typescript
class RobustCitationProcessor {
  private mcpClient: MCPClient;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(mcpClient: MCPClient) {
    this.mcpClient = mcpClient;
  }

  async enhanceDocumentWithRetry(content: string, type: string, options: any = {}) {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.mcpClient.callTool('mcp_vibe_pm_agent_enhance_citations', {
          document_content: content,
          document_type: type,
          enhancement_options: options
        });
      } catch (error) {
        lastError = error as Error;
        console.warn(`Enhancement attempt ${attempt} failed:`, error.message);

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    }

    // All retries failed, try fallback approach
    console.error('All enhancement attempts failed, trying fallback...');
    return await this.fallbackEnhancement(content, type, lastError);
  }

  private async fallbackEnhancement(content: string, type: string, originalError: Error | null) {
    try {
      // Simplified enhancement with lower requirements
      return await this.mcpClient.callTool('mcp_vibe_pm_agent_enhance_citations', {
        document_content: content,
        document_type: type,
        enhancement_options: {
          minimum_confidence: 50, // Lower threshold
          source_diversity_requirement: 40,
          recency_requirement_months: 36 // More lenient
        }
      });
    } catch (fallbackError) {
      // Return minimal enhancement result
      return {
        enhanced_document: content, // Return original content
        citation_summary: {
          total_citations: 0,
          average_confidence: 0,
          quality_score: 0,
          source_diversity: 0
        },
        quality_assessment: {
          overall_score: 0,
          metrics: {
            source_credibility: 0,
            evidence_diversity: 0,
            recency_score: 0,
            methodology_transparency: 0
          },
          compliance_status: 'non-compliant'
        },
        recommendations: [{
          type: 'system_error',
          priority: 'high',
          description: 'Citation enhancement failed. Manual review required.',
          action_items: [
            'Review document for citation needs',
            'Add citations manually',
            'Verify all claims with appropriate sources'
          ]
        }],
        error: {
          original: originalError?.message,
          fallback: fallbackError.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Graceful Degradation

```typescript
class GracefulCitationService {
  private mcpClient: MCPClient;
  private fallbackDatabase: Map<string, any> = new Map();

  constructor(mcpClient: MCPClient) {
    this.mcpClient = mcpClient;
    this.initializeFallbackDatabase();
  }

  async enhanceDocument(content: string, type: string, options: any = {}) {
    try {
      // Try full enhancement
      return await this.fullEnhancement(content, type, options);
    } catch (error) {
      console.warn('Full enhancement failed, trying partial enhancement:', error.message);
      
      try {
        // Try partial enhancement
        return await this.partialEnhancement(content, type, options);
      } catch (partialError) {
        console.warn('Partial enhancement failed, using basic enhancement:', partialError.message);
        
        // Fall back to basic enhancement
        return await this.basicEnhancement(content, type);
      }
    }
  }

  private async fullEnhancement(content: string, type: string, options: any) {
    return await this.mcpClient.callTool('mcp_vibe_pm_agent_enhance_citations', {
      document_content: content,
      document_type: type,
      enhancement_options: options
    });
  }

  private async partialEnhancement(content: string, type: string, options: any) {
    // Try with reduced requirements
    const reducedOptions = {
      ...options,
      minimum_confidence: Math.max((options.minimum_confidence || 75) - 20, 50),
      source_diversity_requirement: Math.max((options.source_diversity_requirement || 70) - 20, 40)
    };

    return await this.mcpClient.callTool('mcp_vibe_pm_agent_enhance_citations', {
      document_content: content,
      document_type: type,
      enhancement_options: reducedOptions
    });
  }

  private async basicEnhancement(content: string, type: string) {
    // Use local fallback database
    const claims = this.extractClaims(content);
    const citations = this.findFallbackCitations(claims, type);

    return {
      enhanced_document: this.insertCitations(content, citations),
      citation_summary: {
        total_citations: citations.length,
        average_confidence: 60, // Conservative estimate
        quality_score: 50, // Basic quality
        source_diversity: Math.min(citations.length * 20, 100)
      },
      quality_assessment: {
        overall_score: 50,
        metrics: {
          source_credibility: 60,
          evidence_diversity: 40,
          recency_score: 30,
          methodology_transparency: 50
        },
        compliance_status: 'warning'
      },
      recommendations: [{
        type: 'fallback_used',
        priority: 'medium',
        description: 'Basic citation enhancement used due to service limitations.',
        action_items: [
          'Review and verify all citations',
          'Consider updating with more recent sources',
          'Validate citation accuracy manually'
        ]
      }],
      fallback: true
    };
  }

  private extractClaims(content: string): string[] {
    // Simple claim extraction using regex patterns
    const patterns = [
      /\d+%/g, // Percentages
      /\$[\d,]+/g, // Dollar amounts
      /\d+\s+(billion|million|thousand)/gi, // Large numbers
      /according to|research shows|studies indicate/gi // Research indicators
    ];

    const claims: string[] = [];
    const sentences = content.split(/[.!?]+/);

    sentences.forEach(sentence => {
      if (patterns.some(pattern => pattern.test(sentence))) {
        claims.push(sentence.trim());
      }
    });

    return claims;
  }

  private findFallbackCitations(claims: string[], type: string): any[] {
    // Return generic citations from fallback database
    const relevantCitations = this.fallbackDatabase.get(type) || [];
    return relevantCitations.slice(0, Math.min(claims.length, 5));
  }

  private insertCitations(content: string, citations: any[]): string {
    // Simple citation insertion
    let enhanced = content;
    citations.forEach((citation, index) => {
      const citationText = `[${index + 1}] ${citation.title} - ${citation.author}`;
      enhanced += `\n\n## References\n${citationText}`;
    });
    return enhanced;
  }

  private initializeFallbackDatabase() {
    // Initialize with basic citations for different document types
    this.fallbackDatabase.set('business_case', [
      {
        title: 'Market Research Report 2023',
        author: 'Industry Analytics',
        url: 'https://example.com/market-research-2023'
      },
      {
        title: 'Business Intelligence Trends',
        author: 'Consulting Group',
        url: 'https://example.com/bi-trends'
      }
    ]);

    this.fallbackDatabase.set('market_analysis', [
      {
        title: 'Global Market Analysis',
        author: 'Market Research Inc',
        url: 'https://example.com/global-market'
      }
    ]);
  }
}
```

## Best Practices

### Document Type Optimization

```typescript
const DOCUMENT_TYPE_CONFIGS = {
  business_case: {
    minimum_confidence: 80,
    source_diversity_requirement: 75,
    recency_requirement_months: 12,
    required_source_types: ['CONSULTING_REPORT', 'INDUSTRY_REPORT', 'FINANCIAL_DATA'],
    quality_threshold: 85
  },
  market_analysis: {
    minimum_confidence: 75,
    source_diversity_requirement: 80,
    recency_requirement_months: 6,
    required_source_types: ['MARKET_RESEARCH', 'INDUSTRY_REPORT', 'GOVERNMENT_DATA'],
    quality_threshold: 80
  },
  executive_onepager: {
    minimum_confidence: 90,
    source_diversity_requirement: 70,
    recency_requirement_months: 3,
    required_source_types: ['CONSULTING_REPORT', 'FINANCIAL_DATA'],
    quality_threshold: 90
  },
  competitive_analysis: {
    minimum_confidence: 85,
    source_diversity_requirement: 85,
    recency_requirement_months: 6,
    required_source_types: ['COMPETITIVE_INTELLIGENCE', 'INDUSTRY_REPORT', 'COMPANY_REPORTS'],
    quality_threshold: 85
  },
  pr_faq: {
    minimum_confidence: 70,
    source_diversity_requirement: 60,
    recency_requirement_months: 18,
    required_source_types: ['PRESS_RELEASE', 'INDUSTRY_REPORT', 'NEWS_ARTICLE'],
    quality_threshold: 75
  }
};

function getOptimalConfig(documentType: string, customOptions: any = {}) {
  const baseConfig = DOCUMENT_TYPE_CONFIGS[documentType] || DOCUMENT_TYPE_CONFIGS.business_case;
  return { ...baseConfig, ...customOptions };
}
```

### Quality Monitoring Dashboard

```typescript
class CitationQualityDashboard {
  private metrics: Map<string, any[]> = new Map();

  recordMetric(documentId: string, metric: any) {
    if (!this.metrics.has(documentId)) {
      this.metrics.set(documentId, []);
    }
    this.metrics.get(documentId)!.push({
      ...metric,
      timestamp: new Date()
    });
  }

  generateReport(timeRange: 'day' | 'week' | 'month' = 'week') {
    const cutoff = this.getCutoffDate(timeRange);
    const recentMetrics = this.getRecentMetrics(cutoff);

    return {
      summary: this.calculateSummary(recentMetrics),
      trends: this.calculateTrends(recentMetrics),
      topIssues: this.identifyTopIssues(recentMetrics),
      recommendations: this.generateRecommendations(recentMetrics)
    };
  }

  private getCutoffDate(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case 'day': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private getRecentMetrics(cutoff: Date): any[] {
    const recent: any[] = [];
    for (const [documentId, metrics] of this.metrics) {
      const recentDocMetrics = metrics.filter(m => m.timestamp >= cutoff);
      recent.push(...recentDocMetrics.map(m => ({ ...m, documentId })));
    }
    return recent;
  }

  private calculateSummary(metrics: any[]) {
    if (metrics.length === 0) return null;

    const qualityScores = metrics.map(m => m.qualityScore).filter(s => s !== undefined);
    const confidenceScores = metrics.map(m => m.confidence).filter(s => s !== undefined);

    return {
      totalDocuments: new Set(metrics.map(m => m.documentId)).size,
      averageQuality: qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length,
      averageConfidence: confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length,
      totalCitations: metrics.reduce((sum, m) => sum + (m.citationCount || 0), 0),
      issueCount: metrics.filter(m => m.issues && m.issues.length > 0).length
    };
  }

  private calculateTrends(metrics: any[]) {
    // Group by day and calculate daily averages
    const dailyMetrics = new Map();
    
    metrics.forEach(metric => {
      const day = metric.timestamp.toDateString();
      if (!dailyMetrics.has(day)) {
        dailyMetrics.set(day, []);
      }
      dailyMetrics.get(day).push(metric);
    });

    const trends = [];
    for (const [day, dayMetrics] of dailyMetrics) {
      const avgQuality = dayMetrics.reduce((sum: number, m: any) => sum + (m.qualityScore || 0), 0) / dayMetrics.length;
      const avgConfidence = dayMetrics.reduce((sum: number, m: any) => sum + (m.confidence || 0), 0) / dayMetrics.length;
      
      trends.push({
        date: day,
        averageQuality: avgQuality,
        averageConfidence: avgConfidence,
        documentCount: dayMetrics.length
      });
    }

    return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private identifyTopIssues(metrics: any[]) {
    const issueCount = new Map();
    
    metrics.forEach(metric => {
      if (metric.issues) {
        metric.issues.forEach((issue: string) => {
          issueCount.set(issue, (issueCount.get(issue) || 0) + 1);
        });
      }
    });

    return Array.from(issueCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([issue, count]) => ({ issue, count }));
  }

  private generateRecommendations(metrics: any[]) {
    const recommendations = [];
    const summary = this.calculateSummary(metrics);

    if (summary.averageQuality < 75) {
      recommendations.push({
        type: 'quality_improvement',
        priority: 'high',
        description: 'Average citation quality is below target threshold',
        actions: [
          'Review source selection criteria',
          'Increase minimum credibility requirements',
          'Add more authoritative sources to database'
        ]
      });
    }

    if (summary.averageConfidence < 70) {
      recommendations.push({
        type: 'confidence_improvement',
        priority: 'medium',
        description: 'Document confidence scores are lower than expected',
        actions: [
          'Improve evidence diversity',
          'Use more recent sources',
          'Enhance methodology transparency'
        ]
      });
    }

    return recommendations;
  }
}
```

This comprehensive usage guide provides practical examples and best practices for implementing the Enhanced Citation System effectively in various scenarios, from simple document enhancement to complex enterprise integrations.