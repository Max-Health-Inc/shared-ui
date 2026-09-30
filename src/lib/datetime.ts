import { getUiLanguage } from "./ui-text"

export type DateInput = string | number | Date | null | undefined

export interface DateFormatOptions {
  month?: "short" | "long"
  timeZone?: string
}

export interface DateTimeFormatOptions extends DateFormatOptions {
  showTimeZone?: boolean
}

type Precision = "year" | "month" | "day" | "instant"

interface ParsedDate {
  date: Date
  precision: Precision
}

const FALLBACK_LOCALE = "en-US"
const CALENDAR_DATE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/

export function displayLocale(): string {
  return getUiLanguage() ?? FALLBACK_LOCALE
}

function validDate(date: Date): Date | null {
  return Number.isNaN(date.getTime()) ? null : date
}

function parse(value: DateInput): ParsedDate | null {
  if (value == null) return null
  if (value instanceof Date || typeof value === "number") {
    const date = validDate(new Date(value))
    return date && { date, precision: "instant" }
  }
  const trimmed = value.trim()
  if (trimmed === "") return null

  const calendar: (string | undefined)[] | null = CALENDAR_DATE.exec(trimmed)
  if (calendar) {
    const [, year, month, day] = calendar
    const date = validDate(new Date(Number(year), month === undefined ? 0 : Number(month) - 1, day === undefined ? 1 : Number(day)))
    if (!date) return null
    return { date, precision: day !== undefined ? "day" : month !== undefined ? "month" : "year" }
  }

  if (!/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return null
  const date = validDate(new Date(trimmed))
  return date && { date, precision: "instant" }
}

function format(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(displayLocale(), options).format(date)
}

function calendarOptions(precision: Precision, month: "short" | "long"): Intl.DateTimeFormatOptions {
  if (precision === "year") return { year: "numeric" }
  if (precision === "month") return { month, year: "numeric" }
  return { day: "numeric", month, year: "numeric" }
}

export function formatDate(value: DateInput, options: DateFormatOptions = {}): string {
  const parsed = parse(value)
  if (!parsed) return ""
  const zone = parsed.precision === "instant" ? { timeZone: options.timeZone } : {}
  return format(parsed.date, { ...calendarOptions(parsed.precision, options.month ?? "short"), ...zone })
}

export function formatMonth(value: DateInput, options: DateFormatOptions = {}): string {
  const parsed = parse(value)
  if (!parsed) return ""
  const zone = parsed.precision === "instant" ? { timeZone: options.timeZone } : {}
  return format(parsed.date, { ...calendarOptions(parsed.precision === "year" ? "year" : "month", options.month ?? "long"), ...zone })
}

export function formatDateTime(value: DateInput, options: DateTimeFormatOptions = {}): string {
  const parsed = parse(value)
  if (!parsed) return ""
  if (parsed.precision !== "instant") return formatDate(value, options)
  return format(parsed.date, {
    ...calendarOptions("day", options.month ?? "short"),
    hour: "numeric",
    minute: "2-digit",
    timeZone: options.timeZone,
    ...(options.showTimeZone === false ? {} : { timeZoneName: "short" }),
  })
}

export function formatTime(value: DateInput, options: DateTimeFormatOptions = {}): string {
  const parsed = parse(value)
  if (parsed?.precision !== "instant") return ""
  return format(parsed.date, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: options.timeZone,
    ...(options.showTimeZone ? { timeZoneName: "short" } : {}),
  })
}

const RELATIVE_UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
]

export function formatRelativeTime(value: DateInput, now: number = Date.now()): string {
  const parsed = parse(value)
  if (!parsed) return ""
  const seconds = (parsed.date.getTime() - now) / 1000
  const [unit, size] = RELATIVE_UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? ["second", 1]
  return new Intl.RelativeTimeFormat(displayLocale(), { numeric: "auto" }).format(Math.round(seconds / size), unit)
}
