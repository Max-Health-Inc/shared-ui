"use client"

import { ChevronDown, History } from "lucide-react"
import { useUiText, type TFn } from "../../lib/ui-text"
import { formatDate } from "../../lib/datetime"
import { cn } from "../../lib/utils"
import { Badge } from "../badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../collapsible"

export type ChangeKind = "feature" | "fix" | "performance"

export interface ChangelogEntry {
  kind: ChangeKind
  text: string
  breaking: boolean
}

/** Structurally the release `@max-health-inc/config/vite/release` injects as `__APP_CHANGELOG__`. */
export interface ChangelogRelease {
  version: string
  date: string | null
  unreleased: boolean
  entries: readonly ChangelogEntry[]
}

export interface ChangelogSectionProps {
  releases: readonly ChangelogRelease[]
  t?: TFn
  className?: string
}

function kindLabel(kind: ChangeKind, t: TFn): string {
  if (kind === "feature") return t("New")
  if (kind === "fix") return t("Fixed")
  return t("Faster")
}

function Release({ release, t }: { release: ChangelogRelease; t: TFn }) {
  return (
    <li className="space-y-1.5" data-release={release.version}>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-sm font-medium">
          {release.unreleased ? t("Coming in {{version}}", { version: release.version }) : `v${release.version}`}
        </span>
        {release.date && <span className="text-xs text-muted-foreground">{formatDate(release.date)}</span>}
      </div>
      {release.entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("First versioned release.")}</p>
      ) : (
        <ul className="space-y-1">
          {release.entries.map((entry) => (
            <li key={`${entry.kind}:${entry.text}`} className="flex items-start gap-2 text-sm">
              <Badge variant={entry.kind === "fix" ? "outline" : "secondary"} className="mt-0.5 shrink-0 text-[10px]">
                {kindLabel(entry.kind, t)}
              </Badge>
              <span>
                {entry.text}
                {entry.breaking && <Badge variant="destructive" className="ml-1.5 text-[10px]">{t("Breaking")}</Badge>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

/** What changed in each release, collapsed; renders nothing without releases. */
export function ChangelogSection({ releases, t: appT, className }: ChangelogSectionProps) {
  const t = useUiText(appT)
  if (releases.length === 0) return null
  return (
    <Collapsible className={cn("rounded-lg border", className)}>
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium">
        <span className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          {t("Changelog")}
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 border-t px-4 py-3">
          <ol className="space-y-4">
            {releases.map((release) => (
              <Release key={release.version} release={release} t={t} />
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">{t("Changes are listed in English, as they are recorded.")}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
