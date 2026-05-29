import * as React from "react"
import { Checkbox as RadixCheckbox } from "radix-ui"
import { cn } from "../lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof RadixCheckbox.Root>) {
  return (
    <RadixCheckbox.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-foreground/20 bg-transparent shadow-sm",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
        "transition-colors duration-200 cursor-pointer",
        className
      )}
      {...props}
    >
      <RadixCheckbox.Indicator className="flex items-center justify-center text-current">
        <svg
          className="size-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  )
}

export { Checkbox }
