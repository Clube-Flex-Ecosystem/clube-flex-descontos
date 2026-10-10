import type { Request, Response } from 'express';
import { sendProblem } from './problem';

/**
 * Versão conhecida pelo cliente, vinda de `If-Match` (`"3"`, `W/"3"` ou `3`). Sem um valor
 * válido responde `428 RESOURCE_VERSION_REQUIRED` e retorna `undefined`.
 */
export function readExpectedVersion(
  req: Request,
  res: Response,
): number | undefined {
  const header = req.headers['if-match'];
  const raw = Array.isArray(header) ? header[0] : header;
  const match = raw ? /^(?:W\/)?"?(\d+)"?$/.exec(raw.trim()) : null;
  if (!match) {
    sendProblem(req, res, 'RESOURCE_VERSION_REQUIRED');
    return undefined;
  }
  return Number(match[1]);
}

/** Representação de um recurso versionado: `version` no corpo e o mesmo valor em `ETag`. */
export function sendVersioned<T extends { version: number }>(
  res: Response,
  body: T,
  status = 200,
): void {
  res.setHeader('etag', `"${body.version}"`);
  res.status(status).json(body);
}
