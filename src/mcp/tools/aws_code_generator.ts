/**
 * AWS Code Generator MCP Tool
 * 
 * Generates AWS SDK code snippets for specific services and operations
 * with customizable language, SDK version, and code style preferences.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { AWSWorkflowEnhancer, CodeSnippetConfig } from '../../components/aws-development-workflow-enhancer';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

/**
 * AWS Code Generator arguments
 */
export interface AWSCodeGeneratorArgs {
  /** AWS service name (e.g., 'lambda', 's3', 'dynamodb') */
  service: string;
  /** Operation name (e.g., 'invoke', 'putObject', 'getItem') */
  operation: string;
  /** Programming language for the code snippet */
  language?: 'javascript' | 'typescript' | 'python' | 'java' | 'cli' | 'curl';
  /** AWS SDK version preference */
  sdk_version?: 'v2' | 'v3';
  /** Code generation options */
  options?: {
    /** Include error handling in the generated code */
    include_error_handling?: boolean;
    /** Include imports and dependencies */
    include_imports?: boolean;
    /** Use async/await pattern (for supported languages) */
    use_async_await?: boolean;
    /** Include comments and documentation */
    include_comments?: boolean;
  };
}

/**
 * MCP Tool: aws_code_generator
 * 
 * Generates AWS SDK code snippets for specific services and operations.
 * Supports multiple programming languages and customizable code generation options.
 * 
 * @param args - AWS code generator arguments
 * @param context - MCP tool execution context
 * @returns Generated AWS SDK code snippet with best practices and pitfalls
 */
export async function awsCodeGenerator(
  args: AWSCodeGeneratorArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    // Validate required arguments
    if (!args || typeof args.service !== 'string' || args.service.trim().length === 0) {
      throw new Error('Validation failed: service is required and must be a non-empty string');
    }

    if (!args || typeof args.operation !== 'string' || args.operation.trim().length === 0) {
      throw new Error('Validation failed: operation is required and must be a non-empty string');
    }

    // Validate service name format
    const validServicePattern = /^[a-z0-9-]+$/;
    if (!validServicePattern.test(args.service)) {
      throw new Error('Validation failed: service name must contain only lowercase letters, numbers, and hyphens');
    }

    // Validate operation name format
    const validOperationPattern = /^[a-zA-Z][a-zA-Z0-9]*$/;
    if (!validOperationPattern.test(args.operation)) {
      throw new Error('Validation failed: operation name must start with a letter and contain only alphanumeric characters');
    }

    MCPLogger.debug('Starting AWS code generation', context, {
      service: args.service,
      operation: args.operation,
      language: args.language,
      sdkVersion: args.sdk_version,
      options: args.options,
    });

    // Initialize AWS Workflow Enhancer
    const workflowEnhancer = new AWSWorkflowEnhancer({
      defaultLanguage: args.language || 'typescript',
      defaultSDKVersion: args.sdk_version || 'v3',
    });
    
    // Wait for initialization if needed
    if (!workflowEnhancer.isReady()) {
      MCPLogger.debug('Waiting for AWS Workflow Enhancer initialization', context);
      await new Promise((resolve, reject) => {
        workflowEnhancer.once('initialized', resolve);
        workflowEnhancer.once('error', reject);
        setTimeout(() => reject(new Error('AWS Workflow Enhancer initialization timeout')), 15000);
      });
    }

    // Build code snippet configuration
    const snippetConfig: Partial<CodeSnippetConfig> = {
      language: args.language || 'typescript',
      sdkVersion: args.sdk_version || 'v3',
      includeErrorHandling: args.options?.include_error_handling !== false,
      includeImports: args.options?.include_imports !== false,
      useAsyncAwait: args.options?.use_async_await !== false,
      includeComments: args.options?.include_comments !== false,
    };

    // Generate the code snippet
    const codeSnippet = await workflowEnhancer.generateCodeSnippet(
      args.service,
      args.operation,
      snippetConfig,
      context
    );

    MCPLogger.info('AWS code snippet generated successfully', context, {
      service: args.service,
      operation: args.operation,
      language: codeSnippet.language,
      codeLength: codeSnippet.code.length,
      dependenciesCount: codeSnippet.dependencies.length,
      bestPracticesCount: codeSnippet.bestPractices.length,
      pitfallsCount: codeSnippet.pitfalls.length,
    });

    // Format the response for better readability
    const formattedOutput = formatCodeSnippet(codeSnippet, args.service, args.operation);

    return MCPResponseFormatter.formatSuccess(
      {
        service: args.service,
        operation: args.operation,
        code_snippet: codeSnippet,
        formatted_output: formattedOutput,
      },
      'markdown',
      {
        executionTime: Date.now() - context.timestamp,
        quotaUsed: 1, // Code generation uses 1 quota unit
        service: args.service,
        operation: args.operation,
        language: codeSnippet.language,
        codeLength: codeSnippet.code.length,
      }
    );
  } catch (error) {
    MCPLogger.error('aws_code_generator tool failed', error as Error, context, {
      service: args.service,
      operation: args.operation,
      language: args.language,
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in aws_code_generator'),
      context
    );
  }
}

