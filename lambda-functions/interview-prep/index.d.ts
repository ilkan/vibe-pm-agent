import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { InterviewPrepArgs } from '../shared/types';
export declare const handler: (event: APIGatewayEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare function handleStartInterviewPreparation(args: InterviewPrepArgs): Promise<any>;
export declare function handleGenerateInterviewQuestion(args: InterviewPrepArgs): Promise<any>;
export declare function handleEvaluateInterviewResponse(args: InterviewPrepArgs): Promise<any>;
export declare function handleGetInterviewFeedback(args: InterviewPrepArgs): Promise<any>;
export declare function handleGetCompanyInterviewInsights(args: InterviewPrepArgs): Promise<any>;
export declare function handleCustomizePreparationForCompany(args: InterviewPrepArgs): Promise<any>;
//# sourceMappingURL=index.d.ts.map