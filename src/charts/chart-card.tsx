import * as React from "react"
import { cn } from "../lib/utils"
import { EmptyState } from "../components/empty-state"

export interface ChartCardProps extends Omit<React.ComponentProps<"section">, "title"> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  /** Controls at the header's end, e.g. a series or bucket switch. */
  actions?: React.ReactNode
}

export function ChartCard({ title, subtitle, icon, actions, className, children, ...props }: ChartCardProps) {
  return (
    <section className={cn("border border-foreground/10 bg-card p-4 space-y-3", className)} {...props}>
      <header className="flex items-start gap-3">
        {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
        <div className="min-w-0 flex-1">
          <h3 className="text-xs uppercase tracking-wider text-foreground/60">{title}</h3>
          {subtitle && <p className="text-xs text-foreground/40 mt-0.5">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}

export interface ChartPlotProps {
  hasData: boolean
  emptyTitle: string
  emptyMessage: string
  height?: number
  children: React.ReactNode
}

/** The chart, or an empty state of the same height so the layout does not jump. */
export function ChartPlot({ hasData, emptyTitle, emptyMessage, height = 260, children }: ChartPlotProps) {
  if (hasData) return <>{children}</>
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <EmptyState title={emptyTitle} message={emptyMessage} />
    </div>
  )
}
