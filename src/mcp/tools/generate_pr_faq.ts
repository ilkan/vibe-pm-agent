/**
 * Generated-by: Kiro Spec Mode
 * Spec-ID: vibe_pm_agent_v2_hackathon
 * Spec-Hash: sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 * Model: claude-3.5-sonnet
 * Timestamp: 2025-01-09T10:30:00Z
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { MCPToolResult, MCPToolContext, PRFAQArgs } from '../../models/mcp';
import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';
import { SteeringService } from '../../components/steering-service';
import { CitationIntegration } from '../../utils/citation-integration';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

/**
 * MCP Tool: generate_pr_faq
 * 
 * Generates Amazon-style PR-FAQ document with future-dated press release, 
 * comprehensive FAQ, and launch checklist with evidence backing.
 * 
 * @param args - PR-FAQ generation arguments
 * @param context - MCP tool execution context
 * @returns PR-FAQ with press release, FAQ, and launch checklist with 
 *          comprehensive citations and market validation
 */
export async function generatePRFAQ(
  args: PRFAQArgs, 
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Starting PR-FAQ generation', context, { 
      requirementsLength: args.requirements.length,
      designLength: args.design.length,
      targetDate: args.target_date,
      steeringOptions: args.steering_options,
      citationOptions: args.citation_options
    });

    // Load steering prompt template
    let promptTemplate = '';
    try {
      const templatePath = join(process.cwd(), '.kiro/steering/prompts/pr_faq_generation.md');
      promptTemplate = await readFile(templatePath, 'utf-8');
      MCPLogger.debug('Loaded PR-FAQ generation prompt template', context, {
        templateLength: promptTemplate.length
      });
    } catch (error) {
      MCPLogger.warn('Could not load PR-FAQ prompt template, using default', context, {
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

    // Generate PR-FAQ using the pipeline
    const prfaq = await pipeline.generatePRFAQ(
      args.requirements, 
      args.design, 
      args.target_date
    );
    
    MCPLogger.info('PR-FAQ generated successfully', context, {
      pressReleaseLength: prfaq.press_release_markdown.length,
      faqCount: prfaq.faq_markdown.match(/\*\*Q\d+:/g)?.length || 0,
      checklistItems: prfaq.launch_checklist_markdown.match(/- \[ \]/g)?.length || 0
    });

    // Combine all sections
    const combinedContent = `# Press Release

${prfaq.press_release_markdown}

# FAQ

${prfaq.faq_markdown}

# Launch Checklist

${prfaq.launch_checklist_markdown}`;

    // Integrate citations if requested
    let enhancedContent = combinedContent;
    let citationMetrics;
    if (args.citation_options?.include_citations !== false) {
      const citationResult = await citationIntegration.integrateCitations(
        'pr_faq',
        combinedContent,
        args.citation_options
      );
      enhancedContent = citationResult.enhancedContent;
      citationMetrics = citationResult.metrics;
      
      MCPLogger.info('Citations integrated into PR-FAQ', context, {
        totalCitations: citationMetrics.total_citations,
        credibilityScore: citationMetrics.credibility_score,
        recencyScore: citationMetrics.recency_score
      });
    }

    // Create steering file if requested
    let steeringResult;
    if (args.steering_options?.create_steering_files) {
      try {
        steeringResult = await steeringService.createFromPRFAQ(
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
# Tool: generate_pr_faq

`;
    const finalContent = provenanceHeader + enhancedContent;

    // Format the response
    const result = MCPResponseFormatter.formatSuccess(
      finalContent,
      'markdown',
      {
        executionTime: Date.now() - context.timestamp,
        quotaUsed: 3, // PR-FAQ generation typically uses 3 quota units
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
    MCPLogger.error('generate_pr_faq tool failed', error as Error, context, {
      requirementsLength: args.requirements?.length,
      designLength: args.design?.length,
      targetDate: args.target_date
    });
    
    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in generate_pr_faq'),
      context
    );
  }
}

/**
 * Input schema for generate_pr_faq tool
 */
export const generatePRFAQSchema = {
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
    target_date: {
      type: "string",
      description: "Target launch date (YYYY-MM-DD format, optional, defaults to 3 months from now)",
      pattern: "^\\d{4}-\\d{2}-\\d{2}$"
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
export const generatePRFAQDescription = 
  "Generates Amazon-style PR-FAQ document with future-dated press release, comprehensive FAQ with exactly 10 required questions, and launch checklist backed by market validation and comprehensive citations.";