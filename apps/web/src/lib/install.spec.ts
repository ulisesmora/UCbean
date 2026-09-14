import { describe, expect, it } from 'vitest';
import { installContext } from './install';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0 Mobile/15E148 Safari/604.1';
const IPHONE_INSTAGRAM = `${IPHONE_SAFARI} Instagram 350.0.0.0`;
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Mobile Safari/537.36';
const MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15';

const ctx = (ua: string, extra: Partial<Parameters<typeof installContext>[0]> = {}) =>
  installContext({ ua, standalone: false, hasPrompt: false, ...extra });

describe('installContext', () => {
  it('knows an app opened from the home screen', () => {
    expect(ctx(IPHONE_SAFARI, { standalone: true })).toBe('installed');
  });

  it('tells Safari from other iPhone browsers', () => {
    expect(ctx(IPHONE_SAFARI)).toBe('ios-safari');
    expect(ctx(IPHONE_CHROME)).toBe('ios-other');
  });

  it('catches in-app browsers before anything else', () => {
    expect(ctx(IPHONE_INSTAGRAM)).toBe('in-app');
  });

  it('uses the install dialog on Android when there is one', () => {
    expect(ctx(ANDROID_CHROME, { hasPrompt: true })).toBe('prompt');
    expect(ctx(ANDROID_CHROME)).toBe('android');
  });

  it('treats an iPad that reports as a Mac as iOS', () => {
    expect(ctx(MAC, { touchMac: true })).toBe('ios-safari');
    expect(ctx(MAC)).toBe('desktop');
  });
});
