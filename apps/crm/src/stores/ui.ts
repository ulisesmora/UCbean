import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Preferencias de la pantalla.
 *
 * Se guardan porque son de la persona y del equipo: quien pliega el menú
 * en la tablet de la barra lo quiere plegado también mañana, y volver a
 * plegarlo cada turno es de las cosas que hacen que una herramienta
 * empiece a molestar.
 */
interface UiState {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
    }),
    { name: 'ucbean-crm-ui' },
  ),
);

/**
 * Lo que el menú necesita, en un selector.
 *
 * `toggle` no cambia nunca de identidad en Zustand, así que devolver el
 * objeto entero aquí no provoca renders de más: solo los provoca
 * `collapsed`, que es justo lo que tiene que repintar el menú.
 */
export const useSidebar = () => {
  const collapsed = useUi((s) => s.collapsed);
  const toggle = useUi((s) => s.toggle);
  return { collapsed, toggle };
};
