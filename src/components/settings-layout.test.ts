import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { SettingsLayout, type SettingsSection } from "./settings-layout"
import { UI_TEXT } from "../lib/ui-text-catalog"

const SECTIONS: SettingsSection[] = [
  { id: "plan", title: "Plan", description: "Your subscription", content: createElement("p", null, "plan-body") },
  { id: "prefs", title: "Preferences", content: () => createElement("p", null, "prefs-body") },
  { id: "hidden", title: "Hidden", visible: false, content: createElement("p", null, "hidden-body") },
]

const render = (props: Partial<Parameters<typeof SettingsLayout>[0]> = {}) =>
  renderToStaticMarkup(createElement(SettingsLayout, { sections: SECTIONS, ...props }))

describe("SettingsLayout", () => {
  it("lists the visible sections and renders no section body until one is open", () => {
    const html = render()
    expect(html).toContain("Plan")
    expect(html).toContain("Your subscription")
    expect(html).toContain("Preferences")
    expect(html).not.toContain("Hidden")
    expect(html).not.toContain("plan-body")
    expect(html).not.toContain("prefs-body")
  })

  it("renders only the open section, calling a lazy body", () => {
    const html = render({ section: "prefs" })
    expect(html).toContain("prefs-body")
    expect(html).not.toContain("plan-body")
    expect(html).toContain("All settings")
  })

  it("opens the default section when uncontrolled", () => {
    expect(render({ defaultSection: "plan" })).toContain("plan-body")
  })

  it("falls back to the list for an unknown or hidden section", () => {
    expect(render({ section: "nope" })).toContain("Your subscription")
    expect(render({ section: "hidden" })).not.toContain("hidden-body")
  })

  it("titles the page Settings unless told otherwise, and offers the back link it is given", () => {
    expect(render()).toContain("Settings")
    const html = render({ title: "Viewer settings", onBack: () => {}, backLabel: "Back to studies" })
    expect(html).toContain("Viewer settings")
    expect(html).toContain("Back to studies")
  })

  it("has its strings in the catalogue", () => {
    expect(UI_TEXT["All settings"]).toBeDefined()
    expect(UI_TEXT["Settings"]).toBeDefined()
  })
})
