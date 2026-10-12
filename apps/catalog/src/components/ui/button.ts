type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'sm';

const base =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control border-[1.5px] font-semibold no-underline transition-[background-color,box-shadow,border-color,transform] duration-120 ease-out cursor-pointer disabled:cursor-not-allowed disabled:transform-none disabled:border-border disabled:bg-surface-muted disabled:text-placeholder disabled:shadow-none';

const variants: Record<ButtonVariant, string> = {
    primary:
        'border-transparent bg-primary text-primary-foreground shadow-brand hover:bg-primary-hover active:translate-y-px active:bg-primary-active active:shadow-brand-pressed',
    secondary:
        'border-border-strong bg-surface text-foreground shadow-soft hover:bg-surface-muted active:translate-y-px active:shadow-none',
    ghost: 'border-transparent bg-transparent text-foreground hover:bg-surface-muted',
};

const sizes: Record<ButtonSize, string> = {
    md: 'min-h-12 px-5.5 text-control',
    sm: 'min-h-11 px-4 text-control-sm',
};

export function button(
    variant: ButtonVariant = 'primary',
    size: ButtonSize = 'md',
): string {
    return `${base} ${variants[variant]} ${sizes[size]}`;
}
