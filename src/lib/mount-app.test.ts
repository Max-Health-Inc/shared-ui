import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { Window } from "happy-dom"
import { act, createElement } from "react"
import type { Root } from "react-dom/client"
import { installDomGlobals } from "../testing/dom-globals"
import { mountApp } from "./mount-app"

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true)

const window = new Window({ url: "https://app.test/" })
let restoreDom: () => void = () => {}

beforeEach(() => {
  restoreDom = installDomGlobals(window)
  document.body.innerHTML = ""
})

afterEach(() => {
  restoreDom()
})

describe("mountApp", () => {
  it("renders the app into #root", () => {
    document.body.innerHTML = '<div id="root"></div>'
    let root: Root | undefined
    act(() => { root = mountApp(createElement("p", null, "hello")) })
    expect(document.getElementById("root")?.textContent).toBe("hello")
    act(() => { root?.unmount() })
  })

  it("renders into another element when asked", () => {
    document.body.innerHTML = '<main id="app"></main>'
    let root: Root | undefined
    act(() => { root = mountApp(createElement("p", null, "there"), { rootId: "app" }) })
    expect(document.getElementById("app")?.textContent).toBe("there")
    act(() => { root?.unmount() })
  })

  it("names the missing element", () => {
    expect(() => mountApp(createElement("p"))).toThrow("index.html has no #root")
  })
})
