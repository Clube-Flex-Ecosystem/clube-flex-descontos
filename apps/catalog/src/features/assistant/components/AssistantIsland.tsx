import { zodResolver } from '@hookform/resolvers/zod';
import {
    CONTACT_CONSENT,
    publicContactRequestSchema,
    type ContactConsent,
    type PublicContactRequest,
} from '@flex/contracts';
import { useEffect, useReducer, useRef, useState } from 'react';
import {
    AlertCircle,
    ArrowRight,
    ArrowUpRight,
    Bot,
    MessageCircle,
    X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { button } from '../../../components/ui/button';
import type { z } from 'zod';
import { getContactConsent, sendContactRequest } from '../api/public-contact';

type Step =
    | 'closed'
    | 'welcome'
    | 'partner'
    | 'name'
    | 'whatsapp'
    | 'email'
    | 'consent'
    | 'review'
    | 'sending'
    | 'success'
    | 'error';
type Message = { by: 'bot' | 'user'; content: React.ReactNode };
type ContactFormInput = z.input<typeof publicContactRequestSchema>;
type State = { step: Step; messages: Message[]; opener: HTMLElement | null };
type Action =
    | { type: 'open'; mode?: string; opener: HTMLElement }
    | { type: 'step'; step: Step; message?: Message }
    | { type: 'close' }
    | { type: 'restart' };
const greeting: Message = {
    by: 'bot',
    content:
        'Olá! 👋 Seja bem-vindo ao Clube Flex! Que bom ter você por aqui. Como podemos ajudar hoje?',
};
function reducer(state: State, action: Action): State {
    if (action.type === 'close') return { ...state, step: 'closed' };
    if (action.type === 'restart')
        return {
            ...state,
            step: 'welcome',
            messages: [{ by: 'bot', content: 'Como posso ajudar?' }],
        };
    if (action.type === 'step')
        return {
            ...state,
            step: action.step,
            messages: action.message
                ? [...state.messages, action.message]
                : state.messages,
        };
    const base = {
        step: 'welcome' as Step,
        messages: [greeting],
        opener: action.opener,
    };
    if (action.mode === 'flex') return chooseFlex(base);
    if (action.mode === 'partner') return choosePartner(base);
    return base;
}
const chooseFlex = (state: State): State => ({
    ...state,
    step: 'name',
    messages: [
        ...state.messages,
        { by: 'user', content: 'Quero ser Flex' },
        {
            by: 'bot',
            content:
                'Que bom! Vou pedir alguns dados para a equipe comercial entrar em contato. Qual é o seu nome?',
        },
    ],
});
const choosePartner = (state: State): State => ({
    ...state,
    step: 'partner',
    messages: [
        ...state.messages,
        { by: 'user', content: 'Quero ser parceiro' },
        {
            by: 'bot',
            content: (
                <>
                    Que bom ter você interessado em fazer parte do Clube Flex!
                    🤝
                    <br />
                    <br />
                    Para dar o próximo passo, envie sua proposta para{' '}
                    <a
                        href="mailto:comercial@flexcard.org.br"
                        className="font-semibold underline underline-offset-2"
                    >
                        comercial@flexcard.org.br
                    </a>
                    .
                    <br />
                    <br />
                    Para agilizar a análise, inclua:
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>Nome do responsável</li>
                        <li>Nome da empresa ou profissional</li>
                        <li>Telefone ou WhatsApp</li>
                        <li>Cidade de atuação</li>
                        <li>Serviços oferecidos</li>
                        <li>Proposta de desconto para os membros do clube</li>
                    </ul>
                    <br />
                    Nossa equipe vai avaliar sua proposta e entrar em contato
                    para conversar sobre os próximos passos.
                </>
            ),
        },
    ],
});

export default function AssistantIsland() {
    const [state, dispatch] = useReducer(reducer, {
        step: 'closed',
        messages: [],
        opener: null,
    });
    const [consent, setConsent] = useState<ContactConsent>(CONTACT_CONSENT);
    const [accepted, setAccepted] = useState(false);
    const panel = useRef<HTMLDivElement>(null);
    const log = useRef<HTMLDivElement>(null);
    const form = useForm<ContactFormInput, unknown, PublicContactRequest>({
        resolver: zodResolver(publicContactRequestSchema),
        defaultValues: {
            name: '',
            whatsapp: '',
            email: '',
            consent: true as const,
            consentVersion: CONTACT_CONSENT.version,
            source: 'catalog' as const,
        },
        mode: 'onSubmit',
    });
    const values = form.watch();
    useEffect(() => {
        getContactConsent()
            .then((value) => {
                setConsent(value);
                form.setValue('consentVersion', value.version);
            })
            .catch(() => undefined);
    }, [form]);
    useEffect(() => {
        const open = (event: Event) => {
            const target = (event.target as HTMLElement).closest<HTMLElement>(
                '[data-open-assistant]',
            );
            if (target) {
                event.preventDefault();
                dispatch({
                    type: 'open',
                    mode: target.dataset.openAssistant,
                    opener: target,
                });
            }
        };
        document.addEventListener('click', open);
        return () => document.removeEventListener('click', open);
    }, []);
    useEffect(() => {
        document.body.classList.toggle(
            'assistant-open',
            state.step !== 'closed',
        );
        if (state.step !== 'closed')
            requestAnimationFrame(() =>
                panel.current
                    ?.querySelector<HTMLElement>('button, a, input')
                    ?.focus(),
            );
        else state.opener?.focus();
    }, [state.step, state.opener]);
    useEffect(() => {
        if (log.current) log.current.scrollTop = log.current.scrollHeight;
    }, [state.messages, state.step]);
    const close = () => dispatch({ type: 'close' });
    const add = (step: Step, user: React.ReactNode, bot: React.ReactNode) => {
        dispatch({
            type: 'step',
            step,
            message: { by: 'user', content: user },
        });
        setTimeout(
            () =>
                dispatch({
                    type: 'step',
                    step,
                    message: { by: 'bot', content: bot },
                }),
            0,
        );
    };
    const field = async (name: 'name' | 'whatsapp' | 'email') => {
        if (!(await form.trigger(name))) return;
        const value = form.getValues(name);
        if (name === 'name')
            add(
                'whatsapp',
                value,
                `Prazer, ${String(value).split(' ')[0]}! Qual é o seu WhatsApp com DDD?`,
            );
        if (name === 'whatsapp')
            add(
                'email',
                value,
                'Quer informar também um e-mail? Se preferir, pode pular.',
            );
        if (name === 'email')
            add(
                'consent',
                value || 'Pular e-mail',
                'Para continuar, preciso da sua autorização para contato.',
            );
    };
    const submit = form.handleSubmit(async (data) => {
        dispatch({ type: 'step', step: 'sending' });
        try {
            await sendContactRequest(data);
            form.reset({
                name: '',
                whatsapp: '',
                email: '',
                consent: true,
                consentVersion: consent.version,
                source: 'catalog',
            });
            dispatch({
                type: 'step',
                step: 'success',
                message: {
                    by: 'bot',
                    content:
                        'Recebemos seus dados. A equipe do Clube Flex vai entrar em contato pelo WhatsApp informado. Obrigado!',
                },
            });
        } catch {
            dispatch({ type: 'step', step: 'error' });
        }
    });
    const onKeys = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape') close();
        if (event.key !== 'Tab' || innerWidth >= 640 || !panel.current) return;
        const focusable = [
            ...panel.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]),a[href],input',
            ),
        ];
        if (event.shiftKey && document.activeElement === focusable[0]) {
            event.preventDefault();
            focusable.at(-1)?.focus();
        } else if (
            !event.shiftKey &&
            document.activeElement === focusable.at(-1)
        ) {
            event.preventDefault();
            focusable[0]?.focus();
        }
    };
    const error = (name: 'name' | 'whatsapp' | 'email') =>
        form.formState.errors[name]?.message;
    const input = (
        name: 'name' | 'whatsapp' | 'email',
        label: string,
        type = 'text',
        placeholder = '',
    ) => (
        <form
            className="grid gap-2"
            onSubmit={(e) => {
                e.preventDefault();
                void field(name);
            }}
        >
            <label
                className="text-control-sm font-semibold"
                htmlFor={`assistant-${name}`}
            >
                {label}
            </label>
            <div className="flex gap-2">
                <input
                    id={`assistant-${name}`}
                    type={type}
                    placeholder={placeholder}
                    autoComplete={
                        name === 'name'
                            ? 'name'
                            : name === 'whatsapp'
                              ? 'tel-national'
                              : 'email'
                    }
                    aria-invalid={Boolean(error(name))}
                    className="min-h-12 min-w-0 flex-1 rounded-control border-[1.5px] border-control-border bg-surface px-3.5 text-base text-foreground aria-invalid:border-danger"
                    {...form.register(name)}
                />
                <button
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-control border-0 bg-primary text-primary-foreground shadow-brand hover:bg-primary-hover active:bg-primary-active active:shadow-brand-pressed"
                    type="submit"
                    aria-label="Continuar"
                >
                    <ArrowRight
                        className="h-4 w-4"
                        aria-hidden="true"
                        strokeWidth={1.75}
                    />
                </button>
            </div>
            {error(name) && (
                <p
                    className="flex items-center gap-1.5 text-sm text-danger"
                    role="alert"
                >
                    <AlertCircle
                        className="h-4 w-4"
                        aria-hidden="true"
                        strokeWidth={1.75}
                    />{' '}
                    {error(name) === 'INVALID_PHONE_NUMBER'
                        ? 'Informe um WhatsApp com DDD, por exemplo (21) 99999-9999.'
                        : error(name) === 'INVALID_EMAIL'
                          ? 'Informe um e-mail válido.'
                          : 'Preencha este campo.'}
                </p>
            )}
            {name === 'email' && (
                <button
                    className="min-h-11 justify-self-start border-0 bg-transparent px-1 text-left font-semibold text-foreground underline decoration-brand-signal decoration-2 underline-offset-4"
                    type="button"
                    onClick={() => {
                        form.setValue('email', '');
                        add(
                            'consent',
                            'Pular e-mail',
                            'Para continuar, preciso da sua autorização para contato.',
                        );
                    }}
                >
                    Pular e-mail
                </button>
            )}
        </form>
    );
    return (
        <>
            <button
                type="button"
                data-open-assistant
                aria-label="Conversar com o assistente virtual do Flex"
                className="
        group fixed z-40
        right-4 bottom-[calc(16px+env(safe-area-inset-bottom))]
        sm:right-5 sm:bottom-5

        flex size-14 items-center justify-center
        sm:h-auto sm:w-auto sm:gap-3
        sm:px-4 sm:py-3

        rounded-full border border-white/10
        bg-sidebar text-surface shadow-float

        transition-[transform,background-color,box-shadow]
        duration-200 ease-out
        hover:bg-sidebar-raised
        sm:hover:-translate-y-1
        active:scale-95

        focus-visible:outline-2
        focus-visible:outline-offset-4
        focus-visible:outline-brand-signal
        motion-reduce:transform-none
        motion-reduce:transition-none
    "
            >
                <span className="grid size-10 shrink-0 place-items-center rounded-full sm:bg-white/10">
                    <Bot
                        className="size-6 sm:size-5"
                        aria-hidden="true"
                        strokeWidth={1.75}
                    />
                </span>

                <span className="hidden flex-col items-start gap-0.5 text-left sm:flex">
                    <span className="text-sm font-semibold">
                        Posso te ajudar? 👋
                    </span>
                    <span className="text-xs text-white/75">
                        Sou o assistente virtual do Flex.
                    </span>
                </span>

                <ArrowUpRight
                    className="
            ml-1 hidden size-5 shrink-0
            text-brand-signal
            transition-transform duration-200
            group-hover:translate-x-0.5
            group-hover:-translate-y-0.5
            sm:block
        "
                    aria-hidden="true"
                />
            </button>

            {state.step !== 'closed' && (
                <>
                    <button
                        className="fixed inset-0 z-40 border-0 bg-overlay sm:bg-transparent"
                        aria-label="Fechar assistente"
                        onClick={close}
                    />
                    <div
                        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[min(760px,calc(100dvh-16px))] flex-col overflow-hidden rounded-t-panel border border-border bg-surface shadow-float sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(700px,calc(100dvh-40px))] sm:w-[min(420px,calc(100vw-32px))] sm:rounded-panel"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="assistant-title"
                        ref={panel}
                        onKeyDown={onKeys}
                    >
                        <header className="flex items-center gap-3 border-b border-border py-3.5 pr-3 pl-4.5">
                            <span
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sidebar text-surface"
                                aria-hidden="true"
                            >
                                <Bot
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                    strokeWidth={1.75}
                                />
                            </span>
                            <div>
                                <h2
                                    className="font-display text-base font-semibold"
                                    id="assistant-title"
                                >
                                    Assistente Clube Flex
                                </h2>
                                <small className="block text-caption text-muted-foreground">
                                    Atendimento virtual
                                </small>
                            </div>
                            <button
                                className="ml-auto grid h-11 w-11 place-items-center rounded-control border-0 bg-transparent text-foreground hover:bg-surface-muted"
                                type="button"
                                aria-label="Fechar assistente"
                                onClick={close}
                            >
                                <X
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                    strokeWidth={1.75}
                                />
                            </button>
                        </header>
                        <div
                            className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-5"
                            ref={log}
                            role="log"
                            aria-label="Conversa com o assistente"
                        >
                            {state.messages.map((m, i) => (
                                <div
                                    className={`max-w-[86%] animate-[pop_.2s_var(--ease-out)] rounded-2xl px-3.5 py-2.5 text-control-sm leading-[1.45] motion-reduce:animate-none ${m.by === 'bot' ? 'self-start rounded-bl-sm bg-surface-muted' : 'self-end rounded-br-sm bg-sidebar text-surface'}`}
                                    key={i}
                                >
                                    {m.content}
                                </div>
                            ))}
                        </div>
                        <div
                            className="grid gap-2.5 border-t border-border bg-surface p-4"
                            aria-live="polite"
                        >
                            {state.step === 'welcome' && (
                                <div className="grid gap-2">
                                    <button
                                        className={button('primary')}
                                        onClick={() =>
                                            add(
                                                'name',
                                                'Quero ser Flex',
                                                'Que bom! Vou pedir alguns dados para a equipe comercial entrar em contato. Qual é o seu nome?',
                                            )
                                        }
                                    >
                                        Quero ser Flex
                                    </button>
                                    <button
                                        className={button('secondary')}
                                        onClick={() => {
                                            const next = choosePartner(state);
                                            dispatch({
                                                type: 'step',
                                                step: next.step,
                                                message: next.messages.at(-2)!,
                                            });
                                            dispatch({
                                                type: 'step',
                                                step: next.step,
                                                message: next.messages.at(-1)!,
                                            });
                                        }}
                                    >
                                        Quero ser parceiro
                                    </button>
                                </div>
                            )}
                            {state.step === 'partner' && (
                                <div className="grid gap-2">
                                    <a
                                        className={button('primary')}
                                        href="mailto:comercial@flexcard.org.br?subject=Quero%20ser%20parceiro%20do%20Clube%20Flex"
                                    >
                                        Enviar e-mail
                                    </a>
                                    <button
                                        className={button('secondary')}
                                        onClick={() =>
                                            dispatch({ type: 'restart' })
                                        }
                                    >
                                        Voltar ao início
                                    </button>
                                </div>
                            )}
                            {state.step === 'name' &&
                                input(
                                    'name',
                                    'Seu nome',
                                    'text',
                                    'Como você se chama?',
                                )}
                            {state.step === 'whatsapp' &&
                                input(
                                    'whatsapp',
                                    'Seu WhatsApp com DDD',
                                    'tel',
                                    '(21) 99999-9999',
                                )}
                            {state.step === 'email' &&
                                input(
                                    'email',
                                    'Seu e-mail (opcional)',
                                    'email',
                                    'voce@exemplo.com',
                                )}
                            {state.step === 'consent' && (
                                <>
                                    <label className="flex cursor-pointer items-start gap-3 rounded-control bg-surface-muted p-3 text-sm leading-[1.45]">
                                        <input
                                            className="mt-px h-5.5 w-5.5 shrink-0 accent-sidebar"
                                            type="checkbox"
                                            checked={accepted}
                                            id="assistant-consent"
                                            onChange={(event) =>
                                                setAccepted(
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        <span>
                                            {consent.text}{' '}
                                            <a
                                                href={consent.privacyUrl}
                                                target="_blank"
                                            >
                                                Ler a política de privacidade
                                            </a>
                                            .
                                        </span>
                                    </label>
                                    <button
                                        className={button('primary')}
                                        disabled={!accepted}
                                        onClick={() =>
                                            add(
                                                'review',
                                                'Autorizo o contato',
                                                'Confira seus dados antes de enviar. Você pode editar qualquer item.',
                                            )
                                        }
                                    >
                                        Continuar
                                    </button>
                                </>
                            )}
                            {state.step === 'review' && (
                                <>
                                    <dl className="grid rounded-card border border-border bg-surface [&>div]:flex [&>div]:items-center [&>div]:gap-2 [&>div]:border-b [&>div]:border-border [&>div]:py-1.5 [&>div]:pr-1.5 [&>div]:pl-3.5 [&>div:last-child]:border-b-0 [&_dd]:font-semibold [&_dt]:text-caption [&_dt]:text-muted-foreground">
                                        <div>
                                            <div className="min-w-0 flex-1 py-1">
                                                <dt>Nome</dt>
                                                <dd>{values.name}</dd>
                                            </div>
                                            <button
                                                className={button(
                                                    'ghost',
                                                    'sm',
                                                )}
                                                onClick={() =>
                                                    dispatch({
                                                        type: 'step',
                                                        step: 'name',
                                                    })
                                                }
                                            >
                                                Editar
                                            </button>
                                        </div>
                                        <div>
                                            <div className="min-w-0 flex-1 py-1">
                                                <dt>WhatsApp</dt>
                                                <dd>{values.whatsapp}</dd>
                                            </div>
                                            <button
                                                className={button(
                                                    'ghost',
                                                    'sm',
                                                )}
                                                onClick={() =>
                                                    dispatch({
                                                        type: 'step',
                                                        step: 'whatsapp',
                                                    })
                                                }
                                            >
                                                Editar
                                            </button>
                                        </div>
                                        <div>
                                            <div className="min-w-0 flex-1 py-1">
                                                <dt>E-mail</dt>
                                                <dd>
                                                    {values.email ||
                                                        'Não informado'}
                                                </dd>
                                            </div>
                                            <button
                                                className={button(
                                                    'ghost',
                                                    'sm',
                                                )}
                                                onClick={() =>
                                                    dispatch({
                                                        type: 'step',
                                                        step: 'email',
                                                    })
                                                }
                                            >
                                                Editar
                                            </button>
                                        </div>
                                        <div>
                                            <div className="min-w-0 flex-1 py-1">
                                                <dt>Consentimento</dt>
                                                <dd>Autorizado</dd>
                                            </div>
                                        </div>
                                    </dl>
                                    <button
                                        className={button('primary')}
                                        onClick={() => void submit()}
                                    >
                                        Enviar
                                    </button>
                                    <p className="text-center text-caption text-muted-foreground">
                                        Seus dados só são enviados quando você
                                        tocar em Enviar.
                                    </p>
                                </>
                            )}
                            {state.step === 'sending' && (
                                <button className={button('primary')} disabled>
                                    Enviando…
                                </button>
                            )}
                            {state.step === 'error' && (
                                <>
                                    <p
                                        className="text-sm text-danger"
                                        role="alert"
                                    >
                                        Não foi possível enviar seus dados.
                                        Tente novamente.
                                    </p>
                                    <button
                                        className={button('primary')}
                                        onClick={() =>
                                            dispatch({
                                                type: 'step',
                                                step: 'review',
                                            })
                                        }
                                    >
                                        Tentar novamente
                                    </button>
                                </>
                            )}
                            {state.step === 'success' && (
                                <div className="grid gap-2">
                                    <button
                                        className={button('primary')}
                                        onClick={close}
                                    >
                                        Fechar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
