import { createFileRoute } from '@tanstack/react-router';
import { PartnerFormPage } from '../../../modules/partners';
import { requirePermission } from '../../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/parceiros/$partnerId')({
  beforeLoad: ({ context }) =>
    requirePermission(context.session, 'partners.view'),
  head: () => ({ meta: [{ title: 'Parceiro — Clube Flex' }] }),
  component: PartnerRoute,
});

function PartnerRoute() {
  const { partnerId } = Route.useParams();
  return <PartnerFormPage partnerId={partnerId} />;
}
