import * as React from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CHART_COLORS } from "../lib/chart-colors"
import { parseBucketTime, type TimeBucket } from "./fill"
import { CHART_TOOLTIP_STYLE } from "./styles"

export interface ChartSeries {
  dataKey: string
  name: string
  /** Defaults to the series' slot in CHART_COLORS. */
  color?: string
  dashed?: boolean
}

export interface TimeSeriesChartProps {
  /** Rows oldest first, each with an `at` timestamp; see fillTimeSeries for gap-free time. */
  data: readonly { at: string }[]
  series: readonly ChartSeries[]
  bucket: TimeBucket
  variant?: "area" | "line" | "bar"
  stacked?: boolean
  height?: number
  formatValue?: (value: number) => string
  locale?: string
}

function timeLabel(at: unknown, bucket: TimeBucket, locale: string | undefined, long: boolean): string {
  if (typeof at !== "string") return ""
  const ms = parseBucketTime(at)
  if (!Number.isFinite(ms)) return at
  const options: Intl.DateTimeFormatOptions = bucket === "hour"
    ? (long ? { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" } : { hour: "2-digit", minute: "2-digit" })
    : (long ? { weekday: "short", year: "numeric", month: "short", day: "numeric" } : { month: "short", day: "numeric" })
  return new Intl.DateTimeFormat(locale, options).format(ms)
}

/** A time series with a time axis, hover tooltips and a legend that hides or shows each series on click. */
export function TimeSeriesChart({ data, series, bucket, variant = "area", stacked = false, height = 260, formatValue, locale }: TimeSeriesChartProps) {
  const [hidden, setHidden] = React.useState<ReadonlySet<string>>(() => new Set())
  const toggle = (key: unknown) => {
    if (typeof key !== "string") return
    setHidden((current) => {
      const next = new Set(current)
      if (!next.delete(key)) next.add(key)
      return next
    })
  }
  const colored = series.map((s, i) => ({ ...s, color: s.color ?? CHART_COLORS[i % CHART_COLORS.length] }))
  const rows = [...data]
  const stackId = stacked ? "stack" : undefined

  const chrome = [
    <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke="var(--border)" />,
    <XAxis key="x" dataKey="at" tickFormatter={(at) => timeLabel(at, bucket, locale, false)} minTickGap={24} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />,
    <YAxis key="y" allowDecimals={false} width={44} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={formatValue} />,
    <Tooltip
      key="tooltip"
      contentStyle={CHART_TOOLTIP_STYLE}
      labelFormatter={(at) => timeLabel(at, bucket, locale, true)}
      formatter={formatValue ? (value) => (typeof value === "number" ? formatValue(value) : String(value ?? "")) : undefined}
    />,
    <Legend key="legend" onClick={(entry) => { toggle(entry.dataKey) }} wrapperStyle={{ cursor: "pointer", fontSize: 12 }} />,
  ]

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {variant === "bar" ? (
          <BarChart data={rows}>
            {chrome}
            {colored.map((s) => (
              <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={s.color} stackId={stackId} hide={hidden.has(s.dataKey)} />
            ))}
          </BarChart>
        ) : variant === "line" ? (
          <LineChart data={rows}>
            {chrome}
            {colored.map((s) => (
              <Line key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={s.color} strokeWidth={2} dot={false}
                activeDot={{ r: 4 }} strokeDasharray={s.dashed ? "5 5" : undefined} hide={hidden.has(s.dataKey)} />
            ))}
          </LineChart>
        ) : (
          <AreaChart data={rows}>
            {chrome}
            {colored.map((s) => (
              <Area key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={s.color} fill={s.color} fillOpacity={0.15}
                strokeWidth={2} stackId={stackId} strokeDasharray={s.dashed ? "5 5" : undefined} hide={hidden.has(s.dataKey)} />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
