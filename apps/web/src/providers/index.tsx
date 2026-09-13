'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            /**
             * Reintentar solo lo que puede salir bien la segunda vez.
             *
             * Un 4xx —sin permiso, no existe, datos mal— va a responder lo
             * mismo, y reintentarlo solo alarga la ruedita antes de decir qué
             * pasa. Además TanStack pausa los reintentos con la pestaña en
             * segundo plano, así que un 403 reintentado se quedaba cargando
             * para siempre hasta volver a ella. Un fallo de red o un 5xx sí
             * merece una segunda oportunidad.
             */
            retry: (intentos, error) => {
              const status = (error as { status?: number }).status;
              if (status !== undefined && status >= 400 && status < 500) return false;
              return intentos < 1;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast: 'font-body',
          },
        }}
      />
    </QueryClientProvider>
  );
}
