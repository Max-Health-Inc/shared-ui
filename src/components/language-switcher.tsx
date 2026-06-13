"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { NativeSelect } from "./native-select"
import { LOCALE_NAMES } from "../lib/i18n"

export interface LanguageSwitcherProps {
  className?: string
}

/**
 * Language switcher backed by an app's i18next instance.
 *
 * Supported languages are derived from the active instance
 * (`i18n.options.supportedLngs`), the i18next `'cimode'` pseudo-language and any
 * falsy entries are filtered out, and each language is labelled via
 * {@link LOCALE_NAMES} (falling back to the raw code). Changing the selection
 * calls `i18n.changeLanguage`.
 */
function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation()

  // `supportedLngs` is `false | readonly string[] | undefined` in i18next.
  const supportedLngs = i18n.options.supportedLngs
  const languages = (Array.isArray(supportedLngs) ? supportedLngs : []).filter(
    (lng): lng is string => Boolean(lng) && lng !== "cimode",
  )

  return (
    <NativeSelect
      selectSize="sm"
      className={className}
      value={i18n.resolvedLanguage}
      onChange={(event) => {
        void i18n.changeLanguage(event.target.value)
      }}
      aria-label="Select language"
    >
      {languages.map((lng) => (
        <option key={lng} value={lng}>
          {LOCALE_NAMES[lng] ?? lng}
        </option>
      ))}
    </NativeSelect>
  )
}

export { LanguageSwitcher }
