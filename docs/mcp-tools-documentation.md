# MCP Tools Documentation

This document provides comprehensive documentation for all MCP tools available in the PM Agent Intent Optimizer server.

## Tool Overview

The PM Agent Intent Optimizer exposes 10 comprehensive MCP tools through the Model Context Protocol:

### Core Optimization Tools
1. **validate_idea_quick** - Fast PASS/FAIL validation with 3 structured options
2. **optimize_intent** - Complete intent optimization with consulting analysis
3. **analyze_workflow** - Workflow analysis using consulting techniques  
4. **generate_roi_analysis** - ROI comparison with Conservative/Balanced/Bold scenarios
5. **get_consulting_summary** - Professional consulting-style analysis

### PM Document Generation Tools
6. **generate_management_onepager** - Executive one-pager with Pyramid Principle
7. **generate_pr_faq** - Amazon-style PR-FAQ documents
8. **generate_requirements** - PM-grade requirements with MoSCoW prioritization
9. **generate_design_options** - Design options with Impact vs Effort analysis
10. **generate_task_plan** - Phased implementation plans with guardrails

## Tool Schemas and Usage

### 1. validate_idea_quick

**Description**: Fast unit-test-like validation that provides PASS/FAIL verdict with 3 structured options for next steps. Acts like a unit test for ideas - quick feedback with clear choices.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "idea": {
      "type": "string",
      "description": "Raw idea or intent to validate quickly (5-2000 characters)",
      "minLength": 5,
      "maxLength": 2000
    },
    "context": {
      "type": "object",
      "properties": {
        "urgency": {"type": "string", "enum": ["low", "medium", "high"]},
        "budget_range": {"type": "string", "enum": ["small", "medium", "large"]},
        "team_size": {"type": "number", "minimum": 1, "maximum": 100}
      }
    }
  },
  "required": ["idea"]
}
```

**Example Input**:
```json
{
  "idea": "Build a real-time chat system with AI moderation that can handle 10,000+ concurrent users and automatically detect toxic behavior",
  "context": {
    "urgency": "high",
    "budget_range": "medium", 
    "team_size": 5
  }
}
```

**Example Output**:
```
# Quick Validation Result

**Verdict:** PASS
**Reasoning:** Strong technical feasibility with clear value proposition and manageable scope for team size.

## Next Steps (Choose One)

### Option A: MVP Approach
Build basic chat with simple keyword-based moderation first, then add AI features.

**Trade-offs:**
- Lower initial complexity and risk
- Faster time to market (4-6 weeks)
- Limited moderation capabilities initially

**Next Step:** Generate requirements for MVP chat system

### Option B: Full System
Build complete solution with advanced AI moderation from start.

**Trade-offs:**
- Higher complexity but full feature set
- Longer development time (12-16 weeks)
- Requires ML expertise on team

**Next Step:** Generate design options for full system architecture

### Option C: Research & Prototype
Spend 2-3 weeks researching AI moderation approaches and building proof of concept.

**Trade-offs:**
- Reduces technical risk through validation
- Delays full development start
- Provides better cost estimates

**Next Step:** Create research plan and prototype scope
```

### 2. optimize_intent

**Description**: Takes raw developer intent and optional parameters, applies consulting analysis, and returns an optimized Kiro spec with ROI analysis.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "intent": {
      "type": "string",
      "description": "Raw developer intent in natural language"
    },
    "parameters": {
      "type": "object",
      "properties": {
        "expectedUserVolume": {"type": "number"},
        "costConstraints": {"type": "number"},
        "performanceSensitivity": {"type": "string", "enum": ["low", "medium", "high"]}
      }
    }
  },
  "required": ["intent"]
}
```

**Example Input**:
```json
{
  "intent": "I want to create a dashboard that analyzes user behavior patterns and generates automated insights for product managers",
  "parameters": {
    "expectedUserVolume": 1000,
    "costConstraints": 500,
    "performanceSensitivity": "high"
  }
}
```

**Output**: Enhanced Kiro Spec with consulting summary and ROI analysis

### 3. analyze_workflow

