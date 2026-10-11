import type { AccessCodeDelivery } from '../access-code-delivery';
import { issueAccessCode } from '../access-code-issuer';
import type { AdminActor, UserWithAccessCode } from '../admin-user.types';
import { ACCESS_CODE_TTL_MS } from '../constants';
import { baseUsername, generateUsername } from '../domain/username';
import type { UnitOfWork } from '../repositories/unit-of-work.types';
import type { Clock } from '../services.types';

/** Cria a conta ativa, sem permissões e aguardando ativação, e emite o código (UC-023). */
export class CreateUserUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly delivery: AccessCodeDelivery,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    actor: AdminActor;
    fullName: string;
    email?: string;
  }): Promise<UserWithAccessCode> {
    const now = this.clock.now();

    const { account, code } = await this.unitOfWork.run(
      async ({ users, accessCodes, audit }) => {
        // A trava evita que duas criações simultâneas escolham o mesmo sufixo.
        await users.lockUserCreation();
        const taken = new Set(
          await users.usernamesStartingWith(baseUsername(input.fullName)),
        );
        const account = await users.create(
          {
            fullName: input.fullName,
            username: generateUsername(input.fullName, (c) => taken.has(c)),
            ...(input.email ? { email: input.email } : {}),
          },
          now,
        );
        const code = await issueAccessCode(
          accessCodes,
          account.id,
          'activation',
          now,
        );

        const event = {
          actorUserId: input.actor.id,
          actorLabel: input.actor.username,
          occurredAt: now,
          targetType: 'user',
          targetId: account.id,
          targetLabel: account.username,
        };
        await audit.record({
          ...event,
          action: 'user.created',
          after: {
            fullName: account.fullName,
            username: account.username,
            ...(account.email ? { email: account.email } : {}),
          },
        });
        // O valor do código nunca integra a auditoria.
        await audit.record({
          ...event,
          action: 'user.access-code.issued',
          after: { purpose: 'activation' },
        });
        return { account, code };
      },
    );

    const delivered = await this.delivery.deliver({
      fullName: account.fullName,
      ...(account.email ? { email: account.email } : {}),
      purpose: 'activation',
      code,
    });
    const expiresAt = new Date(now.getTime() + ACCESS_CODE_TTL_MS);
    return {
      account,
      permissions: [],
      issued:
        delivered.channel === 'email'
          ? { delivery: 'email', expiresAt, deliveryFailed: false }
          : {
              delivery: 'manual',
              code,
              expiresAt,
              deliveryFailed: Boolean(account.email),
            },
    };
  }
}
