"use client"

import { useSyncExternalStore } from "react"
import { UI_TEXT, UI_TEXT_LANGUAGES } from "./ui-text-catalog"

/**
 * This package's own strings, translated once in {@link UI_TEXT}. The active language is a small external
 * store set by `createAppI18n`, since react-i18next is only an optional peer; an app `t` still wins when it has a translation.
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
/** The column `language` maps to in every {@link UI_TEXT} row; -1 when English or unknown. */
let column = -1
const listeners = new Set<() => void>()

/** Language for this package's strings; `de-AT` reads the `de` column, `undefined` means English. */
export function setUiLanguage(next: string | undefined): void {
  if (next === language) return
  language = next
  const base = next?.split("-")[0]
  column = base === undefined ? -1 : UI_TEXT_LANGUAGES.indexOf(base)
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
  if (column < 0) return undefined
  return UI_TEXT[key]?.[column]
}

/** Resolve a string outside React (class components, non-render code); prefer {@link useUiText} in components. */
export const uiText: TFn = (key, vars) => interpolate(fromCatalog(key) ?? key, vars)

/** Resolve this package's strings and re-render on a language change; `override` wins when it returns more than the key. */
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

export function useUiLanguage(): string | undefined {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
