import * as ToastPrimitive from '@radix-ui/react-toast';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Button } from '../ui/button';
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
  const remove = useCallback(
    (id: number) =>
      setItems((current) => current.filter((item) => item.id !== id)),
    [],
  );
  const show = useCallback((message: string) => {
    const id = (nextId.current += 1);
    setItems((current) => [...current, { id, message }]);
  }, []);
  const value = useMemo(() => show, [show]);

  return (
    <ToastContext value={value}>
      <ToastPrimitive.Provider duration={3200} swipeDirection="down">
        {children}
        {items.map((item) => (
          <ToastPrimitive.Root
            key={item.id}
            open
            onOpenChange={(open) => !open && remove(item.id)}
            className="t-label flex items-center gap-2 rounded-lg bg-sidebar-active px-3.5 py-2.5 text-sidebar-foreground shadow-lg data-[state=open]:animate-[popover-in_var(--duration-fast)_ease-out]"
          >
            <Icon name="check" className="text-accent" />
            <ToastPrimitive.Description className="flex-1">
              {item.message}
            </ToastPrimitive.Description>
            <ToastPrimitive.Close asChild>
              <Button variant="sidebar" compact aria-label="Fechar notificação">
                <Icon name="x" size="sm" />
              </Button>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed right-4 bottom-4 z-90 grid w-[min(360px,calc(100vw-32px))] gap-2 outline-hidden" />
      </ToastPrimitive.Provider>
    </ToastContext>
  );
}
