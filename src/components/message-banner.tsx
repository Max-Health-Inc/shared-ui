import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"
import { uiText } from "../lib/ui-text"
import { X } from "lucide-react"

const messageBannerVariants = cva(
  "relative flex items-center justify-between gap-3 rounded-lg border p-4 text-sm",
  {
    variants: {
      variant: {
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        error: "border-destructive/30 bg-destructive/10 text-destructive",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        info: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

interface MessageBannerProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof messageBannerVariants> {
  onClose?: () => void
}

function MessageBanner({
  className,
  variant,
  children,
  onClose,
  ...props
}: MessageBannerProps) {
  return (
    <div
      data-slot="message-banner"
      role="alert"
      className={cn(messageBannerVariants({ variant }), className)}
      {...props}
    >
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-sm p-0.5 opacity-70 hover:opacity-100 transition-opacity"
          aria-label={uiText("Close")}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

export { MessageBanner, messageBannerVariants, type MessageBannerProps }
