// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../vite-env.d.ts" />

/**
 * Shared SMART app configuration factory.
 * Each app provides its own defaults (clientId, scopes) AND its own `import.meta.env`.
 *
 * THE ENV MUST BE PASSED IN. This module cannot read it itself. `import.meta.env.X` is not
 * a runtime lookup: Vite substitutes the literal value at BUILD time, and since 0.23.0 this
 * package ships built output, so that substitution happens when the PACKAGE is built, with
 * the package's own (empty) env. Every consumer variable then silently became its fallback:
 * VITE_PROXY_BASE, VITE_PROXY_PREFIX, VITE_FHIR_SERVER_ID, VITE_FHIR_VERSION, VITE_CLIENT_ID,
 * VITE_REDIRECT_URI and VITE_SCOPES were all dead, and BASE_URL froze to "/" so an app served
 * from a sub-path got the wrong redirect URI and a home link pointing at another app.
 *
 * Read from the app's own source it is correct, because that is where the build that knows
 * the values runs. Hence `env` is required rather than optional: the type error is the only
 * reliable way to catch an app that is still relying on this module to read its environment.
 *
 * All browser globals (window, sessionStorage) are guarded so the module
 * can be safely imported in Node.js, Bun test runners, and SSR contexts.
 */

const isBrowser = typeof window !== "undefined"

/**
 * The Vite env values this module needs, as the app's own build resolved them.
 *
 * Structurally satisfied by `import.meta.env`, so an app passes that directly. Every field is
 * optional: an app that sets none still gets the documented fallbacks.
 */
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

/**
 * The app's base path, as recorded by {@link createSmartAppConfig}.
 *
 * Module-level rather than a parameter on {@link appBaseUrl} because the callers that need it
 * most are not the app's own code: AppHeader's home link has no access to the app's env, and
 * threading it through every component that might render a link back to the app root is the
 * kind of plumbing this package exists to remove. One call at startup sets it for all of them.
 */
let basePath = "/"

/**
 * The app's OWN root URL.
 *
 * Not `window.location.origin` and not a hardcoded "/": an app can be served from a sub-path,
 * and wherever one deployment hosts several apps the bare origin is a different app's root.
 * Always ends in a slash, so callers append a bare path with no separator.
 *
 * Reflects the app's real base only once {@link createSmartAppConfig} has run, which every
 * app does at import time in its config module. Before that it answers "/" rather than
 * throwing, so importing this package in isolation (a test, SSR) stays harmless.
 *
 * Returns just the base path outside a browser (SSR, test runners), never a bare "undefined".
 */
export function appBaseUrl(): string {
  return `${isBrowser ? window.location.origin : ""}${basePath}`
}

/** Record the app's base path. Exported for apps that build their config by hand. */
export function setAppBasePath(base: string | undefined): void {
  basePath = base && base.length > 0 ? base : "/"
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
  /**
   * The app's own `import.meta.env`. Required: see this module's header for why this package
   * cannot read it for you. Pass it verbatim — `env: import.meta.env`.
   */
  env: SmartAppEnv
}

export function createSmartAppConfig(defaults: SmartAppDefaults): SmartAppConfig {
  const { env } = defaults
  // Before reading anything else, so appBaseUrl() below (and every later caller) is correct.
  setAppBasePath(env.BASE_URL)
  return {
    proxyBase: env.VITE_PROXY_BASE ?? (isBrowser ? window.location.origin : ""),
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
    postLogoutRedirectUri: appBaseUrl(),
    fhirBaseUrl,
    scopes: config.scopes,
    storagePrefix,
  })
  return { smartAuth, fhirBaseUrl }
}
