import type { BillingInterval, PricingPlan } from "./plan-card"

export function formatPlanPrice(cents: number, currency = "USD", locale?: string): string {
  const whole = cents % 100 === 0
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100)
}

/** What a plan charges per period: the annual price when a year is chosen and sold, else the monthly one. */
export function planCharge(plan: PricingPlan, interval: BillingInterval): { cents: number; period: BillingInterval } {
  if (interval === "year" && plan.annualCents != null) return { cents: plan.annualCents, period: "year" }
  return { cents: plan.monthlyCents, period: "month" }
}
