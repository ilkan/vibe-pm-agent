# PM Workflow Guide

This guide provides step-by-step workflows for using the PM Agent in different scenarios, from quick idea validation to comprehensive product management processes.

## Overview

The PM Agent provides structured workflows that mirror professional product management practices:

1. **Quick Validation** - Fast idea screening with PASS/FAIL + 3 options (30 seconds)
2. **Full PM Process** - Complete requirements → design → tasks → communication workflow (10-15 minutes)
3. **Technical Optimization** - Focus on workflow efficiency and cost reduction (5-8 minutes)
4. **Executive Communication** - Generate artifacts for leadership alignment (3-5 minutes)

---

## Workflow 1: Quick Validation & Implementation

**Use Case**: You have an idea and want fast validation with clear next steps
**Time**: 2-5 minutes
**Tools**: `validate_idea_quick` → `optimize_intent`
**Best For**: Brainstorming, technical spikes, individual developer optimization

### Step 1: Validate the Idea
```json
{
  "tool": "validate_idea_quick",
  "input": {
    "idea": "Build automated API optimization system with intelligent batching and caching to reduce our monthly costs by 60%",
    "context": {
      "urgency": "medium",
      "budget_range": "small",
      "team_size": 3
    }
  }
}
```

**Expected Output**: 
- PASS/FAIL verdict with reasoning
- 3 structured options (Conservative/Balanced/Bold)
- Specific next steps for each option

### Step 2: Choose Your Path
Based on the validation output, select:
- **Option A (Conservative)**: Lower risk, basic implementation, faster delivery
- **Option B (Balanced) ✅**: Recommended approach with optimal risk/reward balance
- **Option C (Bold)**: Comprehensive solution with higher complexity and impact

### Step 3: Deep Analysis (if proceeding)
```json
{
  "tool": "optimize_intent", 
  "input": {
    "intent": "Build automated API optimization system with intelligent batching and caching to reduce costs by 60%",
    "parameters": {
      "expectedUserVolume": 1000,
      "performanceSensitivity": "medium"
    }
  }
}
```

**Expected Output**: 
- Optimized Kiro spec ready for implementation
- ROI analysis with Conservative/Balanced/Bold scenarios
- Consulting analysis using 2-3 relevant frameworks
- Specific cost savings projections

### Example Flow
```
Input: "Optimize our daily report generation"
↓
validate_idea_quick → PASS + 3 options
↓
Choose Option B (Balanced)
↓
optimize_intent → 45% cost savings + optimized spec
↓
Ready to implement
```

---

## Workflow 2: Complete PM Process

**Use Case**: New feature development requiring stakeholder alignment and comprehensive planning
**Time**: 10-15 minutes  
**Tools**: `generate_requirements` → `generate_design_options` → `generate_task_plan` → `generate_management_onepager` → `generate_pr_faq`
**Best For**: New features, major initiatives, cross-functional projects, executive approval

### Step 1: Structure Requirements
```json
{
  "tool": "generate_requirements",
  "input": {
    "raw_intent": "Create a customer churn prediction system that helps our success team proactively engage at-risk customers before they cancel",
    "context": {
      "roadmap_theme": "Customer Retention & Growth",
      "budget": 50000,
      "deadlines": "Q2 launch target for competitive advantage"
    }
  }
}
```

**Expected Output**: 
- Business Goal (WHY) with clear value proposition
- User Needs analysis (Jobs/Pains/Gains)
- Functional Requirements (WHAT) with specific capabilities
- MoSCoW prioritization with justifications
- Go/No-Go timing decision with reasoning

### Step 2: Explore Design Options
```json
{
  "tool": "generate_design_options",
  "input": {
    "requirements": "[paste requirements output from step 1]"
  }
}
```

**Expected Output**: 
- Problem framing with timing rationale
- Conservative/Balanced ✅/Bold alternatives
- Impact vs Effort matrix placement
- Right-time recommendation

### Step 3: Create Implementation Plan
```json
{
  "tool": "generate_task_plan",
  "input": {
    "design": "[paste design output from step 2]",
    "limits": {
      "max_vibes": 500,
      "max_specs": 25,
      "budget_usd": 50000
    }
  }
}
```

**Expected Output**: 
- Task 0: Guardrails Check (fail fast if limits exceeded)
- Immediate Wins (1-3 tasks, 1-2 weeks)
- Short-Term (3-6 tasks, 2-6 weeks)  
- Long-Term (2-4 tasks, 6+ weeks)
- Each task with ID/Name/Description/Acceptance Criteria/Effort/Impact/Priority

### Step 4: Executive Summary
```json
{
  "tool": "generate_management_onepager",
  "input": {
    "requirements": "[requirements from step 1]",
    "design": "[design from step 2]", 
    "tasks": "[tasks from step 3]",
    "roi_inputs": {
      "cost_naive": 200,
      "cost_balanced": 80,
      "cost_bold": 30
    }
  }
}
```

