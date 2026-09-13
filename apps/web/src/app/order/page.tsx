'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Coffee, Heart, History, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { favoritesApi, ordersApi } from '@/lib/api';
import { productImage } from '@/lib/images';
import { DrinkThumb } from '@/components/features/builder/drink-thumb';
import { usualsFrom, type Usual } from '@/lib/usuals';
import type { Build } from '@/lib/builder';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { useProducts } from '@/hooks/use-products';
import { useFavorites } from '@/hooks/use-favorites';
import { EN_CURSO, useReorder } from '@/hooks/use-reorder';
import { LoyaltySummary } from '@/components/features/account/loyalty-summary';
import { OrderInProgress } from '@/components/features/home/quick-order';
import { ProductCard } from '@/components/features/menu/product-card';
import { BUILD_OWN } from '@/components/features/menu/build-your-own-card';
import { RepeatSheet, type RepeatLine } from '@/components/features/menu/customise-sheet';
import { AuthModal } from '@/components/features/auth/auth-modal';
import type { FavoriteDrink, Order, Product } from '@/types/api.types';

const DAY = 86_400_000;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

/** "today", "yesterday", "3 days ago": how a barista would say it. */
function ago(iso: string): string {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(new Date(iso))) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

/** A usual as the repeat sheet needs it: last time's extras and cup, ready to change. */
function lineOf(u: Usual): RepeatLine {
  const { item } = u;
  return {
    productId: item.productId,
    label: item.name ?? item.productName,
    build: (item.build as Build | null | undefined) ?? null,
    extras: item.extras,
    vessel: item.vessel ?? null,
    recipeId: item.recipeId,
  };
}

type Repeat = RepeatLine & { favoriteId?: string; checkout?: boolean };

/**
 * Your counter: where someone with an account orders.
 *
 * A regular does not browse. They want the coffee they had on Tuesday, so it
 * sits at the top. Ordering it again still asks about extras and for here or
 * to go, with last time's answers already picked, because that is what a
 * barista asks too and the answer is not always the same.
 *
 * Signed-in visitors land here instead of the front page (see
 * ReturningRedirect). The front page is still one tap away on the logo.
 */
