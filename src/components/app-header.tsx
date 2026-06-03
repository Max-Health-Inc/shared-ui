import type { ComponentType, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { LayoutGrid, LogOut, UserRoundSearch } from "lucide-react"
import { Button } from "./button"
import { PwaInstallButton } from "./pwa-install-button"
import { useBranding } from "../hooks/use-branding"
import { cn } from "../lib/utils"

export interface AppHeaderProps {
  /** App title displayed next to the icon */
  title: string
  /** Icon component used as fallback when no branding logo is configured. Accepts LucideIcon or any SVG component with className prop. */
  icon: LucideIcon | ComponentType<{ className?: string }>
  /** Whether the user is currently authenticated (controls Sign Out visibility) */
  authenticated?: boolean
  /** Called when the user clicks Sign Out */
  onSignOut?: () => void
  /** Called when the user wants to switch patient context (re-launch without re-login) */
  onSwitchPatient?: () => void
  /** Optional extra content rendered after the title (e.g. a launch-mode badge) */
  children?: ReactNode
  /** Tailwind max-width class for the inner container (default: "max-w-5xl") */
  maxWidth?: string
  /** Hide all action buttons (Sign Out, App Store) — useful for shared/public views */
  hideActions?: boolean
  /** URL for the App Store button (default: "/apps") */
  appStoreUrl?: string
  /** Label for the PWA install button (default: "Install"). Set to false to hide. */
  installLabel?: string | false
}

export function AppHeader({
  title,
  icon: Icon,
  authenticated,
  onSignOut,
  onSwitchPatient,
  children,
  maxWidth = "max-w-5xl",
  hideActions,
  appStoreUrl = "/apps",
  installLabel = "Install",
}: AppHeaderProps) {
  const brand = useBranding()

  return (
    <header className="border-b border-foreground/10 bg-foreground/[0.02]">
      <div className={cn(maxWidth, "mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2")}>
        <div className="flex items-center gap-2 min-w-0">
          {brand?.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.name} className="h-5 sm:h-6 w-auto shrink-0" />
          ) : (
            <Icon className="size-5 text-maxhealth shrink-0" />
          )}
          <h1 className="font-semibold truncate text-sm sm:text-base">{title}</h1>
          {children}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {installLabel !== false && <PwaInstallButton label={installLabel} />}
          {!hideActions && (authenticated ? (
            <>
              {onSwitchPatient && (
                <Button variant="ghost" size="sm" onClick={onSwitchPatient}>
                  <UserRoundSearch className="size-4" />
                  <span className="hidden sm:inline">Switch Patient</span>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onSignOut}>
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <a href={appStoreUrl}>
                <LayoutGrid className="size-4" />
                <span className="hidden sm:inline">App Store</span>
              </a>
            </Button>
          ))}
        </div>
      </div>
    </header>
  )
}
