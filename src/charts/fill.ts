export type TimeBucket = "hour" | "day"

const BUCKET_MS: Record<TimeBucket, number> = { hour: 3_600_000, day: 86_400_000 }

/** Epoch ms of an ISO timestamp or a zone-less `YYYY-MM-DD[ HH:MM:SS]` read as UTC; NaN when unreadable. */
export function parseBucketTime(value: string): number {
  const iso = value.includes("T") ? value : value.replace(" ", "T")
  const zoned = /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso.length === 10 ? `${iso}T00:00:00` : iso}Z`
  return Date.parse(zoned)
}

function bucketStart(ms: number, bucket: TimeBucket): number {
  return Math.floor(ms / BUCKET_MS[bucket]) * BUCKET_MS[bucket]
}

/**
 * Every bucket from `from` to `to`, oldest first, with `empty` standing in for buckets the rows lack,
 * so a chart's x axis is time and a quiet hour shows as zero instead of vanishing.
 */
export function fillTimeSeries<T extends { at: string }>(
  rows: readonly T[],
  options: { from: Date | number; to: Date | number; bucket: TimeBucket; empty: (at: string) => T },
): T[] {
  const byBucket = new Map<number, T>()
  for (const row of rows) {
    const ms = parseBucketTime(row.at)
    if (Number.isFinite(ms)) byBucket.set(bucketStart(ms, options.bucket), row)
  }
  const step = BUCKET_MS[options.bucket]
  const last = bucketStart(Number(options.to), options.bucket)
  const filled: T[] = []
  for (let at = bucketStart(Number(options.from), options.bucket); at <= last; at += step) {
    filled.push(byBucket.get(at) ?? options.empty(new Date(at).toISOString()))
  }
  return filled
}
