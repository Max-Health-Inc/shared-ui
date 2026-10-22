import { decodeJwt, type JWTPayload } from "jose"
import { useCallback, useEffect, useRef, useState } from "react"
import { onAuthError } from "../lib/auth-error"
import { silentSignIn as createSilentSignIn } from "../lib/silent-sign-in"

const DEEPLINK_KEY = "__smart_deeplink__"
const silentAttempt = createSilentSignIn("__smart_silent_attempted__")
const SILENT_REFUSALS = new Set(["login_required", "interaction_required", "consent_required", "account_selection_required"])
const isBrowser = typeof window !== "undefined"

export type SmartAppState =
  | "loading"
  | "unauthenticated"
  | "callback"
  | "authenticated"
  | "error"
  | "session-expired"

/** Per-request authorization options; `prompt: "none"` asks the IdP to sign in without interaction. */
export interface AuthorizeOptions {
  prompt?: "none"
}

/** Minimal interface matching any generated SmartAuth class. */
export interface SmartAuthLike {
  handleCallback(): Promise<unknown>
  isAuthenticated(): boolean
  isTokenExpired(): boolean
  refreshAccessToken(): Promise<unknown>
  clearToken(): void
  authorize(options?: AuthorizeOptions): Promise<void>
  logout(): void
  startEhrLaunch?(launch: string, iss: string): Promise<void>
  /** Optional: return the current token (used to derive patientId, fhirUser, granted scope + the signed-in name reactively). */
  getToken?(): { patient?: string; fhirUser?: string; scope?: string; id_token?: string } | null
  /** Optional: sign in again in a popup, keeping the page; rejects with a `PopupClosedError` when the user closes it. */
  authorizeInPopup?(): Promise<unknown>
  /** Optional: in that popup, hand the callback back to the opener and close; true when it did. */
  relayCallbackToOpener?(): boolean
}

const POPUP_CLOSED = "PopupClosedError"

/** One-time EHR launch parameters, spent by the launch and never worth restoring. */
const EHR_LAUNCH_PARAMS = ["launch", "iss"] as const

/**
 * What a sign-in round trip would otherwise lose: the path, the query and the fragment a handoff
 * code can live in, minus any `drop`ped query parameters.
 */
export function deepLinkOf(
  location: Pick<Location, "pathname" | "search" | "hash">,
  drop: readonly string[] = [],
): string {
  const params = new URLSearchParams(location.search)
  for (const name of drop) params.delete(name)
  const query = drop.length > 0 ? (params.size > 0 ? `?${params}` : "") : location.search
  return `${location.pathname}${query}${location.hash}`
}

/** What the authorization server said when it redirected back with an error (RFC 6749 §4.1.2.1), else null. */
export function authorizationErrorOf(search: string): string | null {
  const params = new URLSearchParams(search)
  const error = params.get("error")
  if (!error) return null
  const description = params.get("error_description")?.trim()
  if (description) return description
  return error
}

/** True when the IdP answered a `prompt=none` request by saying it needs the user (OIDC Core §3.1.2.6). */
export function isSilentSignInRefusal(search: string): boolean {
  return SILENT_REFUSALS.has(new URLSearchParams(search).get("error") ?? "")
}

/** The saved deep link when it is a same-origin path, else the current path. */
export function restorableDeepLink(saved: string | null, currentPath: string): string {
  const sameOrigin = saved !== null && saved.startsWith("/") && !saved.startsWith("//") && !saved.startsWith("/\\")
  return sameOrigin ? saved : currentPath
}

/**
 * Best-effort display name from an id_token's standard OIDC claims. Decoded, not
 * verified — for showing "who's signed in", never a trust decision.
 */
export function displayNameFromIdToken(idToken: string | undefined): string | undefined {
  if (!idToken) return undefined
  let claims: JWTPayload
  try {
    claims = decodeJwt(idToken)
  } catch {
    return undefined
  }
  return [claims.name, claims.preferred_username, claims.email].find(
    (v): v is string => typeof v === "string" && v.trim().length > 0,
  )
}

