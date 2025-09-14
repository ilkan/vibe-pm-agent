/**
 * Production-specific configuration for MCP server
 */

import { LogLevel } from '../models/mcp';

export interface ProductionConfig {
  logging: {
    level: LogLevel;
    enableConsoleOutput: boolean;
    enableStructuredLogging: boolean;
    enablePerformanceLogging: boolean;
  };
  performance: {
    enableMetrics: boolean;
    enableCaching: boolean;
    maxCacheSize: number;
    requestTimeout: number;
  };
  security: {
    enableInputValidation: boolean;
    enableOutputSanitization: boolean;
    maxRequestSize: number;
  };
}

/**
 * Default production configuration
 */
export const DEFAULT_PRODUCTION_CONFIG: ProductionConfig = {
  logging: {
    level: LogLevel.WARN, // Only warnings and errors in production
    enableConsoleOutput: true,
    enableStructuredLogging: true,
    enablePerformanceLogging: false, // Disable detailed performance logging
  },
  performance: {
    enableMetrics: true,
    enableCaching: true,
    maxCacheSize: 1000,
    requestTimeout: 30000, // 30 seconds
  },
  security: {
    enableInputValidation: true,
    enableOutputSanitization: true,
    maxRequestSize: 10 * 1024 * 1024, // 10MB
  },
};

/**
 * Development configuration for comparison
 */
export const DEVELOPMENT_CONFIG: ProductionConfig = {
  logging: {
    level: LogLevel.DEBUG,
    enableConsoleOutput: true,
    enableStructuredLogging: true,
    enablePerformanceLogging: true,
  },
  performance: {
    enableMetrics: true,
    enableCaching: false, // Disable caching in development
    maxCacheSize: 100,
    requestTimeout: 60000, // 60 seconds for debugging
  },
  security: {
    enableInputValidation: true,
    enableOutputSanitization: false, // Allow full output in development
    maxRequestSize: 50 * 1024 * 1024, // 50MB for development
  },
};

/**
 * Get configuration based on environment
 */
export function getProductionConfig(): ProductionConfig {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return {
      ...DEFAULT_PRODUCTION_CONFIG,
      // Override with environment variables if provided
      logging: {
        ...DEFAULT_PRODUCTION_CONFIG.logging,
        level: getLogLevelFromEnv() || DEFAULT_PRODUCTION_CONFIG.logging.level,
      },
    };
  }
  
  return DEVELOPMENT_CONFIG;
}

/**
 * Parse log level from environment variable
 */
function getLogLevelFromEnv(): LogLevel | undefined {
  const envLevel = process.env.MCP_LOG_LEVEL?.toUpperCase();
  
  switch (envLevel) {
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'WARN':
      return LogLevel.WARN;
    case 'ERROR':
      return LogLevel.ERROR;
    case 'FATAL':
      return LogLevel.FATAL;
    default:
      return undefined;
  }
}

/**
 * Production-optimized logger configuration
 */
export class ProductionLogger {
  private static config: ProductionConfig;
  
  static initialize(config?: ProductionConfig): void {
    this.config = config || getProductionConfig();
  }
  
  static getConfig(): ProductionConfig {
    return this.config || getProductionConfig();
  }
  
  /**
   * Check if logging is enabled for production
   */
  static isLoggingEnabled(): boolean {
    const config = this.getConfig();
    return config.logging.enableConsoleOutput;
  }
  
  /**
   * Get production log level
   */
  static getLogLevel(): LogLevel {
    const config = this.getConfig();
    return config.logging.level;
  }
  
  /**
   * Production-safe error logging
   */
  static logError(message: string, error?: Error, context?: Record<string, any>): void {
    if (!this.isLoggingEnabled()) return;
    
    const config = this.getConfig();
    
    if (config.logging.enableStructuredLogging) {
      const logEntry = {
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        message,
        error: error ? {
          message: error.message,
          type: error.constructor.name,
          // Only include stack trace in development
          ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
        } : undefined,
        context: config.security.enableOutputSanitization ? 
          this.sanitizeContext(context) : context,
      };
      
      console.error(JSON.stringify(logEntry));
    } else {
      console.error(`[ERROR] ${message}`, error?.message || '');
    }
  }
  
  /**
   * Production-safe warning logging
   */
  static logWarning(message: string, context?: Record<string, any>): void {
    if (!this.isLoggingEnabled()) return;
    
    const config = this.getConfig();
    
    if (config.logging.enableStructuredLogging) {
      const logEntry = {
        level: 'WARN',
        timestamp: new Date().toISOString(),
        message,
        context: config.security.enableOutputSanitization ? 
          this.sanitizeContext(context) : context,
      };
      
      console.warn(JSON.stringify(logEntry));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  }
  
  /**
   * Sanitize context for production logging
   */
  private static sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;
    
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(context)) {
      // Remove sensitive information
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 1000) {
        // Truncate long strings
        sanitized[key] = value.substring(0, 1000) + '... [TRUNCATED]';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  /**
   * Check if a key contains sensitive information
   */
  private static isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /key/i,
      /auth/i,
      /credential/i,
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(key));
  }
}