import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Mail, Phone, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { dayMonth, money } from '@/lib/format';
import {
  Card,
  Chip,
  Drawer,
  Empty,
  ErrorBox,
  Eyebrow,
  Field,
  PageHead,
  Row,
  Spinner,
} from '@/components/ui';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  marketingOptIn: boolean;
  verificado: boolean;
  puntos: number;
  sellos: number;
  pedidos: number;
  gastado: number;
  ultimoPedido: string | null;
}

interface CustomerDetail extends Customer {
  birthday: string | null;
  addresses: { id: string; label: string; street: string; city: string }[];
  orders: { id: string; status: string; total: string; createdAt: string; items: unknown[] }[];
  loyaltyCard: {
    entries: {
      id: string;
      delta: number;
      reason: string;
      note: string | null;
      createdAt: string;
    }[];
    redemptions: { id: string; code: string; status: string; reward: { name: string } }[];
  } | null;
}

/**
 * Los clientes.
 *
 * Faltaba entera: el endpoint para ajustar puntos pedía un id de usuario
 * que no había forma de averiguar desde ninguna pantalla, así que la
 * función existía y no se podía usar.
 */
export function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [abierto, setAbierto] = useState<string | null>(null);

  const clientes = useQuery({
    queryKey: ['crm', 'customers', search],
    queryFn: () => api.get<Customer[]>(`/crm/customers${search ? `?search=${search}` : ''}`),
  });

  const detalle = useQuery({
    queryKey: ['crm', 'customer', abierto],
    queryFn: () => api.get<CustomerDetail>(`/crm/customers/${abierto}`),
    enabled: Boolean(abierto),
  });

  const ajustar = useMutation({
    mutationFn: (body: { userId: string; delta: number; note: string }) =>
      api.post('/loyalty/grant', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'customers'] });
      qc.invalidateQueries({ queryKey: ['crm', 'customer'] });
    },
  });

  return (
    <>
      <PageHead eyebrow="People" title="Customers">
        <div className="relative w-full sm:w-auto">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone2-400"
          />
          <input
            aria-label="Search by name or email"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field field-search tap-target w-full sm:w-[240px]"
          />
        </div>
      </PageHead>

      {ajustar.error && <ErrorBox error={ajustar.error} />}
      {clientes.isLoading && <Spinner label="Loading customers" />}
      {clientes.error && <ErrorBox error={clientes.error} onRetry={() => clientes.refetch()} />}

      {clientes.data?.length === 0 && (
        <Empty
          title={search ? 'No one by that name' : 'No customers yet'}
          hint={
            search ? 'Try the email.' : 'They show up here as soon as someone creates an account.'
          }
        />
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {clientes.data?.map((c) => (
          <Card key={c.id} hover className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setAbierto(c.id)}
              className="flex flex-col gap-3 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-[16px] font-semibold text-stone2-900">
                    {c.name}
                    {c.verificado && <BadgeCheck size={14} className="shrink-0 text-olive-700" />}
                  </p>
                  <p className="truncate text-[12.5px] text-stone2-400">{c.email}</p>
                </div>
                <span className="tabular shrink-0 rounded-full bg-olive-500/90 px-2.5 py-0.5 text-[12px] font-bold text-stone2-900">
                  {c.puntos} pts
                </span>
              </div>

              <div className="flex items-baseline gap-4 border-t border-stone2-200 pt-3">
                <div>
                  <p className="tabular text-[17px] font-bold text-stone2-900">{c.pedidos}</p>
                  <Eyebrow>Orders</Eyebrow>
                </div>
                <div>
                  <p className="tabular text-[17px] font-bold text-stone2-900">
                    {money(c.gastado)}
                  </p>
                  <Eyebrow>Spent</Eyebrow>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[13px] text-stone2-600">
                    {c.ultimoPedido ? dayMonth(c.ultimoPedido) : 'Never'}
                  </p>
                  <Eyebrow>Last visit</Eyebrow>
                </div>
              </div>
            </button>

            <div className="flex flex-wrap gap-1.5">
              {c.marketingOptIn && <Chip tone="olive">Accepts marketing</Chip>}
              {!c.verificado && <Chip tone="ember">Email not verified</Chip>}
              {c.sellos > 0 && (
                <Chip>
                  {c.sellos} {c.sellos === 1 ? 'sello' : 'sellos'}
                </Chip>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Drawer
        open={Boolean(abierto)}
        onClose={() => setAbierto(null)}
        title={detalle.data?.name ?? 'Customer'}
      >
        {detalle.isLoading && <Spinner />}
        {detalle.data && (
          <>
            <Card className="flex flex-col gap-0">
              <Row label="Email">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={12} className="text-stone2-400" />
                  {detalle.data.email}
                </span>
              </Row>
              {detalle.data.phone && (
                <Row label="Phone">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone size={12} className="text-stone2-400" />
                    {detalle.data.phone}
                  </span>
                </Row>
              )}
              <Row label="Customer since">{dayMonth(detalle.data.createdAt)}</Row>
              <Row label="Points">
                <span className="tabular">{detalle.data.puntos}</span>
              </Row>
              <Row label="Stamps">
                <span className="tabular">{detalle.data.sellos}</span>
              </Row>
              <Row label="Marketing">
                {detalle.data.marketingOptIn ? 'Accepted' : 'Not accepted'}
              </Row>
            </Card>

            <Card>
              <Eyebrow>Adjust points</Eyebrow>
              <form
                className="mt-3 flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  ajustar.mutate({
                    userId: detalle.data!.id,
                    delta: Number(f.get('delta')),
                    note: String(f.get('note')),
                  });
                  e.currentTarget.reset();
                }}
              >
                <div className="grid grid-cols-[110px_1fr] gap-3">
                  <Field
                    name="delta"
                    label="Points"
                    type="number"
                    required
                    placeholder="25"
                    hint="Negative subtracts"
                  />
                  <Field name="note" label="Reason" required placeholder="Sorry for the wait" />
                </div>
                <button
                  type="submit"
                  disabled={ajustar.isPending}
                  className="btn btn-olive self-start"
                >
                  {ajustar.isPending ? 'Saving…' : 'Apply'}
                </button>
              </form>
            </Card>

            {detalle.data.loyaltyCard && detalle.data.loyaltyCard.entries.length > 0 && (
              <Card>
                <Eyebrow>Points activity</Eyebrow>
                <ul className="mt-2 flex flex-col">
                  {detalle.data.loyaltyCard.entries.slice(0, 12).map((e) => (
                    <li
                      key={e.id}
                      className="flex items-baseline justify-between gap-3 border-b border-stone2-200 py-2 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] text-stone2-900">
                          {e.note ?? e.reason}
                        </p>
                        <p className="text-[11.5px] text-stone2-400">{dayMonth(e.createdAt)}</p>
                      </div>
                      <span
                        className={`tabular shrink-0 text-[14px] font-bold ${
                          e.delta > 0 ? 'text-olive-700' : 'text-bark-700'
                        }`}
                      >
                        {e.delta > 0 ? '+' : ''}
                        {e.delta}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {detalle.data.orders.length > 0 && (
              <Card>
                <Eyebrow>Recent orders</Eyebrow>
                <ul className="mt-2 flex flex-col">
                  {detalle.data.orders.slice(0, 10).map((o) => (
                    <li
                      key={o.id}
                      className="flex items-baseline justify-between gap-3 border-b border-stone2-200 py-2 last:border-0"
                    >
                      <div>
                        <p className="text-[13.5px] text-stone2-900">
                          {o.items.length} {o.items.length === 1 ? 'line' : 'lines'}
                        </p>
                        <p className="text-[11.5px] text-stone2-400">
                          {dayMonth(o.createdAt)} · {o.status}
                        </p>
                      </div>
                      <span className="tabular shrink-0 text-[14px] font-semibold">
                        {money(Number(o.total))}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}
      </Drawer>
    </>
  );
}
