import { describe, expect, it } from "bun:test"
import { formatHumanName } from "./fhir-helpers"

describe("formatHumanName", () => {
  it("returns 'Unknown' for undefined input", () => {
    expect(formatHumanName(undefined)).toBe("Unknown")
  })

  it("returns 'Unknown' for empty array", () => {
    expect(formatHumanName([])).toBe("Unknown")
  })

  it("formats family + given names", () => {
    expect(
      formatHumanName([{ family: "Smith", given: ["John"] }]),
    ).toBe("John Smith")
  })

  it("formats multiple given names", () => {
    expect(
      formatHumanName([{ family: "Doe", given: ["Jane", "Marie"] }]),
    ).toBe("Jane Marie Doe")
  })

  it("includes prefix", () => {
    expect(
      formatHumanName([{ prefix: ["Dr."], family: "Smith", given: ["John"] }]),
    ).toBe("Dr. John Smith")
  })

  it("includes multiple prefixes", () => {
    expect(
      formatHumanName([{ prefix: ["Prof.", "Dr."], given: ["Anna"], family: "Müller" }]),
    ).toBe("Prof. Dr. Anna Müller")
  })

  it("falls back to text when no structured parts exist", () => {
    expect(
      formatHumanName([{ text: "Dr. John Smith" }]),
    ).toBe("Dr. John Smith")
  })

  it("returns 'Unknown' when name entry has no usable fields", () => {
    expect(formatHumanName([{}])).toBe("Unknown")
  })

  it("returns 'Unknown' when text is also undefined", () => {
    expect(formatHumanName([{ use: "official" }])).toBe("Unknown")
  })

  it("returns 'Unknown' when text is empty string", () => {
    expect(formatHumanName([{ text: "" }])).toBe("Unknown")
  })

  it("ignores suffix (not implemented in current logic)", () => {
    expect(
      formatHumanName([{ family: "Smith", given: ["John"], suffix: ["Jr."] }]),
    ).toBe("John Smith")
  })

  it("uses only the first name entry", () => {
    expect(
      formatHumanName([
        { family: "Primary", given: ["First"] },
        { family: "Maiden", given: ["Other"] },
      ]),
    ).toBe("First Primary")
  })

  it("handles given name only (no family)", () => {
    expect(formatHumanName([{ given: ["Baby"] }])).toBe("Baby")
  })

  it("handles family name only (no given)", () => {
    expect(formatHumanName([{ family: "Smith" }])).toBe("Smith")
  })

  it("prefers structured parts over text", () => {
    expect(
      formatHumanName([{ family: "Smith", given: ["John"], text: "Johnny S" }]),
    ).toBe("John Smith")
  })

  it("handles empty given/prefix arrays", () => {
    expect(
      formatHumanName([{ family: "Smith", given: [], prefix: [] }]),
    ).toBe("Smith")
  })
})
