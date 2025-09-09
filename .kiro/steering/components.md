---
inclusion: always
---

# Component Architecture Guidelines

## Core System Architecture

The Vibe PM Agent follows a **modular pipeline architecture** with 43+ specialized components organized into distinct layers:

### Pipeline Flow
```
Input → Intent Analysis → Business Analysis → Market Validation → Optimization → Output Generation
```

### Component Categories

#### 1. Core Pipeline Components (5 components)
- **Intent Interpreter**: Converts natural language to structured business requirements
- **Business Analyzer**: Applies consulting frameworks (MECE, Value Driver Tree, Zero-Based Design)
- **Workflow Optimizer**: Identifies inefficiencies and applies optimization strategies
- **Kiro Resource Optimizer**: 🚀 **FLAGSHIP COMPONENT** - Advanced resource planning specifically designed for Kiro Vibe and Spec modes with intelligent consumption forecasting, comprehensive ROI analysis, and Vibe Coding efficiency metrics. Provides 3.2x development velocity improvements and detailed business impact calculations.
- **Spec Generator**: Converts analysis into Kiro-compatible specifications

#### 2. PM Document Generation (4 components)
- **PM Document Generator**: Creates executive-ready documents using Pyramid Principle
- **Amazon Mode Manager**: Orchestrates Working Backwards methodology
- **Amazon Template Processor**: Handles Amazon-specific document templates
- **Consulting Summary Generator**: Produces consulting-grade strategic summaries

#### 3. Market Analysis (4 components)
- **Market Analyzer**: TAM/SAM/SOM sizing with multiple methodologies
- **Competitor Analyzer**: Competitive landscape and positioning analysis
- **Competitive Intelligence Updater**: Maintains current competitive data
- **Market Condition Detector**: Monitors market timing signals

#### 4. Kiro Integration (7 components)
- **Steering File Generator/Manager/Templates/Utilities**: Complete steering file lifecycle
- **Steering Service/User Interaction/Preview**: Service layer and user experience

## Development Guidelines

### Component Structure
```typescript
// Standard component pattern
export class ComponentName {
  constructor(private config: ComponentConfig) {}
  
  async process(input: InputType): Promise<OutputType> {
    // Implementation with proper error handling
  }
}
```

### MCP Tool Implementation
- Tools in `src/mcp/tools/` follow `{action}_{subject}.ts` naming
- Each tool exports a handler function with TypeScript interfaces
- Tools orchestrate components, don't duplicate business logic
- Always include confidence scores (0-1 scale) in outputs

### Business Analysis Standards
- Use consulting frameworks: SWOT, Porter's Five Forces, BCG Matrix
- Include quantitative metrics with proper units and context
- Structure outputs: Executive Summary → Analysis → Recommendations → Appendix
- Provide actionable next steps in all outputs

### Data Quality Requirements
- Always cite sources with proper attribution
- Include confidence intervals for financial projections
- Validate data freshness and reliability
- Use real market data when available, clearly mark estimates

### Error Handling Pattern
```typescript
// Custom error classes with context
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
- Use markdown for all generated documents
- Include YAML front matter for steering files
- Structure business documents with executive summary first
- Use bullet points and tables for readability

## Kiro Resource Optimizer - Flagship Component

### Core Capabilities
The **Kiro Resource Optimizer** is the cornerstone component specifically designed for Kiro's unique development modes:

#### Vibe Coding ROI Analysis
- **Development Velocity**: 3.2x faster coding with comprehensive time-to-market calculations
- **Code Quality Metrics**: Bug reduction, test coverage improvements, maintainability scoring
- **Developer Productivity**: Daily task completion rates, burnout reduction, learning acceleration
- **Business Impact**: Feature delivery rates, customer satisfaction gains, competitive advantage scoring
- **Cost Savings**: Developer hours saved, infrastructure cost reduction, maintenance savings

#### Kiro Mode Optimization
- **Vibe Mode**: Optimized for rapid iteration, debugging, exploratory coding, and real-time collaboration
- **Spec Mode**: Comprehensive feature development with documentation, stakeholder alignment, and long-term maintainability
- **Hybrid Approach**: Intelligent vibe/spec ratio recommendations based on workflow complexity and business needs

#### Advanced Resource Planning
- Kiro-specific efficiency factors based on real usage patterns
- Intelligent consumption forecasting with confidence scoring
- Zero-based optimization leveraging full Kiro capabilities
- Multi-scenario savings analysis with risk assessment

### Integration with Business Analysis
- Seamlessly integrates with Business Analyzer for comprehensive ROI calculations
- Provides quantitative backing for strategic recommendations
- Enables data-driven decision making for Kiro adoption and optimization

## Key Integration Points

### Amazon Working Backwards
- Use `amazon-mode-manager` for Working Backwards workflows
- Follow PR-FAQ → Assumptions Ledger → Hard Questions sequence
- Apply Amazon-specific templates and validation

### Citation System
- All analysis must include proper source attribution
- Use `enhanced-citation-system` for comprehensive citations
- Validate source credibility and freshness
- Maintain audit trails for all data sources

### Performance Considerations
- Cache expensive calculations and external API calls
- Use streaming responses for long-running analysis
- Implement timeout handling for external data sources
- Monitor component performance and resource usage

## Component Dependencies

### Core Dependencies
- Intent Interpreter → Business Analyzer → Workflow Optimizer → Kiro Resource Optimizer → Spec Generator
- Market Analyzer ↔ Competitor Analyzer (bidirectional data sharing)
- All components → Citation System (for source attribution)

### Quality Assurance Flow
- All outputs → Quality Assessment System → Confidence Scoring Engine
- Data inputs → Source Validation Engine → Enhanced Citation System

### Security Layer
- Sensitive data → Data Anonymization Service
- External APIs → Secure Credential Manager
- Documents → Secure Document Handler

## Testing Requirements

### Component Testing
- Unit tests for all business logic components
- Integration tests for MCP tool workflows
- Mock external data sources in tests
- Include edge case testing for invalid inputs

### Performance Testing
- Benchmark processing time and memory usage
- Test with realistic data volumes
- Validate caching effectiveness
- Monitor resource consumption patterns

## Usage Patterns

### For New Components
1. Create in `src/components/{component-name}/index.ts`
2. Add corresponding test file
3. Update models if adding new data structures
4. Document public APIs with JSDoc comments
5. Follow TypeScript strict mode requirements

### For MCP Tools
1. Implement in `src/mcp/tools/{action}_{subject}.ts`
2. Use existing pipeline components for business logic
3. Include proper error handling and validation
4. Add integration tests for complete workflows

### For Business Analysis
1. Always start with intent interpretation
2. Apply appropriate consulting frameworks
3. Include market validation when relevant
4. Generate executive-ready outputs
5. Provide clear next steps and recommendations