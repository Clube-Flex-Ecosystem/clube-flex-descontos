import { uniqueViolationConstraint } from '../../../infrastructure/database/drizzle/unique-violation';
import type { AdminActor, UserView } from '../admin-user.types';
import {
  UserNotFoundError,
  UsernameTakenError,
  UserVersionConflictError,
} from '../errors';
import type { UnitOfWork } from '../repositories/unit-of-work.types';
import type { Clock } from '../services.types';

/** Edita nome completo, nome de usuário e e-mail com controle de versão (UC-023, A1). */
export class UpdateUserUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    actor: AdminActor;
    userId: string;
    expectedVersion: number;
    fullName: string;
    username: string;
    email?: string;
  }): Promise<UserView> {
    const now = this.clock.now();
    try {
      return await this.unitOfWork.run(
        async ({ users, permissions, audit }) => {
          const current = await users.findById(input.userId);
          if (!current) throw new UserNotFoundError();
          if (current.version !== input.expectedVersion) {
            throw new UserVersionConflictError();
          }
          const granted = await permissions.listForUser(current.id);

          const before: Record<string, unknown> = {};
          const after: Record<string, unknown> = {};
          const track = (
            key: string,
            was: string | undefined,
            next: string | undefined,
          ) => {
            if (was === next) return;
            before[key] = was ?? null;
            after[key] = next ?? null;
          };
          track('fullName', current.fullName, input.fullName);
          track('username', current.username, input.username);
          track('email', current.email, input.email);
          // Nada mudou: preserva a versão e não gera evento.
          if (Object.keys(after).length === 0) {
            return { account: current, permissions: granted };
          }

          if (
            input.username !== current.username &&
            (await users.usernameExists(input.username))
          ) {
            throw new UsernameTakenError();
          }
          const updated = await users.updateProfile(
            current.id,
            input.expectedVersion,
            {
              fullName: input.fullName,
              username: input.username,
              ...(input.email ? { email: input.email } : {}),
            },
            now,
          );
          if (!updated) throw new UserVersionConflictError();

          await audit.record({
            action: 'user.updated',
            occurredAt: now,
            actorUserId: input.actor.id,
            actorLabel: input.actor.username,
            targetType: 'user',
            targetId: updated.id,
            targetLabel: updated.username,
            before,
            after,
          });
          return { account: updated, permissions: granted };
        },
      );
    } catch (error) {
      // Corrida entre dois cadastros do mesmo nome: a restrição do banco decide.
      if (uniqueViolationConstraint(error)) throw new UsernameTakenError();
      throw error;
    }
  }
}
