'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { recipesApi } from '@/lib/api';
import { SEASONALS, SIGNATURES, type Recipe } from '@/lib/recipes';
import type { ApiRecipe } from '@/types/api.types';

/** La receta del servidor con la forma que ya usa la escena 3D. */
function toRecipe(r: ApiRecipe & { sold?: number }): Recipe & { sold?: number } {
  return {
    // El slug, no el uuid: es lo que viaja en la línea de pedido y lo que
    // cuenta el ranking de más vendidas.
    id: r.slug,
    name: r.name,
    accent: r.accent ?? undefined,
    kind: r.kind === 'SEASONAL' ? 'seasonal' : 'signature',
    season: r.season ?? undefined,
    note: r.note,
    build: r.build,
    sold: r.sold,
  };
}

/**
 * El menú vivo.
 *
 * Lo que el dueño programa en el CRM —una bebida de otoño con sus fechas—
 * tiene que salir en la web sola, sin tocar código. Por eso esto manda
 * sobre la lista local.
 *
 * La lista local se queda como red: con la base recién montada, o con el
 * API caído, la página de inicio sigue enseñando bebidas en vez de un
 * hueco. No es contenido falso: son las mismas recetas con las que se
 * siembra la base.
 */
export function useLiveRecipes() {
  const { data, isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => recipesApi.current(),
    staleTime: 5 * 60_000,
  });

  // El useMemo no es optimización: sin él cada render devuelve recetas
  // nuevas, la escena 3D se recalcula con un objeto distinto y el canvas se
  // reinicia en bucle hasta perder el contexto de WebGL.
  const listas = useMemo(() => {
    const vivas = (data ?? []).map(toRecipe);
    const signatures = vivas.filter((r) => r.kind === 'signature');
    const seasonals = vivas.filter((r) => r.kind === 'seasonal');
    return {
      signatures: signatures.length > 0 ? signatures : SIGNATURES,
      seasonals: seasonals.length > 0 ? seasonals : SEASONALS,
    };
  }, [data]);

  return { isLoading, ...listas };
}

/**
 * Las más pedidas.
 *
 * Sin fallback a propósito: un ranking inventado es peor que no enseñarlo.
 * Si todavía no se ha vendido nada, la pestaña no aparece.
 */
export function useBestSellers(limit = 6) {
  // Sin valor por defecto en el destructuring: `= []` crea un array nuevo
  // en cada render y volveria a romper la identidad que arregla el useMemo.
  const { data, isLoading } = useQuery({
    queryKey: ['best-sellers', limit],
    queryFn: () => recipesApi.bestSellers(limit),
    staleTime: 10 * 60_000,
  });

  // Misma razón que arriba: identidad estable o la escena se reinicia sola.
  const bestSellers = useMemo(() => (data ?? []).map(toRecipe), [data]);

  return { bestSellers, isLoading };
}
