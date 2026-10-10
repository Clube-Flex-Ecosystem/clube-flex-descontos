import { hashSessionToken } from '../domain/secrets';
import type { SessionRepository } from '../repositories/session.repository.types';
import type { Clock } from '../services.types';

export class LogoutUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
  ) {}

  /** Idempotente: sessão ausente, expirada ou já revogada não é um erro. */
  async execute(input: { sessionToken: string }): Promise<void> {
    const session = await this.sessions.findByTokenHash(
      hashSessionToken(input.sessionToken),
    );
    if (session) await this.sessions.revoke(session.id, this.clock.now());
  }
}
