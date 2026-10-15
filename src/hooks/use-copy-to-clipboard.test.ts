import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { useCopyToClipboard } from "./use-copy-to-clipboard"

describe("useCopyToClipboard", () => {
  it("starts out not copied", () => {
    let state: ReturnType<typeof useCopyToClipboard> | undefined
    const Probe = () => {
      state = useCopyToClipboard()
      return null
    }
    renderToStaticMarkup(createElement(Probe))
    expect(state?.copied).toBe(false)
  })

  it("reports a failed copy where there is no clipboard", async () => {
    let copy: ((text: string) => Promise<boolean>) | undefined
    const Probe = () => {
      copy = useCopyToClipboard().copy
      return null
    }
    renderToStaticMarkup(createElement(Probe))
    const original = globalThis.navigator
    Object.defineProperty(globalThis, "navigator", { value: {}, configurable: true })
    try {
      expect(await copy?.("x")).toBe(false)
    } finally {
      Object.defineProperty(globalThis, "navigator", { value: original, configurable: true })
    }
  })
})
