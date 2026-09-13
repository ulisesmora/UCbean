import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { dayMonth, money, ORDER_STATUS, ORDER_TYPE, time } from '@/lib/format';
import { PAYMENT_METHOD, STRIPE_EVENT, paymentStatus } from '@/lib/payments';
import {
  Card,
  Chip,
  Drawer,
  Empty,
  ErrorBox,
  Eyebrow,
  PageHead,
  Row,
  Spinner,
} from '@/components/ui';

interface HistoryOrder {
  id: string;
  status: keyof typeof ORDER_STATUS;
  type: string;
  total: number;
  createdAt: string;
  customer: string;
  paid: boolean;
  slotTime: string | null;
  items: { qty: number; name: string; ticket: string | null }[];
}

interface OrderDetail {
  id: string;
  status: string;
  type: string;
  total: string;
  notes: string | null;
  createdAt: string;
  user: { name: string; email: string; phone: string | null };
  items: {
    id: string;
    qty: number;
    unitPrice: string;
    nameSnapshot: string | null;
    ticketSnapshot: string | null;
  }[];
  statusHistory: { id: string; status: string; note: string | null; createdAt: string }[];
  payment: {
    status: string;
    amount: string;
    paidAt: string | null;
    method: string | null;
    failureCode: string | null;
    failureMessage: string | null;
    amountRefunded: string;
  } | null;
  paymentEvents: {
    id: string;
    type: string;
    status: string | null;
    amount: number | null;
    failureCode: string | null;
    failureMessage: string | null;
    createdAt: string;
  }[];
  pickupReservation: { slotTime: string; confirmationCode: string } | null;
  deliveryAddress: { label: string; street: string; city: string } | null;
}

