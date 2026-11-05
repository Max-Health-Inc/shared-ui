import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import type { i18n as I18nInstance } from "i18next"
import { createAppI18n } from "./i18n"
import { setUiLanguage } from "./ui-text"

const translations = { _languages: ["de", "fr"], Save: ["Speichern", "Enregistrer"] }

let writes: string[] = []
const original = Object.getOwnPropertyDescriptor(globalThis, "document")

function fakeDocument(protocol: string) {
  writes = []
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      location: { protocol },
      get cookie() {
        return ""
      },
      set cookie(value: string) {
        writes.push(value)
      },
    },
  })
}

function ready(instance: I18nInstance): Promise<void> {
  return new Promise((resolve) => {
    if (instance.isInitialized) resolve()
    else instance.on("initialized", () => resolve())
  })
}

describe("createAppI18n cookie", () => {
  beforeEach(() => fakeDocument("https:"))
  afterEach(() => {
    if (original) Object.defineProperty(globalThis, "document", original)
    else Reflect.deleteProperty(globalThis, "document")
    setUiLanguage(undefined)
  })

  it("writes the chosen language to a locale cookie", async () => {
    const instance = createAppI18n(translations, { detect: false, cookie: {} })
    await ready(instance)
    await instance.changeLanguage("de")
    expect(writes.at(-1)).toBe("locale=de; Path=/; Max-Age=31536000; SameSite=Lax; Secure")
  })

  it("stores the primary subtag of a regional tag", async () => {
    const instance = createAppI18n(translations, { detect: false, cookie: {} })
    await ready(instance)
    await instance.changeLanguage("fr-CA")
    expect(writes.at(-1)?.split(";")[0]).toBe("locale=fr")
  })

  it("takes a custom cookie name", async () => {
    const instance = createAppI18n(translations, { detect: false, cookie: { name: "lang" } })
    await ready(instance)
    await instance.changeLanguage("de")
    expect(writes.at(-1)?.split(";")[0]).toBe("lang=de")
  })

  it("leaves out Secure on plain http", async () => {
    fakeDocument("http:")
    const instance = createAppI18n(translations, { detect: false, cookie: {} })
    await ready(instance)
    await instance.changeLanguage("de")
    expect(writes.at(-1)).toBe("locale=de; Path=/; Max-Age=31536000; SameSite=Lax")
  })

  it("writes no cookie unless asked to", async () => {
    const instance = createAppI18n(translations, { detect: false })
    await ready(instance)
    await instance.changeLanguage("de")
    expect(writes).toEqual([])
  })
})
