// MCP Server configuration and tool definitions

import { 
  MCPServerConfig, 
  MCPTool, 
  JSONSchema,
  OptimizeIntentArgs,
  AnalyzeWorkflowArgs,
  GenerateROIArgs,
  ConsultingSummaryArgs,
  ValidateIdeaQuickArgs
} from '../models/mcp';
import { 
  CompetitiveAnalysisArgs, 
  MarketSizingArgs, 
  EnhancedBusinessOpportunityArgs 
} from '../models/competitive';

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
            description: "Expected number of users or requests",
            minimum: 1,
            maximum: 1000000
          },
          costConstraints: {
            type: "object",
            description: "Cost constraints for the optimization",
            properties: {
              maxVibes: { type: "number", minimum: 0 },
              maxSpecs: { type: "number", minimum: 0 },
              maxCostDollars: { type: "number", minimum: 0 }
            }
          },
          performanceSensitivity: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "How sensitive the application is to performance"
          }
        }
      }
    },
    required: ["intent"]
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
                quotaCost: { type: "number" }
              },
              required: ["id", "type", "description", "quotaCost"]
            }
          },
          dataFlow: { type: "array" },
          estimatedComplexity: { type: "number" }
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
    required: ["workflow"]
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
    required: ["workflow"]
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
    required: ["analysis"]
  } as JSONSchema,

  generateManagementOnePager: {
    type: "object",
    properties: {
      requirements: {
        type: "string",
        description: "Requirements document content"
      },
      design: {
        type: "string", 
        description: "Design document content"
      },
      tasks: {
        type: "string",
        description: "Task plan content (optional)"
      },
      roi_inputs: {
        type: "object",
        properties: {
          cost_naive: { type: "number" },
          cost_balanced: { type: "number" },
          cost_bold: { type: "number" }
        },
        description: "Optional ROI cost inputs for different scenarios"
      },
      steering_options: {
        type: "object",
        properties: {
          create_steering_files: { 
            type: "boolean", 
            description: "Whether to create steering files from generated documents" 
          },
          feature_name: { 
            type: "string", 
            description: "Feature name for organizing steering files" 
          },
          filename_prefix: { 
            type: "string", 
            description: "Custom filename prefix for steering files" 
          },
          inclusion_rule: { 
            type: "string", 
            enum: ["always", "fileMatch", "manual"],
            description: "How the steering file should be included in context" 
          },
          file_match_pattern: { 
            type: "string", 
            description: "File match pattern when inclusion_rule is 'fileMatch'" 
          },
          overwrite_existing: { 
            type: "boolean", 
            description: "Whether to overwrite existing steering files" 
          }
        },
        description: "Optional steering file creation options"
      }
    },
    required: ["requirements", "design"]
  } as JSONSchema,

  generatePRFAQ: {
    type: "object",
    properties: {
      requirements: {
        type: "string",
        description: "Requirements document content"
      },
      design: {
        type: "string",
        description: "Design document content"
      },
      target_date: {
        type: "string",
        description: "Target launch date (YYYY-MM-DD format, optional, defaults to 3 months from now)"
      },
      steering_options: {
        type: "object",
        properties: {
          create_steering_files: { 
            type: "boolean", 
            description: "Whether to create steering files from generated documents" 
          },
          feature_name: { 
            type: "string", 
            description: "Feature name for organizing steering files" 
          },
          filename_prefix: { 
            type: "string", 
            description: "Custom filename prefix for steering files" 
          },
          inclusion_rule: { 
            type: "string", 
            enum: ["always", "fileMatch", "manual"],
            description: "How the steering file should be included in context" 
          },
          file_match_pattern: { 
            type: "string", 
            description: "File match pattern when inclusion_rule is 'fileMatch'" 
          },
          overwrite_existing: { 
            type: "boolean", 
            description: "Whether to overwrite existing steering files" 
          }
        },
        description: "Optional steering file creation options"
      }
    },
    required: ["requirements", "design"]
  } as JSONSchema,

  generateRequirements: {
    type: "object",
    properties: {
      raw_intent: {
        type: "string",
        description: "Raw developer intent in natural language"
      },
      context: {
        type: "object",
        properties: {
          roadmap_theme: { type: "string" },
          budget: { type: "number" },
          quotas: {
            type: "object",
            properties: {
              maxVibes: { type: "number" },
              maxSpecs: { type: "number" }
            }
          },
          deadlines: { type: "string" }
        },
        description: "Optional context for requirements generation"
      },
      steering_options: {
        type: "object",
        properties: {
          create_steering_files: { 
            type: "boolean", 
            description: "Whether to create steering files from generated documents" 
          },
          feature_name: { 
            type: "string", 
            description: "Feature name for organizing steering files" 
          },
          filename_prefix: { 
            type: "string", 
            description: "Custom filename prefix for steering files" 
          },
          inclusion_rule: { 
            type: "string", 
            enum: ["always", "fileMatch", "manual"],
            description: "How the steering file should be included in context" 
          },
          file_match_pattern: { 
            type: "string", 
            description: "File match pattern when inclusion_rule is 'fileMatch'" 
          },
          overwrite_existing: { 
            type: "boolean", 
            description: "Whether to overwrite existing steering files" 
          }
        },
        description: "Optional steering file creation options"
      }
    },
    required: ["raw_intent"]
  } as JSONSchema,

  generateDesignOptions: {
    type: "object",
    properties: {
      requirements: {
        type: "string",
        description: "Approved requirements document content"
      },
      steering_options: {
        type: "object",
        properties: {
          create_steering_files: { 
            type: "boolean", 
            description: "Whether to create steering files from generated documents" 
          },
          feature_name: { 
            type: "string", 
            description: "Feature name for organizing steering files" 
          },
          filename_prefix: { 
            type: "string", 
            description: "Custom filename prefix for steering files" 
          },
          inclusion_rule: { 
            type: "string", 
            enum: ["always", "fileMatch", "manual"],
            description: "How the steering file should be included in context" 
          },
          file_match_pattern: { 
            type: "string", 
            description: "File match pattern when inclusion_rule is 'fileMatch'" 
          },
          overwrite_existing: { 
            type: "boolean", 
            description: "Whether to overwrite existing steering files" 
          }
        },
        description: "Optional steering file creation options"
      }
    },
    required: ["requirements"]
  } as JSONSchema,

  generateTaskPlan: {
    type: "object",
    properties: {
      design: {
        type: "string",
        description: "Approved design document content"
      },
      limits: {
        type: "object",
        properties: {
          max_vibes: { type: "number" },
          max_specs: { type: "number" },
          budget_usd: { type: "number" }
        },
        description: "Optional project limits for guardrails check"
      },
      steering_options: {
        type: "object",
        properties: {
          create_steering_files: { 
            type: "boolean", 
            description: "Whether to create steering files from generated documents" 
          },
          feature_name: { 
            type: "string", 
            description: "Feature name for organizing steering files" 
          },
          filename_prefix: { 
            type: "string", 
            description: "Custom filename prefix for steering files" 
          },
          inclusion_rule: { 
            type: "string", 
            enum: ["always", "fileMatch", "manual"],
            description: "How the steering file should be included in context" 
          },
          file_match_pattern: { 
            type: "string", 
            description: "File match pattern when inclusion_rule is 'fileMatch'" 
          },
          overwrite_existing: { 
            type: "boolean", 
            description: "Whether to overwrite existing steering files" 
          }
        },
        description: "Optional steering file creation options"
      }
    },
    required: ["design"]
  } as JSONSchema,

  validateIdeaQuick: {
    type: "object",
    properties: {
      idea: {
        type: "string",
        description: "Raw idea or intent to validate quickly",
        minLength: 5,
        maxLength: 2000
      },
      context: {
        type: "object",
        properties: {
          urgency: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "How urgent this idea is"
          },
          budget_range: {
            type: "string", 
            enum: ["small", "medium", "large"],
            description: "Available budget range"
          },
          team_size: {
            type: "number",
            minimum: 1,
            maximum: 100,
            description: "Size of the team working on this"
          }
        },
        description: "Optional context for validation"
      }
    },
    required: ["idea"]
  } as JSONSchema,

  analyzeCompetitorLandscape: {
    type: "object",
    properties: {
      feature_idea: {
        type: "string",
        description: "Feature idea or product concept for competitive analysis",
        minLength: 10,
        maxLength: 2000
      },
      market_context: {
        type: "object",
        properties: {
          industry: { 
            type: "string",
            description: "Industry or market sector"
          },
          geography: { 
            type: "array", 
            items: { type: "string" },
            description: "Target geographic markets" 
          },
          target_segment: { 
            type: "string",
            description: "Target customer segment"
          }
        },
        description: "Optional market context for competitive analysis"
      },
      analysis_depth: {
        type: "string",
        enum: ["quick", "standard", "comprehensive"],
        description: "Depth of competitive analysis to perform"
      },
      steering_options: {
        type: "object",
        properties: {
          create_steering_files: { 
            type: "boolean", 
            description: "Whether to create steering files from generated documents" 
          },
          feature_name: { 
            type: "string", 
            description: "Feature name for organizing steering files" 
          },
          filename_prefix: { 
            type: "string", 
            description: "Custom filename prefix for steering files" 
          },
          inclusion_rule: { 
            type: "string", 
            enum: ["always", "fileMatch", "manual"],
            description: "How the steering file should be included in context" 
          },
          file_match_pattern: { 
            type: "string", 
            description: "File match pattern when inclusion_rule is 'fileMatch'" 
          },
          overwrite_existing: { 
            type: "boolean", 
            description: "Whether to overwrite existing steering files" 
          }
        },
        description: "Optional steering file creation options"
      }
    },
    required: ["feature_idea"]
  } as JSONSchema,

  calculateMarketSizing: {
    type: "object", 
    properties: {
      feature_idea: {
        type: "string",
        description: "Feature idea or product concept for market sizing analysis",
        minLength: 10,
        maxLength: 2000
      },
      market_definition: {
        type: "object",
        properties: {
          industry: { 
            type: "string",
            description: "Industry or market sector"
          },
          geography: { 
            type: "array",
            items: { type: "string" },
            description: "Target geographic markets"
          },
          customer_segments: {
            type: "array",
            items: { type: "string" },
            description: "Target customer segments"
          }
        },
        required: ["industry"],
        description: "Market definition for sizing analysis"
      },
      sizing_methods: {
        type: "array",
        items: {
          type: "string",
          enum: ["top-down", "bottom-up", "value-theory"]
        },
        description: "Market sizing methodologies to apply",
        default: ["top-down", "bottom-up"]
      },
      steering_options: {
        type: "object",
        properties: {
          create_steering_files: { 
            type: "boolean", 
            description: "Whether to create steering files from generated documents" 
          },
          feature_name: { 
            type: "string", 
            description: "Feature name for organizing steering files" 
          },
          filename_prefix: { 
            type: "string", 
            description: "Custom filename prefix for steering files" 
          },
          inclusion_rule: { 
            type: "string", 
            enum: ["always", "fileMatch", "manual"],
            description: "How the steering file should be included in context" 
          },
          file_match_pattern: { 
            type: "string", 
            description: "File match pattern when inclusion_rule is 'fileMatch'" 
          },
          overwrite_existing: { 
            type: "boolean", 
            description: "Whether to overwrite existing steering files" 
          }
        },
        description: "Optional steering file creation options"
      }
    },
    required: ["feature_idea", "market_definition"]
  } as JSONSchema,

  analyzeBusinessOpportunity: {
    type: "object",
    properties: {
      feature_idea: {
        type: "string",
        description: "Feature idea or business need for opportunity analysis",
        minLength: 10,
        maxLength: 2000
      },
      market_context: {
        type: "object",
        properties: {
          industry: { 
            type: "string",
            description: "Industry or market sector"
          },
          geography: { 
            type: "array", 
            items: { type: "string" },
            description: "Target geographic markets" 
          },
          target_segment: { 
            type: "string",
            description: "Target customer segment"
          }
        },
        description: "Optional market context for business analysis"
      },
      include_competitive_analysis: {
        type: "boolean",
        description: "Whether to include competitive landscape analysis",
        default: true
      },
      include_market_sizing: {
        type: "boolean", 
        description: "Whether to include TAM/SAM/SOM market sizing",
        default: true
      },
      analysis_depth: {
        type: "string",
        enum: ["quick", "standard", "comprehensive"],
        description: "Depth of business opportunity analysis"
      },
      steering_options: {
        type: "object",
        properties: {
          create_steering_files: { 
            type: "boolean", 
            description: "Whether to create steering files from generated documents" 
          },
          feature_name: { 
            type: "string", 
            description: "Feature name for organizing steering files" 
          },
          filename_prefix: { 
            type: "string", 
            description: "Custom filename prefix for steering files" 
          },
          inclusion_rule: { 
            type: "string", 
            enum: ["always", "fileMatch", "manual"],
            description: "How the steering file should be included in context" 
          },
          file_match_pattern: { 
            type: "string", 
            description: "File match pattern when inclusion_rule is 'fileMatch'" 
          },
          overwrite_existing: { 
            type: "boolean", 
            description: "Whether to overwrite existing steering files" 
          }
        },
        description: "Optional steering file creation options"
      }
    },
    required: ["feature_idea"]
  } as JSONSchema
};

