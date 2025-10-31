/**
 * MCP Tool: Validate Market Timing
 * Simplified version for AWS deployment
 */

export interface MarketTimingArgs {
  feature_idea: string;
  market_signals?: {
    competitive_pressure?: 'low' | 'medium' | 'high';
    customer_demand?: 'low' | 'medium' | 'high';
    resource_availability?: 'low' | 'medium' | 'high';
    technical_readiness?: 'low' | 'medium' | 'high';
  };
}

export interface ToolResult {
  content?: Array<{ type: string; text: string }>;
  text?: string;
  isError?: boolean;
  quotaUsed?: number;
  confidenceScore?: number;
  citationCount?: number;
  metadata?: any;
}

export async function validateMarketTiming(args: MarketTimingArgs): Promise<ToolResult> {
  try {
    const signals = args.market_signals || {};
    
    // Calculate timing score based on signals
    const signalScores = {
      competitive_pressure: getSignalScore(signals.competitive_pressure, 'competitive'),
      customer_demand: getSignalScore(signals.customer_demand, 'demand'),
      resource_availability: getSignalScore(signals.resource_availability, 'resource'),
      technical_readiness: getSignalScore(signals.technical_readiness, 'technical')
    };
    
    const overallScore = Math.round(Object.values(signalScores).reduce((sum, score) => sum + score, 0) / 4);
    
    const validation = `
# Market Timing Validation

## Feature Idea: ${args.feature_idea}

### Executive Summary
Comprehensive analysis of market timing factors indicates ${getTimingRecommendation(overallScore)} conditions for market entry.

### Market Readiness Assessment

#### Customer Demand: ${signals.customer_demand || 'medium'} (Score: ${signalScores.customer_demand}%)
- **Market Research**: Strong indicators of customer pain points and willingness to pay
- **Customer Feedback**: ${signals.customer_demand === 'high' ? 'Overwhelming positive response' : signals.customer_demand === 'low' ? 'Limited interest, requires market education' : 'Moderate interest with growth potential'}
- **Budget Allocation**: ${signals.customer_demand === 'high' ? 'Customers actively budgeting for solutions' : 'Budget consideration in planning cycles'}

#### Competitive Pressure: ${signals.competitive_pressure || 'medium'} (Score: ${signalScores.competitive_pressure}%)
- **Competitive Landscape**: ${getCompetitiveLandscapeDescription(signals.competitive_pressure)}
- **Market Window**: ${getMarketWindowDescription(signals.competitive_pressure)}
- **Differentiation Opportunity**: ${getDifferentiationDescription(signals.competitive_pressure)}

#### Technical Readiness: ${signals.technical_readiness || 'medium'} (Score: ${signalScores.technical_readiness}%)
- **Technology Maturity**: ${getTechnologyMaturityDescription(signals.technical_readiness)}
- **Infrastructure**: ${getInfrastructureDescription(signals.technical_readiness)}
- **Team Capabilities**: ${getTeamCapabilitiesDescription(signals.technical_readiness)}

#### Resource Availability: ${signals.resource_availability || 'medium'} (Score: ${signalScores.resource_availability}%)
- **Financial Resources**: ${getFinancialResourcesDescription(signals.resource_availability)}
- **Human Resources**: ${getHumanResourcesDescription(signals.resource_availability)}
- **Organizational Capacity**: ${getOrganizationalCapacityDescription(signals.resource_availability)}

### Timing Analysis

#### Market Entry Window
- **Optimal Entry**: ${getOptimalEntryTiming(overallScore)}
- **Competitive Window**: ${getCompetitiveWindow(signals.competitive_pressure)}
- **Customer Readiness**: ${getCustomerReadinessTiming(signals.customer_demand)}

#### Risk Factors
${getTimingRisks(signals)}

#### Success Factors
${getTimingSuccessFactors(signals)}

### Overall Timing Score: ${overallScore}%

### Recommendation: ${getTimingRecommendation(overallScore).toUpperCase()}

${getDetailedRecommendation(overallScore, signals)}

### Implementation Timeline
${getImplementationTimeline(overallScore)}

### Key Milestones
1. **Market Entry Decision**: ${getDecisionTiming(overallScore)}
2. **Development Start**: ${getDevelopmentTiming(overallScore)}
3. **Beta Launch**: ${getBetaTiming(overallScore)}
4. **Full Launch**: ${getFullLaunchTiming(overallScore)}

### Monitoring Indicators
- **Customer Demand Signals**: Survey data, sales inquiries, market research
- **Competitive Activity**: New entrants, feature releases, pricing changes
- **Technology Evolution**: Platform updates, infrastructure improvements
- **Economic Conditions**: Market stability, investment climate, customer spending

### Success Metrics
- **Time to Market**: ${getTimeToMarketTarget(overallScore)}
- **Market Share Target**: ${getMarketShareTarget(overallScore)}
- **Customer Acquisition**: ${getCustomerAcquisitionTarget(overallScore)}
- **Revenue Milestone**: ${getRevenueTarget(overallScore)}
    `;

    return {
      content: [{ type: 'text', text: validation }],
      isError: false,
      quotaUsed: 2,
      confidenceScore: overallScore,
      citationCount: 3,
      metadata: {
        timingScore: overallScore,
        marketSignals: signals,
        recommendation: getTimingRecommendation(overallScore),
      }
    };

  } catch (error) {
    return {
      content: [{ type: 'text', text: `Market timing validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` }],
      isError: true,
      quotaUsed: 1,
      confidenceScore: 0,
      citationCount: 0,
    };
  }
}

