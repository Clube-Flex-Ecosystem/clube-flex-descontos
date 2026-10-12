import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    activateAccountController,
    changePasswordController,
    getSessionController,
    loginController,
    logoutController,
    recoverPasswordController,
    requestRecoveryController,
} from '../../modules/identity/controllers/identity.controllers';
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

authRouter.post('/login', loginLimiter, loginController);
authRouter.post('/activate', accessCodeLimiter, activateAccountController);
authRouter.post('/recover', accessCodeLimiter, recoverPasswordController);
authRouter.post(
    '/recovery-requests',
    recoveryRequestLimiter,
    requestRecoveryController,
);
authRouter.get('/session', authenticate, getSessionController);
authRouter.put('/password', authenticate, changePasswordController);
authRouter.post('/logout', logoutController);

export { authRouter };
