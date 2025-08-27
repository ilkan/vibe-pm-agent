# MCP Tool Schemas and Usage Examples

This document provides detailed schemas and usage examples for all MCP tools exposed by the PM Agent Intent Optimizer server.

## Tool Overview

The PM Agent Intent Optimizer exposes 4 main tools through the Model Context Protocol:

1. **optimize_intent** - Main optimization tool
2. **analyze_workflow** - Workflow analysis tool
3. **generate_roi_analysis** - ROI comparison tool
4. **get_consulting_summary** - Consulting summary tool

## Tool Schemas

### 1. optimize_intent

**Description**: Takes raw developer intent and optional parameters, applies consulting analysis, and returns an optimized Kiro spec with ROI analysis.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "intent": {
      "type": "string",
      "description": "Raw developer intent in natural language",
      "minLength": 10,
      "maxLength": 5000
    },
    "parameters": {
      "type": "object",
      "properties": {
        "expectedUserVolume": {
          "type": "number",
          "description": "Expected number of users/requests",
          "minimum": 1,
          "maximum": 1000000
        },
        "costConstraints": {
          "type": "number",
          "description": "Budget constraints in dollars",
          "minimum": 0
        },
        "performanceSensitivity": {
          "type": "string",
          "enum": ["low", "medium", "high"],
          "description": "Performance sensitivity level"
        }
      },
      "additionalProperties": false
    }
  },
  "required": ["intent"],
  "additionalProperties": false
}
```

**Output Format**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"enhancedKiroSpec\": {...}, \"efficiencySummary\": {...}, \"metadata\": {...}}"
    }
  ],
  "isError": false
}
```

**Usage Examples**:

*Basic Usage*:
```json
{
  "intent": "I want to create a user authentication system with login, registration, and password reset functionality"
}
```

*With Parameters*:
```json
{
  "intent": "Build a content management system that allows users to create, edit, and publish articles with image uploads",
  "parameters": {
    "expectedUserVolume": 5000,
    "costConstraints": 1000,
    "performanceSensitivity": "high"
  }
}
```

*Complex Workflow*:
```json
{
  "intent": "Create an e-commerce platform with product catalog, shopping cart, payment processing, order management, and inventory tracking. Include admin dashboard for managing products and orders.",
  "parameters": {
    "expectedUserVolume": 10000,
    "costConstraints": 2500,
    "performanceSensitivity": "medium"
  }
}
```

### 2. analyze_workflow

**Description**: Analyzes an existing workflow definition for optimization opportunities using consulting techniques.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "workflow": {
      "type": "object",
      "description": "Existing workflow definition to analyze",
      "properties": {
        "id": {"type": "string"},
        "steps": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {"type": "string"},
              "type": {"type": "string", "enum": ["vibe", "spec", "data_retrieval", "processing"]},
              "description": {"type": "string"},
              "inputs": {"type": "array", "items": {"type": "string"}},
              "outputs": {"type": "array", "items": {"type": "string"}},
              "quotaCost": {"type": "number"}
            },
            "required": ["id", "type", "description"]
          }
        },
        "dataFlow": {"type": "array"},
        "estimatedComplexity": {"type": "number"}
      },
      "required": ["id", "steps"]
    },
    "techniques": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["MECE", "Pyramid", "ValueDriverTree", "ZeroBased", "ImpactEffort", "ValueProp", "OptionFraming"]
      },
      "description": "Specific consulting techniques to apply (optional)"
    }
  },
  "required": ["workflow"],
  "additionalProperties": false
}
```

**Usage Examples**:

*Basic Workflow Analysis*:
```json
{
  "workflow": {
    "id": "user-onboarding",
    "steps": [
      {
        "id": "step1",
        "type": "vibe",
        "description": "Validate user email",
        "inputs": ["email"],
        "outputs": ["validation_result"],
        "quotaCost": 1
      },
      {
        "id": "step2",
        "type": "vibe",
        "description": "Check if user exists",
        "inputs": ["email"],
        "outputs": ["user_exists"],
        "quotaCost": 1
      },
      {
        "id": "step3",
        "type": "spec",
        "description": "Create user account",
        "inputs": ["email", "validation_result"],
        "outputs": ["user_id"],
        "quotaCost": 2
      }
    ],
    "estimatedComplexity": 3
  }
}
```

*With Specific Techniques*:
```json
{
  "workflow": {
    "id": "data-processing-pipeline",
    "steps": [
      {
        "id": "extract",
        "type": "data_retrieval",
        "description": "Extract data from multiple sources",
        "quotaCost": 3
      },
      {
        "id": "transform",
        "type": "processing",
        "description": "Transform and clean data",
        "quotaCost": 5
      },
      {
        "id": "load",
        "type": "processing",
        "description": "Load data into warehouse",
        "quotaCost": 2
      }
    ],
    "estimatedComplexity": 8
  },
  "techniques": ["MECE", "ValueDriverTree", "ImpactEffort"]
}
```

### 3. generate_roi_analysis

**Description**: Generates comprehensive ROI analysis comparing naive, optimized, and zero-based approaches.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "workflow": {
      "type": "object",
      "description": "Original workflow definition",
      "properties": {
        "id": {"type": "string"},
        "steps": {"type": "array"},
        "estimatedComplexity": {"type": "number"}
      },
      "required": ["id", "steps"]
    },
    "optimizedWorkflow": {
      "type": "object",
      "description": "Optimized workflow version (optional)",
      "properties": {
        "id": {"type": "string"},
        "steps": {"type": "array"},
        "optimizations": {"type": "array"},
        "efficiencyGains": {"type": "object"}
      }
    },
    "zeroBasedSolution": {
      "type": "object",
      "description": "Zero-based redesign solution (optional)",
      "properties": {
        "radicalApproach": {"type": "string"},
        "assumptionsChallenged": {"type": "array"},
        "potentialSavings": {"type": "number"},
        "implementationRisk": {"type": "string", "enum": ["low", "medium", "high"]}
      }
    }
  },
  "required": ["workflow"],
  "additionalProperties": false
}
```

