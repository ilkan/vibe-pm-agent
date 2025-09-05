# MCP Tools Documentation

This document provides comprehensive documentation for all 8 PM-focused MCP tools in the Vibe PM Agent server.

## Tool Overview

The Vibe PM Agent exposes 8 strategic PM tools focused exclusively on "WHY to build" analysis:

### Business Analysis Tools
1. **analyze_business_opportunity** - Market opportunity and timing analysis
2. **generate_business_case** - Comprehensive ROI and risk assessment
3. **assess_strategic_alignment** - Company strategy and OKR alignment

### Competitive Intelligence Tools
4. **analyze_competitor_landscape** - Comprehensive competitor analysis with SWOT and strategic recommendations
5. **calculate_market_sizing** - TAM/SAM/SOM analysis with multiple methodologies

### Decision Support Tools
6. **validate_market_timing** - Fast right-time validation
7. **optimize_resource_allocation** - Development efficiency recommendations
8. **create_stakeholder_communication** - Executive one-pagers and PR-FAQs

## Perfect Kiro Integration

These tools complement Kiro's native modes without conflicts:

| Mode | Purpose | Tools |
|------|---------|-------|
| **PM Mode** (vibe-pm-agent) | WHY to build | 8 strategic analysis tools |
| **Spec Mode** (Kiro native) | WHAT to build | Requirements, specifications |
| **Vibe Mode** (Kiro native) | HOW to build | Implementation, code generation |

## Tool Schemas and Usage

### 1. analyze_business_opportunity

**Description**: Analyzes market opportunity, timing, and business justification for a feature idea.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "idea": {
      "type": "string",
      "description": "Raw feature idea or business need"
    },
    "market_context": {
      "type": "object",
      "properties": {
        "industry": { "type": "string" },
        "competition": { "type": "string" },
        "budget_range": { "type": "string", "enum": ["small", "medium", "large"] },
        "timeline": { "type": "string" }
      }
    }
  },
  "required": ["idea"]
}
```

**Example Usage**:
```bash
{
  "tool": "analyze_business_opportunity",
  "input": {
    "idea": "Build real-time customer churn prediction dashboard",
    "market_context": {
      "industry": "SaaS",
      "competition": "High - many analytics tools available",
      "budget_range": "medium",
      "timeline": "Q2 launch target"
    }
  }
}
```

### 2. generate_business_case

**Description**: Creates comprehensive business case with ROI analysis, risk assessment, and strategic alignment.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "opportunity_analysis": {
      "type": "string",
      "description": "Business opportunity analysis from analyze_business_opportunity"
    },
    "financial_inputs": {
      "type": "object",
      "properties": {
        "development_cost": { "type": "number" },
        "expected_revenue": { "type": "number" },
        "operational_cost": { "type": "number" },
        "time_to_market": { "type": "number" }
      }
    }
  },
  "required": ["opportunity_analysis"]
}
```

### 3. assess_strategic_alignment

**Description**: Evaluates how a feature aligns with company strategy, OKRs, and long-term vision.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "feature_concept": {
      "type": "string",
      "description": "Feature concept or business case"
    },
    "company_context": {
      "type": "object",
      "properties": {
        "mission": { "type": "string" },
        "current_okrs": { "type": "array", "items": { "type": "string" } },
        "strategic_priorities": { "type": "array", "items": { "type": "string" } },
        "competitive_position": { "type": "string" }
      }
    }
  },
  "required": ["feature_concept"]
}
```

### 4. analyze_competitor_landscape

**Description**: Generates comprehensive competitor analysis with competitive matrix, SWOT analysis, and strategic recommendations using credible sources.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "feature_idea": {
      "type": "string",
      "description": "Feature idea or product concept for competitive analysis"
    },
    "market_context": {
      "type": "object",
      "properties": {
        "industry": { "type": "string" },
        "geography": { 
          "type": "array", 
          "items": { "type": "string" },
          "description": "Target geographic markets" 
        },
        "target_segment": { "type": "string" }
      }
    },
    "analysis_depth": {
      "type": "string",
      "enum": ["quick", "standard", "comprehensive"],
      "description": "Depth of competitive analysis"
    },
    "steering_options": {
      "type": "object",
      "properties": {
        "create_steering_files": { "type": "boolean" },
        "feature_name": { "type": "string" },
        "inclusion_rule": { "type": "string", "enum": ["always", "fileMatch", "manual"] }
      }
    }
  },
  "required": ["feature_idea"]
}
```

