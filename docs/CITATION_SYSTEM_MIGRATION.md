# Citation System Migration Guide

This guide covers the migration from the three separate citation tools to the unified citation system.

## Overview

The citation system has been consolidated from three separate tools into a single unified tool that provides all the same functionality with improved efficiency and consistency.

### Previous Tools (Deprecated)

1. **enhance_citations** - Enhanced content with citations and quality assessment
2. **validate_and_audit_citations** - Validated existing citations for quality and compliance  
3. **trusted_citation_scraper** - Scraped authoritative sources for high-confidence citations

### New Unified Tool

**unified_citation_system** - Single tool with multiple operation modes that combines all previous functionality

## Migration Mapping

### Operation Modes

The unified tool uses operation modes to replicate the functionality of the previous tools:

| Previous Tool | New Operation Mode | Description |
|---------------|-------------------|-------------|
| `enhance_citations` | `enhance_content` | Add citations to existing content |
| `validate_and_audit_citations` | `validate_citations` | Audit existing citations for quality |
| `trusted_citation_scraper` | `discover_sources` | Find new trusted sources |
| N/A | `comprehensive` | Full workflow combining all operations |

### Parameter Migration

#### enhance_citations → enhance_content mode

```typescript
// OLD
{
  "tool": "enhance_citations",
  "document_content": "...",
  "document_type": "business_case",
  "enhancement_options": { ... },
  "citation_options": { ... }
}

// NEW
{
  "tool": "unified_citation_system",
  "operation_mode": "enhance_content",
  "document_content": "...",
  "document_type": "business_case",
  "enhancement_options": { ... },
  "citation_options": { ... }
}
```

#### validate_and_audit_citations → validate_citations mode

```typescript
// OLD
{
  "tool": "validate_and_audit_citations",
  "citations": [...],
  "document_content": "...",
  "validation_options": { ... },
  "audit_options": { ... }
}

// NEW
{
  "tool": "unified_citation_system",
  "operation_mode": "validate_citations",
  "existing_citations": [...],
  "document_content": "...",
  "validation_options": { ... },
  "report_options": { ... }
}
```

#### trusted_citation_scraper → discover_sources mode

```typescript
// OLD
{
  "tool": "trusted_citation_scraper",
  "query": "AI adoption in healthcare",
  "industry": "healthcare",
  "max_results": 6,
  "minimum_confidence": "medium"
}

// NEW
{
  "tool": "unified_citation_system",
  "operation_mode": "discover_sources",
  "search_query": "AI adoption in healthcare",
  "citation_options": {
    "industry_focus": "healthcare",
    "max_sources": 6,
    "minimum_confidence": "medium"
  }
}
```

## New Comprehensive Mode

The unified system introduces a new `comprehensive` mode that combines all operations:

```typescript
{
  "tool": "unified_citation_system",
  "operation_mode": "comprehensive",
  "document_content": "Content to enhance...",
  "existing_citations": [...], // Optional existing citations to validate
  "search_query": "Additional sources query", // Optional query for new sources
  "document_type": "business_case",
  "citation_options": { ... },
  "validation_options": { ... },
  "enhancement_options": { ... },
  "report_options": { ... }
}
```

## Benefits of Migration

### 1. Reduced Complexity
- Single tool instead of three separate tools
- Consistent parameter structure across all operations
- Unified error handling and logging

### 2. Improved Efficiency
- Shared components reduce overhead
- Better caching and resource utilization
- Streamlined processing pipeline

### 3. Enhanced Functionality
- Comprehensive mode combines all operations
- Better integration between citation discovery, validation, and enhancement
- Consistent quality assessment across all modes

### 4. Better User Experience
- Single tool to learn instead of three
- Consistent response format
- Unified documentation and examples

## Code Examples

### Basic Content Enhancement

```typescript
import { unifiedCitationSystem } from '../mcp/tools/unified_citation_system';

const result = await unifiedCitationSystem({
  operation_mode: 'enhance_content',
  document_content: 'Your business case content here...',
  document_type: 'business_case',
  citation_options: {
    minimum_citations: 5,
    citation_style: 'business',
    include_bibliography: true
  },
  enhancement_options: {
    identify_unsupported_claims: true,
    suggest_additional_sources: true,
    perform_quality_assessment: true
  }
}, context);
```

### Citation Validation

```typescript
const result = await unifiedCitationSystem({
  operation_mode: 'validate_citations',
  existing_citations: [
    {
      id: '1',
      title: 'Market Research Report',
      url: 'https://example.com/report',
      source_type: 'research_report',
      confidence: 'high'
    }
    // ... more citations
  ],
  validation_options: {
    check_accessibility: true,
    assess_credibility: true,
    find_alternatives: true
  },
  report_options: {
    include_quality_metrics: true,
    include_recommendations: true
  }
}, context);
```

