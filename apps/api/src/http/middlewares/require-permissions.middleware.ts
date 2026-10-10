import type { Permission } from '@flex/contracts';
import type { RequestHandler } from 'express';
import { sendProblem } from '../problem';

/**
 * Declara as permissões exigidas pela rota. Todas são necessárias; a verificação usa as
 * permissões lidas nesta requisição, portanto concessões e revogações valem de imediato.
 */
export function requirePermissions(...required: Permission[]): RequestHandler {
  return (req, res, next) => {
    if (!req.auth) {
      sendProblem(req, res, 'AUTHENTICATION_REQUIRED');
      return;
    }
    const granted = new Set(req.auth.permissions);
    if (!required.every((permission) => granted.has(permission))) {
      sendProblem(req, res, 'PERMISSION_DENIED');
      return;
    }
    next();
  };
}
