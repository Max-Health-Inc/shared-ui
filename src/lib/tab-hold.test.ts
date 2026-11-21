import { afterEach, beforeEach, describe, expect, it, jest } from "bun:test"
import { createTabHold } from "./tab-hold"

interface Sample {
  id: string
  items: string[]
}

const isSample = (json: unknown): json is Sample =>
  typeof json === "object" && json !== null && "id" in json && typeof json.id === "string" && "items" in json && Array.isArray(json.items)

const KEY = "tab-hold-test"
const WINDOW = 5 * 60_000
const NOW = Date.UTC(2026, 10, 21, 12)
const SAMPLE: Sample = { id: "sample-1", items: ["first-entry", "second-entry"] }

class MemoryStorage implements Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  readonly items = new Map<string, string>()
  refuse = false
  getItem(key: string) {
    return this.items.get(key) ?? null
  }
  setItem(key: string, value: string) {
    if (this.refuse) throw new DOMException("quota", "QuotaExceededError")
    this.items.set(key, value)
  }
  removeItem(key: string) {
    this.items.delete(key)
  }
}

let storage: MemoryStorage
let original: PropertyDescriptor | undefined
const held = createTabHold<Sample>({ key: KEY, retentionMs: WINDOW, parse: (json) => (isSample(json) ? json : null) })

beforeEach(() => {
  storage = new MemoryStorage()
  original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage")
  Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true, writable: true })
})

afterEach(() => {
  held.forget()
  if (original) Object.defineProperty(globalThis, "sessionStorage", original)
  else Reflect.deleteProperty(globalThis, "sessionStorage")
  jest.useRealTimers()
})

describe("createTabHold", () => {
  it("returns the value intact, compressed in session storage, until the window ends", async () => {
    const expiresAt = await held.hold(SAMPLE, { now: NOW })

    expect(expiresAt).toBe(NOW + WINDOW)
    expect(held.expiresAt()).toBe(expiresAt)
    expect([...storage.items.values()].join("")).not.toContain("first-entry")
    expect(await held.read(NOW + WINDOW - 1)).toEqual({ value: SAMPLE, expiresAt })
  })

  it("reads as gone once the window ends, and removes it", async () => {
    await held.hold(SAMPLE, { now: NOW })

    expect(await held.read(NOW + WINDOW)).toBeNull()
    expect(storage.items.size).toBe(0)
  })

  it("keeps a given expiry when a value is replaced", async () => {
    const expiresAt = await held.hold(SAMPLE, { now: NOW })

    await held.hold({ ...SAMPLE, items: [...SAMPLE.items, "third-entry"] }, { expiresAt })

    expect(await held.read(NOW + 1)).toEqual({ value: { id: "sample-1", items: ["first-entry", "second-entry", "third-entry"] }, expiresAt })
  })

  it("removes the value at once on forget", async () => {
    await held.hold(SAMPLE, { now: NOW })

    held.forget()

    expect(storage.items.size).toBe(0)
    expect(await held.read(NOW)).toBeNull()
  })

  it("drops a hold that was still compressing when forget ran", async () => {
    const pending = held.hold(SAMPLE, { now: NOW })
    held.forget()
    await pending

    expect(storage.items.size).toBe(0)
    expect(await held.read(NOW)).toBeNull()
  })

  it("keeps the value for the page when the tab refuses storage", async () => {
    storage.refuse = true

    await held.hold(SAMPLE, { now: NOW })

    expect(storage.items.size).toBe(0)
    expect(await held.read(NOW)).toMatchObject({ value: { id: "sample-1" } })
  })

  it("drops what is stored when it is not gzip", async () => {
    storage.items.set(KEY, JSON.stringify({ expiresAt: NOW + WINDOW, data: btoa("not gzip") }))

    expect(await held.read(NOW)).toBeNull()
    expect(storage.items.size).toBe(0)
  })

  it("drops what is stored when parse rejects it", async () => {
    const strict = createTabHold<Sample>({ key: KEY, retentionMs: WINDOW, parse: () => null })
    await held.hold(SAMPLE, { now: NOW })

    expect(await strict.read(NOW)).toBeNull()
    expect(storage.items.size).toBe(0)
  })

  it("forgets the value when its expiry timer fires", async () => {
    await held.hold(SAMPLE, { now: NOW })
    jest.useFakeTimers()
    const expired = jest.fn()

    held.forgetOnExpiry(expired, NOW)
    jest.advanceTimersByTime(WINDOW)

    expect(expired).toHaveBeenCalledTimes(1)
    expect(storage.items.size).toBe(0)
  })

  it("does nothing on expiry when nothing is held, and the cancel stops the timer", async () => {
    expect(held.forgetOnExpiry(() => undefined, NOW)()).toBeUndefined()
    await held.hold(SAMPLE, { now: NOW })
    jest.useFakeTimers()
    const expired = jest.fn()

    held.forgetOnExpiry(expired, NOW)()
    jest.advanceTimersByTime(WINDOW)

    expect(expired).not.toHaveBeenCalled()
    expect(storage.items.size).toBe(1)
  })
})
