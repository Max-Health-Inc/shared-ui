import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Activity } from "lucide-react"
import { AppHeader } from "./app-header"
import { HeaderLabel } from "./header-label"
import { HeaderCompactContext, decideCompact } from "../lib/header-compact"

const render = (props: Partial<Parameters<typeof AppHeader>[0]> = {}) =>
  renderToStaticMarkup(createElement(AppHeader, { title: "Viewer", icon: Activity, homeUrl: false, installLabel: false, ...props }))

describe("AppHeader account", () => {
  it("shows the account as an icon, naming the user for hover and assistive technology", () => {
    const html = render({ authenticated: true, userName: "Jane Doe", accountUrl: "https://x.test/account", onSignOut: () => {} })
    expect(html).toContain('title="Jane Doe · Manage your account"')
    expect(html).toContain('<span class="sr-only">Jane Doe</span>')
  })

  it("keeps sign out as its own button with a collapsible label", () => {
    const html = render({ authenticated: true, onSignOut: () => {} })
    expect(html).toContain("Sign Out")
    expect(html).toContain("sm:not-sr-only")
  })
})

describe("HeaderLabel", () => {
  it("is shown from small screens up and always readable by assistive technology", () => {
    expect(renderToStaticMarkup(createElement(HeaderLabel, null, "Admin"))).toContain('class="sr-only sm:not-sr-only whitespace-nowrap"')
  })

  it("collapses to assistive technology only when the header is compact", () => {
    const html = renderToStaticMarkup(
      createElement(HeaderCompactContext.Provider, { value: true }, createElement(HeaderLabel, null, "Admin")),
    )
    expect(html).toBe('<span class="sr-only">Admin</span>')
  })
})

describe("decideCompact", () => {
  it("collapses once the labelled content no longer fits, remembering how wide it was", () => {
    expect(decideCompact({ compact: false, expandedWidth: 0 }, 800, 700)).toEqual({ compact: false, expandedWidth: 700 })
    expect(decideCompact({ compact: false, expandedWidth: 0 }, 800, 900)).toEqual({ compact: true, expandedWidth: 900 })
  })

  it("expands again only when the labelled width fits, so it does not flicker at the edge", () => {
    expect(decideCompact({ compact: true, expandedWidth: 900 }, 850, 500)).toEqual({ compact: true, expandedWidth: 900 })
    expect(decideCompact({ compact: true, expandedWidth: 900 }, 900, 500)).toEqual({ compact: false, expandedWidth: 900 })
  })
})
