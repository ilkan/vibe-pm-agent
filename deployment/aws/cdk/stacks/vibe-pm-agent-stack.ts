/**
 * Main CDK Stack for Vibe PM Agent
 * Creates Lambda functions, API Gateway, DynamoDB, and S3 resources
 */

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class VibePMAgentStack extends cdk.Stack {
  public readonly lambdaFunctions: { [key: string]: lambda.Function };
  public readonly apiGateway: apigateway.RestApi;
  public readonly dataTable: dynamodb.Table;
  public readonly dataBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Environment configuration
    const environment = this.node.tryGetContext('environment') || 'production';
    const stage = environment === 'production' ? 'prod' : environment;

    // S3 bucket for data storage
    this.dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `vibe-pm-agent-${stage}-data-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: environment === 'production' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB table for caching
    this.dataTable = new dynamodb.Table(this, 'CacheTable', {
      tableName: `vibe-pm-agent-${stage}-cache`,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      pointInTimeRecovery: environment === 'production',
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: environment === 'production' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // IAM role for Lambda functions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
      inlinePolicies: {
        VibePMAgentPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ],
              resources: [this.dataBucket.arnForObjects('*')],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [
                this.dataTable.tableArn,
                `${this.dataTable.tableArn}/index/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Common Lambda configuration
    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      role: lambdaRole,
      environment: {
        NODE_ENV: 'production',
        LOG_LEVEL: environment === 'production' ? 'info' : 'debug',
        STAGE: stage,
        REGION: this.region,
        DATA_BUCKET: this.dataBucket.bucketName,
        CACHE_TABLE: this.dataTable.tableName,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
    };

    // Lambda functions
    this.lambdaFunctions = {
      mcpServer: new lambda.Function(this, 'McpServerFunction', {
        ...commonLambdaProps,
        functionName: `${stage}-vibe-pm-agent-mcp-server`,
        description: 'Main MCP server for Vibe PM Agent business intelligence tools',
        code: lambda.Code.fromAsset('../../../dist/lambda', {
          exclude: ['**/*', '!mcp-server-handler.js', '!mcp-server-handler.js.map'],
        }),
        handler: 'mcp-server-handler.handler',
      }),

      businessAnalysis: new lambda.Function(this, 'BusinessAnalysisFunction', {
        ...commonLambdaProps,
        functionName: `${stage}-vibe-pm-agent-business-analysis`,
        description: 'Business opportunity analysis and strategic assessment',
        code: lambda.Code.fromAsset('../../../dist/lambda', {
          exclude: ['**/*', '!business-analysis-handler.js', '!business-analysis-handler.js.map'],
        }),
        handler: 'business-analysis-handler.handler',
      }),

      documentGeneration: new lambda.Function(this, 'DocumentGenerationFunction', {
        ...commonLambdaProps,
        functionName: `${stage}-vibe-pm-agent-document-generation`,
        description: 'Executive communications and document generation',
        code: lambda.Code.fromAsset('../../../dist/lambda', {
          exclude: ['**/*', '!document-generation-handler.js', '!document-generation-handler.js.map'],
        }),
        handler: 'document-generation-handler.handler',
      }),

      marketIntelligence: new lambda.Function(this, 'MarketIntelligenceFunction', {
        ...commonLambdaProps,
        functionName: `${stage}-vibe-pm-agent-market-intelligence`,
        description: 'Real-time market analysis and competitive intelligence',
        code: lambda.Code.fromAsset('../../../dist/lambda', {
          exclude: ['**/*', '!market-intelligence-handler.js', '!market-intelligence-handler.js.map'],
        }),
        handler: 'market-intelligence-handler.handler',
      }),

      citationService: new lambda.Function(this, 'CitationServiceFunction', {
        ...commonLambdaProps,
        functionName: `${stage}-vibe-pm-agent-citation-service`,
        description: 'Professional citation management and validation',
        code: lambda.Code.fromAsset('../../../dist/lambda', {
          exclude: ['**/*', '!citation-service-handler.js', '!citation-service-handler.js.map'],
        }),
        handler: 'citation-service-handler.handler',
      }),
    };

    // API Gateway
    this.apiGateway = new apigateway.RestApi(this, 'VibePMAgentApi', {
      restApiName: `vibe-pm-agent-${stage}`,
      description: 'API Gateway for Vibe PM Agent MCP Server',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: stage,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // API Gateway integrations
    const mcpIntegration = new apigateway.LambdaIntegration(this.lambdaFunctions.mcpServer);
    const businessAnalysisIntegration = new apigateway.LambdaIntegration(this.lambdaFunctions.businessAnalysis);
    const documentGenerationIntegration = new apigateway.LambdaIntegration(this.lambdaFunctions.documentGeneration);
    const marketIntelligenceIntegration = new apigateway.LambdaIntegration(this.lambdaFunctions.marketIntelligence);
    const citationServiceIntegration = new apigateway.LambdaIntegration(this.lambdaFunctions.citationService);

    // API routes
    const mcpResource = this.apiGateway.root.addResource('mcp');
    mcpResource.addMethod('POST', mcpIntegration);
    
    const healthResource = mcpResource.addResource('health');
    healthResource.addMethod('GET', mcpIntegration);

    const apiResource = this.apiGateway.root.addResource('api');
    
    const businessResource = apiResource.addResource('business');
    businessResource.addResource('analyze').addMethod('POST', businessAnalysisIntegration);
    
    const documentsResource = apiResource.addResource('documents');
    documentsResource.addResource('generate').addMethod('POST', documentGenerationIntegration);
    
    const marketResource = apiResource.addResource('market');
    marketResource.addResource('analyze').addMethod('POST', marketIntelligenceIntegration);
    
    const citationsResource = apiResource.addResource('citations');
    citationsResource.addResource('validate').addMethod('POST', citationServiceIntegration);

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.apiGateway.url,
      description: 'API Gateway URL',
      exportName: `${stage}-vibe-pm-agent-api-url`,
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: this.dataBucket.bucketName,
      description: 'S3 bucket for data storage',
      exportName: `${stage}-vibe-pm-agent-bucket-name`,
    });

    new cdk.CfnOutput(this, 'CacheTableName', {
      value: this.dataTable.tableName,
      description: 'DynamoDB table for caching',
      exportName: `${stage}-vibe-pm-agent-cache-table-name`,
    });

    new cdk.CfnOutput(this, 'McpServerFunctionName', {
      value: this.lambdaFunctions.mcpServer.functionName,
      description: 'MCP Server Lambda function name',
      exportName: `${stage}-vibe-pm-agent-mcp-server-function-name`,
    });
  }
}