# PM Workflow Guide

This guide provides comprehensive patterns for using the PM Agent Intent Optimizer in product management workflows.

## Overview

The PM Agent Intent Optimizer supports three main workflow patterns:

1. **Quick Validation Workflow**: Fast idea screening and option generation
2. **Full PM Workflow**: Comprehensive requirements → design → tasks → documents
3. **Technical Optimization Workflow**: Developer intent → optimized specifications

## Quick Validation Workflow

### When to Use
- Initial idea screening before investing significant time
- Stakeholder alignment on whether to proceed with an idea
- Generating structured options for decision-making
- Fast feedback during brainstorming sessions

### Step-by-Step Process

#### Step 1: Prepare Your Idea
Format your idea clearly with:
- **Problem Statement**: What specific problem are you solving?
- **Target Users**: Who will benefit from this solution?
- **Success Criteria**: How will you measure success?
- **Constraints**: What limitations do you have (time, budget, team)?

**Example**:
```
Idea: "Create an automated system to generate daily reports from our database and email them to stakeholders"

Context:
- Urgency: Medium (needed for quarterly planning)
- Budget Range: Small ($5K-$15K)
- Team Size: 3 people (1 developer, 1 analyst, 1 PM)
```

#### Step 2: Run Quick Validation
Use the `validate_idea_quick` tool:

```json
{
  "idea": "Create an automated system to generate daily reports from our database and email them to stakeholders",
  "context": {
    "urgency": "medium",
    "budget_range": "small",
    "team_size": 3
  }
}
```

#### Step 3: Interpret Results
The tool provides:
- **PASS/FAIL Verdict**: Clear go/no-go decision with reasoning
- **3 Options (A/B/C)**: Structured alternatives with effort/timeline estimates
- **Next Steps**: Recommended actions based on the validation

#### Step 4: Make Decision
- **If PASS**: Choose one of the 3 options and proceed to full analysis
- **If FAIL**: Address the issues mentioned in reasoning and re-validate
- **If Uncertain**: Gather more information and re-run validation

### Best Practices for Quick Validation

**Do:**
- Be specific about the problem and solution
- Include realistic constraints and context
- Use validation early and often in ideation
- Share results with stakeholders for alignment

**Don't:**
- Use vague or overly broad ideas
- Skip context - it's crucial for accurate validation
- Ignore FAIL verdicts without addressing root issues
- Use validation as a substitute for market research
## F
ull PM Workflow: Idea to Launch

### When to Use
- New product features or initiatives
- Complex projects requiring stakeholder alignment
- Executive communication and approval processes
- Structured product development with clear phases

### Step-by-Step Process

#### Phase 1: Requirements Analysis
Use `generate_requirements` to structure the problem:

**Input Preparation**:
- Raw intent: Describe what you want to build and why
- Context: Include roadmap themes, budget, quotas, deadlines

**Example**:
```json
{
  "raw_intent": "Build a customer feedback sentiment analysis system to help product teams respond faster to customer issues and improve satisfaction scores",
  "context": {
    "roadmap_theme": "Customer Experience Excellence",
    "budget": 25000,
    "quotas": {
      "maxVibes": 100,
      "maxSpecs": 15
    },
    "deadlines": "Must launch before Q2 planning cycle (6 weeks)"
  }
}
```

**Output Analysis**:
- Review Business Goal (WHY) for clarity and alignment
- Validate User Needs (Jobs/Pains/Gains) with actual users
- Check Functional Requirements (WHAT) for completeness
- Assess Constraints/Risks for feasibility
- Review MoSCoW prioritization for scope management
- Confirm Right-Time verdict aligns with business priorities

#### Phase 2: Design Options
Use `generate_design_options` with approved requirements:

**Process**:
1. Input the requirements document from Phase 1
2. Review the 3 generated options (Conservative/Balanced/Bold)
3. Analyze the Impact vs Effort matrix placement
4. Consider the right-time recommendation

**Decision Framework**:
- **Conservative**: Lower risk, proven approaches, faster delivery
- **Balanced**: Optimal risk/reward ratio, recommended default
- **Bold**: Higher impact, innovative approaches, longer timeline

#### Phase 3: Task Planning
Use `generate_task_plan` with selected design:

**Key Elements**:
- **Guardrails Check (Task 0)**: Validates project limits before starting
- **Immediate Wins (1-3 tasks)**: Quick value delivery in first 2 weeks
- **Short-Term (3-6 tasks)**: Core functionality in 4-8 weeks
- **Long-Term (2-4 tasks)**: Advanced features and optimization

**Task Structure**:
Each task includes:
- ID and Name for tracking
- Description and Acceptance Criteria for clarity
- Effort (S/M/L) and Impact (Low/Med/High) for prioritization
- Priority (MoSCoW) for scope management

#### Phase 4: Executive Communication
Generate management documents for stakeholder alignment:

**Management One-Pager** (`generate_management_onepager`):
- Use for executive approval and resource allocation
- Includes decision recommendation, rationale, options, ROI
- Keep under 120 lines for executive attention spans
- Focus on business impact and timing rationale

**PR-FAQ Document** (`generate_pr_faq`):
- Use for cross-functional alignment and launch planning
- Includes future-dated press release and comprehensive FAQ
- Addresses customer value, risks, success metrics
- Provides launch checklist with owners and timelines

### Workflow Integration Points

#### Stakeholder Reviews
- **Requirements Review**: Product team, engineering leads, key stakeholders
- **Design Review**: Architecture team, security, compliance
- **Task Review**: Engineering team, QA, DevOps
- **Executive Review**: Leadership team, budget approvers

