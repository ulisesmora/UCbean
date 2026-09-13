'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { reservationsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { AuthModal } from '@/components/features/auth/auth-modal';
import { CheckoutPanel } from '@/components/features/checkout/checkout-panel';

/** Cuándo se recoge: en cuanto esté, o a una hora elegida. */
type When = 'asap' | 'slot';

export default function PickupPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [when, setWhen] = useState<When>('asap');
  const [showAuth, setShowAuth] = useState(false);
  const { isAuthenticated } = useAuthStore();

  // «Ahora mismo» solo existe hoy: para mañana siempre hay que elegir hora.
  const esHoy = date === today;
  const modo: When = esHoy ? when : 'slot';

  const { data: slotData, isLoading } = useQuery({
    queryKey: ['pickup-slots', date],
    queryFn: () => reservationsApi.pickupSlots(date),
    enabled: !!date,
  });

  return (
    <>
      <div className="mx-auto max-w-2xl px-5 py-12 md:py-16">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-forest-600">
          Skip the line
        </p>
        <h1 className="mb-2 font-body text-4xl font-extrabold text-stone2-900 md:text-5xl">
          Order &amp; Pickup
        </h1>
        <p className="mb-10 max-w-md text-[15px] text-stone2-600">
          Order ahead, pick up in 10–15 minutes. No waiting.
        </p>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-stone2-900">Pickup date</h2>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => {
              setDate(e.target.value);
              setSelectedSlot(null);
              setWhen(e.target.value === today ? 'asap' : 'slot');
            }}
            className="rounded border-2 border-stone2-900 bg-white/70 px-4 py-2.5 text-sm font-medium text-stone2-900 outline-none focus:bg-white"
          />
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold text-stone2-900">Pickup time</h2>

          {/* La opción por defecto hoy: la mayoría pide de camino, no para
              dentro de tres horas. Elegir hora sigue ahí, un toque abajo. */}
          {esHoy && (
            <button
              type="button"
              onClick={() => {
                setWhen('asap');
                setSelectedSlot(null);
              }}
              aria-pressed={modo === 'asap'}
              className={`glass glass-edge tap-target mb-4 flex w-full items-center gap-3 p-4 text-left transition-colors ${
                modo === 'asap' ? 'bg-neon-500/70' : 'glass-hover'
              }`}
            >
              <Zap size={20} className="shrink-0 text-forest-700" strokeWidth={1.8} />
              <span className="flex min-w-0 flex-col">
                <span className="text-[15px] font-bold text-stone2-900">
                  As soon as it&apos;s ready
                </span>
                <span className="text-[12.5px] text-stone2-600">
                  Usually 10–15 minutes. We&apos;ll confirm the exact time.
                </span>
              </span>
            </button>
          )}

          {esHoy && (
            <p className="mb-3 text-[12px] uppercase tracking-[0.14em] text-stone2-400">
              or pick a time
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : !slotData?.slots?.length ? (
            <p className="text-sm text-stone2-400">No slots available for this date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slotData.slots.map((time) => {
                const active = modo === 'slot' && selectedSlot === time;
                return (
                  <button
                    key={time}
                    onClick={() => {
                      setSelectedSlot(time);
                      setWhen('slot');
                    }}
                    aria-pressed={active}
                    className={`tap-target flex flex-col items-center rounded border-2 border-stone2-900 px-2 py-2.5 font-mono text-xs font-bold tabular-nums transition-all ${
                      active
                        ? 'bg-neon-500 text-stone2-900'
                        : 'bg-white/60 text-stone2-900 hover:bg-white'
                    }`}
                  >
                    <Clock size={13} className="mb-1" />
                    {time}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {isAuthenticated ? (
          <CheckoutPanel
            date={date}
            slot={modo === 'slot' ? selectedSlot : null}
            asap={modo === 'asap'}
          />
        ) : (
          <div className="glass glass-edge flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-[15px] text-stone2-900">Sign in to place your order.</p>
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              className="btn btn-acid px-6 py-2.5 text-[15px]"
            >
              Sign in
            </button>
          </div>
        )}
      </div>

      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </>
  );
}
