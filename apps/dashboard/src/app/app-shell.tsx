import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import type { SessionResponse } from '@flex/contracts';
import { useLogout } from '../modules/auth/mutations/auth.mutations';
import { BrandMark } from '../shared/ui/brand-mark';
import { Button } from '../shared/ui/button';
import { Icon } from '../shared/ui/icon';
import { navigation, visibleNavigation } from './navigation';

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Item atual: fundo navy-700, texto 600, ícone e marcador de 3px na borda da moldura. */
const navLink =
  't-label relative flex h-(--nav-item-height) items-center gap-2.5 rounded-control px-2 text-sidebar-foreground no-underline hover:bg-sidebar-hover [&>svg]:text-sidebar-muted ' +
  'aria-[current=page]:bg-sidebar-selected aria-[current=page]:font-semibold aria-[current=page]:text-sidebar-selected-foreground aria-[current=page]:[&>svg]:text-signal-inverse ' +
  'aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-1.75 aria-[current=page]:before:-left-2 aria-[current=page]:before:w-0.75 aria-[current=page]:before:rounded-r-badge aria-[current=page]:before:bg-signal-inverse';

function CrumbSeparator() {
  return (
    <span className="text-border-strong" aria-hidden="true">
      /
    </span>
  );
}

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

  // Título declarado pela rota (`head`), usado como último nível nas páginas de detalhe.
  const routeTitle = useRouterState({
    select: (state) => {
      const meta = state.matches.at(-1)?.meta;
      if (!Array.isArray(meta)) return undefined;
      const entry: unknown = meta.find(
        (item: unknown) =>
          typeof item === 'object' && item !== null && 'title' in item,
      );
      const title = (entry as { title?: unknown } | undefined)?.title;
      return typeof title === 'string'
        ? title.replace(/\s[—|]\sClube Flex$/, '')
        : undefined;
    },
  });

  const current = navigation
    .flatMap((group) => group.items.map((item) => ({ group, item })))
    .find(
      ({ item }) => pathname === item.to || pathname.startsWith(`${item.to}/`),
    );
  // Em páginas de detalhe, o nível anterior da trilha é o retorno à listagem.
  const detailTitle =
    current && pathname !== current.item.to ? routeTitle : undefined;

  return (
    <div className="grid min-h-dvh md:grid-cols-[var(--sidebar-width)_1fr]">
      <a
        className="t-button absolute -top-12 left-2 z-100 rounded-control bg-primary px-3 py-2 text-primary-foreground no-underline focus:top-2"
        href="#content"
      >
        Ir para o conteúdo
      </a>
      <aside
        id="sidebar"
        aria-label="Navegação principal"
        data-surface="inverse"
        className={[
          'fixed inset-y-0 left-0 z-60 flex w-[min(280px,86vw)] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-base',
          'md:sticky md:top-0 md:h-dvh md:w-auto md:translate-x-0',
          menuOpen ? 'translate-x-0 shadow-overlay' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-(--header-height) flex-none items-center gap-2.5 border-b border-sidebar-border px-4">
          <BrandMark tone="inverse" />
          <small className="t-caption font-normal text-sidebar-muted">
            Painel interno
          </small>
        </div>
        <nav
          className="flex-1 overflow-y-auto px-2 pb-3"
          aria-label="Seções do painel"
        >
          {groups.map((group) => (
            <div className="pt-3" key={group.label}>
              <h2 className="t-overline px-2 pb-1 text-sidebar-muted">
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
                      <Icon name={item.icon} />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="flex flex-none items-center gap-2 border-t border-sidebar-border p-2">
          <span
            className="t-caption grid size-7 flex-none place-items-center rounded-full bg-sidebar-selected font-semibold text-sidebar-selected-foreground"
            aria-hidden="true"
          >
            {initials(session.user.fullName)}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <strong className="t-label block truncate font-semibold text-sidebar-selected-foreground">
              {session.user.fullName}
            </strong>
            <span className="t-caption block truncate text-sidebar-muted">
              {session.user.username}
            </span>
          </div>
          <Button
            variant="quiet"
            compact
            className="text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-selected-foreground"
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
        <header className="sticky top-0 z-20 flex h-(--header-height) items-center gap-3 border-b border-border bg-surface px-2 md:px-6">
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
            className="t-body-small flex items-center gap-1.5 text-muted-foreground"
            aria-label="Você está em"
          >
            {current ? <span>{current.group.label}</span> : null}
            {current ? <CrumbSeparator /> : null}
            {current && detailTitle ? (
              <>
                <Link
                  to={current.item.to}
                  className="text-muted-foreground no-underline hover:text-foreground hover:underline"
                >
                  {current.item.label}
                </Link>
                <CrumbSeparator />
                <strong
                  className="truncate font-medium text-foreground"
                  aria-current="page"
                >
                  {detailTitle}
                </strong>
              </>
            ) : (
              <strong
                className="font-medium text-foreground"
                aria-current="page"
              >
                {current?.item.label ?? 'Início'}
              </strong>
            )}
          </nav>
        </header>
        <main
          className="mx-auto w-full max-w-(--content-max) flex-1 p-4 outline-hidden md:px-(--content-pad-x) md:pt-5 md:pb-12"
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
