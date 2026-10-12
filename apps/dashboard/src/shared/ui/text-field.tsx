import { useId, useState, type InputHTMLAttributes, type Ref } from 'react';
import { Icon } from './icon';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string | undefined;
  /** Exibe o controle para mostrar ou ocultar o conteúdo digitado. */
  revealable?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/** Rótulo sempre visível; ajuda e erro ficam associados programaticamente ao campo. */
export function TextField({
  label,
  hint,
  error,
  revealable = false,
  type = 'text',
  ref,
  ...input
}: TextFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const describedBy =
    [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="t-label">
        {label}
      </label>
      <div className="relative flex">
        <input
          {...input}
          ref={ref}
          id={id}
          type={revealable && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            'min-h-11 w-full rounded-control border border-control-border bg-surface px-3 text-foreground md:min-h-control-lg',
            'hover:border-control-border-hover focus-visible:border-focus focus-visible:ring-1 focus-visible:ring-focus focus-visible:outline-hidden',
            'aria-invalid:border-danger',
            revealable ? 'pr-20' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        {revealable ? (
          <button
            type="button"
            className="t-caption absolute inset-y-1 right-1 cursor-pointer rounded-badge px-2.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            aria-pressed={revealed}
            onClick={() => setRevealed((value) => !value)}
          >
            {revealed ? 'Ocultar' : 'Mostrar'}
          </button>
        ) : null}
      </div>
      {hint ? (
        <p className="t-caption muted" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          className="t-caption flex items-start gap-1.5 text-danger"
          id={`${id}-error`}
        >
          <Icon name="alert" size="sm" className="mt-px" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
