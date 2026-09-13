import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shell } from '@/components/shell';
import { LoginPage } from '@/pages/login';
import { DashboardPage } from '@/pages/dashboard';
import { QueuePage } from '@/pages/queue';
import { RecipesPage } from '@/pages/recipes';
import { PricesPage } from '@/pages/prices';
import { TablesPage } from '@/pages/tables';
import { LoyaltyPage } from '@/pages/loyalty';
import { CampaignsPage } from '@/pages/campaigns';
import { CustomersPage } from '@/pages/customers';
import { OrdersPage } from '@/pages/orders';
import { ProductsPage } from '@/pages/products';
import { TeamPage } from '@/pages/team';
import { CashPage } from '@/pages/cash';
import { SalesPage } from '@/pages/sales';
import { isStaff, useToken, useUser } from '@/stores/auth';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // La barra abre esto y lo deja puesto. Al volver a la pestaña se
      // refresca, que es cuando la cifra vieja estorba de verdad.
      refetchOnWindowFocus: true,
      staleTime: 15_000,
      // Un 401 no se reintenta: la sesión venció y hay que entrar otra vez.
      // El texto que se busca es el de lib/api.ts; si cambia allí, cambia aquí.
      retry: (count, error) =>
        count < 2 && !(error instanceof Error && error.message.includes('session')),
    },
  },
});

/** Nadie pasa de aquí sin ser del personal. */
function RequireStaff({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const token = useToken();
  if (!token || !isStaff(user)) return <Navigate to="/entrar" replace />;
  return <>{children}</>;
}

/** Ya dentro, la puerta redirige al resumen en vez de pedir login de nuevo. */
function RedirectIfIn() {
  const token = useToken();
  return token ? <Navigate to="/" replace /> : <LoginPage />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/entrar" element={<RedirectIfIn />} />
          <Route
            element={
              <RequireStaff>
                <Shell />
              </RequireStaff>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="cola" element={<QueuePage />} />
            <Route path="pedidos" element={<OrdersPage />} />
            <Route path="clientes" element={<CustomersPage />} />
            <Route path="productos" element={<ProductsPage />} />
            <Route path="caja" element={<CashPage />} />
            <Route path="ventas" element={<SalesPage />} />
            <Route path="equipo" element={<TeamPage />} />
            <Route path="recetas" element={<RecipesPage />} />
            <Route path="precios" element={<PricesPage />} />
            <Route path="mesas" element={<TablesPage />} />
            <Route path="lealtad" element={<LoyaltyPage />} />
            <Route path="campanas" element={<CampaignsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
