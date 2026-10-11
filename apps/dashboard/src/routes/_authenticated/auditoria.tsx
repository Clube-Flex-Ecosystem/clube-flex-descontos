import {
  createFileRoute,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { AuditPage } from '../../modules/audit/pages/audit-page';
import { describeError } from '../../shared/http/problem';
import { Alert } from '../../shared/ui/alert';
import { Button } from '../../shared/ui/button';
import { Icon } from '../../shared/ui/icon';
import { requirePermission } from '../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/auditoria')({
  beforeLoad: ({ context }) => requirePermission(context.session, 'audit.view'),
  head: () => ({ meta: [{ title: 'Auditoria — Clube Flex' }] }),
  component: AuditPage,
  errorComponent: AuditError,
});

function AuditError({ error, reset }: ErrorComponentProps) {
  const queryErrorReset = useQueryErrorResetBoundary();

  return (
    <Alert
      tone="danger"
      title="Não foi possível carregar a auditoria."
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
