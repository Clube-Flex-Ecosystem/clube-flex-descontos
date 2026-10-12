import type { UserView } from '../admin-user.types';
import type { UnitOfWork } from '../repositories/unit-of-work.types';

export class ListUsersUseCase {
    constructor(private readonly unitOfWork: UnitOfWork) {}

    execute(): Promise<UserView[]> {
        return this.unitOfWork.run(async ({ users, permissions }) => {
            const [accounts, granted] = await Promise.all([
                users.list(),
                permissions.listForAll(),
            ]);
            return accounts.map((account) => ({
                account,
                permissions: granted.get(account.id) ?? [],
            }));
        });
    }
}
