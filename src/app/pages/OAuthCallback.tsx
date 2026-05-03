import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import {
  validateOAuthState,
  exchangeCodeForToken,
  getUserProfile,
  clearOAuthState,
  getActiveOAuthProvider,
  type SSOProvider
} from '../services/sso';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export default function OAuthCallback() {
  const { loginWithSSO } = useApp();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // Parse URL parameters
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      // Check for OAuth errors
      if (error) {
        throw new Error(errorDescription || error);
      }

      if (!code || !state) {
        throw new Error('Missing authorization code or state');
      }

      // Get provider from session
      const provider = getActiveOAuthProvider();
      if (!provider) {
        throw new Error('OAuth provider not found');
      }

      // Validate state to prevent CSRF
      if (!validateOAuthState(provider, state)) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      // Exchange code for access token
      setStatus('loading');
      const tokenResponse = await exchangeCodeForToken(provider, code);

      // Get user profile
      const profile = await getUserProfile(provider, tokenResponse.access_token);

      // Clear OAuth state
      clearOAuthState(provider);

      // Login with SSO profile
      const success = await loginWithSSO(provider, {
        ...profile,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
      });

      if (success) {
        setStatus('success');
        toast.success(`Logged in with ${getProviderName(provider)}!`);

        // Redirect to dashboard after short delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        throw new Error('SSO login failed');
      }

    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
      toast.error('Authentication failed');

      // Redirect to login after delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    }
  };

  const getProviderName = (provider: SSOProvider): string => {
    const names: Record<SSOProvider, string> = {
      google: 'Google',
      microsoft: 'Microsoft',
      digilocker: 'DigiLocker',
      aadhaar: 'Aadhaar',
    };
    return names[provider];
  };

  const provider = getActiveOAuthProvider();
  const providerName = provider ? getProviderName(provider) : 'SSO';

  return (
    <div className="min-h-full bg-gradient-to-br from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" aria-hidden="true" role="status" aria-label="Authenticating" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Authenticating...</h2>
              <p className="text-muted-foreground">
                Completing {providerName} sign-in
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Success!</h2>
              <p className="text-muted-foreground">
                Redirecting to your dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Authentication Failed</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {errorMessage}
              </p>
              <p className="text-xs text-muted-foreground">
                Redirecting to login...
              </p>
            </>
          )}
        </div>

        {/* Security Notice */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Secured by Government of India • MeitY
        </p>
      </div>
    </div>
  );
}
