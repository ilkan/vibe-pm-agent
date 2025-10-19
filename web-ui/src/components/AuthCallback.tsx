import { useEffect } from 'react';
import { useAuth } from '../services/auth';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AuthCallbackProps {
  onAuthComplete: (user: any) => void;
}

export function AuthCallback({ onAuthComplete }: AuthCallbackProps) {
  const { isAuthenticated, user, loading, error } = useAuth();

  useEffect(() => {
    // Just wait for Amplify to automatically handle the callback
    const timer = setTimeout(() => {
      if (!isAuthenticated && !loading) {
        toast.error('Authentication timed out. Please try again.');
        window.location.href = '/';
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      onAuthComplete(user);
    }
  }, [isAuthenticated, user, onAuthComplete]);

  useEffect(() => {
    if (error) {
      toast.error(`Authentication error: ${error}`);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted/20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-lg font-semibold mb-2">Completing sign in...</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we verify your credentials
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted/20">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold mb-2">Authentication Failed</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="text-primary hover:underline"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  // If we get here without being authenticated, redirect to login
  if (!isAuthenticated) {
    window.location.href = '/';
    return null;
  }

  return null;
}