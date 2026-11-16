/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API. Vacía en desarrollo para usar el proxy de Vite. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
