import type { ReactNode } from 'react';

interface AlertProps {
  tone: 'danger' | 'success' | 'info';
  children: ReactNode;
}

const tones: Record<AlertProps['tone'], string> = {
  danger: 'bg-danger-soft',
  success: 'bg-success-soft',
  info: 'bg-info-soft',
};

/** Erros usam `role="alert"`; os demais são anunciados de forma educada. */
export function Alert({ tone, children }: AlertProps) {
  return (
    <div
      className={`t-small flex items-start gap-2 rounded-md px-3 py-2.5 text-foreground ${tones[tone]}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <div>{children}</div>
    </div>
  );
}
