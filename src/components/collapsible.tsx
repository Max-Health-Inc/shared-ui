"use client"

import * as React from "react"
import { cn } from "../lib/utils"

interface CollapsibleProps extends React.ComponentProps<"div"> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const CollapsibleContext = React.createContext<{ open: boolean; toggle: () => void }>({
  open: false,
  toggle: () => {},
})

function Collapsible({ open, onOpenChange, children, className, ...props }: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(open ?? false)
  const isOpen = open ?? internalOpen

  const toggle = React.useCallback(() => {
    const next = !isOpen
    setInternalOpen(next)
    onOpenChange?.(next)
  }, [isOpen, onOpenChange])

  return (
    <CollapsibleContext.Provider value={{ open: isOpen, toggle }}>
      <div data-slot="collapsible" className={className} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

function CollapsibleTrigger({ children, className, ...props }: React.ComponentProps<"button">) {
  const { toggle } = React.useContext(CollapsibleContext)
  return (
    <button
      type="button"
      data-slot="collapsible-trigger"
      onClick={toggle}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}

function CollapsibleContent({ className, children, ...props }: React.ComponentProps<"div">) {
  const { open } = React.useContext(CollapsibleContext)
  return (
    <div
      data-slot="collapsible-content"
      data-state={open ? "open" : "closed"}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className
      )}
      {...props}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