**Description**: Analyzes an existing workflow definition for optimization opportunities using consulting techniques.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "workflow": {
      "type": "object",
      "description": "Existing workflow definition to analyze"
    },
    "techniques": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Specific consulting techniques to apply (optional)"
    }
  },
  "required": ["workflow"]
}
```

**Example Input**:
```json
{
  "workflow": {
    "id": "user-feedback-analysis",
    "steps": [
      {
        "id": "collect-feedback",
        "type": "data_retrieval",
        "description": "Gather user feedback from multiple sources",
        "quotaCost": 5
      },
      {
        "id": "analyze-sentiment", 
        "type": "analysis",
        "description": "Perform sentiment analysis on feedback",
        "quotaCost": 10
      }
    ],
    "estimatedComplexity": 7
  },
  "techniques": ["MECE", "ValueDriverTree"]
}
```

**Output**: Consulting analysis with optimization recommendations

### 4. generate_roi_analysis

**Description**: Generates comprehensive ROI analysis comparing naive, optimized, and zero-based approaches.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "workflow": {"type": "object"},
    "optimizedWorkflow": {"type": "object"},
    "zeroBasedSolution": {"type": "object"}
  },
  "required": ["workflow"]
}
```

**Example Output**:
```json
{
  "scenarios": [
    {
      "name": "Conservative",
      "savingsPercentage": 0,
      "implementationEffort": "none",
      "riskLevel": "none"
    },
    {
      "name": "Balanced", 
      "savingsPercentage": 35,
      "implementationEffort": "medium",
      "riskLevel": "low"
    },
    {
      "name": "Bold",
      "savingsPercentage": 65,
      "implementationEffort": "high", 
      "riskLevel": "medium"
    }
  ],
  "bestOption": "Balanced",
  "recommendations": ["Apply batching optimization", "Implement caching layer"]
}
```

### 5. get_consulting_summary

**Description**: Provides detailed consulting-style summary using Pyramid Principle for any analysis.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "analysis": {"type": "object"},
    "techniques": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["analysis"]
}
```

**Output**: Professional consulting summary with structured recommendations

### 6. generate_management_onepager

**Description**: Creates executive-ready management one-pager using Pyramid Principle with answer-first clarity and timing rationale. Optionally creates steering files for executive guidance.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "requirements": {
      "type": "string",
      "description": "Requirements document content"
    },
    "design": {
      "type": "string", 
      "description": "Design document content"
    },
    "tasks": {
      "type": "string",
      "description": "Task plan content (optional)"
    },
    "roi_inputs": {
      "type": "object",
      "properties": {
        "cost_naive": {"type": "number"},
        "cost_balanced": {"type": "number"},
        "cost_bold": {"type": "number"}
      }
    },
    "steering_options": {
      "type": "object",
      "properties": {
        "create_steering_files": {"type": "boolean"},
        "feature_name": {"type": "string"},
        "inclusion_rule": {"type": "string", "enum": ["always", "fileMatch", "manual"]},
        "file_match_pattern": {"type": "string"},
        "overwrite_existing": {"type": "boolean"}
      },
      "description": "Optional steering file creation options"
    }
  },
  "required": ["requirements", "design"]
}
```

**Example Output**:
```markdown
# Management One-Pager

## Answer
**Proceed with Balanced approach for Q2 launch** - delivers 35% efficiency gains with manageable risk and $15K investment.

## Because
- Market research shows 67% of users need this capability now
- Technical architecture is proven and scalable
- ROI breaks even in 4 months with conservative projections

## What (Scope Today)
- Core dashboard with 5 key metrics
- Real-time data pipeline integration
- Basic alerting and notification system
- Mobile-responsive interface

## Risks & Mitigations
- **Risk:** Data quality issues from legacy systems
  **Mitigation:** Implement data validation layer and fallback mechanisms
- **Risk:** User adoption slower than projected
  **Mitigation:** Phased rollout with power user beta program
- **Risk:** Performance bottlenecks at scale
  **Mitigation:** Load testing and auto-scaling infrastructure

## Options
- **Conservative:** Basic reporting only - $8K, 6 weeks, minimal risk
- **Balanced ✅:** Full dashboard with real-time features - $15K, 10 weeks, low risk
- **Bold (ZBD):** AI-powered predictive analytics - $35K, 16 weeks, medium risk

## ROI Snapshot
| Option        | Effort | Impact | Est. Cost | Timing |
|---------------|--------|--------|-----------|--------|
| Conservative  | Low    | Med    | $8K       | Now    |
| Balanced ✅   | Med    | High   | $15K      | Now    |
| Bold (ZBD)    | High   | VeryH  | $35K      | Later  |

## Right-Time Recommendation
Launch Balanced approach now because market window is open and technical foundation is solid. Delaying risks competitive disadvantage, while Bold approach requires ML capabilities we don't have yet.
```

