import { createFileRoute } from '@tanstack/react-router';
import { LeadDetailPage } from '../../../modules/leads/pages/lead-detail-page';
import { requireAnyPermission } from '../../../shared/utils/route-guards';
export const Route = createFileRoute('/_authenticated/leads/$leadId')({
  beforeLoad: ({ context }) =>
    requireAnyPermission(context.session, ['leads.view-own', 'leads.view-all']),
  head: () => ({ meta: [{ title: 'Detalhe do lead — Clube Flex' }] }),
  component: LeadRoute,
});

function LeadRoute() {
  return <LeadDetailPage id={Route.useParams().leadId} />;
}
