import { describe, expect, it } from "bun:test"
import { readFileSync } from "node:fs"

/**
 * CONTRACT TEST for the safe-area utilities, not a snapshot.
 *
 * The rule worth enforcing is that a `-*` utility ADDS the inset to its spacing step
 * rather than replacing it. Written as a plain `env()` these read as working — the class
 * is applied, the bar moves — while silently dropping the designed padding, which is
 * invisible on every desktop because the inset is 0 there.
 */
const CSS = readFileSync(new URL("./theme.css", import.meta.url), "utf8")

/** The body of an `@utility <name> { … }` block, or null when it is not declared. */
function utilityBody(name: string): string | null {
  const header = '@utility ' + name + ' {'
  const start = CSS.indexOf(header)
  if (start === -1) return null
  const bodyStart = start + header.length
  const end = CSS.indexOf('}', bodyStart)
  return end === -1 ? null : CSS.slice(bodyStart, end)
}

const SIDES = { "pt-safe": "top", "pr-safe": "right", "pb-safe": "bottom", "pl-safe": "left" }

describe("safe-area utilities", () => {
  it.each(Object.entries(SIDES))("%s applies the %s inset", (name, side) => {
    expect(utilityBody(name)).toContain(`env(safe-area-inset-${side})`)
  })

  it.each(["px-safe", "py-safe"])("%s covers both of its sides", (name) => {
    const body = utilityBody(name) ?? ""
    expect(body.match(/env\(safe-area-inset-\w+\)/g) ?? []).toHaveLength(2)
  })

  it.each(["pt-safe-*", "pb-safe-*", "px-safe-*"])("%s adds the inset to a spacing step", (name) => {
    const body = utilityBody(name) ?? ""
    expect(body).toContain("--spacing(--value(integer))")
    for (const declaration of body.split(";").filter((d) => d.includes("padding"))) {
      expect(declaration).toMatch(/calc\(\s*--spacing\(--value\(integer\)\)\s*\+\s*env\(safe-area-inset-\w+\)\s*\)/)
    }
  })

  it("never gives an inset a non-zero fallback, which would pad devices that have none", () => {
    for (const [, fallback] of CSS.matchAll(/env\(safe-area-inset-\w+\s*,\s*([^)]+)\)/g)) {
      expect(fallback.trim()).toMatch(/^0(px|rem)?$/)
    }
  })
})
