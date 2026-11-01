import i18next, { type i18n as I18nInstance } from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { setUiLanguage } from "./ui-text"

export interface CreateAppI18nOptions {
  /** Language returned when a key has no translation for the active language. Defaults to `'en'`. */
  fallbackLng?: string
  /** Enable browser language detection (localStorage → navigator → htmlTag). Defaults to `true`; pass `false` to disable. */
  detect?: boolean
  /** Enable verbose i18next logging. Defaults to `false`. */
  debug?: boolean
}

/**
 * Singular when `count` is exactly 1, otherwise plural. i18next `_one`/`_other` cannot resolve with
 * English-as-key, and both arms stay literal `t("…")` calls so extract-and-sync keeps their keys.
 */
export function plural<T>(count: number, one: T, other: T): T {
  return count === 1 ? one : other
}

/** Each language's name in its own tongue, for the language switcher. */
export const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  it: "Italiano",
}

function storedLanguages(translations: Record<string, unknown>): string[] {
  const languages = translations._languages
  return Array.isArray(languages) ? languages.filter((l): l is string => typeof l === "string" && l !== "") : []
}

/** `'en'` (the implicit fallback) followed by the file's `_languages`. */
export function getSupportedLanguages(translations: Record<string, unknown>): string[] {
  return ["en", ...storedLanguages(translations)]
}

/**
 * A fresh i18next instance (never the default singleton) from an English-key `translations.json`:
 * `{ "_languages": ["de"], "Save": ["Speichern"] }`. Keys are full sentences, so key and ns separators are off.
 */
export function createAppI18n(
  translations: Record<string, unknown>,
  opts?: CreateAppI18nOptions,
): I18nInstance {
  const languages = storedLanguages(translations)

  const resources: Record<string, { translation: Record<string, string> }> = {}
  for (const lng of languages) {
    resources[lng] = { translation: {} }
  }

  const langIndex = Object.fromEntries(languages.map((lng, i) => [lng, i]))
  for (const [key, values] of Object.entries(translations)) {
    if (key === "_languages" || !Array.isArray(values)) continue
    for (const lng of languages) {
      const index = langIndex[lng]
      const bundle = resources[lng]
      if (index === undefined || bundle === undefined) continue
      const val: unknown = values[index]
      if (typeof val === "string" && val) {
        bundle.translation[key] = val
      }
    }
  }

  const instance = i18next.createInstance()
  instance.use(initReactI18next)
  if (opts?.detect !== false) {
    instance.use(LanguageDetector)
  }

  // Not awaited: react-i18next renders the English keys until resources are ready.
  void instance.init({
    resources,
    supportedLngs: ["en", ...languages],
    // `de-DE` counts as `de`; otherwise resolvedLanguage stays undefined and blanks the switcher.
    nonExplicitSupportedLngs: true,
    fallbackLng: opts?.fallbackLng ?? "en",
    keySeparator: false,
    nsSeparator: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
    debug: opts?.debug ?? false,
  })

  // ui-text.ts cannot subscribe to the optional i18next peer, so the shared chrome follows this.
  setUiLanguage(instance.resolvedLanguage ?? instance.language)
  instance.on("languageChanged", () => {
    setUiLanguage(instance.resolvedLanguage ?? instance.language)
  })
  instance.on("initialized", () => {
    setUiLanguage(instance.resolvedLanguage ?? instance.language)
  })

  return instance
}
