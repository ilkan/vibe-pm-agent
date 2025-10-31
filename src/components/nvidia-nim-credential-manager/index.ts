/**
 * NVIDIA NIM Credential Manager
 *
 * Extends the secure credential manager with AWS credentials loading from specified path,
 * NVIDIA NIM API key management, and IAM role-based access control for the agentic platform.
 */

import { SecureCredentialManager, SecureCredentialOptions, Credential } from '../secure-credential-manager/index.js';
import { AccessControlManager, AccessRequest, AccessResult } from '../access-control-manager/index.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
  profile?: string;
}

export interface NIMCredentials {
  apiKey: string;
  endpoint: string;
  model: string;
  organizationId?: string;
}

export interface CredentialRotationConfig {
  enabled: boolean;
  intervalDays: number;
  warningDays: number;
  autoRotate: boolean;
  notificationEndpoints: string[];
}

export interface IAMRoleConfig {
  roleArn: string;
  sessionName: string;
  durationSeconds: number;
  externalId?: string;
  policy?: string;
}

export interface NIMCredentialManagerOptions extends SecureCredentialOptions {
  awsCredentialsPath: string;
  nimCredentialsPath?: string;
  iamRoleConfig?: IAMRoleConfig;
  rotationConfig: CredentialRotationConfig;
  accessControlEnabled: boolean;
}

export interface CredentialValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  expiresAt?: Date;
  lastValidated: Date;
}

export class NIMCredentialManager extends EventEmitter {
  private secureManager: SecureCredentialManager;
  private accessControl: AccessControlManager;
  private options: NIMCredentialManagerOptions;
  private awsCredentials: Map<string, AWSCredentials> = new Map();
  private nimCredentials: Map<string, NIMCredentials> = new Map();
  private credentialCache: Map<string, { credential: any; expiresAt: Date }> = new Map();

  constructor(options: NIMCredentialManagerOptions) {
    super();
    this.options = options;
    this.secureManager = new SecureCredentialManager(options);
    this.accessControl = new AccessControlManager();
    
    this.initializeCredentialManagement();
    this.setupRotationSchedule();
  }

