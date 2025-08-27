// MCP Server configuration and tool definitions

import { 
  MCPServerConfig, 
  MCPTool, 
  JSONSchema,
  OptimizeIntentArgs,
  AnalyzeWorkflowArgs,
  GenerateROIArgs,
  ConsultingSummaryArgs
} from '../models/mcp';

/**
 * JSON Schema definitions for MCP tool inputs
 */
export const TOOL_SCHEMAS = {
  optimizeIntent: {
    type: "object",
    properties: {
      intent: {
        type: "string",
        description: "Raw developer intent in natural language",
        minLength: 10,
        maxLength: 5000
      },
      parameters: {
        type: "object",
        properties: {
          expectedUserVolume: {
            type: "number",
            minimum: 1,
            maximum: 1000000,
            description: "Expected number of users or requests"
          },
          costConstraints: {
            type: "number",
            minimum: 0,
            description: "Maximum acceptable cost in dollars"
          },
          performanceSensitivity: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "How sensitive the application is to performance"
          }
        },
        additionalProperties: false
      }
    },
    required: ["intent"],
    additionalProperties: false
  } as JSONSchema,

  analyzeWorkflow: {
    type: "object",
    properties: {
      workflow: {
        type: "object",
        properties: {
          id: { type: "string" },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                type: { 
                  type: "string", 
                  enum: ["vibe", "spec", "data_retrieval", "processing"] 
                },
                description: { type: "string" },
                inputs: { type: "array", items: { type: "string" } },
                outputs: { type: "array", items: { type: "string" } },
                quotaCost: { type: "number", minimum: 0 }
              },
              required: ["id", "type", "description", "quotaCost"]
            }
          },
          dataFlow: { type: "array" },
          estimatedComplexity: { type: "number", minimum: 0 }
        },
        required: ["id", "steps"]
      },
      techniques: {
        type: "array",
        items: {
          type: "string",
          enum: ["MECE", "Pyramid", "ValueDriverTree", "ZeroBased", "ImpactEffort", "ValueProp", "OptionFraming"]
        },
        description: "Specific consulting techniques to apply (optional)"
      }
    },
    required: ["workflow"],
    additionalProperties: false
  } as JSONSchema,

  generateROIAnalysis: {
    type: "object",
    properties: {
      workflow: {
        type: "object",
        properties: {
          id: { type: "string" },
          steps: { type: "array" },
          dataFlow: { type: "array" },
          estimatedComplexity: { type: "number" }
        },
        required: ["id", "steps"]
      },
      optimizedWorkflow: {
        type: "object",
        description: "Optional optimized version of the workflow"
      },
      zeroBasedSolution: {
        type: "object",
        description: "Optional zero-based redesign solution"
      }
    },
    required: ["workflow"],
    additionalProperties: false
  } as JSONSchema,

  getConsultingSummary: {
    type: "object",
    properties: {
      analysis: {
        type: "object",
        properties: {
          techniquesUsed: { type: "array" },
          keyFindings: { type: "array" },
          totalQuotaSavings: { type: "number" }
        },
        required: ["techniquesUsed", "keyFindings", "totalQuotaSavings"]
      },
      techniques: {
        type: "array",
        items: { type: "string" },
        description: "Specific techniques to focus on in the summary"
      }
    },
    required: ["analysis"],
    additionalProperties: false
  } as JSONSchema
};

/**
 * MCP Server configuration with tool definitions
 */
export const MCP_SERVER_CONFIG: MCPServerConfig = {
  name: "pm-agent-intent-optimizer",
  version: "1.0.0",
  description: "AI agent for optimizing developer intent into efficient Kiro specs using consulting techniques",
  tools: [
    {
      name: "optimize_intent",
      description: "Takes raw developer intent and optional parameters, applies consulting analysis, and returns an optimized Kiro spec with ROI analysis",
      inputSchema: TOOL_SCHEMAS.optimizeIntent,
      handler: async () => { throw new Error("Handler not implemented"); } // Will be set by server
    },
    {
      name: "analyze_workflow", 
      description: "Analyzes an existing workflow definition for optimization opportunities using consulting techniques",
      inputSchema: TOOL_SCHEMAS.analyzeWorkflow,
      handler: async () => { throw new Error("Handler not implemented"); }
    },
    {
      name: "generate_roi_analysis",
      description: "Generates comprehensive ROI analysis comparing naive, optimized, and zero-based approaches",
      inputSchema: TOOL_SCHEMAS.generateROIAnalysis,
      handler: async () => { throw new Error("Handler not implemented"); }
    },
    {
      name: "get_consulting_summary",
      description: "Provides detailed consulting-style summary using Pyramid Principle for any analysis",
      inputSchema: TOOL_SCHEMAS.getConsultingSummary,
      handler: async () => { throw new Error("Handler not implemented"); }
    }
  ]
};

/**
 * Tool discovery and registration utilities
 */
export class MCPToolRegistry {
  private tools: Map<string, MCPTool> = new Map();

  /**
   * Register a tool with the registry
   */
  registerTool(tool: MCPTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool '${tool.name}' is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool names for discovery
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Validate tool input against schema
   */
  validateToolInput(toolName: string, input: any): { valid: boolean; errors?: string[] } {
    const tool = this.getTool(toolName);
    if (!tool) {
      return { valid: false, errors: [`Tool '${toolName}' not found`] };
    }

    // Basic validation - in a real implementation, you'd use a JSON schema validator
    const errors: string[] = [];
    const schema = tool.inputSchema;

    if (schema.required) {
      for (const requiredField of schema.required) {
        if (!(requiredField in input)) {
          errors.push(`Missing required field: ${requiredField}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Initialize registry with default tools
   */
  static createDefault(): MCPToolRegistry {
    const registry = new MCPToolRegistry();
    
    for (const tool of MCP_SERVER_CONFIG.tools) {
      registry.registerTool(tool);
    }
    
    return registry;
  }
}