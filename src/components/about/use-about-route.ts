"use client"

import { useCallback, useSyncExternalStore } from "react"

const STATE_KEY = "sharedUiAbout"

export interface AboutRoute {
  open: boolean
  show: () => void
  close: () => void
}

export interface AboutRouteOptions {
  /** The app's base path, e.g. `import.meta.env.BASE_URL`; `/` by default. */
  base?: string
}

function trimSlashes(path: string): string {
  return path.replace(/\/+$/, "")
}

/** `/about` under the app's base path. */
export function aboutPath(base = "/"): string {
  return `${trimSlashes(base)}/about`
}

export function isAboutPath(pathname: string, base = "/"): boolean {
  return trimSlashes(pathname) === aboutPath(base)
}

const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  window.addEventListener("popstate", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("popstate", listener)
  }
}

function pathnameSnapshot(): string {
  return window.location.pathname
}

function serverSnapshot(): string {
  return ""
}

function pushedByShow(): boolean {
  const state: unknown = window.history.state
  return typeof state === "object" && state !== null && STATE_KEY in state
}

/** The About view as a real `/about` URL: shareable, reachable signed out, and closed by the browser's back button. */
export function useAboutRoute({ base = "/" }: AboutRouteOptions = {}): AboutRoute {
  const pathname = useSyncExternalStore(subscribe, pathnameSnapshot, serverSnapshot)
  const open = isAboutPath(pathname, base)

  const show = useCallback(() => {
    if (isAboutPath(window.location.pathname, base)) return
    window.history.pushState({ [STATE_KEY]: true }, "", aboutPath(base))
    window.scrollTo({ top: 0 })
    notify()
  }, [base])

  const close = useCallback(() => {
    if (!isAboutPath(window.location.pathname, base)) return
    if (pushedByShow()) {
      window.history.back()
      return
    }
    window.history.replaceState(null, "", `${trimSlashes(base)}/`)
    notify()
  }, [base])

  return { open, show, close }
}
