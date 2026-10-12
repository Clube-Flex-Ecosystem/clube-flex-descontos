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
                <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-80 flex h-dvh w-full max-w-105 flex-col bg-surface p-0 text-foreground shadow-overlay data-[state=open]:animate-[drawer-in_var(--duration-base)_ease-out]">
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
                <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3.5">
                    <div>
                        <DialogPrimitive.Title className="t-section">
                            {title}
                        </DialogPrimitive.Title>
                        {description ? (
                            <DialogPrimitive.Description className="t-body-small muted mt-0.5">
                                {description}
                            </DialogPrimitive.Description>
                        ) : null}
                    </div>
                    <DialogPrimitive.Close asChild>
                        <Button variant="quiet" compact aria-label="Fechar">
                            <Icon name="x" />
                        </Button>
                    </DialogPrimitive.Close>
                </div>
                <div className="grid flex-1 content-start gap-4 overflow-y-auto p-5">
                    {children}
                </div>
                <div className="flex justify-end gap-2 border-t border-border bg-surface px-5 py-3">
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

interface ModalDialogProps {
    title: string;
    description?: string;
    submitLabel: string;
    loading?: boolean;
    onSubmit: FormEventHandler<HTMLFormElement>;
    onClose: () => void;
    children: ReactNode;
}

/** Dialog central para uma decisão curta com campos (ex.: alterar etapa do lead). */
export function ModalDialog({
    title,
    description,
    submitLabel,
    loading = false,
    onSubmit,
    onClose,
    children,
}: ModalDialogProps) {
    return (
        <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-70 bg-overlay data-[state=open]:animate-[overlay-in_var(--duration-fast)_ease-out]" />
                <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-80 w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-overlay border border-border bg-surface p-0 text-foreground shadow-overlay data-[state=open]:animate-[dialog-in_var(--duration-base)_ease-out]">
                    <form noValidate onSubmit={onSubmit}>
                        <div className="flex items-start justify-between gap-3 px-5 pt-3.5">
                            <div>
                                <DialogPrimitive.Title className="t-section">
                                    {title}
                                </DialogPrimitive.Title>
                                {description ? (
                                    <DialogPrimitive.Description className="t-body-small muted mt-0.5">
                                        {description}
                                    </DialogPrimitive.Description>
                                ) : null}
                            </div>
                            <DialogPrimitive.Close asChild>
                                <Button
                                    variant="quiet"
                                    compact
                                    aria-label="Fechar"
                                >
                                    <Icon name="x" />
                                </Button>
                            </DialogPrimitive.Close>
                        </div>
                        <div className="grid gap-4 px-5 pt-2 pb-5">
                            {children}
                        </div>
                        <div className="flex justify-end gap-2 px-5 pb-5">
                            <DialogPrimitive.Close asChild>
                                <Button>Cancelar</Button>
                            </DialogPrimitive.Close>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={loading}
                            >
                                {submitLabel}
                            </Button>
                        </div>
                    </form>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
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
                <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3.5">
                    <div>
                        <DialogPrimitive.Title className="t-section">
                            {title}
                        </DialogPrimitive.Title>
                        {description ? (
                            <DialogPrimitive.Description className="t-body-small muted tnum mt-0.5">
                                {description}
                            </DialogPrimitive.Description>
                        ) : null}
                    </div>
                    <DialogPrimitive.Close asChild>
                        <Button variant="quiet" compact aria-label="Fechar">
                            <Icon name="x" />
                        </Button>
                    </DialogPrimitive.Close>
                </div>
                <div className="grid flex-1 content-start gap-4 overflow-y-auto p-5">
                    {children}
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-border bg-surface px-5 py-3">
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
    /** Ações destrutivas usam o tom de perigo (com ícone); as demais, a ação principal. */
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
                <AlertDialogPrimitive.Content className="fixed top-1/2 left-1/2 z-80 w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-overlay border border-border bg-surface p-0 text-foreground shadow-overlay data-[state=open]:animate-[dialog-in_var(--duration-base)_ease-out]">
                    <div className="flex items-start gap-3 px-5 pt-5 pb-4">
                        {tone === 'danger' ? (
                            <span
                                className="grid size-8 flex-none place-items-center rounded-full bg-danger-soft text-danger"
                                aria-hidden="true"
                            >
                                <Icon name="alert" />
                            </span>
                        ) : null}
                        <div className="grid min-w-0 gap-1">
                            <AlertDialogPrimitive.Title className="t-section pt-1.5">
                                {title}
                            </AlertDialogPrimitive.Title>
                            <AlertDialogPrimitive.Description asChild>
                                <div className="t-body-small text-foreground-soft">
                                    {body}
                                </div>
                            </AlertDialogPrimitive.Description>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 px-5 pb-5">
                        <AlertDialogPrimitive.Cancel asChild>
                            <Button>Cancelar</Button>
                        </AlertDialogPrimitive.Cancel>
                        <AlertDialogPrimitive.Action asChild>
                            <Button
                                variant={
                                    tone === 'danger' ? 'danger' : 'primary'
                                }
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
