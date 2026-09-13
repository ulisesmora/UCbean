import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { dayMonth, money, ORDER_TYPE, time } from '@/lib/format';
import { PAYMENT_METHOD, paymentStatus } from '@/lib/payments';
import { Card, Chip, Empty, ErrorBox, Eyebrow, PageHead, Spinner, Stat } from '@/components/ui';

interface Payment {
  id: string;
  status: string;
  amount: number;
  paidAt: string | null;
  createdAt: string;
  stripeIntentId: string | null;
  orderId: string;
  customer: string;
  orderStatus: string;
  orderType: string;
  method: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  amountRefunded: number;
}

interface Caja {
  cobrado: number;
  pendiente: number;
  enMostrador: number;
  pedidosEnMostrador: number;
  pagos: Payment[];
}

/**
 * La caja.
 *
 * Dos fuentes de dinero que hay que sumar juntas: lo que entra por tarjeta
 * y lo que se paga en la barra. Lo segundo no deja fila en la tabla de
 * pagos, así que una pantalla que solo mirara Stripe enseñaría la mitad de
 * lo que de verdad entró y nadie cuadraría nunca el cierre.
 */
export function CashPage() {
  const [dias, setDias] = useState(7);

  const caja = useQuery({
    queryKey: ['crm', 'payments', dias],
    queryFn: () => api.get<Caja>(`/crm/payments?days=${dias}`),
    refetchInterval: 60_000,
  });

  if (caja.isLoading) return <Spinner label="Loading cash" />;
  if (caja.error) return <ErrorBox error={caja.error} onRetry={() => caja.refetch()} />;

  const d = caja.data!;
  const total = d.cobrado + d.enMostrador;
  const reembolsado = d.pagos.reduce((s, p) => s + (p.amountRefunded ?? 0), 0);

  return (
    <>
      <PageHead eyebrow="Money" title="Cash">
        <select
          aria-label="Days"
          value={dias}
          onChange={(e) => setDias(Number(e.target.value))}
          className="field tap-target w-auto"
        >
          <option value={1}>Today</option>
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
        </select>
      </PageHead>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total taken" value={money(total)} hint="Card and counter, after refunds" />
        <Stat
          label="By card"
          value={money(d.cobrado)}
          hint={reembolsado > 0 ? `${money(reembolsado)} refunded` : 'Confirmed by Stripe'}
        />
        <Stat
          label="At the counter"
          value={money(d.enMostrador)}
          hint={`${d.pedidosEnMostrador} ${
            d.pedidosEnMostrador === 1 ? 'order handed over' : 'orders handed over'
          }`}
        />
        <Stat
          label="Unpaid"
          value={money(d.pendiente)}
          hint={d.pendiente > 0 ? 'Open payments not completed' : 'Nothing pending'}
          tone={d.pendiente > 0 ? 'ember' : 'neutral'}
        />
      </div>

      <section className="mt-7">
        <div className="mb-3">
          <Eyebrow>Card payments</Eyebrow>
        </div>

        {d.pagos.length === 0 ? (
          <Empty
            title="No card payments"
            hint="They show up here once a Stripe key is set and someone pays on the website."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {d.pagos.map((p) => {
              const e = paymentStatus(p.status);
              return (
                <Card key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-stone2-900">
                      {p.customer}
                    </p>
                    {/* El motivo del fallo va antes que el id: es lo que se
                        lee en voz alta cuando el cliente pregunta. */}
                    {p.failureMessage && p.status !== 'succeeded' ? (
                      <p className="truncate text-[12px] text-bark-700">{p.failureMessage}</p>
                    ) : (
                      p.stripeIntentId && (
                        // El id de Stripe es lo que se pega en su panel cuando
                        // hay que reclamar o devolver.
                        <p className="truncate font-mono text-[11.5px] text-stone2-400">
                          {p.stripeIntentId}
                        </p>
                      )
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Chip tone={e.tone}>{e.label}</Chip>
                    {p.method && <Chip>{PAYMENT_METHOD[p.method] ?? p.method}</Chip>}
                    <span className="hidden sm:inline-flex">
                      <Chip>{ORDER_TYPE[p.orderType] ?? p.orderType}</Chip>
                    </span>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="tabular text-[15px] font-bold text-stone2-900">
                      {money(p.amount)}
                    </p>
                    {p.amountRefunded > 0 && (
                      <p className="tabular text-[11.5px] text-bark-700">
                        −{money(p.amountRefunded)} refunded
                      </p>
                    )}
                    <p className="text-[11.5px] text-stone2-400">
                      {p.paidAt
                        ? `${dayMonth(p.paidAt)} ${time(p.paidAt)}`
                        : `Opened ${dayMonth(p.createdAt)}`}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
