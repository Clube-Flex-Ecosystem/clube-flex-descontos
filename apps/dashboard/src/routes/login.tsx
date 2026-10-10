import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginPage, type LoginNotice } from '../modules/auth/pages/login-page';
import { sessionQueryOptions } from '../modules/auth/queries/session.query';
import { pageHead } from '../shared/utils/page-head';

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { aviso?: LoginNotice } =>
    search.aviso === 'ativada' || search.aviso === 'senha-redefinida'
      ? { aviso: search.aviso }
      : {},
  beforeLoad: async ({ context }) => {
    const state =
      await context.queryClient.ensureQueryData(sessionQueryOptions);
    if (state) throw redirect({ to: '/' });
  },
  head: () => pageHead('Entrar'),
  component: Login,
});

function Login() {
  const { aviso } = Route.useSearch();
  return <LoginPage notice={aviso} />;
}