export default function OrderHubPage() {
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [repeat, setRepeat] = useState<Repeat | null>(null);
  useEffect(() => setMounted(true), []);

  const orders = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.myOrders(accessToken!),
    enabled: isAuthenticated && !!accessToken,
  });
  const { data: products } = useProducts();
  const { data: favorites } = useFavorites();

  const usuals = useMemo(() => usualsFrom(orders.data ?? []), [orders.data]);
  const catalogue = useMemo(() => new Map((products ?? []).map((p) => [p.id, p])), [products]);

  if (!mounted) return <HubSkeleton />;

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-3 px-5 text-center">
        <Coffee size={36} className="text-stone2-400" strokeWidth={1.4} />
        <h1 className="text-2xl font-extrabold text-stone2-900">Your usuals live here</h1>
        <p className="text-[15px] text-stone2-600">
          Sign in and the drinks you order most wait on this page, one tap away.
        </p>
        <button
          type="button"
          onClick={() => setShowAuth(true)}
          className="btn btn-acid tap-target mt-2 px-6 py-2.5 text-[15px]"
        >
          Sign in
        </button>
        <Link href="/menu" className="text-[14px] font-semibold underline underline-offset-4">
          Browse the menu instead
        </Link>
        <AuthModal open={showAuth} onOpenChange={setShowAuth} />
      </div>
    );
  }

  const history = orders.data ?? [];
  const name = user?.name?.split(' ')[0] ?? 'there';
  const latest = [...history].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
  const inProgress = latest && EN_CURSO.includes(latest.status) ? latest : null;
  const [top, ...rest] = usuals;
  const topName = top ? (top.item.name ?? top.item.productName) : null;

  // Saved drinks that the history does not already show, so nothing appears twice.
  const shown = new Set(usuals.map((u) => u.item.name ?? u.item.productName));
  const savedOnly = (favorites ?? []).filter((f) => !shown.has(f.name)).slice(0, 4);

  // Recommendations: available things not tried yet, from the menu sections
  // this person already orders from. With no history, the menu's first few.
  const tried = new Set(usuals.map((u) => u.item.productId));
  const theirSections = new Set(
    usuals.map((u) => catalogue.get(u.item.productId)?.categoryId).filter(Boolean),
  );
  const suggestions = (products ?? [])
    .filter(
      (p) =>
        p.isAvailable &&
        !BUILD_OWN.test(p.name) &&
        !tried.has(p.id) &&
        (theirSections.size === 0 || theirSections.has(p.categoryId)),
    )
    .slice(0, 4);

  const repeatSaved = (f: FavoriteDrink) =>
    setRepeat({
      productId: f.productId,
      label: f.name,
      build: f.build as Build,
      recipeId: f.recipeId,
      favoriteId: f.id,
    });

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-6 md:py-12">
      <header className="mb-6">
        <p className="mb-1.5 text-[12px] uppercase tracking-[0.2em] text-forest-600">
          Your counter
        </p>
        <h1 className="text-3xl font-extrabold leading-none text-stone2-900 md:text-5xl">
          {greeting()}, {name}.
        </h1>
        <p className="mt-2 text-[15px] text-stone2-600">
          {top?.atThisHour
            ? `Around this time it's usually ${topName}.`
            : top
              ? 'Your usuals are one tap away.'
              : 'Your first order starts here. Next time, it will be waiting on this page.'}
        </p>
      </header>

      {inProgress && (
        <div className="mb-6">
          <OrderInProgress order={inProgress} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          {orders.isLoading ? (
            <div aria-hidden="true" className="glass glass-edge h-64 animate-pulse" />
          ) : top ? (
            <UsualHero
              usual={top}
              product={catalogue.get(top.item.productId)}
              onRepeat={() => setRepeat({ ...lineOf(top), checkout: true })}
            />
          ) : (
            <FirstVisit />
          )}

          {(rest.length > 0 || savedOnly.length > 0) && (
            <section aria-labelledby="repeat-heading">
              <h2 id="repeat-heading" className="mb-3 text-base font-bold text-stone2-900">
                Also on repeat
              </h2>
              <ul className="flex flex-col gap-2.5">
                {rest.slice(0, 5).map((u) => (
                  <UsualRow
                    key={u.key}
                    usual={u}
                    product={catalogue.get(u.item.productId)}
                    onRepeat={() => setRepeat(lineOf(u))}
                  />
                ))}
                {savedOnly.map((f) => (
                  <SavedRow
                    key={f.id}
                    fav={f}
                    product={f.productId ? catalogue.get(f.productId) : undefined}
                    onRepeat={() => repeatSaved(f)}
                  />
                ))}
              </ul>
            </section>
          )}

          {latest && latest.items.length > 1 && !inProgress && (
            <RepeatOrder order={latest} catalogue={catalogue} />
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <LoyaltySummary />
          <nav aria-label="More ways to order" className="grid grid-cols-2 gap-2.5">
            <Link href="/menu" className="btn tap-target justify-center px-4 py-3 text-[14px]">
              Full menu
            </Link>
            <Link href="/build" className="btn tap-target justify-center px-4 py-3 text-[14px]">
              Build your own
            </Link>
            <Link
              href="/profile"
              className="col-span-2 flex items-center justify-center gap-2 py-2 text-[13px] font-semibold text-stone2-600 underline underline-offset-4"
            >
              <History size={14} />
              Order history
            </Link>
          </nav>
        </aside>
      </div>

      {suggestions.length > 0 && (
        <section aria-labelledby="suggest-heading" className="mt-12">
          <h2 id="suggest-heading" className="text-xl font-extrabold text-stone2-900 md:text-2xl">
            {usuals.length > 0 ? 'You might like' : 'Start with something from the menu'}
          </h2>
          {usuals.length > 0 && (
            <p className="mb-5 mt-1 text-[14px] text-stone2-600">
              New to you, from the part of the menu you order from.
            </p>
          )}
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 24vw"
              />
            ))}
          </div>
        </section>
      )}

      <RepeatSheet
        line={repeat}
        open={repeat !== null}
        onOpenChange={(v) => {
          if (!v) setRepeat(null);
        }}
        openCartAfter={repeat?.checkout}
        onAdded={() => {
          // Counts towards the order of the saved list. Losing one count is fine.
          if (repeat?.favoriteId && accessToken) {
            favoritesApi.markOrdered(repeat.favoriteId, accessToken).catch(() => undefined);
          }
        }}
      />
    </div>
  );
}

