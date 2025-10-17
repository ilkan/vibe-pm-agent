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
export declare class AuthService {
    private credentialPath;
    constructor(credentialPath?: string);
    /**
     * Authenticate request using API key from headers
     */
    authenticateRequest(headers: Record<string, string | undefined>, requestContext?: {
        requestId?: string;
        userAgent?: string;
        ipAddress?: string;
        endpoint?: string;
    }): Promise<AuthResult>;
    /**
     * Extract API key from request headers
     */
    private extractApiKey;
    /**
     * Validate API key against stored credentials
     */
    private validateApiKey;
    /**
     * Load API key configuration from credential file
     */
    private loadCredentials;
    /**
     * Hash API key for secure storage comparison
     */
    private hashApiKey;
    /**
     * Generate authentication error response
     */
    createAuthErrorResponse(authResult: AuthResult, statusCode?: number): {
        statusCode: number;
        body: string;
        headers: Record<string, string>;
    };
}
//# sourceMappingURL=auth-service.d.ts.map