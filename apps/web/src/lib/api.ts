import type {
  ApiRecipe,
  Discount,
  FavoriteDrink,
  LoyaltyCard,
  Reward,
  AuthResponse,
  Category,
  Order,
  Product,
  SlotAvailability,
  TableReservation,
  User,
} from '@/types/api.types';

// `||`, not `??`: a blank NEXT_PUBLIC_API_URL must not become ''. Production
// builds with no value talk to the Railway API; development to the local one.
const BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://ucbean-production.up.railway.app/api/v1'
    : 'http://localhost:3000/api/v1');

/**
 * El refresco en vuelo, si lo hay.
 *
 * Al cargar una pantalla salen varias peticiones a la vez. Si el token
 * caducó, todas fallan con 401 a la vez, y sin esto cada una pediría su
 * propio refresco: el servidor rota el token de refresco en cada llamada,
 * así que la segunda invalidaría a la primera y acabaríamos echando de la
 * sesión a quien solo quería mirar su perfil.
 */
let refrescando: Promise<string | null> | null = null;

/**
 * Pide un acceso nuevo con la cookie de refresco.
 *
 * La cookie es httpOnly, así que este código nunca la ve: solo la manda el
 * navegador. Por eso `credentials: 'include'` no es opcional aquí.
 */
async function refrescarAcceso(): Promise<string | null> {
  refrescando ??= (async () => {
    try {
      // Sin Content-Type a propósito: esta petición no lleva cuerpo, y
      // Fastify devuelve 400 («Body cannot be empty») si la cabecera dice
      // que viene JSON y no viene nada. Lo único que hace falta mandar es
      // la cookie, que va en `credentials`.
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const json = await res.json();
      const token: string | undefined = json?.data?.accessToken ?? json?.accessToken;
      if (!token) return null;

      // El import es diferido a propósito: el store tira de este módulo, y
      // arriba del fichero sería una dependencia circular.
      const { useAuthStore } = await import('@/stores/auth.store');
      const { user, setAuth } = useAuthStore.getState();
      if (user) setAuth(user, token);
      return token;
    } catch {
      return null;
    } finally {
      refrescando = null;
    }
  })();

  return refrescando;
}

/** Cambia el Bearer de una petición que se va a reintentar. */
function conToken(init: RequestInit | undefined, token: string): RequestInit {
  return {
    ...init,
    headers: { ...(init?.headers as Record<string, string>), Authorization: `Bearer ${token}` },
  };
}

async function request<T>(path: string, init?: RequestInit, reintento = false): Promise<T> {
  // Las cabeceras se sacan del resto y se mezclan al final, no antes.
  // Antes iban primero y el `...init` de después las pisaba enteras: en
  // cuanto alguien pasaba `{ headers: { Authorization } }` —o sea, toda
  // llamada con sesión— se perdía el Content-Type, Fastify no parseaba el
  // cuerpo y el DTO recibía un objeto vacío. Salía como «type must be one
  // of the following values» y parecía un problema del formulario.
  const { headers, ...resto } = init ?? {};
  const res = await fetch(`${BASE}${path}`, {
    ...resto,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(headers as Record<string, string>) },
  });

  if (!res.ok) {
    // El acceso dura quince minutos. Sin esto, mirar la carta un rato y
    // luego ir a pagar terminaba en «Unauthorized» justo en el peor sitio.
    // Un solo reintento: si el refresco tampoco vale, la sesión se acabó
    // de verdad y hay que volver a entrar.
    const llevaBearer = Boolean((init?.headers as Record<string, string>)?.Authorization);
    if (res.status === 401 && !reintento && llevaBearer && !path.startsWith('/auth/')) {
      const token = await refrescarAcceso();
      if (token) return request<T>(path, conToken(init, token), true);
    }

    const body = await res.json().catch(() => ({}));
    // El error lleva su código. Sin él, quien lo recibe no puede distinguir
    // un «ese pedido no es tuyo», que no se arregla reintentando, de un
    // servidor caído un segundo, que sí.
    throw Object.assign(
      new Error(body?.error?.message ?? body?.message ?? `API error ${res.status}`),
      { status: res.status },
    );
  }

  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return (json?.data !== undefined ? json.data : json) as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'GET', ...init }),
  post: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), ...init }),
  patch: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...init }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'DELETE', ...init }),
};

export interface CafePulse {
  open: boolean;
  opensAt: number;
  closesAt: number;
  pulse: 'quiet' | 'steady' | 'busy';
  queueDepth: number;
  waitMinutes: number | null;
  tables: number;
  tablesBooked: number;
}

export const cafeApi = {
  /** Si está abierto y cuánta cola hay. Público, sin sesión. */
  pulse: () => api.get<CafePulse>('/cafe/pulse'),
};

export const productsApi = {
  list: (categoryId?: string) =>
    api.get<Product[]>(`/products${categoryId ? `?categoryId=${categoryId}` : ''}`),
  categories: () => api.get<Category[]>('/products/categories'),
};