### 7. generate_pr_faq

**Description**: Generates Amazon-style PR-FAQ document with future-dated press release and comprehensive FAQ. Optionally creates steering files for product clarity guidance.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "requirements": {
      "type": "string",
      "description": "Requirements document content"
    },
    "design": {
      "type": "string",
      "description": "Design document content"
    },
    "target_date": {
      "type": "string",
      "description": "Target launch date (YYYY-MM-DD format, optional)"
    },
    "steering_options": {
      "type": "object",
      "properties": {
        "create_steering_files": {"type": "boolean"},
        "feature_name": {"type": "string"},
        "inclusion_rule": {"type": "string", "enum": ["always", "fileMatch", "manual"]},
        "file_match_pattern": {"type": "string"},
        "overwrite_existing": {"type": "boolean"}
      },
      "description": "Optional steering file creation options"
    }
  },
  "required": ["requirements", "design"]
}
```

### 8. generate_requirements

**Description**: Creates PM-grade requirements with Business Goal extraction, MoSCoW prioritization, and Go/No-Go timing decision. Optionally creates steering files for requirements guidance.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "raw_intent": {
      "type": "string",
      "description": "Raw developer intent in natural language"
    },
    "context": {
      "type": "object",
      "properties": {
        "roadmap_theme": {"type": "string"},
        "budget": {"type": "number"},
        "quotas": {"type": "object"},
        "deadlines": {"type": "string"}
      }
    },
    "steering_options": {
      "type": "object",
      "properties": {
        "create_steering_files": {"type": "boolean"},
        "feature_name": {"type": "string"},
        "inclusion_rule": {"type": "string", "enum": ["always", "fileMatch", "manual"]},
        "file_match_pattern": {"type": "string"},
        "overwrite_existing": {"type": "boolean"}
      },
      "description": "Optional steering file creation options"
    }
  },
  "required": ["raw_intent"]
}
```

### 9. generate_design_options

**Description**: Translates approved requirements into Conservative/Balanced/Bold design options with Impact vs Effort analysis. Optionally creates steering files for design guidance.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "requirements": {
      "type": "string",
      "description": "Approved requirements document content"
    },
    "steering_options": {
      "type": "object",
      "properties": {
        "create_steering_files": {"type": "boolean"},
        "feature_name": {"type": "string"},
        "inclusion_rule": {"type": "string", "enum": ["always", "fileMatch", "manual"]},
        "file_match_pattern": {"type": "string"},
        "overwrite_existing": {"type": "boolean"}
      },
      "description": "Optional steering file creation options"
    }
  },
  "required": ["requirements"]
}
```

### 10. generate_task_plan

**Description**: Creates phased implementation plan with Guardrails Check, Immediate Wins, Short-Term, and Long-Term tasks. Optionally creates steering files for implementation guidance.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "design": {
      "type": "string",
      "description": "Approved design document content"
    },
    "limits": {
      "type": "object",
      "properties": {
        "max_vibes": {"type": "number"},
        "max_specs": {"type": "number"},
        "budget_usd": {"type": "number"}
      }
    },
    "steering_options": {
      "type": "object",
      "properties": {
        "create_steering_files": {"type": "boolean"},
        "feature_name": {"type": "string"},
        "inclusion_rule": {"type": "string", "enum": ["always", "fileMatch", "manual"]},
        "file_match_pattern": {"type": "string"},
        "overwrite_existing": {"type": "boolean"}
      },
      "description": "Optional steering file creation options"
    }
  },
  "required": ["design"]
}
```

## Consulting Techniques Reference

The system applies these consulting techniques automatically based on the input:

### MECE Framework
- **Purpose**: Mutually Exclusive, Collectively Exhaustive analysis
- **Application**: Breaking down quota drivers into non-overlapping categories
- **Output**: Structured categorization of optimization opportunities

### Pyramid Principle  
- **Purpose**: Answer-first communication structure
- **Application**: Organizing recommendations with main point first, then supporting evidence
- **Output**: Clear, executive-ready summaries

### Value Driver Tree
- **Purpose**: Decompose quota usage into measurable drivers
- **Application**: Identifying root causes of inefficiency
- **Output**: Hierarchical breakdown of cost factors

