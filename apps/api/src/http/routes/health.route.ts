import { Router } from 'express';
import type { HealthStatus } from '@flex/contracts';
import { sendProblem } from '../problem';

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
    try {
      await checkReadiness();
    } catch (error) {
      req.log.warn({ err: error }, 'API não está pronta');
      sendProblem(req, res, 'SERVICE_UNAVAILABLE');
      return;
    }
    const body: HealthStatus = { status: 'ok' };
    res.json(body);
  });

  return router;
}
