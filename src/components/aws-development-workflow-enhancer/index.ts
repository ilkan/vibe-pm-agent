/**
 * AWS Development Workflow Enhancer
 * 
 * Provides contextual AWS service information, code generation for AWS SDK snippets,
 * and automated best practice recommendations to enhance development workflows.
 */

import { EventEmitter } from 'events';
import { AWSDocsMCPIntegration, DocumentationResult, ServiceDocumentation, APIDocumentation } from '../aws-docs-mcp-integration';
import { MCPLogger } from '../../utils/mcp-error-handling';
import { MCPToolContext } from '../../models/mcp';

/**
 * AWS SDK code snippet configuration
 */
export interface CodeSnippetConfig {
  /** Programming language for the snippet */
  language: 'javascript' | 'typescript' | 'python' | 'java' | 'cli' | 'curl';
  /** AWS SDK version preference */
  sdkVersion?: 'v2' | 'v3';
  /** Include error handling in snippets */
  includeErrorHandling: boolean;
  /** Include imports/dependencies */
  includeImports: boolean;
  /** Use async/await pattern (for supported languages) */
  useAsyncAwait: boolean;
  /** Include comments and documentation */
  includeComments: boolean;
}

/**
 * Generated AWS SDK code snippet
 */
export interface AWSCodeSnippet {
  /** Programming language */
  language: string;
  /** Generated code */
  code: string;
  /** Required dependencies/imports */
  dependencies: string[];
  /** Usage description */
  description: string;
  /** Best practices notes */
  bestPractices: string[];
  /** Common pitfalls to avoid */
  pitfalls: string[];
}

/**
 * AWS service context information
 */
export interface AWSServiceContext {
  /** Service name */
  serviceName: string;
  /** Service description */
  description: string;
  /** Key features */
  keyFeatures: string[];
  /** Common use cases */
  useCases: string[];
  /** Pricing model overview */
  pricingModel: string;
  /** Service limits and quotas */
  limits: ServiceLimit[];
  /** Related services */
  relatedServices: string[];
  /** Getting started guide URL */
  gettingStartedUrl?: string;
  /** Best practices URL */
  bestPracticesUrl?: string;
}

/**
 * AWS service limit information
 */
export interface ServiceLimit {
  /** Limit name */
  name: string;
  /** Default limit value */
  defaultValue: string;
  /** Whether limit is adjustable */
  adjustable: boolean;
  /** Description of the limit */
  description: string;
}

/**
 * Best practice recommendation
 */
export interface BestPracticeRecommendation {
  /** Recommendation category */
  category: 'security' | 'performance' | 'cost' | 'reliability' | 'operational';
  /** Recommendation title */
  title: string;
  /** Detailed description */
  description: string;
  /** Implementation steps */
  implementation: string[];
  /** Priority level */
  priority: 'high' | 'medium' | 'low';
  /** AWS service(s) this applies to */
  services: string[];
  /** Documentation references */
  references: string[];
}

/**
 * Development context for recommendations
 */
export interface DevelopmentContext {
  /** Current AWS services being used */
  services: string[];
  /** Development stage */
  stage: 'development' | 'testing' | 'staging' | 'production';
  /** Application type */
  applicationType: 'web' | 'mobile' | 'api' | 'batch' | 'realtime' | 'ml';
  /** Performance requirements */
  performanceRequirements?: {
    latency: 'low' | 'medium' | 'high';
    throughput: 'low' | 'medium' | 'high';
    availability: 'standard' | 'high' | 'critical';
  };
  /** Security requirements */
  securityRequirements?: {
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    complianceFrameworks: string[];
  };
}

/**
 * AWS Development Workflow Enhancer configuration
 */
export interface AWSWorkflowEnhancerConfig {
  /** Default code snippet language */
  defaultLanguage: 'javascript' | 'typescript' | 'python' | 'java' | 'cli' | 'curl';
  /** Default SDK version */
  defaultSDKVersion: 'v2' | 'v3';
  /** Enable caching of service information */
  enableCaching: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL: number;
  /** Maximum number of best practices to return */
  maxBestPractices: number;
  /** Enable real-time service status checks */
  enableServiceStatus: boolean;
}

/**
 * AWS Development Workflow Enhancer
 * 
 * Enhances development workflows with contextual AWS service information,
 * automated code generation, and intelligent best practice recommendations.
 */
