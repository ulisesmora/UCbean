'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { cafeApi } from '@/lib/api';

/** Lo que se dice de cada nivel, y el color que lo acompaña. */
const PULSE = {
  quiet: { text: 'No queue right now', dot: 'bg-forest-600' },
  steady: { text: 'A few orders ahead', dot: 'bg-neon-500' },
  busy: { text: 'Busy right now', dot: 'bg-bark-500' },
} as const;

/**
 * El pulso del local, en una línea.
 *
 * Contesta la pregunta de quien está a diez minutos andando: ¿voy ahora o
 * espero? Sale de la cola real de pedidos, así que nadie tiene que
 * mantenerlo a mano y por eso no envejece.
 *
 * No dice cuántas mesas quedan libres a propósito. Ese número solo sería
 * cierto si alguien lo tecleara cada vez que una mesa se ocupa o se deja,
 * y en hora punta nadie tiene manos. Un dato viejo manda a alguien a
 * cruzar el campus hacia una mesa que no existe.
 */
export function CafePulse() {
  const { data } = useQuery({
    queryKey: ['cafe-pulse'],
    queryFn: () => cafeApi.pulse(),
    // La cola se mueve en minutos, no en segundos.
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (!data) return null;

  const estado = PULSE[data.pulse];

  return (
    <div className="border-b-2 border-stone2-900 bg-birch-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-2.5 text-[13px] md:px-6">
        <span className="flex items-center gap-2 font-semibold text-stone2-900">
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${data.open ? estado.dot : 'bg-stone2-400'}`}
          />
          {data.open ? 'Open now' : `Closed · opens at ${data.opensAt}:00`}
        </span>

        {data.open && (
          <>
            <span className="text-stone2-600">{estado.text}</span>
            {data.waitMinutes !== null && (
              <span className="tabular-nums text-stone2-600">
                about {data.waitMinutes} min if you order now
              </span>
            )}
            <Link
              href="/pickup"
              className="ml-auto shrink-0 font-semibold text-forest-700 underline-offset-4 hover:underline"
            >
              Order ahead
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
