import { useEffect, useRef } from "react"

const SESSION_RECHECK_MS = 60_000

/** The part of a SMART auth object a session re-check needs. */
export interface RecheckableAuth {
  refreshAccessToken(): Promise<unknown>
  clearToken(): void
}

/**
 * While `active`, asks the provider whether the session still stands each time the tab is shown or
 * focused again, at most once a minute, by a refresh. A sign-out in another app ends the session
 * while this tab's access token lives on; a refused refresh clears the token and calls `onEnded`.
 */
export function useSessionRecheck(auth: RecheckableAuth, { active, onEnded }: { active: boolean; onEnded: () => void }): void {
  const onEndedRef = useRef(onEnded)
  useEffect(() => { onEndedRef.current = onEnded }, [onEnded])

  useEffect(() => {
    if (!active || typeof window === "undefined") return
    let checkedAt = 0
    const recheck = () => {
      if (document.visibilityState !== "visible" || Date.now() - checkedAt < SESSION_RECHECK_MS) return
      checkedAt = Date.now()
      void auth.refreshAccessToken().then((refreshed) => {
        if (refreshed) return
        auth.clearToken()
        onEndedRef.current()
      }, () => undefined)
    }
    document.addEventListener("visibilitychange", recheck)
    window.addEventListener("focus", recheck)
    return () => {
      document.removeEventListener("visibilitychange", recheck)
      window.removeEventListener("focus", recheck)
    }
  }, [active, auth])
}
