# MCP Tool Reference: Steering File Integration

## Overview

All PM Agent MCP tools support optional steering file creation through additional parameters. This reference documents the steering-specific parameters, usage patterns, and examples for each tool.

## Common Steering Parameters

All PM Agent MCP tools accept these optional steering file parameters:

### Core Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `createSteeringFile` | boolean | No | `false` | Enable steering file creation |
| `steeringFileName` | string | No | Auto-generated | Custom filename for steering file |
| `inclusionRule` | string | No | Document-specific | How steering file is included (`always`, `fileMatch`, `manual`) |
| `fileMatchPattern` | string | Conditional | Document-specific | Pattern for `fileMatch` inclusion rule |
| `featureName` | string | No | Extracted from content | Feature name for organization |

### Advanced Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `organizationStrategy` | string | No | `feature-based` | How to organize steering files (`flat`, `feature-based`, `type-based`) |
| `crossReferences` | string[] | No | Auto-detected | Additional files to reference |
| `customFrontMatter` | object | No | `{}` | Additional front-matter fields |
| `previewOnly` | boolean | No | `false` | Generate preview without saving |

## Tool-Specific Documentation

### generate_requirements

Generates PM-grade requirements with optional steering file creation.

#### Basic Usage
```typescript
await mcp_pm_agent_intent_optimizer_generate_requirements({
  raw_intent: "Create user authentication system",
  context: {
    createSteeringFile: true
  }
});
```

#### Advanced Usage with Steering Options
```typescript
await mcp_pm_agent_intent_optimizer_generate_requirements({
  raw_intent: "Create user authentication system with OAuth and RBAC",
  context: {
    // Core steering parameters
    createSteeringFile: true,
    steeringFileName: "auth-requirements-v2",
    inclusionRule: "fileMatch",
    fileMatchPattern: "auth*|user*|security*",
    featureName: "user-authentication",
    
    // Organization parameters
    organizationStrategy: "feature-based",
    crossReferences: [
      ".kiro/specs/user-auth/design.md",
      "docs/security/oauth-guide.md"
    ],
    
    // Custom front-matter
    customFrontMatter: {
      priority: "high",
      owner: "auth-team",
      reviewDate: "2024-06-01"
    }
  }
});
```

#### Default Steering Configuration
```yaml
inclusionRule: fileMatch
fileMatchPattern: 'requirements*|spec*|*requirements*'
documentType: requirements
generatedBy: pm-agent-intent-optimizer
```

#### Generated Steering File Structure
```markdown
---
inclusion: fileMatch
fileMatchPattern: 'requirements*|spec*|*requirements*'
generatedBy: pm-agent-intent-optimizer
generatedAt: 2024-03-15T10:30:00Z
featureName: user-authentication
documentType: requirements
priority: high
owner: auth-team
reviewDate: 2024-06-01
---

# Authentication Requirements Guidance

[Requirements content with business context and MoSCoW prioritization]

## Related Documents
#[[file:.kiro/specs/user-auth/design.md]]
#[[file:docs/security/oauth-guide.md]]
```

### generate_design_options

Translates requirements into Conservative/Balanced/Bold design options with steering file support.

#### Basic Usage
```typescript
await mcp_pm_agent_intent_optimizer_generate_design_options({
  requirements: requirementsContent,
  context: {
    createSteeringFile: true,
    inclusionRule: "fileMatch",
    fileMatchPattern: "design*|architecture*"
  }
});
```

#### Advanced Usage
```typescript
await mcp_pm_agent_intent_optimizer_generate_design_options({
  requirements: requirementsContent,
  context: {
    createSteeringFile: true,
    steeringFileName: "auth-design-balanced",
    inclusionRule: "fileMatch", 
    fileMatchPattern: "src/auth/*|tests/auth/*|docs/auth/*",
    featureName: "user-authentication",
    organizationStrategy: "feature-based",
    customFrontMatter: {
      recommendedOption: "balanced",
      architectureReviewRequired: true
    }
  }
});
```

#### Default Steering Configuration
```yaml
inclusionRule: fileMatch
fileMatchPattern: 'design*|architecture*|*design*'
documentType: design
generatedBy: pm-agent-intent-optimizer
```

### generate_management_onepager

Creates executive one-pager with Pyramid Principle and ROI analysis.

#### Basic Usage
```typescript
await mcp_pm_agent_intent_optimizer_generate_management_onepager({
  requirements: requirementsContent,
  design: designContent,
  context: {
    createSteeringFile: true
  }
});
```

