/**
 * AWS Best Practices MCP Tool
 * 
 * Provides automated best practice recommendations based on development context,
 * AWS services being used, and application requirements.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { AWSWorkflowEnhancer, DevelopmentContext } from '../../components/aws-development-workflow-enhancer';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

/**
 * AWS Best Practices arguments
 */
export interface AWSBestPracticesArgs {
  /** AWS services being used in the project */
  services: string[];
  /** Development context for targeted recommendations */
  development_context?: {
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
  /** Filter recommendations by category */
  categories?: ('security' | 'performance' | 'cost' | 'reliability' | 'operational')[];
  /** Filter recommendations by priority */
  priorities?: ('high' | 'medium' | 'low')[];
  /** Maximum number of recommendations to return */
  max_recommendations?: number;
}

/**
 * MCP Tool: aws_best_practices
 * 
 * Provides automated best practice recommendations based on the AWS services
 * being used and the development context. Returns prioritized recommendations
 * with implementation steps and references.
 * 
 * @param args - AWS best practices arguments
 * @param context - MCP tool execution context
 * @returns Prioritized best practice recommendations
 */
export async function awsBestPractices(
  args: AWSBestPracticesArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    // Validate required arguments
    if (!args || !Array.isArray(args.services) || args.services.length === 0) {
      throw new Error('Validation failed: services is required and must be a non-empty array');
    }

    // Validate service names
    const validServicePattern = /^[a-z0-9-]+$/;
    for (const service of args.services) {
      if (typeof service !== 'string' || !validServicePattern.test(service)) {
        throw new Error(`Validation failed: invalid service name "${service}". Service names must contain only lowercase letters, numbers, and hyphens`);
      }
    }

    // Validate max_recommendations
    if (args.max_recommendations !== undefined && 
        (typeof args.max_recommendations !== 'number' || 
         args.max_recommendations < 1 || 
         args.max_recommendations > 50)) {
      throw new Error('Validation failed: max_recommendations must be a number between 1 and 50');
    }

    MCPLogger.debug('Starting AWS best practices generation', context, {
      services: args.services,
      developmentContext: args.development_context,
      categories: args.categories,
      priorities: args.priorities,
      maxRecommendations: args.max_recommendations,
    });

    // Initialize AWS Workflow Enhancer
    const workflowEnhancer = new AWSWorkflowEnhancer({
      maxBestPractices: args.max_recommendations || 10,
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

    // Build development context
    const developmentContext: DevelopmentContext = {
      services: args.services,
      stage: args.development_context?.stage || 'development',
      applicationType: args.development_context?.application_type || 'web',
      performanceRequirements: args.development_context?.performance_requirements ? {
        latency: args.development_context.performance_requirements.latency || 'medium',
        throughput: args.development_context.performance_requirements.throughput || 'medium',
        availability: args.development_context.performance_requirements.availability || 'standard',
      } : undefined,
      securityRequirements: args.development_context?.security_requirements ? {
        dataClassification: args.development_context.security_requirements.data_classification || 'internal',
        complianceFrameworks: args.development_context.security_requirements.compliance_frameworks || [],
      } : undefined,
    };

    // Get best practice recommendations
    const allRecommendations = await workflowEnhancer.getBestPracticeRecommendations(
      developmentContext,
      context
    );

    // Filter recommendations based on user preferences
    let filteredRecommendations = allRecommendations;

    // Filter by categories if specified
    if (args.categories && args.categories.length > 0) {
      filteredRecommendations = filteredRecommendations.filter(rec => 
        args.categories!.includes(rec.category)
      );
    }

    // Filter by priorities if specified
    if (args.priorities && args.priorities.length > 0) {
      filteredRecommendations = filteredRecommendations.filter(rec => 
        args.priorities!.includes(rec.priority)
      );
    }

    // Limit the number of recommendations
    const maxRecommendations = args.max_recommendations || 10;
    const finalRecommendations = filteredRecommendations.slice(0, maxRecommendations);

    // Calculate statistics
    const stats = {
      total_recommendations: finalRecommendations.length,
      by_category: calculateCategoryStats(finalRecommendations),
      by_priority: calculatePriorityStats(finalRecommendations),
      services_covered: [...new Set(finalRecommendations.flatMap(r => r.services))],
    };

    MCPLogger.info('AWS best practices generated successfully', context, {
      services: args.services,
      totalRecommendations: stats.total_recommendations,
      highPriorityCount: stats.by_priority.high || 0,
      categoriesCount: Object.keys(stats.by_category).length,
      servicesCovered: stats.services_covered.length,
    });

    // Format the response for better readability
    const formattedOutput = formatBestPractices(finalRecommendations, args.services, stats);

    return MCPResponseFormatter.formatSuccess(
      {
        services: args.services,
        development_context: developmentContext,
        recommendations: finalRecommendations,
        statistics: stats,
        formatted_output: formattedOutput,
      },
      'markdown',
      {
        executionTime: Date.now() - context.timestamp,
        quotaUsed: 1, // Best practices generation uses 1 quota unit
        services: args.services,
        recommendationsCount: stats.total_recommendations,
        highPriorityCount: stats.by_priority.high || 0,
      }
    );
  } catch (error) {
    MCPLogger.error('aws_best_practices tool failed', error as Error, context, {
      services: args.services,
      developmentContext: args.development_context,
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in aws_best_practices'),
      context
    );
  }
}

/**
 * Calculate category statistics
 */
function calculateCategoryStats(recommendations: any[]): Record<string, number> {
  const stats: Record<string, number> = {};
  
  recommendations.forEach(rec => {
    stats[rec.category] = (stats[rec.category] || 0) + 1;
  });
  
  return stats;
}

/**
 * Calculate priority statistics
 */
function calculatePriorityStats(recommendations: any[]): Record<string, number> {
  const stats: Record<string, number> = {};
  
  recommendations.forEach(rec => {
    stats[rec.priority] = (stats[rec.priority] || 0) + 1;
  });
  
  return stats;
}

/**
 * Format best practices for better readability
 */
function formatBestPractices(
  recommendations: any[],
  services: string[],
  stats: any
): string {
  let formatted = `# AWS Best Practice Recommendations\n\n`;
  
  formatted += `**Services:** ${services.map(s => s.toUpperCase()).join(', ')}\n`;
  formatted += `**Total Recommendations:** ${stats.total_recommendations}\n`;
  formatted += `**Services Covered:** ${stats.services_covered.map((s: string) => s.toUpperCase()).join(', ')}\n\n`;

  // Statistics overview
  formatted += `## 📊 Overview\n\n`;
  
  formatted += `### By Priority\n`;
  const priorityOrder = ['high', 'medium', 'low'];
  priorityOrder.forEach(priority => {
    const count = stats.by_priority[priority] || 0;
    const icon = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
    formatted += `- ${icon} **${priority.charAt(0).toUpperCase() + priority.slice(1)}:** ${count}\n`;
  });
  formatted += `\n`;

  formatted += `### By Category\n`;
  const categoryIcons: Record<string, string> = {
    security: '🔒',
    performance: '⚡',
    cost: '💰',
    reliability: '🛡️',
    operational: '⚙️',
  };
  
  Object.entries(stats.by_category).forEach(([category, count]) => {
    const icon = categoryIcons[category] || '📋';
    formatted += `- ${icon} **${category.charAt(0).toUpperCase() + category.slice(1)}:** ${count}\n`;
  });
  formatted += `\n`;

  // Recommendations by priority
  const priorityGroups = priorityOrder.map(priority => ({
    priority,
    recommendations: recommendations.filter(r => r.priority === priority),
  })).filter(group => group.recommendations.length > 0);

  priorityGroups.forEach(group => {
    const priorityIcon = group.priority === 'high' ? '🔴' : group.priority === 'medium' ? '🟡' : '🟢';
    formatted += `## ${priorityIcon} ${group.priority.charAt(0).toUpperCase() + group.priority.slice(1)} Priority Recommendations\n\n`;
    
    group.recommendations.forEach((rec: any, index: number) => {
      const categoryIcon = categoryIcons[rec.category] || '📋';
      formatted += `### ${index + 1}. ${categoryIcon} ${rec.title}\n\n`;
      formatted += `**Category:** ${rec.category.charAt(0).toUpperCase() + rec.category.slice(1)}\n`;
      formatted += `**Applies to:** ${rec.services.map((s: string) => s.toUpperCase()).join(', ')}\n\n`;
      formatted += `${rec.description}\n\n`;
      
      if (rec.implementation && rec.implementation.length > 0) {
        formatted += `**Implementation Steps:**\n`;
        rec.implementation.forEach((step: string, stepIndex: number) => {
          formatted += `${stepIndex + 1}. ${step}\n`;
        });
        formatted += `\n`;
      }

      if (rec.references && rec.references.length > 0) {
        formatted += `**References:**\n`;
        rec.references.forEach((ref: string) => {
          formatted += `- [AWS Documentation](${ref})\n`;
        });
        formatted += `\n`;
      }

      if (index < group.recommendations.length - 1) {
        formatted += `---\n\n`;
      }
    });

    formatted += `\n`;
  });

  if (recommendations.length === 0) {
    formatted += `No recommendations found for the specified criteria.\n\n`;
    formatted += `Try adjusting your filters or adding more services to get relevant recommendations.`;
  }

  return formatted;
}

/**
 * Input schema for aws_best_practices tool
 */
export const awsBestPracticesSchema = {
  type: 'object',
  properties: {
    services: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '^[a-z0-9-]+$',
      },
      description: 'AWS services being used in the project (e.g., ["lambda", "s3", "dynamodb"])',
      minItems: 1,
      maxItems: 20,
    },
    development_context: {
      type: 'object',
      description: 'Development context for targeted recommendations',
      properties: {
        stage: {
          type: 'string',
          enum: ['development', 'testing', 'staging', 'production'],
          description: 'Current development stage',
          default: 'development',
        },
        application_type: {
          type: 'string',
          enum: ['web', 'mobile', 'api', 'batch', 'realtime', 'ml'],
          description: 'Type of application being developed',
          default: 'web',
        },
        performance_requirements: {
          type: 'object',
          description: 'Performance requirements for the application',
          properties: {
            latency: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Latency requirements (low = <100ms, medium = <1s, high = >1s)',
            },
            throughput: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Throughput requirements (low = <1k req/s, medium = <10k req/s, high = >10k req/s)',
            },
            availability: {
              type: 'string',
              enum: ['standard', 'high', 'critical'],
              description: 'Availability requirements (standard = 99%, high = 99.9%, critical = 99.99%)',
            },
          },
        },
        security_requirements: {
          type: 'object',
          description: 'Security requirements for the application',
          properties: {
            data_classification: {
              type: 'string',
              enum: ['public', 'internal', 'confidential', 'restricted'],
              description: 'Data classification level',
            },
            compliance_frameworks: {
              type: 'array',
              items: { type: 'string' },
              description: 'Required compliance frameworks (e.g., ["HIPAA", "SOC2", "PCI-DSS"])',
              maxItems: 10,
            },
          },
        },
      },
    },
    categories: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['security', 'performance', 'cost', 'reliability', 'operational'],
      },
      description: 'Filter recommendations by specific categories',
      maxItems: 5,
    },
    priorities: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
      },
      description: 'Filter recommendations by priority levels',
      maxItems: 3,
    },
    max_recommendations: {
      type: 'number',
      description: 'Maximum number of recommendations to return',
      minimum: 1,
      maximum: 50,
      default: 10,
    },
  },
  required: ['services'],
} as const;

/**
 * Tool description for MCP registration
 */
export const awsBestPracticesDescription =
  'Provides automated best practice recommendations based on AWS services being used and development context. Returns prioritized recommendations across security, performance, cost, reliability, and operational categories. Each recommendation includes implementation steps and AWS documentation references. Filter by category, priority, or limit the number of results.';