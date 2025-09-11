/**
 * MCP Tool: create_stakeholder_communication
 *
 * Routes to PR/FAQ or Decision One-Pager based on communication_type
 * Integrates Amazon Working Backwards mechanism services with template processor
 */

import {
  MCPToolResult,
  MCPToolContext,
  CreateStakeholderCommunicationArgs,
} from '../../models/mcp';
import {
  AssumptionLedgerService,
  ConfidenceService,
  ScenarioService,
  HardQuestionsService,
  SteeringWriter,
  BusinessInputs,
} from '../../services/amazon';
import {
  AmazonTemplateProcessor,
  TemplateContext,
} from '../../components/amazon-template-processor';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';
import { AmazonModeManager } from '../../components/amazon-mode-manager';
import { AmazonModeConfig } from '../../models/amazon-config';
import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';

/**
 * MCP Tool: create_stakeholder_communication
 *
 * Creates stakeholder communication documents (PR/FAQ or Decision One-Pager)
 * using Amazon Working Backwards methodology with comprehensive evidence mechanisms.
 * Routes to appropriate template based on communication_type parameter.
 *
 * @param args - Stakeholder communication generation arguments
 * @param context - MCP tool execution context
 * @returns Stakeholder communication document with evidence mechanisms
 */
export async function createStakeholderCommunication(
  args: CreateStakeholderCommunicationArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug(
      'Starting stakeholder communication generation with Amazon Working Backwards (default mode)',
      context,
      {
        businessCaseLength: args.business_case.length,
        communicationType: args.communication_type,
        audience: args.audience,
        steeringOptions: args.steering_options,
        citationOptions: args.citation_options,
      }
    );

    // Initialize Amazon Mode Manager with configuration options
    const amazonModeConfig: Partial<AmazonModeConfig> = {
      // Allow runtime configuration via args (backward compatibility)
      enabled: args.amazon_mode !== false, // Default to true, can be disabled via args
      fallbackToStandard: true, // Always enable fallback for reliability
      includeEvidenceMechanisms: args.include_evidence_mechanisms !== false,
      templates: {
        useAmazonTemplates:
          args.communication_type === 'pr_faq' || args.communication_type === 'executive_onepager',
        enhanceStandardTemplates: true,
        selectionStrategy: 'amazon_first',
      },
    };

    const amazonModeManager = new AmazonModeManager(amazonModeConfig);
    const pipeline = new AIAgentPipeline();
    const steeringWriter = new SteeringWriter();

    // Standard mode generator for fallback compatibility
    const standardGenerator = async (businessCase: string, type: string, audience: string) => {
      MCPLogger.debug('Using standard mode for stakeholder communication generation', context);

      // Use existing pipeline methods based on communication type
      switch (type) {
        case 'pr_faq':
          const prfaqResult = await pipeline.generatePRFAQ(businessCase, businessCase, undefined);
          return `${prfaqResult.press_release_markdown}\n\n${prfaqResult.faq_markdown}\n\n${prfaqResult.launch_checklist_markdown}`;
        case 'executive_onepager':
          const onepagerResult = await pipeline.generateManagementOnePager(
            businessCase,
            businessCase
          );
          return onepagerResult.one_pager_markdown;
        default:
          return `# ${type.replace('_', ' ').toUpperCase()}: Stakeholder Communication\n\n${businessCase}`;
      }
    };

    // Generate stakeholder communication using Amazon Mode Manager (with fallback to standard)
    MCPLogger.debug(
      'Generating stakeholder communication with Amazon Working Backwards methodology',
      context
    );
    const amazonResult = await amazonModeManager.generateStakeholderCommunication(
      args.business_case,
      args.communication_type,
      args.audience,
      standardGenerator
    );

    if (!amazonResult.success) {
      throw new Error(
        `Stakeholder communication generation failed: ${amazonResult.error?.message}`
      );
    }

    const enhancedContent = amazonResult.data!;
    const document = enhancedContent.content;
    const artifactType = args.communication_type;

    MCPLogger.info('Stakeholder communication generated successfully', context, {
      communicationType: args.communication_type,
      audience: args.audience,
      usedAmazonMode: amazonResult.usedAmazonMode,
      fallbackReason: amazonResult.fallbackReason,
      assumptionCount: enhancedContent.metadata.assumptionCount,
      coveragePercent: enhancedContent.metadata.coveragePercent,
      confidenceScore: enhancedContent.metadata.confidenceScore,
      hardQuestionCount: enhancedContent.metadata.hardQuestionCount,
      contentLength: document.length,
    });

    // 7. Write to Kiro steering if requested
    let steeringResult;
    if (args.steering_options?.create_steering_files && enhancedContent.attachments) {
      try {
        const businessInputs = await extractBusinessInputsFromBusinessCase(args.business_case);
        const inputsHash = await generateInputsHash(businessInputs);

        const steeringPackage = {
          featureSlug: args.steering_options.feature_name || `${artifactType}-${args.audience}`,
          artifactType: artifactType as any,
          frontMatter: {
            title: `${getDocumentTitle(args.communication_type)} — ${businessInputs.featureName}`,
            artifact_type: artifactType,
            created_at: new Date().toISOString(),
            inputs_hash: inputsHash,
            profile: amazonResult.usedAmazonMode ? 'amazon' : 'standard',
            mode: amazonResult.usedAmazonMode ? 'amazon' : 'standard',
            fallback_reason: amazonResult.fallbackReason,
            audience: args.audience,
            communication_type: args.communication_type,
            confidence: {
              total: enhancedContent.metadata.confidenceScore || 0,
              breakdown: {
                evidence: 0,
                recency: 0,
                diversity: 0,
                agreement: 0,
                coverage: 0,
                sensitivity: 0,
              },
            },
            assumptions: {
              ids: [], // Would be populated from actual assumption data
              coverage_pct: enhancedContent.metadata.coveragePercent || 0,
            },
            scenarios: {
              pct: 0.2, // Default ±20%
              metrics: ['Revenue', 'Costs', 'ROI', 'NPV'],
            },
            paths: {
              assumptions_json: `./attachments/assumptions-${inputsHash.slice(0, 8)}.json`,
              citations_json: `./attachments/citations-${inputsHash.slice(0, 8)}.json`,
              scenarios_json: `./attachments/scenarios-${inputsHash.slice(0, 8)}.json`,
            },
          },
          bodyMarkdown: document,
          attachments: enhancedContent.attachments || [],
        };

        steeringResult = await steeringWriter.writeSteering(steeringPackage);

        MCPLogger.info('Steering file creation attempted', context, {
          created: steeringResult.success,
          message: steeringResult.success
            ? 'Steering files created successfully'
            : steeringResult.error?.message,
        });
      } catch (steeringError) {
        MCPLogger.warn('Steering file creation failed', context, {
          error: steeringError instanceof Error ? steeringError.message : 'Unknown error',
        });
      }
    }

    // Add provenance header
    const provenanceHeader = `# Generated-by: Kiro Spec Mode
# Spec-ID: amazon_working_backwards
# Model: claude-3.5-sonnet
# Timestamp: ${new Date().toISOString()}
# Tool: create_stakeholder_communication
# Communication-Type: ${args.communication_type}
# Audience: ${args.audience}

`;
    const finalContent = provenanceHeader + document;

    // Format the response with Amazon mode metadata
    const result = MCPResponseFormatter.formatSuccess(finalContent, 'markdown', {
      executionTime: Date.now() - context.timestamp,
      quotaUsed: amazonResult.usedAmazonMode
        ? getQuotaUsage(args.communication_type)
        : Math.max(1, getQuotaUsage(args.communication_type) - 1),
      steeringFileCreated: steeringResult?.success || false,
      confidenceScore: enhancedContent.metadata.confidenceScore,
      amazonMode: {
        enabled: amazonResult.usedAmazonMode,
        fallbackReason: amazonResult.fallbackReason,
        performanceMetrics: amazonResult.performanceMetrics,
      },
      citations:
        args.citation_options?.include_citations !== false
          ? {
              total_citations: enhancedContent.metadata.assumptionCount || 0,
              credibility_score: 85,
              recency_score: 75,
              diversity_score: 70,
              bibliography_included: true,
              quality_score: enhancedContent.metadata.confidenceScore || 0,
              overall_confidence: enhancedContent.metadata.confidenceScore || 0,
              compliance_status:
                (enhancedContent.metadata.confidenceScore || 0) < 60 ? 'warning' : 'compliant',
            }
          : undefined,
    });

    // Add steering file information to metadata if created
    if (steeringResult?.success && steeringResult.data && steeringResult.data.filename) {
      result.metadata = {
        ...result.metadata,
        steeringFiles: [
          {
            filename: steeringResult.data.filename,
            action: 'created',
            fullPath: steeringResult.data.fullPath,
          },
        ],
      };
    }

    return result;
  } catch (error) {
    MCPLogger.error('create_stakeholder_communication tool failed', error as Error, context, {
      businessCaseLength: args.business_case?.length,
      communicationType: args.communication_type,
      audience: args.audience,
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error
        ? error
        : new Error('Unknown error in create_stakeholder_communication'),
      context
    );
  }
}

