import type { ReactNode } from 'react';
import { Icon } from './icon';

interface AlertProps {
  tone: 'danger' | 'success' | 'info' | 'warning';
  /** Resumo em destaque; o restante vai em `children`. */
  title?: string;
  children?: ReactNode;
  /** Ação acionável associada à mensagem (ex.: tentar novamente). */
  action?: ReactNode;
}

const tones: Record<AlertProps['tone'], string> = {
  danger: 'bg-danger-soft',
  success: 'bg-success-soft',
  info: 'bg-info-soft',
  warning: 'bg-warning-soft',
};

/** Erros usam `role="alert"`; os demais são anunciados de forma educada. */
export function Alert({ tone, title, children, action }: AlertProps) {
  const assertive = tone === 'danger' || tone === 'warning';
  return (
    <div
      className={`t-small flex items-start gap-2 rounded-md px-3 py-2.5 text-foreground ${tones[tone]}`}
      role={assertive ? 'alert' : 'status'}
    >
      <Icon name={tone === 'success' ? 'check' : 'alert'} className="mt-0.5" />
      <div className="grid min-w-0 gap-1.5">
        {title ? <strong className="font-semibold">{title}</strong> : null}
        {children ? <div>{children}</div> : null}
        {action ? <div>{action}</div> : null}
      </div>
    </div>
  );
}
