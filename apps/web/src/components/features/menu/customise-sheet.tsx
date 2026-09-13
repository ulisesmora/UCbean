'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Armchair, Check, Loader2, Minus, Plus, ShoppingBag, Sliders } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { EXTRAS, priceOf, sceneOf, type Build } from '@/lib/builder';
import { buildForProduct, foodKindFor, isDrink, withVessel } from '@/lib/product-scene';
import { useLiveRecipes } from '@/hooks/use-recipes';
import { useProducts } from '@/hooks/use-products';
import { useCartStore } from '@/stores/cart.store';
import type { Product } from '@/types/api.types';

function Loading3d() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 size={20} className="animate-spin text-stone2-400" />
    </div>
  );
}

const BuilderCup = dynamic(() => import('@/components/features/builder/builder-cup'), {
  ssr: false,
  loading: Loading3d,
});
const FoodScene = dynamic(() => import('@/components/features/builder/food-scene'), {
  ssr: false,
  loading: Loading3d,
});

export type Where = 'here' | 'togo';

/** What to start from when the line is not new: a usual, a saved drink. */
export type Prefill = {
  extras?: string[];
  vessel?: Where | null;
  /** A built drink. Its extras and cup are edited on the formula itself. */
  build?: Build | null;
  recipeId?: string | null;
  label?: string | null;
};

type Phase = 'choosing' | 'serving' | 'done';

/**
 * What happens before anything goes in the bag.
 *
 * Always asked, even for a usual: at a bar "anything extra?" and "for here or
 * to go?" are part of taking the order, and skipping them online serves a
 * coffee that was not the one wanted, in the wrong cup.
 *
 * Every product gets its 3D: a drink is poured from its formula, food is
 * plated or boxed. Tapping Add puts it in the bag straight away and then
 * serves it on screen: the lid goes on, the box closes, the plate is set
 * down. The dialog closes when that finishes, so the last thing seen is the
 * order being handed over, and a toast says where it went.
 */
