// Main Lambda Router for Vibe PM Agent
// Routes requests to appropriate tool handlers across all categories

import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import {
  LambdaRequest,
  LambdaResponse,
  ToolNotFoundError,
  ToolExecutionError
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

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const config = loadEnvironmentConfig();
  const logger = new Logger(config);
  const timer = new PerformanceTimer();

  try {
    logger.info('Vibe PM Agent Lambda Router invoked', {
      requestId: context.awsRequestId,
      functionName: context.functionName,
      path: event.path,
      httpMethod: event.httpMethod
    });

    // Handle health check
    if (event.path === '/health' && event.httpMethod === 'GET') {
      return formatApiGatewayResponse(200, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: config.environment,
        tools: 32
      });
    }

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
    logger.info('Vibe PM Agent Lambda Router completed', {
      requestId: context.awsRequestId,
      toolName: request.toolName,
      executionTime,
      success: result.success
    });

    const response = formatSuccessResponse(
      result,
      context.awsRequestId,
      request.toolName,
      executionTime
    );

    // Convert to OpenAI-compatible format for Bedrock Agent
    const openAIResponse = convertToOpenAIFormat(
      response,
      request.toolName,
      request.toolArgs
    );

    return formatApiGatewayResponse(200, openAIResponse);

  } catch (error) {
    const executionTime = timer.measure();
    logger.error('Vibe PM Agent Lambda Router error', error as Error, {
      requestId: context.awsRequestId,
      executionTime
    });

    const response = formatErrorResponse(error as Error, context.awsRequestId);
    const statusCode = (error as any)?.statusCode || 500;

    return formatApiGatewayResponse(statusCode, response);
  }
};

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
