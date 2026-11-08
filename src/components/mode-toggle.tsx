"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "../hooks/use-theme"
import { THEMES, type Theme } from "../lib/theme"
import { useUiText, type TFn } from "../lib/ui-text"
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
  /** The app's translate function. Omit it and this package's catalogue (English as the floor) is used. */
  t?: TFn
  className?: string
  /**
   * `menu` offers light, dark and system; `toggle` is one button that flips between light
   * and dark, storing the explicit choice. @default "menu"
   */
  variant?: "menu" | "toggle"
}

/**
 * Header button that switches light / dark / system, backed by {@link useTheme}.
 *
 * Owns the hook call, so dropping it into a header is all an app needs. Requires a
 * {@link ThemeProvider} above it; without one the hook throws rather than silently
 * rendering a control that does nothing.
 */
function ModeToggle({ t: appT, className, variant = "menu" }: ModeToggleProps) {
  const t = useUiText(appT)
  const { theme, resolvedTheme, setTheme } = useTheme()
  // The trigger shows the ACTIVE scheme, so `system` reads as whatever it resolved to.
  const TriggerIcon = resolvedTheme === "dark" ? Moon : Sun

  if (variant === "toggle") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={className}
        aria-label={t("Toggle theme")}
        onClick={() => {
          setTheme(resolvedTheme === "dark" ? "light" : "dark")
        }}
      >
        <TriggerIcon className="size-4" />
      </Button>
    )
  }

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
