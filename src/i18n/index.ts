// OPTIONAL i18n subpath entry: `@max-health-inc/shared-ui/i18n`.
//
// This barrel is intentionally NOT re-exported from the main `src/index.ts`,
// so apps that only import e.g. `{ Button }` never pull i18next into their bundle.
// Importing from this subpath requires the optional peer deps to be installed:
// `i18next`, `react-i18next`, `i18next-browser-languagedetector`.

export {
  createAppI18n,
  getSupportedLanguages,
  plural,
  LOCALE_NAMES,
  type CreateAppI18nOptions,
} from "../lib/i18n"

export { LanguageSwitcher, type LanguageSwitcherProps } from "../components/language-switcher"

// Re-exported from react-i18next for consumer convenience, so apps need only a
// single i18n import surface.
export { useTranslation, Trans } from "react-i18next"
