import { Suspense } from 'react';
import { useState } from 'react';
import type { Category } from '@flex/contracts';
import { useCan } from '../../auth';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import { ListSkeleton, PageHeader } from '../../../shared/ui/page-parts';
import { CategoryFormDrawer } from '../components/category-form-drawer';
import { CategoriesList } from '../components/categories-list';

/** Cabeçalho e formulário; a listagem busca e coordena os dados. */
export function CategoriesPage() {
  const canManage = useCan('categories.manage');
  const [editing, setEditing] = useState<Category | 'new' | null>(null);

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Classificação dos parceiros e filtro do catálogo público."
        actions={
          canManage ? (
            <Button variant="primary" onClick={() => setEditing('new')}>
              <Icon name="plus" />
              Nova categoria
            </Button>
          ) : null
        }
      />

      <Suspense fallback={<ListSkeleton label="Carregando categorias" />}>
        <CategoriesList
          canManage={canManage}
          onCreate={() => setEditing('new')}
          onEdit={setEditing}
        />
      </Suspense>

      {editing ? (
        <CategoryFormDrawer
          key={editing === 'new' ? 'new' : editing.id}
          {...(editing === 'new' ? {} : { category: editing })}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}
