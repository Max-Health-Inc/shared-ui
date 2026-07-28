/**
 * Shared chart colour palette for all dashboard components.
 *
 * Every hue comes from the `brandc` contract, so charts rebrand with the rest of the
 * UI instead of holding a second, private palette. `--chart-1…7` is a CATEGORICAL
 * ramp (brandc >= 0.4.0) — distinct hues for series that have no order, which is what
 * dashboards plot. For an ordered measure, build a sequential scale from one hue
 * rather than reaching for these.
 *
 * Slot 0 stays `--primary`: the first series is the brand's own colour, and the rest
 * fan out around it.
 *
 * These were seven hardcoded Tailwind hex literals until the contract grew a
 * categorical ramp. The token values are the exact oklch of those hexes, so this is a
 * byte-identical swap — see max-network/brandc#12.
 */
export const CHART_COLORS = [
  'var(--primary)',
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
] as const
