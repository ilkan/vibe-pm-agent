// Main Lambda Router for Vibe PM Agent
// Routes requests to appropriate tool handlers across all categories
// Supports dual access patterns: external (API Gateway) and internal (direct invocation)

import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import {
  LambdaResponse,
  ToolNotFoundError
} from './shared/types';
import {
  validateLambdaRequest,
  formatSuccessResponse,
  formatErrorResponse,
  formatApiGatewayResponse,
  executeTool,
  loadEnvironmentConfig,
  Logger,
  PerformanceTimer,
  convertToOpenAIFormat
} from './shared/utils';

// Import all tool handlers
import * as businessAnalysisHandlers from './business-analysis';
import * as communicationsHandlers from './communications';
import * as requirementsHandlers from './requirements';
import * as marketIntelligenceHandlers from './market-intelligence';
import * as interviewPrepHandlers from './interview-prep';
import * as caseStudiesHandlers from './case-studies';

// Import authentication service
import { AuthService } from './auth/auth-service';

// Invocation context types
export enum InvocationContext {
  EXTERNAL_API_GATEWAY = 'external',
  INTERNAL_DIRECT = 'internal',
  INTERNAL_BEDROCK = 'bedrock'
}

// Direct invocation event type (for internal AWS requests)
export interface DirectInvocationEvent {
  toolName: string;
  toolArgs: Record<string, any>;
  source?: string;
  requestId?: string;
}

export const handler = async (
  event: APIGatewayEvent | DirectInvocationEvent,
  context: Context
): Promise<APIGatewayProxyResult | LambdaResponse> => {
  const config = loadEnvironmentConfig();
  const logger = new Logger(config);
  const timer = new PerformanceTimer();

  try {
    // Detect invocation context
    const invocationContext = detectInvocationContext(event);
    
    logger.info('Vibe PM Agent Lambda Router invoked', {
      requestId: context.awsRequestId,
      functionName: context.functionName,
      invocationContext,
      externalAccessEnabled: config.externalAccessEnabled,
      ...(invocationContext === InvocationContext.EXTERNAL_API_GATEWAY && {
        path: (event as APIGatewayEvent).path,
        httpMethod: (event as APIGatewayEvent).httpMethod
      })
    });

    // Route based on invocation context
    if (invocationContext === InvocationContext.EXTERNAL_API_GATEWAY) {
      return await handleExternalRequest(event as APIGatewayEvent, context, config, logger, timer);
    } else {
      return await handleInternalRequest(event as DirectInvocationEvent, context, config, logger, timer);
    }





  } catch (error) {
    const executionTime = timer.measure();
    logger.error('Vibe PM Agent Lambda Router error', error as Error, {
      requestId: context.awsRequestId,
      executionTime
    });

    // Detect invocation context for proper error response format
    const invocationContext = detectInvocationContext(event);
    
    if (invocationContext === InvocationContext.EXTERNAL_API_GATEWAY) {
      const response = formatErrorResponse(error as Error, context.awsRequestId);
      const statusCode = (error as any)?.statusCode || 500;
      return formatApiGatewayResponse(statusCode, response);
    } else {
      // For internal requests, return Lambda response format
      return formatErrorResponse(error as Error, context.awsRequestId);
    }
  }
};

/**
 * Detect invocation context based on event structure
 */
function detectInvocationContext(event: any): InvocationContext {
  // Check for API Gateway event structure
  if (event.requestContext && event.headers && event.httpMethod && event.path) {
    return InvocationContext.EXTERNAL_API_GATEWAY;
  }
  
  // Check for Bedrock agent source
  if (event.source === 'bedrock-agent' || event.source === 'aws.bedrock') {
    return InvocationContext.INTERNAL_BEDROCK;
  }
  
  // Direct Lambda invocation (default for internal requests)
  return InvocationContext.INTERNAL_DIRECT;
}

/**
 * Handle external requests from API Gateway
 */
