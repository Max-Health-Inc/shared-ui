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