**Expected Output**: 
- Answer (1-line decision and timing)
- Because (3 core reasons)
- What (scope bullets)
- Risks & Mitigations (3 key risks with specific mitigations)
- Options comparison table
- ROI snapshot with effort/impact/cost/timing
- Right-time recommendation (2-4 lines)

### Step 5: Launch Communication
```json
{
  "tool": "generate_pr_faq",
  "input": {
    "requirements": "[requirements from step 1]",
    "design": "[design from step 2]",
    "target_date": "2024-06-30"
  }
}
```

**Expected Output**: 
- Future-dated press release (under 250 words)
- Comprehensive FAQ (10 specific questions)
- Launch checklist with owners and timeline

### Example Flow
```
Input: "Build churn prediction system"
↓
generate_requirements → Business goals + MoSCoW + Go/No-Go
↓
generate_design_options → 3 alternatives + Impact vs Effort
↓
generate_task_plan → Phased roadmap with guardrails
↓
generate_management_onepager → Executive summary
↓
generate_pr_faq → Launch communication
↓
Ready for stakeholder alignment and implementation
```

---

## Workflow 3: Technical Optimization

**Use Case**: Improve existing processes, reduce costs, optimize performance
**Time**: 5-8 minutes
**Tools**: `analyze_workflow` → `generate_roi_analysis` → `get_consulting_summary`
**Best For**: Process improvement, cost reduction, performance optimization, technical debt

### Step 1: Analyze Current Workflow
```json
{
  "tool": "analyze_workflow",
  "input": {
    "workflow": {
      "id": "daily-report-generation",
      "steps": [
        {
          "id": "fetch-data",
          "type": "data_retrieval", 
          "description": "Pull data from 5 different APIs sequentially",
          "quotaCost": 15
        },
        {
          "id": "process-data",
          "type": "processing",
          "description": "Transform and aggregate data in real-time",
          "quotaCost": 10
        },
        {
          "id": "generate-report",
          "type": "output",
          "description": "Create PDF report and email to 50+ stakeholders",
          "quotaCost": 5
        }
      ],
      "estimatedComplexity": 8
    },
    "techniques": ["MECE", "ValueDriverTree", "ImpactEffort"]
  }
}
```

**Expected Output**: 
- MECE analysis of quota drivers
- Value driver tree showing cost breakdown
- Impact vs Effort matrix for optimizations
- Specific optimization recommendations with savings estimates

### Step 2: Compare ROI Scenarios
```json
{
  "tool": "generate_roi_analysis",
  "input": {
    "workflow": "[current workflow from step 1]",
    "optimizedWorkflow": "[optimized version if available]",
    "zeroBasedSolution": "[radical redesign if explored]"
  }
}
```

**Expected Output**: 
- Conservative/Balanced/Bold scenario comparison
- Cost savings breakdown by optimization type
- Implementation effort and risk assessment
- Best option recommendation with rationale

### Step 3: Professional Summary
```json
{
  "tool": "get_consulting_summary",
  "input": {
    "analysis": {
      "techniquesUsed": ["MECE", "ValueDriverTree", "ImpactEffort"],
      "keyFindings": ["Batching can reduce API calls by 70%", "Caching eliminates 40% of processing", "Async processing reduces wait time by 80%"],
      "totalQuotaSavings": 45
    },
    "techniques": ["MECE", "ValueDriverTree"]
  }
}
```

**Expected Output**: 
- Executive summary with Pyramid Principle structure
- Key findings with supporting evidence
- Structured recommendations with expected outcomes
- Technique-specific insights and actionable next steps

### Example Flow
```
Input: Existing daily report workflow
↓
analyze_workflow → 45% savings potential identified
↓
generate_roi_analysis → Conservative (20%), Balanced (45%), Bold (70%)
↓
get_consulting_summary → Professional analysis report
↓
Ready for implementation planning
```

---

## Workflow 4: Executive Communication Only

**Use Case**: You have requirements and design, need executive artifacts for approval/alignment
**Time**: 3-5 minutes
**Tools**: `generate_management_onepager` + `generate_pr_faq`
**Best For**: Leadership presentations, budget approval, launch planning, stakeholder alignment

### Step 1: Create Executive Summary
Use existing requirements and design documents to generate management one-pager with:
- Clear decision recommendation
- Supporting rationale
- Risk assessment
- ROI comparison
- Timing justification

### Step 2: Create Launch Communication  
Use same inputs to generate PR-FAQ for broader stakeholder alignment with:
- Customer value proposition
- Launch readiness assessment
- FAQ addressing common concerns
- Implementation checklist

