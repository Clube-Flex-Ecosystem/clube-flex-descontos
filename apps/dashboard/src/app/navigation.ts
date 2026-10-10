import type { Permission } from '@flex/contracts';
import type { IconName } from '../shared/ui/icon';

export interface NavItem {
  to: '/parceiros' | '/planos' | '/categorias' | '/senha';
  label: string;
  icon: IconName;
  /** Itens sem permissão de visualização são ocultados; a API segue como autoridade. */
  permission?: Permission;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Navegação lateral agrupada por responsabilidade. Os grupos Comercial e Administração
 * entram junto com os módulos dos incrementos seguintes.
 */
export const navigation: NavGroup[] = [
  {
    label: 'Catálogo',
    items: [
      {
        to: '/parceiros',
        label: 'Parceiros',
        icon: 'partner',
        permission: 'partners.view',
      },
      {
        to: '/planos',
        label: 'Planos',
        icon: 'plan',
        permission: 'plans.view',
      },
      {
        to: '/categorias',
        label: 'Categorias',
        icon: 'category',
        permission: 'categories.view',
      },
    ],
  },
  {
    label: 'Conta',
    items: [{ to: '/senha', label: 'Alterar senha', icon: 'key' }],
  },
];

export function visibleNavigation(granted: readonly Permission[]): NavGroup[] {
  return navigation
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || granted.includes(item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

/** Primeiro módulo que o usuário pode visualizar (destino após a autenticação). */
export function firstAllowedModule(
  granted: readonly Permission[],
): NavItem['to'] | undefined {
  return visibleNavigation(granted)
    .flatMap((group) => group.items)
    .find((item) => item.permission)?.to;
}
