import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test"
import { Window } from "happy-dom"
import { act, createElement, type ReactNode } from "react"
import { renderToString } from "react-dom/server"
import type { Root } from "react-dom/client"
import { installDomGlobals } from "../testing/dom-globals"
import { chooseTheme, resolveTheme, THEMES, type Theme } from "../lib/theme"

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true)

const window = new Window({ url: "https://app.test/", settings: { device: { prefersColorScheme: "light" } } })
let restoreDom = installDomGlobals(window)

const { createRoot, hydrateRoot } = await import("react-dom/client")
const { ThemeProvider, ThemeScript, useTheme } = await import("./use-theme")
const { ModeToggle } = await import("../components/mode-toggle")

let roots: Root[] = []
let setTheme: ((theme: Theme) => void) | undefined

beforeAll(() => {
  restoreDom()
  restoreDom = installDomGlobals(window)
})

beforeEach(() => {
  localStorage.clear()
  const root = document.documentElement
  root.className = ""
  root.removeAttribute("data-theme")
  root.removeAttribute("style")
  setTheme = undefined
})

afterEach(async () => {
  await act(async () => {
    for (const root of roots) root.unmount()
  })
  roots = []
  document.body.innerHTML = ""
})

afterAll(async () => {
  restoreDom()
  await window.happyDOM.close()
})

function Probe() {
  const state = useTheme()
  setTheme = state.setTheme
  return createElement("output", null, `${state.theme}/${state.resolvedTheme}`)
}

function host(): HTMLDivElement {
  const element = document.createElement("div")
  document.body.appendChild(element)
  return element
}

async function render(node: ReactNode) {
  const root = createRoot(host())
  roots.push(root)
  await act(async () => {
    root.render(node)
  })
}

function applied() {
  const root = document.documentElement
  return { classes: [...root.classList], dataTheme: root.getAttribute("data-theme"), colorScheme: root.style.colorScheme }
}

function probeText() {
  return document.querySelector("output")?.textContent
}

describe("ThemeProvider", () => {
  it("applies the default theme to <html> when nothing is stored", async () => {
    await render(createElement(ThemeProvider, { defaultTheme: "dark" }, createElement(Probe)))
    expect(applied()).toEqual({ classes: ["dark"], dataTheme: "dark", colorScheme: "dark" })
    expect(probeText()).toBe("dark/dark")
  })

  it("applies a daytime default for the current hour", async () => {
    const daytime = { daytime: { from: 8, to: 20 } }
    const expected = resolveTheme(chooseTheme(null, daytime, new Date().getHours(), THEMES.map((t) => t.id)), false)
    await render(createElement(ThemeProvider, { defaultTheme: daytime }, createElement(Probe)))
    expect(applied().dataTheme).toBe(expected)
  })

  it("prefers the stored choice, and persists a new one", async () => {
    localStorage.setItem("app-theme", "light")
    await render(createElement(ThemeProvider, { defaultTheme: "dark", storageKey: "app-theme" }, createElement(Probe)))
    expect(applied().dataTheme).toBe("light")

    await act(async () => {
      setTheme?.("dark")
    })
    expect(applied()).toEqual({ classes: ["dark"], dataTheme: "dark", colorScheme: "dark" })
    expect(localStorage.getItem("app-theme")).toBe("dark")
    expect(probeText()).toBe("dark/dark")
  })

  it("follows a choice made in another tab", async () => {
    await render(createElement(ThemeProvider, { defaultTheme: "light" }, createElement(Probe)))
    localStorage.setItem("theme", "dark")
    await act(async () => {
      window.dispatchEvent(new window.StorageEvent("storage", { key: "theme" }))
    })
    expect(applied().dataTheme).toBe("dark")
  })

  it("leaves color-scheme alone when asked to", async () => {
    await render(createElement(ThemeProvider, { defaultTheme: "dark", enableColorScheme: false }, createElement(Probe)))
    expect(applied().colorScheme).toBe("")
  })

  it("suppresses transitions only while a change is applied", async () => {
    await render(createElement(ThemeProvider, { defaultTheme: "light", disableTransitionOnChange: true, nonce: "abc" }, createElement(Probe)))
    expect(document.head.querySelector("style")).toBeNull()

    await act(async () => {
      setTheme?.("dark")
    })
    const style = document.head.querySelector("style")
    expect(style?.textContent).toContain("transition:none")
    expect(style?.nonce).toBe("abc")

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
    expect(document.head.querySelector("style")).toBeNull()
  })

  it("hydrates prerendered markup without a mismatch, then reports the stored choice", async () => {
    const tree = createElement(ThemeProvider, { defaultTheme: "light" }, createElement(Probe))
    const container = host()
    container.innerHTML = renderToString(tree)
    expect(probeText()).toBe("light/light")

    localStorage.setItem("theme", "dark")
    const errors: unknown[] = []
    await act(async () => {
      roots.push(hydrateRoot(container, tree, { onRecoverableError: (error) => errors.push(error) }))
    })
    expect(errors).toEqual([])
    expect(probeText()).toBe("dark/dark")
    expect(applied().dataTheme).toBe("dark")
  })

  it("makes useTheme throw without a provider", () => {
    expect(() => renderToString(createElement(Probe))).toThrow("useTheme must be used within a ThemeProvider")
  })
})

describe("ThemeScript", () => {
  it("renders the pre-paint script with the page's nonce", () => {
    const html = renderToString(createElement(ThemeScript, { nonce: "n0nce", storageKey: "app-theme" }))
    expect(html).toContain('nonce="n0nce"')
    expect(html).toContain("app-theme")
  })
})

describe("ModeToggle", () => {
  it("flips between light and dark as a single button", async () => {
    await render(createElement(ThemeProvider, { defaultTheme: "light" }, createElement(ModeToggle, { variant: "toggle" }), createElement(Probe)))
    const button = document.querySelector("button")
    expect(button?.getAttribute("aria-label")).toBe("Toggle theme")

    await act(async () => {
      button?.click()
    })
    expect(probeText()).toBe("dark/dark")
    expect(localStorage.getItem("theme")).toBe("dark")
  })
})
