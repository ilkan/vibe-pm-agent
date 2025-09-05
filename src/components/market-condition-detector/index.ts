/**
 * Market Condition Change Detection System
 * 
 * This component implements market shift detection for TAM/SAM/SOM recalculation,
 * notification system for significant market changes, and automated monitoring
 * of market conditions that affect market sizing analysis.
 */

import {
  MarketSizingResult,
  MarketSize,
  MarketDynamics,
  MarketAssumption,
  SourceReference,
  UpdateRecommendation,
  ValidationResult,
  MarketSizingError,
  MARKET_SIZING_DEFAULTS
} from '../../models/competitive';

/**
 * Represents a detected market condition change
 */
export interface MarketConditionChange {
  /**
   * Unique identifier for the change
   */
  id: string;
  
  /**
   * Type of market change detected
   */
  type: 'growth-rate-shift' | 'market-expansion' | 'competitive-landscape' | 'regulatory-change' | 'technology-disruption' | 'economic-shift';
  
  /**
   * Severity of the change impact
   */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /**
   * Description of the detected change
   */
  description: string;
  
  /**
   * When the change was detected
   */
  detectedAt: string;
  
  /**
   * Estimated impact on market sizing
   */
  impact: {
    tam: number; // Percentage change (-1 to 1)
    sam: number; // Percentage change (-1 to 1)
    som: number; // Percentage change (-1 to 1)
  };
  
  /**
   * Confidence in the detection
   */
  confidence: number;
  
  /**
   * Source of the change information
   */
  source: string;
  
  /**
   * Recommended actions
   */
  recommendations: string[];
  
  /**
   * Whether recalculation is needed
   */
  requiresRecalculation: boolean;
}

/**
 * Configuration for market condition monitoring
 */
export interface MarketMonitoringConfig {
  /**
   * Threshold for significant growth rate changes (percentage)
   */
  growthRateThreshold: number;
  
  /**
   * Threshold for market size changes (percentage)
   */
  marketSizeThreshold: number;
  
  /**
   * Monitoring frequency in days
   */
  monitoringFrequency: number;
  
  /**
   * Confidence threshold for change detection
   */
  confidenceThreshold: number;
  
  /**
   * Industries to monitor for cross-industry impacts
   */
  relatedIndustries: string[];
  
  /**
   * Economic indicators to track
   */
  economicIndicators: string[];
}

/**
 * Default monitoring configuration
 */
export const DEFAULT_MONITORING_CONFIG: MarketMonitoringConfig = {
  growthRateThreshold: 0.15, // 15% change in growth rate
  marketSizeThreshold: 0.20, // 20% change in market size
  monitoringFrequency: 7, // Weekly monitoring
  confidenceThreshold: 0.7,
  relatedIndustries: ['technology', 'finance', 'healthcare'],
  economicIndicators: ['gdp-growth', 'inflation', 'interest-rates', 'unemployment']
};

/**
 * Tracks market conditions and detects significant changes
 */
export interface MarketConditionTracker {
  /**
   * Market sizing result being tracked
   */
  marketSizing: MarketSizingResult;
  
  /**
   * Last monitoring date
   */
  lastMonitored: string;
  
  /**
   * Historical market conditions
   */
  historicalConditions: MarketConditionSnapshot[];
  
  /**
   * Detected changes
   */
  detectedChanges: MarketConditionChange[];
  
  /**
   * Next monitoring date
   */
  nextMonitoringDate: string;
}

/**
 * Snapshot of market conditions at a point in time
 */
export interface MarketConditionSnapshot {
  /**
   * Date of the snapshot
   */
  date: string;
  
  /**
   * Market size values at this time
   */
  marketSizes: {
    tam: number;
    sam: number;
    som: number;
  };
  
  /**
   * Growth rates at this time
   */
  growthRates: {
    tam: number;
    sam: number;
    som: number;
  };
  
  /**
   * Market dynamics indicators
   */
  dynamicsIndicators: {
    competitionLevel: number;
    marketMaturity: number;
    regulatoryStability: number;
    technologyTrends: number;
  };
  
  /**
   * Economic indicators
   */
  economicIndicators: {
    gdpGrowth: number;
    inflation: number;
    interestRates: number;
    unemployment: number;
  };
  
  /**
   * Data sources used for this snapshot
   */
  dataSources: string[];
}

/**
 * Notification for market condition changes
 */
export interface MarketChangeNotification {
  /**
   * Notification ID
   */
  id: string;
  
  /**
   * Priority level
   */
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  /**
   * Notification title
   */
  title: string;
  
  /**
   * Detailed message
   */
  message: string;
  
  /**
   * Related market changes
   */
  changes: MarketConditionChange[];
  
  /**
   * Recommended actions
   */
  actions: {
    action: string;
    priority: 'low' | 'medium' | 'high';
    estimatedEffort: string;
    deadline?: string;
  }[];
  
  /**
   * When notification was created
   */
  createdAt: string;
  
  /**
   * Whether notification has been acknowledged
   */
  acknowledged: boolean;
}

/**
 * Detects and monitors market condition changes
 */
export class MarketConditionDetector {
  private readonly config: MarketMonitoringConfig;
  private readonly trackers: Map<string, MarketConditionTracker>;
  private readonly notifications: Map<string, MarketChangeNotification>;

  constructor(config?: Partial<MarketMonitoringConfig>) {
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
    this.trackers = new Map();
    this.notifications = new Map();
  }

