"use client"

import { useSyncExternalStore } from "react"
import { UI_TEXT, UI_TEXT_LANGUAGES } from "./ui-text-catalog"

/**
 * This package's own user-facing strings.
 *
 * Components here used to hardcode English — "Sign Out", "Session Expired",
 * "Confirm Action" — with no way for a consuming app to translate them: the
 * strings live in this package's source, so an app's `translations.json` has no
 * key to hold them and its extractor never sees them. A localized app was left
 * with an English header, which is where this was noticed.
 *
 * A `t` prop per string is the wrong shape for shared chrome. It pushes the same
 * translation of "Sign Out" into every app that mounts a header, and the org's
 * `extract-and-sync` prunes any key it cannot find a `t("…")` call for — so those
 * keys would be deleted from each app on the next sync. Text that belongs to a
 * component is translated once, here, beside it: {@link UI_TEXT}.
 *
 * Reactivity without a dependency: react-i18next is an OPTIONAL peer of this
 * package (only `LanguageSwitcher`, exported from the `/i18n` subpath, imports
 * it), so this module cannot subscribe to i18next itself. Instead the active
 * language is a tiny external store; `createAppI18n` sets it and follows
 * `languageChanged`, and components read it through `useSyncExternalStore` so a
 * language switch re-renders them. An app that does not use i18n at all never
 * sets a language and every string resolves to its English source.
 *
 * The `t` prop stays supported and WINS where the app actually has a translation
 * for the key, so an app can still reword any of this.
 */
export type TFn = (key: string, vars?: Record<string, string | number>) => string

/** Fill `{{var}}` placeholders; an unknown name is left visible rather than blanked. */
export function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text
  return text.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = vars[name]
    return value === undefined ? `{{${name}}}` : String(value)
  })
}

/** Returns the key itself, interpolated — the English fallback. */
export const identityT: TFn = (key, vars) => interpolate(key, vars)

let language: string | undefined
const listeners = new Set<() => void>()

/**
 * Set the language this package's own strings resolve in (a BCP-47 tag; the base
 * subtag is what matters, so `de-AT` reads the `de` column). Called by
 * `createAppI18n`; apps wiring i18n by hand can call it themselves. Pass
 * `undefined` for English.
 */
export function setUiLanguage(next: string | undefined): void {
  if (next === language) return
  language = next
  for (const listener of listeners) listener()
}

/** The language this package's strings currently resolve in. */
export function getUiLanguage(): string | undefined {
  return language
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function snapshot(): string | undefined {
  return language
}

function fromCatalog(key: string): string | undefined {
  const base = language?.split("-")[0]
  if (base === undefined) return undefined
  const column = UI_TEXT_LANGUAGES.indexOf(base)
  if (column < 0) return undefined
  return UI_TEXT[key]?.[column]
}

/**
 * Resolve one of this package's strings outside React — for class components
 * (`ErrorBoundary`) and non-render code. Prefer {@link useUiText} in components,
 * which also re-renders on a language change.
 */
export const uiText: TFn = (key, vars) => interpolate(fromCatalog(key) ?? key, vars)

/**
 * Resolve this package's own strings, re-rendering when the language changes.
 *
 * @param override The app's own `t`. Used when it actually has a translation for
 *   the key — in the org's format an untranslated key comes back as the key
 *   itself, which is the signal to fall through to this package's catalogue.
 */
export function useUiText(override?: TFn): TFn {
  useSyncExternalStore(subscribe, snapshot, snapshot)

  return (key, vars) => {
    if (override) {
      const translated = override(key, vars)
      if (translated !== interpolate(key, vars)) return translated
    }
    return uiText(key, vars)
  }
}
