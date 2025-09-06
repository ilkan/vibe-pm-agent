/**
 * Generated-by: Kiro Spec Mode
 * Spec-ID: vibe_pm_agent_v2_hackathon
 * Spec-Hash: sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 * Model: claude-3.5-sonnet
 * Timestamp: 2025-01-09T10:30:00Z
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { MCPToolResult, MCPToolContext, TaskPlanArgs } from '../../models/mcp';
import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';
import { SteeringService } from '../../components/steering-service';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

/**
 * MCP Tool: generate_task_plan
 * 
 * Creates phased implementation plan with Guardrails Check, Immediate Wins, 
 * Short-Term, and Long-Term tasks with detailed task specifications.
 * 
 * @param args - Task plan generation arguments
 * @param context - MCP tool execution context
 * @returns Phased task plan with Guardrails Check, task breakdown with 
 *          ID/Name/Description/Acceptance Criteria/Effort/Impact/Priority
 */
export async function generateTaskPlan(
  args: TaskPlanArgs, 
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Starting task plan generation', context, { 
      designLength: args.design.length,
      hasLimits: !!args.limits,
      limits: args.limits,
      steeringOptions: args.steering_options
    });

    // Load steering prompt template
    let promptTemplate = '';
    try {
      const templatePath = join(process.cwd(), '.kiro/steering/prompts/task_plan_generation.md');
      promptTemplate = await readFile(templatePath, 'utf-8');
      MCPLogger.debug('Loaded task plan generation prompt template', context, {
        templateLength: promptTemplate.length
      });
    } catch (error) {
      MCPLogger.warn('Could not load task plan prompt template, using default', context, {
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

    // Generate task plan using the pipeline
    const taskPlanResult = await pipeline.generateTaskPlan(args.design, args.limits);
    
    MCPLogger.info('Task plan generated successfully', context, {
      guardrailsCheckIncluded: !!taskPlanResult.task_plan.guardrailsCheck,
      immediateWinsCount: taskPlanResult.task_plan.immediateWins.length,
      shortTermCount: taskPlanResult.task_plan.shortTerm.length,
      longTermCount: taskPlanResult.task_plan.longTerm.length,
      totalTasks: taskPlanResult.task_plan.immediateWins.length + taskPlanResult.task_plan.shortTerm.length + taskPlanResult.task_plan.longTerm.length
    });

    // Create steering file if requested
    let steeringResult;
    if (args.steering_options?.create_steering_files) {
      try {
        const taskPlanText = JSON.stringify(taskPlanResult, null, 2);
        steeringResult = await steeringService.createFromTaskPlan(
          taskPlanText, 
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
      taskPlanResult,
      'json',
      {
        executionTime: Date.now() - context.timestamp,
        quotaUsed: 3, // Task plan generation typically uses 3 quota units
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
# Tool: generate_task_plan

`;
      result.content[0].text = provenanceHeader + (result.content[0].text || '');
    }

    return result;

  } catch (error) {
    MCPLogger.error('generate_task_plan tool failed', error as Error, context, {
      designLength: args.design?.length,
      hasLimits: !!args.limits
    });
    
    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in generate_task_plan'),
      context
    );
  }
}

/**
 * Input schema for generate_task_plan tool
 */
export const generateTaskPlanSchema = {
  type: "object",
  properties: {
    design: {
      type: "string",
      description: "Approved design document content",
      minLength: 50,
      maxLength: 30000
    },
    limits: {
      type: "object",
      properties: {
        max_vibes: { 
          type: "number",
          description: "Maximum vibe quota limit",
          minimum: 0
        },
        max_specs: { 
          type: "number",
          description: "Maximum spec quota limit", 
          minimum: 0
        },
        budget_usd: { 
          type: "number",
          description: "Budget limit in USD",
          minimum: 0
        }
      },
      description: "Optional project limits for guardrails check"
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
  required: ["design"]
} as const;

/**
 * Tool description for MCP registration
 */
export const generateTaskPlanDescription = 
  "Creates phased implementation plan with Guardrails Check as Task 0, followed by Immediate Wins, Short-Term, and Long-Term tasks with detailed specifications including effort, impact, and priority.";