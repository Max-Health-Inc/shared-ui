import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import type { i18n as I18nInstance } from "i18next"

/**
 * Optional DRY i18n mechanism for Max Health apps.
 *
 * This module is the MECHANISM only — it ships ZERO app translation strings.
 * Each app keeps its own `translations.json` and passes it to {@link createAppI18n}.
 *
 * ## translations.json format
 * ```json
 * {
 *   "_languages": ["de", "es"],
 *   "Save changes": ["Änderungen speichern", "Guardar cambios"],
 *   "Cancel": ["Abbrechen", "Cancelar"]
 * }
 * ```
 * - The English source string IS the i18next key.
 * - The value is a positional array of translations, indexed by `_languages`.
 * - English is never stored: when a key has no translation for the active
 *   language, i18next returns the key itself, so `fallbackLng: 'en'` yields
 *   the original English source string.
 *
 * Because the keys are full English sentences (which may contain `.` and `:`),
 * `keySeparator` and `nsSeparator` are disabled so keys resolve literally.
 */

export interface CreateAppI18nOptions {
  /** Language returned when a key has no translation for the active language. Defaults to `'en'`. */
  fallbackLng?: string
  /** Enable browser language detection (localStorage → navigator → htmlTag). Defaults to `true`; pass `false` to disable. */
  detect?: boolean
  /** Enable verbose i18next logging. Defaults to `false`. */
  debug?: boolean
}

/**
 * Pick the singular or plural form by `count`.
 *
 * ## Why this exists
 * i18next's own plural support (`key_one` / `key_other`) CANNOT work in this format.
 * The English source string IS the key and English is never stored, so there is no `en`
 * bundle holding a `_one` variant to resolve against — i18next falls through to the bare
 * key and interpolates it. The result is that
 *
 * ```ts
 * t("{{count}} tags", { count: 1 })   // → "1 tags"   ✗
 * ```
 *
 * renders the plural form at one, silently, in every language. That has bitten three
 * separate Max Health apps, so reach for this instead:
 *
 * ```ts
 * plural(n, t("1 tag"), t("{{count}} tags", { count: n }))   // → "1 tag" / "3 tags" ✓
 * ```
 *
 * ## Why it takes rendered strings, not keys
 * Both arms stay literal `t("…")` calls at the call site, which is exactly what
 * `extract-and-sync.py` scans for (its regex requires a string literal as the FIRST
 * argument of the translator call). A signature like `plural(t, n, "1 tag", "{{count}} tags")`
 * would hide both keys from extraction and they would be pruned from `translations.json` on
 * the next sync. Evaluating both arms is a pair of map lookups, so the cost is nothing.
 *
 * Each form is translated independently, which is also what languages with different
 * plural rules need — a translator sees two complete sentences rather than a fragment.
 *
 * @param count The quantity deciding the form. Only exactly `1` is singular, so `0` and
 *   `-1` take the plural, matching English ("0 tags").
 * @param one Rendered singular form.
 * @param other Rendered plural form.
 */
export function plural<T>(count: number, one: T, other: T): T {
  return count === 1 ? one : other
}

/**
 * Language endonyms used by the language switcher. These are language-independent
 * constants (a language's name in its own tongue), NOT app translation data.
 */
export const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  it: "Italiano",
}

/**
 * Derive the full supported-language list from a `translations.json`.
 * Always includes `'en'` (the implicit fallback) followed by `_languages`.
 */
export function getSupportedLanguages(translations: Record<string, unknown>): string[] {
  const languages = (translations._languages as string[] | undefined) ?? []
  return ["en", ...languages]
}

/**
 * Build a fresh i18next instance from a `translations.json`.
 *
 * A new instance is created via `i18next.createInstance()` so the shared default
 * singleton is never mutated — multiple apps (or tests) can each hold their own.
 *
 * @param translations Parsed `translations.json` (see module docs for the format).
 * @param opts Optional behavior overrides.
 * @returns The initialized i18next instance.
 */
export function createAppI18n(
  translations: Record<string, unknown>,
  opts?: CreateAppI18nOptions,
): I18nInstance {
  const { _languages, ...entries } = translations
  const languages = (_languages as string[] | undefined) ?? []

  const resources: Record<string, { translation: Record<string, string> }> = {}
  for (const lng of languages) {
    resources[lng] = { translation: {} }
  }

  const langIndex = Object.fromEntries(languages.map((lng, i) => [lng, i]))
  for (const [key, values] of Object.entries(entries)) {
    if (!Array.isArray(values)) continue
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

  // The init() promise is intentionally not awaited here: react-i18next renders
  // the keys (English fallback) until resources are ready, then re-renders.
  void instance.init({
    resources,
    supportedLngs: ["en", ...languages],
    // Map a detected regional locale to its base (e.g. `en-US` → `en`, `de-DE` →
    // `de`) so it counts as supported: this both loads the right resources and
    // lets i18next set `resolvedLanguage` (otherwise it stays undefined for any
    // region-tagged navigator language, blanking the language switcher).
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

  return instance
}
