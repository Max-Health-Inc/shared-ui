import { useState, useEffect, useCallback, useRef } from "react"

/** Not in lib.dom.d.ts yet: https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isBeforeInstallPrompt(e: Event): e is BeforeInstallPromptEvent {
  return "prompt" in e && typeof e.prompt === "function" && "userChoice" in e
}

declare global {
  interface Window {
    /** Early-captured install prompt for apps that register a head script. */
    __deferredInstallPrompt?: BeforeInstallPromptEvent | null
  }
}

export interface UsePwaInstallReturn {
  /** Whether the browser considers this app installable right now */
  isInstallable: boolean
  /** Whether the app is already running in standalone/installed mode */
  isInstalled: boolean
  /** Trigger the native install prompt. Returns true if user accepted. */
  promptInstall: () => Promise<boolean>
}

/** `<head>` script that captures `beforeinstallprompt` if it fires before the hook mounts. */
export const PWA_INSTALL_CAPTURE_SCRIPT = `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__deferredInstallPrompt=e;});`

/** Native PWA install prompt, including an event captured early by {@link PWA_INSTALL_CAPTURE_SCRIPT}. */
export function usePwaInstall(): UsePwaInstallReturn {
  // Seeded here, not in the mount effect, so the first render is already right.
  const [isInstallable, setIsInstallable] = useState(
    () => typeof window !== "undefined" && window.__deferredInstallPrompt != null,
  )
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  const isInstalled =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && navigator.standalone === true))

  useEffect(() => {
    if (window.__deferredInstallPrompt) {
      deferredPrompt.current = window.__deferredInstallPrompt
      window.__deferredInstallPrompt = null
    }

    const handler = (e: Event) => {
      if (!isBeforeInstallPrompt(e)) return
      e.preventDefault()
      deferredPrompt.current = e
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
