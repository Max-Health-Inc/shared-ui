"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme, THEMES, type Theme } from "../hooks/use-theme"
// The generic "optional translate function" contract, taken from its single definition
// rather than declaring a second identical type (same as ScenePicker).
import { identityT, type TFn } from "../lib/ui-text"
import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu"

const THEME_ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

export interface ModeToggleProps {
  /** The app's translate function. Omit it and the English source strings are used verbatim. */
  t?: TFn
  className?: string
}

/**
 * Header button that switches light / dark / system, backed by {@link useTheme}.
 *
 * Owns the hook call, so dropping it into a header is all an app needs. Requires a
 * {@link ThemeProvider} above it; without one the hook throws rather than silently
 * rendering a control that does nothing.
 */
function ModeToggle({ t = identityT, className }: ModeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  // The trigger shows the ACTIVE scheme, so `system` reads as whatever it resolved to.
  const TriggerIcon = resolvedTheme === "dark" ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className} aria-label={t("Toggle theme")}>
          <TriggerIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((option) => {
          const Icon = THEME_ICONS[option.id]
          return (
            <DropdownMenuItem
              key={option.id}
              onClick={() => {
                setTheme(option.id)
              }}
              aria-current={theme === option.id}
            >
              <span className="flex items-center gap-2">
                <Icon className="size-4" />
                {t(option.name)}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ModeToggle }
