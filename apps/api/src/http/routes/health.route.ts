import { Router } from 'express';
import type { HealthStatus } from '@flex/contracts';
import { HttpError } from '../../errors/app-error';

export type ReadinessCheck = () => Promise<void>;

export function createHealthRouter(checkReadiness: ReadinessCheck): Router {
  const router = Router();

  // Processo ativo: não depende de nenhum recurso externo.
  router.get('/live', (_req, res) => {
    const body: HealthStatus = { status: 'ok' };
    res.json(body);
  });

  // Prontidão: depende da conexão com o PostgreSQL.
  router.get('/ready', async (req, res) => {
    await checkReadiness().catch((error: unknown) => {
      req.log.warn({ err: error }, 'API não está pronta');
      throw new HttpError('SERVICE_UNAVAILABLE');
    });
    const body: HealthStatus = { status: 'ok' };
    res.json(body);
  });

  return router;
}
