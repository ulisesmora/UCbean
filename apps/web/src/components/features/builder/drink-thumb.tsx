'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Build } from '@/lib/builder';
import { RECIPES } from '@/lib/recipes';
import { buildKey, SPRITE_FRAMES, useDrinkSprites } from '@/lib/drink-sprites';

/** Prepared drinks the Build your own thumbnail turns through before anything is built. */
const SHOWCASE: Build[] = RECIPES.slice(0, 6).map((r) => r.build);

/**
 * A drink, turning, in place of a photo.
 *
 * With a formula it shows that exact drink: the one in the bag, in an order, in
 * a usual. Without one it turns through a few prepared drinks, changing every
 * few seconds, which is what Build your own is about. The photo shows until the
 * drink's sprite is ready, and stays if 3D is not available at all.
 */
export function DrinkThumb({
  build,
  fallback,
  alt,
  className = '',
  cycleMs = 4000,
}: {
  build?: Build | null;
  fallback: string | null;
  alt: string;
  className?: string;
  cycleMs?: number;
}) {
  const builds = useMemo(() => (build ? [build] : SHOWCASE), [build]);
  const keys = builds.map(buildKey).join('|');
  const request = useDrinkSprites((s) => s.request);
  const [index, setIndex] = useState(0);
  const current = builds[index % builds.length];
  const key = current ? buildKey(current) : '';
  const sprite = useDrinkSprites((s) => (key ? s.sprites[key] : undefined));

  useEffect(() => {
    builds.forEach(request);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the drinks, not the array
  }, [keys, request]);

  useEffect(() => {
    if (builds.length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => i + 1), cycleMs);
    return () => window.clearInterval(timer);
  }, [builds.length, cycleMs]);

  return (
    <span role="img" aria-label={alt} className={`relative block overflow-hidden ${className}`}>
      {sprite ? (
        // A square stage in the middle, so a wide or tall slot never stretches the drink.
        <span
          key={key}
          aria-hidden="true"
          className="drink-sprite absolute left-1/2 top-1/2 aspect-square h-full -translate-x-1/2 -translate-y-1/2"
          style={{
            backgroundImage: `url(${sprite})`,
            backgroundSize: `${SPRITE_FRAMES * 100}% 100%`,
          }}
        />
      ) : (
        fallback && (
          // eslint-disable-next-line @next/next/no-img-element -- stand-in until the drink is rendered
          <img src={fallback} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )
      )}
    </span>
  );
}
