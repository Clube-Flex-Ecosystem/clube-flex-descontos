import type { ButtonHTMLAttributes, Ref } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'sidebar';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Impede reenvio acidental sem remover o contexto do usuário. */
  loading?: boolean;
  block?: boolean;
  /** Compacto para ações em linhas de tabela e barras de ferramentas. */
  compact?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

// Alvo de 44px em interações móveis; 36px a partir de `md` (ui-foundations).
const base =
  't-label inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 whitespace-nowrap no-underline transition-colors duration-fast md:min-h-control-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<Variant, string> = {
  primary:
    'border-primary-edge bg-primary-raised text-primary-foreground shadow-brand-raised hover:bg-primary-raised-hover hover:shadow-brand-raised-hover active:shadow-brand-pressed',
  secondary:
    'border-control-border bg-control text-foreground shadow-control-raised hover:border-control-border-hover hover:shadow-control-raised-hover active:shadow-control-pressed',
  danger:
    'border-danger-edge bg-danger-raised text-primary-foreground shadow-brand-raised hover:bg-danger hover:shadow-brand-raised-hover active:shadow-brand-pressed',
  quiet:
    'border-transparent bg-transparent text-muted-foreground hover:bg-surface-muted hover:text-foreground',
  sidebar:
    'border-transparent bg-transparent text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground',
};

export function Button({
  variant = 'secondary',
  loading = false,
  block = false,
  compact = false,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={[
        base,
        variants[variant],
        compact ? 'min-h-9 px-2.5 md:min-h-control-sm' : '',
        block ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span
          className="spin size-3.5 rounded-full border-2 border-current border-r-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}
