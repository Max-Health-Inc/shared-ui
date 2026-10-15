"use client"

import { Check, Copy } from "lucide-react"
import { useCopyToClipboard } from "../hooks/use-copy-to-clipboard"
import { useUiText, type TFn } from "../lib/ui-text"
import { cn } from "../lib/utils"

export interface CodeBlockProps {
  code: string
  language?: string
  title?: string
  t?: TFn
  className?: string
}

/** A copyable code sample with an optional title or language label. */
export function CodeBlock({ code, language, title, t: appT, className }: CodeBlockProps) {
  const t = useUiText(appT)
  const { copied, copy } = useCopyToClipboard()

  return (
    <figure className={cn("overflow-hidden rounded-lg border bg-muted/30", className)}>
      <figcaption className="flex items-center justify-between gap-3 border-b px-3 py-1.5">
        <span className="truncate font-mono text-xs text-muted-foreground">{title ?? language ?? ""}</span>
        <button
          type="button"
          onClick={() => { void copy(code) }}
          className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {copied ? t("Copied") : t("Copy")}
        </button>
      </figcaption>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className={language ? `language-${language}` : undefined}>{code}</code>
      </pre>
    </figure>
  )
}
