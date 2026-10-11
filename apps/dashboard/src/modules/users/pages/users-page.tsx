import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { permissions as allPermissions, type AdminUser } from '@flex/contracts';
import { useCan, useSession } from '../../auth';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { CellMain, DataTable } from '../../../shared/ui/data-table';
import { Icon } from '../../../shared/ui/icon';
import { ListCard } from '../../../shared/ui/list-card';
import {
  EmptyState,
  ListSkeleton,
  PageHeader,
} from '../../../shared/ui/page-parts';
import { RowMenu } from '../../../shared/ui/row-menu';
import { initialsOf } from '../../../shared/utils/initials';
import { useListFilter } from '../../../shared/utils/use-list-filter';
import { UserCreateDrawer } from '../components/user-create-drawer';
import { UserAccessBadge, UserStatusBadge } from '../components/user-badges';
import { usersQueryOptions } from '../queries/users.query';

const stateOf = (user: AdminUser) => user.status;
const textOf = (user: AdminUser) => `${user.fullName} ${user.username}`;

export function UsersPage() {
  const users = useQuery(usersQueryOptions);
  const canManage = useCan('users.manage');
  const session = useSession();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const filter = useListFilter(users.data ?? [], { stateOf, textOf });

  const open = (user: AdminUser) =>
    void navigate({ to: '/usuarios/$userId', params: { userId: user.id } });

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Contas internas e suas permissões individuais."
        actions={
          canManage ? (
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Icon name="plus" />
              Novo usuário
            </Button>
          ) : null
        }
      />

      {users.isPending ? <ListSkeleton label="Carregando usuários" /> : null}
      {users.isError ? (
        <Alert
          tone="danger"
          title="Não foi possível carregar os usuários."
          action={
            <Button
              compact
              onClick={() => void users.refetch()}
              loading={users.isFetching}
            >
              <Icon name="refresh" />
              Tentar novamente
            </Button>
          }
        >
          {describeError(users.error)}
        </Alert>
      ) : null}

      {users.isSuccess && users.data.length === 0 ? (
        <EmptyState
          icon="users"
          title="Nenhum usuário cadastrado"
          action={
            canManage ? (
              <Button
                variant="primary"
                compact
                onClick={() => setCreating(true)}
              >
                Novo usuário
              </Button>
            ) : undefined
          }
        >
          Cadastre as pessoas que acessarão o painel e conceda a cada uma as
          permissões necessárias.
        </EmptyState>
      ) : null}

      {users.isSuccess && users.data.length > 0 ? (
        <ListCard
          tabs={[
            { value: '', label: 'Todos', count: filter.countOf('') },
            {
              value: 'active',
              label: 'Ativos',
              count: filter.countOf('active'),
            },
            {
              value: 'inactive',
              label: 'Inativos',
              count: filter.countOf('inactive'),
            },
          ]}
          activeTab={filter.state}
          onTabChange={filter.setState}
          search={filter.search}
          onSearchChange={filter.setSearch}
          searchLabel="Filtrar por nome ou usuário"
          footer={
            filter.filtered.length === filter.total
              ? `${filter.total} ${filter.total === 1 ? 'usuário' : 'usuários'}`
              : `${filter.filtered.length} de ${filter.total} usuários`
          }
        >
          <DataTable
            rows={filter.filtered}
            rowKey={(user) => user.id}
            emptyTitle="Nenhum usuário encontrado com esses filtros."
            onRowClick={open}
            columns={[
              {
                header: 'Usuário',
                cell: (user) => (
                  <CellMain
                    title={
                      user.id === session?.user.id
                        ? `${user.fullName} (você)`
                        : user.fullName
                    }
                    subtitle={user.username}
                    mark={initialsOf(user.fullName)}
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
              <>
                <Button compact onClick={() => open(user)}>
                  Abrir
                </Button>
                <RowMenu
                  label={`Mais ações para ${user.fullName}`}
                  items={[
                    { label: 'Abrir detalhe', onSelect: () => open(user) },
                  ]}
                />
              </>
            )}
          />
        </ListCard>
      ) : null}

      {creating ? (
        <UserCreateDrawer onClose={() => setCreating(false)} />
      ) : null}
    </>
  );
}
