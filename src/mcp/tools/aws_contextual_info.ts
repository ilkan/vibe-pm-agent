/**
 * AWS Contextual Information MCP Tool
 * 
 * Provides contextual AWS service information display during development workflows.
 * Combines service context, code snippets, best practices, and related documentation.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { AWSWorkflowEnhancer, DevelopmentContext } from '../../components/aws-development-workflow-enhancer';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

/**
 * AWS Contextual Information arguments
 */
export interface AWSContextualInfoArgs {
  /** Query or topic for contextual information */
  query: string;
  /** Development context for better recommendations */
  development_context?: {
    /** Current AWS services being used */
    services?: string[];
    /** Development stage */
    stage?: 'development' | 'testing' | 'staging' | 'production';
    /** Application type */
    application_type?: 'web' | 'mobile' | 'api' | 'batch' | 'realtime' | 'ml';
    /** Performance requirements */
    performance_requirements?: {
      latency?: 'low' | 'medium' | 'high';
      throughput?: 'low' | 'medium' | 'high';
      availability?: 'standard' | 'high' | 'critical';
    };
    /** Security requirements */
    security_requirements?: {
      data_classification?: 'public' | 'internal' | 'confidential' | 'restricted';
      compliance_frameworks?: string[];
    };
  };
  /** Preferred programming language for code snippets */
  preferred_language?: 'javascript' | 'typescript' | 'python' | 'java' | 'cli' | 'curl';
  /** Include code snippets in response */
  include_code_snippets?: boolean;
  /** Include best practice recommendations */
  include_best_practices?: boolean;
}

/**
 * MCP Tool: aws_contextual_info
 * 
 * Provides comprehensive contextual AWS information including service details,
 * code snippets, best practices, and related documentation based on the query
 * and development context.
 * 
 * @param args - AWS contextual information arguments
 * @param context - MCP tool execution context
 * @returns Contextual AWS development information
 */
