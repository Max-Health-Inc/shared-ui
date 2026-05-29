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
  sm: "pl-3 pr-8 py-1.5 text-xs",
  md: "pl-3 pr-8 py-2 text-sm",
  lg: "pl-4 pr-10 py-3 text-sm",
}

const variants: Record<
  NativeSelectVariant,
  { base: string; normal: string; error: string; colorScheme: string }
> = {
  default: {
    base: "w-full bg-background text-foreground border rounded-lg focus:outline-none transition-colors cursor-pointer [&>option]:bg-background [&>option]:text-foreground",
    normal: "border-foreground/20 focus:border-foreground/50",
    error: "border-red-400/50 focus:border-red-400",
    colorScheme: "",
  },
  filled: {
    base: "w-full bg-foreground/5 border rounded-lg text-foreground focus:outline-none transition-colors cursor-pointer [&>option]:bg-background [&>option]:text-foreground",
    normal: "border-foreground/10 focus:border-foreground/30",
    error: "border-red-400/50 focus:border-red-400",
    colorScheme: "",
  },
  light: {
    base: "w-full bg-white text-gray-900 border rounded-lg focus:outline-none focus:ring-2 transition-colors cursor-pointer [&>option]:bg-white [&>option]:text-gray-900",
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
    )
  }
)

NativeSelect.displayName = "NativeSelect"

export { NativeSelect, type NativeSelectProps }
