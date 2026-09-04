import { createContext, useContext, type ComponentType, type ReactNode } from "react"
import { LogIn, LogOut, AlertTriangle, WifiOff, ShieldAlert, RefreshCw, type LucideIcon } from "lucide-react"
import { AppHeader, type AppHeaderProps } from "./app-header"
import { Button } from "./button"
import { Spinner } from "./spinner"
import { useBranding } from "../hooks/use-branding"
import { useSmartAuth, type SmartAuthLike, type UseSmartAuthOptions } from "../hooks/use-smart-auth"
import { useUiText, type TFn } from "../lib/ui-text"

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
  /** Props forwarded to AppHeader. `userName` and `accountUrl` are injected by the shell. */
  header: Omit<AppHeaderProps, "authenticated" | "onSignOut" | "onSwitchPatient" | "userName" | "accountUrl">
  /** Member account/management URL. When set, the signed-in identity in the header links here. */
  accountUrl?: string
  /** App title shown on the unauthenticated landing screen. */
  title: string
  /** Description shown on the unauthenticated landing screen. */
  description: string
  /** Icon shown on the unauthenticated landing when no branding logo is set. */
  icon: LucideIcon | ComponentType<{ className?: string }>
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
  /** Offer a "Switch Patient" button in the header when authenticated. Triggers a new authorize flow (no re-login needed thanks to IdP session). Only shown when the session can actually pick a patient — a practitioner (`fhirUser` is a Practitioner) holding the `launch/patient` scope (standalone launch). Patient logins and EHR launches never see it. Default: false */
  switchPatient?: boolean
  /**
   * The app's translate function, used where it has a translation for one of this
   * package's keys and forwarded to the header. Omit it and the strings come from
   * this package's own catalogue in the active language, or English.
   */
  t?: TFn
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
  accountUrl,
  t: appT,
}: SmartAppShellProps) {
  const t = useUiText(appT)
  const { state, error, handleLogin, handleLogout, patientId, userName, canSwitchPatient } = useSmartAuth({
    smartAuth,
    ...hookOptions,
  })
  const brand = useBranding()

  const content = (
    <PatientContext.Provider value={patientId}>
    {/*
      min-h-dvh, not min-h-screen. `100vh` is the LARGE viewport, which deliberately
      ignores retracting browser UI, so the shell measured taller than what is on
      screen — theme.css states this as half of the safe-area contract, and the shell
      was the one place breaking it.

      data-slot gives the scene stylesheet something stable to key on. Five apps had
      each copied a `.min-h-screen.bg-background { background-color: transparent }`
      rule into their own CSS to let the background scene through; that selector is a
      pair of utility classes, so this very change would have silently broken all five.
      scenes.css now carries the rule against this attribute instead.
    */}
    <div data-slot="app-shell" className="flex flex-col h-full min-h-dvh bg-background">
      {/*
        Sign Out shows in every state except the one where there is definitely no session
        to leave. Stated as "not unauthenticated" rather than a list of states that may
        have one: a new state added to SmartAppState then defaults to offering the way
        out, instead of silently hiding it the way "error" and "session-expired" were.
        A hung callback is a stuck state too, and leaving is the only thing that helps.
      */}
      <AppHeader {...header} t={header.t ?? appT} authenticated={state !== "unauthenticated"} onSignOut={handleLogout} onSwitchPatient={switchPatient && canSwitchPatient ? handleLogin : undefined} userName={userName} accountUrl={accountUrl} />

      {/* px-safe-4/pb-safe-6 add the device insets to the designed padding: in landscape
          a notch eats the left gutter, and the gesture bar overlaps the last row. */}
      <main className={`${maxWidth} mx-auto px-safe-4 pt-6 pb-safe-6 flex-1 overflow-y-auto w-full`}>
        {state === "loading" || state === "callback" ? (
          renderLoading ? (
            renderLoading(state)
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Spinner size="lg" />
              <p className="text-muted-foreground">
                {state === "callback" ? t("Completing sign in...") : t("Loading...")}
              </p>
            </div>
          )
        ) : state === "session-expired" ? (
          renderSessionExpired ? (
            renderSessionExpired(error, handleLogin)
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="w-full text-center space-y-3">
                <AlertTriangle className="size-12 mx-auto text-amber-500" />
                <h2 className="text-xl font-semibold break-words">{t("Session Expired")}</h2>
                <p className="w-full max-w-md text-muted-foreground">
                  {error ?? t("Your session has expired. Please sign in again to continue.")}
                </p>
              </div>
              {/*
                One action. Ending the still-live IdP session, so a different account can sign
                in, used to sit here as a second button — but the header renders Sign Out in
                this state (`authenticated` is true for anything except `unauthenticated`) and
                it calls this very handler, so the page offered the same escape twice.
              */}
              <Button size="lg" onClick={handleLogin}>
                <LogIn className="size-4" />
                {t("Sign In Again")}
              </Button>
            </div>
          )
        ) : state === "error" ? (
          renderError ? (
            renderError(error, handleLogin)
          ) : (
            <AuthErrorBoundary error={error} onRetry={handleLogin} onSignOut={handleLogout} t={t} />
          )
        ) : state === "unauthenticated" ? (
          renderUnauthenticated ? (
            renderUnauthenticated(handleLogin)
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="w-full text-center space-y-2">
                {brand?.logoUrl ? (
                  <img src={brand.logoUrl} alt={brand.name} className="h-16 mx-auto" />
                ) : (
                  <Icon className="size-16 mx-auto text-muted-foreground/30" />
                )}
                <h2 className="text-xl font-semibold break-words sm:text-2xl">{title}</h2>
                <p className="w-full max-w-md text-muted-foreground">{description}</p>
              </div>
              <Button size="lg" onClick={handleLogin}>
                <LogIn className="size-4" />
                {t("Sign In with SMART")}
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
  /** Source strings, resolved by the view — this helper runs outside React. */
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

function AuthErrorBoundary({ error, onRetry, onSignOut, t }: { error: string | null; onRetry: () => void; onSignOut: () => void; t: TFn }) {
  const info = classifyAuthError(error)
  const ErrorIcon = info.icon

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="rounded-full bg-muted p-4">
        <ErrorIcon className="size-10 text-muted-foreground" />
      </div>
      <div className="w-full max-w-md text-center space-y-2">
        <h2 className="text-xl font-semibold break-words">{t(info.title)}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{t(info.message)}</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => { window.location.reload() }}>
          <RefreshCw className="size-4" />
          {t("Reload Page")}
        </Button>
        <Button onClick={onRetry}>
          <LogIn className="size-4" />
          {t("Try Again")}
        </Button>
      </div>
      {/*
        Retry re-runs the flow as the SAME signed-in user, so for anything about who
        that user is — a patient reaching a practitioner-only screen, a denied consent —
        it fails identically. Signing out is the only action that changes the outcome.
      */}
      <Button variant="ghost" size="sm" onClick={onSignOut}>
        <LogOut className="size-4" />
        {t("Sign out and use a different account")}
      </Button>
      {error && (
        <details className="w-full max-w-sm text-xs text-muted-foreground/60">
          <summary className="cursor-pointer hover:text-muted-foreground">{t("Technical details")}</summary>
          <code className="block mt-1 p-2 bg-muted rounded text-[11px] break-all">{error}</code>
        </details>
      )}
    </div>
  )
}
