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

  const registro = await navigator.serviceWorker.register('/sw.js');
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return permiso as PushState;

  // Si ya había suscripción se reutiliza. Crear otra dejaría la vieja viva
  // en el servidor hasta que un envío fallara contra ella.
  const existente = await registro.pushManager.getSubscription();
  const sub =
    existente ??
    (await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: claveBinaria(VAPID!) as BufferSource,
    }));

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
