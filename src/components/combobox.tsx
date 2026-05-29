"use client"

import * as React from "react"
import { cn } from "../lib/utils"
import { ChevronsUpDown, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

interface ComboboxOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface ComboboxProps {
  value?: string
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
  /** Visual variant. "default" follows the app theme; "dark" is for dark overlay contexts (e.g. 3D toolbars). */
  variant?: "default" | "dark"
}

function Combobox({
  value,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
  onChange,
  disabled = false,
  className,
  variant = "default",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const isDark = variant === "dark"

  const filteredOptions = search.length > 0
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(search.toLowerCase()) ||
          opt.description?.toLowerCase().includes(search.toLowerCase())
      )
    : options

  const selectedOption = options.find((opt) => opt.value === value)

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm text-left",
            "focus-visible:outline-none focus-visible:ring-[3px]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "cursor-pointer",
            isDark
              ? "border-white/20 bg-white/10 text-white/90 focus-visible:border-white/40 focus-visible:ring-white/20"
              : "border-foreground/10 bg-transparent text-foreground focus-visible:border-foreground/40 focus-visible:ring-ring/50",
            className
          )}
        >
          <span className={cn(
            "truncate flex-1",
            selectedOption
              ? isDark ? "text-white/90" : "text-foreground"
              : isDark ? "text-white/50" : "text-muted-foreground"
          )}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronsUpDown className={cn("size-4 shrink-0", isDark ? "opacity-60" : "opacity-50")} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[var(--radix-popover-trigger-width)] min-w-56 p-0",
          isDark && "bg-gray-900 border-white/15"
        )}
        align="start"
      >
        <div className={cn("p-2 border-b", isDark ? "border-white/10" : "border-foreground/10")}>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value) }}
            placeholder={searchPlaceholder}
            className={cn(
              "flex h-8 w-full rounded-md px-3 py-1 text-sm",
              "focus-visible:outline-none",
              isDark
                ? "bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus-visible:border-white/30"
                : "bg-foreground/5 border border-foreground/10 placeholder:text-muted-foreground focus-visible:border-foreground/30"
            )}
          />
        </div>
        <div className={cn(
          "max-h-56 overflow-y-auto p-1",
          isDark
            ? "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full"
            : "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-foreground/15 [&::-webkit-scrollbar-thumb]:rounded-full"
        )}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                disabled={option.disabled}
                onClick={() => {
                  if (onChange) onChange(option.value)
                  setOpen(false)
                  setSearch("")
                }}
                className={cn(
                  "relative flex w-full items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer transition-colors",
                  isDark
                    ? cn("text-white/80 hover:bg-white/10", option.value === value && "bg-white/10")
                    : cn("hover:bg-foreground/5", option.value === value && "bg-foreground/5"),
                  option.disabled && "pointer-events-none opacity-50"
                )}
              >
                <Check
                  className={cn(
                    "mr-2 size-4 shrink-0",
                    option.value === value ? "opacity-100" : "opacity-0",
                    isDark && "text-white/70"
                  )}
                />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{option.label}</span>
                  {option.description && (
                    <span className={cn(
                      "text-xs truncate",
                      isDark ? "text-white/40" : "text-muted-foreground"
                    )}>{option.description}</span>
                  )}
                </div>
              </button>
            ))
          ) : (
            <p className={cn(
              "py-4 text-center text-sm",
              isDark ? "text-white/40" : "text-muted-foreground"
            )}>
              {emptyMessage}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox, type ComboboxProps, type ComboboxOption }
