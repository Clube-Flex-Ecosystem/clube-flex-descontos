import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { FormEventHandler, ReactNode } from 'react';
import { Button } from './button';
import { Icon } from './icon';

interface DrawerProps {
  title: string;
  description?: string;
  submitLabel?: string;
  /** Envio em andamento: impede reenvio sem apagar os valores. */
  loading?: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onClose: () => void;
  children: ReactNode;
}

function DrawerFrame({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-70 bg-overlay data-[state=open]:animate-[overlay-in_var(--duration-fast)_ease-out]" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-80 flex h-dvh w-full max-w-110 flex-col bg-surface p-0 text-foreground shadow-lg data-[state=open]:animate-[drawer-in_var(--duration-base)_ease-out]">
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Sheet lateral para formulários curtos; Radix administra foco, Escape e overlay. */
export function Drawer({
  title,
  description,
  submitLabel = 'Salvar',
  loading = false,
  onSubmit,
  onClose,
  children,
}: DrawerProps) {
  return (
    <DrawerFrame onClose={onClose}>
      <form
        className="flex h-full min-h-0 flex-col"
        noValidate
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <DialogPrimitive.Title className="t-section">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="t-small muted">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close asChild>
            <Button variant="quiet" aria-label="Fechar">
              <Icon name="x" />
            </Button>
          </DialogPrimitive.Close>
        </div>
        <div className="grid flex-1 content-start gap-4 overflow-y-auto p-5">
          {children}
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-surface-hover px-5 py-3">
          <DialogPrimitive.Close asChild>
            <Button>Cancelar</Button>
          </DialogPrimitive.Close>
          <Button type="submit" variant="primary" loading={loading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </DrawerFrame>
  );
}

interface DetailDrawerProps {
  title: string;
  description?: string;
  /** Observação fixa no rodapé, à esquerda (por exemplo, "Registro imutável"). */
  note?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

/** Sheet lateral somente leitura. */
export function DetailDrawer({
  title,
  description,
  note,
  onClose,
  children,
}: DetailDrawerProps) {
  return (
    <DrawerFrame onClose={onClose}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <DialogPrimitive.Title className="t-section">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="t-small muted tnum">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close asChild>
            <Button variant="quiet" aria-label="Fechar">
              <Icon name="x" />
            </Button>
          </DialogPrimitive.Close>
        </div>
        <div className="grid flex-1 content-start gap-4 overflow-y-auto p-5">
          {children}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-hover px-5 py-3">
          {note ? (
            <span className="t-caption muted mr-auto inline-flex items-center gap-1.5">
              {note}
            </span>
          ) : null}
          <DialogPrimitive.Close asChild>
            <Button>Fechar</Button>
          </DialogPrimitive.Close>
        </div>
      </div>
    </DrawerFrame>
  );
}

interface ConfirmDialogProps {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  /** Ações destrutivas usam o tom de perigo; as demais, o da marca. */
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmação sensível; Alert Dialog evita fechamento acidental. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root
      open
      onOpenChange={(open) => !open && onCancel()}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-70 bg-overlay data-[state=open]:animate-[overlay-in_var(--duration-fast)_ease-out]" />
        <AlertDialogPrimitive.Content className="fixed top-1/2 left-1/2 z-80 w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-0 text-foreground shadow-lg data-[state=open]:animate-[dialog-in_var(--duration-base)_ease-out]">
          <div className="grid gap-3 p-5">
            <AlertDialogPrimitive.Title className="t-section">
              {title}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description asChild>
              <div className="t-body muted">{body}</div>
            </AlertDialogPrimitive.Description>
          </div>
          <div className="flex justify-end gap-2 px-5 pb-5">
            <AlertDialogPrimitive.Cancel asChild>
              <Button>Cancelar</Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button
                variant={tone === 'danger' ? 'danger' : 'primary'}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
