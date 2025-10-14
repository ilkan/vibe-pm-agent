// Export all model interfaces for easy importing

export * from './intent';
export * from './workflow';
export * from './quota';
export * from './spec';
export * from './consulting';
export * from './mcp';
export * from './steering';
export * from './competitive';
export * from './market-data';
export * from './audit';
export * from './interview';

// Selective exports from proprietary-frameworks to avoid conflicts
export {
  ProprietaryPMFramework,
  MarketTimingSignal,
  InnovationIndex,
  CompetitiveIntelligenceMatrix,
  MarketOpportunityScore,
  ConfidenceIntervals as PMConfidenceIntervals,
  ConfidenceInterval as PMConfidenceInterval,
} from './proprietary-frameworks';
