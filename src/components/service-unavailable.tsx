import { ServerCrash, WifiOff, ShieldAlert, AlertTriangle } from "lucide-react"
import type { ReactNode } from "react"

export type ServiceErrorVariant = "unavailable" | "offline" | "unauthorized" | "generic"

export interface ServiceUnavailableProps {
  /** Which variant to display. Defaults to "unavailable". */
  variant?: ServiceErrorVariant
  /** Override the heading text */
  title?: string
  /** Override the description text */
  description?: string
  /** Custom action instead of the default Retry button */
  action?: ReactNode
  /** Called when the default Retry button is clicked. Defaults to page reload. */
  onRetry?: () => void
}

const VARIANTS: Record<ServiceErrorVariant, {
  icon: typeof ServerCrash
  defaultTitle: string
  defaultDescription: string
}> = {
  unavailable: {
    icon: ServerCrash,
    defaultTitle: "Service Unavailable",
    defaultDescription: "The service is temporarily unreachable. This usually resolves within a few minutes.",
  },
  offline: {
    icon: WifiOff,
    defaultTitle: "You're Offline",
    defaultDescription: "Check your network connection and try again.",
  },
  unauthorized: {
    icon: ShieldAlert,
    defaultTitle: "Session Expired",
    defaultDescription: "Your session has expired. Please sign in again to continue.",
  },
  generic: {
    icon: AlertTriangle,
    defaultTitle: "Something Went Wrong",
    defaultDescription: "An unexpected error occurred. Please try again.",
  },
}

/**
 * Full-page error state for systemic failures (auth down, network issues, etc.).
 * Use this instead of rendering broken sub-components when APIs are unreachable.
 *
 * @example
 * ```tsx
 * // Auth service down
 * <ServiceUnavailable variant="unavailable" />
 *
 * // Custom action
 * <ServiceUnavailable
 *   variant="unauthorized"
 *   action={<Button onClick={() => navigate("/login")}>Sign In</Button>}
 * />
 * ```
 */
export function ServiceUnavailable({
  variant = "unavailable",
  title,
  description,
  action,
  onRetry,
}: ServiceUnavailableProps) {
  const config = VARIANTS[variant]
  const Icon = config.icon

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center bg-background">
      <Icon className="size-16 text-muted-foreground/40" />
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-foreground">
          {title ?? config.defaultTitle}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {description ?? config.defaultDescription}
        </p>
      </div>
      {action ?? (
        <button
          onClick={onRetry ?? (() => { window.location.reload() })}
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}
