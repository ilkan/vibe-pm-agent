import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface ApiKeyConfig {
  keyId: string;
  hashedKey: string;
  clientName: string;
  permissions: string[];
  enabled: boolean;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    burstLimit: number;
  };
  expiresAt?: string | null;
}

export interface CredentialConfig {
  apiKeys: ApiKeyConfig[];
}

export interface ValidationResult {
  isValid: boolean;
  clientId?: string;
  clientName?: string;
  permissions?: string[];
  rateLimit?: ApiKeyConfig['rateLimit'];
  error?: string;
}

export class CredentialManagerError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'CredentialManagerError';
  }
}

export class CredentialManager {
  private credentialPath: string;
  private cachedCredentials: CredentialConfig | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(credentialPath: string = '.aws/api-keys.json') {
    this.credentialPath = path.resolve(credentialPath);
  }

  /**
   * Load API key configuration from credential file
   */
  async loadCredentials(): Promise<CredentialConfig> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.cachedCredentials && (now - this.cacheTimestamp) < this.CACHE_TTL) {
        return this.cachedCredentials;
      }

      // Check if credential file exists
      if (!fs.existsSync(this.credentialPath)) {
        throw new CredentialManagerError(
          `Credential file not found: ${this.credentialPath}`,
          'CREDENTIAL_FILE_NOT_FOUND',
          { path: this.credentialPath }
        );
      }

      // Read and parse credential file
      const credentialData = fs.readFileSync(this.credentialPath, 'utf8');
      const credentials = JSON.parse(credentialData) as CredentialConfig;

      // Validate credential structure
      this.validateCredentialStructure(credentials);

      // Cache the credentials
      this.cachedCredentials = credentials;
      this.cacheTimestamp = now;

      return credentials;
    } catch (error) {
      if (error instanceof CredentialManagerError) {
        throw error;
      }

      if (error instanceof SyntaxError) {
        throw new CredentialManagerError(
          'Invalid JSON in credential file',
          'INVALID_CREDENTIAL_FORMAT',
          { path: this.credentialPath, error: error.message }
        );
      }

      throw new CredentialManagerError(
        `Failed to load credentials: ${error.message}`,
        'CREDENTIAL_LOAD_ERROR',
        { path: this.credentialPath, error: error.message }
      );
    }
  }

  /**
   * Validate API key against stored credentials
   */
  async validateApiKey(apiKey: string): Promise<ValidationResult> {
    try {
      if (!apiKey || typeof apiKey !== 'string') {
        return {
          isValid: false,
          error: 'API key is required and must be a string'
        };
      }

      // Basic security check - minimum length
      if (apiKey.length < 16) {
        return {
          isValid: false,
          error: 'API key must be at least 16 characters long'
        };
      }

      const credentials = await this.loadCredentials();
      const hashedKey = this.hashApiKey(apiKey);

      // Find matching API key
      const matchingKey = credentials.apiKeys.find(key => 
        key.hashedKey === hashedKey && key.enabled
      );

      if (!matchingKey) {
        return {
          isValid: false,
          error: 'Invalid or disabled API key'
        };
      }

      // Check expiration
      if (matchingKey.expiresAt) {
        const expirationDate = new Date(matchingKey.expiresAt);
        if (expirationDate < new Date()) {
          return {
            isValid: false,
            error: 'API key has expired'
          };
        }
      }

      return {
        isValid: true,
        clientId: matchingKey.keyId,
        clientName: matchingKey.clientName,
        permissions: matchingKey.permissions,
        rateLimit: matchingKey.rateLimit
      };
    } catch (error) {
      if (error instanceof CredentialManagerError) {
        return {
          isValid: false,
          error: error.message
        };
      }

      return {
        isValid: false,
        error: 'Internal error during API key validation'
      };
    }
  }

  /**
   * Hash API key for secure storage comparison
   */
  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Validate the structure of loaded credentials
   */
  private validateCredentialStructure(credentials: any): void {
    if (!credentials || typeof credentials !== 'object') {
      throw new CredentialManagerError(
        'Credential file must contain a valid JSON object',
        'INVALID_CREDENTIAL_STRUCTURE'
      );
    }

    if (!Array.isArray(credentials.apiKeys)) {
      throw new CredentialManagerError(
        'Credential file must contain an apiKeys array',
        'MISSING_API_KEYS_ARRAY'
      );
    }

    // Validate each API key entry
    credentials.apiKeys.forEach((key: any, index: number) => {
      const requiredFields = ['keyId', 'hashedKey', 'clientName', 'permissions', 'enabled'];
      
      for (const field of requiredFields) {
        if (!(field in key)) {
          throw new CredentialManagerError(
            `API key at index ${index} is missing required field: ${field}`,
            'MISSING_REQUIRED_FIELD',
            { index, field }
          );
        }
      }

      if (!Array.isArray(key.permissions)) {
        throw new CredentialManagerError(
          `API key at index ${index} permissions must be an array`,
          'INVALID_PERMISSIONS_FORMAT',
          { index }
        );
      }

      if (typeof key.enabled !== 'boolean') {
        throw new CredentialManagerError(
          `API key at index ${index} enabled field must be a boolean`,
          'INVALID_ENABLED_FORMAT',
          { index }
        );
      }
    });
  }

  /**
   * Generate a new API key (for development/testing)
   */
  generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Clear cached credentials (useful for testing)
   */
  clearCache(): void {
    this.cachedCredentials = null;
    this.cacheTimestamp = 0;
  }
}