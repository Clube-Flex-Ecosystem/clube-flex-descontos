import type { ButtonHTMLAttributes, Ref } from 'react';
import { tv } from 'tailwind-variants';
import { cn } from './cn';

/**
 * `primary`: a ação principal da região (no máximo uma). `danger-quiet`: entrada de
 * uma ação destrutiva; `danger` fica reservado ao ponto de confirmação.
 */
type Variant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'danger-quiet';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    /** Impede reenvio acidental sem remover o contexto do usuário. */
    loading?: boolean;
    block?: boolean;
    /** Compacto para ações em linhas de tabela e barras de ferramentas. */
    compact?: boolean;
    ref?: Ref<HTMLButtonElement>;
}

/** Também aplicada a links que agem como botão (navegação para criar ou voltar). */
export const buttonVariants = tv({
    base: 't-button inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-control border px-3 whitespace-nowrap no-underline transition-colors duration-fast disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-muted disabled:text-placeholder md:min-h-control-md',
    variants: {
        variant: {
            primary:
                'border-primary bg-primary text-primary-foreground hover:border-primary-hover hover:bg-primary-hover active:border-primary-active active:bg-primary-active',
            secondary:
                'border-border-strong bg-surface text-foreground hover:border-control-border hover:bg-background active:bg-surface-muted aria-expanded:bg-surface-muted',
            danger: 'border-danger bg-danger text-danger-foreground hover:border-danger-hover hover:bg-danger-hover',
            'danger-quiet':
                'border-border-strong bg-surface text-danger hover:border-danger hover:bg-danger-soft',
            quiet: 'border-transparent bg-transparent text-foreground-soft hover:bg-surface-muted hover:text-foreground aria-expanded:bg-surface-muted aria-expanded:text-foreground',
        },
        compact: { true: 'min-h-9 px-2.5 md:min-h-control-sm' },
        block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'secondary' },
});

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
            className={cn(
                buttonVariants({ variant, compact, block }),
                className,
            )}
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