#### Advanced Usage
```typescript
await mcp_pm_agent_intent_optimizer_generate_management_onepager({
  requirements: requirementsContent,
  design: designContent,
  roi_inputs: {
    cost_naive: 15000,
    cost_balanced: 25000,
    cost_bold: 45000
  },
  context: {
    createSteeringFile: true,
    steeringFileName: "auth-executive-summary",
    inclusionRule: "manual", // Executive docs typically manual
    featureName: "user-authentication",
    customFrontMatter: {
      audience: "executive",
      confidentiality: "internal",
      decisionDeadline: "2024-04-01"
    }
  }
});
```

#### Default Steering Configuration
```yaml
inclusionRule: manual
documentType: onepager
generatedBy: pm-agent-intent-optimizer
```

### generate_pr_faq

Creates Amazon-style Press Release and FAQ for product clarity.

#### Basic Usage
```typescript
await mcp_pm_agent_intent_optimizer_generate_pr_faq({
  requirements: requirementsContent,
  design: designContent,
  target_date: "2024-06-01",
  context: {
    createSteeringFile: true
  }
});
```

#### Advanced Usage
```typescript
await mcp_pm_agent_intent_optimizer_generate_pr_faq({
  requirements: requirementsContent,
  design: designContent,
  target_date: "2024-06-01",
  context: {
    createSteeringFile: true,
    steeringFileName: "auth-product-clarity",
    inclusionRule: "fileMatch",
    fileMatchPattern: "README*|docs/*|product*",
    featureName: "user-authentication",
    customFrontMatter: {
      targetAudience: "external",
      launchDate: "2024-06-01",
      marketingReviewRequired: true
    }
  }
});
```

#### Default Steering Configuration
```yaml
inclusionRule: fileMatch
fileMatchPattern: 'README*|docs/*|*readme*'
documentType: prfaq
generatedBy: pm-agent-intent-optimizer
```

### generate_task_plan

Creates phased implementation plan with guardrails and task breakdown.

#### Basic Usage
```typescript
await mcp_pm_agent_intent_optimizer_generate_task_plan({
  design: designContent,
  context: {
    createSteeringFile: true
  }
});
```

#### Advanced Usage
```typescript
await mcp_pm_agent_intent_optimizer_generate_task_plan({
  design: designContent,
  limits: {
    budget_usd: 50000,
    max_specs: 10,
    max_vibes: 100
  },
  context: {
    createSteeringFile: true,
    steeringFileName: "auth-implementation-guide",
    inclusionRule: "fileMatch",
    fileMatchPattern: "tasks*|todo*|implementation*|src/auth/*",
    featureName: "user-authentication",
    organizationStrategy: "feature-based",
    customFrontMatter: {
      implementationPhase: "development",
      testingRequired: true,
      securityReviewRequired: true
    }
  }
});
```

#### Default Steering Configuration
```yaml
inclusionRule: fileMatch
fileMatchPattern: 'tasks*|todo*|implementation*'
documentType: tasks
generatedBy: pm-agent-intent-optimizer
```

## Steering File Preview

All tools support preview mode to review steering file content before saving:

```typescript
// Preview steering file without saving
const preview = await mcp_pm_agent_intent_optimizer_generate_requirements({
  raw_intent: "Create user authentication system",
  context: {
    createSteeringFile: true,
    previewOnly: true,
    steeringFileName: "auth-requirements"
  }
});

console.log("Steering file preview:");
console.log(preview.steeringFile.content);

// Save if approved
if (userApproves) {
  await mcp_pm_agent_intent_optimizer_generate_requirements({
    raw_intent: "Create user authentication system", 
    context: {
      createSteeringFile: true,
      steeringFileName: "auth-requirements"
    }
  });
}
```

## Batch Steering File Creation

Create steering files for an entire PM workflow:

