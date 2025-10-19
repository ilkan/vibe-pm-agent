import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../services/auth';

interface LoginProps {
  onLogin: (user: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const { isAuthenticated, user, loading, error, signIn } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Handle successful authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      onLogin(user);
      toast.success(`Welcome back, ${user.name || user.email}!`);
    }
  }, [isAuthenticated, user, onLogin]);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
      toast.error('Sign in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="mb-2">Vibe PM Agent</h1>
          <p className="text-sm opacity-60">
            AI-powered product management assistant
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in with your AWS Cognito account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleSignIn} 
              className="w-full" 
              disabled={loading || isSigningIn}
            >
              {loading || isSigningIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {loading ? 'Loading...' : 'Redirecting...'}
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Sign in with AWS Cognito
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>You'll be redirected to AWS Cognito for secure authentication</p>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button
                onClick={() => toast.info('Contact your administrator to request access')}
                className="text-primary hover:underline"
              >
                Request access
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            By signing in, you agree to our{' '}
            <button className="text-primary hover:underline">Terms of Service</button>
            {' '}and{' '}
            <button className="text-primary hover:underline">Privacy Policy</button>
          </p>
        </div>
      </div>
    </div>
  );
}
