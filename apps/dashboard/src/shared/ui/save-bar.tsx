import type { ReactNode } from 'react';
import { Button } from './button';

interface SaveBarProps {
    /** Resumo do que será salvo (ex.: "+3 concedidas · −1 revogada"). */
    summary?: ReactNode;
    saveLabel?: string;
    loading?: boolean;
    /** `submit` ligado a um formulário por `form`; sem ele, usa `onSave`. */
    form?: string;
    onSave?: () => void;
    onDiscard: () => void;
}

/**
 * Barra de salvamento de formulários longos: fixa no rodapé do conteúdo e exibida pela
 * tela somente enquanto houver alterações pendentes.
 */
export function SaveBar({
    summary,
    saveLabel = 'Salvar',
    loading = false,
    form,
    onSave,
    onDiscard,
}: SaveBarProps) {
    return (
        <div
            role="region"
            aria-label="Alterações não salvas"
            className="sticky bottom-0 z-25 -mx-4 mt-4 flex flex-wrap items-center gap-3 border-t border-border bg-surface px-4 py-2.5 shadow-floating md:-mx-(--content-pad-x) md:px-(--content-pad-x)"
        >
            <span className="t-caption inline-flex items-center gap-1.5 font-semibold text-warning">
                <span
                    className="size-1.5 rounded-full bg-current"
                    aria-hidden="true"
                />
                Alterações não salvas
            </span>
            {summary ? (
                <span className="t-body-small text-muted-foreground">
                    {summary}
                </span>
            ) : null}
            <div className="ml-auto flex flex-wrap gap-2">
                <Button variant="quiet" disabled={loading} onClick={onDiscard}>
                    Descartar
                </Button>
                <Button
                    type={form ? 'submit' : 'button'}
                    {...(form ? { form } : {})}
                    variant="primary"
                    loading={loading}
                    {...(onSave ? { onClick: onSave } : {})}
                >
                    {saveLabel}
                </Button>
            </div>
        </div>
    );
}
