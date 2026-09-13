import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { dayMonth } from '@/lib/format';
import { Card, Chip, ErrorBox, Eyebrow, Field, PageHead, Spinner } from '@/components/ui';
import { useIsOwner, useUser } from '@/stores/auth';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'STAFF';
  createdAt: string;
  verificado: boolean;
}

/**
 * El equipo.
 *
 * Hasta ahora la única forma de dar de alta a un barista era la semilla o
 * tocar la base a mano, así que contratar a alguien exigía un despliegue.
 *
 * Solo el dueño entra aquí a escribir: crear cuentas que abren la caja y
 * la lista de clientes no puede quedar en manos de la barra.
 */
export function TeamPage() {
  const qc = useQueryClient();
  const esDueno = useIsOwner();
  const yo = useUser();
  const [creando, setCreando] = useState(false);

  const equipo = useQuery({
    queryKey: ['crm', 'staff'],
    queryFn: () => api.get<Staff[]>('/crm/staff'),
  });

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ['crm', 'staff'] });
    setCreando(false);
  };

  const crear = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post<{ ascendido: boolean; name: string }>('/crm/staff', body),
    onSuccess: refrescar,
  });

  const cambiarRol = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/crm/staff/${id}/role`, { role }),
    onSuccess: refrescar,
  });

  if (equipo.isLoading) return <Spinner label="Loading team" />;
  if (equipo.error) return <ErrorBox error={equipo.error} onRetry={() => equipo.refetch()} />;

  const duenos = (equipo.data ?? []).filter((s) => s.role === 'OWNER').length;

  return (
    <>
      <PageHead eyebrow="Access" title="Team">
        {esDueno && (
          <button type="button" onClick={() => setCreando((v) => !v)} className="btn btn-olive">
            <UserPlus size={15} />
            Add
          </button>
        )}
      </PageHead>

      {(crear.error || cambiarRol.error) && <ErrorBox error={crear.error ?? cambiarRol.error} />}

      {crear.data && (
        <Card className="mb-5 border-olive-300 bg-olive-50/70">
          <p className="text-[14px] text-stone2-900">
            {crear.data.ascendido
              ? `${crear.data.name} already had a customer account and is now on the team. They sign in with their usual password.`
              : `${crear.data.name} can sign in now. Give them the password in person, not by email.`}
          </p>
        </Card>
      )}

      {creando && (
        <Card className="mb-6">
          <Eyebrow>Add staff</Eyebrow>
          <form
            className="mt-3 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              crear.mutate({
                name: String(f.get('name')),
                email: String(f.get('email')),
                password: String(f.get('password')),
                role: String(f.get('role')),
              });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field name="name" label="Name" required placeholder="Marta Ruiz" />
              <Field
                name="email"
                label="Email"
                type="email"
                required
                placeholder="marta@aroundthebean.ca"
                hint="If they are already a customer, they are promoted without changing their password"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                name="password"
                label="Password"
                type="password"
                required
                minLength={10}
                hint="At least 10 characters: this account opens the till"
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="role" className="text-[12.5px] font-semibold text-stone2-600">
                  Role
                </label>
                <select id="role" name="role" defaultValue="STAFF" className="field tap-target">
                  <option value="STAFF">Staff · bar and orders</option>
                  <option value="OWNER">Owner · everything, including campaigns</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={crear.isPending} className="btn btn-olive">
                {crear.isPending ? 'Saving…' : 'Add'}
              </button>
              <button type="button" onClick={() => setCreando(false)} className="btn btn-quiet">
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {equipo.data?.map((s) => {
          const soyYo = s.id === yo?.id;
          // Al único dueño no se le puede quitar el rol: dejaría el local
          // sin nadie que pueda volver a dar de alta a nadie.
          const ultimoDueno = s.role === 'OWNER' && duenos <= 1;

          return (
            <Card key={s.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-semibold text-stone2-900">{s.name}</p>
                  <p className="truncate text-[12.5px] text-stone2-400">{s.email}</p>
                </div>
                <Chip tone={s.role === 'OWNER' ? 'olive' : 'neutral'}>
                  {s.role === 'OWNER' && <ShieldCheck size={10} />}
                  {s.role === 'OWNER' ? 'Owner' : 'Staff'}
                </Chip>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 border-t border-stone2-200 pt-3">
                <span className="text-[12.5px] text-stone2-400">Desde {dayMonth(s.createdAt)}</span>
                {soyYo && <Chip>You</Chip>}

                {esDueno && !soyYo && (
                  <div className="ml-auto flex gap-1.5">
                    <button
                      type="button"
                      disabled={cambiarRol.isPending || ultimoDueno}
                      onClick={() =>
                        cambiarRol.mutate({
                          id: s.id,
                          role: s.role === 'OWNER' ? 'STAFF' : 'OWNER',
                        })
                      }
                      className="btn px-2.5 py-1 text-[12.5px]"
                    >
                      {s.role === 'OWNER' ? 'Make staff' : 'Make owner'}
                    </button>
                    <button
                      type="button"
                      disabled={cambiarRol.isPending || ultimoDueno}
                      onClick={() => cambiarRol.mutate({ id: s.id, role: 'CUSTOMER' })}
                      className="btn btn-quiet px-2.5 py-1 text-[12.5px] text-bark-700"
                      title="Removes their access to the counter. Their customer account stays as it is."
                    >
                      Remove access
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {!esDueno && (
        <p className="mt-6 text-[13px] text-stone2-400">
          Only the owner can add people or change roles.
        </p>
      )}
    </>
  );
}