export async function awsContextualInfo(
  args: AWSContextualInfoArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    // Validate required arguments
    if (!args || typeof args.query !== 'string' || args.query.trim().length === 0) {
      throw new Error('Validation failed: query is required and must be a non-empty string');
    }

    MCPLogger.debug('Starting AWS contextual information retrieval', context, {
      query: args.query,
      developmentContext: args.development_context,
      preferredLanguage: args.preferred_language,
      includeCodeSnippets: args.include_code_snippets,
      includeBestPractices: args.include_best_practices,
    });

    // Initialize AWS Workflow Enhancer
    const workflowEnhancer = new AWSWorkflowEnhancer({
      defaultLanguage: args.preferred_language || 'typescript',
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

    // Convert development context
    const developmentContext: Partial<DevelopmentContext> | undefined = args.development_context ? {
      services: args.development_context.services || [],
      stage: args.development_context.stage || 'development',
      applicationType: args.development_context.application_type || 'web',
      performanceRequirements: args.development_context.performance_requirements ? {
        latency: args.development_context.performance_requirements.latency || 'medium',
        throughput: args.development_context.performance_requirements.throughput || 'medium',
        availability: args.development_context.performance_requirements.availability || 'standard',
      } : undefined,
      securityRequirements: args.development_context.security_requirements ? {
        dataClassification: args.development_context.security_requirements.data_classification || 'internal',
        complianceFrameworks: args.development_context.security_requirements.compliance_frameworks || [],
      } : undefined,
    } : undefined;

    // Get contextual information
    const contextualInfo = await workflowEnhancer.getContextualInfo(
      args.query,
      developmentContext,
      context
    );

    // Filter results based on user preferences
    const filteredInfo = {
      service_context: contextualInfo.serviceContext,
      code_snippets: args.include_code_snippets !== false ? contextualInfo.codeSnippets : [],
      best_practices: args.include_best_practices !== false ? contextualInfo.bestPractices : [],
      related_documentation: contextualInfo.relatedDocumentation,
    };

    MCPLogger.info('AWS contextual information retrieved', context, {
      query: args.query,
      hasServiceContext: !!filteredInfo.service_context,
      codeSnippetsCount: filteredInfo.code_snippets.length,
      bestPracticesCount: filteredInfo.best_practices.length,
      relatedDocsCount: filteredInfo.related_documentation.length,
    });

    // Format the response for better readability
    const formattedOutput = formatContextualInfo(filteredInfo, args.query);

    return MCPResponseFormatter.formatSuccess(
      {
        query: args.query,
        contextual_info: filteredInfo,
        formatted_output: formattedOutput,
      },
      'markdown',
      {
        executionTime: Date.now() - context.timestamp,
        quotaUsed: 2, // Contextual info uses 2 quota units due to multiple API calls
        query: args.query,
        servicesAnalyzed: contextualInfo.serviceContext ? 1 : 0,
        codeSnippetsGenerated: filteredInfo.code_snippets.length,
        bestPracticesCount: filteredInfo.best_practices.length,
      }
    );
  } catch (error) {
    MCPLogger.error('aws_contextual_info tool failed', error as Error, context, {
      query: args.query,
      developmentContext: args.development_context,
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in aws_contextual_info'),
      context
    );
  }
}

/**
 * Format contextual information for better readability
 */
function formatContextualInfo(
  info: {
    service_context?: any;
    code_snippets: any[];
    best_practices: any[];
    related_documentation: any[];
  },
  query: string
): string {
  let formatted = `# AWS Contextual Information\n\n`;
  formatted += `**Query:** ${query}\n\n`;

  // Service Context Section
  if (info.service_context) {
    const service = info.service_context;
    formatted += `## 🔧 Service Overview: ${service.serviceName.toUpperCase()}\n\n`;
    formatted += `${service.description}\n\n`;

    if (service.keyFeatures && service.keyFeatures.length > 0) {
      formatted += `### Key Features\n`;
      service.keyFeatures.forEach((feature: string) => {
        formatted += `- ${feature}\n`;
      });
      formatted += `\n`;
    }

    if (service.useCases && service.useCases.length > 0) {
      formatted += `### Common Use Cases\n`;
      service.useCases.forEach((useCase: string) => {
        formatted += `- ${useCase}\n`;
      });
      formatted += `\n`;
    }

    if (service.pricingModel) {
      formatted += `### Pricing Model\n`;
      formatted += `${service.pricingModel}\n\n`;
    }

    if (service.limits && service.limits.length > 0) {
      formatted += `### Service Limits\n`;
      service.limits.forEach((limit: any) => {
        formatted += `- **${limit.name}**: ${limit.defaultValue}`;
        if (limit.adjustable) {
          formatted += ` (adjustable)`;
        }
        formatted += `\n  ${limit.description}\n`;
      });
      formatted += `\n`;
    }

    if (service.relatedServices && service.relatedServices.length > 0) {
      formatted += `### Related Services\n`;
      formatted += `${service.relatedServices.map((s: string) => s.toUpperCase()).join(', ')}\n\n`;
    }
  }

  // Code Snippets Section
  if (info.code_snippets && info.code_snippets.length > 0) {
    formatted += `## 💻 Code Examples\n\n`;
    
    info.code_snippets.forEach((snippet: any, index: number) => {
      formatted += `### ${index + 1}. ${snippet.description}\n\n`;
      formatted += `**Language:** ${snippet.language}\n\n`;
      
      if (snippet.dependencies && snippet.dependencies.length > 0) {
        formatted += `**Dependencies:**\n`;
        snippet.dependencies.forEach((dep: string) => {
          formatted += `- ${dep}\n`;
        });
        formatted += `\n`;
      }

      formatted += `\`\`\`${snippet.language}\n${snippet.code}\n\`\`\`\n\n`;

      if (snippet.bestPractices && snippet.bestPractices.length > 0) {
        formatted += `**Best Practices:**\n`;
        snippet.bestPractices.forEach((practice: string) => {
          formatted += `- ${practice}\n`;
        });
        formatted += `\n`;
      }

      if (snippet.pitfalls && snippet.pitfalls.length > 0) {
        formatted += `**Common Pitfalls to Avoid:**\n`;
        snippet.pitfalls.forEach((pitfall: string) => {
          formatted += `- ${pitfall}\n`;
        });
        formatted += `\n`;
      }

      if (index < info.code_snippets.length - 1) {
        formatted += `---\n\n`;
      }
    });
  }

  // Best Practices Section
  if (info.best_practices && info.best_practices.length > 0) {
    formatted += `## ✅ Best Practice Recommendations\n\n`;
    
    const categories = ['high', 'medium', 'low'];
    categories.forEach(priority => {
      const practicesForPriority = info.best_practices.filter((bp: any) => bp.priority === priority);
      
      if (practicesForPriority.length > 0) {
        const priorityIcon = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
        formatted += `### ${priorityIcon} ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority\n\n`;
        
        practicesForPriority.forEach((practice: any, index: number) => {
          formatted += `#### ${practice.title}\n`;
          formatted += `**Category:** ${practice.category.charAt(0).toUpperCase() + practice.category.slice(1)}\n\n`;
          formatted += `${practice.description}\n\n`;
          
          if (practice.implementation && practice.implementation.length > 0) {
            formatted += `**Implementation Steps:**\n`;
            practice.implementation.forEach((step: string) => {
              formatted += `1. ${step}\n`;
            });
            formatted += `\n`;
          }

          if (practice.services && practice.services.length > 0) {
            formatted += `**Applies to:** ${practice.services.map((s: string) => s.toUpperCase()).join(', ')}\n\n`;
          }

          if (practice.references && practice.references.length > 0) {
            formatted += `**References:**\n`;
            practice.references.forEach((ref: string) => {
              formatted += `- [AWS Documentation](${ref})\n`;
            });
            formatted += `\n`;
          }

          if (index < practicesForPriority.length - 1) {
            formatted += `---\n\n`;
          }
        });
      }
    });
  }

  // Related Documentation Section
  if (info.related_documentation && info.related_documentation.length > 0) {
    formatted += `## 📚 Related Documentation\n\n`;
    
    info.related_documentation.forEach((doc: any, index: number) => {
      formatted += `### ${index + 1}. ${doc.title}\n\n`;
      formatted += `**URL:** ${doc.url}\n`;
      
      if (doc.service) {
        formatted += `**Service:** ${doc.service.toUpperCase()}\n`;
      }
      
      if (doc.category) {
        formatted += `**Category:** ${doc.category.replace('-', ' ').toUpperCase()}\n`;
      }
      
      if (doc.context) {
        formatted += `**Description:** ${doc.context}\n`;
      }
      
      formatted += `**Relevance Rank:** ${doc.rank_order}\n\n`;
      
      if (index < info.related_documentation.length - 1) {
        formatted += `---\n\n`;
      }
    });
  }

  if (!info.service_context && 
      info.code_snippets.length === 0 && 
      info.best_practices.length === 0 && 
      info.related_documentation.length === 0) {
    formatted += `No contextual information found for query: "${query}"\n\n`;
    formatted += `Try refining your query with specific AWS service names or operations.`;
  }

  return formatted;
}

/**
 * Input schema for aws_contextual_info tool
 */
export const awsContextualInfoSchema = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: 'Query or topic for contextual AWS information (e.g., "Lambda function deployment", "S3 bucket security")',
      minLength: 1,
      maxLength: 500,
    },
    development_context: {
      type: 'object',
      description: 'Development context for better recommendations',
      properties: {
        services: {
          type: 'array',
          items: { type: 'string' },
          description: 'Current AWS services being used',
          maxItems: 20,
        },
        stage: {
          type: 'string',
          enum: ['development', 'testing', 'staging', 'production'],
          description: 'Current development stage',
        },
        application_type: {
          type: 'string',
          enum: ['web', 'mobile', 'api', 'batch', 'realtime', 'ml'],
          description: 'Type of application being developed',
        },
        performance_requirements: {
          type: 'object',
          properties: {
            latency: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Latency requirements',
            },
            throughput: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Throughput requirements',
            },
            availability: {
              type: 'string',
              enum: ['standard', 'high', 'critical'],
              description: 'Availability requirements',
            },
          },
        },
        security_requirements: {
          type: 'object',
          properties: {
            data_classification: {
              type: 'string',
              enum: ['public', 'internal', 'confidential', 'restricted'],
              description: 'Data classification level',
            },
            compliance_frameworks: {
              type: 'array',
              items: { type: 'string' },
              description: 'Required compliance frameworks (e.g., HIPAA, SOC2, PCI-DSS)',
              maxItems: 10,
            },
          },
        },
      },
    },
    preferred_language: {
      type: 'string',
      enum: ['javascript', 'typescript', 'python', 'java', 'cli', 'curl'],
      description: 'Preferred programming language for code snippets',
      default: 'typescript',
    },
    include_code_snippets: {
      type: 'boolean',
      description: 'Include code snippets in the response',
      default: true,
    },
    include_best_practices: {
      type: 'boolean',
      description: 'Include best practice recommendations in the response',
      default: true,
    },
  },
  required: ['query'],
} as const;

/**
 * Tool description for MCP registration
 */
export const awsContextualInfoDescription =
  'Provides comprehensive contextual AWS information including service details, code snippets, best practices, and related documentation. Use this tool when you need contextual information about AWS services during development. Specify your development context for more targeted recommendations and code examples.';