import { describe, expect, it } from "bun:test"
import {
  DATA_VERIFICATION_TAG_SYSTEM,
  ORIGINAL_SNAPSHOT_EXT,
  VERIFICATION_STATUS_SYSTEM,
  buildProvenance,
  describeVerification,
  getSnapshot,
  hasSnapshot,
  isResourceVerified,
  markAsConfirmed,
  markAsProvisional,
  parseFhirUser,
  setVerificationLevel,
  stampAuthorship,
  type VerifiableResource,
} from "./fhir-verification"

describe("parseFhirUser", () => {
  it("classifies relative and absolute references", () => {
    expect(parseFhirUser("Patient/123")).toEqual({ role: "patient", id: "123", reference: "Patient/123" })
    expect(parseFhirUser("https://fhir.example.com/fhir/Practitioner/45")).toEqual({
      role: "practitioner", id: "45", reference: "Practitioner/45",
    })
    expect(parseFhirUser("RelatedPerson/9").role).toBe("related-person")
    expect(parseFhirUser("PractitionerRole/7").role).toBe("practitioner")
  })

  it("returns unknown for missing or unrecognized input", () => {
    expect(parseFhirUser(undefined).role).toBe("unknown")
    expect(parseFhirUser("bogus").role).toBe("unknown")
    expect(parseFhirUser("Device/x").role).toBe("unknown")
  })
})

describe("stampAuthorship", () => {
  it("marks patient-authored Condition provisional on both element and tag", () => {
    const r: VerifiableResource = { resourceType: "Condition" }
    const out = stampAuthorship(r, { role: "patient", authorReference: "Patient/1" })
    expect(out.verificationStatus?.coding?.[0]).toMatchObject({ system: VERIFICATION_STATUS_SYSTEM, code: "provisional" })
    expect(out.meta?.tag?.find((t) => t.system === DATA_VERIFICATION_TAG_SYSTEM)?.code).toBe("provisional")
    expect(out.asserter?.reference).toBe("Patient/1")
    expect(out.recorder?.reference).toBe("Patient/1")
    expect(isResourceVerified(out)).toBe(false)
  })

  it("marks practitioner-authored Observation confirmed via tag (no native element)", () => {
    const r: VerifiableResource = { resourceType: "Observation" }
    const out = stampAuthorship(r, { role: "practitioner", authorReference: "Practitioner/9" })
    expect(out.verificationStatus).toBeUndefined()
    expect(out.meta?.tag?.find((t) => t.system === DATA_VERIFICATION_TAG_SYSTEM)?.code).toBe("confirmed")
    expect(out.asserter).toBeUndefined()
    expect(out.recorder?.reference).toBe("Practitioner/9")
    expect(isResourceVerified(out)).toBe(true)
  })

  it("does not mutate the input", () => {
    const r: VerifiableResource = { resourceType: "Condition" }
    stampAuthorship(r, { role: "patient" })
    expect(r.verificationStatus).toBeUndefined()
    expect(r.meta).toBeUndefined()
  })
})

describe("edit → provisional → approve", () => {
  it("snapshots on downgrade and reverts cleanly on approve", () => {
    const original: VerifiableResource = setVerificationLevel({ resourceType: "Condition", id: "c1" }, "confirmed")
    const edited: VerifiableResource = { ...structuredClone(original), code: { text: "changed" } }

    const provisional = markAsProvisional(edited, original)
    expect(provisional.verificationStatus?.coding?.[0]?.code).toBe("provisional")
    expect(hasSnapshot(provisional)).toBe(true)
    expect(getSnapshot(provisional)?.code).toBeUndefined()

    // A second patient edit must not overwrite the first snapshot.
    const provisional2 = markAsProvisional({ ...provisional, code: { text: "again" } }, provisional)
    expect(provisional2.extension?.filter((e) => e.url === ORIGINAL_SNAPSHOT_EXT).length).toBe(1)

    const confirmed = markAsConfirmed(provisional2)
    expect(confirmed.verificationStatus?.coding?.[0]?.code).toBe("confirmed")
    expect(hasSnapshot(confirmed)).toBe(false)
    expect(confirmed.extension).toBeUndefined()
    expect(describeVerification(confirmed).verified).toBe(true)
  })
})

describe("buildProvenance", () => {
  it("records patient informant with a deterministic timestamp", () => {
    const p = buildProvenance({
      targets: ["Observation/1", "Condition/2"],
      author: "Patient/123",
      level: "provisional",
      when: "2026-07-10T00:00:00Z",
      assemblerDevice: "Device/aihr-assistant",
    })
    expect(p.resourceType).toBe("Provenance")
    expect(p.recorded).toBe("2026-07-10T00:00:00Z")
    expect(p.target).toEqual([{ reference: "Observation/1" }, { reference: "Condition/2" }])
    const agents = p.agent
    if (!Array.isArray(agents)) throw new Error("agent should be an array")
    expect(agents).toHaveLength(2)
  })
})

/**
 * Generated FHIR types (fhir-ips, @types/fhir) are interfaces, and TypeScript gives an
 * interface no implicit index signature. VerifiableResource used to declare one, so every
 * such type was rejected and callers widened through `any` to get past it — which is how
 * patient-portal ended up with `PortalFhirResource & Record<string, any>`.
 *
 * These interfaces stand in for a generated one: declared fields, no index signature. If
 * an index signature comes back, this file stops compiling.
 */
interface GeneratedCondition {
  resourceType: "Condition"
  id?: string
  subject?: { reference?: string }
  code?: { coding?: { system?: string; code?: string; display?: string }[]; text?: string }
  verificationStatus?: { coding?: { system?: string; code?: string; display?: string }[]; text?: string }
  extension?: { url: string; valueString?: string }[]
  meta?: { tag?: { system?: string; code?: string; display?: string }[]; lastUpdated?: string }
  onsetDateTime?: string
}

describe("VerifiableResource accepts generated FHIR types", () => {
  const condition: GeneratedCondition = {
    resourceType: "Condition",
    id: "c1",
    code: { text: "Asthma" },
  }

  it("reads a resource that declares no index signature", () => {
    expect(isResourceVerified(condition)).toBe(false)
    expect(describeVerification(condition).verified).toBe(false)
    expect(hasSnapshot(condition)).toBe(false)
  })

  /** The generic returns the caller's type, so no downstream cast is needed either. */
  it("returns the caller's own type from the write helpers", () => {
    const confirmed: GeneratedCondition = markAsConfirmed(condition)
    expect(confirmed.resourceType).toBe("Condition")
    expect(isResourceVerified(confirmed)).toBe(true)

    const provisional: GeneratedCondition = markAsProvisional(confirmed, condition)
    expect(isResourceVerified(provisional)).toBe(false)
    expect(hasSnapshot(provisional)).toBe(true)
    expect(getSnapshot(provisional)?.id).toBe("c1")
  })

  it("stamps authorship without losing the type", () => {
    const stamped: GeneratedCondition = stampAuthorship(condition, {
      role: "practitioner",
      authorReference: "Practitioner/45",
    })
    expect(stamped.resourceType).toBe("Condition")
    expect(isResourceVerified(stamped)).toBe(true)
  })
})
