'use client';

import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import type { Product } from '@/types/api.types';
import { useCartStore } from '@/stores/cart.store';
import { cn } from '@/lib/utils';
import { Photo } from '@/components/ui/photo';

interface Props {
  product: Product;
}

/**
 * Until each product has its own shot, drinks share the house photography by
 * category. Set `Product.imageUrl` and it wins over this map.
 */
const MENU_PHOTO: Record<string, string> = {
  'Pour Over': 'espresso-pull.jpg',
  'V60 Pour-Over': 'espresso-pull.jpg',
  Cortado: 'coffee-bar.jpg',
  'Flat White': 'coffee-bar.jpg',
  Americano: 'menu-board.jpg',
  'Cold Brew': 'terrace.jpg',
  'Batch Brew': 'morning-rush.jpg',
};

export function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="glass glass-edge glass-hover group flex flex-col p-5 transition-transform duration-300 hover:scale-[1.015]">
      <Photo
        src={product.imageUrl ?? MENU_PHOTO[product.name] ?? 'coffee-bar.jpg'}
        label={product.name}
        alt={`${product.name} at the bar`}
        className="mb-5 aspect-square w-full"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
      />

      <div className="flex items-start justify-between gap-3 mb-1.5">
        <p className="font-seal text-[17px] leading-snug text-stone2-900">{product.name}</p>
        <p className="shrink-0 font-mono text-[15px] font-bold tabular-nums text-stone2-900">
          ${Number(product.price).toFixed(2)}
        </p>
      </div>

      {product.description && (
        <p className="mb-5 flex-1 font-mono text-[11px] leading-relaxed text-stone2-400">
          {product.description}
        </p>
      )}

      <button
        onClick={handleAdd}
        disabled={!product.isAvailable}
        className={cn(
          'btn mt-auto w-full py-2.5 text-[13px]',
          product.isAvailable
            ? added
              ? 'bg-forest-100'
              : 'btn-acid'
            : 'cursor-not-allowed bg-birch-100 text-stone2-400',
        )}
      >
        {!product.isAvailable ? (
          'Unavailable'
        ) : added ? (
          <>
            <Check size={13} />
            Added
          </>
        ) : (
          <>
            <Plus size={13} />
            Add to order
          </>
        )}
      </button>
    </div>
  );
}
