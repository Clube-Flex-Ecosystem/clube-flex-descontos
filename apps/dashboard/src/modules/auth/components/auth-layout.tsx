import type { ReactNode } from 'react';
import { BrandMark } from '../../../shared/ui/brand-mark';

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
          <BrandMark />
          <span className="t-caption font-normal text-muted-foreground">
            Painel interno
          </span>
        </div>
        <section
          className="grid gap-4 rounded-card border border-border bg-surface p-6"
          aria-labelledby="auth-title"
        >
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
  );
}
