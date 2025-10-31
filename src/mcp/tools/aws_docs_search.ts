/**
 * AWS Documentation Search MCP Tool
 * 
 * Provides real-time search capabilities for AWS service documentation
 * during development workflows.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { AWSDocsMCPIntegration, DocumentationResult } from '../../components/aws-docs-mcp-integration';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

/**
 * AWS Documentation Search arguments
 */
export interface AWSDocsSearchArgs {
  /** Search query for AWS documentation */
  query: string;
  /** Maximum number of results to return */
  limit?: number;
  /** Filter by specific AWS services */
  services?: string[];
  /** Filter by documentation categories */
  categories?: ('user-guide' | 'api-reference' | 'developer-guide' | 'best-practices')[];
}

/**
 * MCP Tool: aws_docs_search
 * 
 * Searches AWS documentation for specific topics and returns relevant results
 * with URLs, titles, and context information.
 * 
 * @param args - AWS documentation search arguments
 * @param context - MCP tool execution context
 * @returns Search results with documentation URLs and metadata
 */
export async function awsDocsSearch(
  args: AWSDocsSearchArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    // Validate required arguments
    if (!args || typeof args.query !== 'string' || args.query.trim().length === 0) {
      throw new Error('Validation failed: query is required and must be a non-empty string');
    }

    MCPLogger.debug('Starting AWS documentation search', context, {
      query: args.query,
      limit: args.limit,
      services: args.services,
      categories: args.categories,
    });

    // Initialize AWS Docs MCP integration
    const awsDocsMCP = new AWSDocsMCPIntegration();
    
    // Wait for initialization if needed
    if (!awsDocsMCP.isReady()) {
      MCPLogger.debug('Waiting for AWS Docs MCP initialization', context);
      await new Promise((resolve, reject) => {
        awsDocsMCP.once('initialized', resolve);
        awsDocsMCP.once('error', reject);
        setTimeout(() => reject(new Error('AWS Docs MCP initialization timeout')), 10000);
      });
    }

    // Perform the search
    const searchResults = await awsDocsMCP.searchDocumentation(
      args.query,
      context,
      {
        limit: args.limit,
        services: args.services,
        categories: args.categories,
      }
    );

    MCPLogger.info('AWS documentation search completed', context, {
      query: args.query,
      resultCount: searchResults.length,
      topResult: searchResults[0]?.title,
      servicesFound: [...new Set(searchResults.map(r => r.service).filter(Boolean))],
    });

    // Format results for better readability
    const formattedResults = formatSearchResults(searchResults, args.query);

    return MCPResponseFormatter.formatSuccess(
      {
        query: args.query,
        total_results: searchResults.length,
        results: searchResults,
        formatted_output: formattedResults,
      },
      'json',
      {
        executionTime: Date.now() - context.timestamp,
        quotaUsed: 1, // Documentation search uses 1 quota unit
        searchQuery: args.query,
        resultCount: searchResults.length,
      }
    );
  } catch (error) {
    MCPLogger.error('aws_docs_search tool failed', error as Error, context, {
      query: args.query,
      limit: args.limit,
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in aws_docs_search'),
      context
    );
  }
}

/**
 * Format search results for better readability
 */
function formatSearchResults(results: DocumentationResult[], query: string): string {
  if (results.length === 0) {
    return `No AWS documentation found for query: "${query}"`;
  }

  let formatted = `# AWS Documentation Search Results\n\n`;
  formatted += `**Query:** ${query}\n`;
  formatted += `**Results Found:** ${results.length}\n\n`;

  results.forEach((result, index) => {
    formatted += `## ${index + 1}. ${result.title}\n\n`;
    formatted += `**URL:** ${result.url}\n`;
    
    if (result.service) {
      formatted += `**Service:** ${result.service.toUpperCase()}\n`;
    }
    
    if (result.category) {
      formatted += `**Category:** ${result.category.replace('-', ' ').toUpperCase()}\n`;
    }
    
    if (result.context) {
      formatted += `**Description:** ${result.context}\n`;
    }
    
    formatted += `**Relevance Rank:** ${result.rank_order}\n\n`;
    
    if (index < results.length - 1) {
      formatted += `---\n\n`;
    }
  });

  return formatted;
}

/**
 * Input schema for aws_docs_search tool
 */
export const awsDocsSearchSchema = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: 'Search query for AWS documentation (e.g., "Lambda function URLs", "S3 bucket versioning")',
      minLength: 1,
      maxLength: 500,
    },
    limit: {
      type: 'number',
      description: 'Maximum number of results to return',
      minimum: 1,
      maximum: 50,
      default: 10,
    },
    services: {
      type: 'array',
      items: {
        type: 'string',
      },
      description: 'Filter results by specific AWS services (e.g., ["lambda", "s3", "ec2"])',
      maxItems: 20,
    },
    categories: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['user-guide', 'api-reference', 'developer-guide', 'best-practices'],
      },
      description: 'Filter results by documentation categories',
      maxItems: 4,
    },
  },
  required: ['query'],
} as const;

/**
 * Tool description for MCP registration
 */
export const awsDocsSearchDescription =
  'Search AWS documentation using the official AWS Documentation Search API. Use it to find relevant documentation when you don\'t have a specific URL. Include service names to narrow results (e.g., "S3 bucket versioning" instead of just "versioning"). Returns URLs, titles, and context snippets for each result.';