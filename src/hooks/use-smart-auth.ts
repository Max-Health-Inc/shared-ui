import { useCallback, useEffect, useRef, useState } from "react"
import { onAuthError } from "../lib/auth-error"

const DEEPLINK_KEY = "__smart_deeplink__"
const isBrowser = typeof window !== "undefined"

export type SmartAppState =
  | "loading"
  | "unauthenticated"
  | "callback"
  | "authenticated"
  | "error"
  | "session-expired"

/** Minimal interface matching any generated SmartAuth class. */
export interface SmartAuthLike {
  handleCallback(): Promise<unknown>
  isAuthenticated(): boolean
  isTokenExpired(): boolean
  refreshAccessToken(): Promise<unknown>
  clearToken(): void
  authorize(): Promise<void>
  logout(): void
  startEhrLaunch?(launch: string, iss: string): Promise<void>
  /** Optional: return the current token (used to derive patientId, fhirUser + granted scope reactively). */
  getToken?(): { patient?: string; fhirUser?: string; scope?: string } | null
}

export interface UseSmartAuthOptions {
  smartAuth: SmartAuthLike
  /** Called after successful authentication (callback, refresh, or existing valid token). */
  onAuthenticated?: () => void
  /** Override the default authorize() for login. E.g., dtr-app uses startStandaloneLaunch(). */
  startAuth?: () => Promise<void>
  /** Handle EHR launch params (launch + iss). Defaults to true. */
  ehrLaunch?: boolean
  /** Skip auth entirely (e.g. SHL viewer mode). State stays "unauthenticated". */
  skip?: boolean
}

export function useSmartAuth({
  smartAuth,
  onAuthenticated,
  startAuth,
  ehrLaunch = true,
  skip = false,
}: UseSmartAuthOptions) {
  const [state, setState] = useState<SmartAppState>(() => {
    if (skip) return "unauthenticated"
    if (!isBrowser) return "loading"
    const params = new URLSearchParams(window.location.search)
    // If there's a callback or EHR launch pending, start in loading state
    if (params.has("code") || (ehrLaunch && params.has("launch") && params.has("iss"))) return "loading"
    // Check existing token synchronously
    if (smartAuth.isAuthenticated() && !smartAuth.isTokenExpired()) return "authenticated"
    return "loading"
  })
  const [error, setError] = useState<string | null>(null)
  const callbackHandled = useRef(false)

  useEffect(() => {
    if (skip) return
    if (!isBrowser) return

    onAuthError((msg) => {
      setError(msg)
      setState("session-expired")
    })

    const params = new URLSearchParams(window.location.search)

    // Handle OAuth callback
    if (params.has("code")) {
      if (callbackHandled.current) return
      callbackHandled.current = true

      setState("callback")
      void smartAuth
        .handleCallback()
        .then(() => {
          const saved = sessionStorage.getItem(DEEPLINK_KEY)
          sessionStorage.removeItem(DEEPLINK_KEY)
          window.history.replaceState({}, "", window.location.pathname + (saved ?? ""))
          onAuthenticated?.()
          setState("authenticated")
        })
        .catch((err: unknown) => {
          const msg =
            err instanceof Error ? err.message : "Auth callback failed"
          if (/state mismatch/i.test(msg)) {
            window.history.replaceState({}, "", window.location.pathname)
            smartAuth.clearToken()
            setError(
              "Your session was reset (e.g. after a password change). Please sign in again.",
            )
            setState("session-expired")
          } else {
            setError(msg)
            setState("error")
          }
        })
      return
    }

    // Handle EHR launch
    if (
      ehrLaunch &&
      params.has("launch") &&
      params.has("iss") &&
      smartAuth.startEhrLaunch
    ) {
      const launch = params.get("launch") ?? ""
      const iss = params.get("iss") ?? ""
      void smartAuth.startEhrLaunch(launch, iss).catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "EHR launch failed")
        setState("error")
      })
      return
    }

    // Check existing token
    if (smartAuth.isAuthenticated()) {
      if (smartAuth.isTokenExpired()) {
        void smartAuth.refreshAccessToken().then((refreshed) => {
          if (refreshed) {
            onAuthenticated?.()
            setState("authenticated")
          } else {
            smartAuth.clearToken()
            setState("session-expired")
            setError("Your session has expired. Please sign in again.")
          }
        })
      } else {
        onAuthenticated?.()
      }
    } else {
      void Promise.resolve().then(() => { setState("unauthenticated") })
    }
  }, [ehrLaunch, onAuthenticated, skip, smartAuth])

  const handleLogin = useCallback(() => {
    if (isBrowser && window.location.search) {
      sessionStorage.setItem(DEEPLINK_KEY, window.location.search)
    }
    const auth = startAuth ?? (() => smartAuth.authorize())
    void auth().catch((err: unknown) => {
      setError(
        err instanceof Error ? err.message : "Failed to start SMART launch",
      )
      setState("error")
    })
  }, [startAuth, smartAuth])

  const handleLogout = useCallback(() => {
    smartAuth.logout()
  }, [smartAuth])

  // Derive patientId + the user's FHIR role reactively — updates when state
  // becomes "authenticated". `fhirUser` (the SMART claim) points at the signed-in
  // user's own resource, so a `.../Practitioner/<id>` URL marks a clinician (vs a
  // `.../Patient/<id>` for patient-facing logins). `isPractitioner` lets the shell
  // gate clinician-only affordances such as Switch Patient.
  const token = state === "authenticated" && smartAuth.getToken ? smartAuth.getToken() : null
  const patientId = token?.patient ?? undefined
  const fhirUser = token?.fhirUser ?? undefined
  const isPractitioner = !!fhirUser && /\/Practitioner\//i.test(fhirUser)
  // "Switch Patient" only works when the session can actually re-run a patient
  // picker: a practitioner who also holds the `launch/patient` scope (standalone
  // launch). EHR launches grant `launch` (patient fixed by the launch context,
  // single-use) so a standalone re-authorize() can't present a picker; and a
  // patient's own standalone login holds launch/patient but must not switch —
  // hence BOTH conditions. The granted scope lives on the token, so this is
  // stable across the OAuth redirect (unlike the one-shot launch/iss URL params).
  const canSwitchPatient =
    isPractitioner && (token?.scope ?? "").split(/\s+/).includes("launch/patient")

  return { state, error, handleLogin, handleLogout, patientId, fhirUser, isPractitioner, canSwitchPatient }
}
