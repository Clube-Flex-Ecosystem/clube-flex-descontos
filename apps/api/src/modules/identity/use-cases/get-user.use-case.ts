import type { UserView } from '../admin-user.types';
import { UserNotFoundError } from '../errors';
import type { PermissionRepository } from '../repositories/permission.repository.types';
import type { UserRepository } from '../repositories/user.repository.types';

export class GetUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly permissions: PermissionRepository,
  ) {}

  async execute(id: string): Promise<UserView> {
    const account = await this.users.findById(id);
    if (!account) throw new UserNotFoundError();
    return { account, permissions: await this.permissions.listForUser(id) };
  }
}
