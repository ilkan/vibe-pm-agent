/**
 * NVIDIA NIM Security Configuration
 * 
 * Centralized configuration for security and compliance features
 * in the NVIDIA NIM Agentic Platform
 */

import { 
  generateSecurityConfig, 
  generateCredentialConfig,
  DEFAULT_IAM_ROLE_CONFIG,
  SecurityComplianceOptions,
  NIMCredentialManagerOptions
} from '../models/security-compliance.js';

export interface NIMSecurityConfig {
  environment: 'development' | 'staging' | 'production';
  security: SecurityComplianceOptions;
  credentials: NIMCredentialManagerOptions;
  aws: {
    region: string;
    credentialsPath: string;
    iamRoleArn?: string;
  };
  nvidia: {
    apiEndpoint: string;
    credentialsPath?: string;
  };
  monitoring: {
    enableCloudWatch: boolean;
    enableXRayTracing: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Get security configuration for specific environment
 */
export function getNIMSecurityConfig(
  environment: 'development' | 'staging' | 'production',
  overrides?: Partial<NIMSecurityConfig>
): NIMSecurityConfig {
  const awsCredentialsPath = overrides?.aws?.credentialsPath || getDefaultAWSCredentialsPath();
  
  const baseConfig: NIMSecurityConfig = {
    environment,
    security: generateSecurityConfig(environment),
    credentials: generateCredentialConfig(awsCredentialsPath, environment),
    aws: {
      region: process.env.AWS_REGION || 'us-west-2',
      credentialsPath: awsCredentialsPath,
      iamRoleArn: process.env.AWS_IAM_ROLE_ARN || DEFAULT_IAM_ROLE_CONFIG.roleArn
    },
    nvidia: {
      apiEndpoint: process.env.NVIDIA_NIM_ENDPOINT || 'https://api.nvidia.com/v1',
      credentialsPath: process.env.NVIDIA_NIM_CREDENTIALS_PATH
    },
    monitoring: {
      enableCloudWatch: environment === 'production',
      enableXRayTracing: environment !== 'development',
      logLevel: environment === 'development' ? 'debug' : 'info'
    }
  };

  // Apply environment-specific overrides
  switch (environment) {
    case 'development':
      baseConfig.security.encryptionEnabled = false;
      baseConfig.security.complianceChecksEnabled = false;
      baseConfig.credentials.rotationConfig.enabled = false;
      baseConfig.monitoring.logLevel = 'debug';
      break;
      
    case 'staging':
      baseConfig.security.complianceChecksEnabled = true;
      baseConfig.credentials.rotationConfig.autoRotate = false;
      baseConfig.monitoring.enableCloudWatch = true;
      break;
      
    case 'production':
      baseConfig.security.complianceChecksEnabled = true;
      baseConfig.credentials.rotationConfig.autoRotate = true;
      baseConfig.monitoring.enableCloudWatch = true;
      baseConfig.monitoring.enableXRayTracing = true;
      break;
  }

  // Apply custom overrides
  if (overrides) {
    return mergeConfigs(baseConfig, overrides);
  }

  return baseConfig;
}

/**
 * Get default AWS credentials path based on environment
 */
function getDefaultAWSCredentialsPath(): string {
  // Check for environment-specific paths
  if (process.env.AWS_CREDENTIALS_PATH) {
    return process.env.AWS_CREDENTIALS_PATH;
  }

  // Default paths based on project structure
  const paths = [
    '.aws/credentials',
    'bedrock-agentcore/.aws',
    '~/.aws/credentials'
  ];

  return paths[0]; // Default to project-local credentials
}

/**
 * Merge configuration objects deeply
 */
function mergeConfigs(base: NIMSecurityConfig, overrides: Partial<NIMSecurityConfig>): NIMSecurityConfig {
  const merged = { ...base };

  if (overrides.security) {
    merged.security = { ...merged.security, ...overrides.security };
  }

  if (overrides.credentials) {
    merged.credentials = { ...merged.credentials, ...overrides.credentials };
    
    if (overrides.credentials.rotationConfig) {
      merged.credentials.rotationConfig = {
        ...merged.credentials.rotationConfig,
        ...overrides.credentials.rotationConfig
      };
    }
  }

  if (overrides.aws) {
    merged.aws = { ...merged.aws, ...overrides.aws };
  }

  if (overrides.nvidia) {
    merged.nvidia = { ...merged.nvidia, ...overrides.nvidia };
  }

  if (overrides.monitoring) {
    merged.monitoring = { ...merged.monitoring, ...overrides.monitoring };
  }

  return merged;
}

/**
 * Validate security configuration
 */
export function validateNIMSecurityConfig(config: NIMSecurityConfig): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate AWS configuration
  if (!config.aws.credentialsPath) {
    errors.push('AWS credentials path is required');
  }

  if (!config.aws.region) {
    errors.push('AWS region is required');
  }

  // Validate NVIDIA configuration
  if (!config.nvidia.apiEndpoint) {
    errors.push('NVIDIA NIM API endpoint is required');
  }

  // Validate security settings for production
  if (config.environment === 'production') {
    if (!config.security.encryptionEnabled) {
      errors.push('Encryption must be enabled in production');
    }

    if (!config.security.auditLoggingEnabled) {
      errors.push('Audit logging must be enabled in production');
    }

    if (!config.security.complianceChecksEnabled) {
      warnings.push('Compliance checks should be enabled in production');
    }

    if (!config.credentials.rotationConfig.enabled) {
      warnings.push('Credential rotation should be enabled in production');
    }
  }

  // Validate monitoring settings
  if (config.environment === 'production' && !config.monitoring.enableCloudWatch) {
    warnings.push('CloudWatch monitoring should be enabled in production');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get security configuration from environment variables
 */
export function getSecurityConfigFromEnv(): Partial<NIMSecurityConfig> {
  const config: Partial<NIMSecurityConfig> = {};

  // AWS configuration
  if (process.env.AWS_REGION || process.env.AWS_CREDENTIALS_PATH || process.env.AWS_IAM_ROLE_ARN) {
    config.aws = {
      region: process.env.AWS_REGION || 'us-west-2',
      credentialsPath: process.env.AWS_CREDENTIALS_PATH || '.aws/credentials',
      iamRoleArn: process.env.AWS_IAM_ROLE_ARN
    };
  }

  // NVIDIA configuration
  if (process.env.NVIDIA_NIM_ENDPOINT || process.env.NVIDIA_NIM_CREDENTIALS_PATH) {
    config.nvidia = {
      apiEndpoint: process.env.NVIDIA_NIM_ENDPOINT || 'https://api.nvidia.com/v1',
      credentialsPath: process.env.NVIDIA_NIM_CREDENTIALS_PATH
    };
  }

  // Security configuration
  if (process.env.ENCRYPTION_KEY || process.env.AUDIT_LOGGING_ENABLED || process.env.PII_HANDLING_ENABLED) {
    config.security = {
      encryptionKey: process.env.ENCRYPTION_KEY || '',
      auditLoggingEnabled: process.env.AUDIT_LOGGING_ENABLED === 'true',
      piiHandlingEnabled: process.env.PII_HANDLING_ENABLED === 'true',
      encryptionEnabled: process.env.ENCRYPTION_ENABLED === 'true',
      complianceChecksEnabled: process.env.COMPLIANCE_CHECKS_ENABLED === 'true',
      dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '90'),
      complianceStandards: []
    };
  }

  // Monitoring configuration
  if (process.env.CLOUDWATCH_ENABLED || process.env.XRAY_TRACING_ENABLED || process.env.LOG_LEVEL) {
    config.monitoring = {
      enableCloudWatch: process.env.CLOUDWATCH_ENABLED === 'true',
      enableXRayTracing: process.env.XRAY_TRACING_ENABLED === 'true',
      logLevel: (process.env.LOG_LEVEL as any) || 'info'
    };
  }

  return config;
}

/**
 * Export default configurations for each environment
 */
export const DEVELOPMENT_CONFIG = getNIMSecurityConfig('development');
export const STAGING_CONFIG = getNIMSecurityConfig('staging');
export const PRODUCTION_CONFIG = getNIMSecurityConfig('production');

/**
 * Get configuration based on NODE_ENV
 */
export function getCurrentEnvironmentConfig(overrides?: Partial<NIMSecurityConfig>): NIMSecurityConfig {
  const environment = (process.env.NODE_ENV as any) || 'development';
  const envOverrides = getSecurityConfigFromEnv();
  
  const combinedOverrides = overrides 
    ? mergeConfigs(envOverrides as NIMSecurityConfig, overrides)
    : envOverrides;

  return getNIMSecurityConfig(environment, combinedOverrides);
}