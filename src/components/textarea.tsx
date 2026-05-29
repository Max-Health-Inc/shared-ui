import * as React from "react"
import { cn } from "../lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-[60px] w-full bg-transparent px-3 py-2 text-sm transition-colors duration-200 resize-none",
        "border border-foreground/20 text-foreground placeholder:text-foreground/30",
        "focus:outline-none focus:border-foreground/50",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