export class AWSWorkflowEnhancer extends EventEmitter {
  private config: AWSWorkflowEnhancerConfig;
  private awsDocsMCP: AWSDocsMCPIntegration;
  private cache: Map<string, { data: any; timestamp: number }>;
  private isInitialized: boolean = false;

  constructor(config: Partial<AWSWorkflowEnhancerConfig> = {}) {
    super();
    
    this.config = {
      defaultLanguage: 'typescript',
      defaultSDKVersion: 'v3',
      enableCaching: true,
      cacheTTL: 1800000, // 30 minutes
      maxBestPractices: 10,
      enableServiceStatus: true,
      ...config,
    };

    this.cache = new Map();
    this.awsDocsMCP = new AWSDocsMCPIntegration();
    this.initialize();
  }

  /**
   * Initialize the workflow enhancer
   */
  private async initialize(): Promise<void> {
    try {
      MCPLogger.info('Initializing AWS Development Workflow Enhancer', undefined, {
        defaultLanguage: this.config.defaultLanguage,
        defaultSDKVersion: this.config.defaultSDKVersion,
        cachingEnabled: this.config.enableCaching,
      });

      // Wait for AWS Docs MCP to initialize
      if (!this.awsDocsMCP.isReady()) {
        await new Promise((resolve, reject) => {
          this.awsDocsMCP.once('initialized', resolve);
          this.awsDocsMCP.once('error', reject);
          setTimeout(() => reject(new Error('AWS Docs MCP initialization timeout')), 10000);
        });
      }
      
      this.isInitialized = true;
      this.emit('initialized');
      
      MCPLogger.info('AWS Development Workflow Enhancer initialized successfully');
    } catch (error) {
      MCPLogger.error('Failed to initialize AWS Development Workflow Enhancer', error as Error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get contextual information about an AWS service
   */
  async getServiceContext(
    serviceName: string,
    context?: MCPToolContext
  ): Promise<AWSServiceContext> {
    if (!this.isInitialized) {
      throw new Error('AWS Workflow Enhancer not initialized');
    }

    const cacheKey = `service-context:${serviceName}`;
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        MCPLogger.debug('Returning cached service context', context, { serviceName });
        return cached;
      }
    }

    try {
      MCPLogger.debug('Fetching AWS service context', context, { serviceName });

      // Get service documentation
      const serviceDoc = await this.awsDocsMCP.getServiceDetails(serviceName, context);
      
      // Get additional context information
      const serviceContext = await this.buildServiceContext(serviceName, serviceDoc);

      // Cache the results
      if (this.config.enableCaching) {
        this.setCachedResult(cacheKey, serviceContext);
      }

      MCPLogger.info('AWS service context retrieved', context, {
        serviceName,
        featuresCount: serviceContext.keyFeatures.length,
        useCasesCount: serviceContext.useCases.length,
        limitsCount: serviceContext.limits.length,
      });

      return serviceContext;
    } catch (error) {
      MCPLogger.error('Failed to get AWS service context', error as Error, context, {
        serviceName,
      });
      throw error;
    }
  }

  /**
   * Generate AWS SDK code snippets for a specific operation
   */
  async generateCodeSnippet(
    serviceName: string,
    operation: string,
    config: Partial<CodeSnippetConfig> = {},
    context?: MCPToolContext
  ): Promise<AWSCodeSnippet> {
    if (!this.isInitialized) {
      throw new Error('AWS Workflow Enhancer not initialized');
    }

    const snippetConfig: CodeSnippetConfig = {
      language: this.config.defaultLanguage,
      sdkVersion: this.config.defaultSDKVersion,
      includeErrorHandling: true,
      includeImports: true,
      useAsyncAwait: true,
      includeComments: true,
      ...config,
    };

    const cacheKey = `code-snippet:${serviceName}:${operation}:${JSON.stringify(snippetConfig)}`;
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        MCPLogger.debug('Returning cached code snippet', context, {
          serviceName,
          operation,
          language: snippetConfig.language,
        });
        return cached;
      }
    }