export function CustomiseSheet({
  product,
  open,
  onOpenChange,
  prefill,
  onAdded,
  openCartAfter = false,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prefill?: Prefill;
  /** Runs once the line is in the bag, e.g. to count a saved drink as ordered. */
  onAdded?: () => void;
  /** Open the bag afterwards, for "order it again" where paying comes next. */
  openCartAfter?: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { signatures, seasonals } = useLiveRecipes();

  const [extras, setExtras] = useState<string[]>([]);
  const [where, setWhere] = useState<Where>('togo');
  const [qty, setQty] = useState(1);
  const [nota, setNota] = useState('');
  const [phase, setPhase] = useState<Phase>('choosing');
  const [replay, setReplay] = useState(0);
  // Read from inside the 3D frame loop and timers, which hold old closures.
  const phaseRef = useRef<Phase>('choosing');
  const labelRef = useRef('');
  const fallback = useRef<ReturnType<typeof setTimeout>>(undefined);

  const moveTo = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // Each opening starts from the prefill: the usual's extras and cup, or none.
  useEffect(() => {
    if (!open) return;
    setExtras(prefill?.build?.extras ?? prefill?.extras ?? []);
    setWhere(
      prefill?.vessel ??
        (prefill?.build ? (prefill.build.vessel === 'togo' ? 'togo' : 'here') : 'togo'),
    );
    setQty(1);
    setNota('');
    setReplay(0);
    moveTo('choosing');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read once per opening
  }, [open]);

  useEffect(() => () => clearTimeout(fallback.current), []);

  // A product that is a CRM recipe is ordered as that formula: priced by it,
  // drawn from it, and recorded against the recipe, so ordering it once is
  // enough for it to come back as a usual.
  const linked = product?.recipe ?? null;
  const custom = Boolean(prefill?.build || linked);
  const drink = product
    ? custom ||
      isDrink(
        product,
        [...signatures, ...seasonals].map((r) => r.name),
      )
    : false;
  const food = product && !drink ? foodKindFor(product) : null;
  // A bag of beans is not for here or to go. It is just a bag of beans.
  const retail = food === 'beans' || food === 'bag';

  const baseBuild = useMemo<Build | null>(() => {
    if (!product) return null;
    return (
      prefill?.build ??
      (linked?.build as Build | undefined) ??
      buildForProduct(product, [...signatures, ...seasonals])
    );
  }, [product, prefill?.build, signatures, seasonals]);

  const build = useMemo(
    () => (baseBuild ? withVessel({ ...baseBuild, extras }, where === 'togo') : null),
    [baseBuild, extras, where],
  );
  const scene = useMemo(() => (build ? sceneOf(build) : null), [build]);

  if (!product || !build || !scene) return null;

  const serving = phase !== 'choosing';
  const chosen = EXTRAS.filter((e) => extras.includes(e.id));
  const unit = custom
    ? priceOf(build)
    : Number(product.price) + (drink ? chosen.reduce((s, e) => s + e.price, 0) : 0);
  const cold = build.serve !== 'hot';
  const name = prefill?.label ?? product.name;

  const whereNote = drink
    ? where === 'here'
      ? cold
        ? 'Served in a glass'
        : 'Served in a ceramic cup'
      : cold
        ? 'Clear cup with a lid and straw'
        : 'Paper cup, sleeve and lid'
    : where === 'here'
      ? 'Served on a plate'
      : 'Boxed up to take away';
  const servingLabel =
    where === 'togo' && !retail ? (drink ? 'Putting the lid on' : 'Boxing it up') : 'Serving it up';

  function toggle(id: string) {
    setExtras((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  }

  function close(v: boolean) {
    if (!v) clearTimeout(fallback.current);
    onOpenChange(v);
  }

  function finish() {
    if (phaseRef.current !== 'serving') return;
    clearTimeout(fallback.current);
    moveTo('done');
    // A beat on the finished order before the dialog goes.
    setTimeout(() => {
      close(false);
      if (openCartAfter) {
        openCart();
      } else {
        toast.success(`${labelRef.current} is in your bag`, {
          action: { label: 'View bag', onClick: () => openCart() },
        });
      }
    }, 450);
  }

  function add() {
    if (serving) return;
    const note = nota.trim() || undefined;
    labelRef.current = name;
    for (let n = 0; n < qty; n++) {
      if (custom) {
        addItem(product!, {
          build: build!,
          recipeId: prefill?.recipeId ?? linked?.slug ?? undefined,
          label: name,
          note,
        });
      } else {
        addItem(product!, {
          label: note ? `${name} · ${note}` : name,
          extras: drink && extras.length ? extras : undefined,
          note,
          vessel: retail ? undefined : where,
          recipeId: prefill?.recipeId ?? undefined,
        });
      }
    }
    onAdded?.();
    moveTo('serving');
    setReplay((r) => r + 1);
    // A background tab gets no animation frames. Never leave the dialog hanging.
    fallback.current = setTimeout(finish, 6500);
  }

  const onServed = () => {
    if (phaseRef.current === 'serving') finish();
  };

  return (
    <MotionConfig reducedMotion="user">
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="glass-panel glass-edge !flex max-h-[90vh] flex-col overflow-y-auto border-2 border-stone2-900 sm:max-w-[440px]">
          <DialogTitle className="text-[20px] font-extrabold tracking-[-0.02em] text-stone2-900">
            {name}
          </DialogTitle>

          <div className="rule relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-birch-100">
            {/* Absolute on purpose: the Three.js canvas sizes itself, and inside
                the dialog's column it pushed the box past its slot. */}
            <div className="absolute inset-0">
              {drink ? (
                <BuilderCup
                  key={product.id}
                  scene={scene}
                  stage={4}
                  animate
                  replay={replay}
                  onComplete={onServed}
                />
              ) : (
                <FoodScene
                  key={product.id}
                  kind={food!}
                  name={product.name}
                  togo={where === 'togo' && !retail}
                  replay={replay}
                  onComplete={onServed}
                />
              )}
            </div>
            <AnimatePresence>
              {serving ? (
                <motion.span
                  key="serving"
                  role="status"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full border-2 border-stone2-900 bg-neon-500 px-2.5 py-0.5 text-[12px] font-bold text-stone2-900"
                >
                  {phase === 'done' ? (
                    <>
                      <Check size={13} strokeWidth={3} />
                      Ready
                    </>
                  ) : (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      {servingLabel}
                    </>
                  )}
                </motion.span>
              ) : (
                drink &&
                chosen.length > 0 && (
                  <motion.span
                    key={extras.join('+')}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-2 left-2 rounded-full border-2 border-stone2-900 bg-white/85 px-2.5 py-0.5 text-[11.5px] font-semibold text-stone2-900"
                  >
                    + {chosen.map((e) => e.name.toLowerCase()).join(', ')}
                  </motion.span>
                )
              )}
            </AnimatePresence>
          </div>

          {!retail && (
            <fieldset disabled={serving} className="flex flex-col gap-1.5">
              <legend className="mb-1 text-[13px] font-semibold text-stone2-900">
                For here or to go?
              </legend>
              <div
                role="radiogroup"
                aria-label="For here or to go"
                className="grid grid-cols-2 gap-2"
              >
                {(['here', 'togo'] as const).map((v) => {
                  const on = where === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setWhere(v)}
                      className={`tap-target flex items-center justify-center gap-2 rounded border-2 border-stone2-900 py-2.5 text-[14px] font-semibold text-stone2-900 transition-colors ${
                        on ? 'bg-neon-500 shadow-[2px_2px_0_#0A0A0A]' : 'bg-white/60 hover:bg-white'
                      }`}
                    >
                      {v === 'here' ? <Armchair size={15} /> : <ShoppingBag size={15} />}
                      {v === 'here' ? 'For here' : 'To go'}
                    </button>
                  );
                })}
              </div>
              <p className="text-[12px] text-stone2-600">{whereNote}</p>
            </fieldset>
          )}

          {drink ? (
            <fieldset disabled={serving} className="flex flex-col gap-2">
              <legend className="mb-1 text-[13px] font-semibold text-stone2-900">
                Anything extra?
              </legend>
              {EXTRAS.map((e) => {
                const on = extras.includes(e.id);
                return (
                  <label
                    key={e.id}
                    className={`tap-target flex cursor-pointer items-center gap-3 rounded border-2 border-stone2-900 px-3 py-2.5 transition-colors ${
                      on ? 'bg-neon-500' : 'bg-white/60 hover:bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(e.id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`h-4 w-4 shrink-0 rounded-sm border-2 border-stone2-900 ${
                        on ? 'bg-stone2-900' : 'bg-white'
                      }`}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[14.5px] font-semibold text-stone2-900">{e.name}</span>
                      <span className="text-[12px] text-stone2-600">{e.note}</span>
                    </span>
                    <span className="shrink-0 text-[13px] tabular-nums text-stone2-600">
                      {e.price === 0 ? 'free' : `+$${e.price.toFixed(2)}`}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          ) : (
            <p className="text-[13.5px] text-stone2-600">
              {retail
                ? 'Tell us below if you want it ground, and for what.'
                : 'Made fresh. Tell us below if you want it a particular way.'}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nota" className="text-[13px] font-semibold text-stone2-900">
              Anything else? <span className="font-normal text-stone2-400">Optional</span>
            </label>
            <input
              id="nota"
              value={nota}
              disabled={serving}
              onChange={(e) => setNota(e.target.value)}
              maxLength={80}
              placeholder={
                drink ? 'Extra hot, light ice…' : retail ? 'Ground for filter…' : 'Warmed up…'
              }
              className="tap-target rounded border-2 border-stone2-900 bg-white/70 px-3 py-2 text-[15px] outline-none focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center rounded-full border-2 border-stone2-900 bg-white/60 px-0.5">
              <button
                type="button"
                disabled={serving}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="One fewer"
                className="flex h-9 w-9 items-center justify-center rounded-full text-stone2-900 hover:bg-stone2-900/8"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center text-[15px] font-bold tabular-nums text-stone2-900">
                {qty}
              </span>
              <button
                type="button"
                disabled={serving}
                onClick={() => setQty((q) => Math.min(20, q + 1))}
                aria-label="One more"
                className="flex h-9 w-9 items-center justify-center rounded-full text-stone2-900 hover:bg-stone2-900/8"
              >
                <Plus size={14} />
              </button>
            </div>

            <motion.button
              type="button"
              onClick={add}
              whileTap={{ scale: 0.98 }}
              aria-disabled={serving}
              className="btn btn-acid tap-target flex-1 overflow-hidden py-3 text-[15px]"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={serving ? 'added' : (unit * qty).toFixed(2)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center gap-2 tabular-nums"
                >
                  {serving ? (
                    <>
                      <Check size={15} strokeWidth={3} />
                      Added to your bag
                    </>
                  ) : (
                    `Add · $${(unit * qty).toFixed(2)}`
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>

          {drink && !custom && !serving && (
            <Link
              href="/build"
              onClick={() => close(false)}
              className="flex items-center justify-center gap-1.5 text-[13px] text-stone2-400 underline-offset-4 hover:underline"
            >
              <Sliders size={13} />
              Or build one from scratch
            </Link>
          )}
        </DialogContent>
      </Dialog>
    </MotionConfig>
  );
}

/** A usual or a saved drink, as the sheet needs it. */
export type RepeatLine = {
  productId: string | null;
  label: string;
  build?: Build | null;
  extras?: string[];
  vessel?: Where | null;
  recipeId?: string | null;
};

/**
 * The same sheet, for ordering something again.
 *
 * Looks the product up in today's catalogue, so the price is today's and a
 * drink that came off the menu says so instead of opening. A saved build with
 * no product id is ordered against the Build-your-own row.
 */
export function RepeatSheet({
  line,
  open,
  onOpenChange,
  onAdded,
  openCartAfter,
}: {
  line: RepeatLine | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded?: () => void;
  openCartAfter?: boolean;
}) {
  const { data: products } = useProducts();
  const product = line
    ? (products?.find((p) => p.id === line.productId) ??
      (line.build ? products?.find((p) => /build your own/i.test(p.name)) : undefined))
    : undefined;
  const missing = open && !!line && !!products && (!product || !product.isAvailable);

  useEffect(() => {
    if (!missing) return;
    toast.error(`${line?.label ?? 'That'} is not on the menu today`);
    onOpenChange(false);
  }, [missing, line?.label, onOpenChange]);

  return (
    <CustomiseSheet
      product={product && product.isAvailable ? product : null}
      open={open && !!product}
      onOpenChange={onOpenChange}
      prefill={
        line
          ? {
              build: line.build,
              extras: line.extras,
              vessel: line.vessel,
              recipeId: line.recipeId,
              label: line.label,
            }
          : undefined
      }
      onAdded={onAdded}
      openCartAfter={openCartAfter}
    />
  );
}
