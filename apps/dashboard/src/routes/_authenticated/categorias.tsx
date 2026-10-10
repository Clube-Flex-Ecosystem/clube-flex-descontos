import { createFileRoute } from '@tanstack/react-router';
import { CategoriesPage } from '../../modules/categories/pages/categories-page';
import { requirePermission } from '../../shared/utils/route-guards';
import { pageHead } from '../../shared/utils/page-head';

export const Route = createFileRoute('/_authenticated/categorias')({
  beforeLoad: ({ context }) =>
    requirePermission(context.session, 'categories.view'),
  head: () => pageHead('Categorias'),
  component: CategoriesPage,
});
