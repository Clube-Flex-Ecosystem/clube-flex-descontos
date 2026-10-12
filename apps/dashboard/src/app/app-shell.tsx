import { useQuery } from '@tanstack/react-query';
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import type { SessionResponse } from '@flex/contracts';
import { useLogout } from '../modules/auth/mutations/auth.mutations';
import { leadsQueryOptions } from '../modules/leads';
import { BrandMark } from '../shared/ui/brand-mark';
import { Button } from '../shared/ui/button';
import { cn } from '../shared/ui/cn';
import { Icon } from '../shared/ui/icon';
import { initialsOf } from '../shared/utils/initials';
import { accountNavigation, navigation, visibleNavigation } from './navigation';

/** Item atual: fundo navy-700, texto 600, ícone e marcador de 3px na borda da moldura. */
const navLink =
  't-label relative flex h-(--nav-item-height) items-center gap-2.5 rounded-control px-2 text-sidebar-foreground no-underline hover:bg-sidebar-hover [&>svg]:text-sidebar-muted ' +
  'aria-[current=page]:bg-sidebar-selected aria-[current=page]:font-semibold aria-[current=page]:text-sidebar-selected-foreground aria-[current=page]:[&>svg]:text-signal-inverse ' +
  'aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-1.75 aria-[current=page]:before:-left-2 aria-[current=page]:before:w-0.75 aria-[current=page]:before:rounded-r-badge aria-[current=page]:before:bg-signal-inverse';

