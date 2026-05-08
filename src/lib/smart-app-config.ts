/**
 * Shared SMART app configuration factory.
 * Each app provides only its unique defaults (clientId, scopes);
 * everything else is resolved identically from Vite env vars.
 *
 * All browser globals (window, sessionStorage) are guarded so the module
 * can be safely imported in Node.js, Bun test runners, and SSR contexts.
 */

const isBrowser = typeof window !== "undefined"
export interface SmartAppConfig {
  proxyBase: string
  proxyPrefix: string
  fhirServerId: string
  fhirVersion: string
  clientId: string
  redirectUri: string
  scopes: string
}

interface SmartAppDefaults {
  clientId: string
  scopes: string
}

export function createSmartAppConfig(defaults: SmartAppDefaults): SmartAppConfig {
  return {
    proxyBase: import.meta.env.VITE_PROXY_BASE ?? (isBrowser ? window.location.origin : ""),
    proxyPrefix: import.meta.env.VITE_PROXY_PREFIX ?? "proxy-smart-backend",
    fhirServerId: import.meta.env.VITE_FHIR_SERVER_ID ?? "hapi-fhir-server",
    fhirVersion: import.meta.env.VITE_FHIR_VERSION ?? "R4",
    clientId: import.meta.env.VITE_CLIENT_ID ?? defaults.clientId,
    redirectUri: import.meta.env.VITE_REDIRECT_URI ?? `${isBrowser ? window.location.origin : ""}${import.meta.env.BASE_URL || "/"}callback`,
    scopes: import.meta.env.VITE_SCOPES ?? defaults.scopes,
  }
}

// ─── SmartAuth bootstrap helper ──────────────────────────────────────────────

type SmartAuthConstructor<T> = new (opts: {
  clientId: string
  redirectUri: string
  postLogoutRedirectUri: string
  fhirBaseUrl: string
  scopes: string
  storagePrefix: string
}) => T

interface CreateSmartAuthOptions<T> {
  config: SmartAppConfig
  SmartAuth: SmartAuthConstructor<T>
  storagePrefix: string
}

/**
 * Build the FHIR base URL from app config.
 * Exported so apps that need the URL without a SmartAuth instance can use it.
 */
export function buildFhirBaseUrl(cfg: SmartAppConfig): string {
  const base = cfg.proxyBase.replace(/\/+$/, "")
  const segments = [cfg.proxyPrefix, cfg.fhirServerId, cfg.fhirVersion].filter(Boolean)
  return `${base}/${segments.join("/")}`
}

/**
 * Create a SmartAuth instance using the shared app config.
 *
 * Usage in each app:
 * ```ts
 * import { SmartAuth } from "some-generated-package/fhir-client"
 * import { createSmartAuth } from "@max-health-inc/shared-ui"
 * import { config } from "@/config"
 *
 * export const { smartAuth, fhirBaseUrl } = createSmartAuth({ config, SmartAuth, storagePrefix: "my_app_" })
 * ```
 */
export function createSmartAuth<T>({ config, SmartAuth, storagePrefix }: CreateSmartAuthOptions<T>): {
  smartAuth: T
  fhirBaseUrl: string
} {
  const fhirBaseUrl = buildFhirBaseUrl(config)
  const smartAuth = new SmartAuth({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    postLogoutRedirectUri: (isBrowser ? window.location.origin : "") + (import.meta.env.BASE_URL || "/"),
    fhirBaseUrl,
    scopes: config.scopes,
    storagePrefix,
  })
  return { smartAuth, fhirBaseUrl }
}
