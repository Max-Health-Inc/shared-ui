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
