import { createFileRoute } from '@tanstack/react-router';
import { PartnersPage } from '../../../modules/partners';
import { requirePermission } from '../../../shared/utils/route-guards';
import { pageHead } from '../../../shared/utils/page-head';

export const Route = createFileRoute('/_authenticated/parceiros/')({
  beforeLoad: ({ context }) =>
    requirePermission(context.session, 'partners.view'),
  head: () => pageHead('Parceiros'),
  component: PartnersPage,
});
