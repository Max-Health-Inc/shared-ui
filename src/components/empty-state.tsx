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
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground">{icon}</div>
      )}
      <p className="text-sm font-medium text-foreground">{message}</p>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export { EmptyState, type EmptyStateProps }
