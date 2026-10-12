import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  Check,
  ChevronLeft,
  Copy,
  FileText,
  Kanban,
  KeyRound,
  Layers3,
  LockKeyhole,
  LogOut,
  Menu,
  MoreHorizontal,
  PanelLeft,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Star,
  Store,
  Tag,
  Trash2,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react';

// Mapa semântico local: os módulos continuam usando nomes estáveis,
// enquanto o desenho dos ícones fica a cargo do Lucide.
const icons = {
  plus: Plus,
  more: MoreHorizontal,
  x: X,
  check: Check,
  alert: AlertCircle,
  search: Search,
  left: ChevronLeft,
  lock: LockKeyhole,
  star: Star,
  refresh: RefreshCw,
  key: KeyRound,
  partner: Store,
  plan: Layers3,
  category: Tag,
  leads: Kanban,
  source: ShieldAlert,
  swap: ArrowLeftRight,
  edit: Pencil,
  users: UsersRound,
  audit: FileText,
  trash: Trash2,
  right: ArrowRight,
  copy: Copy,
  menu: Menu,
  panel: PanelLeft,
  logout: LogOut,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

interface IconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'ic-sm', md: '', lg: 'ic-lg' } as const;

export function Icon({ name, size = 'md', className }: IconProps) {
  const Glyph = icons[name];
  return (
    <Glyph
      className={['ic', sizes[size], className].filter(Boolean).join(' ')}
      aria-hidden="true"
      strokeWidth={1.75}
    />
  );
}
