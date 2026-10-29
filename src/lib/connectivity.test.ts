import { describe, expect, it } from "bun:test"
import { connectivityOf } from "./connectivity"

function network(onLine: boolean) {
  const events = new EventTarget()
  const status = { onLine }
  return {
    connectivity: connectivityOf(status, events),
    reconnect: () => { status.onLine = true; events.dispatchEvent(new Event("online")) },
  }
}

describe("connectivityOf", () => {
  it("reads whether the browser is online", () => {
    expect(network(true).connectivity.isOnline()).toBe(true)
    expect(network(false).connectivity.isOnline()).toBe(false)
  })

  it("resolves at once while online", async () => {
    await network(true).connectivity.whenOnline()
  })

  it("waits for the connection to come back", async () => {
    const net = network(false)
    let back = false
    const waiting = net.connectivity.whenOnline().then(() => { back = true })
    await Promise.resolve()
    expect(back).toBe(false)
    net.reconnect()
    await waiting
    expect(back).toBe(true)
  })

  it("stops waiting when the caller gives up", async () => {
    const controller = new AbortController()
    const waiting = network(false).connectivity.whenOnline(controller.signal)
    controller.abort()
    await waiting
  })

  it("treats a runtime without a navigator as online", () => {
    expect(connectivityOf(undefined, undefined).isOnline()).toBe(true)
  })
})
