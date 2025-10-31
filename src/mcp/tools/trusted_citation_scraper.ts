/**
 * MCP Tool: trusted_citation_scraper
 *
 * Scrapes authoritative web sources (gov/edu and elite business research domains)
 * to generate high-confidence citations and evidence summaries.
 */

import { MCPToolContext, MCPToolResult } from '../../models/mcp';
import {
  Citation,
  CitationConfidence,
  CitationMetrics,
} from '../../models/citations';
import { TrustedSourceScraper, TrustedSourceScraperOptions } from '../../components/trusted-source-scraper';
import { CitationService } from '../../components/citation-service';
import { ConfidenceScoringEngine } from '../../components/confidence-scoring-engine';
import { MCPLogger, MCPErrorHandler, MCPResponseFormatter } from '../../utils/mcp-error-handling';

export interface TrustedCitationScraperArgs {
  /** Search topic or claim needing citations */
  query: string;
  /** Optional document type for context (business_case, market_analysis, etc.) */
  document_type?: string;
  /** Optional industry focus (e.g., fintech, healthcare) */
  industry?: string;
  /** Maximum number of trusted citations to return (3-12) */
  max_results?: number;
  /** Minimum confidence level to accept (high, medium, low) */
  minimum_confidence?: 'high' | 'medium' | 'low';
  /** Include curated market data feeds for additional sources */
  include_market_feeds?: boolean;
}

/**
 * Trusted citation scraping MCP tool
 */
export async function trustedCitationScraper(
  args: TrustedCitationScraperArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    validateArgs(args);

    const minConfidence = mapConfidence(args.minimum_confidence);
    const scraperOptions: TrustedSourceScraperOptions = {
      industry: args.industry,
      maxResults: args.max_results,
      minConfidence,
      includeMarketFeeds: args.include_market_feeds,
    };

    const scraper = new TrustedSourceScraper();
    MCPLogger.debug('Collecting trusted citations via web scraping', context, {
      query: args.query,
      options: scraperOptions,
    });

    const trustedResult = await scraper.collectTrustedCitations(args.query, scraperOptions);

    if (trustedResult.citations.length === 0) {
      throw new Error('No trusted sources found that meet the confidence threshold.');
    }

    const citationService = new CitationService();
    const confidenceEngine = new ConfidenceScoringEngine();

    const metrics = citationService.calculateCitationMetrics(trustedResult.citations);
    const bibliography = citationService.generateBibliography(trustedResult.citations, 'business');
    const claimConfidence = confidenceEngine.calculateClaimConfidence(
      args.query,
      trustedResult.citations
    );
    const documentConfidence = confidenceEngine.aggregateDocumentConfidence([claimConfidence]);

    const summary = buildTrustedCitationSummary(
      args,
      trustedResult.citations,
      trustedResult.metadata,
      trustedResult.evidences,
      metrics,
      claimConfidence.overall
    );

    const finalContent = `${summary}\n\n${bibliography}`;

    MCPLogger.info('Trusted citation scraping completed', context, {
      citations: trustedResult.citations.length,
      rejected: trustedResult.rejectedSources.length,
      queryUsed: trustedResult.metadata.query,
      confidenceScore: documentConfidence.overallConfidence,
    });

    return MCPResponseFormatter.formatSuccess(finalContent, 'markdown', {
      executionTime: Date.now() - context.timestamp,
      quotaUsed: 2,
      citations: {
        total_citations: metrics.total_citations,
        unique_domains: metrics.unique_domains,
        credibility_score: metrics.credibility_score,
        recency_score: metrics.recency_score,
        diversity_score: metrics.diversity_score,
        average_confidence: metrics.average_confidence,
        claim_confidence: claimConfidence.overall,
      },
      trustedSources: {
        query: trustedResult.metadata.query,
        total_candidates: trustedResult.metadata.totalCandidates,
        trusted_candidates: trustedResult.metadata.trustedCandidates,
        rejected_sources: trustedResult.rejectedSources.length,
      },
    });
  } catch (error) {
    MCPLogger.error('trusted_citation_scraper tool failed', error as Error, context, {
      query: args?.query,
      documentType: args?.document_type,
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in trusted_citation_scraper'),
      context
    );
  }
}

function validateArgs(args: TrustedCitationScraperArgs): void {
  if (!args || typeof args.query !== 'string' || args.query.trim().length < 5) {
    throw new Error('Validation failed: query is required and must be at least 5 characters');
  }

  if (args.max_results && (args.max_results < 3 || args.max_results > 12)) {
    throw new Error('Validation failed: max_results must be between 3 and 12');
  }

  if (
    args.minimum_confidence &&
    !['high', 'medium', 'low'].includes(args.minimum_confidence.toLowerCase())
  ) {
    throw new Error(
      "Validation failed: minimum_confidence must be one of 'high', 'medium', or 'low'"
    );
  }
}

