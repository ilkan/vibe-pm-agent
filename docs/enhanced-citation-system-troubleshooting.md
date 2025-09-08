# Enhanced Citation System - Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting information for the Enhanced Citation System, including common issues, diagnostic procedures, and resolution steps.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Error Messages](#error-messages)
4. [Performance Issues](#performance-issues)
5. [Integration Problems](#integration-problems)
6. [Data Quality Issues](#data-quality-issues)
7. [Security and Access Issues](#security-and-access-issues)
8. [Monitoring and Logging](#monitoring-and-logging)

## Quick Diagnostics

### System Health Check

Run this diagnostic script to check system health:

```typescript
async function runSystemHealthCheck() {
  const healthCheck = {
    timestamp: new Date(),
    components: {},
    overall: 'unknown'
  };
  
  try {
    // Test AI Citation Discovery Engine
    const discoveryEngine = new AICitationDiscoveryEngine();
    const testContent = "The SaaS market is growing rapidly.";
    const requirements = await discoveryEngine.analyzeCitationNeeds(testContent);
    healthCheck.components.aiDiscovery = requirements.length > 0 ? 'healthy' : 'warning';
    
    // Test Source Validation Engine
    const validationEngine = new SourceValidationEngine();
    const testUrl = 'https://www.google.com';
    const validation = await validationEngine.validateSourceAccessibility(testUrl);
    healthCheck.components.sourceValidation = validation.isAccessible ? 'healthy' : 'error';
    
    // Test Quality Assessment System
    const qualitySystem = new QualityAssessmentSystem();
    const mockCitations = [createMockCitation()];
    const qualityReport = await qualitySystem.assessCitationQuality(mockCitations);
    healthCheck.components.qualityAssessment = qualityReport.overallScore > 0 ? 'healthy' : 'error';
    
    // Test Confidence Scoring Engine
    const confidenceEngine = new ConfidenceScoringEngine();
    const confidence = await confidenceEngine.calculateClaimConfidence("test claim", mockCitations);
    healthCheck.components.confidenceScoring = confidence.overall >= 0 ? 'healthy' : 'error';
    
    // Test Audit Trail Manager
    const auditManager = new AuditTrailManager();
    await auditManager.logCitationUsage('test-doc', mockCitations[0], 'test-user');
    healthCheck.components.auditTrail = 'healthy';
    
    // Determine overall health
    const componentStatuses = Object.values(healthCheck.components);
    if (componentStatuses.every(status => status === 'healthy')) {
      healthCheck.overall = 'healthy';
    } else if (componentStatuses.some(status => status === 'error')) {
      healthCheck.overall = 'error';
    } else {
      healthCheck.overall = 'warning';
    }
    
  } catch (error) {
    healthCheck.overall = 'error';
    healthCheck.error = error.message;
  }
  
  return healthCheck;
}

function createMockCitation(): Citation {
  return {
    id: 'test-citation',
    title: 'Test Citation',
    url: 'https://example.com/test',
    publishedDate: new Date(),
    credibilityRating: 'A',
    sourceType: CitationSourceType.INDUSTRY_REPORT,
    author: 'Test Author',
    summary: 'Test citation for health check'
  };
}
```

### Component Status Check

```bash
# Check if all required components are running
npm run test:unit -- --testNamePattern="health check"

# Verify database connectivity
npm run test:integration -- --testNamePattern="database"

# Check external API connectivity
npm run test:integration -- --testNamePattern="external"
```

## Common Issues

### Issue 1: Citation Discovery Not Finding Sources

**Symptoms**:
- `analyzeCitationNeeds()` returns empty array
- No citation requirements generated for obvious claims
- AI discovery engine appears non-functional

**Diagnostic Steps**:
```typescript
// Test with simple, obvious claim
const testContent = "The global market size is $100 billion.";
const requirements = await discoveryEngine.analyzeCitationNeeds(testContent);
console.log('Requirements found:', requirements.length);

// Check if content preprocessing is working
const preprocessed = await discoveryEngine.preprocessContent(testContent);
console.log('Preprocessed content:', preprocessed);

// Verify claim extraction
const claims = await discoveryEngine.extractClaims(testContent);
console.log('Claims extracted:', claims);
```

**Common Causes & Solutions**:

1. **Content Too Short or Generic**:
   ```typescript
   // Minimum content length check
   if (content.length < 50) {
     throw new Error('Content too short for meaningful citation analysis');
   }
   ```

2. **Missing NLP Dependencies**:
   ```bash
   npm install natural compromise
   npm run build
   ```

3. **Configuration Issues**:
   ```typescript
   // Check AI discovery configuration
   const config = discoveryEngine.getConfiguration();
   console.log('AI Discovery Config:', config);
   
   // Verify required settings
   if (!config.nlpEnabled || !config.claimExtractionEnabled) {
     throw new Error('Required AI discovery features not enabled');
   }
   ```

### Issue 2: Source Validation Failures

**Symptoms**:
- High percentage of sources marked as inaccessible
- Validation timeouts
- Inconsistent validation results

**Diagnostic Steps**:
```typescript
// Test with known good URL
const testUrl = 'https://www.google.com';
const startTime = Date.now();

try {
  const result = await validationEngine.validateSourceAccessibility(testUrl);
  const duration = Date.now() - startTime;
  
  console.log('Validation result:', result);
  console.log('Validation duration:', duration, 'ms');
  
  if (duration > 10000) {
    console.warn('Validation taking too long');
  }
} catch (error) {
  console.error('Validation failed:', error);
}
```

**Common Causes & Solutions**:

1. **Network Connectivity Issues**:
   ```typescript
   // Test basic connectivity
   const https = require('https');
   
   function testConnectivity(url: string): Promise<boolean> {
     return new Promise((resolve) => {
       const request = https.get(url, (response) => {
         resolve(response.statusCode === 200);
       });
       
       request.on('error', () => resolve(false));
       request.setTimeout(5000, () => {
         request.destroy();
         resolve(false);
       });
     });
   }
   ```

2. **Rate Limiting**:
   ```typescript
   // Implement exponential backoff
   async function validateWithBackoff(url: string, attempt = 1): Promise<AccessibilityStatus> {
     try {
       return await validationEngine.validateSourceAccessibility(url);
     } catch (error) {
       if (error.code === 'RATE_LIMITED' && attempt < 3) {
         const delay = Math.pow(2, attempt) * 1000;
         await new Promise(resolve => setTimeout(resolve, delay));
         return validateWithBackoff(url, attempt + 1);
       }
       throw error;
     }
   }
   ```

3. **Proxy or Firewall Issues**:
   ```typescript
   // Configure proxy if needed
   const proxyConfig = {
     host: process.env.PROXY_HOST,
     port: process.env.PROXY_PORT,
     auth: process.env.PROXY_AUTH
   };
   
   if (proxyConfig.host) {
     validationEngine.setProxyConfiguration(proxyConfig);
   }
   ```

### Issue 3: Low Quality Scores

**Symptoms**:
- Quality reports consistently showing scores below 70
- High number of quality gaps identified
- Recommendations not improving scores

**Diagnostic Steps**:
```typescript
// Analyze quality factors
const qualityReport = await qualitySystem.assessCitationQuality(citations);

console.log('Overall Score:', qualityReport.overallScore);
console.log('Metrics Breakdown:');
console.log('- Source Credibility:', qualityReport.metrics.sourceCredibility);
console.log('- Evidence Diversity:', qualityReport.metrics.evidenceDiversity);
console.log('- Recency Score:', qualityReport.metrics.recencyScore);
console.log('- Methodology Transparency:', qualityReport.metrics.methodologyTransparency);

console.log('Quality Gaps:');
qualityReport.qualityGaps.forEach(gap => {
  console.log(`- ${gap.gapType}: ${gap.severity}`);
});
```

**Common Causes & Solutions**:

1. **Poor Source Selection**:
   ```typescript
   // Filter for higher quality sources
   const highQualitySources = citations.filter(citation => {
     return citation.credibilityRating === 'A' || 
            citation.credibilityRating === 'B';
   });
   
   // Check source age
   const recentSources = citations.filter(citation => {
     const ageInMonths = (Date.now() - citation.publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
     return ageInMonths <= 12;
   });
   ```

2. **Insufficient Source Diversity**:
   ```typescript
   // Check source type distribution
   const sourceTypeCount = citations.reduce((acc, citation) => {
     acc[citation.sourceType] = (acc[citation.sourceType] || 0) + 1;
     return acc;
   }, {});
   
   console.log('Source Type Distribution:', sourceTypeCount);
   
   // Ensure minimum diversity
   const uniqueSourceTypes = Object.keys(sourceTypeCount).length;
   if (uniqueSourceTypes < 3) {
     console.warn('Insufficient source diversity');
   }
   ```

### Issue 4: Confidence Scoring Problems

**Symptoms**:
- Confidence scores always 0 or 100
- Unrealistic confidence intervals
- Confidence calculations throwing errors

**Diagnostic Steps**:
```typescript
// Test confidence calculation with known data
const testClaim = "The market will grow by 10%";
const testSources = [createHighQualityCitation(), createMediumQualityCitation()];

try {
  const confidence = await confidenceEngine.calculateClaimConfidence(testClaim, testSources);
  
  console.log('Confidence Score:', confidence.overall);
  console.log('Breakdown:', confidence.breakdown);
  console.log('Confidence Interval:', confidence.confidenceInterval);
  console.log('Uncertainty Factors:', confidence.uncertaintyFactors);
  
  // Validate confidence score range
  if (confidence.overall < 0 || confidence.overall > 100) {
    console.error('Confidence score out of valid range');
  }
  
} catch (error) {
  console.error('Confidence calculation failed:', error);
}
```

**Common Causes & Solutions**:

1. **Missing Source Quality Data**:
   ```typescript
   // Ensure sources have required quality metrics
   function validateSourceForConfidence(source: Citation): boolean {
     return !!(
       source.credibilityRating &&
       source.publishedDate &&
       source.sourceType &&
       source.author
     );
   }
   
   const validSources = testSources.filter(validateSourceForConfidence);
   ```

2. **Algorithm Configuration Issues**:
   ```typescript
   // Check confidence scoring configuration
   const config = confidenceEngine.getConfiguration();
   
   if (!config.weights || Object.keys(config.weights).length === 0) {
     confidenceEngine.setConfiguration({
       weights: {
         sourceQuality: 0.3,
         evidenceStrength: 0.25,
         methodologyClarity: 0.2,
         recencyFactor: 0.15,
         sampleSizeAdequacy: 0.1
       }
     });
   }
   ```

## Error Messages

### CitationValidationError

**Error**: `CitationValidationError: Source validation failed for citation-123: URL not accessible`

**Cause**: Source URL is returning 404, 500, or timing out

**Solution**:
```typescript
try {
  await validationEngine.validateSourceAccessibility(url);
} catch (error) {
  if (error instanceof CitationValidationError) {
    // Try to find alternatives
    const alternatives = await validationEngine.findAlternativeSources(citation);
    
    if (alternatives.length > 0) {
      console.log('Using alternative source:', alternatives[0].url);
      return alternatives[0];
    } else {
      console.warn('No alternatives found for:', citation.url);
      // Mark as inaccessible but continue processing
      citation.validationStatus = {
        lastValidated: new Date(),
        accessibilityStatus: { isAccessible: false, accessType: 'broken' },
        credibilityAssessment: null,
        complianceStatus: 'unknown'
      };
    }
  }
}
```

### QualityThresholdError

**Error**: `QualityThresholdError: Quality threshold not met: 65 < 75`

**Cause**: Citation quality falls below required threshold

**Solution**:
```typescript
try {
  const qualityReport = await qualitySystem.assessCitationQuality(citations);
  
  if (qualityReport.overallScore < requiredThreshold) {
    // Get improvement recommendations
    const recommendations = await qualitySystem.recommendImprovements(qualityReport);
    
    // Apply automatic improvements where possible
    for (const recommendation of recommendations) {
      if (recommendation.type === 'replace_low_quality_sources') {
        await replaceSourcesAutomatically(citations, recommendation.actionItems);
      } else if (recommendation.type === 'add_missing_source_types') {
        await addMissingSourceTypes(citations, recommendation.actionItems);
      }
    }
    
    // Re-assess quality
    const improvedReport = await qualitySystem.assessCitationQuality(citations);
    console.log('Improved quality score:', improvedReport.overallScore);
  }
} catch (error) {
  if (error instanceof QualityThresholdError) {
    console.log('Quality improvement suggestions:', error.improvementSuggestions);
  }
}
```

### AuditTrailError

**Error**: `AuditTrailError: Audit trail operation failed: log_citation_usage for document doc-123`

**Cause**: Database connectivity issues or permission problems

**Solution**:
```typescript
try {
  await auditManager.logCitationUsage(documentId, citation, userId);
} catch (error) {
  if (error instanceof AuditTrailError) {
    // Try alternative logging method
    console.warn('Primary audit logging failed, using fallback');
    
    await fallbackAuditLogger.log({
      documentId,
      citationId: citation.id,
      userId,
      timestamp: new Date(),
      action: 'citation_usage',
      details: error.details
    });
    
    // Queue for retry
    await auditRetryQueue.add({
      operation: 'log_citation_usage',
      documentId,
      citation,
      userId,
      originalError: error.message
    });
  }
}
```

## Performance Issues

### Slow Citation Enhancement

**Symptoms**:
- Citation enhancement taking > 30 seconds
- High CPU usage during processing
- Memory usage continuously increasing

**Diagnostic Steps**:
```typescript
// Profile citation enhancement performance
async function profileCitationEnhancement(content: string) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  
  console.log('Starting citation enhancement...');
  console.log('Initial memory usage:', startMemory);
  
  try {
    // Step 1: Analyze citation needs
    const step1Start = Date.now();
    const requirements = await discoveryEngine.analyzeCitationNeeds(content);
    console.log(`Step 1 (Analysis): ${Date.now() - step1Start}ms`);
    
    // Step 2: Discover sources
    const step2Start = Date.now();
    const candidates = await discoveryEngine.discoverRelevantSources(requirements);
    console.log(`Step 2 (Discovery): ${Date.now() - step2Start}ms`);
    
    // Step 3: Validate sources
    const step3Start = Date.now();
    const validatedSources = await validateSourcesBatch(candidates.map(c => c.source));
    console.log(`Step 3 (Validation): ${Date.now() - step3Start}ms`);
    
    // Step 4: Assess quality
    const step4Start = Date.now();
    const qualityReport = await qualitySystem.assessCitationQuality(validatedSources);
    console.log(`Step 4 (Quality): ${Date.now() - step4Start}ms`);
    
    const totalTime = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    
    console.log(`Total time: ${totalTime}ms`);
    console.log('Memory usage increase:', {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed
    });
    
  } catch (error) {
    console.error('Performance profiling failed:', error);
  }
}
```

**Solutions**:

1. **Implement Caching**:
   ```typescript
   class PerformanceOptimizedCitationEngine {
     private cache = new Map();
     private cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
     
     async analyzeCitationNeedsWithCache(content: string) {
       const cacheKey = this.generateCacheKey(content);
       const cached = this.cache.get(cacheKey);
       
       if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
         return cached.result;
       }
       
       const result = await this.discoveryEngine.analyzeCitationNeeds(content);
       this.cache.set(cacheKey, { result, timestamp: Date.now() });
       
       return result;
     }
     
     private generateCacheKey(content: string): string {
       return require('crypto').createHash('md5').update(content).digest('hex');
     }
   }
   ```

2. **Batch Processing**:
   ```typescript
   async function processInBatches<T, R>(
     items: T[],
     processor: (item: T) => Promise<R>,
     batchSize = 5,
     delayBetweenBatches = 1000
   ): Promise<R[]> {
     const results: R[] = [];
     
     for (let i = 0; i < items.length; i += batchSize) {
       const batch = items.slice(i, i + batchSize);
       const batchResults = await Promise.all(batch.map(processor));
       results.push(...batchResults);
       
       // Add delay between batches to prevent overwhelming external services
       if (i + batchSize < items.length) {
         await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
       }
     }
     
     return results;
   }
   ```

3. **Memory Management**:
   ```typescript
   // Implement garbage collection hints
   function forceGarbageCollection() {
     if (global.gc) {
       global.gc();
     }
   }
   
   // Clear caches periodically
   setInterval(() => {
     citationCache.clear();
     validationCache.clear();
     forceGarbageCollection();
   }, 60 * 60 * 1000); // Every hour
   ```

### Database Performance Issues

**Symptoms**:
- Slow citation database queries
- High database CPU usage
- Connection timeouts

**Solutions**:

1. **Query Optimization**:
   ```typescript
   // Use indexes for common queries
   db.citations.createIndex({ 
     sourceType: 1, 
     credibilityRating: 1, 
     publishedDate: -1 
   });
   
   db.citations.createIndex({ 
     "validationStatus.lastValidated": -1 
   });
   
   // Use projection to limit returned fields
   const citations = await db.citations.find(
     { sourceType: 'CONSULTING_REPORT' },
     { 
       projection: { 
         title: 1, 
         url: 1, 
         credibilityRating: 1, 
         publishedDate: 1 
       } 
     }
   );
   ```

2. **Connection Pooling**:
   ```typescript
   const mongoOptions = {
     maxPoolSize: 10,
     serverSelectionTimeoutMS: 5000,
     socketTimeoutMS: 45000,
     bufferMaxEntries: 0,
     useNewUrlParser: true,
     useUnifiedTopology: true
   };
   
   const client = new MongoClient(connectionString, mongoOptions);
   ```

## Integration Problems

### MCP Tool Integration Issues

**Symptoms**:
- MCP tools not responding
- Invalid tool schemas
- Tool execution timeouts

**Diagnostic Steps**:
```typescript
// Test MCP tool availability
async function testMCPTools() {
  const tools = [
    'mcp_vibe_pm_agent_enhance_citations',
    'mcp_vibe_pm_agent_validate_and_audit_citations'
  ];
  
  for (const toolName of tools) {
    try {
      const toolInfo = await mcpClient.getToolInfo(toolName);
      console.log(`Tool ${toolName}: Available`);
      console.log('Schema:', toolInfo.schema);
    } catch (error) {
      console.error(`Tool ${toolName}: Not available -`, error.message);
    }
  }
}
```

**Solutions**:

1. **Schema Validation**:
   ```typescript
   import { z } from 'zod';
   
   const enhanceCitationsSchema = z.object({
     document_content: z.string().min(1).max(50000),
     document_type: z.enum(['business_case', 'market_analysis', 'executive_onepager', 'pr_faq', 'competitive_analysis']),
     enhancement_options: z.object({
       minimum_confidence: z.number().min(0).max(100).optional(),
       source_diversity_requirement: z.number().min(0).max(100).optional(),
       recency_requirement_months: z.number().min(1).max(60).optional()
     }).optional()
   });
   
   // Validate input before processing
   function validateToolInput(input: any) {
     try {
       return enhanceCitationsSchema.parse(input);
     } catch (error) {
       throw new Error(`Invalid input: ${error.message}`);
     }
   }
   ```

2. **Timeout Handling**:
   ```typescript
   async function callToolWithTimeout(toolName: string, input: any, timeoutMs = 30000) {
     return Promise.race([
       mcpClient.callTool(toolName, input),
       new Promise((_, reject) => 
         setTimeout(() => reject(new Error('Tool execution timeout')), timeoutMs)
       )
     ]);
   }
   ```

## Monitoring and Logging

### Enable Debug Logging

```typescript
// Set environment variable for debug logging
process.env.DEBUG = 'vibe-pm-agent:*';

// Or configure programmatically
import debug from 'debug';

const log = debug('vibe-pm-agent:citation-system');
log('Citation system initialized');

// Log performance metrics
const perfLog = debug('vibe-pm-agent:performance');
perfLog('Citation enhancement completed in %dms', duration);
```

### Health Monitoring

```typescript
class CitationSystemMonitor {
  private metrics = {
    enhancementRequests: 0,
    validationRequests: 0,
    errors: 0,
    averageResponseTime: 0
  };
  
  async recordMetric(type: string, value: number) {
    this.metrics[type] = (this.metrics[type] || 0) + value;
    
    // Send to monitoring service
    await this.sendToMonitoring({
      metric: type,
      value,
      timestamp: new Date()
    });
  }
  
  getHealthStatus() {
    const errorRate = this.metrics.errors / (this.metrics.enhancementRequests + this.metrics.validationRequests);
    
    return {
      status: errorRate < 0.05 ? 'healthy' : 'unhealthy',
      metrics: this.metrics,
      errorRate
    };
  }
}
```

### Log Analysis

```bash
# Search for specific errors
grep "CitationValidationError" logs/citation-system.log

# Monitor performance
grep "enhancement completed" logs/citation-system.log | awk '{print $NF}' | sort -n

# Check error patterns
grep "ERROR" logs/citation-system.log | cut -d' ' -f4- | sort | uniq -c | sort -nr
```

## Getting Help

If you continue to experience issues after following this troubleshooting guide:

1. **Check System Requirements**:
   - Node.js >= 18.0.0
   - Available memory >= 2GB
   - Network connectivity to external validation services

2. **Collect Diagnostic Information**:
   ```bash
   npm run test:unit -- --verbose
   npm run test:integration -- --verbose
   node -e "console.log(process.version, process.platform, process.arch)"
   ```

3. **Enable Verbose Logging**:
   ```bash
   DEBUG=vibe-pm-agent:* npm run dev
   ```

4. **Review Recent Changes**:
   - Check git log for recent changes
   - Review configuration changes
   - Verify dependency updates

5. **Contact Support**:
   - Include diagnostic information
   - Provide error logs
   - Describe steps to reproduce the issue