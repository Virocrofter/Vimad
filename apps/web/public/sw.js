/* Vimad PMS service worker — Web Push support */
/* global clients */

self.addEventListener('push', (event) => {
  let payload;
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'Vimad PMS', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Vimad PMS';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/favicon.svg',
    badge: '/favicon.svg',
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data && event.notification.data.actionUrl;
  const target = url || '/app/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (url) client.navigate(target);
          return client.focus();
        }
      }
      return clients.openWindow(target);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
