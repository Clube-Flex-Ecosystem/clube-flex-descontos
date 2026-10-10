/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Endereço da API central; o padrão aponta para a API local. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
