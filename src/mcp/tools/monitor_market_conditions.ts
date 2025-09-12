/**
 * Enhanced Market Condition Monitoring MCP Tool
 *
 * Provides real-time market monitoring, competitive intelligence, and predictive analysis
 * for business opportunity assessment and market sizing validation.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { MarketConditionDetector } from '../../components/market-condition-detector';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

/**
 * Market monitoring arguments interface
 */
export interface MarketMonitoringArgs {
  /** Industry to monitor */
  industry: string;
  /** Geographic region (optional, defaults to 'global') */
  region?: string;
  /** Market sizing ID to track (optional, for existing analysis) */
  marketSizingId?: string;
  /** Monitoring configuration */
  config?: {
    /** Monitoring frequency in days */
    monitoringFrequency?: number;
    /** Threshold for significant changes (percentage) */
    changeThreshold?: number;
    /** Enable predictive analysis */
    enablePredictiveAnalysis?: boolean;
    /** Enable competitive intelligence */
    enableCompetitiveIntelligence?: boolean;
  };
}

/**
 * Market monitoring result interface
 */
export interface MarketMonitoringResult {
  /** Current market conditions snapshot */
  currentConditions: {
    marketSizes: { tam: number; sam: number; som: number };
    growthRates: { tam: number; sam: number; som: number };
    competitionLevel: number;
    marketMaturity: number;
  };
  /** Detected market changes */
  detectedChanges: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: { tam: number; sam: number; som: number };
    confidence: number;
    recommendations: string[];
  }>;
  /** Predictive analysis (if enabled) */
  predictiveAnalysis?: {
    predictedChanges: Array<{
      type: string;
      description: string;
      timeframe: string;
      confidence: number;
    }>;
    recommendations: string[];
  };
  /** Competitive intelligence (if enabled) */
  competitiveIntelligence?: {
    newCompetitors: string[];
    emergingThreats: string[];
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    marketShareShifts: Array<{
      competitor: string;
      trend: 'gaining' | 'losing' | 'stable';
    }>;
  };
  /** Monitoring status */
  monitoringStatus: {
    isActive: boolean;
    nextCheck: string;
    confidence: 'low' | 'medium' | 'high';
  };
  /** Actionable recommendations */
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

/**
 * Enhanced market condition monitoring handler
 */
export async function monitorMarketConditions(
  args: MarketMonitoringArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  const logger = new MCPLogger();
  const errorHandler = new MCPErrorHandler();
  const formatter = new MCPResponseFormatter();

  try {
    MCPLogger.info('Starting enhanced market condition monitoring');

    // Initialize market condition detector with enhanced configuration
    const detectorConfig = {
      monitoringFrequency: args.config?.monitoringFrequency || 7, // Weekly by default
      growthRateThreshold: (args.config?.changeThreshold || 15) / 100, // Convert percentage
      marketSizeThreshold: (args.config?.changeThreshold || 20) / 100,
      confidenceThreshold: 0.7,
      relatedIndustries: getRelatedIndustries(args.industry),
      economicIndicators: ['gdp-growth', 'inflation', 'interest-rates', 'unemployment'],
    };

    const detector = new MarketConditionDetector(detectorConfig);

    // Fetch real-time market data
    const currentSnapshot = await detector.fetchRealTimeMarketData(
      args.industry,
      args.region || 'global'
    );

    // Initialize result structure
    const result: MarketMonitoringResult = {
      currentConditions: {
        marketSizes: currentSnapshot.marketSizes,
        growthRates: currentSnapshot.growthRates,
        competitionLevel: currentSnapshot.dynamicsIndicators.competitionLevel,
        marketMaturity: currentSnapshot.dynamicsIndicators.marketMaturity,
      },
      detectedChanges: [],
      monitoringStatus: {
        isActive: true,
        nextCheck: new Date(
          Date.now() + detectorConfig.monitoringFrequency * 24 * 60 * 60 * 1000
        ).toISOString(),
        confidence: 'high',
      },
      recommendations: {
        immediate: [],
        shortTerm: [],
        longTerm: [],
      },
    };

    // If monitoring existing market sizing, check for changes
    if (args.marketSizingId) {
      try {
        const changes = await detector.checkForChanges(args.marketSizingId);
        result.detectedChanges = changes.map(change => ({
          type: change.type,
          severity: change.severity,
          description: change.description,
          impact: change.impact,
          confidence: change.confidence,
          recommendations: change.recommendations,
        }));

        // Categorize recommendations by urgency
        changes.forEach(change => {
          if (change.severity === 'critical' || change.severity === 'high') {
            result.recommendations.immediate.push(...change.recommendations);
          } else if (change.severity === 'medium') {
            result.recommendations.shortTerm.push(...change.recommendations);
          } else {
            result.recommendations.longTerm.push(...change.recommendations);
          }
        });
      } catch (error) {
        MCPLogger.warn('Could not check existing market sizing for changes');
      }
    }

    // Predictive analysis if enabled
    if (args.config?.enablePredictiveAnalysis && args.marketSizingId) {
      try {
        const trendAnalysis = await detector.analyzeTrends(args.marketSizingId);
        result.predictiveAnalysis = {
          predictedChanges: trendAnalysis.predictedChanges.map(change => ({
            type: change.type,
            description: change.description,
            timeframe: trendAnalysis.timeframe,
            confidence: change.confidence,
          })),
          recommendations: trendAnalysis.recommendations,
        };

        // Add predictive recommendations
        result.recommendations.shortTerm.push(...trendAnalysis.recommendations);
      } catch (error) {
        MCPLogger.warn('Predictive analysis failed');
      }
    }

    // Competitive intelligence if enabled
    if (args.config?.enableCompetitiveIntelligence && args.marketSizingId) {
      try {
        const competitiveThreats = await detector.detectCompetitiveThreats(args.marketSizingId);
        result.competitiveIntelligence = {
          newCompetitors: competitiveThreats.newCompetitors,
          emergingThreats: competitiveThreats.emergingThreats,
          threatLevel: competitiveThreats.threatLevel,
          marketShareShifts: competitiveThreats.marketShareShifts.map(shift => ({
            competitor: shift.competitor,
            trend: shift.trend,
          })),
        };

        // Add competitive recommendations
        if (
          competitiveThreats.threatLevel === 'high' ||
          competitiveThreats.threatLevel === 'critical'
        ) {
          result.recommendations.immediate.push(
            'Conduct immediate competitive response analysis',
            'Review and strengthen competitive positioning'
          );
        }
      } catch (error) {
        MCPLogger.warn('Competitive intelligence analysis failed');
      }
    }

    // Add general monitoring recommendations
    result.recommendations.longTerm.push(
      'Establish regular market monitoring cadence',
      'Build competitive intelligence dashboard',
      'Develop scenario planning for market changes'
    );

    // Determine overall confidence level
    const hasSignificantChanges = result.detectedChanges.some(
      change => change.severity === 'high' || change.severity === 'critical'
    );

    if (hasSignificantChanges) {
      result.monitoringStatus.confidence = 'medium';
    }

    // Cleanup detector resources
    detector.destroy();

    MCPLogger.info('Market condition monitoring completed successfully');

    return MCPResponseFormatter.formatSuccess(result, 'json');
  } catch (error) {
    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Market monitoring failed')
    );
  }
}

