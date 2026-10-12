import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { identityControllers } from '../../modules/identity/controllers/identity.controllers';
import { authenticate } from '../middlewares/authentication.middleware';
import { HttpError } from '../../errors/app-error';

const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: () => {
    throw new HttpError('RATE_LIMIT_EXCEEDED');
  },
});

const accessCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: () => {
    throw new HttpError('RATE_LIMIT_EXCEEDED');
  },
});

const recoveryRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: () => {
    throw new HttpError('RATE_LIMIT_EXCEEDED');
  },
});

authRouter.post('/login', loginLimiter, identityControllers.login);
authRouter.post('/activate', accessCodeLimiter, identityControllers.activate);
authRouter.post('/recover', accessCodeLimiter, identityControllers.recover);
authRouter.post(
  '/recovery-requests',
  recoveryRequestLimiter,
  identityControllers.requestRecovery,
);
authRouter.get('/session', authenticate, identityControllers.session);
authRouter.put('/password', authenticate, identityControllers.changePassword);
authRouter.post('/logout', identityControllers.logout);

export { authRouter };
