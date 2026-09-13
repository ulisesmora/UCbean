'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Bell, BellRing, Check, Heart, Loader2 } from 'lucide-react';
import { ordersApi, paymentsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useSaveFavorite } from '@/hooks/use-favorites';
import { sceneOf, DEFAULT_BUILD, type Build } from '@/lib/builder';
import { useWebglStage } from '@/hooks/use-webgl-stage';
import { pushState, subscribePush, type PushState } from '@/lib/push';
import type { Order } from '@/types/api.types';
import { toast } from 'sonner';

// Always the 3D here: watching the drink fill as the order moves is the point
// of this page. The scene adapts its quality to the device instead.
const BuilderCup = dynamic(() => import('@/components/features/builder/builder-cup'), {
  ssr: false,
});

const EASE = [0.22, 0.9, 0.24, 1] as const;

/**
 * Las fases, como las vive quien espera.
 *
 * El backend tiene seis estados porque la barra necesita distinguirlos. A
 * quien está andando hacia aquí solo le importan tres, y por eso PENDING y
 * CONFIRMED se cuentan como el mismo momento: el pedido llegó.
 *
 * `stage` es lo que dibuja el vaso: 0 vacío, 2 el café servido, 4 terminado
 * con su dibujo encima. La bebida se llena de verdad conforme avanza.
 */
const PHASES = [
  { key: 'in', label: 'Order in', hint: 'We have it', stage: 0 },
  { key: 'making', label: 'On the bar', hint: 'Being made now', stage: 2 },
  { key: 'ready', label: 'Ready', hint: 'Come and get it', stage: 4 },
] as const;

function phaseOf(status: Order['status']): number {
  if (status === 'PREPARING') return 1;
  if (status === 'READY' || status === 'COMPLETED') return 2;
  return 0;
}

/** Minutos que faltan, redondeados hacia arriba. Negativo si ya pasó. */
function minutesTo(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 60_000);
}

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
}

export default function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { accessToken, isAuthenticated } = useAuthStore();

  const {
    data: order,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.one(id, accessToken!),
    enabled: isAuthenticated && !!accessToken,
    // La barra avanza el pedido desde el CRM, así que esto tiene que
    // enterarse solo. Quince segundos basta para un café y no castiga la
    // batería de quien lo lleva abierto mientras camina.
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === 'READY' || s === 'COMPLETED' || s === 'CANCELLED' ? false : 15_000;
    },
    // Al volver a la pestaña se consulta en el acto: es justo cuando alguien
    // mira si ya está.
    refetchOnWindowFocus: true,
    // Sin `retry` propio: manda la regla global, que no reintenta los 4xx.
    // Un «ese pedido no es tuyo» sale en el acto en vez de dejar la ruedita.
  });

  // El reloj se mueve solo: «en 6 minutos» tiene que bajar sin recargar.
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  /**
   * Vuelta de una pasarela que sacó de la página.
   *
   * Casi todos los pagos se resuelven aquí mismo, pero 3-D Secure o un método
   * que redirige al banco devuelven a esta URL con `payment_intent` y
   * `redirect_status`. Se pregunta al backend, que concilia con Stripe sin
   * esperar al webhook, y se limpia la URL para que recargar no repita el aviso.
   */
  useEffect(() => {
    if (!accessToken) return;
    const q = new URLSearchParams(window.location.search);
    if (!q.get('payment_intent')) return;

    const resultado = q.get('redirect_status');
    window.history.replaceState(null, '', window.location.pathname);

    if (resultado === 'succeeded') toast.success('Payment received.');
    else if (resultado === 'failed')
      toast.error('The payment did not go through. You can pay at the counter.');

    paymentsApi
      .status(id, accessToken)
      .catch(() => undefined)
      .finally(() => refetch());
  }, [accessToken, id, refetch]);

  if (!isAuthenticated) {
    return (
      <Middle>
        <p className="text-[15px] text-stone2-600">Sign in to follow your order.</p>
        <Link href="/profile" className="btn btn-acid mt-2 px-6 py-2.5 text-[15px]">
          Sign in
        </Link>
      </Middle>
    );
  }

  // El error va antes que la carga. Si la petición falla, `order` sigue vacío
  // y sin esta rama la pantalla se quedaría girando para siempre sin decir
  // nada, justo cuando alguien quiere saber si su café está pedido.
  if (error && !order) {
    return (
      <Middle>
        <h1 className="text-2xl font-extrabold text-stone2-900">We could not load this order</h1>
        <p className="text-[15px] text-stone2-600">{error.message}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            className="btn btn-acid px-6 py-2.5 text-[15px]"
          >
            Try again
          </button>
          <Link href="/profile" className="btn px-6 py-2.5 text-[15px]">
            My orders
          </Link>
        </div>
      </Middle>
    );
  }

  if (isLoading || !order) {
    return (
      <Middle>
        <Loader2 size={26} className="animate-spin text-stone2-400" aria-hidden="true" />
        <p className="text-[14px] text-stone2-400">Loading your order…</p>
      </Middle>
    );
  }

  if (order.status === 'CANCELLED') {
    return (
      <Middle>
        <h1 className="text-3xl font-extrabold text-stone2-900">Order cancelled</h1>
        <p className="text-[15px] text-stone2-600">
          Nothing was charged. Talk to us if this is a surprise.
        </p>
        <Link href="/pickup" className="btn btn-acid mt-2 px-6 py-2.5 text-[15px]">
          Order again
        </Link>
      </Middle>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <Tracker order={order} live={isFetching} />
    </MotionConfig>
  );
}

