/**
 * Amazon Working Backwards Configuration
 * 
 * Configuration options for toggling between standard and Amazon modes
 * while maintaining backward compatibility with existing API contracts
 */

export interface AmazonModeConfig {
  /** Enable Amazon Working Backwards methodology by default */
  enabled: boolean;
  
  /** Fallback to standard mode if Amazon mechanisms fail */
  fallbackToStandard: boolean;
  
  /** Include Amazon evidence mechanisms in all outputs */
  includeEvidenceMechanisms: boolean;
  
  /** Performance thresholds for Amazon mechanisms */
  performanceThresholds: {
    /** Maximum time for assumption ledger generation (ms) */
    assumptionLedgerTimeout: number;
    
    /** Maximum time for confidence scoring (ms) */
    confidenceTimeout: number;
    
    /** Maximum time for scenario analysis (ms) */
    scenarioTimeout: number;
    
    /** Maximum time for hard questions generation (ms) */
    hardQuestionsTimeout: number;
    
    /** Maximum total generation time (ms) */
    totalTimeout: number;
  };
  
  /** Evidence mechanism configuration */
  evidenceMechanisms: {
    /** Enable assumption ledger */
    assumptionLedger: boolean;
    
    /** Enable confidence scoring */
    confidenceScoring: boolean;
    
    /** Enable scenario analysis */
    scenarioAnalysis: boolean;
    
    /** Enable hard questions generation */
    hardQuestions: boolean;
    
    /** Minimum confidence threshold for recommendations */
    minConfidenceThreshold: number;
  };
  
  /** Template configuration */
  templates: {
    /** Use Amazon templates by default */
    useAmazonTemplates: boolean;
    
    /** Include mechanism sections in standard templates */
    enhanceStandardTemplates: boolean;
    
    /** Template selection strategy */
    selectionStrategy: 'amazon_first' | 'standard_first' | 'auto_detect';
  };
  
  /** Steering integration configuration */
  steering: {
    /** Auto-create steering files with Amazon front-matter */
    autoCreateSteering: boolean;
    
    /** Use Amazon profile in steering files */
    useAmazonProfile: boolean;
    
    /** Include mechanism attachments */
    includeMechanismAttachments: boolean;
  };
}

/**
 * Default Amazon mode configuration
 * Enables Amazon methodology by default with graceful fallback
 */
export const DEFAULT_AMAZON_CONFIG: AmazonModeConfig = {
  enabled: true,
  fallbackToStandard: true,
  includeEvidenceMechanisms: true,
  
  performanceThresholds: {
    assumptionLedgerTimeout: 5000,    // 5 seconds
    confidenceTimeout: 3000,          // 3 seconds
    scenarioTimeout: 4000,            // 4 seconds
    hardQuestionsTimeout: 3000,       // 3 seconds
    totalTimeout: 120000,             // 2 minutes
  },
  
  evidenceMechanisms: {
    assumptionLedger: true,
    confidenceScoring: true,
    scenarioAnalysis: true,
    hardQuestions: true,
    minConfidenceThreshold: 60,
  },
  
  templates: {
    useAmazonTemplates: true,
    enhanceStandardTemplates: true,
    selectionStrategy: 'amazon_first',
  },
  
  steering: {
    autoCreateSteering: true,
    useAmazonProfile: true,
    includeMechanismAttachments: true,
  },
};

/**
 * Standard mode configuration (legacy behavior)
 * Disables Amazon methodology for backward compatibility
 */
export const STANDARD_MODE_CONFIG: AmazonModeConfig = {
  enabled: false,
  fallbackToStandard: true,
  includeEvidenceMechanisms: false,
  
  performanceThresholds: {
    assumptionLedgerTimeout: 0,
    confidenceTimeout: 0,
    scenarioTimeout: 0,
    hardQuestionsTimeout: 0,
    totalTimeout: 60000,              // 1 minute for standard mode
  },
  
  evidenceMechanisms: {
    assumptionLedger: false,
    confidenceScoring: false,
    scenarioAnalysis: false,
    hardQuestions: false,
    minConfidenceThreshold: 0,
  },
  
  templates: {
    useAmazonTemplates: false,
    enhanceStandardTemplates: false,
    selectionStrategy: 'standard_first',
  },
  
  steering: {
    autoCreateSteering: false,
    useAmazonProfile: false,
    includeMechanismAttachments: false,
  },
};

/**
 * Configuration mode type for easy switching
 */
export type ConfigurationMode = 'amazon' | 'standard' | 'hybrid';

/**
 * Get configuration for specified mode
 */
export function getConfigForMode(mode: ConfigurationMode): AmazonModeConfig {
  switch (mode) {
    case 'amazon':
      return DEFAULT_AMAZON_CONFIG;
    case 'standard':
      return STANDARD_MODE_CONFIG;
    case 'hybrid':
      return {
        ...DEFAULT_AMAZON_CONFIG,
        fallbackToStandard: true,
        templates: {
          ...DEFAULT_AMAZON_CONFIG.templates,
          selectionStrategy: 'auto_detect',
        },
      };
    default:
      return DEFAULT_AMAZON_CONFIG;
  }
}

/**
 * Environment variable configuration
 * Allows runtime configuration via environment variables
 */
export function getConfigFromEnvironment(): Partial<AmazonModeConfig> {
  const config: Partial<AmazonModeConfig> = {};
  
  // Check for mode override
  const mode = process.env.VIBE_PM_MODE as ConfigurationMode;
  if (mode && ['amazon', 'standard', 'hybrid'].includes(mode)) {
    return getConfigForMode(mode);
  }
  
  // Individual configuration overrides
  if (process.env.VIBE_PM_AMAZON_ENABLED !== undefined) {
    config.enabled = process.env.VIBE_PM_AMAZON_ENABLED === 'true';
  }
  
  if (process.env.VIBE_PM_FALLBACK_ENABLED !== undefined) {
    config.fallbackToStandard = process.env.VIBE_PM_FALLBACK_ENABLED === 'true';
  }
  
  if (process.env.VIBE_PM_EVIDENCE_MECHANISMS !== undefined) {
    config.includeEvidenceMechanisms = process.env.VIBE_PM_EVIDENCE_MECHANISMS === 'true';
  }
  
  return config;
}

/**
 * Merge configuration with defaults
 */
export function mergeConfig(
  baseConfig: AmazonModeConfig = DEFAULT_AMAZON_CONFIG,
  overrides: Partial<AmazonModeConfig> = {}
): AmazonModeConfig {
  return {
    ...baseConfig,
    ...overrides,
    performanceThresholds: {
      ...baseConfig.performanceThresholds,
      ...overrides.performanceThresholds,
    },
    evidenceMechanisms: {
      ...baseConfig.evidenceMechanisms,
      ...overrides.evidenceMechanisms,
    },
    templates: {
      ...baseConfig.templates,
      ...overrides.templates,
    },
    steering: {
      ...baseConfig.steering,
      ...overrides.steering,
    },
  };
}