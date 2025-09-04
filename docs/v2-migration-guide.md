# Vibe PM Agent v2.0 Migration Guide

## 🎯 Major Changes Overview

Vibe PM Agent v2.0 has been completely redesigned to eliminate conflicts with Kiro's native modes and provide perfect complementary functionality.

### ❌ What Was Removed (Conflicting Tools)
- `generate_requirements` - Conflicted with Kiro Spec Mode
- `generate_task_plan` - Conflicted with Kiro Spec Mode  
- `optimize_intent` - Generic optimization, not PM-focused
- `analyze_workflow` - Generic analysis, not PM-focused
- `generate_roi_analysis` - Integrated into business case generation
- `get_consulting_summary` - Redundant functionality
- `validate_idea_quick` - Replaced with market timing validation

### ✅ What Was Added (PM-Focused Tools)
- `analyze_business_opportunity` - Market opportunity and strategic fit analysis
- `generate_business_case` - Comprehensive ROI analysis and financial projections
- `assess_strategic_alignment` - Company strategy, OKR, and mission alignment
- `create_stakeholder_communication` - Executive communications (one-pagers, PR-FAQs, presentations)
- `validate_market_timing` - Market timing analysis and right-time recommendations
- `optimize_resource_allocation` - Development efficiency and resource optimization

## 🔄 New Kiro Mode Integration

### Before v2.0 (Conflicting)
```
❌ vibe-pm-agent: generate_requirements (conflicts with Spec Mode)
❌ vibe-pm-agent: generate_task_plan (conflicts with Spec Mode)
❌ Kiro Spec Mode: Requirements and specifications
❌ Kiro Vibe Mode: Implementation and code generation
```

### After v2.0 (Complementary)
```
✅ PM Mode (vibe-pm-agent): WHY to build - business justification
✅ Spec Mode (Kiro native): WHAT to build - requirements  
✅ Vibe Mode (Kiro native): HOW to build - implementation
```

## 🛠️ Migration Steps

### 1. Update MCP Configuration
No changes needed - same server name and configuration format.

### 2. Update Tool Usage

#### Old Workflow (v1.x)
```javascript
// ❌ Old conflicting approach
generate_requirements → generate_design_options → generate_task_plan
```

#### New Workflow (v2.0)
```javascript
// ✅ New complementary approach
// Phase 1: PM Mode (Strategic Analysis)
analyze_business_opportunity → generate_business_case → assess_strategic_alignment

// Phase 2: Spec Mode (Kiro Native)
// Use Kiro's native Spec Mode with PM context from steering files

// Phase 3: Vibe Mode (Kiro Native)  
// Use Kiro's native Vibe Mode with Spec requirements
```

### 3. Update Steering File Usage

#### Old Steering Files (v1.x)
- `feature-requirements.md` - Now handled by Kiro Spec Mode
- `feature-design.md` - Now handled by Kiro Spec Mode
- `feature-tasks.md` - Now handled by Kiro Spec Mode

#### New Steering Files (v2.0)
- `feature-opportunity.md` - Business opportunity analysis
- `feature-business-case.md` - ROI and financial analysis
- `feature-alignment.md` - Strategic alignment assessment
- `feature-onepager.md` - Executive communications

### 4. Update Team Workflows

#### Development Teams
- **Before**: Use vibe-pm-agent for requirements → Use Kiro for implementation
- **After**: Use vibe-pm-agent for business analysis → Use Kiro Spec Mode for requirements → Use Kiro Vibe Mode for implementation

#### Product Managers
- **Before**: Generate requirements and task plans with vibe-pm-agent
- **After**: Generate business cases and executive communications with vibe-pm-agent, use Kiro for technical specifications

#### Executives
- **Before**: Limited PM artifacts from vibe-pm-agent
- **After**: Professional executive communications, business cases, and strategic alignment assessments

## 📊 Tool Mapping Reference