/**
 * Format code snippet for better readability
 */
function formatCodeSnippet(
  snippet: any,
  service: string,
  operation: string
): string {
  let formatted = `# AWS ${service.toUpperCase()} - ${operation} Code Example\n\n`;
  
  formatted += `**Service:** ${service.toUpperCase()}\n`;
  formatted += `**Operation:** ${operation}\n`;
  formatted += `**Language:** ${snippet.language}\n`;
  formatted += `**Description:** ${snippet.description}\n\n`;

  // Dependencies section
  if (snippet.dependencies && snippet.dependencies.length > 0) {
    formatted += `## 📦 Dependencies\n\n`;
    
    if (snippet.language === 'typescript' || snippet.language === 'javascript') {
      formatted += `Install the required dependencies:\n\n`;
      formatted += `\`\`\`bash\n`;
      formatted += `npm install ${snippet.dependencies.join(' ')}\n`;
      formatted += `\`\`\`\n\n`;
    } else if (snippet.language === 'python') {
      formatted += `Install the required dependencies:\n\n`;
      formatted += `\`\`\`bash\n`;
      formatted += `pip install ${snippet.dependencies.join(' ')}\n`;
      formatted += `\`\`\`\n\n`;
    } else if (snippet.language === 'java') {
      formatted += `Add the following dependencies to your project:\n\n`;
      snippet.dependencies.forEach((dep: string) => {
        formatted += `- ${dep}\n`;
      });
      formatted += `\n`;
    } else {
      formatted += `Required dependencies:\n\n`;
      snippet.dependencies.forEach((dep: string) => {
        formatted += `- ${dep}\n`;
      });
      formatted += `\n`;
    }
  }

  // Code section
  formatted += `## 💻 Code Example\n\n`;
  formatted += `\`\`\`${snippet.language}\n`;
  formatted += `${snippet.code}\n`;
  formatted += `\`\`\`\n\n`;

  // Best practices section
  if (snippet.bestPractices && snippet.bestPractices.length > 0) {
    formatted += `## ✅ Best Practices\n\n`;
    snippet.bestPractices.forEach((practice: string) => {
      formatted += `- ${practice}\n`;
    });
    formatted += `\n`;
  }

  // Common pitfalls section
  if (snippet.pitfalls && snippet.pitfalls.length > 0) {
    formatted += `## ⚠️ Common Pitfalls to Avoid\n\n`;
    snippet.pitfalls.forEach((pitfall: string) => {
      formatted += `- ${pitfall}\n`;
    });
    formatted += `\n`;
  }

  // Additional resources section
  formatted += `## 📚 Additional Resources\n\n`;
  formatted += `- [AWS ${service.toUpperCase()} Documentation](https://docs.aws.amazon.com/${service}/)\n`;
  formatted += `- [AWS SDK Documentation](https://docs.aws.amazon.com/sdk-for-${snippet.language}/)\n`;
  formatted += `- [AWS ${service.toUpperCase()} API Reference](https://docs.aws.amazon.com/${service}/latest/api/)\n`;

  return formatted;
}

/**
 * Input schema for aws_code_generator tool
 */
export const awsCodeGeneratorSchema = {
  type: 'object',
  properties: {
    service: {
      type: 'string',
      description: 'AWS service name (e.g., "lambda", "s3", "dynamodb", "ec2")',
      pattern: '^[a-z0-9-]+$',
      minLength: 2,
      maxLength: 50,
    },
    operation: {
      type: 'string',
      description: 'Operation name (e.g., "invoke", "putObject", "getItem", "describeInstances")',
      pattern: '^[a-zA-Z][a-zA-Z0-9]*$',
      minLength: 2,
      maxLength: 100,
    },
    language: {
      type: 'string',
      enum: ['javascript', 'typescript', 'python', 'java', 'cli', 'curl'],
      description: 'Programming language for the code snippet',
      default: 'typescript',
    },
    sdk_version: {
      type: 'string',
      enum: ['v2', 'v3'],
      description: 'AWS SDK version preference (applies to JavaScript/TypeScript)',
      default: 'v3',
    },
    options: {
      type: 'object',
      description: 'Code generation options',
      properties: {
        include_error_handling: {
          type: 'boolean',
          description: 'Include error handling in the generated code',
          default: true,
        },
        include_imports: {
          type: 'boolean',
          description: 'Include imports and dependencies in the code',
          default: true,
        },
        use_async_await: {
          type: 'boolean',
          description: 'Use async/await pattern (for supported languages)',
          default: true,
        },
        include_comments: {
          type: 'boolean',
          description: 'Include comments and documentation in the code',
          default: true,
        },
      },
    },
  },
  required: ['service', 'operation'],
} as const;

/**
 * Tool description for MCP registration
 */
export const awsCodeGeneratorDescription =
  'Generates AWS SDK code snippets for specific services and operations. Supports multiple programming languages (TypeScript, JavaScript, Python, Java, CLI, cURL) with customizable options for error handling, imports, async patterns, and comments. Includes best practices and common pitfalls to help developers write better AWS code.';