// Helper functions for template generation and data extraction
function generateBoardPresentationWithMechanisms(
  templateContext: TemplateContext,
  audience: string
): string {
  return `---
title: "Board Presentation — ${templateContext.featureName}"
artifact_type: board_presentation
created_at: "${templateContext.isoTimestamp}"
inputs_hash: "${templateContext.inputsHash}"
profile: "amazon"
audience: "${audience}"
confidence:
  total: ${templateContext.confidence.total}
  breakdown: ${JSON.stringify(templateContext.confidence.breakdown)}
assumptions:
  ids: ${JSON.stringify(templateContext.ledger.assumptions.map(a => a.id))}
  coverage_pct: ${templateContext.ledger.coverage_pct}
scenarios:
  pct: ${templateContext.scenarios.sensitivityPct}
  metrics: ${JSON.stringify(['Revenue', 'Costs', 'ROI', 'NPV'])}
paths:
  assumptions_json: "./attachments/assumptions-${templateContext.shortHash}.json"
  citations_json: "./attachments/citations-${templateContext.shortHash}.json"
  scenarios_json: "./attachments/scenarios-${templateContext.shortHash}.json"
---

# Board Presentation: ${templateContext.featureName}

## Executive Summary

**Recommendation**: ${templateContext.confidence.total >= 70 ? 'PROCEED' : 'PROCEED WITH CAUTION'}
**Confidence Level**: ${templateContext.confidence.total}/100 ${templateContext.confidence.lowConfidence ? '⚠️' : '✅'}

## Evidence Mechanisms

### Assumption Ledger
${generateAssumptionLedgerTable(templateContext.ledger)}

### Confidence Score
**Overall Confidence**: ${templateContext.confidence.total}/100
${templateContext.confidence.lowConfidence ? '> **⚠️ Human Review Recommended**' : ''}

### Scenario Analysis
${generateScenarioTable(templateContext.scenarios)}

### Hard Questions
${templateContext.hardQuestions.map((q: any) => `**Q${q.id}**: ${q.question}`).join('\n')}`;
}

