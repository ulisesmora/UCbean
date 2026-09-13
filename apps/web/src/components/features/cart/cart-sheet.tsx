'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { Coffee, Heart, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCartStore, type CartItem } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useFavorites, useReorderFavorite, useSaveFavorite } from '@/hooks/use-favorites';
import { productImage } from '@/lib/images';
import { DrinkThumb } from '@/components/features/builder/drink-thumb';
import { toast } from 'sonner';

/**
 * La foto de la línea.
 *
 * Un pedido es una lista de cosas que se beben, y se reconocen antes por la
 * foto que por el nombre. Cuando no hay, un vaso dibujado mantiene la
 * columna alineada en vez de dejar un hueco.
 */
function LineImage({ src, alt, size = 56 }: { src: string | null; alt: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative shrink-0 overflow-hidden rounded-[10px] border-2 border-stone2-900 bg-birch-100"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- las fotos vienen del CDN del API, no de un host declarado en next.config
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-stone2-400">
          <Coffee size={Math.round(size * 0.4)} strokeWidth={1.5} />
        </span>
      )}
    </div>
  );
}

/** El botón redondo de más y menos: vidrio, no una caja negra. */
function Step({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-stone2-900 transition-colors hover:bg-stone2-900/8 active:bg-stone2-900/14"
    >
      {children}
    </button>
  );
}

