import * as React from "react"
import { cn } from "../lib/utils"

interface EmptyStateProps extends React.ComponentProps<"div"> {
  message: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

function EmptyState({
  message,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "text-center py-12 text-foreground/50",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="flex justify-center mb-4">{icon}</div>
      )}
      <p className="text-foreground/70">{message}</p>
      {description && (
        <p className="text-sm mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export { EmptyState, type EmptyStateProps }
