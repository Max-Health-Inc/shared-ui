import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible"

function markup(open?: boolean): string {
  return renderToStaticMarkup(
    createElement(
      Collapsible,
      { open },
      createElement(CollapsibleTrigger, null, "Changelog"),
      createElement(CollapsibleContent, null, "entries"),
    ),
  )
}

describe("Collapsible", () => {
  it("tells assistive technology and CSS that it is closed", () => {
    const html = markup()
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('data-slot="collapsible-trigger" data-state="closed"')
  })

  it("says so when it is open", () => {
    const html = markup(true)
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('data-slot="collapsible" data-state="open"')
  })
})
