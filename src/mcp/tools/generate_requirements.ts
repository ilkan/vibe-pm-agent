/**
 * Generated-by: Kiro Spec Mode
 * Spec-ID: vibe_pm_agent_v2_hackathon
 * Spec-Hash: sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 * Model: claude-3.5-sonnet
 * Timestamp: 2025-01-09T10:30:00Z
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { MCPToolResult, MCPToolContext, RequirementsArgs } from '../../models/mcp';
import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';
import { SteeringService } from '../../components/steering-service';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

/**
 * MCP Tool: generate_requirements
 * 
 * Creates PM-grade requirements with Business Goal extraction, MoSCoW prioritization, 
 * and Go/No-Go timing decision using evidence-backed analysis.
 * 
 * @param args - Requirements generation arguments
 * @param context - MCP tool execution context
 * @returns Structured requirements with Business Goal, User Needs, Functional Requirements, 
 *          Constraints/Risks, MoSCoW prioritization, and Right-Time verdict
 */
export async function generateRequirements(
  args: RequirementsArgs, 
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Starting requirements generation', context, { 
      intentLength: args.raw_intent.length,
      hasContext: !!args.context,
      contextKeys: args.context ? Object.keys(args.context) : [],
      steeringOptions: args.steering_options
    });

    // Load steering prompt template
    let promptTemplate = '';
    try {
      const templatePath = join(process.cwd(), '.kiro/steering/prompts/requirements_generation.md');
      promptTemplate = await readFile(templatePath, 'utf-8');
      MCPLogger.debug('Loaded requirements generation prompt template', context, {
        templateLength: promptTemplate.length
      });
    } catch (error) {
      MCPLogger.warn('Could not load requirements prompt template, using default', context, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Initialize pipeline and steering service
    const pipeline = new AIAgentPipeline();
    const steeringService = new SteeringService({
      userPreferences: {
        autoCreate: args.steering_options?.create_steering_files ?? false,
        showPreview: false,
        showSummary: false
      }
    });

    // Generate requirements using the pipeline
    const requirements = await pipeline.generateRequirements(args.raw_intent, args.context);
    
    MCPLogger.info('Requirements generated successfully', context, {
      businessGoalLength: requirements.businessGoal.length,
      functionalRequirementsCount: requirements.functionalRequirements.length,
      mustHaveCount: requirements.priority.must.length,
      shouldHaveCount: requirements.priority.should.length,
      couldHaveCount: requirements.priority.could.length,
      wontHaveCount: requirements.priority.wont.length,
      rightTimeDecision: requirements.rightTimeVerdict.decision
    });

    // Create steering file if requested
    let steeringResult;
    if (args.steering_options?.create_steering_files) {
      try {
        const requirementsText = JSON.stringify(requirements, null, 2);
        steeringResult = await steeringService.createFromRequirements(
          requirementsText, 
          args.steering_options
        );
        
        MCPLogger.info('Steering file creation attempted', context, {
          created: steeringResult.created,
          message: steeringResult.message,
          filesCreated: steeringResult.results?.length || 0
        });
      } catch (steeringError) {
        MCPLogger.warn('Steering file creation failed', context, { 
          error: steeringError instanceof Error ? steeringError.message : 'Unknown error' 
        });
      }
    }

    // Format the response
    const result = MCPResponseFormatter.formatSuccess(
      requirements,
      'json',
      {
        executionTime: Date.now() - context.timestamp,
        quotaUsed: 2, // Requirements generation typically uses 2 quota units
        steeringFileCreated: steeringResult?.created || false,
        templateUsed: promptTemplate.length > 0
      }
    );

    // Add steering file information to metadata if created
    if (steeringResult?.created && steeringResult.results) {
      result.metadata = {
        ...result.metadata,
        steeringFiles: steeringResult.results.map(r => ({
          filename: r.filename,
          action: r.action,
          fullPath: r.fullPath
        }))
      };
    }

    // Add provenance header to content
    if (result.content && result.content.length > 0 && result.content[0].type === 'text') {
      const provenanceHeader = `# Generated-by: Kiro Spec Mode
# Spec-ID: vibe_pm_agent_v2_hackathon  
# Spec-Hash: sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
# Model: claude-3.5-sonnet
# Timestamp: ${new Date().toISOString()}
# Tool: generate_requirements

`;
      result.content[0].text = provenanceHeader + (result.content[0].text || '');
    }

    return result;

  } catch (error) {
    MCPLogger.error('generate_requirements tool failed', error as Error, context, {
      intentLength: args.raw_intent?.length,
      hasContext: !!args.context
    });
    
    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in generate_requirements'),
      context
    );
  }
}

/**
 * Input schema for generate_requirements tool
 */
export const generateRequirementsSchema = {
  type: "object",
  properties: {
    raw_intent: {
      type: "string",
      description: "Raw developer intent in natural language",
      minLength: 10,
      maxLength: 5000
    },
    context: {
      type: "object",
      properties: {
        roadmap_theme: { 
          type: "string",
          description: "Current roadmap theme or strategic focus"
        },
        budget: { 
          type: "number",
          description: "Available budget in USD",
          minimum: 0
        },
        quotas: {
          type: "object",
          properties: {
            maxVibes: { 
              type: "number",
              description: "Maximum vibe quota available",
              minimum: 0
            },
            maxSpecs: { 
              type: "number", 
              description: "Maximum spec quota available",
              minimum: 0
            }
          },
          description: "Quota constraints"
        },
        deadlines: { 
          type: "string",
          description: "Timeline constraints and deadlines"
        }
      },
      description: "Optional context for requirements generation"
    },
    steering_options: {
      type: "object",
      properties: {
        create_steering_files: { 
          type: "boolean", 
          description: "Whether to create steering files from generated documents",
          default: false
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
          description: "How the steering file should be included in context",
          default: "manual"
        },
        file_match_pattern: { 
          type: "string", 
          description: "File match pattern when inclusion_rule is 'fileMatch'" 
        },
        overwrite_existing: { 
          type: "boolean", 
          description: "Whether to overwrite existing steering files",
          default: false
        }
      },
      description: "Optional steering file creation options"
    }
  },
  required: ["raw_intent"]
} as const;

/**
 * Tool description for MCP registration
 */
export const generateRequirementsDescription = 
  "Creates PM-grade requirements with Business Goal extraction, MoSCoW prioritization, and Go/No-Go timing decision using evidence-backed analysis and consulting frameworks.";