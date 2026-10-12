import type { ReactNode } from 'react';
import { BrandMark } from '../../../shared/ui/brand-mark';

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Telas sem sessão: painel navy com a marca e a frase institucional, e o formulário
 * centralizado na coluna clara. Em telas estreitas o painel é ocultado.
 */
export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh bg-surface md:grid-cols-2">
      <aside
        data-surface="inverse"
        className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground md:flex"
      >
        <div className="flex items-center gap-2.5">
          <BrandMark tone="inverse" />
          <span className="t-caption font-normal text-sidebar-muted">
            Painel interno
          </span>
        </div>
        <blockquote className="t-display m-0 max-w-[40ch] text-sidebar-selected-foreground">
          Operação comercial e catálogo de parceiros em um só lugar.
        </blockquote>
        <small className="t-body-small text-sidebar-muted">
          Acesso restrito à equipe do Clube Flex.
        </small>
      </aside>
      <main className="grid place-items-center px-5 py-8" id="content">
        <div className="grid w-full max-w-90 gap-4">
          <div className="flex items-center gap-2.5 md:hidden">
            <BrandMark />
            <span className="t-caption font-normal text-muted-foreground">
              Painel interno
            </span>
          </div>
          <section className="grid gap-4" aria-labelledby="auth-title">
            <div className="grid gap-1.5">
              <h1 id="auth-title" className="t-page">
                {title}
              </h1>
              {description ? (
                <p className="t-body-small muted">{description}</p>
              ) : null}
            </div>
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
