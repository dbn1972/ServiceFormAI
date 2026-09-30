/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// Precache all assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Runtime caching: API schema routes — NetworkFirst with 3s timeout
registerRoute(
  ({ url }) => url.pathname.startsWith('/consumer/services/'),
  new NetworkFirst({
    cacheName: 'api-schemas-v1',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 7 * 24 * 60 * 60,
        maxEntries: 50,
      }),
    ],
  }),
);

// Background Sync handler — notify all clients to process the sync queue
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'PROCESS_SYNC_QUEUE' });
        });
      }),
    );
  }
});

// Handle SKIP_WAITING messages from the app
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
