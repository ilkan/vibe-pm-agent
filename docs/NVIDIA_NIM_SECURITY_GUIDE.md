# NVIDIA NIM Security and Compliance Guide

This guide covers the comprehensive security and compliance features implemented for the NVIDIA NIM Agentic Platform, including credential management, audit logging, data protection, and compliance checking.

## Overview

The security implementation provides:

- **Credential Management**: Secure storage and rotation of AWS and NVIDIA NIM credentials
- **Access Control**: Role-based access control with IAM integration
- **Audit Logging**: Comprehensive audit trails for all security-relevant operations
- **Data Protection**: PII detection, anonymization, and encryption
- **Compliance Checking**: Automated compliance validation against GDPR, SOC2, and NVIDIA terms
- **Security Monitoring**: Real-time security incident detection and response

## Components

### 1. NVIDIA NIM Credential Manager

Located: `src/components/nvidia-nim-credential-manager/index.ts`

**Features:**
- AWS credentials loading from specified file paths
- NVIDIA NIM API key management
- IAM role assumption for temporary credentials
- Automatic credential rotation with configurable policies
- Secure credential caching with expiration

**Usage:**
```typescript
import { NIMCredentialManager } from '../components/nvidia-nim-credential-manager';

const credentialManager = new NIMCredentialManager({
  awsCredentialsPath: '.aws/credentials',
  encryptionKey: process.env.ENCRYPTION_KEY,
  rotationConfig: {
    enabled: true,
    intervalDays: 90,
    warningDays: 7,
    autoRotate: false,
    notificationEndpoints: ['security@company.com']
  },
  accessControlEnabled: true,
  // ... other options
});

// Load AWS credentials
await credentialManager.loadAWSCredentials();

// Get credentials for a specific profile
const awsCreds = await credentialManager.getAWSCredentials('default', userId, 'bedrock-access');

// Store NVIDIA NIM credentials
await credentialManager.storeNIMCredentials('default', {
  apiKey: 'nvapi-xxx',
  endpoint: 'https://api.nvidia.com/v1',
  model: 'nvidia-llama-3_1-nemotron-nano-8b-v1'
}, userId);
```

### 2. Security and Compliance Manager

Located: `src/components/nvidia-nim-security-compliance/index.ts`

**Features:**
- Comprehensive audit logging with risk assessment
- PII detection and anonymization
- Data encryption/decryption
- Compliance checking against multiple standards
- Security incident management
- Third-party license validation

**Usage:**
```typescript
import { NIMSecurityComplianceManager } from '../components/nvidia-nim-security-compliance';

const securityManager = new NIMSecurityComplianceManager({
  auditLoggingEnabled: true,
  encryptionEnabled: true,
  piiHandlingEnabled: true,
  complianceChecksEnabled: true,
  dataRetentionDays: 90,
  encryptionKey: process.env.ENCRYPTION_KEY,
  complianceStandards: [] // Will be populated automatically
});

// Log audit event
await securityManager.logAuditEvent(
  userId,
  'credential_access',
  'aws_credentials',
  { profile: 'default', purpose: 'bedrock-access' },
  { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
);

// Perform compliance check
const complianceResults = await securityManager.performComplianceCheck();

// Detect and handle PII
const { sanitizedData, piiDetected } = await securityManager.detectAndHandlePII(
  { email: 'user@example.com', name: 'John Doe' },
  'nim-inference'
);
```

## Configuration

### Environment-Based Configuration

The security system supports different configurations for development, staging, and production environments:

```typescript
import { getNIMSecurityConfig } from '../config/nvidia-nim-security-config';

// Get configuration for current environment
const config = getNIMSecurityConfig('production', {
  aws: {
    credentialsPath: '.aws/credentials',
    region: 'us-west-2'
  },
  nvidia: {
    apiEndpoint: 'https://api.nvidia.com/v1'
  }
});
```

### Environment Variables

The following environment variables can be used to configure security settings:

```bash
# AWS Configuration
AWS_REGION=us-west-2
AWS_CREDENTIALS_PATH=.aws/credentials
AWS_IAM_ROLE_ARN=arn:aws:iam::account:role/nvidia-nim-role

# NVIDIA Configuration
NVIDIA_NIM_ENDPOINT=https://api.nvidia.com/v1
NVIDIA_NIM_CREDENTIALS_PATH=.nvidia/credentials

# Security Configuration
ENCRYPTION_KEY=your-64-character-encryption-key
AUDIT_LOGGING_ENABLED=true
PII_HANDLING_ENABLED=true
ENCRYPTION_ENABLED=true
COMPLIANCE_CHECKS_ENABLED=true
DATA_RETENTION_DAYS=90

# Monitoring Configuration
CLOUDWATCH_ENABLED=true
XRAY_TRACING_ENABLED=true
LOG_LEVEL=info
```

## Compliance Standards

### GDPR Compliance

The system implements GDPR compliance through:

- **Article 32**: Security of processing with encryption and access controls
- **Article 30**: Records of processing activities via audit logging
- **Article 25**: Data protection by design and by default

### SOC 2 Type II Compliance

SOC 2 compliance is achieved through:

- **CC6.1**: Logical and physical access controls
- **CC6.7**: Data transmission and disposal controls
- **CC7.2**: System monitoring and logging

### NVIDIA NIM Terms Compliance

Specific compliance with NVIDIA NIM terms includes:

- API usage monitoring and rate limiting
- Data sanitization before sending to NIM services
- Proper attribution and usage reporting

