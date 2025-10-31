/**
 * Security and Compliance Data Models
 * 
 * Data models and configuration for NVIDIA NIM security and compliance features
 */

import {
  SecurityComplianceOptions,
  ComplianceStandard,
  ComplianceRequirement,
  AuditEvent,
  ComplianceCheckResult,
  SecurityIncident,
  PIIDetectionResult,
  PIILocation,
  LicenseValidationResult,
  ThirdPartyLicense
} from '../components/nvidia-nim-security-compliance/index.js';

import {
  NIMCredentialManagerOptions,
  AWSCredentials,
  NIMCredentials,
  CredentialRotationConfig,
  IAMRoleConfig,
  CredentialValidationResult
} from '../components/nvidia-nim-credential-manager/index.js';

// ============================================================================
// Default Security Configuration
// ============================================================================

/**
 * Default security and compliance configuration for NVIDIA NIM platform
 */
export const DEFAULT_SECURITY_CONFIG: SecurityComplianceOptions = {
  auditLoggingEnabled: true,
  encryptionEnabled: true,
  piiHandlingEnabled: true,
  complianceChecksEnabled: true,
  dataRetentionDays: 90,
  encryptionKey: '', // Must be provided at runtime
  complianceStandards: [] // Will be populated by the manager
};

/**
 * Default credential management configuration
 */
export const DEFAULT_CREDENTIAL_CONFIG: Omit<NIMCredentialManagerOptions, 'encryptionKey' | 'awsCredentialsPath'> = {
  auditLogging: true,
  maxRetentionDays: 90,
  requireApprovalForAccess: false,
  encryptionConfig: {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2',
    iterations: 100000,
    saltLength: 32,
    ivLength: 16
  },
  rotationConfig: {
    enabled: true,
    intervalDays: 90,
    warningDays: 7,
    autoRotate: false,
    notificationEndpoints: []
  },
  accessControlEnabled: true
};

/**
 * Default IAM role configuration for AWS services
 */
export const DEFAULT_IAM_ROLE_CONFIG: IAMRoleConfig = {
  roleArn: '', // Must be provided at runtime
  sessionName: 'nvidia-nim-platform',
  durationSeconds: 3600, // 1 hour
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'bedrock:InvokeAgent',
          'bedrock:InvokeModel',
          'bedrock:GetAgent',
          'bedrock:ListAgents'
        ],
        Resource: '*'
      },
      {
        Effect: 'Allow',
        Action: [
          'lambda:InvokeFunction',
          'lambda:GetFunction'
        ],
        Resource: 'arn:aws:lambda:*:*:function:vibe-pm-agent-*'
      },
      {
        Effect: 'Allow',
        Action: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents'
        ],
        Resource: 'arn:aws:logs:*:*:*'
      }
    ]
  })
};

// ============================================================================
// Security Policy Templates
// ============================================================================

/**
 * Security policy templates for different environments
 */
export const SECURITY_POLICY_TEMPLATES = {
  development: {
    auditLoggingEnabled: true,
    encryptionEnabled: false, // Disabled for easier debugging
    piiHandlingEnabled: true,
    complianceChecksEnabled: false,
    dataRetentionDays: 30,
    rotationConfig: {
      enabled: false,
      intervalDays: 180,
      warningDays: 14,
      autoRotate: false,
      notificationEndpoints: []
    }
  },
  
  staging: {
    auditLoggingEnabled: true,
    encryptionEnabled: true,
    piiHandlingEnabled: true,
    complianceChecksEnabled: true,
    dataRetentionDays: 60,
    rotationConfig: {
      enabled: true,
      intervalDays: 120,
      warningDays: 10,
      autoRotate: false,
      notificationEndpoints: ['security-team@company.com']
    }
  },
  
  production: {
    auditLoggingEnabled: true,
    encryptionEnabled: true,
    piiHandlingEnabled: true,
    complianceChecksEnabled: true,
    dataRetentionDays: 365,
    rotationConfig: {
      enabled: true,
      intervalDays: 90,
      warningDays: 7,
      autoRotate: true,
      notificationEndpoints: [
        'security-team@company.com',
        'compliance-team@company.com'
      ]
    }
  }
};

// ============================================================================
// Compliance Framework Definitions
// ============================================================================

/**
 * GDPR compliance requirements
 */
