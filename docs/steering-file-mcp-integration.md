# Steering File MCP Integration Documentation

This document provides comprehensive documentation for using steering file creation features with MCP tools in the PM Agent Intent Optimizer.

## Overview

The PM Agent Intent Optimizer can automatically convert its generated consulting documents into Kiro steering files. This creates a self-improving development environment where the PM agent's consulting expertise becomes persistent guidance for future development work.

## Supported Tools with Steering File Integration

The following MCP tools support optional steering file creation:

1. **generate_requirements** - Creates requirements steering files
2. **generate_design_options** - Creates design guidance steering files  
3. **generate_management_onepager** - Creates executive guidance steering files
4. **generate_pr_faq** - Creates product clarity steering files
5. **generate_task_plan** - Creates implementation guidance steering files

## Steering File Options Schema

All supported tools accept an optional `steering_options` parameter with the following schema:

```json
{
  "steering_options": {
    "type": "object",
    "properties": {
      "create_steering_files": {
        "type": "boolean",
        "description": "Whether to create steering files from generated documents"
      },
      "feature_name": {
        "type": "string", 
        "description": "Feature name for organizing steering files"
      },
      "filename_prefix": {
        "type": "string",
        "description": "Custom filename prefix for steering files"
      },
      "inclusion_rule": {
        "type": "string",
        "enum": ["always", "fileMatch", "manual"],
        "description": "How the steering file should be included in context"
      },
      "file_match_pattern": {
        "type": "string",
        "description": "File match pattern when inclusion_rule is 'fileMatch'"
      },
      "overwrite_existing": {
        "type": "boolean",
        "description": "Whether to overwrite existing steering files"
      }
    },
    "description": "Optional steering file creation options"
  }
}
```

## Inclusion Rules

### always
The steering file will always be included in Kiro context, regardless of which files are open.

**Use case**: Core project principles, coding standards, or architectural guidelines that should always be considered.

**Example**:
```json
{
  "inclusion_rule": "always"
}
```

### fileMatch
The steering file will be included only when files matching the specified pattern are in context.

**Use case**: Feature-specific guidance that should only apply when working on related files.

**Example**:
```json
{
  "inclusion_rule": "fileMatch",
  "file_match_pattern": "auth*|login*|user*"
}
```

### manual
The steering file will only be included when explicitly referenced using `#steering-file-name` in chat.

**Use case**: Executive summaries, PR-FAQs, or specialized guidance that should be manually invoked.

**Example**:
```json
{
  "inclusion_rule": "manual"
}
```

## Usage Examples

### 1. Generate Requirements with Steering File

```json
{
  "raw_intent": "Create a user authentication system with secure login, registration, and password reset functionality",
  "context": {
    "roadmap_theme": "Security & User Management",
    "budget": 15000,
    "quotas": {
      "maxVibes": 50,
      "maxSpecs": 10
    }
  },
  "steering_options": {
    "create_steering_files": true,
    "feature_name": "user-authentication",
    "inclusion_rule": "fileMatch",
    "file_match_pattern": "auth*|user*|login*|security*",
    "overwrite_existing": false
  }
}
```

**Generated Steering File**: `.kiro/steering/requirements-user-authentication.md`

**Front Matter**:
```yaml
---
inclusion: fileMatch
fileMatchPattern: 'auth*|user*|login*|security*'
generatedBy: pm-agent-intent-optimizer
generatedAt: 2024-01-15T10:30:00Z
featureName: user-authentication
documentType: requirements
---
```

### 2. Generate Design Options with Steering File

```json
{
  "requirements": "System must provide secure user authentication with OAuth2 integration, multi-factor authentication, and session management...",
  "steering_options": {
    "create_steering_files": true,
    "feature_name": "auth-system",
    "filename_prefix": "design",
    "inclusion_rule": "fileMatch", 
    "file_match_pattern": "design*|architecture*|auth*"
  }
}
```

**Generated Steering File**: `.kiro/steering/design-auth-system-options.md`

### 3. Generate Management One-Pager with Manual Inclusion

```json
{
  "requirements": "Executive dashboard requirements with real-time metrics...",
  "design": "Dashboard architecture with microservices and real-time data pipeline...",
  "roi_inputs": {
    "cost_naive": 50000,
    "cost_balanced": 30000,
    "cost_bold": 20000
  },
  "steering_options": {
    "create_steering_files": true,
    "feature_name": "executive-dashboard",
    "inclusion_rule": "manual"
  }
}
```

