import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { money, ORDER_TYPE } from '@/lib/format';
import { Card, Empty, ErrorBox, Eyebrow, PageHead, Spinner, Stat } from '@/components/ui';

interface Bucket {
  name: string;
  total: number;
  unidades?: number;
  pedidos?: number;
}

interface Report {
  dias: number;
  ingreso: number;
  pedidos: number;
  unidades: number;
  ticketMedio: number;
  canceladas: number;
  conTarjeta: number;
  enMostrador: number;
  porDia: { date: string; total: number; pedidos: number }[];
  porCategoria: Bucket[];
  porProducto: Bucket[];
  porTipo: Bucket[];
}

/**
 * Ventas.
 *
 * Responde las cuatro preguntas del cierre de mes: cuánto entró, de qué,
 * cómo se pagó y cómo se lo llevaron. Todo sale de una sola consulta en el
 * servidor, así que los bloques cuadran entre sí en vez de contradecirse.
 */
export function SalesPage() {
  const [dias, setDias] = useState(30);

  const informe = useQuery({
    queryKey: ['crm', 'sales-report', dias],
    queryFn: () => api.get<Report>(`/crm/sales-report?days=${dias}`),
  });

  if (informe.isLoading) return <Spinner label="Crunching sales" />;
  if (informe.error) return <ErrorBox error={informe.error} onRetry={() => informe.refetch()} />;

  const d = informe.data!;

  return (
    <>
      <PageHead eyebrow="Report" title="Sales">
        <select
          aria-label="Period"
          value={dias}
          onChange={(e) => setDias(Number(e.target.value))}
          className="field tap-target w-auto"
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>One year</option>
        </select>
      </PageHead>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue" value={money(d.ingreso)} hint={`${d.dias} days`} />
        <Stat label="Orders" value={d.pedidos} hint={`${d.unidades} units`} />
        {/* Lo que de verdad se pregunta el dueño: cuánto deja cada visita. */}
        <Stat label="Average ticket" value={money(d.ticketMedio)} hint="Per order" />
        <Stat
          label="Cancelled"
          value={d.canceladas}
          hint={d.canceladas === 0 ? 'None' : 'Not counted as sales'}
          tone={d.canceladas > 0 ? 'ember' : 'neutral'}
        />
      </div>

      <Card className="mt-4">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <Eyebrow>Revenue per day</Eyebrow>
          <span className="tabular text-[12.5px] text-stone2-400">
            máx {money(Math.max(...d.porDia.map((x) => x.total), 0))} al día
          </span>
        </div>
        <DayChart data={d.porDia} />
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Breakdown title="By category" items={d.porCategoria} total={d.ingreso} unit="unidades" />
        <Breakdown title="Best sellers" items={d.porProducto} total={d.ingreso} unit="unidades" />

        <Card className="flex flex-col gap-4">
          <div>
            <Eyebrow>How they paid</Eyebrow>
            <div className="mt-2 flex flex-col gap-2">
              <Split label="By card" value={d.conTarjeta} total={d.ingreso} />
              <Split label="At the counter" value={d.enMostrador} total={d.ingreso} />
            </div>
          </div>

          <div className="border-t border-stone2-200 pt-4">
            <Eyebrow>How they took it</Eyebrow>
            <div className="mt-2 flex flex-col gap-2">
              {d.porTipo.map((t) => (
                <Split
                  key={t.name}
                  label={ORDER_TYPE[t.name] ?? t.name}
                  value={t.total}
                  total={d.ingreso}
                />
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

/**
 * El ingreso día a día.
 *
 * Los días sin venta se dibujan en gris y no en verde de altura mínima:
 * «no vendimos nada» y «vendimos poco» son cosas distintas y una barra
 * verde diminuta las confunde.
 */
function DayChart({ data }: { data: { date: string; total: number; pedidos: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex h-[150px] items-stretch gap-[3px]"
        role="img"
        aria-label="Revenue per day"
      >
        {data.map((d) => (
          <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
            <div
              className={`rounded-[3px] transition-colors ${
                d.total > 0 ? 'bg-olive-500 group-hover:bg-olive-600' : 'bg-stone2-200'
              }`}
              style={{ height: `${d.total > 0 ? Math.max(4, (d.total / max) * 100) : 3}%` }}
            />
            <span className="sr-only">
              {d.date}: {money(d.total)} en {d.pedidos} pedidos
            </span>
            <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-stone2-200 bg-white px-2 py-1 text-[11px] shadow-sm group-hover:block">
              {d.date.slice(5)} · {money(d.total)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-stone2-400">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data.at(-1)?.date.slice(5)}</span>
      </div>
    </div>
  );
}

/** Lista con barra de proporción, para ver el reparto de un vistazo. */
function Breakdown({
  title,
  items,
  total,
  unit,
}: {
  title: string;
  items: Bucket[];
  total: number;
  unit: string;
}) {
  return (
    <Card>
      <Eyebrow>{title}</Eyebrow>
      {items.length === 0 ? (
        <Empty title="No data" />
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {items.map((i) => {
            const parte = total > 0 ? (i.total / total) * 100 : 0;
            return (
              <li key={i.name} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[13.5px] text-stone2-900">{i.name}</span>
                  <span className="tabular shrink-0 text-[13.5px] font-semibold">
                    {money(i.total)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone2-200">
                    <div
                      className="h-full rounded-full bg-olive-500"
                      style={{ width: `${Math.max(2, parte)}%` }}
                    />
                  </div>
                  <span className="tabular shrink-0 text-[11px] text-stone2-400">
                    {i.unidades ?? i.pedidos} {unit}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function Split({ label, value, total }: { label: string; value: number; total: number }) {
  const parte = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13.5px] text-stone2-900">{label}</span>
        <span className="tabular text-[13.5px] font-semibold">
          {money(value)} <span className="text-[11.5px] text-stone2-400">{parte}%</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-stone2-200">
        <div className="h-full rounded-full bg-olive-500" style={{ width: `${parte}%` }} />
      </div>
    </div>
  );
}
