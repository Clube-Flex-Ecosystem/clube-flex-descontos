import { isAdministrator } from '@flex/contracts';
import type { AdminActor, UserView } from '../admin-user.types';
import {
  ProtectedUserOperationError,
  UserNotFoundError,
  UserVersionConflictError,
} from '../errors';
import type { UnitOfWork } from '../repositories/unit-of-work.types';
import type { Clock } from '../services.types';

/**
 * Ativa ou desativa uma conta. A desativação encerra todas as sessões e respeita as
 * proteções de RN-021: ninguém desativa a própria conta nem o último administrador.
 */
export class SetUserStatusUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  execute(input: {
    actor: AdminActor;
    userId: string;
    expectedVersion: number;
    status: 'active' | 'inactive';
  }): Promise<UserView> {
    const now = this.clock.now();
    return this.unitOfWork.run(
      async ({ users, permissions, sessions, audit }) => {
        if (input.status === 'inactive') await users.lockAdministration();

        const current = await users.findById(input.userId);
        if (!current) throw new UserNotFoundError();
        const granted = await permissions.listForUser(current.id);
        // Idempotente: o estado já é o solicitado, sem novos efeitos.
        if (current.status === input.status) {
          return { account: current, permissions: granted };
        }
        if (current.version !== input.expectedVersion) {
          throw new UserVersionConflictError();
        }

        if (input.status === 'inactive') {
          if (current.id === input.actor.id) {
            throw new ProtectedUserOperationError(
              'Você não pode desativar a própria conta.',
            );
          }
          if (
            isAdministrator(granted) &&
            (await users.countOtherAdministrators(current.id)) === 0
          ) {
            throw new ProtectedUserOperationError(
              'Esta conta é o último administrador ativo de usuários e permissões e não pode ser desativada.',
            );
          }
        }

        const updated = await users.setStatus(
          current.id,
          input.expectedVersion,
          input.status,
          now,
        );
        if (!updated) throw new UserVersionConflictError();
        if (input.status === 'inactive') {
          await sessions.revokeAllForUser(current.id, now);
        }

        await audit.record({
          action:
            input.status === 'inactive' ? 'user.deactivated' : 'user.activated',
          occurredAt: now,
          actorUserId: input.actor.id,
          actorLabel: input.actor.username,
          targetType: 'user',
          targetId: updated.id,
          targetLabel: updated.username,
          before: { status: current.status },
          after: { status: updated.status },
        });
        return { account: updated, permissions: granted };
      },
    );
  }
}