#### Decision Gates
- **Go/No-Go after Requirements**: Based on right-time verdict and business alignment
- **Design Selection**: Choose Conservative/Balanced/Bold based on risk tolerance
- **Scope Finalization**: Confirm MoSCoW priorities and task breakdown
- **Launch Approval**: Executive sign-off on one-pager and PR-FAQ

#### Iteration Cycles
- **Requirements Refinement**: Update based on stakeholder feedback
- **Design Iteration**: Adjust options based on technical feasibility
- **Task Adjustment**: Modify breakdown based on team capacity
- **Communication Updates**: Revise documents as scope evolves## T
echnical Optimization Workflow

### When to Use
- Existing workflows need efficiency improvements
- Developer intent needs translation to optimized specs
- Quota consumption is too high for current processes
- Technical debt reduction and optimization initiatives

### Step-by-Step Process

#### Step 1: Intent Analysis
Use `optimize_intent` for comprehensive analysis:

**Input Preparation**:
- Detailed description of what you want to accomplish
- Expected user volume and performance requirements
- Cost constraints (vibes, specs, budget)
- Performance sensitivity level

**Example**:
```json
{
  "intent": "Process customer feedback from email, chat, and surveys to generate weekly sentiment analysis reports for the product team",
  "parameters": {
    "expectedUserVolume": 500,
    "costConstraints": {
      "maxVibes": 100,
      "maxSpecs": 10,
      "maxCostDollars": 50
    },
    "performanceSensitivity": "medium"
  }
}
```

#### Step 2: Workflow Analysis
Use `analyze_workflow` for existing process optimization:

**Process**:
1. Document current workflow with steps, inputs, outputs, costs
2. Specify consulting techniques to apply (optional)
3. Review optimization recommendations
4. Identify batching, caching, and decomposition opportunities

#### Step 3: ROI Validation
Use `generate_roi_analysis` to compare approaches:

**Comparison Framework**:
- **Naive Approach**: Current or straightforward implementation
- **Optimized Approach**: Improved efficiency with proven techniques
- **Zero-Based Approach**: Radical redesign from first principles

**ROI Metrics**:
- Quota consumption (vibes and specs)
- Estimated costs (monthly operational)
- Percentage savings and dollar amounts
- Implementation effort and timeline

#### Step 4: Professional Summary
Use `get_consulting_summary` for stakeholder communication:

**Output Elements**:
- Executive summary with key recommendations
- Consulting techniques applied and insights
- Supporting evidence and data
- Clear action items and next steps

### Best Practices for Technical Optimization

#### Input Quality
- **Be Specific**: Include exact data sources, processing steps, output formats
- **Quantify Scale**: Provide realistic volume estimates and growth projections
- **Define Constraints**: Set clear limits on resources and performance requirements
- **Include Context**: Mention existing systems, team capabilities, timeline pressures

#### Optimization Strategy
- **Start Conservative**: Implement proven optimizations before radical changes
- **Measure Impact**: Track actual savings vs. estimates
- **Iterate Gradually**: Make incremental improvements rather than big rewrites
- **Document Learnings**: Capture what works for future optimization efforts

#### Implementation Planning
- **Phase Rollout**: Implement optimizations in stages to reduce risk
- **Fallback Plans**: Maintain ability to revert if optimizations cause issues
- **Monitoring**: Set up alerts and metrics to track optimization effectiveness
- **Team Training**: Ensure team understands new optimized processes

## Cross-Workflow Integration

### Combining Workflows
Many projects benefit from combining multiple workflows:

1. **Quick Validation → Full PM Workflow**: Validate idea, then do full analysis
2. **PM Workflow → Technical Optimization**: Define requirements, then optimize implementation
3. **Technical Optimization → PM Workflow**: Optimize existing process, then plan rollout

### Tool Sequencing
Recommended tool usage patterns:

**For New Features**:
1. `validate_idea_quick` - Initial screening
2. `generate_requirements` - Structure the problem
3. `generate_design_options` - Explore alternatives
4. `optimize_intent` - Technical implementation
5. `generate_management_onepager` - Executive approval

**For Process Improvement**:
1. `analyze_workflow` - Current state analysis
2. `generate_roi_analysis` - Quantify improvement opportunity
3. `optimize_intent` - Design optimized process
4. `generate_task_plan` - Implementation roadmap
5. `get_consulting_summary` - Stakeholder communication

**For Executive Communication**:
1. `generate_requirements` - Problem definition
2. `generate_design_options` - Solution alternatives
3. `generate_management_onepager` - Decision document
4. `generate_pr_faq` - Launch communication

### Quality Assurance

#### Document Review Checklist
- **Requirements**: Clear WHY, specific WHAT, realistic constraints
- **Design Options**: Distinct alternatives with clear trade-offs
- **Task Plans**: Actionable tasks with clear acceptance criteria
- **Executive Docs**: Answer-first structure, quantified benefits, clear timing

#### Stakeholder Validation
- **Technical Review**: Engineering feasibility and architecture alignment
- **Business Review**: Market need, competitive advantage, ROI validation
- **User Review**: Actual user needs and workflow integration
- **Executive Review**: Strategic alignment and resource allocation

#### Success Metrics
- **Process Efficiency**: Time from idea to implementation
- **Decision Quality**: Percentage of projects that meet success criteria
- **Stakeholder Satisfaction**: Feedback on document quality and usefulness
- **Resource Optimization**: Actual vs. estimated quota consumption and costs