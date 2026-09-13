import { useAuth } from '@/stores/auth';

/**
 * Hablar con la API.
 *
 * En desarrollo Vite hace de proxy, así que el navegador ve un solo
 * origen y la cookie de refresco viaja sin pelearse con SameSite. En
 * producción esto apunta al dominio de la API.
 */
// `||`, not `??`: an empty VITE_API_URL (a blank variable on Vercel) used to
// compile to '' and send every request to the CRM's own domain. A production
// build with no value talks to the Railway API; dev keeps the Vite proxy.
const BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://ucbean-production.up.railway.app/api/v1' : '/api/v1');

/** The API's origin, without /api/v1. Uploaded photos hang off it. */
const ORIGIN = BASE.replace(/\/api\/v\d+\/?$/, '');

/**
 * A stored photo URL, ready for an <img>.
 *
 * Uploads are saved as `/uploads/...`, a path on the API server. Used as is,
 * the browser looked for them on the CRM's own domain, where they do not
 * exist: the photos showed on the website, which already did this, and not
 * here. In development ORIGIN is empty and Vite's proxy serves them.
 */
export function imageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^(https?:|blob:|data:)/.test(url)) return url;
  return `${ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuth.getState().token;

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    // El token de acceso dura quince minutos. Cuando vence, la sesión se
    // cierra aquí en vez de dejar la pantalla llena de errores que el
    // personal no sabe interpretar.
    useAuth.getState().logout();
    throw new ApiError('Your session expired. Sign in again.', 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as Record<string, never>);
    const detalle: string[] | undefined = body?.error?.details;
    throw new ApiError(
      detalle?.join('. ') ?? body?.error?.message ?? `Error ${res.status}`,
      res.status,
    );
  }

  if (res.status === 204) return undefined as T;
  const json = await res.json();
  // La API envuelve todo en { data }. Se desenvuelve aquí una vez y no
  // en cada pantalla.
  return (json?.data !== undefined ? json.data : json) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
