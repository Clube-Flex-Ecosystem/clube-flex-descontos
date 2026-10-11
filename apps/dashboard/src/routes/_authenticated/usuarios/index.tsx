import { createFileRoute } from '@tanstack/react-router';
import { UsersPage } from '../../../modules/users';
import { pageHead } from '../../../shared/utils/page-head';
import { requirePermission } from '../../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/usuarios/')({
  beforeLoad: ({ context }) => requirePermission(context.session, 'users.view'),
  head: () => pageHead('Usuários'),
  component: UsersPage,
});
