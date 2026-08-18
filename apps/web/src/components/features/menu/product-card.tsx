'use client';

import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import type { Product } from '@/types/api.types';
import { useCartStore } from '@/stores/cart.store';
import { cn } from '@/lib/utils';

interface Props {
  product: Product;
}

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
    <div className="group flex flex-col p-5 bg-white rounded-2xl border border-birch-200 hover:border-forest-300 hover:shadow-sm transition-all">
      {/* Optional image placeholder */}
      {product.imageUrl ? (
        <div className="aspect-video w-full rounded-xl overflow-hidden mb-4 bg-birch-100">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3 mb-1.5">
        <p className="font-bold text-stone2-900 text-sm leading-snug">{product.name}</p>
        <p className="text-bark-500 font-bold text-sm shrink-0">
          ${Number(product.price).toFixed(2)}
        </p>
      </div>

      {product.description && (
        <p className="text-xs text-stone2-400 leading-relaxed flex-1 mb-4">{product.description}</p>
      )}

      <button
        onClick={handleAdd}
        disabled={!product.isAvailable}
        className={cn(
          'mt-auto w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all',
          product.isAvailable
            ? added
              ? 'bg-forest-100 text-forest-700 border border-forest-300'
              : 'bg-forest-700 text-white hover:bg-forest-800'
            : 'bg-birch-100 text-stone2-400 cursor-not-allowed',
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