**Generated Steering File**: `.kiro/steering/onepager-executive-dashboard.md`

**Usage**: Reference with `#onepager-executive-dashboard` in Kiro chat.

### 4. Generate PR-FAQ with Product Guidance

```json
{
  "requirements": "Product launch requirements for new analytics feature...",
  "design": "Analytics feature design with data collection and visualization...",
  "target_date": "2024-06-01",
  "steering_options": {
    "create_steering_files": true,
    "feature_name": "analytics-launch",
    "inclusion_rule": "fileMatch",
    "file_match_pattern": "product*|launch*|analytics*|marketing*"
  }
}
```

### 5. Generate Task Plan with Implementation Guidance

```json
{
  "design": "Comprehensive system design with modular architecture...",
  "limits": {
    "max_vibes": 100,
    "max_specs": 20,
    "budget_usd": 25000
  },
  "steering_options": {
    "create_steering_files": true,
    "feature_name": "system-implementation",
    "inclusion_rule": "fileMatch",
    "file_match_pattern": "tasks*|implementation*|todo*"
  }
}
```

## Response Format with Steering Files

When steering files are created, the tool response includes additional metadata:

```json
{
  "content": [
    {
      "type": "markdown",
      "markdown": "# Generated Document Content..."
    }
  ],
  "isError": false,
  "metadata": {
    "executionTime": 2500,
    "quotaUsed": 2,
    "steeringFileCreated": true,
    "steeringFiles": [
      {
        "filename": "requirements-user-authentication.md",
        "action": "created",
        "fullPath": ".kiro/steering/requirements-user-authentication.md"
      }
    ]
  }
}
```

## Steering File Templates

### Requirements Steering File Template

```markdown
---
inclusion: fileMatch
fileMatchPattern: '{pattern}'
generatedBy: pm-agent-intent-optimizer
generatedAt: {timestamp}
featureName: {feature_name}
documentType: requirements
---

# Requirements Guidance: {Feature Name}

This guidance was generated by the PM Agent Intent-to-Spec Optimizer and contains consulting-grade requirements analysis.

## Business Context
{extracted business context}

## Key Requirements
{formatted requirements with MoSCoW prioritization}

## Related Documents
#[[file:.kiro/specs/{feature_name}/design.md]]
#[[file:.kiro/specs/{feature_name}/tasks.md]]

## Consulting Insights
{consulting technique insights}
```

### Design Options Steering File Template

```markdown
---
inclusion: fileMatch
fileMatchPattern: '{pattern}'
generatedBy: pm-agent-intent-optimizer
generatedAt: {timestamp}
featureName: {feature_name}
documentType: design
---

# Design Guidance: {Feature Name}

This guidance contains Impact vs Effort analysis and design options from PM Agent consulting analysis.

## Design Options
{Conservative/Balanced/Bold options}

## Impact vs Effort Matrix
{matrix analysis}

## Related Documents
#[[file:.kiro/specs/{feature_name}/requirements.md]]
#[[file:.kiro/specs/{feature_name}/tasks.md]]
```

## Best Practices

### Naming Conventions

1. **Feature Names**: Use kebab-case for consistency
   - ✅ `user-authentication`
   - ✅ `payment-processing`
   - ❌ `UserAuthentication`
   - ❌ `user_authentication`

2. **File Match Patterns**: Use specific patterns to avoid over-inclusion
   - ✅ `auth*|login*|security*` (specific to authentication)
   - ✅ `payment*|billing*|checkout*` (specific to payments)
   - ❌ `*` (too broad)
   - ❌ `user*` (too generic)

### Inclusion Rule Selection

1. **Use `always` for**:
   - Project-wide coding standards
   - Architecture principles
   - Security guidelines
   - Team conventions

2. **Use `fileMatch` for**:
   - Feature-specific requirements
   - Component design guidance
   - Domain-specific best practices
   - Implementation patterns

3. **Use `manual` for**:
   - Executive summaries
   - PR-FAQ documents
   - One-time reference materials
   - Specialized consulting analysis

### File Organization

1. **Prefix Conventions**:
   - `requirements-{feature}` for requirements guidance
   - `design-{feature}` for design options guidance
   - `onepager-{feature}` for executive summaries
   - `prfaq-{feature}` for product launch guidance
   - `tasks-{feature}` for implementation guidance

2. **Feature Grouping**: Use consistent feature names across related steering files
   ```
   .kiro/steering/
   ├── requirements-user-auth.md
   ├── design-user-auth.md
   ├── tasks-user-auth.md
   └── onepager-user-auth.md
   ```

