---
inclusion: always
---

# Vibe PM Agent - Product & Development Guidelines

## Product Identity
The **Vibe PM Agent** is an AWS AI-powered MCP server providing strategic business analysis and PM interview preparation. It transforms feature ideas into executive-ready business cases through consulting-grade analysis, answering "WHY to build" questions with data-driven insights, while also serving as a comprehensive PM interview coaching platform using Amazon Bedrock Agent and Nova foundation models.

## Architecture Patterns

### MCP Tool Structure
- Implement tools in `src/mcp/tools/` following the pattern: `{action}_{subject}.ts`
- Each tool must export a handler function with proper TypeScript interfaces
- Use the existing pipeline components for business logic, don't duplicate functionality
- Tools should orchestrate components, not implement core business logic

### Component Organization
- **Analysis Components**: `src/components/{analyzer-name}/index.ts` - Core business logic
- **Pipeline Integration**: `src/pipeline/` - Orchestration and data flow
- **Models**: `src/models/` - TypeScript interfaces and validation schemas
- **Utilities**: `src/utils/` - Shared helpers and validation functions

### Data Flow Pattern
```
User Input → MCP Tool → AWS AI Agent (Bedrock) → Pipeline Component → Business Logic → Formatted Output
```

### AWS AI Agent Architecture
- **Amazon Bedrock Agent**: Core AI orchestration for interview coaching and business analysis
- **Action Groups**: Structured agent actions for question generation, evaluation, and case studies
- **Foundation Models**: Amazon Nova for natural language understanding and generation
- **Knowledge Base**: PM frameworks, interview best practices, and market intelligence

## Code Style & Standards

### TypeScript Conventions
- Use strict typing with interfaces for all data structures
- Implement proper error handling with custom error types
- Include JSDoc comments for all public methods and interfaces
- Use async/await pattern consistently, avoid callback patterns

### Business Analysis Standards
- Always include confidence scores (0-1 scale) for recommendations
- Provide quantitative metrics with proper units and context
- Reference data sources with proper citation formatting
- Structure outputs for executive consumption (executive summary first)

### Output Formatting
- Use markdown for all generated documents
- Include front matter for steering files with proper inclusion rules
- Structure business documents with: Executive Summary → Analysis → Recommendations → Appendix
- Provide actionable next steps in all outputs

## Key Capabilities Implementation

### Business Analysis Tools
- Market opportunity assessment using competitive landscape data
- ROI calculations with sensitivity analysis and scenario modeling
- Strategic alignment scoring against company OKRs and mission
- Resource optimization with cost-benefit analysis

### PM Interview Preparation (NEW)
- **Interactive Interview Chat**: AI-powered practice sessions with personalized feedback using Amazon Bedrock Agent
- **Case Study Helper**: Structured case study practice with framework guidance and real-time market data
- **Company-Specific Preparation**: Tailored interview prep for target companies using AI agent knowledge base
- **Progress Tracking**: Performance analytics and personalized learning paths powered by Amazon Nova
- **Technical Interview Support**: Amazon Q Developer integration for code review and technical PM questions

### Document Generation
- Executive one-pagers: 1-page summary with key metrics and decision framework
- PR-FAQ format: Customer-focused narrative with internal FAQ
- Board presentations: Strategic context with financial projections
- Stakeholder summaries: Role-specific communication with relevant metrics

### Validation & Timing
- Market timing signals using real-time competitive and demand data
- Quick validation framework for rapid go/no-go decisions
- Risk assessment matrix with mitigation strategies

## Development Guidelines

### Error Handling
- Use structured error responses with error codes and user-friendly messages
- Implement graceful degradation when external data sources are unavailable
- Log errors with sufficient context for debugging without exposing sensitive data

### Performance Considerations
- Cache expensive calculations and external API calls
- Use streaming responses for long-running analysis
- Implement timeout handling for external data sources

### Testing Requirements
- Unit tests for all business logic components
- Integration tests for MCP tool workflows
- Mock external data sources in tests
- Include edge case testing for invalid inputs

## Content Standards

### Business Terminology
- Use standard consulting frameworks (SWOT, Porter's Five Forces, BCG Matrix)
- Include industry-standard metrics (TAM, SAM, SOM, LTV, CAC, etc.)
- Reference established business models and competitive positioning

### Data Requirements
- Always cite sources for market data and competitive intelligence
- Include confidence intervals for financial projections
- Provide methodology explanations for complex calculations
- Use real market data when available, clearly mark estimates

### Executive Communication
- Lead with executive summary and key recommendations
- Use bullet points and structured formatting for readability
- Include visual elements (tables, charts) when beneficial
- Provide clear decision criteria and success metrics

## Primary Use Cases

### Business Intelligence (Existing)
1. **Feature Justification**: Market opportunity + competitive analysis + ROI projection
2. **Investment Analysis**: Financial modeling + strategic alignment + risk assessment
3. **Market Validation**: Timing signals + competitive landscape + demand analysis
4. **Resource Planning**: Cost optimization + team allocation + timeline analysis
5. **Stakeholder Communication**: Executive summaries + board materials + team alignment

### PM Interview Preparation (NEW)
6. **Interview Practice**: AI-powered chat sessions with behavioral, product sense, and analytical questions
7. **Case Study Coaching**: Structured practice with product design, strategy, and market entry cases
8. **Company-Specific Prep**: Tailored preparation for Google, Amazon, Meta, Microsoft, and other tech companies
9. **Technical PM Training**: Code review scenarios and technical product decision frameworks
10. **Performance Analytics**: Progress tracking, skill assessment, and personalized improvement recommendations

### AWS AI Agent Features
- **Multi-Agent Orchestration**: Specialized agents for different interview types and business analysis
- **Real-Time Adaptation**: AI agents adapt difficulty and focus based on user performance
- **Knowledge Integration**: Seamless integration of market intelligence with interview scenarios
- **Scalable Deployment**: AWS cloud infrastructure supporting concurrent users globally