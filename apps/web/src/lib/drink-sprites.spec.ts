import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_BUILD } from './builder';
import { buildKey, useDrinkSprites } from './drink-sprites';

describe('buildKey', () => {
  it('ignores the order extras were picked in', () => {
    const a = { ...DEFAULT_BUILD, extras: ['cream', 'cinnamon'] };
    const b = { ...DEFAULT_BUILD, extras: ['cinnamon', 'cream'] };
    expect(buildKey(a)).toBe(buildKey(b));
  });

  it('tells different drinks apart', () => {
    expect(buildKey(DEFAULT_BUILD)).not.toBe(buildKey({ ...DEFAULT_BUILD, milk: 'soy' }));
  });
});

describe('sprite queue', () => {
  beforeEach(() => useDrinkSprites.setState({ sprites: {}, queue: [] }));

  it('queues a drink once, however many thumbnails ask for it', () => {
    const { request } = useDrinkSprites.getState();
    request(DEFAULT_BUILD);
    request({ ...DEFAULT_BUILD });
    expect(useDrinkSprites.getState().queue).toHaveLength(1);
  });

  it('never re-queues a drink whose render failed', () => {
    const { request, done } = useDrinkSprites.getState();
    request(DEFAULT_BUILD);
    done(buildKey(DEFAULT_BUILD), '');
    request(DEFAULT_BUILD);
    expect(useDrinkSprites.getState().queue).toHaveLength(0);
  });
});