async function handleExternalRequest(
  event: APIGatewayEvent,
  context: Context,
  config: any,
  logger: Logger,
  timer: PerformanceTimer
): Promise<APIGatewayProxyResult> {
  // Handle health check (no authentication required, works even when external access disabled)
  if (event.path === '/health' && event.httpMethod === 'GET') {
    return formatApiGatewayResponse(200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: config.environment,
      tools: 32,
      accessMode: 'external'
    });
  }

  // Handle OPTIONS requests for CORS (no authentication required)
  if (event.httpMethod === 'OPTIONS') {
    return formatApiGatewayResponse(200, {}, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    });
  }

  // Check if external access is enabled (after health check and OPTIONS)
  if (!config.externalAccessEnabled) {
    logger.warn('External access attempt when disabled', {
      requestId: context.awsRequestId,
      path: event.path,
      httpMethod: event.httpMethod
    });
    
    return formatApiGatewayResponse(403, {
      success: false,
      error: 'External access is not enabled'
    });
  }

  // Authenticate external requests
  const authService = new AuthService();
  const requestContext = {
    requestId: context.awsRequestId,
    endpoint: `${event.httpMethod} ${event.path}`
  } as any;

  // Add optional fields only if they exist
  const userAgent = event.headers?.['User-Agent'] || event.headers?.['user-agent'];
  if (userAgent) requestContext.userAgent = userAgent;
  
  const ipAddress = event.requestContext?.identity?.sourceIp;
  if (ipAddress) requestContext.ipAddress = ipAddress;

  const authResult = await authService.authenticateRequest(
    event.headers || {},
    requestContext
  );

  if (!authResult.isAuthenticated) {
    logger.warn('Authentication failed for external request', {
      requestId: context.awsRequestId,
      path: event.path,
      httpMethod: event.httpMethod,
      error: authResult.error,
      ipAddress: event.requestContext?.identity?.sourceIp
    });

    return authService.createAuthErrorResponse(authResult, 401);
  }

  logger.info('External request authenticated successfully', {
    requestId: context.awsRequestId,
    clientId: authResult.clientId,
    clientName: authResult.clientName,
    path: event.path,
    httpMethod: event.httpMethod
  });

  // Parse and validate request
  let requestBody: any;
  try {
    requestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (error) {
    return formatApiGatewayResponse(400, {
      success: false,
      error: 'Invalid JSON in request body'
    });
  }

  const request = validateLambdaRequest(requestBody);

  // Route to appropriate tool handler
  const result = await routeToTool(request.toolName, request.toolArgs, logger);

  const executionTime = timer.measure();
  logger.info('External request completed', {
    requestId: context.awsRequestId,
    toolName: request.toolName,
    executionTime,
    success: result.success,
    accessPattern: 'external',
    clientId: authResult.clientId,
    clientName: authResult.clientName,
    path: event.path,
    httpMethod: event.httpMethod,
    ipAddress: event.requestContext?.identity?.sourceIp,
    userAgent: event.headers?.['User-Agent'] || event.headers?.['user-agent']
  });

  const response = formatSuccessResponse(
    result,
    context.awsRequestId,
    request.toolName,
    executionTime
  );

  // Log access metrics for monitoring
  const metricsData = {
    requestId: context.awsRequestId,
    toolName: request.toolName,
    executionTime,
    success: result.success,
    httpMethod: event.httpMethod,
    path: event.path
  } as any;

  if (authResult.clientId) {
    metricsData.clientId = authResult.clientId;
  }

  logAccessMetrics('external', metricsData);

  // Convert to OpenAI-compatible format for external clients
  const openAIResponse = convertToOpenAIFormat(
    response,
    request.toolName,
    request.toolArgs
  );

  return formatApiGatewayResponse(200, openAIResponse);
}

/**
 * Handle internal requests (direct Lambda invocation)
 */
async function handleInternalRequest(
  event: DirectInvocationEvent,
  context: Context,
  config: any,
  logger: Logger,
  timer: PerformanceTimer
): Promise<LambdaResponse> {
  // Validate direct invocation request
  if (!event.toolName || !event.toolArgs) {
    throw new Error('Direct invocation requires toolName and toolArgs');
  }

  logger.info('Internal request processing', {
    requestId: context.awsRequestId,
    toolName: event.toolName,
    source: event.source || 'direct-invocation',
    accessPattern: 'internal',
    invocationArn: context.invokedFunctionArn,
    functionName: context.functionName
  });

  // Route to appropriate tool handler
  const result = await routeToTool(event.toolName, event.toolArgs, logger);

  const executionTime = timer.measure();
  logger.info('Internal request completed', {
    requestId: context.awsRequestId,
    toolName: event.toolName,
    executionTime,
    success: result.success,
    accessPattern: 'internal',
    source: event.source || 'direct-invocation',
    invocationArn: context.invokedFunctionArn,
    functionName: context.functionName
  });

  // Log access metrics for monitoring
  logAccessMetrics('internal', {
    requestId: context.awsRequestId,
    toolName: event.toolName,
    executionTime,
    success: result.success,
    source: event.source || 'direct-invocation'
  });

  return formatSuccessResponse(
    result,
    context.awsRequestId,
    event.toolName,
    executionTime
  );
}

/**
 * Log access metrics for CloudWatch monitoring
 */
