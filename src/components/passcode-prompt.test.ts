import { describe, expect, it } from "bun:test"
import { Window } from "happy-dom"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { PasscodePrompt } from "./passcode-prompt"

function render(label?: string) {
  const doc = new Window().document
  doc.body.innerHTML = renderToStaticMarkup(createElement(PasscodePrompt, { label, description: "desc", onSubmit: () => {} }))
  return doc
}

describe("PasscodePrompt", () => {
  it("asks for a masked passcode and cannot submit an empty one", () => {
    const doc = render()
    expect(doc.querySelector("input")?.getAttribute("type")).toBe("password")
    expect(doc.querySelector("button[type=submit]")?.hasAttribute("disabled")).toBe(true)
  })

  it("names the protected link only when it has a label", () => {
    expect(render("Knee MRI").body.textContent).toContain("Knee MRI")
    expect(render().querySelectorAll("p")).toHaveLength(1)
  })
})
