import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test"
import { Window } from "happy-dom"
import { installDomGlobals } from "../testing/dom-globals"
import { act, createElement, useState } from "react"
import type { Root } from "react-dom/client"

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// Radix picks its layout-effect hook at import time, so the DOM must exist before the components load.
const window = new Window({ url: "https://app.test/" })
let restoreDom = installDomGlobals(window)

const { createRoot } = await import("react-dom/client")
const { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } = await import("./dropdown-menu")
const { Dialog, DialogContent, DialogDescription, DialogTitle } = await import("./dialog")

let root: Root

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
  window.document.body.removeAttribute("style")
})

afterAll(async () => {
  restoreDom()
  await window.happyDOM.close()
})

function MenuThatOpensADialog() {
  const [menuOpen, setMenuOpen] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  return createElement("div", null,
    createElement(DropdownMenu, { open: menuOpen, onOpenChange: setMenuOpen },
      createElement(DropdownMenuTrigger, null, "Actions"),
      createElement(DropdownMenuContent, null,
        createElement(DropdownMenuItem, { onSelect: () => setDialogOpen(true) }, "Edit"))),
    createElement(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen },
      createElement(DialogContent, null,
        createElement(DialogTitle, null, "Edit user"),
        createElement(DialogDescription, null, "Change the details"))))
}

const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })

function byText(text: string): HTMLElement {
  const match = [...window.document.querySelectorAll("*")].find((el) => el.textContent?.trim() === text && el.children.length === 0)
  if (!match) throw new Error(`nothing reads "${text}"`)
  return match as unknown as HTMLElement
}

describe("DropdownMenu", () => {
  it("leaves the page clickable after a dialog opened from a menu item closes", async () => {
    await act(async () => root.render(createElement(MenuThatOpensADialog)))
    await settle()

    await act(async () => byText("Edit").click())
    await settle()
    expect(window.document.querySelector("[role=dialog]")).not.toBeNull()

    await act(async () => byText("Close").click())
    await settle()

    expect(window.document.querySelector("[role=dialog]")).toBeNull()
    expect(window.document.body.style.pointerEvents).not.toBe("none")
  })

  it("does not lock the page while the menu is open", async () => {
    await act(async () => root.render(createElement(MenuThatOpensADialog)))
    await settle()

    expect(window.document.querySelector("[role=menu]")).not.toBeNull()
    expect(window.document.body.style.pointerEvents).not.toBe("none")
  })
})