const FILTROS = ['', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

/**
 * El historial.
 *
 * La cola solo enseña lo que está en marcha. Esta pantalla es la que se
 * abre cuando alguien llama preguntando por un pedido de ayer, así que lo
 * importante es buscar por nombre y ver el rastro completo.
 */
export function OrdersPage() {
  const [estado, setEstado] = useState('');
  const [search, setSearch] = useState('');
  const [dias, setDias] = useState(7);
  const [abierto, setAbierto] = useState<string | null>(null);

  const pedidos = useQuery({
    queryKey: ['crm', 'orders', estado, search, dias],
    queryFn: () =>
      api.get<HistoryOrder[]>(
        `/crm/orders?days=${dias}${estado ? `&status=${estado}` : ''}${
          search ? `&search=${search}` : ''
        }`,
      ),
  });

  const detalle = useQuery({
    queryKey: ['crm', 'order', abierto],
    queryFn: () => api.get<OrderDetail>(`/crm/orders/${abierto}`),
    enabled: Boolean(abierto),
  });

  const total = (pedidos.data ?? []).reduce(
    (s, o) => s + (o.status === 'CANCELLED' ? 0 : o.total),
    0,
  );

  return (
    <>
      <PageHead eyebrow="History" title="Orders">
        <div className="relative w-full sm:w-auto">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone2-400"
          />
          <input
            aria-label="Search by customer"
            placeholder="Search customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field field-search tap-target w-full sm:w-[200px]"
          />
        </div>
        <select
          aria-label="Days"
          value={dias}
          onChange={(e) => setDias(Number(e.target.value))}
          className="field tap-target w-auto"
        >
          <option value={1}>Today</option>
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </PageHead>

      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        {FILTROS.map((f) => (
          <button
            key={f || 'todos'}
            type="button"
            onClick={() => setEstado(f)}
            className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              estado === f
                ? 'bg-stone2-900 text-birch-100'
                : 'bg-white/60 text-stone2-600 hover:bg-stone2-900/5'
            }`}
          >
            {f ? (ORDER_STATUS[f]?.label ?? f) : 'All'}
          </button>
        ))}
        {pedidos.data && (
          <span className="tabular ml-auto text-[13px] text-stone2-400">
            {pedidos.data.length} orders · {money(total)}
          </span>
        )}
      </div>

      {pedidos.isLoading && <Spinner label="Loading history" />}
      {pedidos.error && <ErrorBox error={pedidos.error} onRetry={() => pedidos.refetch()} />}
      {pedidos.data?.length === 0 && (
        <Empty
          title="No orders"
          hint="Try widening the date range or removing the status filter."
        />
      )}

      <div className="flex flex-col gap-2">
        {pedidos.data?.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setAbierto(o.id)}
            className="card card-hover flex items-center gap-4 p-4 text-left"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-stone2-900">{o.customer}</p>
              <p className="truncate text-[12.5px] text-stone2-400">
                {o.items.map((i) => `${i.qty} ${i.name}`).join(', ')}
              </p>
            </div>

            <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
              <Chip tone={o.status === 'CANCELLED' ? 'ember' : 'neutral'}>
                {ORDER_STATUS[o.status]?.label ?? o.status}
              </Chip>
              <Chip>{ORDER_TYPE[o.type] ?? o.type}</Chip>
              {!o.paid && o.status !== 'CANCELLED' && <Chip tone="ember">Unpaid</Chip>}
            </div>

            <div className="shrink-0 text-right">
              <p className="tabular text-[15px] font-bold text-stone2-900">{money(o.total)}</p>
              <p className="text-[11.5px] text-stone2-400">
                {dayMonth(o.createdAt)} {time(o.createdAt)}
              </p>
            </div>
          </button>
        ))}
      </div>

      <Drawer open={Boolean(abierto)} onClose={() => setAbierto(null)} title="Order">
        {detalle.isLoading && <Spinner />}
        {detalle.data && (
          <>
            <Card className="flex flex-col gap-0">
              <Row label="Customer">{detalle.data.user.name}</Row>
              <Row label="Email">{detalle.data.user.email}</Row>
              {detalle.data.user.phone && <Row label="Phone">{detalle.data.user.phone}</Row>}
              <Row label="Type">{ORDER_TYPE[detalle.data.type] ?? detalle.data.type}</Row>
              <Row label="Status">
                {ORDER_STATUS[detalle.data.status]?.label ?? detalle.data.status}
              </Row>
              <Row label="Total">
                <span className="tabular">{money(Number(detalle.data.total))}</span>
              </Row>
              {detalle.data.pickupReservation && (
                <>
                  <Row label="Pickup">{time(detalle.data.pickupReservation.slotTime)}</Row>
                  <Row label="Code">
                    <span className="font-mono tracking-[0.1em]">
                      {detalle.data.pickupReservation.confirmationCode}
                    </span>
                  </Row>
                </>
              )}
              {detalle.data.deliveryAddress && (
                <Row label="Fulfilment">
                  {detalle.data.deliveryAddress.street}, {detalle.data.deliveryAddress.city}
                </Row>
              )}
              {detalle.data.notes && <Row label="Note">{detalle.data.notes}</Row>}
            </Card>

            <Card>
              <Eyebrow>What was made</Eyebrow>
              <ul className="mt-2 flex flex-col gap-2">
                {detalle.data.items.map((i) => (
                  <li
                    key={i.id}
                    className="flex gap-3 border-b border-stone2-200 pb-2 last:border-0"
                  >
                    <span className="tabular shrink-0 rounded-full bg-olive-500/90 px-2 text-[12px] font-bold">
                      {i.qty}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-stone2-900">
                        {i.nameSnapshot ?? 'Drink'}
                      </p>
                      {/* La fórmula tal cual se guardó el día del pedido. */}
                      {i.ticketSnapshot && (
                        <p className="font-mono text-[11px] leading-snug text-olive-700">
                          {i.ticketSnapshot}
                        </p>
                      )}
                    </div>
                    <span className="tabular shrink-0 text-[13.5px]">
                      {money(Number(i.unitPrice) * i.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <PaymentCard detalle={detalle.data} />

            <Card>
              <Eyebrow>Timeline</Eyebrow>
              {/* El historial de estados se escribía desde el primer día y
                  nunca se había podido leer. Aquí es donde sirve. */}
              <ol className="mt-3 flex flex-col gap-0">
                {detalle.data.statusHistory.map((h, i) => (
                  <li key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-olive-500 ring-4 ring-olive-500/20" />
                      {i < detalle.data!.statusHistory.length - 1 && (
                        <span className="w-px flex-1 bg-stone2-200" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-[13.5px] font-medium text-stone2-900">
                        {ORDER_STATUS[h.status]?.label ?? h.status}
                      </p>
                      <p className="text-[11.5px] text-stone2-400">
                        {dayMonth(h.createdAt)} {time(h.createdAt)}
                        {h.note ? ` · ${h.note}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </>
        )}
      </Drawer>
    </>
  );
}

/**
 * El cobro de un pedido, con todo lo que Stripe contó.
 *
 * Es la tarjeta que se abre cuando alguien dice «me cobrasteis y no me llegó
 * nada» o «mi tarjeta dio error». Por eso enseña el motivo del último fallo tal
 * cual lo da Stripe, lo reembolsado y la lista de avisos con su hora: con eso
 * se contesta sin tener que abrir el panel de Stripe.
 */
function PaymentCard({ detalle }: { detalle: OrderDetail }) {
  const pago = detalle.payment;
  const eventos = detalle.paymentEvents ?? [];

  return (
    <Card>
      <Eyebrow>Payment</Eyebrow>
      {pago ? (
        <div className="mt-1 flex flex-col gap-0">
          <Row label="Status">
            <Chip tone={paymentStatus(pago.status).tone}>{paymentStatus(pago.status).label}</Chip>
          </Row>
          <Row label="Amount">
            <span className="tabular">{money(Number(pago.amount))}</span>
          </Row>
          {pago.method && <Row label="Method">{PAYMENT_METHOD[pago.method] ?? pago.method}</Row>}
          {pago.paidAt && (
            <Row label="Paid">
              {dayMonth(pago.paidAt)} {time(pago.paidAt)}
            </Row>
          )}
          {Number(pago.amountRefunded) > 0 && (
            <Row label="Refunded">
              <span className="tabular">{money(Number(pago.amountRefunded))}</span>
            </Row>
          )}
          {pago.failureMessage && (
            <p className="mt-3 rounded-lg border border-bark-300 bg-bark-300/20 px-3 py-2 text-[13px] leading-snug text-stone2-900">
              <span className="font-semibold">Last attempt failed:</span> {pago.failureMessage}
              {pago.failureCode && (
                <span className="font-mono text-[11.5px] text-stone2-400">
                  {' '}
                  · {pago.failureCode}
                </span>
              )}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-[13.5px] text-stone2-400">
          No payment opened. Paid at the counter.
        </p>
      )}

      {eventos.length > 0 && (
        <>
          <div className="mt-5">
            <Eyebrow>Stripe activity</Eyebrow>
          </div>
          <ol className="mt-2 flex flex-col gap-1.5">
            {eventos.map((e) => (
              <li key={e.id} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                <span className="min-w-0 truncate text-stone2-900">
                  {STRIPE_EVENT[e.type] ?? e.type}
                  {e.failureCode && <span className="text-bark-700"> · {e.failureCode}</span>}
                </span>
                <span className="tabular shrink-0 text-stone2-400">
                  {dayMonth(e.createdAt)} {time(e.createdAt)}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </Card>
  );
}
