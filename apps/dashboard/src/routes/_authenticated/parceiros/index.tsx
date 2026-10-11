import { createFileRoute } from '@tanstack/react-router';
import { PartnersPage } from '../../../modules/partners';
import { requirePermission } from '../../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/parceiros/')({
  beforeLoad: ({ context }) =>
    requirePermission(context.session, 'partners.view'),
  head: () => ({ meta: [{ title: 'Parceiros — Clube Flex' }] }),
  component: PartnersPage,
});
