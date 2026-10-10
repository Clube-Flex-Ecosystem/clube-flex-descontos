import { and, eq, isNull, sql } from 'drizzle-orm';
import type {
  AccessCodePurpose,
  AccessCodeRecord,
  AccessCodeRepository,
  NewAccessCode,
} from '../../../../modules/identity/repositories/access-code.repository.types';
import type { DatabaseExecutor } from '../client';
import { accessCodes } from '../schema';

export class DrizzleAccessCodeRepository implements AccessCodeRepository {
  constructor(private readonly db: DatabaseExecutor) {}

  async create(code: NewAccessCode): Promise<void> {
    await this.db.insert(accessCodes).values({
      userId: code.userId,
      purpose: code.purpose,
      codeHash: code.codeHash,
      createdAt: code.now,
      expiresAt: code.expiresAt,
    });
  }

  async invalidateOpen(
    userId: string,
    purpose: AccessCodePurpose,
    now: Date,
  ): Promise<void> {
    await this.db
      .update(accessCodes)
      .set({ invalidatedAt: now })
      .where(
        and(
          eq(accessCodes.userId, userId),
          eq(accessCodes.purpose, purpose),
          isNull(accessCodes.usedAt),
          isNull(accessCodes.invalidatedAt),
        ),
      );
  }

  async findByCodeHash(codeHash: string): Promise<AccessCodeRecord | null> {
    const [row] = await this.db
      .select()
      .from(accessCodes)
      .where(eq(accessCodes.codeHash, codeHash));
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      purpose: row.purpose,
      expiresAt: row.expiresAt,
      failedAttempts: row.failedAttempts,
      ...(row.usedAt ? { usedAt: row.usedAt } : {}),
      ...(row.invalidatedAt ? { invalidatedAt: row.invalidatedAt } : {}),
    };
  }

  async registerFailedAttempt(codeId: string): Promise<void> {
    await this.db
      .update(accessCodes)
      .set({ failedAttempts: sql`${accessCodes.failedAttempts} + 1` })
      .where(eq(accessCodes.id, codeId));
  }

  async markUsed(codeId: string, now: Date): Promise<boolean> {
    const updated = await this.db
      .update(accessCodes)
      .set({ usedAt: now })
      .where(
        and(
          eq(accessCodes.id, codeId),
          isNull(accessCodes.usedAt),
          isNull(accessCodes.invalidatedAt),
        ),
      )
      .returning({ id: accessCodes.id });
    return updated.length === 1;
  }
}
