import { timingSafeEqual } from 'node:crypto';
import { CSRF_HEADER } from '@flex/contracts';
import type { Request, RequestHandler } from 'express';
import { sendProblem } from '../problem';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function sameValue(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function originOf(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

/**
 * Valida a origem declarada pelo navegador em operações mutáveis. A ausência de `Origin`
 * e `Referer` não é recusada aqui: clientes que não são navegadores ainda precisam
 * apresentar o token CSRF da sessão.
 */
export function createOriginMiddleware(
  allowedOrigins: readonly string[],
): RequestHandler {
  const allowed = new Set(allowedOrigins);
  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }
    const declared =
      req.headers.origin ?? originOf(req.headers.referer) ?? undefined;
    if (declared && !allowed.has(declared)) {
      sendProblem(req, res, 'CSRF_VALIDATION_FAILED');
      return;
    }
    next();
  };
}

/**
 * Exige o token CSRF vinculado à sessão em operações mutáveis autenticadas. Deve ser
 * aplicada depois da autenticação e antes do controller. Sem sessão resolvida, não há
 * token a validar (por exemplo, logout idempotente) e a requisição prossegue.
 */
export const csrfProtection: RequestHandler = (req, res, next) => {
  if (SAFE_METHODS.has(req.method) || !req.auth) {
    next();
    return;
  }
  const received = headerValue(req, CSRF_HEADER);
  if (!received || !sameValue(received, req.auth.csrfToken)) {
    sendProblem(req, res, 'CSRF_VALIDATION_FAILED');
    return;
  }
  next();
};

function headerValue(req: Request, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}
