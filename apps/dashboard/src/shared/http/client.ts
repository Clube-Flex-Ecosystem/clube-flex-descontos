import axios from 'axios';
import { CSRF_HEADER } from '@flex/contracts';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Requisições que sondam a sessão tratam o 401 por conta própria. */
    skipUnauthenticatedHandler?: boolean;
  }
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  // O cookie de sessão é do host da API e inacessível ao JavaScript.
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

const SAFE_METHODS = new Set(['get', 'head', 'options']);

let csrfToken: string | undefined;

/** O token vem da consulta da sessão e acompanha as operações mutáveis. */
export function setCsrfToken(token: string | undefined): void {
  csrfToken = token;
}

http.interceptors.request.use((config) => {
  const method = (config.method ?? 'get').toLowerCase();
  if (csrfToken && !SAFE_METHODS.has(method)) {
    config.headers.set(CSRF_HEADER, csrfToken);
  }
  return config;
});

type UnauthenticatedHandler = () => void;
let onUnauthenticated: UnauthenticatedHandler | undefined;

/** Registrado pela aplicação para encerrar a navegação autenticada quando a sessão cai. */
export function setUnauthenticatedHandler(
  handler: UnauthenticatedHandler | undefined,
): void {
  onUnauthenticated = handler;
}

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      !error.config?.skipUnauthenticatedHandler &&
      error.response?.status === 401 &&
      (error.response.data as { code?: string } | undefined)?.code ===
        'AUTHENTICATION_REQUIRED'
    ) {
      onUnauthenticated?.();
    }
    return Promise.reject(error);
  },
);
