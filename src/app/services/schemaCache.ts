import type { OfflineStore, CachedSchema } from './offlineStore';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export class SchemaCache {
  constructor(private offlineStore: OfflineStore) {}

  /**
   * Cache a schema after viewing it online.
   */
  async cacheOnView(serviceId: string, schema: object, version: number): Promise<void> {
    await this.offlineStore.cacheSchema(serviceId, schema, version);
  }

  /**
   * Get the cached schema for offline rendering.
   * Returns null if no cache exists.
   */
  async getForOfflineRender(serviceId: string): Promise<CachedSchema | null> {
    return this.offlineStore.getCachedSchema(serviceId);
  }

  /**
   * Returns true if the cached schema is older than 7 days or doesn't exist.
   */
  async shouldRefresh(serviceId: string): Promise<boolean> {
    const cached = await this.offlineStore.getCachedSchema(serviceId);
    if (!cached) return true;
    return Date.now() - cached.cachedAt > SEVEN_DAYS_MS;
  }

  /**
   * Returns a human-readable string like "Cached 3 days ago" or null if not cached.
   */
  async displayCachedAt(serviceId: string): Promise<string | null> {
    const cached = await this.offlineStore.getCachedSchema(serviceId);
    if (!cached) return null;

    const diffMs = Date.now() - cached.cachedAt;
    const diffMinutes = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMinutes < 1) return 'Cached just now';
    if (diffMinutes < 60) return `Cached ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `Cached ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `Cached ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
}
