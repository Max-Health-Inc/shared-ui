"use client"

import * as React from "react"

export interface CopyToClipboard {
  copied: boolean
  copy: (text: string) => Promise<boolean>
}

/** Copy text to the clipboard; `copied` is true for `resetMs` after a copy succeeded. */
export function useCopyToClipboard(resetMs = 2000): CopyToClipboard {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => { setCopied(false) }, resetMs)
    return () => { clearTimeout(timer) }
  }, [copied, resetMs])

  const copy = React.useCallback(async (text: string) => {
    if (typeof navigator === "undefined" || !("clipboard" in navigator)) return false
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      return true
    } catch {
      return false
    }
  }, [])

  return { copied, copy }
}
