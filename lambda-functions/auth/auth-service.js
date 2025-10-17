"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
// Simple authentication service for Lambda functions
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
class AuthService {
    constructor(credentialPath) {
        // Use environment variable, constructor parameter, or default path
        const defaultPath = process.env.CREDENTIAL_PATH || '.aws/api-keys.json';
        this.credentialPath = path.resolve(credentialPath || defaultPath);
    }
    /**
     * Authenticate request using API key from headers
     */
    async authenticateRequest(headers, requestContext) {
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
        }
        catch (error) {
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
    extractApiKey(headers) {
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
                }
                else {
                    return headerValue;
                }
            }
        }
        return null;
    }
    /**
     * Validate API key against stored credentials
     */
    async validateApiKey(apiKey) {
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
            const matchingKey = credentials.apiKeys.find(key => key.hashedKey === hashedKey && key.enabled);
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
        }
        catch (error) {
            return {
                isAuthenticated: false,
                error: 'Internal error during API key validation'
            };
        }
    }
    /**
     * Load API key configuration from credential file
     */
    async loadCredentials() {
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
        }
        catch (error) {
            throw new Error(`Failed to load credentials: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Hash API key for secure storage comparison
     */
    hashApiKey(apiKey) {
        return crypto.createHash('sha256').update(apiKey).digest('hex');
    }
    /**
     * Generate authentication error response
     */
    createAuthErrorResponse(authResult, statusCode = 401) {
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
exports.AuthService = AuthService;
//# sourceMappingURL=auth-service.js.map