"use client"

import * as React from "react"
import { cn, FIELD_TEXT } from "../lib/utils"
import { ChevronsUpDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { useUiText, type TFn } from "../lib/ui-text"

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
  /** Called with the search text as it is typed, for options the caller loads to match it. */
  onSearchChange?: (search: string) => void
  /** False shows `options` as given, for a caller that already filtered them by the search. */
  filter?: boolean
  disabled?: boolean
  className?: string
  /** Visual variant. "default" follows the app theme; "dark" is for dark overlay contexts (e.g. 3D toolbars). */
  variant?: "default" | "dark"
  /** The app's translate function; omit it and this package's own catalogue is used. */
  t?: TFn
}

function Combobox({
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  onChange,
  onSearchChange,
  filter = true,
  disabled = false,
  className,
  variant = "default",
  t: appT,
}: ComboboxProps) {
  const t = useUiText(appT)
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const isDark = variant === "dark"

  const changeSearch = (next: string) => {
    setSearch(next)
    onSearchChange?.(next)
  }

  const filteredOptions = filter && search.length > 0
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(search.toLowerCase()) ||
          opt.description?.toLowerCase().includes(search.toLowerCase())
      )
    : options

  const selectedOption = options.find((opt) => opt.value === value)

  const focusSearchOnFinePointer = (event: Event) => {
    event.preventDefault()
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus()
  }

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
            {selectedOption?.label ?? placeholder ?? t("Select...")}
          </span>
          <ChevronsUpDown className={cn("size-4 shrink-0", isDark ? "opacity-60" : "opacity-50")} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[var(--radix-popover-trigger-width)] min-w-56 p-0 shadow-lg",
          isDark ? "bg-gray-900 border-white/15" : "border-foreground/20"
        )}
        side="bottom"
        align="start"
        avoidCollisions={false}
        onOpenAutoFocus={focusSearchOnFinePointer}
      >
        <div className={cn("p-2 border-b", isDark ? "border-white/10" : "border-foreground/10")}>
          <input
            ref={inputRef}
            type="text"
            enterKeyHint="search"
            value={search}
            onChange={(e) => { changeSearch(e.target.value) }}
            placeholder={searchPlaceholder ?? t("Search...")}
            className={cn(
              "flex h-9 w-full rounded-md px-3 py-1 md:h-8",
              FIELD_TEXT,
              "focus-visible:outline-none",
              isDark
                ? "bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus-visible:border-white/30"
                : "bg-foreground/5 border border-foreground/10 placeholder:text-muted-foreground focus-visible:border-foreground/30"
            )}
          />
        </div>
        <div className={cn(
          "max-h-[max(8rem,min(14rem,calc(var(--radix-popover-content-available-height)-4rem)))] overflow-y-auto overscroll-contain p-1",
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
                  changeSearch("")
                }}
                className={cn(
                  "relative flex w-full items-start rounded-sm px-2 py-2.5 text-sm text-left cursor-pointer transition-colors md:py-1.5",
                  isDark
                    ? cn("text-white/80 hover:bg-white/10", option.value === value && "bg-white/15 text-white")
                    : cn("hover:bg-foreground/5", option.value === value && "bg-primary/10 text-primary"),
                  option.disabled && "pointer-events-none opacity-50"
                )}
              >
                <div className="flex flex-col min-w-0 items-start">
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
              {emptyMessage ?? t("No results found")}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox, type ComboboxProps, type ComboboxOption }
