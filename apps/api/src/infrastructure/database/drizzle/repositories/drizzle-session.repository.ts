import { and, eq, isNull, ne } from 'drizzle-orm';
import type {
  NewSession,
  SessionRecord,
  SessionRepository,
} from '../../../../modules/identity/repositories/session.repository.types';
import type { DatabaseExecutor } from '../client';
import { sessions } from '../schema';

type SessionRow = typeof sessions.$inferSelect;

function toRecord(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    lastActivityAt: row.lastActivityAt,
    expiresAt: row.expiresAt,
    ...(row.revokedAt ? { revokedAt: row.revokedAt } : {}),
  };
}

export class DrizzleSessionRepository implements SessionRepository {
  constructor(private readonly db: DatabaseExecutor) {}

  async create(session: NewSession): Promise<SessionRecord> {
    const [row] = await this.db
      .insert(sessions)
      .values({
        userId: session.userId,
        tokenHash: session.tokenHash,
        createdAt: session.now,
        lastActivityAt: session.now,
        expiresAt: session.expiresAt,
      })
      .returning();
    if (!row) throw new Error('Falha ao criar a sessão');
    return toRecord(row);
  }

  async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    const [row] = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, tokenHash));
    return row ? toRecord(row) : null;
  }

  async recordActivity(sessionId: string, now: Date): Promise<void> {
    await this.db
      .update(sessions)
      .set({ lastActivityAt: now })
      .where(eq(sessions.id, sessionId));
  }

  async revoke(sessionId: string, now: Date): Promise<void> {
    await this.db
      .update(sessions)
      .set({ revokedAt: now })
      .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)));
  }

  async revokeAllForUser(
    userId: string,
    now: Date,
    exceptSessionId?: string,
  ): Promise<void> {
    await this.db
      .update(sessions)
      .set({ revokedAt: now })
      .where(
        and(
          eq(sessions.userId, userId),
          isNull(sessions.revokedAt),
          exceptSessionId ? ne(sessions.id, exceptSessionId) : undefined,
        ),
      );
  }
}
