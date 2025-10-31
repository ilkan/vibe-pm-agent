/**
 * AWS Documentation Recommendations MCP Tool
 * 
 * Provides content recommendations for related AWS documentation pages
 * to help discover additional relevant content.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { AWSDocsMCPIntegration, DocumentationResult } from '../../components/aws-docs-mcp-integration';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

/**
 * AWS Documentation Recommendations arguments
 */
export interface AWSDocsRecommendArgs {
  /** URL of the AWS documentation page to get recommendations for */
  url: string;
}

/**
 * AWS Documentation Recommendations response
 */
export interface AWSDocsRecommendations {
  /** Popular pages within the same AWS service */
  highly_rated: DocumentationResult[];
  /** Recently added pages within the same AWS service */
  new: DocumentationResult[];
  /** Pages covering similar topics to the current page */
  similar: DocumentationResult[];
  /** Pages commonly viewed next by other users */
  journey: DocumentationResult[];
}

/**
 * MCP Tool: aws_docs_recommend
 * 
 * Get content recommendations for an AWS documentation page. Provides four types
 * of recommendations: highly rated, new, similar, and journey-based suggestions.
 * 
 * @param args - AWS documentation recommendations arguments
 * @param context - MCP tool execution context
 * @returns Categorized recommendations for related AWS documentation
 */
export async function awsDocsRecommend(
  args: AWSDocsRecommendArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    // Validate required arguments
    if (!args || typeof args.url !== 'string' || args.url.trim().length === 0) {
      throw new Error('Validation failed: url is required and must be a non-empty string');
    }

    // Validate URL format
    if (!isValidAWSDocsURL(args.url)) {
      throw new Error('Validation failed: url must be from docs.aws.amazon.com domain');
    }

    MCPLogger.debug('Starting AWS documentation recommendations', context, {
      url: args.url,
      service: extractServiceFromURL(args.url),
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

    // Get recommendations
    const recommendations = await awsDocsMCP.getRecommendations(args.url, context);

    const totalRecommendations = 
      recommendations.highly_rated.length +
      recommendations.new.length +
      recommendations.similar.length +
      recommendations.journey.length;

    MCPLogger.info('AWS documentation recommendations retrieved', context, {
      url: args.url,
      totalRecommendations,
      highlyRatedCount: recommendations.highly_rated.length,
      newCount: recommendations.new.length,
      similarCount: recommendations.similar.length,
      journeyCount: recommendations.journey.length,
    });

    // Format recommendations for better readability
    const formattedRecommendations = formatRecommendations(recommendations, args.url);

    return MCPResponseFormatter.formatSuccess(
      {
        source_url: args.url,
        total_recommendations: totalRecommendations,
        recommendations,
        formatted_output: formattedRecommendations,
      },
      'json',
      {
        executionTime: Date.now() - context.timestamp,
        quotaUsed: 1, // Recommendations use 1 quota unit
        totalRecommendations,
        service: extractServiceFromURL(args.url),
      }
    );
  } catch (error) {
    MCPLogger.error('aws_docs_recommend tool failed', error as Error, context, {
      url: args.url,
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in aws_docs_recommend'),
      context
    );
  }
}

/**
 * Validate AWS documentation URL format
 */
function isValidAWSDocsURL(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname === 'docs.aws.amazon.com';
  } catch {
    return false;
  }
}

/**
 * Extract AWS service name from documentation URL
 */
function extractServiceFromURL(url: string): string | undefined {
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    
    // AWS docs URLs typically follow pattern: /service-name/version/guide-type/
    if (pathParts.length >= 1) {
      return pathParts[0];
    }
  } catch {
    // Ignore parsing errors
  }
  
  return undefined;
}

/**
 * Format recommendations for better readability
 */
function formatRecommendations(
  recommendations: AWSDocsRecommendations,
  sourceUrl: string
): string {
  const service = extractServiceFromURL(sourceUrl);
  let formatted = `# AWS Documentation Recommendations\n\n`;
  formatted += `**Source:** ${sourceUrl}\n`;
  
  if (service) {
    formatted += `**Service:** ${service.toUpperCase()}\n`;
  }
  
  formatted += `\n`;

  // Highly Rated section
  if (recommendations.highly_rated.length > 0) {
    formatted += `## 🌟 Highly Rated\n`;
    formatted += `Popular pages within the same AWS service\n\n`;
    
    recommendations.highly_rated.forEach((rec, index) => {
      formatted += `### ${index + 1}. ${rec.title}\n`;
      formatted += `**URL:** ${rec.url}\n`;
      if (rec.context) {
        formatted += `**Description:** ${rec.context}\n`;
      }
      formatted += `\n`;
    });
  }

  // New section
  if (recommendations.new.length > 0) {
    formatted += `## 🆕 New\n`;
    formatted += `Recently added pages within the same AWS service - useful for finding newly released features\n\n`;
    
    recommendations.new.forEach((rec, index) => {
      formatted += `### ${index + 1}. ${rec.title}\n`;
      formatted += `**URL:** ${rec.url}\n`;
      if (rec.context) {
        formatted += `**Description:** ${rec.context}\n`;
      }
      formatted += `\n`;
    });
  }

  // Similar section
  if (recommendations.similar.length > 0) {
    formatted += `## 🔗 Similar\n`;
    formatted += `Pages covering similar topics to the current page\n\n`;
    
    recommendations.similar.forEach((rec, index) => {
      formatted += `### ${index + 1}. ${rec.title}\n`;
      formatted += `**URL:** ${rec.url}\n`;
      if (rec.context) {
        formatted += `**Description:** ${rec.context}\n`;
      }
      formatted += `\n`;
    });
  }

  // Journey section
  if (recommendations.journey.length > 0) {
    formatted += `## 🚀 Journey\n`;
    formatted += `Pages commonly viewed next by other users\n\n`;
    
    recommendations.journey.forEach((rec, index) => {
      formatted += `### ${index + 1}. ${rec.title}\n`;
      formatted += `**URL:** ${rec.url}\n`;
      if (rec.context) {
        formatted += `**Description:** ${rec.context}\n`;
      }
      formatted += `\n`;
    });
  }

  if (recommendations.highly_rated.length === 0 && 
      recommendations.new.length === 0 && 
      recommendations.similar.length === 0 && 
      recommendations.journey.length === 0) {
    formatted += `No recommendations found for this page.\n`;
  }

  return formatted;
}

/**
 * Input schema for aws_docs_recommend tool
 */
export const awsDocsRecommendSchema = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      description: 'URL of the AWS documentation page to get recommendations for (must be from docs.aws.amazon.com)',
      pattern: '^https://docs\\.aws\\.amazon\\.com/.*',
    },
  },
  required: ['url'],
} as const;

/**
 * Tool description for MCP registration
 */
export const awsDocsRecommendDescription =
  'Get content recommendations for an AWS documentation page. Returns four categories of recommendations: highly rated (popular pages within the same service), new (recently added pages), similar (pages covering similar topics), and journey (pages commonly viewed next). Use this after reading a documentation page to find related content or to discover the most popular pages for a service.';