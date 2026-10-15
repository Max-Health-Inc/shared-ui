"use client"

import * as React from "react"
import { useUiText, type TFn } from "../lib/ui-text"
import { cn } from "../lib/utils"

export interface SidebarItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  href?: string
  external?: boolean
  badge?: React.ReactNode
  visible?: boolean
}

export interface SidebarGroup {
  label?: string
  items: readonly SidebarItem[]
}

export interface SidebarLayoutProps {
  groups: readonly SidebarGroup[]
  active?: string
  onNavigate?: (id: string) => void
  header?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  maxWidth?: string
  t?: TFn
  className?: string
}

const itemClass = "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors"

function isPlainClick(event: React.MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

function SidebarLink({ item, active, onNavigate }: { item: SidebarItem; active: boolean; onNavigate?: (id: string) => void }) {
  const Icon = item.icon
  const className = cn(
    itemClass,
    active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
  )
  const body = (
    <>
      {Icon && <Icon className="size-4 shrink-0" />}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge}
    </>
  )
  if (item.href && item.external) {
    return <a href={item.href} target="_blank" rel="noreferrer" className={className}>{body}</a>
  }
  if (item.href) {
    return (
      <a
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={className}
        onClick={(event) => {
          if (!onNavigate || !isPlainClick(event)) return
          event.preventDefault()
          onNavigate(item.id)
        }}
      >
        {body}
      </a>
    )
  }
  return (
    <button type="button" aria-current={active ? "page" : undefined} className={className} onClick={() => onNavigate?.(item.id)}>
      {body}
    </button>
  )
}

/** An app's section navigation: a sticky sidebar from md up, a scrollable strip above the content on phones. */
export function SidebarLayout({ groups, active, onNavigate, header, footer, children, maxWidth = "max-w-6xl", t: appT, className }: SidebarLayoutProps) {
  const t = useUiText(appT)
  const shown = groups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.visible !== false) }))
    .filter((group) => group.items.length > 0)
  return (
    <div className={cn("mx-auto flex w-full flex-col gap-6 px-4 py-6 md:flex-row md:gap-10 md:px-6 md:py-10", maxWidth, className)}>
      <aside className="space-y-4 md:sticky md:top-20 md:w-56 md:shrink-0 md:self-start">
        {header}
        <nav aria-label={t("Sections")} className="scrollbar-hide -mx-1 flex gap-1 overflow-x-auto px-1 md:mx-0 md:flex-col md:gap-5 md:overflow-visible md:px-0">
          {shown.map((group, index) => (
            <div key={group.label ?? index} className="flex gap-1 md:flex-col md:gap-0.5">
              {group.label && <p className="hidden px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70 md:block">{group.label}</p>}
              {group.items.map((item) => <SidebarLink key={item.id} item={item} active={item.id === active} onNavigate={onNavigate} />)}
            </div>
          ))}
        </nav>
        {footer && <div className="hidden md:block">{footer}</div>}
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
