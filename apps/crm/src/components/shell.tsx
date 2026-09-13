import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  ChevronLeft,
  Coffee,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Package,
  Receipt,
  Stars,
  Users,
  UsersRound,
  TrendingUp,
  Wallet,
  Tags,
} from 'lucide-react';
import { useIdentity, useIsOwner, useLogout } from '@/stores/auth';
import { useSidebar } from '@/stores/ui';

const NAV = [
  { to: '/', label: 'Today', icon: LayoutDashboard, end: true },
  { to: '/cola', label: 'Queue', icon: Receipt },
  { to: '/pedidos', label: 'Orders', icon: CalendarClock },
  { to: '/clientes', label: 'Customers', icon: Users },
  { to: '/recetas', label: 'Recipes', icon: Coffee },
  { to: '/precios', label: 'Prices', icon: Tags },
  { to: '/productos', label: 'Products', icon: Package, ownerOnly: true },
  { to: '/mesas', label: 'Tables', icon: CalendarClock },
  { to: '/lealtad', label: 'Loyalty', icon: Stars },
  { to: '/caja', label: 'Cash', icon: Wallet },
  { to: '/ventas', label: 'Sales', icon: TrendingUp, ownerOnly: true },
  { to: '/campanas', label: 'Campaigns', icon: Megaphone, ownerOnly: true },
  { to: '/equipo', label: 'Team', icon: UsersRound, ownerOnly: true },
];

/** Los cinco que se usan con prisa, para la barra inferior en tablet. */
const MOVIL = ['/', '/cola', '/pedidos', '/clientes', '/lealtad'];

/**
 * El armazón.
 *
 * Barra lateral plegable en pantalla grande y barra inferior en tablet
 * vertical, porque esto se usa de las dos formas: el dueño en un portátil
 * y la barra en una tablet apoyada junto a la máquina.
 */
export function Shell() {
  const { name } = useIdentity();
  const esDueno = useIsOwner();
  const logout = useLogout();
  const { collapsed, toggle } = useSidebar();
  const navigate = useNavigate();

  const visibles = NAV.filter((n) => !n.ownerOnly || esDueno);
  const enMovil = visibles.filter((n) => MOVIL.includes(n.to));

  function salir() {
    logout();
    navigate('/entrar', { replace: true });
  }

  return (
    <div className="min-h-dvh">
      <div className="flex flex-col md:flex-row">
        {/* ── Barra lateral ───────────────────────────────────── */}
        <aside
          className={`hidden shrink-0 transition-[width] duration-300 ease-ios md:block ${
            collapsed ? 'w-[76px]' : 'w-[232px]'
          }`}
        >
          <div className="sticky top-0 flex h-dvh flex-col gap-6 p-3">
            <div className="glass flex h-full flex-col gap-5 rounded-2xl p-3">
              <div
                className={`flex items-center gap-2.5 px-1 pt-1 ${collapsed ? 'justify-center' : ''}`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-olive-500 ring-4 ring-olive-500/20" />
                {!collapsed && (
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] font-bold leading-tight tracking-[-0.02em]">
                      Counter
                    </span>
                    <span className="truncate text-[10px] uppercase tracking-[0.16em] text-stone2-400">
                      Around the Bean
                    </span>
                  </div>
                )}
              </div>

              <nav className="flex flex-col gap-0.5">
                {visibles.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors duration-200 ${
                        collapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-olive-500/90 text-stone2-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]'
                          : 'text-stone2-600 hover:bg-stone2-900/5'
                      }`
                    }
                  >
                    <Icon size={17} className="shrink-0" />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-2 border-t border-stone2-200 pt-3">
                {!collapsed && (
                  <div className="flex flex-col px-1">
                    <span className="truncate text-[13px] font-semibold">{name}</span>
                    <span className="text-[10.5px] uppercase tracking-[0.14em] text-stone2-400">
                      {esDueno ? 'Owner' : 'Staff'}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={toggle}
                  aria-expanded={!collapsed}
                  className="btn btn-quiet justify-start px-3 py-2 text-[13px] text-stone2-600"
                  title={collapsed ? 'Expand menu' : 'Collapse menu'}
                >
                  <ChevronLeft
                    size={15}
                    className={`shrink-0 transition-transform duration-300 ease-ios ${
                      collapsed ? 'rotate-180' : ''
                    }`}
                  />
                  {!collapsed && 'Plegar'}
                </button>

                <button
                  type="button"
                  onClick={salir}
                  className={`btn py-2 text-[13px] ${collapsed ? 'px-0' : ''}`}
                  title="Sign out"
                >
                  <LogOut size={14} className="shrink-0" />
                  {!collapsed && 'Sign out'}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Cabecera en pantalla estrecha ───────────────────── */}
        <header className="glass sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-olive-500 ring-4 ring-olive-500/20" />
            <span className="text-[15px] font-bold tracking-[-0.02em]">Counter</span>
          </div>
          <button
            type="button"
            onClick={salir}
            className="btn tap-target px-3 py-1.5 text-[12.5px]"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-10">
          <div className="mx-auto max-w-[1180px]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Barra inferior en tablet. Cinco destinos, que es donde una barra
          de pestañas deja de ser legible. El resto vive en pantalla ancha. */}
      <nav className="glass-strong fixed inset-x-3 bottom-3 z-30 flex rounded-2xl p-1 md:hidden">
        {enMovil.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `tap-target flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold transition-colors ${
                isActive ? 'bg-olive-500/90 text-stone2-900' : 'text-stone2-600'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
