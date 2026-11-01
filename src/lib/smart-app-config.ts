// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../vite-env.d.ts" />

import { setBrandingSource } from "../hooks/use-branding"

/**
 * SMART app config from the app's own `import.meta.env`. The env must be passed in: Vite inlines
 * `import.meta.env` when this package is built, so reading it here would freeze every value to its fallback.
 */

const browserOrigin = (): string => (typeof window !== "undefined" ? window.location.origin : "")

/** The Vite env values this module reads; `import.meta.env` satisfies it structurally. */
export interface SmartAppEnv {
  readonly BASE_URL?: string
  readonly VITE_PROXY_BASE?: string
  readonly VITE_PROXY_PREFIX?: string
  readonly VITE_FHIR_SERVER_ID?: string
  readonly VITE_FHIR_VERSION?: string
  readonly VITE_CLIENT_ID?: string
  readonly VITE_REDIRECT_URI?: string
  readonly VITE_SCOPES?: string
}

/** Module-level so shared components without the app's env (AppHeader's home link) can read it. */
let basePath = "/"

/**
 * The app's own root URL (it may live under a sub-path), always ending in a slash. "/" until
 * {@link createSmartAppConfig} runs; just the base path outside a browser.
 */
export function appBaseUrl(): string {
  return `${browserOrigin()}${basePath}`
}

/** Record the app's base path. Exported for apps that build their config by hand. */
export function setAppBasePath(base: string | undefined): void {
  if (!base) basePath = "/"
  else basePath = base.endsWith("/") ? base : `${base}/`
}

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
  /** The app's own `import.meta.env`, passed verbatim. */
  env: SmartAppEnv
}

export function createSmartAppConfig(defaults: SmartAppDefaults): SmartAppConfig {
  const { env } = defaults
  setAppBasePath(env.BASE_URL)
  return {
    proxyBase: env.VITE_PROXY_BASE ?? browserOrigin(),
    proxyPrefix: env.VITE_PROXY_PREFIX ?? "proxy-smart-backend",
    fhirServerId: env.VITE_FHIR_SERVER_ID ?? "hapi-fhir-server",
    fhirVersion: env.VITE_FHIR_VERSION ?? "R4",
    clientId: env.VITE_CLIENT_ID ?? defaults.clientId,
    redirectUri: env.VITE_REDIRECT_URI ?? `${appBaseUrl()}callback`,
    scopes: env.VITE_SCOPES ?? defaults.scopes,
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

/** FHIR base URL from app config, for callers that need it without a SmartAuth instance. */
export function buildFhirBaseUrl(cfg: SmartAppConfig): string {
  const base = cfg.proxyBase.replace(/\/+$/, "")
  const segments = [cfg.proxyPrefix, cfg.fhirServerId, cfg.fhirVersion].filter(Boolean)
  return `${base}/${segments.join("/")}`
}

/** The SMART App Store of the proxy this app signs in against, for the header's `appStoreUrl`. */
export function buildAppStoreUrl(cfg: Pick<SmartAppConfig, "proxyBase">): string {
  return `${cfg.proxyBase.replace(/\/+$/, "")}/apps`
}

/** `const { smartAuth, fhirBaseUrl } = createSmartAuth({ config, SmartAuth, storagePrefix: "my_app_" })` */
export function createSmartAuth<T>({ config, SmartAuth, storagePrefix }: CreateSmartAuthOptions<T>): {
  smartAuth: T
  fhirBaseUrl: string
} {
  const fhirBaseUrl = buildFhirBaseUrl(config)
  setBrandingSource(fhirBaseUrl)
  const smartAuth = new SmartAuth({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    postLogoutRedirectUri: appBaseUrl(),
    fhirBaseUrl,
    scopes: config.scopes,
    storagePrefix,
  })
  return { smartAuth, fhirBaseUrl }
}
