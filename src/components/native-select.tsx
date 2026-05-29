"use client"

import * as React from "react"
import { cn } from "../lib/utils"

type NativeSelectSize = "sm" | "md" | "lg"
type NativeSelectVariant = "default" | "filled" | "light"

interface NativeSelectProps
  extends Omit<React.ComponentProps<"select">, "size"> {
  selectSize?: NativeSelectSize
  variant?: NativeSelectVariant
  error?: boolean
}

const sizes: Record<NativeSelectSize, string> = {
  sm: "pl-3 pr-9 py-1.5 text-xs",
  md: "pl-3 pr-9 py-2 text-sm",
  lg: "pl-4 pr-11 py-3 text-sm",
}

const iconSizes: Record<NativeSelectSize, string> = {
  sm: "right-3 w-3 h-3",
  md: "right-3 w-4 h-4",
  lg: "right-4 w-4 h-4",
}

const variants: Record<
  NativeSelectVariant,
  { base: string; normal: string; error: string; colorScheme: string }
> = {
  default: {
    base: "w-full appearance-none bg-background text-foreground border rounded-lg focus:outline-none transition-colors cursor-pointer [&>option]:bg-background [&>option]:text-foreground",
    normal: "border-foreground/20 focus:border-foreground/50",
    error: "border-red-400/50 focus:border-red-400",
    colorScheme: "",
  },
  filled: {
    base: "w-full appearance-none bg-foreground/5 border rounded-lg text-foreground focus:outline-none transition-colors cursor-pointer [&>option]:bg-background [&>option]:text-foreground",
    normal: "border-foreground/10 focus:border-foreground/30",
    error: "border-red-400/50 focus:border-red-400",
    colorScheme: "",
  },
  light: {
    base: "w-full appearance-none bg-white text-gray-900 border rounded-lg focus:outline-none focus:ring-2 transition-colors cursor-pointer [&>option]:bg-white [&>option]:text-gray-900",
    normal: "border-gray-300 focus:border-gray-400 focus:ring-gray-200",
    error: "border-red-400 focus:border-red-500 focus:ring-red-200",
    colorScheme: "light",
  },
}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    { selectSize = "md", variant = "default", error = false, className, style, children, ...props },
    ref
  ) => {
    const v = variants[variant]
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          aria-invalid={error || undefined}
          className={cn(
            v.base,
            sizes[selectSize],
            error ? v.error : v.normal,
            className
          )}
          style={{
            ...(v.colorScheme ? { colorScheme: v.colorScheme } : {}),
            ...style,
          }}
          {...props}
        >
          {children}
        </select>
        <svg
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 text-foreground/50",
            iconSizes[selectSize]
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    )
  }
)

NativeSelect.displayName = "NativeSelect"

export { NativeSelect, type NativeSelectProps }
