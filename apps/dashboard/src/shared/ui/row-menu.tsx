import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';
import { Icon } from './icon';

export interface RowMenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  /** Linha divisória antes do item. */
  separated?: boolean;
}

/** Menu contextual de ações menos frequentes de uma linha. */
export function RowMenu({
  label,
  items,
}: {
  label: string;
  items: RowMenuItem[];
}) {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const open = position !== null;

  const close = (restoreFocus = true) => {
    setPosition(null);
    if (restoreFocus) trigger.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !menu.current?.contains(target) &&
        !trigger.current?.contains(target)
      ) {
        setPosition(null);
      }
    };
    const onViewportChange = () => setPosition(null);
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [open]);

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 192;
    setPosition({
      top: rect.bottom + 4,
      left: Math.max(
        8,
        Math.min(rect.right - width, window.innerWidth - width - 8),
      ),
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const buttons = [
      ...(menu.current?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      buttons[(index + 1) % buttons.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  return (
    <>
      <Button
        variant="quiet"
        compact
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={toggle}
        ref={trigger}
      >
        <Icon name="more" />
      </Button>
      {open
        ? createPortal(
            <div
              ref={menu}
              id={menuId}
              role="menu"
              style={{ top: position.top, left: position.left }}
              className="fixed z-60 w-48 animate-[popover-in_var(--duration-fast)_ease-out] rounded-lg border border-border bg-surface p-1 shadow-md"
              onKeyDown={onKeyDown}
            >
              {items.map((item) => (
                <div key={item.label}>
                  {item.separated ? (
                    <hr className="my-1 border-0 border-t border-border" />
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    className={`t-label flex min-h-11 w-full cursor-pointer items-center rounded-sm px-2.5 text-left hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-hidden md:min-h-control-sm ${item.danger ? 'text-danger' : ''}`}
                    onClick={() => {
                      close(false);
                      item.onSelect();
                    }}
                  >
                    {item.label}
                  </button>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
