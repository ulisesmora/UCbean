'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Coffee, Heart, RotateCcw, Sparkles } from 'lucide-react';
import { EN_CURSO } from '@/hooks/use-reorder';
import { favoritesApi, loyaltyApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useFavorites } from '@/hooks/use-favorites';
import { RepeatSheet } from '@/components/features/menu/customise-sheet';
import type { Build } from '@/lib/builder';
import { useBestSellers } from '@/hooks/use-recipes';
import { useHabit, useLastOrder, useReorder } from '@/hooks/use-reorder';
import { productImage } from '@/lib/images';
import type { FavoriteDrink, Order } from '@/types/api.types';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/use-products';

/** Morning, afternoon or evening. Said once, at the top, like a barista would. */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

/**
 * The lane for people who already know what they want.
 *
 * A regular is not browsing. They opened the site to get the same coffee they
 * had on Tuesday, and every screen between them and that is friction. So this
 * sits above everything else the moment you are signed in: your usuals, your
 * last order, your points, and the way to the counter.
 *
 * The café's story still lives below. It is just no longer in the way of
 * the thing you came to do.
 */
export function QuickOrder() {
  const { isAuthenticated, user, accessToken } = useAuthStore();

  // La sesión vive en localStorage, así que el servidor no sabe quién eres y
  // el cliente sí. Pintar esto antes de montar rompería la hidratación.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: favorites = [] } = useFavorites();
  const { bestSellers } = useBestSellers(4);
  const { last } = useLastOrder();
  const habito = useHabit();
  const { data: card } = useQuery({
    queryKey: ['loyalty-me'],
    queryFn: () => loyaltyApi.me(accessToken!),
    enabled: isAuthenticated && !!accessToken,
  });

  if (!mounted || !isAuthenticated) return null;

  const nombre = user?.name?.split(' ')[0] ?? 'there';
  // Un pedido en marcha manda sobre todo lo demás: si tienes un café en la
  // barra, no has entrado a pedir otro.
  const enMarcha = last && EN_CURSO.includes(last.status) ? last : null;

  return (
    <section
      aria-labelledby="quick-order-heading"
      className="border-b-2 border-stone2-900 bg-birch-50"
    >
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-6 md:py-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="quick-order-heading"
              className="text-2xl font-extrabold leading-none text-stone2-900 md:text-3xl"
            >
              {greeting()}, {nombre}.
            </h2>
            {/* Solo si de verdad hay costumbre. Decirle a alguien «lo de
                siempre» la segunda vez que viene suena a que le vigilan. */}
            {habito && (
              <p className="mt-1.5 text-[14px] text-stone2-600">
                Around this time you usually go for <strong>{habito.name}</strong>.
              </p>
            )}
          </div>

          {card && (
            <Link
              href="/rewards"
              className="glass glass-hover flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-stone2-900"
            >
              <Sparkles size={14} className="text-forest-700" />
              <span className="tabular-nums">{card.points}</span> points
            </Link>
          )}
        </div>

        {enMarcha && (
          <div className="mb-5">
            <OrderInProgress order={enMarcha} />
          </div>
        )}

        {/* Una fila que se desliza con el pulgar. En móvil una rejilla obligaría
            a hacer scroll vertical para ver la tercera bebida. */}
        <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
          {last && <ReorderCard order={last} />}

          {favorites.slice(0, 4).map((f) => (
            <FavoriteCard key={f.id} fav={f} />
          ))}

          {/* Sin favoritas ni pedidos, se enseña lo que más se pide: es un
              punto de partida real, no una tarjeta vacía pidiendo perdón. */}
          {!last &&
            favorites.length === 0 &&
            bestSellers
              .slice(0, 3)
              .map((r) => <PopularCard key={r.id} slug={r.id} name={r.name} />)}

          <Link
            href="/menu"
            className="glass glass-edge glass-hover flex min-w-[150px] shrink-0 snap-start flex-col justify-between rounded-lg p-4"
          >
            <Coffee size={20} className="text-stone2-400" strokeWidth={1.6} />
            <span className="mt-3 text-[14.5px] font-bold leading-tight text-stone2-900">
              Something else
              <ArrowRight size={14} className="ml-1 inline" />
            </span>
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link href="/pickup" className="btn btn-acid tap-target px-6 py-3 text-[15px]">
            Order for pickup
          </Link>
          <Link href="/build" className="btn tap-target px-5 py-3 text-[15px]">
            Build your own
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Una tarjeta del ancho del pulgar, igual para las tres variantes. */
function Tile({
  onClick,
  href,
  disabled,
  children,
}: {
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const clase =
    'glass glass-edge glass-hover tap-target flex min-w-[190px] max-w-[190px] shrink-0 snap-start flex-col justify-between rounded-lg p-4 text-left disabled:opacity-50';
  if (href) {
    return (
      <Link href={href} className={clase}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={clase}>
      {children}
    </button>
  );
}

function ReorderCard({ order }: { order: Order | undefined }) {
  const reorder = useReorder();
  const { data: products } = useProducts();
  if (!order) return null;

  const first = order.items[0];
  const foto = first
    ? productImage(
        products?.find((p) => p.id === first.productId) ?? {
          name: first.name ?? first.productName,
          imageUrl: first.imageUrl,
        },
      )
    : null;
  const resumen = order.items.map((i) => `${i.qty}× ${i.name ?? i.productName}`).join(', ');

  return (
    <Tile
      disabled={reorder.isPending}
      onClick={() =>
        reorder.mutate(order, {
          onSuccess: ({ added, skipped }) =>
            toast.success(
              skipped > 0
                ? `${added} added. ${skipped} not on today's menu.`
                : 'Your last order is in the bag',
            ),
          onError: (e) => toast.error(e.message),
        })
      }
    >
      <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-stone2-400">
        <RotateCcw size={12} />
        Last time
      </span>
      <span className="mt-2 flex items-center gap-2.5">
        {foto && (
          // eslint-disable-next-line @next/next/no-img-element -- del CDN del API
          <img
            src={foto}
            alt=""
            className="h-10 w-10 shrink-0 rounded-md border-2 border-stone2-900 object-cover"
          />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-bold leading-tight text-stone2-900">
            {resumen}
          </span>
          <span className="block text-[12px] tabular-nums text-stone2-600">
            ${Number(order.total).toFixed(2)} · order again
          </span>
        </span>
      </span>
    </Tile>
  );
}

function FavoriteCard({ fav }: { fav: FavoriteDrink }) {
  const [open, setOpen] = useState(false);
  const { accessToken } = useAuthStore();
  return (
    <>
      <Tile onClick={() => setOpen(true)}>
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-stone2-400">
          <Heart size={12} className="text-bark-700" fill="currentColor" />
          Your usual
        </span>
        <span className="mt-2 block">
          <span className="block truncate text-[15px] font-bold leading-tight text-stone2-900">
            {fav.name}
          </span>
          <span className="block truncate text-[11px] uppercase tracking-[0.08em] text-forest-700">
            {fav.ticket}
          </span>
          <span className="block text-[12px] tabular-nums text-stone2-600">
            ${fav.price.toFixed(2)}
          </span>
        </span>
      </Tile>
      <RepeatSheet
        line={{
          productId: fav.productId,
          label: fav.name,
          build: fav.build as Build,
          recipeId: fav.recipeId,
        }}
        open={open}
        onOpenChange={setOpen}
        onAdded={() => {
          if (accessToken) favoritesApi.markOrdered(fav.id, accessToken).catch(() => undefined);
        }}
      />
    </>
  );
}

function PopularCard({ slug, name }: { slug: string; name: string }) {
  return (
    <Tile href={`/build?recipe=${slug}`}>
      <span className="text-[11px] uppercase tracking-[0.16em] text-stone2-400">Most ordered</span>
      <span className="mt-2 block text-[15px] font-bold leading-tight text-stone2-900">{name}</span>
    </Tile>
  );
}

/** An order still on its way. It outranks everything else on the page. */
export function OrderInProgress({ order }: { order: Order }) {
  return (
    <Link
      href={`/order/${order.id}`}
      className="flex items-center gap-3 rounded-lg border-2 border-stone2-900 bg-neon-500 p-4"
    >
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-stone2-900"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold leading-tight text-stone2-900">
          {order.status === 'READY' ? 'Your order is ready' : 'Your order is on the bar'}
        </span>
        <span className="block text-[12.5px] text-stone2-900/70">
          {order.items.map((i) => `${i.qty}× ${i.name ?? i.productName}`).join(', ')}
        </span>
      </span>
      <ArrowRight size={17} className="shrink-0 text-stone2-900" />
    </Link>
  );
}
