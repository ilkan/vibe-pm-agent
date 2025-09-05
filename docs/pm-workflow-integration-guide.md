# PM Workflow Integration Guide

This guide shows how to integrate competitive analysis and market sizing tools into existing product management workflows and processes.

## Overview

The competitive intelligence tools in Vibe PM Agent are designed to seamlessly integrate with existing PM workflows, providing strategic context that enhances decision-making at every stage of product development.

## Integration Points

### 1. Product Discovery Phase

**Traditional Workflow**:
```
Idea Generation → User Research → Problem Validation → Solution Exploration
```

**Enhanced with Competitive Intelligence**:
```
Idea Generation → Competitive Landscape Analysis → Market Sizing → User Research → Problem Validation → Solution Exploration
```

#### Implementation
```json
// Step 1: Quick competitive check during idea evaluation
{
  "tool": "analyze_competitor_landscape",
  "input": {
    "feature_idea": "Initial product concept",
    "analysis_depth": "quick"
  }
}

// Step 2: Market opportunity validation
{
  "tool": "calculate_market_sizing",
  "input": {
    "feature_idea": "Initial product concept",
    "market_definition": {
      "industry": "Target industry",
      "geography": ["Primary markets"]
    }
  }
}
```

### 2. Product Planning Phase

**Traditional Workflow**:
```
Requirements Gathering → Feature Prioritization → Roadmap Planning → Resource Allocation
```

**Enhanced with Competitive Intelligence**:
```
Requirements Gathering → Competitive Analysis → Market Sizing → Feature Prioritization → Strategic Alignment → Roadmap Planning → Resource Allocation
```

#### Implementation
```json
// Comprehensive competitive analysis for strategic planning
{
  "tool": "analyze_competitor_landscape",
  "input": {
    "feature_idea": "Product concept with requirements",
    "analysis_depth": "comprehensive",
    "steering_options": {
      "create_steering_files": true,
      "feature_name": "product-name",
      "inclusion_rule": "fileMatch"
    }
  }
}

// Market sizing for investment decisions
{
  "tool": "calculate_market_sizing",
  "input": {
    "feature_idea": "Product concept",
    "market_definition": {
      "industry": "Target industry",
      "geography": ["All target markets"],
      "customer_segments": ["All target segments"]
    },
    "sizing_methods": ["top-down", "bottom-up"]
  }
}
```

### 3. Go-to-Market Planning

**Traditional Workflow**:
```
Market Research → Positioning → Pricing → Launch Strategy → Marketing Plan
```

**Enhanced with Competitive Intelligence**:
```
Competitive Analysis → Market Sizing → Market Research → Positioning → Pricing → Launch Strategy → Marketing Plan
```

#### Implementation
```json
// Competitive positioning analysis
{
  "tool": "analyze_competitor_landscape",
  "input": {
    "feature_idea": "Final product concept",
    "market_context": {
      "industry": "Target industry",
      "geography": ["Launch markets"],
      "target_segment": "Primary customer segment"
    },
    "analysis_depth": "comprehensive"
  }
}

// Market opportunity quantification for GTM strategy
{
  "tool": "calculate_market_sizing",
  "input": {
    "feature_idea": "Final product concept",
    "market_definition": {
      "industry": "Target industry",
      "geography": ["Launch markets"],
      "customer_segments": ["Primary segments"]
    }
  }
}
```

## Workflow Templates

### Template 1: New Product Development

**Phase 1: Opportunity Assessment**
```bash
# Week 1: Initial validation
analyze_competitor_landscape (quick) → Competitive landscape overview
calculate_market_sizing (basic) → Market opportunity validation
validate_market_timing → Right-time assessment

# Week 2: Strategic analysis
analyze_business_opportunity → Business justification
assess_strategic_alignment → Company fit validation
```

**Phase 2: Detailed Planning**
```bash
# Week 3-4: Comprehensive analysis
analyze_competitor_landscape (comprehensive) → Detailed competitive intelligence
calculate_market_sizing (multi-methodology) → Thorough market analysis
generate_business_case → ROI and risk assessment

# Week 5: Communication and approval
create_stakeholder_communication → Executive presentation
```

### Template 2: Feature Prioritization