function UsualHero({
  usual,
  product,
  onRepeat,
}: {
  usual: Usual;
  product?: Product;
  onRepeat: () => void;
}) {
  const { item } = usual;
  const label = item.name ?? product?.name ?? item.productName;
  const soldOut = product ? !product.isAvailable : false;
  const cup = item.vessel === 'here' ? 'for here' : item.vessel === 'togo' ? 'to go' : null;

  return (
    <section aria-labelledby="usual-heading" className="glass glass-edge overflow-hidden">
      <div className="grid sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] border-b-2 border-stone2-900 bg-birch-100 sm:aspect-auto sm:min-h-[240px] sm:border-b-0 sm:border-r-2">
          {item.build ? (
            <DrinkThumb
              build={item.build as Build}
              fallback={productImage(product ?? { name: label, imageUrl: item.imageUrl })}
              alt={label}
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- same source as the bag and history
            <img
              src={productImage(product ?? { name: label, imageUrl: item.imageUrl })}
              alt={label}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-2 p-5 md:p-6">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-stone2-400">
            <Heart size={12} className="text-bark-700" fill="currentColor" />
            {usual.atThisHour ? 'Your usual at this hour' : 'Your usual'}
          </p>
          <h2 id="usual-heading" className="font-seal text-[30px] leading-tight text-stone2-900">
            {label}
          </h2>
          {item.ticket && (
            <p className="text-[12px] uppercase tracking-[0.1em] text-forest-700">{item.ticket}</p>
          )}
          <p className="text-[13.5px] tabular-nums text-stone2-600">
            Ordered {usual.times} {usual.times === 1 ? 'time' : 'times'}
            {' · '}
            {ago(usual.lastAt)}
            {cup && ` · ${cup}`} · ${Number(item.unitPrice).toFixed(2)}
          </p>

          <div className="mt-auto flex flex-col gap-1.5 pt-3">
            <button
              type="button"
              disabled={soldOut}
              onClick={onRepeat}
              className="btn btn-acid tap-target self-start px-6 py-3 text-[15px] disabled:opacity-50"
            >
              <Coffee size={16} />
              {soldOut ? "Not on today's menu" : 'Order it again'}
            </button>
            {!soldOut && (
              <p className="text-[12px] text-stone2-400">
                You can change the extras and the cup before it goes in the bag.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Thumb({ src, alt, build }: { src: string; alt: string; build?: Build | null }) {
  return (
    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] border-2 border-stone2-900 bg-birch-100">
      {build ? (
        <DrinkThumb build={build} fallback={src} alt={alt} className="h-full w-full" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- same source as the bag and history
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      )}
    </span>
  );
}

function UsualRow({
  usual,
  product,
  onRepeat,
}: {
  usual: Usual;
  product?: Product;
  onRepeat: () => void;
}) {
  const { item } = usual;
  const label = item.name ?? product?.name ?? item.productName;

  return (
    <li className="glass glass-edge flex items-center gap-3 p-3">
      <Thumb
        src={productImage(product ?? { name: label, imageUrl: item.imageUrl })}
        alt={label}
        build={item.build as Build | null}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-stone2-900">{label}</p>
        {item.ticket && (
          <p className="truncate text-[11px] uppercase tracking-[0.1em] text-forest-700">
            {item.ticket}
          </p>
        )}
        <p className="text-[12px] tabular-nums text-stone2-400">
          {usual.times}×{' · '}
          {ago(usual.lastAt)} · ${Number(item.unitPrice).toFixed(2)}
        </p>
      </div>
      <button
        type="button"
        onClick={onRepeat}
        aria-label={`Order ${label} again`}
        className="btn btn-acid tap-target h-11 w-11 shrink-0 justify-center p-0"
      >
        <Plus size={18} />
      </button>
    </li>
  );
}

function SavedRow({
  fav,
  product,
  onRepeat,
}: {
  fav: FavoriteDrink;
  product?: Product;
  onRepeat: () => void;
}) {
  return (
    <li className="glass glass-edge flex items-center gap-3 p-3">
      <Thumb
        src={productImage(product ?? { name: fav.name })}
        alt={fav.name}
        build={fav.build as Build}
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-[15px] font-bold text-stone2-900">
          <Heart size={12} className="shrink-0 text-bark-700" fill="currentColor" />
          {fav.name}
        </p>
        <p className="truncate text-[11px] uppercase tracking-[0.1em] text-forest-700">
          {fav.ticket}
        </p>
        <p className="text-[12px] tabular-nums text-stone2-400">Saved · ${fav.price.toFixed(2)}</p>
      </div>
      <button
        type="button"
        onClick={onRepeat}
        aria-label={`Order ${fav.name} again`}
        className="btn btn-acid tap-target h-11 w-11 shrink-0 justify-center p-0"
      >
        <Plus size={18} />
      </button>
    </li>
  );
}

function RepeatOrder({ order, catalogue }: { order: Order; catalogue: Map<string, Product> }) {
  const reorder = useReorder();
  const openCart = useCartStore((s) => s.openCart);
  const summary = order.items.map((i) => `${i.qty}× ${i.name ?? i.productName}`).join(', ');

  return (
    <section
      aria-labelledby="last-heading"
      className="glass glass-edge flex flex-wrap items-center gap-4 p-4"
    >
      <div className="flex -space-x-3">
        {order.items.slice(0, 4).map((i, n) => (
          <Thumb
            key={n}
            build={i.build as Build | null}
            src={productImage(
              catalogue.get(i.productId) ?? { name: i.name ?? i.productName, imageUrl: i.imageUrl },
            )}
            alt=""
          />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <h2 id="last-heading" className="text-[11px] uppercase tracking-[0.16em] text-stone2-400">
          Last order · {ago(order.createdAt)}
        </h2>
        <p className="truncate text-[14.5px] font-bold text-stone2-900">{summary}</p>
      </div>
      <button
        type="button"
        disabled={reorder.isPending}
        onClick={() =>
          reorder.mutate(order, {
            onSuccess: ({ added, skipped }) => {
              toast.success(
                skipped > 0
                  ? `${added} added. ${skipped} not on today's menu.`
                  : 'Your last order is in the bag',
              );
              openCart();
            },
            onError: (e) => toast.error(e.message),
          })
        }
        className="btn tap-target px-4 py-2.5 text-[14px] disabled:opacity-50"
      >
        <RotateCcw size={14} />
        Repeat it
      </button>
    </section>
  );
}

function FirstVisit() {
  return (
    <section className="glass glass-edge flex flex-col gap-3 p-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-stone2-400">No usual yet</p>
      <h2 className="font-seal text-[26px] leading-tight text-stone2-900">
        Order once, and it waits for you here.
      </h2>
      <p className="text-[14px] text-stone2-600">
        Whatever you order shows up on this page next time, ready to repeat in one tap.
      </p>
      <div className="flex flex-wrap gap-2.5 pt-1">
        <Link href="/menu" className="btn btn-acid tap-target px-5 py-3 text-[15px]">
          Browse the menu
          <ArrowRight size={15} />
        </Link>
        <Link href="/build" className="btn tap-target px-5 py-3 text-[15px]">
          Build your own
        </Link>
      </div>
    </section>
  );
}

function HubSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto max-w-6xl px-5 py-8 md:px-6 md:py-12">
      <div className="mb-6 h-12 w-2/3 animate-pulse rounded bg-birch-100" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="glass glass-edge h-64 animate-pulse" />
        <div className="glass glass-edge h-48 animate-pulse" />
      </div>
    </div>
  );
}
