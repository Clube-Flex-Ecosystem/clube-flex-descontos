import { isAdministrator, type Permission } from '@flex/contracts';
import type { AdminActor, UserView } from '../admin-user.types';
import {
  ProtectedUserOperationError,
  UserNotFoundError,
  UserVersionConflictError,
} from '../errors';
import type { UnitOfWork } from '../repositories/unit-of-work.types';
import type { Clock } from '../services.types';

const sorted = (values: Iterable<Permission>) => [...values].sort();

/**
 * Substitui atomicamente as permissões de outra conta (UC-024). Concessões e revogações
 * valem de imediato, pois cada requisição lê as permissões vigentes (RN-038).
 */
export class ReplaceUserPermissionsUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  execute(input: {
    actor: AdminActor;
    userId: string;
    expectedVersion: number;
    permissions: readonly Permission[];
  }): Promise<UserView> {
    const now = this.clock.now();
    const desired = new Set(input.permissions);

    return this.unitOfWork.run(async ({ users, permissions, audit }) => {
      await users.lockAdministration();

      const current = await users.findById(input.userId);
      if (!current) throw new UserNotFoundError();
      if (current.id === input.actor.id) {
        throw new ProtectedUserOperationError(
          'Você não pode alterar as próprias permissões.',
        );
      }
      if (current.version !== input.expectedVersion) {
        throw new UserVersionConflictError();
      }

      const before = new Set(await permissions.listForUser(current.id));
      const added = [...desired].filter((p) => !before.has(p));
      const removed = [...before].filter((p) => !desired.has(p));
      if (added.length === 0 && removed.length === 0) {
        return { account: current, permissions: sorted(before) };
      }

      // Valida com as permissões que o autor possui agora, não com as da sessão.
      const own = new Set(await permissions.listForUser(input.actor.id));
      const missing = added.filter((p) => !own.has(p));
      if (missing.length > 0) {
        throw new ProtectedUserOperationError(
          `Você não pode conceder permissões que não possui: ${missing.join(', ')}.`,
        );
      }

      if (
        isAdministrator([...before]) &&
        !isAdministrator([...desired]) &&
        (await users.countOtherAdministrators(current.id)) === 0
      ) {
        throw new ProtectedUserOperationError(
          'A alteração deixaria o sistema sem um administrador ativo de usuários e permissões.',
        );
      }

      await permissions.replace(current.id, [...desired], input.actor.id, now);
      const updated = await users.touch(current.id, input.expectedVersion, now);
      if (!updated) throw new UserVersionConflictError();

      await audit.record({
        action: 'user.permissions.updated',
        occurredAt: now,
        actorUserId: input.actor.id,
        actorLabel: input.actor.username,
        targetType: 'user',
        targetId: updated.id,
        targetLabel: updated.username,
        before: { permissions: sorted(before) },
        after: { permissions: sorted(desired) },
      });
      return { account: updated, permissions: sorted(desired) };
    });
  }
}
