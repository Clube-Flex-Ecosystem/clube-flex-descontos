import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { AdminUser } from '@flex/contracts';
import { useSession } from '../../auth';
import { useListFilter } from '../../../shared/utils/use-list-filter';
import { usersQueryOptions } from '../queries/users.query';
import { UsersData } from './users-data';

const stateOf = (user: AdminUser) => user.status;
const textOf = (user: AdminUser) => `${user.fullName} ${user.username}`;

/** Busca os usuários e prepara os dados e callbacks para a apresentação. */
export function UsersList({
  canManage,
  onCreate,
}: {
  canManage: boolean;
  onCreate: () => void;
}) {
  const { data: users } = useSuspenseQuery(usersQueryOptions);
  const session = useSession();
  const navigate = useNavigate();
  const filter = useListFilter(users, { stateOf, textOf });

  const openUser = (user: AdminUser) =>
    void navigate({ to: '/usuarios/$userId', params: { userId: user.id } });

  return (
    <UsersData
      users={filter.filtered}
      canManage={canManage}
      currentUserId={session?.user.id}
      activeStatus={filter.state}
      onStatusChange={filter.setState}
      statusCount={filter.countOf}
      search={filter.search}
      onSearchChange={filter.setSearch}
      total={filter.total}
      onOpenUser={openUser}
      onCreate={onCreate}
    />
  );
}
