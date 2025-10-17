import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { LambdaResponse } from './shared/types';
import { BedrockAgentEvent, BedrockAgentResponse } from './bedrock-agent-handler';
export declare enum InvocationContext {
    EXTERNAL_API_GATEWAY = "external",
    INTERNAL_DIRECT = "internal",
    INTERNAL_BEDROCK = "bedrock"
}
export interface DirectInvocationEvent {
    toolName: string;
    toolArgs: Record<string, any>;
    source?: string;
    requestId?: string;
}
export declare const handler: (event: APIGatewayEvent | DirectInvocationEvent | BedrockAgentEvent, context: Context) => Promise<APIGatewayProxyResult | LambdaResponse | BedrockAgentResponse>;
//# sourceMappingURL=router.d.ts.map