  /**
   * Starts monitoring market conditions for a market sizing result
   */
  startMonitoring(
    marketSizingId: string,
    marketSizing: MarketSizingResult
  ): MarketConditionTracker {
    const currentDate = new Date().toISOString();
    const nextMonitoringDate = new Date(
      Date.now() + this.config.monitoringFrequency * 24 * 60 * 60 * 1000
    ).toISOString();

    const tracker: MarketConditionTracker = {
      marketSizing,
      lastMonitored: currentDate,
      historicalConditions: [this.createCurrentSnapshot(marketSizing)],
      detectedChanges: [],
      nextMonitoringDate
    };

    this.trackers.set(marketSizingId, tracker);
    return tracker;
  }

  /**
   * Checks for market condition changes
   */
  async checkForChanges(marketSizingId: string): Promise<MarketConditionChange[]> {
    const tracker = this.trackers.get(marketSizingId);
    if (!tracker) {
      throw new MarketSizingError(
        `No tracker found for market sizing ID: ${marketSizingId}`,
        'INVALID_MARKET_DEFINITION',
        ['Start monitoring first using startMonitoring()']
      );
    }

    // Create current snapshot
    const currentSnapshot = this.createCurrentSnapshot(tracker.marketSizing);
    
    // Compare with historical data
    const changes = this.detectChanges(tracker, currentSnapshot);
    
    // Update tracker
    tracker.historicalConditions.push(currentSnapshot);
    tracker.detectedChanges.push(...changes);
    tracker.lastMonitored = new Date().toISOString();
    tracker.nextMonitoringDate = new Date(
      Date.now() + this.config.monitoringFrequency * 24 * 60 * 60 * 1000
    ).toISOString();

    // Generate notifications for significant changes
    const significantChanges = changes.filter(
      change => change.severity === 'high' || change.severity === 'critical'
    );
    
    if (significantChanges.length > 0) {
      this.generateNotifications(marketSizingId, significantChanges);
    }

    return changes;
  }

  /**
   * Gets all detected changes for a market sizing
   */
  getDetectedChanges(marketSizingId: string): MarketConditionChange[] {
    const tracker = this.trackers.get(marketSizingId);
    return tracker ? tracker.detectedChanges : [];
  }

  /**
   * Gets pending notifications
   */
  getPendingNotifications(): MarketChangeNotification[] {
    return Array.from(this.notifications.values()).filter(
      notification => !notification.acknowledged
    );
  }

