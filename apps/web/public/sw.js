/*
 * Service worker de Around the Bean.
 *
 * Hace una sola cosa: recibir los avisos push y abrir el pedido al tocarlos.
 * No cachea páginas ni funciona sin conexión a propósito: un café no se
 * puede pedir offline, y una caché mal invalidada enseñaría precios o
 * estados de pedido viejos, que es justo lo que no puede pasar.
 *
 * Vive en /public y no en el bundle porque el navegador exige servirlo desde
 * la raíz para que controle todo el sitio.
 */

self.addEventListener('install', () => {
  // Un worker nuevo toma el control en cuanto se instala, sin esperar a que
  // se cierren todas las pestañas. Aquí no hay caché que migrar.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    // Un aviso sin JSON válido sigue mereciendo algo en pantalla.
    datos = { body: event.data ? event.data.text() : '' };
  }

  const titulo = datos.title || 'Around the Bean';
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: datos.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      // La etiqueta hace que «en preparación» y «listo» del mismo pedido se
      // sustituyan en vez de apilarse: nadie necesita dos avisos del mismo café.
      tag: datos.url || 'pedido',
      renotify: true,
      data: { url: datos.url || '/profile' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destino = new URL(event.notification.data?.url || '/profile', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      // Si ya tiene la web abierta, se reutiliza esa pestaña en vez de abrir
      // otra: abrir cinco pestañas del mismo pedido es un fallo común.
      for (const v of ventanas) {
        if ('focus' in v) {
          v.navigate(destino);
          return v.focus();
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});
