import { zodResolver } from '@hookform/resolvers/zod';
import {
  CONTACT_CONSENT,
  publicContactRequestSchema,
  type ContactConsent,
  type PublicContactRequest,
} from '@flex/contracts';
import { useEffect, useReducer, useRef, useState } from 'react';
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
      className="a-form"
      onSubmit={(e) => {
        e.preventDefault();
        void field(name);
      }}
    >
      <label htmlFor={`assistant-${name}`}>{label}</label>
      <div className="a-row">
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
          {...form.register(name)}
        />
        <button className="a-send" type="submit" aria-label="Continuar">
          →
        </button>
      </div>
      {error(name) && (
        <p className="a-error" role="alert">
          !{' '}
          {error(name) === 'INVALID_PHONE_NUMBER'
            ? 'Informe um WhatsApp com DDD, por exemplo (21) 99999-9999.'
            : error(name) === 'INVALID_EMAIL'
              ? 'Informe um e-mail válido.'
              : 'Preencha este campo.'}
        </p>
      )}
      {name === 'email' && (
        <button
          className="link-btn"
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
        className="fab"
        type="button"
        aria-label="Abrir assistente do Clube Flex"
        data-open-assistant
      >
        <span aria-hidden="true">□</span>
      </button>
      {state.step !== 'closed' && (
        <>
          <button
            className="assistant-backdrop"
            aria-label="Fechar assistente"
            onClick={close}
          />
          <div
            className="assistant"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assistant-title"
            ref={panel}
            onKeyDown={onKeys}
          >
            <header className="a-head">
              <span className="a-avatar" aria-hidden="true">
                □
              </span>
              <div>
                <h2 id="assistant-title">Assistente Clube Flex</h2>
                <small>Atendimento virtual automático</small>
              </div>
              <button
                className="a-close"
                type="button"
                aria-label="Fechar assistente"
                onClick={close}
              >
                ×
              </button>
            </header>
            <div
              className="a-log"
              ref={log}
              role="log"
              aria-label="Conversa com o assistente"
            >
              {state.messages.map((m, i) => (
                <div className={`msg ${m.by}`} key={i}>
                  {m.content}
                </div>
              ))}
            </div>
            <div className="a-foot" aria-live="polite">
              {state.step === 'welcome' && (
                <div className="a-options">
                  <button
                    className="btn primary"
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
                    className="btn secondary"
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
                <div className="a-options">
                  <a
                    className="btn primary"
                    href="mailto:comercial@flexcard.org.br?subject=Quero%20ser%20parceiro%20do%20Clube%20Flex"
                  >
                    Enviar e-mail
                  </a>
                  <button
                    className="btn secondary"
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
                  <label className="consent">
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
                    className="btn primary"
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
                  <dl className="review">
                    <div>
                      <div className="r-text">
                        <dt>Nome</dt>
                        <dd>{values.name}</dd>
                      </div>
                      <button
                        className="btn"
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
                        className="btn"
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
                        className="btn"
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
                  <button className="btn primary" onClick={() => void submit()}>
                    Enviar
                  </button>
                  <p className="a-note">
                    Seus dados só são enviados quando você tocar em Enviar.
                  </p>
                </>
              )}
              {state.step === 'sending' && (
                <button className="btn primary" disabled>
                  Enviando…
                </button>
              )}
              {state.step === 'error' && (
                <>
                  <p className="a-error" role="alert">
                    Não foi possível enviar seus dados. Tente novamente.
                  </p>
                  <button
                    className="btn primary"
                    onClick={() => dispatch({ type: 'step', step: 'review' })}
                  >
                    Tentar novamente
                  </button>
                </>
              )}
              {state.step === 'success' && (
                <div className="a-options">
                  <button className="btn primary" onClick={close}>
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
