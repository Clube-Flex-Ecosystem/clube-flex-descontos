import type { ReactNode } from 'react';
import { tv } from 'tailwind-variants';
import { Icon } from './icon';

interface AlertProps {
    tone: 'danger' | 'success' | 'info' | 'warning';
    /** Resumo em destaque; o restante vai em `children`. */
    title?: string;
    children?: ReactNode;
    /** Ação acionável associada à mensagem (ex.: tentar novamente). */
    action?: ReactNode;
}

const alertVariants = tv({
    base: 't-body-small flex items-start gap-2.5 rounded-card px-3 py-2.5 text-foreground',
    variants: {
        tone: {
            danger: 'bg-danger-soft [&>svg]:text-danger',
            success: 'bg-success-soft [&>svg]:text-success',
            info: 'bg-info-soft [&>svg]:text-info',
            warning: 'bg-warning-soft [&>svg]:text-warning',
        },
    },
});

/** Erros usam `role="alert"`; os demais são anunciados de forma educada. */
export function Alert({ tone, title, children, action }: AlertProps) {
    const assertive = tone === 'danger' || tone === 'warning';
    return (
        <div
            className={alertVariants({ tone })}
            role={assertive ? 'alert' : 'status'}
        >
            <Icon
                name={tone === 'success' ? 'check' : 'alert'}
                className="mt-0.5"
            />
            <div className="grid min-w-0 gap-1.5">
                {title ? (
                    <strong className="font-semibold">{title}</strong>
                ) : null}
                {children ? <div>{children}</div> : null}
                {action ? <div>{action}</div> : null}
            </div>
        </div>
    );
}
