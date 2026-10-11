import { createFileRoute } from '@tanstack/react-router';
import { LeadsPage } from '../../../modules/leads/pages/leads-page';
import { requireAnyPermission } from '../../../shared/utils/route-guards';
export const Route = createFileRoute('/_authenticated/leads/')({
  beforeLoad: ({ context }) =>
    requireAnyPermission(context.session, ['leads.view-own', 'leads.view-all']),
  head: () => ({ meta: [{ title: 'Leads | Clube Flex' }] }),
  component: LeadsPage,
});
