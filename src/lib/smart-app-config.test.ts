import { describe, expect, it } from "bun:test"
import { buildFhirBaseUrl } from "./smart-app-config"
import type { SmartAppConfig } from "./smart-app-config"

function makeConfig(overrides: Partial<SmartAppConfig> = {}): SmartAppConfig {
  return {
    proxyBase: "https://proxy.example.com",
    proxyPrefix: "proxy-smart-backend",
    fhirServerId: "hapi-fhir-server",
    fhirVersion: "R4",
    clientId: "test-client",
    redirectUri: "https://app.example.com/callback",
    scopes: "openid fhirUser",
    ...overrides,
  }
}

describe("buildFhirBaseUrl", () => {
  it("assembles the URL from config parts", () => {
    const url = buildFhirBaseUrl(makeConfig())
    expect(url).toBe(
      "https://proxy.example.com/proxy-smart-backend/hapi-fhir-server/R4",
    )
  })

  it("uses custom proxy prefix", () => {
    const url = buildFhirBaseUrl(makeConfig({ proxyPrefix: "custom-backend" }))
    expect(url).toBe(
      "https://proxy.example.com/custom-backend/hapi-fhir-server/R4",
    )
  })

  it("uses custom FHIR version", () => {
    const url = buildFhirBaseUrl(makeConfig({ fhirVersion: "R5" }))
    expect(url).toBe(
      "https://proxy.example.com/proxy-smart-backend/hapi-fhir-server/R5",
    )
  })

  it("handles trailing slash in proxyBase", () => {
    const url = buildFhirBaseUrl(makeConfig({ proxyBase: "https://proxy.example.com/" }))
    expect(url).toBe(
      "https://proxy.example.com//proxy-smart-backend/hapi-fhir-server/R4",
    )
  })
})