export interface UseSmartAuthOptions {
  smartAuth: SmartAuthLike
  /** Called after successful authentication (callback, refresh, or existing valid token). */
  onAuthenticated?: () => void
  /** Override the default authorize() for login. E.g., dtr-app uses startStandaloneLaunch(). */
  startAuth?: (options?: AuthorizeOptions) => Promise<void>
  /** Handle EHR launch params (launch + iss). Defaults to true. */
  ehrLaunch?: boolean
  /** Skip auth entirely (e.g. SHL viewer mode). State stays "unauthenticated". */
  skip?: boolean
  /**
   * Resolve the signed-in display name once authenticated — e.g. by dereferencing the
   * SMART `fhirUser` to a Practitioner/Patient and reading its name. FHIR access stays in
   * the app; this hook only calls it and prefers its result over the id_token's OIDC claims.
   */
  resolveUserName?: () => Promise<string | undefined>
  /**
   * With no usable token, first try once per browser session to reuse the sign-in the user
   * already holds at the identity provider (OIDC `prompt=none`), e.g. from another app on the
   * same realm. If the IdP needs the user, the app shows its sign-in as usual. Default: false
   */
  silentSignIn?: boolean
}

export function useSmartAuth({
  smartAuth,
  onAuthenticated,
  startAuth,
  ehrLaunch = true,
  skip = false,
  resolveUserName,
  silentSignIn = false,
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
  const [resumable, setResumable] = useState(false)
  const callbackHandled = useRef(false)
  const [resolvedName, setResolvedName] = useState<string | undefined>(undefined)
  const startAuthRef = useRef(startAuth)
  useEffect(() => { startAuthRef.current = startAuth }, [startAuth])

  useEffect(() => {
    if (skip) return
    if (!isBrowser) return
    if (smartAuth.relayCallbackToOpener?.()) return

    // Only a mounted app reports an auth error, so its page is worth keeping.
    onAuthError((msg) => {
      setError(msg)
      setResumable(true)
      setState("session-expired")
    })

    const params = new URLSearchParams(window.location.search)

    const trySilentSignIn = (): boolean => {
      if (!silentSignIn || !silentAttempt.claim()) return false
      sessionStorage.setItem(DEEPLINK_KEY, deepLinkOf(window.location))
      const start = startAuthRef.current ?? ((options?: AuthorizeOptions) => smartAuth.authorize(options))
      void start({ prompt: "none" }).catch(() => { setState("unauthenticated") })
      return true
    }

    if (silentAttempt.attempted() && isSilentSignInRefusal(window.location.search)) {
      const saved = sessionStorage.getItem(DEEPLINK_KEY)
      sessionStorage.removeItem(DEEPLINK_KEY)
      window.history.replaceState({}, "", restorableDeepLink(saved, window.location.pathname))
      void Promise.resolve().then(() => { setState("unauthenticated") })
      return
    }

    // A refused authorization comes back with ?error= instead of a code: say why, and leave
    // the user on the page they started from rather than on the redirect URI.
    const refused = authorizationErrorOf(window.location.search)
    if (refused) {
      const saved = sessionStorage.getItem(DEEPLINK_KEY)
      sessionStorage.removeItem(DEEPLINK_KEY)
      window.history.replaceState({}, "", restorableDeepLink(saved, window.location.pathname))
      void Promise.resolve().then(() => {
        setError(refused)
        setState("error")
      })
      return
    }

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
          silentAttempt.rearm()
          window.history.replaceState({}, "", restorableDeepLink(saved, window.location.pathname))
          onAuthenticated?.()
          setState("authenticated")
        })
        .catch((err: unknown) => {
          const msg =
            err instanceof Error ? err.message : "Auth callback failed"
          // Single-use: left in the URL, a reload resubmits it and reports invalid_code instead.
          window.history.replaceState({}, "", window.location.pathname)
          if (/state mismatch/i.test(msg)) {
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
      sessionStorage.setItem(DEEPLINK_KEY, deepLinkOf(window.location, EHR_LAUNCH_PARAMS))
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
            if (trySilentSignIn()) return
            setState("session-expired")
            setError("Your session has expired. Please sign in again.")
          }
        })
      } else {
        onAuthenticated?.()
      }
    } else if (!trySilentSignIn()) {
      void Promise.resolve().then(() => { setState("unauthenticated") })
    }
  }, [ehrLaunch, onAuthenticated, silentSignIn, skip, smartAuth])

  const handleLogin = useCallback(() => {
    if (isBrowser) sessionStorage.setItem(DEEPLINK_KEY, deepLinkOf(window.location))
    const auth = startAuth ?? (() => smartAuth.authorize())
    void auth().catch((err: unknown) => {
      setError(
        err instanceof Error ? err.message : "Failed to start SMART launch",
      )
      setState("error")
    })
  }, [startAuth, smartAuth])

  const handleReauthenticate = useCallback(() => {
    if (!smartAuth.authorizeInPopup) {
      handleLogin()
      return
    }
    smartAuth.authorizeInPopup().then(
      () => {
        silentAttempt.rearm()
        setError(null)
        setResumable(false)
        onAuthenticated?.()
        setState("authenticated")
      },
      (err: unknown) => {
        if (err instanceof Error && err.name === POPUP_CLOSED) return
        handleLogin()
      },
    )
  }, [handleLogin, onAuthenticated, smartAuth])

  const handleLogout = useCallback(() => {
    silentAttempt.suppress()
    smartAuth.logout()
  }, [smartAuth])

  // Resolve the app-supplied display name once per authenticated transition. Held in a ref so
  // a changing callback identity does not re-fetch; cleared when the session ends.
  const resolveRef = useRef(resolveUserName)
  useEffect(() => { resolveRef.current = resolveUserName }, [resolveUserName])
  useEffect(() => {
    if (state !== "authenticated") return
    const resolve = resolveRef.current
    if (!resolve) return
    let cancelled = false
    // Set only in the async callback (never synchronously in the effect body); `?? undefined`
    // clears a prior session's name when a re-login resolves to nothing.
    void resolve()
      .then((name) => { if (!cancelled) setResolvedName(name ?? undefined) })
      .catch(() => { /* name is best-effort; the id_token fallback covers a failure */ })
    return () => { cancelled = true }
  }, [state])

  // Derive patientId + the user's FHIR role reactively — updates when state
  // becomes "authenticated". `fhirUser` (the SMART claim) points at the signed-in
  // user's own resource, so a `.../Practitioner/<id>` URL marks a clinician (vs a
  // `.../Patient/<id>` for patient-facing logins). `isPractitioner` lets the shell
  // gate clinician-only affordances such as Switch Patient.
  const token = state === "authenticated" && smartAuth.getToken ? smartAuth.getToken() : null
  const patientId = token?.patient ?? undefined
  const fhirUser = token?.fhirUser ?? undefined
  const isPractitioner = !!fhirUser && /\/Practitioner\//i.test(fhirUser)
  // Who is signed in: the app-resolved name (e.g. from fhirUser) when available, else the
  // id_token's OIDC claims. Many SMART tokens carry no name claim, so the resolver is the
  // reliable path and this is the fallback.
  const userName = resolvedName ?? displayNameFromIdToken(token?.id_token)
  // "Switch Patient" only works when the session can actually re-run a patient
  // picker: a practitioner who also holds the `launch/patient` scope (standalone
  // launch). EHR launches grant `launch` (patient fixed by the launch context,
  // single-use) so a standalone re-authorize() can't present a picker; and a
  // patient's own standalone login holds launch/patient but must not switch —
  // hence BOTH conditions. The granted scope lives on the token, so this is
  // stable across the OAuth redirect (unlike the one-shot launch/iss URL params).
  const canSwitchPatient =
    isPractitioner && (token?.scope ?? "").split(/\s+/).includes("launch/patient")

  return {
    state,
    error,
    resumable,
    handleLogin,
    handleReauthenticate,
    handleLogout,
    patientId,
    fhirUser,
    userName,
    isPractitioner,
    canSwitchPatient,
  }
}