function Line({ item }: { item: CartItem }) {
  const { lineId, label, ticket, qty, price, build, recipeId, product } = item;
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const save = useSaveFavorite();

  // Guardar solo tiene sentido en una bebida configurada: un croissant no
  // tiene fórmula que repetir, se vuelve a pedir desde la carta.
  const guardable = isAuthenticated && Boolean(build);

  return (
    // `layout` hace que las líneas de debajo suban suaves cuando una se va,
    // en vez de saltar al hueco. Quitar un café no debería sentirse como un
    // parpadeo de toda la lista.
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 48, transition: { duration: 0.18 } }}
      transition={{ duration: 0.24, ease: [0.22, 0.9, 0.24, 1] }}
      className="glass glass-edge glass-hover flex items-center gap-3 p-3"
    >
      {build ? (
        // A drink made to a formula turns in 3D: a menu photo says nothing about it.
        <DrinkThumb
          build={build}
          fallback={productImage(product)}
          alt={label}
          className="h-14 w-14 shrink-0 rounded-[10px] border-2 border-stone2-900 bg-birch-100"
        />
      ) : (
        <LineImage src={productImage(product)} alt={label} />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold leading-tight text-stone2-900">{label}</p>
        {ticket && (
          <p className="truncate text-[11px] uppercase tracking-[0.1em] text-forest-700">
            {ticket}
          </p>
        )}
        <p className="text-[12px] tabular-nums text-stone2-400">${price.toFixed(2)} each</p>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <p className="text-[15px] font-extrabold tabular-nums text-stone2-900">
          ${(price * qty).toFixed(2)}
        </p>

        <div className="flex items-center rounded-full border-2 border-stone2-900 bg-white/60 px-0.5">
          <Step onClick={() => updateQty(lineId, qty - 1)} label={`One fewer ${label}`}>
            {qty === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
          </Step>
          <span className="w-5 text-center text-[13px] font-bold tabular-nums text-stone2-900">
            {qty}
          </span>
          <Step onClick={() => updateQty(lineId, qty + 1)} label={`One more ${label}`}>
            <Plus size={13} />
          </Step>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1">
        {guardable && (
          <button
            type="button"
            disabled={save.isPending || save.isSuccess}
            onClick={() =>
              save.mutate(
                { name: label, build, recipeId, productId: product.id },
                {
                  onSuccess: () => toast.success(`Saved “${label}” to your usuals`),
                  onError: (e) => toast.error(e.message),
                },
              )
            }
            aria-label={`Save ${label} as a favourite`}
            title="Save as one of my usuals"
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone2-400 transition-colors hover:bg-stone2-900/8 hover:text-bark-700 disabled:opacity-100"
          >
            <Heart size={15} fill={save.isSuccess ? 'currentColor' : 'none'} />
          </button>
        )}
        <button
          type="button"
          onClick={() => removeItem(lineId)}
          aria-label={`Remove ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-stone2-400 transition-colors hover:bg-stone2-900/8 hover:text-bark-700"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </motion.li>
  );
}

/**
 * Lo de siempre, a un toque.
 *
 * Se enseña arriba porque quien ya tiene una bebida guardada casi nunca abre
 * el carrito a explorar: viene a repetir.
 */
function Usuals() {
  const { data: favorites = [] } = useFavorites();
  const reorder = useReorderFavorite();
  if (favorites.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-stone2-400">Your usuals</p>
      <div className="flex flex-wrap gap-2">
        {favorites.slice(0, 4).map((f) => (
          <button
            key={f.id}
            type="button"
            disabled={reorder.isPending}
            onClick={() =>
              reorder.mutate(f, {
                onSuccess: () => toast.success(`${f.name} added`),
                onError: (e) => toast.error(e.message),
              })
            }
            className="glass glass-hover tap-target flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold text-stone2-900 disabled:opacity-50"
          >
            <Heart size={13} className="text-bark-700" fill="currentColor" />
            {f.name}
            <span className="tabular-nums text-stone2-400">${f.price.toFixed(2)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The bag.
 *
 * It holds and prices the lines, and nothing else. Choosing a collection time
 * and placing the order live on the pickup page, which has the room to show a
 * whole day of slots. One checkout, one place to fix it.
 */
export function CartSheet() {
  const { items, isOpen, closeCart, totalItems, totalPrice } = useCartStore();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex w-full flex-col border-l-2 border-stone2-900 bg-birch-50 sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-neon-500 ring-1 ring-stone2-900" />
            <span className="text-[11px] uppercase tracking-[0.24em] text-stone2-600">
              Your order
            </span>
            {totalItems() > 0 && (
              <span className="rounded-full border-2 border-stone2-900 bg-neon-500 px-2 py-0.5 text-[11px] font-bold tabular-nums text-stone2-900">
                {totalItems()}
              </span>
            )}
          </SheetTitle>
          <p className="mt-2 text-left text-3xl font-extrabold leading-none text-stone2-900">
            The bag.
          </p>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
            <Usuals />
            <ShoppingBag size={36} className="text-stone2-400" strokeWidth={1.4} />
            <p className="font-seal text-xl text-stone2-900">Nothing in the bag yet</p>
            <p className="max-w-[230px] text-[13px] leading-relaxed text-stone2-400">
              Browse the menu, or build your own drink from scratch.
            </p>
            <Link href="/menu" className="btn mt-3 px-6 py-2.5 text-[14px]" onClick={closeCart}>
              Browse the menu
            </Link>
          </div>
        ) : (
          <>
            <div className="-mx-6 flex-1 overflow-y-auto px-6">
              <Usuals />
              <ul className="flex flex-col gap-2.5 pb-2">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <Line key={item.lineId} item={item} />
                  ))}
                </AnimatePresence>
              </ul>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <div className="glass glass-edge flex items-center justify-between px-4 py-3">
                <span className="text-[11px] uppercase tracking-[0.2em] text-stone2-600">
                  Total
                </span>
                <span className="text-xl font-extrabold tabular-nums text-stone2-900">
                  ${totalPrice().toFixed(2)}
                </span>
              </div>
              <Link
                href="/pickup"
                onClick={closeCart}
                className="btn btn-acid flex h-12 w-full items-center justify-center text-[15px]"
              >
                Choose a pickup time
              </Link>
              <p className="text-center text-[12px] text-stone2-400">
                Or have it as soon as it&apos;s ready — about 10 to 15 minutes
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function CartButton() {
  const { toggleCart, totalItems } = useCartStore();
  // The cart is persisted in localStorage, so the server renders a count of
  // zero and the client rehydrates a different one. Holding the badge back
  // until after mount is what keeps the two trees identical.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? totalItems() : 0;

  // Something just went in: the button jumps and a +n floats off it. The toast
  // says what was added; this says where it went. Rehydrating the saved bag
  // on load is not an addition, so the first count after mount is skipped.
  const previous = useRef(0);
  const ready = useRef(false);
  const [bump, setBump] = useState({ n: 0, added: 0 });
  useEffect(() => {
    if (!mounted) return;
    if (ready.current && count > previous.current) {
      setBump((b) => ({ n: b.n + 1, added: count - previous.current }));
    }
    ready.current = true;
    previous.current = count;
  }, [count, mounted]);

  return (
    <motion.button
      key={bump.n}
      onClick={toggleCart}
      aria-label={count > 0 ? `Your bag, ${count} items` : 'Your bag'}
      initial={bump.n ? { scale: 1 } : false}
      animate={bump.n ? { scale: [1, 1.18, 0.95, 1], rotate: [0, -6, 4, 0] } : undefined}
      transition={{ duration: 0.5 }}
      className="btn btn-acid tap-target relative px-5 py-2 text-[13px]"
    >
      <ShoppingBag size={14} />
      <span className="hidden sm:inline">Order</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-bark-500 text-[10px] font-bold text-stone2-900">
          {count > 9 ? '9+' : count}
        </span>
      )}
      <AnimatePresence>
        {bump.n > 0 && (
          <motion.span
            key={bump.n}
            aria-hidden="true"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -26 }}
            transition={{ duration: 0.9 }}
            className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border-2 border-stone2-900 bg-white px-1.5 text-[11px] font-bold text-stone2-900"
          >
            +{bump.added}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
