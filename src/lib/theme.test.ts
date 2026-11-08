import { afterEach, describe, expect, it } from "bun:test"
import { Window } from "happy-dom"
import { chooseTheme, isTheme, resolveTheme, themeScript, THEMES, type ThemeScriptOptions } from "./theme"

const IDS = THEMES.map((theme) => theme.id)
const DAYTIME = { daytime: { from: 8, to: 20 } }

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

describe("chooseTheme", () => {
  it("prefers a known stored choice over any default", () => {
    expect(chooseTheme("dark", "light", 12, IDS)).toBe("dark")
    expect(chooseTheme("system", DAYTIME, 12, IDS)).toBe("system")
  })

  it("ignores an unknown or missing stored value", () => {
    expect(chooseTheme("sepia", "dark", 12, IDS)).toBe("dark")
    expect(chooseTheme(null, "system", 12, IDS)).toBe("system")
  })

  it("is light from the start hour up to, not including, the end hour", () => {
    expect(chooseTheme(null, DAYTIME, 7, IDS)).toBe("dark")
    expect(chooseTheme(null, DAYTIME, 8, IDS)).toBe("light")
    expect(chooseTheme(null, DAYTIME, 19, IDS)).toBe("light")
    expect(chooseTheme(null, DAYTIME, 20, IDS)).toBe("dark")
    expect(chooseTheme(null, DAYTIME, 0, IDS)).toBe("dark")
  })

  it("wraps past midnight when the window starts after it ends", () => {
    const night = { daytime: { from: 22, to: 6 } }
    expect(chooseTheme(null, night, 23, IDS)).toBe("light")
    expect(chooseTheme(null, night, 5, IDS)).toBe("light")
    expect(chooseTheme(null, night, 6, IDS)).toBe("dark")
    expect(chooseTheme(null, night, 21, IDS)).toBe("dark")
  })

  it("falls back to `system` for a daytime default when the hour is unknown", () => {
    expect(chooseTheme(null, DAYTIME, undefined, IDS)).toBe("system")
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

describe("themeScript", () => {
  const windows: Window[] = []

  afterEach(async () => {
    await Promise.all(windows.splice(0).map((window) => window.happyDOM.close()))
  })

  interface Page {
    stored?: string
    prefersColorScheme?: "light" | "dark"
    hour?: number
    blockStorage?: boolean
  }

  /** Run the generated script in a fresh page, the way a browser runs it from `<head>`. */
  function run(options: ThemeScriptOptions, page: Page = {}) {
    const window = new Window({
      url: "https://app.test/",
      settings: {
        enableJavaScriptEvaluation: true,
        suppressCodeGenerationFromStringsWarning: true,
        device: { prefersColorScheme: page.prefersColorScheme ?? "light" },
      },
    })
    windows.push(window)
    if (page.stored !== undefined) window.localStorage.setItem(options.storageKey ?? "theme", page.stored)
    const hour = page.hour
    if (hour !== undefined) {
      Reflect.set(window, "Date", class extends Date {
        override getHours() {
          return hour
        }
      })
    }
    if (page.blockStorage) {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("SecurityError")
        },
      })
    }
    const script = window.document.createElement("script")
    script.textContent = themeScript(options)
    window.document.head.appendChild(script)
    const root = window.document.documentElement
    return {
      classes: [...root.classList],
      dataTheme: root.getAttribute("data-theme"),
      colorScheme: root.style.colorScheme,
    }
  }

  it("applies a stored choice over the OS and the default", () => {
    expect(run({ defaultTheme: "light" }, { stored: "dark", prefersColorScheme: "light" })).toEqual({
      classes: ["dark"],
      dataTheme: "dark",
      colorScheme: "dark",
    })
  })

  it("follows the OS for a stored or default `system`", () => {
    expect(run({}, { stored: "system", prefersColorScheme: "dark" }).dataTheme).toBe("dark")
    expect(run({}, { prefersColorScheme: "dark" }).classes).toEqual(["dark"])
    expect(run({}, { prefersColorScheme: "light" }).classes).toEqual(["light"])
  })

  it("computes a daytime default from the local hour", () => {
    expect(run({ defaultTheme: DAYTIME }, { hour: 8, prefersColorScheme: "dark" }).dataTheme).toBe("light")
    expect(run({ defaultTheme: DAYTIME }, { hour: 20, prefersColorScheme: "light" }).dataTheme).toBe("dark")
  })

  it("reads its own storage key and ignores an unknown value", () => {
    expect(run({ storageKey: "app-theme", defaultTheme: "light" }, { stored: "dark" }).dataTheme).toBe("dark")
    expect(run({ defaultTheme: "dark" }, { stored: "sepia" }).dataTheme).toBe("dark")
  })

  it("falls back to the default when storage is blocked", () => {
    expect(run({ defaultTheme: "dark" }, { stored: "light", blockStorage: true })).toEqual({
      classes: ["dark"],
      dataTheme: "dark",
      colorScheme: "dark",
    })
  })

  it("leaves color-scheme alone when asked to", () => {
    expect(run({ defaultTheme: "dark", enableColorScheme: false }).colorScheme).toBe("")
  })

  it("cannot be broken out of by a storage key", () => {
    expect(themeScript({ storageKey: "</script><script>alert(1)//" })).not.toContain("</script>")
  })
})