/**
 * MCP Server configuration with tool definitions
 */
export const MCP_SERVER_CONFIG: MCPServerConfig = {
  name: "vibe-pm-agent",
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
    },
    {
      name: "generate_management_onepager",
      description: "Creates executive-ready management one-pager using Pyramid Principle with answer-first clarity and timing rationale. Optionally creates steering files for future development guidance.",
      inputSchema: TOOL_SCHEMAS.generateManagementOnePager,
      handler: async () => { throw new Error("Handler not implemented"); }
    },
    {
      name: "generate_pr_faq",
      description: "Generates Amazon-style PR-FAQ document with future-dated press release and comprehensive FAQ. Optionally creates steering files for product clarity guidance.",
      inputSchema: TOOL_SCHEMAS.generatePRFAQ,
      handler: async () => { throw new Error("Handler not implemented"); }
    },
    {
      name: "generate_requirements",
      description: "Creates PM-grade requirements with Business Goal extraction, MoSCoW prioritization, and Go/No-Go timing decision. Optionally creates steering files for requirements guidance.",
      inputSchema: TOOL_SCHEMAS.generateRequirements,
      handler: async () => { throw new Error("Handler not implemented"); }
    },
    {
      name: "generate_design_options",
      description: "Translates approved requirements into Conservative/Balanced/Bold design options with Impact vs Effort analysis. Optionally creates steering files for design guidance.",
      inputSchema: TOOL_SCHEMAS.generateDesignOptions,
      handler: async () => { throw new Error("Handler not implemented"); }
    },
    {
      name: "generate_task_plan",
      description: "Creates phased implementation plan with Guardrails Check, Immediate Wins, Short-Term, and Long-Term tasks. Optionally creates steering files for implementation guidance.",
      inputSchema: TOOL_SCHEMAS.generateTaskPlan,
      handler: async () => { throw new Error("Handler not implemented"); }
    },
    {
      name: "validate_idea_quick",
      description: "Fast unit-test-like validation that provides PASS/FAIL verdict with 3 structured options for next steps. Acts like a unit test for ideas - quick feedback with clear choices.",
      inputSchema: TOOL_SCHEMAS.validateIdeaQuick,
      handler: async () => { throw new Error("Handler not implemented"); }
    },
    {
      name: "analyze_competitor_landscape",
      description: "Generates comprehensive competitor analysis with competitive matrix, SWOT analysis, and strategic recommendations using credible sources like McKinsey, Gartner, and World Economic Forum reports.",
      inputSchema: TOOL_SCHEMAS.analyzeCompetitorLandscape,
      handler: async () => { throw new Error("Handler not implemented"); }
    },
    {
      name: "calculate_market_sizing",
      description: "Performs TAM/SAM/SOM market sizing analysis using multiple methodologies (top-down, bottom-up, value-theory) with confidence intervals and authoritative source attribution.",
      inputSchema: TOOL_SCHEMAS.calculateMarketSizing,
      handler: async () => { throw new Error("Handler not implemented"); }
    },
    {
      name: "analyze_business_opportunity",
      description: "Analyzes business opportunity with integrated competitive landscape and market sizing analysis, providing comprehensive strategic assessment with ROI projections and risk evaluation.",
      inputSchema: TOOL_SCHEMAS.analyzeBusinessOpportunity,
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