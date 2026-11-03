import { createContext, useContext, type ComponentType, type ReactNode } from "react"
import { ArrowRight, LogIn, LogOut, AlertTriangle, RefreshCw, type LucideIcon } from "lucide-react"
import { AppHeader, type AppHeaderProps } from "./app-header"
import { Button } from "./button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog"
import { Spinner } from "./spinner"
import { ServiceUnavailable } from "./service-unavailable"
import { SignInLanding } from "./sign-in-landing"
import { trustedRefusalUri, useSmartAuth, type AuthorizationRefusal, type SmartAuthLike, type UseSmartAuthOptions } from "../hooks/use-smart-auth"
import { useUiText, type TFn } from "../lib/ui-text"
import { classifyAuthError } from "../lib/auth-error-info"

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
  icon,
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
  const { state, error, refusal, resumable, handleLogin, handleReauthenticate, handleLogout, patientId, userName, canSwitchPatient } = useSmartAuth({
    smartAuth,
    ...hookOptions,
  })
  const signInAgain = resumable ? handleReauthenticate : handleLogin
  const keepApp = state === "session-expired" && resumable && !renderSessionExpired

  const content = (
    <PatientContext.Provider value={patientId}>
    {/* min-h-dvh: 100vh ignores retracting browser UI. data-slot is what scenes.css keys on. */}
    <div data-slot="app-shell" className="flex flex-col h-full min-h-dvh bg-background">
      {/* Any new state defaults to offering Sign Out. */}
      <AppHeader {...header} t={header.t ?? appT} authenticated={state !== "unauthenticated"} onSignOut={handleLogout} onSwitchPatient={switchPatient && canSwitchPatient ? handleLogin : undefined} userName={userName} accountUrl={accountUrl} />

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
        ) : state === "session-expired" && !keepApp ? (
          renderSessionExpired ? (
            renderSessionExpired(error, signInAgain)
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="w-full text-center space-y-3">
                <AlertTriangle className="size-12 mx-auto text-amber-500" />
                <h2 className="text-xl font-semibold break-words">{t("Session Expired")}</h2>
                <p className="mx-auto w-full max-w-md text-muted-foreground">
                  {error ?? t("Your session has expired. Please sign in again to continue.")}
                </p>
              </div>
              {/* The header already offers Sign Out here. */}
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
            <AuthErrorBoundary error={error} refusal={refusal} trustedOrigins={originsOf(accountUrl)} onRetry={handleLogin} onSignOut={handleLogout} t={t} />
          )
        ) : state === "unauthenticated" ? (
          renderUnauthenticated ? (
            renderUnauthenticated(handleLogin)
          ) : (
            <SignInLanding title={title} description={description} icon={icon} onLogin={handleLogin} t={t} />
          )
        ) : (
          children
        )}
      </main>
      <SessionExpiredDialog open={keepApp} error={error} onSignIn={handleReauthenticate} onSignOut={handleLogout} t={t} />
    </div>
    </PatientContext.Provider>
  )

  return wrapper ? wrapper(content) : content
}

/** Over the app rather than in its place, so a sign-in in the popup resumes where the user was. */
function SessionExpiredDialog({ open, error, onSignIn, onSignOut, t }: { open: boolean; error: string | null; onSignIn: () => void; onSignOut: () => void; t: TFn }) {
  const block = (event: Event) => { event.preventDefault() }
  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} onEscapeKeyDown={block} onInteractOutside={block}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            {t("Session Expired")}
          </DialogTitle>
          <DialogDescription>{error ?? t("Your session has expired. Please sign in again to continue.")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onSignOut}>
            <LogOut className="size-4" />
            {t("Sign Out")}
          </Button>
          <Button onClick={onSignIn}>
            <LogIn className="size-4" />
            {t("Sign In Again")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** The origin of the account site, which is where a refusal may send someone to fix it. */
function originsOf(url: string | undefined): string[] {
  return url && URL.canParse(url) ? [new URL(url).origin] : []
}

// ── Auth Error Boundary ─────────────────────────────────────────────────────

interface AuthErrorBoundaryProps {
  error: string | null
  refusal: AuthorizationRefusal | null
  /** Origins whose pages a refusal may send the user to, e.g. the member account site. */
  trustedOrigins: readonly string[]
  onRetry: () => void
  onSignOut: () => void
  t: TFn
}

function AuthErrorBoundary({ error, refusal, trustedOrigins, onRetry, onSignOut, t }: AuthErrorBoundaryProps) {
  const info = classifyAuthError(error, refusal)
  const nextStep = trustedRefusalUri(refusal, trustedOrigins)

  return (
    <ServiceUnavailable
      layout="inline"
      icon={info.icon}
      title={t(info.title)}
      description={refusal?.description ?? t(info.message)}
      details={refusal?.error ?? error ?? undefined}
      t={t}
      action={
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3">
            {/* A refusal is not a loading glitch, so reloading cannot help it. */}
            {!refusal && (
              <Button variant="outline" onClick={() => { window.location.reload() }}>
                <RefreshCw className="size-4" />
                {t("Reload Page")}
              </Button>
            )}
            <Button variant={nextStep ? "outline" : "default"} onClick={onRetry}>
              <LogIn className="size-4" />
              {t("Try Again")}
            </Button>
            {nextStep && (
              <Button asChild>
                <a href={nextStep}>
                  <ArrowRight className="size-4" />
                  {t("Continue")}
                </a>
              </Button>
            )}
          </div>
          {/* Retry repeats the flow as the same user; only signing out changes the outcome. */}
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <LogOut className="size-4" />
            {t("Sign out and use a different account")}
          </Button>
        </div>
      }
    />
  )
}
