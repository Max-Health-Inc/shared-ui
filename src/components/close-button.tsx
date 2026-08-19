import * as React from "react"
import { cn } from "../lib/utils"
import { uiText } from "../lib/ui-text"
import { X } from "lucide-react"

interface CloseButtonProps extends React.ComponentProps<"button"> {
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "size-6 [&_svg]:size-3",
  md: "size-7 [&_svg]:size-4",
  lg: "size-8 [&_svg]:size-5",
}

function CloseButton({ size = "sm", className, ...props }: CloseButtonProps) {
  return (
    <button
      type="button"
      data-slot="close-button"
      aria-label={uiText("Close")}
      className={cn(
        "inline-flex items-center justify-center rounded-sm transition-colors",
        "hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "text-foreground/50 hover:text-foreground cursor-pointer",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <X />
    </button>
  )
}

export { CloseButton, type CloseButtonProps }
