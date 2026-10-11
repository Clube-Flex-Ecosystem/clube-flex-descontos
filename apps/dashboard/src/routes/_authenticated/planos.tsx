import { createFileRoute } from '@tanstack/react-router';
import { PlansPage } from '../../modules/plans/pages/plans-page';
import { requirePermission } from '../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/planos')({
  beforeLoad: ({ context }) => requirePermission(context.session, 'plans.view'),
  head: () => ({ meta: [{ title: 'Planos — Clube Flex' }] }),
  component: PlansPage,
});
