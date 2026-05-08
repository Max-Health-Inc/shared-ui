/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROXY_BASE: string | undefined
  readonly VITE_PROXY_PREFIX: string | undefined
  readonly VITE_FHIR_SERVER_ID: string | undefined
  readonly VITE_FHIR_VERSION: string | undefined
  readonly VITE_CLIENT_ID: string | undefined
  readonly VITE_REDIRECT_URI: string | undefined
  readonly VITE_SCOPES: string | undefined
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