function Tracker({ order, live }: { order: Order; live: boolean }) {
  const fase = phaseOf(order.status);
  const listo = fase === 2;

  const { ref: stage, mounted: visible, generation } = useWebglStage<HTMLDivElement>();

  // El vaso enseña la primera bebida configurada del pedido. Un croissant no
  // tiene fórmula que dibujar, y dos bebidas no caben en un vaso.
  const conFormula = order.items.find((i) => i.build);
  const scene = useMemo(() => sceneOf((conFormula?.build as Build) ?? DEFAULT_BUILD), [conFormula]);

  const faltan = minutesTo(order.pickup?.slotTime);

  const titular = listo
    ? 'Ready now.'
    : order.pickup?.slotTime
      ? `Ready at ${clock(order.pickup.slotTime)}.`
      : 'We are on it.';

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 md:py-14">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="text-[12px] uppercase tracking-[0.2em] text-stone2-400">
          {listo ? 'Waiting for you' : 'Your order'}
        </p>
        {/* Que se note que la pantalla está viva. Si no, parece congelada y
            la gente recarga, que es justo lo que no hace falta. */}
        {!listo && (
          <span className="flex items-center gap-1.5 text-[11.5px] text-stone2-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-600 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-forest-600" />
            </span>
            {live ? 'Checking…' : 'Live'}
          </span>
        )}
      </div>

      {/* El titular cambia de golpe de fase: «Ready at 9:47» a «Ready now».
          Se anima el cambio para que se note que ha pasado algo, y lo anuncia
          el lector de pantalla gracias a aria-live. */}
      <div aria-live="polite" className="mb-2 min-h-[2.75rem] md:min-h-[3.25rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.h1
            key={titular}
            initial={{ opacity: 0, y: 16, scale: listo ? 0.96 : 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={
              listo
                ? { type: 'spring', stiffness: 320, damping: 20 }
                : { duration: 0.3, ease: EASE }
            }
            className="text-4xl font-extrabold leading-none text-stone2-900 md:text-5xl"
          >
            {titular}
          </motion.h1>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={listo ? 'listo' : faltan !== null && faltan > 2 ? 'andando' : 'ya'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-6 text-[15px] text-stone2-600"
        >
          {listo ? (
            'On the counter with your name on it.'
          ) : faltan !== null && faltan > 2 ? (
            <>
              About {faltan} minutes. <strong>Leave in {Math.max(0, faltan - 3)}</strong> and it
              will be on the counter as you walk in.
            </>
          ) : (
            'Any moment now. Head over.'
          )}
        </motion.p>
      </AnimatePresence>

      {!listo && <NotifyMe />}

      <div ref={stage} className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.05 }}
          className={`glass glass-edge aspect-[4/3] w-full overflow-hidden transition-shadow duration-700 sm:aspect-[16/10] ${
            listo ? 'shadow-[0_0_0_4px_rgb(169_194_63)]' : ''
          }`}
        >
          {visible ? (
            <BuilderCup
              // Remontar en cada fase reproduce el llenado hasta el punto
              // nuevo, que es justo lo que se quiere ver al avanzar.
              key={`${generation}-${fase}`}
              scene={scene}
              stage={PHASES[fase].stage}
              animate
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-birch-200/50" />
          )}
        </motion.div>
      </div>

      {/* Las tres fases. El estado se lee por forma y texto, nunca solo por
          color. El resaltado se desliza de una a otra: se ve el avance en vez
          de un recuadro que salta. */}
      <ol className="mb-8 grid grid-cols-3 gap-2">
        {PHASES.map((p, i) => {
          const hecha = i < fase;
          const actual = i === fase;
          return (
            <li
              key={p.key}
              aria-current={actual ? 'step' : undefined}
              className={`relative overflow-hidden rounded border-2 border-stone2-900 px-3 py-2.5 transition-opacity duration-300 ${
                i > fase ? 'opacity-50' : ''
              } ${hecha ? 'bg-white/70' : 'bg-white/30'}`}
            >
              {actual && (
                <motion.span
                  layoutId="fase-actual"
                  className="absolute inset-0 bg-neon-500"
                  transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  aria-hidden="true"
                />
              )}
              <span className="relative flex items-center gap-1.5 text-[13.5px] font-bold text-stone2-900">
                <AnimatePresence initial={false}>
                  {hecha && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      <Check size={13} strokeWidth={3} />
                    </motion.span>
                  )}
                </AnimatePresence>
                {p.label}
              </span>
              <span className="relative block text-[11.5px] leading-tight text-stone2-600">
                {p.hint}
              </span>
            </li>
          );
        })}
      </ol>

      {order.pickup?.confirmationCode && (
        <div className="glass glass-edge mb-6 flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone2-400">
              If we cannot find you
            </p>
            <p className="font-mono text-2xl font-bold tracking-[0.16em] text-stone2-900">
              {order.pickup.confirmationCode}
            </p>
          </div>
          <p className="max-w-[45%] text-right text-[12.5px] leading-snug text-stone2-600">
            We will call your name first. This is the backup.
          </p>
        </div>
      )}

      <ul className="mb-8 flex flex-col gap-2">
        {order.items.map((i, n) => (
          <motion.li
            key={`${order.id}-${n}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASE, delay: 0.15 + n * 0.05 }}
            className="glass glass-edge flex items-center justify-between gap-3 p-3"
          >
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-bold text-stone2-900">
                {i.qty}× {i.name ?? i.productName}
              </span>
              {i.ticket && (
                <span className="block truncate text-[11px] uppercase tracking-[0.1em] text-forest-700">
                  {i.ticket}
                </span>
              )}
            </span>
            <span className="shrink-0 tabular-nums text-[14px] text-stone2-600">
              ${Number(i.subtotal).toFixed(2)}
            </span>
          </motion.li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2.5">
        {conFormula && <SaveUsual item={conFormula} />}
        <Link href="/menu" className="btn tap-target px-5 py-2.5 text-[14px]">
          Add something else
        </Link>
      </div>
    </div>
  );
}

/**
 * «Avísame cuando esté listo».
 *
 * Aquí y no nada más entrar: es el único momento en que la persona entiende
 * para qué sirve el permiso. Pedirlo en la portada es la forma más rápida de
 * que alguien lo deniegue para siempre.
 */
function NotifyMe() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [estado, setEstado] = useState<PushState>('unsupported');
  const [pidiendo, setPidiendo] = useState(false);

  useEffect(() => setEstado(pushState()), []);

  if (estado === 'unsupported') return null;

  if (estado === 'granted') {
    return (
      <p className="mb-6 flex items-center gap-2 text-[13.5px] font-semibold text-forest-700">
        <BellRing size={15} />
        We will ping you the moment it is ready.
      </p>
    );
  }

  if (estado === 'denied') {
    return (
      <p className="mb-6 text-[13px] text-stone2-400">
        Notifications are blocked in this browser. Keep this page open and it updates on its own.
      </p>
    );
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      disabled={pidiendo || !accessToken}
      onClick={async () => {
        setPidiendo(true);
        try {
          const r = await subscribePush(accessToken!);
          setEstado(r);
          if (r === 'granted') toast.success('Done. You can close this page.');
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Could not turn on notifications');
        } finally {
          setPidiendo(false);
        }
      }}
      className="btn tap-target mb-6 px-5 py-2.5 text-[14px] disabled:opacity-60"
    >
      {pidiendo ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
      Notify me when it is ready
    </motion.button>
  );
}

/**
 * Guardar la bebida, justo aquí.
 *
 * Es el momento con mejor intención de toda la app: acabas de pedir algo que
 * querías. Pedirlo en el perfil, tres días después, es pedirlo cuando ya no
 * te acuerdas de la fórmula.
 */
function SaveUsual({ item }: { item: Order['items'][number] }) {
  const save = useSaveFavorite();
  return (
    <AnimatePresence mode="wait" initial={false}>
      {save.isSuccess ? (
        <motion.span
          key="guardado"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1.5 text-[14px] font-semibold text-forest-700"
        >
          <Heart size={15} fill="currentColor" />
          Saved to your usuals
        </motion.span>
      ) : (
        <motion.button
          key="guardar"
          type="button"
          exit={{ opacity: 0, scale: 0.9 }}
          whileTap={{ scale: 0.97 }}
          disabled={save.isPending}
          onClick={() =>
            save.mutate(
              {
                name: item.name ?? item.productName,
                build: item.build,
                recipeId: item.recipeId ?? undefined,
                productId: item.productId,
              },
              { onError: (e) => toast.error(e.message) },
            )
          }
          className="btn btn-acid tap-target px-5 py-2.5 text-[14px] disabled:opacity-50"
        >
          {save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Heart size={15} />}
          Save as my usual
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function Middle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-3 px-5 text-center">
      {children}
    </div>
  );
}
