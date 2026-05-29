import * as React from "react"
import { Collapsible as RadixCollapsible } from "radix-ui"
import { cn } from "../lib/utils"

const Collapsible = RadixCollapsible.Root

const CollapsibleTrigger = RadixCollapsible.Trigger

function CollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadixCollapsible.Content>) {
  return (
    <RadixCollapsible.Content
      data-slot="collapsible-content"
      className={cn(
        "overflow-hidden transition-all data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down",
        className
      )}
      {...props}
    >
      {children}
    </RadixCollapsible.Content>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
