/* apps/web/public/sw.js
 * Vimad PWA service worker — A6 offline-tolerant front desk.
 * Strategy:
 *   - App shell + navigation: network-first, precached index.html fallback.
 *   - GET /v1/* (operational snapshot): network-first, runtime-cache fallback
 *     so a hard refresh works offline. The data layer ALSO mirrors reads into
 *     IndexedDB (lib/offline/snapshot.ts) — SW cache keeps the page loadable,
 *     IDB snapshot seeds the React data layer.
 *   - Mutations are NEVER handled here. They are queued by the page-layer
 *     fetch wrapper (lib/offline/queue.ts) which owns auth headers and
 *     conflict resolution. SW only nudges the page to flush (bg sync).
 */

const VERSION = 'vimad-a6-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const API_CACHE = `${VERSION}-api`;

const APP_SHELL = ['./', '/index.html', '/manifest.webmanifest', '/favicon.svg'];

const isApiGet = (url) =>
  url.origin === self.location.origin &&
  url.pathname.startsWith('/v1/') &&
  url.pathname !== '/v1/payments/webhook';

const isNavigation = (request) =>
  request.mode === 'navigate' ||
  (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));

// ─── Install: precache shell ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: claim clients, purge old caches ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ─── Message from page ───
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  // Page asks SW to trigger a flush (e.g. after bg sync fires with no clients awake)
  if (event.data?.type === 'FLUSH_ACK') {
    event.source?.postMessage({ type: 'FLUSH' });
  }
});

// ─── Background Sync: tell the page to flush its mutation queue ───
self.addEventListener('sync', (event) => {
  if (event.tag === 'vimad-mutations') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        if (clients.length > 0) {
          clients.forEach((c) => c.postMessage({ type: 'FLUSH' }));
          return;
        }
        // No window open — nothing can flush IDB queue; next launch flushes.
      })
    );
  }
});

// ─── Fetch ───
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Operational API reads: network-first, cache fallback.
  if (isApiGet(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({
              error: {
                code: 'OFFLINE_NO_CACHE',
                message: 'You are offline and no cached copy of this data exists.',
              },
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // Same-origin navigations: network-first, shell fallback.
  if (url.origin === self.location.origin && isNavigation(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', clone));
          return response;
        })
        .catch(async () => {
          const cachedShell = (await caches.match('/index.html')) || (await caches.match('./'));
          if (cachedShell) return cachedShell;
          return Response.error();
        })
    );
  }
});