```typescript
// Generate complete workflow with steering files
async function createCompleteWorkflowWithSteering(intent: string, featureName: string) {
  const steeringContext = {
    createSteeringFile: true,
    featureName,
    organizationStrategy: "feature-based" as const
  };

  // 1. Requirements with steering
  const requirements = await mcp_pm_agent_intent_optimizer_generate_requirements({
    raw_intent: intent,
    context: {
      ...steeringContext,
      inclusionRule: "fileMatch",
      fileMatchPattern: `${featureName}*|requirements*|spec*`
    }
  });

  // 2. Design options with steering
  const design = await mcp_pm_agent_intent_optimizer_generate_design_options({
    requirements: requirements.content,
    context: {
      ...steeringContext,
      inclusionRule: "fileMatch", 
      fileMatchPattern: `${featureName}*|design*|architecture*`
    }
  });

  // 3. Task plan with steering
  const tasks = await mcp_pm_agent_intent_optimizer_generate_task_plan({
    design: design.content,
    context: {
      ...steeringContext,
      inclusionRule: "fileMatch",
      fileMatchPattern: `${featureName}*|tasks*|implementation*`
    }
  });

  // 4. Executive summary with steering (manual inclusion)
  const onepager = await mcp_pm_agent_intent_optimizer_generate_management_onepager({
    requirements: requirements.content,
    design: design.content,
    context: {
      ...steeringContext,
      inclusionRule: "manual"
    }
  });

  return {
    requirements,
    design, 
    tasks,
    onepager,
    steeringFiles: [
      `${featureName}-requirements.md`,
      `${featureName}-design.md`, 
      `${featureName}-tasks.md`,
      `${featureName}-onepager.md`
    ]
  };
}

// Usage
const workflow = await createCompleteWorkflowWithSteering(
  "Create user authentication with OAuth and RBAC",
  "user-authentication"
);
```

## Error Handling

### Common Errors and Solutions

#### Invalid Inclusion Rule
```typescript
// Error: Invalid inclusion rule
{
  error: "Invalid inclusion rule 'file-match'. Must be 'always', 'fileMatch', or 'manual'",
  code: "INVALID_INCLUSION_RULE"
}

// Solution: Use correct inclusion rule
context: {
  inclusionRule: "fileMatch" // not "file-match"
}
```

#### Missing File Match Pattern
```typescript
// Error: Missing pattern for fileMatch
{
  error: "fileMatchPattern is required when inclusionRule is 'fileMatch'",
  code: "MISSING_FILE_MATCH_PATTERN"
}

// Solution: Provide pattern
context: {
  inclusionRule: "fileMatch",
  fileMatchPattern: "src/*" // required
}
```

#### Invalid File Name
```typescript
// Error: Invalid filename
{
  error: "Steering filename cannot contain path separators",
  code: "INVALID_FILENAME"
}

// Solution: Use simple filename
context: {
  steeringFileName: "auth-requirements" // not "auth/requirements"
}
```

#### Steering Directory Not Found
```typescript
// Error: Directory doesn't exist
{
  error: "Steering directory .kiro/steering/ does not exist",
  code: "STEERING_DIRECTORY_NOT_FOUND"
}

// Solution: Create directory or use different path
// Directory will be created automatically if parent exists
```

### Error Recovery Strategies

```typescript
// Robust steering file creation with error handling
async function createSteeringFileWithFallback(toolFunction: Function, params: any) {
  try {
    // Try with steering file creation
    return await toolFunction({
      ...params,
      context: {
        ...params.context,
        createSteeringFile: true
      }
    });
  } catch (error) {
    if (error.code?.includes('STEERING')) {
      console.warn('Steering file creation failed, proceeding without:', error.message);
      
      // Fallback: generate document without steering file
      return await toolFunction({
        ...params,
        context: {
          ...params.context,
          createSteeringFile: false
        }
      });
    }
    throw error; // Re-throw non-steering errors
  }
}
```

## Configuration Examples

### Team-Specific Configurations

#### Frontend Team Configuration
```typescript
const frontendSteeringConfig = {
  createSteeringFile: true,
  inclusionRule: "fileMatch",
  fileMatchPattern: "src/components/*|src/pages/*|*.tsx|*.jsx",
  organizationStrategy: "feature-based",
  customFrontMatter: {
    team: "frontend",
    framework: "react",
    reviewRequired: true
  }
};
```

#### Backend Team Configuration
```typescript
const backendSteeringConfig = {
  createSteeringFile: true,
  inclusionRule: "fileMatch", 
  fileMatchPattern: "src/api/*|src/services/*|*.controller.ts|*.service.ts",
  organizationStrategy: "feature-based",
  customFrontMatter: {
    team: "backend",
    framework: "nestjs",
    securityReviewRequired: true
  }
};
```

