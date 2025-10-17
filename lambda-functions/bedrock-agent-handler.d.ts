import { Context } from 'aws-lambda';
import { Logger } from './shared/utils';
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
export declare function isBedrockAgentEvent(event: any): event is BedrockAgentEvent;
/**
 * Convert Bedrock Agent parameters to tool arguments
 */
export declare function convertBedrockParametersToArgs(parameters: BedrockAgentEvent['parameters']): Record<string, any>;
/**
 * Format response for Bedrock Agent
 */
export declare function formatBedrockAgentResponse(actionGroup: string, functionName: string, result: any): BedrockAgentResponse;
/**
 * Handle Bedrock Agent request
 */
export declare function handleBedrockAgentRequest(event: BedrockAgentEvent, context: Context, routeToTool: (toolName: string, toolArgs: Record<string, any>, logger: Logger) => Promise<any>, logger: Logger): Promise<BedrockAgentResponse>;
//# sourceMappingURL=bedrock-agent-handler.d.ts.map