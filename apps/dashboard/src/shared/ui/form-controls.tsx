import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

const controlBase =
  'w-full rounded-md border border-control-border bg-control px-3 shadow-control-inset hover:border-control-border-hover focus:border-focus focus:ring-4 focus:ring-focus-ring focus:outline-hidden aria-invalid:border-danger aria-invalid:focus:ring-danger-ring read-only:bg-surface-muted read-only:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60';

/** Altura compacta em sub-tabelas; padrão de formulário (`40px`; `44px` no móvel). */
const sizes = {
  form: 'min-h-11 md:min-h-control-lg',
  compact: 'min-h-11 md:min-h-control-md',
} as const;

interface FieldFrameProps {
  id: string;
  label: ReactNode;
  optional?: boolean | undefined;
  hint?: ReactNode;
  error?: string | undefined;
  className?: string;
  children: ReactNode;
}

function FieldFrame({
  id,
  label,
  optional,
  hint,
  error,
  className,
  children,
}: FieldFrameProps) {
  return (
    <div
      className={['grid content-start gap-1.5', className]
        .filter(Boolean)
        .join(' ')}
    >
      <label htmlFor={id} className="t-label">
        {label}
        {optional ? (
          <span className="ml-1 font-medium text-muted-foreground">
            (opcional)
          </span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p className="t-caption muted" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          className="t-caption flex items-center gap-1.5 text-danger"
          id={`${id}-error`}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, hint: ReactNode, error?: string) =>
  [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ') || undefined;

interface InputFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  label: ReactNode;
  optional?: boolean;
  hint?: ReactNode;
  error?: string | undefined;
  /** Texto fixo antes do campo, como o endereço-base de um identificador público. */
  prefix?: string;
  mono?: boolean;
  ref?: Ref<HTMLInputElement>;
  frameClassName?: string;
}

export function InputField({
  label,
  optional,
  hint,
  error,
  prefix,
  mono,
  ref,
  frameClassName,
  className,
  ...input
}: InputFieldProps) {
  const id = useId();
  const field = (
    <input
      {...input}
      ref={ref}
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, hint, error)}
      className={[
        controlBase,
        sizes.form,
        mono ? 'font-mono' : '',
        prefix ? 'rounded-l-none' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
  return (
    <FieldFrame
      id={id}
      label={label}
      optional={optional}
      hint={hint}
      error={error}
      {...(frameClassName ? { className: frameClassName } : {})}
    >
      {prefix ? (
        <div className="flex">
          <span className="t-small inline-flex items-center rounded-l-md border border-r-0 border-control-border bg-surface-muted px-3 whitespace-nowrap text-muted-foreground">
            {prefix}
          </span>
          {field}
        </div>
      ) : (
        field
      )}
    </FieldFrame>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode;
  optional?: boolean;
  hint?: ReactNode;
  error?: string | undefined;
  ref?: Ref<HTMLTextAreaElement>;
  frameClassName?: string;
}

export function TextareaField({
  label,
  optional,
  hint,
  error,
  ref,
  frameClassName,
  className,
  ...input
}: TextareaFieldProps) {
  const id = useId();
  return (
    <FieldFrame
      id={id}
      label={label}
      optional={optional}
      hint={hint}
      error={error}
      {...(frameClassName ? { className: frameClassName } : {})}
    >
      <textarea
        {...input}
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={[controlBase, 'min-h-20 resize-y py-2', className]
          .filter(Boolean)
          .join(' ')}
      />
    </FieldFrame>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | undefined;
  compact?: boolean;
  /** Oculta o rótulo visualmente (permanece acessível), para uso em sub-tabelas. */
  hideLabel?: boolean;
  ref?: Ref<HTMLSelectElement>;
}

export function SelectField({
  label,
  hint,
  error,
  compact,
  hideLabel,
  ref,
  className,
  children,
  ...select
}: SelectFieldProps) {
  const id = useId();
  return (
    <FieldFrame
      id={id}
      label={hideLabel ? <span className="sr-only">{label}</span> : label}
      hint={hint}
      error={error}
    >
      <select
        {...select}
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={[
          controlBase,
          compact ? sizes.compact : sizes.form,
          'pr-8',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </select>
    </FieldFrame>
  );
}

interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  label: ReactNode;
  hint?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

/** Alternância liga/desliga com o estado também em texto (hint) e foco visível. */
export function Switch({ label, hint, ref, ...input }: SwitchProps) {
  return (
    <label className="relative inline-flex cursor-pointer items-center gap-2.5 has-disabled:cursor-not-allowed has-disabled:opacity-60">
      <input {...input} ref={ref} type="checkbox" className="peer sr-only" />
      <span
        className="relative h-5 w-8 flex-none rounded-full bg-border-strong transition-colors duration-fast peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-surface after:shadow-sm after:transition-transform after:duration-fast peer-checked:after:translate-x-3"
        aria-hidden="true"
      />
      <span>
        <strong className="t-label block font-semibold">{label}</strong>
        {hint ? <span className="t-caption muted block">{hint}</span> : null}
      </span>
    </label>
  );
}

/** Opção alternável de seleção múltipla (ex.: categorias do parceiro). */
export function Chip({
  pressed,
  disabled,
  title,
  onToggle,
  children,
}: {
  pressed: boolean;
  disabled?: boolean;
  title?: string;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      title={title}
      onClick={onToggle}
      className="t-label inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-control-border bg-surface px-3 hover:border-control-border-hover disabled:cursor-not-allowed disabled:border-dashed disabled:text-muted-foreground aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent-foreground md:min-h-control-md"
    >
      {pressed ? <span aria-hidden="true">✓</span> : null}
      {children}
    </button>
  );
}

const tableControl =
  'min-h-11 w-full rounded-md border border-control-border bg-control px-2.5 shadow-control-inset hover:border-control-border-hover focus:border-focus focus:ring-4 focus:ring-focus-ring focus:outline-hidden aria-invalid:border-danger aria-invalid:focus:ring-danger-ring read-only:bg-surface-muted read-only:text-muted-foreground md:min-h-control-md';

/** Campo de sub-tabela: o rótulo é a coluna, exposto por `aria-label`. */
export function TableInput({
  ref,
  className,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & {
  'aria-label': string;
  ref?: Ref<HTMLInputElement>;
}) {
  return (
    <input
      {...input}
      ref={ref}
      className={[tableControl, className].filter(Boolean).join(' ')}
    />
  );
}

export function TableSelect({
  ref,
  className,
  children,
  ...select
}: SelectHTMLAttributes<HTMLSelectElement> & {
  'aria-label': string;
  ref?: Ref<HTMLSelectElement>;
}) {
  return (
    <select
      {...select}
      ref={ref}
      className={[tableControl, 'pr-8', className].filter(Boolean).join(' ')}
    >
      {children}
    </select>
  );
}