**Example Usage**:
```bash
{
  "tool": "analyze_competitor_landscape",
  "input": {
    "feature_idea": "AI-powered customer support chatbot",
    "market_context": {
      "industry": "Customer Service Technology",
      "geography": ["North America", "Europe"],
      "target_segment": "Enterprise SaaS"
    },
    "analysis_depth": "comprehensive",
    "steering_options": {
      "create_steering_files": true,
      "feature_name": "ai-support-chatbot",
      "inclusion_rule": "fileMatch"
    }
  }
}
```

**Output Features**:
- Competitive matrix with rankings and differentiation opportunities
- SWOT analysis for each major competitor
- Strategic recommendations based on market gaps
- Source attribution from McKinsey, Gartner, and WEF reports
- Confidence levels and data quality indicators

### 5. calculate_market_sizing

**Description**: Performs TAM/SAM/SOM market sizing analysis using multiple methodologies with confidence intervals and scenario analysis.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "feature_idea": {
      "type": "string",
      "description": "Feature idea for market sizing analysis"
    },
    "market_definition": {
      "type": "object",
      "properties": {
        "industry": { "type": "string" },
        "geography": { 
          "type": "array",
          "items": { "type": "string" }
        },
        "customer_segments": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "required": ["industry"]
    },
    "sizing_methods": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["top-down", "bottom-up", "value-theory"]
      },
      "description": "Market sizing methodologies to apply"
    },
    "steering_options": {
      "type": "object",
      "properties": {
        "create_steering_files": { "type": "boolean" },
        "feature_name": { "type": "string" },
        "inclusion_rule": { "type": "string", "enum": ["always", "fileMatch", "manual"] }
      }
    }
  },
  "required": ["feature_idea", "market_definition"]
}
```

**Example Usage**:
```bash
{
  "tool": "calculate_market_sizing",
  "input": {
    "feature_idea": "Cloud-based project management platform",
    "market_definition": {
      "industry": "Project Management Software",
      "geography": ["North America", "Europe", "Asia-Pacific"],
      "customer_segments": ["Enterprise", "Mid-market", "SMB"]
    },
    "sizing_methods": ["top-down", "bottom-up"],
    "steering_options": {
      "create_steering_files": true,
      "feature_name": "cloud-project-mgmt",
      "inclusion_rule": "fileMatch"
    }
  }
}
```

**Output Features**:
- TAM (Total Addressable Market) calculations
- SAM (Serviceable Addressable Market) estimates  
- SOM (Serviceable Obtainable Market) projections
- Multiple scenario analysis (conservative, balanced, aggressive)
- Confidence intervals and methodology explanations
- Source attribution from authoritative market research

### 6. validate_market_timing

**Description**: Fast validation of whether now is the right time to build a feature based on market conditions.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "feature_idea": {
      "type": "string",
      "description": "Feature idea to validate timing for"
    },
    "market_signals": {
      "type": "object",
      "properties": {
        "customer_demand": { "type": "string", "enum": ["low", "medium", "high"] },
        "competitive_pressure": { "type": "string", "enum": ["low", "medium", "high"] },
        "technical_readiness": { "type": "string", "enum": ["low", "medium", "high"] },
        "resource_availability": { "type": "string", "enum": ["low", "medium", "high"] }
      }
    }
  },
  "required": ["feature_idea"]
}
```

**Example Usage**:
```bash
{
  "tool": "validate_market_timing",
  "input": {
    "feature_idea": "AI-powered code review assistant",
    "market_signals": {
      "customer_demand": "high",
      "competitive_pressure": "medium",
      "technical_readiness": "high",
      "resource_availability": "medium"
    }
  }
}
```

### 7. optimize_resource_allocation

**Description**: Analyzes resource requirements and provides optimization recommendations for development efficiency.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "current_workflow": {
      "type": "object",
      "description": "Current development workflow or process"
    },
    "resource_constraints": {
      "type": "object",
      "properties": {
        "team_size": { "type": "number" },
        "budget": { "type": "number" },
        "timeline": { "type": "string" },
        "technical_debt": { "type": "string" }
      }
    },
    "optimization_goals": {
      "type": "array",
      "items": { "type": "string", "enum": ["cost_reduction", "speed_improvement", "quality_increase", "risk_mitigation"] }
    }
  },
  "required": ["current_workflow"]
}
```

### 8. create_stakeholder_communication

**Description**: Generates executive one-pagers, PR-FAQs, and stakeholder presentations.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "business_case": {
      "type": "string",
      "description": "Business case analysis"
    },
    "communication_type": {
      "type": "string",
      "enum": ["executive_onepager", "pr_faq", "board_presentation", "team_announcement"],
      "description": "Type of communication to generate"
    },
    "audience": {
      "type": "string",
      "enum": ["executives", "board", "engineering_team", "customers", "investors"],
      "description": "Target audience for the communication"
    }
  },
  "required": ["business_case", "communication_type", "audience"]
}
```