/**
 * Get related industries for cross-industry impact analysis
 */
function getRelatedIndustries(industry: string): string[] {
  const industryMap: Record<string, string[]> = {
    technology: ['software', 'hardware', 'telecommunications', 'fintech'],
    healthcare: ['pharmaceuticals', 'medical-devices', 'biotechnology', 'digital-health'],
    finance: ['banking', 'insurance', 'fintech', 'cryptocurrency'],
    retail: ['e-commerce', 'consumer-goods', 'fashion', 'food-beverage'],
    manufacturing: ['automotive', 'aerospace', 'industrial', 'chemicals'],
    energy: ['renewable-energy', 'oil-gas', 'utilities', 'cleantech'],
    'real-estate': ['construction', 'property-management', 'architecture', 'urban-planning'],
    education: ['edtech', 'training', 'e-learning', 'academic-research'],
  };

  return industryMap[industry.toLowerCase()] || ['technology', 'finance', 'healthcare'];
}

/**
 * Tool metadata for MCP registration
 */
export const monitorMarketConditionsMetadata = {
  name: 'monitor_market_conditions',
  description:
    'Monitors and analyzes current market conditions and trends with real-time data, competitive intelligence, and predictive analysis. Detects market changes, tracks competitor movements, provides market sizing validation, and generates actionable recommendations for business opportunity assessment.',
  inputSchema: {
    type: 'object',
    properties: {
      industry: {
        type: 'string',
        description: 'Industry to monitor (e.g., technology, healthcare, finance)',
      },
      region: {
        type: 'string',
        description: 'Geographic region (optional, defaults to global)',
        enum: [
          'global',
          'north-america',
          'europe',
          'asia-pacific',
          'latin-america',
          'middle-east-africa',
        ],
      },
      marketSizingId: {
        type: 'string',
        description: 'Existing market sizing ID to track changes (optional)',
      },
      config: {
        type: 'object',
        properties: {
          monitoringFrequency: {
            type: 'number',
            description: 'Monitoring frequency in days (default: 7)',
            minimum: 1,
            maximum: 30,
          },
          changeThreshold: {
            type: 'number',
            description: 'Threshold for significant changes in percentage (default: 15)',
            minimum: 5,
            maximum: 50,
          },
          enablePredictiveAnalysis: {
            type: 'boolean',
            description: 'Enable AI-powered predictive analysis (default: false)',
          },
          enableCompetitiveIntelligence: {
            type: 'boolean',
            description: 'Enable competitive intelligence monitoring (default: false)',
          },
        },
      },
    },
    required: ['industry'],
  },
};
