import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-medium uppercase tracking-wider transition-colors duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-1",
  {
    variants: {
      variant: {
        default:
          "border border-foreground/20 hover:bg-foreground hover:text-background",
        destructive:
          "border border-red-400/30 text-red-400/70 hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/50 focus-visible:ring-red-400/50",
        outline:
          "border border-foreground/20 hover:bg-foreground/10",
        secondary:
          "border border-foreground/20 hover:bg-foreground/10",
        ghost:
          "text-foreground/50 hover:text-foreground hover:bg-foreground/5",
        link: "text-foreground/70 underline-offset-4 hover:underline hover:text-foreground normal-case tracking-normal",
        success:
          "border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400/50 focus-visible:ring-emerald-400/50",
      },
      size: {
        default: "px-4 py-2 has-[>svg]:px-3",
        sm: "px-3 py-1.5 text-[11px] has-[>svg]:px-2.5",
        lg: "px-6 py-3 text-sm has-[>svg]:px-4",
        icon: "p-2",
        "icon-sm": "p-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
