"use client"

import * as React from "react"
import {
  DEFAULT_THEME,
  DEFAULT_THEME_STORAGE_KEY,
  PREFERS_DARK_QUERY,
  THEMES,
  applyResolvedTheme,
  chooseTheme,
  resolveTheme,
  themeScript,
  type ResolvedTheme,
  type Theme,
  type ThemeScriptOptions,
} from "../lib/theme"

const THEME_IDS: readonly Theme[] = THEMES.map((entry) => entry.id)

/** Choices made while localStorage is blocked, so they still last for the page. */
const memoryChoice = new Map<string, Theme>()
const choiceListeners = new Set<() => void>()

function readStoredChoice(storageKey: string): Theme | null {
  let stored: string | null
  try {
    stored = localStorage.getItem(storageKey)
  } catch {
    stored = null
  }
  return THEME_IDS.find((id) => id === stored) ?? memoryChoice.get(storageKey) ?? null
}

function writeStoredChoice(storageKey: string, theme: Theme) {
  try {
    localStorage.setItem(storageKey, theme)
    memoryChoice.delete(storageKey)
  } catch {
    memoryChoice.set(storageKey, theme)
  }
  for (const listener of choiceListeners) listener()
}

/** Follows choices from this page and, through the storage event, from other tabs. */
function subscribeChoice(onChange: () => void): () => void {
  choiceListeners.add(onChange)
  window.addEventListener("storage", onChange)
  return () => {
    choiceListeners.delete(onChange)
    window.removeEventListener("storage", onChange)
  }
}

function subscribePrefersDark(onChange: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => undefined
  const query = window.matchMedia(PREFERS_DARK_QUERY)
  query.addEventListener("change", onChange)
  return () => {
    query.removeEventListener("change", onChange)
  }
}

/** Whether the OS currently prefers dark, false where `matchMedia` is unavailable. */
function prefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false
  return window.matchMedia(PREFERS_DARK_QUERY).matches
}

let pageHour: number | undefined
/** The local hour when the page loaded, so a daytime default does not flip mid-visit. */
function hourAtLoad(): number {
  pageHour ??= new Date().getHours()
  return pageHour
}

function noSubscription(): () => void {
  return () => undefined
}

const serverChoice = () => null
const serverPrefersDark = () => false
const serverHour = () => undefined

const NO_TRANSITIONS = "*,*::before,*::after{transition:none!important}"

/** Suppress CSS transitions for one frame, so a switch does not animate every colour. */
function withoutTransitions(nonce: string | undefined, change: () => void) {
  const style = document.createElement("style")
  if (nonce) style.nonce = nonce
  style.appendChild(document.createTextNode(NO_TRANSITIONS))
  document.head.appendChild(style)
  change()
  void document.body.getBoundingClientRect()
  window.setTimeout(() => {
    style.remove()
  }, 1)
}

export interface ThemeProviderState {
  /** The user's choice, including `system`. */
  theme: Theme
  /** The scheme actually applied — `system` already collapsed. */
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

// The sentinel distinguishes "no provider" from a context default.
type InternalThemeContext = ThemeProviderState & { __provider?: true }

const ThemeContext = React.createContext<InternalThemeContext | undefined>(undefined)

export interface ThemeProviderProps extends ThemeScriptOptions {
  children: React.ReactNode
  /** Suppress CSS transitions while the theme switches. @default false */
  disableTransitionOnChange?: boolean
  /** CSP nonce for the style element that `disableTransitionOnChange` inserts. */
  nonce?: string
}

/**
 * Manages the active light/dark theme, persisting the choice, following the OS while the
 * choice is `system` and other tabs when they change it. Pair with
 * `@max-health-inc/shared-ui/theme.css`, and render {@link ThemeScript} with the same
 * options in `<head>` so a prerendered or server-rendered page paints the right theme first.
 *
 * An app that adds this must also declare `@custom-variant dark (&:where(.dark, .dark *))`
 * in its CSS, otherwise its `dark:` utilities keep tracking the OS and diverge from the
 * chosen theme.
 */
export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = DEFAULT_THEME_STORAGE_KEY,
  enableColorScheme = true,
  disableTransitionOnChange = false,
  nonce,
}: Readonly<ThemeProviderProps>) {
  const stored = React.useSyncExternalStore(subscribeChoice, () => readStoredChoice(storageKey), serverChoice)
  const isDark = React.useSyncExternalStore(subscribePrefersDark, prefersDark, serverPrefersDark)
  const hour = React.useSyncExternalStore(noSubscription, hourAtLoad, serverHour)

  const theme = chooseTheme(stored, defaultTheme, hour, THEME_IDS)
  const resolvedTheme = resolveTheme(theme, isDark)
  const hydrated = hour !== undefined
  const applied = React.useRef<ResolvedTheme | undefined>(undefined)

  // Until hydration ends the values are the server's guess; the pre-paint script owns <html>.
  React.useLayoutEffect(() => {
    if (!hydrated) return
    const root = document.documentElement
    const apply = () => {
      applyResolvedTheme(root, resolvedTheme, enableColorScheme)
    }
    if (disableTransitionOnChange && applied.current !== undefined && applied.current !== resolvedTheme) {
      withoutTransitions(nonce, apply)
    } else {
      apply()
    }
    applied.current = resolvedTheme
  }, [hydrated, resolvedTheme, enableColorScheme, disableTransitionOnChange, nonce])

  const setTheme = React.useCallback(
    (next: Theme) => {
      writeStoredChoice(storageKey, next)
    },
    [storageKey],
  )

  const value: InternalThemeContext = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme, __provider: true }),
    [theme, resolvedTheme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export interface ThemeScriptProps extends ThemeScriptOptions {
  /** The page's CSP nonce, for apps whose policy has no `'unsafe-inline'` script source. */
  nonce?: string
}

/**
 * Applies the stored or default theme before first paint. Render it in `<head>` with the
 * same options as the {@link ThemeProvider}, and put `suppressHydrationWarning` on `<html>`,
 * whose class, `data-theme` and `color-scheme` it sets.
 */
export function ThemeScript({ nonce, defaultTheme, storageKey, enableColorScheme }: Readonly<ThemeScriptProps>) {
  return (
    <script
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeScript({ defaultTheme, storageKey, enableColorScheme }) }}
    />
  )
}

/** Consume the theme. Throws outside a {@link ThemeProvider}, so a missing provider fails loudly. */
export function useTheme(): ThemeProviderState {
  const context = React.useContext(ThemeContext)
  if (!context?.__provider) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export { ThemeContext }
