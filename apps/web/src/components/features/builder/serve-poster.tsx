'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { sceneOf } from '@/lib/builder';
import { useDeviceQuality } from '@/lib/device-quality';

const BuilderCup = dynamic(() => import('./builder-cup'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 size={20} className="animate-spin text-stone2-400" />
    </div>
  ),
});

/**
 * What stands in for a 3D scene on a low-power device.
 *
 * A real photo of the product, set down with a small spring each time it is
 * served, so tapping Add still has its moment. It reports completion on the
 * same cue the scenes use, so a dialog waiting for "served" closes the same
 * way on every device. No three.js is downloaded for it.
 */
export function ServePoster({
  src,
  alt,
  replay = 0,
  onComplete,
}: {
  src: string;
  alt: string;
  replay?: number;
  onComplete?: () => void;
}) {
  const done = useRef(onComplete);
  done.current = onComplete;

  useEffect(() => {
    const t = setTimeout(() => done.current?.(), replay > 0 ? 700 : 450);
    return () => clearTimeout(t);
  }, [replay]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-birch-100">
      {/* eslint-disable-next-line @next/next/no-img-element -- same source the menu card uses */}
      <motion.img
        key={replay}
        src={src}
        alt={alt}
        initial={{ scale: 1.06, y: -10, opacity: 0.7 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}

type Scene = ReturnType<typeof sceneOf>;

/**
 * The cup in 3D, or its photo on a low-power device.
 *
 * For places where the 3D is decoration: the seasonal showcase and the order
 * tracker. The drink builder mounts the 3D directly, because there it is the
 * product and a weak device still gets it, rendered lighter.
 */
export function AdaptiveCup({
  poster,
  posterAlt,
  ...cup
}: {
  scene: Scene;
  stage: number;
  animate: boolean;
  replay?: number;
  onComplete?: () => void;
  poster: string;
  posterAlt: string;
}) {
  const quality = useDeviceQuality();
  if (quality === 'low') {
    return (
      <ServePoster src={poster} alt={posterAlt} replay={cup.replay} onComplete={cup.onComplete} />
    );
  }
  return <BuilderCup {...cup} />;
}
