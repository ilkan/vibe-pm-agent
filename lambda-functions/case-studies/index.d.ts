import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { CaseStudyArgs } from '../shared/types';
export declare const handler: (event: APIGatewayEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare function handleStartCaseStudy(args: CaseStudyArgs): Promise<any>;
export declare function handleGetCaseGuidance(args: CaseStudyArgs): Promise<any>;
export declare function handleEvaluateCaseApproach(args: CaseStudyArgs): Promise<any>;
export declare function handleCompleteCaseStudy(args: CaseStudyArgs): Promise<any>;
export declare function handleGetCompanyCaseScenarios(args: CaseStudyArgs): Promise<any>;
//# sourceMappingURL=index.d.ts.map