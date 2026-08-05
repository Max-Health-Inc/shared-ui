import { describe, expect, it } from "bun:test"
import { resolveTheme, isTheme, THEMES } from "./use-theme"

describe("resolveTheme", () => {
  it("follows the OS only for `system`", () => {
    expect(resolveTheme("system", true)).toBe("dark")
    expect(resolveTheme("system", false)).toBe("light")
  })

  // The point of an explicit choice: it must win over the OS in BOTH directions. Writing
  // only `.dark` is what left light mode following the OS in AIHR's lib/theme.ts.
  it("ignores the OS for an explicit choice", () => {
    expect(resolveTheme("light", true)).toBe("light")
    expect(resolveTheme("dark", false)).toBe("dark")
  })

  it("only ever resolves to a concrete scheme", () => {
    for (const theme of THEMES) {
      for (const prefersDark of [true, false]) {
        expect(["light", "dark"]).toContain(resolveTheme(theme.id, prefersDark))
      }
    }
  })
})

describe("isTheme", () => {
  it("narrows known themes only", () => {
    expect(isTheme("system")).toBe(true)
    expect(isTheme("dark")).toBe(true)
    expect(isTheme("Dark")).toBe(false)
    expect(isTheme("perspective-grid")).toBe(false)
    expect(isTheme("")).toBe(false)
  })
})

describe("THEMES", () => {
  it("offers light, dark and system, in that order", () => {
    expect(THEMES.map((theme) => theme.id)).toEqual(["light", "dark", "system"])
  })
})
