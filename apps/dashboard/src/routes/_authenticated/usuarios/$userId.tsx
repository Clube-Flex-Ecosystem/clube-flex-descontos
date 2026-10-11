import { createFileRoute } from '@tanstack/react-router';
import { UserDetailPage } from '../../../modules/users';
import { pageHead } from '../../../shared/utils/page-head';
import { requirePermission } from '../../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/usuarios/$userId')({
  beforeLoad: ({ context }) => requirePermission(context.session, 'users.view'),
  head: () => pageHead('Usuário'),
  component: UserRoute,
});

function UserRoute() {
  return <UserDetailPage userId={Route.useParams().userId} />;
}
