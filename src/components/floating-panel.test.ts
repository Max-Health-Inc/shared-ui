import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { FloatingPanel } from "./floating-panel"
import { clampToBounds, nudge, readPanelState, writePanelState } from "../lib/panel-position"
import { Window } from "happy-dom"

describe("clampToBounds (P1)", () => {
  const bounds = { width: 1000, height: 800 }
  const size = { width: 300, height: 200 }

  it("leaves a panel that fits where it is", () => {
    expect(clampToBounds({ x: 40, y: 60 }, size, bounds)).toEqual({ x: 40, y: 60 })
  })

  it("pulls a panel back inside every edge", () => {
    expect(clampToBounds({ x: -50, y: -10 }, size, bounds)).toEqual({ x: 0, y: 0 })
    expect(clampToBounds({ x: 900, y: 700 }, size, bounds)).toEqual({ x: 700, y: 600 })
  })

  it("pins a panel larger than the window to the top left so its header stays reachable", () => {
    expect(clampToBounds({ x: 50, y: 50 }, { width: 1200, height: 900 }, bounds)).toEqual({ x: 0, y: 0 })
  })
})

describe("nudge (P3)", () => {
  it("moves by a small step per arrow key and a large one with shift", () => {
    expect(nudge({ x: 100, y: 100 }, "ArrowLeft", false)).toEqual({ x: 84, y: 100 })
    expect(nudge({ x: 100, y: 100 }, "ArrowDown", true)).toEqual({ x: 100, y: 164 })
  })

  it("ignores every other key", () => {
    expect(nudge({ x: 100, y: 100 }, "Enter", false)).toBeNull()
  })
})

describe("readPanelState (P4)", () => {
  const fallback = { position: { x: 16, y: 96 }, minimized: false }

  it("restores what was stored", () => {
    const storage = new Window().localStorage
    storage.setItem("panel", JSON.stringify({ position: { x: 5, y: 7 }, minimized: true }))
    expect(readPanelState(storage, "panel", fallback)).toEqual({ position: { x: 5, y: 7 }, minimized: true })
  })

  it("falls back on missing, broken or misshapen state and on unusable storage", () => {
    const storage = new Window().localStorage
    expect(readPanelState(storage, "panel", fallback)).toEqual(fallback)
    storage.setItem("panel", "{not json")
    expect(readPanelState(storage, "panel", fallback)).toEqual(fallback)
    storage.setItem("panel", JSON.stringify({ position: { x: "far" }, minimized: 1 }))
    expect(readPanelState(storage, "panel", fallback)).toEqual(fallback)
    expect(readPanelState(null, "panel", fallback)).toEqual(fallback)
  })

  it("writes what it later reads, and says when there is nowhere to write", () => {
    const storage = new Window().localStorage
    const state = { position: { x: 30, y: 40 }, minimized: true }
    expect(writePanelState(storage, "panel", state)).toBe(true)
    expect(readPanelState(storage, "panel", fallback)).toEqual(state)
    expect(writePanelState(null, "panel", state)).toBe(false)
  })
})

describe("FloatingPanel (P2, P5)", () => {
  const render = (minimized: boolean) =>
    renderToStaticMarkup(createElement(FloatingPanel, { title: "Knee model", defaultMinimized: minimized }, createElement("p", null, "Body text")))

  it("is a labelled region with its body showing when expanded", () => {
    const html = render(false)
    expect(html).toContain('role="region"')
    expect(html).toContain('aria-label="Knee model"')
    expect(html).toContain("Body text")
    expect(html).toContain('aria-expanded="true"')
  })

  it("keeps only its header when minimised", () => {
    const html = render(true)
    expect(html).not.toContain("Body text")
    expect(html).toContain('aria-expanded="false"')
  })
})
