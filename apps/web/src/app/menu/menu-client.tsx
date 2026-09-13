'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/features/menu/product-card';
import { useProducts, useCategories } from '@/hooks/use-products';
import { BUILD_OWN, BuildYourOwnCard } from '@/components/features/menu/build-your-own-card';

export function MenuClient() {
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const [activeCat, setActiveCat] = useState<string>('all');
  const { data: products = [], isLoading: loadingProds } = useProducts(
    activeCat === 'all' ? undefined : activeCat,
  );

  const loading = loadingCats || loadingProds;
  // Recommended wherever drinks are: on All and on any drinks section.
  const activeName = categories.find((c) => c.id === activeCat)?.name ?? '';
  const showBuild = activeCat === 'all' || /made|coffee|drink|seasonal|tea/i.test(activeName);

  return (
    <>
      {/* Category tabs */}
      {loadingCats ? (
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-24 " />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <Tabs value={activeCat} onValueChange={setActiveCat} className="mb-8">
          <TabsList className="flex h-auto flex-wrap gap-3 bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="btn px-5 py-2 text-[13px] data-[state=active]:bg-neon-500"
            >
              All
            </TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="btn px-5 py-2 text-[13px] data-[state=active]:bg-neon-500"
              >
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

      {/* Product grid */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 " />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-stone2-400 text-sm py-8">
          {categories.length === 0
            ? 'Menu loading — make sure the API is running.'
            : 'No items in this category right now.'}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {showBuild && <BuildYourOwnCard />}
          {products
            // The card above is how Build your own is ordered.
            .filter((p) => p.isAvailable && !BUILD_OWN.test(p.name))
            .map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      )}
    </>
  );
}
