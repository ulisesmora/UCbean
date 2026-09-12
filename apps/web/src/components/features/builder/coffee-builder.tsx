'use client';

import dynamic from 'next/dynamic';
import { Component, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ARTS,
  BASES,
  BEANS,
  EXTRAS,
  FOAMS,
  MILKS,
  SERVES,
  SIZES,
  SLEEVES,
  VESSELS,
  canPourArt,
  hasFoam,
  DEFAULT_BUILD,
  describe,
  priceOf,
  sceneOf,
  type Build,
} from '@/lib/builder';
import { useWebglStage } from '@/hooks/use-webgl-stage';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { useCartStore } from '@/stores/cart.store';
import { baseOf } from '@/lib/builder';
import { toast } from 'sonner';

/**
 * The catalogue row every built drink hangs from.
 *
 * An order line needs a product, but a drink assembled from ten choices is not
 * any one menu item. So the shop keeps a single row for made-to-order drinks
 * and the formula rides along on the line. Priced at zero in the catalogue on
 * purpose: the build sets the price, and the server computes it again.
 */
const ANCHOR_PRODUCT = 'Build your own';

// three + drei + postprocessing are heavy. They stay out of the initial bundle.
const BuilderCup = dynamic(() => import('./builder-cup'), { ssr: false });

/**
 * A failure inside the WebGL scene must not take the configurator with it, and
 * it must not fail silently either: `next/dynamic` swallows module errors, so
 * the preview just goes blank with nothing in the console.
 */
class PreviewBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown) {
    console.error('[builder preview]', error);
  }

  render() {
    if (this.state.message) {
      return (
        <div className="flex h-full w-full items-center justify-center p-6 text-center">
          <p className="font-mono text-[12px] leading-relaxed text-stone2-600">
            The preview could not start.
            <span className="mt-2 block text-stone2-400">{this.state.message}</span>
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const STEPS = [
  { id: 'beans', title: 'Pick your beans', hint: 'Where the coffee comes from' },
  { id: 'size', title: 'Pick your size', hint: 'The cup is built to match' },
  { id: 'base', title: 'Pick your drink', hint: 'Watch it pour' },
  { id: 'serve', title: 'Pick how it is served', hint: 'Hot, over ice, or blended' },
  { id: 'milk', title: 'Pick your milk', hint: 'Or skip it and keep it black' },
  { id: 'extras', title: 'Pick your extras', hint: 'Choose as many as you like' },
  { id: 'vessel', title: 'Pick your cup', hint: 'Staying or going' },
] as const;

/**
 * Which 3D stage each step drives. Choosing the drink and choosing how it is
 * served both feed the same pour, so the two share stage 1.
 */
const STEP_STAGE = [0, 0, 1, 1, 2, 3, 4];

/** One choice in a step. Selection is carried by fill, never by colour alone. */
function Choice({
  name,
  note,
  price,
  selected,
  multi,
  onSelect,
}: {
  name: string;
  note: string;
  price: number;
  selected: boolean;
  multi?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`glass glass-edge flex w-full items-start gap-3 p-4 text-left transition-transform duration-200 hover:scale-[1.015] ${
        selected ? 'bg-neon-500/80' : ''
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 border-stone2-900 ${
          multi ? '' : 'rounded-full'
        } ${selected ? 'bg-stone2-900' : 'bg-transparent'}`}
      >
        {selected && (
          <span className={`block h-1.5 w-1.5 bg-neon-500 ${multi ? '' : 'rounded-full'}`} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-stone2-900">{name}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-stone2-600">{note}</span>
      </span>
      {price !== 0 && (
        <span className="shrink-0 font-mono text-[13px] font-bold tabular-nums text-stone2-900">
          {price > 0 ? `+$${price.toFixed(2)}` : `-$${Math.abs(price).toFixed(2)}`}
        </span>
      )}
    </button>
  );
}

export function CoffeeBuilder() {
  const [build, setBuild] = useState<Build>(DEFAULT_BUILD);
  const [step, setStep] = useState(0);
  const [animate, setAnimate] = useState(true);
  // Only one WebGL context should be alive at a time on this page.
  const { ref: stage, mounted: visible, generation } = useWebglStage<HTMLDivElement>();
  const liveRef = useRef<HTMLParagraphElement>(null);
  const addItem = useCartStore((s) => s.addItem);

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list(),
    staleTime: 5 * 60_000,
  });
  const anchor = products?.find((p) => p.name === ANCHOR_PRODUCT);

  function addToOrder() {
    if (!anchor) {
      toast.error('Cannot add this right now. Please try again in a moment.');
      return;
    }
    addItem(anchor, { build, label: `${baseOf(build).name}, your way` });
    toast.success(`Added · ${describe(build)}`);
  }

  const scene = useMemo(() => sceneOf(build), [build]);
  const total = priceOf(build);
  const current = STEPS[step];

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setAnimate(!mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const set = <K extends keyof Build>(key: K, value: Build[K]) =>
    setBuild((b) => ({ ...b, [key]: value }));

  const toggleExtra = (id: string) =>
    setBuild((b) => ({
      ...b,
      extras: b.extras.includes(id) ? b.extras.filter((e) => e !== id) : [...b.extras, id],
    }));

  return (
    <section
      aria-labelledby="builder-heading"
      className="bloom relative overflow-hidden border-b-2 border-stone2-900"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="mb-5 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-stone2-600">
          <span className="h-2.5 w-2.5 bg-neon-500 ring-1 ring-stone2-900" />
          Build your own
        </p>
        <h2
          id="builder-heading"
          className="mb-12 text-4xl font-extrabold leading-[1.0] text-stone2-900 md:text-5xl"
        >
          Make it <span className="marker font-seal italic">yours.</span>
        </h2>

        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          {/* Live preview */}
          <div ref={stage} className="relative md:col-span-6">
            <div className="glass glass-edge aspect-square w-full overflow-hidden md:aspect-[4/5]">
              {visible ? (
                <PreviewBoundary key={generation}>
                  <BuilderCup scene={scene} stage={STEP_STAGE[step]} animate={animate} />
                </PreviewBoundary>
              ) : (
                <div className="h-full w-full animate-pulse bg-birch-200/50" />
              )}
            </div>

            <div className="glass glass-edge pointer-events-none absolute -bottom-6 left-6 flex items-baseline gap-3 px-5 py-2.5">
              <span className="font-mono text-xl font-bold tabular-nums text-stone2-900">
                ${total.toFixed(2)}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone2-600">
                {build.vessel === 'togo' ? 'To go' : 'For here'}
              </span>
            </div>
          </div>

          {/* Configurator */}
          <div className="md:col-span-6">
            {/* Progress */}
            <ol className="mb-7 flex gap-1.5" aria-label="Build steps">
              {STEPS.map((s, i) => (
                <li key={s.id} className="flex-1">
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    aria-current={i === step ? 'step' : undefined}
                    className={`h-1.5 w-full border border-stone2-900 transition-colors ${
                      i <= step ? 'bg-neon-500' : 'bg-transparent'
                    }`}
                  >
                    <span className="sr-only">{s.title}</span>
                  </button>
                </li>
              ))}
            </ol>

            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone2-600">
              Step {step + 1} of {STEPS.length}
            </p>
            <h3 className="mt-1.5 text-2xl font-bold text-stone2-900">{current.title}</h3>
            <p className="mb-6 mt-1 text-[14px] text-stone2-600">{current.hint}</p>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {current.id === 'beans' &&
                BEANS.map((o) => (
                  <Choice
                    key={o.id}
                    {...o}
                    selected={build.beans === o.id}
                    onSelect={() => set('beans', o.id)}
                  />
                ))}

              {current.id === 'size' &&
                SIZES.map((o) => (
                  <Choice
                    key={o.id}
                    {...o}
                    selected={build.size === o.id}
                    onSelect={() => set('size', o.id)}
                  />
                ))}

              {current.id === 'base' &&
                BASES.map((o) => (
                  <Choice
                    key={o.id}
                    {...o}
                    selected={build.base === o.id}
                    onSelect={() => set('base', o.id)}
                  />
                ))}

              {current.id === 'serve' &&
                SERVES.map((o) => (
                  <Choice
                    key={o.id}
                    {...o}
                    selected={build.serve === o.id}
                    onSelect={() => set('serve', o.id)}
                  />
                ))}

              {current.id === 'milk' && (
                <>
                  {MILKS.map((o) => (
                    <Choice
                      key={o.id}
                      {...o}
                      selected={build.milk === o.id}
                      onSelect={() => set('milk', o.id)}
                    />
                  ))}

                  {/* Foam style is the real difference between these drinks:
                      same two ingredients, different amount of air. */}
                  {hasFoam(build) && (
                    <fieldset className="mt-3 sm:col-span-2">
                      <legend className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-stone2-600">
                        Foam
                      </legend>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {FOAMS.map((o) => (
                          <Choice
                            key={o.id}
                            {...o}
                            selected={build.foam === o.id}
                            onSelect={() => set('foam', o.id)}
                          />
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {/* Art needs foam you can pour through, so the picker only
                      exists once the rest of the build can actually carry it. */}
                  {canPourArt(build) && (
                    <fieldset className="mt-3 sm:col-span-2">
                      <legend className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-stone2-600">
                        Latte art
                      </legend>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {ARTS.map((o) => (
                          <Choice
                            key={o.id}
                            {...o}
                            selected={build.art === o.id}
                            onSelect={() => set('art', o.id)}
                          />
                        ))}
                      </div>
                    </fieldset>
                  )}
                </>
              )}

              {current.id === 'extras' &&
                EXTRAS.map((o) => (
                  <Choice
                    key={o.id}
                    {...o}
                    multi
                    selected={build.extras.includes(o.id)}
                    onSelect={() => toggleExtra(o.id)}
                  />
                ))}

              {current.id === 'vessel' && (
                <>
                  {VESSELS.map((o) => (
                    <Choice
                      key={o.id}
                      {...o}
                      selected={build.vessel === o.id}
                      onSelect={() => set('vessel', o.id)}
                    />
                  ))}
                  {build.vessel === 'togo' && (
                    <fieldset className="sm:col-span-2 mt-2">
                      <legend className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-stone2-600">
                        Sleeve colour
                      </legend>
                      <div className="flex flex-wrap gap-2.5">
                        {SLEEVES.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => set('sleeve', s.id)}
                            aria-pressed={build.sleeve === s.id}
                            className={`flex items-center gap-2 border-2 border-stone2-900 px-3 py-2 text-[13px] font-medium text-stone2-900 transition-transform hover:scale-[1.03] ${
                              build.sleeve === s.id ? 'bg-neon-500' : 'bg-birch-50'
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className="h-4 w-4 border border-stone2-900"
                              style={{ backgroundColor: s.hex }}
                            />
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  )}
                </>
              )}
            </div>

            {/* Running summary, announced to screen readers as it changes */}
            <p
              ref={liveRef}
              aria-live="polite"
              className="mt-7 border-l-2 border-stone2-900 py-1 pl-4 text-[14px] leading-relaxed text-stone2-600"
            >
              {describe(build)}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="btn px-6 py-3 text-[14px] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                  className="btn btn-acid px-7 py-3 text-[14px]"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={addToOrder}
                  disabled={!anchor}
                  className="btn btn-acid px-7 py-3 text-[14px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add to order · ${total.toFixed(2)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
