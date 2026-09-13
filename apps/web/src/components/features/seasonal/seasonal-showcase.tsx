'use client';

import { useEffect, useMemo, useState } from 'react';
import { recipePrice, recipeScene, type Recipe } from '@/lib/recipes';
import { useWebglStage } from '@/hooks/use-webgl-stage';
import { useBestSellers, useLiveRecipes } from '@/hooks/use-recipes';
import { usePriceBook } from '@/lib/price-book';
import dynamic from 'next/dynamic';

// The menu as an animated poster. Always 3D, lighter on modest devices.
const DrinkPoster = dynamic(() => import('@/components/features/builder/drink-poster'), {
  ssr: false,
});

type Tab = 'signature' | 'seasonal' | 'popular';

/** Una receta con lo que se vendió, cuando viene del ranking. */
type Listed = Recipe & { sold?: number };

export function SeasonalShowcase() {
  const [tab, setTab] = useState<Tab>('signature');
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const { ref: stage, mounted: visible, generation } = useWebglStage<HTMLDivElement>();

  // El menú lo manda el CRM: una bebida de temporada programada ahí aparece
  // aquí sola. La lista local solo entra si el API no tiene nada.
  const { signatures, seasonals } = useLiveRecipes();
  const { bestSellers } = useBestSellers(6);
  usePriceBook((s) => s.version);

  // La pestaña solo existe cuando hay ventas que la respalden. Un «lo más
  // pedido» de una cafetería que abrió ayer no significa nada.
  const tabs: { id: Tab; label: string }[] = [
    { id: 'signature', label: 'Our drinks' },
    { id: 'seasonal', label: 'Seasonal' },
    ...(bestSellers.length > 0 ? [{ id: 'popular' as Tab, label: 'Most ordered' }] : []),
  ];

  const list: Listed[] =
    tab === 'signature' ? signatures : tab === 'seasonal' ? seasonals : bestSellers;
  const drink = list[Math.min(index, list.length - 1)];
  // Two more drinks from the same list float behind the chosen one.
  const companions = useMemo(
    () =>
      list.length > 1
        ? [1, 2]
            .map((k) => list[(Math.min(index, list.length - 1) + k) % list.length])
            .filter((d) => d && d.id !== drink?.id)
        : [],
    [list, index, drink],
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setAnimate(!mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <section
      aria-labelledby="drinks-heading"
      className="bloom bloom-alt relative overflow-hidden border-b-2 border-stone2-900"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="mb-5 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-stone2-600">
          <span className="h-2.5 w-2.5 bg-neon-500 ring-1 ring-stone2-900" />
          The menu, poured
        </p>

        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <h2
            id="drinks-heading"
            className="text-4xl font-extrabold leading-[1.0] text-stone2-900 md:text-5xl"
          >
            Every drink is a
            <span className="block">
              <span className="marker font-seal italic">recipe.</span>
            </span>
          </h2>
          <p className="max-w-[19rem] text-[15px] leading-relaxed text-stone2-600">
            Each one is built from the same steps you can use yourself. Pick one to watch it made.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-3" role="tablist" aria-label="Drink lists">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id);
                setIndex(0);
              }}
              className={`btn px-5 py-2.5 text-[14px] ${tab === t.id ? 'btn-acid' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid items-center gap-10 md:grid-cols-12 md:gap-8">
          {/* The pour */}
          <div ref={stage} className="relative md:col-span-6">
            <div className="rule relative aspect-[4/5] w-full overflow-hidden bg-birch-50 shadow-hard-lg sm:aspect-square md:aspect-[4/5]">
              {/* The café's colours, out of focus, like the bloom on the page. */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(60% 50% at 28% 30%, rgb(var(--acid) / 0.6), transparent 70%), radial-gradient(50% 45% at 78% 76%, rgb(var(--ember) / 0.35), transparent 70%)',
                }}
              />
              {/* The drink's name, set large behind the floating cups. */}
              {drink && (
                <div className="pointer-events-none absolute inset-x-0 top-[30%] z-[1] px-5 text-center">
                  <span className="font-seal text-[clamp(1.1rem,3.4vw,1.6rem)] italic text-stone2-900">
                    <span className="marker">
                      {drink.season ?? (drink.kind === 'seasonal' ? 'Seasonal' : 'Signature')}
                    </span>
                  </span>
                  <p className="mt-2 break-words text-[clamp(2.4rem,10vw,5.2rem)] font-extrabold uppercase leading-[0.85] tracking-[-0.03em] text-stone2-900">
                    {drink.name}
                  </p>
                </div>
              )}
              {visible && drink && (
                <div className="absolute inset-0 z-[2]">
                  <DrinkPoster
                    // A lost WebGL context remounts the scene from scratch.
                    key={generation}
                    focus={drink}
                    companions={companions}
                    animate={animate}
                  />
                </div>
              )}
              <span className="absolute right-3 top-3 z-[3] font-mono text-[10px] uppercase tracking-[0.2em] text-stone2-900/70">
                Around the Bean
              </span>
            </div>

            <div className="slab-acid pointer-events-none absolute -bottom-6 left-6 flex items-baseline gap-2.5 px-5 py-2.5">
              <span className="font-mono text-lg font-bold tabular-nums text-stone2-900">
                ${drink ? recipePrice(drink).toFixed(2) : '—'}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone2-900/70">
                {tab === 'popular' && drink?.sold
                  ? `${drink.sold} ordered this month`
                  : (drink?.season ?? 'All year')}
              </span>
            </div>
          </div>

          {/* The list */}
          <div className="md:col-span-6">
            <ul className="rule divide-y-2 divide-stone2-900 bg-birch-50">
              {list.map((d, i) => {
                const active = d.id === drink?.id;
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors ${
                        active ? 'bg-neon-500' : 'hover:bg-birch-100'
                      }`}
                    >
                      {/* The swatch comes from the drink's own formula, so the
                          list and the cup can never disagree. */}
                      <span
                        aria-hidden="true"
                        className="h-9 w-3 shrink-0 border-2 border-stone2-900 transition-colors duration-300"
                        style={{
                          backgroundColor: active ? recipeScene(d).liquid : 'transparent',
                        }}
                      />
                      {tab === 'popular' && (
                        <span className="shrink-0 font-mono text-[13px] font-bold tabular-nums text-stone2-400">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="font-seal text-lg leading-tight text-stone2-900">
                            {d.name}
                          </span>
                          {d.accent && (
                            <span className="font-mono text-xs text-stone2-600">{d.accent}</span>
                          )}
                        </span>
                        <span
                          className={`mt-1 block font-mono text-[12px] leading-snug text-stone2-600 transition-all ${
                            active ? 'opacity-100' : 'opacity-0 md:h-0 md:overflow-hidden'
                          }`}
                        >
                          {d.note}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[15px] font-bold tabular-nums text-stone2-900">
                        ${recipePrice(d).toFixed(2)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Aqui es donde el configurador tiene sentido: ya has elegido una
                bebida y quieres cambiarle la leche, no empezar de cero. */}
            <div className="mt-8 flex flex-wrap gap-3">
              {drink && (
                <a
                  href={`/build?recipe=${drink.id}`}
                  className="btn btn-acid inline-flex min-h-[44px] px-6 text-[14px]"
                >
                  Make this one yours
                </a>
              )}
              <a href="/menu" className="btn inline-flex min-h-[44px] px-6 text-[14px]">
                See the full menu
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