**Usage Examples**:

*Basic ROI Analysis*:
```json
{
  "workflow": {
    "id": "report-generation",
    "steps": [
      {"id": "fetch-data", "type": "vibe", "quotaCost": 2},
      {"id": "process-data", "type": "vibe", "quotaCost": 3},
      {"id": "generate-report", "type": "vibe", "quotaCost": 2}
    ],
    "estimatedComplexity": 7
  }
}
```

*Comprehensive ROI Analysis*:
```json
{
  "workflow": {
    "id": "customer-analysis",
    "steps": [
      {"id": "data-collection", "type": "vibe", "quotaCost": 5},
      {"id": "analysis", "type": "vibe", "quotaCost": 8},
      {"id": "reporting", "type": "vibe", "quotaCost": 3}
    ],
    "estimatedComplexity": 16
  },
  "optimizedWorkflow": {
    "id": "customer-analysis-optimized",
    "steps": [
      {"id": "batch-collection", "type": "spec", "quotaCost": 2},
      {"id": "cached-analysis", "type": "spec", "quotaCost": 3},
      {"id": "template-reporting", "type": "spec", "quotaCost": 1}
    ],
    "optimizations": ["batching", "caching", "templating"],
    "efficiencyGains": {"quotaSavings": 10, "timeSavings": 60}
  },
  "zeroBasedSolution": {
    "radicalApproach": "Real-time streaming analytics with pre-computed insights",
    "assumptionsChallenged": ["batch processing", "manual reporting"],
    "potentialSavings": 75,
    "implementationRisk": "medium"
  }
}
```

### 4. get_consulting_summary

**Description**: Provides detailed consulting-style summary using Pyramid Principle for any analysis.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "analysis": {
      "type": "object",
      "description": "Analysis results to summarize",
      "properties": {
        "techniquesUsed": {"type": "array"},
        "findings": {"type": "array"},
        "recommendations": {"type": "array"},
        "totalQuotaSavings": {"type": "number"},
        "implementationComplexity": {"type": "string"}
      },
      "required": ["findings"]
    },
    "techniques": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["MECE", "Pyramid", "ValueDriverTree", "ZeroBased", "ImpactEffort", "ValueProp", "OptionFraming"]
      },
      "description": "Techniques used in the analysis (optional)"
    }
  },
  "required": ["analysis"],
  "additionalProperties": false
}
```

**Usage Examples**:

*Basic Consulting Summary*:
```json
{
  "analysis": {
    "findings": [
      "Workflow contains 3 redundant data retrieval steps",
      "Caching could reduce quota consumption by 40%",
      "Batching operations would improve efficiency"
    ],
    "totalQuotaSavings": 12,
    "implementationComplexity": "medium"
  }
}
```

*Detailed Consulting Summary*:
```json
{
  "analysis": {
    "techniquesUsed": ["MECE", "ValueDriverTree", "ImpactEffort"],
    "findings": [
      "Current workflow has 5 distinct inefficiency categories",
      "Data retrieval accounts for 60% of quota consumption",
      "Processing logic could be optimized with caching",
      "Report generation is highly repetitive"
    ],
    "recommendations": [
      "Implement batch data retrieval",
      "Add caching layer for processed data",
      "Create reusable report templates",
      "Consider zero-based redesign for 75% savings"
    ],
    "totalQuotaSavings": 25,
    "implementationComplexity": "high"
  },
  "techniques": ["MECE", "ValueDriverTree", "ImpactEffort", "OptionFraming"]
}
```

## Error Responses

All tools return standardized error responses when issues occur:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: [Error message describing what went wrong]"
    }
  ],
  "isError": true
}
```

Common error scenarios:
- **Validation Failed**: Input doesn't match the required schema
- **Tool Not Found**: Requested tool doesn't exist
- **Processing Failed**: Internal error during tool execution
- **Timeout**: Tool execution exceeded time limits

## Best Practices

### Input Validation
- Always provide required fields
- Keep intent descriptions clear and specific
- Use reasonable parameter values within specified ranges
- Validate workflow structures before analysis

### Performance Optimization
- Use specific techniques when you know what analysis you need
- Provide complete workflow definitions for better analysis
- Consider using caching for repeated similar requests

### Error Handling
- Check the `isError` field in responses
- Parse error messages for specific failure reasons
- Retry with corrected input when validation fails

### Tool Selection
- Use `optimize_intent` for end-to-end optimization from natural language
- Use `analyze_workflow` when you have existing workflow definitions
- Use `generate_roi_analysis` for comparing multiple optimization approaches
- Use `get_consulting_summary` for professional presentation of analysis results

## Integration Examples

### Kiro Integration
```typescript
// Example of calling the MCP tool from Kiro
const result = await kiro.callMCPTool('pm-agent-intent-optimizer', 'optimize_intent', {
  intent: 'Create a blog platform with user authentication and content management',
  parameters: {
    expectedUserVolume: 1000,
    performanceSensitivity: 'medium'
  }
});

if (!result.isError) {
  const optimizedSpec = JSON.parse(result.content[0].text);
  console.log('Generated spec:', optimizedSpec.enhancedKiroSpec);
}
```

### CLI Integration
```bash
# Using MCP CLI tools (if available)
mcp-client call pm-agent-intent-optimizer optimize_intent \
  --intent "Build a task management system" \
  --parameters '{"expectedUserVolume": 500}'
```

This documentation provides comprehensive guidance for using all MCP tools exposed by the PM Agent Intent Optimizer server.