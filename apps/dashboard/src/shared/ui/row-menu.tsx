import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Button } from './button';
import { Icon } from './icon';

export interface RowMenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  /** Linha divisória antes do item. */
  separated?: boolean;
}

/** Menu contextual: Radix controla foco, navegação por setas e posicionamento. */
export function RowMenu({
  label,
  items,
}: {
  label: string;
  items: RowMenuItem[];
}) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <Button variant="quiet" compact aria-label={label}>
          <Icon name="more" />
        </Button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={4}
          className="z-60 w-48 animate-[popover-in_var(--duration-fast)_ease-out] rounded-lg border border-border bg-surface p-1 shadow-md"
        >
          {items.map((item) => (
            <div key={item.label}>
              {item.separated ? (
                <DropdownMenuPrimitive.Separator className="my-1 border-t border-border" />
              ) : null}
              <DropdownMenuPrimitive.Item
                className={`t-label flex min-h-11 w-full cursor-pointer items-center rounded-sm px-2.5 text-left outline-hidden hover:bg-surface-muted focus:bg-surface-muted md:min-h-control-sm ${item.danger ? 'text-danger' : ''}`}
                onSelect={item.onSelect}
              >
                {item.label}
              </DropdownMenuPrimitive.Item>
            </div>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
