"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useUiText, type TFn } from "../lib/ui-text"
import { cn } from "../lib/utils"

export interface SettingsSection {
  id: string
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  visible?: boolean
  content: React.ReactNode | (() => React.ReactNode)
}

export interface SettingsLayoutProps {
  sections: readonly SettingsSection[]
  section?: string | null
  defaultSection?: string | null
  onSectionChange?: (section: string | null) => void
  title?: string
  description?: string
  onBack?: () => void
  backLabel?: string
  t?: TFn
  className?: string
}

const linkClass = "flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"

export function SettingsLayout({
  sections,
  section: controlled,
  defaultSection = null,
  onSectionChange,
  title,
  description,
  onBack,
  backLabel,
  t: appT,
  className,
}: SettingsLayoutProps) {
  const t = useUiText(appT)
  const [uncontrolled, setUncontrolled] = React.useState<string | null>(defaultSection)
  const requested = controlled === undefined ? uncontrolled : controlled
  const shown = sections.filter((s) => s.visible !== false)
  const active = shown.find((s) => s.id === requested) ?? null

  const open = (id: string | null) => {
    if (controlled === undefined) setUncontrolled(id)
    onSectionChange?.(id)
  }

  return (
    <div className={cn("mx-auto w-full max-w-2xl space-y-4", className)}>
      <div className="space-y-1">
        {onBack && (
          <button type="button" onClick={onBack} className={cn(linkClass, "mb-2")}>
            <ChevronLeft className="size-4" aria-hidden />
            {backLabel ?? t("Back")}
          </button>
        )}
        <h1 className="text-xl font-semibold">{title ?? t("Settings")}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      {active === null ? (
        <nav className="space-y-2">
          {shown.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => { open(s.id) }}
              className="flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
            >
              {s.icon && (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <s.icon className="size-4" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{s.title}</span>
                {s.description && <span className="block text-xs text-muted-foreground">{s.description}</span>}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          ))}
        </nav>
      ) : (
        <section aria-labelledby={`settings-${active.id}`} className="space-y-4">
          <button type="button" onClick={() => { open(null) }} className={linkClass}>
            <ChevronLeft className="size-4" aria-hidden />
            {t("All settings")}
          </button>
          <h2 id={`settings-${active.id}`} className="text-base font-semibold">{active.title}</h2>
          {typeof active.content === "function" ? active.content() : active.content}
        </section>
      )}
    </div>
  )
}
