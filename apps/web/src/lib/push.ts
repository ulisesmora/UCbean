import { api } from '@/lib/api';

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export type PushState = 'unsupported' | 'default' | 'granted' | 'denied';

/**
 * Si este navegador puede recibir avisos, y si ya dio permiso.
 *
 * `unsupported` cubre tres casos distintos que para quien mira son lo mismo:
 * un navegador sin Push, una web servida sin HTTPS fuera de localhost, y
 * Safari en iPhone fuera de una web instalada en la pantalla de inicio.
 */
export function pushState(): PushState {
  if (typeof window === 'undefined') return 'unsupported';
  if (
    !VAPID ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return 'unsupported';
  }
  return Notification.permission as PushState;
}

/** La clave VAPID en base64 URL, como la quiere `pushManager.subscribe`. */
function claveBinaria(base64: string): Uint8Array {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const normal = (base64 + relleno).replace(/-/g, '+').replace(/_/g, '/');
  const bruto = atob(normal);
  return Uint8Array.from(bruto, (c) => c.charCodeAt(0));
}

/**
 * Pide permiso y registra este navegador para avisos.
 *
 * Solo se llama desde un toque de la persona: los navegadores bloquean
 * cualquier petición de permiso que no venga de un gesto, y pedirlo nada más
 * entrar es la forma más rápida de que alguien diga que no para siempre.
 */
export async function subscribePush(token: string): Promise<PushState> {
  if (pushState() === 'unsupported') return 'unsupported';

  await navigator.serviceWorker.register('/sw.js');
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return permiso as PushState;

  // Subscribing needs an *active* worker. Right after register() it is often
  // still installing, and the browser rejects with "no active Service Worker".
  // That was the error on the first try on a fresh visit.
  const registro = await navigator.serviceWorker.ready;

  // Si ya había suscripción se reutiliza. Crear otra dejaría la vieja viva
  // en el servidor hasta que un envío fallara contra ella.
  const existente = await registro.pushManager.getSubscription();
  let sub: PushSubscription;
  try {
    sub =
      existente ??
      (await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: claveBinaria(VAPID!) as BufferSource,
      }));
  } catch (error) {
    throw new Error(explainPushError(error));
  }

  const json = sub.toJSON();
  await api.post(
    '/notifications/push',
    {
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      userAgent: navigator.userAgent.slice(0, 200),
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  return 'granted';
}

/**
 * A subscription failure, in words someone can act on.
 *
 * The browser's own messages ("Registration failed - push service error")
 * say nothing useful. The common real cause is a browser that ships with push
 * turned off: Brave does, until "Use Google services for push messaging" is on.
 */
function explainPushError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const brave = typeof navigator !== 'undefined' && 'brave' in navigator;
  if (
    /push service|registration failed|AbortError/i.test(message) ||
    (error as Error)?.name === 'AbortError'
  ) {
    return brave
      ? 'Brave blocks notifications by default. Turn on "Use Google services for push messaging" in brave://settings/privacy, then try again.'
      : 'Your browser could not turn on notifications. Check that notifications are allowed for this site and try again.';
  }
  return message || 'Could not turn on notifications';
}
