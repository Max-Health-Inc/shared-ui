import { Download } from "lucide-react"
import { Button } from "./button"
import { usePwaInstall, type UsePwaInstallReturn } from "../hooks/use-pwa-install"
import { cn } from "../lib/utils"

export interface PwaInstallButtonProps {
  /** Button label text (default: "Install App") */
  label?: string
  /** Additional Tailwind classes */
  className?: string
  /** Override the internal hook — useful if the parent needs access to the same state */
  pwa?: UsePwaInstallReturn
}

/**
 * A self-managing PWA install button that only renders when the app
 * is installable and not already installed.
 *
 * Drop it anywhere in your layout:
 * ```tsx
 * <PwaInstallButton label="Install AIHR" />
 * ```
 */
export function PwaInstallButton({ label = "Install App", className, pwa }: PwaInstallButtonProps) {
  const internal = usePwaInstall()
  const { isInstallable, isInstalled, promptInstall } = pwa ?? internal

  if (isInstalled || !isInstallable) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("gap-1.5", className)}
      onClick={() => { void promptInstall() }}
    >
      <Download className="size-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}