### Source Discovery

```typescript
const result = await unifiedCitationSystem({
  operation_mode: 'discover_sources',
  search_query: 'SaaS customer churn reduction strategies',
  citation_options: {
    industry_focus: 'saas',
    max_sources: 8,
    minimum_confidence: 'high',
    include_market_feeds: true
  },
  validation_options: {
    check_accessibility: true,
    assess_credibility: true
  }
}, context);
```

### Comprehensive Workflow

```typescript
const result = await unifiedCitationSystem({
  operation_mode: 'comprehensive',
  document_content: 'Your content to enhance...',
  search_query: 'Additional research needed',
  existing_citations: [...], // Optional existing citations
  document_type: 'market_analysis',
  citation_options: {
    minimum_citations: 6,
    citation_style: 'business',
    industry_focus: 'fintech'
  },
  validation_options: {
    minimum_quality_threshold: 80,
    required_diversity_score: 70
  },
  enhancement_options: {
    identify_unsupported_claims: true,
    suggest_additional_sources: true
  },
  report_options: {
    report_format: 'detailed',
    generate_evidence_report: true
  }
}, context);
```

## Response Format

The unified tool provides a consistent response format across all modes:

```typescript
interface UnifiedCitationResult {
  operation_mode: CitationOperationMode;
  enhanced_content?: string;           // For enhance_content and comprehensive
  discovered_citations?: Citation[];   // For discover_sources and comprehensive
  validation_results?: ValidationResult[]; // For validate_citations and comprehensive
  quality_report?: QualityReport;
  metrics?: CitationMetrics;
  bibliography?: string;
  evidence_report?: {
    evidence_strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
    key_findings: string[];
    critical_gaps: string[];
    improvement_priorities: string[];
    alternative_sources: Citation[];
  };
  summary: {
    total_citations_processed: number;
    citations_discovered: number;
    citations_validated: number;
    validation_success_rate: number;
    overall_quality_score: number;
    compliance_status: 'compliant' | 'warning' | 'non_compliant';
    processing_time_ms: number;
  };
  recommendations?: string[];
}
```

## Backward Compatibility

### Existing Integrations

The `CitationIntegration` utility class continues to work as before, so existing integrations in other tools (like `generate_management_onepager`) remain functional without changes.

### Gradual Migration

You can migrate gradually by:

1. **Phase 1**: Update new code to use the unified tool
2. **Phase 2**: Update existing integrations when convenient
3. **Phase 3**: Remove deprecated tool files (optional)

### Legacy Support

The old tool files remain in the codebase but are no longer registered in the MCP tool registry. They can be removed once all integrations are migrated.

## Testing Migration

### Unit Tests

Update unit tests to use the new unified tool:

```typescript
// OLD
import { enhanceCitations } from '../mcp/tools/enhance_citations';

// NEW
import { unifiedCitationSystem } from '../mcp/tools/unified_citation_system';

// Update test calls
const result = await unifiedCitationSystem({
  operation_mode: 'enhance_content',
  // ... other parameters
}, mockContext);
```

### Integration Tests

Test all operation modes to ensure functionality parity:

```typescript
describe('Unified Citation System Migration', () => {
  test('enhance_content mode matches old enhance_citations', async () => {
    // Test implementation
  });
  
  test('validate_citations mode matches old validate_and_audit_citations', async () => {
    // Test implementation
  });
  
  test('discover_sources mode matches old trusted_citation_scraper', async () => {
    // Test implementation
  });
  
  test('comprehensive mode provides integrated workflow', async () => {
    // Test implementation
  });
});
```

## Troubleshooting

### Common Migration Issues

1. **Parameter Name Changes**
   - `citations` → `existing_citations`
   - `query` → `search_query`
   - `audit_options` → `report_options`

2. **Response Structure Changes**
   - All responses now include a `summary` object
   - Operation mode is included in the response
   - Consistent naming across all modes

3. **Error Handling**
   - Unified error messages and codes
   - Consistent validation across all modes
   - Better error context and debugging information

### Performance Considerations

The unified tool may have slightly different performance characteristics:

- **Better**: Shared component initialization, better caching
- **Similar**: Individual operation performance should be equivalent
- **Comprehensive Mode**: May be slower due to multiple operations, but more efficient than calling separate tools

## Support

For migration assistance:

1. Check the unified tool schema for parameter requirements
2. Review the examples in this guide
3. Test with small datasets first
4. Monitor logs for any migration issues

The unified citation system provides all the functionality of the previous tools with improved consistency, efficiency, and user experience.