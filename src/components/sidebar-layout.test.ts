import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { SidebarLayout, type SidebarGroup } from "./sidebar-layout"
import { UI_TEXT } from "../lib/ui-text-catalog"

const GROUPS: SidebarGroup[] = [
  { items: [{ id: "overview", label: "Overview", href: "/" }, { id: "apps", label: "Sandbox apps", href: "/apps" }] },
  { label: "Resources", items: [{ id: "docs", label: "Docs", href: "https://example.com/docs", external: true }, { id: "secret", label: "Hidden", visible: false }] },
  { label: "Empty", items: [{ id: "gone", label: "Gone", visible: false }] },
]

const render = (props: Partial<Parameters<typeof SidebarLayout>[0]> = {}) =>
  renderToStaticMarkup(createElement(SidebarLayout, { groups: GROUPS, children: createElement("p", null, "page-body"), ...props }))

describe("SidebarLayout", () => {
  it("renders the visible items next to the page", () => {
    const html = render()
    expect(html).toContain("Overview")
    expect(html).toContain("Sandbox apps")
    expect(html).toContain("page-body")
    expect(html).not.toContain("Hidden")
  })

  it("marks only the active item as the current page", () => {
    const html = render({ active: "apps" })
    expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    expect(html).toMatch(/aria-current="page"[^>]*href="\/apps"|href="\/apps"[^>]*aria-current="page"/)
  })

  it("opens external links in a new tab and drops groups with nothing visible", () => {
    const html = render()
    expect(html).toMatch(/href="https:\/\/example.com\/docs" target="_blank" rel="noreferrer"/)
    expect(html).toContain("Resources")
    expect(html).not.toContain("Empty")
  })

  it("has its strings in the catalogue", () => {
    expect(UI_TEXT["Sections"]).toBeDefined()
  })
})
