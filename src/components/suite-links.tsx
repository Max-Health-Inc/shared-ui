import * as React from "react"
import { cn } from "../lib/utils"

/** One public site of the suite, e.g. an entry of `listSuiteSites()` from @max-health-inc/products. */
interface SuiteSite {
  id: string
  label: string
  url: string
}

interface SuiteLinksProps extends React.ComponentProps<"nav"> {
  sites: readonly SuiteSite[]
  /** The host this page is served from; its own entry is left out. Defaults to the browser's host. */
  currentHost?: string
  /** The row's accessible name. */
  label?: string
}

const hostOf = (url: string): string | null => {
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

const browserHost = (): string | undefined => (typeof window === "undefined" ? undefined : window.location.host)

/**
 * A quiet footer row linking every site of the suite to every other. The links are visible and
 * crawlable on purpose: search engines treat hidden links as spam, and a muted row costs nothing.
 */
function SuiteLinks({ sites, currentHost = browserHost(), label = "Max Health sites", className, ...props }: SuiteLinksProps) {
  const others = sites.filter((site) => hostOf(site.url) !== currentHost)
  if (others.length === 0) return null
  return (
    <nav
      data-slot="suite-links"
      aria-label={label}
      className={cn("flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-foreground/35", className)}
      {...props}
    >
      {others.map((site) => (
        <a key={site.id} href={site.url} className="transition-colors hover:text-foreground/70">
          {site.label}
        </a>
      ))}
    </nav>
  )
}

export { SuiteLinks, type SuiteLinksProps, type SuiteSite }
