import type { Request, Response } from 'express';

/**
 * Prefixo `__Host-` exige `Secure`, `Path=/` e ausência de `Domain`, mantendo o cookie
 * restrito ao host da API (ADR-0004). `SameSite=Strict` basta porque painel e API são
 * do mesmo site.
 */
export const SESSION_COOKIE = '__Host-session';

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
} as const;

export function readAuthToken(req: Request): string | undefined {
  const value = req.cookies?.[SESSION_COOKIE] as unknown;
  return typeof value === 'string' && value ? value : undefined;
}

export function setAuthCookie(
  res: Response,
  token: string,
  expiresAt: Date,
): void {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}
