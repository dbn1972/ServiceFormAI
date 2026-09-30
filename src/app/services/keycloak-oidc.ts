import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const env = (import.meta as any).env || {};
const issuer = env.VITE_KEYCLOAK_ISSUER as string | undefined;
const clientId = env.VITE_KEYCLOAK_CLIENT_ID as string | undefined;

const userManager = issuer && clientId
  ? new UserManager({
      authority: issuer,
      client_id: clientId,
      redirect_uri: `${window.location.origin}/auth/callback/keycloak`,
      response_type: 'code',
      scope: 'openid profile email',
      userStore: new WebStorageStateStore({ store: window.sessionStorage }),
      stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
      loadUserInfo: false,
      automaticSilentRenew: false,
      monitorSession: false,
    })
  : null;

export function isKeycloakConfigured(): boolean {
  return userManager !== null;
}

export async function startKeycloakLogin(): Promise<void> {
  if (!userManager) {
    throw new Error('Tenant staff identity provider is not configured');
  }
  await userManager.signinRedirect();
}

export async function completeKeycloakLogin() {
  if (!userManager) {
    throw new Error('Tenant staff identity provider is not configured');
  }
  const user = await userManager.signinRedirectCallback();
  if (!user.access_token || user.expired) {
    throw new Error('Tenant staff identity token is missing or expired');
  }
  const accessToken = user.access_token;
  await userManager.removeUser();
  return { access_token: accessToken };
}