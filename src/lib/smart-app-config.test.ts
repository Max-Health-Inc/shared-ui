import { describe, expect, it } from "bun:test"
import { appBaseUrl, buildFhirBaseUrl, createSmartAppConfig, createSmartAuth } from "./smart-app-config"
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
      "https://proxy.example.com/proxy-smart-backend/hapi-fhir-server/R4",
    )
  })

  it("handles multiple trailing slashes in proxyBase", () => {
    const url = buildFhirBaseUrl(makeConfig({ proxyBase: "https://proxy.example.com///" }))
    expect(url).toBe(
      "https://proxy.example.com/proxy-smart-backend/hapi-fhir-server/R4",
    )
  })

  it("does not produce double slashes with empty proxyPrefix", () => {
    const url = buildFhirBaseUrl(makeConfig({ proxyPrefix: "" }))
    expect(url).not.toContain("//hapi")
  })

  it("does not produce double slashes with empty fhirServerId", () => {
    const url = buildFhirBaseUrl(makeConfig({ fhirServerId: "" }))
    expect(url).not.toContain("//R4")
  })

  it("does not produce double slashes with empty fhirVersion", () => {
    const url = buildFhirBaseUrl(makeConfig({ fhirVersion: "" }))
    expect(url).not.toMatch(/\/$/)
  })

  it("does not produce a bare-slash URL with empty proxyBase (non-browser)", () => {
    const url = buildFhirBaseUrl(makeConfig({ proxyBase: "" }))
    // Should not start with / when there's no origin — caller should handle
    // At minimum: must not start with //
    expect(url).not.toMatch(/^\/\//)
  })
})

describe("appBaseUrl", () => {
  it("always ends in a slash, so callers can append a bare path", () => {
    expect(appBaseUrl().endsWith("/")).toBe(true)
  })

  it("never yields an 'undefined' segment when no base is configured", () => {
    expect(appBaseUrl()).not.toContain("undefined")
  })

  it("is the prefix the callback and post-logout URLs are built from", () => {
    const cfg = createSmartAppConfig({ clientId: "x", scopes: "openid" })
    expect(cfg.redirectUri).toBe(`${appBaseUrl()}callback`)
  })
})

describe("createSmartAppConfig", () => {
  it("does not crash in non-browser environments", () => {
    expect(() =>
      createSmartAppConfig({ clientId: "test", scopes: "openid" }),
    ).not.toThrow()
  })

  it("uses defaults for clientId and scopes", () => {
    const cfg = createSmartAppConfig({ clientId: "my-app", scopes: "openid fhirUser" })
    expect(cfg.clientId).toBe("my-app")
    expect(cfg.scopes).toBe("openid fhirUser")
  })

  it("falls back to default proxyPrefix", () => {
    const cfg = createSmartAppConfig({ clientId: "x", scopes: "openid" })
    expect(cfg.proxyPrefix).toBe("proxy-smart-backend")
  })

  it("falls back to default fhirServerId and fhirVersion", () => {
    const cfg = createSmartAppConfig({ clientId: "x", scopes: "openid" })
    expect(cfg.fhirServerId).toBe("hapi-fhir-server")
    expect(cfg.fhirVersion).toBe("R4")
  })
})

describe("createSmartAuth", () => {
  it("instantiates the SmartAuth class with correct options", () => {
    let capturedOpts: Record<string, string> | undefined
    class MockSmartAuth {
      constructor(opts: Record<string, string>) {
        capturedOpts = opts
      }
    }
    const config = makeConfig()
    const result = createSmartAuth({
      config,
      SmartAuth: MockSmartAuth,
      storagePrefix: "test_",
    })
    expect(result.smartAuth).toBeInstanceOf(MockSmartAuth)
    expect(result.fhirBaseUrl).toBe(
      "https://proxy.example.com/proxy-smart-backend/hapi-fhir-server/R4",
    )
    expect(capturedOpts?.clientId).toBe("test-client")
    expect(capturedOpts?.storagePrefix).toBe("test_")
    expect(capturedOpts?.scopes).toBe("openid fhirUser")
  })

  it("does not crash in non-browser environments", () => {
    class MockSmartAuth {
      constructor(_opts: Record<string, string>) { /* noop */ }
    }
    expect(() =>
      createSmartAuth({
        config: makeConfig(),
        SmartAuth: MockSmartAuth,
        storagePrefix: "test_",
      }),
    ).not.toThrow()
  })
})
