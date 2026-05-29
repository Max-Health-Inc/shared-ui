import * as React from "react"
import { cn } from "../lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[60px] w-full bg-transparent px-3 py-2 text-sm font-light transition-colors duration-300 resize-none",
        "border border-foreground/10 text-foreground placeholder:text-foreground/30",
        "focus-visible:outline-none focus-visible:border-foreground/40 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
