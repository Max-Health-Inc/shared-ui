/** One silent (OIDC `prompt=none`) sign-in attempt per browser session, so a refusal never loops. */
export interface SilentSignIn {
  attempted: () => boolean
  /** True, once, when an attempt may start now. */
  claim: () => boolean
  /** Stay signed out for the rest of this session, e.g. after the user signed out. */
  suppress: () => void
  /** A live session re-arms the attempt for when it later ends. */
  rearm: () => void
}

/** Without session storage every attempt counts as made, so nothing can loop. */
export function silentSignIn(key: string): SilentSignIn {
  const attempted = (): boolean => {
    try {
      return sessionStorage.getItem(key) !== null
    } catch {
      return true
    }
  }
  const write = (on: boolean): void => {
    try {
      if (on) sessionStorage.setItem(key, "1")
      else sessionStorage.removeItem(key)
    } catch {
      return
    }
  }
  return {
    attempted,
    claim: () => {
      if (attempted()) return false
      write(true)
      return true
    },
    suppress: () => { write(true) },
    rearm: () => { write(false) },
  }
}
