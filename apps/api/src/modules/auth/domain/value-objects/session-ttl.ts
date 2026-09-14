import { Role } from '../../../users/domain/value-objects/role.enum';

/**
 * How long a sign-in lasts.
 *
 * Customers stay signed in for a month: they order from their phone and should
 * not be asked for a password every morning. Staff sessions last a day, since
 * the counter tablet is shared and a forgotten session is the real risk.
 *
 * Access and refresh tokens share it. The web and the API sit on different
 * sites, and browsers that block third-party cookies never send the refresh
 * cookie back, so the access token alone has to carry the session.
 */
export function sessionTtlSeconds(role: Role | string): number {
  return role === Role.CUSTOMER ? 30 * 24 * 3600 : 24 * 3600;
}
