import type { Permission } from '@flex/contracts';

export interface NavItem {
  to: '/senha';
  label: string;
  /** Itens sem permissão de visualização são ocultados; a API segue como autoridade. */
  permission?: Permission;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Navegação lateral agrupada por responsabilidade. Os grupos Comercial, Catálogo e
 * Administração entram junto com os módulos dos incrementos seguintes.
 */
export const navigation: NavGroup[] = [
  {
    label: 'Conta',
    items: [{ to: '/senha', label: 'Alterar senha' }],
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
