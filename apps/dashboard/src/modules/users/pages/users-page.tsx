import { Suspense } from 'react';
import { useState } from 'react';
import { useCan } from '../../auth';
import { UserCreateDrawer } from '../components/user-create-drawer';
import { UsersList } from '../components/users-list';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import { ListSkeleton, PageHeader } from '../../../shared/ui/page-parts';

/** Cabeçalho e ação da página; a lista busca e apresenta os dados em separado. */
export function UsersPage() {
  const canManage = useCan('users.manage');
  const [creating, setCreating] = useState(false);

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

      <Suspense fallback={<ListSkeleton label="Carregando usuários" />}>
        <UsersList canManage={canManage} onCreate={() => setCreating(true)} />
      </Suspense>

      {creating ? (
        <UserCreateDrawer onClose={() => setCreating(false)} />
      ) : null}
    </>
  );
}
