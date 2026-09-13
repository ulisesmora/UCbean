'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useDrinkSprites } from '@/lib/drink-sprites';

const SpriteRenderer = dynamic(() => import('@/components/features/builder/sprite-renderer'), {
  ssr: false,
});

/**
 * Mounts the drink sprite renderer the first time a thumbnail asks for one,
 * and keeps it: pages with no drink thumbnails never download three.js for it.
 * Without WebGL it never mounts, and thumbnails keep their photos.
 */
export function DrinkSpriteHost() {
  const pending = useDrinkSprites((s) => s.queue.length > 0);
  const [needed, setNeeded] = useState(false);

  useEffect(() => {
    if (pending && !needed && 'WebGLRenderingContext' in window) setNeeded(true);
  }, [pending, needed]);

  return needed ? <SpriteRenderer /> : null;
}