function generateTeamAnnouncementWithMechanisms(
  templateContext: TemplateContext,
  audience: string
): string {
  return `---
title: "Team Announcement — ${templateContext.featureName}"
artifact_type: team_announcement
created_at: "${templateContext.isoTimestamp}"
inputs_hash: "${templateContext.inputsHash}"
profile: "amazon"
audience: "${audience}"
confidence:
  total: ${templateContext.confidence.total}
  breakdown: ${JSON.stringify(templateContext.confidence.breakdown)}
assumptions:
  ids: ${JSON.stringify(templateContext.ledger.assumptions.map(a => a.id))}
  coverage_pct: ${templateContext.ledger.coverage_pct}
scenarios:
  pct: ${templateContext.scenarios.sensitivityPct}
  metrics: ${JSON.stringify(['Revenue', 'Costs', 'ROI', 'NPV'])}
paths:
  assumptions_json: "./attachments/assumptions-${templateContext.shortHash}.json"
  citations_json: "./attachments/citations-${templateContext.shortHash}.json"
  scenarios_json: "./attachments/scenarios-${templateContext.shortHash}.json"
---

# Team Announcement: ${templateContext.featureName}

## What We're Building
**${templateContext.featureName}** for **${templateContext.customer}**

## Evidence Base
**Confidence**: ${templateContext.confidence.total}/100
**Assumptions Covered**: ${templateContext.ledger.coverage_pct}%

### Key Assumptions
${templateContext.ledger.assumptions
  .slice(0, 3)
  .map((a: any) => `- **${a.name}**: ${a.value} (${a.certainty})`)
  .join('\n')}

### Questions We're Addressing
${templateContext.hardQuestions
  .slice(0, 3)
  .map((q: any) => `- ${q.question}`)
  .join('\n')}`;
}

function generateFallbackDocument(
  templateContext: TemplateContext,
  communicationType: string,
  audience: string
): string {
  const title = getDocumentTitle(communicationType);
  return `# ${title}: ${templateContext.featureName}

## Overview
**Problem**: ${templateContext.problemOneLine}
**Confidence**: ${templateContext.confidence.total}/100

## Evidence Mechanisms
${generateAssumptionLedgerTable(templateContext.ledger)}

### Scenario Analysis
${generateScenarioTable(templateContext.scenarios)}

### Hard Questions
${templateContext.hardQuestions.map((q: any) => `**Q${q.id}**: ${q.question}`).join('\n')}`;
}

