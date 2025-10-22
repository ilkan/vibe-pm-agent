// Enhanced authentication service for Lambda functions
// Supports both API keys and Cognito JWT tokens
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { promisify } from 'util';

// JWT verification (simplified - in production use a proper JWT library)
interface JWTHeader {
  alg: string;
  kid: string;
  typ: string;
}

interface JWTPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  token_use: string;
  given_name?: string;
  family_name?: string;
  name?: string;
}

export interface AuthResult {
  isAuthenticated: boolean;
  clientId?: string;
  clientName?: string;
  permissions?: string[];
  error?: string;
  authType?: 'api-key' | 'cognito-jwt';
  userId?: string;
  email?: string;
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
  private cognitoUserPoolId: string;
  private cognitoRegion: string;

  constructor(credentialPath?: string) {
    // Use environment variable, constructor parameter, or default path
    const defaultPath = process.env.CREDENTIAL_PATH || '.aws/api-keys.json';
    this.credentialPath = path.resolve(credentialPath || defaultPath);
    
    // Cognito configuration from environment
    this.cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID || 'us-east-1_gFn54IyZ5';
    this.cognitoRegion = process.env.COGNITO_REGION || process.env.AWS_REGION || 'us-east-1';
  }

  /**
   * Authenticate request using either API key or Cognito JWT token
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
      // First, try to extract and validate JWT token
      const jwtToken = this.extractJWTToken(headers);
      if (jwtToken) {
        console.log('JWT token found, attempting Cognito authentication');
        const jwtResult = await this.validateJWTToken(jwtToken);
        if (jwtResult.isAuthenticated) {
          return jwtResult;
        }
        console.log('JWT validation failed:', jwtResult.error);
      }

      // Fallback to API key authentication
      const apiKey = this.extractApiKey(headers);
      if (apiKey) {
        console.log('API key found, attempting API key authentication');
        const apiKeyResult = await this.validateApiKey(apiKey);
        return apiKeyResult;
      }

      // No valid authentication method found
      return {
        isAuthenticated: false,
        error: 'Authentication required. Provide either a valid JWT token in Authorization header or API key in X-API-Key header.'
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        isAuthenticated: false,
        error: 'Internal authentication error'
      };
    }
  }

  /**
   * Extract JWT token from Authorization header
   */
  private extractJWTToken(headers: Record<string, string | undefined>): string | null {
    const authHeader = headers['authorization'] || headers['Authorization'];
    
    if (authHeader && typeof authHeader === 'string') {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match && match[1]) {
        const token = match[1];
        // Basic check if it looks like a JWT (has 3 parts separated by dots)
        if (token.split('.').length === 3) {
          return token;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract API key from request headers (excluding JWT tokens)
   */
  private extractApiKey(headers: Record<string, string | undefined>): string | null {
    // Try X-API-Key header first
    const apiKeyHeaders = [
      'x-api-key',
      'X-API-Key',
      'X-Api-Key'
    ];

    for (const headerKey of apiKeyHeaders) {
      const headerValue = headers[headerKey] || headers[headerKey.toLowerCase()];
      if (headerValue && typeof headerValue === 'string') {
        return headerValue;
      }
    }

    // Check Authorization header for non-JWT tokens (API keys)
    const authHeader = headers['authorization'] || headers['Authorization'];
    if (authHeader && typeof authHeader === 'string') {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match && match[1]) {
        const token = match[1];
        // If it doesn't look like a JWT, treat it as an API key
        if (token.split('.').length !== 3) {
          return token;
        }
      }
    }

    return null;
  }

  /**
   * Validate Cognito JWT token
   */
  private async validateJWTToken(token: string): Promise<AuthResult> {
    try {
      // Parse JWT token (simplified validation - in production use proper JWT library)
      const payload = this.parseJWTPayload(token);
      
      if (!payload) {
        return {
          isAuthenticated: false,
          error: 'Invalid JWT token format',
          authType: 'cognito-jwt'
        };
      }

      // Validate token claims
      const now = Math.floor(Date.now() / 1000);
      
      // Check expiration
      if (payload.exp < now) {
        return {
          isAuthenticated: false,
          error: 'JWT token has expired',
          authType: 'cognito-jwt'
        };
      }

      // Check issuer (Cognito User Pool)
      const expectedIssuer = `https://cognito-idp.${this.cognitoRegion}.amazonaws.com/${this.cognitoUserPoolId}`;
      if (payload.iss !== expectedIssuer) {
        return {
          isAuthenticated: false,
          error: 'Invalid JWT token issuer',
          authType: 'cognito-jwt'
        };
      }

      // Check token use (should be 'id' for ID tokens or 'access' for access tokens)
      if (payload.token_use !== 'id' && payload.token_use !== 'access') {
        return {
          isAuthenticated: false,
          error: 'Invalid JWT token type',
          authType: 'cognito-jwt'
        };
      }

      // Validate email is verified (for ID tokens)
      if (payload.token_use === 'id' && !payload.email_verified) {
        return {
          isAuthenticated: false,
          error: 'Email not verified',
          authType: 'cognito-jwt'
        };
      }

      return {
        isAuthenticated: true,
        authType: 'cognito-jwt',
        userId: payload.sub,
        email: payload.email,
        clientId: payload.sub,
        clientName: payload.name || payload.email || 'Cognito User',
        permissions: ['all'] // Cognito users get all permissions
      };
    } catch (error) {
      console.error('JWT validation error:', error);
      return {
        isAuthenticated: false,
        error: 'JWT token validation failed',
        authType: 'cognito-jwt'
      };
    }
  }

  /**
   * Parse JWT payload (simplified - in production use proper JWT library with signature verification)
   */
  private parseJWTPayload(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode payload (base64url)
      const payload = parts[1];
      if (!payload) {
        return null;
      }
      const decoded = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
      return JSON.parse(decoded) as JWTPayload;
    } catch (error) {
      console.error('JWT parsing error:', error);
      return null;
    }
  }

  /**
   * Validate API key against stored credentials
   */
  private async validateApiKey(apiKey: string): Promise<AuthResult> {
    try {
      if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 16) {
        return {
          isAuthenticated: false,
          error: 'Invalid API key format',
          authType: 'api-key'
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
          error: 'Invalid or disabled API key',
          authType: 'api-key'
        };
      }

      return {
        isAuthenticated: true,
        authType: 'api-key',
        clientId: matchingKey.keyId,
        clientName: matchingKey.clientName,
        permissions: matchingKey.permissions
      };
    } catch (error) {
      return {
        isAuthenticated: false,
        error: 'Internal error during API key validation',
        authType: 'api-key'
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
          authType: authResult.authType || 'unknown',
          supportedMethods: [
            'JWT token in Authorization header (Bearer <token>)',
            'API key in X-API-Key header'
          ],
          timestamp: new Date().toISOString()
        }
      })
    };
  }
}