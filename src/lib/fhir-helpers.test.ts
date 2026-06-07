import { describe, expect, it } from "bun:test"
import { formatHumanName, formatFhirDate } from "./fhir-helpers"

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

  it("trims leading/trailing whitespace from result", () => {
    // given=[" "] yields parts = [" "], joined.trim() = "" → falls through to Unknown
    const result = formatHumanName([{ given: [" "] }])
    expect(result).toBe("Unknown")
  })

  it("handles whitespace-only family name", () => {
    const result = formatHumanName([{ family: "  " }])
    expect(result).toBe("Unknown")
  })

  it("handles whitespace-only text fallback", () => {
    const result = formatHumanName([{ text: "   " }])
    expect(result).toBe("Unknown")
  })

  it("handles unicode characters in names", () => {
    expect(
      formatHumanName([{ family: "Müller-Lüdenscheidt", given: ["Öztürk"] }]),
    ).toBe("Öztürk Müller-Lüdenscheidt")
  })

  it("handles very long names", () => {
    const longName = "A".repeat(500)
    const result = formatHumanName([{ family: longName }])
    expect(result).toBe(longName)
  })
})

describe("formatFhirDate", () => {
  it("returns '' for undefined input", () => {
    expect(formatFhirDate(undefined)).toBe("")
  })

  it("returns '' for null input", () => {
    expect(formatFhirDate(null as unknown as undefined)).toBe("")
  })

  it("returns '' for empty string", () => {
    expect(formatFhirDate("")).toBe("")
  })

  it("returns '' for whitespace-only string", () => {
    expect(formatFhirDate("   ")).toBe("")
  })

  it("returns '' for unparseable input", () => {
    expect(formatFhirDate("not-a-date")).toBe("")
  })

  it("formats a full YYYY-MM-DD date", () => {
    expect(formatFhirDate("2026-06-07")).toBe("Jun 7, 2026")
  })

  it("does not shift the day for a date-only string regardless of timezone", () => {
    // new Date("2026-06-07") would be UTC midnight and could render Jun 6 in
    // negative-offset timezones; the local-parts construction must avoid that.
    expect(formatFhirDate("2026-06-07")).toBe("Jun 7, 2026")
  })

  it("ignores a trailing time component on a dateTime", () => {
    expect(formatFhirDate("2026-06-07T13:45:00Z")).toBe("Jun 7, 2026")
  })

  it("formats a year+month string", () => {
    expect(formatFhirDate("2026-06")).toBe("Jun 2026")
  })

  it("formats a year-only string", () => {
    expect(formatFhirDate("2026")).toBe("2026")
  })

  it("formats a Date instance", () => {
    expect(formatFhirDate(new Date(2026, 5, 7))).toBe("Jun 7, 2026")
  })

  it("returns '' for an invalid Date instance", () => {
    expect(formatFhirDate(new Date(Number.NaN))).toBe("")
  })

  it("trims surrounding whitespace before parsing", () => {
    expect(formatFhirDate("  2026-06-07  ")).toBe("Jun 7, 2026")
  })

  it("returns '' when the leading characters are not a year", () => {
    expect(formatFhirDate("June 7 2026")).toBe("")
  })
})
