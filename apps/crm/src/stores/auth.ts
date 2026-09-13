import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

/**
 * Quién está detrás de la barra.
 *
 * Zustand, igual que el sitio público, para no tener dos formas de guardar
 * estado en el mismo proyecto. Lo único que vive aquí es la sesión: todo
 * lo demás son datos del servidor y los lleva react-query, que ya se
 * ocupa de caché, reintentos y refresco.
 *
 * El token vive en localStorage. Es lo mismo que hace la web, y en una
 * tablet compartida detrás del mostrador el riesgo real no es el
 * almacenamiento sino dejar la sesión abierta, que se resuelve con el
 * botón de salir.
 */
export type Role = 'OWNER' | 'STAFF' | 'CUSTOMER';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  token: string | null;
  user: StaffUser | null;
  setSession: (token: string, user: StaffUser) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'ucbean-crm-session' },
  ),
);

/* ── Selectores ─────────────────────────────────────────────
 *
 * Leer el store entero (`useAuth()`) suscribe al componente a
 * cualquier cambio, así que entrar o salir vuelve a renderizar cosas
 * que no dependen de eso. Cada selector se queda con un solo valor y
 * el componente solo se entera cuando ese valor cambia.
 *
 * Las acciones nunca cambian de identidad en Zustand, así que
 * seleccionarlas no provoca ningún render.
 */

export const useUser = () => useAuth((s) => s.user);
export const useToken = () => useAuth((s) => s.token);
export const useLogout = () => useAuth((s) => s.logout);
export const useSetSession = () => useAuth((s) => s.setSession);

/** Si esta persona puede entrar al mostrador. */
export const isStaff = (user: StaffUser | null): boolean =>
  user?.role === 'OWNER' || user?.role === 'STAFF';

/** Atajo para lo único que el menú necesita saber del rol. */
export const useIsOwner = () => useAuth((s) => s.user?.role === 'OWNER');

/**
 * Nombre y rol juntos, para la firma del menú.
 *
 * `useShallow` compara campo a campo: sin él, devolver un objeto nuevo en
 * cada render haría que el componente se considerara siempre cambiado.
 */
export const useIdentity = () =>
  useAuth(useShallow((s) => ({ name: s.user?.name ?? '', role: s.user?.role })));
