import { afterEach, describe, expect, it } from "bun:test"
import { act, createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createRoot } from "react-dom/client"
import { AboutButton } from "./about-button"
import { AboutPage, type AboutPageProps } from "./about-page"
import { ChangelogSection, type ChangelogRelease } from "./changelog-section"
import { aboutPath, isAboutPath, useAboutRoute, type AboutRoute } from "./use-about-route"

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true)

const BASE: AboutPageProps = {
  manufacturer: "Acme Inc.",
  contactEmail: "help@acme.test",
  version: "1.2.3-beta.202611161200.abc1234",
  onBack: () => undefined,
}

const RELEASES: ChangelogRelease[] = [
  { version: "1.3.0", date: null, unreleased: true, entries: [{ kind: "feature", text: "Dark mode", breaking: false }] },
  {
    version: "1.2.0",
    date: "2026-11-01T10:00:00Z",
    unreleased: false,
    entries: [
      { kind: "fix", text: "Crash on load", breaking: false },
      { kind: "feature", text: "New API", breaking: true },
    ],
  },
  { version: "1.0.0", date: "2026-10-01T10:00:00Z", unreleased: false, entries: [] },
]

function render(props: Partial<AboutPageProps> = {}): string {
  return renderToStaticMarkup(createElement(AboutPage, { ...BASE, ...props }))
}

describe("AboutPage", () => {
  it("shows the manufacturer, a mailto contact and the exact build version", () => {
    const html = render()
    expect(html).toContain('href="mailto:help@acme.test"')
    expect(html).toContain("Acme Inc.")
    expect(html).toMatch(/data-slot="about-version"[^>]*>1\.2\.3-beta\.202611161200\.abc1234</)
  })

  it("links terms and privacy only when given, in a new tab", () => {
    expect(render()).not.toContain('target="_blank"')
    const html = render({ termsUrl: "https://acme.test/terms", privacyUrl: "https://acme.test/privacy" })
    expect(html).toContain('href="https://acme.test/terms" target="_blank" rel="noreferrer"')
    expect(html).toContain('href="https://acme.test/privacy" target="_blank" rel="noreferrer"')
  })

  it("describes the product only when one is passed", () => {
    expect(render()).not.toContain('data-slot="about-product"')
    const html = render({ product: { label: "Widget", description: "Does widget things.", pitch: "Makes life easier." } })
    expect(html).toContain('data-slot="about-product"')
    expect(html).toContain("Does widget things.")
    expect(html).toContain("Makes life easier.")
  })

  it("places lead first, details inside the list and children before the legal links", () => {
    const html = render({
      termsUrl: "https://acme.test/terms",
      lead: createElement("p", { id: "lead" }),
      details: createElement("div", { id: "detail" }),
      children: createElement("section", { id: "extra" }),
    })
    const at = (needle: string) => html.indexOf(needle)
    expect(at('id="lead"')).toBeLessThan(at("mailto:"))
    expect(at('id="detail"')).toBeGreaterThan(at('data-slot="about-version"'))
    expect(at('id="extra"')).toBeGreaterThan(at('id="detail"'))
    expect(at('id="extra"')).toBeLessThan(at("https://acme.test/terms"))
  })

  it("prefers the app's translations over the package catalog", () => {
    const html = render({ t: (key) => (key === "Manufacturer" ? "Producer" : key) })
    expect(html).toContain("Producer")
    expect(html).not.toContain(">Manufacturer<")
  })

  it("calls onBack from the back button", () => {
    let backs = 0
    const container = document.createElement("div")
    const root = createRoot(container)
    act(() => {
      root.render(createElement(AboutPage, { ...BASE, onBack: () => { backs += 1 } }))
    })
    container.querySelector("button")?.click()
    expect(backs).toBe(1)
    act(() => {
      root.unmount()
    })
  })
})

describe("ChangelogSection", () => {
  it("renders nothing without releases", () => {
    expect(renderToStaticMarkup(createElement(ChangelogSection, { releases: [] }))).toBe("")
  })

  it("lists every release with a badge per entry and marks breaking changes", () => {
    const html = renderToStaticMarkup(createElement(ChangelogSection, { releases: RELEASES }))
    expect(html).toContain('data-release="1.3.0"')
    expect(html).toContain("v1.2.0")
    expect(html).not.toContain("v1.3.0")
    expect(html.match(/data-slot="badge"/g)?.length).toBe(4)
    expect(html).toContain("New API")
  })
})

describe("AboutButton", () => {
  it("gives the icon button an accessible name that matches its tooltip", () => {
    const html = renderToStaticMarkup(createElement(AboutButton, { onClick: () => undefined }))
    const title = /title="([^"]+)"/.exec(html)?.[1]
    expect(title).toBeTruthy()
    expect(html).toContain(`<span class="sr-only">${title ?? ""}</span>`)
  })
})

describe("about route", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/")
  })

  it("builds /about under the base path and matches it with or without a trailing slash", () => {
    expect(aboutPath()).toBe("/about")
    expect(aboutPath("/apps/consent/")).toBe("/apps/consent/about")
    expect(isAboutPath("/apps/consent/about/", "/apps/consent/")).toBe(true)
    expect(isAboutPath("/about", "/apps/consent/")).toBe(false)
  })

  function mount(base?: string): { current: () => AboutRoute; unmount: () => void } {
    let latest: AboutRoute | undefined
    function Probe() {
      latest = useAboutRoute({ base })
      return null
    }
    const root = createRoot(document.createElement("div"))
    act(() => {
      root.render(createElement(Probe))
    })
    return {
      current: () => {
        if (!latest) throw new Error("not rendered")
        return latest
      },
      unmount: () => {
        act(() => {
          root.unmount()
        })
      },
    }
  }

  it("opens on show and returns to the previous URL on close", async () => {
    window.history.replaceState(null, "", "/studies?patient=1")
    const route = mount()
    expect(route.current().open).toBe(false)

    window.scrollTo({ top: 400 })
    act(() => {
      route.current().show()
    })
    expect(window.scrollY).toBe(0)
    expect(window.location.pathname).toBe("/about")
    expect(route.current().open).toBe(true)

    await act(async () => {
      route.current().close()
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    expect(`${window.location.pathname}${window.location.search}`).toBe("/studies?patient=1")
    expect(route.current().open).toBe(false)
    route.unmount()
  })

  it("closes a deep-linked about page to the app's home under its base", () => {
    window.history.replaceState(null, "", "/apps/consent/about")
    const route = mount("/apps/consent/")
    expect(route.current().open).toBe(true)

    act(() => {
      route.current().close()
    })
    expect(window.location.pathname).toBe("/apps/consent/")
    expect(route.current().open).toBe(false)
    route.unmount()
  })
})
