import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import type { SessionResponse } from '@flex/contracts';
import { useLogout } from '../modules/auth/mutations/auth.mutations';
import { Button } from '../shared/ui/button';
import { navigation, visibleNavigation } from './navigation';

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

const navLink =
  't-label relative flex h-(--nav-item-height) items-center gap-2.5 rounded-md px-2.5 text-sidebar-foreground no-underline hover:bg-sidebar-hover ' +
  'aria-[current=page]:bg-sidebar-active aria-[current=page]:font-semibold ' +
  'aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-2 aria-[current=page]:before:-left-2.5 aria-[current=page]:before:w-[3px] aria-[current=page]:before:rounded-r-sm aria-[current=page]:before:bg-accent';

/** Estrutura autenticada: sidebar, barra superior e área de conteúdo. */
export function AppShell({ session }: { session: SessionResponse }) {
  const navigate = useNavigate();
  const logout = useLogout();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  // O menu fica aberto apenas na rota em que foi aberto; navegar o fecha.
  const [menuOpenedAt, setMenuOpenedAt] = useState<string | null>(null);
  const menuOpen = menuOpenedAt === pathname;
  const contentRef = useRef<HTMLElement>(null);
  const groups = visibleNavigation(session.permissions);

  // A navegação leva o foco ao conteúdo da nova página.
  useEffect(() => {
    contentRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpenedAt(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const current = navigation
    .flatMap((group) => group.items.map((item) => ({ group, item })))
    .find(({ item }) => item.to === pathname);

  return (
    <div className="grid min-h-dvh md:grid-cols-[var(--sidebar-width)_1fr]">
      <a
        className="t-label absolute -top-12 left-2 z-100 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:top-2"
        href="#content"
      >
        Ir para o conteúdo
      </a>
      <aside
        id="sidebar"
        aria-label="Navegação principal"
        className={[
          'fixed inset-y-0 left-0 z-60 flex w-[min(280px,86vw)] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-base',
          'md:sticky md:top-0 md:h-dvh md:w-auto md:translate-x-0',
          menuOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-(--header-height) flex-none items-center gap-2.5 border-b border-sidebar-border px-4">
          <span
            className="grid size-7 place-items-center rounded-md border border-primary-edge bg-linear-to-br from-brand-gradient-from to-brand-gradient-to font-bold text-primary-foreground shadow-brand-raised"
            aria-hidden="true"
          >
            F
          </span>
          <div className="leading-tight">
            <strong className="t-card block text-sidebar-foreground">
              Clube Flex
            </strong>
            <small className="t-caption block text-sidebar-muted">
              Painel interno
            </small>
          </div>
        </div>
        <nav
          className="flex-1 overflow-y-auto px-2.5 pb-4"
          aria-label="Seções do painel"
        >
          {groups.map((group) => (
            <div className="pt-4" key={group.label}>
              <h2 className="t-caption px-2.5 pb-1.5 tracking-wider text-sidebar-muted uppercase">
                {group.label}
              </h2>
              <ul className="grid gap-px">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <Link
                      className={navLink}
                      to={item.to}
                      onClick={() => setMenuOpenedAt(null)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="flex flex-none items-center gap-2 border-t border-sidebar-border p-2.5">
          <span
            className="t-caption grid size-8 flex-none place-items-center rounded-full bg-sidebar-active text-sidebar-foreground"
            aria-hidden="true"
          >
            {initials(session.user.fullName)}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <strong className="t-label block truncate text-sidebar-foreground">
              {session.user.fullName}
            </strong>
            <span className="t-caption block truncate text-sidebar-muted">
              {session.user.username}
            </span>
          </div>
          <Button
            variant="sidebar"
            loading={logout.isPending}
            onClick={() =>
              logout.mutate(undefined, {
                onSettled: () => void navigate({ to: '/login' }),
              })
            }
          >
            Sair
          </Button>
        </div>
      </aside>
      {menuOpen ? (
        <div
          className="fixed inset-0 z-50 bg-overlay md:hidden"
          onClick={() => setMenuOpenedAt(null)}
          aria-hidden="true"
        />
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-(--header-height) items-center gap-3 border-b border-border bg-surface/90 px-2 backdrop-blur md:px-6">
          <Button
            className="md:hidden"
            variant="quiet"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            aria-controls="sidebar"
            onClick={() => setMenuOpenedAt(menuOpen ? null : pathname)}
          >
            Menu
          </Button>
          <nav
            className="t-small flex items-center gap-2 text-muted-foreground"
            aria-label="Você está em"
          >
            {current ? <span>{current.group.label}</span> : null}
            {current ? <span aria-hidden="true">/</span> : null}
            <strong className="font-medium text-foreground" aria-current="page">
              {current?.item.label ?? 'Início'}
            </strong>
          </nav>
        </header>
        <main
          className="mx-auto w-full max-w-(--content-max) flex-1 p-4 outline-hidden md:px-(--content-pad-x) md:py-6"
          id="content"
          tabIndex={-1}
          ref={contentRef}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
