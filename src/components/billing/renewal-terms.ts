import type { TFn } from "../../lib/ui-text"
import { formatPlanPrice, planCharge } from "./price"
import type { BillingInterval, PricingPlan } from "./plan-card"

/** How a subscriber cancels, in the product's words; the default names no product screen. */
export interface RenewalOptions {
  cancelHow?: string
}

const RENEWAL: Record<BillingInterval, { single: string; seat: string }> = {
  month: {
    single: "{{plan}} renews automatically every month at {{price}} until you cancel.",
    seat: "{{plan}} renews automatically every month at {{price}} per seat until you cancel.",
  },
  year: {
    single: "{{plan}} renews automatically every year at {{price}} until you cancel.",
    seat: "{{plan}} renews automatically every year at {{price}} per seat until you cancel.",
  },
}

const DEFAULT_CANCEL_HOW = "You can cancel online at any time from your account."

/** Whether buying this plan starts an automatic renewal: a paid plan bought, not quoted on request. */
export function renews(plan: PricingPlan): boolean {
  return !plan.contact && plan.monthlyCents > 0
}

/** The automatic renewal terms of a plan as one statement: price, interval, until cancelled, how to cancel. */
export function renewalTerms(plan: PricingPlan, interval: BillingInterval, t: TFn, locale?: string, options: RenewalOptions = {}): string {
  const { cents, period } = planCharge(plan, interval)
  const price = formatPlanPrice(cents, plan.currency, locale)
  const renewal = t(plan.perSeat ? RENEWAL[period].seat : RENEWAL[period].single, { plan: plan.name, price })
  return `${renewal} ${options.cancelHow ?? t(DEFAULT_CANCEL_HOW)}`
}
