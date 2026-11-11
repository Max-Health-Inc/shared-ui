"use client"

import * as React from "react"
import { useUiText, type TFn } from "../../lib/ui-text"
import { cn } from "../../lib/utils"
import type { BillingInterval, PricingPlan } from "./plan-card"
import { renewalTerms, type RenewalOptions } from "./renewal-terms"

export interface RenewalConsentProps {
  plan: PricingPlan
  interval?: BillingInterval
  locale?: string
  options?: RenewalOptions
  /** The purchase control; it stays disabled until the terms are accepted. */
  children: React.ReactNode
  t?: TFn
  className?: string
}

/**
 * The renewal terms next to the control that buys the plan, and the member's express agreement to
 * them before it works. The control sits in a fieldset, so whatever button a product renders is held.
 */
export function RenewalConsent({ plan, interval = "month", locale, options, children, t: appT, className }: RenewalConsentProps) {
  const t = useUiText(appT)
  const [agreed, setAgreed] = React.useState(false)
  const id = React.useId()

  return (
    <div className={cn("w-full space-y-3", className)}>
      <p data-renewal-terms className="text-xs text-muted-foreground">{renewalTerms(plan, interval, t, locale, options)}</p>
      <label htmlFor={id} className="flex items-start gap-2 text-xs">
        <input id={id} type="checkbox" className="mt-0.5 size-4 shrink-0" checked={agreed} onChange={(event) => { setAgreed(event.target.checked) }} />
        <span>{t("I agree to these automatic renewal terms.")}</span>
      </label>
      <fieldset disabled={!agreed} className="m-0 w-full min-w-0 border-0 p-0">
        {children}
      </fieldset>
    </div>
  )
}
