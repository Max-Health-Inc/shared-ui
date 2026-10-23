import type { ReactNode } from "react"
import { Separator } from "./separator"
import { cn } from "../lib/utils"

export interface LegalSection {
  /** Anchor id the table of contents links to. */
  id: string
  heading: string
  body: ReactNode
}

export interface LegalDocumentProps {
  title: string
  /** The effective-date line, worded (and translated) by the app. */
  effective: ReactNode
  intro: ReactNode
  sections: readonly LegalSection[]
  back?: { href: string; label: ReactNode }
  /** Shown above the intro, e.g. which language version of a translated document governs. */
  notice?: ReactNode
  /** The closing line naming the service the document covers. */
  footer?: ReactNode
  /** Accessible name of the table of contents. */
  contentsLabel?: string
  className?: string
}

/** A Privacy Policy or Terms of Service: title, effective date, jump-to contents and numbered sections. */
export function LegalDocument({
  title,
  effective,
  intro,
  sections,
  back,
  notice,
  footer,
  contentsLabel = "Contents",
  className,
}: LegalDocumentProps) {
  return (
    <article className={cn("mx-auto max-w-3xl", className)}>
      {back && (
        <a href={back.href} className="text-sm text-muted-foreground hover:text-foreground">
          {back.label}
        </a>
      )}

      <header className="mt-4 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{effective}</p>
      </header>

      {notice && <p className="mt-4 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">{notice}</p>}

      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted-foreground">{intro}</div>

      <nav aria-label={contentsLabel} className="mt-8 rounded-lg border bg-muted/30 p-4">
        <ol className="grid gap-1 text-sm sm:grid-cols-2">
          {sections.map((section, index) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="text-muted-foreground hover:text-foreground">
                {index + 1}. {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 space-y-10">
        {sections.map((section, index) => (
          <section key={section.id} id={section.id} className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              {index + 1}. {section.heading}
            </h2>
            <div className="space-y-3 text-[15px] leading-relaxed text-muted-foreground [&_a]:underline [&_a:hover]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_strong]:text-foreground">
              {section.body}
            </div>
          </section>
        ))}
      </div>

      {footer && (
        <>
          <Separator className="my-10" />
          <p className="text-xs text-muted-foreground">{footer}</p>
        </>
      )}
    </article>
  )
}
