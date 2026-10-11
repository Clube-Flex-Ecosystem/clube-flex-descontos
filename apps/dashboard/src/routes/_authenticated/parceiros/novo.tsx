import { createFileRoute } from '@tanstack/react-router';
import { PartnerFormPage } from '../../../modules/partners';
import { requirePermission } from '../../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/parceiros/novo')({
  beforeLoad: ({ context }) =>
    requirePermission(context.session, 'partners.create'),
  head: () => ({ meta: [{ title: 'Novo parceiro — Clube Flex' }] }),
  component: () => <PartnerFormPage />,
});
