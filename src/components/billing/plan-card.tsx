"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { useUiText, type TFn } from "../../lib/ui-text"
import { cn } from "../../lib/utils"
import { Badge } from "../badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../card"
import { formatPlanPrice } from "./price"

export type BillingInterval = "month" | "year"

export interface PricingPlan {
  id: string
  name: string
  monthlyCents: number
  annualCents?: number | null
  currency?: string
  perSeat?: boolean
  contact?: boolean
  mostPopular?: boolean
  description?: string
  features: readonly string[]
}

export interface PlanCardProps {
  plan: PricingPlan
  interval?: BillingInterval
  current?: boolean
  action?: React.ReactNode
  locale?: string
  t?: TFn
  className?: string
}

const PERIOD: Record<BillingInterval, { single: string; seat: string }> = {
  month: { single: "/ month", seat: "per seat / month" },
  year: { single: "/ year", seat: "per seat / year" },
}

function priceFor(plan: PricingPlan, interval: BillingInterval): { cents: number; period: BillingInterval } {
  if (interval === "year" && plan.annualCents != null) return { cents: plan.annualCents, period: "year" }
  return { cents: plan.monthlyCents, period: "month" }
}

export function PlanCard({ plan, interval = "month", current = false, action, locale, t: appT, className }: PlanCardProps) {
  const t = useUiText(appT)
  const { cents, period } = priceFor(plan, interval)
  const badge = current ? t("Current plan") : plan.mostPopular ? t("Most popular") : null

  return (
    <Card
      data-plan={plan.id}
      className={cn("flex h-full flex-col", (current || plan.mostPopular) && "border-foreground/40", className)}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{plan.name}</CardTitle>
          {badge && <Badge variant={current ? "secondary" : "default"}>{badge}</Badge>}
        </div>
        {plan.description && <CardDescription>{plan.description}</CardDescription>}
        <div className="flex items-baseline gap-1.5">
          {plan.contact ? (
            <span className="text-2xl font-semibold">{t("Contact us")}</span>
          ) : cents === 0 ? (
            <span className="text-3xl font-semibold">{t("Free")}</span>
          ) : (
            <>
              <span className="text-3xl font-semibold">{formatPlanPrice(cents, plan.currency, locale)}</span>
              <span className="text-sm text-muted-foreground">
                {t(plan.perSeat ? PERIOD[period].seat : PERIOD[period].single)}
              </span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2 text-sm">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      {action && <CardFooter>{action}</CardFooter>}
    </Card>
  )
}
