import type { Permission } from '@flex/contracts';
import {
  SESSION_ACTIVITY_RESOLUTION_MS,
  SESSION_IDLE_TIMEOUT_MS,
} from '../constants';
import { deriveCsrfToken, hashSessionToken } from '../domain/secrets';
import type { PermissionRepository } from '../repositories/permission.repository';
import type { SessionRepository } from '../repositories/session.repository';
import type { UserRepository } from '../repositories/user.repository';
import type { Clock } from '../services.types';

export interface AuthenticatedContext {
  sessionId: string;
  user: {
    id: string;
    fullName: string;
    username: string;
    email?: string;
  };
  /** Permissões atuais, lidas a cada requisição (RN-038). */
  permissions: Permission[];
  csrfToken: string;
}

/**
 * Resolve a sessão opaca para o usuário e suas permissões vigentes. Retorna `null`
 * quando a sessão não existe, expirou, foi revogada ou a conta não está mais ativa.
 */
export class ResolveSessionUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly users: UserRepository,
    private readonly permissions: PermissionRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    sessionToken: string;
  }): Promise<AuthenticatedContext | null> {
    const now = this.clock.now();
    const session = await this.sessions.findByTokenHash(
      hashSessionToken(input.sessionToken),
    );
    if (!session || session.revokedAt) return null;

    const idleLimit =
      session.lastActivityAt.getTime() + SESSION_IDLE_TIMEOUT_MS;
    if (
      now.getTime() >= session.expiresAt.getTime() ||
      now.getTime() >= idleLimit
    ) {
      await this.sessions.revoke(session.id, now);
      return null;
    }

    const user = await this.users.findById(session.userId);
    if (!user || user.status !== 'active') return null;

    if (
      now.getTime() - session.lastActivityAt.getTime() >=
      SESSION_ACTIVITY_RESOLUTION_MS
    ) {
      await this.sessions.recordActivity(session.id, now);
    }

    return {
      sessionId: session.id,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        ...(user.email ? { email: user.email } : {}),
      },
      permissions: await this.permissions.listForUser(user.id),
      csrfToken: deriveCsrfToken(input.sessionToken),
    };
  }
}
