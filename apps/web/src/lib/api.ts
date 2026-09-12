import type {
  AuthResponse,
  Category,
  Order,
  Product,
  SlotAvailability,
  TableReservation,
  User,
} from '@/types/api.types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? body?.message ?? `API error ${res.status}`);
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
};

export const authApi = {
  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    api.post<AuthResponse>('/auth/register', body),
  login: (body: { email: string; password: string }) => api.post<AuthResponse>('/auth/login', body),
  logout: () => api.post<void>('/auth/logout', {}),
  me: (token: string) =>
    api.get<User>('/users/me', { headers: { Authorization: `Bearer ${token}` } }),
};

// Re-export types for convenience
export type { AuthResponse, Category, Order, Product, SlotAvailability, TableReservation, User };
