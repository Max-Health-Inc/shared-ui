import { describe, expect, it } from "bun:test"
import { formatHumanName, formatHumanNames, humanNameText } from "./fhir-helpers"

describe("humanNameText", () => {
  it("is undefined for no name or a name with nothing usable", () => {
    expect(humanNameText(undefined)).toBeUndefined()
    expect(humanNameText({})).toBeUndefined()
    expect(humanNameText({ given: [" "], family: "  ", text: "   " })).toBeUndefined()
  })

  it("prefers text, the form FHIR defines for display", () => {
    expect(humanNameText({ text: "Johnny S", family: "Smith", given: ["John"] })).toBe("Johnny S")
  })

  it("composes prefix, given, family and suffix in order", () => {
    expect(humanNameText({ prefix: ["Prof.", "Dr."], given: ["Anna", "Maria"], family: "Müller", suffix: ["PhD"] })).toBe(
      "Prof. Dr. Anna Maria Müller PhD",
    )
  })

  it("skips blank parts instead of leaving double spaces", () => {
    expect(humanNameText({ given: ["", "Baby"], family: " Smith " })).toBe("Baby Smith")
  })
})

describe("formatHumanNames", () => {
  it("is undefined for no names", () => {
    expect(formatHumanNames(undefined)).toBeUndefined()
    expect(formatHumanNames([])).toBeUndefined()
  })

  it("prefers the official name over the first", () => {
    expect(
      formatHumanNames([
        { use: "nickname", given: ["Johnny"] },
        { use: "official", given: ["John"], family: "Smith" },
      ]),
    ).toBe("John Smith")
  })

  it("falls back to the first name without an official one", () => {
    expect(formatHumanNames([{ family: "Primary", given: ["First"] }, { family: "Maiden" }])).toBe("First Primary")
  })
})

describe("formatHumanName", () => {
  it("returns 'Unknown' when nothing formats", () => {
    expect(formatHumanName(undefined)).toBe("Unknown")
    expect(formatHumanName([])).toBe("Unknown")
    expect(formatHumanName([{ use: "official" }])).toBe("Unknown")
    expect(formatHumanName([{ text: "" }])).toBe("Unknown")
  })

  it("formats the display name of the list", () => {
    expect(formatHumanName([{ family: "Müller-Lüdenscheidt", given: ["Öztürk"], suffix: ["Jr."] }])).toBe(
      "Öztürk Müller-Lüdenscheidt Jr.",
    )
  })
})
