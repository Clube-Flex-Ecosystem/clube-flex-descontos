import { createFileRoute } from '@tanstack/react-router';
import { LeadDetailPage } from '../../../modules/leads/pages/lead-detail-page';
import { requireAnyPermission } from '../../../shared/utils/route-guards';
import { pageHead } from '../../../shared/utils/page-head';
export const Route = createFileRoute('/_authenticated/leads/$leadId')({
  beforeLoad: ({ context }) =>
    requireAnyPermission(context.session, ['leads.view-own', 'leads.view-all']),
  head: () => pageHead('Detalhe do lead'),
  component: LeadRoute,
});

function LeadRoute() {
  return <LeadDetailPage id={Route.useParams().leadId} />;
}
