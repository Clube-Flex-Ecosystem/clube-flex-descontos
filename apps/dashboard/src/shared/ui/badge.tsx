import type { ReactNode } from 'react';
import { Icon, type IconName } from './icon';

export type BadgeTone =
  'neutral' | 'success' | 'warning' | 'info' | 'danger' | 'accent' | 'outline';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-soft text-neutral',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
  danger: 'bg-danger-soft text-danger',
  accent: 'bg-accent-subtle text-accent-foreground',
  outline: 'text-muted-foreground ring-1 ring-border-strong ring-inset',
};

interface BadgeProps {
  tone?: BadgeTone;
  /** Ponto indicador; o texto continua sendo o portador do significado. */
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
    <span
      className={`t-caption inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 whitespace-nowrap ${tones[tone]}`}
    >
      {dot ? (
        <span
          className="size-1.5 flex-none rounded-full bg-current"
          aria-hidden="true"
        />
      ) : null}
      {icon ? <Icon name={icon} size="sm" /> : null}
      {children}
    </span>
  );
}