  /**
   * Load AWS credentials from specified file path
   */
  async loadAWSCredentials(credentialsPath?: string): Promise<Map<string, AWSCredentials>> {
    const path = credentialsPath || this.options.awsCredentialsPath;
    
    try {
      if (!existsSync(path)) {
        throw new Error(`AWS credentials file not found at path: ${path}`);
      }

      const credentialsContent = readFileSync(path, 'utf-8');
      const credentials = this.parseAWSCredentialsFile(credentialsContent);
      
      // Store credentials securely
      for (const [profile, creds] of credentials.entries()) {
        await this.storeAWSCredentials(profile, creds);
      }

      this.emit('awsCredentialsLoaded', { path, profiles: Array.from(credentials.keys()) });
      return credentials;
    } catch (error) {
      this.emit('credentialError', {
        action: 'loadAWSCredentials',
        error: error instanceof Error ? error.message : 'Unknown error',
        path
      });
      throw new Error(`Failed to load AWS credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store AWS credentials securely
   */
  async storeAWSCredentials(profile: string, credentials: AWSCredentials, userId?: string): Promise<string> {
    try {
      const credentialData = {
        name: `aws-${profile}`,
        type: 'api_key' as const,
        provider: 'aws',
        description: `AWS credentials for profile: ${profile}`,
        metadata: {
          environment: this.options.awsCredentialsPath.includes('production') ? 'production' as const : 'development' as const,
          scope: ['aws-services'],
          allowedDomains: ['*.amazonaws.com'],
          tags: ['aws', 'credentials', profile],
          owner: userId || 'system',
          team: 'nvidia-nim-platform'
        },
        permissions: [
          {
            userId: userId || 'system',
            role: 'admin',
            actions: ['read', 'use', 'update'] as const
          }
        ],
        isActive: true
      };

      const credentialValue = JSON.stringify(credentials);
      const credentialId = await this.secureManager.storeCredential(
        credentialData,
        credentialValue,
        userId || 'system'
      );

      // Cache for quick access
      this.awsCredentials.set(profile, credentials);

      this.emit('awsCredentialsStored', { profile, credentialId });
      return credentialId;
    } catch (error) {
      this.emit('credentialError', {
        action: 'storeAWSCredentials',
        error: error instanceof Error ? error.message : 'Unknown error',
        profile
      });
      throw error;
    }
  }

  /**
   * Retrieve AWS credentials for a specific profile
   */
  async getAWSCredentials(profile: string, userId: string, purpose: string = 'aws-service-access'): Promise<AWSCredentials> {
    try {
      // Check access control if enabled
      if (this.options.accessControlEnabled) {
        const accessResult = await this.checkCredentialAccess(userId, 'aws-credentials', 'read', { profile });
        if (!accessResult.granted) {
          throw new Error(`Access denied: ${accessResult.reason}`);
        }
      }

      // Check cache first
      const cached = this.awsCredentials.get(profile);
      if (cached) {
        this.emit('awsCredentialsRetrieved', { profile, userId, fromCache: true });
        return cached;
      }

      // Retrieve from secure storage
      const credentials = await this.secureManager.listCredentials(userId, {
        provider: 'aws',
        isActive: true
      });

      const awsCredential = credentials.find(c => c.name === `aws-${profile}`);
      if (!awsCredential) {
        throw new Error(`AWS credentials not found for profile: ${profile}`);
      }

      const credentialValue = await this.secureManager.retrieveCredential(
        awsCredential.id,
        userId,
        purpose,
        { profile }
      );

      const parsedCredentials: AWSCredentials = JSON.parse(credentialValue);
      
      // Cache for future use
      this.awsCredentials.set(profile, parsedCredentials);

      this.emit('awsCredentialsRetrieved', { profile, userId, fromCache: false });
      return parsedCredentials;
    } catch (error) {
      this.emit('credentialError', {
        action: 'getAWSCredentials',
        error: error instanceof Error ? error.message : 'Unknown error',
        profile,
        userId
      });
      throw error;
    }
  }

  /**
   * Store NVIDIA NIM API credentials
   */
  async storeNIMCredentials(name: string, credentials: NIMCredentials, userId: string): Promise<string> {
    try {
      const credentialData = {
        name: `nim-${name}`,
        type: 'api_key' as const,
        provider: 'nvidia',
        description: `NVIDIA NIM API credentials for: ${name}`,
        metadata: {
          environment: 'production' as const,
          scope: ['nim-inference', 'embedding-generation'],
          allowedDomains: ['*.nvidia.com', '*.nvcf.io'],
          tags: ['nvidia', 'nim', 'api-key', name],
          owner: userId,
          team: 'nvidia-nim-platform'
        },
        permissions: [
          {
            userId,
            role: 'user',
            actions: ['read', 'use'] as const
          }
        ],
        isActive: true
      };

      const credentialValue = JSON.stringify(credentials);
      const credentialId = await this.secureManager.storeCredential(
        credentialData,
        credentialValue,
        userId
      );

      // Cache for quick access
      this.nimCredentials.set(name, credentials);

      this.emit('nimCredentialsStored', { name, credentialId, userId });
      return credentialId;
    } catch (error) {
      this.emit('credentialError', {
        action: 'storeNIMCredentials',
        error: error instanceof Error ? error.message : 'Unknown error',
        name,
        userId
      });
      throw error;
    }
  }

  /**
   * Retrieve NVIDIA NIM credentials
   */
  async getNIMCredentials(name: string, userId: string, purpose: string = 'nim-inference'): Promise<NIMCredentials> {
    try {
      // Check access control if enabled
      if (this.options.accessControlEnabled) {
        const accessResult = await this.checkCredentialAccess(userId, 'nim-credentials', 'use', { name });
        if (!accessResult.granted) {
          throw new Error(`Access denied: ${accessResult.reason}`);
        }
      }

      // Check cache first
      const cached = this.nimCredentials.get(name);
      if (cached) {
        this.emit('nimCredentialsRetrieved', { name, userId, fromCache: true });
        return cached;
      }

      // Retrieve from secure storage
      const credentials = await this.secureManager.listCredentials(userId, {
        provider: 'nvidia',
        isActive: true
      });

      const nimCredential = credentials.find(c => c.name === `nim-${name}`);
      if (!nimCredential) {
        throw new Error(`NVIDIA NIM credentials not found for: ${name}`);
      }

      const credentialValue = await this.secureManager.retrieveCredential(
        nimCredential.id,
        userId,
        purpose,
        { name }
      );

      const parsedCredentials: NIMCredentials = JSON.parse(credentialValue);
      
      // Cache for future use
      this.nimCredentials.set(name, parsedCredentials);

      this.emit('nimCredentialsRetrieved', { name, userId, fromCache: false });
      return parsedCredentials;
    } catch (error) {
      this.emit('credentialError', {
        action: 'getNIMCredentials',
        error: error instanceof Error ? error.message : 'Unknown error',
        name,
        userId
      });
      throw error;
    }
  }

  /**
   * Assume IAM role and get temporary credentials
   */
  async assumeIAMRole(roleConfig: IAMRoleConfig, userId: string): Promise<AWSCredentials> {
    try {
      // Check access control for IAM role assumption
      if (this.options.accessControlEnabled) {
        const accessResult = await this.checkCredentialAccess(userId, 'iam-role', 'assume', { roleArn: roleConfig.roleArn });
        if (!accessResult.granted) {
          throw new Error(`Access denied for IAM role assumption: ${accessResult.reason}`);
        }
      }

      // Get base AWS credentials
      const baseCredentials = await this.getAWSCredentials('default', userId, 'iam-role-assumption');

      // This would integrate with AWS STS in a real implementation
      // For now, we'll simulate the role assumption
      const temporaryCredentials: AWSCredentials = {
        accessKeyId: `ASIA${this.generateRandomString(16)}`,
        secretAccessKey: this.generateRandomString(40),
        sessionToken: this.generateRandomString(356),
        region: baseCredentials.region,
        profile: `assumed-${roleConfig.sessionName}`
      };

      // Store temporary credentials with expiration
      const expiresAt = new Date(Date.now() + roleConfig.durationSeconds * 1000);
      this.credentialCache.set(`iam-role-${roleConfig.sessionName}`, {
        credential: temporaryCredentials,
        expiresAt
      });

      this.emit('iamRoleAssumed', {
        roleArn: roleConfig.roleArn,
        sessionName: roleConfig.sessionName,
        userId,
        expiresAt
      });

      return temporaryCredentials;
    } catch (error) {
      this.emit('credentialError', {
        action: 'assumeIAMRole',
        error: error instanceof Error ? error.message : 'Unknown error',
        roleArn: roleConfig.roleArn,
        userId
      });
      throw error;
    }
  }

  /**
   * Rotate credentials based on policy
   */
  async rotateCredentials(credentialId: string, userId: string): Promise<void> {
    try {
      // Check access control for credential rotation
      if (this.options.accessControlEnabled) {
        const accessResult = await this.checkCredentialAccess(userId, 'credential-rotation', 'execute', { credentialId });
        if (!accessResult.granted) {
          throw new Error(`Access denied for credential rotation: ${accessResult.reason}`);
        }
      }

      // Get current credential
      const credentials = await this.secureManager.listCredentials(userId);
      const credential = credentials.find(c => c.id === credentialId);
      
      if (!credential) {
        throw new Error(`Credential not found: ${credentialId}`);
      }

      // Generate new credential value based on type
      let newCredentialValue: string;
      
      if (credential.provider === 'nvidia') {
        // For NVIDIA NIM, generate new API key (in real implementation, this would call NVIDIA API)
        const nimCreds: NIMCredentials = {
          apiKey: `nvapi-${this.generateRandomString(32)}`,
          endpoint: 'https://api.nvidia.com/v1',
          model: 'nvidia-llama-3_1-nemotron-nano-8b-v1'
        };
        newCredentialValue = JSON.stringify(nimCreds);
      } else if (credential.provider === 'aws') {
        // For AWS, this would involve creating new access keys via IAM API
        const awsCreds: AWSCredentials = {
          accessKeyId: `AKIA${this.generateRandomString(16)}`,
          secretAccessKey: this.generateRandomString(40),
          region: 'us-west-2'
        };
        newCredentialValue = JSON.stringify(awsCreds);
      } else {
        throw new Error(`Unsupported credential provider for rotation: ${credential.provider}`);
      }

      // Rotate the credential
      await this.secureManager.rotateCredential(credentialId, newCredentialValue, userId);

      // Clear cache to force reload
      this.clearCredentialCache(credential.name);

      this.emit('credentialRotated', {
        credentialId,
        provider: credential.provider,
        name: credential.name,
        userId
      });
    } catch (error) {
      this.emit('credentialError', {
        action: 'rotateCredentials',
        error: error instanceof Error ? error.message : 'Unknown error',
        credentialId,
        userId
      });
      throw error;
    }
  }

  /**
   * Validate credentials
   */
  async validateCredentials(credentialId: string, userId: string): Promise<CredentialValidationResult> {
    try {
      const credentials = await this.secureManager.listCredentials(userId);
      const credential = credentials.find(c => c.id === credentialId);
      
      if (!credential) {
        return {
          valid: false,
          errors: ['Credential not found'],
          warnings: [],
          lastValidated: new Date()
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Check if credential is active
      if (!credential.isActive) {
        errors.push('Credential is inactive');
      }

      // Check expiration
      if (credential.expiresAt && credential.expiresAt < new Date()) {
        errors.push('Credential has expired');
      } else if (credential.expiresAt && credential.expiresAt < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
        warnings.push('Credential expires within 7 days');
      }

      // Check last usage
      if (credential.lastUsed && credential.lastUsed < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) {
        warnings.push('Credential has not been used in 90 days');
      }

      // Provider-specific validation
      if (credential.provider === 'aws') {
        await this.validateAWSCredentials(credential, errors, warnings);
      } else if (credential.provider === 'nvidia') {
        await this.validateNIMCredentials(credential, errors, warnings);
      }

      const result: CredentialValidationResult = {
        valid: errors.length === 0,
        errors,
        warnings,
        expiresAt: credential.expiresAt,
        lastValidated: new Date()
      };

      this.emit('credentialValidated', {
        credentialId,
        result,
        userId
      });

      return result;
    } catch (error) {
      this.emit('credentialError', {
        action: 'validateCredentials',
        error: error instanceof Error ? error.message : 'Unknown error',
        credentialId,
        userId
      });
      throw error;
    }
  }

  /**
   * Get credential health status
   */
  async getCredentialHealth(): Promise<{
    total: number;
    active: number;
    expired: number;
    expiringSoon: number;
    needsRotation: number;
    byProvider: Record<string, number>;
  }> {
    const baseHealth = await this.secureManager.checkCredentialHealth();
    
    // Get additional provider breakdown
    const credentials = await this.secureManager.listCredentials('system');
    const byProvider: Record<string, number> = {};
    
    credentials.forEach(cred => {
      byProvider[cred.provider] = (byProvider[cred.provider] || 0) + 1;
    });

    return {
      ...baseHealth,
      byProvider
    };
  }

  /**
   * Parse AWS credentials file
   */
  private parseAWSCredentialsFile(content: string): Map<string, AWSCredentials> {
    const credentials = new Map<string, AWSCredentials>();
    const lines = content.split('\n');
    let currentProfile = '';
    let currentCreds: Partial<AWSCredentials> = {};

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        // Save previous profile if complete
        if (currentProfile && currentCreds.accessKeyId && currentCreds.secretAccessKey) {
          credentials.set(currentProfile, currentCreds as AWSCredentials);
        }
        
        // Start new profile
        currentProfile = trimmedLine.slice(1, -1);
        currentCreds = { region: 'us-east-1' }; // Default region
      } else if (trimmedLine.includes('=')) {
        const [key, value] = trimmedLine.split('=').map(s => s.trim());
        
        switch (key) {
          case 'aws_access_key_id':
            currentCreds.accessKeyId = value;
            break;
          case 'aws_secret_access_key':
            currentCreds.secretAccessKey = value;
            break;
          case 'aws_session_token':
            currentCreds.sessionToken = value;
            break;
          case 'region':
            currentCreds.region = value;
            break;
        }
      }
    }

    // Save last profile
    if (currentProfile && currentCreds.accessKeyId && currentCreds.secretAccessKey) {
      credentials.set(currentProfile, currentCreds as AWSCredentials);
    }

    return credentials;
  }

  /**
   * Check credential access using access control manager
   */
  private async checkCredentialAccess(
    userId: string,
    resource: string,
    action: string,
    context: Record<string, any>
  ): Promise<AccessResult> {
    const accessRequest: AccessRequest = {
      userId,
      resource,
      action,
      context: {
        ...context,
        timestamp: new Date()
      },
      timestamp: new Date()
    };

    return await this.accessControl.checkAccess(accessRequest);
  }

  /**
   * Validate AWS credentials
   */
  private async validateAWSCredentials(credential: any, errors: string[], warnings: string[]): Promise<void> {
    try {
      const credValue = await this.secureManager.retrieveCredential(
        credential.id,
        'system',
        'validation'
      );
      const awsCreds: AWSCredentials = JSON.parse(credValue);

      // Basic format validation
      if (!awsCreds.accessKeyId || !awsCreds.accessKeyId.match(/^AKIA[0-9A-Z]{16}$/)) {
        errors.push('Invalid AWS access key ID format');
      }

      if (!awsCreds.secretAccessKey || awsCreds.secretAccessKey.length !== 40) {
        errors.push('Invalid AWS secret access key format');
      }

      if (!awsCreds.region) {
        warnings.push('No region specified for AWS credentials');
      }

      // In a real implementation, you would test the credentials by making an AWS API call
      // For now, we'll just do format validation
    } catch (error) {
      errors.push(`Failed to validate AWS credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate NVIDIA NIM credentials
   */
  private async validateNIMCredentials(credential: any, errors: string[], warnings: string[]): Promise<void> {
    try {
      const credValue = await this.secureManager.retrieveCredential(
        credential.id,
        'system',
        'validation'
      );
      const nimCreds: NIMCredentials = JSON.parse(credValue);

      // Basic format validation
      if (!nimCreds.apiKey || !nimCreds.apiKey.startsWith('nvapi-')) {
        errors.push('Invalid NVIDIA NIM API key format');
      }

      if (!nimCreds.endpoint || !nimCreds.endpoint.startsWith('http')) {
        errors.push('Invalid NVIDIA NIM endpoint URL');
      }

      if (!nimCreds.model) {
        warnings.push('No model specified for NVIDIA NIM credentials');
      }

      // In a real implementation, you would test the credentials by making a NIM API call
      // For now, we'll just do format validation
    } catch (error) {
      errors.push(`Failed to validate NVIDIA NIM credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize credential management
   */
  private initializeCredentialManagement(): void {
    // Load AWS credentials on startup
    if (this.options.awsCredentialsPath) {
      this.loadAWSCredentials().catch(error => {
        this.emit('initializationError', {
          component: 'aws-credentials',
          error: error.message
        });
      });
    }

    // Load NVIDIA NIM credentials if path specified
    if (this.options.nimCredentialsPath) {
      this.loadNIMCredentialsFromFile().catch(error => {
        this.emit('initializationError', {
          component: 'nim-credentials',
          error: error.message
        });
      });
    }

    // Set up event forwarding from secure manager
    this.secureManager.on('credentialStored', (event) => this.emit('credentialStored', event));
    this.secureManager.on('credentialRetrieved', (event) => this.emit('credentialRetrieved', event));
    this.secureManager.on('credentialUpdated', (event) => this.emit('credentialUpdated', event));
    this.secureManager.on('credentialDeleted', (event) => this.emit('credentialDeleted', event));
    this.secureManager.on('credentialRotated', (event) => this.emit('credentialRotated', event));
    this.secureManager.on('credentialError', (event) => this.emit('credentialError', event));
  }

  /**
   * Load NVIDIA NIM credentials from file
   */
  private async loadNIMCredentialsFromFile(): Promise<void> {
    if (!this.options.nimCredentialsPath || !existsSync(this.options.nimCredentialsPath)) {
      return;
    }

    try {
      const content = readFileSync(this.options.nimCredentialsPath, 'utf-8');
      const nimConfig = JSON.parse(content);
      
      if (nimConfig.apiKey && nimConfig.endpoint) {
        const credentials: NIMCredentials = {
          apiKey: nimConfig.apiKey,
          endpoint: nimConfig.endpoint,
          model: nimConfig.model || 'nvidia-llama-3_1-nemotron-nano-8b-v1',
          organizationId: nimConfig.organizationId
        };

        await this.storeNIMCredentials('default', credentials, 'system');
      }
    } catch (error) {
      this.emit('credentialError', {
        action: 'loadNIMCredentialsFromFile',
        error: error instanceof Error ? error.message : 'Unknown error',
        path: this.options.nimCredentialsPath
      });
    }
  }

  /**
   * Setup credential rotation schedule
   */
  private setupRotationSchedule(): void {
    if (!this.options.rotationConfig.enabled) {
      return;
    }

    // Check for credentials needing rotation every 24 hours
    setInterval(async () => {
      try {
        await this.checkRotationNeeds();
      } catch (error) {
        this.emit('rotationError', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Check for credentials needing rotation
   */
  private async checkRotationNeeds(): Promise<void> {
    const credentials = await this.secureManager.listCredentials('system');
    const now = new Date();

    for (const credential of credentials) {
      const daysSinceUpdate = Math.floor(
        (now.getTime() - credential.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysSinceUpdate >= this.options.rotationConfig.intervalDays) {
        this.emit('rotationNeeded', {
          credentialId: credential.id,
          name: credential.name,
          provider: credential.provider,
          daysSinceUpdate
        });

        if (this.options.rotationConfig.autoRotate) {
          try {
            await this.rotateCredentials(credential.id, 'system');
          } catch (error) {
            this.emit('rotationError', {
              credentialId: credential.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } else if (daysSinceUpdate >= (this.options.rotationConfig.intervalDays - this.options.rotationConfig.warningDays)) {
        this.emit('rotationWarning', {
          credentialId: credential.id,
          name: credential.name,
          provider: credential.provider,
          daysUntilRotation: this.options.rotationConfig.intervalDays - daysSinceUpdate
        });
      }
    }
  }

  /**
   * Clear credential cache
   */
  private clearCredentialCache(credentialName: string): void {
    // Clear AWS credentials cache
    for (const [profile, _] of this.awsCredentials.entries()) {
      if (credentialName.includes(profile)) {
        this.awsCredentials.delete(profile);
      }
    }

    // Clear NIM credentials cache
    for (const [name, _] of this.nimCredentials.entries()) {
      if (credentialName.includes(name)) {
        this.nimCredentials.delete(name);
      }
    }

    // Clear general credential cache
    for (const [key, _] of this.credentialCache.entries()) {
      if (key.includes(credentialName)) {
        this.credentialCache.delete(key);
      }
    }
  }

  /**
   * Generate random string for credential generation
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}