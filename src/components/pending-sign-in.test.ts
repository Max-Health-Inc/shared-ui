import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test"
import { Window } from "happy-dom"
import { act, createElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { installDomGlobals } from "../testing/dom-globals"
import { SignInLanding, type SignInLandingProps } from "./sign-in-landing"

const win = new Window({ url: "https://app.example.com/" })
let restoreDom = installDomGlobals(win)
Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true)
beforeAll(() => {
  restoreDom()
  restoreDom = installDomGlobals(win)
})
afterAll(() => {
  restoreDom()
})

const Icon = () => null
let root: Root
let container: HTMLElement
const reported: unknown[] = []
const realReportError = globalThis.reportError

async function render(props: Partial<SignInLandingProps>) {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => { root.render(createElement(SignInLanding, { title: "Viewer", description: "Look at scans", icon: Icon, ...props })) })
}

function loginControl(): HTMLElement {
  const control = container.querySelector<HTMLElement>("[data-slot=button]")
  if (!control) throw new Error("no sign-in control")
  return control
}

function isPending(control: HTMLElement): boolean {
  return control.getAttribute("aria-busy") === "true"
}

async function click(control: HTMLElement) {
  await act(async () => {
    control.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
    await Promise.resolve()
  })
}

async function restoreFromBackForwardCache() {
  const event = new win.Event("pageshow")
  Object.defineProperty(event, "persisted", { value: true })
  await act(async () => { win.dispatchEvent(event) })
}

describe("SignInLanding pending sign-in", () => {
  beforeEach(() => {
    reported.length = 0
    globalThis.reportError = (error: unknown) => { reported.push(error) }
  })

  afterEach(async () => {
    await act(async () => { root.unmount() })
    container.remove()
    globalThis.reportError = realReportError
  })

  it("turns busy and disabled on click while the redirect starts", async () => {
    let calls = 0
    await render({ onLogin: () => { calls += 1 } })
    const button = loginControl()
    expect(isPending(button)).toBe(false)

    await click(button)

    expect(calls).toBe(1)
    expect(isPending(button)).toBe(true)
    expect(button.hasAttribute("disabled")).toBe(true)
    expect(button.querySelector("[data-slot=spinner]")).not.toBeNull()
  })

  it("keeps idle and pending labels in one cell so the width holds", async () => {
    await render({ onLogin: () => {} })
    const cell = loginControl().querySelector(".grid")
    expect(cell?.children).toHaveLength(2)
    expect(cell?.children[1]?.className).toContain("invisible")

    await click(loginControl())

    expect(cell?.children[0]?.className).toContain("invisible")
    expect(cell?.children[1]?.className).not.toContain("invisible")
  })

  it("becomes usable again when the sign-in rejects, and reports the error", async () => {
    const failure = new Error("discovery failed")
    await render({ onLogin: () => Promise.reject(failure) })

    await click(loginControl())
    await act(async () => { await Promise.resolve() })

    expect(isPending(loginControl())).toBe(false)
    expect(loginControl().hasAttribute("disabled")).toBe(false)
    expect(reported).toEqual([failure])
  })

  it("resets when the browser restores the page from the back/forward cache", async () => {
    await render({ onLogin: () => new Promise<void>(() => {}) })
    await click(loginControl())
    expect(isPending(loginControl())).toBe(true)

    await restoreFromBackForwardCache()

    expect(isPending(loginControl())).toBe(false)
  })

  it("marks a sign-in link pending and lets it navigate", async () => {
    await render({ loginHref: "/api/auth/login" })
    const link = loginControl()
    expect(link.tagName).toBe("A")
    let prevented = true
    win.addEventListener("click", (event) => { prevented = event.defaultPrevented }, { once: true })

    await click(link)

    expect(prevented).toBe(false)
    expect(isPending(link)).toBe(true)
    expect(link.getAttribute("aria-disabled")).toBe("true")

    await restoreFromBackForwardCache()

    expect(isPending(link)).toBe(false)
    expect(link.hasAttribute("aria-disabled")).toBe(false)
  })

  it("leaves a link idle on a click that opens a new tab", async () => {
    await render({ loginHref: "/api/auth/login" })
    await act(async () => {
      loginControl().dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ctrlKey: true }))
    })
    expect(isPending(loginControl())).toBe(false)
  })

  it("follows the pending state its owner passes in", async () => {
    let calls = 0
    await render({ onLogin: () => { calls += 1 }, loginPending: true })
    expect(isPending(loginControl())).toBe(true)

    await act(async () => { root.render(createElement(SignInLanding, { title: "Viewer", description: "d", icon: Icon, onLogin: () => { calls += 1 }, loginPending: false })) })
    await click(loginControl())

    expect(calls).toBe(1)
    expect(isPending(loginControl())).toBe(false)
  })
})
