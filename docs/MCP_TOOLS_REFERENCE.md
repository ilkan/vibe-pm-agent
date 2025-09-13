# MCP Tools Reference - Complete API Documentation

## 🛠️ Overview

The Vibe PM Agent provides 21 business intelligence tools through the Model Context Protocol (MCP), organized into 4 categories for comprehensive strategic analysis and executive communications.

**All tools feature clean, readable names without prefixes for optimal Kiro IDE user experience.**

## 📊 Tool Categories

### Core Business Intelligence Tools (6 tools)
Strategic analysis, market validation, and ROI modeling

### PM Workflow Tools (5 tools)  
Requirements generation, design options, and implementation planning

### Citation & Analysis Tools (5 tools)
Professional source integration and evidence validation

### Workflow Optimization Tools (5 tools)
Resource allocation, competitive analysis, and market sizing

## 🔧 Core Business Intelligence Tools

### `analyze_business_opportunity`
**Purpose:** Market validation and strategic fit assessment with competitive intelligence

**Parameters:**
```typescript
{
  idea: string,                    // REQUIRED: Feature concept (10-2000 chars)
  market_context?: {
    industry?: string,             // Industry or market sector
    geography?: string[],          // Target geographic markets
    target_segment?: string,       // Target customer segment
    competition?: string           // Known competitors
  },
  analysis_depth?: "quick"|"standard"|"comprehensive",
  citation_options?: CitationOptions,
  steering_options?: SteeringOptions
}
```

**Output:** JSON with market analysis, competitive landscape, timing assessment, and confidence scoring

**Example Usage in Kiro:**
```
"Analyze business opportunity for AI-powered code review assistant"
```

---

### `generate_business_case`
**Purpose:** Multi-scenario ROI analysis with risk assessment and financial projections

**Parameters:**
```typescript
{
  opportunity_analysis: string,    // REQUIRED: Business opportunity analysis
  financial_inputs?: {
    development_cost?: number,     // Development cost in USD
    operational_cost?: number,     // Annual operational cost
    expected_revenue?: number,     // Expected annual revenue
    time_to_market?: number       // Time to market in months (1-60)
  },
  citation_options?: CitationOptions,
  steering_options?: SteeringOptions
}
```

**Output:** JSON with financial projections, ROI scenarios, risk assessment, and strategic recommendations

**Example Usage in Kiro:**
```
"Generate business case with $500K development cost and $800K expected revenue"
```

---

### `create_stakeholder_communication`
**Purpose:** Executive communications generation (one-pagers, PR-FAQs, presentations)

**Parameters:**
```typescript
{
  business_case: string,           // REQUIRED: Business case analysis
  communication_type: "executive_onepager"|"pr_faq"|"board_presentation"|"team_announcement",
  audience: "executives"|"board"|"engineering_team"|"customers"|"investors",
  citation_options?: CitationOptions,
  steering_options?: SteeringOptions
}
```

**Output:** Formatted document using Pyramid Principle or Amazon Working Backwards methodology

**Example Usage in Kiro:**
```
"Create executive one-pager for board presentation"
```

---

### `assess_strategic_alignment`
**Purpose:** Company OKR and mission alignment evaluation with scoring

**Parameters:**
```typescript
{
  feature_concept: string,         // REQUIRED: Feature concept or business case
  company_context?: {
    mission?: string,              // Company mission statement
    strategic_priorities?: string[], // Strategic priorities list
    current_okrs?: string[],       // Current OKRs
    competitive_position?: string   // Market position
  },
  citation_options?: CitationOptions,
  steering_options?: SteeringOptions
}
```

**Output:** JSON alignment score (0-100%) with detailed analysis and recommendations

**Example Usage in Kiro:**
```
"Assess strategic alignment with company OKRs for developer productivity initiative"
```

---

### `validate_market_timing`
**Purpose:** Market timing and competitive window analysis

**Parameters:**
```typescript
{
  feature_idea: string,            // REQUIRED: Feature idea to validate timing
  market_signals?: {
    customer_demand?: "low"|"medium"|"high",
    competitive_pressure?: "low"|"medium"|"high",
    technical_readiness?: "low"|"medium"|"high",
    resource_availability?: "low"|"medium"|"high"
  },
  citation_options?: CitationOptions
}
```

