import type { ReactNode } from 'react';
import { tv } from 'tailwind-variants';
import { Icon, type IconName } from './icon';

/**
 * Famílias de estado (ui-foundations.md). `attention` é o sinal de marca "precisa de
 * você" (novo interesse); `tag` marca metadado, não estado.
 */
export type BadgeTone =
    'neutral' | 'success' | 'warning' | 'info' | 'danger' | 'attention' | 'tag';

const badgeVariants = tv({
    base: 't-caption inline-flex h-5 items-center gap-1.5 rounded-badge px-2 whitespace-nowrap',
    variants: {
        tone: {
            neutral: 'bg-surface-muted text-foreground-soft',
            success: 'bg-success-soft text-success',
            warning: 'bg-warning-soft text-warning',
            info: 'bg-info-soft text-info',
            danger: 'bg-danger-soft text-danger',
            attention:
                'bg-attention-soft text-attention-foreground [&>[data-dot]]:bg-signal',
            tag: 'text-foreground-soft ring-1 ring-border-strong ring-inset',
        },
    },
    defaultVariants: { tone: 'neutral' },
});

interface BadgeProps {
    tone?: BadgeTone;
    /** Ponto indicador de estado; o texto continua sendo o portador do significado. */
    dot?: boolean;
    icon?: IconName;
    children: ReactNode;
}

/** Estado de negócio com texto explícito: a cor nunca é o único indicador. */
export function Badge({
    tone = 'neutral',
    dot = false,
    icon,
    children,
}: BadgeProps) {
    return (
        <span className={badgeVariants({ tone })}>
            {dot ? (
                <span
                    data-dot=""
                    className="size-1.5 flex-none rounded-full bg-current"
                    aria-hidden="true"
                />
            ) : null}
            {icon ? <Icon name={icon} size="sm" /> : null}
            {children}
        </span>
    );
}
