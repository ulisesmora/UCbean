import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, Chip, Empty, ErrorBox, Eyebrow, Field, PageHead, Spinner } from '@/components/ui';

type Audience = 'ALL' | 'WITH_POINTS' | 'BIRTHDAY_MONTH' | 'INACTIVE';

const PUBLICOS: Record<Audience, string> = {
  ALL: 'Everyone who accepted marketing',
  WITH_POINTS: 'Has points saved up',
  BIRTHDAY_MONTH: 'Birthday this month',
  INACTIVE: 'No order in 60 days',
};

interface Campaign {
  id: string;
  name: string;
  channel: string;
  audience: Audience;
  subject: string | null;
  body: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  _count?: { deliveries: number };
}

/**
 * Campañas.
 *
 * Lo importante de esta pantalla no es crear: es ver a cuánta gente va a
 * llegar antes de mandarla. Un correo a mil personas no se deshace, así
 * que el contador de destinatarios está siempre a la vista.
 */
export function CampaignsPage() {
  const qc = useQueryClient();
  const [audience, setAudience] = useState<Audience>('ALL');
  const [creando, setCreando] = useState(false);

  const campanas = useQuery({
    queryKey: ['crm', 'campaigns'],
    queryFn: () => api.get<Campaign[]>('/campaigns'),
  });

  const publico = useQuery({
    queryKey: ['crm', 'audience', audience],
    queryFn: () =>
      api.get<{ total: number; sample: string[] }>(`/campaigns/audience?audience=${audience}`),
  });

  const crear = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/campaigns', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'campaigns'] });
      setCreando(false);
    },
  });

  const enviar = useMutation({
    mutationFn: (id: string) =>
      api.post<{ enviados: number; fallidos: number }>(`/campaigns/${id}/send`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'campaigns'] }),
  });

  if (campanas.isLoading) return <Spinner label="Loading campaigns" />;
  if (campanas.error) return <ErrorBox error={campanas.error} onRetry={() => campanas.refetch()} />;

  return (
    <>
      <PageHead eyebrow="Marketing" title="Campaigns">
        <button
          type="button"
          onClick={() => setCreando((v) => !v)}
          className="btn btn-olive tap-target px-4 py-2 text-[14px]"
        >
          New campaign
        </button>
      </PageHead>

      {(crear.error || enviar.error) && <ErrorBox error={crear.error ?? enviar.error} />}

      {enviar.data && (
        <div className="card mb-5 border-olive-600 bg-olive-50 p-3 text-[14px] text-stone2-900">
          Sent <strong className="tabular">{enviar.data.enviados}</strong>
          {enviar.data.fallidos > 0 && (
            <>
              , failed <strong className="tabular">{enviar.data.fallidos}</strong>
            </>
          )}
          .
        </div>
      )}

      {creando && (
        <Card className="mb-6">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const programar = String(f.get('scheduledAt') ?? '');
              crear.mutate({
                name: String(f.get('name')),
                channel: 'EMAIL',
                audience,
                subject: String(f.get('subject')),
                body: String(f.get('body')),
                ...(programar ? { scheduledAt: new Date(programar).toISOString() } : {}),
              });
            }}
          >
            <Eyebrow>New campaign</Eyebrow>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field name="name" label="Internal name" placeholder="Back to school" required />
              <Field
                name="subject"
                label="Email subject"
                placeholder="Come back for your coffee"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="audience" className="text-[12.5px] font-semibold text-stone2-600">
                Audience
              </label>
              <select
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value as Audience)}
                className="tap-target rounded border border-stone2-200 bg-white px-3 py-2 text-[14px] outline-none"
              >
                {Object.entries(PUBLICOS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>

              {/* El número que evita mandar mil correos por error. */}
              <div className="mt-1 flex items-center gap-2 rounded border border-stone2-200 bg-white/60 px-3 py-2">
                <Users size={14} />
                <span className="text-[13px] text-stone2-900">
                  Would reach <strong className="tabular">{publico.data?.total ?? '…'}</strong>{' '}
                  {publico.data?.total === 1 ? 'person' : 'people'}
                </span>
                {publico.data && publico.data.total > 0 && (
                  <span className="ml-auto truncate font-mono text-[11px] text-stone2-400">
                    {publico.data.sample.slice(0, 3).join(', ')}
                    {publico.data.total > 3 ? '…' : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="body" className="text-[12.5px] font-semibold text-stone2-600">
                Message
              </label>
              <textarea
                id="body"
                name="body"
                required
                rows={4}
                defaultValue="Hi {{name}}, you have {{points}} points. Drop by this week."
                className="rounded border border-stone2-200 px-3 py-2 text-[14px] outline-none focus:bg-white/60"
              />
              <p className="text-[12px] text-stone2-400">
                {'{{name}}'} y {'{{points}}'} se sustituyen por cada persona.
              </p>
            </div>

            <Field name="scheduledAt" label="Schedule (optional)" type="datetime-local" />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={crear.isPending}
                className="btn btn-olive px-4 py-2 text-[14px]"
              >
                {crear.isPending ? 'Saving…' : 'Save'}
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

      {campanas.data?.length === 0 ? (
        <Empty
          title="No campaigns"
          hint="Create one and see how many people it would reach before sending it."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {campanas.data?.map((c) => {
            const enviada = c.status === 'SENT';
            return (
              <Card key={c.id} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[16px] font-extrabold text-stone2-900">{c.name}</h3>
                  <Chip tone={enviada ? 'olive' : c.status === 'FAILED' ? 'ember' : 'neutral'}>
                    {c.status}
                  </Chip>
                </div>

                {c.subject && <p className="text-[14px] text-stone2-900">{c.subject}</p>}
                <p className="line-clamp-2 text-[13px] text-stone2-600">{c.body}</p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Chip>
                    {PUBLICOS[c.audience]?.split(' ').slice(0, 3).join(' ') ?? c.audience}
                  </Chip>
                  <Chip>{c.channel}</Chip>
                  {c._count && <Chip>{c._count.deliveries} entregas</Chip>}
                </div>

                <div className="mt-auto pt-2">
                  {enviada ? (
                    <p className="font-mono text-[11px] text-stone2-400">
                      Enviada el {new Date(c.sentAt!).toLocaleString('en-CA')}. No se repite.
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={enviar.isPending}
                      onClick={() => enviar.mutate(c.id)}
                      className="btn btn-olive tap-target w-full py-2 text-[14px]"
                    >
                      <Send size={14} />
                      {enviar.isPending ? 'Sending…' : 'Send now'}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
