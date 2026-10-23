import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { LegalDocument } from "./legal-document"

const sections = [
  { id: "data", heading: "Data we collect", body: "Body one" },
  { id: "rights", heading: "Your rights", body: "Body two" },
]

describe("LegalDocument", () => {
  it("numbers each section and links it from the contents", () => {
    const html = renderToStaticMarkup(
      createElement(LegalDocument, { title: "Privacy", effective: "Effective today", intro: "Intro", sections }),
    )
    expect(html).toContain('href="#data"')
    expect(html).toContain('id="rights"')
    expect(html.split("Your rights").length - 1).toBe(2)
  })

  it("renders the back link, notice and footer only when given", () => {
    const bare = renderToStaticMarkup(
      createElement(LegalDocument, { title: "Terms", effective: "e", intro: "i", sections }),
    )
    expect(bare).not.toContain('href="/"')
    expect(bare).not.toContain("<hr")
    expect(bare).not.toContain('data-slot="separator"')

    const full = renderToStaticMarkup(
      createElement(LegalDocument, {
        title: "Terms",
        effective: "e",
        intro: "i",
        sections,
        back: { href: "/", label: "Back" },
        notice: "Translated",
        footer: "Applies here",
        contentsLabel: "Inhalt",
      }),
    )
    expect(full).toContain('href="/"')
    expect(full).toContain('data-slot="separator"')
    expect(full).toContain('aria-label="Inhalt"')
  })
})
