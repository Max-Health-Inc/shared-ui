"use client"

import { Info } from "lucide-react"
import { useUiText, type TFn } from "../../lib/ui-text"
import { Button } from "../button"

export interface AboutButtonProps {
  onClick: () => void
  t?: TFn
  className?: string
}

/** The header's icon button that opens the About page. */
export function AboutButton({ onClick, t: appT, className }: AboutButtonProps) {
  const t = useUiText(appT)
  const label = t("About this software")
  return (
    <Button variant="ghost" size="sm" onClick={onClick} title={label} className={className}>
      <Info className="size-4" />
      <span className="sr-only">{label}</span>
    </Button>
  )
}