export const GDPR_COMPLIANCE_STANDARD: ComplianceStandard = {
  name: 'GDPR',
  version: '2018',
  enabled: true,
  requirements: [
    {
      id: 'gdpr-article-32',
      description: 'Security of processing - appropriate technical and organisational measures',
      category: 'data_protection',
      severity: 'critical',
      checkFunction: 'checkDataProtectionMeasures',
      remediation: 'Implement encryption, pseudonymisation, and access controls'
    },
    {
      id: 'gdpr-article-30',
      description: 'Records of processing activities must be maintained',
      category: 'audit_logging',
      severity: 'high',
      checkFunction: 'checkProcessingRecords',
      remediation: 'Maintain comprehensive audit logs of all data processing activities'
    },
    {
      id: 'gdpr-article-25',
      description: 'Data protection by design and by default',
      category: 'data_protection',
      severity: 'high',
      checkFunction: 'checkDataProtectionByDesign',
      remediation: 'Implement privacy-preserving defaults and data minimization'
    }
  ]
};

/**
 * SOC 2 Type II compliance requirements
 */
export const SOC2_COMPLIANCE_STANDARD: ComplianceStandard = {
  name: 'SOC2',
  version: '2017',
  enabled: true,
  requirements: [
    {
      id: 'soc2-cc6.1',
      description: 'Logical and physical access controls restrict access to systems',
      category: 'access_control',
      severity: 'critical',
      checkFunction: 'checkAccessControls',
      remediation: 'Implement role-based access control and multi-factor authentication'
    },
    {
      id: 'soc2-cc6.7',
      description: 'Data transmission and disposal controls',
      category: 'encryption',
      severity: 'high',
      checkFunction: 'checkDataTransmissionSecurity',
      remediation: 'Encrypt data in transit and implement secure disposal procedures'
    },
    {
      id: 'soc2-cc7.2',
      description: 'System monitoring and logging',
      category: 'audit_logging',
      severity: 'high',
      checkFunction: 'checkSystemMonitoring',
      remediation: 'Implement comprehensive system monitoring and log analysis'
    }
  ]
};

/**
 * NVIDIA NIM specific compliance requirements
 */
export const NVIDIA_NIM_COMPLIANCE_STANDARD: ComplianceStandard = {
  name: 'NVIDIA_NIM_TERMS',
  version: '2024',
  enabled: true,
  requirements: [
    {
      id: 'nim-terms-2.1',
      description: 'API usage must comply with rate limits and usage restrictions',
      category: 'licensing',
      severity: 'high',
      checkFunction: 'checkNIMUsageCompliance',
      remediation: 'Implement rate limiting and usage monitoring for NVIDIA NIM APIs'
    },
    {
      id: 'nim-terms-3.2',
      description: 'Data sent to NIM services must not contain sensitive personal information',
      category: 'data_protection',
      severity: 'critical',
      checkFunction: 'checkNIMDataSanitization',
      remediation: 'Implement data anonymization before sending to NVIDIA NIM services'
    },
    {
      id: 'nim-terms-4.1',
      description: 'Attribution and usage reporting requirements',
      category: 'licensing',
      severity: 'medium',
      checkFunction: 'checkNIMAttribution',
      remediation: 'Ensure proper attribution and implement usage reporting'
    }
  ]
};

// ============================================================================
// Security Incident Templates
// ============================================================================

/**
 * Security incident response templates
 */
export const SECURITY_INCIDENT_TEMPLATES = {
  unauthorized_access: {
    severity: 'high' as const,
    description: 'Unauthorized access attempt detected',
    immediateActions: [
      'Lock affected user account',
      'Review access logs',
      'Check for privilege escalation',
      'Notify security team'
    ],
    investigationSteps: [
      'Analyze authentication logs',
      'Check for lateral movement',
      'Review system integrity',
      'Identify attack vector'
    ]
  },
  
  data_breach: {
    severity: 'critical' as const,
    description: 'Potential data breach detected',
    immediateActions: [
      'Isolate affected systems',
      'Preserve evidence',
      'Notify incident response team',
      'Begin containment procedures'
    ],
    investigationSteps: [
      'Assess scope of breach',
      'Identify compromised data',
      'Determine root cause',
      'Prepare regulatory notifications'
    ]
  },
  
  policy_violation: {
    severity: 'medium' as const,
    description: 'Security policy violation detected',
    immediateActions: [
      'Document violation details',
      'Notify user and manager',
      'Review policy compliance',
      'Implement corrective measures'
    ],
    investigationSteps: [
      'Review policy framework',
      'Assess training needs',
      'Update controls if needed',
      'Monitor for recurrence'
    ]
  }
};

// ============================================================================
// PII Detection Patterns
// ============================================================================

/**
 * PII detection patterns and configurations
 */
