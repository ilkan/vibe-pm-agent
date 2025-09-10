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

### Core Pipeline
- **Intent Interpreter**: Natural language → structured requirements
- **Business Analyzer**: Consulting frameworks (SWOT, Porter's Five Forces, BCG Matrix)
- **Workflow Optimizer**: Efficiency analysis and optimization strategies
- **Kiro Resource Optimizer**: 🚀 **FLAGSHIP** - Vibe/Spec mode optimization, 3.2x velocity improvements
- **Spec Generator**: Analysis → Kiro specifications

### Document Generation
- **PM Document Generator**: Executive documents using Pyramid Principle
- **Amazon Mode Manager**: Working Backwards methodology (PR-FAQ → Assumptions → Hard Questions)
- **Consulting Summary Generator**: Strategic summaries

### Market Analysis
- **Market Analyzer**: TAM/SAM/SOM sizing
- **Competitor Analyzer**: Competitive landscape analysis
- **Market Condition Detector**: Timing signals

## Development Rules

### MCP Tool Implementation
- Follow `{action}_{subject}.ts` naming convention
- Export handler functions with TypeScript interfaces
- Orchestrate existing components, don't duplicate logic
- Include confidence scores (0-1 scale) in all outputs

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