import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Las piezas que se repiten.
 *
 * Escritas sin useMemo ni useCallback a propósito: el compilador de React
 * decide dónde hacen falta leyendo el código, y ponerlos a mano solo añade
 * ruido que alguien tendrá que mantener sincronizado.
 */

/** Etiqueta pequeña que titula un bloque. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone2-400">
      {children}
    </span>
  );
}

type Tone = 'neutral' | 'olive' | 'ember' | 'ink';

const TONOS: Record<Tone, string> = {
  neutral: 'pill',
  olive: 'pill pill-olive',
  ember: 'pill pill-ember',
  ink: 'pill pill-ink',
};

export function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return <span className={TONOS[tone]}>{children}</span>;
}

export function Card({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return <div className={`card ${hover ? 'card-hover' : ''} p-5 ${className}`}>{children}</div>;
}

/**
 * Una cifra del día.
 *
 * El número manda y la etiqueta se aparta. Sin barra de acento ni icono:
 * cuatro tarjetas iguales en fila se leen de un vistazo, y cualquier
 * adorno repetido cuatro veces deja de decir nada.
 */
export function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'neutral' | 'ember';
}) {
  return (
    <div className="card p-5">
      <Eyebrow>{label}</Eyebrow>
      <p
        className={`tabular mt-2 text-[2rem] font-bold leading-none tracking-[-0.03em] ${
          tone === 'ember' ? 'text-bark-700' : 'text-stone2-900'
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[12.5px] text-stone2-400">{hint}</p>}
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-12 text-stone2-400">
      <Loader2 size={15} className="animate-spin" />
      <span className="text-[13px]">{label}</span>
    </div>
  );
}

/**
 * Cuando algo falla.
 *
 * Dice qué pasó y deja reintentar. Un mensaje que solo dice «error» hace
 * que el personal recargue la página entera y pierda lo que hacía.
 */
export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const mensaje = error instanceof Error ? error.message : 'Something went wrong';
  return (
    <div className="card mb-4 flex flex-col gap-3 border-bark-300 bg-bark-100/70 p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={17} className="mt-0.5 shrink-0 text-bark-700" />
        <p className="text-[14px] text-stone2-900">{mensaje}</p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn self-start">
          Retry
        </button>
      )}
    </div>
  );
}

/** Vacío con sentido: dice por qué está vacío, no solo que lo está. */
export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card flex flex-col items-center gap-1.5 px-6 py-14 text-center">
      <p className="text-[16px] font-semibold text-stone2-900">{title}</p>
      {hint && (
        <p className="max-w-[340px] text-[13.5px] leading-relaxed text-stone2-400">{hint}</p>
      )}
    </div>
  );
}

/** Cabecera de pantalla. Sin regla gruesa: la separa el espacio. */
export function PageHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="text-[2.1rem] font-bold leading-none tracking-[-0.035em] text-stone2-900 md:text-[2.5rem]">
          {title}
        </h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

/** Campo de formulario, con su etiqueta siempre visible. */
export function Field({
  name,
  label,
  hint,
  ...rest
}: { name: string; label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[12.5px] font-semibold text-stone2-600">
        {label}
      </label>
      <input id={name} name={name} {...rest} className="field tap-target" />
      {hint && <span className="text-[11.5px] text-stone2-400">{hint}</span>}
    </div>
  );
}

/**
 * Un panel que entra por la derecha.
 *
 * Para el detalle de un pedido o un cliente: se abre encima sin perder la
 * lista de atrás, así que cerrar devuelve exactamente donde se estaba.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* El fondo difuminado dice que lo de atrás sigue ahí pero está en
          pausa, que es justo lo que hace un panel modal. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-stone2-900/20 backdrop-blur-[3px]"
      />
      <aside
        role="dialog"
        aria-label={title}
        className="glass-strong relative flex h-full w-full max-w-[520px] animate-rise flex-col overflow-y-auto rounded-l-2xl"
      >
        <header className="glass-strong sticky top-0 z-10 flex items-center justify-between gap-3 rounded-tl-2xl px-5 py-4">
          <h2 className="text-[18px] font-bold tracking-[-0.02em] text-stone2-900">{title}</h2>
          <button type="button" onClick={onClose} className="btn btn-quiet tap-target px-3">
            Close
          </button>
        </header>
        <div className="flex flex-col gap-4 px-5 pb-8">{children}</div>
      </aside>
    </div>
  );
}

/** Fila de dato: etiqueta a la izquierda, valor a la derecha. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-stone2-200 py-2 last:border-0">
      <span className="shrink-0 text-[13px] text-stone2-400">{label}</span>
      <span className="min-w-0 break-words text-right text-[13.5px] font-medium text-stone2-900">
        {children}
      </span>
    </div>
  );
}
