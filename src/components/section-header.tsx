"use client"

import * as React from "react"
import { cn } from "../lib/utils"
import { ChevronRight } from "lucide-react"

interface SectionHeaderProps extends Omit<React.ComponentProps<"div">, "title"> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  size?: "sm" | "md" | "lg"
  children?: React.ReactNode
  /** Make section collapsible (auto-enabled when children are present) */
  collapsible?: boolean
  /** Initial collapsed state */
  defaultCollapsed?: boolean
  /** Controlled collapsed state */
  collapsed?: boolean
  /** Callback when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void
}

const sizeClasses = {
  sm: "text-base font-light",
  md: "text-lg font-light",
  lg: "text-xl font-light",
}

function SectionHeader({
  title,
  subtitle,
  actions,
  size = "lg",
  className,
  children,
  collapsible,
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  ...props
}: SectionHeaderProps) {
  const isCollapsible = collapsible ?? !!children
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed)
  const isCollapsed = controlledCollapsed ?? internalCollapsed

  const handleToggle = () => {
    if (!isCollapsible) return
    const next = !isCollapsed
    setInternalCollapsed(next)
    onCollapsedChange?.(next)
  }

  return (
    <div data-slot="section-header" {...props}>
      <div
        className={cn(
          "flex items-center justify-between",
          isCollapsible && "cursor-pointer select-none",
          className
        )}
        onClick={isCollapsible ? handleToggle : undefined}
      >
        <div className="flex items-center gap-2">
          {isCollapsible && (
            <ChevronRight
              className={cn(
                "size-4 text-foreground/40 transition-transform duration-200",
                !isCollapsed && "rotate-90"
              )}
            />
          )}
          <div>
            <h2 className={sizeClasses[size]}>{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-foreground/50">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      {children && (
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
            isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
          )}
        >
          <div className="overflow-hidden">{children}</div>
        </div>
      )}
    </div>
  )
}

export { SectionHeader, type SectionHeaderProps }
