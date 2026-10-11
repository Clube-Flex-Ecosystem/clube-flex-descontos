import {
  createFileRoute,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { CategoriesPage } from '../../modules/categories/pages/categories-page';
import { describeError } from '../../shared/http/problem';
import { Alert } from '../../shared/ui/alert';
import { Button } from '../../shared/ui/button';
import { Icon } from '../../shared/ui/icon';
import { requirePermission } from '../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/categorias')({
  beforeLoad: ({ context }) =>
    requirePermission(context.session, 'categories.view'),
  head: () => ({ meta: [{ title: 'Categorias — Clube Flex' }] }),
  component: CategoriesPage,
  errorComponent: CategoriesError,
});

function CategoriesError({ error, reset }: ErrorComponentProps) {
  const queryErrorReset = useQueryErrorResetBoundary();

  return (
    <Alert
      tone="danger"
      title="Não foi possível carregar as categorias."
      action={
        <Button
          compact
          onClick={() => {
            queryErrorReset.reset();
            reset();
          }}
        >
          <Icon name="refresh" />
          Tentar novamente
        </Button>
      }
    >
      {describeError(error)}
    </Alert>
  );
}
