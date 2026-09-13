'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Quality } from '@/lib/device-quality';

/**
 * The tier a scene is rendering at, readable from any object inside the
 * Canvas. Provided inside it on purpose: React context does not cross into
 * the three.js renderer from outside unless it is bridged.
 */
export const QualityContext = createContext<Quality>('high');
export const useQuality = () => useContext(QualityContext);

/** How long after the animation ends rendering stops: camera and steam settle first. */
const SETTLE_MS = 1200;

/**
 * When a scene draws.
 *
 * - 'always' while something is playing and it is on screen.
 * - 'demand' once it has finished. The last frame stays on the canvas, and
 *   three.js only draws again when React changes something: a new choice,
 *   a resize.
 * - 'never' while it is scrolled out of view or the tab is hidden.
 *
 * Before this, every scene drew 60 frames a second forever, whether anything
 * moved or anyone could see it. That was the single biggest cost of the 3D.
 *
 * `wake` is whatever changes what the scene shows: changing it starts
 * rendering again until the scene reports it is done.
 */
export function useSceneLoop(...wake: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [settled, setSettled] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    // A little margin, so it is already drawing as it scrolls in.
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      rootMargin: '120px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setTabVisible(document.visibilityState !== 'hidden');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    setSettled(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller decides what wakes it
  }, wake);

  useEffect(() => () => clearTimeout(timer.current), []);

  /** The scene calls this when its animation has finished. */
  const markDone = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSettled(true), SETTLE_MS);
  }, []);

  const frameloop: 'always' | 'demand' | 'never' =
    !onScreen || !tabVisible ? 'never' : settled ? 'demand' : 'always';

  return { ref, frameloop, markDone };
}