/** Ação por ícone no rodapé da navegação (Alterar senha, Sair). */
const footerIcon =
  'grid size-8 flex-none cursor-pointer place-items-center rounded-control border-0 bg-transparent text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-selected-foreground aria-[current=page]:bg-sidebar-selected aria-[current=page]:text-sidebar-selected-foreground';

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
  // Navegação recolhida (somente ícones) no desktop.
  const [collapsed, setCollapsed] = useState(false);
  const contentRef = useRef<HTMLElement>(null);
  const groups = visibleNavigation(session.permissions);

  // Contador de novo interesse no item Leads, a partir do cache da listagem.
  const canViewLeads =
    session.permissions.includes('leads.view-own') ||
    session.permissions.includes('leads.view-all');
  const leads = useQuery({ ...leadsQueryOptions, enabled: canViewLeads });
  const pendingInterest =
    leads.data?.filter((lead) => lead.hasPendingInterest).length ?? 0;

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
        ? title.replace(/\s[—|]\s?Clube Flex$/, '')
        : undefined;
    },
  });

  const current = [...navigation, accountNavigation]
    .flatMap((group) => group.items.map((item) => ({ group, item })))
    .find(
      ({ item }) => pathname === item.to || pathname.startsWith(`${item.to}/`),
    );
  // Em páginas de detalhe, o nível anterior da trilha é o retorno à listagem.
  const detailTitle =
    current && pathname !== current.item.to ? routeTitle : undefined;
  // Em telas estreitas a navegação é sobreposta e nunca recolhida.
  const compact = collapsed && !menuOpen;

  return (
    <div
      className={cn(
        'grid min-h-dvh',
        compact
          ? 'md:grid-cols-[var(--sidebar-width-collapsed)_1fr]'
          : 'md:grid-cols-[var(--sidebar-width)_1fr]',
      )}
    >
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
        <div
          className={cn(
            'flex h-(--header-height) flex-none items-center gap-2.5 border-b border-sidebar-border px-4',
            compact && 'md:justify-center md:px-0',
          )}
        >
          <span className={cn(compact && 'md:hidden')}>
            <BrandMark tone="inverse" />
          </span>
          {compact ? (
            <span className="hidden md:inline">
              <BrandMark tone="inverse" compact />
            </span>
          ) : null}
          <small
            className={cn(
              't-caption font-normal whitespace-nowrap text-sidebar-muted',
              compact && 'md:hidden',
            )}
          >
            Painel interno
          </small>
        </div>
        <nav
          className="flex-1 overflow-x-hidden overflow-y-auto px-2 pb-3"
          aria-label="Seções do painel"
        >
          {groups.map((group) => (
            <div className="pt-3" key={group.label}>
              <h2
                className={cn(
                  't-overline px-2 pb-1 whitespace-nowrap text-sidebar-muted',
                  compact &&
                    'md:mx-2 md:mb-2 md:h-px md:overflow-hidden md:bg-sidebar-border md:p-0 md:text-transparent',
                )}
              >
                {group.label}
              </h2>
              <ul className="grid gap-px">
                {group.items.map((item) => {
                  const count = item.to === '/leads' ? pendingInterest : 0;
                  return (
                    <li key={item.to}>
                      <Link
                        className={cn(
                          navLink,
                          compact && 'md:justify-center md:px-0',
                        )}
                        to={item.to}
                        title={compact ? item.label : undefined}
                        onClick={() => setMenuOpenedAt(null)}
                      >
                        <Icon name={item.icon} />
                        <span
                          className={cn(
                            'min-w-0 flex-1 truncate',
                            compact && 'md:sr-only',
                          )}
                        >
                          {item.label}
                        </span>
                        {count > 0 ? (
                          compact ? (
                            <span
                              className="absolute top-1.5 right-2 hidden size-1.5 rounded-full bg-signal-inverse md:block"
                              aria-label={`${count} com novo interesse`}
                            />
                          ) : (
                            <span
                              className="t-caption tnum inline-grid h-4.5 min-w-5 place-items-center rounded-full bg-sidebar-count px-1.5 font-semibold text-sidebar-count-foreground"
                              aria-label={`${count} com novo interesse`}
                            >
                              {count}
                            </span>
                          )
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div
          className={cn(
            'flex flex-none items-center gap-1.5 border-t border-sidebar-border p-2',
            compact && 'md:justify-center',
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2.5 px-1 py-0.5">
            <span
              className="t-caption grid size-7 flex-none place-items-center rounded-full bg-sidebar-selected font-semibold text-sidebar-selected-foreground"
              aria-hidden="true"
              title={compact ? session.user.fullName : undefined}
            >
              {initialsOf(session.user.fullName)}
            </span>
            <div
              className={cn(
                'min-w-0 flex-1 leading-tight',
                compact && 'md:hidden',
              )}
            >
              <strong className="t-label block truncate font-semibold text-sidebar-selected-foreground">
                {session.user.fullName}
              </strong>
              <span className="t-caption block truncate font-normal text-sidebar-muted">
                {session.user.username}
              </span>
            </div>
          </div>
          <Link
            to="/senha"
            className={cn(footerIcon, compact && 'md:hidden')}
            aria-label="Alterar senha"
            title="Alterar senha"
            onClick={() => setMenuOpenedAt(null)}
          >
            <Icon name="key" />
          </Link>
          <button
            type="button"
            className={cn(footerIcon, compact && 'md:hidden')}
            aria-label="Sair"
            title="Sair"
            disabled={logout.isPending}
            onClick={() =>
              logout.mutate(undefined, {
                onSettled: () => void navigate({ to: '/login' }),
              })
            }
          >
            <Icon name="logout" />
          </button>
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
        <header className="sticky top-0 z-20 flex h-(--header-height) items-center gap-2 border-b border-border bg-surface px-2 md:pr-(--content-pad-x)">
          <Button
            className="md:hidden"
            variant="quiet"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            aria-controls="sidebar"
            onClick={() => setMenuOpenedAt(menuOpen ? null : pathname)}
          >
            <Icon name="menu" />
          </Button>
          <Button
            className="hidden md:inline-flex"
            variant="quiet"
            aria-pressed={collapsed}
            aria-label={
              collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'
            }
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            onClick={() => setCollapsed((value) => !value)}
          >
            <Icon name="panel" />
          </Button>
          <span
            className="hidden h-5 w-px bg-border md:block"
            aria-hidden="true"
          />
          <nav
            className="t-body-small flex min-w-0 items-center gap-1.5 text-muted-foreground"
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