## Workflow Examples

### Complete PM Analysis Workflow

```bash
# 1. Analyze business opportunity
analyze_business_opportunity → Market analysis + strategic fit

# 2. Analyze competitive landscape
analyze_competitor_landscape → Competitive matrix + SWOT + strategic recommendations

# 3. Calculate market sizing
calculate_market_sizing → TAM/SAM/SOM + market opportunity quantification

# 4. Generate comprehensive business case  
generate_business_case → ROI analysis + risk assessment

# 5. Assess strategic alignment
assess_strategic_alignment → Company strategy alignment

# 6. Create stakeholder communication
create_stakeholder_communication → Executive one-pager + PR-FAQ
```

**Complete Example**:
```json
// Step 1: Business opportunity analysis
{
  "tool": "analyze_business_opportunity",
  "input": {
    "idea": "AI-powered customer support platform",
    "market_context": {
      "industry": "Customer Service Technology",
      "budget_range": "large",
      "timeline": "12 months"
    }
  }
}

// Step 2: Competitive landscape analysis
{
  "tool": "analyze_competitor_landscape", 
  "input": {
    "feature_idea": "AI-powered customer support platform",
    "market_context": {
      "industry": "Customer Service Technology",
      "geography": ["North America", "Europe"],
      "target_segment": "Enterprise"
    },
    "analysis_depth": "comprehensive"
  }
}

// Step 3: Market sizing analysis
{
  "tool": "calculate_market_sizing",
  "input": {
    "feature_idea": "AI-powered customer support platform",
    "market_definition": {
      "industry": "Customer Service Software",
      "geography": ["North America", "Europe"],
      "customer_segments": ["Enterprise", "Mid-market"]
    },
    "sizing_methods": ["top-down", "bottom-up"]
  }
}

// Step 4: Business case generation
{
  "tool": "generate_business_case",
  "input": {
    "opportunity_analysis": "[Results from steps 1-3]",
    "financial_inputs": {
      "development_cost": 2000000,
      "expected_revenue": 10000000,
      "time_to_market": 12
    }
  }
}

// Step 5: Strategic alignment assessment
{
  "tool": "assess_strategic_alignment",
  "input": {
    "feature_concept": "[Business case from step 4]",
    "company_context": {
      "mission": "Democratize customer service excellence",
      "current_okrs": ["Expand enterprise market", "Improve AI capabilities"],
      "strategic_priorities": ["AI innovation", "Market expansion"]
    }
  }
}

// Step 6: Executive communication
{
  "tool": "create_stakeholder_communication",
  "input": {
    "business_case": "[Strategic alignment from step 5]",
    "communication_type": "executive_onepager",
    "audience": "executives"
  }
}
```

### Competitive Intelligence Workflow

```bash
# 1. Competitive landscape analysis
analyze_competitor_landscape → Identify competitors + market positioning

# 2. Market opportunity sizing
calculate_market_sizing → Quantify addressable market

# 3. Strategic positioning
analyze_business_opportunity → Combine competitive + market insights

# 4. Executive communication
create_stakeholder_communication → Present competitive advantage
```

### Quick Market Validation

```bash
# Fast validation for immediate decisions
validate_market_timing → Right-time analysis + recommendations
```

### Resource Optimization

```bash
# Development efficiency analysis
optimize_resource_allocation → Resource recommendations + efficiency improvements
```

## Steering File Integration

All tools support automatic steering file creation through the `steering_options` parameter:

```json
{
  "steering_options": {
    "create_steering_files": true,
    "feature_name": "churn-prediction",
    "inclusion_rule": "fileMatch",
    "file_match_pattern": "churn*|prediction*"
  }
}
```

This creates persistent strategic context that guides future Kiro Spec and Vibe mode development.

## Error Handling

All tools provide structured error responses:

```json
{
  "error": {
    "type": "validation_error",
    "message": "Missing required field: idea",
    "details": {
      "field": "idea",
      "expected": "string",
      "received": "undefined"
    }
  }
}
```

## Best Practices

1. **Start with Market Timing**: Use `validate_market_timing` for quick go/no-go decisions
2. **Follow the Workflow**: Business opportunity → Business case → Strategic alignment → Communication
3. **Enable Steering Files**: Always use steering options to build institutional knowledge
4. **Provide Context**: Include market context and company information for better analysis
5. **Use Appropriate Communication**: Match communication type to your audience and goals