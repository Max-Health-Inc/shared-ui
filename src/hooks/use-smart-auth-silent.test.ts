import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { Window } from "happy-dom"
import { act, createElement } from "react"
import { createRoot, type Root } from "react-dom/client"

const win = new Window({ url: "https://app.example.com/?StudyInstanceUID=1.2.3" })
Object.assign(globalThis, { window: win, document: win.document, sessionStorage: win.sessionStorage })
Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true)

const { isSilentSignInRefusal, useSmartAuth } = await import("./use-smart-auth")
type Options = Parameters<typeof useSmartAuth>[0]
type Result = ReturnType<typeof useSmartAuth>

interface FakeAuth {
  authorizeCalls: Array<{ prompt?: string } | undefined>
  token: boolean
  expired: boolean
  refreshes: boolean
}

function fakeSmartAuth(state: FakeAuth): Options["smartAuth"] {
  return {
    handleCallback: async () => ({}),
    isAuthenticated: () => state.token,
    isTokenExpired: () => state.expired,
    refreshAccessToken: async () => (state.refreshes ? {} : null),
    clearToken: () => { state.token = false },
    authorize: async (options) => { state.authorizeCalls.push(options) },
    logout: () => {},
  }
}

let root: Root
let latest: Result | null = null

function Probe(props: Options) {
  latest = useSmartAuth(props)
  return null
}

async function render(props: Options) {
  const container = document.createElement("div")
  root = createRoot(container)
  await act(async () => { root.render(createElement(Probe, props)) })
  await act(async () => { await Promise.resolve() })
}

function goTo(url: string) {
  win.happyDOM.setURL(url)
}

describe("silent sign-in", () => {
  let auth: FakeAuth

  beforeEach(() => {
    win.sessionStorage.clear()
    goTo("https://app.example.com/?StudyInstanceUID=1.2.3")
    auth = { authorizeCalls: [], token: false, expired: false, refreshes: false }
    latest = null
  })

  afterEach(async () => {
    await act(async () => { root.unmount() })
  })

  it("asks the identity provider without interaction before showing sign-in", async () => {
    await render({ smartAuth: fakeSmartAuth(auth), silentSignIn: true })
    expect(auth.authorizeCalls).toEqual([{ prompt: "none" }])
    expect(latest?.state).toBe("loading")
  })

  it("shows the ordinary sign-in when the provider needs the user, and keeps the deep link", async () => {
    await render({ smartAuth: fakeSmartAuth(auth), silentSignIn: true })
    await act(async () => { root.unmount() })

    goTo("https://app.example.com/callback?error=login_required&state=s")
    await render({ smartAuth: fakeSmartAuth(auth), silentSignIn: true })

    expect(latest?.state).toBe("unauthenticated")
    expect(latest?.error).toBeNull()
    expect(auth.authorizeCalls).toHaveLength(1)
    expect(`${win.location.pathname}${win.location.search}`).toBe("/?StudyInstanceUID=1.2.3")
  })

  it("tries silently once per browser session, so a refusal never loops", async () => {
    win.sessionStorage.setItem("__smart_silent_attempted__", "1")
    await render({ smartAuth: fakeSmartAuth(auth), silentSignIn: true })
    expect(auth.authorizeCalls).toHaveLength(0)
    expect(latest?.state).toBe("unauthenticated")
  })

  it("tries silently when a stored session can no longer be refreshed", async () => {
    auth.token = true
    auth.expired = true
    await render({ smartAuth: fakeSmartAuth(auth), silentSignIn: true })
    expect(auth.authorizeCalls).toEqual([{ prompt: "none" }])
  })

  it("leaves apps that did not opt in on their sign-in page", async () => {
    await render({ smartAuth: fakeSmartAuth(auth) })
    expect(auth.authorizeCalls).toHaveLength(0)
    expect(latest?.state).toBe("unauthenticated")
  })
})

describe("isSilentSignInRefusal", () => {
  it("recognizes the errors a prompt=none request can come back with", () => {
    expect(isSilentSignInRefusal("?error=login_required")).toBe(true)
    expect(isSilentSignInRefusal("?error=interaction_required&state=x")).toBe(true)
    expect(isSilentSignInRefusal("?error=access_denied")).toBe(false)
    expect(isSilentSignInRefusal("?code=abc")).toBe(false)
  })
})
