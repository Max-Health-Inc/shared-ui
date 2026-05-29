import * as React from "react"
import { Switch as RadixSwitch } from "radix-ui"
import { cn } from "../lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof RadixSwitch.Root>) {
  return (
    <RadixSwitch.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "shadow-sm transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-foreground/10",
        className
      )}
      {...props}
    >
      <RadixSwitch.Thumb
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-white shadow-lg ring-0",
          "transition-transform duration-200",
          "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        )}
      />
    </RadixSwitch.Root>
  )
}

export { Switch }