function logAccessMetrics(accessPattern: 'external' | 'internal', metrics: {
  requestId: string;
  toolName: string;
  executionTime: number;
  success: boolean;
  clientId?: string;
  source?: string;
  httpMethod?: string;
  path?: string;
}): void {
  // Log request count metric
  console.log(JSON.stringify({
    MetricName: 'RequestCount',
    Value: 1,
    Unit: 'Count',
    Dimensions: [
      { Name: 'AccessPattern', Value: accessPattern },
      { Name: 'ToolName', Value: metrics.toolName },
      { Name: 'Success', Value: metrics.success.toString() }
    ],
    Timestamp: new Date().toISOString()
  }));

  // Log execution time metric
  console.log(JSON.stringify({
    MetricName: 'ExecutionTime',
    Value: metrics.executionTime,
    Unit: 'Milliseconds',
    Dimensions: [
      { Name: 'AccessPattern', Value: accessPattern },
      { Name: 'ToolName', Value: metrics.toolName }
    ],
    Timestamp: new Date().toISOString()
  }));

  // Log access pattern specific metrics
  if (accessPattern === 'external' && metrics.clientId) {
    console.log(JSON.stringify({
      MetricName: 'ExternalClientRequest',
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        { Name: 'ClientId', Value: metrics.clientId },
        { Name: 'ToolName', Value: metrics.toolName },
        { Name: 'HttpMethod', Value: metrics.httpMethod || 'unknown' }
      ],
      Timestamp: new Date().toISOString()
    }));
  } else if (accessPattern === 'internal') {
    console.log(JSON.stringify({
      MetricName: 'InternalRequest',
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        { Name: 'Source', Value: metrics.source || 'direct-invocation' },
        { Name: 'ToolName', Value: metrics.toolName }
      ],
      Timestamp: new Date().toISOString()
    }));
  }
}

// Tool routing and execution
async function routeToTool(toolName: string, toolArgs: Record<string, any>, logger: Logger): Promise<any> {
  // Create a comprehensive tool registry
  const toolRegistry = {
    // Business Analysis Tools (8 tools)
    'analyze_business_opportunity': businessAnalysisHandlers.analyzeBusinessOpportunity,
    'generate_business_case': businessAnalysisHandlers.generateBusinessCase,
    'assess_strategic_alignment': businessAnalysisHandlers.assessStrategicAlignment,
    'optimize_resource_allocation': businessAnalysisHandlers.optimizeResourceAllocation,
    'validate_market_timing': businessAnalysisHandlers.validateMarketTiming,
    'validate_idea_quick': businessAnalysisHandlers.validateIdeaQuick,
    'analyze_competitor_landscape': businessAnalysisHandlers.analyzeCompetitorLandscape,
    'calculate_market_sizing': businessAnalysisHandlers.calculateMarketSizing,

    // Communications Tools (4 tools)
    'create_stakeholder_communication': communicationsHandlers.handleStakeholderCommunication,
    'generate_management_onepager': communicationsHandlers.handleGenerateManagementOnePager,
    'generate_pr_faq': communicationsHandlers.handleGeneratePRFAQ,
    'get_consulting_summary': communicationsHandlers.handleGetConsultingSummary,

    // Requirements Tools (4 tools)
    'generate_requirements': requirementsHandlers.handleGenerateRequirements,
    'generate_design_options': requirementsHandlers.handleGenerateDesignOptions,
    'generate_task_plan': requirementsHandlers.handleGenerateTaskPlan,
    'optimize_intent': requirementsHandlers.handleOptimizeIntent,

    // Market Intelligence Tools (4 tools)
    'enhance_citations': marketIntelligenceHandlers.handleEnhanceCitations,
    'validate_and_audit_citations': marketIntelligenceHandlers.handleValidateAndAuditCitations,
    'monitor_market_conditions': marketIntelligenceHandlers.handleMonitorMarketConditions,
    'analyze_workflow': marketIntelligenceHandlers.handleAnalyzeWorkflow,

    // Interview Prep Tools (6 tools)
    'start_interview_preparation': interviewPrepHandlers.handleStartInterviewPreparation,
    'generate_interview_question': interviewPrepHandlers.handleGenerateInterviewQuestion,
    'evaluate_interview_response': interviewPrepHandlers.handleEvaluateInterviewResponse,
    'get_interview_feedback': interviewPrepHandlers.handleGetInterviewFeedback,
    'get_company_interview_insights': interviewPrepHandlers.handleGetCompanyInterviewInsights,
    'customize_preparation_for_company': interviewPrepHandlers.handleCustomizePreparationForCompany,

    // Case Studies Tools (5 tools)
    'start_case_study': caseStudiesHandlers.handleStartCaseStudy,
    'get_case_guidance': caseStudiesHandlers.handleGetCaseGuidance,
    'evaluate_case_approach': caseStudiesHandlers.handleEvaluateCaseApproach,
    'complete_case_study': caseStudiesHandlers.handleCompleteCaseStudy,
    'get_company_case_scenarios': caseStudiesHandlers.handleGetCompanyCaseScenarios
  };

  const handler = toolRegistry[toolName as keyof typeof toolRegistry];
  if (!handler) {
    throw new ToolNotFoundError(toolName);
  }

  return await executeTool(toolName, toolArgs, handler);
}