**Output:** JSON timing assessment with competitive window and market readiness analysis

**Example Usage in Kiro:**
```
"Validate market timing for AI customer support automation"
```

---

### `optimize_resource_allocation`
**Purpose:** Development efficiency and cost optimization recommendations

**Parameters:**
```typescript
{
  current_workflow: object,        // REQUIRED: Current development workflow
  resource_constraints?: {
    budget?: number,               // Available budget
    team_size?: number,           // Team size
    timeline?: string,            // Project timeline
    technical_debt?: string       // Technical debt assessment
  },
  optimization_goals?: ("cost_reduction"|"speed_improvement"|"quality_increase"|"risk_mitigation")[],
  citation_options?: CitationOptions
}
```

**Output:** JSON optimization plan with resource allocation recommendations and efficiency metrics

**Example Usage in Kiro:**
```
"Optimize resource allocation for 5-person team with $300K budget"
```

## 📋 PM Workflow Tools

### `generate_requirements`
**Purpose:** PM-grade requirements with EARS format and acceptance criteria

**Parameters:**
```typescript
{
  feature_idea: string,            // REQUIRED: Feature idea to generate requirements
  context?: object,                // Additional context
  steering_options?: SteeringOptions
}
```

**Output:** Structured requirements document with user stories and acceptance criteria

---

### `generate_design_options`
**Purpose:** Conservative/Balanced/Bold design alternatives with cost analysis

**Parameters:**
```typescript
{
  requirements: string,            // REQUIRED: Requirements document
  constraints?: object,            // Design constraints
  steering_options?: SteeringOptions
}
```

**Output:** Design options matrix with impact vs effort analysis

---

### `generate_task_plan`
**Purpose:** Phased implementation plan with detailed task breakdown

**Parameters:**
```typescript
{
  design: string,                  // REQUIRED: Design document
  requirements?: string,           // Optional requirements reference
  steering_options?: SteeringOptions
}
```

**Output:** Task breakdown structure with phases and dependencies

---

### `generate_management_onepager`
**Purpose:** Executive one-pager using Pyramid Principle

**Parameters:**
```typescript
{
  project_info: string,            // REQUIRED: Project information
  audience?: string,               // Target audience
  steering_options?: SteeringOptions
}
```

**Output:** Executive summary formatted for C-level consumption

---

### `generate_pr_faq`
**Purpose:** Amazon-style PR-FAQ document with Working Backwards methodology

**Parameters:**
```typescript
{
  product_info: string,            // REQUIRED: Product information
  target_audience?: string,        // Target audience
  steering_options?: SteeringOptions
}
```

**Output:** PR-FAQ format document with customer-focused narrative

## 🔍 Citation & Analysis Tools

### `enhance_citations`
**Purpose:** Enhances content with authoritative citations and source validation

**Parameters:**
```typescript
{
  content: string,                 // REQUIRED: Content to enhance
  sources?: string[],              // Optional source materials
  citation_options?: CitationOptions
}
```

**Output:** Enhanced content with professional citations

---

### `validate_and_audit_citations`
**Purpose:** Validates and audits citations for accuracy and credibility

**Parameters:**
```typescript
{
  content: string,                 // REQUIRED: Content with citations
  strict_mode?: boolean            // Enable strict validation
}
```

**Output:** Audit report with credibility assessment

---

### `monitor_market_conditions`
**Purpose:** Monitors and analyzes current market conditions and trends

**Parameters:**
```typescript
{
  market: string,                  // REQUIRED: Market to monitor
  indicators?: string[]            // Key indicators to track
}
```

**Output:** Market analysis with trend indicators

---

### `get_consulting_summary`
**Purpose:** Creates consulting-style executive summary from analysis data

**Parameters:**
```typescript
{
  analysis_data: string,           // REQUIRED: Analysis data to summarize
  summary_type?: string            // Type of summary needed
}
```

**Output:** Executive summary in consulting format

---

### `validate_idea_quick`
**Purpose:** Performs quick validation of business ideas against criteria

**Parameters:**
```typescript
{
  idea: string,                    // REQUIRED: Idea to validate
  criteria?: string[]              // Validation criteria
}
```

**Output:** Quick validation report with go/no-go recommendation

## ⚡ Workflow Optimization Tools

### `optimize_intent`
**Purpose:** Optimizes user intent for better clarity and actionability

