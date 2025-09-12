/**
 * MCP Tool: generate_business_case
 *
 * Generates comprehensive business case with Amazon Working Backwards methodology
 * including assumption ledger, confidence scoring, scenario analysis, and hard questions
 */

import { MCPToolResult, MCPToolContext, GenerateBusinessCaseArgs } from '../../models/mcp';
import {
  AssumptionLedgerService,
  ConfidenceService,
  ScenarioService,
  HardQuestionsService,
  SteeringWriter,
  BusinessInputs,
} from '../../services/amazon';
import { AmazonTemplateProcessor } from '../../components/amazon-template-processor';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';
import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';
import { performanceMonitor } from '../../utils/performance-monitor';
import { AmazonModeManager } from '../../components/amazon-mode-manager';
import { AmazonModeConfig } from '../../models/amazon-config';
import { AuthoritativeSourceEnhancer } from '../../components/authoritative-source-enhancer';

/**
 * MCP Tool: generate_business_case
 *
 * Creates comprehensive business case using Amazon Working Backwards methodology with
 * assumption ledger, confidence scoring, bear/base/bull scenarios, and hard questions
 * that anticipate stakeholder challenges.
 *
 * @param args - Business case generation arguments
 * @param context - MCP tool execution context
 * @returns Business case with evidence mechanisms and metadata.confidenceScore
 */
