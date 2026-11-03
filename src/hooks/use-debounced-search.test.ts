import { describe, expect, it } from "bun:test"
import { createLatestSearch, type SearchOutcome } from "./use-debounced-search"

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined
  let reject: (reason: unknown) => void = () => undefined
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe("createLatestSearch", () => {
  it("drops an earlier answer that arrives after a newer one", async () => {
    const pending = new Map<string, ReturnType<typeof deferred<string[]>>>()
    const signals = new Map<string, AbortSignal>()
    const reports: SearchOutcome<string>[] = []
    const search = (q: string, signal: AbortSignal) => {
      const d = deferred<string[]>()
      pending.set(q, d)
      signals.set(q, signal)
      return d.promise
    }
    const runner = createLatestSearch<string>((o) => reports.push(o))

    const slow = runner.run(search, "jo")
    const fast = runner.run(search, "john")
    pending.get("john")?.resolve(["John Smith"])
    await fast
    pending.get("jo")?.resolve(["Joan", "John Smith"])
    await slow

    expect(reports).toEqual([{ results: ["John Smith"], error: undefined }])
    expect(signals.get("jo")?.aborted).toBe(true)
  })

  it("reports the latest failure with no results", async () => {
    const reports: SearchOutcome<string>[] = []
    const failure = new Error("503")
    const runner = createLatestSearch<string>((o) => reports.push(o))
    await runner.run(() => Promise.reject(failure), "x")
    expect(reports).toEqual([{ results: [], error: failure }])
  })

  it("reports nothing once cancelled", async () => {
    const d = deferred<string[]>()
    const reports: SearchOutcome<string>[] = []
    const runner = createLatestSearch<string>((o) => reports.push(o))
    const run = runner.run(() => d.promise, "x")
    runner.cancel()
    d.resolve(["x"])
    await run
    expect(reports).toEqual([])
  })
})
