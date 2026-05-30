import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { LogIn, AlertTriangle } from "lucide-react"
import { AppHeader, type AppHeaderProps } from "./app-header"
import { Button } from "./button"
import { Spinner } from "./spinner"
import { useBranding } from "../hooks/use-branding"
import { useSmartAuth, type SmartAuthLike, type UseSmartAuthOptions } from "../hooks/use-smart-auth"

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
  const { state, error, handleLogin, handleLogout } = useSmartAuth({
    smartAuth,
    ...hookOptions,
  })
  const brand = useBranding()

  const content = (
    <div className="min-h-screen bg-background">
      <AppHeader {...header} authenticated={state === "authenticated"} onSignOut={handleLogout} onSwitchPatient={switchPatient ? handleLogin : undefined} />

      <main className={`${maxWidth} mx-auto px-4 py-6`}>
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
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="text-destructive font-medium">Authentication Error</p>
              <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
              <Button onClick={handleLogin}>Try Again</Button>
            </div>
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
  )

  return wrapper ? wrapper(content) : content
}