export const PII_DETECTION_PATTERNS = {
  email: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    confidence: 0.9,
    anonymizationRequired: true
  },
  
  phone: {
    pattern: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    confidence: 0.8,
    anonymizationRequired: true
  },
  
  ssn: {
    pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    confidence: 0.95,
    anonymizationRequired: true
  },
  
  credit_card: {
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    confidence: 0.9,
    anonymizationRequired: true
  },
  
  ip_address: {
    pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    confidence: 0.7,
    anonymizationRequired: false
  },
  
  api_key: {
    pattern: /[A-Za-z0-9]{32,}/g,
    confidence: 0.6,
    anonymizationRequired: true
  }
};

// ============================================================================
// Encryption Configuration
// ============================================================================

/**
 * Encryption configuration templates
 */
export const ENCRYPTION_CONFIGS = {
  standard: {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2',
    iterations: 100000,
    saltLength: 32,
    ivLength: 16
  },
  
  high_security: {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'argon2',
    iterations: 200000,
    saltLength: 64,
    ivLength: 16
  },
  
  performance_optimized: {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'scrypt',
    iterations: 50000,
    saltLength: 32,
    ivLength: 16
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate random encryption key
 */
function generateRandomKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate security configuration for environment
 */
export function generateSecurityConfig(
  environment: 'development' | 'staging' | 'production',
  customOptions?: Partial<SecurityComplianceOptions>
): SecurityComplianceOptions {
  const baseConfig = SECURITY_POLICY_TEMPLATES[environment];
  const encryptionKey = process.env.ENCRYPTION_KEY || generateRandomKey();
  
  return {
    ...DEFAULT_SECURITY_CONFIG,
    ...baseConfig,
    encryptionKey,
    complianceStandards: [
      GDPR_COMPLIANCE_STANDARD,
      SOC2_COMPLIANCE_STANDARD,
      NVIDIA_NIM_COMPLIANCE_STANDARD
    ],
    ...customOptions
  };
}

/**
 * Generate credential management configuration
 */
export function generateCredentialConfig(
  awsCredentialsPath: string,
  environment: 'development' | 'staging' | 'production',
  customOptions?: Partial<NIMCredentialManagerOptions>
): NIMCredentialManagerOptions {
  const securityConfig = generateSecurityConfig(environment);
  const rotationConfig = SECURITY_POLICY_TEMPLATES[environment].rotationConfig;
  
  return {
    ...DEFAULT_CREDENTIAL_CONFIG,
    awsCredentialsPath,
    encryptionKey: securityConfig.encryptionKey,
    rotationConfig: rotationConfig as CredentialRotationConfig,
    ...customOptions
  };
}

/**
 * Validate security configuration
 */
export function validateSecurityConfig(config: Partial<SecurityComplianceOptions>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.encryptionKey) {
    errors.push('Encryption key is required');
  } else if (config.encryptionKey.length < 64) {
    warnings.push('Encryption key should be at least 64 characters for optimal security');
  }

  if (config.dataRetentionDays && config.dataRetentionDays < 30) {
    warnings.push('Data retention period less than 30 days may not meet compliance requirements');
  }

  if (config.encryptionEnabled && !config.auditLoggingEnabled) {
    warnings.push('Audit logging should be enabled when encryption is enabled for compliance');
  }

  if (config.complianceChecksEnabled && (!config.complianceStandards || config.complianceStandards.length === 0)) {
    errors.push('Compliance standards must be defined when compliance checks are enabled');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get compliance requirements by category
 */
export function getComplianceRequirementsByCategory(
  standards: ComplianceStandard[],
  category: ComplianceRequirement['category']
): ComplianceRequirement[] {
  return standards
    .flatMap(standard => standard.requirements)
    .filter(requirement => requirement.category === category);
}

/**
 * Get high-severity compliance requirements
 */
export function getHighSeverityRequirements(
  standards: ComplianceStandard[]
): ComplianceRequirement[] {
  return standards
    .flatMap(standard => standard.requirements)
    .filter(requirement => requirement.severity === 'high' || requirement.severity === 'critical');
}

// ============================================================================
// Type Exports
// ============================================================================

export type {
  SecurityComplianceOptions,
  ComplianceStandard,
  ComplianceRequirement,
  AuditEvent,
  ComplianceCheckResult,
  SecurityIncident,
  PIIDetectionResult,
  PIILocation,
  LicenseValidationResult,
  ThirdPartyLicense,
  NIMCredentialManagerOptions,
  AWSCredentials,
  NIMCredentials,
  CredentialRotationConfig,
  IAMRoleConfig,
  CredentialValidationResult
};