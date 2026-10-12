import { jwtVerify, SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';

const TOKEN_TTL_SECONDS = 8 * 60 * 60;
let key: Uint8Array | undefined;

export function configureJwt(secret: string): void {
  key = new TextEncoder().encode(secret);
}

function signingKey(): Uint8Array {
  if (!key) throw new Error('JWT não configurado');
  return key;
}

export interface AuthToken {
  userId: string;
  authVersion: number;
}

export async function issueAuthToken(
  payload: AuthToken,
  now: Date,
): Promise<{ token: string; expiresAt: Date }> {
  const issuedAt = Math.floor(now.getTime() / 1000);
  const expiresAt = new Date((issuedAt + TOKEN_TTL_SECONDS) * 1000);
  const token = await new SignJWT({ authVersion: payload.authVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setJti(randomUUID())
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + TOKEN_TTL_SECONDS)
    .sign(signingKey());
  return { token, expiresAt };
}

export async function verifyAuthToken(
  token: string,
  now: Date,
): Promise<AuthToken | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      algorithms: ['HS256'],
      currentDate: now,
    });
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.authVersion !== 'number'
    ) {
      return null;
    }
    return { userId: payload.sub, authVersion: payload.authVersion };
  } catch {
    return null;
  }
}
