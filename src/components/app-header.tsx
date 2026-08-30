import type { ComponentType, ReactNode } from "react"
import { CircleUser, LayoutGrid, LogOut, UserRoundSearch, type LucideIcon } from "lucide-react"
import { Button } from "./button"
import { PwaInstallButton } from "./pwa-install-button"
import { useBranding } from "../hooks/use-branding"
import { useUiText, type TFn } from "../lib/ui-text"
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
  /** Signed-in user's display name — shown when authenticated so it is clear who is logged in. */
  userName?: string
  /** Member account/management URL. When set, the signed-in identity links here (opens in a new tab). */
  accountUrl?: string
  /** Optional extra content rendered after the title (e.g. a launch-mode badge) */
  children?: ReactNode
  /**
   * Extra controls rendered on the RIGHT, before the built-in actions (e.g. ModeToggle,
   * SettingsDialog). Shown regardless of `hideActions`, which governs only the built-ins.
   */
  actions?: ReactNode
  /** Tailwind max-width class for the inner container (default: "max-w-5xl") */
  maxWidth?: string
  /** Hide all action buttons (Sign Out, App Store) — useful for shared/public views */
  hideActions?: boolean
  /**
   * Absolute URL of the App Store. Omit it and the button is not rendered.
   *
   * There is deliberately no default. It used to be a relative "/apps", which resolves only
   * when the proxy itself serves the app; on an app's own domain it pointed at a page that
   * does not exist, and three apps shipped that broken link before anyone noticed. A missing
   * URL now shows nothing rather than something that 404s. Apps built on
   * `createSmartAppConfig` pass `${config.proxyBase}/apps`.
   */
  appStoreUrl?: string
  /** Label for the PWA install button (default: a translated "Install"). Set to false to hide. */
  installLabel?: string | false
  /**
   * The app's translate function, used where it has a translation for one of this
   * package's keys. Omit it and the strings come from this package's own
   * catalogue in the active language, or English.
   */
  t?: TFn
}

export function AppHeader({
  title,
  icon: Icon,
  authenticated,
  onSignOut,
  onSwitchPatient,
  userName,
  accountUrl,
  children,
  actions,
  maxWidth = "max-w-5xl",
  hideActions,
  appStoreUrl,
  installLabel,
  t: appT,
}: AppHeaderProps) {
  const brand = useBranding()
  const t = useUiText(appT)

  // pt-safe/px-safe: in a standalone PWA the header is the topmost surface, so it owns
  // the status-bar and notch insets. Both are 0 wherever the browser reports no overlay.
  return (
    <header className="border-b border-foreground/10 bg-foreground/[0.02] pt-safe px-safe">
      {/*
        `flex-wrap` + min-w-0 on the TITLE rather than on its group. With min-w-0 on the group,
        justify-between handed it whatever was left over and it accepted a width below its own
        controls, so on a narrow screen the language switcher and friends overflowed their box and
        ran under the actions — the sign-out button read as cut off. At its real min-content the
        group cannot do that, and the actions drop to a second row instead. Unchanged on any
        screen wide enough to fit one row, which is every desktop.
      */}
      <div className={cn(maxWidth, "mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1")}>
        <div className="flex items-center gap-2">
          {brand?.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.name} className="h-5 sm:h-6 w-auto shrink-0" />
          ) : (
            <Icon className="size-5 text-maxhealth shrink-0" />
          )}
          <h1 className="font-semibold truncate min-w-0 text-sm sm:text-base">{title}</h1>
          {children}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {actions}
          {installLabel !== false && <PwaInstallButton label={installLabel ?? t("Install")} />}
          {!hideActions && (authenticated ? (
            <>
              {/* accountUrl always links (name when known, else "Account"); a nameless, link-less chip shows nothing. */}
              {accountUrl ? (
                <Button variant="ghost" size="sm" asChild>
                  <a href={accountUrl} target="_blank" rel="noreferrer" title={t("Manage your account")}>
                    <CircleUser className="size-4" />
                    <span className="hidden sm:inline max-w-[14ch] truncate">{userName ?? t("Account")}</span>
                  </a>
                </Button>
              ) : userName ? (
                <span className="hidden sm:flex items-center gap-1.5 px-2 text-xs text-muted-foreground" title={userName}>
                  <CircleUser className="size-4" />
                  <span className="max-w-[14ch] truncate">{userName}</span>
                </span>
              ) : null}
              {onSwitchPatient && (
                <Button variant="ghost" size="sm" onClick={onSwitchPatient}>
                  <UserRoundSearch className="size-4" />
                  <span className="hidden sm:inline">{t("Switch Patient")}</span>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onSignOut}>
                <LogOut className="size-4" />
                <span className="hidden sm:inline">{t("Sign Out")}</span>
              </Button>
            </>
          ) : appStoreUrl ? (
            <Button variant="ghost" size="sm" asChild>
              {/* A new tab: the store is a different app, and these are SMART apps a user is
                  mid-task in. Navigating away in place discards an unsaved consent, an
                  in-progress questionnaire or a loaded imaging study. */}
              <a href={appStoreUrl} target="_blank" rel="noopener noreferrer">
                <LayoutGrid className="size-4" />
                <span className="hidden sm:inline">{t("App Store")}</span>
              </a>
            </Button>
          ) : null)}
        </div>
      </div>
    </header>
  )
}