    try {
      MCPLogger.debug('Generating AWS SDK code snippet', context, {
        serviceName,
        operation,
        language: snippetConfig.language,
        sdkVersion: snippetConfig.sdkVersion,
      });

      // Get API documentation
      const apiDoc = await this.awsDocsMCP.getAPIReference(serviceName, operation, context);
      
      // Generate code snippet
      const codeSnippet = await this.buildCodeSnippet(serviceName, operation, apiDoc, snippetConfig);

      // Cache the results
      if (this.config.enableCaching) {
        this.setCachedResult(cacheKey, codeSnippet);
      }

      MCPLogger.info('AWS SDK code snippet generated', context, {
        serviceName,
        operation,
        language: snippetConfig.language,
        codeLength: codeSnippet.code.length,
        dependenciesCount: codeSnippet.dependencies.length,
      });

      return codeSnippet;
    } catch (error) {
      MCPLogger.error('Failed to generate AWS SDK code snippet', error as Error, context, {
        serviceName,
        operation,
        language: snippetConfig.language,
      });
      throw error;
    }
  }

  /**
   * Get automated best practice recommendations
   */
  async getBestPracticeRecommendations(
    developmentContext: DevelopmentContext,
    context?: MCPToolContext
  ): Promise<BestPracticeRecommendation[]> {
    if (!this.isInitialized) {
      throw new Error('AWS Workflow Enhancer not initialized');
    }

    const cacheKey = `best-practices:${JSON.stringify(developmentContext)}`;
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        MCPLogger.debug('Returning cached best practice recommendations', context, {
          services: developmentContext.services,
          stage: developmentContext.stage,
        });
        return cached;
      }
    }

    try {
      MCPLogger.debug('Generating best practice recommendations', context, {
        services: developmentContext.services,
        stage: developmentContext.stage,
        applicationType: developmentContext.applicationType,
      });

      // Generate recommendations based on context
      const recommendations = await this.buildBestPracticeRecommendations(developmentContext);

      // Sort by priority and limit results
      const sortedRecommendations = recommendations
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .slice(0, this.config.maxBestPractices);

      // Cache the results
      if (this.config.enableCaching) {
        this.setCachedResult(cacheKey, sortedRecommendations);
      }

      MCPLogger.info('Best practice recommendations generated', context, {
        services: developmentContext.services,
        recommendationsCount: sortedRecommendations.length,
        highPriorityCount: sortedRecommendations.filter(r => r.priority === 'high').length,
      });

      return sortedRecommendations;
    } catch (error) {
      MCPLogger.error('Failed to generate best practice recommendations', error as Error, context, {
        services: developmentContext.services,
        stage: developmentContext.stage,
      });
      throw error;
    }
  }

  /**
   * Get contextual development information for current workflow
   */
  async getContextualInfo(
    query: string,
    developmentContext?: Partial<DevelopmentContext>,
    context?: MCPToolContext
  ): Promise<{
    serviceContext?: AWSServiceContext;
    codeSnippets: AWSCodeSnippet[];
    bestPractices: BestPracticeRecommendation[];
    relatedDocumentation: DocumentationResult[];
  }> {
    if (!this.isInitialized) {
      throw new Error('AWS Workflow Enhancer not initialized');
    }

    try {
      MCPLogger.debug('Getting contextual development information', context, {
        query,
        developmentContext,
      });

      // Extract service names from query
      const detectedServices = this.extractServicesFromQuery(query);
      
      // Search for relevant documentation
      const relatedDocs = await this.awsDocsMCP.searchDocumentation(
        query,
        context,
        { limit: 5, services: detectedServices }
      );

      // Get service context for primary service
      let serviceContext: AWSServiceContext | undefined;
      if (detectedServices.length > 0) {
        try {
          serviceContext = await this.getServiceContext(detectedServices[0], context);
        } catch (error) {
          MCPLogger.warn('Could not get service context', context, {
            service: detectedServices[0],
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Generate code snippets for detected operations
      const codeSnippets: AWSCodeSnippet[] = [];
      const detectedOperations = this.extractOperationsFromQuery(query);
      
      for (const service of detectedServices.slice(0, 2)) { // Limit to 2 services
        for (const operation of detectedOperations.slice(0, 2)) { // Limit to 2 operations
          try {
            const snippet = await this.generateCodeSnippet(service, operation, {}, context);
            codeSnippets.push(snippet);
          } catch (error) {
            MCPLogger.warn('Could not generate code snippet', context, {
              service,
              operation,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      // Get best practice recommendations
      let bestPractices: BestPracticeRecommendation[] = [];
      if (developmentContext && detectedServices.length > 0) {
        const fullContext: DevelopmentContext = {
          services: detectedServices,
          stage: 'development',
          applicationType: 'web',
          ...developmentContext,
        };
        
        try {
          bestPractices = await this.getBestPracticeRecommendations(fullContext, context);
        } catch (error) {
          MCPLogger.warn('Could not get best practice recommendations', context, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      MCPLogger.info('Contextual development information retrieved', context, {
        query,
        servicesDetected: detectedServices.length,
        codeSnippetsGenerated: codeSnippets.length,
        bestPracticesCount: bestPractices.length,
        relatedDocsCount: relatedDocs.length,
      });

      return {
        serviceContext,
        codeSnippets,
        bestPractices,
        relatedDocumentation: relatedDocs,
      };
    } catch (error) {
      MCPLogger.error('Failed to get contextual development information', error as Error, context, {
        query,
      });
      throw error;
    }
  }

  /**
   * Check if the enhancer is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    MCPLogger.info('AWS Workflow Enhancer cache cleared');
  }

  // Private helper methods

  /**
   * Build service context from documentation
   */
  private async buildServiceContext(
    serviceName: string,
    serviceDoc: ServiceDocumentation
  ): Promise<AWSServiceContext> {
    // This would be enhanced with real AWS service information
    const serviceContext: AWSServiceContext = {
      serviceName,
      description: serviceDoc.description,
      keyFeatures: serviceDoc.features,
      useCases: serviceDoc.useCases,
      pricingModel: this.getPricingModel(serviceName),
      limits: this.getServiceLimits(serviceName),
      relatedServices: serviceDoc.relatedServices,
      gettingStartedUrl: serviceDoc.gettingStartedUrl,
      bestPracticesUrl: serviceDoc.bestPracticesUrl,
    };

    return serviceContext;
  }

  /**
   * Build code snippet from API documentation
   */
  private async buildCodeSnippet(
    serviceName: string,
    operation: string,
    apiDoc: APIDocumentation,
    config: CodeSnippetConfig
  ): Promise<AWSCodeSnippet> {
    const snippet: AWSCodeSnippet = {
      language: config.language,
      code: this.generateCode(serviceName, operation, apiDoc, config),
      dependencies: this.getDependencies(serviceName, config),
      description: `${operation} operation for ${serviceName}`,
      bestPractices: this.getCodeBestPractices(serviceName, operation),
      pitfalls: this.getCommonPitfalls(serviceName, operation),
    };

    return snippet;
  }

  /**
   * Build best practice recommendations
   */
  private async buildBestPracticeRecommendations(
    developmentContext: DevelopmentContext
  ): Promise<BestPracticeRecommendation[]> {
    const recommendations: BestPracticeRecommendation[] = [];

    // Add security recommendations
    recommendations.push(...this.getSecurityRecommendations(developmentContext));
    
    // Add performance recommendations
    recommendations.push(...this.getPerformanceRecommendations(developmentContext));
    
    // Add cost optimization recommendations
    recommendations.push(...this.getCostRecommendations(developmentContext));
    
    // Add reliability recommendations
    recommendations.push(...this.getReliabilityRecommendations(developmentContext));
    
    // Add operational recommendations
    recommendations.push(...this.getOperationalRecommendations(developmentContext));

    return recommendations;
  }

  /**
   * Extract AWS service names from query text
   */
  private extractServicesFromQuery(query: string): string[] {
    const serviceKeywords = [
      'lambda', 's3', 'ec2', 'rds', 'dynamodb', 'sqs', 'sns', 'cloudwatch',
      'iam', 'vpc', 'elb', 'cloudfront', 'route53', 'api-gateway', 'cognito',
      'kinesis', 'redshift', 'elasticsearch', 'elasticache', 'ecs', 'eks',
      'fargate', 'batch', 'step-functions', 'eventbridge', 'secrets-manager',
    ];

    const lowerQuery = query.toLowerCase();
    return serviceKeywords.filter(service => 
      lowerQuery.includes(service) || lowerQuery.includes(service.replace('-', ''))
    );
  }

  /**
   * Extract operation names from query text
   */
  private extractOperationsFromQuery(query: string): string[] {
    const operationKeywords = [
      'create', 'delete', 'update', 'get', 'list', 'put', 'post', 'invoke',
      'send', 'receive', 'publish', 'subscribe', 'upload', 'download',
      'describe', 'modify', 'start', 'stop', 'restart', 'scale',
    ];

    const lowerQuery = query.toLowerCase();
    return operationKeywords.filter(operation => lowerQuery.includes(operation));
  }

  /**
   * Get pricing model for service
   */
  private getPricingModel(serviceName: string): string {
    const pricingModels: Record<string, string> = {
      lambda: 'Pay per request and compute time',
      s3: 'Pay for storage used, requests, and data transfer',
      ec2: 'Pay for compute capacity by hour or second',
      rds: 'Pay for database instance hours and storage',
      dynamodb: 'Pay for read/write capacity and storage',
    };

    return pricingModels[serviceName] || 'Varies by usage - see AWS pricing page';
  }

  /**
   * Get service limits
   */
  private getServiceLimits(serviceName: string): ServiceLimit[] {
    const limits: Record<string, ServiceLimit[]> = {
      lambda: [
        {
          name: 'Concurrent executions',
          defaultValue: '1,000',
          adjustable: true,
          description: 'Maximum number of concurrent function executions',
        },
        {
          name: 'Function timeout',
          defaultValue: '15 minutes',
          adjustable: false,
          description: 'Maximum execution time for a single invocation',
        },
      ],
      s3: [
        {
          name: 'Bucket limit',
          defaultValue: '100',
          adjustable: true,
          description: 'Maximum number of buckets per account',
        },
      ],
    };

    return limits[serviceName] || [];
  }

  /**
   * Generate code based on language and configuration
   */
  private generateCode(
    serviceName: string,
    operation: string,
    apiDoc: APIDocumentation,
    config: CodeSnippetConfig
  ): string {
    switch (config.language) {
      case 'typescript':
        return this.generateTypeScriptCode(serviceName, operation, apiDoc, config);
      case 'javascript':
        return this.generateJavaScriptCode(serviceName, operation, apiDoc, config);
      case 'python':
        return this.generatePythonCode(serviceName, operation, apiDoc, config);
      case 'java':
        return this.generateJavaCode(serviceName, operation, apiDoc, config);
      case 'cli':
        return this.generateCLICode(serviceName, operation, apiDoc, config);
      case 'curl':
        return this.generateCurlCode(serviceName, operation, apiDoc, config);
      default:
        return this.generateTypeScriptCode(serviceName, operation, apiDoc, config);
    }
  }

  /**
   * Generate TypeScript code snippet
   */
  private generateTypeScriptCode(
    serviceName: string,
    operation: string,
    apiDoc: APIDocumentation,
    config: CodeSnippetConfig
  ): string {
    const clientName = this.getClientName(serviceName);
    const commandName = this.getCommandName(operation);
    
    let code = '';
    
    if (config.includeImports) {
      if (config.sdkVersion === 'v3') {
        code += `import { ${clientName}, ${commandName} } from '@aws-sdk/client-${serviceName}';\n\n`;
      } else {
        code += `import AWS from 'aws-sdk';\n\n`;
      }
    }

    if (config.includeComments) {
      code += `/**\n * ${apiDoc.description}\n */\n`;
    }

    if (config.sdkVersion === 'v3') {
      code += `const client = new ${clientName}({ region: 'us-east-1' });\n\n`;
      
      if (config.useAsyncAwait) {
        code += `async function ${operation}Example() {\n`;
        if (config.includeErrorHandling) {
          code += `  try {\n`;
          code += `    const command = new ${commandName}({\n`;
          code += this.generateParameters(apiDoc.parameters, '      ');
          code += `    });\n`;
          code += `    const response = await client.send(command);\n`;
          code += `    console.log('Success:', response);\n`;
          code += `    return response;\n`;
          code += `  } catch (error) {\n`;
          code += `    console.error('Error:', error);\n`;
          code += `    throw error;\n`;
          code += `  }\n`;
        } else {
          code += `  const command = new ${commandName}({\n`;
          code += this.generateParameters(apiDoc.parameters, '    ');
          code += `  });\n`;
          code += `  const response = await client.send(command);\n`;
          code += `  return response;\n`;
        }
        code += `}\n`;
      }
    } else {
      code += `const ${serviceName} = new AWS.${serviceName.toUpperCase()}({ region: 'us-east-1' });\n\n`;
      code += `const params = {\n`;
      code += this.generateParameters(apiDoc.parameters, '  ');
      code += `};\n\n`;
      
      if (config.useAsyncAwait) {
        code += `const response = await ${serviceName}.${operation}(params).promise();\n`;
      } else {
        code += `${serviceName}.${operation}(params, (err, data) => {\n`;
        code += `  if (err) console.error(err);\n`;
        code += `  else console.log(data);\n`;
        code += `});\n`;
      }
    }

    return code;
  }

  /**
   * Generate JavaScript code snippet
   */
  private generateJavaScriptCode(
    serviceName: string,
    operation: string,
    apiDoc: APIDocumentation,
    config: CodeSnippetConfig
  ): string {
    // Similar to TypeScript but without type annotations
    return this.generateTypeScriptCode(serviceName, operation, apiDoc, config)
      .replace(/: \w+/g, '') // Remove type annotations
      .replace(/interface \w+ {[^}]*}/g, ''); // Remove interfaces
  }

  /**
   * Generate Python code snippet
   */
  private generatePythonCode(
    serviceName: string,
    operation: string,
    apiDoc: APIDocumentation,
    config: CodeSnippetConfig
  ): string {
    let code = '';
    
    if (config.includeImports) {
      code += `import boto3\n`;
      if (config.includeErrorHandling) {
        code += `from botocore.exceptions import ClientError\n`;
      }
      code += `\n`;
    }

    if (config.includeComments) {
      code += `# ${apiDoc.description}\n`;
    }

    code += `client = boto3.client('${serviceName}', region_name='us-east-1')\n\n`;

    if (config.includeErrorHandling) {
      code += `try:\n`;
      code += `    response = client.${operation}(\n`;
      code += this.generatePythonParameters(apiDoc.parameters, '        ');
      code += `    )\n`;
      code += `    print('Success:', response)\n`;
      code += `except ClientError as e:\n`;
      code += `    print('Error:', e)\n`;
      code += `    raise\n`;
    } else {
      code += `response = client.${operation}(\n`;
      code += this.generatePythonParameters(apiDoc.parameters, '    ');
      code += `)\n`;
    }

    return code;
  }

  /**
   * Generate Java code snippet
   */
  private generateJavaCode(
    serviceName: string,
    operation: string,
    apiDoc: APIDocumentation,
    config: CodeSnippetConfig
  ): string {
    const className = this.getJavaClassName(serviceName);
    const requestClass = this.getJavaRequestClass(operation);
    
    let code = '';
    
    if (config.includeImports) {
      code += `import software.amazon.awssdk.services.${serviceName}.${className};\n`;
      code += `import software.amazon.awssdk.services.${serviceName}.model.${requestClass};\n`;
      code += `import software.amazon.awssdk.regions.Region;\n\n`;
    }

    if (config.includeComments) {
      code += `/**\n * ${apiDoc.description}\n */\n`;
    }

    code += `${className} client = ${className}.builder()\n`;
    code += `    .region(Region.US_EAST_1)\n`;
    code += `    .build();\n\n`;

    code += `${requestClass} request = ${requestClass}.builder()\n`;
    code += this.generateJavaParameters(apiDoc.parameters, '    ');
    code += `    .build();\n\n`;

    if (config.includeErrorHandling) {
      code += `try {\n`;
      code += `    var response = client.${operation}(request);\n`;
      code += `    System.out.println("Success: " + response);\n`;
      code += `} catch (Exception e) {\n`;
      code += `    System.err.println("Error: " + e.getMessage());\n`;
      code += `    throw e;\n`;
      code += `}\n`;
    } else {
      code += `var response = client.${operation}(request);\n`;
    }

    return code;
  }

  /**
   * Generate CLI code snippet
   */
  private generateCLICode(
    serviceName: string,
    operation: string,
    apiDoc: APIDocumentation,
    config: CodeSnippetConfig
  ): string {
    let code = '';
    
    if (config.includeComments) {
      code += `# ${apiDoc.description}\n`;
    }

    code += `aws ${serviceName} ${this.kebabCase(operation)}`;
    
    // Add parameters
    for (const param of apiDoc.parameters) {
      if (param.required) {
        code += ` --${this.kebabCase(param.name)} "${param.example || 'value'}"`;
      }
    }
    
    code += ` --region us-east-1`;
    
    if (config.includeComments) {
      code += `\n\n# Optional parameters:\n`;
      for (const param of apiDoc.parameters) {
        if (!param.required) {
          code += `# --${this.kebabCase(param.name)} "${param.example || 'value'}"\n`;
        }
      }
    }

    return code;
  }

  /**
   * Generate cURL code snippet
   */
  private generateCurlCode(
    serviceName: string,
    operation: string,
    apiDoc: APIDocumentation,
    config: CodeSnippetConfig
  ): string {
    let code = '';
    
    if (config.includeComments) {
      code += `# ${apiDoc.description}\n`;
    }

    code += `curl -X ${apiDoc.httpMethod} \\\n`;
    code += `  "${apiDoc.endpoint}" \\\n`;
    code += `  -H "Authorization: AWS4-HMAC-SHA256 Credential=..." \\\n`;
    code += `  -H "Content-Type: application/x-amz-json-1.1" \\\n`;
    code += `  -H "X-Amz-Target: ${serviceName}.${operation}" \\\n`;
    code += `  -d '{\n`;
    
    // Add JSON parameters
    const jsonParams = apiDoc.parameters.map(param => 
      `    "${param.name}": "${param.example || 'value'}"`
    ).join(',\n');
    
    code += jsonParams;
    code += `\n  }'`;

    return code;
  }

  /**
   * Get dependencies for the specified language and service
   */
  private getDependencies(serviceName: string, config: CodeSnippetConfig): string[] {
    switch (config.language) {
      case 'typescript':
      case 'javascript':
        return config.sdkVersion === 'v3' 
          ? [`@aws-sdk/client-${serviceName}`]
          : ['aws-sdk'];
      case 'python':
        return ['boto3'];
      case 'java':
        return [`software.amazon.awssdk:${serviceName}`];
      default:
        return [];
    }
  }

  /**
   * Get code best practices for service and operation
   */
  private getCodeBestPractices(serviceName: string, operation: string): string[] {
    const general = [
      'Always handle errors appropriately',
      'Use environment variables for configuration',
      'Implement proper logging and monitoring',
      'Follow the principle of least privilege for IAM permissions',
    ];

    const serviceSpecific: Record<string, string[]> = {
      lambda: [
        'Keep functions small and focused',
        'Use environment variables for configuration',
        'Implement proper error handling and retries',
        'Monitor function performance and costs',
      ],
      s3: [
        'Use appropriate storage classes for cost optimization',
        'Enable versioning for important data',
        'Implement proper access controls and bucket policies',
        'Use multipart upload for large files',
      ],
    };

    return [...general, ...(serviceSpecific[serviceName] || [])];
  }

  /**
   * Get common pitfalls for service and operation
   */
  private getCommonPitfalls(serviceName: string, operation: string): string[] {
    const general = [
      'Not handling rate limiting and throttling',
      'Hardcoding credentials in code',
      'Not implementing proper error handling',
      'Ignoring cost implications of API calls',
    ];

    const serviceSpecific: Record<string, string[]> = {
      lambda: [
        'Not optimizing cold start times',
        'Creating too many concurrent executions',
        'Not monitoring function costs',
        'Using synchronous calls when asynchronous would be better',
      ],
      s3: [
        'Not considering eventual consistency',
        'Creating hotspots with sequential key names',
        'Not using appropriate storage classes',
        'Ignoring data transfer costs',
      ],
    };

    return [...general, ...(serviceSpecific[serviceName] || [])];
  }

  /**
   * Get security recommendations
   */
  private getSecurityRecommendations(context: DevelopmentContext): BestPracticeRecommendation[] {
    const recommendations: BestPracticeRecommendation[] = [
      {
        category: 'security',
        title: 'Implement Least Privilege Access',
        description: 'Grant only the minimum permissions required for your application to function',
        implementation: [
          'Create specific IAM roles for each service',
          'Use resource-based policies where appropriate',
          'Regularly audit and review permissions',
          'Use AWS Access Analyzer to identify unused permissions',
        ],
        priority: 'high',
        services: context.services,
        references: [
          'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html',
        ],
      },
      {
        category: 'security',
        title: 'Enable Encryption at Rest and in Transit',
        description: 'Protect sensitive data by enabling encryption for all storage and communication',
        implementation: [
          'Enable encryption for S3 buckets',
          'Use encrypted EBS volumes',
          'Enable RDS encryption',
          'Use HTTPS/TLS for all API communications',
        ],
        priority: 'high',
        services: context.services,
        references: [
          'https://docs.aws.amazon.com/security/latest/userguide/encryption.html',
        ],
      },
    ];

    return recommendations;
  }

  /**
   * Get performance recommendations
   */
  private getPerformanceRecommendations(context: DevelopmentContext): BestPracticeRecommendation[] {
    const recommendations: BestPracticeRecommendation[] = [
      {
        category: 'performance',
        title: 'Implement Caching Strategies',
        description: 'Use caching to reduce latency and improve application performance',
        implementation: [
          'Use ElastiCache for frequently accessed data',
          'Implement CloudFront for content delivery',
          'Use DynamoDB DAX for microsecond latency',
          'Cache API responses where appropriate',
        ],
        priority: 'medium',
        services: context.services,
        references: [
          'https://docs.aws.amazon.com/elasticache/latest/userguide/BestPractices.html',
        ],
      },
    ];

    return recommendations;
  }

  /**
   * Get cost optimization recommendations
   */
  private getCostRecommendations(context: DevelopmentContext): BestPracticeRecommendation[] {
    const recommendations: BestPracticeRecommendation[] = [
      {
        category: 'cost',
        title: 'Right-size Your Resources',
        description: 'Optimize resource allocation to match actual usage patterns',
        implementation: [
          'Use AWS Cost Explorer to analyze usage patterns',
          'Implement auto-scaling for variable workloads',
          'Use Spot Instances for fault-tolerant workloads',
          'Regularly review and adjust resource sizes',
        ],
        priority: 'medium',
        services: context.services,
        references: [
          'https://docs.aws.amazon.com/cost-management/latest/userguide/ce-rightsizing.html',
        ],
      },
    ];

    return recommendations;
  }

  /**
   * Get reliability recommendations
   */
  private getReliabilityRecommendations(context: DevelopmentContext): BestPracticeRecommendation[] {
    const recommendations: BestPracticeRecommendation[] = [
      {
        category: 'reliability',
        title: 'Implement Multi-AZ Deployments',
        description: 'Deploy across multiple Availability Zones for high availability',
        implementation: [
          'Use multiple AZs for critical components',
          'Implement health checks and auto-recovery',
          'Use load balancers to distribute traffic',
          'Design for graceful degradation',
        ],
        priority: 'high',
        services: context.services,
        references: [
          'https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html',
        ],
      },
    ];

    return recommendations;
  }

  /**
   * Get operational recommendations
   */
  private getOperationalRecommendations(context: DevelopmentContext): BestPracticeRecommendation[] {
    const recommendations: BestPracticeRecommendation[] = [
      {
        category: 'operational',
        title: 'Implement Comprehensive Monitoring',
        description: 'Set up monitoring and alerting for all critical components',
        implementation: [
          'Use CloudWatch for metrics and logs',
          'Set up custom dashboards',
          'Configure alerts for critical thresholds',
          'Implement distributed tracing with X-Ray',
        ],
        priority: 'high',
        services: context.services,
        references: [
          'https://docs.aws.amazon.com/cloudwatch/latest/monitoring/cloudwatch_architecture.html',
        ],
      },
    ];

    return recommendations;
  }

  // Utility methods

  private getClientName(serviceName: string): string {
    return `${serviceName.charAt(0).toUpperCase()}${serviceName.slice(1)}Client`;
  }

  private getCommandName(operation: string): string {
    return `${operation.charAt(0).toUpperCase()}${operation.slice(1)}Command`;
  }

  private getJavaClassName(serviceName: string): string {
    return `${serviceName.charAt(0).toUpperCase()}${serviceName.slice(1)}Client`;
  }

  private getJavaRequestClass(operation: string): string {
    return `${operation.charAt(0).toUpperCase()}${operation.slice(1)}Request`;
  }

  private kebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  private generateParameters(parameters: any[], indent: string): string {
    return parameters
      .filter(p => p.required)
      .map(p => `${indent}${p.name}: '${p.example || 'value'}',`)
      .join('\n') + '\n';
  }

  private generatePythonParameters(parameters: any[], indent: string): string {
    return parameters
      .filter(p => p.required)
      .map(p => `${indent}${p.name}='${p.example || 'value'}',`)
      .join('\n') + '\n';
  }

  private generateJavaParameters(parameters: any[], indent: string): string {
    return parameters
      .filter(p => p.required)
      .map(p => `${indent}.${p.name}("${p.example || 'value'}")`)
      .join('\n') + '\n';
  }

  private getCachedResult(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.config.cacheTTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCachedResult(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

/**
 * Default AWS Workflow Enhancer instance
 */
export const defaultAWSWorkflowEnhancer = new AWSWorkflowEnhancer();

/**
 * Factory function to create AWS Workflow Enhancer with custom config
 */
export function createAWSWorkflowEnhancer(config?: Partial<AWSWorkflowEnhancerConfig>): AWSWorkflowEnhancer {
  return new AWSWorkflowEnhancer(config);
}