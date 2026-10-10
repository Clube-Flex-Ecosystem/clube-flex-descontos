import { CSRF_HEADER } from '@flex/contracts';
import type { RequestHandler } from 'express';

/**
 * CORS com credenciais para origens declaradas explicitamente; `*` nunca é usado.
 * Origens desconhecidas não recebem cabeçalhos, e o navegador bloqueia a leitura.
 */
export function createCorsMiddleware(
  allowedOrigins: readonly string[],
): RequestHandler {
  const allowed = new Set(allowedOrigins);
  return (req, res, next) => {
    const origin = req.headers.origin;
    res.vary('Origin');
    if (!origin || !allowed.has(origin)) {
      next();
      return;
    }

    res.setHeader('access-control-allow-origin', origin);
    res.setHeader('access-control-allow-credentials', 'true');
    res.setHeader(
      'access-control-expose-headers',
      `${CSRF_HEADER}, x-request-id, retry-after, etag`,
    );

    if (req.method === 'OPTIONS') {
      res.setHeader(
        'access-control-allow-methods',
        'GET, POST, PUT, PATCH, DELETE',
      );
      res.setHeader(
        'access-control-allow-headers',
        `content-type, ${CSRF_HEADER}, if-match`,
      );
      res.setHeader('access-control-max-age', '600');
      res.status(204).end();
      return;
    }
    next();
  };
}