| Old Tool (v1.x) | New Approach (v2.0) | Responsibility |
|------------------|---------------------|----------------|
| `generate_requirements` | Kiro Spec Mode | Native Kiro |
| `generate_task_plan` | Kiro Spec Mode | Native Kiro |
| `generate_design_options` | `analyze_business_opportunity` | PM Mode |
| `generate_management_onepager` | `create_stakeholder_communication` | PM Mode |
| `generate_pr_faq` | `create_stakeholder_communication` | PM Mode |
| `optimize_intent` | `generate_business_case` | PM Mode |
| `analyze_workflow` | `optimize_resource_allocation` | PM Mode |
| `validate_idea_quick` | `validate_market_timing` | PM Mode |

## 🎯 Benefits of v2.0

### ✅ Perfect Kiro Integration
- No conflicts with native Kiro modes
- Complementary functionality that enhances rather than competes
- Clear separation of concerns: WHY (PM) / WHAT (Spec) / HOW (Vibe)

### ✅ Professional PM Focus
- Consulting-grade business analysis and strategic assessment
- Executive-ready communications and stakeholder alignment
- ROI analysis and financial justification for technical decisions

### ✅ Enhanced Steering Integration
- Strategic context that improves Spec Mode requirements
- Business justification that guides Vibe Mode implementation
- Persistent institutional knowledge for better decision-making

### ✅ Improved User Experience
- Clear understanding of when to use each mode
- Seamless workflow from strategy → requirements → implementation
- Better alignment between business and technical teams

## 🚀 Getting Started with v2.0

### 1. Strategic Analysis Workflow
```bash
# Analyze business opportunity
analyze_business_opportunity: {
  "idea": "AI-powered feature optimization",
  "market_context": {...},
  "steering_options": {"create_steering_files": true}
}

# Generate business case
generate_business_case: {
  "opportunity_analysis": "...",
  "financial_inputs": {...}
}

# Assess strategic alignment
assess_strategic_alignment: {
  "feature_concept": "...",
  "company_context": {...}
}
```

### 2. Executive Communication
```bash
# Create stakeholder communications
create_stakeholder_communication: {
  "business_case": "...",
  "communication_type": "executive_onepager",
  "audience": "executives"
}
```

### 3. Integrated Kiro Development
```bash
# After PM Mode analysis, use Kiro native modes:
# 1. Kiro Spec Mode for requirements (with PM context from steering)
# 2. Kiro Vibe Mode for implementation (with Spec requirements)
```

## 📚 Updated Documentation

- **[README.md](../README.md)**: Updated with v2.0 PM-focused approach
- **[Steering Integration Usage Guide](steering-integration-usage-guide.md)**: Updated tool examples and workflows
- **[Kiro Mode Integration Design](kiro-mode-integration-design.md)**: Complete design rationale and integration strategy
- **[Product Overview](.kiro/steering/product.md)**: Updated product positioning and target users

## 🔧 Technical Changes

### Server Architecture
- Replaced `SimplePMAgentMCPServer` with PM-focused implementation
- Removed conflicting tool handlers
- Enhanced steering integration for strategic context
- Maintained backward compatibility for MCP configuration

### Steering File Strategy
- Changed from automatic activation to manual activation for strategic context
- Focus on business analysis rather than technical specifications
- Integration with Kiro native modes through strategic context

### Error Handling
- Improved error handling for business analysis workflows
- Better validation for financial inputs and market context
- Enhanced logging for strategic decision tracking

## ❓ FAQ

### Q: Will my existing MCP configuration work?
**A:** Yes, no changes needed to MCP server configuration.

### Q: What happens to my existing steering files?
**A:** Old steering files remain but new PM Mode creates different types focused on strategic analysis.

### Q: Can I still generate requirements?
**A:** Use Kiro's native Spec Mode for requirements. PM Mode provides strategic context through steering files.

### Q: How do I migrate existing workflows?
**A:** Replace requirement/task generation with business analysis, then use Kiro native modes for technical work.

### Q: Is there a performance impact?
**A:** Performance is improved due to focused PM tools and better integration with Kiro native capabilities.

---

**Ready to upgrade?** The v2.0 approach provides better separation of concerns, professional PM capabilities, and perfect integration with Kiro's development workflow.