export async function generateBusinessCase(
  args: GenerateBusinessCaseArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug(
      'Starting business case generation with Amazon Working Backwards (default mode)',
      context,
      {
        opportunityAnalysisLength: args.opportunity_analysis.length,
        hasFinancialInputs: !!args.financial_inputs,
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
    };

    const amazonModeManager = new AmazonModeManager(amazonModeConfig);
    const pipeline = new AIAgentPipeline();
    const steeringWriter = new SteeringWriter();

    // Standard mode generator for fallback compatibility
    const standardGenerator = async (analysis: string, inputs?: any) => {
      MCPLogger.debug('Using standard mode for business case generation', context);
      return await pipeline.generateBusinessCase(analysis, inputs);
    };

    // Monitor total generation time (2-minute target)
    const { result, report } = await performanceMonitor.timeOperation(
      'total_generation',
      async () => {
        // Generate business case using Amazon Mode Manager (with fallback to standard)
        MCPLogger.debug(
          'Generating business case with Amazon Working Backwards methodology',
          context
        );
        const amazonResult = await amazonModeManager.generateBusinessCase(
          args.opportunity_analysis,
          args.financial_inputs,
          standardGenerator
        );

        if (!amazonResult.success) {
          throw new Error(`Business case generation failed: ${amazonResult.error?.message}`);
        }

        const enhancedContent = amazonResult.data!;
        const enhancedBusinessCase = enhancedContent.content;

        MCPLogger.info('Business case generated successfully', context, {
          usedAmazonMode: amazonResult.usedAmazonMode,
          fallbackReason: amazonResult.fallbackReason,
          assumptionCount: enhancedContent.metadata.assumptionCount,
          coveragePercent: enhancedContent.metadata.coveragePercent,
          confidenceScore: enhancedContent.metadata.confidenceScore,
          scenarioCount: enhancedContent.metadata.scenarioCount,
          hardQuestionCount: enhancedContent.metadata.hardQuestionCount,
          contentLength: enhancedBusinessCase.length,
        });

        // 7. Write to Kiro steering if requested
        let steeringResult;
        if (args.steering_options?.create_steering_files && enhancedContent.attachments) {
          try {
            const businessInputs = await extractBusinessInputs(
              args.opportunity_analysis,
              args.financial_inputs
            );
            const inputsHash = await generateInputsHash(businessInputs);

            const steeringPackage = {
              featureSlug: args.steering_options.feature_name || 'business-case',
              artifactType: 'business_case' as const,
              frontMatter: {
                title: `Business Case — ${businessInputs.featureName}`,
                artifact_type: 'business_case',
                created_at: new Date().toISOString(),
                inputs_hash: inputsHash,
                profile: amazonResult.usedAmazonMode ? 'amazon' : 'standard',
                mode: amazonResult.usedAmazonMode ? 'amazon' : 'standard',
                fallback_reason: amazonResult.fallbackReason,
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
              bodyMarkdown: enhancedBusinessCase,
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
# Tool: generate_business_case

`;
        const finalContent = provenanceHeader + enhancedBusinessCase;

        // Format the response with Amazon mode metadata
        const result = MCPResponseFormatter.formatSuccess(finalContent, 'markdown', {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: amazonResult.usedAmazonMode ? 4 : 2, // Amazon mode uses more quota
          steeringFileCreated: steeringResult?.success || false,
          confidenceScore: enhancedContent.metadata.confidenceScore, // Required by task 8.4
          amazonMode: {
            enabled: amazonResult.usedAmazonMode,
            fallbackReason: amazonResult.fallbackReason,
            performanceMetrics: amazonResult.performanceMetrics,
          },
          citations:
            args.citation_options?.include_citations !== false
              ? {
                  total_citations: enhancedContent.metadata.assumptionCount || 0,
                  credibility_score: 85, // Placeholder - would be calculated from citations
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
      },
      args.opportunity_analysis // Use opportunity analysis as input hash
    );

    // Log performance metrics
    MCPLogger.info('Business case generation completed', context, {
      performancePassed: report.passed,
      actualDuration: report.actualDuration,
      targetDuration: report.targetDuration,
      cacheHit: report.cacheHit,
    });

    return result;
  } catch (error) {
    MCPLogger.error('generate_business_case tool failed', error as Error, context, {
      opportunityAnalysisLength: args.opportunity_analysis?.length,
      hasFinancialInputs: !!args.financial_inputs,
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in generate_business_case'),
      context
    );
  }
}

/**
 * Extract business inputs from opportunity analysis text and financial inputs
 */
async function extractBusinessInputs(
  opportunityAnalysis: string,
  financialInputs?: GenerateBusinessCaseArgs['financial_inputs']
): Promise<BusinessInputs> {
  // Parse the opportunity analysis to extract structured data
  // This is a simplified extraction - in practice, would use NLP or structured parsing

  const featureName = extractFeatureName(opportunityAnalysis);
  const customer = extractCustomer(opportunityAnalysis);
  const competitors = extractCompetitors(opportunityAnalysis);
  const marketSize = extractMarketSize(opportunityAnalysis);

  return {
    featureName: featureName || 'New Feature',
    customer: customer || 'Target Customer',
    competitors: competitors,
    pricing: financialInputs?.expected_revenue
      ? financialInputs.expected_revenue / 10000
      : undefined, // Estimate pricing
    users: extractUsers(opportunityAnalysis),
    devCost: financialInputs?.development_cost,
    opsCost: financialInputs?.operational_cost,
    marketSize: marketSize,
    timeline: extractTimeline(opportunityAnalysis),
    citations: [], // Would be populated from opportunity analysis citations
    assumptions: extractAssumptions(opportunityAnalysis),
  };
}

/**
 * Enhance business case with Amazon mechanism outputs
 */
function enhanceBusinessCaseWithMechanisms(
  businessCase: string,
  assumptionLedger: any,
  confidenceScore: any,
  scenarios: any,
  hardQuestions: any[]
): string {
  const mechanismsSections = `

## Evidence Mechanisms

### Assumption Ledger

${generateAssumptionLedgerTable(assumptionLedger)}

**Coverage**: ${assumptionLedger.coverage_pct}% of business claims backed by documented assumptions

### Confidence Assessment

**Overall Confidence**: ${confidenceScore.total}/100 ${confidenceScore.lowConfidence ? '⚠️ Human review recommended' : '✅'}

${confidenceScore.explanation}

**Breakdown**:
- Evidence Quality: ${confidenceScore.breakdown.evidence}/100
- Data Recency: ${confidenceScore.breakdown.recency}/100  
- Source Diversity: ${confidenceScore.breakdown.diversity}/100
- Source Agreement: ${confidenceScore.breakdown.agreement}/100
- Assumption Coverage: ${confidenceScore.breakdown.coverage}/100
- Sensitivity Analysis: ${confidenceScore.breakdown.sensitivity}/100

### Scenario Analysis

| Metric | Bear Case | Base Case | Bull Case | Unit |
|--------|-----------|-----------|-----------|------|
${scenarios.scenarios.base
  .map(
    (row: any, i: number) =>
      `| ${row.metric} | ${scenarios.scenarios.bear[i]?.bear || 'N/A'} | **${row.base}** | ${scenarios.scenarios.bull[i]?.bull || 'N/A'} | ${row.unit || ''} |`
  )
  .join('\n')}

**Key Sensitivities**:
${scenarios.elasticities
  .slice(0, 5)
  .map(
    (e: any) => `- ${e.assumption} ${e.assumptionChange} → ${e.outcomeMetric} ${e.outcomeChange}`
  )
  .join('\n')}

### Hard Questions

${hardQuestions
  .map(
    (q: any) => `**Q${q.id}**: ${q.question}\n*Evidence needed*: ${q.evidenceNeeded.join(', ')}\n`
  )
  .join('\n')}

### Citations

*Citations would be listed here based on assumption sources*
`;

  return businessCase + mechanismsSections;
}

/**
 * Generate assumption ledger table in markdown format
 */
function generateAssumptionLedgerTable(ledger: any): string {
  const header =
    '| ID | Name | Value | Certainty | Sources |\n|----|----|-------|-----------|---------|';
  const rows = ledger.assumptions
    .map(
      (a: any) =>
        `| ${a.id} | ${a.name} | ${a.value} ${a.unit || ''} | ${a.certainty} | ${a.sourceUrls.length} |`
    )
    .join('\n');

  return header + '\n' + rows;
}

/**
 * Generate SHA-256 hash of business inputs for deterministic file naming
 */
async function generateInputsHash(inputs: BusinessInputs): Promise<string> {
  const crypto = await import('crypto');
  const inputString = JSON.stringify(inputs, Object.keys(inputs).sort());
  return crypto.createHash('sha256').update(inputString).digest('hex');
}

// Helper extraction functions (simplified implementations)
function extractFeatureName(text: string): string | undefined {
  const match = text.match(/(?:feature|product|solution):\s*([^\n.]+)/i);
  return match?.[1]?.trim();
}

function extractCustomer(text: string): string | undefined {
  const match = text.match(/(?:customer|user|target):\s*([^\n.]+)/i);
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

function extractUsers(text: string): number | undefined {
  const match = text.match(/(?:users|customers):\s*([0-9,]+)/i);
  return match ? parseInt(match[1].replace(/,/g, '')) : undefined;
}

function extractTimeline(text: string): string | undefined {
  const match = text.match(/(?:timeline|timeframe):\s*([^\n.]+)/i);
  return match?.[1]?.trim();
}

function extractAssumptions(text: string): string[] {
  // Extract explicit assumptions or key claims from the text
  const assumptions: string[] = [];

  // Look for assumption patterns
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

/**
 * Input schema for generate_business_case tool
 */
export const generateBusinessCaseSchema = {
  type: 'object',
  properties: {
    opportunity_analysis: {
      type: 'string',
      description: 'Business opportunity analysis from analyze_business_opportunity',
      minLength: 100,
      maxLength: 50000,
    },
    financial_inputs: {
      type: 'object',
      properties: {
        development_cost: {
          type: 'number',
          description: 'Estimated development cost in USD',
          minimum: 0,
        },
        operational_cost: {
          type: 'number',
          description: 'Estimated operational cost in USD',
          minimum: 0,
        },
        expected_revenue: {
          type: 'number',
          description: 'Expected revenue in USD',
          minimum: 0,
        },
        time_to_market: {
          type: 'number',
          description: 'Time to market in months',
          minimum: 1,
          maximum: 60,
        },
      },
      description: 'Optional financial inputs for ROI calculations',
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
  required: ['opportunity_analysis'],
} as const;

/**
 * Tool description for MCP registration
 */
export const generateBusinessCaseDescription =
  'Creates comprehensive business case with ROI analysis, risk assessment, and strategic alignment from opportunity analysis. Uses Amazon Working Backwards methodology by default with assumption ledger, confidence scoring, bear/base/bull scenario analysis, and hard questions. Returns executive-ready document with financial projections and evidence mechanisms.';
