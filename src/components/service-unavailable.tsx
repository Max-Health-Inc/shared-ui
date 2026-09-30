import { ServerCrash, WifiOff, ShieldAlert, ShieldX, SearchX, AlertTriangle, ArrowLeft, RefreshCw, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "./button"
import { cn } from "../lib/utils"
import { useUiText, type TFn } from "../lib/ui-text"
import { serviceErrorVariant, type ServiceErrorVariant } from "../lib/service-error"

export type { ServiceErrorVariant }

export interface ServiceUnavailableProps {
  /** Which screen to show. Derived from `error` when omitted, else "unavailable". */
  variant?: ServiceErrorVariant
  /** The failure itself; its status picks the variant and its message fills the details. */
  error?: unknown
  title?: string
  description?: string
  /** Shown collapsed under "Technical details". Defaults to the error's message. */
  details?: string
  icon?: LucideIcon
  /** Replaces the default Back and Retry buttons. */
  action?: ReactNode
  /** Defaults to a page reload. */
  onRetry?: () => void
  /** Renders a Back button when set. */
  onBack?: () => void
  /** "page" fills the viewport; "inline" sits inside an app's layout. */
  layout?: "page" | "inline"
  /** The app's translate function; omit it and this package's own catalogue is used. */
  t?: TFn
}

const VARIANTS: Record<ServiceErrorVariant, { icon: LucideIcon; title: string; description: string }> = {
  unavailable: {
    icon: ServerCrash,
    title: "Service Unavailable",
    description: "The service is temporarily unreachable. This usually resolves within a few minutes.",
  },
  offline: {
    icon: WifiOff,
    title: "You're Offline",
    description: "Check your network connection and try again.",
  },
  unauthorized: {
    icon: ShieldAlert,
    title: "Session Expired",
    description: "Your session has expired. Please sign in again to continue.",
  },
  forbidden: {
    icon: ShieldX,
    title: "Access Denied",
    description: "You do not have access to this information.",
  },
  notFound: {
    icon: SearchX,
    title: "Not Found",
    description: "This information could not be found.",
  },
  generic: {
    icon: AlertTriangle,
    title: "Something Went Wrong",
    description: "An unexpected error occurred. Please try again.",
  },
}

/**
 * The org's error screen: for a failed request pass `error` and it picks the message from the
 * status. Always offers a way on, Retry by default and Back when `onBack` is set.
 */
export function ServiceUnavailable({
  variant,
  error,
  title,
  description,
  details,
  icon,
  action,
  onRetry,
  onBack,
  layout = "page",
  t: appT,
}: ServiceUnavailableProps) {
  const t = useUiText(appT)
  const config = VARIANTS[variant ?? (error === undefined ? "unavailable" : serviceErrorVariant(error))]
  const Icon = icon ?? config.icon
  const shownDetails = details ?? (error instanceof Error ? error.message : undefined)

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-6 text-center",
        layout === "page" ? "min-h-dvh p-8 bg-background" : "py-24 px-4",
      )}
    >
      <Icon className="size-16 text-muted-foreground/40" aria-hidden="true" />
      <div className="w-full space-y-2">
        <h1 className="text-xl font-semibold text-foreground break-words">{title ?? t(config.title)}</h1>
        <p className="mx-auto w-full max-w-md text-sm text-muted-foreground">
          {description ?? t(config.description)}
        </p>
      </div>
      {action ?? (
        <div className="flex flex-wrap justify-center gap-3">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="size-4" />
              {t("Back")}
            </Button>
          )}
          <Button onClick={onRetry ?? (() => { window.location.reload() })}>
            <RefreshCw className="size-4" />
            {t("Retry")}
          </Button>
        </div>
      )}
      {shownDetails && (
        <details className="w-full max-w-sm text-xs text-muted-foreground/60">
          <summary className="cursor-pointer hover:text-muted-foreground">{t("Technical details")}</summary>
          <code className="block mt-1 p-2 bg-muted rounded text-[11px] break-all">{shownDetails}</code>
        </details>
      )}
    </div>
  )
}
