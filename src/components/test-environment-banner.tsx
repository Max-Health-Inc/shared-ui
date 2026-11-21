import { TriangleAlert } from "lucide-react"
import { configuredDeploymentStage, isTestStage } from "../lib/smart-app-config"
import { useUiText, type TFn } from "../lib/ui-text"
import { cn } from "../lib/utils"

export interface TestEnvironmentBannerProps {
  /** The deployment stage; renders only for a test stage (`beta`). Defaults to the configured `VITE_RELEASE_CHANNEL`. */
  stage?: string
  /** Tailwind max-width class for the inner row, matching the header below it (default: "max-w-5xl"). */
  maxWidth?: string
  className?: string
  /** The app's translate function; omit it and this package's own catalogue is used. */
  t?: TFn
}

/** A slim, non-dismissible notice that this deployment is a test server and must not receive real patient data. */
export function TestEnvironmentBanner({ stage = configuredDeploymentStage(), maxWidth = "max-w-5xl", className, t: appT }: TestEnvironmentBannerProps) {
  const t = useUiText(appT)
  if (!isTestStage(stage)) return null

  return (
    <div role="status" data-slot="test-environment-banner" className={cn("bg-warning text-warning-foreground", className)}>
      <p className={cn(maxWidth, "mx-auto flex items-start gap-2 px-3 sm:px-4 py-1.5 text-xs leading-snug sm:items-center sm:justify-center sm:text-sm")}>
        <TriangleAlert className="size-4 shrink-0" aria-hidden />
        <span>
          <strong className="font-semibold">{t("Test server")}</strong>{" "}
          {t("This is a test environment. Do not enter or share real patient data or other sensitive information.")}
        </span>
      </p>
    </div>
  )
}
