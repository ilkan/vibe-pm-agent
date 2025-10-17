import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { BusinessAnalysisArgs } from '../shared/types';
export declare const handler: (event: APIGatewayEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare function analyzeBusinessOpportunity(args: BusinessAnalysisArgs): Promise<any>;
export declare function generateBusinessCase(args: BusinessAnalysisArgs): Promise<any>;
export declare function assessStrategicAlignment(args: BusinessAnalysisArgs): Promise<any>;
export declare function optimizeResourceAllocation(args: BusinessAnalysisArgs): Promise<any>;
export declare function validateMarketTiming(args: BusinessAnalysisArgs): Promise<any>;
export declare function validateIdeaQuick(args: BusinessAnalysisArgs): Promise<any>;
export declare function analyzeCompetitorLandscape(args: BusinessAnalysisArgs): Promise<any>;
export declare function calculateMarketSizing(args: BusinessAnalysisArgs): Promise<any>;
//# sourceMappingURL=index.d.ts.map