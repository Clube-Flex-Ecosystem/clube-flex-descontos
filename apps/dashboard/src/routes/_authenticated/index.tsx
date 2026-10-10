import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { sessionQueryOptions } from '../../modules/auth/queries/session.query';
import { pageHead } from '../../shared/utils/page-head';

export const Route = createFileRoute('/_authenticated/')({
  head: () => pageHead('Início'),
  component: Home,
});

function Home() {
  const { session } = Route.useRouteContext();
  const { data } = useQuery(sessionQueryOptions);
  const current = data?.session ?? session;

  return (
    <>
      <div className="mb-5">
        <h1 className="t-page">Olá, {current.user.fullName.split(' ')[0]}</h1>
      </div>
      <section
        className="grid justify-items-start gap-1.5 rounded-xl border border-border bg-surface p-6 shadow-sm"
        aria-labelledby="home-title"
      >
        {current.permissions.length === 0 ? (
          <>
            <h2 id="home-title" className="t-section">
              Sua conta ainda não possui permissões
            </h2>
            <p className="muted">
              Solicite a um administrador as permissões necessárias para usar o
              painel.
            </p>
          </>
        ) : (
          <>
            <h2 id="home-title" className="t-section">
              Nenhum módulo disponível ainda
            </h2>
            <p className="muted">
              Os módulos do painel aparecerão no menu lateral conforme forem
              liberados para a sua conta.
            </p>
          </>
        )}
      </section>
    </>
  );
}
