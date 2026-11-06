import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { SignInLanding } from "./sign-in-landing"

const Icon = () => null

describe("SignInLanding background", () => {
  it("renders the background first and lifts the landing content above it", () => {
    const html = renderToStaticMarkup(
      createElement(SignInLanding, {
        title: "Viewer",
        description: "Look at scans",
        icon: Icon,
        background: createElement("div", { "data-testid": "backdrop", className: "fixed inset-0 z-0" }),
      }),
    )
    expect(html.indexOf('data-testid="backdrop"')).toBeLessThan(html.indexOf("Viewer"))
    expect(html).toContain("relative z-10")
  })

  it("keeps the plain layout when there is no background", () => {
    const html = renderToStaticMarkup(createElement(SignInLanding, { title: "Viewer", description: "Look at scans", icon: Icon }))
    expect(html).not.toContain("z-10")
  })
})
