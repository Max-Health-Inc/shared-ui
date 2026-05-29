import * as React from "react"
import { cn } from "../lib/utils"

interface SectionHeaderProps extends Omit<React.ComponentProps<"div">, "title"> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "text-base font-medium",
  md: "text-lg font-medium",
  lg: "text-xl font-medium",
}

function SectionHeader({
  title,
  subtitle,
  actions,
  size = "lg",
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      data-slot="section-header"
      className={cn("flex items-center justify-between", className)}
      {...props}
    >
      <div>
        <h2 className={sizeClasses[size]}>{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  )
}

export { SectionHeader, type SectionHeaderProps }
