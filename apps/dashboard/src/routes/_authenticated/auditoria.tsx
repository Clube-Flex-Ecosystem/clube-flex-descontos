import { createFileRoute } from '@tanstack/react-router';
import { AuditPage } from '../../modules/audit/pages/audit-page';
import { pageHead } from '../../shared/utils/page-head';
import { requirePermission } from '../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/auditoria')({
  beforeLoad: ({ context }) => requirePermission(context.session, 'audit.view'),
  head: () => pageHead('Auditoria'),
  component: AuditPage,
});
