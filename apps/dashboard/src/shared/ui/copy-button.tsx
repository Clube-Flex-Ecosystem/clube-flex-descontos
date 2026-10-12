import { useEffect, useState } from 'react';
import { Button } from './button';
import { Icon } from './icon';
import { cn } from './cn';

/** Copia um valor; a confirmação aparece no próprio botão por 2s, sem toast. */
export function CopyButton({
    value,
    label = 'Copiar',
    ariaLabel,
    compact = true,
    variant = 'quiet',
    className,
}: {
    value: string;
    label?: string;
    ariaLabel?: string;
    compact?: boolean;
    variant?: 'quiet' | 'secondary';
    className?: string;
}) {
    const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

    useEffect(() => {
        if (status === 'idle') return;
        const timer = setTimeout(() => setStatus('idle'), 2000);
        return () => clearTimeout(timer);
    }, [status]);

    return (
        <Button
            variant={variant}
            compact={compact}
            className={cn(compact ? 'min-h-6 px-2 md:min-h-6' : '', className)}
            aria-label={ariaLabel ?? label}
            onClick={() =>
                // Sem permissão de área de transferência, o valor continua visível para cópia manual.
                void navigator.clipboard.writeText(value).then(
                    () => setStatus('copied'),
                    () => setStatus('failed'),
                )
            }
        >
            <Icon name={status === 'copied' ? 'check' : 'copy'} size="sm" />
            <span aria-live="polite">
                {status === 'copied'
                    ? 'Copiado'
                    : status === 'failed'
                      ? 'Copie manualmente'
                      : label}
            </span>
        </Button>
    );
}
