import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Window } from "happy-dom"
import { NativeSelect } from "./native-select"

function render(props: Parameters<typeof NativeSelect>[0]) {
  const doc = new Window().document
  doc.body.innerHTML = renderToStaticMarkup(createElement(NativeSelect, props, createElement("option", null, "a")))
  const select = doc.querySelector("select")
  return { wrapper: select?.parentElement, select }
}

describe("NativeSelect", () => {
  it("fills its container by default", () => {
    expect(render({}).wrapper?.className.split(" ")).toContain("w-full")
  })

  it("lets the layout size the wrapper, so it can sit beside a growing field", () => {
    const { wrapper, select } = render({ containerClassName: "w-auto shrink-0", className: "font-mono" })
    const wrapperClasses = wrapper?.className.split(" ") ?? []
    expect(wrapperClasses).toEqual(expect.arrayContaining(["relative", "w-auto", "shrink-0"]))
    expect(wrapperClasses).not.toContain("w-full")
    expect(select?.className.split(" ")).toContain("font-mono")
    expect(select?.className.split(" ")).not.toContain("shrink-0")
  })
})
