# Steering Integration Usage Guide

The vibe-pm-agent MCP server automatically creates steering files in Kiro's `.kiro/steering/` directory when you generate PM Mode documents. This makes your strategic business analysis, ROI assessments, and executive communications immediately available as AI context for Kiro's Spec Mode and Vibe Mode.

## How It Works

When you call any of the vibe-pm-agent MCP tools, they can automatically create steering files that:

1. **Save to `.kiro/steering/`** - Documents are saved as markdown files with proper front-matter
2. **Include in AI context** - Files are automatically loaded based on inclusion rules
3. **Provide guidance** - Generated content becomes steering context for future AI interactions

## Available PM Mode Tools with Steering Integration

### 1. Business Opportunity Analysis
```javascript
{
  "idea": "AI-powered workflow optimization feature",
  "market_context": {
    "industry": "Software Development",
    "budget_range": "medium",
    "timeline": "6 months"
  },
  "steering_options": {
    "create_steering_files": true,
    "feature_name": "ai-workflow-optimizer",
    "inclusion_rule": "manual"  // Strategic context for decision-making
  }
}
```

**Creates:** `ai-workflow-optimizer-opportunity.md`
**Activates when:** Manually referenced with `#ai-workflow-optimizer-opportunity`

### 2. Business Case Generation
```javascript
{
  "opportunity_analysis": "...",
  "financial_inputs": {
    "development_cost": 150000,
    "expected_revenue": 400000,
    "time_to_market": 6
  },
  "steering_options": {
    "create_steering_files": true,
    "feature_name": "ai-workflow-optimizer",
    "inclusion_rule": "manual"  // Business justification context
  }
}
```

**Creates:** `ai-workflow-optimizer-business-case.md`
**Activates when:** Manually referenced with `#ai-workflow-optimizer-business-case`

### 3. Strategic Alignment Assessment
```javascript
{
  "feature_concept": "...",
  "company_context": {
    "mission": "Empower developers with intelligent automation",
    "current_okrs": ["Increase productivity by 30%", "Reduce costs by 25%"],
    "strategic_priorities": ["AI automation", "Developer experience"]
  },
  "steering_options": {
    "create_steering_files": true,
    "feature_name": "ai-workflow-optimizer",
    "inclusion_rule": "manual"  // Strategic alignment context
  }
}
```

**Creates:** `ai-workflow-optimizer-alignment.md`
**Activates when:** Manually referenced with `#ai-workflow-optimizer-alignment`

### 4. Stakeholder Communication
```javascript
{
  "business_case": "...",
  "communication_type": "executive_onepager",
  "audience": "executives",
  "steering_options": {
    "create_steering_files": true,
    "feature_name": "ai-workflow-optimizer",
    "inclusion_rule": "manual"  // Executive communication context
  }
}
```

**Creates:** `ai-workflow-optimizer-onepager.md`
**Activates when:** Manually referenced with `#ai-workflow-optimizer-onepager`

### 5. Market Timing Validation
```javascript
{
  "feature_idea": "AI-powered workflow optimization",
  "market_signals": {
    "customer_demand": "high",
    "competitive_pressure": "medium",
    "technical_readiness": "high"
  }
}
```

**Creates:** No steering file (analysis only)
**Use case:** Quick timing validation for strategic decisions

### 6. Resource Optimization Analysis
```javascript
{
  "current_workflow": {...},
  "resource_constraints": {
    "team_size": 5,
    "budget": 200000,
    "timeline": "3 months"
  },
  "optimization_goals": ["cost_reduction", "speed_improvement"]
}
```

**Creates:** No steering file (analysis only)
**Use case:** Development efficiency recommendations

## Steering Options Reference

### `create_steering_files` (boolean, default: true)
Whether to automatically create steering files in `.kiro/steering/`

### `feature_name` (string, required)
Name of the feature for organizing steering files. Used in filename generation.

### `inclusion_rule` (string, default varies by document type)
How the steering file should be included in AI context:
- `"always"` - Always included in every AI interaction
- `"fileMatch"` - Included when files matching the pattern are opened
- `"manual"` - Only included when manually referenced with `#filename`

### `file_match_pattern` (string, optional)
Pattern to match files when `inclusion_rule` is `"fileMatch"`. Uses glob patterns:
- `"requirements*|spec*"` - Matches files starting with "requirements" or "spec"
- `"design*|architecture*"` - Matches design and architecture files
- `"tasks*|implementation*"` - Matches task and implementation files

## Integrated Kiro Workflow

### Phase 1: Strategic Analysis (PM Mode)
1. **Business Opportunity Analysis**
   ```bash
   # Call analyze_business_opportunity with steering_options
   # Creates: feature-name-opportunity.md
   ```

2. **Business Case Generation**
   ```bash
   # Call generate_business_case with steering_options  
   # Creates: feature-name-business-case.md
   ```

3. **Strategic Alignment Assessment**
   ```bash
   # Call assess_strategic_alignment with steering_options
   # Creates: feature-name-alignment.md
   ```

### Phase 2: Requirements Definition (Kiro Spec Mode)
- Use Kiro's native Spec Mode to create requirements
- PM Mode steering files provide strategic context automatically
- Business justification informs requirement prioritization

### Phase 3: Implementation (Kiro Vibe Mode)
- Use Kiro's native Vibe Mode for code generation
- Spec Mode requirements guide implementation
- PM Mode context ensures strategic alignment

## Benefits

### 🎯 **Strategic Context for Development**
PM Mode analysis provides business justification and strategic context that enhances Kiro's Spec Mode and Vibe Mode capabilities.

### 📁 **Organized Strategic Documentation**
All business analysis artifacts are saved in `.kiro/steering/` providing persistent strategic context for development decisions.

### 🔄 **Perfect Kiro Integration**
No conflicts with native Kiro modes - PM Mode complements rather than competes with Spec and Vibe modes.

### 🎨 **Manual Activation for Strategic Context**
Strategic steering files activate when manually referenced, providing focused business context for decision-making without overwhelming development workflows.

## File Structure

Generated steering files follow this structure:

```markdown
---
inclusion: fileMatch
fileMatchPattern: 'requirements*|spec*'
generatedBy: vibe-pm-agent
generatedAt: 2025-09-04T21:20:35.823Z
featureName: workflow-optimization
documentType: requirements
description: Generated from PM agent requirements document
---

# Requirements Guidance: workflow-optimization

[Generated content with consulting analysis, requirements, and guidance]

## Related Documents
[File references if available]

---
*Generated by PM Agent Intent-to-Spec Optimizer*
```

## Tips for Best Results

1. **Use descriptive feature names** - They become part of the filename and help organize your steering files
2. **Choose appropriate inclusion rules** - Use `fileMatch` for development guidance, `manual` for executive documents
3. **Customize file match patterns** - Tailor patterns to your project's file naming conventions
4. **Review generated files** - Check `.kiro/steering/` to see what guidance was created
5. **Iterate and refine** - Generate multiple documents for the same feature to build comprehensive guidance

## Troubleshooting

### Steering files not being created?
- Check that `create_steering_files` is `true` (default)
- Ensure you have write permissions to `.kiro/steering/`
- Verify the MCP server is running the latest version

### Files not activating as context?
- Check the `inclusion_rule` and `file_match_pattern` settings
- Verify file names match the patterns you specified
- Try using `inclusion_rule: "always"` for testing

### Want to disable steering file creation?
Set `create_steering_files: false` in the `steering_options` parameter.