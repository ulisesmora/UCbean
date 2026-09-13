import { create } from 'zustand';
import type { Build } from './builder';

/** Frames in one full turn of a drink. */
export const SPRITE_FRAMES = 16;
/** Pixel size of one frame. Big enough for the Build your own card, small enough to cache. */
export const SPRITE_SIZE = 256;

/** The same drink, whatever order its extras were picked in, shares one sprite. */
export function buildKey(b: Build): string {
  return JSON.stringify([
    b.beans,
    b.size,
    b.base,
    b.serve,
    b.milk,
    b.foam,
    b.art,
    [...b.extras].sort(),
    b.vessel,
    b.sleeve,
  ]);
}

interface SpriteState {
  /** Sprite sheets by drink, as data URLs. An empty string means rendering failed. */
  sprites: Record<string, string>;
  queue: { key: string; build: Build }[];
  request: (build: Build) => void;
  done: (key: string, url: string) => void;
}

/**
 * Turning drink thumbnails, rendered once per drink and shared everywhere.
 *
 * A live WebGL canvas per thumbnail would hit the browser's cap on contexts
 * the moment the bag held a few drinks. Instead one hidden renderer draws each
 * drink turning, frame by frame, into a sprite sheet, and every thumbnail on
 * the page plays that sheet as a plain CSS animation: no GPU work while it
 * plays, and it sits under dialogs and sheets like any image.
 */
export const useDrinkSprites = create<SpriteState>((set, get) => ({
  sprites: {},
  queue: [],
  request: (build) => {
    const key = buildKey(build);
    const s = get();
    if (key in s.sprites || s.queue.some((q) => q.key === key)) return;
    set({ queue: [...s.queue, { key, build }] });
  },
  done: (key, url) =>
    set((s) => ({
      sprites: { ...s.sprites, [key]: url },
      queue: s.queue.filter((q) => q.key !== key),
    })),
}));
