import { checkPassword } from '../domain/password-policy';
import { InvalidCurrentPasswordError, PasswordPolicyError } from '../errors';
import type { UnitOfWork } from '../repositories/unit-of-work.types';
import type { Clock, PasswordHasher } from '../services.types';

/** Alteração da própria senha em sessão autenticada (UC-009). */
export class ChangePasswordUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    userId: string;
    sessionId: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await this.unitOfWork.run(async ({ users, sessions }) => {
      const user = await users.findById(input.userId);
      const matches =
        user?.passwordHash &&
        (await this.hasher.verify(input.currentPassword, user.passwordHash));
      if (!user || !matches) throw new InvalidCurrentPasswordError();

      const violation = checkPassword(input.newPassword);
      if (violation) throw new PasswordPolicyError(violation);

      const now = this.clock.now();
      await users.setPasswordHash(
        user.id,
        await this.hasher.hash(input.newPassword),
        now,
      );
      // As demais sessões são encerradas; a sessão atual permanece (RN-023).
      await sessions.revokeAllForUser(user.id, now, input.sessionId);
    });
  }
}
