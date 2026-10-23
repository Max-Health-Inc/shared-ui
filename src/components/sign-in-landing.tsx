import type { ComponentType, ReactNode } from "react"
import { LogIn, type LucideIcon } from "lucide-react"
import { Button } from "./button"
import { useBranding } from "../hooks/use-branding"
import { useUiText, type TFn } from "../lib/ui-text"

export interface SignInLandingProps {
  title: string
  description: ReactNode
  /** Shown when no branding logo is set. */
  icon: LucideIcon | ComponentType<{ className?: string }>
  /** Starts sign-in; or pass `loginHref` for a server-side sign-in route. */
  onLogin?: () => void
  loginHref?: string
  loginDisabled?: boolean
  /** Above the heading, e.g. an error or where the visitor came from. */
  notice?: ReactNode
  /** Beside the sign-in button, e.g. "Create an account". */
  actions?: ReactNode
  /** Below the sign-in button, e.g. an FAQ or identity provider shortcuts. */
  children?: ReactNode
  t?: TFn
}

/** The signed-out screen every SMART app shows: brand, what the app is, and one way in. */
export function SignInLanding({
  title,
  description,
  icon: Icon,
  onLogin,
  loginHref,
  loginDisabled = false,
  notice,
  actions,
  children,
  t: appT,
}: SignInLandingProps) {
  const t = useUiText(appT)
  const brand = useBranding()
  const label = (
    <>
      <LogIn className="size-4" />
      {t("SMART Login")}
    </>
  )

  return (
    <div data-slot="sign-in-landing" className="flex flex-col items-center py-16 gap-8 px-4">
      {notice}
      <div className="w-full text-center space-y-2">
        {brand?.logoUrl ? (
          <img src={brand.logoUrl} alt={brand.name} className="h-16 mx-auto" />
        ) : (
          <Icon className="size-16 mx-auto text-muted-foreground/30" />
        )}
        <h2 className="text-xl font-semibold break-words sm:text-2xl">{title}</h2>
        <div className="mx-auto w-full max-w-md text-muted-foreground">{description}</div>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {loginHref ? (
          <Button size="lg" asChild disabled={loginDisabled}>
            <a href={loginHref}>{label}</a>
          </Button>
        ) : (
          <Button size="lg" onClick={onLogin} disabled={loginDisabled}>
            {label}
          </Button>
        )}
        {actions}
      </div>
      {children}
    </div>
  )
}