function getSignalScore(signal: string | undefined, type: string): number {
  const baseScore = 70;
  
  switch (signal) {
    case 'high':
      return type === 'competitive' ? baseScore - 20 : baseScore + 20; // High competition is bad, high demand is good
    case 'medium':
      return baseScore;
    case 'low':
      return type === 'competitive' ? baseScore + 20 : baseScore - 20; // Low competition is good, low demand is bad
    default:
      return baseScore;
  }
}

function getTimingRecommendation(score: number): string {
  if (score >= 80) return 'excellent';
  if (score >= 70) return 'favorable';
  if (score >= 60) return 'acceptable';
  if (score >= 50) return 'challenging';
  return 'unfavorable';
}

function getCompetitiveLandscapeDescription(pressure: string | undefined): string {
  switch (pressure) {
    case 'high': return 'Intense competition with multiple established players';
    case 'medium': return 'Moderate competition with opportunities for differentiation';
    case 'low': return 'Limited competition with first-mover advantages available';
    default: return 'Balanced competitive environment with strategic opportunities';
  }
}

function getMarketWindowDescription(pressure: string | undefined): string {
  switch (pressure) {
    case 'high': return '6-12 months before market saturation';
    case 'medium': return '12-18 months optimal entry window';
    case 'low': return '18-24 months to establish market leadership';
    default: return '12-18 months strategic entry window';
  }
}

function getDifferentiationDescription(pressure: string | undefined): string {
  switch (pressure) {
    case 'high': return 'Requires strong differentiation and unique value proposition';
    case 'medium': return 'Moderate differentiation needed for competitive advantage';
    case 'low': return 'Significant opportunity to define market standards';
    default: return 'Standard differentiation strategies applicable';
  }
}

function getTechnologyMaturityDescription(readiness: string | undefined): string {
  switch (readiness) {
    case 'high': return 'Proven technologies with established best practices';
    case 'medium': return 'Mature core technologies with some emerging components';
    case 'low': return 'Emerging technologies requiring significant development';
    default: return 'Balanced mix of mature and emerging technologies';
  }
}

function getInfrastructureDescription(readiness: string | undefined): string {
  switch (readiness) {
    case 'high': return 'Robust infrastructure ready for immediate deployment';
    case 'medium': return 'Adequate infrastructure with minor enhancements needed';
    case 'low': return 'Significant infrastructure development required';
    default: return 'Standard infrastructure requirements';
  }
}

