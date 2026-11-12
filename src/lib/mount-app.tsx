import { StrictMode, type ReactNode } from "react"
import { createRoot, type Root } from "react-dom/client"
import { ErrorBoundary } from "../components/error-boundary"
import { TooltipProvider } from "../components/tooltip"

export interface MountAppOptions {
  /** Id of the element the app renders into. Default: "root" */
  rootId?: string
  /** Tooltip open delay in ms, passed to TooltipProvider. */
  tooltipDelay?: number
}

/** Renders an app into its root element inside StrictMode, an ErrorBoundary and a TooltipProvider. */
export function mountApp(app: ReactNode, { rootId = "root", tooltipDelay }: MountAppOptions = {}): Root {
  const element = document.getElementById(rootId)
  if (!element) throw new Error(`index.html has no #${rootId}`)
  const root = createRoot(element)
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <TooltipProvider delayDuration={tooltipDelay}>{app}</TooltipProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
  return root
}
