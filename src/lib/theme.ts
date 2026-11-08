/** A theme the user can choose. `system` follows the OS preference. */
export type Theme = "light" | "dark" | "system"

/** The concrete scheme a {@link Theme} resolves to. */
export type ResolvedTheme = "light" | "dark"

/** Light from `from` (inclusive) until `to` (exclusive), in local hours 0-24, dark otherwise. Wraps past midnight when `from > to`. */
export interface DaytimeTheme {
  daytime: { from: number; to: number }
}

/** What applies while nothing is stored: a fixed {@link Theme}, or one computed from the local time. */
export type ThemeDefault = Theme | DaytimeTheme

/** The selectable themes, in display order — the list a picker renders. */
export const THEMES: { id: Theme; name: string; description: string }[] = [
  { id: "light", name: "Light", description: "Always light" },
  { id: "dark", name: "Dark", description: "Always dark" },
  { id: "system", name: "System", description: "Follow the operating system" },
]

export const DEFAULT_THEME: Theme = "system"
export const DEFAULT_THEME_STORAGE_KEY = "theme"
export const PREFERS_DARK_QUERY = "(prefers-color-scheme: dark)"

/** Narrow an arbitrary string to a known {@link Theme}. */
export function isTheme(value: string): value is Theme {
  return THEMES.some((entry) => entry.id === value)
}

/*
 * chooseTheme, resolveTheme, applyResolvedTheme and bootTheme are serialized into the
 * pre-paint script, so each references only its parameters and browser globals.
 */

/**
 * The theme in force: a known stored choice, else the default. An unknown `hour` (server
 * render) resolves a daytime default to `system`.
 */
export function chooseTheme(
  stored: string | null,
  defaultTheme: ThemeDefault,
  hour: number | undefined,
  themes: readonly Theme[],
): Theme {
  const known = themes.find((id) => id === stored)
  if (known) return known
  if (typeof defaultTheme === "string") return defaultTheme
  if (hour === undefined) return "system"
  const { from, to } = defaultTheme.daytime
  const light = from <= to ? hour >= from && hour < to : hour >= from || hour < to
  return light ? "light" : "dark"
}

/**
 * Resolve a chosen theme to the scheme to apply. Pure, so the contract below is
 * testable without a DOM.
 */
export function resolveTheme(theme: Theme, prefersDark: boolean): ResolvedTheme {
  return theme === "system" ? (prefersDark ? "dark" : "light") : theme
}

/**
 * Apply a scheme to `root`. brandc keys its tokens off BOTH `.light`/`.dark` and
 * `[data-theme]`, and writing only `.dark` leaves light mode following the OS rather than
 * the user's choice, so both are always set explicitly.
 */
export function applyResolvedTheme(root: HTMLElement, resolved: ResolvedTheme, colorScheme: boolean): void {
  root.classList.remove("light", "dark")
  root.classList.add(resolved)
  root.setAttribute("data-theme", resolved)
  if (colorScheme) root.style.colorScheme = resolved
}

export interface ThemeBootConfig {
  storageKey: string
  defaultTheme: ThemeDefault
  colorScheme: boolean
  themes: readonly Theme[]
  query: string
}

/** The pre-paint entry point: read the stored choice and the OS, then apply. */
export function bootTheme(
  config: ThemeBootConfig,
  choose: typeof chooseTheme,
  resolve: typeof resolveTheme,
  apply: typeof applyResolvedTheme,
): void {
  let stored: string | null
  try {
    stored = window.localStorage.getItem(config.storageKey)
  } catch {
    stored = null
  }
  const theme = choose(stored, config.defaultTheme, new Date().getHours(), config.themes)
  const prefersDark = typeof window.matchMedia === "function" && window.matchMedia(config.query).matches
  apply(document.documentElement, resolve(theme, prefersDark), config.colorScheme)
}

export interface ThemeScriptOptions {
  /** Theme to use when nothing is stored yet. @default "system" */
  defaultTheme?: ThemeDefault
  /** localStorage key used to persist the choice. @default "theme" */
  storageKey?: string
  /** Also set `color-scheme` on `<html>`, so native controls and scrollbars follow. @default true */
  enableColorScheme?: boolean
}

/**
 * Source of an inline script that applies the stored or default theme before first paint.
 * Pass the same options as the {@link ThemeProvider}; render it in `<head>` (see `ThemeScript`).
 */
export function themeScript({
  defaultTheme = DEFAULT_THEME,
  storageKey = DEFAULT_THEME_STORAGE_KEY,
  enableColorScheme = true,
}: ThemeScriptOptions = {}): string {
  const config: ThemeBootConfig = {
    storageKey,
    defaultTheme,
    colorScheme: enableColorScheme,
    themes: THEMES.map((entry) => entry.id),
    query: PREFERS_DARK_QUERY,
  }
  const json = JSON.stringify(config).replace(/</g, "\\u003c")
  const helpers = [chooseTheme, resolveTheme, applyResolvedTheme].map((fn) => fn.toString()).join(",")
  return `try{(${bootTheme.toString()})(${json},${helpers})}catch(e){}`
}
