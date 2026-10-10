import { createFileRoute } from '@tanstack/react-router';
import { PartnerFormPage } from '../../../modules/partners';
import { requirePermission } from '../../../shared/utils/route-guards';
import { pageHead } from '../../../shared/utils/page-head';

export const Route = createFileRoute('/_authenticated/parceiros/novo')({
  beforeLoad: ({ context }) =>
    requirePermission(context.session, 'partners.create'),
  head: () => pageHead('Novo parceiro'),
  component: () => <PartnerFormPage />,
});
