import { createFileRoute } from '@tanstack/react-router';
import { CategoriesPage } from '../../modules/categories/pages/categories-page';
import { requirePermission } from '../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/categorias')({
  beforeLoad: ({ context }) =>
    requirePermission(context.session, 'categories.view'),
  head: () => ({ meta: [{ title: 'Categorias — Clube Flex' }] }),
  component: CategoriesPage,
});
