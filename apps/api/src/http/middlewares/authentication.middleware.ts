import type { RequestHandler } from 'express';
import type { AuthenticatedContext } from '../../modules/identity/use-cases/resolve-session.use-case';
import { sendProblem } from '../problem';
import { clearSessionCookie, readSessionToken } from '../session-cookie';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Presente somente depois de uma sessão válida ser resolvida. */
      auth?: AuthenticatedContext;
    }
  }
}

export type SessionResolver = (input: {
  sessionToken: string;
}) => Promise<AuthenticatedContext | null>;

/**
 * Resolve a sessão do cookie. Com `required`, a ausência de sessão válida responde 401;
 * sem ele, a requisição prossegue anônima (usado por operações idempotentes como logout).
 */
export function createAuthenticationMiddleware(
  resolveSession: SessionResolver,
  { required }: { required: boolean },
): RequestHandler {
  return async (req, res, next) => {
    const sessionToken = readSessionToken(req);
    const context = sessionToken
      ? await resolveSession({ sessionToken })
      : null;

    if (context) {
      req.auth = context;
      // Associa o usuário aos logs da requisição; somente o UUID interno.
      req.log = req.log.child({ userId: context.user.id });
      next();
      return;
    }

    if (sessionToken) clearSessionCookie(res);
    if (required) {
      sendProblem(req, res, 'AUTHENTICATION_REQUIRED');
      return;
    }
    next();
  };
}
