'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { CoffeeBuilder } from '@/components/features/builder/coffee-builder';
import { useLiveRecipes } from '@/hooks/use-recipes';
import { decodeBuild } from '@/lib/share';

/**
 * El configurador, con su propia dirección.
 *
 * Antes vivía en mitad de la portada, que lo ponía delante de todo el mundo
 * cada vez: precioso la primera vez, un obstáculo la décima. Aquí lo eligen
 * quienes quieren construir, y además se puede llegar desde una bebida de la
 * carta con `?recipe=slug` para retocarla en vez de empezar de cero.
 */
function Build() {
  const params = useSearchParams();
  const slug = params.get('recipe');
  const { signatures, seasonals } = useLiveRecipes();

  const deCarta = slug ? [...signatures, ...seasonals].find((r) => r.id === slug) : undefined;

  // Una bebida que alguien te pasó por mensaje. La fórmula viene dentro del
  // enlace, así que se abre sin sesión y sin haber pisado el local.
  const compartida = params.get('d');
  const buildCompartida = compartida ? decodeBuild(compartida) : null;
  const nombreCompartido = params.get('n');

  const partida = buildCompartida
    ? { id: 'shared', name: nombreCompartido ?? 'this drink', build: buildCompartida }
    : deCarta;

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <Link
          href={deCarta ? '/menu' : '/'}
          className="inline-flex items-center gap-1.5 text-[13.5px] text-stone2-600 underline-offset-4 hover:underline"
        >
          <ArrowLeft size={15} />
          {deCarta ? 'Back to the menu' : 'Back home'}
        </Link>

        {buildCompartida && (
          <p className="glass glass-edge mt-4 p-4 text-[14.5px] text-stone2-900">
            Someone sent you <strong>{nombreCompartido ?? 'this drink'}</strong>. It is loaded below
            &mdash; change anything you like before ordering it.
          </p>
        )}
      </div>

      <CoffeeBuilder
        // La clave fuerza un montaje limpio cuando cambias de bebida de
        // partida, para que los pasos no arrastren el estado de la anterior.
        key={partida?.id ?? 'scratch'}
        initialBuild={partida?.build}
        eyebrow={buildCompartida ? 'Sent to you' : partida ? 'Make it yours' : 'Build your own'}
        heading={
          partida ? (
            <>
              Your <span className="marker font-seal italic">{partida.name}.</span>
            </>
          ) : undefined
        }
      />
    </>
  );
}

export default function BuildPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={26} className="animate-spin text-stone2-400" />
        </div>
      }
    >
      <Build />
    </Suspense>
  );
}
