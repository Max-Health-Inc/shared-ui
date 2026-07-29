import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Module-level guard: ensures the post-`controllerchange` reload happens at
 * most once for the lifetime of the page, even if multiple hook instances
 * mount or the controller changes more than once. Survives re-renders and
 * remounts (it is intentionally not React state).
 */
let hasReloaded = false

export interface UseServiceWorkerUpdateOptions {
  /** URL of the service worker to register (default: `/sw.js`). */
  swUrl?: string
  /**
   * Whether the hook is active. When `false`, the hook registers nothing and
   * reports no update — useful for disabling in development. Default: `true`.
   */
  enabled?: boolean
}

export interface UseServiceWorkerUpdateReturn {
  /** True once a newer worker has installed and is waiting to activate. */
  updateAvailable: boolean
  /**
   * Activate the waiting worker and reload the page once it takes control.
   * No-op when there is nothing waiting. The reload fires at most once.
   */
  reload: () => void
  /**
   * True from the moment {@link reload} starts until the page actually navigates
   * away. That gap is not instant: `reload()` only asks the waiting worker to skip
   * waiting, then waits for `controllerchange`. Use it to show progress and to stop
   * a second click. Stays `false` when `reload()` was a no-op, so it can never latch
   * a spinner that nothing will ever resolve.
   */
  reloading: boolean
  /** Hide the update prompt without reloading (sets `updateAvailable` false). */
  dismiss: () => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-function -- intentional no-op
function noop(): void {}

const NOOP: UseServiceWorkerUpdateReturn = {
  updateAvailable: false,
  reload: noop,
  dismiss: noop,
  reloading: false,
}

/**
 * Registers the app's service worker and surfaces a prompt-to-reload signal
 * when a NEW worker has installed and is waiting. This is the page side of the
 * canonical "wait + prompt" service-worker update pattern:
 *
 *   - The service worker must NOT call `skipWaiting()` on install, so an
 *     updated worker installs into the `waiting` state instead of silently
 *     taking over.
 *   - This hook detects the waiting worker and exposes `updateAvailable`.
 *   - When the user accepts, `reload()` posts `{ type: 'SKIP_WAITING' }` to the
 *     waiting worker; once it takes control (`controllerchange`) the page
 *     reloads EXACTLY ONCE (guarded so it can never loop).
 *
 * Safety invariants:
 *   - No automatic reload — only on an explicit `reload()` call.
 *   - Fully inert when `enabled === false` or `serviceWorker` is unsupported
 *     (SSR / older browsers): registers nothing and returns a stable no-op.
 *
 * Usage:
 * ```tsx
 * const { updateAvailable, reload, dismiss } = useServiceWorkerUpdate({
 *   enabled: import.meta.env.PROD,
 * })
 * ```
 */
export function useServiceWorkerUpdate(
  opts: UseServiceWorkerUpdateOptions = {},
): UseServiceWorkerUpdateReturn {
  const { swUrl = "/sw.js", enabled = true } = opts

  const [updateAvailable, setUpdateAvailable] = useState(false)
  /** True once the user has asked to reload, until the page navigates away. */
  const [reloading, setReloading] = useState(false)
  /** The worker that has installed and is waiting to take over. */
  const waitingWorkerRef = useRef<ServiceWorker | null>(null)

  const supported =
    enabled &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator

  useEffect(() => {
    if (!supported) return

    let cancelled = false
    let registration: ServiceWorkerRegistration | null = null

    /** Track a freshly-installing worker; flag an update once it's ready. */
    const trackInstalling = (worker: ServiceWorker | null) => {
      if (!worker) return
      worker.addEventListener("statechange", () => {
        // `installed` + an existing controller == an UPDATE (not first install).
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          waitingWorkerRef.current = worker
          if (!cancelled) setUpdateAvailable(true)
        }
      })
    }

    const onUpdateFound = (reg: ServiceWorkerRegistration) => () => {
      trackInstalling(reg.installing)
    }

    try {
      navigator.serviceWorker
        .register(swUrl)
        .then((reg) => {
          if (cancelled) return
          registration = reg

          // An update may already be waiting from a prior load.
          if (reg.waiting && navigator.serviceWorker.controller) {
            waitingWorkerRef.current = reg.waiting
            setUpdateAvailable(true)
          }

          reg.addEventListener("updatefound", onUpdateFound(reg))
        })
        .catch(noop) // registration failed — stay inert
    } catch {
      /* defensive: register() threw synchronously — stay inert */
    }

    // Re-check for updates when the tab regains focus (cheap, no reload).
    const onFocus = () => {
      void registration?.update().catch(noop)
    }
    window.addEventListener("focus", onFocus)

    return () => {
      cancelled = true
      window.removeEventListener("focus", onFocus)
    }
  }, [supported, swUrl])

  const reload = useCallback(() => {
    const waiting = waitingWorkerRef.current
    if (!waiting || typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      // Nothing to activate, so no controllerchange is coming. Leave `reloading`
      // false rather than latching a spinner forever.
      return
    }

    setReloading(true)

    // Reload once the new worker takes control. Guarded so it can never loop.
    const onControllerChange = () => {
      if (hasReloaded) return
      hasReloaded = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange, {
      once: true,
    })

    waiting.postMessage({ type: "SKIP_WAITING" })
  }, [])

  const dismiss = useCallback(() => {
    setUpdateAvailable(false)
  }, [])

  if (!supported) return NOOP

  return { updateAvailable, reload, dismiss, reloading }
}
