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
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

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
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-foreground/10 bg-transparent px-3 py-2 text-sm",
            "focus-visible:outline-none focus-visible:border-foreground/40 focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "cursor-pointer",
            className
          )}
        >
          <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2 border-b border-foreground/10">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value) }}
            placeholder={searchPlaceholder}
            className={cn(
              "flex h-8 w-full bg-foreground/5 rounded-md px-3 py-1 text-sm",
              "border border-foreground/10 placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:border-foreground/30"
            )}
          />
        </div>
        <div className="max-h-48 overflow-y-auto p-1">
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
                  "relative flex w-full items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer",
                  "transition-colors hover:bg-foreground/5",
                  option.value === value && "bg-foreground/5",
                  option.disabled && "pointer-events-none opacity-50"
                )}
              >
                <Check
                  className={cn(
                    "mr-2 size-4",
                    option.value === value ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  )}
                </div>
              </button>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox, type ComboboxProps, type ComboboxOption }
