import type { ComponentProps, MouseEvent, ReactNode } from "react"
import { Button } from "./button"
import { Spinner } from "./spinner"
import { cn } from "../lib/utils"

export interface PendingButtonProps extends Omit<ComponentProps<typeof Button>, "asChild" | "children" | "onClick"> {
  pending: boolean
  pendingLabel: ReactNode
  children: ReactNode
  /** Renders a link; `onClick` then runs only for a plain click that navigates this tab. */
  href?: string
  onClick?: (event: MouseEvent<HTMLElement>) => void
}

const STACKED = "col-start-1 row-start-1 inline-flex items-center justify-center gap-2"

function navigatesThisTab(event: MouseEvent<HTMLElement>): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

/** A button that swaps its label for a spinner while `pending`, keeping its width. */
export function PendingButton({ pending, pendingLabel, children, href, disabled = false, onClick, className, ...props }: PendingButtonProps) {
  const content = (
    <span className="grid">
      <span className={cn(STACKED, pending && "invisible")}>{children}</span>
      <span className={cn(STACKED, !pending && "invisible")}>
        <Spinner size="sm" className="border-current/30 border-t-current" aria-hidden />
        {pendingLabel}
      </span>
    </span>
  )
  const classes = cn(
    href !== undefined && "aria-disabled:pointer-events-none aria-disabled:opacity-50",
    pending && "disabled:opacity-100 aria-disabled:opacity-100",
    className,
  )

  if (href !== undefined) {
    const inert = disabled || pending
    const follow = (event: MouseEvent<HTMLElement>) => {
      if (inert) event.preventDefault()
      else if (navigatesThisTab(event)) onClick?.(event)
    }
    return (
      <Button {...props} asChild aria-busy={pending || undefined} className={classes}>
        <a href={href} aria-disabled={inert || undefined} onClick={follow}>{content}</a>
      </Button>
    )
  }

  return (
    <Button {...props} disabled={disabled || pending} aria-busy={pending || undefined} onClick={onClick} className={classes}>
      {content}
    </Button>
  )
}