## Security Features

### Credential Security

- **Encryption**: All credentials encrypted at rest using AES-256-GCM
- **Access Control**: Role-based access with permission conditions
- **Rotation**: Automated credential rotation with configurable policies
- **Audit Trail**: Complete audit log of all credential operations

### Data Protection

- **PII Detection**: Automatic detection of personally identifiable information
- **Anonymization**: Data anonymization before external API calls
- **Encryption**: End-to-end encryption of sensitive data
- **Retention**: Configurable data retention policies

### Access Control

- **RBAC**: Role-based access control with fine-grained permissions
- **IAM Integration**: Integration with AWS IAM for role assumption
- **Session Management**: Secure session token management
- **Audit Logging**: Complete access audit trails

### Security Monitoring

- **Incident Detection**: Automatic security incident detection
- **Risk Assessment**: Real-time risk level assessment
- **Alerting**: Configurable security alerts and notifications
- **Dashboard**: Security dashboard with key metrics

## Best Practices

### Credential Management

1. **Use Environment-Specific Credentials**: Separate credentials for dev/staging/prod
2. **Enable Rotation**: Configure automatic credential rotation for production
3. **Monitor Usage**: Track credential usage and detect anomalies
4. **Secure Storage**: Never store credentials in code or logs

### Data Handling

1. **Minimize Data**: Only collect and process necessary data
2. **Anonymize Early**: Anonymize PII before external API calls
3. **Encrypt Sensitive Data**: Encrypt all sensitive data at rest and in transit
4. **Audit Everything**: Log all data processing activities

### Compliance

1. **Regular Checks**: Run compliance checks regularly
2. **Document Everything**: Maintain comprehensive documentation
3. **Monitor Changes**: Track changes to compliance status
4. **Remediate Quickly**: Address compliance issues promptly

### Security Operations

1. **Monitor Continuously**: Implement continuous security monitoring
2. **Respond Quickly**: Have incident response procedures in place
3. **Update Regularly**: Keep security configurations up to date
4. **Train Users**: Ensure users understand security policies

## Troubleshooting

### Common Issues

1. **Credential Loading Failures**
   - Check file paths and permissions
   - Verify credential file format
   - Ensure encryption keys are available

2. **Compliance Check Failures**
   - Review compliance requirements
   - Check configuration settings
   - Verify audit logging is enabled

3. **PII Detection Issues**
   - Review PII detection patterns
   - Check anonymization settings
   - Verify data handling policies

### Debugging

Enable debug logging to troubleshoot issues:

```typescript
const config = getNIMSecurityConfig('development', {
  monitoring: {
    logLevel: 'debug'
  }
});
```

### Support

For security-related issues:

1. Check the audit logs for detailed error information
2. Review the security dashboard for system status
3. Consult the compliance reports for policy violations
4. Contact the security team for critical issues

## Integration Examples

### With Existing Lambda Functions

```typescript
import { NIMCredentialManager, NIMSecurityComplianceManager } from '../components';
import { getCurrentEnvironmentConfig } from '../config/nvidia-nim-security-config';

export async function handler(event: any, context: any) {
  const config = getCurrentEnvironmentConfig();
  
  const credentialManager = new NIMCredentialManager(config.credentials);
  const securityManager = new NIMSecurityComplianceManager(config.security);
  
  // Log the request
  await securityManager.logAuditEvent(
    event.userId || 'anonymous',
    'lambda_invocation',
    'vibe-pm-agent',
    { functionName: context.functionName, requestId: context.awsRequestId }
  );
  
  // Get AWS credentials
  const awsCreds = await credentialManager.getAWSCredentials('default', 'system', 'bedrock-access');
  
  // Process request with security controls
  const { sanitizedData } = await securityManager.detectAndHandlePII(event.body, 'lambda-processing');
  
  // ... rest of lambda logic
}
```

### With Bedrock Agents

```typescript
import { BedrockAgentClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent';

async function invokeBedrockAgent(agentId: string, input: string, userId: string) {
  const config = getCurrentEnvironmentConfig();
  const credentialManager = new NIMCredentialManager(config.credentials);
  const securityManager = new NIMSecurityComplianceManager(config.security);
  
  // Get AWS credentials
  const awsCreds = await credentialManager.getAWSCredentials('default', userId, 'bedrock-agent-invocation');
  
  // Sanitize input data
  const { sanitizedData } = await securityManager.detectAndHandlePII(input, 'bedrock-agent');
  
  // Create Bedrock client with credentials
  const client = new BedrockAgentClient({
    region: config.aws.region,
    credentials: {
      accessKeyId: awsCreds.accessKeyId,
      secretAccessKey: awsCreds.secretAccessKey,
      sessionToken: awsCreds.sessionToken
    }
  });
  
  // Invoke agent
  const command = new InvokeAgentCommand({
    agentId,
    agentAliasId: 'TSTALIASID',
    sessionId: crypto.randomUUID(),
    inputText: sanitizedData
  });
  
  const response = await client.send(command);
  
  // Log the interaction
  await securityManager.logAuditEvent(
    userId,
    'bedrock_agent_invocation',
    'bedrock_agent',
    { agentId, inputLength: input.length, responseLength: response.completion?.length || 0 }
  );
  
  return response;
}
```

This comprehensive security implementation ensures that the NVIDIA NIM Agentic Platform meets enterprise security and compliance requirements while maintaining usability and performance.