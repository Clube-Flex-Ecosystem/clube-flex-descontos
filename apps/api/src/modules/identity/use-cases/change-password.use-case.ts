import { checkPassword } from '../domain/password-policy';
import { InvalidCurrentPasswordError, PasswordPolicyError } from '../errors';
import type { UnitOfWork } from '../repositories/unit-of-work.types';
import type { Clock, PasswordHasher } from '../services.types';

export class ChangePasswordUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
  ) {}

  execute(input: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }) {
    return this.unitOfWork.run(async ({ users }) => {
      const user = await users.findById(input.userId);
      const matches =
        user?.passwordHash &&
        (await this.hasher.verify(input.currentPassword, user.passwordHash));
      if (!user || !matches) throw new InvalidCurrentPasswordError();

      const violation = checkPassword(input.newPassword);
      if (violation) throw new PasswordPolicyError(violation);
      return users.setPasswordHash(
        user.id,
        await this.hasher.hash(input.newPassword),
        this.clock.now(),
      );
    });
  }
}
