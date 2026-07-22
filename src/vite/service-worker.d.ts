import type { Plugin } from "vite"

/** The literal token replaced at build time with the build id. */
export declare const BUILD_ID_PLACEHOLDER: string

/** The canonical service-worker source, with build-time placeholders. */
export declare const SERVICE_WORKER_SOURCE: string

/**
 * Replace every {@link BUILD_ID_PLACEHOLDER} occurrence with `buildId` (inserted
 * literally). Returns `source` unchanged when the token is absent.
 */
export declare function stampServiceWorker(source: string, buildId: string): string

export interface ServiceWorkerPluginOptions {
  /**
   * Cache-name prefix, typically the app's name (e.g. `"dicom-viewer"`). The final
   * cache key is `` `${cacheName}-${buildId}` ``.
   */
  cacheName: string
  /** Paths to precache on install. Default: manifest + favicon + PWA icons. */
  precache?: string[]
  /** Output filename (default `"sw.js"`). */
  fileName?: string
}

/**
 * Vite plugin that emits a stamped `dist/sw.js` from the canonical SW source.
 * Client build only (skips SSR passes).
 */
export declare function serviceWorkerPlugin(options: ServiceWorkerPluginOptions): Plugin
