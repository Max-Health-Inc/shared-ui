import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { EmptyState } from "./empty-state"

describe("EmptyState", () => {
  it("shows a title as the heading, not as a tooltip", () => {
    const html = renderToStaticMarkup(createElement(EmptyState, { title: "No apps yet", message: "Register one below." }))
    expect(html).toContain(">No apps yet</p>")
    expect(html).toContain("Register one below.")
    expect(html).not.toContain('title="')
  })

  it("keeps the message as the lead line without a title", () => {
    expect(renderToStaticMarkup(createElement(EmptyState, { message: "Nothing here" }))).toContain('<p class="text-foreground/70">Nothing here</p>')
  })
})
