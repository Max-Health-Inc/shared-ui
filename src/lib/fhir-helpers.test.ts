import { describe, expect, it } from "bun:test"
import { conceptLabel, conceptName, formatHumanName, formatHumanNames, humanNameText } from "./fhir-helpers"

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

describe("conceptName", () => {
  const coded = { coding: [{ system: "http://snomed.info/sct", code: "38341003", display: "Hypertensive disorder" }] }

  it("prefers the text a person gave the concept over the coded display", () => {
    expect(conceptName({ ...coded, text: "High blood pressure" })).toBe("High blood pressure")
  })

  it("falls back to the first coding's display", () => {
    expect(conceptName(coded)).toBe("Hypertensive disorder")
    expect(conceptName({ ...coded, text: "  " })).toBe("Hypertensive disorder")
  })

  it("takes the first coding that has a display, as Blue Button v3 puts it on the second", () => {
    expect(conceptName({ coding: [{ system: "https://bluebutton.cms.gov/resources/codesystem/eob-type", code: "CARRIER" }, { code: "professional", display: "Professional" }] })).toBe("Professional")
  })

  it("is undefined for a concept with no name, or for no concept", () => {
    expect(conceptName({ coding: [{ code: "38341003" }] })).toBeUndefined()
    expect(conceptName({ coding: "not a list", text: 7 })).toBeUndefined()
    expect(conceptName(undefined)).toBeUndefined()
    expect(conceptName("Hypertension")).toBeUndefined()
  })
})

describe("conceptLabel", () => {
  it("names the concept like conceptName", () => {
    expect(conceptLabel({ text: "Hives", coding: [{ code: "126485001", display: "Urticaria" }] })).toBe("Hives")
  })

  it("falls back to the bare code when the concept has no name", () => {
    expect(conceptLabel({ coding: [{ system: "http://loinc.org", code: "8867-4" }] })).toBe("8867-4")
  })

  it("is undefined when there is nothing to show", () => {
    expect(conceptLabel({ coding: [] })).toBeUndefined()
    expect(conceptLabel(null)).toBeUndefined()
  })
})
