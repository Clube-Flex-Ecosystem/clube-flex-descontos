import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { sendProblem } from '../../http/problem';
import {
  getContactConsentController,
  submitPublicContactController,
} from './public-contact.controller';

const limiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => sendProblem(req, res, 'RATE_LIMIT_EXCEEDED'),
});

export const publicContactRouter = Router();
publicContactRouter.use((_req, res, next) => {
  res.setHeader('cache-control', 'no-store');
  next();
});
publicContactRouter.get('/contact-consent', getContactConsentController);
publicContactRouter.post(
  '/contact-requests',
  limiter,
  submitPublicContactController,
);
