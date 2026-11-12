import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { PageLoader } from "./loader"

describe("PageLoader", () => {
  it("centres the loader in the space it is given and announces itself", () => {
    const html = renderToStaticMarkup(createElement(PageLoader))
    expect(html).toContain('role="status"')
    expect(html).toContain('aria-label="Loading"')
    expect(html).toMatch(/class="[^"]*\bflex-1\b[^"]*\bitems-center\b[^"]*\bjustify-center\b/)
  })

  it("takes a translated label and a full-screen height from the caller", () => {
    const html = renderToStaticMarkup(createElement(PageLoader, { label: "Wird geladen", className: "min-h-screen" }))
    expect(html).toContain('aria-label="Wird geladen"')
    expect(html).toContain("min-h-screen")
  })
})
