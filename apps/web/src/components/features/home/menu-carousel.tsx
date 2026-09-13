'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProducts } from '@/hooks/use-products';
import { ProductCard } from '@/components/features/menu/product-card';
import { Skeleton } from '@/components/ui/skeleton';

/** Cuántos productos caben en la portada antes de mandar a /menu. */
const MAXIMO = 12;

/**
 * La carta en la portada, en carrusel.
 *
 * Usa la misma tarjeta que /menu, con su foto real, su precio del catálogo y el
 * mismo «¿algo más?» al añadir. Antes la portada pintaba cuatro bebidas escritas
 * a mano con precios que no eran los de la carta.
 *
 * Es un carrusel nativo: una fila con scroll-snap. Se desliza con el dedo en el
 * móvil sin JavaScript, las flechas solo mueven el scroll, y el teclado y los
 * lectores de pantalla lo recorren como una lista normal. Sin librería de
 * carrusel, que es una dependencia más para algo que CSS ya hace bien.
 */
export function MenuCarousel() {
  const { data: productos = [], isLoading, error } = useProducts();
  const pista = useRef<HTMLDivElement>(null);
  const [bordes, setBordes] = useState({ inicio: true, fin: false });

  const visibles = productos.filter((p) => p.isAvailable).slice(0, MAXIMO);

  const medir = useCallback(() => {
    const el = pista.current;
    if (!el) return;
    setBordes({
      inicio: el.scrollLeft < 8,
      fin: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [medir, visibles.length]);

  function mover(direccion: 1 | -1) {
    const el = pista.current;
    if (!el) return;
    const tarjeta = el.querySelector<HTMLElement>('[data-slide]');
    const paso = tarjeta ? tarjeta.offsetWidth + 20 : el.clientWidth * 0.8;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direccion * paso, behavior: reducido ? 'auto' : 'smooth' });
  }

  if (error) {
    return (
      <p className="text-[15px] text-stone2-600">
        The menu is taking a moment.{' '}
        <Link href="/menu" className="font-semibold underline underline-offset-4">
          Open the full menu
        </Link>
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => mover(-1)}
          disabled={bordes.inicio}
          aria-label="Previous items"
          className="btn tap-target h-11 w-11 p-0 disabled:opacity-35"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => mover(1)}
          disabled={bordes.fin}
          aria-label="Next items"
          className="btn tap-target h-11 w-11 p-0 disabled:opacity-35"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={pista}
        onScroll={medir}
        role="region"
        aria-roledescription="carousel"
        aria-label="From the menu"
        tabIndex={0}
        // Margen negativo para que la fila llegue al borde de la pantalla en
        // móvil: que asome la siguiente tarjeta es lo que dice «desliza».
        className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-6 px-6 pb-6 pt-1 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone2-900 [&::-webkit-scrollbar]:hidden"
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[78%] shrink-0 sm:w-[46%] lg:w-[calc((100%-3*1.25rem)/4)]">
                <Skeleton className="aspect-[3/4] w-full" />
              </div>
            ))
          : visibles.map((p) => (
              <div
                key={p.id}
                data-slide
                className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-3*1.25rem)/4)]"
              >
                <ProductCard
                  product={p}
                  sizes="(max-width: 640px) 80vw, (max-width: 1024px) 46vw, 24vw"
                />
              </div>
            ))}

        {!isLoading && productos.length > MAXIMO && (
          <Link
            href="/menu"
            data-slide
            className="glass glass-edge glass-hover flex w-[60%] shrink-0 snap-start flex-col items-center justify-center gap-3 p-5 text-center sm:w-[30%] lg:w-[calc((100%-3*1.25rem)/4)]"
          >
            <ArrowRight size={22} />
            <span className="font-seal text-[17px] text-stone2-900">See the whole menu</span>
            <span className="font-mono text-[11px] text-stone2-400">{productos.length} items</span>
          </Link>
        )}
      </div>
    </div>
  );
}
