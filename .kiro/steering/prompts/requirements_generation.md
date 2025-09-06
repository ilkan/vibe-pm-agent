# Generated-by: Kiro Spec Mode
# Spec-ID: vibe_pm_agent_v2_hackathon
# Spec-Hash: sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
# Model: claude-3.5-sonnet
# Timestamp: 2025-01-09T10:30:00Z

# Requirements Generation Prompt Template

## Context
You are generating PM-grade requirements with MoSCoW prioritization and evidence-backed analysis for: {feature_name}

## Input Variables
- **Raw Intent**: {raw_intent}
- **Business Context**: {business_context}
- **Market Context**: {market_context}
- **Constraints**: {constraints}
- **Success Criteria**: {success_criteria}

## Output Structure

### Business Goal (WHY)
Extract and articulate the core business objective in 1-3 lines with supporting market evidence.

**Template**: 
"The business goal is to {objective} because {market_evidence} indicates {opportunity}. This aligns with {strategic_priority} and addresses {customer_pain_point}."

**Evidence Requirements**:
- Cite market research supporting the business need
- Reference customer validation data or competitive intelligence
- Include confidence score (0-100%) based on evidence quality

### User Needs Analysis
Apply Value Proposition Canvas methodology:

**Jobs to be Done**:
- {job_1} - supported by {customer_research_citation}
- {job_2} - validated through {usage_data_source}
- {job_3} - confirmed by {market_analysis_reference}

**Pain Points**:
- {pain_1} - quantified impact: {impact_metric} (Source: {citation})
- {pain_2} - frequency: {frequency_data} (Source: {citation})
- {pain_3} - cost: {cost_impact} (Source: {citation})

**Desired Gains**:
- {gain_1} - potential value: {value_estimate} (Source: {citation})
- {gain_2} - efficiency improvement: {efficiency_metric} (Source: {citation})

### Functional Requirements (WHAT)
Structure using EARS format (Easy Approach to Requirements Syntax):

**Template for each requirement**:
"WHEN {trigger_condition} THEN the system SHALL {system_response} WITH {performance_criteria}"

**Evidence Backing**:
- Reference comparable implementations: {competitor_example}
- Cite industry standards: {standard_reference}
- Include technical feasibility assessment: {feasibility_confidence}%

### MoSCoW Prioritization

**Must Have (Critical for MVP)**:
- {requirement_1} - Justification: {business_impact_evidence}
- {requirement_2} - Justification: {customer_validation_data}

**Should Have (Important for success)**:
- {requirement_3} - Justification: {competitive_advantage_analysis}
- {requirement_4} - Justification: {market_opportunity_size}

**Could Have (Nice to have)**:
- {requirement_5} - Justification: {future_market_potential}

**Won't Have (Out of scope)**:
- {excluded_feature} - Rationale: {resource_constraint_analysis}

### Right-Time Decision Analysis

**Market Timing Assessment**:
- Market readiness: {readiness_score}/100 (Source: {market_research})
- Competitive pressure: {pressure_level} (Source: {competitive_analysis})
- Resource availability: {availability_assessment} (Source: {capacity_analysis})

**Go/No-Go Recommendation**:
**Decision**: {GO_NOW | DELAY_UNTIL | DO_NOT_PURSUE}
**Confidence**: {confidence_percentage}%
**Rationale**: {evidence_based_reasoning_with_citations}

**If DELAY_UNTIL**: Specify conditions and timeline
**If DO_NOT_PURSUE**: Provide alternative recommendations

## Citation Requirements
- All quantitative claims must include source citations
- Market data must reference A-tier sources (Gartner, Forrester, McKinsey, etc.)
- Competitive intelligence must cite verifiable public sources
- Customer data must include sample sizes and methodology
- Include confidence intervals for all estimates

## Quality Checklist
- [ ] Business goal clearly articulated with evidence
- [ ] User needs backed by customer research
- [ ] Functional requirements in EARS format
- [ ] MoSCoW prioritization with justifications
- [ ] Right-time decision with confidence score
- [ ] All claims supported by credible citations
- [ ] Confidence scores provided for key assessments
- [ ] Alternative options considered and documented