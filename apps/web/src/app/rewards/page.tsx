'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Gift, Loader2, Sparkles } from 'lucide-react';
import { loyaltyApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { LoyaltySummary } from '@/components/features/account/loyalty-summary';

/**
 * Los puntos, y qué hacer con ellos.
 *
 * Un saldo que no se puede gastar no es fidelidad, es un número. Esta
 * pantalla existe para cerrar ese círculo: ver lo que tienes, ver lo que
 * cuesta cada cosa, y canjear.
 *
 * Los premios ya canjeados y sin usar van arriba del todo, porque un código
 * que no encuentras cuando llegas a la barra es un premio que no existe.
 */
export default function RewardsPage() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const qc = useQueryClient();

  const { data: rewards = [], isLoading: cargandoPremios } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => loyaltyApi.rewards(),
  });

  const { data: card, isLoading: cargandoSaldo } = useQuery({
    queryKey: ['loyalty-me'],
    queryFn: () => loyaltyApi.me(accessToken!),
    enabled: isAuthenticated && !!accessToken,
  });

  const redeem = useMutation({
    mutationFn: (rewardId: string) => loyaltyApi.redeem(rewardId, accessToken!),
    onSuccess: (res) => {
      toast.success(`${res.reward} is yours. Show the code at the counter.`);
      qc.invalidateQueries({ queryKey: ['loyalty-me'] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <Middle>
        <Sparkles size={36} className="text-stone2-400" strokeWidth={1.4} />
        <h1 className="text-2xl font-extrabold text-stone2-900">Sign in to see your points</h1>
        <p className="text-[15px] text-stone2-600">You earn them on every order.</p>
        <Link href="/profile" className="btn btn-acid mt-2 px-6 py-2.5 text-[15px]">
          Sign in
        </Link>
      </Middle>
    );
  }

  if (cargandoSaldo || cargandoPremios) {
    return (
      <Middle>
        <Loader2 size={26} className="animate-spin text-stone2-400" />
      </Middle>
    );
  }

  const puntos = card?.points ?? 0;
  const pendientes = card?.pendingRedemptions ?? [];
  const activos = rewards.filter((r) => r.isActive);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 md:py-16">
      <p className="mb-2 text-[12px] uppercase tracking-[0.2em] text-forest-600">Rewards</p>
      <h1 className="mb-2 text-4xl font-extrabold leading-none text-stone2-900 md:text-5xl">
        <span className="tabular-nums">{puntos}</span> points.
      </h1>
      <p className="mb-6 text-[15px] text-stone2-600">
        You earn them every time you order. Spend them whenever you like.
      </p>

      <LoyaltySummary showPoints={false} className="mb-10" />

      {pendientes.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-base font-bold text-stone2-900">Ready to use</h2>
          <div className="flex flex-col gap-2.5">
            {pendientes.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 rounded border-2 border-stone2-900 bg-neon-500 p-4"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-bold text-stone2-900">
                    {p.reward.name}
                  </span>
                  <span className="text-[12px] text-stone2-900/70">Show this at the counter</span>
                </span>
                <span className="shrink-0 font-mono text-xl font-bold tracking-[0.14em] text-stone2-900">
                  {p.code}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-base font-bold text-stone2-900">What you can get</h2>
        {activos.length === 0 ? (
          <p className="py-4 text-sm text-stone2-400">Nothing on the shelf right now.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {activos.map((r) => {
              const alcanza = puntos >= r.cost;
              const faltan = r.cost - puntos;
              return (
                <div key={r.id} className="glass glass-edge flex items-center gap-4 p-4">
                  <Gift
                    size={20}
                    className={alcanza ? 'text-forest-700' : 'text-stone2-400'}
                    strokeWidth={1.6}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-stone2-900">{r.name}</p>
                    <p className="truncate text-[13px] text-stone2-600">{r.description}</p>
                    {/* Lo que falta, dicho en puntos y no en una barra: es un
                        número pequeño y concreto, y anima más que un gráfico. */}
                    <p className="mt-0.5 text-[12px] tabular-nums text-stone2-400">
                      {r.cost} points
                      {!alcanza && ` · ${faltan} to go`}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!alcanza || redeem.isPending}
                    onClick={() => redeem.mutate(r.id)}
                    className="btn btn-acid tap-target shrink-0 px-5 py-2.5 text-[14px] disabled:opacity-40"
                  >
                    {redeem.isPending ? '…' : 'Redeem'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {card && card.movements.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-base font-bold text-stone2-900">Recent points</h2>
          <ul className="flex flex-col gap-1.5">
            {card.movements.slice(0, 8).map((m) => (
              <li
                key={m.id}
                className="flex items-baseline justify-between gap-3 border-b border-stone2-900/10 pb-1.5 text-[14px]"
              >
                <span className="min-w-0 truncate text-stone2-600">{m.note ?? m.reason}</span>
                <span
                  className={`shrink-0 tabular-nums font-semibold ${
                    m.delta > 0 ? 'text-forest-700' : 'text-bark-700'
                  }`}
                >
                  {m.delta > 0 ? '+' : ''}
                  {m.delta}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Middle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-3 px-5 text-center">
      {children}
    </div>
  );
}