#### DevOps Team Configuration
```typescript
const devopsSteeringConfig = {
  createSteeringFile: true,
  inclusionRule: "fileMatch",
  fileMatchPattern: "*.yml|*.yaml|Dockerfile|docker-compose*|k8s/*",
  organizationStrategy: "type-based",
  customFrontMatter: {
    team: "devops",
    environment: "production",
    complianceRequired: true
  }
};
```

### Project-Specific Configurations

#### Microservices Project
```typescript
const microservicesConfig = {
  createSteeringFile: true,
  organizationStrategy: "feature-based",
  customFrontMatter: {
    architecture: "microservices",
    serviceOwner: "team-name",
    apiVersion: "v1"
  }
};
```

#### Monolith Project
```typescript
const monolithConfig = {
  createSteeringFile: true,
  organizationStrategy: "type-based",
  customFrontMatter: {
    architecture: "monolith",
    module: "feature-name",
    migrationCandidate: false
  }
};
```

## Integration Patterns

### CI/CD Integration

#### GitHub Actions Example
```yaml
name: Generate Steering Files
on:
  workflow_dispatch:
    inputs:
      intent:
        description: 'Feature intent'
        required: true
      feature_name:
        description: 'Feature name'
        required: true

jobs:
  generate-steering:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Generate PM Documents with Steering
        run: |
          node scripts/generate-workflow.js \
            --intent "${{ github.event.inputs.intent }}" \
            --feature "${{ github.event.inputs.feature_name }}" \
            --create-steering-files
            
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v3
        with:
          title: "Add steering files for ${{ github.event.inputs.feature_name }}"
          body: "Generated PM documents and steering files for new feature"
          branch: "steering/${{ github.event.inputs.feature_name }}"
```

#### Script Example
```javascript
// scripts/generate-workflow.js
const { generateCompleteWorkflow } = require('../src/mcp/pm-tools');

async function main() {
  const intent = process.argv[2];
  const featureName = process.argv[3];
  const createSteering = process.argv.includes('--create-steering-files');
  
  const workflow = await generateCompleteWorkflow(intent, {
    featureName,
    createSteeringFiles: createSteering,
    organizationStrategy: 'feature-based'
  });
  
  console.log(`Generated workflow for ${featureName}`);
  console.log(`Steering files: ${workflow.steeringFiles.join(', ')}`);
}

main().catch(console.error);
```

### IDE Integration

#### VSCode Extension Configuration
```json
{
  "kiro.steering.autoGenerate": true,
  "kiro.steering.defaultInclusionRule": "fileMatch",
  "kiro.steering.organizationStrategy": "feature-based",
  "kiro.steering.customFrontMatter": {
    "team": "development",
    "reviewRequired": true
  }
}
```

#### Custom Commands
```typescript
// VSCode extension command
vscode.commands.registerCommand('kiro.generateSteeringFile', async () => {
  const intent = await vscode.window.showInputBox({
    prompt: 'Enter feature intent'
  });
  
  const featureName = await vscode.window.showInputBox({
    prompt: 'Enter feature name'
  });
  
  if (intent && featureName) {
    await generateWorkflowWithSteering(intent, featureName);
    vscode.window.showInformationMessage('Steering files generated successfully');
  }
});
```

## Best Practices Summary

### Parameter Selection Guidelines

1. **Use `fileMatch` for most steering files** - provides contextual activation
2. **Use `manual` for executive/sensitive content** - explicit control
3. **Use `always` sparingly** - only for core principles that apply everywhere
4. **Make patterns specific but not too narrow** - balance relevance with coverage
5. **Include feature name for organization** - enables better file management

### Common Patterns

```typescript
// Requirements steering
{
  inclusionRule: "fileMatch",
  fileMatchPattern: "requirements*|spec*|*requirements*"
}

// Design steering  
{
  inclusionRule: "fileMatch",
  fileMatchPattern: "design*|architecture*|*design*"
}

// Implementation steering
{
  inclusionRule: "fileMatch", 
  fileMatchPattern: "src/*|tests/*|implementation*"
}

// Executive steering
{
  inclusionRule: "manual"
}
```

### Naming Conventions

- Use kebab-case: `user-auth-requirements`
- Include document type: `auth-design-options`
- Add version if needed: `payment-requirements-v2`
- Use feature prefix: `dashboard-implementation-guide`

This reference provides comprehensive documentation for using MCP tools with steering file integration. For implementation examples and best practices, see the [Steering File Examples](steering-file-examples.md) and [Best Practices Guide](steering-file-best-practices.md).