import { createFileRoute } from '@tanstack/react-router';
import { UserDetailPage } from '../../../modules/users';
import { requirePermission } from '../../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/usuarios/$userId')({
  beforeLoad: ({ context }) => requirePermission(context.session, 'users.view'),
  head: () => ({ meta: [{ title: 'Usuário — Clube Flex' }] }),
  component: UserRoute,
});

function UserRoute() {
  return <UserDetailPage userId={Route.useParams().userId} />;
}
