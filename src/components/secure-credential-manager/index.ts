/**
 * Secure Credential Manager
 * 
 * Provides secure storage, retrieval, and management of credentials
 * for external data sources with encryption and access control.
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

export interface Credential {
  id: string;
  name: string;
  type: 'api_key' | 'oauth_token' | 'basic_auth' | 'bearer_token' | 'certificate';
  provider: string;
  description: string;
  encryptedValue: string;
  metadata: CredentialMetadata;
  permissions: CredentialPermission[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  lastUsed?: Date;
  isActive: boolean;
}

export interface CredentialMetadata {
  environment: 'development' | 'staging' | 'production';
  scope: string[];
  allowedDomains: string[];
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  tags: string[];
  owner: string;
  team: string;
}

export interface CredentialPermission {
  userId: string;
  role: string;
  actions: ('read' | 'use' | 'update' | 'delete')[];
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in';
  value: any;
}

export interface CredentialRequest {
  credentialId: string;
  userId: string;
  purpose: string;
  context: RequestContext;
  timestamp: Date;
}

export interface RequestContext {
  apiEndpoint?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

export interface CredentialUsageLog {
  id: string;
  credentialId: string;
  userId: string;
  action: 'retrieved' | 'used' | 'updated' | 'deleted';
  purpose: string;
  context: RequestContext;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}

export interface EncryptionConfig {
  algorithm: string;
  keyDerivation: 'pbkdf2' | 'scrypt' | 'argon2';
  iterations: number;
  saltLength: number;
  ivLength: number;
}

export interface CredentialRotationPolicy {
  id: string;
  credentialType: string;
  rotationIntervalDays: number;
  warningDays: number;
  autoRotate: boolean;
  notificationEmails: string[];
  isActive: boolean;
}

export interface SecureCredentialOptions {
  encryptionKey: string;
  encryptionConfig: EncryptionConfig;
  auditLogging: boolean;
  maxRetentionDays: number;
  requireApprovalForAccess: boolean;
}

export class SecureCredentialManager extends EventEmitter {
  private credentials: Map<string, Credential> = new Map();
  private usageLogs: CredentialUsageLog[] = [];
  private rotationPolicies: Map<string, CredentialRotationPolicy> = new Map();
  private encryptionKey: Buffer;
  private options: SecureCredentialOptions;

  constructor(options: SecureCredentialOptions) {
    super();
    this.options = options;
    this.encryptionKey = Buffer.from(options.encryptionKey, 'hex');
    this.initializeRotationPolicies();
    this.startRotationMonitoring();
  }

  /**
   * Store a new credential securely
   */
  async storeCredential(
    credentialData: Omit<Credential, 'id' | 'encryptedValue' | 'createdAt' | 'updatedAt' | 'lastUsed'>,
    plainTextValue: string,
    userId: string
  ): Promise<string> {
    try {
      // Validate credential data
      this.validateCredentialData(credentialData);

      // Encrypt the credential value
      const encryptedValue = await this.encryptValue(plainTextValue);

      // Create credential object
      const credential: Credential = {
        ...credentialData,
        id: crypto.randomUUID(),
        encryptedValue,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      // Store credential
      this.credentials.set(credential.id, credential);

      // Log credential creation
      await this.logCredentialUsage({
        credentialId: credential.id,
        userId,
        action: 'updated',
        purpose: 'credential_creation',
        context: {},
        timestamp: new Date()
      }, true);

      this.emit('credentialStored', { credentialId: credential.id, userId });
      return credential.id;

    } catch (error) {
      this.emit('credentialError', {
        action: 'store',
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw new Error(`Failed to store credential: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve and decrypt a credential
   */
  async retrieveCredential(
    credentialId: string,
    userId: string,
    purpose: string,
    context: RequestContext = {}
  ): Promise<string> {
    try {
      // Get credential
      const credential = this.credentials.get(credentialId);
      if (!credential) {
        throw new Error('Credential not found');
      }

      if (!credential.isActive) {
        throw new Error('Credential is inactive');
      }

      // Check if credential is expired
      if (credential.expiresAt && credential.expiresAt < new Date()) {
        throw new Error('Credential has expired');
      }

      // Check permissions
      const hasPermission = await this.checkCredentialPermission(credential, userId, 'use', context);
      if (!hasPermission) {
        throw new Error('Insufficient permissions to access credential');
      }

      // Decrypt credential value
      const decryptedValue = await this.decryptValue(credential.encryptedValue);

      // Update last used timestamp
      credential.lastUsed = new Date();
      credential.updatedAt = new Date();

      // Log credential usage
      await this.logCredentialUsage({
        credentialId,
        userId,
        action: 'retrieved',
        purpose,
        context,
        timestamp: new Date()
      }, true);

      this.emit('credentialRetrieved', { credentialId, userId, purpose });
      return decryptedValue;

    } catch (error) {
      // Log failed attempt
      await this.logCredentialUsage({
        credentialId,
        userId,
        action: 'retrieved',
        purpose,
        context,
        timestamp: new Date()
      }, false, error instanceof Error ? error.message : 'Unknown error');

      this.emit('credentialError', {
        action: 'retrieve',
        credentialId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Update an existing credential
   */
  async updateCredential(
    credentialId: string,
    updates: Partial<Omit<Credential, 'id' | 'encryptedValue' | 'createdAt' | 'updatedAt'>>,
    newValue?: string,
    userId?: string
  ): Promise<void> {
    try {
      const credential = this.credentials.get(credentialId);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // Check permissions if userId provided
      if (userId) {
        const hasPermission = await this.checkCredentialPermission(credential, userId, 'update');
        if (!hasPermission) {
          throw new Error('Insufficient permissions to update credential');
        }
      }

      // Update credential properties
      Object.assign(credential, updates);
      credential.updatedAt = new Date();

      // Update encrypted value if new value provided
      if (newValue) {
        credential.encryptedValue = await this.encryptValue(newValue);
      }

      // Log credential update
      if (userId) {
        await this.logCredentialUsage({
          credentialId,
          userId,
          action: 'updated',
          purpose: 'credential_update',
          context: {},
          timestamp: new Date()
        }, true);
      }

      this.emit('credentialUpdated', { credentialId, userId });

    } catch (error) {
      this.emit('credentialError', {
        action: 'update',
        credentialId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Delete a credential
   */
  async deleteCredential(credentialId: string, userId: string): Promise<void> {
    try {
      const credential = this.credentials.get(credentialId);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // Check permissions
      const hasPermission = await this.checkCredentialPermission(credential, userId, 'delete');
      if (!hasPermission) {
        throw new Error('Insufficient permissions to delete credential');
      }

      // Remove credential
      this.credentials.delete(credentialId);

      // Log credential deletion
      await this.logCredentialUsage({
        credentialId,
        userId,
        action: 'deleted',
        purpose: 'credential_deletion',
        context: {},
        timestamp: new Date()
      }, true);

      this.emit('credentialDeleted', { credentialId, userId });

    } catch (error) {
      this.emit('credentialError', {
        action: 'delete',
        credentialId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * List credentials accessible to user
   */
  async listCredentials(userId: string, filters?: {
    type?: string;
    provider?: string;
    environment?: string;
    isActive?: boolean;
  }): Promise<Omit<Credential, 'encryptedValue'>[]> {
    const accessibleCredentials: Omit<Credential, 'encryptedValue'>[] = [];

    for (const credential of this.credentials.values()) {
      // Check if user has read permission
      const hasPermission = await this.checkCredentialPermission(credential, userId, 'read');
      if (!hasPermission) continue;

      // Apply filters
      if (filters) {
        if (filters.type && credential.type !== filters.type) continue;
        if (filters.provider && credential.provider !== filters.provider) continue;
        if (filters.environment && credential.metadata.environment !== filters.environment) continue;
        if (filters.isActive !== undefined && credential.isActive !== filters.isActive) continue;
      }

      // Add credential without encrypted value
      const { encryptedValue, ...safeCredential } = credential;
      accessibleCredentials.push(safeCredential);
    }

    return accessibleCredentials;
  }

  /**
   * Rotate credential value
   */
  async rotateCredential(
    credentialId: string,
    newValue: string,
    userId: string
  ): Promise<void> {
    try {
      const credential = this.credentials.get(credentialId);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // Check permissions
      const hasPermission = await this.checkCredentialPermission(credential, userId, 'update');
      if (!hasPermission) {
        throw new Error('Insufficient permissions to rotate credential');
      }

      // Store old value for rollback if needed
      const oldEncryptedValue = credential.encryptedValue;

      try {
        // Update with new encrypted value
        credential.encryptedValue = await this.encryptValue(newValue);
        credential.updatedAt = new Date();

        // Log rotation
        await this.logCredentialUsage({
          credentialId,
          userId,
          action: 'updated',
          purpose: 'credential_rotation',
          context: {},
          timestamp: new Date()
        }, true);

        this.emit('credentialRotated', { credentialId, userId });

      } catch (error) {
        // Rollback on failure
        credential.encryptedValue = oldEncryptedValue;
        throw error;
      }

    } catch (error) {
      this.emit('credentialError', {
        action: 'rotate',
        credentialId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Get credential usage logs
   */
  getUsageLogs(filters?: {
    credentialId?: string;
    userId?: string;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
  }): CredentialUsageLog[] {
    let logs = [...this.usageLogs];

    if (filters) {
      if (filters.credentialId) {
        logs = logs.filter(log => log.credentialId === filters.credentialId);
      }
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.fromDate) {
        logs = logs.filter(log => log.timestamp >= filters.fromDate!);
      }
      if (filters.toDate) {
        logs = logs.filter(log => log.timestamp <= filters.toDate!);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Check credential health and expiration
   */
  async checkCredentialHealth(): Promise<{
    total: number;
    active: number;
    expired: number;
    expiringSoon: number;
    needsRotation: number;
  }> {
    const now = new Date();
    const soonThreshold = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days

    let total = 0;
    let active = 0;
    let expired = 0;
    let expiringSoon = 0;
    let needsRotation = 0;

    for (const credential of this.credentials.values()) {
      total++;

      if (credential.isActive) {
        active++;
      }

      if (credential.expiresAt) {
        if (credential.expiresAt < now) {
          expired++;
        } else if (credential.expiresAt < soonThreshold) {
          expiringSoon++;
        }
      }

      // Check if needs rotation based on policy
      const policy = this.rotationPolicies.get(credential.type);
      if (policy && policy.isActive) {
        const rotationDue = new Date(credential.updatedAt.getTime() + (policy.rotationIntervalDays * 24 * 60 * 60 * 1000));
        if (rotationDue < now) {
          needsRotation++;
        }
      }
    }

    return {
      total,
      active,
      expired,
      expiringSoon,
      needsRotation
    };
  }

  /**
   * Encrypt credential value
   */
  private async encryptValue(value: string): Promise<string> {
    const config = this.options.encryptionConfig;
    const salt = crypto.randomBytes(config.saltLength);
    const iv = crypto.randomBytes(config.ivLength);

    // Derive key using specified method
    let key: Buffer;
    if (config.keyDerivation === 'pbkdf2') {
      key = crypto.pbkdf2Sync(this.encryptionKey, salt, config.iterations, 32, 'sha256');
    } else if (config.keyDerivation === 'scrypt') {
      key = crypto.scryptSync(this.encryptionKey, salt, 32, { N: config.iterations });
    } else {
      // Default to pbkdf2
      key = crypto.pbkdf2Sync(this.encryptionKey, salt, config.iterations, 32, 'sha256');
    }

    // Encrypt value
    const cipher = crypto.createCipher(config.algorithm, key);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag for authenticated encryption
    const authTag = (cipher as any).getAuthTag ? (cipher as any).getAuthTag() : Buffer.alloc(0);

    // Combine salt, iv, authTag, and encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);

    return combined.toString('base64');
  }

  /**
   * Decrypt credential value
   */
  private async decryptValue(encryptedValue: string): Promise<string> {
    const config = this.options.encryptionConfig;
    const combined = Buffer.from(encryptedValue, 'base64');

    // Extract components
    const salt = combined.slice(0, config.saltLength);
    const iv = combined.slice(config.saltLength, config.saltLength + config.ivLength);
    const authTagLength = config.algorithm.includes('gcm') ? 16 : 0;
    const authTag = authTagLength > 0 ? combined.slice(config.saltLength + config.ivLength, config.saltLength + config.ivLength + authTagLength) : Buffer.alloc(0);
    const encrypted = combined.slice(config.saltLength + config.ivLength + authTagLength);

    // Derive key
    let key: Buffer;
    if (config.keyDerivation === 'pbkdf2') {
      key = crypto.pbkdf2Sync(this.encryptionKey, salt, config.iterations, 32, 'sha256');
    } else if (config.keyDerivation === 'scrypt') {
      key = crypto.scryptSync(this.encryptionKey, salt, 32, { N: config.iterations });
    } else {
      key = crypto.pbkdf2Sync(this.encryptionKey, salt, config.iterations, 32, 'sha256');
    }

    // Decrypt value
    const decipher = crypto.createDecipher(config.algorithm, key);
    if (authTagLength > 0) {
      (decipher as any).setAuthTag(authTag);
    }

    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Check if user has permission to perform action on credential
   */
  private async checkCredentialPermission(
    credential: Credential,
    userId: string,
    action: 'read' | 'use' | 'update' | 'delete',
    context?: RequestContext
  ): Promise<boolean> {
    // Check if user has specific permission for this credential
    const userPermission = credential.permissions.find(p => p.userId === userId);
    if (userPermission && userPermission.actions.includes(action)) {
      // Check conditions if any
      if (userPermission.conditions && userPermission.conditions.length > 0) {
        return this.evaluatePermissionConditions(userPermission.conditions, context);
      }
      return true;
    }

    // Check role-based permissions (simplified - in production, integrate with proper RBAC)
    const rolePermission = credential.permissions.find(p => p.role && this.userHasRole(userId, p.role));
    if (rolePermission && rolePermission.actions.includes(action)) {
      if (rolePermission.conditions && rolePermission.conditions.length > 0) {
        return this.evaluatePermissionConditions(rolePermission.conditions, context);
      }
      return true;
    }

    return false;
  }

  /**
   * Evaluate permission conditions
   */
  private evaluatePermissionConditions(
    conditions: PermissionCondition[],
    context?: RequestContext
  ): boolean {
    if (!context) return false;

    return conditions.every(condition => {
      const contextValue = (context as any)[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          return contextValue === condition.value;
        case 'not_equals':
          return contextValue !== condition.value;
        case 'contains':
          return String(contextValue).includes(String(condition.value));
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(contextValue);
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(contextValue);
        default:
          return false;
      }
    });
  }

  /**
   * Log credential usage
   */
  private async logCredentialUsage(
    request: CredentialRequest,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    if (!this.options.auditLogging) return;

    const logEntry: CredentialUsageLog = {
      id: crypto.randomUUID(),
      credentialId: request.credentialId,
      userId: request.userId,
      action: request.purpose.includes('deletion') ? 'deleted' : 
              request.purpose.includes('update') || request.purpose.includes('rotation') ? 'updated' :
              request.purpose.includes('creation') ? 'updated' : 'retrieved',
      purpose: request.purpose,
      context: request.context,
      success,
      errorMessage,
      timestamp: request.timestamp
    };

    this.usageLogs.push(logEntry);

    // Clean up old logs based on retention policy
    const cutoffDate = new Date(Date.now() - (this.options.maxRetentionDays * 24 * 60 * 60 * 1000));
    this.usageLogs = this.usageLogs.filter(log => log.timestamp > cutoffDate);

    this.emit('usageLogged', logEntry);
  }

  /**
   * Validate credential data
   */
  private validateCredentialData(credentialData: any): void {
    if (!credentialData.name || !credentialData.type || !credentialData.provider) {
      throw new Error('Missing required credential fields');
    }

    if (!['api_key', 'oauth_token', 'basic_auth', 'bearer_token', 'certificate'].includes(credentialData.type)) {
      throw new Error('Invalid credential type');
    }
  }

  /**
   * Initialize rotation policies
   */
  private initializeRotationPolicies(): void {
    const defaultPolicies: CredentialRotationPolicy[] = [
      {
        id: 'api_key_policy',
        credentialType: 'api_key',
        rotationIntervalDays: 90,
        warningDays: 7,
        autoRotate: false,
        notificationEmails: [],
        isActive: true
      },
      {
        id: 'oauth_token_policy',
        credentialType: 'oauth_token',
        rotationIntervalDays: 30,
        warningDays: 3,
        autoRotate: false,
        notificationEmails: [],
        isActive: true
      }
    ];

    defaultPolicies.forEach(policy => this.rotationPolicies.set(policy.id, policy));
  }

  /**
   * Start rotation monitoring
   */
  private startRotationMonitoring(): void {
    // Check for credentials needing rotation every 24 hours
    setInterval(() => {
      this.checkRotationNeeds();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Check for credentials needing rotation
   */
  private async checkRotationNeeds(): Promise<void> {
    const now = new Date();

    for (const credential of this.credentials.values()) {
      const policy = this.rotationPolicies.get(credential.type);
      if (!policy || !policy.isActive) continue;

      const lastRotation = credential.updatedAt;
      const rotationDue = new Date(lastRotation.getTime() + (policy.rotationIntervalDays * 24 * 60 * 60 * 1000));
      const warningDate = new Date(rotationDue.getTime() - (policy.warningDays * 24 * 60 * 60 * 1000));

      if (now >= warningDate) {
        this.emit('rotationWarning', {
          credentialId: credential.id,
          credentialName: credential.name,
          rotationDue,
          policy
        });
      }

      if (now >= rotationDue && policy.autoRotate) {
        this.emit('autoRotationNeeded', {
          credentialId: credential.id,
          credentialName: credential.name,
          policy
        });
      }
    }
  }

  // Helper method for role checking (simplified)
  private userHasRole(userId: string, role: string): boolean {
    // In production, this would integrate with your user management system
    return false;
  }
}