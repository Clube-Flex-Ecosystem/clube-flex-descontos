import { Router } from 'express';
import { publicContactRequestSchema } from '@flex/contracts';
import type { PublicContactService } from '../../modules/leads/public-contact.service';
import { OutdatedConsentError } from '../../modules/leads/public-contact.service';
import { parseBody } from '../validation';
import { sendProblem } from '../problem';
import {
  ProgressiveLimiter,
  rateLimit,
} from '../middlewares/rate-limit.middleware';

export function createPublicContactRouter(
  service: PublicContactService,
): Router {
  const router = Router();
  const limiter = new ProgressiveLimiter({
    freeAttempts: 5,
    baseLockMs: 60_000,
    maxLockMs: 15 * 60_000,
    decayMs: 60 * 60_000,
  });
  router.use((_req, res, next) => {
    res.setHeader('cache-control', 'no-store');
    next();
  });
  router.get('/contact-consent', (_req, res) => res.json(service.consent()));
  router.post(
    '/contact-requests',
    rateLimit({
      limiter,
      key: (req) => req.ip,
      count: 'always',
    }),
    async (req, res) => {
      const body = parseBody(publicContactRequestSchema, req.body);
      if (!body.success) {
        sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
        return;
      }
      try {
        await service.submit(body.data);
        res.status(202).json({
          message: 'Recebemos seus dados. Nossa equipe entrará em contato.',
        });
      } catch (error) {
        if (error instanceof OutdatedConsentError) {
          sendProblem(req, res, 'VALIDATION_ERROR');
          return;
        }
        throw error;
      }
    },
  );
  return router;
}