  /**
   * Acknowledges a notification
   */
  acknowledgeNotification(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.acknowledged = true;
    }
  }

  /**
   * Determines if recalculation is needed based on detected changes
   * Requirement 6.3: Market condition shift detection for TAM/SAM/SOM recalculation
   */
  needsRecalculation(marketSizingId: string): boolean {
    const tracker = this.trackers.get(marketSizingId);
    if (!tracker) return false;

    // Check if any recent changes require recalculation
    const recentChanges = tracker.detectedChanges.filter(change => {
      const changeDate = new Date(change.detectedAt);
      const daysSinceChange = Math.floor(
        (Date.now() - changeDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceChange <= 30 && change.requiresRecalculation;
    });

    return recentChanges.length > 0;
  }

  /**
   * Suggests TAM/SAM/SOM recalculation based on market condition shifts
   * Requirement 6.3: Market condition shift detection for TAM/SAM/SOM recalculation
   */
  suggestRecalculation(marketSizingId: string): {
    shouldRecalculate: boolean;
    reasons: string[];
    urgency: 'low' | 'medium' | 'high' | 'critical';
    estimatedImpact: {
      tam: number;
      sam: number;
      som: number;
    };
    recommendedActions: string[];
  } {
    const tracker = this.trackers.get(marketSizingId);
    if (!tracker) {
      return {
        shouldRecalculate: false,
        reasons: ['No tracking data available'],
        urgency: 'low',
        estimatedImpact: { tam: 0, sam: 0, som: 0 },
        recommendedActions: ['Start market condition monitoring']
      };
    }

    const significantChanges = tracker.detectedChanges.filter(
      change => change.severity === 'high' || change.severity === 'critical'
    );

    if (significantChanges.length === 0) {
      return {
        shouldRecalculate: false,
        reasons: ['No significant market changes detected'],
        urgency: 'low',
        estimatedImpact: { tam: 0, sam: 0, som: 0 },
        recommendedActions: ['Continue monitoring market conditions']
      };
    }

    // Calculate cumulative impact
    const cumulativeImpact = significantChanges.reduce(
      (acc, change) => ({
        tam: acc.tam + change.impact.tam,
        sam: acc.sam + change.impact.sam,
        som: acc.som + change.impact.som
      }),
      { tam: 0, sam: 0, som: 0 }
    );

    // Determine urgency based on impact magnitude and change types
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    const maxImpact = Math.max(
      Math.abs(cumulativeImpact.tam),
      Math.abs(cumulativeImpact.sam),
      Math.abs(cumulativeImpact.som)
    );

    if (maxImpact > 0.5) urgency = 'critical';
    else if (maxImpact > 0.3) urgency = 'high';
    else if (maxImpact > 0.15) urgency = 'medium';

    // Check for critical change types
    const hasCriticalChanges = significantChanges.some(
      change => change.severity === 'critical' || 
      change.type === 'regulatory-change' ||
      change.type === 'technology-disruption'
    );

    if (hasCriticalChanges) {
      urgency = urgency === 'critical' ? 'critical' : 'high';
    }

    const reasons = significantChanges.map(change => change.description);
    const recommendedActions = [
      'Recalculate TAM/SAM/SOM with updated market data',
      'Review and update market assumptions',
      'Validate changes with recent market research',
      'Update business case and projections'
    ];

    // Add specific actions based on change types
    const changeTypes = new Set(significantChanges.map(c => c.type));
    if (changeTypes.has('competitive-landscape')) {
      recommendedActions.push('Update competitive analysis and SOM calculations');
    }
    if (changeTypes.has('growth-rate-shift')) {
      recommendedActions.push('Revise growth rate assumptions and projections');
    }
    if (changeTypes.has('economic-shift')) {
      recommendedActions.push('Adjust for current economic conditions');
    }

    return {
      shouldRecalculate: true,
      reasons,
      urgency,
      estimatedImpact: cumulativeImpact,
      recommendedActions
    };
  }

  /**
   * Gets recalculation recommendations
   */
  getRecalculationRecommendations(marketSizingId: string): UpdateRecommendation[] {
    const tracker = this.trackers.get(marketSizingId);
    if (!tracker) return [];

    const recommendations: UpdateRecommendation[] = [];
    const significantChanges = tracker.detectedChanges.filter(
      change => change.severity === 'high' || change.severity === 'critical'
    );

    if (significantChanges.length > 0) {
      recommendations.push({
        type: 'methodology-update',
        priority: 'high',
        description: `Market conditions have changed significantly - ${significantChanges.length} major changes detected`,
        estimatedEffort: '4-6 hours',
        expectedImpact: 'Updated market sizing reflecting current conditions',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    // Check for specific change types
    const growthRateChanges = significantChanges.filter(c => c.type === 'growth-rate-shift');
    if (growthRateChanges.length > 0) {
      recommendations.push({
        type: 'data-refresh',
        priority: 'medium',
        description: 'Growth rate assumptions need updating based on market trends',
        estimatedEffort: '2-3 hours',
        expectedImpact: 'More accurate growth projections'
      });
    }

    const competitiveChanges = significantChanges.filter(c => c.type === 'competitive-landscape');
    if (competitiveChanges.length > 0) {
      recommendations.push({
        type: 'analysis-rerun',
        priority: 'medium',
        description: 'Competitive landscape changes may affect SOM calculations',
        estimatedEffort: '3-4 hours',
        expectedImpact: 'Updated competitive positioning and market share projections'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Identifies potential impact of new competitors on existing analysis
   * Requirement 6.4: New competitor impact identification
   */
  detectNewCompetitorImpact(
    marketSizingId: string,
    newCompetitors: string[]
  ): {
    impactAssessment: {
      competitor: string;
      estimatedMarketShare: number;
      impactOnSOM: number;
      impactOnSAM: number;
      threatLevel: 'low' | 'medium' | 'high' | 'critical';
      reasoning: string[];
    }[];
    overallImpact: {
      totalSOMReduction: number;
      totalSAMReduction: number;
      recommendedActions: string[];
      urgency: 'low' | 'medium' | 'high' | 'critical';
    };
  } {
    const tracker = this.trackers.get(marketSizingId);
    if (!tracker) {
      throw new MarketSizingError(
        `No tracker found for market sizing ID: ${marketSizingId}`,
        'INVALID_MARKET_DEFINITION',
        ['Start monitoring first using startMonitoring()']
      );
    }

    const impactAssessment = newCompetitors.map(competitor => {
      // Simulate competitor impact analysis (in real implementation, this would use market intelligence)
      const estimatedMarketShare = this.estimateCompetitorMarketShare(competitor, tracker.marketSizing);
      const impactOnSOM = this.calculateSOMImpact(estimatedMarketShare, tracker.marketSizing);
      const impactOnSAM = this.calculateSAMImpact(estimatedMarketShare, tracker.marketSizing);
      
      let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      const reasoning: string[] = [];

      // Determine threat level based on market share and impact
      if (estimatedMarketShare > 0.15) {
        threatLevel = 'critical';
        reasoning.push('Large established player with significant market presence');
      } else if (estimatedMarketShare > 0.08) {
        threatLevel = 'high';
        reasoning.push('Significant competitor with substantial market share');
      } else if (estimatedMarketShare > 0.03) {
        threatLevel = 'medium';
        reasoning.push('Notable competitor with moderate market presence');
      } else {
        threatLevel = 'low';
        reasoning.push('Small competitor with limited market impact');
      }

      // Additional threat assessment factors
      if (impactOnSOM > 0.2) {
        threatLevel = threatLevel === 'critical' ? 'critical' : 'high';
        reasoning.push('Significant impact on serviceable obtainable market');
      }

      // Check for disruptive potential (simulated based on competitor name patterns)
      if (competitor.toLowerCase().includes('ai') || 
          competitor.toLowerCase().includes('tech') ||
          competitor.toLowerCase().includes('digital')) {
        threatLevel = threatLevel === 'low' ? 'medium' : threatLevel;
        reasoning.push('Technology-focused competitor with potential for disruption');
      }

      return {
        competitor,
        estimatedMarketShare,
        impactOnSOM,
        impactOnSAM,
        threatLevel,
        reasoning
      };
    });

    // Calculate overall impact
    const totalSOMReduction = impactAssessment.reduce((sum, assessment) => sum + assessment.impactOnSOM, 0);
    const totalSAMReduction = impactAssessment.reduce((sum, assessment) => sum + assessment.impactOnSAM, 0);

    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const recommendedActions: string[] = [];

    if (totalSOMReduction > 0.3) {
      urgency = 'critical';
      recommendedActions.push('Immediate SOM recalculation required');
      recommendedActions.push('Develop competitive response strategy');
    } else if (totalSOMReduction > 0.15) {
      urgency = 'high';
      recommendedActions.push('Update SOM calculations within 1 week');
      recommendedActions.push('Analyze competitive positioning');
    } else if (totalSOMReduction > 0.05) {
      urgency = 'medium';
      recommendedActions.push('Schedule SOM review within 2 weeks');
      recommendedActions.push('Monitor competitive developments');
    }

    // Add specific recommendations based on threat levels
    const criticalThreats = impactAssessment.filter(a => a.threatLevel === 'critical');
    if (criticalThreats.length > 0) {
      recommendedActions.push('Conduct detailed competitive analysis for critical threats');
      recommendedActions.push('Consider strategic partnerships or acquisitions');
    }

    const highThreats = impactAssessment.filter(a => a.threatLevel === 'high');
    if (highThreats.length > 0) {
      recommendedActions.push('Develop differentiation strategy against high-threat competitors');
      recommendedActions.push('Accelerate product development roadmap');
    }

    // Generate market condition change for new competitors
    const competitorChange: MarketConditionChange = {
      id: `new-competitors-${Date.now()}`,
      type: 'competitive-landscape',
      severity: urgency === 'critical' ? 'critical' : urgency === 'high' ? 'high' : 'medium',
      description: `${newCompetitors.length} new competitors detected with estimated ${(totalSOMReduction * 100).toFixed(1)}% SOM impact`,
      detectedAt: new Date().toISOString(),
      impact: {
        tam: 0, // New competitors typically don't affect TAM
        sam: -totalSAMReduction,
        som: -totalSOMReduction
      },
      confidence: 0.7, // Moderate confidence as this is based on estimation
      source: 'Competitive intelligence',
      recommendations: recommendedActions,
      requiresRecalculation: urgency === 'high' || urgency === 'critical'
    };

    // Add the change to the tracker
    tracker.detectedChanges.push(competitorChange);

    return {
      impactAssessment,
      overallImpact: {
        totalSOMReduction,
        totalSAMReduction,
        recommendedActions,
        urgency
      }
    };
  }

  /**
   * Validates current market conditions against historical data
   * Requirement 6.5: Outdated analysis indicators and refresh recommendations
   */
  validateMarketConditions(marketSizingId: string): ValidationResult {
    const tracker = this.trackers.get(marketSizingId);
    if (!tracker) {
      return {
        isValid: false,
        confidence: 0,
        warnings: ['No market condition tracking data available'],
        recommendations: ['Start market condition monitoring'],
        dataGaps: ['Historical market data'],
        qualityScore: 0
      };
    }

    const warnings: string[] = [];
    const recommendations: string[] = [];
    const dataGaps: string[] = [];
    let qualityScore = 1.0;

    // Get outdated analysis indicators
    const outdatedIndicators = this.getOutdatedAnalysisIndicators(marketSizingId);

    // Check monitoring frequency
    const daysSinceLastMonitoring = Math.floor(
      (Date.now() - new Date(tracker.lastMonitored).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastMonitoring > this.config.monitoringFrequency * 2) {
      warnings.push(`Market conditions not monitored for ${daysSinceLastMonitoring} days`);
      qualityScore -= 0.2;
      recommendations.push('Update market condition monitoring');
    }

    // Check for significant unaddressed changes
    const unaddressedChanges = tracker.detectedChanges.filter(
      change => change.requiresRecalculation && change.severity === 'high'
    );

    if (unaddressedChanges.length > 0) {
      warnings.push(`${unaddressedChanges.length} significant market changes require attention`);
      qualityScore -= 0.3;
      recommendations.push('Address significant market condition changes');
    }

    // Check data freshness using outdated indicators
    if (outdatedIndicators.staleness.dataAge > 90) {
      warnings.push(`Market data is ${outdatedIndicators.staleness.dataAge} days old`);
      qualityScore -= 0.25;
      recommendations.push('Update market data sources');
    }

    // Check for outdated analysis
    if (outdatedIndicators.isOutdated) {
      warnings.push('Market analysis is outdated and requires refresh');
      qualityScore -= 0.4;
      recommendations.push('Perform comprehensive market analysis refresh');
    }

    // Add specific warnings from outdated indicators
    outdatedIndicators.indicators.forEach(indicator => {
      if (indicator.severity === 'high' || indicator.severity === 'critical') {
        warnings.push(indicator.description);
        recommendations.push(indicator.recommendation);
        
        if (indicator.severity === 'critical') {
          qualityScore -= 0.3;
        } else {
          qualityScore -= 0.15;
        }
      }
    });

    // Check data freshness
    if (tracker.historicalConditions.length < 3) {
      warnings.push('Insufficient historical data for trend analysis');
      qualityScore -= 0.1;
      dataGaps.push('Historical market condition data');
    }

    // Check for data gaps based on source coverage
    const sourceTypes = new Set(tracker.marketSizing.sourceAttribution.map(s => s.type));
    if (!sourceTypes.has('market-research')) {
      dataGaps.push('Market research data');
      qualityScore -= 0.05;
    }
    if (!sourceTypes.has('industry-report')) {
      dataGaps.push('Industry report data');
      qualityScore -= 0.05;
    }

    // Add refresh recommendations from outdated analysis
    outdatedIndicators.refreshRecommendations.forEach(rec => {
      if (!recommendations.includes(rec.action)) {
        recommendations.push(rec.action);
      }
    });

    return {
      isValid: qualityScore >= 0.5,
      confidence: Math.max(0, qualityScore),
      warnings,
      recommendations,
      dataGaps,
      qualityScore
    };
  }

  /**
   * Provides clear indicators for outdated analysis and refresh recommendations
   * Requirement 6.5: Outdated analysis indicators and refresh recommendations
   */
  getOutdatedAnalysisIndicators(marketSizingId: string): {
    isOutdated: boolean;
    staleness: {
      dataAge: number; // days
      monitoringGap: number; // days
      lastSignificantChange: number; // days ago
    };
    indicators: {
      type: 'data-age' | 'monitoring-gap' | 'unaddressed-changes' | 'source-staleness';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      recommendation: string;
    }[];
    refreshPriority: 'low' | 'medium' | 'high' | 'urgent';
    refreshRecommendations: {
      action: string;
      priority: 'low' | 'medium' | 'high';
      estimatedEffort: string;
      deadline?: string;
    }[];
  } {
    const tracker = this.trackers.get(marketSizingId);
    if (!tracker) {
      return {
        isOutdated: true,
        staleness: { dataAge: 0, monitoringGap: 0, lastSignificantChange: 0 },
        indicators: [{
          type: 'monitoring-gap',
          severity: 'critical',
          description: 'No market condition tracking available',
          recommendation: 'Start market condition monitoring immediately'
        }],
        refreshPriority: 'urgent',
        refreshRecommendations: [{
          action: 'Initialize market condition monitoring',
          priority: 'high',
          estimatedEffort: '1-2 hours',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }]
      };
    }

    const now = Date.now();
    const lastMonitored = new Date(tracker.lastMonitored).getTime();
    const monitoringGap = Math.floor((now - lastMonitored) / (1000 * 60 * 60 * 24));

    // Calculate data age from source attribution
    const oldestSourceAge = Math.max(
      ...tracker.marketSizing.sourceAttribution.map(source => {
        const publishDate = new Date(source.publishDate).getTime();
        return Math.floor((now - publishDate) / (1000 * 60 * 60 * 24));
      })
    );

    // Find last significant change
    const significantChanges = tracker.detectedChanges.filter(
      change => change.severity === 'high' || change.severity === 'critical'
    );
    const lastSignificantChange = significantChanges.length > 0 
      ? Math.floor((now - new Date(significantChanges[significantChanges.length - 1].detectedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const indicators: any[] = [];
    let refreshPriority: 'low' | 'medium' | 'high' | 'urgent' = 'low';

    // Check data age
    if (oldestSourceAge > 180) { // 6 months
      indicators.push({
        type: 'data-age',
        severity: 'high',
        description: `Market data is ${oldestSourceAge} days old`,
        recommendation: 'Update with recent market research and industry reports'
      });
      refreshPriority = 'high';
    } else if (oldestSourceAge > 90) { // 3 months
      indicators.push({
        type: 'data-age',
        severity: 'medium',
        description: `Market data is ${oldestSourceAge} days old`,
        recommendation: 'Consider updating with more recent market data'
      });
      if (refreshPriority === 'low') refreshPriority = 'medium';
    }

    // Check monitoring gap
    if (monitoringGap > this.config.monitoringFrequency * 3) {
      indicators.push({
        type: 'monitoring-gap',
        severity: 'high',
        description: `Market conditions not monitored for ${monitoringGap} days`,
        recommendation: 'Resume regular market condition monitoring'
      });
      refreshPriority = 'high';
    } else if (monitoringGap > this.config.monitoringFrequency * 2) {
      indicators.push({
        type: 'monitoring-gap',
        severity: 'medium',
        description: `Market conditions monitoring delayed by ${monitoringGap} days`,
        recommendation: 'Update market condition monitoring'
      });
      if (refreshPriority === 'low') refreshPriority = 'medium';
    }

    // Check for unaddressed significant changes
    const unaddressedChanges = tracker.detectedChanges.filter(
      change => change.requiresRecalculation && 
      (change.severity === 'high' || change.severity === 'critical')
    );

    if (unaddressedChanges.length > 0) {
      const severity = unaddressedChanges.some(c => c.severity === 'critical') ? 'critical' : 'high';
      indicators.push({
        type: 'unaddressed-changes',
        severity,
        description: `${unaddressedChanges.length} significant market changes require attention`,
        recommendation: 'Address significant market changes and recalculate market sizing'
      });
      if (severity === 'critical') {
        refreshPriority = 'urgent';
      } else if (refreshPriority === 'low' || refreshPriority === 'medium') {
        refreshPriority = 'high';
      }
    }

    // Check source staleness
    const staleSourceCount = tracker.marketSizing.sourceAttribution.filter(source => {
      const ageInDays = Math.floor((now - new Date(source.publishDate).getTime()) / (1000 * 60 * 60 * 24));
      return ageInDays > (source.dataFreshness?.recommendedUpdateFrequency || 90);
    }).length;

    if (staleSourceCount > 0) {
      const severity = staleSourceCount > tracker.marketSizing.sourceAttribution.length / 2 ? 'high' : 'medium';
      indicators.push({
        type: 'source-staleness',
        severity,
        description: `${staleSourceCount} sources exceed recommended update frequency`,
        recommendation: 'Refresh market data sources with recent publications'
      });
      if (severity === 'high' && (refreshPriority === 'low' || refreshPriority === 'medium')) {
        refreshPriority = 'high';
      } else if (refreshPriority === 'low') {
        refreshPriority = 'medium';
      }
    }

    // Generate refresh recommendations
    const refreshRecommendations: any[] = [];

    if (refreshPriority === 'urgent' || refreshPriority === 'high') {
      refreshRecommendations.push({
        action: 'Immediate market sizing recalculation',
        priority: 'high',
        estimatedEffort: '4-8 hours',
        deadline: new Date(Date.now() + (refreshPriority === 'urgent' ? 3 : 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    if (indicators.some(i => i.type === 'data-age')) {
      refreshRecommendations.push({
        action: 'Update market data sources',
        priority: 'medium',
        estimatedEffort: '2-4 hours'
      });
    }

    if (indicators.some(i => i.type === 'monitoring-gap')) {
      refreshRecommendations.push({
        action: 'Resume market condition monitoring',
        priority: 'medium',
        estimatedEffort: '30 minutes'
      });
    }

    if (unaddressedChanges.length > 0) {
      refreshRecommendations.push({
        action: 'Address significant market changes',
        priority: 'high',
        estimatedEffort: '2-6 hours',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    const isOutdated = indicators.length > 0 && (refreshPriority === 'high' || refreshPriority === 'urgent');

    return {
      isOutdated,
      staleness: {
        dataAge: oldestSourceAge,
        monitoringGap,
        lastSignificantChange
      },
      indicators,
      refreshPriority,
      refreshRecommendations
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private estimateCompetitorMarketShare(competitor: string, marketSizing: MarketSizingResult): number {
    // Simulate competitor market share estimation (in real implementation, this would use competitive intelligence)
    // Base estimation on competitor name patterns and market dynamics
    
    let baseShare = 0.02; // Default 2% market share for new entrants
    
    // Adjust based on competitor characteristics (simulated)
    if (competitor.toLowerCase().includes('google') || 
        competitor.toLowerCase().includes('microsoft') ||
        competitor.toLowerCase().includes('amazon')) {
      baseShare = 0.15; // Large tech companies get higher estimated share
    } else if (competitor.toLowerCase().includes('startup') ||
               competitor.toLowerCase().includes('new')) {
      baseShare = 0.01; // Startups get lower estimated share
    } else if (competitor.toLowerCase().includes('enterprise') ||
               competitor.toLowerCase().includes('corp')) {
      baseShare = 0.08; // Established enterprises get moderate share
    }
    
    // Adjust based on market maturity (from market dynamics)
    const marketMaturity = this.calculateMarketMaturity(marketSizing.marketDynamics);
    if (marketMaturity > 0.8) {
      baseShare *= 0.7; // Mature markets are harder to penetrate
    } else if (marketMaturity < 0.3) {
      baseShare *= 1.5; // Emerging markets allow for higher shares
    }
    
    // Add some randomness to simulate market uncertainty
    const variance = baseShare * 0.3; // 30% variance
    const adjustment = (Math.random() - 0.5) * variance;
    
    return Math.max(0.005, Math.min(0.25, baseShare + adjustment)); // Cap between 0.5% and 25%
  }

  private calculateSOMImpact(competitorMarketShare: number, marketSizing: MarketSizingResult): number {
    // SOM is most directly affected by new competitors
    // Impact is proportional to competitor's market share but with diminishing returns
    const directImpact = competitorMarketShare * 0.8; // 80% of competitor's share comes from SOM
    
    // Adjust based on current SOM size relative to SAM
    const somToSamRatio = marketSizing.som.value / marketSizing.sam.value;
    const adjustmentFactor = somToSamRatio > 0.5 ? 1.2 : 0.8; // Higher impact if SOM is large relative to SAM
    
    return Math.min(0.5, directImpact * adjustmentFactor); // Cap at 50% SOM reduction
  }

  private calculateSAMImpact(competitorMarketShare: number, marketSizing: MarketSizingResult): number {
    // SAM is less directly affected by individual competitors
    // Impact is smaller and depends on whether competitor expands or contracts the addressable market
    
    const baseImpact = competitorMarketShare * 0.3; // 30% of competitor's share affects SAM
    
    // New competitors might actually expand SAM in emerging markets
    const marketMaturity = this.calculateMarketMaturity(marketSizing.marketDynamics);
    if (marketMaturity < 0.4) {
      return -baseImpact * 0.5; // Negative impact (actually increases SAM) in emerging markets
    }
    
    return Math.min(0.2, baseImpact); // Cap at 20% SAM reduction in mature markets
  }

  private createCurrentSnapshot(marketSizing: MarketSizingResult): MarketConditionSnapshot {
    return {
      date: new Date().toISOString(),
      marketSizes: {
        tam: marketSizing.tam.value,
        sam: marketSizing.sam.value,
        som: marketSizing.som.value
      },
      growthRates: {
        tam: marketSizing.tam.growthRate,
        sam: marketSizing.sam.growthRate,
        som: marketSizing.som.growthRate
      },
      dynamicsIndicators: this.extractDynamicsIndicators(marketSizing.marketDynamics),
      economicIndicators: this.simulateEconomicIndicators(),
      dataSources: marketSizing.sourceAttribution.map(source => source.organization)
    };
  }

  private extractDynamicsIndicators(dynamics: MarketDynamics): any {
    return {
      competitionLevel: this.calculateCompetitionLevel(dynamics),
      marketMaturity: this.calculateMarketMaturity(dynamics),
      regulatoryStability: this.calculateRegulatoryStability(dynamics),
      technologyTrends: this.calculateTechnologyTrends(dynamics)
    };
  }

  private calculateCompetitionLevel(dynamics: MarketDynamics): number {
    // Simulate competition level based on market barriers and disruptive forces
    const barriers = dynamics.marketBarriers.length;
    const disruptiveForces = dynamics.disruptiveForces.length;
    
    // More barriers = less competition, more disruptive forces = more competition
    return Math.max(0, Math.min(1, 0.5 + (disruptiveForces - barriers) * 0.1));
  }

  private calculateMarketMaturity(dynamics: MarketDynamics): number {
    // Simulate market maturity based on growth drivers and cyclical factors
    const growthDrivers = dynamics.growthDrivers.length;
    const cyclicalFactors = dynamics.cyclicalFactors.length;
    
    // More growth drivers = less mature market
    return Math.max(0, Math.min(1, 0.8 - growthDrivers * 0.1 + cyclicalFactors * 0.05));
  }

  private calculateRegulatoryStability(dynamics: MarketDynamics): number {
    // Simulate regulatory stability
    const disruptiveForces = dynamics.disruptiveForces.filter(force => 
      force.toLowerCase().includes('regulatory') || force.toLowerCase().includes('compliance')
    ).length;
    
    return Math.max(0, Math.min(1, 0.8 - disruptiveForces * 0.2));
  }

  private calculateTechnologyTrends(dynamics: MarketDynamics): number {
    // Simulate technology trend impact
    const techDrivers = dynamics.growthDrivers.filter(driver =>
      driver.toLowerCase().includes('technology') || 
      driver.toLowerCase().includes('digital') ||
      driver.toLowerCase().includes('ai')
    ).length;
    
    return Math.max(0, Math.min(1, 0.3 + techDrivers * 0.2));
  }

  private simulateEconomicIndicators(): any {
    // Simulate current economic indicators (in real implementation, these would come from APIs)
    return {
      gdpGrowth: 0.025 + (Math.random() - 0.5) * 0.01, // 2.5% ± 0.5%
      inflation: 0.03 + (Math.random() - 0.5) * 0.005, // 3% ± 0.25%
      interestRates: 0.045 + (Math.random() - 0.5) * 0.01, // 4.5% ± 0.5%
      unemployment: 0.04 + (Math.random() - 0.5) * 0.005 // 4% ± 0.25%
    };
  }

  private detectChanges(
    tracker: MarketConditionTracker,
    currentSnapshot: MarketConditionSnapshot
  ): MarketConditionChange[] {
    const changes: MarketConditionChange[] = [];
    
    if (tracker.historicalConditions.length === 0) {
      return changes; // No historical data to compare
    }

    const previousSnapshot = tracker.historicalConditions[tracker.historicalConditions.length - 1];
    
    // Detect growth rate changes
    const growthRateChanges = this.detectGrowthRateChanges(previousSnapshot, currentSnapshot);
    changes.push(...growthRateChanges);
    
    // Detect market size changes
    const marketSizeChanges = this.detectMarketSizeChanges(previousSnapshot, currentSnapshot);
    changes.push(...marketSizeChanges);
    
    // Detect competitive landscape changes
    const competitiveChanges = this.detectCompetitiveChanges(previousSnapshot, currentSnapshot);
    changes.push(...competitiveChanges);
    
    // Detect economic shifts
    const economicChanges = this.detectEconomicShifts(previousSnapshot, currentSnapshot);
    changes.push(...economicChanges);

    return changes.filter(change => change.confidence >= this.config.confidenceThreshold);
  }

  private detectGrowthRateChanges(
    previous: MarketConditionSnapshot,
    current: MarketConditionSnapshot
  ): MarketConditionChange[] {
    const changes: MarketConditionChange[] = [];
    
    ['tam', 'sam', 'som'].forEach(marketType => {
      const prevRate = previous.growthRates[marketType as keyof typeof previous.growthRates];
      const currRate = current.growthRates[marketType as keyof typeof current.growthRates];
      const changePercent = Math.abs(currRate - prevRate) / prevRate;
      
      if (changePercent > this.config.growthRateThreshold) {
        const severity = changePercent > 0.3 ? 'high' : changePercent > 0.2 ? 'medium' : 'low';
        
        changes.push({
          id: `growth-rate-${marketType}-${Date.now()}`,
          type: 'growth-rate-shift',
          severity: severity as any,
          description: `${marketType.toUpperCase()} growth rate changed by ${(changePercent * 100).toFixed(1)}%`,
          detectedAt: new Date().toISOString(),
          impact: {
            tam: marketType === 'tam' ? changePercent * (currRate > prevRate ? 1 : -1) : 0,
            sam: marketType === 'sam' ? changePercent * (currRate > prevRate ? 1 : -1) : 0,
            som: marketType === 'som' ? changePercent * (currRate > prevRate ? 1 : -1) : 0
          },
          confidence: 0.8,
          source: 'Market trend analysis',
          recommendations: [
            'Update growth assumptions in market sizing model',
            'Review market drivers and barriers',
            'Validate with recent market research'
          ],
          requiresRecalculation: severity === 'high'
        });
      }
    });
    
    return changes;
  }

  private detectMarketSizeChanges(
    previous: MarketConditionSnapshot,
    current: MarketConditionSnapshot
  ): MarketConditionChange[] {
    const changes: MarketConditionChange[] = [];
    
    ['tam', 'sam', 'som'].forEach(marketType => {
      const prevSize = previous.marketSizes[marketType as keyof typeof previous.marketSizes];
      const currSize = current.marketSizes[marketType as keyof typeof current.marketSizes];
      const changePercent = Math.abs(currSize - prevSize) / prevSize;
      
      if (changePercent > this.config.marketSizeThreshold) {
        const severity = changePercent > 0.5 ? 'critical' : changePercent > 0.3 ? 'high' : 'medium';
        
        changes.push({
          id: `market-size-${marketType}-${Date.now()}`,
          type: 'market-expansion',
          severity: severity as any,
          description: `${marketType.toUpperCase()} market size changed by ${(changePercent * 100).toFixed(1)}%`,
          detectedAt: new Date().toISOString(),
          impact: {
            tam: marketType === 'tam' ? changePercent * (currSize > prevSize ? 1 : -1) : 0,
            sam: marketType === 'sam' ? changePercent * (currSize > prevSize ? 1 : -1) : 0,
            som: marketType === 'som' ? changePercent * (currSize > prevSize ? 1 : -1) : 0
          },
          confidence: 0.75,
          source: 'Market size monitoring',
          recommendations: [
            'Recalculate market sizing with updated data',
            'Investigate causes of market size change',
            'Update business case and projections'
          ],
          requiresRecalculation: true
        });
      }
    });
    
    return changes;
  }

  private detectCompetitiveChanges(
    previous: MarketConditionSnapshot,
    current: MarketConditionSnapshot
  ): MarketConditionChange[] {
    const changes: MarketConditionChange[] = [];
    
    const competitionChange = Math.abs(
      current.dynamicsIndicators.competitionLevel - previous.dynamicsIndicators.competitionLevel
    );
    
    if (competitionChange > 0.2) {
      const severity = competitionChange > 0.4 ? 'high' : 'medium';
      
      changes.push({
        id: `competitive-landscape-${Date.now()}`,
        type: 'competitive-landscape',
        severity: severity as any,
        description: `Competitive landscape intensity changed by ${(competitionChange * 100).toFixed(1)}%`,
        detectedAt: new Date().toISOString(),
        impact: {
          tam: 0,
          sam: -competitionChange * 0.5, // Increased competition reduces SAM
          som: -competitionChange // Increased competition significantly reduces SOM
        },
        confidence: 0.7,
        source: 'Competitive analysis',
        recommendations: [
          'Update competitive analysis',
          'Reassess market positioning strategy',
          'Review SOM calculations'
        ],
        requiresRecalculation: severity === 'high'
      });
    }
    
    return changes;
  }

  private detectEconomicShifts(
    previous: MarketConditionSnapshot,
    current: MarketConditionSnapshot
  ): MarketConditionChange[] {
    const changes: MarketConditionChange[] = [];
    
    // Check for significant economic indicator changes
    const gdpChange = Math.abs(current.economicIndicators.gdpGrowth - previous.economicIndicators.gdpGrowth);
    const inflationChange = Math.abs(current.economicIndicators.inflation - previous.economicIndicators.inflation);
    
    if (gdpChange > 0.01 || inflationChange > 0.01) { // 1% change threshold
      const severity = (gdpChange > 0.02 || inflationChange > 0.02) ? 'high' : 'medium';
      
      changes.push({
        id: `economic-shift-${Date.now()}`,
        type: 'economic-shift',
        severity: severity as any,
        description: `Economic conditions changed: GDP growth ${(gdpChange * 100).toFixed(1)}%, inflation ${(inflationChange * 100).toFixed(1)}%`,
        detectedAt: new Date().toISOString(),
        impact: {
          tam: gdpChange * (current.economicIndicators.gdpGrowth > previous.economicIndicators.gdpGrowth ? 1 : -1),
          sam: gdpChange * 0.8 * (current.economicIndicators.gdpGrowth > previous.economicIndicators.gdpGrowth ? 1 : -1),
          som: gdpChange * 0.6 * (current.economicIndicators.gdpGrowth > previous.economicIndicators.gdpGrowth ? 1 : -1)
        },
        confidence: 0.85,
        source: 'Economic indicators',
        recommendations: [
          'Review economic assumptions in market model',
          'Adjust growth projections for economic conditions',
          'Consider scenario planning for economic volatility'
        ],
        requiresRecalculation: severity === 'high'
      });
    }
    
    return changes;
  }

  private generateNotifications(
    marketSizingId: string,
    changes: MarketConditionChange[]
  ): void {
    const highPriorityChanges = changes.filter(c => c.severity === 'critical' || c.severity === 'high');
    
    if (highPriorityChanges.length === 0) return;
    
    const notification: MarketChangeNotification = {
      id: `notification-${marketSizingId}-${Date.now()}`,
      priority: highPriorityChanges.some(c => c.severity === 'critical') ? 'urgent' : 'high',
      title: `Significant Market Changes Detected`,
      message: `${highPriorityChanges.length} significant market condition changes detected that may affect market sizing accuracy.`,
      changes: highPriorityChanges,
      actions: [
        {
          action: 'Review market condition changes',
          priority: 'high',
          estimatedEffort: '30 minutes'
        },
        {
          action: 'Recalculate market sizing',
          priority: 'high',
          estimatedEffort: '4-6 hours',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ],
      createdAt: new Date().toISOString(),
      acknowledged: false
    };
    
    this.notifications.set(notification.id, notification);
  }
}

/**
 * Factory function to create a MarketConditionDetector instance
 */
export function createMarketConditionDetector(
  config?: Partial<MarketMonitoringConfig>
): MarketConditionDetector {
  return new MarketConditionDetector(config);
}

/**
 * Utility function to check multiple market sizings for condition changes
 */
export async function checkMultipleMarketConditions(
  marketSizings: { id: string; result: MarketSizingResult }[],
  config?: Partial<MarketMonitoringConfig>
): Promise<Map<string, MarketConditionChange[]>> {
  const detector = createMarketConditionDetector(config);
  const changesMap = new Map();

  for (const { id, result } of marketSizings) {
    detector.startMonitoring(id, result);
    const changes = await detector.checkForChanges(id);
    changesMap.set(id, changes);
  }

  return changesMap;
}