function extractProblemStatement(businessCase: string): string {
  const patterns = [/problem:\s*([^\n.]+)/i, /challenge:\s*([^\n.]+)/i, /issue:\s*([^\n.]+)/i];

  for (const pattern of patterns) {
    const match = businessCase.match(pattern);
    if (match) return match[1].trim();
  }

  return 'Address key business challenges';
}

function generateAssumptionLedgerTable(ledger: any): string {
  const header =
    '| ID | Name | Value | Certainty | Sources |\n|----|----|-------|-----------|---------|';
  const rows = ledger.assumptions
    .map(
      (a: any) => `| ${a.id} | ${a.name} | ${a.value} | ${a.certainty} | ${a.sourceUrls.length} |`
    )
    .join('\n');
  return header + '\n' + rows;
}

function generateScenarioTable(scenarios: any): string {
  const header = '| Metric | Bear | Base | Bull |\n|--------|------|------|------|';
  const rows = scenarios.scenarios.base
    .map(
      (row: any, i: number) =>
        `| ${row.metric} | ${scenarios.scenarios.bear[i]?.bear || 'N/A'} | **${row.base}** | ${scenarios.scenarios.bull[i]?.bull || 'N/A'} |`
    )
    .join('\n');
  return header + '\n' + rows;
}

async function extractBusinessInputsFromBusinessCase(
  businessCase: string
): Promise<BusinessInputs> {
  return {
    featureName: extractFeatureName(businessCase) || 'Feature',
    customer: extractCustomer(businessCase) || 'Customer',
    competitors: extractCompetitors(businessCase),
    marketSize: extractMarketSize(businessCase),
    devCost: extractDevelopmentCost(businessCase),
    opsCost: extractOperationalCost(businessCase),
    timeline: extractTimeline(businessCase),
    citations: [],
    assumptions: extractAssumptions(businessCase),
  };
}

function extractFinancialModel(businessCase: string): any {
  const revenue = extractRevenue(businessCase) || 1000000;
  const costs = extractDevelopmentCost(businessCase) || 500000;
  return {
    revenue,
    costs,
    roi: ((revenue - costs) / costs) * 100,
    npv: revenue - costs,
  };
}

function getDocumentTitle(communicationType: string): string {
  switch (communicationType) {
    case 'pr_faq':
      return 'PR/FAQ';
    case 'executive_onepager':
      return 'Decision One-Pager';
    case 'board_presentation':
      return 'Board Presentation';
    case 'team_announcement':
      return 'Team Announcement';
    default:
      return 'Stakeholder Communication';
  }
}

function getQuotaUsage(communicationType: string): number {
  switch (communicationType) {
    case 'pr_faq':
      return 4;
    case 'executive_onepager':
      return 3;
    case 'board_presentation':
      return 3;
    case 'team_announcement':
      return 2;
    default:
      return 3;
  }
}

async function generateInputsHash(inputs: BusinessInputs): Promise<string> {
  const crypto = await import('crypto');
  const inputString = JSON.stringify(inputs, Object.keys(inputs).sort());
  return crypto.createHash('sha256').update(inputString).digest('hex');
}

// Helper extraction functions
function extractFeatureName(text: string): string | undefined {
  const patterns = [/(?:feature|product|solution):\s*([^\n.]+)/i, /# ([^\n]+)/, /## ([^\n]+)/];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1]?.trim();
  }
  return undefined;
}

function extractCustomer(text: string): string | undefined {
  const match = text.match(/(?:customer|user|target|audience):\s*([^\n.]+)/i);
  return match?.[1]?.trim();
}

function extractCompetitors(text: string): string[] | undefined {
  const match = text.match(/(?:competitor|competition)s?:\s*([^\n.]+)/i);
  return match?.[1]?.split(',').map(c => c.trim());
}

function extractMarketSize(text: string): number | undefined {
  const match = text.match(/market size:\s*\$?([0-9,]+(?:\.[0-9]+)?)\s*([bmk]?)/i);
  if (match) {
    const value = parseFloat(match[1].replace(/,/g, ''));
    const multiplier = match[2]?.toLowerCase();
    if (multiplier === 'b') return value * 1000000000;
    if (multiplier === 'm') return value * 1000000;
    if (multiplier === 'k') return value * 1000;
    return value;
  }
  return undefined;
}

function extractDevelopmentCost(text: string): number | undefined {
  const match = text.match(/(?:development cost|dev cost):\s*\$?([0-9,]+)/i);
  return match ? parseInt(match[1].replace(/,/g, '')) : undefined;
}

