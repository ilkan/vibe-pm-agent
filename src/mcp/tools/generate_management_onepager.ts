/**
 * Generated-by: Kiro Spec Mode
 * Spec-ID: vibe_pm_agent_v2_hackathon
 * Spec-Hash: sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 * Model: claude-3.5-sonnet
 * Timestamp: 2025-01-09T10:30:00Z
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { MCPToolResult, MCPToolContext, ManagementOnePagerArgs } from '../../models/mcp';
import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';
import { SteeringService } from '../../components/steering-service';
import { CitationIntegration } from '../../utils/citation-integration';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

/**
 * MCP Tool: generate_management_onepager
 * 
 * Creates executive-ready management one-pager using Pyramid Principle with 
 * answer-first clarity, ROI analysis, and timing rationale with evidence backing.
 * 
 * @param args - Management one-pager generation arguments
 * @param context - MCP tool execution context
 * @returns Executive one-pager with decision, rationale, options, ROI table, 
 *          and timing recommendation with comprehensive citations
 */
export async function generateManagementOnePager(
  args: ManagementOnePagerArgs, 
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Starting management one-pager generation', context, { 
      requirementsLength: args.requirements.length,
      designLength: args.design.length,
      hasTasks: !!args.tasks,
      hasROIInputs: !!args.roi_inputs,
      steeringOptions: args.steering_options,
      citationOptions: args.citation_options
    });

    // Load steering prompt template
    let promptTemplate = '';
    try {
      const templatePath = join(process.cwd(), '.kiro/steering/prompts/executive_onepager_generation.md');
      promptTemplate = await readFile(templatePath, 'utf-8');
      MCPLogger.debug('Loaded executive one-pager generation prompt template', context, {
        templateLength: promptTemplate.length
      });
    } catch (error) {
      MCPLogger.warn('Could not load executive one-pager prompt template, using default', context, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Initialize services
    const pipeline = new AIAgentPipeline();
    const steeringService = new SteeringService({
      userPreferences: {
        autoCreate: args.steering_options?.create_steering_files ?? false,
        showPreview: false,
        showSummary: false
      }
    });
    const citationIntegration = new CitationIntegration();

    // Generate management one-pager using the pipeline
    const onePager = await pipeline.generateManagementOnePager(
      args.requirements, 
      args.design, 
      args.tasks, 
      args.roi_inputs
    );

    // Integrate citations if requested
    let enhancedContent = onePager.one_pager_markdown;
    let citationMetrics;
    if (args.citation_options?.include_citations !== false) {
      const citationResult = await citationIntegration.integrateCitations(
        'executive_onepager',
        onePager.one_pager_markdown,
        args.citation_options
      );
      enhancedContent = citationResult.enhancedContent;
      citationMetrics = citationResult.metrics;
      
      MCPLogger.info('Citations integrated into one-pager', context, {
        totalCitations: citationMetrics.total_citations,
        credibilityScore: citationMetrics.credibility_score,
        recencyScore: citationMetrics.recency_score
      });
    }
    
    MCPLogger.info('Management one-pager generated successfully', context, {
      contentLength: enhancedContent.length,
      optionsCount: 3, // Conservative, Balanced, Bold
      risksCount: enhancedContent.match(/Risk:/g)?.length || 0,
      citationsIncluded: citationMetrics?.total_citations || 0
    });

    // Create steering file if requested
    let steeringResult;
    if (args.steering_options?.create_steering_files) {
      try {
        steeringResult = await steeringService.createFromOnePager(
          enhancedContent, 
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

    // Add provenance header
    const provenanceHeader = `# Generated-by: Kiro Spec Mode
# Spec-ID: vibe_pm_agent_v2_hackathon  
# Spec-Hash: sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
# Model: claude-3.5-sonnet
# Timestamp: ${new Date().toISOString()}
# Tool: generate_management_onepager

`;
    const finalContent = provenanceHeader + enhancedContent;

    // Format the response
    const result = MCPResponseFormatter.formatSuccess(
      finalContent,
      'markdown',
      {
        executionTime: Date.now() - context.timestamp,
        quotaUsed: 2, // One-pager generation typically uses 2 quota units
        steeringFileCreated: steeringResult?.created || false,
        templateUsed: promptTemplate.length > 0,
        citations: citationMetrics ? {
          total_citations: citationMetrics.total_citations,
          credibility_score: citationMetrics.credibility_score,
          recency_score: citationMetrics.recency_score,
          diversity_score: citationMetrics.diversity_score,
          bibliography_included: args.citation_options?.include_bibliography !== false
        } : undefined
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

    return result;

  } catch (error) {
    MCPLogger.error('generate_management_onepager tool failed', error as Error, context, {
      requirementsLength: args.requirements?.length,
      designLength: args.design?.length,
      hasTasks: !!args.tasks
    });
    
    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in generate_management_onepager'),
      context
    );
  }
}

/**
 * Input schema for generate_management_onepager tool
 */
export const generateManagementOnePagerSchema = {
  type: "object",
  properties: {
    requirements: {
      type: "string",
      description: "Requirements document content",
      minLength: 50,
      maxLength: 20000
    },
    design: {
      type: "string", 
      description: "Design document content",
      minLength: 50,
      maxLength: 30000
    },
    tasks: {
      type: "string",
      description: "Task plan content (optional)",
      maxLength: 15000
    },
    roi_inputs: {
      type: "object",
      properties: {
        cost_naive: { 
          type: "number",
          description: "Cost estimate for naive approach",
          minimum: 0
        },
        cost_balanced: { 
          type: "number",
          description: "Cost estimate for balanced approach",
          minimum: 0
        },
        cost_bold: { 
          type: "number",
          description: "Cost estimate for bold approach", 
          minimum: 0
        }
      },
      description: "Optional ROI cost inputs for different scenarios"
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
    },
    citation_options: {
      type: "object",
      properties: {
        include_citations: {
          type: "boolean",
          description: "Whether to include citations and references",
          default: true
        },
        minimum_citations: {
          type: "number",
          description: "Minimum number of citations required",
          minimum: 1,
          maximum: 20,
          default: 5
        },
        minimum_confidence: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Required confidence level for citations",
          default: "high"
        },
        industry_focus: {
          type: "string",
          description: "Industry focus for citation relevance"
        },
        geographic_scope: {
          type: "string",
          description: "Geographic scope for citations",
          default: "global"
        },
        citation_style: {
          type: "string",
          enum: ["business", "apa", "inline"],
          description: "Citation style for formatting",
          default: "business"
        },
        include_bibliography: {
          type: "boolean",
          description: "Whether to include bibliography section",
          default: true
        },
        max_citation_age_months: {
          type: "number",
          description: "Maximum age of citations in months",
          minimum: 6,
          maximum: 60,
          default: 18
        }
      },
      description: "Optional citation and referencing options"
    }
  },
  required: ["requirements", "design"]
} as const;

/**
 * Tool description for MCP registration
 */
export const generateManagementOnePagerDescription = 
  "Creates executive-ready management one-pager using Pyramid Principle with answer-first clarity, ROI analysis, risk assessment, and timing rationale backed by comprehensive citations and evidence.";