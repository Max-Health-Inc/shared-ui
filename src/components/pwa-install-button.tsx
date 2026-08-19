import { Download } from "lucide-react"
import { Button } from "./button"
import { usePwaInstall, type UsePwaInstallReturn } from "../hooks/use-pwa-install"
import { cn } from "../lib/utils"
import { useUiText, type TFn } from "../lib/ui-text"

export interface PwaInstallButtonProps {
  /** Button label text (default: a translated "Install App") */
  label?: string
  /** Additional Tailwind classes */
  className?: string
  /** Override the internal hook — useful if the parent needs access to the same state */
  pwa?: UsePwaInstallReturn
  /** The app's translate function; omit it and this package's own catalogue is used. */
  t?: TFn
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
export function PwaInstallButton({ label, className, pwa, t: appT }: PwaInstallButtonProps) {
  const t = useUiText(appT)
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
      <span className="hidden sm:inline">{label ?? t("Install App")}</span>
    </Button>
  )
}