function mapConfidence(
  confidence?: TrustedCitationScraperArgs['minimum_confidence']
): CitationConfidence {
  if (!confidence) {
    return CitationConfidence.MEDIUM;
  }

  switch (confidence.toLowerCase()) {
    case 'high':
      return CitationConfidence.HIGH;
    case 'low':
      return CitationConfidence.LOW;
    default:
      return CitationConfidence.MEDIUM;
  }
}

function buildTrustedCitationSummary(
  args: TrustedCitationScraperArgs,
  citations: Citation[],
  metadata: { totalCandidates: number; trustedCandidates: number; query: string; generatedAt: string },
  evidences: import('../../components/trusted-source-scraper').TrustedSourceEvidence[],
  metrics: CitationMetrics,
  claimConfidenceScore: number
): string {
  const heading = `## Trusted Citation Evidence for "${args.query.trim()}"`;
  const metadataSection = [
    `- **Document Type**: ${args.document_type || 'general'}`,
    `- **Industry Focus**: ${args.industry || 'multi-industry'}`,
    `- **Sources Evaluated**: ${metadata.totalCandidates}`,
    `- **Trusted Sources Used**: ${metadata.trustedCandidates}`,
    `- **Generated At**: ${new Date(metadata.generatedAt).toISOString()}`,
    `- **Minimum Confidence**: ${(args.minimum_confidence || 'medium').toUpperCase()}`,
  ].join('\n');

  const qualitySection = [
    `- **Credibility Score**: ${metrics.credibility_score}/100`,
    `- **Recency Score**: ${metrics.recency_score}/100`,
    `- **Diversity Score**: ${metrics.diversity_score}/100`,
    `- **Average Confidence Level**: ${metrics.average_confidence.toFixed(2)} (high=3, medium=2, low=1)`,
    `- **Claim Confidence**: ${claimConfidenceScore}/100`,
  ].join('\n');

  const citationEntries = citations
    .map(citation => {
      const evidence = evidences.find(e => e.citationId === citation.id);
      const facts = evidence?.keyFacts.length
        ? evidence.keyFacts.map(fact => `    - ${fact}`).join('\n')
        : '    - Evidence extracted from source content';

      return [
        `### ${citation.title}`,
        `- **URL**: ${citation.url}`,
        `- **Domain**: ${citation.domain}`,
        `- **Published**: ${citation.published_at}`,
        `- **Source Type**: ${citation.source_type}`,
        `- **Confidence**: ${citation.confidence}`,
        `- **Key Finding**: ${citation.key_finding}`,
        `- **Organization**: ${citation.organization || 'Not specified'}`,
        `- **Robots Compliance**: ${evidence?.robotsAllowed ? 'respected' : 'blocked'}`,
        `- **Domain Trust Score**: ${evidence?.domainTrustScore ?? 0}`,
        `- **Evidence Highlights:**\n${facts}`,
      ].join('\n');
    })
    .join('\n\n');

  return `${heading}

### Search Parameters
${metadataSection}

### Citation Quality Metrics
${qualitySection}

### Trusted Sources
${citationEntries}
`;
}

/**
 * Input schema for trusted_citation_scraper tool
 */
export const trustedCitationScraperSchema = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      minLength: 5,
      maxLength: 500,
      description: 'Topic or claim requiring trusted citations (e.g., "US AI adoption in healthcare").',
    },
    document_type: {
      type: 'string',
      description: 'Optional document type context (business_case, market_analysis, etc.)',
    },
    industry: {
      type: 'string',
      description: 'Optional industry focus to bias trusted sources (e.g., fintech, healthcare).',
    },
    max_results: {
      type: 'integer',
      minimum: 3,
      maximum: 12,
      description: 'Maximum number of trusted citations to return (default 6).',
      default: 6,
    },
    minimum_confidence: {
      type: 'string',
      enum: ['high', 'medium', 'low'],
      description: 'Minimum confidence level for accepted sources (default medium).',
      default: 'medium',
    },
    include_market_feeds: {
      type: 'boolean',
      description: 'Include curated market data feeds from authoritative sources.',
      default: false,
    },
  },
  required: ['query'],
};

export const trustedCitationScraperDescription =
  'Scrapes authoritative domains (.gov, .edu, McKinsey, HBR, Gartner, Statista, etc.) to produce high-confidence citations with evidence summaries and quality metrics.';