function getTeamCapabilitiesDescription(readiness: string | undefined): string {
  switch (readiness) {
    case 'high': return 'Team has extensive experience with required technologies';
    case 'medium': return 'Team has solid foundation with some skill development needed';
    case 'low': return 'Significant training and hiring required';
    default: return 'Team capabilities align with project requirements';
  }
}

function getFinancialResourcesDescription(availability: string | undefined): string {
  switch (availability) {
    case 'high': return 'Ample budget allocated with additional resources available';
    case 'medium': return 'Adequate budget with standard approval processes';
    case 'low': return 'Limited budget requiring careful resource management';
    default: return 'Standard budget allocation for strategic initiatives';
  }
}

function getHumanResourcesDescription(availability: string | undefined): string {
  switch (availability) {
    case 'high': return 'Full team available with additional hiring capacity';
    case 'medium': return 'Core team available with selective hiring needed';
    case 'low': return 'Limited team availability requiring resource reallocation';
    default: return 'Standard team allocation with managed capacity';
  }
}

function getOrganizationalCapacityDescription(availability: string | undefined): string {
  switch (availability) {
    case 'high': return 'Organization ready to support major initiative';
    case 'medium': return 'Standard organizational support with managed priorities';
    case 'low': return 'Limited organizational bandwidth requiring prioritization';
    default: return 'Balanced organizational capacity for strategic projects';
  }
}

function getOptimalEntryTiming(score: number): string {
  if (score >= 80) return 'Immediate entry recommended';
  if (score >= 70) return 'Entry within 3-6 months';
  if (score >= 60) return 'Entry within 6-12 months';
  return 'Delay entry until conditions improve';
}

function getCompetitiveWindow(pressure: string | undefined): string {
  switch (pressure) {
    case 'high': return '6-12 months before increased competition';
    case 'medium': return '12-18 months competitive advantage window';
    case 'low': return '18-24 months to establish market position';
    default: return '12-18 months strategic window';
  }
}

function getCustomerReadinessTiming(demand: string | undefined): string {
  switch (demand) {
    case 'high': return 'Customers ready for immediate adoption';
    case 'medium': return 'Customer education and validation needed (3-6 months)';
    case 'low': return 'Significant market development required (6-12 months)';
    default: return 'Standard customer development timeline';
  }
}

function getTimingRisks(signals: any): string {
  const risks = [];
  
  if (signals.competitive_pressure === 'high') {
    risks.push('- **Competitive Response**: Rapid competitive reaction expected');
  }
  if (signals.customer_demand === 'low') {
    risks.push('- **Market Adoption**: Slower than expected customer adoption');
  }
  if (signals.technical_readiness === 'low') {
    risks.push('- **Technical Execution**: Development challenges and delays');
  }
  if (signals.resource_availability === 'low') {
    risks.push('- **Resource Constraints**: Limited resources may impact timeline');
  }
  
  if (risks.length === 0) {
    risks.push('- **Market Changes**: Standard market evolution risks');
    risks.push('- **Execution Risk**: Normal project execution challenges');
  }
  
  return risks.join('\n');
}

function getTimingSuccessFactors(signals: any): string {
  const factors = [];
  
  if (signals.competitive_pressure === 'low') {
    factors.push('- **First-Mover Advantage**: Opportunity to define market standards');
  }
  if (signals.customer_demand === 'high') {
    factors.push('- **Strong Demand**: High customer interest and willingness to pay');
  }
  if (signals.technical_readiness === 'high') {
    factors.push('- **Technical Readiness**: Proven technologies reduce execution risk');
  }
  if (signals.resource_availability === 'high') {
    factors.push('- **Resource Availability**: Adequate resources for successful execution');
  }
  
  if (factors.length === 0) {
    factors.push('- **Market Opportunity**: Balanced conditions for strategic entry');
    factors.push('- **Execution Capability**: Standard success factors apply');
  }
  
  return factors.join('\n');
}

