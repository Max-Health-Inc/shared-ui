import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { silentSignIn } from "./silent-sign-in"

const store = new Map<string, string>()
const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage")

beforeEach(() => {
  store.clear()
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v) },
      removeItem: (k: string) => { store.delete(k) },
    },
  })
})

afterEach(() => {
  if (original) Object.defineProperty(globalThis, "sessionStorage", original)
  else Reflect.deleteProperty(globalThis, "sessionStorage")
})

describe("silentSignIn", () => {
  it("allows one attempt per session", () => {
    const silent = silentSignIn("k")
    expect(silent.claim()).toBe(true)
    expect(silent.claim()).toBe(false)
    expect(silent.attempted()).toBe(true)
  })

  it("stays signed out after a sign-out, and re-arms once a session is live", () => {
    const silent = silentSignIn("k")
    silent.suppress()
    expect(silent.claim()).toBe(false)
    silent.rearm()
    expect(silent.claim()).toBe(true)
  })

  it("never attempts without session storage", () => {
    Reflect.deleteProperty(globalThis, "sessionStorage")
    expect(silentSignIn("k").claim()).toBe(false)
  })
})
