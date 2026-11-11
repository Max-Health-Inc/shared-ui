export interface FhirHumanName {
  use?: string
  text?: string
  family?: string
  given?: string[]
  prefix?: string[]
  suffix?: string[]
  period?: { start?: string; end?: string }
}

function part(values: readonly string[] | undefined): string {
  return values?.map((value) => value.trim()).filter((value) => value !== "").join(" ") ?? ""
}

/** One HumanName as display text: its `text` (FHIR's display form), else prefix + given + family + suffix. */
export function humanNameText(name: FhirHumanName | undefined): string | undefined {
  if (!name) return undefined
  const text = name.text?.trim()
  if (text) return text
  const composed = [part(name.prefix), part(name.given), name.family?.trim() ?? "", part(name.suffix)]
    .filter((segment) => segment !== "")
    .join(" ")
  return composed === "" ? undefined : composed
}

/** The display name of a list: the `official` entry, else the first. Undefined when it has nothing to show. */
export function formatHumanNames(names: readonly FhirHumanName[] | undefined): string | undefined {
  if (!names?.length) return undefined
  return humanNameText(names.find((name) => name.use === "official") ?? names[0])
}

/** UI label for a list of names: {@link formatHumanNames}, or "Unknown". */
export function formatHumanName(names?: readonly FhirHumanName[]): string {
  return formatHumanNames(names) ?? "Unknown"
}

function displayText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed === "" ? undefined : trimmed
}

function firstAmongCodings(concept: unknown, read: (coding: object) => unknown): string | undefined {
  if (typeof concept !== "object" || concept === null || !("coding" in concept) || !Array.isArray(concept.coding)) return undefined
  const codings: readonly unknown[] = concept.coding
  for (const coding of codings) {
    const value = typeof coding === "object" && coding !== null ? displayText(read(coding)) : undefined
    if (value) return value
  }
  return undefined
}

/** A CodeableConcept's name: the `text` a person gave it, else the first display among its codings. */
export function conceptName(concept: unknown): string | undefined {
  const text = typeof concept === "object" && concept !== null && "text" in concept ? displayText(concept.text) : undefined
  return text ?? firstAmongCodings(concept, (coding) => ("display" in coding ? coding.display : undefined))
}

/** {@link conceptName}, else the first bare code among its codings. */
export function conceptLabel(concept: unknown): string | undefined {
  return conceptName(concept) ?? firstAmongCodings(concept, (coding) => ("code" in coding ? coding.code : undefined))
}

export interface FhirIdentifier {
  use?: string
  type?: { coding?: { system?: string; code?: string }[]; text?: string }
  system?: string
  value?: string
}

const IDENTIFIER_TYPE_SYSTEM = "http://terminology.hl7.org/CodeSystem/v2-0203"

const isCurrent = (identifier: FhirIdentifier): boolean => identifier.use !== "old"

const typedAs = (code: string) => (identifier: FhirIdentifier): boolean =>
  isCurrent(identifier)
    && (identifier.type?.coding?.some((coding) => coding.system === IDENTIFIER_TYPE_SYSTEM && coding.code === code) ?? false)

/** The current identifier typed MR (v2-0203). Undefined when there is none, so no other identifier is shown as an MRN. */
export function medicalRecordNumber(identifiers: readonly FhirIdentifier[] | undefined): string | undefined {
  return displayText(identifiers?.find(typedAs("MR"))?.value)
}

export interface FhirCoverageIds {
  identifier?: readonly FhirIdentifier[]
  subscriberId?: string
}

/** A Coverage's member id: the current identifier typed MB (v2-0203), else subscriberId, else the first current identifier. */
export function memberId(coverage: FhirCoverageIds): string | undefined {
  const identifiers = coverage.identifier ?? []
  return displayText(identifiers.find(typedAs("MB"))?.value)
    ?? displayText(coverage.subscriberId)
    ?? displayText(identifiers.find(isCurrent)?.value)
}
