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

/** Ação de continuidade oferecida pelo toast (ex.: "Abrir lead"). */
export interface ToastAction {
    label: string;
    onSelect: () => void;
}

interface ToastItem {
    id: number;
    message: string;
    action?: ToastAction | undefined;
}

type ShowToast = (message: string, action?: ToastAction) => void;

const ToastContext = createContext<ShowToast>(() => {});

/** Toast curto de sucesso; nunca é a única forma de comunicar um erro. */
export function useToast(): ShowToast {
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
    const show = useCallback<ShowToast>((message, action) => {
        const id = (nextId.current += 1);
        setItems((current) => [...current, { id, message, action }]);
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
                        // Com ação, o toast fica mais tempo para permitir a continuidade.
                        {...(item.action ? { duration: 6000 } : {})}
                        onOpenChange={(open) => !open && remove(item.id)}
                        data-surface="inverse"
                        className="t-label flex items-center gap-2 rounded-tile border border-inverse bg-inverse py-2 pr-2 pl-3 text-inverse-foreground shadow-floating data-[state=open]:animate-[popover-in_var(--duration-fast)_ease-out]"
                    >
                        <Icon name="check" className="text-signal-inverse" />
                        <ToastPrimitive.Description className="flex-1">
                            {item.message}
                        </ToastPrimitive.Description>
                        {item.action ? (
                            <ToastPrimitive.Action
                                altText={item.action.label}
                                asChild
                            >
                                <Button
                                    compact
                                    className="border-sidebar-selected bg-transparent text-inverse-foreground hover:bg-sidebar-hover hover:text-inverse-foreground"
                                    onClick={item.action.onSelect}
                                >
                                    {item.action.label}
                                </Button>
                            </ToastPrimitive.Action>
                        ) : null}
                        <ToastPrimitive.Close asChild>
                            <Button
                                variant="quiet"
                                compact
                                className="text-inverse-foreground hover:bg-sidebar-hover hover:text-inverse-foreground"
                                aria-label="Fechar notificação"
                            >
                                <Icon name="x" size="sm" />
                            </Button>
                        </ToastPrimitive.Close>
                    </ToastPrimitive.Root>
                ))}
                <ToastPrimitive.Viewport className="fixed right-4 bottom-4 z-90 grid w-[min(400px,calc(100vw-32px))] gap-2 outline-hidden" />
            </ToastPrimitive.Provider>
        </ToastContext>
    );
}