**Monthly Prioritization Process**:
```bash
# For each major feature candidate:
analyze_competitor_landscape (standard) → Competitive context
calculate_market_sizing → Market impact assessment
analyze_business_opportunity → Business value analysis

# Synthesis and decision:
assess_strategic_alignment → Strategic fit scoring
generate_business_case → ROI comparison
create_stakeholder_communication → Prioritization rationale
```

### Template 3: Market Entry Decision

**Market Entry Evaluation**:
```bash
# Phase 1: Market intelligence (Week 1)
analyze_competitor_landscape (comprehensive) → Competitive dynamics
calculate_market_sizing (multiple scenarios) → Market opportunity

# Phase 2: Strategic assessment (Week 2)
validate_market_timing → Entry timing analysis
assess_strategic_alignment → Strategic fit evaluation

# Phase 3: Business case (Week 3)
generate_business_case → Investment analysis
optimize_resource_allocation → Resource planning

# Phase 4: Decision communication (Week 4)
create_stakeholder_communication → Executive recommendation
```

## Integration with Existing Tools

### Jira/Linear Integration

**Epic Creation Workflow**:
1. Run competitive analysis for epic scope
2. Generate market sizing for business justification
3. Create steering files for persistent context
4. Link steering files in epic description
5. Use competitive insights for acceptance criteria

**Example Epic Template**:
```markdown
## Epic: [Feature Name]

### Business Justification
- Market Opportunity: [From market sizing analysis]
- Competitive Advantage: [From competitive analysis]
- Strategic Alignment: [From strategic assessment]

### Competitive Context
- Key Competitors: [From competitive analysis]
- Differentiation Strategy: [From competitive recommendations]
- Market Gaps: [From competitive analysis]

### Success Metrics
- Market Share Target: [From market sizing]
- Competitive Benchmarks: [From competitive analysis]
- Business Impact: [From business case]

### Related Analysis
- Competitive Analysis: [Link to steering file]
- Market Sizing: [Link to steering file]
- Business Case: [Link to analysis]
```

### Confluence/Notion Integration

**Product Requirements Document (PRD) Template**:
```markdown
# Product Requirements Document: [Product Name]

## 1. Executive Summary
[Generated from create_stakeholder_communication]

## 2. Market Context
### Competitive Landscape
[From analyze_competitor_landscape]

### Market Opportunity
[From calculate_market_sizing]

## 3. Strategic Rationale
[From assess_strategic_alignment]

## 4. Business Case
[From generate_business_case]

## 5. Product Requirements
[Traditional requirements enhanced with competitive context]

## 6. Success Metrics
[Competitive benchmarks and market share targets]
```

### Roadmap Planning Integration

**Quarterly Planning Process**:
```bash
# Pre-planning (Month 1)
analyze_competitor_landscape → Update competitive intelligence
calculate_market_sizing → Refresh market opportunities
validate_market_timing → Assess timing for major initiatives

# Planning (Month 2)
assess_strategic_alignment → Evaluate initiative alignment
generate_business_case → ROI analysis for major features
optimize_resource_allocation → Resource planning

# Communication (Month 3)
create_stakeholder_communication → Roadmap presentation
```

## Steering File Workflows

### Steering File Strategy

**File Organization**:
```
.kiro/steering/
├── competitive/
│   ├── [product]-competitive-analysis.md
│   └── [product]-market-sizing.md
├── strategic/
│   ├── [product]-business-case.md
│   └── [product]-strategic-alignment.md
└── communication/
    ├── [product]-executive-onepager.md
    └── [product]-pr-faq.md
```

**Inclusion Rules by Use Case**:

1. **Always Include** (`inclusion: always`):
   - Core competitive intelligence
   - Strategic principles
   - Company positioning

2. **File Match** (`inclusion: fileMatch`):
   - Product-specific competitive context
   - Market sizing assumptions
   - Feature-specific guidance

3. **Manual Include** (`inclusion: manual`):
   - Sensitive competitive information
   - Executive communications
   - Strategic decisions

### Steering File Maintenance

**Update Schedule**:
- **Competitive Analysis**: Quarterly updates
- **Market Sizing**: Semi-annual updates
- **Strategic Alignment**: Annual updates
- **Business Cases**: As needed for decisions

