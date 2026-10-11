import { zodResolver } from '@hookform/resolvers/zod';
import {
  CONTACT_CONSENT,
  publicContactRequestSchema,
  type ContactConsent,
  type PublicContactRequest,
} from '@flex/contracts';
import { useEffect, useReducer, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Bot, MessageCircle, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
    'Olá! Sou o assistente virtual do Clube Flex. Minhas respostas são automáticas. Como posso ajudar?',
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
          A parceria continua por e-mail. Inclua:
          <ul>
            <li>nome do responsável;</li>
            <li>empresa ou profissional;</li>
            <li>telefone ou WhatsApp;</li>
            <li>cidade;</li>
            <li>serviços oferecidos;</li>
            <li>proposta de desconto.</li>
          </ul>
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
    document.body.classList.toggle('assistant-open', state.step !== 'closed');
    if (state.step !== 'closed')
      requestAnimationFrame(() =>
        panel.current?.querySelector<HTMLElement>('button, a, input')?.focus(),
      );
    else state.opener?.focus();
  }, [state.step, state.opener]);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [state.messages, state.step]);
  const close = () => dispatch({ type: 'close' });
  const add = (step: Step, user: React.ReactNode, bot: React.ReactNode) => {
    dispatch({ type: 'step', step, message: { by: 'user', content: user } });
    setTimeout(
      () =>
        dispatch({ type: 'step', step, message: { by: 'bot', content: bot } }),
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
    } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
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
        className="font-semibold text-[15px]"
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
          className="min-h-12 min-w-0 flex-1 rounded-lg border border-control-border bg-background px-3 text-base aria-invalid:border-danger"
          {...form.register(name)}
        />
        <button
          className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border-0 bg-primary text-white"
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
          className="min-h-11 border-0 bg-transparent px-1 text-left text-accent-foreground underline underline-offset-3"
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
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full border-0 bg-primary text-white shadow-lg"
        type="button"
        aria-label="Abrir assistente do Clube Flex"
        data-open-assistant
      >
        <MessageCircle
          className="h-5 w-5"
          aria-hidden="true"
          strokeWidth={1.75}
        />
      </button>
      {state.step !== 'closed' && (
        <>
          <button
            className="fixed inset-0 z-40 border-0 bg-sidebar/35"
            aria-label="Fechar assistente"
            onClick={close}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[min(760px,calc(100dvh-16px))] flex-col overflow-hidden rounded-t-[16px] bg-background shadow-lg sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(700px,calc(100dvh-40px))] sm:w-[min(420px,calc(100vw-32px))] sm:rounded-[16px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assistant-title"
            ref={panel}
            onKeyDown={onKeys}
          >
            <header className="flex items-center gap-3 border-b border-border bg-sidebar px-5 py-4 text-sidebar-foreground">
              <span
                className="grid h-10 w-10 place-items-center rounded-full bg-accent text-white"
                aria-hidden="true"
              >
                <Bot
                  className="h-5 w-5"
                  aria-hidden="true"
                  strokeWidth={1.75}
                />
              </span>
              <div>
                <h2 id="assistant-title">Assistente Clube Flex</h2>
                <small>Atendimento virtual automático</small>
              </div>
              <button
                className="ml-auto grid h-11 w-11 place-items-center rounded-full border-0 bg-transparent text-sidebar-foreground"
                type="button"
                aria-label="Fechar assistente"
                onClick={close}
              >
                <X className="h-5 w-5" aria-hidden="true" strokeWidth={1.75} />
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
                  className={`max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-[15px] leading-[1.4] ${m.by === 'bot' ? 'self-start rounded-bl-sm bg-surface-muted' : 'self-end rounded-br-sm bg-primary text-white'}`}
                  key={i}
                >
                  {m.content}
                </div>
              ))}
            </div>
            <div
              className="grid gap-3 border-t border-border bg-surface p-4"
              aria-live="polite"
            >
              {state.step === 'welcome' && (
                <div className="grid gap-2">
                  <button
                    className="inline-flex min-h-12 items-center justify-center rounded-full border-0 bg-primary px-[22px] font-semibold text-white"
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
                    className="inline-flex min-h-12 items-center justify-center rounded-full border-[1.5px] border-accent-foreground bg-transparent px-[22px] font-semibold text-accent-foreground"
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
                    className="inline-flex min-h-12 items-center justify-center rounded-full border-0 bg-primary px-[22px] font-semibold text-white"
                    href="mailto:comercial@flexcard.org.br?subject=Quero%20ser%20parceiro%20do%20Clube%20Flex"
                  >
                    Enviar e-mail
                  </a>
                  <button
                    className="inline-flex min-h-12 items-center justify-center rounded-full border-[1.5px] border-accent-foreground bg-transparent px-[22px] font-semibold text-accent-foreground"
                    onClick={() => dispatch({ type: 'restart' })}
                  >
                    Voltar ao início
                  </button>
                </div>
              )}
              {state.step === 'name' &&
                input('name', 'Seu nome', 'text', 'Como você se chama?')}
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
                  <label className="flex items-start gap-2 text-sm leading-[1.4]">
                    <input
                      type="checkbox"
                      checked={accepted}
                      id="assistant-consent"
                      onChange={(event) => setAccepted(event.target.checked)}
                    />
                    <span>
                      {consent.text}{' '}
                      <a href={consent.privacyUrl} target="_blank">
                        Ler a política de privacidade
                      </a>
                      .
                    </span>
                  </label>
                  <button
                    className="inline-flex min-h-12 items-center justify-center rounded-full border-0 bg-primary px-[22px] font-semibold text-white disabled:opacity-50"
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
                  <dl className="grid gap-2">
                    <div>
                      <div className="r-text">
                        <dt>Nome</dt>
                        <dd>{values.name}</dd>
                      </div>
                      <button
                        className="min-h-11 rounded-full border border-border bg-transparent px-4 text-sm font-semibold"
                        onClick={() => dispatch({ type: 'step', step: 'name' })}
                      >
                        Editar
                      </button>
                    </div>
                    <div>
                      <div className="r-text">
                        <dt>WhatsApp</dt>
                        <dd>{values.whatsapp}</dd>
                      </div>
                      <button
                        className="min-h-11 rounded-full border border-border bg-transparent px-4 text-sm font-semibold"
                        onClick={() =>
                          dispatch({ type: 'step', step: 'whatsapp' })
                        }
                      >
                        Editar
                      </button>
                    </div>
                    <div>
                      <div className="r-text">
                        <dt>E-mail</dt>
                        <dd>{values.email || 'Não informado'}</dd>
                      </div>
                      <button
                        className="min-h-11 rounded-full border border-border bg-transparent px-4 text-sm font-semibold"
                        onClick={() =>
                          dispatch({ type: 'step', step: 'email' })
                        }
                      >
                        Editar
                      </button>
                    </div>
                    <div>
                      <div className="r-text">
                        <dt>Consentimento</dt>
                        <dd>Autorizado</dd>
                      </div>
                    </div>
                  </dl>
                  <button
                    className="inline-flex min-h-12 items-center justify-center rounded-full border-0 bg-primary px-[22px] font-semibold text-white"
                    onClick={() => void submit()}
                  >
                    Enviar
                  </button>
                  <p className="text-sm text-muted-foreground">
                    Seus dados só são enviados quando você tocar em Enviar.
                  </p>
                </>
              )}
              {state.step === 'sending' && (
                <button
                  className="inline-flex min-h-12 items-center justify-center rounded-full border-0 bg-primary px-[22px] font-semibold text-white disabled:opacity-50"
                  disabled
                >
                  Enviando…
                </button>
              )}
              {state.step === 'error' && (
                <>
                  <p className="text-sm text-danger" role="alert">
                    Não foi possível enviar seus dados. Tente novamente.
                  </p>
                  <button
                    className="inline-flex min-h-12 items-center justify-center rounded-full border-0 bg-primary px-[22px] font-semibold text-white"
                    onClick={() => dispatch({ type: 'step', step: 'review' })}
                  >
                    Tentar novamente
                  </button>
                </>
              )}
              {state.step === 'success' && (
                <div className="grid gap-2">
                  <button
                    className="inline-flex min-h-12 items-center justify-center rounded-full border-0 bg-primary px-[22px] font-semibold text-white"
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
