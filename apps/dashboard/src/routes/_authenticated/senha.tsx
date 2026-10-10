import { createFileRoute } from '@tanstack/react-router';
import { ChangePasswordPage } from '../../modules/auth/pages/change-password-page';
import { pageHead } from '../../shared/utils/page-head';

export const Route = createFileRoute('/_authenticated/senha')({
  head: () => pageHead('Alterar senha'),
  component: ChangePasswordPage,
});
