// Simple authentication service for Lambda functions
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface AuthResult {
  isAuthenticated: boolean;
  clientId?: string;
  clientName?: string;
  permissions?: string[];
  error?: string;
}

export interface ApiKeyConfig {
  keyId: string;
  hashedKey: string;
  clientName: string;
  permissions: string[];
  enabled: boolean;
}

export class AuthService {
  private credentialPath: string;

  constructor(credentialPath?: string) {
    // Use environment variable, constructor parameter, or default path
    const defaultPath = process.env.CREDENTIAL_PATH || '.aws/api-keys.json';
    this.credentialPath = path.resolve(credentialPath || defaultPath);
  }

  /**
   * Authenticate request using API key from headers
   */
  async authenticateRequest(
    headers: Record<string, string | undefined>,
    requestContext?: {
      requestId?: string;
      userAgent?: string;
      ipAddress?: string;
      endpoint?: string;
    }
  ): Promise<AuthResult> {
    try {
      // Extract API key from headers
      const apiKey = this.extractApiKey(headers);
      
      if (!apiKey) {
        return {
          isAuthenticated: false,
          error: 'API key is required. Provide it in X-API-Key header.'
        };
      }

      // Validate the API key
      const validationResult = await this.validateApiKey(apiKey);
      return validationResult;
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        isAuthenticated: false,
        error: 'Internal authentication error'
      };
    }
  }

  /**
   * Extract API key from request headers
   */
  private extractApiKey(headers: Record<string, string | undefined>): string | null {
    // Try different header formats (case-insensitive)
    const headerKeys = [
      'x-api-key',
      'X-API-Key',
      'X-Api-Key',
      'authorization'
    ];

    for (const headerKey of headerKeys) {
      const headerValue = headers[headerKey] || headers[headerKey.toLowerCase()];
      
      if (headerValue && typeof headerValue === 'string') {
        // Handle Authorization header with Bearer token
        if (headerKey.toLowerCase() === 'authorization') {
          const match = headerValue.match(/^Bearer\s+(.+)$/i);
          if (match && match[1]) {
            return match[1];
          }
        } else {
          return headerValue as string;
        }
      }
    }

    return null;
  }

  /**
   * Validate API key against stored credentials
   */
  private async validateApiKey(apiKey: string): Promise<AuthResult> {
    try {
      if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 16) {
        return {
          isAuthenticated: false,
          error: 'Invalid API key format'
        };
      }

      // Load credentials
      const credentials = await this.loadCredentials();
      const hashedKey = this.hashApiKey(apiKey);

      // Find matching API key
      const matchingKey = credentials.apiKeys.find(key => 
        key.hashedKey === hashedKey && key.enabled
      );

      if (!matchingKey) {
        return {
          isAuthenticated: false,
          error: 'Invalid or disabled API key'
        };
      }

      return {
        isAuthenticated: true,
        clientId: matchingKey.keyId,
        clientName: matchingKey.clientName,
        permissions: matchingKey.permissions
      };
    } catch (error) {
      return {
        isAuthenticated: false,
        error: 'Internal error during API key validation'
      };
    }
  }

  /**
   * Load API key configuration from credential file
   */
  private async loadCredentials(): Promise<{ apiKeys: ApiKeyConfig[] }> {
    try {
      if (!fs.existsSync(this.credentialPath)) {
        throw new Error(`Credential file not found: ${this.credentialPath}`);
      }

      const credentialData = fs.readFileSync(this.credentialPath, 'utf8');
      const credentials = JSON.parse(credentialData);

      if (!credentials.apiKeys || !Array.isArray(credentials.apiKeys)) {
        throw new Error('Invalid credential file format');
      }

      return credentials;
    } catch (error) {
      throw new Error(`Failed to load credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Hash API key for secure storage comparison
   */
  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Generate authentication error response
   */
  createAuthErrorResponse(authResult: AuthResult, statusCode: number = 401): {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  } {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        error: {
          code: statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
          message: authResult.error || 'Authentication failed',
          timestamp: new Date().toISOString()
        }
      })
    };
  }
}