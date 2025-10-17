// Bedrock Agent Handler for Vibe PM Agent
// Handles requests from AWS Bedrock Agents with proper response formatting

import { Context } from 'aws-lambda';
import { Logger } from './shared/utils';

// Bedrock Agent Event Structure
export interface BedrockAgentEvent {
  messageVersion: string;
  agent: {
    name: string;
    version: string;
    id: string;
    alias: string;
  };
  inputText: string;
  sessionId: string;
  actionGroup: string;
  function: string;
  parameters: Array<{
    name: string;
    type: string;
    value: any;
  }>;
}

// Bedrock Agent Response Structure
export interface BedrockAgentResponse {
  messageVersion: string;
  response: {
    actionGroup: string;
    function: string;
    functionResponse: {
      responseBody: {
        TEXT: {
          body: string;
        };
      };
    };
  };
}

/**
 * Detect if the event is from a Bedrock Agent
 */
export function isBedrockAgentEvent(event: any): event is BedrockAgentEvent {
  return (
    event &&
    typeof event === 'object' &&
    event.messageVersion &&
    event.agent &&
    event.actionGroup &&
    event.function &&
    Array.isArray(event.parameters)
  );
}

/**
 * Convert Bedrock Agent parameters to tool arguments
 */
export function convertBedrockParametersToArgs(parameters: BedrockAgentEvent['parameters']): Record<string, any> {
  const args: Record<string, any> = {};
  
  for (const param of parameters) {
    let value = param.value;
    
    // Try to parse JSON strings
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      try {
        value = JSON.parse(value);
      } catch {
        // Keep as string if not valid JSON
      }
    }
    
    args[param.name] = value;
  }
  
  return args;
}

/**
 * Format response for Bedrock Agent
 */
export function formatBedrockAgentResponse(
  actionGroup: string,
  functionName: string,
  result: any
): BedrockAgentResponse {
  // Convert result to string format for Bedrock
  let responseBody: string;
  
  if (typeof result === 'string') {
    responseBody = result;
  } else if (result && typeof result === 'object') {
    // For structured responses, create a formatted text output
    if (result.success === false) {
      responseBody = `Error: ${result.error || 'Unknown error occurred'}`;
    } else if (result.data) {
      // Extract meaningful content from the data
      responseBody = formatStructuredResponse(result.data);
    } else {
      responseBody = JSON.stringify(result, null, 2);
    }
  } else {
    responseBody = String(result);
  }
  
  return {
    messageVersion: '1.0',
    response: {
      actionGroup,
      function: functionName,
      functionResponse: {
        responseBody: {
          TEXT: {
            body: responseBody
          }
        }
      }
    }
  };
}

/**
 * Format structured response data into readable text
 */
function formatStructuredResponse(data: any): string {
  if (!data || typeof data !== 'object') {
    return String(data);
  }
  
  // Handle different types of structured responses
  if (data.toolName && data.result) {
    return formatToolResult(data.toolName, data.result);
  }
  
  // Default formatting
  return JSON.stringify(data, null, 2);
}

/**
 * Format tool-specific results into readable text
 */
function formatToolResult(toolName: string, result: any): string {
  switch (toolName) {
    case 'generate_interview_question':
      return formatInterviewQuestionResult(result);
    
    case 'analyze_business_opportunity':
      return formatBusinessOpportunityResult(result);
    
    case 'generate_requirements':
      return formatRequirementsResult(result);
    
    case 'create_stakeholder_communication':
      return formatStakeholderCommunicationResult(result);
    
    default:
      return JSON.stringify(result, null, 2);
  }
}

/**
 * Format interview question result
 */
function formatInterviewQuestionResult(result: any): string {
  if (result.interviewQuestion) {
    const q = result.interviewQuestion;
    return `
**Interview Question Generated**

**Question:** ${q.question?.text || 'Question not available'}

**Category:** ${q.category || 'General'}
**Difficulty:** ${q.difficulty || 'Not specified'}
**Time Limit:** ${q.question?.timeLimit || '5 minutes'}

**Framework:** ${q.question?.expectedFramework || 'Use structured thinking'}

**Evaluation Criteria:**
${q.evaluationCriteria?.map((criteria: string) => `• ${criteria}`).join('\n') || '• Clear communication\n• Structured approach\n• Specific examples'}

**Preparation Tips:**
${q.preparationTips?.map((tip: string) => `• ${tip}`).join('\n') || '• Use the STAR method\n• Be specific and concise\n• Quantify your impact'}
`.trim();
  }
  
  return JSON.stringify(result, null, 2);
}

/**
 * Format business opportunity result
 */
function formatBusinessOpportunityResult(result: any): string {
  if (result.analysis) {
    return result.analysis;
  }
  
  return JSON.stringify(result, null, 2);
}

/**
 * Format requirements result
 */
function formatRequirementsResult(result: any): string {
  if (result.requirements) {
    return result.requirements;
  }
  
  return JSON.stringify(result, null, 2);
}

/**
 * Format stakeholder communication result
 */
function formatStakeholderCommunicationResult(result: any): string {
  if (result.communication) {
    return result.communication;
  }
  
  return JSON.stringify(result, null, 2);
}

/**
 * Handle Bedrock Agent request
 */
export async function handleBedrockAgentRequest(
  event: BedrockAgentEvent,
  context: Context,
  routeToTool: (toolName: string, toolArgs: Record<string, any>, logger: Logger) => Promise<any>,
  logger: Logger
): Promise<BedrockAgentResponse> {
  logger.info('Processing Bedrock Agent request', {
    requestId: context.awsRequestId,
    agentId: event.agent.id,
    agentName: event.agent.name,
    actionGroup: event.actionGroup,
    function: event.function,
    sessionId: event.sessionId
  });
  
  try {
    // Convert Bedrock parameters to tool arguments
    const toolArgs = convertBedrockParametersToArgs(event.parameters);
    
    logger.info('Converted Bedrock parameters to tool args', {
      requestId: context.awsRequestId,
      toolName: event.function,
      toolArgs: Object.keys(toolArgs)
    });
    
    // Route to appropriate tool handler
    const result = await routeToTool(event.function, toolArgs, logger);
    
    logger.info('Tool execution completed for Bedrock Agent', {
      requestId: context.awsRequestId,
      toolName: event.function,
      success: result?.success !== false
    });
    
    // Format response for Bedrock Agent
    return formatBedrockAgentResponse(event.actionGroup, event.function, result);
    
  } catch (error) {
    logger.error('Error processing Bedrock Agent request', error as Error, {
      requestId: context.awsRequestId,
      agentId: event.agent.id,
      function: event.function
    });
    
    // Return error response in Bedrock format
    return formatBedrockAgentResponse(
      event.actionGroup,
      event.function,
      {
        success: false,
        error: (error as Error).message
      }
    );
  }
}