/**
 * Whether a stored access token has run out.
 *
 * Only reads the `exp` claim, it does not verify the signature: the API does
 * that. A token that cannot be read counts as expired.
 */
// ponytail: same helper as apps/web/src/lib/jwt.ts; move to packages/shared if a third app needs it.
export function isTokenExpired(token: string, now = Date.now()): boolean {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(part)) as { exp?: number };
    return typeof exp === 'number' && exp * 1000 <= now;
  } catch {
    return true;
  }
}
