interface HumanName {
  use?: string
  text?: string
  family?: string
  given?: string[]
  prefix?: string[]
  suffix?: string[]
  period?: { start?: string; end?: string }
}

/** Get the display name from a FHIR HumanName array */
export function formatHumanName(name?: HumanName[]): string {
  const n = name?.[0]
  if (!n) return "Unknown"
  const parts: string[] = []
  if (n.prefix?.length) parts.push(n.prefix.join(" "))
  if (n.given?.length) parts.push(n.given.join(" "))
  if (n.family) parts.push(n.family)
  const joined = parts.join(" ").trim()
  if (joined !== "") return joined
  const text = n.text?.trim()
  if (text != null && text !== "") return text
  return "Unknown"
}

// Fixed locale so output stays stable regardless of the user's environment.
const FHIR_DATE_LOCALE = "en-US"

/**
 * Format a FHIR date/dateTime (or a `Date`) as a medium English string.
 *
 * - `Date` → "Jun 7, 2026"
 * - `YYYY-MM-DD` (optionally with a time component) → "Jun 7, 2026"
 * - `YYYY-MM` → "Jun 2026"
 * - `YYYY` → "2026"
 *
 * Date-only FHIR strings are parsed into a LOCAL date from their parts, rather
 * than via `new Date(value)`, because `new Date("2026-06-07")` is interpreted as
 * UTC midnight and can render the previous day in negative-offset timezones.
 *
 * Returns "" for undefined/null, empty, or unparseable input.
 */
export function formatFhirDate(value?: string | Date): string {
  if (value == null) return ""

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ""
    return value.toLocaleDateString(FHIR_DATE_LOCALE, { month: "short", day: "numeric", year: "numeric" })
  }

  const trimmed = value.trim()
  if (trimmed === "") return ""

  // Parse the leading YYYY[-MM[-DD]] explicitly so date-only values render in
  // the local timezone (any trailing time/offset is ignored for the date label).
  // Optional capture groups are absent at runtime even though TS types them as
  // `string`, so read them off a `string | undefined` view of the match array.
  const match: (string | undefined)[] | null =
    /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/.exec(trimmed)
  if (!match) return ""

  const [, yearStr, monthStr, dayStr] = match
  if (yearStr === undefined) return ""

  const year = Number(yearStr)
  const month = monthStr === undefined ? undefined : Number(monthStr)
  const day = dayStr === undefined ? undefined : Number(dayStr)

  if (month !== undefined && day !== undefined) {
    const date = new Date(year, month - 1, day)
    if (Number.isNaN(date.getTime())) return ""
    return date.toLocaleDateString(FHIR_DATE_LOCALE, { month: "short", day: "numeric", year: "numeric" })
  }

  if (month !== undefined) {
    const date = new Date(year, month - 1, 1)
    if (Number.isNaN(date.getTime())) return ""
    return date.toLocaleDateString(FHIR_DATE_LOCALE, { month: "short", year: "numeric" })
  }

  const date = new Date(year, 0, 1)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString(FHIR_DATE_LOCALE, { year: "numeric" })
}
