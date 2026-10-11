import {
  useEffect,
  useRef,
  type FormEventHandler,
  type ReactNode,
} from 'react';
import { Button } from './button';
import { Icon } from './icon';

/** Abre o `<dialog>` modal na montagem: o navegador contém e restaura o foco. */
function useModalDialog(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const handleClose = () => onCloseRef.current();
    dialog.addEventListener('close', handleClose);
    // Desmontar remove o elemento e, com ele, o modal; fechá-lo aqui dispararia `close`
    // de forma assíncrona (e duas vezes sob StrictMode), acionando `onClose` indevidamente.
    return () => dialog.removeEventListener('close', handleClose);
  }, []);

  return ref;
}

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

/** Dialog lateral para formulários curtos; montado apenas enquanto estiver aberto. */
export function Drawer({
  title,
  description,
  submitLabel = 'Salvar',
  loading = false,
  onSubmit,
  onClose,
  children,
}: DrawerProps) {
  const ref = useModalDialog(onClose);
  return (
    <dialog
      ref={ref}
      aria-labelledby="drawer-title"
      className="m-0 mr-0 ml-auto h-dvh max-h-dvh w-full max-w-110 bg-surface p-0 text-foreground shadow-lg backdrop:bg-overlay open:flex open:animate-[drawer-in_var(--duration-base)_ease-out] open:flex-col"
    >
      <form
        className="flex h-full min-h-0 flex-col"
        noValidate
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 id="drawer-title" className="t-section">
              {title}
            </h2>
            {description ? (
              <p className="t-small muted">{description}</p>
            ) : null}
          </div>
          <Button variant="quiet" aria-label="Fechar" onClick={onClose}>
            <Icon name="x" />
          </Button>
        </div>
        <div className="grid flex-1 content-start gap-4 overflow-y-auto p-5">
          {children}
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-surface-hover px-5 py-3">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={loading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </dialog>
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

/** Dialog lateral somente leitura: apenas leitura e fechamento, sem envio. */
export function DetailDrawer({
  title,
  description,
  note,
  onClose,
  children,
}: DetailDrawerProps) {
  const ref = useModalDialog(onClose);
  return (
    <dialog
      ref={ref}
      aria-labelledby="detail-drawer-title"
      className="m-0 mr-0 ml-auto h-dvh max-h-dvh w-full max-w-110 bg-surface p-0 text-foreground shadow-lg backdrop:bg-overlay open:flex open:animate-[drawer-in_var(--duration-base)_ease-out] open:flex-col"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 id="detail-drawer-title" className="t-section">
              {title}
            </h2>
            {description ? (
              <p className="t-small muted tnum">{description}</p>
            ) : null}
          </div>
          <Button variant="quiet" aria-label="Fechar" onClick={onClose}>
            <Icon name="x" />
          </Button>
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
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </dialog>
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

/** Confirmação central de ação sensível; descreve o efeito antes de executá-lo. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useModalDialog(onCancel);
  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-xl bg-surface p-0 text-foreground shadow-lg backdrop:bg-overlay open:animate-[dialog-in_var(--duration-base)_ease-out]"
    >
      <div className="grid gap-3 p-5">
        <h2 id="confirm-title" className="t-section">
          {title}
        </h2>
        <p className="t-body muted">{body}</p>
      </div>
      <div className="flex justify-end gap-2 px-5 pb-5">
        <Button onClick={onCancel}>Cancelar</Button>
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
