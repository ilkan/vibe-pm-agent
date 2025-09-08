# Enhanced Citation System API Documentation

## Overview

The Enhanced Citation System provides comprehensive citation management, validation, and quality assessment capabilities for the vibe-pm-agent MCP server. This document describes all available APIs, tools, and interfaces for integrating with the enhanced citation system.

## Table of Contents

1. [MCP Tools](#mcp-tools)
2. [Core Components](#core-components)
3. [Data Models](#data-models)
4. [Error Handling](#error-handling)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)

## MCP Tools

### enhance_citations

Enhances existing documents with comprehensive citations and evidence validation.

**Tool Name**: `mcp_vibe_pm_agent_enhance_citations`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "document_content": {
      "type": "string",
      "description": "Document content to enhance with citations",
      "minLength": 1,
      "maxLength": 50000
    },
    "document_type": {
      "type": "string",
      "enum": ["business_case", "market_analysis", "executive_onepager", "pr_faq", "competitive_analysis"],
      "description": "Type of document for appropriate citation standards"
    },
    "enhancement_options": {
      "type": "object",
      "properties": {
        "minimum_confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100,
          "default": 75,
          "description": "Minimum confidence score required for citations"
        },
        "source_diversity_requirement": {
          "type": "number",
          "minimum": 0,
          "maximum": 100,
          "default": 70,
          "description": "Required diversity score for source types"
        },
        "recency_requirement_months": {
          "type": "number",
          "minimum": 1,
          "maximum": 60,
          "default": 24,
          "description": "Maximum age of sources in months"
        },
        "industry_focus": {
          "type": "string",
          "description": "Industry context for relevant source selection"
        },
        "geographic_scope": {
          "type": "string",
          "description": "Geographic scope for market data (e.g., 'Global', 'North America')"
        },
        "citation_format": {
          "type": "string",
          "enum": ["APA", "Business", "Inline"],
          "default": "Business",
          "description": "Citation format style"
        }
      }
    }
  },
  "required": ["document_content", "document_type"]
}
```

**Output**:
```json
{
  "enhanced_document": "string",
  "citation_summary": {
    "total_citations": "number",
    "average_confidence": "number",
    "quality_score": "number",
    "source_diversity": "number"
  },
  "quality_assessment": {
    "overall_score": "number",
    "metrics": {
      "source_credibility": "number",
      "evidence_diversity": "number",
      "recency_score": "number",
      "methodology_transparency": "number"
    },
    "compliance_status": "string"
  },
  "recommendations": [
    {
      "type": "string",
      "priority": "string",
      "description": "string",
      "action_items": ["string"]
    }
  ]
}
```

**Example Usage**:
```javascript
const result = await mcpClient.callTool('mcp_vibe_pm_agent_enhance_citations', {
  document_content: "The SaaS market is growing rapidly with significant opportunities.",
  document_type: "market_analysis",
  enhancement_options: {
    minimum_confidence: 80,
    source_diversity_requirement: 75,
    recency_requirement_months: 12,
    industry_focus: "SaaS",
    geographic_scope: "Global",
    citation_format: "Business"
  }
});
```

### validate_and_audit_citations

Validates source accessibility, credibility, and compliance for existing citations.

**Tool Name**: `mcp_vibe_pm_agent_validate_and_audit_citations`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "sources": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Citation"
      },
      "description": "Array of citations to validate",
      "minItems": 1,
      "maxItems": 100
    },
    "validation_criteria": {
      "type": "object",
      "properties": {
        "check_accessibility": {
          "type": "boolean",
          "default": true,
          "description": "Validate source URL accessibility"
        },
        "assess_credibility": {
          "type": "boolean",
          "default": true,
          "description": "Assess source credibility and authority"
        },
        "verify_compliance": {
          "type": "boolean",
          "default": true,
          "description": "Check compliance with citation standards"
        },
        "find_alternatives": {
          "type": "boolean",
          "default": true,
          "description": "Find alternative sources for broken links"
        },
        "quality_threshold": {
          "type": "number",
          "minimum": 0,
          "maximum": 100,
          "default": 70,
          "description": "Minimum quality score threshold"
        }
      }
    },
    "audit_options": {
      "type": "object",
      "properties": {
        "document_id": {
          "type": "string",
          "description": "Document identifier for audit trail"
        },
        "user_id": {
          "type": "string",
          "description": "User identifier for audit logging"
        },
        "compliance_standards": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Specific compliance standards to check"
        }
      }
    }
  },
  "required": ["sources"]
}
```

**Output**:
```json
{
  "validation_summary": {
    "total_sources": "number",
    "accessible_sources": "number",
    "high_credibility_sources": "number",
    "compliant_sources": "number",
    "overall_quality_score": "number"
  },
  "source_validations": [
    {
      "citation_id": "string",
      "accessibility_status": {
        "is_accessible": "boolean",
        "access_type": "string",
        "last_checked": "string",
        "alternative_access": ["string"]
      },
      "credibility_assessment": {
        "overall_score": "number",
        "factors": {
          "domain_authority": "number",
          "author_credentials": "number",
          "peer_review_status": "number",
          "citation_frequency": "number"
        },
        "confidence_level": "string"
      },
      "quality_score": "number",
      "compliance_status": "string",
      "recommendations": ["string"]
    }
  ],
  "alternatives": [
    {
      "original_citation_id": "string",
      "alternative_sources": ["Citation"]
    }
  ],
  "audit_trail_id": "string"
}
```

## Core Components

### AICitationDiscoveryEngine

Automatically identifies citation needs and discovers relevant sources using AI analysis.

**Class**: `AICitationDiscoveryEngine`

**Methods**:

#### analyzeCitationNeeds(content: string): Promise<CitationRequirement[]>

Analyzes document content to identify claims requiring citation support.

**Parameters**:
- `content` (string): Document content to analyze

**Returns**: Array of citation requirements with claim analysis

**Example**:
```typescript
const engine = new AICitationDiscoveryEngine();
const requirements = await engine.analyzeCitationNeeds(documentContent);
```

#### discoverRelevantSources(requirements: CitationRequirement[]): Promise<SourceCandidate[]>

Discovers relevant sources from the expanded citation database.

**Parameters**:
- `requirements` (CitationRequirement[]): Array of citation requirements

**Returns**: Array of source candidates with relevance scores

#### identifyUnsupportedClaims(content: string): Promise<UnsupportedClaim[]>

Identifies specific claims in content that lack proper citation support.

**Parameters**:
- `content` (string): Document content to analyze

**Returns**: Array of unsupported claims with suggested source types

### SourceValidationEngine

Real-time validation of source accessibility, credibility, and compliance.

**Class**: `SourceValidationEngine`

**Methods**:

#### validateSourceAccessibility(url: string): Promise<AccessibilityStatus>

Validates whether a source URL is accessible and determines access type.

**Parameters**:
- `url` (string): Source URL to validate

**Returns**: Accessibility status with access type and alternatives

**Example**:
```typescript
const engine = new SourceValidationEngine();
const status = await engine.validateSourceAccessibility('https://example.com/report');
```

#### assessSourceCredibility(source: Citation): Promise<CredibilityAssessment>

Assesses the credibility and authority of a citation source.

**Parameters**:
- `source` (Citation): Citation to assess

**Returns**: Credibility assessment with detailed scoring

#### findAlternativeSources(originalSource: Citation): Promise<Citation[]>

Finds alternative sources when original sources are inaccessible or outdated.

**Parameters**:
- `originalSource` (Citation): Original citation to find alternatives for

**Returns**: Array of alternative citations

### QualityAssessmentSystem

Comprehensive evaluation of citation quality and evidence strength.

**Class**: `QualityAssessmentSystem`

**Methods**:

#### assessCitationQuality(citations: Citation[]): Promise<QualityReport>

Evaluates the overall quality of a set of citations.

**Parameters**:
- `citations` (Citation[]): Array of citations to assess

**Returns**: Comprehensive quality report with metrics and recommendations

#### recommendImprovements(qualityReport: QualityReport): Promise<Recommendation[]>

Provides specific recommendations for improving citation quality.

**Parameters**:
- `qualityReport` (QualityReport): Quality assessment report

**Returns**: Array of improvement recommendations

### ConfidenceScoringEngine

Calculates and tracks confidence scores for claims and recommendations.

**Class**: `ConfidenceScoringEngine`

**Methods**:

#### calculateClaimConfidence(claim: string, supportingSources: Citation[]): Promise<ConfidenceScore>

Calculates confidence score for a specific claim based on supporting sources.

**Parameters**:
- `claim` (string): The claim to assess
- `supportingSources` (Citation[]): Sources supporting the claim

**Returns**: Detailed confidence score with breakdown

#### aggregateDocumentConfidence(claimConfidences: ConfidenceScore[]): Promise<DocumentConfidence>

Aggregates confidence scores across all claims in a document.

**Parameters**:
- `claimConfidences` (ConfidenceScore[]): Individual claim confidence scores

**Returns**: Overall document confidence assessment

## Data Models

### Citation

Core citation data structure with enhanced validation and quality metrics.

```typescript
interface Citation {
  id: string;
  title: string;
  url: string;
  publishedDate: Date;
  credibilityRating: 'A' | 'B' | 'C';
  sourceType: CitationSourceType;
  author: string;
  summary: string;
  
  // Enhanced fields
  validationStatus?: {
    lastValidated: Date;
    accessibilityStatus: AccessibilityStatus;
    credibilityAssessment: CredibilityAssessment;
    complianceStatus: ComplianceStatus;
  };
  
  qualityMetrics?: {
    credibilityScore: number;
    relevanceScore: number;
    recencyScore: number;
    methodologyScore: number;
    overallQuality: number;
  };
}
```

### CitationRequirement

Represents a citation need identified by AI analysis.

```typescript
interface CitationRequirement {
  claim: string;
  claimType: 'quantitative' | 'qualitative' | 'comparative';
  evidenceStrength: 'weak' | 'moderate' | 'strong';
  requiredSourceTypes: CitationSourceType[];
  confidenceThreshold: number;
  industryRelevance: string[];
}
```

### ConfidenceScore

Detailed confidence scoring with breakdown and uncertainty factors.

```typescript
interface ConfidenceScore {
  overall: number; // 0-100
  breakdown: {
    sourceQuality: number;
    evidenceStrength: number;
    methodologyClarity: number;
    sampleSizeAdequacy: number;
    recencyFactor: number;
  };
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number; // e.g., 95 for 95% confidence
  };
  uncertaintyFactors: string[];
}
```

### QualityReport

Comprehensive quality assessment report.

```typescript
interface QualityReport {
  overallScore: number; // 0-100
  metrics: {
    sourceCredibility: number;
    evidenceDiversity: number;
    recencyScore: number;
    methodologyTransparency: number;
    sampleSizeAdequacy: number;
  };
  qualityGaps: QualityGap[];
  recommendations: Recommendation[];
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
}
```

## Error Handling

### CitationValidationError

Thrown when citation validation fails.

```typescript
class CitationValidationError extends Error {
  constructor(
    public citationId: string,
    public validationType: 'accessibility' | 'credibility' | 'compliance',
    public details: string,
    public suggestedActions: string[]
  );
}
```

**Example**:
```typescript
try {
  await sourceValidationEngine.validateSourceAccessibility(url);
} catch (error) {
  if (error instanceof CitationValidationError) {
    console.log(`Validation failed for ${error.citationId}: ${error.details}`);
    console.log('Suggested actions:', error.suggestedActions);
  }
}
```

### QualityThresholdError

Thrown when citation quality falls below required thresholds.

```typescript
class QualityThresholdError extends Error {
  constructor(
    public documentType: string,
    public currentQuality: number,
    public requiredQuality: number,
    public improvementSuggestions: string[]
  );
}
```

## Usage Examples

### Basic Citation Enhancement

```typescript
import { AICitationDiscoveryEngine, QualityAssessmentSystem } from 'vibe-pm-agent';

async function enhanceDocumentCitations(content: string) {
  const discoveryEngine = new AICitationDiscoveryEngine();
  const qualitySystem = new QualityAssessmentSystem();
  
  // Analyze citation needs
  const requirements = await discoveryEngine.analyzeCitationNeeds(content);
  
  // Discover relevant sources
  const candidates = await discoveryEngine.discoverRelevantSources(requirements);
  
  // Assess quality
  const citations = candidates.map(c => c.source);
  const qualityReport = await qualitySystem.assessCitationQuality(citations);
  
  return {
    citations,
    qualityReport,
    recommendations: await qualitySystem.recommendImprovements(qualityReport)
  };
}
```

### Source Validation Workflow

```typescript
import { SourceValidationEngine, AuditTrailManager } from 'vibe-pm-agent';

async function validateAndAuditSources(sources: Citation[], documentId: string) {
  const validationEngine = new SourceValidationEngine();
  const auditManager = new AuditTrailManager();
  
  const validationResults = [];
  
  for (const source of sources) {
    try {
      // Validate accessibility
      const accessibility = await validationEngine.validateSourceAccessibility(source.url);
      
      // Assess credibility
      const credibility = await validationEngine.assessSourceCredibility(source);
      
      // Log validation
      await auditManager.logValidationResult(source.url, {
        accessibility,
        credibility
      }, 'comprehensive_validation');
      
      validationResults.push({
        source,
        accessibility,
        credibility,
        isValid: accessibility.isAccessible && credibility.overallScore >= 70
      });
      
    } catch (error) {
      console.error(`Validation failed for ${source.id}:`, error);
      validationResults.push({
        source,
        error: error.message,
        isValid: false
      });
    }
  }
  
  return validationResults;
}
```

### Confidence Scoring

```typescript
import { ConfidenceScoringEngine } from 'vibe-pm-agent';

async function calculateDocumentConfidence(claims: Array<{text: string, sources: Citation[]}>) {
  const scoringEngine = new ConfidenceScoringEngine();
  
  const claimConfidences = [];
  
  for (const claim of claims) {
    const confidence = await scoringEngine.calculateClaimConfidence(
      claim.text,
      claim.sources
    );
    claimConfidences.push(confidence);
  }
  
  const documentConfidence = await scoringEngine.aggregateDocumentConfidence(claimConfidences);
  
  return {
    overallConfidence: documentConfidence.overallConfidence,
    claimBreakdown: claimConfidences,
    weakestClaims: documentConfidence.weakestClaims,
    strongestClaims: documentConfidence.strongestClaims,
    recommendationReliability: documentConfidence.recommendationReliability
  };
}
```

## Best Practices

### Citation Quality Standards

1. **Minimum Confidence Thresholds**:
   - Executive documents: 85%+
   - Business cases: 80%+
   - Market analysis: 75%+
   - General reports: 70%+

2. **Source Diversity Requirements**:
   - Include at least 3 different source types per major claim
   - Balance consulting reports, industry research, and academic sources
   - Avoid over-reliance on single source types

3. **Recency Standards**:
   - Market data: Maximum 12 months old
   - Industry trends: Maximum 18 months old
   - Historical analysis: Maximum 24 months old
   - Regulatory information: Maximum 6 months old

### Performance Optimization

1. **Caching Strategy**:
   - Cache source validation results for 24 hours
   - Cache credibility assessments for 7 days
   - Cache quality reports for 1 hour

2. **Batch Processing**:
   - Process multiple citations in parallel
   - Use batch APIs for external validation services
   - Implement circuit breakers for external dependencies

3. **Error Handling**:
   - Implement graceful degradation for validation failures
   - Provide fallback mechanisms for inaccessible sources
   - Log all errors for monitoring and improvement

### Security Considerations

1. **Data Protection**:
   - Anonymize document content before external API calls
   - Encrypt sensitive audit trail data
   - Implement secure credential management

2. **Access Control**:
   - Implement role-based access for audit trails
   - Restrict compliance report access to authorized users
   - Log all access attempts for security monitoring

3. **Privacy Compliance**:
   - Follow GDPR/CCPA guidelines for data handling
   - Implement data retention policies
   - Provide data deletion capabilities

### Integration Guidelines

1. **MCP Tool Usage**:
   - Always validate input parameters
   - Implement proper error handling and user feedback
   - Use appropriate timeouts for long-running operations

2. **Component Integration**:
   - Initialize components with proper configuration
   - Handle component dependencies correctly
   - Implement proper cleanup and resource management

3. **Testing Strategy**:
   - Write comprehensive unit tests for all components
   - Implement integration tests for MCP tools
   - Include performance tests for large document processing
   - Test error scenarios and edge cases

## Support and Troubleshooting

For additional support and troubleshooting information, see:
- [Enhanced Citation System Troubleshooting Guide](enhanced-citation-system-troubleshooting.md)
- [Best Practices Guide](enhanced-citation-system-best-practices.md)
- [Performance Optimization Guide](enhanced-citation-system-performance.md)