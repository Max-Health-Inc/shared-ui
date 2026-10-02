import { describe, expect, it } from "bun:test"
import { Window } from "happy-dom"
import { createElement, type ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { FormField } from "./form"
import { Input } from "./input"
import { NativeSelect } from "./native-select"
import { Textarea } from "./textarea"

type HappyDocument = Window["document"]

function field(control: ReactElement, props: Partial<Parameters<typeof FormField>[0]> = {}): HappyDocument {
  const html = renderToStaticMarkup(createElement(FormField, { label: "Email", ...props }, control))
  const doc = new Window().document
  doc.body.innerHTML = html
  return doc
}

function controlOf(doc: HappyDocument) {
  const control = doc.querySelector("input, textarea, select")
  if (!control) throw new Error("no control rendered")
  return control
}

describe("FormField", () => {
  for (const [name, control] of [
    ["Input", createElement(Input)],
    ["Textarea", createElement(Textarea)],
    ["NativeSelect", createElement(NativeSelect, null, createElement("option", null, "a"))],
  ] as const) {
    it(`labels its ${name}`, () => {
      const doc = field(control)
      const id = controlOf(doc).getAttribute("id")
      expect(id).toBeTruthy()
      expect(doc.querySelector("label")?.getAttribute("for")).toBe(id)
    })
  }

  it("describes the control with its description", () => {
    const doc = field(createElement(Input), { description: "We never share it" })
    const describedBy = controlOf(doc).getAttribute("aria-describedby")
    expect(describedBy && doc.getElementById(describedBy)?.textContent).toBe("We never share it")
  })

  it("marks the control invalid and points it at the error", () => {
    const doc = field(createElement(Input), { description: "hint", error: "Required" })
    const control = controlOf(doc)
    expect(control.getAttribute("aria-invalid")).toBe("true")
    const describedBy = control.getAttribute("aria-describedby")
    expect(describedBy && doc.getElementById(describedBy)?.textContent).toBe("Required")
  })

  it("passes required through to the control", () => {
    expect(controlOf(field(createElement(Input), { required: true })).hasAttribute("required")).toBe(true)
  })

  it("lets the control's own props win", () => {
    const doc = field(createElement(Input, { "aria-describedby": "extra" }), { description: "hint" })
    expect(controlOf(doc).getAttribute("aria-describedby")?.split(" ")).toContain("extra")
  })

  it("leaves a control outside a field untouched", () => {
    const html = renderToStaticMarkup(createElement(Input))
    expect(html).not.toContain("id=")
    expect(html).not.toContain("aria-describedby")
  })
})
