import type { FieldErrorCode } from '@flex/contracts';
import { ACCESS_CODE_MAX_FAILED_ATTEMPTS } from '../constants';
import { checkPassword } from '../domain/password-policy';
import { hashAccessCode } from '../domain/secrets';
import { InvalidAccessCodeError, PasswordPolicyError } from '../errors';
import type { AccessCodePurpose } from '../repositories/access-code.repository';
import type { UnitOfWork } from '../repositories/unit-of-work.types';
import type { Clock, PasswordHasher } from '../services.types';

/**
 * Define a senha a partir de um código de ativação ou de recuperação (UC-006 e UC-008).
 * Não inicia sessão; encerra todas as sessões existentes da conta.
 */
export class SetPasswordWithAccessCodeUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    purpose: AccessCodePurpose;
    code: string;
    newPassword: string;
  }): Promise<void> {
    const now = this.clock.now();
    const violation = checkPassword(input.newPassword);
    // O custo do hash é pago fora da transação para não prolongar o bloqueio de linhas.
    const passwordHash = violation
      ? undefined
      : await this.hasher.hash(input.newPassword);

    const rejection = await this.unitOfWork.run(
      async ({ users, accessCodes, sessions }) => {
        const code = await accessCodes.findByCodeHash(
          hashAccessCode(input.code),
        );
        if (
          !code ||
          code.purpose !== input.purpose ||
          code.usedAt ||
          code.invalidatedAt ||
          code.expiresAt.getTime() <= now.getTime() ||
          code.failedAttempts >= ACCESS_CODE_MAX_FAILED_ATTEMPTS
        ) {
          throw new InvalidAccessCodeError();
        }

        const user = await users.findById(code.userId);
        if (!user || user.status !== 'active') {
          throw new InvalidAccessCodeError();
        }

        if (violation || !passwordHash) {
          // Cada senha recusada consome uma das cinco tentativas. A tentativa é
          // confirmada pela transação; o erro é lançado somente depois dela.
          await accessCodes.registerFailedAttempt(code.id);
          return violation ?? 'PASSWORD_TOO_COMMON';
        }

        if (!(await accessCodes.markUsed(code.id, now))) {
          throw new InvalidAccessCodeError();
        }
        await users.setPasswordHash(user.id, passwordHash, now);
        await sessions.revokeAllForUser(user.id, now);
        return null;
      },
    );

    if (rejection)
      throw new PasswordPolicyError(rejection satisfies FieldErrorCode);
  }
}
