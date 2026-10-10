export interface SessionRecord {
  id: string;
  userId: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
}

export interface NewSession {
  userId: string;
  tokenHash: string;
  now: Date;
  expiresAt: Date;
}

export interface SessionRepository {
  create(session: NewSession): Promise<SessionRecord>;
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  recordActivity(sessionId: string, now: Date): Promise<void>;
  /** Idempotente: revogar uma sessão já revogada não altera o instante original. */
  revoke(sessionId: string, now: Date): Promise<void>;
  revokeAllForUser(
    userId: string,
    now: Date,
    exceptSessionId?: string,
  ): Promise<void>;
}
