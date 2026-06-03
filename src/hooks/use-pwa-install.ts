import { useState, useEffect, useCallback, useRef } from "react"

/**
 * The `beforeinstallprompt` event — not in lib.dom.d.ts yet.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export interface UsePwaInstallReturn {
  /** Whether the browser considers this app installable right now */
  isInstallable: boolean
  /** Whether the app is already running in standalone/installed mode */
  isInstalled: boolean
  /** Trigger the native install prompt. Returns true if user accepted. */
  promptInstall: () => Promise<boolean>
}

/**
 * React hook that captures the browser's `beforeinstallprompt` event and
 * exposes a controlled API for triggering the native PWA install dialog.
 *
 * Usage:
 * ```tsx
 * const { isInstallable, isInstalled, promptInstall } = usePwaInstall()
 * if (isInstallable && !isInstalled) {
 *   return <button onClick={promptInstall}>Install</button>
 * }
 * ```
 */
export function usePwaInstall(): UsePwaInstallReturn {
  const [isInstallable, setIsInstallable] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  const isInstalled =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setIsInstallable(true)
    }
    window.addEventListener("beforeinstallprompt", handler)

    const installed = () => {
      setIsInstallable(false)
      deferredPrompt.current = null
    }
    window.addEventListener("appinstalled", installed)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", installed)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt.current) return false
    void deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    deferredPrompt.current = null
    setIsInstallable(false)
    return outcome === "accepted"
  }, [])

  return { isInstallable, isInstalled, promptInstall }
}
