import { describe, expect, it } from "bun:test"
import { conceptLabel, conceptName, formatHumanName, formatHumanNames, humanNameText, isPractitionerReference, medicalRecordNumber, memberId, parseFhirReference, referenceId } from "./fhir-helpers"

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

describe("medicalRecordNumber", () => {
  const typed = (code: string, value: string, use?: string) => ({
    use,
    type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0203", code }] },
    value,
  })

  it("reads the identifier typed MR, wherever it sits in the list", () => {
    const identifiers = [
      { system: "https://github.com/synthetichealth/synthea", value: "8c5f1e7a-uuid" },
      typed("SS", "999-12-3456"),
      typed("MR", "MRN-4711"),
    ]
    expect(medicalRecordNumber(identifiers)).toBe("MRN-4711")
  })

  it("never shows another identifier as the MRN", () => {
    expect(medicalRecordNumber([typed("SS", "999-12-3456"), { system: "urn:party-id", value: "42" }])).toBeUndefined()
    expect(medicalRecordNumber(undefined)).toBeUndefined()
  })

  it("skips a retired MRN for the current one", () => {
    expect(medicalRecordNumber([typed("MR", "OLD-1", "old"), typed("MR", "NEW-2")])).toBe("NEW-2")
  })

  it("ignores an MR code from another code system", () => {
    expect(medicalRecordNumber([{ type: { coding: [{ system: "urn:local", code: "MR" }] }, value: "x" }])).toBeUndefined()
  })
})

describe("memberId", () => {
  const v20203 = "http://terminology.hl7.org/CodeSystem/v2-0203"

  it("reads the MB-typed identifier of a CARIN Blue Button Coverage, not the first one", () => {
    const coverage = {
      resourceType: "Coverage",
      status: "active",
      identifier: [
        { system: "https://bluebutton.cms.gov/resources/identifier/coverage-id", value: "part-a-99999999999" },
        {
          type: { coding: [{ system: v20203, code: "MB", display: "Member Number" }] },
          system: "https://bluebutton.cms.gov/resources/variables/bene_id",
          value: "1S00E00AA00",
        },
      ],
      subscriberId: "SUB-1",
    }
    expect(memberId(coverage)).toBe("1S00E00AA00")
  })

  it("falls back to subscriberId when no identifier is typed MB", () => {
    const coverage = {
      resourceType: "Coverage",
      identifier: [{ system: "urn:oid:2.16.840.1.113883.3.1234", value: "POLICY-42" }],
      subscriberId: "W123456789",
    }
    expect(memberId(coverage)).toBe("W123456789")
  })

  it("falls back to the first current identifier when there is neither", () => {
    const coverage = {
      identifier: [
        { use: "old", value: "RETIRED-1" },
        { system: "urn:payer:member", value: "M-77" },
      ],
    }
    expect(memberId(coverage)).toBe("M-77")
  })

  it("skips a retired MB identifier and ignores blank values", () => {
    const coverage = {
      identifier: [
        { use: "old", type: { coding: [{ system: v20203, code: "MB" }] }, value: "OLD-MB" },
        { type: { coding: [{ system: v20203, code: "MB" }] }, value: "  " },
      ],
      subscriberId: "SUB-9",
    }
    expect(memberId(coverage)).toBe("SUB-9")
  })

  it("is undefined for a Coverage that carries no id at all", () => {
    expect(memberId({})).toBeUndefined()
    expect(memberId({ identifier: [], subscriberId: "" })).toBeUndefined()
  })
})

describe("parseFhirReference", () => {
  it("reads relative and absolute references", () => {
    expect(parseFhirReference("Patient/123")).toEqual({ resourceType: "Patient", id: "123" })
    expect(parseFhirReference("https://fhir.example.org/r4/Practitioner/abc-1.2")).toEqual({ resourceType: "Practitioner", id: "abc-1.2" })
  })

  it("drops a version suffix, surrounding whitespace and trailing slashes", () => {
    expect(parseFhirReference("Observation/o1/_history/3")).toEqual({ resourceType: "Observation", id: "o1" })
    expect(parseFhirReference(" https://fhir.example.org/Person/p9/ ")).toEqual({ resourceType: "Person", id: "p9" })
  })

  it("is null for anything that is not a literal reference", () => {
    for (const value of [undefined, "", "123", "#contained", "patient/1", "Patient/", "Patient/a b", `Patient/${"x".repeat(65)}`, "urn:uuid:1234"]) {
      expect(parseFhirReference(value)).toBeNull()
    }
  })
})

describe("referenceId", () => {
  it("is the id only when the reference names the given type", () => {
    expect(referenceId("Patient/1", "Patient")).toBe("1")
    expect(referenceId("Practitioner/1", "Patient")).toBeNull()
    expect(referenceId(undefined, "Patient")).toBeNull()
  })
})

describe("isPractitionerReference", () => {
  it("is true for a Practitioner or PractitionerRole, relative or absolute", () => {
    expect(isPractitionerReference("Practitioner/45")).toBe(true)
    expect(isPractitionerReference("https://fhir.example.org/Practitioner/45")).toBe(true)
    expect(isPractitionerReference("PractitionerRole/r1")).toBe(true)
  })

  it("is false for patients, people and missing claims", () => {
    expect(isPractitionerReference("Patient/1")).toBe(false)
    expect(isPractitionerReference("https://fhir.example.org/Person/1")).toBe(false)
    expect(isPractitionerReference(undefined)).toBe(false)
  })
})
