import { useState } from 'react';

/**
 * How much 3D a device can take.
 *
 * - high: a desktop or a strong phone. The full scene: real refraction, the
 *   blurred café behind the cup, sharper pixels on dense screens.
 * - mid: an ordinary phone. The same scene with see-through glass instead of
 *   refraction, a plain backdrop and fewer particles. Same look at a glance,
 *   a fraction of the GPU work.
 * - low: no WebGL, data saving or a 2G connection, or a truly weak device
 *   (1 GB of memory or 2 cores). A real photo where the 3D would be. The
 *   drink builder keeps its 3D, rendered as mid, because there it is the product.
 *
 * Reduced motion is not a reason to drop to a photo: the lighter scene still
 * shows the drink and its extras, and anything that loops honours the setting
 * on its own. Treating it, and ordinary 2-3 GB Android phones, as "low" hid
 * the 3D and the extras animation from too many real customers.
 *
 * Add `?quality=low`, `mid` or `high` to any URL to force a tier on a real
 * phone. It is kept for that browser tab.
 */
export type Quality = 'high' | 'mid' | 'low';

export interface QualitySignals {
  reducedMotion: boolean;
  saveData: boolean;
  slowNetwork: boolean;
  /** GB, rounded down by the browser. Chromium only; Safari reports nothing. */
  deviceMemory?: number;
  cores?: number;
  coarsePointer: boolean;
  webgl: boolean;
}

/** The tier for a set of signals. Pure, so it can be tested without a browser. */
export function qualityFrom(s: QualitySignals): Quality {
  if (!s.webgl || s.saveData || s.slowNetwork) return 'low';
  const weak =
    (s.deviceMemory !== undefined && s.deviceMemory <= 1) ||
    (s.cores !== undefined && s.cores <= 2);
  if (weak) return 'low';
  const modest =
    s.reducedMotion ||
    s.coarsePointer ||
    (s.deviceMemory !== undefined && s.deviceMemory <= 4) ||
    (s.cores !== undefined && s.cores <= 4);
  return modest ? 'mid' : 'high';
}

const KEY = 'atb:quality';
const isQuality = (v: unknown): v is Quality => v === 'high' || v === 'mid' || v === 'low';
let cached: Quality | null = null;

/** Reads the device once per page load. On the server it answers mid. */
export function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'mid';
  if (cached) return cached;

  try {
    const forced = new URLSearchParams(window.location.search).get('quality');
    if (isQuality(forced)) sessionStorage.setItem(KEY, forced);
    const stored = sessionStorage.getItem(KEY);
    if (isQuality(stored)) return (cached = stored);
  } catch {
    // Storage blocked: fall through to detection.
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const media = (query: string) => window.matchMedia?.(query).matches ?? false;

  cached = qualityFrom({
    reducedMotion: media('(prefers-reduced-motion: reduce)'),
    saveData: Boolean(nav.connection?.saveData),
    slowNetwork: /(^|-)2g$/.test(nav.connection?.effectiveType ?? ''),
    deviceMemory: nav.deviceMemory,
    cores: nav.hardwareConcurrency,
    coarsePointer: media('(pointer: coarse)'),
    // Checked by name, not by opening a context: creating one just to ask
    // costs memory and browsers cap how many a page may hold.
    webgl: 'WebGLRenderingContext' in window,
  });
  return cached;
}

/**
 * The tier, for components that only render on the client (the 3D scenes,
 * dialogs, things mounted once visible), so reading it on first render
 * cannot mismatch the server's HTML.
 */
export function useDeviceQuality(): Quality {
  const [quality] = useState(detectQuality);
  return quality;
}
