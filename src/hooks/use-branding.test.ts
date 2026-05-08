import { describe, expect, it } from "bun:test"
import { parseBrandBundle } from "./use-branding"

const BRAND_EXT_URL = "http://hl7.org/fhir/StructureDefinition/organization-brand"

function makeBundle(org: Record<string, unknown> = {}) {
  return {
    entry: [{ resource: { resourceType: "Organization", ...org } }],
  }
}

describe("parseBrandBundle", () => {
  it("returns fallback for null input", () => {
    const result = parseBrandBundle(null)
    expect(result).toEqual({ name: "Proxy Smart", logoUrl: null, website: null })
  })

  it("returns fallback for undefined input", () => {
    const result = parseBrandBundle(undefined)
    expect(result).toEqual({ name: "Proxy Smart", logoUrl: null, website: null })
  })

  it("returns fallback for non-object input", () => {
    const result = parseBrandBundle("not a bundle")
    expect(result).toEqual({ name: "Proxy Smart", logoUrl: null, website: null })
  })

  it("returns fallback for empty bundle", () => {
    const result = parseBrandBundle({})
    expect(result).toEqual({ name: "Proxy Smart", logoUrl: null, website: null })
  })

  it("returns fallback when entries is not an array", () => {
    const result = parseBrandBundle({ entry: "invalid" })
    expect(result).toEqual({ name: "Proxy Smart", logoUrl: null, website: null })
  })

  it("returns fallback when no Organization resource exists", () => {
    const result = parseBrandBundle({
      entry: [{ resource: { resourceType: "Patient", name: "Test" } }],
    })
    expect(result).toEqual({ name: "Proxy Smart", logoUrl: null, website: null })
  })

  it("extracts organization name", () => {
    const result = parseBrandBundle(makeBundle({ name: "Acme Health" }))
    expect(result.name).toBe("Acme Health")
  })

  it("falls back to default name when org has no name", () => {
    const result = parseBrandBundle(makeBundle({}))
    expect(result.name).toBe("Proxy Smart")
  })

  it("falls back to default name when org name is empty string", () => {
    const result = parseBrandBundle(makeBundle({ name: "" }))
    expect(result.name).toBe("Proxy Smart")
  })

  it("extracts logo URL from brand extension", () => {
    const result = parseBrandBundle(
      makeBundle({
        name: "Acme",
        extension: [
          {
            url: BRAND_EXT_URL,
            extension: [
              { url: "brandLogo", valueUrl: "https://acme.com/logo.png" },
            ],
          },
        ],
      }),
    )
    expect(result.logoUrl).toBe("https://acme.com/logo.png")
  })

  it("returns null logoUrl when brand extension has no logo", () => {
    const result = parseBrandBundle(
      makeBundle({
        name: "Acme",
        extension: [
          {
            url: BRAND_EXT_URL,
            extension: [{ url: "otherField", valueUrl: "https://other.com" }],
          },
        ],
      }),
    )
    expect(result.logoUrl).toBeNull()
  })

  it("returns null logoUrl when extension URL doesn't match", () => {
    const result = parseBrandBundle(
      makeBundle({
        name: "Acme",
        extension: [
          {
            url: "http://example.com/other",
            extension: [
              { url: "brandLogo", valueUrl: "https://acme.com/logo.png" },
            ],
          },
        ],
      }),
    )
    expect(result.logoUrl).toBeNull()
  })

  it("extracts website from telecom", () => {
    const result = parseBrandBundle(
      makeBundle({
        name: "Acme",
        telecom: [{ system: "url", value: "https://acme.com" }],
      }),
    )
    expect(result.website).toBe("https://acme.com")
  })

  it("returns null website when no url telecom exists", () => {
    const result = parseBrandBundle(
      makeBundle({
        name: "Acme",
        telecom: [{ system: "phone", value: "+1-555-0100" }],
      }),
    )
    expect(result.website).toBeNull()
  })

  it("extracts all fields from a complete bundle", () => {
    const result = parseBrandBundle(
      makeBundle({
        name: "Acme Health",
        extension: [
          {
            url: BRAND_EXT_URL,
            extension: [
              { url: "brandLogo", valueUrl: "https://acme.com/logo.svg" },
            ],
          },
        ],
        telecom: [
          { system: "phone", value: "+1-555-0100" },
          { system: "url", value: "https://acme.com" },
        ],
      }),
    )
    expect(result).toEqual({
      name: "Acme Health",
      logoUrl: "https://acme.com/logo.svg",
      website: "https://acme.com",
    })
  })
})
