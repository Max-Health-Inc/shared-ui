import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"

const filterTabsVariants = cva("flex gap-1", {
  variants: {
    size: {
      sm: "[&_button]:px-3 [&_button]:py-1.5 [&_button]:text-xs",
      md: "[&_button]:px-4 [&_button]:py-2 [&_button]:text-sm",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

interface FilterOption<T extends string = string> {
  value: T
  label: React.ReactNode
  count?: number
}

interface FilterTabsProps<T extends string = string>
  extends Omit<React.ComponentProps<"div">, "onChange">,
    VariantProps<typeof filterTabsVariants> {
  options: FilterOption<T>[]
  value: T
  onChange: (value: T) => void
}

function FilterTabs<T extends string = string>({
  options,
  value,
  onChange,
  size,
  className,
  ...props
}: FilterTabsProps<T>) {
  return (
    <div
      data-slot="filter-tabs"
      role="tablist"
      className={cn(filterTabsVariants({ size }), className)}
      {...props}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => { onChange(option.value) }}
            className={cn(
              "rounded-md transition-colors duration-200 cursor-pointer",
              isActive
                ? "bg-foreground text-background"
                : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  "ml-1.5",
                  isActive ? "opacity-70" : "opacity-50"
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export { FilterTabs, filterTabsVariants, type FilterTabsProps, type FilterOption }
