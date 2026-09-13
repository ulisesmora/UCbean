import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { api } from '@/lib/api';
import { dayMonth, RESERVATION_STATUS, time } from '@/lib/format';
import { Card, Chip, Empty, ErrorBox, PageHead, Spinner } from '@/components/ui';

interface Reservation {
  id: string;
  partySize: number;
  scheduledAt: string;
  status: keyof typeof RESERVATION_STATUS;
  notes: string | null;
  user: { name: string; phone: string | null };
  table: { number: number; zone: string | null; capacity: number };
}

/** El camino normal de una reserva, un paso cada vez. */
const SIGUIENTE: Partial<Record<string, { status: string; label: string }>> = {
  PENDING: { status: 'CONFIRMED', label: 'Confirm' },
  CONFIRMED: { status: 'SEATED', label: 'Seat' },
  SEATED: { status: 'COMPLETED', label: 'Finish' },
};

/**
 * Las mesas del día.
 *
 * Agrupadas por día porque la pregunta de la barra es «qué hay hoy» y la
 * del dueño es «qué viene esta semana». Una lista plana de fechas obliga
 * a leer todas las horas para responder cualquiera de las dos.
 */
export function TablesPage() {
  const qc = useQueryClient();

  const reservas = useQuery({
    queryKey: ['crm', 'tables'],
    queryFn: () => api.get<Reservation[]>('/crm/tables'),
    refetchInterval: 60_000,
  });

  const cambiar = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/crm/tables/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'tables'] }),
  });

  if (reservas.isLoading) return <Spinner label="Loading bookings" />;
  if (reservas.error) return <ErrorBox error={reservas.error} onRetry={() => reservas.refetch()} />;

  const todas = reservas.data ?? [];

  // Se agrupan por día conservando el orden que ya trae la API.
  const porDia = new Map<string, Reservation[]>();
  for (const r of todas) {
    const clave = new Date(r.scheduledAt).toDateString();
    porDia.set(clave, [...(porDia.get(clave) ?? []), r]);
  }

  const hoy = new Date().toDateString();

  return (
    <>
      <PageHead eyebrow="Floor" title="Tables">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-stone2-400">
          {todas.length} de hoy en adelante
        </span>
      </PageHead>

      {cambiar.error && <ErrorBox error={cambiar.error} />}

      {todas.length === 0 ? (
        <Empty
          title="No bookings"
          hint="Tables booked on the website show up here, from today onwards."
        />
      ) : (
        [...porDia.entries()].map(([dia, lista]) => (
          <section key={dia} className="mb-7">
            <h2 className="mb-3 flex items-baseline gap-2 text-[15px] font-extrabold text-stone2-900">
              {dia === hoy ? 'Today' : dayMonth(lista[0].scheduledAt)}
              <span className="font-mono text-[11px] font-normal text-stone2-400">
                {lista.length} {lista.length === 1 ? 'mesa' : 'mesas'}
              </span>
            </h2>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {lista.map((r) => {
                const paso = SIGUIENTE[r.status];
                const cancelada = r.status === 'CANCELLED' || r.status === 'COMPLETED';

                return (
                  <Card
                    key={r.id}
                    className={`flex flex-col gap-2 ${cancelada ? 'opacity-55' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[16px] font-bold text-stone2-900">
                          {r.user.name}
                        </p>
                        {r.user.phone && (
                          <p className="font-mono text-[12px] text-stone2-400">{r.user.phone}</p>
                        )}
                      </div>
                      <span className="tabular shrink-0 text-[18px] font-extrabold text-stone2-900">
                        {time(r.scheduledAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Chip tone={r.status === 'SEATED' ? 'olive' : 'neutral'}>
                        {RESERVATION_STATUS[r.status]}
                      </Chip>
                      <Chip>
                        <Users size={10} />
                        {r.partySize}
                      </Chip>
                      <Chip>Mesa {r.table.number}</Chip>
                      {r.table.zone && <Chip>{r.table.zone}</Chip>}
                    </div>

                    {r.notes && (
                      <p className="rounded border border-stone2-200 bg-white/60 px-2 py-1.5 text-[13px]">
                        {r.notes}
                      </p>
                    )}

                    {!cancelada && (
                      <div className="mt-auto flex gap-2 pt-1">
                        {paso && (
                          <button
                            type="button"
                            disabled={cambiar.isPending}
                            onClick={() => cambiar.mutate({ id: r.id, status: paso.status })}
                            className="btn btn-olive tap-target flex-1 py-2 text-[13px]"
                          >
                            {paso.label}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={cambiar.isPending}
                          onClick={() => cambiar.mutate({ id: r.id, status: 'CANCELLED' })}
                          className="btn tap-target px-3 py-2 text-[12px] text-bark-700"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>
        ))
      )}
    </>
  );
}
