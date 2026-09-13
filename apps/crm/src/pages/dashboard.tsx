import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { Card, Empty, ErrorBox, Eyebrow, PageHead, Spinner, Stat } from '@/components/ui';

interface Summary {
  pedidosHoy: number;
  ventaHoy: number;
  cobradoHoy: number;
  enCola: number;
  clientesNuevos: number;
  canjesHoy: number;
  recogidasAgendadas: number;
  porEstado: Record<string, number>;
}

interface Sale {
  date: string;
  total: number;
  pedidos: number;
}

/**
 * El día de un vistazo.
 *
 * Primero el resumen, después el detalle: quien abre esto quiere saber en
 * dos segundos si hay cola y cuánto se lleva vendido.
 */
export function DashboardPage() {
  const resumen = useQuery({
    queryKey: ['crm', 'summary'],
    queryFn: () => api.get<Summary>('/crm/summary'),
    // La barra deja esto abierto todo el día, así que se refresca solo.
    refetchInterval: 60_000,
  });

  const ventas = useQuery({
    queryKey: ['crm', 'sales'],
    queryFn: () => api.get<Sale[]>('/crm/sales?days=14'),
  });

  const top = useQuery({
    queryKey: ['crm', 'top'],
    queryFn: () => api.get<{ name: string; qty: number }[]>('/crm/top-drinks?days=7'),
  });

  if (resumen.isLoading) return <Spinner label="Loading today" />;
  if (resumen.error) return <ErrorBox error={resumen.error} onRetry={() => resumen.refetch()} />;

  const d = resumen.data!;
  const pendientesDeCobro = Math.max(0, d.ventaHoy - d.cobradoHoy);

  return (
    <>
      <PageHead eyebrow="Summary" title="Today">
        <Link to="/cola" className="btn btn-olive tap-target px-4 py-2 text-[14px]">
          Ver la cola
          {d.enCola > 0 && (
            <span className="tabular rounded border border-stone2-200 bg-white px-1.5 text-[12px]">
              {d.enCola}
            </span>
          )}
        </Link>
      </PageHead>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sales today" value={money(d.ventaHoy)} hint={`${d.pedidosHoy} orders`} />
        <Stat
          label="Collected"
          value={money(d.cobradoHoy)}
          hint={pendientesDeCobro > 0 ? `${money(pendientesDeCobro)} to collect` : 'All caught up'}
          tone={pendientesDeCobro > 0 ? 'ember' : 'neutral'}
        />
        <Stat
          label="In queue"
          value={d.enCola}
          hint={d.enCola === 0 ? 'Nothing pending' : 'To prepare'}
          tone={d.enCola > 5 ? 'ember' : 'neutral'}
        />
        <Stat label="New customers" value={d.clientesNuevos} hint="Sign-ups today" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <Eyebrow>Sales, last 14 days</Eyebrow>
            <span className="tabular font-mono text-[12px] text-stone2-400">
              {ventas.data ? money(ventas.data.reduce((s, v) => s + v.total, 0)) : ''}
            </span>
          </div>
          {ventas.isLoading && <Spinner />}
          {ventas.data && <SalesChart data={ventas.data} />}
        </Card>

        <Card>
          <div className="mb-4">
            <Eyebrow>Most ordered, 7 days</Eyebrow>
          </div>
          {top.isLoading && <Spinner />}
          {top.data?.length === 0 && <Empty title="No orders this week" />}
          <ul className="flex flex-col">
            {top.data?.map((t, i) => (
              <li
                key={t.name}
                className="flex items-center gap-3 border-b border-birch-200 py-2 last:border-0"
              >
                <span className="tabular w-5 font-mono text-[12px] text-stone2-400">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[14px] text-stone2-900">
                  {t.name}
                </span>
                <span className="tabular font-mono text-[13px] font-bold text-stone2-900">
                  {t.qty}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Scheduled pickups" value={d.recogidasAgendadas} hint="From today onwards" />
        <Stat label="Points redeemed" value={d.canjesHoy} hint="Rewards given today" />
        <Card>
          <div className="mb-2">
            <Eyebrow>Orders by status</Eyebrow>
          </div>
          <ul className="flex flex-col gap-1">
            {Object.entries(d.porEstado).map(([estado, n]) => (
              <li key={estado} className="flex items-center justify-between text-[13px]">
                <span className="text-stone2-600">{estado}</span>
                <span className="tabular font-mono font-bold text-stone2-900">{n}</span>
              </li>
            ))}
            {Object.keys(d.porEstado).length === 0 && (
              <span className="text-[13px] text-stone2-400">No orders yet today</span>
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}

/**
 * La tendencia, en barras.
 *
 * Dibujada a mano con divs en vez de traer una librería de gráficas: son
 * catorce valores y una escala. El eje se etiqueta con el máximo real,
 * para que la altura de una barra signifique algo.
 */
function SalesChart({ data }: { data: Sale[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="flex flex-col gap-2">
      {/* Las columnas van a `h-full`: sin altura propia, el porcentaje de la
          barra no tiene contra qué resolverse y todas salen planas. */}
      <div className="flex h-[140px] items-stretch gap-1" role="img" aria-label="Sales per day">
        {data.map((d) => {
          const alto = d.total > 0 ? Math.max(4, (d.total / max) * 100) : 2;
          return (
            <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className={`rounded-sm border border-stone2-200 transition-colors ${
                  d.total > 0 ? 'bg-olive-500 group-hover:bg-olive-600' : 'bg-birch-200'
                }`}
                style={{ height: `${alto}%` }}
              />
              {/* El detalle aparece al pasar por encima, pero el dato ya
                  está en el aria-label para quien no usa ratón. */}
              <span className="sr-only">
                {d.date}: {money(d.total)} en {d.pedidos} pedidos
              </span>
              <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded border border-stone2-200 bg-white px-1.5 py-0.5 font-mono text-[10px] group-hover:block">
                {money(d.total)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between font-mono text-[10px] text-stone2-400">
        <span>{data[0]?.date.slice(5)}</span>
        <span>max {money(max)}</span>
        <span>{data.at(-1)?.date.slice(5)}</span>
      </div>
    </div>
  );
}
