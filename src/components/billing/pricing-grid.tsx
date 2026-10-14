"use client"

import * as React from "react"
import { useUiText, type TFn } from "../../lib/ui-text"
import { cn } from "../../lib/utils"
import { PlanCard, type BillingInterval, type PricingPlan } from "./plan-card"

export interface PricingGridProps {
  plans: readonly PricingPlan[]
  currentPlanId?: string | null
  renderAction?: (plan: PricingPlan, context: { current: boolean; interval: BillingInterval }) => React.ReactNode
  interval?: BillingInterval
  onIntervalChange?: (interval: BillingInterval) => void
  locale?: string
  t?: TFn
  className?: string
}

const COLUMNS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
}

export function PricingGrid({
  plans,
  currentPlanId,
  renderAction,
  interval = "month",
  onIntervalChange,
  locale,
  t: appT,
  className,
}: PricingGridProps) {
  const t = useUiText(appT)
  const sellsAnnually = plans.some((plan) => plan.annualCents != null)
  const intervals: BillingInterval[] = ["month", "year"]

  return (
    <div className={cn("space-y-6", className)}>
      {onIntervalChange && sellsAnnually && (
        <div role="group" aria-label={t("Billing period")} className="mx-auto flex w-fit rounded-md border p-1">
          {intervals.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={interval === value}
              onClick={() => { onIntervalChange(value) }}
              className={cn(
                "rounded px-3 py-1 text-sm transition-colors",
                interval === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(value === "month" ? "Monthly" : "Yearly")}
            </button>
          ))}
        </div>
      )}
      <div className={cn("grid gap-4", COLUMNS[Math.min(plans.length, 4)] ?? COLUMNS[4])}>
        {plans.map((plan) => {
          const current = plan.id === currentPlanId
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              interval={interval}
              current={current}
              action={renderAction?.(plan, { current, interval })}
              locale={locale}
              t={appT}
            />
          )
        })}
      </div>
    </div>
  )
}
