import type { ReactNode } from 'react';

// Ícones de traço único do protótipo; herdam a cor do texto (`currentColor`).
const glyphs = {
  plus: <path d="M12 5v14M5 12h14" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 16v.01" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  left: <path d="m15 18-6-6 6-6" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  star: (
    <path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.8l-5.3 2.8 1-5.8-4.2-4.1 5.9-.9L12 3.5Z" />
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.6-4.5L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.6 4.5L20 16" />
      <path d="M20 20v-4h-4" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 9-9" />
      <path d="m17 6 3 3" />
    </>
  ),
  partner: (
    <>
      <path d="M4 10v10h16V10" />
      <path d="M3 10l2-6h14l2 6" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  plan: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  category: (
    <>
      <path d="M3 12V4h8l10 10-8 8L3 12Z" />
      <circle cx="8" cy="9" r="1.2" />
    </>
  ),
  leads: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="10" y="4" width="5" height="11" rx="1.5" />
      <rect x="17" y="4" width="4" height="7" rx="1.5" />
    </>
  ),
  source: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v2M20 12h-2M12 20v-2M4 12h2" />
    </>
  ),
  swap: (
    <>
      <path d="M7 7h13M16 3l4 4-4 4M17 17H4M8 13l-4 4 4 4" />
    </>
  ),
  edit: (
    <>
      <path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z" />
      <path d="m13.5 7 3.5 3.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
      <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4" />
      <path d="M18 14.9c1.8.7 3 2.4 3.5 5.1" />
    </>
  ),
  audit: (
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
      <path d="M14 3v6h6" />
      <path d="M8 13h8M8 17h5" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </>
  ),
  right: <path d="m9 18 6-6-6-6" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof glyphs;

interface IconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'ic-sm', md: '', lg: 'ic-lg' } as const;

export function Icon({ name, size = 'md', className }: IconProps) {
  return (
    <svg
      className={['ic', sizes[size], className].filter(Boolean).join(' ')}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {glyphs[name]}
    </svg>
  );
}