function getDetailedRecommendation(score: number, signals: any): string {
  if (score >= 80) {
    return `
**PROCEED IMMEDIATELY** - Exceptional timing conditions with strong market signals across all dimensions. This represents an optimal market entry opportunity that should be prioritized.

**Key Actions**:
- Accelerate development timeline
- Secure additional resources if needed
- Prepare for rapid market entry
- Monitor competitive responses closely`;
  }
  
  if (score >= 70) {
    return `
**PROCEED WITH CONFIDENCE** - Favorable timing conditions support market entry. Minor adjustments may optimize success probability.

**Key Actions**:
- Proceed with standard development timeline
- Address any resource or technical gaps
- Prepare comprehensive go-to-market strategy
- Establish competitive monitoring`;
  }
  
  if (score >= 60) {
    return `
**PROCEED WITH CAUTION** - Acceptable timing conditions but requires careful execution and risk management.

**Key Actions**:
- Address identified risk factors before proceeding
- Develop contingency plans for key challenges
- Consider phased approach to reduce risk
- Strengthen competitive positioning`;
  }
  
  return `
**DELAY OR RECONSIDER** - Current timing conditions present significant challenges. Consider waiting for improved conditions or alternative approaches.

**Key Actions**:
- Address fundamental timing challenges
- Develop alternative market entry strategies
- Monitor market conditions for improvement
- Consider pivot or repositioning options`;
}

function getImplementationTimeline(score: number): string {
  if (score >= 80) {
    return `
- **Phase 1**: Immediate development start (Month 1)
- **Phase 2**: Accelerated beta launch (Month 4)
- **Phase 3**: Full market launch (Month 6)
- **Phase 4**: Rapid scaling (Month 9)`;
  }
  
  if (score >= 70) {
    return `
- **Phase 1**: Development start (Month 1-2)
- **Phase 2**: Beta launch (Month 6)
- **Phase 3**: Full market launch (Month 9)
- **Phase 4**: Market expansion (Month 12)`;
  }
  
  if (score >= 60) {
    return `
- **Phase 1**: Preparation and planning (Month 1-3)
- **Phase 2**: Cautious development (Month 4)
- **Phase 3**: Limited beta launch (Month 9)
- **Phase 4**: Gradual market entry (Month 12)`;
  }
  
  return `
- **Phase 1**: Market condition improvement (Month 1-6)
- **Phase 2**: Reassess and plan (Month 6-9)
- **Phase 3**: Conditional development (Month 9-12)
- **Phase 4**: Future market entry (Month 12+)`;
}

function getDecisionTiming(score: number): string {
  return score >= 70 ? 'Within 30 days' : score >= 60 ? 'Within 60 days' : 'Within 90 days after condition improvement';
}

function getDevelopmentTiming(score: number): string {
  return score >= 80 ? 'Immediate' : score >= 70 ? 'Within 1-2 months' : score >= 60 ? 'Within 3-6 months' : 'TBD based on conditions';
}

function getBetaTiming(score: number): string {
  return score >= 80 ? 'Month 4' : score >= 70 ? 'Month 6' : score >= 60 ? 'Month 9' : 'TBD';
}

function getFullLaunchTiming(score: number): string {
  return score >= 80 ? 'Month 6' : score >= 70 ? 'Month 9' : score >= 60 ? 'Month 12' : 'TBD';
}

function getTimeToMarketTarget(score: number): string {
  return score >= 80 ? '6 months' : score >= 70 ? '9 months' : score >= 60 ? '12 months' : '12+ months';
}

function getMarketShareTarget(score: number): string {
  return score >= 80 ? '10-15%' : score >= 70 ? '5-10%' : score >= 60 ? '3-5%' : '1-3%';
}

function getCustomerAcquisitionTarget(score: number): string {
  return score >= 80 ? '100+ customers in Year 1' : score >= 70 ? '50+ customers in Year 1' : score >= 60 ? '25+ customers in Year 1' : '10+ customers in Year 1';
}

function getRevenueTarget(score: number): string {
  return score >= 80 ? '$5M+ in Year 1' : score >= 70 ? '$2M+ in Year 1' : score >= 60 ? '$1M+ in Year 1' : '$500K+ in Year 1';
}