import { permissions as allPermissions, type AdminUser } from '@flex/contracts';
import { Button } from '../../../shared/ui/button';
import { CellMain, DataTable } from '../../../shared/ui/data-table';
import { EmptyState } from '../../../shared/ui/page-parts';
import { ListCard } from '../../../shared/ui/list-card';
import { initialsOf } from '../../../shared/utils/initials';
import { UserAccessBadge, UserStatusBadge } from './user-badges';

interface UsersDataProps {
  users: AdminUser[];
  canManage: boolean;
  currentUserId?: string;
  activeStatus: 'active' | 'inactive' | '';
  onStatusChange: (status: 'active' | 'inactive' | '') => void;
  statusCount: (status: 'active' | 'inactive' | '') => number;
  search: string;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
  total: number;
  onOpenUser: (user: AdminUser) => void;
  onCreate: () => void;
}

/** Apresentação da lista: recebe dados e callbacks, sem buscar ou navegar. */
export function UsersData({
  users,
  canManage,
  currentUserId,
  activeStatus,
  onStatusChange,
  statusCount,
  search,
  onSearchChange,
  onClearFilters,
  total,
  onOpenUser,
  onCreate,
}: UsersDataProps) {
  const hasUsers = total > 0;

  if (!hasUsers) {
    return (
      <EmptyState
        icon="users"
        title="Nenhum usuário cadastrado"
        action={
          canManage ? (
            <Button compact onClick={onCreate}>
              Novo usuário
            </Button>
          ) : undefined
        }
      >
        Cadastre as pessoas que acessarão o painel e conceda a cada uma as
        permissões necessárias.
      </EmptyState>
    );
  }

  return (
    <ListCard
      tabs={[
        { value: '', label: 'Todos', count: statusCount('') },
        { value: 'active', label: 'Ativos', count: statusCount('active') },
        {
          value: 'inactive',
          label: 'Inativos',
          count: statusCount('inactive'),
        },
      ]}
      activeTab={activeStatus}
      onTabChange={onStatusChange}
      search={search}
      onSearchChange={onSearchChange}
      searchLabel="Filtrar por nome ou usuário"
      footer={
        users.length === total
          ? `${total} ${total === 1 ? 'usuário' : 'usuários'}`
          : `${users.length} de ${total} usuários`
      }
    >
      <DataTable
        rows={users}
        rowKey={(user) => user.id}
        emptyTitle="Nenhum usuário encontrado com esses filtros."
        onRowClick={onOpenUser}
        onClearFilters={onClearFilters}
        columns={[
          {
            header: 'Usuário',
            cell: (user) => (
              <CellMain
                title={
                  user.id === currentUserId
                    ? `${user.fullName} (você)`
                    : user.fullName
                }
                subtitle={user.username}
                avatar={initialsOf(user.fullName)}
              />
            ),
          },
          {
            header: 'E-mail',
            cell: (user) =>
              user.email ? (
                <span>{user.email}</span>
              ) : (
                <span className="text-muted-foreground">Não informado</span>
              ),
          },
          {
            header: 'Acesso',
            cell: (user) => (
              <UserAccessBadge accessStatus={user.accessStatus} />
            ),
          },
          {
            header: 'Permissões',
            align: 'right',
            cell: (user) =>
              `${user.permissions.length} de ${allPermissions.length}`,
          },
          {
            header: 'Estado',
            cell: (user) => <UserStatusBadge status={user.status} />,
          },
        ]}
        actions={(user) => (
          <Button compact onClick={() => onOpenUser(user)}>
            Abrir
          </Button>
        )}
      />
    </ListCard>
  );
}
