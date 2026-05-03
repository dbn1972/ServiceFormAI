/**
 * SSO Authentication Service
 * Handles OAuth 2.0 flows for Google, Microsoft/Azure AD, and DigiLocker
 */

export type SSOProvider = 'google' | 'microsoft' | 'digilocker' | 'aadhaar';

interface SSOConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
  authEndpoint: string;
}

// SSO Configuration (should be in .env in production)
const SSO_CONFIGS: Record<SSOProvider, SSOConfig> = {
  google: {
    clientId: (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    redirectUri: `${window.location.origin}/auth/callback/google`,
    scope: 'openid profile email',
    authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  microsoft: {
    clientId: (import.meta as any).env?.VITE_MICROSOFT_CLIENT_ID || 'YOUR_MICROSOFT_CLIENT_ID',
    redirectUri: `${window.location.origin}/auth/callback/microsoft`,
    scope: 'openid profile email',
    authEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  },
  digilocker: {
    clientId: (import.meta as any).env?.VITE_DIGILOCKER_CLIENT_ID || 'YOUR_DIGILOCKER_CLIENT_ID',
    redirectUri: `${window.location.origin}/auth/callback/digilocker`,
    scope: 'all',
    authEndpoint: 'https://digitallocker.gov.in/public/oauth2/1/authorize',
  },
  aadhaar: {
    // Aadhaar OTP is handled differently (not OAuth)
    clientId: '',
    redirectUri: '',
    scope: '',
    authEndpoint: '',
  },
};

/**
 * Generate random state for CSRF protection
 */
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate PKCE code verifier and challenge
 */
async function generatePKCE() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return { codeVerifier, codeChallenge };
}

/**
 * Store state and code verifier in session storage
 */
function storeOAuthState(provider: SSOProvider, state: string, codeVerifier: string) {
  sessionStorage.setItem(`oauth_state_${provider}`, state);
  sessionStorage.setItem(`oauth_verifier_${provider}`, codeVerifier);
  sessionStorage.setItem('oauth_provider', provider);
}

/**
 * Retrieve and validate OAuth state
 */
export function validateOAuthState(provider: SSOProvider, state: string): boolean {
  const storedState = sessionStorage.getItem(`oauth_state_${provider}`);
  return storedState === state;
}

/**
 * Get code verifier for token exchange
 */
export function getCodeVerifier(provider: SSOProvider): string | null {
  return sessionStorage.getItem(`oauth_verifier_${provider}`);
}

/**
 * Clear OAuth state after successful authentication
 */
export function clearOAuthState(provider: SSOProvider) {
  sessionStorage.removeItem(`oauth_state_${provider}`);
  sessionStorage.removeItem(`oauth_verifier_${provider}`);
  sessionStorage.removeItem('oauth_provider');
}

/**
 * Initiate Google OAuth flow
 */
export async function loginWithGoogle() {
  const config = SSO_CONFIGS.google;
  const state = generateState();
  const { codeVerifier, codeChallenge } = await generatePKCE();

  storeOAuthState('google', state, codeVerifier);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
  });

  window.location.href = `${config.authEndpoint}?${params.toString()}`;
}

/**
 * Initiate Microsoft/Azure AD OAuth flow
 */
export async function loginWithMicrosoft() {
  const config = SSO_CONFIGS.microsoft;
  const state = generateState();
  const { codeVerifier, codeChallenge } = await generatePKCE();

  storeOAuthState('microsoft', state, codeVerifier);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    response_mode: 'query',
  });

  window.location.href = `${config.authEndpoint}?${params.toString()}`;
}

/**
 * Initiate DigiLocker OAuth flow
 */
export async function loginWithDigiLocker() {
  const config = SSO_CONFIGS.digilocker;
  const state = generateState();
  const { codeVerifier, codeChallenge } = await generatePKCE();

  storeOAuthState('digilocker', state, codeVerifier);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `${config.authEndpoint}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  provider: SSOProvider,
  code: string
): Promise<{
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const codeVerifier = getCodeVerifier(provider);
  if (!codeVerifier) {
    throw new Error('Code verifier not found');
  }

  const config = SSO_CONFIGS[provider];
  const tokenEndpoint = getTokenEndpoint(provider);

  const body = new URLSearchParams({
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Get user profile from ID token or profile endpoint
 */
export async function getUserProfile(
  provider: SSOProvider,
  accessToken: string
): Promise<{
  id: string;
  email: string;
  name: string;
  picture?: string;
  aadhaar?: string; // For DigiLocker
}> {
  const profileEndpoint = getProfileEndpoint(provider);

  const response = await fetch(profileEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  const data = await response.json();

  // Normalize profile data across providers
  return normalizeProfile(provider, data);
}

/**
 * Get token endpoint for provider
 */
function getTokenEndpoint(provider: SSOProvider): string {
  const endpoints: Record<SSOProvider, string> = {
    google: 'https://oauth2.googleapis.com/token',
    microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    digilocker: 'https://digitallocker.gov.in/public/oauth2/1/token',
    aadhaar: '',
  };
  return endpoints[provider];
}

/**
 * Get profile endpoint for provider
 */
function getProfileEndpoint(provider: SSOProvider): string {
  const endpoints: Record<SSOProvider, string> = {
    google: 'https://www.googleapis.com/oauth2/v2/userinfo',
    microsoft: 'https://graph.microsoft.com/v1.0/me',
    digilocker: 'https://digitallocker.gov.in/public/oauth2/1/user',
    aadhaar: '',
  };
  return endpoints[provider];
}

/**
 * Normalize user profile across providers
 */
function normalizeProfile(provider: SSOProvider, data: any): {
  id: string;
  email: string;
  name: string;
  picture?: string;
  aadhaar?: string;
} {
  switch (provider) {
    case 'google':
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
      };

    case 'microsoft':
      return {
        id: data.id,
        email: data.mail || data.userPrincipalName,
        name: data.displayName,
      };

    case 'digilocker':
      return {
        id: data.digilocker_id,
        email: data.email,
        name: data.name,
        aadhaar: data.aadhaar_number,
      };

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Aadhaar OTP Authentication (Mock for now)
 * In production, this would integrate with UIDAI's Aadhaar Authentication API
 */
export async function sendAadhaarOTP(aadhaarNumber: string): Promise<{ transactionId: string }> {
  // Mock implementation
  // In production: Call UIDAI API to send OTP

  // Validate Aadhaar format (12 digits)
  if (!/^\d{12}$/.test(aadhaarNumber)) {
    throw new Error('Invalid Aadhaar number');
  }

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    transactionId: `TXN${Date.now()}`,
  };
}

/**
 * Verify Aadhaar OTP (Mock for now)
 */
export async function verifyAadhaarOTP(
  _transactionId: string,
  otp: string
): Promise<{
  success: boolean;
  aadhaar_number: string;
  name: string;
  dob: string;
}> {
  // Mock implementation
  // In production: Call UIDAI API to verify OTP

  if (!/^\d{6}$/.test(otp)) {
    throw new Error('Invalid OTP');
  }

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock successful verification
  return {
    success: true,
    aadhaar_number: '1234 5678 9012',
    name: 'Mock User',
    dob: '01/01/1990',
  };
}

/**
 * Check if SSO is configured for a provider
 */
export function isSSOConfigured(provider: SSOProvider): boolean {
  const config = SSO_CONFIGS[provider];
  return config.clientId !== '' && !config.clientId.includes('YOUR_');
}

/**
 * Get currently active OAuth provider from session
 */
export function getActiveOAuthProvider(): SSOProvider | null {
  return sessionStorage.getItem('oauth_provider') as SSOProvider | null;
}
