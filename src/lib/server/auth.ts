import 'server-only';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { randomBytes } from 'node:crypto';

const COOKIE = 'inventory_session';
const ISSUER = 'stockcontrol';
const AUDIENCE = 'stockcontrol-operator';

function secret(): Uint8Array | null {
  const value = process.env.SESSION_SECRET;
  if (!value || Buffer.byteLength(value, 'utf8') < 32) return null;
  return new TextEncoder().encode(value);
}
function hashVersion(hash: string): string {
  return Buffer.from(hash).toString('base64url');
}

export async function login(password: string): Promise<boolean> {
  const hash = process.env.DASHBOARD_PASSWORD_HASH;
  const key = secret();
  if (!hash || !key || Buffer.byteLength(password, 'utf8') > 72 || !await bcrypt.compare(password, hash)) return false;
  const token = await new SignJWT({ actor: 'operator', v: hashVersion(hash), sid: randomBytes(24).toString('base64url') })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(ISSUER).setAudience(AUDIENCE).setSubject('operator').setIssuedAt().setExpirationTime('8h').sign(key);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 28_800 });
  return true;
}

export async function authenticated(): Promise<boolean> {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    const hash = process.env.DASHBOARD_PASSWORD_HASH;
    const key = secret();
    if (!token || !hash || !key) return false;
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE });
    return payload.sub === 'operator' && payload.actor === 'operator' && payload.v === hashVersion(hash) && typeof payload.sid === 'string';
  } catch { return false; }
}

export async function logout(): Promise<void> { (await cookies()).delete(COOKIE); }

/** The configured canonical origin is mandatory for production mutating endpoints. */
export function validMutationOrigin(request: Request): boolean {
  const value = request.headers.get('origin');
  if (!value) return false;
  const expected = process.env.APP_ORIGIN ?? (process.env.NODE_ENV === 'production' ? undefined : new URL(request.url).origin);
  return Boolean(expected && value === expected);
}
