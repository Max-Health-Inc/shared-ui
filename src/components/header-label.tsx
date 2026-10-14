"use client"

import type { ReactNode } from "react"
import { useHeaderCompact } from "../lib/header-compact"

export function HeaderLabel({ children }: { children: ReactNode }) {
  const compact = useHeaderCompact()
  return <span className={compact ? "sr-only" : "sr-only sm:not-sr-only whitespace-nowrap"}>{children}</span>
}
