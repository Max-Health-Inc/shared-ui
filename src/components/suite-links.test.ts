import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { SuiteLinks } from "./suite-links"

const SITES = [
  { id: "maxhealth", label: "Max Health", url: "https://maxhealth.tech" },
  { id: "aihr", label: "AIHR", url: "https://aihr.maxhealth.tech" },
  { id: "status", label: "Status", url: "https://status.maxhealth.tech" },
]

describe("SuiteLinks", () => {
  it("links every other site with a plain, crawlable anchor and leaves the current one out", () => {
    const html = renderToStaticMarkup(createElement(SuiteLinks, { sites: SITES, currentHost: "aihr.maxhealth.tech" }))
    expect(html).toContain('href="https://maxhealth.tech"')
    expect(html).toContain('href="https://status.maxhealth.tech"')
    expect(html).not.toContain("aihr.maxhealth.tech")
    expect(html).toContain('aria-label="Max Health sites"')
  })

  it("renders nothing when no other site is left", () => {
    expect(renderToStaticMarkup(createElement(SuiteLinks, { sites: SITES.slice(0, 1), currentHost: "maxhealth.tech" }))).toBe("")
  })
})
