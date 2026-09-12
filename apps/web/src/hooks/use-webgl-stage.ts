'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Guards a WebGL canvas.
 *
 * A browser allows only a handful of live WebGL contexts per page, and the
 * driver drops the oldest when memory runs short. Two scenes mounted at once,
 * plus the contexts a dev-mode hot reload leaves behind, is enough to hit that
 * ceiling. When it does, every canvas on the page goes blank at once and the
 * only clue is `THREE.WebGLRenderer: Context Lost`.
 *
 * So: mount only while the section is actually on screen, unmount once it is
 * well out of the way, and remount on a fresh key if the context is lost.
 */
export function useWebglStage<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [mounted, setMounted] = useState(false);
  /** Bumped on context loss, so React rebuilds the canvas from scratch. */
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setMounted(entry.isIntersecting),
      // Generous margin: mount before it is visible, release well after.
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !mounted) return;

    const onLost = (event: Event) => {
      // Preventing the default is what lets the context be restored at all.
      event.preventDefault();
      setGeneration((g) => g + 1);
    };

    // The canvas is created by the renderer, so it may not exist on this tick.
    let canvas: HTMLCanvasElement | null = null;
    const attach = () => {
      canvas = el.querySelector('canvas');
      canvas?.addEventListener('webglcontextlost', onLost);
    };
    const id = window.setTimeout(attach, 0);

    return () => {
      window.clearTimeout(id);
      canvas?.removeEventListener('webglcontextlost', onLost);
    };
  }, [mounted, generation]);

  return { ref, mounted, generation };
}
