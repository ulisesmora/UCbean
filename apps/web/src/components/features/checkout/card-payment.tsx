'use client';

import { useEffect, useState } from 'react';
import { loadStripe, type Appearance, type Stripe } from '@stripe/stripe-js';
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';

const PUBLISHABLE = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
const MODO_PRUEBA = PUBLISHABLE?.startsWith('pk_test_') ?? false;

/**
 * Stripe.js, cargado una sola vez.
 *
 * `loadStripe` inyecta un script en la página, así que llamarlo dentro de un
 * componente lo haría en cada render. Fuera del componente se hace una vez
 * para toda la vida de la pestaña.
 */
const stripePromise: Promise<Stripe | null> | null = PUBLISHABLE ? loadStripe(PUBLISHABLE) : null;

/** Si se puede cobrar con tarjeta en este navegador. */
export const cardPaymentAvailable = Boolean(PUBLISHABLE);

const INK = '#0A0A0A';
const OLIVA = '#A9C23F';
const ROJO = '#B42318';

/**
 * El aspecto de los campos de Stripe.
 *
 * Los campos viven en un iframe de Stripe, así que las clases de la web no
 * les llegan: el estilo se le pasa a Stripe con su propio lenguaje. Antes
 * usaba el tema `flat`, que dibuja los campos sin borde, y sobre el vidrio
 * del checkout desaparecían.
 *
 * Aquí se copia el lenguaje de los botones de la web: borde de 2px en tinta y
 * sombra dura desplazada. El foco cambia la sombra a oliva en vez de añadir
 * un halo azul que no es de la marca.
 */
const APARIENCIA: Appearance = {
  theme: 'stripe',
  labels: 'above',
  variables: {
    colorPrimary: '#55681A',
    colorBackground: '#FFFFFF',
    colorText: INK,
    colorTextSecondary: '#55564C',
    colorTextPlaceholder: '#85877A',
    colorDanger: ROJO,
    colorIcon: INK,
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    fontSizeBase: '15px',
    fontWeightNormal: '500',
    borderRadius: '5px',
    spacingUnit: '4px',
    gridRowSpacing: '14px',
    focusBoxShadow: 'none',
    focusOutline: 'none',
  },
  rules: {
    '.Label': {
      fontWeight: '700',
      fontSize: '13px',
      color: INK,
      marginBottom: '6px',
    },
    '.Input': {
      border: `2px solid ${INK}`,
      boxShadow: `3px 3px 0 0 ${INK}`,
      padding: '12px 12px',
      backgroundColor: '#FFFFFF',
    },
    '.Input:hover': {
      backgroundColor: '#FBFAF5',
    },
    '.Input:focus': {
      border: `2px solid ${INK}`,
      boxShadow: `3px 3px 0 0 ${OLIVA}`,
    },
    '.Input--invalid': {
      border: `2px solid ${ROJO}`,
      boxShadow: `3px 3px 0 0 ${ROJO}`,
      color: INK,
    },
    '.Error': {
      color: ROJO,
      fontWeight: '600',
      fontSize: '13px',
    },
    '.Tab': {
      border: `2px solid ${INK}`,
      boxShadow: `3px 3px 0 0 ${INK}`,
      backgroundColor: '#FFFFFF',
      color: INK,
    },
    '.Tab:hover': {
      backgroundColor: '#F2F0E6',
      color: INK,
    },
    '.Tab:focus': {
      boxShadow: `3px 3px 0 0 ${OLIVA}`,
    },
    '.Tab--selected': {
      border: `2px solid ${INK}`,
      backgroundColor: OLIVA,
      boxShadow: `3px 3px 0 0 ${INK}`,
      color: INK,
    },
    '.Tab--selected:hover': {
      backgroundColor: OLIVA,
      color: INK,
    },
    '.Tab--selected:focus': {
      boxShadow: `3px 3px 0 0 ${INK}`,
    },
    '.TabIcon--selected': { fill: INK, color: INK },
    '.TabLabel': { fontWeight: '700' },
    '.Block': {
      border: `2px solid ${INK}`,
      boxShadow: `3px 3px 0 0 ${INK}`,
    },
    '.CheckboxInput': {
      border: `2px solid ${INK}`,
    },
    '.CheckboxInput--checked': {
      backgroundColor: OLIVA,
      border: `2px solid ${INK}`,
    },
  },
};

/**
 * El formulario de pago.
 *
 * Arriba, las carteras (Apple Pay, Google Pay, Link) como botones grandes: son
 * un toque y no hay nada que escribir, así que van primero. Debajo, la
 * tarjeta de siempre.
 *
 * Qué carteras salen no lo decide este código: Stripe enseña las que estén
 * activas en el Dashboard y que el aparato pueda usar. Apple Pay solo aparece
 * en Safari y con el dominio registrado en Stripe; Google Pay, en Chrome con
 * una tarjeta guardada y activado en el Dashboard.
 *
 * Los datos de la tarjeta nunca tocan nuestro servidor: los campos son iframes
 * de Stripe y `confirmPayment` habla con ellos directamente. Quien confirma el
 * pedido no es esta pantalla sino el webhook que Stripe manda al backend.
 */
