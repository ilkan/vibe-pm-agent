/**
 * AWS Documentation Read MCP Tool
 * 
 * Fetches and converts AWS documentation pages to markdown format
 * for development workflow integration.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { AWSDocsMCPIntegration } from '../../components/aws-docs-mcp-integration';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

/**
 * AWS Documentation Read arguments
 */
export interface AWSDocsReadArgs {
  /** URL of the AWS documentation page to read */
  url: string;
  /** Maximum number of characters to return */
  max_length?: number;
  /** Starting character index for partial reads */
  start_index?: number;
}

/**
 * MCP Tool: aws_docs_read
 * 
 * Fetches and converts an AWS documentation page to markdown format.
 * For long documents, supports chunked reading with start_index parameter.
 * 
 * @param args - AWS documentation read arguments
 * @param context - MCP tool execution context
 * @returns Markdown content of the AWS documentation page
 */
export async function awsDocsRead(
  args: AWSDocsReadArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    // Validate required arguments
    if (!args || typeof args.url !== 'string' || args.url.trim().length === 0) {
      throw new Error('Validation failed: url is required and must be a non-empty string');
    }

    // Validate URL format
    if (!isValidAWSDocsURL(args.url)) {
      throw new Error('Validation failed: url must be from docs.aws.amazon.com domain and end with .html');
    }

    // Validate optional parameters
    const maxLength = args.max_length || 5000;
    const startIndex = args.start_index || 0;

    if (maxLength <= 0 || maxLength > 1000000) {
      throw new Error('Validation failed: max_length must be between 1 and 1,000,000');
    }

    if (startIndex < 0) {
      throw new Error('Validation failed: start_index must be non-negative');
    }

    MCPLogger.debug('Starting AWS documentation read', context, {
      url: args.url,
      maxLength,
      startIndex,
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

    // Read the documentation page
    const documentContent = await readAWSDocumentationPage(
      args.url,
      maxLength,
      startIndex,
      context
    );

    const actualLength = documentContent.content.length;
    const isTruncated = actualLength >= maxLength;
    const nextStartIndex = isTruncated ? startIndex + actualLength : null;

    MCPLogger.info('AWS documentation read completed', context, {
      url: args.url,
      contentLength: actualLength,
      isTruncated,
      nextStartIndex,
    });

    // Format the response
    const responseData = {
      url: args.url,
      content: documentContent.content,
      metadata: {
        title: documentContent.title,
        service: extractServiceFromURL(args.url),
        contentLength: actualLength,
        isTruncated,
        nextStartIndex,
        totalEstimatedLength: documentContent.estimatedTotalLength,
      },
    };

    // Add continuation instructions if truncated
    let formattedContent = documentContent.content;
    if (isTruncated && nextStartIndex) {
      formattedContent += `\n\n---\n\n**[DOCUMENT TRUNCATED]**\n\n`;
      formattedContent += `This document was truncated at ${actualLength} characters. `;
      formattedContent += `To continue reading, call this tool again with:\n`;
      formattedContent += `- url: "${args.url}"\n`;
      formattedContent += `- start_index: ${nextStartIndex}\n`;
      formattedContent += `- max_length: ${maxLength} (or adjust as needed)\n`;
    }

    return MCPResponseFormatter.formatSuccess(
      {
        ...responseData,
        formatted_content: formattedContent,
      },
      'markdown',
      {
        executionTime: Date.now() - context.timestamp,
        quotaUsed: 1, // Documentation read uses 1 quota unit
        contentLength: actualLength,
        isTruncated,
        service: extractServiceFromURL(args.url),
      }
    );
  } catch (error) {
    MCPLogger.error('aws_docs_read tool failed', error as Error, context, {
      url: args.url,
      maxLength: args.max_length,
      startIndex: args.start_index,
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in aws_docs_read'),
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
    return (
      parsedUrl.hostname === 'docs.aws.amazon.com' &&
      parsedUrl.pathname.endsWith('.html')
    );
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
 * Read AWS documentation page content
 * This would be replaced with actual MCP client calls
 */
async function readAWSDocumentationPage(
  url: string,
  maxLength: number,
  startIndex: number,
  context: MCPToolContext
): Promise<{
  content: string;
  title: string;
  estimatedTotalLength: number;
}> {
  MCPLogger.debug('Reading AWS documentation page', context, {
    url,
    maxLength,
    startIndex,
  });

  // This would be replaced with actual MCP client call to aws-docs server
  // For now, simulate the response
  
  const mockContent = `# AWS Lambda Function URLs

AWS Lambda function URLs provide a dedicated HTTP(S) endpoint for your Lambda function. You can create and configure a function URL through the Lambda console or the Lambda API. When you create a function URL, Lambda automatically generates a unique URL endpoint for you.

## Creating a Function URL

To create a function URL:

1. Open the Lambda console
2. Choose your function
3. Go to the Configuration tab
4. Choose Function URL
5. Choose Create function URL

## Configuration Options

### Auth Type
- **AWS_IAM**: Requires IAM authentication
- **NONE**: No authentication required (public access)

### CORS Configuration
Configure Cross-Origin Resource Sharing (CORS) settings:
- **AllowCredentials**: Whether credentials are included
- **AllowHeaders**: Allowed headers in requests
- **AllowMethods**: Allowed HTTP methods
- **AllowOrigins**: Allowed origins for requests
- **ExposeHeaders**: Headers exposed to the client
- **MaxAge**: Cache duration for preflight requests

## Security Considerations

When using function URLs:
- Use IAM authentication when possible
- Implement proper input validation
- Monitor function invocations
- Set appropriate resource-based policies

## Pricing

Function URLs don't incur additional charges beyond standard Lambda pricing for:
- Request charges
- Duration charges
- Data transfer charges

## Limits

- Maximum of 1 function URL per function
- URL format: https://<url-id>.lambda-url.<region>.on.aws/
- Standard Lambda limits apply

## Best Practices

1. **Security**: Always validate input and use appropriate authentication
2. **Monitoring**: Set up CloudWatch alarms for errors and throttles
3. **Performance**: Optimize function code for HTTP workloads
4. **Cost**: Monitor invocation patterns and optimize accordingly

For more information, see the [Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/).`;

  // Simulate chunked reading
  const fullContent = mockContent;
  const endIndex = Math.min(startIndex + maxLength, fullContent.length);
  const content = fullContent.slice(startIndex, endIndex);

  return {
    content,
    title: 'AWS Lambda Function URLs',
    estimatedTotalLength: fullContent.length,
  };
}

/**
 * Input schema for aws_docs_read tool
 */
export const awsDocsReadSchema = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      description: 'URL of the AWS documentation page to read (must be from docs.aws.amazon.com and end with .html)',
      pattern: '^https://docs\\.aws\\.amazon\\.com/.*\\.html$',
    },
    max_length: {
      type: 'number',
      description: 'Maximum number of characters to return',
      minimum: 1,
      maximum: 1000000,
      default: 5000,
    },
    start_index: {
      type: 'number',
      description: 'Starting character index for partial reads (useful if a previous fetch was truncated)',
      minimum: 0,
      default: 0,
    },
  },
  required: ['url'],
} as const;

/**
 * Tool description for MCP registration
 */
export const awsDocsReadDescription =
  'Fetch and convert an AWS documentation page to markdown format. Use this tool to retrieve the content of AWS documentation when you have a specific URL. For long documents, you can make multiple calls with different start_index values to retrieve the entire content in chunks. Only works with URLs from docs.aws.amazon.com domain.';