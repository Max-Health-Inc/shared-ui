import { Button } from "./button"
import { MessageBanner } from "./message-banner"
import { Spinner } from "./spinner"
import { useServiceWorkerUpdate } from "../hooks/use-service-worker-update"
import { cn } from "../lib/utils"
import { useUiText, type TFn } from "../lib/ui-text"

export interface ServiceWorkerUpdatePromptProps {
  /**
   * Whether service-worker registration + update detection is active.
   * Pass `import.meta.env.PROD` to disable in development. Default: `true`.
   */
  enabled?: boolean
  /** URL of the service worker to register (default: `/sw.js`). */
  swUrl?: string
  /** Banner copy (default: a translated "A new version is available."). */
  message?: string
  /**
   * Banner copy while the reload is in flight (default: "Updating…"). Also the
   * accessible label of the button once it turns into a progress indicator.
   */
  reloadingMessage?: string
  /** Additional Tailwind classes for the banner. */
  className?: string
  /** The app's translate function; omit it and this package's own catalogue is used. */
  t?: TFn
}

/**
 * Drop-in, self-managing "new version available — reload" prompt.
 *
 * Registers the service worker (via {@link useServiceWorkerUpdate}) and, once a
 * newer build is installed and waiting, renders a slim, non-blocking
 * {@link MessageBanner} pinned to the top-center with a primary "Reload" action
 * and a dismiss control. The user is never reloaded automatically.
 *
 * Clicking Reload does not navigate immediately: it asks the waiting worker to skip
 * waiting and then reloads once that worker takes control. For that window the button
 * becomes a spinner and goes disabled, so the click visibly registers instead of
 * looking like it missed.
 *
 * In development (`enabled={false}`) or where service workers are unsupported,
 * the underlying hook is inert and this renders nothing.
 *
 * Drop it once near the root of your app:
 * ```tsx
 * <ServiceWorkerUpdatePrompt enabled={import.meta.env.PROD} />
 * ```
 */
export function ServiceWorkerUpdatePrompt({
  enabled = true,
  swUrl,
  message,
  reloadingMessage,
  className,
  t: appT,
}: ServiceWorkerUpdatePromptProps) {
  const t = useUiText(appT)
  const banner = message ?? t("A new version is available.")
  const reloadingBanner = reloadingMessage ?? t("Updating…")
  const { updateAvailable, reload, dismiss, reloading } = useServiceWorkerUpdate({
    enabled,
    swUrl,
  })

  if (!updateAvailable) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-[100] flex justify-center px-3">
      <MessageBanner
        variant="info"
        onClose={dismiss}
        className={cn(
          "pointer-events-auto w-full max-w-md py-2 shadow-lg backdrop-blur",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <span className="flex-1">{reloading ? reloadingBanner : banner}</span>
          {/* Activating the new worker is not instant, so the button becomes a progress
              indicator rather than sitting there still reading "Reload" as if the click
              had missed. Disabled while it runs: a second SKIP_WAITING does nothing but
              the button must not look re-clickable. `min-w` holds the width steady so
              the banner does not jump on swap. */}
          <Button size="sm" onClick={reload} disabled={reloading} aria-live="polite" className="min-w-20 shrink-0">
            {reloading ? (
              <>
                <Spinner size="sm" className="border-current/30 border-t-current" aria-hidden />
                <span className="sr-only">{reloadingBanner}</span>
              </>
            ) : (
              t("Reload")
            )}
          </Button>
        </div>
      </MessageBanner>
    </div>
  )
}
