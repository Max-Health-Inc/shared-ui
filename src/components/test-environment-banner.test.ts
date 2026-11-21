import { afterEach, describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Activity } from "lucide-react"
import { AppHeader } from "./app-header"
import { TestEnvironmentBanner } from "./test-environment-banner"
import { createSmartAppConfig, isTestStage, setDeploymentStage } from "../lib/smart-app-config"

const BANNER = 'data-slot="test-environment-banner"'

const header = (props: Partial<Parameters<typeof AppHeader>[0]> = {}) =>
  renderToStaticMarkup(createElement(AppHeader, { title: "Viewer", icon: Activity, homeUrl: false, installLabel: false, ...props }))

afterEach(() => setDeploymentStage(undefined))

describe("isTestStage", () => {
  it("reads beta from either the release channel or the deployment environment", () => {
    expect(isTestStage("beta")).toBe(true)
    expect(isTestStage(" Beta ")).toBe(true)
  })

  it("never treats production, a release, a local build or a missing stage as a test server", () => {
    for (const stage of ["production", "RELEASE", "dev", "", undefined]) expect(isTestStage(stage)).toBe(false)
  })
})

describe("TestEnvironmentBanner", () => {
  it("announces itself as a status on a beta deployment", () => {
    const html = renderToStaticMarkup(createElement(TestEnvironmentBanner, { stage: "beta" }))
    expect(html).toContain(BANNER)
    expect(html).toContain('role="status"')
  })

  it("renders nothing in production", () => {
    expect(renderToStaticMarkup(createElement(TestEnvironmentBanner, { stage: "RELEASE" }))).toBe("")
    expect(renderToStaticMarkup(createElement(TestEnvironmentBanner, { stage: "production" }))).toBe("")
  })

  it("prefers the app's translation", () => {
    const html = renderToStaticMarkup(createElement(TestEnvironmentBanner, { stage: "beta", t: (key) => (key === "Test server" ? "TEST" : key) }))
    expect(html).toContain("TEST")
  })
})

describe("AppHeader on each stage", () => {
  it("carries the banner when the app was configured from a beta deploy", () => {
    createSmartAppConfig({ clientId: "app", scopes: "openid", env: { VITE_RELEASE_CHANNEL: "beta" } })
    expect(header()).toContain(BANNER)
  })

  it("leaves it out for a production build", () => {
    createSmartAppConfig({ clientId: "app", scopes: "openid", env: { VITE_RELEASE_CHANNEL: "RELEASE" } })
    expect(header()).not.toContain(BANNER)
  })

  it("lets an app that learns its stage at runtime pass it in", () => {
    expect(header({ stage: "beta" })).toContain(BANNER)
    setDeploymentStage("beta")
    expect(header({ stage: "production" })).not.toContain(BANNER)
  })
})
