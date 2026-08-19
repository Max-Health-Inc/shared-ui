/**
 * ui-text — this package's own strings.
 *
 * The rule under test is the precedence: an app's `t` wins where it HAS a
 * translation, this package's catalogue covers the rest, and English is the floor.
 * "Has a translation" is inferred from the key coming back unchanged, which is what
 * the org's format guarantees for a missing key — so that inference is pinned here.
 */
import { afterEach, describe, expect, it } from "bun:test"
import {
  getUiLanguage,
  identityT,
  interpolate,
  setUiLanguage,
  uiText,
  type TFn,
} from "./ui-text"
import { UI_TEXT, UI_TEXT_LANGUAGES } from "./ui-text-catalog"

afterEach(() => {
  setUiLanguage(undefined)
})

describe("interpolate", () => {
  it("fills placeholders", () => {
    expect(interpolate("{{n}} of {{total}} selected", { n: 2, total: 5 })).toBe("2 of 5 selected")
  })

  it("leaves an unknown placeholder visible rather than blanking it", () => {
    expect(interpolate("Edit {{resourceType}}", { other: "x" })).toBe("Edit {{resourceType}}")
  })

  it("returns the text untouched with no vars", () => {
    expect(interpolate("Sign Out")).toBe("Sign Out")
  })
})

describe("identityT", () => {
  it("is the English fallback", () => {
    expect(identityT("Sign Out")).toBe("Sign Out")
    expect(identityT("{{age}} yo", { age: 42 })).toBe("42 yo")
  })
})

describe("uiText", () => {
  it("is English until a language is set", () => {
    expect(getUiLanguage()).toBeUndefined()
    expect(uiText("Sign Out")).toBe("Sign Out")
  })

  it("resolves from the catalogue once a language is set", () => {
    setUiLanguage("de")
    expect(uiText("Sign Out")).toBe("Abmelden")
    setUiLanguage("it")
    expect(uiText("Sign Out")).toBe("Esci")
  })

  it("reads a regional tag by its base language", () => {
    setUiLanguage("de-AT")
    expect(uiText("Sign Out")).toBe("Abmelden")
  })

  it("interpolates the translation, not the key", () => {
    setUiLanguage("fr")
    expect(uiText("MRN: {{value}}", { value: "A1" })).toBe("N° de dossier : A1")
  })

  it("falls back to English for a language it has no column for", () => {
    setUiLanguage("nl")
    expect(uiText("Sign Out")).toBe("Sign Out")
  })

  it("falls back to English for a key it does not carry", () => {
    setUiLanguage("de")
    expect(uiText("Not a shared-ui string")).toBe("Not a shared-ui string")
  })
})

describe("catalogue", () => {
  it("has one translation per language for every key", () => {
    for (const [key, values] of Object.entries(UI_TEXT)) {
      expect(values.length, key).toBe(UI_TEXT_LANGUAGES.length)
      for (const value of values) {
        expect(value.length, key).toBeGreaterThan(0)
      }
    }
  })

  it("keeps every placeholder of the source string in every translation", () => {
    for (const [key, values] of Object.entries(UI_TEXT)) {
      const placeholders = [...key.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1])
      for (const name of placeholders) {
        for (const value of values) {
          expect(value, `${key} → ${value}`).toContain(`{{${name ?? ""}}}`)
        }
      }
    }
  })
})

/**
 * `useUiText` is a hook, so its precedence rule is exercised here through the same
 * expression the hook returns — no renderer in this package's test setup.
 */
function resolve(override: TFn | undefined, key: string, vars?: Record<string, string | number>): string {
  if (override) {
    const translated = override(key, vars)
    if (translated !== interpolate(key, vars)) return translated
  }
  return uiText(key, vars)
}

describe("precedence", () => {
  const appT: TFn = (key, vars) => (key === "Sign Out" ? "Ausloggen" : interpolate(key, vars))

  it("prefers the app's translation where it has one", () => {
    setUiLanguage("de")
    expect(resolve(appT, "Sign Out")).toBe("Ausloggen")
  })

  it("uses the catalogue where the app returns the key untranslated", () => {
    setUiLanguage("de")
    expect(resolve(appT, "Cancel")).toBe("Abbrechen")
  })

  it("is English when neither has the key", () => {
    setUiLanguage("de")
    expect(resolve(appT, "Not a shared-ui string")).toBe("Not a shared-ui string")
  })

  it("needs no app translator at all", () => {
    setUiLanguage("es")
    expect(resolve(undefined, "Sign Out")).toBe("Cerrar sesión")
  })
})
