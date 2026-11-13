import { describe, expect, it } from "bun:test"
import { fillTimeSeries, parseBucketTime } from "./fill"

const empty = (at: string) => ({ at, count: 0 })

describe("fillTimeSeries", () => {
  it("spans the whole window in hours, keeping recorded buckets and zero-filling the rest", () => {
    const rows = [{ at: "2026-11-13 09:00:00", count: 4 }, { at: "2026-11-13T11:00:00Z", count: 2 }]
    const filled = fillTimeSeries(rows, { from: Date.parse("2026-11-13T08:30:00Z"), to: Date.parse("2026-11-13T12:10:00Z"), bucket: "hour", empty })
    expect(filled.map((row) => row.count)).toEqual([0, 4, 0, 2, 0])
    expect(filled[0]?.at).toBe("2026-11-13T08:00:00.000Z")
  })

  it("buckets days from a date-only key", () => {
    const filled = fillTimeSeries([{ at: "2026-11-12", count: 7 }], { from: Date.parse("2026-11-10T05:00:00Z"), to: Date.parse("2026-11-12T23:00:00Z"), bucket: "day", empty })
    expect(filled.map((row) => row.count)).toEqual([0, 0, 7])
  })

  it("reads zone-less timestamps as UTC and refuses garbage", () => {
    expect(parseBucketTime("2026-11-13 09:00:00")).toBe(Date.parse("2026-11-13T09:00:00Z"))
    expect(parseBucketTime("2026-11-13")).toBe(Date.parse("2026-11-13T00:00:00Z"))
    expect(Number.isNaN(parseBucketTime("yesterday"))).toBe(true)
  })
})