function PaymentForm({
  orderId,
  onPaid,
  onError,
}: {
  orderId: string;
  onPaid: () => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [pagando, setPagando] = useState(false);
  const [listo, setListo] = useState(false);
  const [carteras, setCarteras] = useState(false);

  /**
   * Cobra con lo que haya en el formulario, venga de una cartera o de la tarjeta.
   *
   * Solo se sale de la página si el banco exige una pantalla suya (3-D
   * Secure) o si el método es de los que redirigen. En ese caso Stripe
   * vuelve al seguimiento del pedido, que concilia el cobro al cargar.
   */
  async function cobrar() {
    if (!stripe || !elements || pagando) return;
    setPagando(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: { return_url: `${window.location.origin}/order/${orderId}` },
      });

      if (error) {
        onError(error.message ?? 'Your card could not be charged.');
        return;
      }
      // `processing` es un banco que tarda: el webhook lo confirmará.
      if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
        onPaid();
      } else {
        onError('Your bank did not complete the payment. Try another card.');
      }
    } finally {
      setPagando(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        cobrar();
      }}
      className="flex flex-col gap-4"
    >
      <ExpressCheckoutElement
        options={{
          buttonHeight: 48,
          buttonType: { applePay: 'buy', googlePay: 'buy' },
          layout: { maxColumns: 2, maxRows: 1, overflow: 'auto' },
        }}
        onReady={({ availablePaymentMethods }) =>
          setCarteras(
            Boolean(
              availablePaymentMethods && Object.values(availablePaymentMethods).some(Boolean),
            ),
          )
        }
        onConfirm={() => cobrar()}
      />

      {carteras && (
        <div className="relative py-1 text-center" aria-hidden="true">
          <span className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-stone2-900/25" />
          <span className="relative bg-white px-3 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-stone2-400">
            or pay with card
          </span>
        </div>
      )}

      {!listo && (
        <div className="flex items-center justify-center gap-2 py-6 text-[13px] text-stone2-400">
          <Loader2 size={16} className="animate-spin" />
          Loading secure form…
        </div>
      )}

      <PaymentElement
        onReady={() => setListo(true)}
        options={{
          layout: { type: 'tabs' },
          // Las carteras ya van arriba como botones: aquí saldrían repetidas.
          wallets: { applePay: 'never', googlePay: 'never' },
          // Canadá por defecto: la cafetería está en Vancouver. Sin esto Stripe
          // lo deduce del idioma del navegador, y a quien lo tiene en español
          // le proponía México.
          defaultValues: { billingDetails: { address: { country: 'CA' } } },
        }}
      />

      <button
        type="submit"
        disabled={!stripe || !listo || pagando}
        aria-busy={pagando}
        className="btn btn-acid tap-target mt-1 w-full py-3 text-[15px] disabled:opacity-60"
      >
        {pagando ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Charging…
          </>
        ) : (
          <>
            <Lock size={14} />
            Pay now
          </>
        )}
      </button>
    </form>
  );
}

/**
 * La pasarela, con cara de pasarela.
 *
 * Un marco blanco y opaco con borde y sombra dura, distinto del vidrio del
 * resto del checkout. Es a propósito: el momento de meter una tarjeta tiene
 * que verse como un sitio aparte y seguro, no como un campo más del
 * formulario. Y el blanco sólido es lo que hace que los campos se lean.
 */
export function CardPayment({
  clientSecret,
  orderId,
  onPaid,
  onError,
}: {
  clientSecret: string;
  orderId: string;
  onPaid: () => void;
  onError: (message: string) => void;
}) {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  if (!stripePromise) {
    return (
      <p className="rounded border-2 border-bark-500 bg-bark-300 px-3 py-2 text-[13px]">
        Card payments are not set up yet. Choose paying at the counter.
      </p>
    );
  }

  return (
    <section
      aria-label="Secure payment"
      className="overflow-hidden rounded-[6px] border-2 border-stone2-900 bg-white shadow-[5px_5px_0_0_#0A0A0A]"
    >
      <header className="flex items-center justify-between gap-3 border-b-2 border-stone2-900 bg-birch-50 px-4 py-2.5">
        <span className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.16em] text-stone2-900">
          <Lock size={13} strokeWidth={2.5} />
          Secure payment
        </span>
        <span className="text-[11.5px] font-medium text-stone2-600">Powered by Stripe</span>
      </header>

      <div className="flex flex-col gap-3 p-4">
        {MODO_PRUEBA && (
          // En modo prueba nadie tiene por qué saberse la tarjeta de Stripe.
          <p className="rounded border-2 border-dashed border-stone2-900/30 bg-neon-500/15 px-3 py-2 font-mono text-[11.5px] leading-relaxed text-stone2-900">
            Test mode · card 4242 4242 4242 4242 · any future date · any CVC
          </p>
        )}

        {montado ? (
          <Elements
            key={clientSecret}
            stripe={stripePromise}
            options={{
              clientSecret,
              // El sitio está en inglés. Sin fijarlo, Stripe usa el idioma del
              // navegador y un campo en español aparecía en mitad de una
              // página en inglés.
              locale: 'en',
              appearance: APARIENCIA,
              fonts: [
                {
                  cssSrc:
                    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap',
                },
              ],
            }}
          >
            <PaymentForm orderId={orderId} onPaid={onPaid} onError={onError} />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-stone2-400" />
          </div>
        )}

        <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-stone2-400">
          <ShieldCheck size={13} />
          Card details go straight to Stripe. They never touch our server.
        </p>
      </div>
    </section>
  );
}
