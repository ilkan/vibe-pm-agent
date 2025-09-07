# Vibe PM Agent - Evidence-Backed Business Intelligence MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

> **🏆 Code with Kiro Hackathon 2025 Submission**  
> Kiro's missing "PM Mode" that completes the development trinity by answering "WHY to build" questions with professional consulting-grade business analysis.

## 🎯 What is Vibe PM Agent?

Vibe PM Agent provides the missing "PM Mode" for Kiro, completing the development trinity:

- **PM Mode** (vibe-pm-agent): **WHY to build** - business justification and strategy
- **Spec Mode** (Kiro native): **WHAT to build** - requirements and specifications  
- **Vibe Mode** (Kiro native): **HOW to build** - implementation and code generation

Transform raw developer ideas into comprehensive business cases, strategic analysis, and executive-ready communications that justify technical decisions with professional consulting-grade analysis.

## ✨ Key Features

- 📊 **Business Intelligence MCP Tools**: Comprehensive market validation and strategic analysis
- 📈 **Evidence-Backed Analysis**: All outputs include citations, confidence scoring, and source validation
- 🎯 **Executive Communications**: Generate management one-pagers, PR-FAQs, and board presentations
- ⚡ **Quick Validation**: Fast go/no-go decisions with supporting evidence
- 🔄 **Automated Executive Intelligence**: Process CEO queries and generate professional responses
- 📋 **PM Document Generation**: Requirements, design options, and task plans with MoSCoW prioritization

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn**
- **Kiro IDE** (for full integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/vibe-pm-agent.git
   cd vibe-pm-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests to verify installation**
   ```bash
   npm test
   ```

### Running the MCP Server

#### Server Startup Options

**Option 1: Production mode**
```bash
npm run mcp:server
# Starts server on stdio transport for MCP client connections
```

**Option 2: Development mode with auto-reload**
```bash
npm run dev
# Starts with TypeScript compilation and auto-reload on file changes
```

**Option 3: Debug mode with verbose logging**
```bash
npm run mcp:server:debug
# Starts with debug-level logging for troubleshooting
```

**Option 4: Direct execution**
```bash
npx vibe-pm-agent
# Direct execution for testing and validation
```

#### Server Configuration

The MCP server supports various configuration options:

**Environment Variables:**
```bash
LOG_LEVEL=debug          # Logging level: debug, info, warn, error
MCP_TRANSPORT=stdio      # Transport type: stdio (default)
CITATION_CACHE_TTL=3600  # Citation cache TTL in seconds
MAX_CONCURRENT_TOOLS=5   # Maximum concurrent tool executions
ENABLE_STREAMING=true    # Enable response streaming
```

**Server Capabilities:**
- **Transport**: Standard I/O (stdio) for MCP protocol communication
- **Tools**: 15+ business intelligence and PM workflow tools
- **Resources**: 5 unique datasets with competitive intelligence
- **Prompts**: 5 customizable prompt templates
- **Streaming**: Real-time response streaming for large analyses
- **Logging**: Configurable logging levels with structured output
- **Error Handling**: Comprehensive error handling with recovery strategies

#### Connection Testing

**Test server connectivity:**
```bash
# Test basic server startup
npm run mcp:test

# Test specific tool functionality
node demo/test-mcp-server.js analyze_business_opportunity

# Validate all tools
node demo/test-demo-suite.js
```

**Kiro Integration:**
```json
{
  "mcpServers": {
    "vibe-pm-agent": {
      "command": "node",
      "args": ["dist/mcp/server.js"],
      "cwd": "/path/to/vibe-pm-agent",
      "env": {
        "LOG_LEVEL": "info",
        "ENABLE_STREAMING": "true"
      }
    }
  }
}
```

The MCP server will start and be available for connections from Kiro or other MCP clients using the Model Context Protocol.

## 🧪 Testing Instructions for Judges

### 1. Verify Installation
```bash
# Install and build
npm install && npm run build

# Run all tests
npm test

# Verify MCP server starts
npm run mcp:server
```

### 2. Test Core Functionality

**Test Business Opportunity Analysis:**
```bash
node demo/test-mcp-server.js analyze_business_opportunity
```

**Test Executive Intelligence:**
```bash
node demo/test-mcp-server.js process_executive_query
```

**Test PM Document Generation:**
```bash
node demo/test-mcp-server.js generate_management_onepager
```

### 3. Interactive Demo

**RECOMMENDED: Complete PM Workflow Demo**
```bash
cd demo/ai-code-review-assistant
node run-complete-workflow.js   # Full PM workflow with 6 new tools
./show-analysis.sh             # View business analysis results
```
**Generates**: Business opportunity → Business case (300% ROI) → Executive one-pager → Market timing → Strategic alignment → Resource optimization

**Alternative: Citation Integration Demo**
```bash
cd demo/ai-customer-support
node test-citations.js          # New PM tools with citations
node test-enhanced-tools.js     # Enhanced existing tools
./show-results.sh              # View all results
```
**Generates**: 6 professional documents with 25+ citations from McKinsey, Gartner, BCG, HBR, PwC

**Traditional Demo Runner**
```bash
npm run demo
```

This will demonstrate:
- Complete PM workflow from opportunity to execution plan
- Business opportunity analysis with market validation
- ROI projections with comparable company data
- Executive communication generation
- Citation management and confidence scoring

### 4. Kiro Integration Test

If you have Kiro installed:
1. Add vibe-pm-agent to your MCP configuration
2. Test the tools directly in Kiro
3. See `KIRO_USAGE.md` for detailed integration examples

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with auto-reload
npm run build           # Build TypeScript to JavaScript
npm run type-check      # Run TypeScript type checking

# Testing
npm test               # Run all tests
npm run test:unit      # Run unit tests only
npm run test:integration # Run integration tests only

# Cleanup (removes test artifacts)
npm run cleanup        # Clean up test artifacts
npm run cleanup:verbose # Clean with detailed output
npm run cleanup:dry-run # Preview what would be cleaned
npm run test:watch     # Run tests in watch mode

# MCP Server
npm run mcp:server     # Start MCP server
npm run mcp:test       # Test MCP server functionality

# Code Quality
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues automatically
npm run format         # Format code with Prettier

# Demo and Examples
npm run demo           # Run comprehensive demo
npm run demo:citations # Test citation integration
npm run demo:enhanced  # Test enhanced business tools
```

### Project Structure

```
src/
├── components/              # Core business intelligence components
│   ├── business-analyzer/   # Market analysis and strategic assessment
│   ├── pm-document-generator/ # Executive communications generation
│   ├── citation-service/    # Evidence compilation and validation
│   └── ...
├── mcp/                    # MCP Server implementation
│   ├── server.ts          # Main MCP server
│   ├── server-config.ts   # Server configuration
│   └── tools/             # MCP tool handlers
├── models/                 # TypeScript interfaces and data structures
├── pipeline/              # Business intelligence pipeline
├── utils/                 # Shared utilities
└── tests/                 # Comprehensive test suite
```

## 🔧 MCP Server Features

### MCP Protocol Implementation

The Vibe PM Agent implements a comprehensive MCP (Model Context Protocol) server with the following features:

- **🛠️ Tools**: 15+ business intelligence and PM workflow tools
- **📚 Resources**: Access to unique datasets and competitive intelligence
- **📝 Prompts**: Customizable prompt templates for consistent output quality
- **🔄 Streaming**: Real-time response streaming for large analyses
- **🎯 Context Management**: Intelligent context handling and steering file integration

### MCP Tools Reference

#### Core Business Intelligence Tools

| Tool Name | Description | Required Parameters | Optional Parameters | Output Format |
|-----------|-------------|-------------------|-------------------|---------------|
| **`analyze_business_opportunity`** | Market validation and strategic fit assessment with competitive intelligence | `feature_idea` (string) | `market_context`, `analysis_depth`, `citation_options`, `steering_options` | JSON with citations |
| **`generate_business_case`** | Multi-scenario ROI analysis with risk assessment | `opportunity_analysis` (string) | `financial_inputs`, `citation_options`, `steering_options` | JSON with financial projections |
| **`create_stakeholder_communication`** | Executive communications generation | `business_case` (string), `communication_type` (enum), `audience` (enum) | `citation_options`, `steering_options` | Formatted document |
| **`assess_strategic_alignment`** | Company OKR and mission alignment evaluation | `feature_concept` (string) | `company_context`, `citation_options`, `steering_options` | JSON alignment score |
| **`validate_market_timing`** | Market timing and competitive window analysis | `feature_idea` (string) | `market_signals`, `citation_options` | JSON timing assessment |
| **`optimize_resource_allocation`** | Development efficiency and cost optimization | `current_workflow` (object) | `resource_constraints`, `optimization_goals`, `citation_options` | JSON optimization plan |

#### PM Workflow Tools

| Tool Name | Description | Required Parameters | Optional Parameters | Output Format |
|-----------|-------------|-------------------|-------------------|---------------|
| **`generate_requirements`** | PM-grade requirements with MoSCoW prioritization | `raw_intent` (string) | `context`, `steering_options` | Structured requirements |
| **`generate_design_options`** | Conservative/Balanced/Bold design alternatives | `requirements` (string) | `steering_options` | Design options matrix |
| **`generate_task_plan`** | Phased implementation plan with guardrails | `design` (string) | `limits`, `steering_options` | Task breakdown |
| **`generate_management_onepager`** | Executive one-pager using Pyramid Principle | `requirements` (string), `design` (string) | `roi_inputs`, `steering_options` | Executive summary |
| **`generate_pr_faq`** | Amazon-style PR-FAQ document | `requirements` (string), `design` (string) | `target_date`, `steering_options` | PR-FAQ format |

#### Legacy Workflow Tools

| Tool Name | Description | Required Parameters | Optional Parameters | Output Format |
|-----------|-------------|-------------------|-------------------|---------------|
| **`optimize_intent`** | Intent optimization with quota analysis | `intent` (string) | `parameters` | Optimized workflow |
| **`analyze_workflow`** | Workflow analysis using consulting frameworks | `workflow` (object) | `techniques` | Analysis report |
| **`generate_roi_analysis`** | ROI analysis with multiple scenarios | `workflow` (object) | `optimized_workflow`, `zero_based_solution` | Financial analysis |
| **`get_consulting_summary`** | Consulting-grade summary generation | `analysis` (object) | `techniques` | Executive summary |
| **`validate_idea_quick`** | Quick idea validation and feasibility check | `idea` (string) | `context` | Validation report |

### MCP Resources

The server provides access to unique datasets and competitive intelligence:

#### Available Resources

| Resource URI | Description | Content Type | Access Method |
|--------------|-------------|--------------|---------------|
| **`dataset://competitive-intelligence`** | Competitive intelligence matrix with market positioning | CSV/JSON | Read-only |
| **`dataset://market-timing-signals`** | Industry trend analysis and competitive windows | CSV/JSON | Read-only |
| **`dataset://pm-innovation-index`** | Product management best practices and benchmarks | CSV/JSON | Read-only |
| **`dataset://quota-optimization-metrics`** | Development efficiency and resource allocation data | CSV/JSON | Read-only |
| **`dataset://stakeholder-adoption-rates`** | User adoption patterns and satisfaction metrics | CSV/JSON | Read-only |

#### Resource Usage Example

```typescript
// Access competitive intelligence data
const competitiveData = await mcpClient.readResource({
  uri: "dataset://competitive-intelligence"
});

// Use in business opportunity analysis
const analysis = await mcpClient.callTool("analyze_business_opportunity", {
  feature_idea: "AI-powered code review assistant",
  market_context: {
    industry: "Developer Tools",
    competition: competitiveData.companies
  }
});
```

### MCP Prompts

Customizable prompt templates for consistent, high-quality outputs:

#### Available Prompts

| Prompt Name | Description | Variables | Usage |
|-------------|-------------|-----------|-------|
| **`requirements_generation`** | PM requirements template with MoSCoW prioritization | `{raw_intent}`, `{context}`, `{constraints}` | Requirements generation |
| **`design_options_generation`** | Design alternatives template with Impact vs Effort | `{requirements}`, `{constraints}` | Design options |
| **`task_plan_generation`** | Implementation planning with phases and guardrails | `{design}`, `{limits}`, `{timeline}` | Task planning |
| **`executive_onepager_generation`** | Executive summary using Pyramid Principle | `{requirements}`, `{design}`, `{roi}` | Executive communications |
| **`pr_faq_generation`** | Amazon-style PR-FAQ template | `{requirements}`, `{design}`, `{date}` | Product announcements |

#### Prompt Customization

```typescript
// Custom prompt template location
const promptPath = '.kiro/steering/prompts/requirements_generation.md';

// Template variables
const template = `
# Requirements Generation Template

## Business Goal
Extract the core business goal from: {raw_intent}

## Context Analysis
Consider the following context: {context}

## MoSCoW Prioritization
- Must Have: Critical requirements
- Should Have: Important but not critical
- Could Have: Nice to have features
- Won't Have: Out of scope for this iteration
`;
```

### Parameter Specifications

#### Common Parameter Types

**Citation Options** (used across multiple tools):
```typescript
{
  include_citations: boolean,        // Include professional citations
  minimum_citations: number,         // Minimum citation count (1-20)
  minimum_confidence: "low"|"medium"|"high", // Required confidence level
  citation_style: "business"|"apa"|"inline", // Citation formatting
  include_bibliography: boolean,     // Include bibliography section
  max_citation_age_months: number   // Maximum citation age (6-60 months)
}
```

**Steering Options** (used across multiple tools):
```typescript
{
  create_steering_files: boolean,    // Create steering files from output
  feature_name: string,              // Feature name for organization
  inclusion_rule: "always"|"fileMatch"|"manual", // Context inclusion
  file_match_pattern: string,        // Pattern for fileMatch rule
  overwrite_existing: boolean        // Overwrite existing files
}
```

**Market Context** (business intelligence tools):
```typescript
{
  industry: string,                  // Industry or market sector
  geography: string[],               // Target geographic markets
  target_segment: string,            // Target customer segment
  competition: string               // Known competitors
}
```

#### Tool-Specific Parameters

**analyze_business_opportunity**:
```typescript
{
  feature_idea: string,              // REQUIRED: Feature concept (10-2000 chars)
  market_context?: {
    industry?: string,
    geography?: string[],
    target_segment?: string
  },
  analysis_depth?: "quick"|"standard"|"comprehensive",
  include_competitive_analysis?: boolean,
  include_market_sizing?: boolean,
  citation_options?: CitationOptions,
  steering_options?: SteeringOptions
}
```

**generate_business_case**:
```typescript
{
  opportunity_analysis: string,      // REQUIRED: Business opportunity analysis
  financial_inputs?: {
    development_cost?: number,       // Development cost in USD
    operational_cost?: number,       // Annual operational cost
    expected_revenue?: number,       // Expected annual revenue
    time_to_market?: number         // Time to market in months (1-60)
  },
  citation_options?: CitationOptions,
  steering_options?: SteeringOptions
}
```

**create_stakeholder_communication**:
```typescript
{
  business_case: string,             // REQUIRED: Business case analysis
  communication_type: "executive_onepager"|"pr_faq"|"board_presentation"|"team_announcement",
  audience: "executives"|"board"|"engineering_team"|"customers"|"investors",
  citation_options?: CitationOptions,
  steering_options?: SteeringOptions
}
```

### Response Formats

#### Standard Response Structure

All MCP tools return responses in this format:

```typescript
{
  content: [
    {
      type: "text",
      text: string                   // Main response content
    }
  ],
  isError: boolean,                  // Error indicator
  metadata: {
    executionTime: number,           // Execution time in ms
    quotaUsed: number,              // Quota units consumed
    confidenceScore: number,         // Confidence score (0-100)
    citationCount: number,          // Number of citations included
    steeringFileCreated: boolean,   // Steering file creation status
    templateUsed: boolean           // Whether prompt template was used
  }
}
```

#### Citation Format

Citations are included in the response metadata and content:

```typescript
{
  citations: [
    {
      id: string,                    // Unique citation ID
      source: string,                // Source organization
      title: string,                 // Publication title
      url?: string,                  // Source URL
      publication_date: string,      // Publication date (YYYY-MM-DD)
      credibility_rating: "A"|"B"|"C", // Credibility rating
      relevance_score: number,       // Relevance score (0-1)
      key_finding: string           // Key finding or quote
    }
  ],
  confidence_score: number,          // Overall confidence (0-100)
  evidence_quality: "Low"|"Medium"|"High", // Evidence quality assessment
  methodology: string               // Analysis methodology used
}
```

### Integration Examples

#### Basic Tool Usage

```typescript
import { MCPClient } from '@modelcontextprotocol/sdk/client';

const client = new MCPClient();

// Business opportunity analysis
const opportunity = await client.callTool("analyze_business_opportunity", {
  feature_idea: "AI-powered code review assistant for development teams",
  market_context: {
    industry: "Developer Tools",
    target_segment: "Enterprise development teams"
  },
  analysis_depth: "comprehensive",
  citation_options: {
    include_citations: true,
    minimum_citations: 10,
    minimum_confidence: "high"
  }
});

// Generate business case
const businessCase = await client.callTool("generate_business_case", {
  opportunity_analysis: opportunity.content[0].text,
  financial_inputs: {
    development_cost: 500000,
    operational_cost: 100000,
    expected_revenue: 800000,
    time_to_market: 9
  }
});

// Create executive communication
const onePager = await client.callTool("create_stakeholder_communication", {
  business_case: businessCase.content[0].text,
  communication_type: "executive_onepager",
  audience: "executives"
});
```

#### Kiro Integration

```typescript
// Add to Kiro MCP configuration
{
  "mcpServers": {
    "vibe-pm-agent": {
      "command": "node",
      "args": ["dist/mcp/server.js"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}

// Use in Kiro chat
// "Analyze the business opportunity for an AI code review assistant"
// Kiro will automatically call analyze_business_opportunity tool
```

## 📊 Evidence & Citation System

### Professional Citation Management

The Vibe PM Agent implements a comprehensive citation and evidence system that ensures all business intelligence outputs meet professional consulting standards.

#### Citation Features

**Comprehensive Source Integration:**
- **Professional Sources**: McKinsey, BCG, Bain, Deloitte, PwC consulting reports
- **Market Research**: Gartner, Forrester, IDC industry analysis
- **Academic Sources**: Harvard Business Review, MIT Sloan, Stanford research
- **Industry Data**: Stack Overflow surveys, GitHub reports, company filings
- **Government Data**: Bureau of Labor Statistics, SEC filings, trade data

**Citation Quality Standards:**
- **Credibility Ratings**: A (top-tier), B (credible), C (supplementary) source classification
- **Relevance Scoring**: 0-1 relevance score based on topic alignment and context
- **Recency Validation**: Configurable maximum age (6-60 months) for citation freshness
- **Source Verification**: Automatic validation of URLs and publication authenticity
- **Geographic Relevance**: Location-specific data and market intelligence

#### Confidence Scoring Algorithm

**Confidence Calculation (0-100%):**
```
Confidence Score = (Source Quality × 0.4) + (Evidence Quantity × 0.3) + (Methodology Rigor × 0.3)

Where:
- Source Quality: Average credibility rating of citations (A=100, B=75, C=50)
- Evidence Quantity: Citation count normalized to 0-100 scale
- Methodology Rigor: Analysis approach scoring (MECE=100, Benchmarking=90, etc.)
```

**Confidence Levels:**
- **90-100%**: High confidence with multiple A-rated sources and rigorous methodology
- **75-89%**: Medium-high confidence with good sources and solid analysis
- **60-74%**: Medium confidence with adequate evidence and standard methodology
- **45-59%**: Medium-low confidence with limited sources or methodology gaps
- **0-44%**: Low confidence requiring additional research and validation

#### Citation Integration Examples

**Business Opportunity Analysis Citation:**
```json
{
  "citations": [
    {
      "id": "mckinsey_ai_productivity_2024",
      "source": "McKinsey Global Institute",
      "title": "The Economic Potential of Generative AI: The Next Productivity Frontier",
      "url": "https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier",
      "publication_date": "2024-06-14",
      "credibility_rating": "A",
      "relevance_score": 0.94,
      "key_finding": "AI could contribute $2.6-4.4 trillion annually to global economy",
      "geographic_scope": "Global",
      "industry_focus": "Technology"
    }
  ],
  "confidence_score": 87,
  "evidence_quality": "High",
  "methodology": "Market research analysis with competitive benchmarking"
}
```

**ROI Analysis Citation:**
```json
{
  "citations": [
    {
      "id": "pwc_ai_roi_2024",
      "source": "PwC",
      "title": "AI ROI Analysis: Enterprise Implementation Outcomes",
      "credibility_rating": "A",
      "relevance_score": 0.91,
      "key_finding": "Median ROI of 240% for AI implementations within 18 months",
      "sample_size": "500+ enterprise implementations",
      "methodology": "Longitudinal study with financial validation"
    }
  ]
}
```

#### Source Validation Process

**Automatic Validation:**
1. **URL Verification**: Check source accessibility and authenticity
2. **Publication Date Validation**: Ensure citations meet recency requirements
3. **Source Authority Assessment**: Validate publisher credibility and expertise
4. **Content Relevance Scoring**: Analyze alignment with analysis topic
5. **Geographic Applicability**: Ensure market relevance for target regions

**Manual Quality Assurance:**
- **Peer Review Process**: Cross-validation of key findings and methodologies
- **Fact Checking**: Verification of statistical claims and market data
- **Bias Assessment**: Evaluation of source objectivity and potential conflicts
- **Completeness Review**: Ensure comprehensive coverage of analysis dimensions

#### Citation Formatting Options

**Business Style (Default):**
```
McKinsey Global Institute (2024). "The Economic Potential of Generative AI." 
Key Finding: AI could contribute $2.6-4.4 trillion annually to global economy.
Credibility: A | Relevance: 94%
```

**APA Academic Style:**
```
McKinsey Global Institute. (2024, June 14). The economic potential of generative AI: 
The next productivity frontier. McKinsey & Company. 
https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier
```

**Inline Reference Style:**
```
According to McKinsey Global Institute research¹, AI could contribute $2.6-4.4 trillion 
annually to the global economy, with significant implications for productivity growth.

¹ McKinsey Global Institute, "The Economic Potential of Generative AI," June 2024
```

#### Evidence Quality Metrics

**Source Distribution Targets:**
- **A-Rated Sources**: 60%+ of citations from top-tier consulting and research firms
- **Recent Publications**: 80%+ of citations from last 18 months
- **Geographic Coverage**: Balanced representation of target markets
- **Industry Relevance**: 90%+ relevance score for industry-specific analysis

**Quality Assurance Thresholds:**
- **Minimum Citations**: 5+ citations for standard analysis, 10+ for comprehensive
- **Confidence Floor**: 75% minimum confidence for executive communications
- **Source Diversity**: No single source >40% of total citations
- **Methodology Transparency**: Clear explanation of analysis approach and limitations

### Integration with MCP Tools

**Citation Options Parameter:**
```typescript
citation_options: {
  include_citations: true,           // Enable citation integration
  minimum_citations: 10,             // Require 10+ citations
  minimum_confidence: "high",        // Require high confidence level
  citation_style: "business",        // Use business citation format
  include_bibliography: true,        // Include full bibliography
  max_citation_age_months: 18,      // Citations within 18 months
  industry_focus: "Technology",      // Focus on tech industry sources
  geographic_scope: "North America"  // Regional source preference
}
```

**Confidence Validation:**
```typescript
// Tool response includes confidence metadata
{
  "confidence_score": 87,
  "evidence_quality": "High", 
  "citation_count": 12,
  "methodology": "MECE analysis with competitive benchmarking",
  "quality_flags": [],              // Any quality concerns
  "validation_status": "Verified"   // Citation validation status
}
```

## 🎯 Hackathon Highlights

### Kiro Integration Excellence
- **Spec-Driven Development**: Built using Kiro's Spec Mode for systematic feature development
- **Steering Files**: Custom PM workflow templates and business analysis prompts
- **MCP Protocol**: Native integration with Kiro's Model Context Protocol ecosystem
- **Evidence-Backed**: All business intelligence includes citations and confidence scoring

### Unique Datasets Integration
- **Competitive Intelligence Matrix**: Public company data and market positioning
- **Market Timing Signals**: Industry trend analysis and competitive windows
- **PM Innovation Index**: Product management best practices and benchmarks
- **Quota Optimization Metrics**: Development efficiency and resource allocation data

### Technical Innovation
- **Professional Citations**: Academic-grade source validation and credibility scoring
- **Consulting Frameworks**: MECE, Pyramid Principle, Impact vs Effort analysis
- **Multi-Scenario ROI**: Conservative/Balanced/Bold financial projections
- **Automated Executive Intelligence**: CEO query processing with professional responses

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔧 Error Handling & Troubleshooting

### Common Issues and Solutions

#### MCP Server Issues

**Server Won't Start:**
```bash
# Check Node.js version
node --version  # Should be 18.0.0+

# Verify installation
npm install && npm run build

# Test server startup
npm run mcp:server:debug
```

**Tool Execution Failures:**
```bash
# Check tool availability
npm run mcp:test

# Validate specific tool
node -e "
const client = require('./dist/mcp/server.js');
client.listTools().then(console.log);
"

# Test with minimal parameters
node demo/test-mcp-server.js validate_idea_quick
```

**Citation Integration Issues:**
```bash
# Check citation service
DEBUG=citation:* npm run mcp:server

# Validate citation sources
node -e "
const citations = require('./src/utils/citation-integration.js');
citations.validateSources().then(console.log);
"
```

#### Parameter Validation Errors

**Invalid Parameter Types:**
```typescript
// ❌ Incorrect
{
  feature_idea: 123,  // Should be string
  market_context: "tech"  // Should be object
}

// ✅ Correct
{
  feature_idea: "AI code review assistant",
  market_context: {
    industry: "Technology",
    target_segment: "Enterprise developers"
  }
}
```

**Missing Required Parameters:**
```typescript
// ❌ Missing required parameter
await client.callTool("analyze_business_opportunity", {
  market_context: { industry: "Tech" }  // Missing feature_idea
});

// ✅ All required parameters
await client.callTool("analyze_business_opportunity", {
  feature_idea: "AI code review assistant",  // Required
  market_context: { industry: "Tech" }      // Optional
});
```

#### Performance Optimization

**Large Analysis Timeouts:**
```typescript
// Enable streaming for large analyses
const client = new MCPClient({
  timeout: 300000,  // 5 minute timeout
  streaming: true   // Enable response streaming
});

// Use quick analysis for faster results
await client.callTool("analyze_business_opportunity", {
  feature_idea: "...",
  analysis_depth: "quick"  // vs "comprehensive"
});
```

**Memory Usage Issues:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run mcp:server

# Monitor memory usage
DEBUG=memory:* npm run mcp:server
```

### Error Response Format

**Standard Error Response:**
```typescript
{
  content: [
    {
      type: "text",
      text: "Error: Invalid parameter 'feature_idea' - must be between 10 and 2000 characters"
    }
  ],
  isError: true,
  metadata: {
    errorCode: "INVALID_PARAMETER",
    errorType: "ValidationError",
    timestamp: "2025-01-09T10:30:00Z",
    requestId: "req_123456789",
    suggestedAction: "Provide a feature_idea between 10-2000 characters"
  }
}
```

**Error Codes:**
- `INVALID_PARAMETER`: Parameter validation failed
- `MISSING_REQUIRED_PARAMETER`: Required parameter not provided
- `TOOL_NOT_FOUND`: Requested tool doesn't exist
- `EXECUTION_TIMEOUT`: Tool execution exceeded timeout
- `CITATION_SERVICE_ERROR`: Citation integration failed
- `INSUFFICIENT_QUOTA`: Not enough quota for operation
- `INTERNAL_SERVER_ERROR`: Unexpected server error

### Debugging Tools

**Debug Mode:**
```bash
# Enable debug logging
DEBUG=vibe-pm-agent:* npm run mcp:server

# Specific component debugging
DEBUG=citation:*,workflow:* npm run mcp:server

# Tool execution tracing
DEBUG=tools:* npm run mcp:server
```

**Validation Scripts:**
```bash
# Validate all tools
npm run test:integration

# Test citation integration
node scripts/test-citations.js

# Benchmark performance
npm run bench
```

**Log Analysis:**
```bash
# View recent logs
tail -f logs/mcp-server.log

# Search for errors
grep "ERROR" logs/mcp-server.log | tail -20

# Analyze performance
grep "executionTime" logs/mcp-server.log | awk '{print $NF}' | sort -n
```

## 📞 Support & Documentation

### Getting Help

**Primary Support Channels:**
- **GitHub Issues**: [Report bugs and request features](https://github.com/your-username/vibe-pm-agent/issues)
- **Documentation**: Comprehensive guides in `docs/` directory
- **Demo Examples**: Working examples in `demo/` directory
- **Kiro Integration**: Detailed integration guide in `KIRO_USAGE.md`

**Community Resources:**
- **Hackathon Submission**: Complete project showcase and validation
- **Demo Videos**: Step-by-step usage demonstrations
- **Best Practices**: PM workflow optimization guides
- **Citation Guidelines**: Professional source integration standards

### Documentation Structure

```
docs/
├── api/                    # API reference and tool documentation
│   ├── tools.md           # Complete tool reference
│   ├── parameters.md      # Parameter specifications
│   └── responses.md       # Response format documentation
├── integration/           # Integration guides
│   ├── kiro.md           # Kiro IDE integration
│   ├── mcp-clients.md    # Other MCP client integration
│   └── custom-tools.md   # Custom tool development
├── examples/              # Usage examples and tutorials
│   ├── business-case.md  # Business case development
│   ├── executive-comms.md # Executive communication generation
│   └── workflow-optimization.md # PM workflow optimization
└── troubleshooting/       # Troubleshooting and debugging
    ├── common-issues.md  # Common problems and solutions
    ├── performance.md    # Performance optimization
    └── debugging.md      # Debugging techniques
```

### Contributing Guidelines

**Development Setup:**
```bash
# Fork and clone repository
git clone https://github.com/your-username/vibe-pm-agent.git
cd vibe-pm-agent

# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev
```

**Code Quality Standards:**
- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Jest**: Comprehensive test coverage (>90%)
- **Documentation**: JSDoc comments for all public APIs

**Pull Request Process:**
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation as needed
4. Ensure all tests pass
5. Submit PR with detailed description

## 🏆 Hackathon Submission Details

**Category**: Productivity & Workflow Tools  
**Built with**: Kiro IDE, TypeScript, Node.js, MCP Protocol  
**Unique Value**: Evidence-backed business intelligence with professional citations and confidence scoring

---

*Built with ❤️ using Kiro IDE for the Code with Kiro Hackathon 2025*