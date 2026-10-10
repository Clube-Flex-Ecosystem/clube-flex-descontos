import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Icon } from '../ui/icon';

interface ToastItem {
  id: number;
  message: string;
}

const ToastContext = createContext<(message: string) => void>(() => {});

/** Toast curto de sucesso; nunca é a única forma de comunicar um erro. */
export function useToast(): (message: string) => void {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const show = useCallback((message: string) => {
    const id = (nextId.current += 1);
    setItems((current) => [...current, { id, message }]);
    window.setTimeout(
      () => setItems((current) => current.filter((item) => item.id !== id)),
      3200,
    );
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-6 left-1/2 z-80 grid -translate-x-1/2 gap-2"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="t-label flex items-center gap-2 rounded-lg bg-sidebar-active px-3.5 py-2.5 text-sidebar-foreground shadow-lg"
          >
            <Icon name="check" className="text-accent" />
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
