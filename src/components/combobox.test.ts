import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test"
import { Window } from "happy-dom"
import { installDomGlobals } from "../testing/dom-globals"
import { act, createElement } from "react"
import type { Root } from "react-dom/client"

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const window = new Window({ url: "https://app.test/" })
let restoreDom = installDomGlobals(window)

const { createRoot } = await import("react-dom/client")
const { Combobox } = await import("./combobox")

let root: Root

function usePointer(fine: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (media: string) => ({
      media,
      matches: media === "(pointer: fine)" ? fine : false,
      addEventListener() {},
      removeEventListener() {},
    }),
  })
}

beforeAll(() => {
  restoreDom()
  restoreDom = installDomGlobals(window)
})

beforeEach(() => {
  const host = window.document.createElement("div")
  window.document.body.appendChild(host)
  root = createRoot(host as unknown as HTMLElement)
})

afterEach(async () => {
  await act(async () => root.unmount())
  window.document.body.innerHTML = ""
})

afterAll(async () => {
  restoreDom()
  await window.happyDOM.close()
})

const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })

async function openCombobox() {
  await act(async () =>
    root.render(createElement(Combobox, {
      options: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }],
      searchPlaceholder: "Search",
    })))
  await settle()
  const trigger = window.document.querySelector("[role=combobox]")
  if (!trigger) throw new Error("no combobox trigger")
  await act(async () => (trigger as unknown as HTMLElement).click())
  await settle()
  const search = window.document.querySelector("input[placeholder=Search]")
  if (!search) throw new Error("the list did not open")
  return search
}

describe("Combobox", () => {
  it("does not raise the on-screen keyboard when it opens on a touch screen", async () => {
    usePointer(false)
    const search = await openCombobox()
    expect(window.document.activeElement).not.toBe(search)
  })

  it("puts the cursor in the search when it opens with a mouse or trackpad", async () => {
    usePointer(true)
    const search = await openCombobox()
    expect(window.document.activeElement).toBe(search)
  })

  it("keeps its search text at 16px on small screens so phones do not zoom in", async () => {
    usePointer(false)
    const search = await openCombobox()
    expect(search.className).toContain("text-[16px]")
  })
})
