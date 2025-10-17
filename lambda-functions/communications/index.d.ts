import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { CommunicationsArgs } from '../shared/types';
export declare const handler: (event: APIGatewayEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare function handleStakeholderCommunication(args: CommunicationsArgs): Promise<any>;
export declare function handleGenerateManagementOnePager(args: CommunicationsArgs): Promise<any>;
export declare function handleGeneratePRFAQ(args: CommunicationsArgs): Promise<any>;
export declare function handleGetConsultingSummary(args: CommunicationsArgs): Promise<any>;
//# sourceMappingURL=index.d.ts.map