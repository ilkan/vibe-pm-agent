# Generated-by: Kiro Spec Mode
# Spec-ID: vibe_pm_agent_v2_hackathon
# Spec-Hash: sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
# Model: claude-3.5-sonnet
# Timestamp: 2025-01-09T10:30:00Z

# Task Plan Generation Prompt Template

## Context
You are creating a phased implementation plan with guardrails for: {feature_name}

## Input Variables
- **Approved Design**: {design_document}
- **Requirements**: {requirements_document}
- **Resource Limits**: {resource_constraints}
- **Timeline Constraints**: {timeline_limits}
- **Risk Tolerance**: {risk_profile}

## Task Plan Structure

### Task 0: Guardrails Check (MANDATORY FIRST TASK)
**Purpose**: Fail fast if project exceeds defined limits

**Guardrails Validation**:
- [ ] **Budget Check**: Total estimated cost ≤ {max_budget} USD
- [ ] **Timeline Check**: Critical path ≤ {max_timeline} weeks  
- [ ] **Resource Check**: Required team size ≤ {max_team_size} people
- [ ] **Technical Risk Check**: No high-risk dependencies without mitigation
- [ ] **Market Window Check**: Launch window still viable per market analysis

**Acceptance Criteria**:
- WHEN any guardrail is exceeded THEN project SHALL be halted for re-scoping
- WHEN all guardrails pass THEN project SHALL proceed to Phase 1
- WHEN guardrails are borderline THEN escalation to {stakeholder} is required

**Evidence Requirements**:
- Reference comparable project data for cost/timeline validation
- Cite market research for launch window validation
- Include confidence intervals for all estimates

### Phase 1: Immediate Wins (1-3 tasks, 2-4 weeks)
**Objective**: Deliver early value and validate core assumptions

**Task Template**:
- [ ] **{task_id}. {task_name}**
  - **Description**: {clear_implementation_objective}
  - **Acceptance Criteria**: 
    - WHEN {condition} THEN {measurable_outcome}
    - WHEN {condition} THEN {measurable_outcome}
  - **Effort**: {S|M|L} ({hour_estimate} ± 25% hours)
  - **Impact**: {Low|Med|High} - {business_value_description}
  - **Priority**: {Must|Should|Could|Won't} - {moscow_justification}
  - **Requirements Mapping**: {requirement_ids_from_requirements_doc}
  - **Dependencies**: {prerequisite_tasks_or_external_dependencies}
  - **Risk Factors**: {implementation_risks_with_mitigation}
  - **Success Metrics**: {quantifiable_success_measures}

### Phase 2: Short-Term Deliverables (3-6 tasks, 4-8 weeks)
**Objective**: Build core functionality and establish market presence

**Task Planning Principles**:
- Each task builds incrementally on previous tasks
- No orphaned code - everything integrates with existing system
- Test-driven development approach with automated validation
- Early user feedback integration points

### Phase 3: Long-Term Value (2-4 tasks, 8-12 weeks)
**Objective**: Scale and optimize for sustained competitive advantage

**Strategic Considerations**:
- Market evolution and competitive response planning
- Technical debt management and scalability preparation
- User adoption and retention optimization
- Revenue model validation and optimization

## Task Sizing Guidelines

**Small (S)**: 8-16 hours
- Single component implementation
- Straightforward integration
- Well-understood requirements
- Low technical risk

**Medium (M)**: 16-40 hours  
- Multi-component integration
- Some technical complexity
- Requirements need clarification
- Moderate technical risk

**Large (L)**: 40-80 hours
- Complex system integration
- High technical complexity
- Significant unknowns
- High technical risk
- Should be broken down if possible

## Impact Assessment Framework

**High Impact**:
- Directly addresses Must Have requirements
- Significant user value or business metric improvement
- Competitive differentiation opportunity
- Revenue generation or cost reduction potential

**Medium Impact**:
- Addresses Should Have requirements
- Moderate user value improvement
- Operational efficiency gains
- Market positioning benefits

**Low Impact**:
- Addresses Could Have requirements
- Minor user experience improvements
- Technical debt reduction
- Future capability enablement

## Risk Assessment and Mitigation

**For each task, identify**:
- **Technical Risks**: {complexity_unknowns_dependencies}
- **Market Risks**: {timing_competitive_customer_adoption}
- **Resource Risks**: {availability_skill_gaps_capacity}
- **Mitigation Strategies**: {specific_actions_with_owners}

## Quality Assurance Requirements

**Each task must include**:
- [ ] Automated tests covering acceptance criteria
- [ ] Integration tests with existing system
- [ ] Performance benchmarks where applicable
- [ ] Security review for user-facing features
- [ ] Documentation updates
- [ ] Stakeholder review and approval gates

## Traceability Matrix

**Requirements to Tasks Mapping**:
| Requirement ID | Task IDs | Coverage Assessment | Gap Analysis |
|----------------|----------|-------------------|--------------|
| {req_id} | {task_ids} | {coverage_percentage} | {identified_gaps} |

**Acceptance Criteria to Tests Mapping**:
| Acceptance Criteria | Test Cases | Validation Method | Success Metrics |
|-------------------|------------|------------------|-----------------|
| {ac_id} | {test_ids} | {validation_approach} | {success_measures} |

## Success Metrics and KPIs

**Phase 1 Success Criteria**:
- {metric_1}: Target {target_value} (Current baseline: {baseline})
- {metric_2}: Target {target_value} (Measurement method: {method})

**Overall Project Success Criteria**:
- {business_metric}: {target_improvement} improvement
- {user_metric}: {target_adoption} adoption rate
- {technical_metric}: {target_performance} performance benchmark

## Citation and Evidence Requirements
- All effort estimates must reference comparable project data
- Impact assessments must cite business case analysis
- Risk assessments must reference industry failure rate data
- Success metrics must align with market benchmarks
- Include confidence intervals for all estimates