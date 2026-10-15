"use client"

import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { Check, Copy } from "lucide-react"
import { useCopyToClipboard } from "../hooks/use-copy-to-clipboard"
import { useUiText, type TFn } from "../lib/ui-text"
import { Button, type buttonVariants } from "./button"

export interface CopyButtonProps
  extends Omit<React.ComponentProps<"button">, "onClick" | "children" | "value">,
    VariantProps<typeof buttonVariants> {
  /** The text put on the clipboard. */
  value: string
  label?: string
  copiedLabel?: string
  /** Show only the icon; the label still names the button for assistive technology. */
  iconOnly?: boolean
  onCopied?: () => void
  onCopyFailed?: () => void
  t?: TFn
}

/** A button that copies `value` and says so for a moment. */
export function CopyButton({
  value,
  label,
  copiedLabel,
  iconOnly = false,
  onCopied,
  onCopyFailed,
  variant = "ghost",
  size = "sm",
  t: appT,
  ...props
}: CopyButtonProps) {
  const t = useUiText(appT)
  const { copied, copy } = useCopyToClipboard()
  const text = copied ? (copiedLabel ?? t("Copied")) : (label ?? t("Copy"))
  const Icon = copied ? Check : Copy
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      aria-label={iconOnly ? text : undefined}
      title={iconOnly ? text : undefined}
      onClick={() => {
        void copy(value).then((ok) => { (ok ? onCopied : onCopyFailed)?.() })
      }}
      {...props}
    >
      <Icon className="size-3.5" aria-hidden />
      {!iconOnly && <span>{text}</span>}
    </Button>
  )
}
