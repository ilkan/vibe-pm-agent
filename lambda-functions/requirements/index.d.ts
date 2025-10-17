import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { RequirementsArgs } from '../shared/types';
export declare const handler: (event: APIGatewayEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare function handleGenerateRequirements(args: RequirementsArgs): Promise<any>;
export declare function handleGenerateDesignOptions(args: RequirementsArgs): Promise<any>;
export declare function handleGenerateTaskPlan(args: RequirementsArgs): Promise<any>;
export declare function handleOptimizeIntent(args: RequirementsArgs): Promise<any>;
//# sourceMappingURL=index.d.ts.map