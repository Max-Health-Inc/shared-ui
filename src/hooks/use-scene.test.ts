import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { Window } from "happy-dom"
import { isScene, readStoredScene, SCENES } from "./use-scene"

describe("isScene", () => {
  it("narrows known scenes only", () => {
    for (const scene of SCENES) expect(isScene(scene.id)).toBe(true)
    expect(isScene("starfield")).toBe(false)
    expect(isScene("")).toBe(false)
  })
})

describe("readStoredScene", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage")

  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", { value: new Window().localStorage, configurable: true })
  })

  afterEach(() => {
    if (original) Object.defineProperty(globalThis, "localStorage", original)
    else Reflect.deleteProperty(globalThis, "localStorage")
  })

  it("returns the stored scene", () => {
    localStorage.setItem("scene", "room-edges")
    expect(readStoredScene("scene", "none")).toBe("room-edges")
  })

  it("falls back when nothing is stored", () => {
    expect(readStoredScene("scene", "none")).toBe("none")
  })

  it("falls back on a value that is no scene, such as one a later release removed", () => {
    localStorage.setItem("scene", "starfield")
    expect(readStoredScene("scene", "perspective-grid")).toBe("perspective-grid")
  })

  it("falls back when storage is blocked", () => {
    Object.defineProperty(globalThis, "localStorage", {
      get() {
        throw new Error("SecurityError")
      },
      configurable: true,
    })
    expect(readStoredScene("scene", "none")).toBe("none")
  })
})
