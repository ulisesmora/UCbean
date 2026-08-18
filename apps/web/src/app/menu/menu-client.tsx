'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/features/menu/product-card';
import { useProducts, useCategories } from '@/hooks/use-products';

export function MenuClient() {
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const [activeCat, setActiveCat] = useState<string>('all');
  const { data: products = [], isLoading: loadingProds } = useProducts(
    activeCat === 'all' ? undefined : activeCat,
  );

  const loading = loadingCats || loadingProds;

  return (
    <>
      {/* Category tabs */}
      {loadingCats ? (
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <Tabs value={activeCat} onValueChange={setActiveCat} className="mb-8">
          <TabsList className="h-auto bg-transparent p-0 flex flex-wrap gap-2">
            <TabsTrigger
              value="all"
              className="rounded-full px-5 py-2 text-xs font-semibold border border-birch-200 data-[state=active]:bg-forest-700 data-[state=active]:text-white data-[state=active]:border-forest-700 bg-white text-stone2-600"
            >
              All
            </TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="rounded-full px-5 py-2 text-xs font-semibold border border-birch-200 data-[state=active]:bg-forest-700 data-[state=active]:text-white data-[state=active]:border-forest-700 bg-white text-stone2-600"
              >
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

      {/* Product grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-stone2-400 text-sm py-8">
          {categories.length === 0
            ? 'Menu loading — make sure the API is running.'
            : 'No items in this category right now.'}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products
            .filter((p) => p.isAvailable)
            .map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      )}
    </>
  );
}
