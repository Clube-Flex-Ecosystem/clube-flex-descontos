import { Router } from 'express';
import {
  ProgressiveLimiter,
  rateLimit,
} from '../../http/middlewares/rate-limit.middleware';
import {
  getContactConsentController,
  submitPublicContactController,
} from './public-contact.controller';

const limiter = new ProgressiveLimiter({
  freeAttempts: 5,
  baseLockMs: 60_000,
  maxLockMs: 15 * 60_000,
  decayMs: 60 * 60_000,
});

export const publicContactRouter = Router();
publicContactRouter.use((_req, res, next) => {
  res.setHeader('cache-control', 'no-store');
  next();
});
publicContactRouter.get('/contact-consent', getContactConsentController);
publicContactRouter.post(
  '/contact-requests',
  rateLimit({ limiter, key: (req) => req.ip, count: 'always' }),
  submitPublicContactController,
);