### Example Flow
```
Input: Existing requirements + design documents
↓
generate_management_onepager → Executive decision document
↓
generate_pr_faq → Launch communication plan
↓
Ready for leadership presentation and stakeholder alignment
```

---

## Advanced Patterns

### Decision Gate Pattern
Use for stage-gate processes and milestone reviews:
```
validate_idea_quick → [GO/NO-GO decision] → 
  IF GO: optimize_intent OR generate_requirements
  IF NO-GO: Document rationale and revisit later
```

### Full Product Lifecycle
Use for comprehensive product development:
```
generate_requirements → generate_design_options → generate_task_plan → 
[implement] → analyze_workflow → [optimize] → generate_pr_faq → [launch]
```

### Iterative Refinement
Use for complex or uncertain projects:
```
validate_idea_quick → generate_requirements → [stakeholder review] → 
generate_design_options → [technical review] → generate_task_plan → 
[resource review] → generate_management_onepager → [executive approval]
```

---

## Best Practices

### Input Quality Guidelines
1. **Be Specific**: Include concrete goals, constraints, and success criteria
2. **Quantify When Possible**: Add metrics, budgets, timelines, user volumes
3. **Provide Context**: Include team size, urgency, business priorities, competitive landscape
4. **Use Examples**: Reference specific use cases, user scenarios, or technical requirements
5. **Include Constraints**: Mention budget limits, technical constraints, timeline pressures

### Tool Selection Strategy
1. **Start with Validation**: Always use `validate_idea_quick` for new ideas
2. **Follow Recommendations**: Use suggested next steps from tool outputs
3. **Match Your Phase**: Choose workflow based on project maturity and needs
4. **Consider Audience**: Use executive tools when communicating up the organization
5. **Iterate Appropriately**: Don't over-engineer simple optimizations

### Output Utilization Tips
1. **Focus on Recommendations**: Pay attention to highlighted approaches and rationale
2. **Consider Trade-offs**: Evaluate effort vs impact for different options systematically
3. **Validate Assumptions**: Review analysis assumptions and adjust inputs if needed
4. **Share Artifacts**: Use professional outputs for team alignment and documentation
5. **Act on Insights**: Convert analysis into concrete action plans and decisions

### Quality Indicators

#### Good Validation Results
- Clear PASS/FAIL verdict with specific reasoning
- Distinct options with clear trade-offs
- Actionable next steps for each option
- Appropriate complexity assessment

#### Good Requirements
- Concrete business goals with measurable outcomes
- Specific MoSCoW items with clear justifications
- Clear Go/No-Go rationale based on timing and value
- Well-defined user needs and constraints

#### Good Design Options
- Distinct Conservative/Balanced/Bold approaches
- Clear trade-offs between effort, risk, and impact
- Appropriate placement in Impact vs Effort matrix
- Compelling right-time recommendation

#### Good Task Plans
- Specific, actionable tasks with clear owners
- Realistic effort estimates and priority assignments
- Clear acceptance criteria for each task
- Appropriate phasing with logical dependencies

#### Good Executive Documents
- Clear recommendations with supporting evidence
- Appropriate level of detail for the audience
- Compelling business case with ROI analysis
- Professional formatting and structure

---

## Troubleshooting

### Common Issues & Solutions

#### Vague Validation Results
**Problem**: Generic PASS/FAIL without specific guidance
**Solution**: Provide more specific intent, context, and constraints

#### Generic Recommendations  
**Problem**: Analysis lacks specificity or actionable insights
**Solution**: Include technical details, budget constraints, and success metrics

#### Misaligned Design Options
**Problem**: Options don't seem relevant or realistic
**Solution**: Review and refine requirements before generating design options

#### Incomplete Task Plans
**Problem**: Tasks are too high-level or lack clear acceptance criteria
**Solution**: Ensure design document includes sufficient technical detail

#### Weak Executive Documents
**Problem**: Recommendations lack compelling business case
**Solution**: Strengthen requirements and ROI inputs before generating executive artifacts

### Iteration Strategy
1. **Start Simple**: Begin with quick validation to establish direction
2. **Refine Iteratively**: Use initial outputs to improve subsequent inputs
3. **Validate Alignment**: Check that design options align with requirements
4. **Ensure Actionability**: Verify that task plans are specific and implementable
5. **Test Communication**: Review executive documents for clarity and persuasiveness

### Performance Optimization
1. **Use Quick Tools First**: Start with `validate_idea_quick` for fast feedback
2. **Batch Related Calls**: Generate multiple PM documents in sequence
3. **Reuse Outputs**: Use previous outputs as inputs for subsequent tools
4. **Cache Results**: Save outputs for reference and iteration
5. **Monitor Quality**: Track output quality and adjust inputs accordingly