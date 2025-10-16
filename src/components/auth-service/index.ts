import { CredentialManager } from '../credential-manager/index';

export interface AuthMetrics {
  timestamp: string;
  clientId?: string;
  clientName?: string;
  success: boolean;
  errorCode?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  endpoint?: string;
  processingTime?: number;
}

export interface LoggingConfig {
  enableCloudWatch: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  includeHeaders: boolean;
  maskSensitiveData: boolean;
}

export interface AuthResult {
  isAuthenticated: boolean;
  clientId?: string;
  clientName?: string;
  permissions?: string[];
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    burstLimit: number;
  };
  error?: string;
}

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401,
    public context?: any
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

export class AuthService {
  private credentialManager: CredentialManager;
  private loggingConfig: LoggingConfig;

  constructor(credentialPath?: string, loggingConfig?: Partial<LoggingConfig>) {
    this.credentialManager = new CredentialManager(credentialPath);
    this.loggingConfig = {
      enableCloudWatch: true,
      logLevel: 'info',
      includeHeaders: false,
      maskSensitiveData: true,
      ...loggingConfig
    };
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
    const startTime = Date.now();
    let authResult: AuthResult;

    try {
      // Extract API key from headers (support multiple header formats)
      const apiKey = this.extractApiKey(headers);
      
      if (!apiKey) {
        authResult = {
          isAuthenticated: false,
          error: 'API key is required. Provide it in X-API-Key header.'
        };
      } else {
        // Validate the API key
        const validationResult = await this.credentialManager.validateApiKey(apiKey);

        if (!validationResult.isValid) {
          authResult = {
            isAuthenticated: false,
            error: validationResult.error || 'Invalid API key'
          };
        } else {
          authResult = {
            isAuthenticated: true,
            clientId: validationResult.clientId,
            clientName: validationResult.clientName,
            permissions: validationResult.permissions,
            rateLimit: validationResult.rateLimit
          };
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      authResult = {
        isAuthenticated: false,
        error: 'Internal authentication error'
      };
    }

    // Log the authentication attempt
    const processingTime = Date.now() - startTime;
    await this.logAuthenticationAttempt(authResult, requestContext, processingTime);

    return authResult;
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
      
      if (headerValue) {
        // Handle Authorization header with Bearer token
        if (headerKey.toLowerCase() === 'authorization') {
          const match = headerValue.match(/^Bearer\s+(.+)$/i);
          if (match) {
            return match[1];
          }
        } else {
          return headerValue;
        }
      }
    }

    return null;
  }

  /**
   * Check if client has specific permission
   */
  hasPermission(authResult: AuthResult, permission: string): boolean {
    if (!authResult.isAuthenticated || !authResult.permissions) {
      return false;
    }

    // 'all' permission grants access to everything
    if (authResult.permissions.includes('all')) {
      return true;
    }

    return authResult.permissions.includes(permission);
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

  /**
   * Log authentication attempt with metrics
   */
  async logAuthenticationAttempt(
    authResult: AuthResult,
    requestContext?: {
      requestId?: string;
      userAgent?: string;
      ipAddress?: string;
      endpoint?: string;
      headers?: Record<string, string | undefined>;
    },
    processingTime?: number
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const metrics: AuthMetrics = {
        timestamp: new Date().toISOString(),
        clientId: authResult.clientId,
        clientName: authResult.clientName,
        success: authResult.isAuthenticated,
        errorCode: authResult.isAuthenticated ? undefined : this.getErrorCode(authResult.error),
        requestId: requestContext?.requestId,
        userAgent: this.loggingConfig.maskSensitiveData 
          ? this.maskUserAgent(requestContext?.userAgent) 
          : requestContext?.userAgent,
        ipAddress: this.loggingConfig.maskSensitiveData 
          ? this.maskIpAddress(requestContext?.ipAddress) 
          : requestContext?.ipAddress,
        endpoint: requestContext?.endpoint,
        processingTime: processingTime || (Date.now() - startTime)
      };

      // Log to console (CloudWatch will capture this)
      if (this.loggingConfig.enableCloudWatch) {
        this.logToCloudWatch(metrics, requestContext?.headers);
      }

      // Log metrics for monitoring
      this.logMetrics(metrics);

    } catch (error) {
      console.error('Failed to log authentication attempt:', error);
    }
  }

  /**
   * Log to CloudWatch via console with structured format
   */
  private logToCloudWatch(metrics: AuthMetrics, headers?: Record<string, string | undefined>): void {
    const logLevel = metrics.success ? 'info' : 'warn';
    
    if (this.shouldLog(logLevel)) {
      const logEntry = {
        level: logLevel,
        message: metrics.success ? 'Authentication successful' : 'Authentication failed',
        metrics,
        ...(this.loggingConfig.includeHeaders && headers ? { headers: this.sanitizeHeaders(headers) } : {})
      };

      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Log metrics for monitoring and alerting
   */
  private logMetrics(metrics: AuthMetrics): void {
    // Log success/failure metrics
    const metricName = metrics.success ? 'AuthenticationSuccess' : 'AuthenticationFailure';
    
    console.log(JSON.stringify({
      MetricName: metricName,
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        { Name: 'ClientId', Value: metrics.clientId || 'unknown' },
        { Name: 'ErrorCode', Value: metrics.errorCode || 'none' }
      ],
      Timestamp: metrics.timestamp
    }));

    // Log processing time metric
    if (metrics.processingTime) {
      console.log(JSON.stringify({
        MetricName: 'AuthenticationProcessingTime',
        Value: metrics.processingTime,
        Unit: 'Milliseconds',
        Dimensions: [
          { Name: 'ClientId', Value: metrics.clientId || 'unknown' }
        ],
        Timestamp: metrics.timestamp
      }));
    }
  }

  /**
   * Determine if we should log at the given level
   */
  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.loggingConfig.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    
    return requestedLevelIndex >= currentLevelIndex;
  }

  /**
   * Extract error code from error message
   */
  private getErrorCode(error?: string): string {
    if (!error) return 'UNKNOWN_ERROR';
    
    if (error.includes('required')) return 'MISSING_API_KEY';
    if (error.includes('Invalid') || error.includes('invalid')) return 'INVALID_API_KEY';
    if (error.includes('expired')) return 'EXPIRED_API_KEY';
    if (error.includes('disabled')) return 'DISABLED_API_KEY';
    
    return 'AUTHENTICATION_ERROR';
  }

  /**
   * Mask sensitive parts of user agent
   */
  private maskUserAgent(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;
    
    // Keep first and last 10 characters, mask the middle
    if (userAgent.length > 20) {
      const start = userAgent.substring(0, 10);
      const end = userAgent.substring(userAgent.length - 10);
      return `${start}***${end}`;
    }
    
    return userAgent;
  }

  /**
   * Mask IP address for privacy
   */
  private maskIpAddress(ipAddress?: string): string | undefined {
    if (!ipAddress) return undefined;
    
    // Mask last octet of IPv4 addresses
    if (ipAddress.includes('.')) {
      const parts = ipAddress.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
      }
    }
    
    // For IPv6 or other formats, mask last part
    if (ipAddress.includes(':')) {
      const parts = ipAddress.split(':');
      if (parts.length > 1) {
        parts[parts.length - 1] = '***';
        return parts.join(':');
      }
    }
    
    return ipAddress;
  }

  /**
   * Sanitize headers by removing sensitive information
   */
  private sanitizeHeaders(headers: Record<string, string | undefined>): Record<string, string | undefined> {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = [
      'x-api-key',
      'authorization',
      'cookie',
      'x-forwarded-for'
    ];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '***';
      }
      if (sanitized[header.toLowerCase()]) {
        sanitized[header.toLowerCase()] = '***';
      }
    });
    
    return sanitized;
  }
}