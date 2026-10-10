import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** Layout simples e centralizado das telas sem sessão. */
export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-6" id="content">
      <div className="grid w-full max-w-100 gap-5">
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-8 place-items-center rounded-md border border-primary-edge bg-linear-to-br from-brand-gradient-from to-brand-gradient-to font-bold text-primary-foreground shadow-brand-raised"
            aria-hidden="true"
          >
            F
          </span>
          <strong className="t-section">Clube Flex</strong>
        </div>
        <section
          className="grid gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm"
          aria-labelledby="auth-title"
        >
          <div className="grid gap-1.5">
            <h1 id="auth-title" className="t-page">
              {title}
            </h1>
            {description ? (
              <p className="t-small muted">{description}</p>
            ) : null}
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