### Zero-Based Design
- **Purpose**: "From scratch" efficient designs
- **Application**: Radical rethinking of workflow structure
- **Output**: Bold optimization alternatives

### Impact vs Effort Matrix
- **Purpose**: Prioritize optimization tasks
- **Application**: Ranking improvements by benefit vs implementation cost
- **Output**: Prioritized action plan

### Value Proposition Canvas
- **Purpose**: Link user jobs, pains, and gains
- **Application**: Ensuring optimizations address real user needs
- **Output**: User-centered optimization strategy

### Option Framing
- **Purpose**: Present Conservative/Balanced/Bold alternatives
- **Application**: Providing stakeholders with risk-appropriate choices
- **Output**: Three-option recommendation framework

## Workflow Patterns

### Quick Validation → Full Analysis
```
1. validate_idea_quick → Get PASS/FAIL + 3 options
2. If PASS: Choose option A/B/C based on constraints
3. If Option B (Full System): Use optimize_intent for complete analysis
4. Generate PM documents as needed for stakeholder communication
```

### Complete PM Workflow
```
1. generate_requirements → Structure problem with MoSCoW
2. generate_design_options → Explore Conservative/Balanced/Bold
3. generate_task_plan → Create phased implementation
4. generate_management_onepager → Executive summary
5. generate_pr_faq → Launch communication
```

### Technical Optimization
```
1. analyze_workflow → Apply consulting techniques
2. generate_roi_analysis → Compare scenarios
3. optimize_intent → Generate optimized specs
4. get_consulting_summary → Professional analysis
```

## Error Handling

All tools implement comprehensive error handling:

### Common Error Types
- **Validation Errors**: Invalid input format or missing required fields
- **Processing Errors**: Failures during analysis or optimization
- **Resource Errors**: Quota or performance limitations exceeded

### Error Response Format
```json
{
  "content": [{
    "type": "text",
    "text": "Error: [error message]"
  }],
  "isError": true
}
```

### Best Practices
1. Always validate input against the schema before calling tools
2. Handle errors gracefully in your client application
3. Use debug logging to troubleshoot issues
4. Check server health endpoint if tools are consistently failing

## Steering File Integration

### Overview
PM document generation tools (generate_requirements, generate_design_options, generate_management_onepager, generate_pr_faq, generate_task_plan) can automatically create Kiro steering files from their outputs. This creates a self-improving development environment where PM agent expertise becomes persistent guidance.

### Basic Usage
Add `steering_options` to any PM document generation tool:

```json
{
  "raw_intent": "Build user authentication system",
  "steering_options": {
    "create_steering_files": true,
    "feature_name": "user-auth",
    "inclusion_rule": "fileMatch",
    "file_match_pattern": "auth*|user*|login*"
  }
}
```

### Inclusion Rules
- **always**: Steering file always included in context
- **fileMatch**: Included only when matching files are open
- **manual**: Included only when explicitly referenced with `#filename`

### Response with Steering Files
When steering files are created, responses include additional metadata:

```json
{
  "content": [...],
  "metadata": {
    "steeringFileCreated": true,
    "steeringFiles": [
      {
        "filename": "requirements-user-auth.md",
        "action": "created",
        "fullPath": ".kiro/steering/requirements-user-auth.md"
      }
    ]
  }
}
```

For detailed steering file documentation, see [Steering File MCP Integration](./steering-file-mcp-integration.md).

## Performance Considerations

### Response Times
- **validate_idea_quick**: 0.5-1 seconds (fast validation)
- **optimize_intent**: 2-5 seconds (full analysis)
- **analyze_workflow**: 1-3 seconds (focused analysis)
- **generate_roi_analysis**: 1-2 seconds (calculations)
- **get_consulting_summary**: 1-2 seconds (formatting)
- **PM document tools**: 1-3 seconds each (document generation)
- **Steering file creation**: +100-300ms per file

### Quota Usage
Each tool call consumes server resources:
- Quick validation: 1 quota unit
- Simple analysis: 1-2 quota units
- Complex optimization: 3-5 quota units
- Full intent processing: 5-10 quota units
- PM document generation: 2-3 quota units each

### Optimization Tips
1. Use validate_idea_quick first for fast screening
2. Use specific techniques in analyze_workflow to focus analysis
3. Provide structured input to reduce processing time
4. Cache results for repeated similar requests
5. Use health check endpoint to monitor server performance