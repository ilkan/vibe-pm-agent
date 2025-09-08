# Enhanced Citation System - Best Practices Guide

## Overview

This guide provides comprehensive best practices for using the Enhanced Citation System effectively. It covers citation quality standards, performance optimization, security considerations, and common usage patterns.

## Table of Contents

1. [Citation Quality Standards](#citation-quality-standards)
2. [Source Selection Guidelines](#source-selection-guidelines)
3. [Performance Best Practices](#performance-best-practices)
4. [Security and Privacy](#security-and-privacy)
5. [Common Usage Patterns](#common-usage-patterns)
6. [Troubleshooting](#troubleshooting)
7. [Integration Examples](#integration-examples)

## Citation Quality Standards

### Minimum Quality Thresholds by Document Type

| Document Type | Minimum Confidence | Quality Score | Source Diversity |
|---------------|-------------------|---------------|------------------|
| Executive One-Pager | 85% | 90+ | 80%+ |
| Board Presentation | 90% | 95+ | 85%+ |
| Business Case | 80% | 85+ | 75%+ |
| Market Analysis | 75% | 80+ | 70%+ |
| PR-FAQ | 70% | 75+ | 65%+ |
| Competitive Analysis | 80% | 85+ | 80%+ |

### Source Credibility Ratings

#### A-Grade Sources (90-100 points)
- **Consulting Firms**: McKinsey, BCG, Bain, Deloitte, PwC
- **Research Institutions**: Gartner, Forrester, IDC
- **Academic**: Harvard Business Review, MIT Sloan, Stanford Business
- **Government**: SEC filings, Census data, BLS statistics
- **Financial**: Bloomberg, Reuters, Wall Street Journal

#### B-Grade Sources (70-89 points)
- **Industry Publications**: TechCrunch, VentureBeat, Industry Week
- **Trade Associations**: Industry-specific association reports
- **Corporate Reports**: Annual reports from public companies
- **Regional Research**: Regional business journals and reports

#### C-Grade Sources (50-69 points)
- **Blog Posts**: From recognized industry experts
- **News Articles**: From reputable news organizations
- **Company Websites**: Official company information
- **Social Media**: LinkedIn articles from verified professionals

### Recency Requirements

#### Critical Recency (Maximum 6 months)
- Financial data and earnings reports
- Regulatory changes and compliance updates
- Market pricing and competitive positioning
- Technology adoption rates

#### Standard Recency (Maximum 12 months)
- Market size and growth projections
- Industry trend analysis
- Customer behavior studies
- Competitive landscape analysis

#### Extended Recency (Maximum 24 months)
- Historical market analysis
- Long-term strategic frameworks
- Academic research and methodologies
- Foundational industry studies

## Source Selection Guidelines

### Diversification Strategy

#### Source Type Distribution (Recommended)
- **Consulting Reports**: 30-40%
- **Industry Research**: 25-35%
- **Academic Sources**: 15-25%
- **Government Data**: 10-20%
- **Corporate Reports**: 5-15%

#### Geographic Distribution
- **Global Sources**: 40-50% for international analysis
- **Regional Sources**: 30-40% for market-specific insights
- **Local Sources**: 10-20% for country-specific data

#### Temporal Distribution
- **Recent (0-6 months)**: 40-50%
- **Current (6-12 months)**: 30-40%
- **Historical (12-24 months)**: 10-20%

### Source Validation Checklist

#### Before Using a Source
- [ ] URL is accessible and loads properly
- [ ] Publication date is within recency requirements
- [ ] Author credentials are verifiable
- [ ] Methodology is clearly described
- [ ] Data sources are cited
- [ ] No obvious conflicts of interest

#### Quality Assessment Criteria
- [ ] Domain authority score > 50
- [ ] Author has relevant expertise
- [ ] Peer review or editorial oversight
- [ ] Transparent methodology
- [ ] Adequate sample size
- [ ] Statistical significance reported

## Performance Best Practices

### Caching Strategy

#### Source Validation Cache
```typescript
// Cache validation results for 24 hours
const cacheConfig = {
  accessibility: { ttl: 24 * 60 * 60 * 1000 }, // 24 hours
  credibility: { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days
  quality: { ttl: 60 * 60 * 1000 } // 1 hour
};
```

#### Database Query Optimization
```typescript
// Use indexed queries for citation lookup
const citationQuery = {
  sourceType: 'CONSULTING_REPORT',
  credibilityRating: { $in: ['A', 'B'] },
  publishedDate: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
};

// Create compound indexes
db.citations.createIndex({ 
  sourceType: 1, 
  credibilityRating: 1, 
  publishedDate: -1 
});
```

### Batch Processing

#### Concurrent Validation
```typescript
async function validateSourcesBatch(sources: Citation[], batchSize = 5) {
  const results = [];
  
  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(source => validateSource(source))
    );
    results.push(...batchResults);
    
    // Add delay between batches to respect rate limits
    if (i + batchSize < sources.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
```

#### Asynchronous Processing
```typescript
// Process citation enhancement in background
async function enhanceCitationsAsync(documentId: string, content: string) {
  const job = await citationQueue.add('enhance-citations', {
    documentId,
    content,
    options: {
      priority: 'normal',
      timeout: 300000 // 5 minutes
    }
  });
  
  return job.id;
}
```

### Memory Management

#### Stream Processing for Large Documents
```typescript
import { Transform } from 'stream';

class CitationAnalysisStream extends Transform {
  private buffer = '';
  
  _transform(chunk: any, encoding: string, callback: Function) {
    this.buffer += chunk.toString();
    
    // Process complete sentences
    const sentences = this.buffer.split(/[.!?]+/);
    this.buffer = sentences.pop() || '';
    
    for (const sentence of sentences) {
      if (sentence.trim()) {
        this.analyzeSentence(sentence.trim());
      }
    }
    
    callback();
  }
  
  private analyzeSentence(sentence: string) {
    // Analyze sentence for citation needs
    // Emit results as they're processed
  }
}
```

## Security and Privacy

### Data Anonymization

#### Content Sanitization
```typescript
const anonymizationRules = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  revenue: /\$[\d,]+(?:\.\d{2})?(?:\s?[BMK])?/g,
  projectCode: /\b[A-Z]+-[A-Z]+-\d{4}\b/g
};

function anonymizeContent(content: string): string {
  let anonymized = content;
  
  anonymized = anonymized.replace(anonymizationRules.email, '[EMAIL_ADDRESS]');
  anonymized = anonymized.replace(anonymizationRules.phone, '[PHONE_NUMBER]');
  anonymized = anonymized.replace(anonymizationRules.ssn, '[SSN]');
  anonymized = anonymized.replace(anonymizationRules.revenue, '[REVENUE_AMOUNT]');
  anonymized = anonymized.replace(anonymizationRules.projectCode, '[PROJECT_CODE]');
  
  return anonymized;
}
```

#### Secure API Communication
```typescript
const secureApiConfig = {
  timeout: 30000,
  headers: {
    'User-Agent': 'VibePMAgent/2.0',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  })
};
```

### Access Control

#### Role-Based Permissions
```typescript
const permissions = {
  viewer: ['read_citations', 'view_quality_reports'],
  editor: ['read_citations', 'view_quality_reports', 'enhance_citations'],
  admin: ['read_citations', 'view_quality_reports', 'enhance_citations', 'view_audit_trails', 'manage_sources'],
  auditor: ['read_citations', 'view_quality_reports', 'view_audit_trails', 'generate_compliance_reports']
};

function checkPermission(userId: string, action: string): boolean {
  const userRole = getUserRole(userId);
  return permissions[userRole]?.includes(action) || false;
}
```

#### Audit Trail Security
```typescript
interface SecureAuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  signature: string; // HMAC signature for integrity
}

function createAuditEntry(entry: Omit<SecureAuditEntry, 'id' | 'timestamp' | 'signature'>): SecureAuditEntry {
  const auditEntry = {
    ...entry,
    id: generateUUID(),
    timestamp: new Date()
  };
  
  auditEntry.signature = createHMAC(JSON.stringify(auditEntry), process.env.AUDIT_SECRET);
  return auditEntry;
}
```

## Common Usage Patterns

### Pattern 1: Document Enhancement Workflow

```typescript
async function enhanceBusinessCase(content: string, options: EnhancementOptions) {
  try {
    // Step 1: Analyze citation needs
    const discoveryEngine = new AICitationDiscoveryEngine();
    const requirements = await discoveryEngine.analyzeCitationNeeds(content);
    
    // Step 2: Discover relevant sources
    const candidates = await discoveryEngine.discoverRelevantSources(requirements);
    
    // Step 3: Validate sources
    const validationEngine = new SourceValidationEngine();
    const validatedSources = [];
    
    for (const candidate of candidates) {
      const accessibility = await validationEngine.validateSourceAccessibility(candidate.source.url);
      const credibility = await validationEngine.assessSourceCredibility(candidate.source);
      
      if (accessibility.isAccessible && credibility.overallScore >= options.minimumCredibility) {
        validatedSources.push({
          ...candidate,
          validation: { accessibility, credibility }
        });
      }
    }
    
    // Step 4: Assess quality
    const qualitySystem = new QualityAssessmentSystem();
    const citations = validatedSources.map(s => s.source);
    const qualityReport = await qualitySystem.assessCitationQuality(citations);
    
    // Step 5: Calculate confidence
    const confidenceEngine = new ConfidenceScoringEngine();
    const claimConfidences = [];
    
    for (const requirement of requirements) {
      const supportingSources = validatedSources
        .filter(s => s.supportedClaims.includes(requirement.claim))
        .map(s => s.source);
      
      const confidence = await confidenceEngine.calculateClaimConfidence(
        requirement.claim,
        supportingSources
      );
      claimConfidences.push(confidence);
    }
    
    const documentConfidence = await confidenceEngine.aggregateDocumentConfidence(claimConfidences);
    
    // Step 6: Generate enhanced document
    const enhancedContent = await generateEnhancedDocument(
      content,
      validatedSources,
      qualityReport,
      documentConfidence,
      options.citationFormat
    );
    
    return {
      enhancedContent,
      qualityReport,
      documentConfidence,
      citationSummary: {
        totalCitations: citations.length,
        averageConfidence: documentConfidence.overallConfidence,
        qualityScore: qualityReport.overallScore,
        sourceDiversity: qualityReport.metrics.evidenceDiversity
      }
    };
    
  } catch (error) {
    console.error('Document enhancement failed:', error);
    throw new DocumentEnhancementError('Failed to enhance document', error);
  }
}
```

### Pattern 2: Source Validation Pipeline

```typescript
async function validateSourcesPipeline(sources: Citation[], options: ValidationOptions) {
  const results = {
    validated: [],
    failed: [],
    alternatives: []
  };
  
  const validationEngine = new SourceValidationEngine();
  const auditManager = new AuditTrailManager();
  
  for (const source of sources) {
    try {
      // Validate accessibility
      const accessibility = await validationEngine.validateSourceAccessibility(source.url);
      
      if (!accessibility.isAccessible) {
        // Find alternatives
        const alternatives = await validationEngine.findAlternativeSources(source);
        results.alternatives.push({ original: source, alternatives });
        
        if (alternatives.length === 0) {
          results.failed.push({ source, reason: 'No accessible alternatives found' });
          continue;
        }
        
        // Use best alternative
        source.url = alternatives[0].url;
        source.title = alternatives[0].title;
      }
      
      // Assess credibility
      const credibility = await validationEngine.assessSourceCredibility(source);
      
      if (credibility.overallScore < options.minimumCredibility) {
        results.failed.push({ 
          source, 
          reason: `Credibility score ${credibility.overallScore} below threshold ${options.minimumCredibility}` 
        });
        continue;
      }
      
      // Log validation
      await auditManager.logValidationResult(source.url, {
        accessibility,
        credibility,
        timestamp: new Date()
      }, 'pipeline_validation');
      
      results.validated.push({
        source,
        validation: { accessibility, credibility }
      });
      
    } catch (error) {
      results.failed.push({ source, reason: error.message });
    }
  }
  
  return results;
}
```

### Pattern 3: Quality Monitoring

```typescript
class CitationQualityMonitor {
  private qualityThresholds = {
    critical: 90,
    warning: 75,
    acceptable: 60
  };
  
  async monitorDocumentQuality(documentId: string, citations: Citation[]) {
    const qualitySystem = new QualityAssessmentSystem();
    const report = await qualitySystem.assessCitationQuality(citations);
    
    // Check quality thresholds
    if (report.overallScore < this.qualityThresholds.critical) {
      await this.sendQualityAlert(documentId, 'critical', report);
    } else if (report.overallScore < this.qualityThresholds.warning) {
      await this.sendQualityAlert(documentId, 'warning', report);
    }
    
    // Log quality metrics
    await this.logQualityMetrics(documentId, report);
    
    return report;
  }
  
  private async sendQualityAlert(documentId: string, level: string, report: QualityReport) {
    const alert = {
      documentId,
      level,
      score: report.overallScore,
      issues: report.qualityGaps.map(gap => gap.gapType),
      recommendations: report.recommendations.slice(0, 3),
      timestamp: new Date()
    };
    
    // Send to monitoring system
    await this.alertingService.send(alert);
  }
  
  private async logQualityMetrics(documentId: string, report: QualityReport) {
    const metrics = {
      documentId,
      overallScore: report.overallScore,
      sourceCredibility: report.metrics.sourceCredibility,
      evidenceDiversity: report.metrics.evidenceDiversity,
      recencyScore: report.metrics.recencyScore,
      methodologyTransparency: report.metrics.methodologyTransparency,
      timestamp: new Date()
    };
    
    await this.metricsService.record(metrics);
  }
}
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: Low Citation Quality Scores

**Symptoms**:
- Quality reports showing scores below 70
- High number of C-grade sources
- Outdated source warnings

**Solutions**:
1. **Upgrade Source Quality**:
   ```typescript
   // Filter for higher quality sources
   const highQualitySources = await citationService.searchSources({
     credibilityRating: ['A', 'B'],
     sourceTypes: ['CONSULTING_REPORT', 'INDUSTRY_REPORT'],
     publishedAfter: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
   });
   ```

2. **Increase Source Diversity**:
   ```typescript
   // Ensure balanced source distribution
   const sourceDistribution = {
     consulting: Math.ceil(totalSources * 0.4),
     industry: Math.ceil(totalSources * 0.3),
     academic: Math.ceil(totalSources * 0.2),
     government: Math.ceil(totalSources * 0.1)
   };
   ```

#### Issue: Source Validation Failures

**Symptoms**:
- High number of inaccessible URLs
- Timeout errors during validation
- Inconsistent validation results

**Solutions**:
1. **Implement Retry Logic**:
   ```typescript
   async function validateWithRetry(url: string, maxRetries = 3) {
     for (let attempt = 1; attempt <= maxRetries; attempt++) {
       try {
         return await validationEngine.validateSourceAccessibility(url);
       } catch (error) {
         if (attempt === maxRetries) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
       }
     }
   }
   ```

2. **Use Fallback Validation**:
   ```typescript
   async function validateWithFallback(url: string) {
     try {
       return await primaryValidationService.validate(url);
     } catch (error) {
       console.warn('Primary validation failed, using fallback');
       return await fallbackValidationService.validate(url);
     }
   }
   ```

#### Issue: Performance Degradation

**Symptoms**:
- Slow citation enhancement
- High memory usage
- API timeout errors

**Solutions**:
1. **Implement Caching**:
   ```typescript
   const cache = new Map();
   
   async function getCachedValidation(url: string) {
     const cacheKey = `validation:${url}`;
     
     if (cache.has(cacheKey)) {
       const cached = cache.get(cacheKey);
       if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
         return cached.result;
       }
     }
     
     const result = await validationEngine.validateSourceAccessibility(url);
     cache.set(cacheKey, { result, timestamp: Date.now() });
     return result;
   }
   ```

2. **Optimize Database Queries**:
   ```typescript
   // Use projection to limit returned fields
   const citations = await db.citations.find(
     { sourceType: 'CONSULTING_REPORT' },
     { projection: { title: 1, url: 1, credibilityRating: 1 } }
   );
   ```

### Monitoring and Alerting

#### Quality Metrics Dashboard
```typescript
interface QualityMetrics {
  averageQualityScore: number;
  sourceDistribution: Record<string, number>;
  validationSuccessRate: number;
  averageConfidenceScore: number;
  complianceRate: number;
}

async function generateQualityDashboard(): Promise<QualityMetrics> {
  const metrics = await metricsService.aggregate({
    timeRange: '24h',
    groupBy: ['documentType', 'sourceType']
  });
  
  return {
    averageQualityScore: metrics.qualityScore.average,
    sourceDistribution: metrics.sourceType.distribution,
    validationSuccessRate: metrics.validation.successRate,
    averageConfidenceScore: metrics.confidence.average,
    complianceRate: metrics.compliance.rate
  };
}
```

#### Automated Alerts
```typescript
const alertRules = [
  {
    name: 'Low Quality Score',
    condition: (metrics) => metrics.averageQualityScore < 70,
    severity: 'warning',
    action: 'notify_quality_team'
  },
  {
    name: 'High Validation Failure Rate',
    condition: (metrics) => metrics.validationSuccessRate < 0.9,
    severity: 'critical',
    action: 'escalate_to_engineering'
  },
  {
    name: 'Compliance Issues',
    condition: (metrics) => metrics.complianceRate < 0.95,
    severity: 'high',
    action: 'notify_compliance_team'
  }
];
```

## Integration Examples

### MCP Client Integration

```typescript
import { MCPClient } from '@modelcontextprotocol/sdk';

class CitationEnhancedClient {
  constructor(private mcpClient: MCPClient) {}
  
  async enhanceDocument(content: string, type: string, options = {}) {
    const result = await this.mcpClient.callTool('mcp_vibe_pm_agent_enhance_citations', {
      document_content: content,
      document_type: type,
      enhancement_options: {
        minimum_confidence: 80,
        source_diversity_requirement: 75,
        recency_requirement_months: 12,
        citation_format: 'Business',
        ...options
      }
    });
    
    return result;
  }
  
  async validateSources(sources: Citation[], options = {}) {
    const result = await this.mcpClient.callTool('mcp_vibe_pm_agent_validate_and_audit_citations', {
      sources,
      validation_criteria: {
        check_accessibility: true,
        assess_credibility: true,
        verify_compliance: true,
        find_alternatives: true,
        quality_threshold: 70,
        ...options
      }
    });
    
    return result;
  }
}
```

### Kiro Integration

```typescript
// Kiro hook for automatic citation enhancement
export const citationEnhancementHook = {
  name: 'enhance-citations-on-save',
  trigger: 'file:save',
  filePattern: '**/*.md',
  action: async (context) => {
    const { filePath, content } = context;
    
    if (content.includes('# Business Case') || content.includes('# Market Analysis')) {
      const enhanced = await enhanceDocument(content, 'business_case');
      
      if (enhanced.qualityReport.overallScore > 80) {
        await writeFile(filePath, enhanced.enhancedContent);
        console.log(`Enhanced ${filePath} with ${enhanced.citationSummary.totalCitations} citations`);
      }
    }
  }
};
```

This comprehensive best practices guide provides the foundation for effective use of the Enhanced Citation System. Follow these guidelines to ensure high-quality, credible, and well-validated citations in all your business intelligence documents.