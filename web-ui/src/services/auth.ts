import { Amplify } from 'aws-amplify';
import { signInWithRedirect, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

// Enhanced Cognito configuration with AWS Q Developer best practices
const cognitoConfig = {
    Auth: {
        Cognito: {
            // Core Configuration
            userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
            userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
            // Note: Client secret should not be used in browser apps for security
            
            // OAuth Configuration (Enhanced)
            loginWith: {
                oauth: {
                    domain: import.meta.env.VITE_COGNITO_DOMAIN?.replace('https://', ''),
                    scopes: [
                        'email', 
                        'openid', 
                        'profile'
                    ],
                    redirectSignIn: [
                        import.meta.env.VITE_CALLBACK_URL || 'http://localhost:5173'
                    ],
                    redirectSignOut: [
                        import.meta.env.VITE_LOGOUT_URL || 'http://localhost:5173/logout'
                    ],
                    responseType: 'code',  // Authorization Code Grant (most secure)
                },
            },
        },
    },
};

// Initialize Amplify
Amplify.configure(cognitoConfig);

export interface User {
    userId: string;
    email: string;
    name?: string;
    givenName?: string;
    familyName?: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
}

class AuthService {
    private listeners: ((state: AuthState) => void)[] = [];
    private currentState: AuthState = {
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
    };

    constructor() {
        // Check if we're in development mode
        if (import.meta.env.VITE_DEV_MODE === 'true') {
            this.initializeDevMode();
        } else {
            this.initializeAuth();
        }
    }

    private async initializeDevMode() {
        console.log('🚀 Running in development mode - bypassing Cognito');
        // Simulate a logged-in user for development
        const mockUser: User = {
            userId: 'dev-user-123',
            email: 'developer@vibepm.com',
            name: 'Development User',
            givenName: 'Development',
            familyName: 'User',
        };

        this.updateState({
            isAuthenticated: true,
            user: mockUser,
            loading: false,
            error: null,
        });
    }

    private async initializeAuth() {
        try {
            // If we have a code in the URL, this is an OAuth callback
            if (window.location.search.includes('code=')) {
                console.log('OAuth callback detected, processing...');
                
                // Wait for Amplify to process the callback
                let attempts = 0;
                const maxAttempts = 20; // 10 seconds total
                
                while (attempts < maxAttempts) {
                    try {
                        // Force refresh the session to trigger token exchange
                        await fetchAuthSession({ forceRefresh: true });
                        const user = await this.getCurrentUser();
                        
                        if (user) {
                            console.log('OAuth callback successful, user authenticated');
                            // Clear the URL parameters
                            window.history.replaceState({}, document.title, window.location.pathname);
                            
                            this.updateState({
                                isAuthenticated: true,
                                user,
                                loading: false,
                                error: null,
                            });
                            return;
                        }
                    } catch (error) {
                        // Don't log UserUnAuthenticatedException during OAuth processing
                        if (error instanceof Error && !error.message.includes('UserUnAuthenticatedException')) {
                            console.log(`OAuth attempt ${attempts + 1} failed:`, error);
                        }
                    }
                    
                    attempts++;
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                console.error('OAuth callback failed after all attempts');
                this.updateState({
                    isAuthenticated: false,
                    user: null,
                    loading: false,
                    error: 'Authentication failed. Please try again.',
                });
                return;
            }
            
            // Normal initialization (no OAuth callback)
            const user = await this.getCurrentUser();
            this.updateState({
                isAuthenticated: !!user,
                user,
                loading: false,
                error: null,
            });
        } catch (error) {
            // Don't log "UserUnAuthenticatedException" as it's expected when no user is signed in
            if (error instanceof Error && !error.message.includes('UserUnAuthenticatedException')) {
                console.error('Auth initialization error:', error);
            }
            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null, // Don't treat "no user" as an error
            });
        }
    }

    private updateState(newState: Partial<AuthState>) {
        this.currentState = { ...this.currentState, ...newState };
        this.listeners.forEach(listener => listener(this.currentState));
    }

    public subscribe(listener: (state: AuthState) => void) {
        this.listeners.push(listener);
        // Immediately call with current state
        listener(this.currentState);

        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    public getState(): AuthState {
        return this.currentState;
    }

    public async signInWithHostedUI() {
        try {
            this.updateState({ loading: true, error: null });
            await signInWithRedirect({ provider: 'Cognito' });
        } catch (error) {
            console.error('Sign in error:', error);
            this.updateState({
                loading: false,
                error: error instanceof Error ? error.message : 'Sign in failed',
            });
            throw error;
        }
    }

    public async signOut() {
        try {
            this.updateState({ loading: true, error: null });
            await signOut();
            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null,
            });
        } catch (error) {
            console.error('Sign out error:', error);
            this.updateState({
                loading: false,
                error: error instanceof Error ? error.message : 'Sign out failed',
            });
            throw error;
        }
    }

    public async getCurrentUser(): Promise<User | null> {
        try {
            const user = await getCurrentUser();
            const session = await fetchAuthSession();

            if (!user || !session.tokens) {
                return null;
            }

            const idToken = session.tokens.idToken;
            const payload = idToken?.payload;

            return {
                userId: user.userId,
                email: payload?.email as string || '',
                name: payload?.name as string,
                givenName: payload?.given_name as string,
                familyName: payload?.family_name as string,
            };
        } catch (error) {
            // Only log unexpected errors, not authentication errors
            if (error instanceof Error && !error.message.includes('UserUnAuthenticatedException')) {
                console.error('Get current user error:', error);
            }
            return null;
        }
    }

    public async getAccessToken(): Promise<string | null> {
        try {
            const session = await fetchAuthSession();
            return session.tokens?.accessToken?.toString() || null;
        } catch (error) {
            console.error('Get access token error:', error);
            return null;
        }
    }

    public async getIdToken(): Promise<string | null> {
        try {
            const session = await fetchAuthSession();
            return session.tokens?.idToken?.toString() || null;
        } catch (error) {
            console.error('Get ID token error:', error);
            return null;
        }
    }

    public async refreshSession() {
        try {
            // Force a session refresh by fetching auth session first
            await fetchAuthSession({ forceRefresh: true });
            const user = await this.getCurrentUser();
            this.updateState({
                isAuthenticated: !!user,
                user,
                error: null,
            });
        } catch (error) {
            console.error('Refresh session error:', error);
            this.updateState({
                isAuthenticated: false,
                user: null,
                error: error instanceof Error ? error.message : 'Session refresh failed',
            });
        }
    }


}

// Export singleton instance
export const authService = new AuthService();

// React hook for using auth state
export function useAuth() {
    const [authState, setAuthState] = React.useState<AuthState>(authService.getState());

    React.useEffect(() => {
        const unsubscribe = authService.subscribe(setAuthState);
        return unsubscribe;
    }, []);

    return {
        ...authState,
        signIn: () => authService.signInWithHostedUI(),
        signOut: () => authService.signOut(),
        refreshSession: () => authService.refreshSession(),
        getAccessToken: () => authService.getAccessToken(),
        getIdToken: () => authService.getIdToken(),
    };
}

// Add React import for the hook
import React from 'react';