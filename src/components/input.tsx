import * as React from "react"
import { cn } from "../lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full bg-transparent px-3 py-2 text-sm transition-colors duration-200",
        "border border-foreground/20 text-foreground placeholder:text-foreground/30",
        "focus:outline-none focus:border-foreground/50",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "file:text-foreground file:inline-flex file:border-0 file:bg-transparent file:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
