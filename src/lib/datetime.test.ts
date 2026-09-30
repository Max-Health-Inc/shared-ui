import { afterEach, describe, expect, it } from "bun:test"
import { formatDate, formatDateTime, formatMonth, formatRelativeTime, formatTime } from "./datetime"
import { setUiLanguage } from "./ui-text"

afterEach(() => setUiLanguage(undefined))

describe("formatDate", () => {
  it.each([undefined, null, "", "   ", "not-a-date", "June 7 2026", "2026-13-40x"])("returns '' for %p", (value) => {
    expect(formatDate(value)).toBe("")
  })

  it("keeps the precision of a partial FHIR date", () => {
    expect(formatDate("2026-06-07")).toBe("Jun 7, 2026")
    expect(formatDate("2026-06")).toBe("Jun 2026")
    expect(formatDate("2026")).toBe("2026")
    expect(formatDate("  2026-06-07  ")).toBe("Jun 7, 2026")
  })

  it("never shifts a date-only value, whatever the time zone", () => {
    expect(formatDate("2026-06-07", { timeZone: "Pacific/Honolulu" })).toBe("Jun 7, 2026")
    expect(formatDate("2026-06-07", { timeZone: "Pacific/Kiritimati" })).toBe("Jun 7, 2026")
  })

  it("shows the day an instant falls on in the requested time zone", () => {
    expect(formatDate("2026-06-07T23:30:00Z", { timeZone: "UTC" })).toBe("Jun 7, 2026")
    expect(formatDate("2026-06-07T23:30:00Z", { timeZone: "Europe/Vienna" })).toBe("Jun 8, 2026")
  })

  it("formats Date and epoch inputs and rejects an invalid Date", () => {
    expect(formatDate(new Date(2026, 5, 7))).toBe("Jun 7, 2026")
    expect(formatDate(Date.UTC(2026, 5, 7, 12), { timeZone: "UTC" })).toBe("Jun 7, 2026")
    expect(formatDate(new Date(Number.NaN))).toBe("")
  })

  it("follows the active UI language", () => {
    setUiLanguage("de")
    expect(formatDate("2026-09-24")).toBe(new Intl.DateTimeFormat("de", { day: "numeric", month: "short", year: "numeric" }).format(new Date(2026, 8, 24)))
    expect(formatDate("2026-09-24")).not.toBe("Sep 24, 2026")
  })
})

describe("formatDateTime", () => {
  const instant = "2026-09-24T08:55:00Z"

  it("renders an instant in the requested zone and names the zone", () => {
    expect(formatDateTime(instant, { timeZone: "UTC" })).toBe("Sep 24, 2026, 8:55 AM UTC")
    expect(formatDateTime(instant, { timeZone: "Europe/Vienna" })).toContain("10:55")
  })

  it("respects the source offset of a FHIR dateTime", () => {
    expect(formatDateTime("2026-09-24T10:55:00+02:00", { timeZone: "UTC" })).toBe("Sep 24, 2026, 8:55 AM UTC")
  })

  it("can leave the zone name out", () => {
    expect(formatDateTime(instant, { timeZone: "UTC", showTimeZone: false })).toBe("Sep 24, 2026, 8:55 AM")
  })

  it("uses the UI language's own date and time conventions", () => {
    setUiLanguage("de")
    const text = formatDateTime(instant, { timeZone: "Europe/Vienna" })
    expect(text).toContain("10:55")
    expect(text).not.toContain("AM")
    expect(text).toContain("MESZ")
  })

  it("falls back to a calendar date for a value without a time", () => {
    expect(formatDateTime("2026-09-24")).toBe("Sep 24, 2026")
  })
})

describe("formatMonth and formatTime", () => {
  it("formats a month heading", () => {
    expect(formatMonth("2026-06-07")).toBe("June 2026")
    expect(formatMonth("2026")).toBe("2026")
  })

  it("formats a time only for an instant", () => {
    expect(formatTime("2026-09-24T08:55:00Z", { timeZone: "UTC" })).toBe("8:55 AM")
    expect(formatTime("2026-09-24")).toBe("")
  })
})

describe("formatRelativeTime", () => {
  const now = Date.UTC(2026, 8, 24, 12)

  it("picks the largest whole unit", () => {
    expect(formatRelativeTime(new Date(now - 3 * 24 * 3600 * 1000), now)).toBe("3 days ago")
    expect(formatRelativeTime(new Date(now + 2 * 3600 * 1000), now)).toBe("in 2 hours")
    expect(formatRelativeTime(new Date(now), now)).toBe("now")
  })

  it("speaks the UI language", () => {
    setUiLanguage("de")
    expect(formatRelativeTime(new Date(now - 3 * 24 * 3600 * 1000), now)).toBe("vor 3 Tagen")
  })
})
