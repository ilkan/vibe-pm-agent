/**
 * Generated-by: Kiro Spec Mode
 * Spec-ID: vibe_pm_agent_v2_hackathon
 * Spec-Hash: sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 * Model: claude-3.5-sonnet
 * Timestamp: 2025-01-09T10:30:00Z
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { MCPToolResult, MCPToolContext, DesignOptionsArgs } from '../../models/mcp';
import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';
import { SteeringService } from '../../components/steering-service';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

/**
 * MCP Tool: generate_design_options
 * 
 * Translates approved requirements into Conservative/Balanced/Bold design options 
 * with Impact vs Effort analysis and right-time recommendations.
 * 
 * @param args - Design options generation arguments
 * @param context - MCP tool execution context
 * @returns Design options with problem framing, three alternatives, Impact vs Effort matrix, 
 *          and right-time recommendation
 */
export async function generateDesignOptions(
  args: DesignOptionsArgs, 
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Starting design options generation', context, { 
      requirementsLength: args.requirements.length,
      steeringOptions: args.steering_options
    });

    // Load steering prompt template if available
    let promptTemplate = '';
    try {
      const templatePath = join(process.cwd(), '.kiro/steering/prompts/design_options_generation.md');
      promptTemplate = await readFile(templatePath, 'utf-8');
      MCPLogger.debug('Loaded design options generation prompt template', context, {
        templateLength: promptTemplate.length
      });
    } catch (error) {
      MCPLogger.warn('Could not load design options prompt template, using default', context, {
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

    // Generate design options using the pipeline
    const designOptions = await pipeline.generateDesignOptions(args.requirements);
    
    MCPLogger.info('Design options generated successfully', context, {
      problemFramingLength: designOptions.problemFraming.length,
      optionsCount: 3, // Conservative, Balanced, Bold
      matrixQuadrants: Object.keys(designOptions.impactEffortMatrix).length,
      recommendationLength: designOptions.rightTimeRecommendation.length
    });

    // Create steering file if requested
    let steeringResult;
    if (args.steering_options?.create_steering_files) {
      try {
        const designText = JSON.stringify(designOptions, null, 2);
        steeringResult = await steeringService.createFromDesignOptions(
          designText, 
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
      designOptions,
      'json',
      {
        executionTime: Date.now() - context.timestamp,
        quotaUsed: 2, // Design options generation typically uses 2 quota units
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
# Tool: generate_design_options

`;
      result.content[0].text = provenanceHeader + (result.content[0].text || '');
    }

    return result;

  } catch (error) {
    MCPLogger.error('generate_design_options tool failed', error as Error, context, {
      requirementsLength: args.requirements?.length
    });
    
    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in generate_design_options'),
      context
    );
  }
}

/**
 * Input schema for generate_design_options tool
 */
export const generateDesignOptionsSchema = {
  type: "object",
  properties: {
    requirements: {
      type: "string",
      description: "Approved requirements document content",
      minLength: 50,
      maxLength: 20000
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
  required: ["requirements"]
} as const;

/**
 * Tool description for MCP registration
 */
export const generateDesignOptionsDescription = 
  "Translates approved requirements into Conservative/Balanced/Bold design options with Impact vs Effort analysis, problem framing, and right-time recommendations using consulting frameworks.";