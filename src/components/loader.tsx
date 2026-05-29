import * as React from "react"
import { cn } from "../lib/utils"

interface LoaderProps extends React.ComponentProps<"div"> {
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "size-4 border",
  md: "size-6 border-2",
  lg: "size-8 border-2",
}

function Loader({ size = "md", className, ...props }: LoaderProps) {
  return (
    <div
      data-slot="loader"
      className={cn(
        "border-foreground/30 border-t-foreground rounded-full animate-spin",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
}

interface LoaderOverlayProps extends React.ComponentProps<"div"> {
  loading?: boolean
  size?: "sm" | "md" | "lg"
  blur?: "none" | "sm" | "md"
}

const blurClasses = {
  none: "",
  sm: "backdrop-blur-[2px]",
  md: "backdrop-blur-sm",
}

function LoaderOverlay({
  loading = false,
  size = "md",
  blur = "sm",
  children,
  className,
  ...props
}: LoaderOverlayProps) {
  return (
    <div className={cn("relative", className)} {...props}>
      {loading && (
        <div
          className={cn(
            "absolute inset-0 bg-background/30 z-10 flex items-center justify-center",
            blurClasses[blur]
          )}
        >
          <Loader size={size} />
        </div>
      )}
      {children}
    </div>
  )
}

export { Loader, LoaderOverlay }
