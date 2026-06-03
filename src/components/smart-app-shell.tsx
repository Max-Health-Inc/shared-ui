import { createContext, useContext, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { LogIn, AlertTriangle, WifiOff, ShieldAlert, RefreshCw } from "lucide-react"
import { AppHeader, type AppHeaderProps } from "./app-header"
import { Button } from "./button"
import { Spinner } from "./spinner"
import { useBranding } from "../hooks/use-branding"
import { useSmartAuth, type SmartAuthLike, type UseSmartAuthOptions } from "../hooks/use-smart-auth"

/** Context providing the current patient ID (reactive — updates on Switch Patient). */
const PatientContext = createContext<string | undefined>(undefined)

/**
 * Hook to access the current patient ID from within a SmartAppShell.
 * Returns undefined when no patient context is available.
 */
export function usePatientId(): string | undefined {
  return useContext(PatientContext)
}

export interface SmartAppShellProps {
  /** The SmartAuth instance (from createSmartAuth). */
  smartAuth: SmartAuthLike
  /** Override options for the useSmartAuth hook. */
  hookOptions?: Omit<UseSmartAuthOptions, "smartAuth">
  /** Props forwarded to AppHeader. */
  header: Omit<AppHeaderProps, "authenticated" | "onSignOut" | "onSwitchPatient">
  /** App title shown on the unauthenticated landing screen. */
  title: string
  /** Description shown on the unauthenticated landing screen. */
  description: string
  /** Icon shown on the unauthenticated landing when no branding logo is set. */
  icon: LucideIcon
  /** Tailwind max-width class for the main content area. Default: "max-w-5xl" */
  maxWidth?: string
  /** Content rendered when authenticated. */
  children: ReactNode
  /** Optional: wrap the entire shell (e.g. ModalStackProvider, i18n). */
  wrapper?: (children: ReactNode) => ReactNode
  /** Override the loading/callback state renderer. */
  renderLoading?: (state: "loading" | "callback") => ReactNode
  /** Override the error state renderer. */
  renderError?: (error: string | null, retry: () => void) => ReactNode
  /** Override the unauthenticated state renderer. */
  renderUnauthenticated?: (login: () => void) => ReactNode
  /** Override the session-expired state renderer. */
  renderSessionExpired?: (error: string | null, login: () => void) => ReactNode
  /** Show a "Switch Patient" button in the header when authenticated. Triggers a new authorize flow (no re-login needed thanks to IdP session). Default: false */
  switchPatient?: boolean
}

export function SmartAppShell({
  smartAuth,
  hookOptions,
  header,
  title,
  description,
  icon: Icon,
  maxWidth = "max-w-5xl",
  children,
  wrapper,
  renderLoading,
  renderError,
  renderUnauthenticated,
  renderSessionExpired,
  switchPatient = false,
}: SmartAppShellProps) {
  const { state, error, handleLogin, handleLogout, patientId } = useSmartAuth({
    smartAuth,
    ...hookOptions,
  })
  const brand = useBranding()

  const content = (
    <PatientContext.Provider value={patientId}>
    <div className="flex flex-col h-full min-h-screen bg-background">
      <AppHeader {...header} authenticated={state === "authenticated"} onSignOut={handleLogout} onSwitchPatient={switchPatient ? handleLogin : undefined} />

      <main className={`${maxWidth} mx-auto px-4 py-6 flex-1 overflow-y-auto w-full`}>
        {state === "loading" || state === "callback" ? (
          renderLoading ? (
            renderLoading(state)
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Spinner size="lg" />
              <p className="text-muted-foreground">
                {state === "callback" ? "Completing sign in..." : "Loading..."}
              </p>
            </div>
          )
        ) : state === "session-expired" ? (
          renderSessionExpired ? (
            renderSessionExpired(error, handleLogin)
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="text-center space-y-3">
                <AlertTriangle className="size-12 mx-auto text-amber-500" />
                <h2 className="text-xl font-semibold">Session Expired</h2>
                <p className="text-muted-foreground max-w-md">
                  {error ?? "Your session has expired. Please sign in again to continue."}
                </p>
              </div>
              <Button size="lg" onClick={handleLogin}>
                <LogIn className="size-4" />
                Sign In Again
              </Button>
            </div>
          )
        ) : state === "error" ? (
          renderError ? (
            renderError(error, handleLogin)
          ) : (
            <AuthErrorBoundary error={error} onRetry={handleLogin} />
          )
        ) : state === "unauthenticated" ? (
          renderUnauthenticated ? (
            renderUnauthenticated(handleLogin)
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="text-center space-y-2">
                {brand?.logoUrl ? (
                  <img src={brand.logoUrl} alt={brand.name} className="h-16 mx-auto" />
                ) : (
                  <Icon className="size-16 mx-auto text-muted-foreground/30" />
                )}
                <h2 className="text-2xl font-semibold">{title}</h2>
                <p className="text-muted-foreground max-w-md">{description}</p>
              </div>
              <Button size="lg" onClick={handleLogin}>
                <LogIn className="size-4" />
                Sign In with SMART
              </Button>
            </div>
          )
        ) : (
          children
        )}
      </main>
    </div>
    </PatientContext.Provider>
  )

  return wrapper ? wrapper(content) : content
}

// ── Auth Error Boundary ─────────────────────────────────────────────────────

interface AuthErrorInfo {
  icon: LucideIcon
  title: string
  message: string
  isNetwork: boolean
}

function classifyAuthError(error: string | null): AuthErrorInfo {
  const msg = (error ?? "").toLowerCase()

  if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("network")) {
    return {
      icon: WifiOff,
      title: "Connection Problem",
      message: "Unable to reach the authentication server. Please check your internet connection and try again.",
      isNetwork: true,
    }
  }

  if (msg.includes("timeout") || msg.includes("timed out")) {
    return {
      icon: WifiOff,
      title: "Request Timed Out",
      message: "The authentication server took too long to respond. This is usually temporary — please try again.",
      isNetwork: true,
    }
  }

  if (msg.includes("invalid_client") || msg.includes("unauthorized_client")) {
    return {
      icon: ShieldAlert,
      title: "Configuration Error",
      message: "This application is not properly registered with the identity provider. Please contact your administrator.",
      isNetwork: false,
    }
  }

  if (msg.includes("access_denied") || msg.includes("consent")) {
    return {
      icon: ShieldAlert,
      title: "Access Denied",
      message: "You do not have permission to access this application, or the required consent was not granted.",
      isNetwork: false,
    }
  }

  return {
    icon: AlertTriangle,
    title: "Something Went Wrong",
    message: "We couldn\u2019t complete the sign-in process. This may be a temporary issue.",
    isNetwork: false,
  }
}

function AuthErrorBoundary({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  const info = classifyAuthError(error)
  const ErrorIcon = info.icon

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="rounded-full bg-muted p-4">
        <ErrorIcon className="size-10 text-muted-foreground" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-xl font-semibold">{info.title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{info.message}</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => { window.location.reload() }}>
          <RefreshCw className="size-4" />
          Reload Page
        </Button>
        <Button onClick={onRetry}>
          <LogIn className="size-4" />
          Try Again
        </Button>
      </div>
      {error && (
        <details className="text-xs text-muted-foreground/60 max-w-sm">
          <summary className="cursor-pointer hover:text-muted-foreground">Technical details</summary>
          <code className="block mt-1 p-2 bg-muted rounded text-[11px] break-all">{error}</code>
        </details>
      )}
    </div>
  )
}
