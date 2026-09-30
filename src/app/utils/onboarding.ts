type IdentitySource = {
  id?: string | null;
  email?: string | null;
  mobile?: string | null;
};

const PENDING_ONBOARDING_IDENTITY_KEY = 'pendingOnboardingIdentity';

export function normalizeOnboardingIdentity(identity: string): string {
  return identity.trim().toLowerCase();
}

export function getOnboardingStorageKey(identity: string): string {
  return `citizenOnboardingCompleted:${normalizeOnboardingIdentity(identity)}`;
}

export function getOnboardingIdentityFromUser(user: IdentitySource | null | undefined): string | null {
  if (!user) {
    return null;
  }

  return user.email || user.id || user.mobile || null;
}

export function getOnboardingIdentitiesFromUser(user: IdentitySource | null | undefined): string[] {
  if (!user) {
    return [];
  }

  const identities = [user.email, user.id, user.mobile]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => normalizeOnboardingIdentity(value));

  return Array.from(new Set(identities));
}

export function isOnboardingCompleted(identity: string | null | undefined): boolean {
  if (!identity) {
    return false;
  }

  return localStorage.getItem(getOnboardingStorageKey(identity)) === 'true';
}

export function markOnboardingCompleted(identity: string | null | undefined) {
  if (!identity) {
    return;
  }

  localStorage.setItem(getOnboardingStorageKey(identity), 'true');
}

export function isOnboardingCompletedForUser(user: IdentitySource | null | undefined): boolean {
  return getOnboardingIdentitiesFromUser(user).some((identity) => isOnboardingCompleted(identity));
}

export function markOnboardingCompletedForUser(
  user: IdentitySource | null | undefined,
  extraIdentity?: string | null | undefined,
) {
  const identities = getOnboardingIdentitiesFromUser(user);
  if (extraIdentity) {
    identities.push(normalizeOnboardingIdentity(extraIdentity));
  }

  Array.from(new Set(identities)).forEach((identity) => {
    markOnboardingCompleted(identity);
  });
}

export function setPendingOnboardingIdentity(identity: string | null | undefined) {
  if (!identity) {
    sessionStorage.removeItem(PENDING_ONBOARDING_IDENTITY_KEY);
    return;
  }

  sessionStorage.setItem(PENDING_ONBOARDING_IDENTITY_KEY, normalizeOnboardingIdentity(identity));
}

export function getPendingOnboardingIdentity(): string | null {
  return sessionStorage.getItem(PENDING_ONBOARDING_IDENTITY_KEY);
}

export function clearPendingOnboardingIdentity() {
  sessionStorage.removeItem(PENDING_ONBOARDING_IDENTITY_KEY);
}