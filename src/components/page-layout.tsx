import * as React from "react"
import { cn } from "../lib/utils"

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

/**
 * Standard page-level wrapper providing consistent padding, spacing,
 * and background for admin/app pages rendered inside a Panel or shell.
 *
 * Convention: every top-level page component should wrap its content
 * in `<PageLayout>` instead of manually applying `p-4 sm:p-6 space-y-6 …`.
 */
function PageLayout({ className, children, ...props }: PageLayoutProps) {
  return (
    <div
      className={cn(
        "p-4 sm:p-6 space-y-6 bg-background min-h-full",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { PageLayout }
export type { PageLayoutProps }
