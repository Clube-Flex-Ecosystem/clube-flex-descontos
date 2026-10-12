import type { Permission } from '@flex/contracts';
import type { RequestHandler } from 'express';
import { HttpError } from '../../errors/app-error';

/**
 * Declara as permissões exigidas pela rota. Todas são necessárias; a verificação usa as
 * permissões lidas nesta requisição, portanto concessões e revogações valem de imediato.
 */
export function requirePermissions(...required: Permission[]): RequestHandler {
  return (req, res, next) => {
    if (!req.auth) {
      throw new HttpError('AUTHENTICATION_REQUIRED');
    }
    const granted = new Set(req.auth.permissions);
    if (!required.every((permission) => granted.has(permission))) {
      throw new HttpError('PERMISSION_DENIED');
    }
    next();
  };
}
