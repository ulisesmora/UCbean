import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gift, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, Chip, Empty, ErrorBox, Eyebrow, Field, PageHead, Spinner } from '@/components/ui';
import { useIsOwner } from '@/stores/auth';

interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  isActive: boolean;
}

interface Discount {
  id: string;
  code: string;
  description: string;
  kind: 'PERCENT' | 'AMOUNT';
  value: string | number;
  endsAt: string | null;
  isActive: boolean;
  userId: string | null;
  trigger: string | null;
}

/**
 * Premios y cupones.
 *
 * Los cupones personales que reparte el sistema (bienvenida, cumpleaños)
 * se listan aparte de los códigos abiertos: son cientos y no se gestionan
 * a mano, así que mezclarlos escondería los que sí se administran.
 */
export function LoyaltyPage() {
  const qc = useQueryClient();
  const esDueno = useIsOwner();
  const [creando, setCreando] = useState(false);

  const premios = useQuery({
    queryKey: ['crm', 'rewards'],
    queryFn: () => api.get<Reward[]>('/loyalty/rewards'),
  });

  const cupones = useQuery({
    queryKey: ['crm', 'discounts'],
    queryFn: () => api.get<Discount[]>('/discounts/mine'),
  });

  const crearPremio = useMutation({
    mutationFn: (body: { name: string; description: string; cost: number }) =>
      api.post('/loyalty/rewards', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'rewards'] });
      setCreando(false);
    },
  });

  if (premios.isLoading) return <Spinner label="Loading loyalty" />;
  if (premios.error) return <ErrorBox error={premios.error} onRetry={() => premios.refetch()} />;

  // Los que reparte el sistema llevan `trigger`; los abiertos, no.
  const abiertos = (cupones.data ?? []).filter((d) => !d.trigger);

  return (
    <>
      <PageHead eyebrow="Customers" title="Loyalty">
        {esDueno && (
          <button
            type="button"
            onClick={() => setCreando((v) => !v)}
            className="btn btn-olive tap-target px-4 py-2 text-[14px]"
          >
            <Plus size={14} />
            New reward
          </button>
        )}
      </PageHead>

      {crearPremio.error && <ErrorBox error={crearPremio.error} />}

      {creando && (
        <Card className="mb-5">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              crearPremio.mutate({
                name: String(f.get('name')),
                description: String(f.get('description')),
                cost: Number(f.get('cost')),
              });
            }}
          >
            <Eyebrow>New reward</Eyebrow>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
              <Field name="name" label="Name" placeholder="Free coffee" required />
              <Field
                name="description"
                label="What it includes"
                placeholder="Any small drink"
                required
              />
              <Field name="cost" label="Points" type="number" defaultValue="120" required />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={crearPremio.isPending}
                className="btn btn-olive px-4 py-2 text-[14px]"
              >
                {crearPremio.isPending ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setCreando(false)}
                className="btn px-4 py-2 text-[14px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <section className="mb-8">
        <div className="mb-3">
          <Eyebrow>Redeemable rewards</Eyebrow>
        </div>
        {premios.data?.length === 0 ? (
          <Empty title="No rewards" hint="Without rewards, points are worth nothing." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {premios.data?.map((p) => (
              <Card key={p.id} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[16px] font-extrabold text-stone2-900">{p.name}</h3>
                  <span className="tabular shrink-0 rounded border border-stone2-200 bg-olive-500 px-2 py-0.5 font-mono text-[13px] font-bold text-stone2-900">
                    {p.cost} pts
                  </span>
                </div>
                <p className="text-[13px] text-stone2-600">{p.description}</p>
                <div className="mt-auto pt-1">
                  <Chip tone={p.isActive ? 'olive' : 'neutral'}>
                    <Gift size={10} />
                    {p.isActive ? 'Available' : 'Off'}
                  </Chip>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow>Open codes</Eyebrow>
        </div>
        {abiertos.length === 0 ? (
          <Empty
            title="No open codes"
            hint="Welcome and birthday codes are handed out automatically and are not listed here."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {abiertos.map((d) => (
              <Card key={d.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded border border-stone2-200 bg-white/60 px-2 py-0.5 font-mono text-[14px] font-bold tracking-[0.08em] text-stone2-900">
                    {d.code}
                  </span>
                  <span className="tabular text-[15px] font-extrabold text-stone2-900">
                    {d.kind === 'PERCENT' ? `${Number(d.value)}%` : `$${Number(d.value)}`}
                  </span>
                </div>
                <p className="text-[13px] text-stone2-600">{d.description}</p>
                {d.endsAt && (
                  <p className="font-mono text-[11px] text-stone2-400">
                    Vence {new Date(d.endsAt).toLocaleDateString('en-CA')}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
