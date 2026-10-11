import { Suspense, useState } from 'react';
import type { Plan } from '@flex/contracts';
import { useCan } from '../../auth';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import { ListSkeleton, PageHeader } from '../../../shared/ui/page-parts';
import { PlanFormDrawer } from '../components/plan-form-drawer';
import { PlansList } from '../components/plans-list';

/** Cabeçalho e formulário; a listagem busca e coordena os dados. */
export function PlansPage() {
  const canManage = useCan('plans.manage');
  const [editing, setEditing] = useState<Plan | 'new' | null>(null);

  return (
    <>
      <PageHeader
        title="Planos"
        description="Modalidades exibidas no seletor do catálogo público."
        actions={
          canManage ? (
            <Button variant="primary" onClick={() => setEditing('new')}>
              <Icon name="plus" />
              Novo plano
            </Button>
          ) : null
        }
      />

      <Suspense fallback={<ListSkeleton label="Carregando planos" />}>
        <PlansList
          canManage={canManage}
          onCreate={() => setEditing('new')}
          onEdit={setEditing}
        />
      </Suspense>

      {editing ? (
        <PlanFormDrawer
          key={editing === 'new' ? 'new' : editing.id}
          {...(editing === 'new' ? {} : { plan: editing })}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}
