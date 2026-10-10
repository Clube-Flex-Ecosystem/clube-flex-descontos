import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reutiliza o identificador recebido somente quando está no formato aceito. */
export function resolveRequestId(
  received: string | string[] | undefined,
): string {
  const candidate = Array.isArray(received) ? received[0] : received;
  return candidate && UUID_PATTERN.test(candidate)
    ? candidate.toLowerCase()
    : randomUUID();
}

export function createHttpLogger(logger: Logger) {
  return pinoHttp({
    logger,
    genReqId(req: IncomingMessage, res: ServerResponse) {
      const id = resolveRequestId(req.headers['x-request-id']);
      res.setHeader('x-request-id', id);
      return id;
    },
    customAttributeKeys: { reqId: 'requestId' },
    // Também vincula o requestId ao logger filho (req.log), para correlacionar erros.
    customProps: (req) => ({ requestId: req.id }),
    // Lista positiva: método, caminho sem query string e status. Sem corpo, cookies, IP ou cabeçalhos.
    serializers: {
      req: (req: { method: string; url: string }) => ({
        method: req.method,
        path: req.url.split('?')[0],
      }),
      res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
    },
    customLogLevel(_req, res, error) {
      if (error || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  });
}