**Update Triggers**:
- Major competitor moves
- Market condition changes
- Strategic priority shifts
- New market entry

## Team Workflows

### Product Manager Workflow

**Daily/Weekly**:
- Review competitive intelligence steering files
- Monitor competitor moves and market changes
- Update feature priorities based on competitive context

**Monthly**:
- Refresh competitive analysis for active features
- Update market sizing for major initiatives
- Generate business cases for new opportunities

**Quarterly**:
- Comprehensive competitive landscape review
- Strategic alignment assessment
- Roadmap planning with competitive context

### Engineering Team Integration

**Sprint Planning**:
- Review competitive context from steering files
- Consider competitive benchmarks in acceptance criteria
- Factor competitive advantages into technical decisions

**Feature Development**:
- Reference competitive analysis for feature scope
- Use market sizing for performance targets
- Validate assumptions against competitive intelligence

### Executive Team Integration

**Monthly Business Reviews**:
- Competitive positioning updates
- Market opportunity assessments
- Strategic alignment validation

**Quarterly Planning**:
- Comprehensive competitive analysis
- Market sizing for investment decisions
- Strategic communication materials

## Metrics and KPIs

### Competitive Intelligence Metrics

**Analysis Quality**:
- Source credibility scores
- Data freshness indicators
- Confidence level tracking

**Business Impact**:
- Features influenced by competitive analysis
- Market share gains from competitive insights
- Revenue impact of competitive positioning

### Market Sizing Metrics

**Accuracy Tracking**:
- Actual vs. projected market size
- Market share achievement vs. projections
- Revenue realization vs. market estimates

**Decision Impact**:
- Investment decisions influenced by market sizing
- Resource allocation based on market opportunity
- Strategic pivots driven by market analysis

## Best Practices by Team Size

### Startup Teams (1-10 people)

**Focus Areas**:
- Quick competitive validation
- Market opportunity sizing
- Right-time market entry

**Recommended Workflow**:
```bash
# Weekly competitive check
analyze_competitor_landscape (quick) → Stay informed

# Monthly market validation
calculate_market_sizing → Validate assumptions
validate_market_timing → Timing decisions
```

### Scale-up Teams (10-100 people)

**Focus Areas**:
- Comprehensive competitive intelligence
- Strategic feature prioritization
- Market expansion planning

**Recommended Workflow**:
```bash
# Bi-weekly competitive analysis
analyze_competitor_landscape (standard) → Feature context

# Monthly strategic analysis
assess_strategic_alignment → Priority validation
generate_business_case → Investment decisions
```

### Enterprise Teams (100+ people)

**Focus Areas**:
- Systematic competitive monitoring
- Portfolio-level market analysis
- Strategic communication

**Recommended Workflow**:
```bash
# Weekly competitive monitoring
analyze_competitor_landscape (comprehensive) → Strategic intelligence

# Monthly portfolio analysis
calculate_market_sizing → Portfolio optimization
create_stakeholder_communication → Executive updates
```

## Common Integration Challenges

### Challenge 1: Analysis Overload

**Problem**: Too much analysis, not enough action
**Solution**: 
- Use quick analysis for routine decisions
- Reserve comprehensive analysis for strategic decisions
- Set clear decision criteria and timelines

### Challenge 2: Inconsistent Data

**Problem**: Different analyses producing conflicting insights
**Solution**:
- Use consistent market definitions across analyses
- Document assumptions and methodologies
- Regular data validation and updates

### Challenge 3: Poor Adoption

**Problem**: Teams not using competitive intelligence
**Solution**:
- Integrate into existing workflows
- Provide clear value demonstration
- Train teams on tool usage and interpretation

### Challenge 4: Stale Intelligence

**Problem**: Outdated competitive and market information
**Solution**:
- Set up regular update schedules
- Monitor competitive moves and market changes
- Use data freshness indicators and alerts

## Success Metrics

### Adoption Metrics
- Number of analyses performed per month
- Percentage of features with competitive context
- Steering file usage and updates

### Quality Metrics
- Analysis accuracy and reliability
- Source credibility and freshness
- Stakeholder satisfaction with insights

### Business Impact Metrics
- Revenue influenced by competitive intelligence
- Market share gains from competitive positioning
- Cost savings from market timing decisions
- Strategic decisions informed by analysis