export const reservationsApi = {
  pickupSlots: (date: string) =>
    api.get<SlotAvailability>(`/reservations/pickup/slots?date=${date}`),
  bookTable: (body: { partySize: number; scheduledAt: string; notes?: string }, token: string) =>
    api.post<TableReservation>('/reservations/table', body, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  myTableReservations: (token: string) =>
    api.get<TableReservation[]>('/reservations/table/mine', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export const ordersApi = {
  myOrders: (token: string) =>
    api.get<Order[]>('/orders/mine', { headers: { Authorization: `Bearer ${token}` } }),
  /** Un pedido concreto, con su hora. Lo que consulta el seguimiento. */
  one: (id: string, token: string) =>
    api.get<Order>(`/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
};

export const paymentsApi = {
  /** Abre el cobro de un pedido y devuelve lo que Stripe.js necesita. */
  intent: (orderId: string, token: string) =>
    api.post<{ paymentIntentId: string; clientSecret: string | null; status: string }>(
      `/payments/intent/${orderId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    ),

  status: (orderId: string, token: string) =>
    api.get<{ paid: boolean; orderStatus: string; paymentStatus: string }>(
      `/payments/status/${orderId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    ),
};

export const loyaltyApi = {
  rewards: () => api.get<Reward[]>('/loyalty/rewards'),
  me: (token: string) =>
    api.get<LoyaltyCard>('/loyalty/me', { headers: { Authorization: `Bearer ${token}` } }),
  redeem: (rewardId: string, token: string) =>
    api.post<{ code: string; reward: string; balance: number }>(
      `/loyalty/redeem/${rewardId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    ),
};

export const discountsApi = {
  mine: (token: string) =>
    api.get<Discount[]>('/discounts/mine', { headers: { Authorization: `Bearer ${token}` } }),
  preview: (code: string, orderTotal: number, token: string) =>
    api.post<{ discountId: string; code: string; amount: number }>(
      '/discounts/preview',
      { code, orderTotal },
      { headers: { Authorization: `Bearer ${token}` } },
    ),
};

export const favoritesApi = {
  mine: (token: string) =>
    api.get<FavoriteDrink[]>('/favorites', { headers: { Authorization: `Bearer ${token}` } }),
  save: (
    body: { name: string; build: unknown; recipeId?: string; productId?: string },
    token: string,
  ) =>
    api.post<FavoriteDrink>('/favorites', body, { headers: { Authorization: `Bearer ${token}` } }),
  /** Sube el contador que ordena la lista por lo que más se pide. */
  markOrdered: (id: string, token: string) =>
    api.post<{ ok: boolean }>(
      `/favorites/${id}/ordered`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    ),
  remove: (id: string, token: string) =>
    api.delete<{ ok: boolean }>(`/favorites/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export const recipesApi = {
  /** El menu vivo, con su precio calculado en el servidor. */
  current: (kind?: 'SIGNATURE' | 'SEASONAL') =>
    api.get<ApiRecipe[]>(`/recipes${kind ? `?kind=${kind}` : ''}`),
  /** El ranking real, contado sobre pedidos. Vacío si aún no se vendió nada. */
  bestSellers: (limit = 6, days = 30) =>
    api.get<(ApiRecipe & { sold: number })[]>(`/recipes/best-sellers?limit=${limit}&days=${days}`),
};

/** The drink builder's parts, with the prices the counter app set. */
export const drinksApi = {
  options: () => api.get<Record<string, { id: string; price: number }[]>>('/drinks/options'),
};

export const authApi = {
  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    api.post<AuthResponse>('/auth/register', body),
  login: (body: { email: string; password: string }) => api.post<AuthResponse>('/auth/login', body),
  // The endpoint is guarded: without the bearer it answered 401 and the
  // session was never cleared.
  logout: (token: string | null) =>
    api.post<void>(
      '/auth/logout',
      {},
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    ),
  me: (token: string) =>
    api.get<User>('/users/me', { headers: { Authorization: `Bearer ${token}` } }),

  /* ── Cuenta ──────────────────────────────────────────────── */

  verifyEmail: (token: string) =>
    api.post<{ verified: boolean; name: string }>('/auth/verify-email', { token }),

  resendVerification: (token: string) =>
    api.post<{ ok: true }>(
      '/auth/verify-email/resend',
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    ),

  forgotPassword: (email: string) => api.post<{ ok: true }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<{ ok: true }>('/auth/reset-password', { token, password }),

  /**
   * Entrar con Google.
   *
   * No es fetch: el navegador tiene que ir a Google y volver, así que se
   * cambia la dirección de la página entera. Vuelve a /perfil con el token
   * en el fragmento de la URL.
   */
  googleUrl: () => `${BASE}/auth/google`,

  /**
   * El camino que no te saca de la página.
   *
   * El `credential` viene del botón de Google en el navegador; el servidor
   * lo comprueba contra Google antes de abrir sesión.
   */
  googleToken: (credential: string) => api.post<AuthResponse>('/auth/google/token', { credential }),
};

// Re-export types for convenience
export type { AuthResponse, Category, Order, Product, SlotAvailability, TableReservation, User };
