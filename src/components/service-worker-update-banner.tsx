import { Button } from "./button"
import { MessageBanner } from "./message-banner"
import { useServiceWorkerUpdate } from "../hooks/use-service-worker-update"
import { cn } from "../lib/utils"

export interface ServiceWorkerUpdatePromptProps {
  /**
   * Whether service-worker registration + update detection is active.
   * Pass `import.meta.env.PROD` to disable in development. Default: `true`.
   */
  enabled?: boolean
  /** URL of the service worker to register (default: `/sw.js`). */
  swUrl?: string
  /** Banner copy (default: "A new version is available."). */
  message?: string
  /** Additional Tailwind classes for the banner. */
  className?: string
}

/**
 * Drop-in, self-managing "new version available — reload" prompt.
 *
 * Registers the service worker (via {@link useServiceWorkerUpdate}) and, once a
 * newer build is installed and waiting, renders a slim, non-blocking
 * {@link MessageBanner} pinned to the top-center with a primary "Reload" action
 * and a dismiss control. The user is never reloaded automatically.
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
  message = "A new version is available.",
  className,
}: ServiceWorkerUpdatePromptProps) {
  const { updateAvailable, reload, dismiss } = useServiceWorkerUpdate({ enabled, swUrl })

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
          <span className="flex-1">{message}</span>
          <Button size="sm" onClick={reload} className="shrink-0">
            Reload
          </Button>
        </div>
      </MessageBanner>
    </div>
  )
}
