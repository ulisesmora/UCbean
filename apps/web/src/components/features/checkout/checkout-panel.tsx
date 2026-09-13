'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { CreditCard, Loader2, Lock, Store, Tag, X } from 'lucide-react';
import { discountsApi, paymentsApi } from '@/lib/api';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useCheckout } from '@/hooks/use-cart';
import { CardPayment, cardPaymentAvailable } from './card-payment';
import { toast } from 'sonner';

type Method = 'counter' | 'card';

/**
 * Por dónde va la compra.
 *
 * `form` elegir y confirmar · `placed` el momento de «hecho», breve ·
 * `card` pagar con tarjeta · `paid` cobrado, camino del seguimiento.
 */
type Phase = 'form' | 'placed' | 'card' | 'paid';

interface Applied {
  code: string;
  amount: number;
}

/** La curva de todo el flujo. Sale rápido y frena suave, como un gesto de iOS. */
const EASE = [0.22, 0.9, 0.24, 1] as const;

/** Cada fase entra desde un poco más abajo y sale hacia arriba: se lee como avanzar. */
const FASE = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.16, ease: EASE } },
};

/** La hora de recogida como la lee una persona. */
function readTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Una llave aleatoria. `randomUUID` no existe fuera de HTTPS salvo en localhost. */
function nuevaLlave(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Cerrar el pedido.
 *
 * Tres cosas en orden: el cupón si lo hay, cómo se paga, y confirmar. Las
 * dos formas de pago terminan en un pedido real; lo único que cambia es
 * quién cobra y cuándo.
 *
 * Las transiciones no son decoración. Pagar es el momento con más ansiedad
 * de toda la app —«¿se ha cobrado?, ¿lo he pedido dos veces?»— y cada paso
 * tiene que decir en qué punto está: pidiendo, pedido, cobrando, cobrado.
 * Un cambio de pantalla seco en ese momento hace que la gente pulse otra vez.
 */
export function CheckoutPanel({
  date,
  slot,
  asap = false,
}: {
  date: string;
  slot: string | null;
  /** «Ahora mismo»: el servidor elige el primer hueco libre. */
  asap?: boolean;
}) {
  const { items, totalPrice } = useCartStore();
  const { accessToken } = useAuthStore();
  const checkout = useCheckout();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('form');
  const [method, setMethod] = useState<Method>(cardPaymentAvailable ? 'card' : 'counter');
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<Applied | null>(null);
  const [checking, setChecking] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  /** La hora que el servidor asignó, que con «ahora mismo» no se sabía antes. */
  const [readyAt, setReadyAt] = useState<string | null>(null);
  /**
   * Lo que de verdad se va a cobrar, según el servidor.
   *
   * El carrito se vacía en cuanto el pedido existe, así que la pantalla de la
   * tarjeta no puede calcular su importe del carrito: enseñaría «Pay $0.00».
   */
  const [aCobrar, setACobrar] = useState<number | null>(null);

  const subtotal = totalPrice();
  const total = Math.max(0, subtotal - (applied?.amount ?? 0));
  const vacio = items.length === 0;
  const tieneHora = asap || Boolean(slot);

  /**
   * La llave de este intento de pedir.
   *
   * Cambia cuando cambia lo que se pide, y solo entonces. Así un doble toque
   * o un reintento por red lenta mandan la misma llave y el servidor devuelve
   * el mismo pedido; pero si alguien añade un café después de un fallo, es
   * un pedido distinto y lleva llave nueva.
   */
  const firma = JSON.stringify([
    items.map((i) => [i.lineId, i.qty]),
    asap ? 'asap' : `${date} ${slot}`,
    applied?.code ?? null,
  ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- la llave depende de la firma a propósito
  const llave = useMemo(() => nuevaLlave(), [firma]);

  async function aplicarCupon() {
    if (!code.trim() || !accessToken) return;
    setChecking(true);
    try {
      const res = await discountsApi.preview(code.trim(), subtotal, accessToken);
      setApplied({ code: res.code, amount: res.amount });
      toast.success(`Code ${res.code} applied`);
    } catch (e) {
      // El backend dice por qué no vale: caducado, de otra cuenta, por
      // debajo del mínimo. Repetirlo tal cual evita que alguien lo intente
      // tres veces sin saber qué pasa.
      toast.error(e instanceof Error ? e.message : 'That code did not work');
    } finally {
      setChecking(false);
    }
  }

  /**
   * Crea el pedido y, si se paga con tarjeta, abre el cobro.
   *
   * El pedido se crea siempre primero: es lo que la cocina necesita, y un
   * cobro sin pedido detrás no le sirve a nadie. Si la tarjeta falla, el
   * pedido sigue ahí para pagarlo en el mostrador.
   */
  function confirmar() {
    // Un segundo toque mientras se crea no hace nada. La llave también lo
    // frenaría en el servidor, pero no hace falta ni llegar hasta allí.
    if (checkout.isPending || phase !== 'form') return;
    if (!tieneHora) {
      toast.error('Pick a pickup time first');
      return;
    }

    checkout.mutate(
      {
        type: 'PICKUP',
        // Con «ahora mismo» no se manda hora: la elige el servidor, que es
        // quien sabe qué huecos quedan en este segundo.
        date: asap ? undefined : date,
        slot: asap ? undefined : slot!,
        asap: asap || undefined,
        discountCode: applied?.code,
        idempotencyKey: llave,
      },
      {
        onSuccess: async (order) => {
          setOrderId(order.id);
          setReadyAt(readTime(order.pickup?.slotTime) ?? slot);
          setACobrar(Number(order.total));

          if (order.replayed) {
            toast.message('That order was already placed. Showing it instead of making another.');
          }

          // El momento de «hecho». Breve, pero existe: es la confirmación de
          // que el toque sirvió, antes de cambiar de pantalla.
          setPhase('placed');

          if (method === 'counter') {
            await esperar(900);
            router.push(`/order/${order.id}`);
            return;
          }

          try {
            const [intent] = await Promise.all([
              paymentsApi.intent(order.id, accessToken!),
              esperar(700),
            ]);
            if (!intent.clientSecret) {
              toast.message('That order already had a charge open. Pay at the counter.');
              router.push(`/order/${order.id}`);
              return;
            }
            setClientSecret(intent.clientSecret);
            setPhase('card');
          } catch (e) {
            toast.error(
              e instanceof Error
                ? `${e.message} Your order is placed; pay at the counter.`
                : 'Could not open the card charge. Pay at the counter.',
            );
            router.push(`/order/${order.id}`);
          }
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        layout
        transition={{ layout: { duration: 0.3, ease: EASE } }}
        className="glass glass-edge overflow-hidden"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {phase === 'placed' && (
            <motion.div
              key="placed"
              {...FASE}
              className="flex flex-col items-center gap-3 p-8 text-center"
            >
              <CheckDraw />
              <h2 className="text-2xl font-extrabold text-stone2-900">Order placed</h2>
              <p className="text-[14.5px] text-stone2-600">
                {readyAt ? `Ready at ${readyAt}. ` : ''}
                {method === 'card' ? 'Opening secure payment…' : 'Taking you to your order…'}
              </p>
              <Loader2 size={16} className="animate-spin text-stone2-400" aria-hidden="true" />
            </motion.div>
          )}

          {phase === 'paid' && (
            <motion.div
              key="paid"
              {...FASE}
              className="flex flex-col items-center gap-3 p-8 text-center"
            >
              <CheckDraw />
              <h2 className="text-2xl font-extrabold text-stone2-900">Paid</h2>
              <p className="text-[14.5px] text-stone2-600">
                ${(aCobrar ?? total).toFixed(2)} charged. Nothing to pay at the counter.
              </p>
            </motion.div>
          )}

          {phase === 'card' && clientSecret && orderId && (
            <motion.div key="card" {...FASE} className="flex flex-col gap-4 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[17px] font-bold text-stone2-900">
                  Pay ${(aCobrar ?? total).toFixed(2)}
                </h2>
                <span className="text-right text-[12.5px] text-stone2-400">
                  Order placed{readyAt ? ` · ready at ${readyAt}` : ''}
                </span>
              </div>

              <CardPayment
                clientSecret={clientSecret}
                orderId={orderId}
                onPaid={async () => {
                  setPhase('paid');
                  // Stripe ya cobró; esta llamada hace que el backend lo
                  // compruebe con Stripe y confirme el pedido sin esperar
                  // al webhook. En paralelo con la pausa del «cobrado».
                  await Promise.all([
                    paymentsApi.status(orderId, accessToken!).catch(() => undefined),
                    esperar(1100),
                  ]);
                  router.push(`/order/${orderId}`);
                }}
                onError={(m) => toast.error(m)}
              />

              {/* Salida siempre visible: el pedido ya existe, así que nadie se
                  queda atrapado en una pantalla de pago que no le funciona. */}
              <button
                type="button"
                onClick={() => router.push(`/order/${orderId}`)}
                className="self-center text-[13px] text-stone2-400 underline underline-offset-4"
              >
                I&apos;ll pay at the counter instead
              </button>
            </motion.div>
          )}

          {phase === 'form' && (
            <motion.div key="form" {...FASE} className="flex flex-col gap-5 p-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between text-[14px]">
                  <span className="text-stone2-600">
                    {vacio ? 'Nothing in the bag' : `${items.reduce((s, i) => s + i.qty, 0)} items`}
                  </span>
                  <span className="tabular-nums text-stone2-900">${subtotal.toFixed(2)}</span>
                </div>

                <AnimatePresence initial={false}>
                  {applied && (
                    <motion.div
                      key="cupon"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: EASE }}
                      className="flex items-baseline justify-between overflow-hidden text-[14px] text-forest-700"
                    >
                      <span className="flex items-center gap-1.5">
                        <Tag size={13} />
                        {applied.code}
                        <button
                          type="button"
                          onClick={() => setApplied(null)}
                          aria-label="Remove code"
                          className="text-stone2-400 hover:text-bark-700"
                        >
                          <X size={13} />
                        </button>
                      </span>
                      <span className="tabular-nums">−${applied.amount.toFixed(2)}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-baseline justify-between border-t-2 border-stone2-900 pt-2">
                  <span className="text-[15px] font-bold text-stone2-900">Total</span>
                  {/* El total se reanima al cambiar: con cupón o sin él, se ve
                      que la cifra se movió en vez de cambiar a escondidas. */}
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={total.toFixed(2)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: EASE }}
                      className="text-xl font-extrabold tabular-nums text-stone2-900"
                    >
                      ${total.toFixed(2)}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              {!applied && !vacio && (
                <div className="flex gap-2">
                  <input
                    aria-label="Discount code"
                    placeholder="Discount code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="tap-target min-w-0 flex-1 rounded border-2 border-stone2-900 bg-white/70 px-3 py-2 font-mono text-[14px] uppercase outline-none focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={aplicarCupon}
                    disabled={checking || !code.trim()}
                    className="btn tap-target px-4 py-2 text-[14px] disabled:opacity-40"
                  >
                    {checking ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                  </button>
                </div>
              )}

              {/* Cómo se paga. Dos opciones del mismo peso: pagar en barra es como
                  funciona una cafetería de campus, no un modo de emergencia. */}
              <fieldset className="flex flex-col gap-2" disabled={checkout.isPending}>
                <legend className="mb-1 text-[13px] font-semibold text-stone2-900">
                  How you pay
                </legend>
                {cardPaymentAvailable && (
                  <Option
                    checked={method === 'card'}
                    onSelect={() => setMethod('card')}
                    icon={<CreditCard size={16} />}
                    title="Card now"
                    hint="Pay here and just pick it up"
                  />
                )}
                <Option
                  checked={method === 'counter'}
                  onSelect={() => setMethod('counter')}
                  icon={<Store size={16} />}
                  title="At the counter"
                  hint="Card or cash when you collect"
                />
              </fieldset>

              <motion.button
                type="button"
                onClick={confirmar}
                disabled={checkout.isPending || vacio || !tieneHora}
                whileTap={{ scale: 0.98 }}
                aria-busy={checkout.isPending}
                className="btn btn-acid tap-target relative w-full overflow-hidden py-3 text-[15px] disabled:opacity-60"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={checkout.isPending ? 'placing' : method + String(tieneHora)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center gap-2"
                  >
                    {checkout.isPending ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Placing order…
                      </>
                    ) : !tieneHora ? (
                      'Pick a time first'
                    ) : method === 'card' ? (
                      <>
                        <Lock size={14} />
                        Place order and pay
                      </>
                    ) : (
                      'Place order'
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  );
}

/**
 * La marca de «hecho», dibujándose.
 *
 * Un trazo que se completa se lee como una acción terminada; un icono que
 * aparece de golpe se lee como un cartel. Es la diferencia entre «se ha
 * pedido» y «esto dice pedido».
 */
function CheckDraw() {
  return (
    <motion.svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      aria-hidden="true"
    >
      <circle
        cx="28"
        cy="28"
        r="26"
        className="fill-neon-500 stroke-stone2-900"
        strokeWidth="2.5"
      />
      <motion.path
        d="M17 29 L25 37 L40 20"
        fill="none"
        className="stroke-stone2-900"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.38, delay: 0.12, ease: EASE }}
      />
    </motion.svg>
  );
}

function Option({
  checked,
  onSelect,
  icon,
  title,
  hint,
}: {
  checked: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <label
      className={`tap-target relative flex cursor-pointer items-center gap-3 overflow-hidden rounded border-2 border-stone2-900 bg-white/60 px-3 py-2.5 transition-colors hover:bg-white ${
        checked ? 'hover:bg-transparent' : ''
      }`}
    >
      {/* El fondo elegido se desliza de una opción a otra en vez de parpadear. */}
      {checked && (
        <motion.span
          layoutId="metodo-de-pago"
          className="absolute inset-0 bg-neon-500"
          transition={{ duration: 0.25, ease: EASE }}
          aria-hidden="true"
        />
      )}
      <input
        type="radio"
        name="pay-method"
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="relative">{icon}</span>
      <span className="relative flex min-w-0 flex-col">
        <span className="text-[14.5px] font-semibold text-stone2-900">{title}</span>
        <span className="text-[12px] text-stone2-600">{hint}</span>
      </span>
    </label>
  );
}
