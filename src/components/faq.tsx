"use client"

/**
 * A question list where one answer is open at a time.
 *
 * Every signed-out surface in the org answers the same shape of question — do I need an
 * account, what happens to my data, can it diagnose/advise me — and each had grown its own
 * copy of this markup: maxhealth.tech's membership page and dashboard help tab, and the
 * DICOM viewer's sign-in landing, which had reimplemented it on native `<details>`. One
 * component, so they stay recognisably the same control and a fix to the disclosure
 * behaviour lands in all of them.
 *
 * Items carry an optional `visible` flag rather than being filtered by the caller: a
 * question that only applies to some readers is then declared beside its answer instead of
 * in a separate list that can fall out of step with it.
 */

import * as React from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible"
import { cn } from "../lib/utils"

export interface QandA {
  q: string
  /** The answer. A node rather than a string, so an answer can carry a link out. */
  a: React.ReactNode
  /** Omitted means always shown. `false` drops the question entirely. */
  visible?: boolean
}

export interface FaqProps {
  items: readonly QandA[]
  /** Compact spacing, for a list sitting inside a card rather than on a marketing page. */
  dense?: boolean
  className?: string
}

export function Faq({ items, dense = false, className }: FaqProps) {
  const [open, setOpen] = React.useState<string | null>(null)
  const id = React.useId()
  const shown = items.filter((item) => item.visible !== false)

  if (shown.length === 0) return null

  return (
    <div className={cn("border-t border-foreground/[0.07]", className)}>
      {shown.map((item, index) => {
        const isOpen = open === item.q
        const panelId = `${id}-${String(index)}`
        return (
          <Collapsible
            key={item.q}
            open={isOpen}
            onOpenChange={(next) => { setOpen(next ? item.q : null) }}
            className="border-b border-foreground/[0.07]"
          >
            <CollapsibleTrigger
              aria-expanded={isOpen}
              aria-controls={panelId}
              className={cn(
                "w-full flex items-center justify-between gap-6 text-left group cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
                dense ? "py-3.5" : "py-5"
              )}
            >
              <span
                className={cn(
                  "font-light text-foreground/80 group-hover:text-foreground transition-colors",
                  dense ? "text-sm" : "text-base"
                )}
              >
                {item.q}
              </span>
              {/* A plus that becomes a cross — the same affordance in both states, so nothing
                  jumps when the answer opens. */}
              <svg
                className={cn(
                  "w-4 h-4 shrink-0 text-foreground/40 transition-transform duration-300",
                  isOpen && "rotate-45"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </CollapsibleTrigger>
            <CollapsibleContent id={panelId}>
              <div
                className={cn(
                  "text-foreground/55 leading-relaxed max-w-3xl text-sm pr-10",
                  dense ? "pb-4" : "pb-6"
                )}
              >
                {item.a}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </div>
  )
}