**Parameters:**
```typescript
{
  user_intent: string,             // REQUIRED: User intent to optimize
  context?: object                 // Context information
}
```

**Output:** Optimized intent with improved clarity

---

### `analyze_workflow`
**Purpose:** Analyzes workflows for optimization opportunities

**Parameters:**
```typescript
{
  workflow_description: string,    // REQUIRED: Workflow to analyze
  optimization_goals?: string[]    // Optimization objectives
}
```

**Output:** Analysis report with optimization recommendations

---

### `generate_roi_analysis`
**Purpose:** Generates comprehensive ROI analysis with financial projections

**Parameters:**
```typescript
{
  investment: number,              // REQUIRED: Investment amount
  expected_returns?: object        // Expected returns data
}
```

**Output:** Financial analysis with ROI projections

---

### `analyze_competitor_landscape`
**Purpose:** Analyzes competitive landscape and market positioning

**Parameters:**
```typescript
{
  market_segment: string,          // REQUIRED: Market segment to analyze
  competitors?: string[]           // Known competitors
}
```

**Output:** Competitive analysis with positioning recommendations

---

### `calculate_market_sizing`
**Purpose:** Calculates market sizing using TAM-SAM-SOM methodology

**Parameters:**
```typescript
{
  market: string,                  // REQUIRED: Market to size
  methodology?: string             // Sizing methodology
}
```

**Output:** Market sizing analysis with TAM/SAM/SOM breakdown

## 🔧 Common Parameter Types

### CitationOptions
```typescript
{
  include_citations?: boolean,        // Include professional citations
  minimum_citations?: number,         // Minimum citation count (1-20)
  minimum_confidence?: "low"|"medium"|"high", // Required confidence level
  citation_style?: "business"|"apa"|"inline", // Citation formatting
  include_bibliography?: boolean,     // Include bibliography section
  max_citation_age_months?: number   // Maximum citation age (6-60 months)
}
```

### SteeringOptions
```typescript
{
  create_steering_files?: boolean,    // Create steering files from output
  feature_name?: string,              // Feature name for organization
  inclusion_rule?: "always"|"fileMatch"|"manual", // Context inclusion
  file_match_pattern?: string,        // Pattern for fileMatch rule
  overwrite_existing?: boolean        // Overwrite existing files
}
```

## 📊 Response Format

All MCP tools return responses in this standard format:

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

## 🎯 Usage Examples in Kiro

### Business Opportunity Analysis
```
"Analyze the business opportunity for an AI-powered customer support chatbot targeting e-commerce companies"
```

### Complete Business Case Development
```
"Generate a comprehensive business case for our microservices migration with $2M investment and 18-month timeline"
```

### Executive Communication
```
"Create an executive one-pager for the board presentation on our new API gateway initiative"
```

### Strategic Validation
```
"Assess strategic alignment of the developer productivity tools with our company OKRs"
```

### Market Intelligence
```
"Analyze the competitive landscape for enterprise developer tools and calculate market sizing"
```

## 🔍 Integration with Kiro

### MCP Configuration
```json
{
  "mcpServers": {
    "vibe-pm-agent": {
      "command": "node",
      "args": ["dist/mcp/server.js"],
      "env": {
        "LOG_LEVEL": "info",
        "ENABLE_STREAMING": "true"
      },
      "autoApprove": [
        "analyze_business_opportunity",
        "generate_business_case",
        "create_stakeholder_communication"
      ]
    }
  }
}
```

### Natural Language Usage
The tools are designed to work with natural language queries in Kiro:
- "Analyze business opportunity for [idea]"
- "Generate business case for [analysis]"
- "Create executive summary for [project]"
- "Validate market timing for [feature]"
- "Assess strategic alignment of [concept]"

## 🏆 Quality Standards

- **Professional Citations**: McKinsey, BCG, Gartner sources with A/B/C credibility ratings
- **Confidence Scoring**: 0-100% confidence with transparent methodology
- **Executive Quality**: Pyramid Principle and consulting framework compliance
- **Evidence-Based**: All recommendations backed by professional sources
- **Performance**: <15 second response time for complex analyses

---

**Ready to transform your developer ideas into executive-ready business cases? Start with `analyze_business_opportunity` and experience the complete PM Mode workflow.**