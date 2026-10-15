import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { CopyButton } from "./copy-button"

describe("CopyButton", () => {
  it("labels itself Copy by default, or with the label it is given", () => {
    expect(renderToStaticMarkup(createElement(CopyButton, { value: "x" }))).toContain("<span>Copy</span>")
    expect(renderToStaticMarkup(createElement(CopyButton, { value: "x", label: "Copy link" }))).toContain("<span>Copy link</span>")
  })

  it("names an icon-only button for assistive technology", () => {
    const html = renderToStaticMarkup(createElement(CopyButton, { value: "x", iconOnly: true, label: "Copy hash" }))
    expect(html).toContain('aria-label="Copy hash"')
    expect(html).not.toContain("<span>")
  })

  it("never submits a form it sits in", () => {
    expect(renderToStaticMarkup(createElement(CopyButton, { value: "x" }))).toContain('type="button"')
  })
})
