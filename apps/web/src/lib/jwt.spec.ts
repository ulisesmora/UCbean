import { describe, expect, it } from 'vitest';
import { isTokenExpired } from './jwt';

const token = (claims: object) =>
  `h.${btoa(JSON.stringify(claims)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')}.s`;

describe('isTokenExpired', () => {
  it('is false before exp and true after', () => {
    const t = token({ sub: 'u', exp: 1_000 });
    expect(isTokenExpired(t, 999_000)).toBe(false);
    expect(isTokenExpired(t, 1_000_000)).toBe(true);
  });

  it('treats an unreadable token as expired', () => {
    expect(isTokenExpired('not-a-jwt')).toBe(true);
  });
});
