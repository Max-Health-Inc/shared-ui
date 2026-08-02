/**
 * i18n — the pure helpers (no i18next instance required).
 *
 * `plural` exists because i18next's `key_one`/`key_other` cannot work in a format where the
 * English source string IS the key and English is never stored. These tests pin the
 * selection rule and the property that makes it safe for translation extraction: both arms
 * are values the caller already rendered, so the `t("…")` literals stay at the call site.
 */
import { describe, it, expect } from "bun:test"
import { plural, getSupportedLanguages, LOCALE_NAMES } from "./i18n"

describe("plural", () => {
  it("takes the singular only at exactly one", () => {
    expect(plural(1, "1 tag", "3 tags")).toBe("1 tag")
  })

  it("takes the plural at zero, as English does", () => {
    expect(plural(0, "1 tag", "0 tags")).toBe("0 tags")
  })

  it("takes the plural above one", () => {
    expect(plural(2, "1 tag", "2 tags")).toBe("2 tags")
    expect(plural(377, "1 tag", "377 tags")).toBe("377 tags")
  })

  it("takes the plural for negatives and fractions", () => {
    expect(plural(-1, "one", "other")).toBe("other")
    expect(plural(1.5, "one", "other")).toBe("other")
  })

  it("is not limited to strings — it selects any rendered value", () => {
    const one = { label: "1 tag" }
    const other = { label: "n tags" }
    expect(plural(1, one, other)).toBe(one)
    expect(plural(9, one, other)).toBe(other)
  })

  it("selects between already-interpolated forms", () => {
    // What a call site looks like once `t` has run: the count is baked in, so `plural`
    // only chooses. This is the shape that keeps both keys visible to extract-and-sync.
    const render = (n: number) => plural(n, "1 image", `${n} images`)
    expect(render(1)).toBe("1 image")
    expect(render(4)).toBe("4 images")
  })
})

describe("getSupportedLanguages", () => {
  it("always leads with the implicit English fallback", () => {
    expect(getSupportedLanguages({ _languages: ["de", "fr"] })).toEqual(["en", "de", "fr"])
  })

  it("is English-only when a file declares no languages", () => {
    expect(getSupportedLanguages({})).toEqual(["en"])
  })
})

describe("LOCALE_NAMES", () => {
  it("names each language in its own tongue", () => {
    expect(LOCALE_NAMES.de).toBe("Deutsch")
    expect(LOCALE_NAMES.en).toBe("English")
  })
})
