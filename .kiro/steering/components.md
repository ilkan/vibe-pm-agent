---
inclusion: always
---

# Component Architecture Guidelines

## Architecture Pattern

**Modular Pipeline**: `Input → Intent Analysis → Business Analysis → Market Validation → Optimization → Output Generation`

## Component Structure

### Standard Pattern
```typescript
export class ComponentName {
  constructor(private config: ComponentConfig) {}
  
  async process(input: InputType): Promise<OutputType> {
    // Implementation with proper error handling
  }
}
```

### File Organization
- Components: `src/components/{component-name}/index.ts`
- MCP Tools: `src/mcp/tools/{action}_{subject}.ts`
- Models: `src/models/{domain}.ts`
- Tests: `src/tests/unit/{component-name}.test.ts`

## Key Components

### ✅ Core MCP Tools (27 WORKING TOOLS)

#### Business Analysis Suite
- **analyze_business_opportunity** - Market opportunity assessment with competitive analysis
- **assess_strategic_alignment** - Strategic alignment scoring against OKRs and mission
- **validate_market_timing** - Market timing validation with confidence scoring
- **optimize_resource_allocation** - Resource optimization with cost-benefit analysis
- **monitor_market_conditions** - Real-time market monitoring and trend analysis

#### Document Generation Suite  
- **generate_business_case** - Comprehensive business cases with ROI analysis
- **create_stakeholder_communication** - Executive communications (one-pagers, PR-FAQs, presentations)
- **generate_management_onepager** - Executive summaries with key metrics
- **generate_pr_faq** - Amazon Working Backwards PR-FAQ format
- **generate_requirements** - Business requirements with MoSCoW prioritization
- **generate_design_options** - Multiple design approaches with impact analysis
- **generate_task_plan** - Implementation task plans with effort estimation

#### Research & Citation Suite
- **unified_citation_system** - Professional citation management with credibility scoring
- **aws_docs_search** - AWS documentation search and retrieval
- **aws_docs_read** - AWS documentation reading with context
- **aws_contextual_info** - Contextual AWS service information
- **aws_code_generator** - AWS SDK code generation
- **aws_best_practices** - AWS best practices recommendations

#### Enhanced Analysis Suite
- **analyze_business_opportunity_enhanced** - Enhanced opportunity analysis with authoritative sources
- **validate_idea_quick** - Quick validation framework for go/no-go decisions
- **analyze_competitor_landscape** - Competitive analysis and positioning
- **calculate_market_sizing** - TAM/SAM/SOM market sizing calculations

### Core Pipeline Components
- **Business Analyzer**: Consulting frameworks (SWOT, Porter's Five Forces, BCG Matrix)
- **Market Analyzer**: TAM/SAM/SOM sizing and competitive intelligence
- **PM Document Generator**: Executive documents using Pyramid Principle
- **Amazon Mode Manager**: Working Backwards methodology (PR-FAQ → Assumptions → Hard Questions)
- **Consulting Summary Generator**: Strategic summaries with actionable recommendations

## Development Rules

### ✅ MCP Tool Implementation (VALIDATED)
- Follow `{action}_{subject}.ts` naming convention ✅
- Export handler functions with proper TypeScript interfaces ✅
- Export schema and description for tool registration ✅
- Include confidence scores and metadata in all outputs ✅
- All 27 tools properly registered and tested ✅

### Tool Registration Pattern (WORKING)
```typescript
// Each tool must export:
export const toolNameSchema = { /* JSON schema */ };
export const toolNameDescription = "Tool description";
export async function toolName(args: ToolArgs): Promise<ToolResult> {
  // Implementation
}

// Then register in MCP_TOOLS_REGISTRY
export const MCP_TOOLS_REGISTRY = {
  tool_name: {
    handler: toolName,
    schema: toolNameSchema,
    description: toolNameDescription,
  },
};
```

### Business Analysis Standards
- Structure outputs: Executive Summary → Analysis → Recommendations → Appendix
- Include quantitative metrics with units and context
- Always cite sources with proper attribution
- Provide actionable next steps

### Error Handling
```typescript
class ComponentError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
  }
}
```

### Output Formatting
- Use markdown for generated documents
- Include YAML front matter for steering files
- Lead with executive summary
- Use bullet points and tables for readability

## Kiro Resource Optimizer

### Core Capabilities
- **Vibe Mode**: Rapid iteration, debugging, real-time collaboration
- **Spec Mode**: Comprehensive development with documentation and stakeholder alignment
- **ROI Analysis**: Development velocity, code quality metrics, cost savings
- **Resource Planning**: Consumption forecasting, efficiency factors, multi-scenario analysis

## Integration Requirements

### Amazon Working Backwards
- Use `amazon-mode-manager` for Working Backwards workflows
- Follow sequence: PR-FAQ → Assumptions Ledger → Hard Questions
- Apply Amazon-specific templates and validation

### Citation System
- All analysis requires proper source attribution
- Use `enhanced-citation-system` for comprehensive citations
- Validate source credibility and freshness
- Maintain audit trails

### Performance
- Cache expensive calculations and external API calls
- Use streaming responses for long-running analysis
- Implement timeout handling for external data sources

## Testing Requirements

### Component Testing
- Unit tests for all business logic
- Integration tests for MCP workflows
- Mock external data sources
- Include edge case testing

### Performance Testing
- Benchmark processing time and memory usage
- Test with realistic data volumes
- Validate caching effectiveness

## Development Workflow

### New Components
1. Create in `src/components/{component-name}/index.ts`
2. Add corresponding test file
3. Update models for new data structures
4. Document APIs with JSDoc
5. Follow TypeScript strict mode

### MCP Tools
1. Implement in `src/mcp/tools/{action}_{subject}.ts`
2. Use existing pipeline components
3. Include proper error handling and validation
4. Add integration tests

### Business Analysis
1. Start with intent interpretation
2. Apply appropriate consulting frameworks
3. Include market validation when relevant
4. Generate executive-ready outputs
5. Provide clear next steps