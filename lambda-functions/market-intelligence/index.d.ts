import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { MarketIntelligenceArgs } from '../shared/types';
export declare const handler: (event: APIGatewayEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare function handleEnhanceCitations(args: MarketIntelligenceArgs): Promise<any>;
export declare function handleValidateAndAuditCitations(args: MarketIntelligenceArgs): Promise<any>;
export declare function handleMonitorMarketConditions(args: MarketIntelligenceArgs): Promise<any>;
export declare function handleAnalyzeWorkflow(args: MarketIntelligenceArgs): Promise<any>;
//# sourceMappingURL=index.d.ts.map