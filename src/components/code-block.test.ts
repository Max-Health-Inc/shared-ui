import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { CodeBlock } from "./code-block"
import { UI_TEXT } from "../lib/ui-text-catalog"

describe("CodeBlock", () => {
  it("shows the code as text, under its title", () => {
    const html = renderToStaticMarkup(createElement(CodeBlock, { code: "fetch('<url>')", title: "launch.ts", language: "ts" }))
    expect(html).toContain("fetch(&#x27;&lt;url&gt;&#x27;)")
    expect(html).toContain("launch.ts")
    expect(html).toContain('class="language-ts"')
    expect(html).toContain("Copy")
  })

  it("labels itself with the language when it has no title", () => {
    expect(renderToStaticMarkup(createElement(CodeBlock, { code: "x", language: "bash" }))).toContain("bash")
  })

  it("has its strings in the catalogue", () => {
    expect(UI_TEXT["Copy"]).toBeDefined()
    expect(UI_TEXT["Copied"]).toBeDefined()
  })
})
