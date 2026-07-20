"use client"

import { useTranslation } from "react-i18next"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu"
import { LOCALE_NAMES } from "../lib/i18n"

export interface LanguageSwitcherProps {
  className?: string
}

/** Two-letter ISO label (uppercase) for a BCP-47 tag, e.g. "en-US" → "EN". */
function isoCode(lng: string | undefined): string {
  return (lng ?? "").slice(0, 2).toUpperCase()
}

/**
 * Compact language switcher backed by an app's i18next instance.
 *
 * Renders a small button showing just the active language's 2-letter ISO code
 * (e.g. "EN"); opening it lists the supported languages (ISO code + full name,
 * active one checked). Supported languages come from the active instance
 * (`i18n.options.supportedLngs`, minus the `'cimode'` pseudo-language); selecting
 * one calls `i18n.changeLanguage`.
 */
function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation()

  // `supportedLngs` is `false | readonly string[] | undefined` in i18next.
  const supportedLngs = i18n.options.supportedLngs
  const languages = (Array.isArray(supportedLngs) ? supportedLngs : []).filter(
    (lng): lng is string => Boolean(lng) && lng !== "cimode",
  )
  // Prefer the supported-resolved language; fall back to the raw current language
  // so the code still shows if `resolvedLanguage` is momentarily unset.
  const active = i18n.resolvedLanguage ?? i18n.language

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 gap-1 font-medium", className)}
          aria-label="Select language"
          title="Select language"
        >
          {isoCode(active)}
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8rem]">
        {languages.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onSelect={() => void i18n.changeLanguage(lng)}
            className="gap-2"
          >
            <span className="w-6 font-medium">{isoCode(lng)}</span>
            <span className="text-muted-foreground">{LOCALE_NAMES[lng] ?? lng}</span>
            {lng === active && <Check className="ml-auto size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { LanguageSwitcher }
