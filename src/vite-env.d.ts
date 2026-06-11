/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base do backend (ex.: http://192.168.0.10:3333). Vazio = modo demonstração. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
