"use client"

import { type TFn } from "../lib/ui-text"
import { cn } from "../lib/utils"
import { CopyButton } from "./copy-button"

export interface CodeBlockProps {
  code: string
  language?: string
  title?: string
  t?: TFn
  className?: string
}

/** A copyable code sample with an optional title or language label. */
export function CodeBlock({ code, language, title, t: appT, className }: CodeBlockProps) {
  return (
    <figure className={cn("overflow-hidden rounded-lg border bg-muted/30", className)}>
      <figcaption className="flex items-center justify-between gap-3 border-b px-3 py-1.5">
        <span className="truncate font-mono text-xs text-muted-foreground">{title ?? language ?? ""}</span>
        <CopyButton value={code} t={appT} className="shrink-0 gap-1 normal-case tracking-normal" />
      </figcaption>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className={language ? `language-${language}` : undefined}>{code}</code>
      </pre>
    </figure>
  )
}
