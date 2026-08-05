"use client"

import * as React from "react"

/** A theme the user can choose. `system` follows the OS preference. */
export type Theme = "light" | "dark" | "system"

/** The concrete scheme a {@link Theme} resolves to. */
export type ResolvedTheme = "light" | "dark"

/** The selectable themes, in display order — the list a picker renders. */
export const THEMES: { id: Theme; name: string; description: string }[] = [
  { id: "light", name: "Light", description: "Always light" },
  { id: "dark", name: "Dark", description: "Always dark" },
  { id: "system", name: "System", description: "Follow the operating system" },
]

const DEFAULT_THEME: Theme = "system"

/** Narrow an arbitrary string to a known {@link Theme}. */
export function isTheme(value: string): value is Theme {
  return THEMES.some((entry) => entry.id === value)
}

/**
 * Resolve a chosen theme to the scheme to apply. Pure, so the contract below is
 * testable without a DOM.
 */
export function resolveTheme(theme: Theme, prefersDark: boolean): ResolvedTheme {
  return theme === "system" ? (prefersDark ? "dark" : "light") : theme
}

/**
 * Apply a scheme to `<html>`. brandc keys its tokens off BOTH `.light`/`.dark` and
 * `[data-theme]`, and writing only `.dark` leaves light mode following the OS rather than
 * the user's choice, so both are always set explicitly.
 */
function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(resolved)
  root.setAttribute("data-theme", resolved)
}

function readStoredTheme(storageKey: string, fallback: Theme): Theme {
  try {
    const stored = localStorage.getItem(storageKey)
    return stored && isTheme(stored) ? stored : fallback
  } catch {
    return fallback
  }
}

function writeStoredTheme(storageKey: string, theme: Theme) {
  try {
    localStorage.setItem(storageKey, theme)
  } catch {
    // localStorage unavailable (e.g. private browsing with storage blocked)
  }
}

/** Whether the OS currently prefers dark, false where `matchMedia` is unavailable. */
function prefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
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

export interface ThemeProviderProps {
  children: React.ReactNode
  /** Theme to use when nothing is stored yet. @default "system" */
  defaultTheme?: Theme
  /** localStorage key used to persist the choice. @default "theme" */
  storageKey?: string
}

/**
 * Manages the active light/dark theme, persisting the choice and following the OS while
 * the choice is `system`. Pair with `@max-health-inc/shared-ui/theme.css`.
 *
 * An app that adds this must also declare `@custom-variant dark (&:where(.dark, .dark *))`
 * in its CSS, otherwise its `dark:` utilities keep tracking the OS and diverge from the
 * chosen theme.
 */
export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = "theme",
}: Readonly<ThemeProviderProps>) {
  const [theme, setThemeState] = React.useState<Theme>(() => readStoredTheme(storageKey, defaultTheme))
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(() =>
    resolveTheme(readStoredTheme(storageKey, defaultTheme), prefersDark()),
  )

  // Apply on mount and on change, and track the OS while the choice is `system`.
  React.useEffect(() => {
    const apply = (isDark: boolean) => {
      const next = resolveTheme(theme, isDark)
      applyTheme(next)
      setResolvedTheme(next)
    }

    if (theme !== "system" || typeof window === "undefined" || typeof window.matchMedia !== "function") {
      apply(false) // ignored for an explicit theme; false is the no-matchMedia fallback
      return
    }

    const query = window.matchMedia("(prefers-color-scheme: dark)")
    apply(query.matches)

    const listener = (event: MediaQueryListEvent) => {
      apply(event.matches)
    }
    query.addEventListener("change", listener)
    return () => {
      query.removeEventListener("change", listener)
    }
  }, [theme])

  const setTheme = React.useCallback(
    (next: Theme) => {
      writeStoredTheme(storageKey, next)
      setThemeState(next)
    },
    [storageKey],
  )

  const value: InternalThemeContext = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme, __provider: true }),
    [theme, resolvedTheme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
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
