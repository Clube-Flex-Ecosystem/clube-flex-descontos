import { createFileRoute } from '@tanstack/react-router';
import { SourcesPage } from '../../modules/leads/pages/sources-page';
import { requirePermission } from '../../shared/utils/route-guards';
export const Route = createFileRoute('/_authenticated/origens')({
  beforeLoad: ({ context }) =>
    requirePermission(context.session, 'sources.view'),
  head: () => ({ meta: [{ title: 'Origens — Clube Flex' }] }),
  component: SourcesPage,
});