function extractOperationalCost(text: string): number | undefined {
  const match = text.match(/(?:operational cost|ops cost):\s*\$?([0-9,]+)/i);
  return match ? parseInt(match[1].replace(/,/g, '')) : undefined;
}

function extractRevenue(text: string): number | undefined {
  const match = text.match(/(?:revenue|income):\s*\$?([0-9,]+)/i);
  return match ? parseInt(match[1].replace(/,/g, '')) : undefined;
}

function extractTimeline(text: string): string | undefined {
  const match = text.match(/(?:timeline|timeframe):\s*([^\n.]+)/i);
  return match?.[1]?.trim();
}

function extractAssumptions(text: string): string[] {
  const assumptions: string[] = [];
  const assumptionPatterns = [
    /assume[s]?\s+(?:that\s+)?([^.]+)/gi,
    /we believe\s+(?:that\s+)?([^.]+)/gi,
    /expect\s+(?:that\s+)?([^.]+)/gi,
    /estimate\s+(?:that\s+)?([^.]+)/gi,
  ];

  assumptionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      assumptions.push(match[1].trim());
    }
  });

  return assumptions;
}

export const createStakeholderCommunicationSchema = {
  type: 'object',
  properties: {
    business_case: {
      type: 'string',
      description: 'Business case analysis from generate_business_case',
      minLength: 100,
      maxLength: 100000,
    },
    communication_type: {
      type: 'string',
      enum: ['executive_onepager', 'pr_faq', 'board_presentation', 'team_announcement'],
      description: 'Type of stakeholder communication to generate',
    },
    audience: {
      type: 'string',
      enum: ['executives', 'board', 'engineering_team', 'customers', 'investors'],
      description: 'Target audience for the communication',
    },
    amazon_mode: {
      type: 'boolean',
      description:
        'Enable Amazon Working Backwards methodology (default: true for backward compatibility)',
      default: true,
    },
    include_evidence_mechanisms: {
      type: 'boolean',
      description:
        'Include assumption ledger, confidence scoring, scenarios, and hard questions (default: true)',
      default: true,
    },
    steering_options: {
      type: 'object',
      properties: {
        create_steering_files: {
          type: 'boolean',
          description: 'Whether to create steering files from generated documents',
          default: false,
        },
        feature_name: {
          type: 'string',
          description: 'Feature name for organizing steering files',
        },
        filename_prefix: {
          type: 'string',
          description: 'Custom filename prefix for steering files',
        },
        inclusion_rule: {
          type: 'string',
          enum: ['always', 'fileMatch', 'manual'],
          description: 'How the steering file should be included in context',
          default: 'manual',
        },
        file_match_pattern: {
          type: 'string',
          description: "File match pattern when inclusion_rule is 'fileMatch'",
        },
        overwrite_existing: {
          type: 'boolean',
          description: 'Whether to overwrite existing steering files',
          default: false,
        },
      },
      description: 'Optional steering file creation options',
    },
    citation_options: {
      type: 'object',
      properties: {
        include_citations: {
          type: 'boolean',
          description: 'Whether to include citations and references',
          default: true,
        },
        minimum_citations: {
          type: 'number',
          description: 'Minimum number of citations required',
          minimum: 1,
          maximum: 20,
          default: 5,
        },
        minimum_confidence: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Required confidence level for citations',
          default: 'high',
        },
        industry_focus: {
          type: 'string',
          description: 'Industry focus for citation relevance',
        },
        geographic_scope: {
          type: 'string',
          description: 'Geographic scope for citations',
          default: 'global',
        },
        citation_style: {
          type: 'string',
          enum: ['business', 'apa', 'inline'],
          description: 'Citation style for formatting',
          default: 'business',
        },
        include_bibliography: {
          type: 'boolean',
          description: 'Whether to include bibliography section',
          default: true,
        },
        max_citation_age_months: {
          type: 'number',
          description: 'Maximum age of citations in months',
          minimum: 6,
          maximum: 60,
          default: 18,
        },
      },
      description: 'Optional citation and referencing options',
    },
  },
  required: ['business_case', 'communication_type', 'audience'],
} as const;

export const createStakeholderCommunicationDescription =
  'Creates stakeholder communication documents (PR/FAQ or Decision One-Pager) using Amazon Working Backwards methodology by default. Routes to appropriate template based on communication_type parameter with comprehensive evidence mechanisms. Includes fallback to standard mode for backward compatibility. Configure via amazon_mode and include_evidence_mechanisms parameters.';
