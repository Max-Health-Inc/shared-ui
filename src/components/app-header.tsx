import { useRef, type ComponentType, type ReactNode } from "react"
import { CircleUser, LayoutGrid, LogOut, UserRoundSearch, type LucideIcon } from "lucide-react"
import { Button } from "./button"
import { HeaderLabel } from "./header-label"
import { HeaderCompactContext, useHeaderOverflow } from "../lib/header-compact"
import { PwaInstallButton } from "./pwa-install-button"
import { appBaseUrl } from "../lib/smart-app-config"
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
  /** Extra controls on the right, before the built-in actions; shown regardless of `hideActions`. */
  actions?: ReactNode
  /** Tailwind max-width class for the inner container (default: "max-w-5xl") */
  maxWidth?: string
  /** Hide the built-in actions (App Store, account, Sign Out), e.g. for shared/public views */
  hideActions?: boolean
  /** Where the logo and title link, in the same tab. Defaults to {@link appBaseUrl}; `false` for a header that must not navigate. */
  homeUrl?: string | false
  /** Absolute App Store URL, shown signed in or out and opened in a new tab; omit to hide. Use `buildAppStoreUrl(config)`. */
  appStoreUrl?: string
  /** Label for the PWA install button (default: a translated "Install"). Set to false to hide. */
  installLabel?: string | false
  /** The app's translate function; omit to use this package's own catalogue. */
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
  homeUrl,
  appStoreUrl,
  installLabel,
  t: appT,
}: AppHeaderProps) {
  const brand = useBranding()
  const t = useUiText(appT)
  const home = homeUrl === false ? null : homeUrl ?? appBaseUrl()
  const rowRef = useRef<HTMLDivElement>(null)
  const compact = useHeaderOverflow(rowRef)
  const accountLabel = userName ?? t("Account")

  const mark = brand?.logoUrl ? (
    <img src={brand.logoUrl} alt={brand.name} className="h-5 sm:h-6 w-auto shrink-0" />
  ) : (
    <Icon className="size-5 text-maxhealth shrink-0" />
  )
  const heading = <h1 className="font-semibold truncate min-w-0 text-sm sm:text-base">{title}</h1>

  return (
    <HeaderCompactContext.Provider value={compact}>
    <header className="border-b border-foreground/10 bg-foreground/[0.02] pt-safe px-safe">
      <div ref={rowRef} className={cn(maxWidth, "mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1")}>
        <div className="flex shrink-0 items-center gap-2">
          {home ? (
            <a
              href={home}
              title={t("Go to the start page")}
              className="flex items-center gap-2 min-w-0 rounded-sm transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maxhealth"
            >
              {mark}
              {heading}
            </a>
          ) : (
            <>
              {mark}
              {heading}
            </>
          )}
          {children}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {actions}
          {installLabel !== false && <PwaInstallButton label={installLabel ?? t("Install")} />}
          {!hideActions && appStoreUrl && (
            <Button variant="ghost" size="sm" asChild>
              <a href={appStoreUrl} target="_blank" rel="noopener noreferrer" title={t("App Store")}>
                <LayoutGrid className="size-4" />
                <HeaderLabel>{t("App Store")}</HeaderLabel>
              </a>
            </Button>
          )}
          {!hideActions && authenticated && (
            <>
              {accountUrl ? (
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={accountUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={userName ? `${userName} · ${t("Manage your account")}` : t("Manage your account")}
                  >
                    <CircleUser className="size-4" />
                    <span className="sr-only">{accountLabel}</span>
                  </a>
                </Button>
              ) : userName ? (
                <span className="flex items-center px-2 text-muted-foreground" title={userName}>
                  <CircleUser className="size-4" />
                  <span className="sr-only">{userName}</span>
                </span>
              ) : null}
              {onSwitchPatient && (
                <Button variant="ghost" size="sm" onClick={onSwitchPatient}>
                  <UserRoundSearch className="size-4" />
                  <HeaderLabel>{t("Switch Patient")}</HeaderLabel>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onSignOut}>
                <LogOut className="size-4" />
                <HeaderLabel>{t("Sign Out")}</HeaderLabel>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
    </HeaderCompactContext.Provider>
  )
}