## Error Handling

### Common Issues and Solutions

1. **Steering File Creation Failed**
   - **Cause**: Invalid feature name or file permissions
   - **Solution**: Ensure feature name is valid and `.kiro/steering/` directory exists
   - **Response**: Main document generation continues, steering file creation is logged as warning

2. **File Already Exists**
   - **Cause**: Steering file with same name already exists
   - **Solution**: Set `overwrite_existing: true` or use different `filename_prefix`
   - **Response**: Creates versioned filename (e.g., `requirements-feature-v2.md`)

3. **Invalid Inclusion Rule**
   - **Cause**: Unsupported inclusion rule value
   - **Solution**: Use one of: `always`, `fileMatch`, `manual`
   - **Response**: Falls back to `manual` inclusion rule

### Error Response Format

```json
{
  "content": [
    {
      "type": "markdown", 
      "markdown": "# Generated Document..."
    }
  ],
  "isError": false,
  "metadata": {
    "steeringFileCreated": false,
    "steeringFileError": "Invalid feature name: feature names cannot be empty"
  }
}
```

## Integration Examples

### Kiro Chat Integration

```typescript
// Generate requirements with steering file
const result = await kiro.callMCPTool('vibe-pm-agent', 'generate_requirements', {
  raw_intent: 'Build user authentication system',
  steering_options: {
    create_steering_files: true,
    feature_name: 'user-auth',
    inclusion_rule: 'fileMatch',
    file_match_pattern: 'auth*|user*'
  }
});

if (result.metadata?.steeringFileCreated) {
  console.log('Steering files created:', result.metadata.steeringFiles);
}
```

### Batch Steering File Creation

```typescript
// Create complete set of steering files for a feature
const featureName = 'e-commerce-platform';
const steeringOptions = {
  create_steering_files: true,
  feature_name: featureName,
  inclusion_rule: 'fileMatch',
  file_match_pattern: 'ecommerce*|shop*|cart*|payment*'
};

// 1. Generate requirements
const requirements = await kiro.callMCPTool('vibe-pm-agent', 'generate_requirements', {
  raw_intent: 'Build comprehensive e-commerce platform...',
  steering_options: steeringOptions
});

// 2. Generate design options
const design = await kiro.callMCPTool('vibe-pm-agent', 'generate_design_options', {
  requirements: requirements.content[0].json,
  steering_options: steeringOptions
});

// 3. Generate task plan
const tasks = await kiro.callMCPTool('vibe-pm-agent', 'generate_task_plan', {
  design: design.content[0].json,
  steering_options: steeringOptions
});

// 4. Generate executive summary
const onePager = await kiro.callMCPTool('vibe-pm-agent', 'generate_management_onepager', {
  requirements: requirements.content[0].json,
  design: design.content[0].json,
  tasks: tasks.content[0].json,
  steering_options: {
    ...steeringOptions,
    inclusion_rule: 'manual' // Executive summary should be manually referenced
  }
});
```

## Performance Considerations

### Steering File Creation Impact

- **Additional Processing Time**: 100-300ms per steering file
- **Storage Requirements**: 2-10KB per steering file
- **Memory Usage**: Minimal impact on server memory
- **Quota Usage**: No additional quota consumed for steering file creation

### Optimization Tips

1. **Batch Operations**: Create multiple steering files in sequence rather than parallel to avoid file system conflicts
2. **Selective Creation**: Only create steering files when they will be actively used
3. **Pattern Specificity**: Use specific file match patterns to avoid unnecessary context inclusion
4. **Cleanup**: Periodically review and remove unused steering files

## Monitoring and Analytics

### Steering File Usage Tracking

The system tracks steering file creation and usage:

```json
{
  "steeringFileMetrics": {
    "totalCreated": 15,
    "createdToday": 3,
    "averageFileSize": 4.2,
    "mostUsedPatterns": [
      "auth*|user*",
      "payment*|billing*", 
      "admin*|dashboard*"
    ],
    "inclusionRuleDistribution": {
      "fileMatch": 60,
      "manual": 30,
      "always": 10
    }
  }
}
```

### Health Monitoring

Monitor steering file system health:

- **File System Permissions**: Ensure `.kiro/steering/` is writable
- **Disk Space**: Monitor available space for steering file storage
- **Creation Success Rate**: Track percentage of successful steering file creations
- **Pattern Effectiveness**: Analyze which file match patterns are most useful

This documentation provides comprehensive guidance for using steering file features with MCP tools in the PM Agent Intent Optimizer.